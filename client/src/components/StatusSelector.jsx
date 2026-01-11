import { useState, useRef, useEffect } from 'react';
import { FaCheckCircle, FaPlayCircle, FaRegCircle, FaChevronDown } from 'react-icons/fa';

const StatusSelector = ({ status, onChange, disabled, customStatuses = [] }) => {
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

    const currentStatuses = customStatuses;

    if (!currentStatuses || currentStatuses.length === 0) {
        return <div className="text-[10px] text-slate-400 font-bold uppercase py-2 px-4 border border-dashed border-gray-200 dark:border-slate-800 rounded-full italic">No statuses set</div>;
    }

    const options = currentStatuses.map(s => ({
        value: s.label,
        label: s.label,
        color: s.color,
        icon: s.label === 'Completed' ? <FaCheckCircle style={{ color: s.color }} /> :
            s.label === 'In Progress' ? <FaPlayCircle style={{ color: s.color }} /> :
                <FaRegCircle style={{ color: s.color }} />
    }));

    const currentOption = options.find(opt => opt.value === status) || options[0];

    // Styled based on status
    const getButtonStyle = () => {
        if (disabled) return { opacity: 0.5, cursor: 'not-allowed' };

        return {
            backgroundColor: `${currentOption.color}15`, // 15% opacity
            borderColor: `${currentOption.color}30`,
            color: currentOption.color
        };
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                type="button"
                className={`group inline-flex items-center justify-between gap-2 px-4 py-2 text-sm font-semibold rounded-full border transition-all duration-200 shadow-sm`}
                style={getButtonStyle()}
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
                <div className="absolute left-0 mt-2 w-48 origin-top-left bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-slate-800 focus:outline-none z-[100] animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                    <div className="p-1">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${status === option.value
                                    ? 'bg-slate-50 dark:bg-slate-800'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                style={status === option.value ? { color: option.color } : {}}
                            >
                                <span className="shrink-0 text-base">{option.icon}</span>
                                {option.label}
                                {status === option.value && <span className="ml-auto text-xs font-bold" style={{ color: option.color }}>✓</span>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatusSelector;
