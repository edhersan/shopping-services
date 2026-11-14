import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../../src/lib/auth";
import { ensureMethod, sendError, sendSuccess } from "../../src/lib/http";
import { publicUser } from "../../src/store/users";
import type { PublicUser } from "../../src/types";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (!ensureMethod(req, res, ["GET"])) {
    return;
  }

  try {
    const user: PublicUser = publicUser(authenticateRequest(req));
    sendSuccess<PublicUser>(res, user);
  } catch (error) {
    sendError(res, error);
  }
}
