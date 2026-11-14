import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  ensureMethod,
  readJsonBody,
  sendError,
  sendSuccess,
} from "../../src/lib/http";
import { hashPassword, signToken } from "../../src/lib/auth";
import { validateRegisterUserRequest } from "../../src/lib/validation";
import { createUser, findUserByEmail } from "../../src/store/users";
import type { AuthResponse } from "../../src/types";
import { ApiError } from "../../src/lib/errors";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (!ensureMethod(req, res, ["POST"])) {
    return;
  }

  try {
    const request = validateRegisterUserRequest(readJsonBody(req));

    if (findUserByEmail(request.email)) {
      throw new ApiError(409, "EMAIL_ALREADY_EXISTS", "El correo electrónico ya está registrado.");
    }

    const user = createUser(request.name, request.email, hashPassword(request.password));
    const response: AuthResponse = {
      token: signToken(user.id),
      user,
    };
    sendSuccess<AuthResponse>(res, response, 201);
  } catch (error) {
    sendError(res, error);
  }
}
