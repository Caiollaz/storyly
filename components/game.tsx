"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import ChoiceButton from "@/components/choice-button";
import GenreSelector from "@/components/genre-selector";
import LoadingSpinner from "@/components/loading-spinner";
import Modal from "@/components/modal";
import StoryBlock from "@/components/story-block";
import {
  ApiError,
  deleteSave,
  fetchEntitlements,
  listSaves,
  requestScene,
  saveGame,
} from "@/lib/api";
import { useTranslations } from "@/lib/i18n/language-context";
import type {
  Entitlements,
  SavedGameRecord,
  Scene,
  StoryHistoryItem,
} from "@/lib/types";
import { GameState } from "@/lib/types";

type Theme = "slate" | "dark" | "paperwhite";

interface GameProps {
  initialEntitlements: Entitlements;
}

// Map a server gating code to a user-facing message key.
const GATING_KEYS = {
  ADVENTURE_LIMIT: "limit_adventures_reached",
  SCENE_LIMIT: "limit_scenes_reached",
  PREMIUM_GENRE: "premium_genre_locked",
  SAVE_LIMIT: "limit_save_reached",
} as const;

export default function Game({ initialEntitlements }: GameProps) {
  const { language, setLanguage, t, languages } = useTranslations();
  const [gameState, setGameState] = useState<GameState>(
    GameState.GENRE_SELECTION,
  );
  const [genre, setGenre] = useState<string>("");
  const [storyHistory, setStoryHistory] = useState<StoryHistoryItem[]>([]);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [theme, setTheme] = useState<Theme>("slate");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [entitlements, setEntitlements] =
    useState<Entitlements>(initialEntitlements);
  const [saves, setSaves] = useState<SavedGameRecord[]>([]);
  const [currentSaveId, setCurrentSaveId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Initial load: theme + saved games.
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) setTheme(savedTheme);
    listSaves()
      .then(setSaves)
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.body.classList.remove(
      "theme-slate",
      "theme-dark",
      "theme-paperwhite",
    );
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll trigger on story change
  useEffect(() => {
    const timer = setTimeout(() => {
      endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timer);
  }, [storyHistory, currentScene]);

  const refreshEntitlements = () => {
    fetchEntitlements()
      .then(setEntitlements)
      .catch(() => {});
  };

  // Handle a thrown error: gating errors show an upgrade CTA, others a message.
  const handleError = (err: unknown) => {
    if (err instanceof ApiError && err.code && err.code in GATING_KEYS) {
      const key = GATING_KEYS[err.code as keyof typeof GATING_KEYS];
      setError(t(key));
      setShowUpgrade(true);
    } else {
      setError(err instanceof Error ? err.message : t("error_generate_failed"));
      setShowUpgrade(false);
    }
    setGameState(GameState.ERROR);
  };

  const handleGenreSelect = async (selectedGenre: string) => {
    setGenre(selectedGenre);
    setCurrentSaveId(null);
    setGameState(GameState.LOADING);
    setError(null);
    setShowUpgrade(false);
    setStoryHistory([]);

    try {
      const initialScene = await requestScene(
        selectedGenre,
        [],
        null,
        language,
      );
      setCurrentScene(initialScene);
      setGameState(GameState.PLAYING);
      refreshEntitlements();
    } catch (err) {
      handleError(err);
    }
  };

  const handleChoice = async (choice: string) => {
    if (!currentScene) return;
    setGameState(GameState.LOADING);
    setError(null);

    const newHistoryItem: StoryHistoryItem = {
      sceneDescription: currentScene.description,
      playerChoice: choice,
    };
    const updatedHistory = [...storyHistory, newHistoryItem];
    setStoryHistory(updatedHistory);
    setCurrentScene(null);

    try {
      const nextScene = await requestScene(
        genre,
        updatedHistory,
        choice,
        language,
      );
      setCurrentScene(nextScene);
      setGameState(GameState.PLAYING);
      refreshEntitlements();
    } catch (err) {
      handleError(err);
    }
  };

  const handleGoHome = () => {
    setGameState(GameState.GENRE_SELECTION);
    setGenre("");
    setStoryHistory([]);
    setCurrentScene(null);
    setCurrentSaveId(null);
    setError(null);
    setShowUpgrade(false);
    listSaves()
      .then(setSaves)
      .catch(() => {});
  };

  const handleSaveGame = async () => {
    if (gameState !== GameState.PLAYING || !currentScene) return;
    try {
      const saved = await saveGame({
        id: currentSaveId ?? undefined,
        genre,
        storyHistory,
        currentScene,
      });
      setCurrentSaveId(saved.id);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      handleError(err);
    }
  };

  const handleContinue = (save: SavedGameRecord) => {
    setGenre(save.genre);
    setStoryHistory(save.storyHistory);
    setCurrentScene(save.currentScene);
    setCurrentSaveId(save.id);
    setGameState(GameState.PLAYING);
    setError(null);
    setShowUpgrade(false);
  };

  const handleDeleteSave = async (id: string) => {
    await deleteSave(id).catch(() => {});
    setSaves((prev) => prev.filter((s) => s.id !== id));
  };

  const themes: Theme[] = ["slate", "dark", "paperwhite"];

  const renderContent = () => {
    switch (gameState) {
      case GameState.GENRE_SELECTION:
        return (
          <GenreSelector
            onGenreSelect={handleGenreSelect}
            isLoading={false}
            canUsePremiumGenres={entitlements.canUsePremiumGenres}
            onUpgrade={() => {
              setError(t("premium_genre_locked"));
              setShowUpgrade(true);
              setGameState(GameState.ERROR);
            }}
            saves={saves}
            onContinue={handleContinue}
            onDeleteSave={handleDeleteSave}
          />
        );

      case GameState.LOADING:
        return <LoadingSpinner />;

      case GameState.ERROR:
        return (
          <div className="text-center p-8">
            <p className="text-2xl text-[var(--error-text)] mb-4 title-dramatic">
              {showUpgrade ? t("plan_pro") : t("error_title")}
            </p>
            <p className="text-[var(--text-secondary)] mb-6 body-text">
              {error}
            </p>
            {showUpgrade && (
              <Link
                href="/account"
                className="inline-block px-6 py-3 bg-[var(--accent-color)] text-[var(--text-on-accent)] font-semibold rounded-md hover:bg-[var(--accent-hover)] transition-colors body-text"
              >
                {t("subscribe_pro")}
              </Link>
            )}
          </div>
        );

      case GameState.PLAYING:
        if (!currentScene) return <LoadingSpinner />;
        return (
          <div>
            <div className="bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)] mb-8 p-6">
              <h2 className="text-2xl font-bold text-[var(--text-accent-light)] mb-4 title-dramatic italic">
                {t("storyteller_continues")}
              </h2>
              <p className="text-justify whitespace-pre-wrap text-lg leading-relaxed text-[var(--text-primary)] animate-fadeInUp reading-text">
                {currentScene.description}
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[var(--text-primary)] title-epic">
                {t("what_do_you_do")}
              </h2>
              {currentScene.choices.map((choice, index) => (
                <ChoiceButton
                  // biome-ignore lint/suspicious/noArrayIndexKey: static per-scene list, never reordered
                  key={index}
                  text={choice}
                  onClick={() => handleChoice(choice)}
                  className="animate-choice"
                  style={{ animationDelay: `${200 + index * 100}ms` }}
                />
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 font-sans">
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleGoHome}
        title={t("confirm_action")}
        message={t("home_confirm_body")}
        confirmText={t("yes")}
        cancelText={t("no")}
      />
      <header className="w-full max-w-3xl mx-auto mb-6">
        {gameState !== GameState.GENRE_SELECTION && genre && (
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] title-epic">
              {genre}
            </h1>
          </div>
        )}
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-1 rounded-full bg-[var(--bg-secondary)] p-1 text-xs body-text">
            {languages.map((lang) => (
              <button
                type="button"
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2 py-0.5 rounded-full uppercase transition-colors body-text ${
                  language === lang
                    ? "bg-[var(--accent-color)] text-[var(--text-on-accent)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-[var(--bg-secondary)] p-1">
              {themes.map((themeOption) => (
                <button
                  type="button"
                  key={themeOption}
                  onClick={() => setTheme(themeOption)}
                  className={`w-6 h-6 rounded-full capitalize text-xs transition-all duration-200 ${
                    theme === themeOption
                      ? "ring-2 ring-offset-2 ring-offset-[var(--bg-secondary)] ring-[var(--focus-ring)]"
                      : ""
                  }`}
                  aria-label={`Switch to ${themeOption} theme`}
                >
                  <span
                    className={`w-full h-full block rounded-full ${
                      themeOption === "slate"
                        ? "bg-[#0f172a] border border-slate-600"
                        : themeOption === "dark"
                          ? "bg-black border border-gray-700"
                          : "bg-[#fbf6e8] border border-yellow-800/20"
                    }`}
                  ></span>
                </button>
              ))}
            </div>
            <Link
              href="/account"
              className="text-sm px-3 py-1.5 rounded-md bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors body-text"
            >
              {entitlements.isPro ? t("plan_pro") : t("account")}
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm px-3 py-1.5 rounded-md bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors body-text"
            >
              {t("sign_out")}
            </button>
          </div>
        </div>

        {/* Free-tier quota bar */}
        {!entitlements.isPro && (
          <div className="mt-3 text-xs text-[var(--text-muted)] body-text flex flex-wrap gap-x-4 gap-y-1">
            <span>
              {t("quota_adventures_left").replace(
                "{n}",
                String(entitlements.adventuresLeft ?? 0),
              )}
            </span>
            <span>
              {t("quota_scenes_left").replace(
                "{n}",
                String(entitlements.scenesLeftToday ?? 0),
              )}
            </span>
          </div>
        )}

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          {gameState === GameState.PLAYING && (
            <button
              type="button"
              onClick={handleSaveGame}
              className="text-sm px-3 py-1.5 rounded-md bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors whitespace-nowrap body-text"
            >
              {isSaved ? t("game_saved") : t("save_game")}
            </button>
          )}

          {(gameState === GameState.PLAYING ||
            gameState === GameState.ERROR) && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-sm px-3 py-1.5 rounded-md bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors whitespace-nowrap body-text"
            >
              {t("home")}
            </button>
          )}
        </div>
      </header>

      <main className="w-full max-w-3xl mx-auto flex-grow">
        {storyHistory.map((item, index) => (
          <StoryBlock
            // biome-ignore lint/suspicious/noArrayIndexKey: append-only history, never reordered
            key={index}
            sceneDescription={item.sceneDescription}
            playerChoice={item.playerChoice}
          />
        ))}

        <div className="mt-4">{renderContent()}</div>

        <div ref={endOfMessagesRef} />
      </main>
      <footer className="text-center text-[var(--text-muted)] mt-8 w-full max-w-3xl mx-auto pb-4">
        <p className="text-sm body-text">{t("footer_text")}</p>
      </footer>
    </div>
  );
}
