"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { cancelSubscription, startCheckout } from "@/lib/api";
import { useTranslations } from "@/lib/i18n/language-context";
import type { Entitlements } from "@/lib/types";

export default function AccountPanel({
  entitlements,
  price,
}: {
  entitlements: Entitlements;
  price?: string;
}) {
  const { t } = useTranslations();
  const [loading, setLoading] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const url = await startCheckout();
      window.location.href = url;
    } catch {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setCanceling(true);
    try {
      await cancelSubscription();
      window.location.reload();
    } catch {
      setCanceling(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-6 title-epic text-center">
          {t("account")}
        </h1>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[var(--text-secondary)] body-text">
              {t("plan")}
            </span>
            <span className="font-semibold text-[var(--text-accent-light)] body-text">
              {entitlements.isPro ? t("plan_pro") : t("plan_free")}
            </span>
          </div>

          {entitlements.isPro ? (
            <>
              <p className="text-[var(--text-secondary)] body-text mb-4">
                {t("subscription_active")}
              </p>
              <button
                type="button"
                onClick={handleCancel}
                disabled={canceling}
                className="w-full px-6 py-3 border border-[var(--border-color)] text-[var(--text-secondary)] rounded-md hover:text-[var(--error-text)] hover:border-[var(--error-text)] disabled:opacity-60 transition-colors body-text"
              >
                {canceling ? t("canceling") : t("cancel_subscription")}
              </button>
            </>
          ) : (
            <>
              <p className="text-[var(--text-secondary)] body-text mb-4">
                {t("pro_benefits")}
              </p>
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full px-6 py-3 bg-[var(--accent-color)] text-[var(--text-on-accent)] font-semibold rounded-md hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors body-text"
              >
                {loading
                  ? t("starting_checkout")
                  : price
                    ? `${t("subscribe_pro")} — ${price}`
                    : t("subscribe_pro")}
              </button>
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors body-text"
          >
            {t("back_to_game")}
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors body-text"
          >
            {t("sign_out")}
          </button>
        </div>
      </div>
    </div>
  );
}
