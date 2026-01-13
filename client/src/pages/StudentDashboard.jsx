import { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { FaBook, FaPlayCircle, FaCheckCircle, FaChartLine, FaPlus, FaCog, FaUsers, FaEye, FaEyeSlash, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(tabParam === 'created' ? 'created' : 'enrolled');
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [createdCourses, setCreatedCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState(null);
    const [newCourse, setNewCourse] = useState({ title: '', description: '' });
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Sync tab with URL
    useEffect(() => {
        if (activeTab === 'created') {
            setSearchParams({ tab: 'created' });
        } else {
            setSearchParams({});
        }
    }, [activeTab, setSearchParams]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [enrolledRes, createdRes] = await Promise.all([
                    api.get('/courses/my/enrolled'),
                    api.get('/courses/my/created')
                ]);
                setEnrolledCourses(enrolledRes.data);
                setCreatedCourses(createdRes.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        if (!newCourse.title.trim() || !newCourse.description.trim()) {
            toast.error('Please fill all fields');
            return;
        }

        setCreating(true);
        try {
            const res = await api.post('/courses', newCourse);
            setCreatedCourses([res.data, ...createdCourses]);
            setShowCreateModal(false);
            setNewCourse({ title: '', description: '' });
            toast.success('Course created successfully');
            navigate(`/admin/course/${res.data._id}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create course');
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteCourse = async () => {
        if (!courseToDelete) return;

        setDeleting(true);
        try {
            await api.delete(`/courses/${courseToDelete._id}`);
            setCreatedCourses(createdCourses.filter(c => c._id !== courseToDelete._id));
            setShowDeleteModal(false);
            setCourseToDelete(null);
            toast.success('Course deleted successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete course');
        } finally {
            setDeleting(false);
        }
    };

    const openDeleteModal = (course) => {
        setCourseToDelete(course);
        setShowDeleteModal(true);
    };

    if (loading) return <div className="flex justify-center items-center h-screen text-slate-400 font-medium">Loading Dashboard...</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-12 transition-colors duration-300">

            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 transition-colors duration-300">
                <div className="container mx-auto px-4 h-24 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Welcome back, {user?.name}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
                <div className="container mx-auto px-4">
                    <div className="flex gap-1">
                        <button
                            onClick={() => setActiveTab('enrolled')}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'enrolled'
                                    ? 'border-slate-900 text-slate-900 dark:text-white dark:border-white'
                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                        >
                            My Learning
                        </button>
                        <button
                            onClick={() => setActiveTab('created')}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'created'
                                    ? 'border-slate-900 text-slate-900 dark:text-white dark:border-white'
                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                        >
                            My Courses {createdCourses.length > 0 && `(${createdCourses.length})`}
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {activeTab === 'enrolled' ? (
                    // Enrolled Courses Tab
                    enrolledCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {enrolledCourses.map(item => {
                                const completionLabel = item.course.completedStatus || 'Completed';
                                const completedCount = item.completedLectures ? item.completedLectures.filter(l => l.status === completionLabel).length : 0;

                                // Use pre-computed totalLectures from optimized API
                                const totalLectures = item.course.totalLectures ?? 0;
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
                    )
                ) : (
                    // Created Courses Tab
                    <div>
                        {/* Create Course Button */}
                        <div className="mb-6">
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-semibold py-2.5 px-5 rounded-lg text-sm flex items-center gap-2 transition-colors"
                            >
                                <FaPlus className="text-xs" /> Create New Course
                            </button>
                        </div>

                        {createdCourses.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {createdCourses.map(course => {
                                    // Use pre-computed totalLectures from optimized API
                                    const totalLectures = course.totalLectures ?? 0;
                                    const sectionCount = course.sectionCount ?? 0;

                                    return (
                                        <div key={course._id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group">
                                            {/* Card Header */}
                                            <div className="h-32 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center relative overflow-hidden">
                                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                                                <FaBook className="text-white/20 text-6xl transform group-hover:scale-110 transition-transform duration-500" />
                                                <div className="absolute bottom-4 left-4 flex gap-2">
                                                    <span className={`backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-white/10 ${
                                                        course.status === 'Published' ? 'bg-green-500/80' :
                                                        course.status === 'Archived' ? 'bg-red-500/80' : 'bg-yellow-500/80'
                                                    }`}>
                                                        {course.status || 'Draft'}
                                                    </span>
                                                </div>
                                                <div className="absolute top-4 right-4 flex gap-2">
                                                    {course.status === 'Published' ? (
                                                        <FaEye className="text-white/60 text-sm" title="Visible to enrolled students" />
                                                    ) : (
                                                        <FaEyeSlash className="text-white/60 text-sm" title="Hidden from students" />
                                                    )}
                                                </div>
                                                <div className="absolute bottom-4 right-4">
                                                    <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-white/10">
                                                        Creator
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-6 flex-1 flex flex-col">
                                                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-2 line-clamp-2 min-h-[3.5rem] transition-colors">
                                                    {course.title}
                                                </h2>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1">
                                                    {course.description || "No description provided."}
                                                </p>

                                                {/* Stats */}
                                                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
                                                    <span className="flex items-center gap-1">
                                                        <FaBook className="text-slate-400" />
                                                        {totalLectures} lectures
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <FaUsers className="text-slate-400" />
                                                        {sectionCount} sections
                                                    </span>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex gap-2">
                                                    <Link
                                                        to={`/admin/course/${course._id}`}
                                                        className="flex-1 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                                                    >
                                                        Manage
                                                    </Link>
                                                    <Link
                                                        to={`/admin/course/${course._id}/students`}
                                                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-semibold py-2.5 px-3 rounded-lg text-sm flex items-center justify-center transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
                                                        title="View Students"
                                                    >
                                                        <FaUsers />
                                                    </Link>
                                                    <Link
                                                        to={`/admin/course/${course._id}/settings`}
                                                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-semibold py-2.5 px-3 rounded-lg text-sm flex items-center justify-center transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
                                                        title="Course Settings"
                                                    >
                                                        <FaCog />
                                                    </Link>
                                                    <button
                                                        onClick={() => openDeleteModal(course)}
                                                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-red-500 hover:text-red-600 hover:border-red-300 dark:hover:border-red-500 font-semibold py-2.5 px-3 rounded-lg text-sm flex items-center justify-center transition-all hover:bg-red-50 dark:hover:bg-red-900/10"
                                                        title="Delete Course"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 border-dashed transition-colors duration-300">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FaBook className="text-slate-300 dark:text-slate-600 text-2xl" />
                                </div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">No courses created yet</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">Create your first course and start teaching!</p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-semibold py-2.5 px-5 rounded-lg text-sm inline-flex items-center gap-2 transition-colors"
                                >
                                    <FaPlus className="text-xs" /> Create Course
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Course Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full border border-gray-200 dark:border-slate-800">
                        <div className="p-6 border-b border-gray-200 dark:border-slate-800">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create New Course</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Fill in the details to create your course</p>
                        </div>
                        <form onSubmit={handleCreateCourse} className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Course Title
                                </label>
                                <input
                                    type="text"
                                    value={newCourse.title}
                                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors"
                                    placeholder="Enter course title"
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={newCourse.description}
                                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors resize-none"
                                    placeholder="Describe your course"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setNewCourse({ title: '', description: '' });
                                    }}
                                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2.5 rounded-lg text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 disabled:bg-slate-400 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
                                >
                                    {creating ? 'Creating...' : 'Create Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Course Modal */}
            {showDeleteModal && courseToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full border border-gray-200 dark:border-slate-800">
                        <div className="p-6 border-b border-gray-200 dark:border-slate-800">
                            <h2 className="text-lg font-bold text-red-600 dark:text-red-400">Delete Course</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">This action cannot be undone</p>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
                                Are you sure you want to delete <span className="font-semibold">"{courseToDelete.title}"</span>?
                                This will permanently remove the course, all its lectures, sections, and enrolled student progress.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setCourseToDelete(null);
                                    }}
                                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2.5 rounded-lg text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteCourse}
                                    disabled={deleting}
                                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
                                >
                                    {deleting ? 'Deleting...' : 'Delete Course'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
