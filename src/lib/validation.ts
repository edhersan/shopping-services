import { ApiError } from "./errors";
import type {
  AuthCredentials,
  CreateOrderRequest,
  Customer,
  OrderLineInput,
  PaymentRequest,
  RegisterUserRequest,
} from "../types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_PATTERN = /^[0-9A-Za-z -]{3,10}$/;
const EXPIRY_PATTERN = /^(0[1-9]|1[0-2])\/(\d{2})$/;
const CARD_DIGITS_PATTERN = /^\d{13,19}$/;
const CVV_PATTERN = /^\d{3,4}$/;
const MAX_QUANTITY_PER_ITEM = 99;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(
  record: Record<string, unknown>,
  key: string,
  label: string,
  minLength: number,
  errors: string[],
): string | undefined {
  const value = record[key];

  if (typeof value !== "string" || value.trim().length < minLength) {
    errors.push(`${label} debe tener al menos ${minLength} caracteres.`);
    return undefined;
  }

  return value.trim();
}

function parseItems(value: unknown, errors: string[]): OrderLineInput[] | undefined {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push("El carrito debe incluir al menos un producto.");
    return undefined;
  }

  const parsed: OrderLineInput[] = [];

  value.forEach((entry: unknown, index: number) => {
    if (!isRecord(entry)) {
      errors.push(`El artículo #${index + 1} es inválido.`);
      return;
    }

    const productId =
      typeof entry.productId === "string" ? entry.productId.trim() : "";
    const quantity = typeof entry.quantity === "number" ? entry.quantity : Number.NaN;
    const isValidQuantity =
      Number.isInteger(quantity) && quantity >= 1 && quantity <= MAX_QUANTITY_PER_ITEM;

    if (productId.length === 0) {
      errors.push(`El artículo #${index + 1} no incluye un productId válido.`);
    }

    if (!isValidQuantity) {
      errors.push(
        `La cantidad del artículo #${index + 1} debe ser un entero entre 1 y ${MAX_QUANTITY_PER_ITEM}.`,
      );
    }

    if (productId.length > 0 && isValidQuantity) {
      parsed.push({ productId, quantity });
    }
  });

  return parsed.length > 0 ? parsed : undefined;
}

function parseCustomer(value: unknown, errors: string[]): Customer | undefined {
  if (!isRecord(value)) {
    errors.push("Los datos del cliente son obligatorios.");
    return undefined;
  }

  const fullName = stringField(value, "fullName", "El nombre completo", 3, errors);
  const email = stringField(value, "email", "El correo electrónico", 5, errors);
  const address = stringField(value, "address", "La dirección", 5, errors);
  const city = stringField(value, "city", "La ciudad", 2, errors);
  const zipCode = stringField(value, "zipCode", "El código postal", 3, errors);

  if (email !== undefined && !EMAIL_PATTERN.test(email)) {
    errors.push("El correo electrónico no es válido.");
  }

  if (zipCode !== undefined && !ZIP_PATTERN.test(zipCode)) {
    errors.push("El código postal no es válido.");
  }

  if (!fullName || !email || !address || !city || !zipCode) {
    return undefined;
  }

  return { fullName, email, address, city, zipCode };
}

function parsePayment(value: unknown, errors: string[]): PaymentRequest | undefined {
  if (!isRecord(value)) {
    errors.push("Los datos de pago son obligatorios.");
    return undefined;
  }

  const rawCard = stringField(value, "cardNumber", "El número de tarjeta", 13, errors);
  const holderName = stringField(value, "holderName", "El titular de la tarjeta", 3, errors);
  const expiry = stringField(value, "expiry", "El vencimiento", 5, errors);
  const cvv = stringField(value, "cvv", "El CVV", 3, errors);
  const cardNumber = rawCard?.replace(/[\s-]/g, "");

  if (cardNumber !== undefined && !CARD_DIGITS_PATTERN.test(cardNumber)) {
    errors.push("El número de tarjeta debe contener entre 13 y 19 dígitos.");
  }

  if (cvv !== undefined && !CVV_PATTERN.test(cvv)) {
    errors.push("El CVV debe contener 3 o 4 dígitos.");
  }

  const expiryMatch = expiry === undefined ? null : EXPIRY_PATTERN.exec(expiry);

  if (expiry !== undefined && expiryMatch === null) {
    errors.push("El vencimiento debe tener el formato MM/AA.");
  }

  if (expiryMatch !== null) {
    const monthRaw = expiryMatch[1];
    const yearRaw = expiryMatch[2];

    if (monthRaw !== undefined && yearRaw !== undefined) {
      const now = new Date();
      const expiryYear = 2000 + Number(yearRaw);
      const expiryMonth = Number(monthRaw);
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
        errors.push("La tarjeta está vencida.");
      }
    }
  }

  if (!cardNumber || !holderName || !expiry || !cvv) {
    return undefined;
  }

  return { cardNumber, holderName, expiry, cvv };
}

export function validateCartRequest(body: unknown): OrderLineInput[] {
  if (!isRecord(body)) {
    throw new ApiError(400, "VALIDATION_ERROR", "El cuerpo de la solicitud es inválido.");
  }

  const errors: string[] = [];
  const items = parseItems(body.items, errors);

  if (!items || errors.length > 0) {
    throw new ApiError(400, "VALIDATION_ERROR", "Revisa los artículos del carrito.", errors);
  }

  return items;
}

export function validateCreateOrderRequest(body: unknown): CreateOrderRequest {
  if (!isRecord(body)) {
    throw new ApiError(400, "VALIDATION_ERROR", "El cuerpo de la solicitud es inválido.");
  }

  const errors: string[] = [];
  const items = parseItems(body.items, errors);
  const customer = parseCustomer(body.customer, errors);
  const payment = parsePayment(body.payment, errors);

  if (!items || !customer || !payment || errors.length > 0) {
    throw new ApiError(400, "VALIDATION_ERROR", "Revisa los datos enviados.", errors);
  }

  return { items, customer, payment };
}

function validateEmail(value: unknown, errors: string[]): string | undefined {
  if (typeof value !== "string" || !EMAIL_PATTERN.test(value.trim())) {
    errors.push("El correo electrónico no es válido.");
    return undefined;
  }

  return value.trim().toLowerCase();
}

function validatePassword(value: unknown, errors: string[]): string | undefined {
  if (typeof value !== "string" || value.length < 8) {
    errors.push("La contraseña debe tener al menos 8 caracteres.");
    return undefined;
  }

  return value;
}

export function validateAuthCredentials(body: unknown): AuthCredentials {
  if (!isRecord(body)) {
    throw new ApiError(400, "VALIDATION_ERROR", "El cuerpo de la solicitud es inválido.");
  }

  const errors: string[] = [];
  const rawIdentifier = body.identifier ?? body.username ?? body.user ?? body.email;
  const identifier =
    typeof rawIdentifier === "string" && rawIdentifier.trim().length > 0
      ? rawIdentifier.trim()
      : undefined;

  if (!identifier) {
    errors.push("El usuario o correo electrónico es obligatorio.");
  }

  const password = validatePassword(body.password, errors);

  if (!identifier || !password || errors.length > 0) {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "Revisa el usuario/correo y la contraseña enviados.",
      errors,
    );
  }

  return { identifier, password };
}

export function validateRegisterUserRequest(body: unknown): RegisterUserRequest {
  if (!isRecord(body)) {
    throw new ApiError(400, "VALIDATION_ERROR", "El cuerpo de la solicitud es inválido.");
  }

  const errors: string[] = [];
  const name = stringField(body, "name", "El nombre", 3, errors);
  const email = validateEmail(body.email, errors);
  const password = validatePassword(body.password, errors);

  if (!name || !email || !password || errors.length > 0) {
    throw new ApiError(400, "VALIDATION_ERROR", "Revisa los datos de registro.", errors);
  }

  return { name, email, password };
}
