import React, { useState, useRef, useEffect } from 'react';
import type { Scene, StoryHistoryItem, SavedGame } from './types';
import { GameState } from './types';
import { generateScene } from './services/geminiService';
import GenreSelector from './components/GenreSelector';
import StoryBlock from './components/StoryBlock';
import ChoiceButton from './components/ChoiceButton';
import LoadingSpinner from './components/LoadingSpinner';
import { useTranslations } from './i18n/LanguageContext';

type Theme = 'slate' | 'dark' | 'paperwhite';

const App: React.FC = () => {
  const { language, setLanguage, t, languages } = useTranslations();
  const [gameState, setGameState] = useState<GameState>(GameState.GENRE_SELECTION);
  const [genre, setGenre] = useState<string>('');
  const [storyHistory, setStoryHistory] = useState<StoryHistoryItem[]>([]);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveExists, setSaveExists] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as Theme) || 'slate';
  });

  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const SAVE_KEY = 'storylySave';


  // Check for saved game on initial load
  useEffect(() => {
    const savedGame = localStorage.getItem(SAVE_KEY);
    setSaveExists(!!savedGame);
  }, []);
  
  useEffect(() => {
    // Apply theme class to body
    document.body.classList.remove('theme-slate', 'theme-dark', 'theme-paperwhite');
    document.body.classList.add(`theme-${theme}`);
    // Save theme to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const timer = setTimeout(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    return () => clearTimeout(timer);
  }, [storyHistory, currentScene]);

  const handleGenreSelect = async (selectedGenre: string) => {
    setGenre(selectedGenre);
    setGameState(GameState.LOADING);
    setError(null);
    setStoryHistory([]);
    
    try {
      const initialScene = await generateScene(selectedGenre, [], null, language);
      setCurrentScene(initialScene);
      setGameState(GameState.PLAYING);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error_generate_failed'));
      setGameState(GameState.ERROR);
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
      const nextScene = await generateScene(genre, updatedHistory, choice, language);
      setCurrentScene(nextScene);
      setGameState(GameState.PLAYING);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error_generate_failed'));
      setGameState(GameState.ERROR);
    }
  };
  
  const handleGoHome = () => {
    setGameState(GameState.GENRE_SELECTION);
    setGenre('');
    setStoryHistory([]);
    setCurrentScene(null);
    setError(null);
  }

  const handleHomeConfirm = () => {
    if (window.confirm(t('home_confirm_body'))) {
        handleGoHome();
    }
  }

  const handleSaveGame = () => {
    if (gameState === GameState.PLAYING && currentScene) {
      const savedData: SavedGame = {
        genre,
        storyHistory,
        currentScene,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(savedData));
      setSaveExists(true);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleLoadGame = () => {
    const savedGameString = localStorage.getItem(SAVE_KEY);
    if (savedGameString) {
      try {
        const savedData: SavedGame = JSON.parse(savedGameString);
        setGenre(savedData.genre);
        setStoryHistory(savedData.storyHistory);
        setCurrentScene(savedData.currentScene);
        setGameState(GameState.PLAYING);
        setError(null);
      } catch (e) {
        console.error("Failed to load game:", e);
        setError(t('error_load_failed'));
        localStorage.removeItem(SAVE_KEY); // Clear corrupted data
        setSaveExists(false);
        setGameState(GameState.ERROR);
      }
    }
  };

  const renderContent = () => {
    switch (gameState) {
      case GameState.GENRE_SELECTION:
        return <GenreSelector onGenreSelect={handleGenreSelect} isLoading={false} onLoadGame={handleLoadGame} saveExists={saveExists} />;
      
      case GameState.LOADING:
        return <LoadingSpinner />;

      case GameState.ERROR:
        return (
          <div className="text-center p-8">
            <p className="text-2xl text-[var(--error-text)] mb-4">{t('error_title')}</p>
            <p className="text-[var(--text-secondary)] mb-6">{error}</p>
          </div>
        );

      case GameState.PLAYING:
        if (!currentScene) return <LoadingSpinner />;
        return (
            <div>
                <div className="bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)] mb-8 p-6">
                    <h2 className="text-xl font-bold text-[var(--text-accent-light)] mb-4 font-serif italic">{t('storyteller_continues')}</h2>
                    <p className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-[var(--text-primary)] animate-fadeInUp">
                        {currentScene.description}
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">{t('what_do_you_do')}</h2>
                    {currentScene.choices.map((choice, index) => (
                        <ChoiceButton 
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
  
  const themes: Theme[] = ['slate', 'dark', 'paperwhite'];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
        <header className="w-full max-w-3xl mx-auto mb-6 flex justify-between items-center min-h-[40px]">
            <div>
                {gameState !== GameState.GENRE_SELECTION && (
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">{genre}</h1>
                )}
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1 rounded-full bg-[var(--bg-secondary)] p-1 text-xs">
                    {languages.map((lang) => (
                    <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`px-2 py-0.5 rounded-full uppercase transition-colors ${
                        language === lang ? 'bg-[var(--accent-color)] text-[var(--text-on-accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        {lang}
                    </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 rounded-full bg-[var(--bg-secondary)] p-1">
                    {themes.map((t) => (
                        <button
                            key={t}
                            onClick={() => setTheme(t)}
                            className={`w-6 h-6 rounded-full capitalize text-xs transition-all duration-200 ${
                                theme === t ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-secondary)] ring-[var(--focus-ring)]' : ''
                            }`}
                            aria-label={`Switch to ${t} theme`}
                        >
                            <span className={`w-full h-full block rounded-full ${
                                t === 'slate' ? 'bg-[#0f172a] border border-slate-600' : 
                                t === 'dark' ? 'bg-black border border-gray-700' : 
                                'bg-[#fbf6e8] border border-yellow-800/20'
                            }`}></span>
                        </button>
                    ))}
                </div>

                {gameState === GameState.PLAYING && (
                     <button 
                        onClick={handleSaveGame}
                        className="text-sm px-3 py-1.5 rounded-md bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors"
                    >
                        {isSaved ? t('game_saved') : t('save_game')}
                    </button>
                )}

                {(gameState === GameState.PLAYING || gameState === GameState.ERROR) && (
                     <button 
                        onClick={handleHomeConfirm}
                        className="text-sm px-3 py-1.5 rounded-md bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors"
                    >
                        {t('home')}
                    </button>
                )}
            </div>
        </header>

      <main className="w-full max-w-3xl mx-auto">
        {storyHistory.map((item, index) => (
          <StoryBlock key={index} sceneDescription={item.sceneDescription} playerChoice={item.playerChoice} />
        ))}
        
        <div className="mt-4">
            {renderContent()}
        </div>
        
        <div ref={endOfMessagesRef} />
      </main>
       <footer className="text-center text-[var(--text-muted)] mt-8">
            <p>{t('footer_text')}</p>
        </footer>
    </div>
  );
};

export default App;