import { randomUUID } from "node:crypto";
import type { PublicUser, StoredUser } from "../types";

const usersByEmail = new Map<string, StoredUser>();
const usersById = new Map<string, StoredUser>();

function toPublicUser(user: StoredUser): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

export function findUserByEmail(email: string): StoredUser | undefined {
  return usersByEmail.get(email.toLowerCase());
}

export function findUserByIdentifier(identifier: string): StoredUser | undefined {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const byEmail = usersByEmail.get(normalizedIdentifier);

  if (byEmail) {
    return byEmail;
  }

  for (const user of usersById.values()) {
    if (user.name.toLowerCase() === normalizedIdentifier) {
      return user;
    }
  }

  return undefined;
}

export function findUserById(id: string): StoredUser | undefined {
  return usersById.get(id);
}

export function createUser(
  name: string,
  email: string,
  passwordHash: string,
): PublicUser {
  const normalizedEmail = email.toLowerCase();
  const user: StoredUser = {
    id: `usr_${randomUUID().replace(/-/g, "")}`,
    name,
    email: normalizedEmail,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  usersByEmail.set(normalizedEmail, user);
  usersById.set(user.id, user);
  return toPublicUser(user);
}

export function publicUser(user: StoredUser): PublicUser {
  return toPublicUser(user);
}
