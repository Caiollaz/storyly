import React from 'react';
import { useTranslations } from '../i18n/LanguageContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  title,
  message,
  confirmText,
  cancelText
}) => {
  const { t } = useTranslations();
  
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div 
        className="relative bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)] w-full max-w-md shadow-xl transform transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="p-6">
          <h2 
            id="modal-title"
            className="text-xl font-bold text-[var(--text-primary)] mb-2 title-dramatic"
          >
            {title}
          </h2>
          <p className="text-[var(--text-secondary)] mb-6 body-text">
            {message}
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-md hover:text-[var(--text-primary)] transition-colors body-text"
            >
              {cancelText || t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 bg-[var(--accent-color)] text-[var(--text-on-accent)] rounded-md hover:bg-[var(--accent-hover)] transition-colors body-text"
            >
              {confirmText || t('confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;