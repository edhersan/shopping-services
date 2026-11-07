import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  ensureMethod,
  readJsonBody,
  sendError,
  sendSuccess,
} from "../../src/lib/http";
import { validateCartRequest } from "../../src/lib/validation";
import { buildPricing } from "../../src/services/pricingService";
import type { PricingSummary } from "../../src/types";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (!ensureMethod(req, res, ["POST"])) {
    return;
  }

  try {
    const body = readJsonBody(req);
    const items = validateCartRequest(body);
    const pricing: PricingSummary = buildPricing(items);

    sendSuccess<PricingSummary>(res, pricing);
  } catch (error) {
    sendError(res, error);
  }
}
