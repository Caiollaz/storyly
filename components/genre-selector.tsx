"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "@/lib/i18n/language-context";
import type { SavedGameRecord } from "@/lib/types";

interface GenreSelectorProps {
  onGenreSelect: (genre: string) => void;
  isLoading: boolean;
  canUsePremiumGenres: boolean;
  onUpgrade: () => void;
  saves: SavedGameRecord[];
  onContinue: (save: SavedGameRecord) => void;
  onDeleteSave: (id: string) => void;
}

// Romance genres are Pro-only; the basic five are free.
const PREMIUM_GENRE_KEYS = new Set([
  "predefined_romance_contemporary",
  "predefined_romance_historical",
  "predefined_romance_comedy",
  "predefined_romance_forbidden",
]);

const GenreSelector: React.FC<GenreSelectorProps> = ({
  onGenreSelect,
  isLoading,
  canUsePremiumGenres,
  onUpgrade,
  saves,
  onContinue,
  onDeleteSave,
}) => {
  const { t } = useTranslations();
  const [customGenre, setCustomGenre] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const predefinedGenres = [
    { key: "predefined_fantasy", value: t("predefined_fantasy") },
    { key: "predefined_cyberpunk", value: t("predefined_cyberpunk") },
    { key: "predefined_horror", value: t("predefined_horror") },
    { key: "predefined_detective", value: t("predefined_detective") },
    { key: "predefined_expedition", value: t("predefined_expedition") },
    {
      key: "predefined_romance_contemporary",
      value: t("predefined_romance_contemporary"),
    },
    {
      key: "predefined_romance_historical",
      value: t("predefined_romance_historical"),
    },
    { key: "predefined_romance_comedy", value: t("predefined_romance_comedy") },
    {
      key: "predefined_romance_forbidden",
      value: t("predefined_romance_forbidden"),
    },
  ] as const;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGenre.trim()) return;
    if (!canUsePremiumGenres) {
      onUpgrade();
      return;
    }
    onGenreSelect(customGenre.trim());
  };

  return (
    <div className="w-full max-w-2xl mx-auto text-center p-8">
      <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-2 title-epic">
        {t("title")}
      </h1>
      <p className="text-lg text-[var(--text-secondary)] mb-8 body-text">
        {t("subtitle")}
      </p>

      {/* Saved adventures */}
      {saves.length > 0 && (
        <div className="mb-8 text-left">
          <h2 className="text-sm uppercase tracking-wide text-[var(--text-muted)] mb-3 body-text">
            {t("saved_games_title")}
          </h2>
          <ul className="space-y-2">
            {saves.map((save) => (
              <li
                key={save.id}
                className="flex items-center justify-between gap-2 p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg"
              >
                <span className="truncate body-text text-[var(--text-primary)]">
                  {save.genre}
                </span>
                <span className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onContinue(save)}
                    disabled={isLoading}
                    className="text-sm px-3 py-1 rounded-md bg-[var(--accent-color)] text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)] transition-colors body-text"
                  >
                    {t("continue_adventure")}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSave(save.id)}
                    className="text-sm px-3 py-1 rounded-md text-[var(--text-muted)] hover:text-[var(--error-text)] transition-colors body-text"
                  >
                    {t("delete_save")}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {predefinedGenres.map((genre) => {
          const locked =
            PREMIUM_GENRE_KEYS.has(genre.key) && !canUsePremiumGenres;
          return (
            <button
              type="button"
              key={genre.key}
              onClick={() =>
                locked ? onUpgrade() : onGenreSelect(genre.value)
              }
              disabled={isLoading}
              title={locked ? t("premium_genre_locked") : undefined}
              className={`p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--accent-hover)] hover:border-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] transition-colors duration-200 disabled:opacity-50 body-text ${
                locked ? "opacity-70" : ""
              }`}
            >
              {locked ? `🔒 ${genre.value}` : genre.value}
            </button>
          );
        })}
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-[var(--border-color)]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[var(--bg-primary)] px-2 text-sm text-[var(--text-muted)] body-text">
            {t("or_divider")}
          </span>
        </div>
      </div>

      <form
        onSubmit={handleCustomSubmit}
        className="flex flex-col sm:flex-row gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={customGenre}
          onChange={(e) => setCustomGenre(e.target.value)}
          placeholder={
            canUsePremiumGenres
              ? t("create_genre_placeholder")
              : `🔒 ${t("premium_custom_locked")}`
          }
          disabled={isLoading}
          className="flex-grow bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] body-text"
        />
        <button
          type="submit"
          disabled={isLoading || !customGenre.trim()}
          className="px-6 py-3 bg-[var(--accent-color)] text-[var(--text-on-accent)] font-semibold rounded-md hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] focus:ring-[var(--focus-ring)] disabled:bg-[var(--bg-disabled)] disabled:cursor-not-allowed transition-colors body-text"
        >
          {isLoading ? t("starting_button") : t("start_button")}
        </button>
      </form>
    </div>
  );
};

export default GenreSelector;
