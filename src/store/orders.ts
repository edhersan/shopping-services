import type { Order } from "../types";

const orders = new Map<string, Order>();

export function saveOrder(order: Order): Order {
  orders.set(order.id, order);
  return order;
}

export function findOrderById(id: string): Order | undefined {
  return orders.get(id);
}
