import { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FaUserCircle, FaVideo, FaKey, FaChartLine } from 'react-icons/fa';

const Profile = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState({ totalCompletedLectures: 0 });
    const [loadingStats, setLoadingStats] = useState(true);

    // Password Form State
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/courses/my/stats');
                setStats(res.data);
            } catch (err) {
                console.error("Failed to fetch stats", err);
            } finally {
                setLoadingStats(false);
            }
        };
        fetchStats();
    }, []);

    const handleChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
        setError('');
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        const { currentPassword, newPassword, confirmPassword } = passwords;

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        try {
            await api.put('/auth/updatepassword', { currentPassword, newPassword });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
            toast.success("Password updated successfully");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update password");
            toast.error("Failed to update password");
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">My Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: User Info & Stats */}
                <div className="md:col-span-1 space-y-6">
                    {/* Profile Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4">
                            <FaUserCircle size={64} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{user?.email}</p>
                        <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-full uppercase mt-2">
                            {user?.role}
                        </span>
                    </div>

                    {/* Stats Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <FaChartLine className="text-blue-500" /> Learning Stats
                        </h3>
                        {loadingStats ? (
                            <div className="h-16 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                        ) : (
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Watched</p>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalCompletedLectures}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                                    <FaVideo size={20} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Settings */}
                <div className="md:col-span-2">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-8">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3 border-b border-gray-100 dark:border-slate-800 pb-4">
                            <FaKey className="text-slate-400" /> Security
                        </h3>

                        <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-lg">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current Password</label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={passwords.currentPassword}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Enter current password"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">New Password</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={passwords.newPassword}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Min 6 chars"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confirm Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={passwords.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Re-enter new password"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
                                    {error}
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold py-2.5 px-6 rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    Update Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
