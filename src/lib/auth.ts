import {
  createHmac,
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type { VercelRequest } from "@vercel/node";
import { ApiError } from "./errors";
import { findUserById, seedDefaultUsers } from "../store/users";
import type { PublicUser, StoredUser } from "../types";

const PASSWORD_ITERATIONS = 120_000;
const PASSWORD_KEY_LENGTH = 32;
const PASSWORD_DIGEST = "sha512";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new ApiError(
      500,
      "AUTH_CONFIGURATION_ERROR",
      "JWT_SECRET debe estar configurado y tener al menos 32 caracteres.",
    );
  }

  return secret;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("base64url");
  const hash = pbkdf2Sync(
    password,
    salt,
    PASSWORD_ITERATIONS,
    PASSWORD_KEY_LENGTH,
    PASSWORD_DIGEST,
  ).toString("base64url");

  return `pbkdf2-${PASSWORD_DIGEST}$${PASSWORD_ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [algorithm, iterationsRaw, salt, hash] = storedHash.split("$");

  if (
    algorithm !== `pbkdf2-${PASSWORD_DIGEST}` ||
    !iterationsRaw ||
    !salt ||
    !hash
  ) {
    return false;
  }

  const expected = Buffer.from(hash, "base64url");
  const actual = pbkdf2Sync(
    password,
    salt,
    Number(iterationsRaw),
    expected.length,
    PASSWORD_DIGEST,
  );

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function signToken(userId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({ sub: userId, iat: now, exp: now + TOKEN_TTL_SECONDS }),
  );
  const unsignedToken = `${header}.${payload}`;
  const signature = createHmac("sha256", getJwtSecret())
    .update(unsignedToken)
    .digest("base64url");

  return `${unsignedToken}.${signature}`;
}

function parseToken(token: string): JwtPayload {
  const parts = token.split(".");

  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    throw new ApiError(401, "INVALID_TOKEN", "El token de autenticación no es válido.");
  }

  const unsignedToken = `${parts[0]}.${parts[1]}`;
  const expectedSignature = createHmac("sha256", getJwtSecret())
    .update(unsignedToken)
    .digest();
  const providedSignature = Buffer.from(parts[2], "base64url");

  if (
    expectedSignature.length !== providedSignature.length ||
    !timingSafeEqual(expectedSignature, providedSignature)
  ) {
    throw new ApiError(401, "INVALID_TOKEN", "El token de autenticación no es válido.");
  }

  try {
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")) as {
      alg?: string;
      typ?: string;
    };
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    ) as Partial<JwtPayload>;

    if (
      header.alg !== "HS256" ||
      header.typ !== "JWT" ||
      typeof payload.sub !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      throw new Error("Invalid JWT payload");
    }

    return payload as JwtPayload;
  } catch {
    throw new ApiError(401, "INVALID_TOKEN", "El token de autenticación no es válido.");
  }
}

export function getBearerToken(req: VercelRequest): string {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw new ApiError(
      401,
      "AUTHENTICATION_REQUIRED",
      "Debes enviar un token Bearer en el header Authorization.",
    );
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    throw new ApiError(401, "INVALID_TOKEN", "El token de autenticación no es válido.");
  }

  return token;
}

export function authenticateRequest(req: VercelRequest): StoredUser {
  const payload = parseToken(getBearerToken(req));
  const user = findUserById(payload.sub);

  if (!user) {
    throw new ApiError(401, "INVALID_TOKEN", "El usuario del token ya no existe.");
  }

  return user;
}

export function userFromToken(req: VercelRequest): PublicUser {
  const { passwordHash: _passwordHash, ...user } = authenticateRequest(req);
  return user;
}

seedDefaultUsers([
  {
    username: "expo",
    name: "Expo",
    email: "expo@example.com",
    passwordHash: hashPassword("1234"),
    role: "customer",
  },
  {
    username: "admin",
    name: "Administrador",
    email: "admin@example.com",
    passwordHash: hashPassword("admin123"),
    role: "admin",
  },
]);
