import type { CharacterSummary } from "@/components/dashboard/types";

/** Risposta GET /characters/me quando il personaggio esiste. */
export type CharacterMeFound = CharacterSummary & {
  found: true;
  isOnboarded: boolean;
};

export type CharacterMeResponse =
  | { found: false; isOnboarded: boolean }
  | CharacterMeFound;

export function isCharacterMeFound(data: unknown): data is CharacterMeFound {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as CharacterMeResponse).found === true
  );
}

export function characterMeToSummary(data: CharacterMeFound): CharacterSummary {
  const { found: _f, isOnboarded: _o, ...rest } = data;
  return rest;
}
