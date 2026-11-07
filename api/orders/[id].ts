import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ApiError } from "../../src/lib/errors";
import {
  ensureMethod,
  firstQueryValue,
  sendError,
  sendSuccess,
} from "../../src/lib/http";
import { findOrderById } from "../../src/store/orders";
import type { Order } from "../../src/types";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (!ensureMethod(req, res, ["GET"])) {
    return;
  }

  try {
    const id = firstQueryValue(req.query.id);

    if (!id) {
      throw new ApiError(400, "MISSING_ORDER_ID", "Debes indicar el identificador de la orden.");
    }

    const order = findOrderById(id);

    if (!order) {
      throw new ApiError(404, "ORDER_NOT_FOUND", `La orden ${id} no existe.`);
    }

    sendSuccess<Order>(res, order);
  } catch (error) {
    sendError(res, error);
  }
}
