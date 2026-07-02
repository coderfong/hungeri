import type { UserRole } from "@/types/database";

/**
 * Fixed phone-number → role assignments for phone login.
 *
 * These specific numbers ALWAYS sign in as the given role; every other number
 * is an ordinary consumer. Because the role is applied at account-creation time
 * (the signup trigger reads it from user metadata) and a DB trigger forbids
 * later role changes, a number listed here must not have signed in before it was
 * added — see the login action, which creates these accounts with their role.
 *
 * Match is on the bare digit string; an optional Singapore "65" country code is
 * ignored so "94799717" and "6594799717" resolve the same.
 */
export const PHONE_ROLES: Record<string, Exclude<UserRole, "consumer">> = {
  "96584842": "admin",
  "94799717": "merchant",
};

export function roleForPhone(digits: string): UserRole {
  return PHONE_ROLES[digits] ?? PHONE_ROLES[digits.replace(/^65/, "")] ?? "consumer";
}
