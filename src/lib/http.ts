import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ApiError } from "./errors";
import type { ApiResponse } from "../types";

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "*";

function applyCommonHeaders(res: VercelResponse): void {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
}

export function sendJson<T>(res: VercelResponse, status: number, payload: ApiResponse<T>): void {
  applyCommonHeaders(res);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(status).json(payload);
}

export function sendSuccess<T>(res: VercelResponse, data: T, status = 200): void {
  sendJson<T>(res, status, { success: true, data });
}

export function sendRawJson<T>(res: VercelResponse, status: number, payload: T): void {
  applyCommonHeaders(res);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(status).json(payload);
}

export function sendError(res: VercelResponse, error: unknown): void {
  if (error instanceof ApiError) {
    const payload: ApiResponse<never> = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    };
    sendJson<never>(res, error.status, payload);
    return;
  }

  console.error("Unexpected error:", error);
  sendJson<never>(res, 500, {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Ocurrió un error inesperado en el servicio.",
    },
  });
}

export function handleOptions(res: VercelResponse): void {
  applyCommonHeaders(res);
  res.status(204).end();
}

export function ensureMethod(
  req: VercelRequest,
  res: VercelResponse,
  allowed: readonly string[],
): boolean {
  if (req.method === "OPTIONS") {
    handleOptions(res);
    return false;
  }

  if (!req.method || !allowed.includes(req.method)) {
    res.setHeader("Allow", allowed.join(", "));
    sendError(
      res,
      new ApiError(
        405,
        "METHOD_NOT_ALLOWED",
        `Método ${req.method ?? "desconocido"} no permitido. Usa: ${allowed.join(", ")}.`,
      ),
    );
    return false;
  }

  return true;
}

export function readJsonBody(req: VercelRequest): unknown {
  const body: unknown = req.body;

  if (body === undefined || body === null || body === "") {
    return undefined;
  }

  if (typeof body === "string") {
    try {
      return JSON.parse(body) as unknown;
    } catch {
      throw new ApiError(400, "INVALID_JSON", "El cuerpo de la solicitud no es JSON válido.");
    }
  }

  return body;
}

export function firstQueryValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
