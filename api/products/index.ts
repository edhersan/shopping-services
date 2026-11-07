import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  ensureMethod,
  firstQueryValue,
  sendError,
  sendSuccess,
} from "../../src/lib/http";
import { listProducts } from "../../src/services/productsService";
import type { Product } from "../../src/types";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (!ensureMethod(req, res, ["GET"])) {
    return;
  }

  try {
    const products: Product[] = listProducts({
      search: firstQueryValue(req.query.search),
      category: firstQueryValue(req.query.category),
    });

    sendSuccess<Product[]>(res, products);
  } catch (error) {
    sendError(res, error);
  }
}
