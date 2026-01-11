import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { FaArrowLeft, FaEdit, FaTrash, FaTimes, FaPlayCircle, FaCheckCircle, FaCircle, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const AdminLectureView = () => {
    const { courseId, lectureId } = useParams();
    const navigate = useNavigate();
    const [lecture, setLecture] = useState(null);
    const [course, setCourse] = useState(null);
    const [progresses, setProgresses] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [comments, setComments] = useState([]);

    // Stats and Tabs
    const [studentStatuses, setStudentStatuses] = useState([]);
    const [activeTab, setActiveTab] = useState('All');

    // Pagination State
    const [progressPage, setProgressPage] = useState(1);
    const [commentsPage, setCommentsPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        fetchCourseAndProgress();
        fetchLecture();
        fetchComments();
    }, [lectureId]);

    const fetchCourseAndProgress = async () => {
        try {
            const courseRes = await api.get(`/courses/${courseId}`);
            setCourse(courseRes.data);

            const progRes = await api.get(`/courses/${courseId}/progresses`);
            setProgresses(progRes.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (progresses.length > 0) {
            const statuses = progresses.map(p => {
                const lectures = p.lectures || [];
                const lecProgress = lectures.find(l => l.lecture === lectureId);
                return {
                    student: p.student,
                    status: lecProgress ? lecProgress.status : 'Not Started'
                };
            });
            setStudentStatuses(statuses);
        }
    }, [progresses, lectureId]);

    const fetchLecture = async () => {
        try {
            const res = await api.get(`/courses/lectures/${lectureId}`);
            setLecture(res.data);
            setFormData({
                title: res.data.title,
                number: res.data.number,
                resourceUrl: res.data.resourceUrl,
                description: res.data.description,
                dueDate: res.data.dueDate ? res.data.dueDate.split('T')[0] : ''
            });
        } catch (error) {
            console.error(error);
        }
    };

    const fetchComments = async () => {
        try {
            const res = await api.get(`/courses/lectures/${lectureId}/comments`);
            setComments(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/courses/lectures/${lectureId}`, formData);
            setIsEditing(false);
            fetchLecture();
            alert('Lecture Updated');
        } catch (error) {
            alert('Error updating lecture');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Delete this lecture permanently?")) return;
        try {
            await api.delete(`/courses/lectures/${lectureId}`);
            navigate(`/admin/course/${courseId}`);
            alert('Lecture Deleted');
        } catch (error) {
            alert('Error deleting lecture');
        }
    };

    // Filter Logic
    const filteredStudents = studentStatuses.filter(stat => {
        if (activeTab === 'All') return true;
        return stat.status === activeTab;
    });

    // Pagination Logic
    const totalProgressPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedStudents = filteredStudents.slice((progressPage - 1) * itemsPerPage, progressPage * itemsPerPage);

    const getCount = (status) => {
        if (status === 'All') return studentStatuses.length;
        return studentStatuses.filter(s => s.status === status).length;
    };

    if (!lecture) return <div className="p-8 text-primary font-medium">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 text-slate-900 pb-12">
            {/* Header / Nav */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 w-full">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate(`/admin/course/${courseId}`)}
                        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <FaArrowLeft /> Back to Course
                    </button>
                    <div className="flex gap-2">
                        {!isEditing ? (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    <FaEdit className="text-slate-500" /> Edit
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center gap-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    <FaTrash /> Delete
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-slate-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                            >
                                <FaTimes /> Cancel
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-12 gap-6">

                    {/* LEFT COLUMN: Navigation (2 cols) */}
                    <div className="col-span-12 md:col-span-2 space-y-6 hidden md:block">
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden sticky top-24">
                            <div className="bg-gray-50/50 px-3 py-2 border-b border-gray-200">
                                <h3 className="font-semibold text-xs text-slate-500 uppercase tracking-wider">Course Map</h3>
                            </div>
                            <div className="p-2 max-h-[calc(100vh-150px)] overflow-y-auto custom-scrollbar">
                                {course && course.sections.map(section => (
                                    <div key={section._id} className="mb-3 last:mb-0">
                                        <h4 className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase">{section.title}</h4>
                                        <div className="space-y-0.5">
                                            {section.lectures.map(lec => (
                                                <button
                                                    key={lec._id}
                                                    onClick={() => navigate(`/admin/course/${courseId}/lecture/${lec._id}`)}
                                                    className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between group ${lec._id === lectureId
                                                        ? 'bg-slate-900 text-white font-medium'
                                                        : 'text-slate-600 hover:bg-gray-100 hover:text-slate-900'
                                                        }`}
                                                >
                                                    <span className="truncate w-full">{lec.number}. {lec.title}</span>
                                                    {lec._id === lectureId && <FaPlayCircle className="text-[10px] shrink-0 ml-1 opacity-70" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* CENTER COLUMN: Content (7 cols) */}
                    <div className="col-span-12 md:col-span-7 space-y-6">

                        {/* Video Player Card */}
                        <div className="flex justify-center">
                            <div className="w-full max-w-2xl bg-black rounded-xl aspect-video shadow-sm relative overflow-hidden group border border-gray-800">
                                {lecture.resourceUrl && (lecture.resourceUrl.includes('youtube') || lecture.resourceUrl.includes('youtu.be')) ? (
                                    <iframe
                                        src={lecture.resourceUrl.replace('watch?v=', 'embed/').split('&')[0]}
                                        className="w-full h-full"
                                        frameBorder="0"
                                        allowFullScreen
                                        title="Video"
                                    ></iframe>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                                        {lecture.resourceUrl ? (
                                            <a href={lecture.resourceUrl} target="_blank" rel="noreferrer" className="text-white hover:text-blue-400 flex flex-col items-center gap-3 transition-colors">
                                                <FaPlayCircle size={64} />
                                                <span className="text-lg font-medium">Open External Resource</span>
                                            </a>
                                        ) : (
                                            <div className="text-slate-500 flex flex-col items-center">
                                                <span className="text-6xl mb-4">📚</span>
                                                <span className="font-medium">No Video Resource</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Lecture Details / Edit Form */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                            {isEditing ? (
                                <form onSubmit={handleUpdate} className="p-6">
                                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Edit Details</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-slate-700">Title</label>
                                            <input
                                                type="text"
                                                className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-slate-700">Number</label>
                                            <input
                                                type="number"
                                                className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                                                value={formData.number}
                                                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="text-xs font-medium text-slate-700">URL</label>
                                            <input
                                                type="url"
                                                className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                                                value={formData.resourceUrl}
                                                onChange={(e) => setFormData({ ...formData, resourceUrl: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="text-xs font-medium text-slate-700">Description</label>
                                            <textarea
                                                className="w-full min-h-[100px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-slate-700">Due Date</label>
                                            <input
                                                type="date"
                                                className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                                                value={formData.dueDate}
                                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded-md text-sm font-medium hover:bg-slate-800">
                                        Save Changes
                                    </button>
                                </form>
                            ) : (
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h1 className="text-xl font-bold text-slate-900">{lecture.title}</h1>
                                            <p className="text-sm text-slate-500 mt-1">Lecture {lecture.number}</p>
                                        </div>
                                        {lecture.dueDate && (
                                            <div className="text-right">
                                                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-md">
                                                    Due {new Date(lecture.dueDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="prose prose-sm max-w-none text-slate-600">
                                        <p>{lecture.description || 'No description provided.'}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Comments */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                                <h3 className="font-semibold text-sm text-slate-900">Discussion ({comments.length})</h3>
                            </div>
                            <div className="p-6 space-y-6">
                                {comments.length > 0 ? (
                                    <>
                                        {comments.slice((commentsPage - 1) * itemsPerPage, commentsPage * itemsPerPage).map((comment) => (
                                            <div key={comment._id} className="flex gap-4">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0 uppercase border border-slate-200">
                                                    {comment.student?.name?.charAt(0) || '?'}
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold text-slate-900">{comment.student?.name || 'Unknown'}</span>
                                                        <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 leading-relaxed">{comment.details}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Comments Pagination */}
                                        {Math.ceil(comments.length / itemsPerPage) > 1 && (
                                            <div className="flex justify-center items-center gap-4 pt-4 border-t border-gray-100 mt-2">
                                                <button
                                                    onClick={() => setCommentsPage(prev => Math.max(prev - 1, 1))}
                                                    disabled={commentsPage === 1}
                                                    className="text-xs font-medium text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
                                                >
                                                    Previous
                                                </button>
                                                <span className="text-xs text-slate-400">
                                                    Page {commentsPage} of {Math.ceil(comments.length / itemsPerPage)}
                                                </span>
                                                <button
                                                    onClick={() => setCommentsPage(prev => Math.min(prev + 1, Math.ceil(comments.length / itemsPerPage)))}
                                                    disabled={commentsPage === Math.ceil(comments.length / itemsPerPage)}
                                                    className="text-xs font-medium text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-slate-400 text-sm">No comments yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Student Progress (3 cols) */}
                    <div className="col-span-12 md:col-span-3 space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden sticky top-24">
                            <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-200">
                                <h3 className="font-semibold text-sm text-slate-900">Student Progress</h3>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-gray-200">
                                {['All', 'Not Started', 'In Progress', 'Completed'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => { setActiveTab(tab); setProgressPage(1); }}
                                        className={`flex-1 py-2 text-[10px] font-medium text-center border-b-2 transition-colors ${activeTab === tab
                                            ? 'border-slate-900 text-slate-900 bg-slate-50'
                                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="leading-tight">{tab}</div>
                                        <span className="text-[9px] text-slate-400">({getCount(tab)})</span>
                                    </button>
                                ))}
                            </div>

                            {/* List */}
                            <div className="divide-y divide-gray-100 min-h-[300px]">
                                {paginatedStudents.length > 0 ? (
                                    paginatedStudents.map((stat, idx) => (
                                        <div key={idx} className="p-3 hover:bg-gray-50 transition-colors flex justify-between items-center group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 uppercase border border-slate-200">
                                                    {stat.student?.name?.charAt(0) || '?'}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-xs font-semibold text-slate-900 truncate w-32">{stat.student?.name}</p>
                                                    <p className="text-[10px] text-slate-400 truncate w-32">{stat.student?.email}</p>
                                                </div>
                                            </div>

                                            <div className="shrink-0">
                                                {stat.status === 'Completed' && <FaCheckCircle className="text-green-500 text-sm" title="Completed" />}
                                                {stat.status === 'In Progress' && <FaPlayCircle className="text-amber-500 text-sm" title="In Progress" />}
                                                {stat.status === 'Not Started' && <FaCircle className="text-gray-300 text-xs" title="Not Started" />}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center">
                                        <p className="text-xs text-slate-400 italic">No students found.</p>
                                    </div>
                                )}
                            </div>

                            {/* Pagination */}
                            {totalProgressPages > 1 && (
                                <div className="border-t border-gray-200 p-3 flex justify-between items-center bg-gray-50/50">
                                    <button
                                        disabled={progressPage === 1}
                                        onClick={() => setProgressPage(prev => Math.max(prev - 1, 1))}
                                        className="p-1.5 rounded hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all text-slate-500"
                                    >
                                        <FaChevronLeft size={12} />
                                    </button>
                                    <span className="text-[10px] font-medium text-slate-500">
                                        Page {progressPage} of {totalProgressPages}
                                    </span>
                                    <button
                                        disabled={progressPage === totalProgressPages}
                                        onClick={() => setProgressPage(prev => Math.min(prev + 1, totalProgressPages))}
                                        className="p-1.5 rounded hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all text-slate-500"
                                    >
                                        <FaChevronRight size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdminLectureView;
