import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    className?: string;
    error?: string;
}

/**
 * Кастомный select на базе Headless UI Listbox
 * Единый стиль для всех браузеров, полная кастомизация
 */
export const CustomSelect: React.FC<CustomSelectProps> = ({
    value,
    onChange,
    options,
    placeholder = 'Выберите...',
    label,
    disabled = false,
    className = '',
    error
}) => {
    const selectedOption = options.find(opt => opt.value === value);
    const displayValue = selectedOption?.label || placeholder;

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
            )}
            <Listbox value={value} onChange={onChange} disabled={disabled}>
                <div className="relative">
                    <Listbox.Button
                        className={`
                            relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left
                            border shadow-sm
                            ${error
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                            }
                            focus:outline-none focus:ring-2 focus:ring-offset-0
                            disabled:bg-gray-100 disabled:cursor-not-allowed
                            transition-colors duration-200
                            sm:text-sm
                        `}
                    >
                        <span className={`block truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900'}`}>
                            {displayValue}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                            />
                        </span>
                    </Listbox.Button>
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <Listbox.Options
                            className="
                                absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1
                                text-base shadow-lg ring-1 ring-black ring-opacity-5
                                focus:outline-none sm:text-sm
                            "
                        >
                            {options.map((option) => (
                                <Listbox.Option
                                    key={option.value}
                                    className={({ active }) =>
                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                            active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                                        } ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`
                                    }
                                    value={option.value}
                                    disabled={option.disabled}
                                >
                                    {({ selected, active }) => (
                                        <>
                                            <span
                                                className={`block truncate ${
                                                    selected ? 'font-semibold' : 'font-normal'
                                                }`}
                                            >
                                                {option.label}
                                            </span>
                                            {selected ? (
                                                <span
                                                    className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                        active ? 'text-blue-600' : 'text-blue-600'
                                                    }`}
                                                >
                                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                </span>
                                            ) : null}
                                        </>
                                    )}
                                </Listbox.Option>
                            ))}
                        </Listbox.Options>
                    </Transition>
                </div>
            </Listbox>
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};
