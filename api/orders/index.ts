import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  ensureMethod,
  readJsonBody,
  sendError,
  sendSuccess,
} from "../../src/lib/http";
import { validateCreateOrderRequest } from "../../src/lib/validation";
import { createOrder } from "../../src/services/ordersService";
import type { Order } from "../../src/types";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (!ensureMethod(req, res, ["POST"])) {
    return;
  }

  try {
    const body = readJsonBody(req);
    const request = validateCreateOrderRequest(body);
    const order: Order = createOrder(request);

    sendSuccess<Order>(res, order, 201);
  } catch (error) {
    sendError(res, error);
  }
}
