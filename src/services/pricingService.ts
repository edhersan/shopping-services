import { ApiError } from "../lib/errors";
import { getProductById } from "./productsService";
import type {
  CurrencyCode,
  OrderLineInput,
  PricedCartItem,
  PricingSummary,
} from "../types";

export const CURRENCY: CurrencyCode = "USD";
export const TAX_RATE = 0.08;
export const SHIPPING_FEE = 5.99;
export const FREE_SHIPPING_THRESHOLD = 100;

const roundCurrency = (value: number): number => Math.round(value * 100) / 100;

export function buildPricing(lines: readonly OrderLineInput[]): PricingSummary {
  const quantities = new Map<string, number>();

  for (const line of lines) {
    quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity);
  }

  const items: PricedCartItem[] = [];

  for (const [productId, quantity] of quantities) {
    const product = getProductById(productId);

    if (!product) {
      throw new ApiError(404, "PRODUCT_NOT_FOUND", `El producto ${productId} no existe.`);
    }

    if (product.stock < quantity) {
      throw new ApiError(
        409,
        "INSUFFICIENT_STOCK",
        `Stock insuficiente para ${product.name}.`,
        [`Disponible: ${product.stock}, solicitado: ${quantity}.`],
      );
    }

    items.push({
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      unitPrice: product.price,
      quantity,
      lineTotal: roundCurrency(product.price * quantity),
    });
  }

  const subtotal = roundCurrency(
    items.reduce((accumulator, item) => accumulator + item.lineTotal, 0),
  );
  const tax = roundCurrency(subtotal * TAX_RATE);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = roundCurrency(subtotal + tax + shipping);

  return { items, subtotal, tax, shipping, total, currency: CURRENCY };
}
