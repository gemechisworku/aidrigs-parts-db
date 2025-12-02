import React, { useState, useRef, useEffect } from 'react';

interface Option {
    value: string;
    label: string;
    isPending?: boolean;
}

interface CreatableSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
    name?: string;
    id?: string;
    required?: boolean;
}

const CreatableSelect: React.FC<CreatableSelectProps> = ({
    value,
    onChange,
    options,
    placeholder = 'Select or type to create...',
    className = '',
    name,
    id,
    required = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value || '');
    const [filteredOptions, setFilteredOptions] = useState<Option[]>(options);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (inputValue) {
            const filtered = options.filter(opt =>
                opt.label.toLowerCase().includes(inputValue.toLowerCase())
            );
            setFilteredOptions(filtered);
        } else {
            setFilteredOptions(options);
        }
    }, [inputValue, options]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange(newValue);
        setIsOpen(true);
    };

    const handleOptionClick = (option: Option) => {
        setInputValue(option.label);
        onChange(option.value);
        setIsOpen(false);
    };

    const handleInputFocus = () => {
        setIsOpen(true);
    };

    const isCreatingNew = inputValue && !options.some(opt => opt.value === inputValue);
    const showCreateOption = isCreatingNew && inputValue.length > 0;

    return (
        <div ref={wrapperRef} className="relative">
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                placeholder={placeholder}
                className={className}
                name={name}
                id={id}
                required={required}
                autoComplete="off"
            />

            {isOpen && (filteredOptions.length > 0 || showCreateOption) && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {showCreateOption && (
                        <div
                            className="px-4 py-2 cursor-pointer hover:bg-blue-50 border-b border-gray-200 bg-blue-50"
                            onClick={() => {
                                onChange(inputValue);
                                setIsOpen(false);
                            }}
                        >
                            <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="text-sm font-medium text-blue-700">
                                    Create "{inputValue}"
                                </span>
                                <span className="ml-auto text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                                    Pending Approval
                                </span>
                            </div>
                        </div>
                    )}

                    {filteredOptions.map((option, index) => (
                        <div
                            key={index}
                            className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${option.value === inputValue ? 'bg-gray-50' : ''
                                }`}
                            onClick={() => handleOptionClick(option)}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-900">{option.label}</span>
                                {option.isPending && (
                                    <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                                        Pending
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}

                    {filteredOptions.length === 0 && !showCreateOption && (
                        <div className="px-4 py-2 text-sm text-gray-500">
                            No matches found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CreatableSelect;
