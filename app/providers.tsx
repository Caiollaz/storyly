"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n/language-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </SessionProvider>
  );
}
