import type { Language } from "./i18n/translations";
import type {
  Entitlements,
  SavedGame,
  SavedGameRecord,
  Scene,
  StoryHistoryItem,
} from "./types";

// Error carrying the server's gating code (e.g. "SCENE_LIMIT") so the UI can
// show the right paywall message. `code` is undefined for generic failures.
export class ApiError extends Error {
  code?: string;
  status: number;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let code: string | undefined;
  let message = `Request failed (${res.status})`;
  try {
    const body = (await res.json()) as { error?: string; code?: string };
    code = body.code;
    if (body.error) message = body.error;
  } catch {
    // ignore non-JSON bodies
  }
  return new ApiError(message, res.status, code);
}

export const requestScene = async (
  genre: string,
  history: StoryHistoryItem[],
  lastChoice: string | null,
  language: Language,
): Promise<Scene> => {
  const res = await fetch("/api/scene", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ genre, history, lastChoice, language }),
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as Scene;
};

export const listSaves = async (): Promise<SavedGameRecord[]> => {
  const res = await fetch("/api/saves");
  if (!res.ok) throw await parseError(res);
  const { saves } = (await res.json()) as { saves: SavedGameRecord[] };
  return saves;
};

export const saveGame = async (
  game: SavedGame & { id?: string },
): Promise<SavedGameRecord> => {
  const res = await fetch("/api/saves", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(game),
  });
  if (!res.ok) throw await parseError(res);
  const { save } = (await res.json()) as { save: SavedGameRecord };
  return save;
};

export const deleteSave = async (id: string): Promise<void> => {
  const res = await fetch(`/api/saves?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw await parseError(res);
};

export const fetchEntitlements = async (): Promise<Entitlements> => {
  const res = await fetch("/api/me");
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as Entitlements;
};

export const startCheckout = async (): Promise<string> => {
  const res = await fetch("/api/subscription/checkout", { method: "POST" });
  if (!res.ok) throw await parseError(res);
  const { url } = (await res.json()) as { url: string };
  return url;
};
