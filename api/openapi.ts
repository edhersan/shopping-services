import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureMethod, sendRawJson } from "../src/lib/http";
import { openApiDocument } from "../src/docs/openapi";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (!ensureMethod(req, res, ["GET"])) {
    return;
  }

  sendRawJson(res, 200, openApiDocument);
}
