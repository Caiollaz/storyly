
import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from '../i18n/LanguageContext';

interface GenreSelectorProps {
  onGenreSelect: (genre: string) => void;
  isLoading: boolean;
  onLoadGame: () => void;
  saveExists: boolean;
}

const GenreSelector: React.FC<GenreSelectorProps> = ({ onGenreSelect, isLoading, onLoadGame, saveExists }) => {
  const { t } = useTranslations();
  const [customGenre, setCustomGenre] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Automatically focus the input field when the component mounts
    inputRef.current?.focus();
  }, []);
  
  const predefinedGenres = [
    { key: 'predefined_fantasy', value: t('predefined_fantasy') },
    { key: 'predefined_cyberpunk', value: t('predefined_cyberpunk') },
    { key: 'predefined_horror', value: t('predefined_horror') },
    { key: 'predefined_detective', value: t('predefined_detective') },
    { key: 'predefined_expedition', value: t('predefined_expedition') },
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customGenre.trim()) {
      onGenreSelect(customGenre.trim());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto text-center p-8">
      <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-2">{t('title')}</h1>
      <p className="text-lg text-[var(--text-secondary)] mb-8">{t('subtitle')}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {predefinedGenres.map(genre => (
          <button
            key={genre.key}
            onClick={() => onGenreSelect(genre.value)}
            disabled={isLoading}
            className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--accent-hover)] hover:border-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] transition-colors duration-200 disabled:opacity-50"
          >
            {genre.value}
          </button>
        ))}
      </div>

       <div className="my-6">
        <button
            onClick={onLoadGame}
            disabled={!saveExists || isLoading}
            className="w-full p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--text-accent)] hover:border-[var(--text-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {saveExists ? t('load_adventure') : t('no_saved_game')}
        </button>
      </div>

       <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-[var(--border-color)]" />
        </div>
        <div className="relative flex justify-center">
            <span className="bg-[var(--bg-primary)] px-2 text-sm text-[var(--text-muted)]">{t('or_divider')}</span>
        </div>
      </div>


      <form onSubmit={handleCustomSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          ref={inputRef}
          type="text"
          value={customGenre}
          onChange={(e) => setCustomGenre(e.target.value)}
          placeholder={t('create_genre_placeholder')}
          disabled={isLoading}
          className="flex-grow bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
        />
        <button
          type="submit"
          disabled={isLoading || !customGenre.trim()}
          className="px-6 py-3 bg-[var(--accent-color)] text-[var(--text-on-accent)] font-semibold rounded-md hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] focus:ring-[var(--focus-ring)] disabled:bg-[var(--bg-disabled)] disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? t('starting_button') : t('start_button')}
        </button>
      </form>
    </div>
  );
};

export default GenreSelector;