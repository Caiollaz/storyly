
import { GoogleGenAI, Type } from "@google/genai";
import type { StoryHistoryItem, Scene } from '../types';
import type { Language } from '../i18n/translations';
import { translations } from '../i18n/translations';


if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    description: {
      type: Type.STRING,
      description: "A detailed, engaging, and atmospheric description of the current scene, event, or outcome. This should be 2-4 paragraphs long. Speak directly to the player in the second person ('You see...', 'You feel...').",
    },
    choices: {
      type: Type.ARRAY,
      description: "A list of 3-4 distinct actions the player can take, phrased from their perspective. One choice should be creative or unexpected.",
      items: {
        type: Type.STRING,
      },
    },
  },
  required: ["description", "choices"],
};

const buildPrompt = (genre: string, history: StoryHistoryItem[], lastChoice: string | null, language: Language): string => {
  const languageName = translations[language].language_name;

  if (history.length === 0) {
    return `You are a master storyteller and Game Master for a text-based role-playing game. Your voice is that of a classic storyteller, weaving a rich and atmospheric tale. You will speak directly to the player in the second person ("You are...", "You see...").
    Your entire response, including the JSON object's values (description and choices), must be in ${languageName}.
    Start a new adventure in the "${genre}" genre.
    Describe the opening scene with vivid, sensory details. Set the mood and introduce a situation that requires a decision.
    Provide 3-4 distinct choices for the player, phrased as actions they can take. One choice should be creative or unexpected.
    Your response must be a JSON object that conforms to the provided schema.`;
  }

  const historyText = history.map(item => 
    `Scene: ${item.sceneDescription}\nPlayer chose: ${item.playerChoice}`
  ).join('\n\n');

  return `You are a master storyteller and Game Master for a text-based role-playing game, continuing an adventure. Your voice is that of a classic storyteller, weaving a rich and atmospheric tale. You will speak directly to the player in the second person ("You are...", "You see...").
  Your entire response, including the JSON object's values (description and choices), must be in ${languageName}.
  You are continuing an adventure in the "${genre}" genre.
  Here is the story so far:
  ---
  ${historyText}
  ---
  The player's last action was: "${lastChoice}"
  
  Now, describe the outcome of this action and the new scene that unfolds. The story should be coherent and progress logically, building on what came before. Use vivid, sensory details to immerse the player.
  Keep the tone consistent with the genre.
  Provide 3-4 new, distinct choices for the player.
  Your response must be a JSON object that conforms to the provided schema.`;
};


export const generateScene = async (genre: string, history: StoryHistoryItem[], lastChoice: string | null, language: Language): Promise<Scene> => {
  const prompt = buildPrompt(genre, history, lastChoice, language);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.8,
        topP: 0.95,
      },
    });

    const jsonString = response.text;
    const parsedScene: Scene = JSON.parse(jsonString);
    
    // Basic validation
    if (!parsedScene.description || !Array.isArray(parsedScene.choices) || parsedScene.choices.length === 0) {
        throw new Error("Invalid scene format received from API.");
    }

    return parsedScene;
  } catch (error) {
    console.error("Error generating scene with Gemini:", error);
    throw new Error("Failed to generate the next part of the story. The adventure may have hit a snag!");
  }
};