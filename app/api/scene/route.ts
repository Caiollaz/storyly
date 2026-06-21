import type { NextRequest } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { auth } from "@/auth";
import {
  assertCanGenerateScene,
  assertCanStartAdventure,
  assertCanUseGenre,
  GatingError,
  isPro,
} from "@/lib/entitlements";
import type { Language } from "@/lib/i18n/translations";
import { translations } from "@/lib/i18n/translations";
import type { Scene, StoryHistoryItem } from "@/lib/types";

export const runtime = "nodejs";

const MODEL = "deepseek-v4-flash";
const BASE_URL = "https://api.deepseek.com";

// DeepSeek JSON mode requires the word "json" and an example of the desired
// shape in the prompt (it has no structured-schema field like Gemini).
//
// The system prompt is kept stable per game so DeepSeek's automatic context
// cache hits it on every turn. Language lives here too: switching language is
// rare and only costs one cache-cold turn.
const buildSystemPrompt = (language: Language): string => {
  const languageName = translations[language].language_name;
  return `You are a master storyteller and Game Master for a text-based role-playing game. Your voice is that of a classic storyteller, weaving a rich and atmospheric tale. You speak directly to the player in the second person ("You are...", "You see...").

Write everything (both "description" and "choices" values) in ${languageName}.

You must respond ONLY with a single JSON object, with no markdown fences or extra text, in exactly this format:
{
  "description": "A detailed, engaging, atmospheric description of the scene/outcome, 2-4 paragraphs, in the second person.",
  "choices": ["A distinct action the player can take", "Another action", "Another action"]
}

Rules for the JSON:
- "description": string, 2-4 paragraphs, vivid sensory detail.
- "choices": array of 3-4 strings, each a distinct action phrased from the player's perspective. One choice should be creative or unexpected.`;
};

// Stable opening instruction (genre is fixed per game) — the first user turn.
const buildOpeningPrompt = (genre: string): string =>
  `Start a new adventure in the "${genre}" genre. Describe the opening scene with vivid, sensory details. Set the mood and introduce a situation that requires a decision.`;

// Rebuild the whole exchange as a real multi-turn conversation. Each past turn
// is a frozen (assistant scene, user choice) pair, so turn N+1's message prefix
// is byte-identical to turn N's up to the newly appended pair — maximising
// DeepSeek prefix-cache hits on the history (the bulk of the tokens).
const buildMessages = (
  genre: string,
  history: StoryHistoryItem[],
  language: Language,
): ChatCompletionMessageParam[] => {
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(language) },
    { role: "user", content: buildOpeningPrompt(genre) },
  ];

  for (const item of history) {
    messages.push({ role: "assistant", content: item.sceneDescription });
    messages.push({ role: "user", content: item.playerChoice });
  }

  return messages;
};

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error("DEEPSEEK_API_KEY is not configured.");
    return Response.json(
      { error: "Server is not configured." },
      { status: 500 },
    );
  }

  const { genre, history, language } = (await req.json()) as {
    genre: string;
    history: StoryHistoryItem[];
    lastChoice: string | null;
    language: Language;
  };

  const items = history ?? [];

  // Plan gating (server-enforced). Throws GatingError -> 402 below.
  try {
    const pro = await isPro(userId);
    if (items.length === 0) {
      assertCanUseGenre(genre, pro);
      await assertCanStartAdventure(userId, pro);
    }
    await assertCanGenerateScene(userId, pro);
  } catch (error) {
    if (error instanceof GatingError) {
      return Response.json(
        { error: error.code, code: error.code },
        { status: error.status },
      );
    }
    throw error;
  }

  const client = new OpenAI({ apiKey, baseURL: BASE_URL });

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: buildMessages(genre, history ?? [], language),
      response_format: { type: "json_object" },
      temperature: 0.8,
      top_p: 0.95,
      max_tokens: 2048,
    });

    // DeepSeek reports cache usage; log it so cost savings are observable.
    const usage = completion.usage as
      | { prompt_cache_hit_tokens?: number; prompt_cache_miss_tokens?: number }
      | undefined;
    if (usage) {
      console.log(
        `[deepseek] cache hit=${usage.prompt_cache_hit_tokens ?? 0} miss=${usage.prompt_cache_miss_tokens ?? 0}`,
      );
    }

    const jsonString = completion.choices[0]?.message?.content;
    if (!jsonString) {
      throw new Error("Empty response received from API.");
    }

    const parsedScene: Scene = JSON.parse(jsonString);

    // Basic validation
    if (
      !parsedScene.description ||
      !Array.isArray(parsedScene.choices) ||
      parsedScene.choices.length === 0
    ) {
      throw new Error("Invalid scene format received from API.");
    }

    return Response.json(parsedScene);
  } catch (error) {
    console.error("Error generating scene with DeepSeek:", error);
    return Response.json(
      {
        error:
          "Failed to generate the next part of the story. The adventure may have hit a snag!",
      },
      { status: 500 },
    );
  }
}
