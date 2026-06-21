export enum GameState {
  GENRE_SELECTION,
  LOADING,
  PLAYING,
  ERROR,
}

export interface Scene {
  description: string;
  choices: string[];
}

export interface StoryHistoryItem {
  sceneDescription: string;
  playerChoice: string;
}

export interface SavedGame {
  genre: string;
  storyHistory: StoryHistoryItem[];
  currentScene: Scene;
}

// A saved game persisted in the DB (returned by /api/saves).
export interface SavedGameRecord extends SavedGame {
  id: string;
  updatedAt: string;
}

export interface Entitlements {
  isPro: boolean;
  adventuresLeft: number | null; // null = unlimited
  scenesLeftToday: number | null;
  saveSlots: number | null;
  canUsePremiumGenres: boolean;
}
