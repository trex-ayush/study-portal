import { FaPlayCircle, FaCheckCircle, FaRegCircle, FaLock } from 'react-icons/fa';

const LectureSidebarItem = ({
    lecture,
    isSelected,
    onClick,
    status = null, // 'Not Started', 'In Progress', 'Completed' (for Student)
    showStatus = false // Whether to show status icons
}) => {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors flex items-center justify-between group mb-1 ${isSelected
                ? 'bg-slate-900 dark:bg-blue-600 text-white font-medium shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
        >
            <div className="flex items-center gap-3 overflow-hidden">
                {/* Icon Section */}
                <div className="shrink-0 flex items-center justify-center w-4">
                    {showStatus ? (
                        <>
                            {status === 'Completed' && <FaCheckCircle className={isSelected ? 'text-green-400 dark:text-green-300' : 'text-green-600 dark:text-green-500'} size={13} />}
                            {status === 'In Progress' && <FaRegCircle className={isSelected ? 'text-blue-200 dark:text-blue-200' : 'text-blue-500 dark:text-blue-400'} size={13} />}
                            {(!status || status === 'Not Started') && <FaRegCircle className={isSelected ? 'text-slate-500 dark:text-slate-300' : 'text-slate-300 dark:text-slate-600'} size={13} />}
                        </>
                    ) : (
                        <span className={`text-[10px] font-bold ${isSelected ? 'text-slate-400 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                            {lecture.number}
                        </span>
                    )}
                </div>

                {/* Title */}
                <span className="truncate flex-1 leading-tight">{lecture.title}</span>
            </div>

            {/* Right Side Indicators */}
            <div className="shrink-0 ml-2">
                {isSelected && !showStatus && <FaPlayCircle className="text-[10px] opacity-70" />}

                {/* For Student View, maybe show duration or small label? Keeping it simple for now */}
                {showStatus && status === 'In Progress' && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 block"></span>
                )}
            </div>
        </button>
    );
};

export default LectureSidebarItem;
