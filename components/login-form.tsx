"use client";

import { signIn } from "next-auth/react";
import { useTranslations } from "@/lib/i18n/language-context";

export default function LoginForm() {
  const { t, language, setLanguage, languages } = useTranslations();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2 title-epic">
          {t("login_title")}
        </h1>
        <p className="text-[var(--text-secondary)] mb-8 body-text">
          {t("login_subtitle")}
        </p>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full px-6 py-3 bg-[var(--accent-color)] text-[var(--text-on-accent)] font-semibold rounded-md hover:bg-[var(--accent-hover)] transition-colors body-text"
        >
          {t("login_with_google")}
        </button>

        <div className="mt-8 flex items-center justify-center gap-1 rounded-full bg-[var(--bg-secondary)] p-1 text-xs body-text mx-auto w-fit">
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
      </div>
    </div>
  );
}
