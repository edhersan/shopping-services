import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureMethod, sendSuccess } from "../src/lib/http";
import type { HealthPayload } from "../src/types";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (!ensureMethod(req, res, ["GET"])) {
    return;
  }

  const payload: HealthPayload = {
    status: "ok",
    service: "shopping-services",
    timestamp: new Date().toISOString(),
  };

  sendSuccess<HealthPayload>(res, payload);
}
