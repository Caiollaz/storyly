"use client";

import type React from "react";
import { useTranslations } from "@/lib/i18n/language-context";
import type { StoryHistoryItem } from "@/lib/types";

const StoryBlock: React.FC<StoryHistoryItem> = ({
  sceneDescription,
  playerChoice,
}) => {
  const { t } = useTranslations();
  return (
    <div className="mb-8 p-6 bg-[var(--bg-secondary-translucent)] rounded-lg border border-[var(--border-color-translucent)] opacity-70">
      <p className="whitespace-pre-wrap text-[var(--text-primary)] italic reading-text">
        {sceneDescription}
      </p>
      <p className="mt-4 text-[var(--text-accent)] font-semibold body-text">
        <span className="text-[var(--text-muted)] mr-2 font-normal">
          {t("player_decision")}
        </span>{" "}
        {playerChoice}
      </p>
    </div>
  );
};

export default StoryBlock;
