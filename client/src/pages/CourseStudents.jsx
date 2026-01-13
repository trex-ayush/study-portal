import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { FaArrowLeft, FaSearch, FaTrash, FaUserPlus, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import toast from 'react-hot-toast';

const CourseStudents = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination & Search
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [keyword, setKeyword] = useState('');
    const [debouncedKeyword, setDebouncedKeyword] = useState('');
    const limit = 10;

    // Enroll State
    const [enrollEmail, setEnrollEmail] = useState('');
    const [isEnrolling, setIsEnrolling] = useState(false);

    useEffect(() => {
        const fetchCourseInfo = async () => {
            try {
                const res = await api.get(`/courses/${id}`);
                setCourse(res.data);
            } catch (err) {
                toast.error('Failed to load course info');
            }
        };
        fetchCourseInfo();
    }, [id]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(keyword);
            setPage(1); // Reset to page 1 on search change
        }, 500);
        return () => clearTimeout(timer);
    }, [keyword]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            // Updated API call with pagination
            const res = await api.get(`/courses/${id}/progresses?page=${page}&limit=${limit}&keyword=${debouncedKeyword}`);
            setStudents(res.data.progresses);
            setTotalPages(res.data.pages);
            setLoading(false);
        } catch (err) {
            console.error(err);
            toast.error('Failed to fetch students');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [id, page, debouncedKeyword]);

    const handleEnroll = async (e) => {
        e.preventDefault();
        setIsEnrolling(true);
        try {
            await api.post(`/courses/${id}/enroll`, { email: enrollEmail });
            setEnrollEmail('');
            toast.success('Student enrolled successfully');
            fetchStudents();
        } catch (error) {
            if (!error.handled) {
                toast.error(error.response?.data?.message || 'Error enrolling student');
            }
        } finally {
            setIsEnrolling(false);
        }
    };

    const handleRemoveStudent = async (studentId, studentName) => {
        if (!window.confirm(`Are you sure you want to remove ${studentName} from this course? Progress will be lost.`)) return;

        try {
            await api.delete(`/courses/${id}/enroll/${studentId}`);
            toast.success('Student removed from course');
            fetchStudents();
        } catch (error) {
            if (!error.handled) {
                toast.error('Failed to remove student');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-gray-100 pb-12 transition-colors duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-16 z-10 transition-colors">
                <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(`/admin/course/${id}`)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
                        >
                            <FaArrowLeft />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Manage Students</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{course?.title}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left: Student List */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Search & Stats */}
                        <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                            <div className="relative flex-1">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 transition-colors"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 dark:bg-slate-950/50 border-b border-gray-100 dark:border-slate-800 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                                            <th className="px-6 py-4">Student</th>
                                            <th className="px-6 py-4">Enrolled Date</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                        {loading ? (
                                            <tr><td colSpan="3" className="px-6 py-8 text-center text-xs text-slate-400">Loading...</td></tr>
                                        ) : students.length > 0 ? (
                                            students.map((prog) => (
                                                <tr key={prog._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200 dark:border-slate-700 uppercase">
                                                                {prog.student?.name?.charAt(0) || '?'}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{prog.student?.name}</p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400">{prog.student?.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-slate-500">
                                                        {new Date(prog.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleRemoveStudent(prog.student?._id, prog.student?.name)}
                                                            className="text-red-400 hover:text-red-600 dark:hover:text-red-400 p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                            title="Remove Student"
                                                        >
                                                            <FaTrash size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="3" className="px-6 py-8 text-center text-xs text-slate-400">No students found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <FaChevronLeft size={12} />
                                    </button>
                                    <span className="text-xs text-slate-500 font-medium">Page {page} of {totalPages}</span>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <FaChevronRight size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Enroll Form */}
                    <div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-6 sticky top-40 transition-colors">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <FaUserPlus className="text-slate-400 dark:text-slate-500" /> Enroll New Student
                            </h2>
                            <form onSubmit={handleEnroll} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Student Email</label>
                                    <input
                                        type="email"
                                        className="w-full rounded-md border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400 transition-colors"
                                        value={enrollEmail}
                                        onChange={(e) => setEnrollEmail(e.target.value)}
                                        placeholder="student@example.com"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isEnrolling}
                                    className="w-full bg-slate-900 dark:bg-blue-600 text-white py-2.5 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-slate-800 dark:hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    {isEnrolling ? 'Enrolling...' : 'Invite User'}
                                </button>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                                    The user will be immediately enrolled in this course. They must already have an account on the platform.
                                </p>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CourseStudents;
