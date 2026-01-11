import { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { FaBook, FaPlayCircle, FaCheckCircle, FaChartLine } from 'react-icons/fa';

const StudentDashboard = () => {
    const { user } = useContext(AuthContext);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEnrolled = async () => {
            try {
                const res = await api.get('/courses/my/enrolled');
                setEnrolledCourses(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchEnrolled();
    }, []);

    if (loading) return <div className="flex justify-center items-center h-screen text-slate-400 font-medium">Loading Dashboard...</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-12 transition-colors duration-300">

            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 transition-colors duration-300">
                <div className="container mx-auto px-4 h-24 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Learning</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Welcome back, {user?.name}</p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {enrolledCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {enrolledCourses.map(item => {
                            const completionLabel = item.course.completedStatus || 'Completed';
                            const completedCount = item.completedLectures ? item.completedLectures.filter(l => l.status === completionLabel).length : 0;

                            const totalLectures = item.course.sections
                                ? item.course.sections.reduce((acc, sec) => acc + (sec.lectures ? sec.lectures.length : 0), 0)
                                : 0;
                            const percent = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

                            return (
                                <div key={item._id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group">
                                    {/* Card Header / Icon */}
                                    <div className="h-32 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                                        <FaBook className="text-white/20 text-6xl transform group-hover:scale-110 transition-transform duration-500" />
                                        <div className="absolute bottom-4 left-4">
                                            <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-white/10">
                                                Enrolled
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-6 flex-1 flex flex-col">
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {item.course.title}
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-6 flex-1">
                                            {item.course.description || "No description provided."}
                                        </p>

                                        {/* Progress Info */}
                                        <div className="mb-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <FaCheckCircle className="text-green-500 text-xs" />
                                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                        {completedCount} / {totalLectures} Completed
                                                    </span>
                                                </div>
                                                <span className="text-xs font-bold text-slate-900 dark:text-white">{percent}%</span>
                                            </div>

                                            <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>

                                        <Link
                                            to={`/course/${item.course._id}`}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 group-hover:border-slate-400 dark:group-hover:border-slate-500"
                                        >
                                            Continue Learning <FaPlayCircle className="text-xs opacity-70" />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 border-dashed transition-colors duration-300">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaChartLine className="text-slate-300 dark:text-slate-600 text-2xl" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">No courses yet</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">When you are enrolled in a course, it will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;
