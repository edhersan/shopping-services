import { randomUUID } from "node:crypto";
import { ApiError } from "../lib/errors";
import { saveOrder } from "../store/orders";
import { buildPricing } from "./pricingService";
import { decrementStock } from "./productsService";
import type { CreateOrderRequest, Order, PaymentSummary } from "../types";

const DECLINED_CARD_SUFFIX = "0000";

function detectBrand(cardNumber: string): string {
  if (cardNumber.startsWith("4")) {
    return "Visa";
  }

  if (/^5[1-5]/.test(cardNumber)) {
    return "Mastercard";
  }

  if (/^3[47]/.test(cardNumber)) {
    return "American Express";
  }

  return "Tarjeta";
}

export function createOrder(request: CreateOrderRequest): Order {
  const pricing = buildPricing(request.items);
  const cardNumber = request.payment.cardNumber;
  const approved = !cardNumber.endsWith(DECLINED_CARD_SUFFIX);
  const last4 = cardNumber.slice(-4);
  const payment: PaymentSummary = {
    brand: detectBrand(cardNumber),
    last4,
    approved,
  };

  const order: Order = {
    id: `ord_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
    customer: request.customer,
    items: pricing.items,
    subtotal: pricing.subtotal,
    tax: pricing.tax,
    shipping: pricing.shipping,
    total: pricing.total,
    currency: pricing.currency,
    status: approved ? "paid" : "declined",
    payment,
    createdAt: new Date().toISOString(),
  };

  saveOrder(order);

  if (!approved) {
    throw new ApiError(
      402,
      "PAYMENT_DECLINED",
      "El pago simulado fue rechazado.",
      [
        `La tarjeta terminada en ${last4} fue rechazada porque termina en 0000.`,
        "Prueba con otro número de tarjeta para completar la compra.",
      ],
    );
  }

  for (const item of pricing.items) {
    decrementStock(item.productId, item.quantity);
  }

  return order;
}
