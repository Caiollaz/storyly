import { describe, expect, it } from "vitest";
import { assertCanUseGenre, GatingError } from "@/lib/entitlements";
import { translations } from "@/lib/i18n/translations";

describe("assertCanUseGenre", () => {
  it("allows the basic predefined genres for free users (both languages)", () => {
    expect(() =>
      assertCanUseGenre(translations.en.predefined_fantasy, false),
    ).not.toThrow();
    expect(() =>
      assertCanUseGenre(translations.pt.predefined_horror, false),
    ).not.toThrow();
    expect(() =>
      assertCanUseGenre(translations.en.predefined_expedition, false),
    ).not.toThrow();
  });

  it("blocks romance (premium) genres for free users", () => {
    expect(() =>
      assertCanUseGenre(translations.en.predefined_romance_comedy, false),
    ).toThrow(GatingError);
    expect(() =>
      assertCanUseGenre(translations.pt.predefined_romance_forbidden, false),
    ).toThrow(GatingError);
  });

  it("blocks custom (typed) genres for free users", () => {
    expect(() => assertCanUseGenre("Pirata Espacial", false)).toThrow(
      GatingError,
    );
  });

  it("allows any genre for Pro users", () => {
    expect(() => assertCanUseGenre("Pirata Espacial", true)).not.toThrow();
    expect(() =>
      assertCanUseGenre(translations.en.predefined_romance_historical, true),
    ).not.toThrow();
  });

  it("tags the error with the PREMIUM_GENRE code and 402 status", () => {
    try {
      assertCanUseGenre("anything custom", false);
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(GatingError);
      expect((err as GatingError).code).toBe("PREMIUM_GENRE");
      expect((err as GatingError).status).toBe(402);
    }
  });
});
