import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import healthHandler from "../../api/health";
import productByIdHandler from "../../api/products/[id]";
import productsHandler from "../../api/products/index";
import validateCartHandler from "../../api/cart/validate";
import orderByIdHandler from "../../api/orders/[id]";
import ordersHandler from "../../api/orders/index";
import { ApiError } from "../lib/errors";
import { handleOptions, sendError } from "../lib/http";

type Handler = (req: VercelRequest, res: VercelResponse) => void | Promise<void>;

interface RouteDefinition {
  method: "GET" | "POST";
  pattern: RegExp;
  handler: Handler;
  paramName?: string;
}

interface LocalVercelResponse {
  status(code: number): LocalVercelResponse;
  setHeader(
    name: string,
    value: number | string | readonly string[],
  ): LocalVercelResponse;
  json(payload: unknown): LocalVercelResponse;
  end(chunk?: string): LocalVercelResponse;
}

const routes: readonly RouteDefinition[] = [
  { method: "GET", pattern: /^\/api\/health\/?$/, handler: healthHandler },
  { method: "GET", pattern: /^\/api\/products\/?$/, handler: productsHandler },
  {
    method: "GET",
    pattern: /^\/api\/products\/([^/]+)\/?$/,
    handler: productByIdHandler,
    paramName: "id",
  },
  {
    method: "POST",
    pattern: /^\/api\/cart\/validate\/?$/,
    handler: validateCartHandler,
  },
  { method: "POST", pattern: /^\/api\/orders\/?$/, handler: ordersHandler },
  {
    method: "GET",
    pattern: /^\/api\/orders\/([^/]+)\/?$/,
    handler: orderByIdHandler,
    paramName: "id",
  },
];

function createRequest(
  req: IncomingMessage,
  url: URL,
  body: unknown,
): VercelRequest {
  const query: Record<string, string | string[]> = {};

  for (const key of url.searchParams.keys()) {
    const values = url.searchParams.getAll(key);
    query[key] = values.length > 1 ? values : values[0] ?? "";
  }

  return {
    method: req.method,
    url: req.url,
    headers: req.headers,
    query,
    body,
    cookies: {},
  } as unknown as VercelRequest;
}

function createResponse(res: ServerResponse): VercelResponse {
  let currentStatus = 200;
  const headers = new Map<string, string>();

  const writeHead = (): void => {
    res.writeHead(currentStatus, Object.fromEntries(headers));
  };

  const api: LocalVercelResponse = {
    status(code: number) {
      currentStatus = code;
      return api;
    },
    setHeader(name: string, value: number | string | readonly string[]) {
      headers.set(name.toLowerCase(), Array.isArray(value) ? value.join(", ") : String(value));
      return api;
    },
    json(payload: unknown) {
      headers.set("content-type", "application/json; charset=utf-8");
      writeHead();
      res.end(JSON.stringify(payload));
      return api;
    },
    end(chunk?: string) {
      writeHead();
      res.end(chunk);
      return api;
    },
  };

  return api as unknown as VercelResponse;
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    const value: unknown = chunk;

    if (typeof value === "string") {
      chunks.push(Buffer.from(value));
    } else if (value instanceof Buffer) {
      chunks.push(value);
    }
  }

  if (chunks.length === 0) {
    return undefined;
  }

  const raw = Buffer.concat(chunks).toString("utf8");

  if (raw.trim().length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const method = req.method ?? "GET";
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const response = createResponse(res);

  try {
    if (method === "OPTIONS") {
      handleOptions(response);
      return;
    }

    const pathMatches = routes.filter((route) => route.pattern.test(url.pathname));

    if (pathMatches.length === 0) {
      throw new ApiError(404, "NOT_FOUND", `No existe la ruta ${url.pathname}.`);
    }

    const route = pathMatches.find((candidate) => candidate.method === method);

    if (!route) {
      throw new ApiError(
        405,
        "METHOD_NOT_ALLOWED",
        `El método ${method} no está permitido para ${url.pathname}.`,
      );
    }

    const body = method === "POST" ? await readBody(req) : undefined;
    const request = createRequest(req, url, body);
    const match = route.pattern.exec(url.pathname);

    if (route.paramName !== undefined) {
      const paramValue = match?.[1];

      if (paramValue !== undefined) {
        request.query[route.paramName] = decodeURIComponent(paramValue);
      }
    }

    await route.handler(request, response);
  } catch (error) {
    sendError(response, error);
  }
}

const parsedPort = Number(process.env.PORT ?? "3000");
const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3000;

const server = createServer((req, res) => {
  void handleRequest(req, res);
});

server.listen(port, () => {
  console.log(`API local disponible en http://localhost:${port}/api`);
  console.log("Rutas: GET /api/health, GET /api/products, GET /api/products/:id");
  console.log("       POST /api/cart/validate, POST /api/orders, GET /api/orders/:id");
});
