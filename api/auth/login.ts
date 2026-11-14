import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  ensureMethod,
  readJsonBody,
  sendError,
  sendSuccess,
} from "../../src/lib/http";
import {
  signToken,
  verifyPassword,
} from "../../src/lib/auth";
import { validateAuthCredentials } from "../../src/lib/validation";
import { findUserByEmail, publicUser } from "../../src/store/users";
import type { AuthResponse } from "../../src/types";
import { ApiError } from "../../src/lib/errors";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (!ensureMethod(req, res, ["POST"])) {
    return;
  }

  try {
    const credentials = validateAuthCredentials(readJsonBody(req));
    const user = findUserByEmail(credentials.email);

    if (!user || !verifyPassword(credentials.password, user.passwordHash)) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "El correo o la contraseña son incorrectos.");
    }

    const response: AuthResponse = {
      token: signToken(user.id),
      user: publicUser(user),
    };
    sendSuccess<AuthResponse>(res, response);
  } catch (error) {
    sendError(res, error);
  }
}
