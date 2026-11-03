import User from "@/models/User";

export function normalizeUserEmail(email: unknown): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class AmbiguousUserEmailError extends Error {
  constructor() {
    super("Multiple accounts match this email address.");
    this.name = "AmbiguousUserEmailError";
  }
}

export async function findUserEmailMatches(email: unknown) {
  const normalizedEmail = normalizeUserEmail(email);
  if (!normalizedEmail) return [];

  return User.find({
    email: { $regex: `^\\s*${escapeRegex(normalizedEmail)}\\s*$`, $options: "i" },
  }).limit(2);
}

export async function findSingleUserByEmail(email: unknown) {
  const matches = await findUserEmailMatches(email);
  if (matches.length > 1) throw new AmbiguousUserEmailError();
  return matches[0] ?? null;
}
