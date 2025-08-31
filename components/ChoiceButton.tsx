
import React from 'react';

interface ChoiceButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const ChoiceButton: React.FC<ChoiceButtonProps> = ({ text, onClick, disabled = false, className = '', style }) => {
  const baseClasses = "w-full text-left p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--accent-hover)] hover:border-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-opacity-75 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed group";
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${className}`}
      style={style}
    >
      <p className="text-[var(--text-primary)] group-hover:text-[var(--text-on-accent)] transition-colors">{text}</p>
    </button>
  );
};

export default ChoiceButton;