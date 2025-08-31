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
