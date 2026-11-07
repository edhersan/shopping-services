import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ApiError } from "../../src/lib/errors";
import {
  ensureMethod,
  firstQueryValue,
  sendError,
  sendSuccess,
} from "../../src/lib/http";
import { requireProduct } from "../../src/services/productsService";
import type { Product } from "../../src/types";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (!ensureMethod(req, res, ["GET"])) {
    return;
  }

  try {
    const id = firstQueryValue(req.query.id);

    if (!id) {
      throw new ApiError(400, "MISSING_PRODUCT_ID", "Debes indicar el identificador del producto.");
    }

    const product: Product = requireProduct(id);
    sendSuccess<Product>(res, product);
  } catch (error) {
    sendError(res, error);
  }
}
