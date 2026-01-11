import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import { FaPlayCircle, FaCheckCircle, FaRegCircle, FaChevronDown, FaChevronUp, FaArrowLeft, FaClock, FaBars, FaTimes, FaStepBackward, FaStepForward } from 'react-icons/fa';
import StatusSelector from '../components/StatusSelector';
import LectureSidebarItem from '../components/LectureSidebarItem';
import toast from 'react-hot-toast';

const CourseView = () => {
    const { id, lectureId } = useParams(); // Get lectureId from URL
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [course, setCourse] = useState(null);
    const [selectedLecture, setSelectedLecture] = useState(null);
    const [progressMap, setProgressMap] = useState({});
    const [isEnrolled, setIsEnrolled] = useState(false);

    // Comments state
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // State to toggle section accordion
    const [expandedSections, setExpandedSections] = useState({});
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Navigation Helpers
    const getFlattenedLectures = () => {
        if (!course || !course.sections) return [];
        return course.sections.flatMap(section => section.lectures || []);
    };

    const handleNextLecture = () => {
        const lectures = getFlattenedLectures();
        const currentIndex = lectures.findIndex(l => l._id === selectedLecture._id);
        if (currentIndex < lectures.length - 1) {
            handleSelectLecture(lectures[currentIndex + 1]);
        }
    };

    const handlePrevLecture = () => {
        const lectures = getFlattenedLectures();
        const currentIndex = lectures.findIndex(l => l._id === selectedLecture._id);
        if (currentIndex > 0) {
            handleSelectLecture(lectures[currentIndex - 1]);
        }
    };

    useEffect(() => {
        if (course) {
            document.title = `StudyTracker | ${course.title}`;
        }
        return () => {
            document.title = 'StudyTracker';
        };
    }, [course]);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await api.get(`/courses/${id}`);
                const courseData = res.data;
                setCourse(courseData);

                // Expand first section by default
                if (courseData.sections && courseData.sections.length > 0) {
                    setExpandedSections({ [courseData.sections[0]._id]: true });
                    // Select first lecture if available
                    if (courseData.sections && courseData.sections.length > 0 && courseData.sections[0].lectures.length > 0) {
                        const firstLec = courseData.sections[0].lectures[0];
                        setSelectedLecture(firstLec);
                        fetchComments(firstLec._id);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchCourse();
    }, [id]);

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const res = await api.get('/courses/my/enrolled');
                const currentCourseProgress = res.data.find(p => p.course._id === id || p.course === id);

                if (currentCourseProgress && currentCourseProgress.completedLectures) {
                    const map = {};
                    currentCourseProgress.completedLectures.forEach(item => {
                        map[item.lecture] = {
                            status: item.status,
                            notes: item.notes,
                            completedAt: item.completedAt
                        };
                    });
                    setProgressMap(map);
                    setIsEnrolled(true);
                } else {
                    setIsEnrolled(false);
                }
            } catch (err) {
                console.error(err);
                setIsEnrolled(false);
            }
        };
        fetchProgress();
    }, [id]);

    const fetchComments = async (lectureId) => {
        try {
            const res = await api.get(`/courses/lectures/${lectureId}/comments`);
            setComments(res.data);
        } catch (err) {
            console.error("Failed to fetch comments");
        }
    };

    const handleSelectLecture = (lecture) => {
        setSelectedLecture(lecture);
        setCurrentPage(1);
        fetchComments(lecture._id);

        // Auto-expand the section containing this lecture
        if (course && course.sections) {
            const section = course.sections.find(s => s.lectures.some(l => l._id === lecture._id));
            if (section) {
                setExpandedSections(prev => ({
                    ...prev,
                    [section._id]: true
                }));
            }
        }
    };

    // Initialize View based on URL or Default
    useEffect(() => {
        if (course && course.sections?.length > 0) {
            let targetLecture = null;
            let targetSectionId = null;

            if (lectureId) {
                // Find specific lecture from URL
                for (const sec of course.sections) {
                    const found = sec.lectures.find(l => l._id === lectureId);
                    if (found) {
                        targetLecture = found;
                        targetSectionId = sec._id;
                        break;
                    }
                }
            }

            // Fallback to first lecture if no URL param or not found
            if (!targetLecture && !selectedLecture) {
                targetLecture = course.sections[0].lectures[0];
                targetSectionId = course.sections[0]._id;
            }

            if (targetLecture && (!selectedLecture || selectedLecture._id !== targetLecture._id)) {
                setSelectedLecture(targetLecture);
                fetchComments(targetLecture._id);
                setExpandedSections(prev => ({ ...prev, [targetSectionId]: true }));
            }
        }
    }, [course, lectureId]);

    const handleUpdateProgress = async (status) => {
        if (!selectedLecture) return;
        if (!isEnrolled) {
            toast.error("You are in Preview Mode (Not Enrolled). Progress cannot be saved.");
            return;
        }
        try {
            const existingNotes = progressMap[selectedLecture._id]?.notes || '';
            const payload = { courseId: id, status, notes: existingNotes };
            await api.put(`/courses/lectures/${selectedLecture._id}/progress`, payload);

            setProgressMap(prev => ({
                ...prev,
                [selectedLecture._id]: { status, notes: existingNotes }
            }));
            toast.success('Progress saved!');
        } catch (err) {
            console.error("Failed to update progress", err);
            toast.error('Failed to save progress');
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            await api.post(`/courses/lectures/${selectedLecture._id}/comments`, {
                content: newComment,
                courseId: id
            });

            setNewComment('');
            fetchComments(selectedLecture._id);
            toast.success('Comment posted!');
        } catch (error) {
            toast.error('Error posting comment');
        }
    };

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    if (!course) return <div className="flex justify-center items-center h-screen text-slate-500 font-medium bg-gray-50 dark:bg-slate-950 dark:text-slate-400">Loading Experience...</div>;

    const currentProgress = selectedLecture ? progressMap[selectedLecture._id] || { status: 'Not Started', notes: '' } : {};


    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-gray-100 font-sans transition-colors duration-300 overflow-hidden">

            {/* Mobile Header */}
            <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-4 flex items-center justify-between z-20 sticky top-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/')} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                        <FaArrowLeft />
                    </button>
                    <h1 className="font-bold text-slate-900 dark:text-white truncate max-w-[200px] text-sm">{course?.title}</h1>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 text-slate-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    {isSidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Mobile Sidebar Overlay (Backdrop) */}
                <div
                    className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    onClick={() => setIsSidebarOpen(false)}
                />

                {/* Sidebar (Sheet-like) */}
                <div className={`
                        absolute lg:static inset-y-0 left-0 z-40 w-[280px] lg:w-80 bg-white dark:bg-slate-900 lg:border-r border-gray-100 dark:border-slate-800 shadow-2xl lg:shadow-none
                        transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col
                        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    `}>
                    <div className="p-4 bg-white dark:bg-slate-900 sticky top-0 z-10 hidden lg:flex items-center gap-3 border-b border-gray-100 dark:border-slate-800">
                        <button onClick={() => navigate('/')} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                            <FaArrowLeft />
                        </button>
                        <h2 className="font-semibold text-slate-900 dark:text-white truncate text-sm" title={course.title}>{course.title}</h2>
                    </div>

                    {/* Mobile Sidebar Header (Close button) */}
                    <div className="lg:hidden p-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-800">
                        <h2 className="font-bold text-slate-900 dark:text-white text-lg">Course Content</h2>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                            <FaTimes size={20} />
                        </button>
                    </div>

                    <div className="px-2 py-2 space-y-1 flex-1 overflow-y-auto">
                        {course.sections && course.sections.map((section) => {
                            // Section Progress Logic
                            const totalSecLectures = section.lectures ? section.lectures.length : 0;
                            const completedSecLectures = section.lectures ? section.lectures.filter(l => progressMap[l._id]?.status === 'Completed').length : 0;
                            const secPercent = totalSecLectures > 0 ? Math.round((completedSecLectures / totalSecLectures) * 100) : 0;

                            return (
                                <div key={section._id}>
                                    <div className="px-2 pt-2 pb-1">
                                        <button
                                            onClick={() => toggleSection(section._id)}
                                            className="w-full flex justify-between items-center group mb-1 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-md p-1 -mx-1 transition-colors"
                                        >
                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">{section.title}</span>
                                            {expandedSections[section._id] ?
                                                <FaChevronUp className="text-[10px] text-slate-400 dark:text-slate-500" /> :
                                                <FaChevronDown className="text-[10px] text-slate-400 dark:text-slate-500" />
                                            }
                                        </button>
                                        <div className="h-0.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden w-full mb-2">
                                            <div
                                                className="h-full bg-slate-900 dark:bg-blue-600 transition-all duration-500"
                                                style={{ width: `${secPercent}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {expandedSections[section._id] && (
                                        <div className="space-y-0.5 mt-0 mb-3 ml-2 border-l border-gray-100 dark:border-slate-800 pl-2">
                                            {section.lectures.map((lec) => {
                                                const status = progressMap[lec._id]?.status || 'Not Started';
                                                const isSelected = selectedLecture && selectedLecture._id === lec._id;

                                                return (
                                                    <LectureSidebarItem
                                                        key={lec._id}
                                                        lecture={lec}
                                                        isSelected={isSelected}
                                                        onClick={() => {
                                                            handleSelectLecture(lec);
                                                            setIsSidebarOpen(false); // Close sidebar on mobile selection
                                                        }}
                                                        status={status}
                                                        showStatus={true}
                                                    />
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 transition-colors duration-300 w-full">
                    {selectedLecture ? (
                        <div className="max-w-6xl mx-auto">
                            {/* Video Player Container */}
                            <div className="bg-black w-full max-w-4xl mx-auto aspect-video relative group shadow-2xl z-10 lg:rounded-lg lg:mt-6 overflow-hidden">
                                {selectedLecture.resourceUrl ? (
                                    selectedLecture.resourceUrl.includes('youtube') || selectedLecture.resourceUrl.includes('youtu.be') ? (
                                        <iframe
                                            src={selectedLecture.resourceUrl.replace('watch?v=', 'embed/').split('&')[0]}
                                            className="w-full h-full"
                                            frameBorder="0"
                                            allowFullScreen
                                            title="Video"
                                        ></iframe>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                                            <a href={selectedLecture.resourceUrl} target="_blank" rel="noreferrer" className="text-white hover:text-blue-400 flex flex-col items-center gap-3 transition-colors">
                                                <FaPlayCircle size={64} />
                                                <span className="text-lg font-medium">Open External Resource</span>
                                            </a>
                                        </div>
                                    )
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-slate-500 flex-col">
                                        <span className="text-6xl mb-4">📚</span>
                                        <span className="font-medium">No Video Resource</span>
                                    </div>
                                )}
                            </div>

                            {/* Video Controls (Next/Prev) */}
                            <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center border-b border-gray-100 dark:border-slate-800 lg:border-none">
                                <button
                                    onClick={handlePrevLecture}
                                    disabled={getFlattenedLectures().findIndex(l => l._id === selectedLecture._id) === 0}
                                    className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <FaStepBackward /> Previous
                                </button>
                                <button
                                    onClick={handleNextLecture}
                                    disabled={getFlattenedLectures().findIndex(l => l._id === selectedLecture._id) === getFlattenedLectures().length - 1}
                                    className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next <FaStepForward />
                                </button>
                            </div>

                            {/* Lecture Details & Comments Layout */}
                            <div className="max-w-4xl mx-auto px-6 py-4 grid grid-cols-1 lg:grid-cols-3 gap-12">

                                {/* Left Col: Details (2/3) */}
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="space-y-4 border-b border-gray-100 dark:border-slate-800 pb-8">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                            <div className="space-y-2">
                                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">{selectedLecture.title}</h1>
                                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Lecture {selectedLecture.number}</p>
                                            </div>
                                        </div>

                                        {/* Action Bar */}
                                        <div className="flex items-center gap-4 pt-2">
                                            <StatusSelector
                                                status={currentProgress.status}
                                                onChange={handleUpdateProgress}
                                                disabled={!isEnrolled}
                                            />

                                            {selectedLecture.dueDate && (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400">
                                                    <FaClock size={12} />
                                                    <span>Due: {new Date(selectedLecture.dueDate).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="prose prose-sm prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed pt-2">
                                            <p>{selectedLecture.description || <span className="italic text-slate-400">No description available.</span>}</p>
                                        </div>
                                    </div>

                                    {/* Comments Section */}
                                    <div className="space-y-6">
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                                            {comments.length} Comments
                                        </h3>

                                        {/* Input */}
                                        <form onSubmit={handleAddComment} className="flex gap-4 items-start mb-8">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400 uppercase shrink-0">
                                                {user?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <input
                                                    type="text"
                                                    className="w-full border-b border-gray-200 dark:border-slate-700 bg-transparent px-0 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white transition-colors placeholder:text-slate-400"
                                                    placeholder="Add a comment..."
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                />
                                                <div className="flex justify-end">
                                                    <button
                                                        type="submit"
                                                        disabled={!newComment.trim()}
                                                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2 rounded-full text-xs font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                    >
                                                        Comment
                                                    </button>
                                                </div>
                                            </div>
                                        </form>

                                        {/* List */}
                                        <div className="space-y-6">
                                            {comments.length > 0 ? (
                                                <>
                                                    {comments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((comment) => (
                                                        <div key={comment._id} className="flex gap-4 group">
                                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0 uppercase">
                                                                {comment.student?.name?.charAt(0) || '?'}
                                                            </div>
                                                            <div className="flex-1 space-y-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                        {comment.student?._id === user?._id ? 'You' : comment.student?.name || 'Unknown'}
                                                                    </span>
                                                                    <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{comment.details}</p>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Pagination Controls */}
                                                    {Math.ceil(comments.length / itemsPerPage) > 1 && (
                                                        <div className="flex justify-start items-center gap-4 pt-4 mt-6">
                                                            <button
                                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                                disabled={currentPage === 1}
                                                                className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors"
                                                            >
                                                                Previous
                                                            </button>
                                                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                                                Page {currentPage} of {Math.ceil(comments.length / itemsPerPage)}
                                                            </span>
                                                            <button
                                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(comments.length / itemsPerPage)))}
                                                                disabled={currentPage === Math.ceil(comments.length / itemsPerPage)}
                                                                className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors"
                                                            >
                                                                Next
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="py-6">
                                                    <p className="text-sm text-slate-400 dark:text-slate-500 italic">No comments yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Col: Placeholder for future or just spacing (1/3) */}
                                {/* Could put related lectures here, or notes, etc. For now leaving empty to let content breathe */}
                                <div className="hidden lg:block">
                                    {/* Optional: Notes or Transcript placeholder could go here */}
                                </div>

                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col justify-center items-center h-full text-slate-400 dark:text-slate-500 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl">👈</div>
                            <p className="text-lg font-medium text-slate-600 dark:text-slate-400">Select a lecture from the sidebar to start learning.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseView;
