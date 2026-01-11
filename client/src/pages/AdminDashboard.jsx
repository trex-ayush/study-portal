import { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { FaPlus, FaBook, FaEdit, FaChartLine, FaUsers } from 'react-icons/fa';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newCourse, setNewCourse] = useState({ title: '', description: '' });

    const fetchCourses = async () => {
        try {
            const res = await api.get('/courses');
            setCourses(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/courses', newCourse);
            setShowCreate(false);
            setNewCourse({ title: '', description: '' });
            fetchCourses();
        } catch (error) {
            alert('Error creating course');
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen text-slate-400 font-medium bg-gray-50 dark:bg-slate-950">Loading Dashboard...</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-12 transition-colors duration-300">

            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 transition-colors duration-300">
                <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your courses and content</p>
                    </div>
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-md text-sm font-bold shadow-sm hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                    >
                        {showCreate ? 'Cancel' : <><FaPlus size={12} /> New Course</>}
                    </button>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">

                {showCreate && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-slate-800">
                            <div className="bg-gray-50/50 dark:bg-slate-950/50 px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 dark:text-white">Create New Course</h3>
                                <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
                            </div>
                            <form onSubmit={handleCreate} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Course Title</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/50"
                                        value={newCourse.title}
                                        onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                                        required
                                        placeholder="e.g. Advanced React Patterns"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Description</label>
                                    <textarea
                                        className="w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/50 min-h-[100px]"
                                        value={newCourse.description}
                                        onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                                        required
                                        placeholder="Brief summary of what students will learn..."
                                    />
                                </div>
                                <div className="flex justify-end pt-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreate(false)}
                                        className="px-4 py-2 rounded-md text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-md text-sm font-bold hover:bg-green-700 transition-colors">
                                        Publish Course
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {courses.map(course => (
                            <div key={course._id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group">
                                {/* Card Header */}
                                <div
                                    className="h-32 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center relative overflow-hidden cursor-pointer"
                                    onClick={() => navigate(`/admin/course/${course._id}`)}
                                >
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                                    <FaBook className="text-white/20 text-5xl transform group-hover:scale-110 transition-transform duration-500" />

                                    {/* Status Badge */}
                                    <div className="absolute top-3 right-3">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg ${course.status === 'Published'
                                                ? 'bg-green-500 text-white'
                                                : course.status === 'Archived'
                                                    ? 'bg-red-500 text-white'
                                                    : 'bg-amber-500 text-white'
                                            }`}>
                                            {course.status || 'Draft'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h2
                                            className="text-base font-bold text-slate-900 dark:text-white leading-tight line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer min-h-[2.5rem]"
                                            onClick={() => navigate(`/admin/course/${course._id}`)}
                                        >
                                            {course.title}
                                        </h2>
                                    </div>

                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-4 flex-1">
                                        {course.description || "No description provided."}
                                    </p>

                                    <div className="flex items-center gap-4 text-[10px] text-slate-400 dark:text-slate-500 font-medium mb-4 border-t border-gray-100 dark:border-slate-800 pt-3">
                                        <div className="flex items-center gap-1.5">
                                            <FaBook size={10} />
                                            <span>{course.sections ? course.sections.length : 0} Sections</span>
                                        </div>
                                        {/* Placeholder for student count if available in future */}
                                        <div className="flex items-center gap-1.5">
                                            <FaUsers size={10} />
                                            <span>Manage</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Link
                                            to={`/admin/course/${course._id}`}
                                            className="flex-1 bg-slate-900 dark:bg-slate-700 text-white py-2 rounded-lg text-xs font-bold text-center hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
                                        >
                                            Manage
                                        </Link>
                                        <button className="px-3 py-2 bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                                            <FaEdit size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 border-dashed">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaChartLine className="text-slate-300 dark:text-slate-600 text-2xl" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">No courses yet</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create your first course to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
