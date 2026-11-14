import { randomUUID } from "node:crypto";
import type { PublicUser, StoredUser } from "../types";

const usersByEmail = new Map<string, StoredUser>();
const usersById = new Map<string, StoredUser>();
const usersByUsername = new Map<string, StoredUser>();

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

  const byUsername = usersByUsername.get(normalizedIdentifier);

  if (byUsername) {
    return byUsername;
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
  username = name,
  role: StoredUser["role"] = "customer",
): PublicUser {
  const normalizedEmail = email.toLowerCase();
  const normalizedUsername = username.trim().toLowerCase();
  const user: StoredUser = {
    id: `usr_${randomUUID().replace(/-/g, "")}`,
    username: normalizedUsername,
    name,
    email: normalizedEmail,
    role,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  usersByEmail.set(normalizedEmail, user);
  usersByUsername.set(normalizedUsername, user);
  usersById.set(user.id, user);
  return toPublicUser(user);
}

export function seedDefaultUsers(
  passwordHashes: readonly {
    username: string;
    name: string;
    email: string;
    passwordHash: string;
    role: StoredUser["role"];
  }[],
): void {
  for (const seed of passwordHashes) {
    if (!findUserByIdentifier(seed.username)) {
      createUser(seed.name, seed.email, seed.passwordHash, seed.username, seed.role);
    }
  }
}

export function publicUser(user: StoredUser): PublicUser {
  return toPublicUser(user);
}
