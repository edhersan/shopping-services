import { PRODUCTS } from "../data/products";
import { ApiError } from "../lib/errors";
import type { Product } from "../types";

export const CATEGORIES: readonly string[] = [
  "electronics",
  "clothing",
  "home",
  "sports",
];

export interface ProductFilters {
  search?: string;
  category?: string;
}

export function listProducts(filters: ProductFilters = {}): Product[] {
  const search = filters.search?.trim().toLowerCase() ?? "";
  const category = filters.category?.trim().toLowerCase() ?? "";

  return PRODUCTS.filter((product) => {
    const haystack = `${product.name} ${product.description}`.toLowerCase();
    const matchesSearch = search.length === 0 || haystack.includes(search);
    const matchesCategory =
      category.length === 0 || category === "all" || product.category === category;

    return matchesSearch && matchesCategory;
  });
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === id);
}

export function requireProduct(id: string): Product {
  const product = getProductById(id);

  if (!product) {
    throw new ApiError(404, "PRODUCT_NOT_FOUND", `El producto ${id} no existe.`);
  }

  return product;
}

export function decrementStock(productId: string, quantity: number): void {
  const product = requireProduct(productId);

  if (product.stock < quantity) {
    throw new ApiError(
      409,
      "INSUFFICIENT_STOCK",
      `Stock insuficiente para ${product.name}.`,
      [`Disponible: ${product.stock}, solicitado: ${quantity}.`],
    );
  }

  product.stock -= quantity;
}
