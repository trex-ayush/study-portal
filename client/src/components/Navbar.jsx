import { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import ThemeContext from '../context/ThemeContext';
import { FaMoon, FaSun, FaUserCircle, FaSignOutAlt, FaGraduationCap } from 'react-icons/fa';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const onLogout = () => {
        logout();
        navigate('/login');
        setIsMenuOpen(false);
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors duration-300">
            <div className="container mx-auto px-4 h-16 flex justify-between items-center">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-blue-600 flex items-center justify-center text-white transition-colors duration-300">
                        <FaGraduationCap size={18} />
                    </div>
                    <span className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Skill Path
                    </span>
                </Link>

                <div className="flex items-center gap-4">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
                    >
                        {theme === 'light' ? <FaMoon size={18} /> : <FaSun size={18} />}
                    </button>

                    {user ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex items-center gap-3 py-1 px-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors border border-transparent focus:border-gray-200 dark:focus:border-slate-700"
                            >
                                <span className="hidden md:block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {user.name}
                                </span>
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300">
                                    {user.name ? user.name.charAt(0).toUpperCase() : <FaUserCircle />}
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-slate-800 py-1 animate-in fade-in slide-in-from-top-2">
                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 md:hidden">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                                    </div>

                                    <Link
                                        to="/profile"
                                        className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        My Profile
                                    </Link>

                                    {user.role === 'admin' && (
                                        <>
                                            <Link
                                                to="/admin"
                                                className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                Admin Dashboard
                                            </Link>
                                            <Link
                                                to="/admin/activities"
                                                className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                Activity Logs
                                            </Link>
                                        </>
                                    )}

                                    <button
                                        onClick={onLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center gap-2"
                                    >
                                        <FaSignOutAlt size={14} />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="bg-slate-900 dark:bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow hover:bg-slate-800 dark:hover:bg-blue-700 transition-all hover:shadow-lg"
                            >
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
