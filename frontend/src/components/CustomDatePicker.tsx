import React, { useState, useRef, useEffect } from 'react';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface CustomDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Кастомный date picker с красивым дизайном
 * Использует нативный input type="date" но со стилизацией
 */
export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Выберите дату',
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Форматируем дату для отображения
  useEffect(() => {
    if (value) {
      try {
        const date = new Date(value);
        const formatted = date.toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
        setDisplayValue(formatted);
      } catch {
        setDisplayValue(value);
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleButtonClick = () => {
    if (!disabled) {
      inputRef.current?.showPicker?.();
      setIsOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  return (
    <div className={className} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {/* Кнопка открытия календаря */}
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={disabled}
          className={`
            relative w-full cursor-default rounded-lg bg-white py-2 pl-10 pr-10 text-left
            border shadow-sm
            border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            transition-colors duration-200
            text-sm hover:border-gray-400
          `}
        >
          {/* Иконка календаря */}
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <FaCalendarAlt
              className="h-4 w-4 text-gray-400"
              aria-hidden="true"
            />
          </span>

          {/* Отображаемое значение */}
          <span className={`block truncate ${!displayValue ? 'text-gray-400' : 'text-gray-900'}`}>
            {displayValue || placeholder}
          </span>

          {/* Кнопка очистки */}
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="pointer-events-auto absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </button>

        {/* Скрытый нативный input date */}
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          className="absolute inset-0 opacity-0 cursor-pointer"
          style={{ pointerEvents: 'none' }}
        />
      </div>
    </div>
  );
};
