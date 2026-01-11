import { useState, useRef, useEffect } from 'react';
import { FaCheckCircle, FaPlayCircle, FaRegCircle, FaChevronDown } from 'react-icons/fa';

const StatusSelector = ({ status, onChange, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const options = [
        { value: 'Not Started', label: 'Not Started', icon: <FaRegCircle className="text-gray-400" /> },
        { value: 'In Progress', label: 'In Progress', icon: <FaPlayCircle className="text-amber-500" /> },
        { value: 'Completed', label: 'Completed', icon: <FaCheckCircle className="text-green-500" /> },
    ];

    const currentOption = options.find(opt => opt.value === status) || options[0];

    // Styled based on status
    const getButtonClass = () => {
        if (disabled) return 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed border-gray-200 dark:border-slate-700';

        switch (status) {
            case 'Completed':
                return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40';
            case 'In Progress':
                return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40';
            default:
                return 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800';
        }
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                type="button"
                className={`group inline-flex items-center justify-between gap-2 px-4 py-2 text-sm font-semibold rounded-full border transition-all duration-200 shadow-sm ${getButtonClass()}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
            >
                <div className="flex items-center gap-2">
                    {currentOption.icon}
                    <span>{currentOption.label}</span>
                </div>
                {!disabled && (
                    <FaChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} opacity-50`} />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 origin-top-right bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-slate-800 focus:outline-none z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                    <div className="p-1">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${status === option.value
                                        ? 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <span className="shrink-0 text-base">{option.icon}</span>
                                {option.label}
                                {status === option.value && <span className="ml-auto text-blue-600 dark:text-blue-400 text-xs font-bold">✓</span>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatusSelector;
