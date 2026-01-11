import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import { FaPlayCircle, FaCheckCircle, FaRegCircle, FaChevronDown, FaChevronUp, FaArrowLeft, FaClock, FaBars, FaTimes, FaStepBackward, FaStepForward, FaStickyNote, FaSave } from 'react-icons/fa';
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
    const [notes, setNotes] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
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

        // Sync Notes from progress map
        const lectureProgress = progressMap[lecture._id];
        setNotes(lectureProgress?.notes || '');

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
                        setNotes(progressMap[found._id]?.notes || '');
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

    const handleSaveNotes = async () => {
        if (!selectedLecture || isSavingNotes) return;
        setIsSavingNotes(true);
        try {
            await api.put(`/courses/lectures/${selectedLecture._id}/progress`, {
                notes: notes
            });

            // Update local progress map
            setProgressMap(prev => ({
                ...prev,
                [selectedLecture._id]: {
                    ...prev[selectedLecture._id],
                    notes: notes
                }
            }));
            toast.success('Notes saved!');
        } catch (error) {
            toast.error('Failed to save notes');
        } finally {
            setIsSavingNotes(false);
        }
    };

    const handleUpdateProgress = async (newStatus) => {
        if (!selectedLecture) return;
        if (!isEnrolled) {
            toast.error("You are in Preview Mode (Not Enrolled). Progress cannot be saved.");
            return;
        }
        try {
            const existingNotes = progressMap[selectedLecture._id]?.notes || '';
            const payload = { courseId: id, status: newStatus, notes: existingNotes };
            await api.put(`/courses/lectures/${selectedLecture._id}/progress`, payload);

            setProgressMap(prev => ({
                ...prev,
                [selectedLecture._id]: { status: newStatus, notes: existingNotes }
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
            <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-3 flex items-center justify-between z-20 sticky top-0">
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
                    <div className="p-3 bg-white dark:bg-slate-900 sticky top-0 z-10 hidden lg:flex items-center gap-3 border-b border-gray-100 dark:border-slate-800">
                        <button onClick={() => navigate('/')} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                            <FaArrowLeft />
                        </button>
                        <h2 className="font-semibold text-slate-900 dark:text-white truncate text-sm" title={course.title}>{course.title}</h2>
                    </div>

                    {/* Mobile Sidebar Header (Close button) */}
                    <div className="lg:hidden p-3 flex items-center justify-between border-b border-gray-100 dark:border-slate-800">
                        <h2 className="font-bold text-slate-900 dark:text-white text-lg">Course Content</h2>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                            <FaTimes size={20} />
                        </button>
                    </div>

                    <div className="px-1 py-1 space-y-0.5 flex-1 overflow-y-auto">
                        {course.sections && course.sections.map((section) => {
                            // Section Progress Logic
                            const totalSecLectures = section.lectures ? section.lectures.length : 0;
                            const completionLabel = course.completedStatus || 'Completed';
                            const completedSecLectures = section.lectures ? section.lectures.filter(l => progressMap[l._id]?.status === completionLabel).length : 0;
                            const secPercent = totalSecLectures > 0 ? Math.round((completedSecLectures / totalSecLectures) * 100) : 0;

                            return (
                                <div key={section._id}>
                                    <div className="px-2 pt-1 pb-0.5">
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
                                                        customStatuses={course?.lectureStatuses}
                                                        completedStatus={course?.completedStatus}
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
                        <div className="max-w-7xl mx-auto">
                            {/* Video Player Container */}
                            <div className="bg-black w-full max-w-4xl mx-auto aspect-video relative group shadow-2xl z-10 lg:rounded-lg lg:mt-4 overflow-hidden">
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
                            <div className="max-w-7xl mx-auto px-6 py-2 flex justify-between items-center">
                                <button
                                    onClick={handlePrevLecture}
                                    disabled={getFlattenedLectures().findIndex(l => l._id === selectedLecture._id) === 0}
                                    className="group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-gray-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                                >
                                    <FaStepBackward className="group-hover:-translate-x-0.5 transition-transform" />
                                    <span>Previous</span>
                                </button>

                                <button
                                    onClick={handleNextLecture}
                                    disabled={getFlattenedLectures().findIndex(l => l._id === selectedLecture._id) === getFlattenedLectures().length - 1}
                                    className="group flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl shadow-slate-200 dark:shadow-white/5 hover:bg-slate-800 dark:hover:bg-slate-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-20 disabled:scale-100 disabled:cursor-not-allowed transition-all"
                                >
                                    <span>Next Lecture</span>
                                    <FaStepForward className="group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </div>

                            {/* Lecture Details & Comments Layout */}
                            <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-1 lg:grid-cols-3 gap-8">

                                {/* Left Col: Details (2/3) */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="space-y-4 border-b border-gray-100 dark:border-slate-800 pb-6">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">{selectedLecture.title}</h1>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Lecture {selectedLecture.number}</p>
                                                    {selectedLecture.resourceUrl && (
                                                        <a
                                                            href={selectedLecture.resourceUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-[11px] font-bold transition-all border border-blue-100 dark:border-blue-800/50 shadow-sm"
                                                        >
                                                            <FaPlayCircle className="text-blue-500" />
                                                            <span>Open Original Video URL</span>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Bar */}
                                        <div className="flex items-center gap-4 pt-2">
                                            <StatusSelector
                                                status={currentProgress.status}
                                                onChange={handleUpdateProgress}
                                                disabled={!isEnrolled}
                                                customStatuses={course?.lectureStatuses}
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
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                                            {comments.length} Comments
                                        </h3>

                                        {/* Input */}
                                        <form onSubmit={handleAddComment} className="flex gap-4 items-start mb-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400 uppercase shrink-0">
                                                {user?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="flex-1 flex gap-3 items-center border-b border-gray-200 dark:border-slate-700 pb-1">
                                                <input
                                                    type="text"
                                                    className="flex-1 bg-transparent px-0 py-2 text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
                                                    placeholder="Add a comment..."
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={!newComment.trim()}
                                                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-1.5 rounded-full text-[10px] font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap shrink-0"
                                                >
                                                    Comment
                                                </button>
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

                                {/* Right Col: Personal Study Notes (1/3) */}
                                <div className="space-y-4">
                                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-gray-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none sticky top-36 transition-all duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center border border-amber-100 dark:border-amber-900/10">
                                                    <FaStickyNote className="text-amber-500" size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 dark:text-white leading-none">Personal Notes</h3>
                                                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Only you can see this</p>
                                                </div>
                                            </div>
                                        </div>

                                        <textarea
                                            className="w-full h-[300px] md:h-[450px] bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-5 md:p-6 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-800 transition-all resize-none placeholder:text-slate-400 border border-transparent focus:border-slate-200 dark:focus:border-slate-800 leading-relaxed"
                                            placeholder="Write your study notes here... use this space for timestamps, key takeaways, or reminders."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        ></textarea>

                                        <div className="mt-6 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                    Character Count
                                                </span>
                                                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                                    {notes.length.toLocaleString()}
                                                </span>
                                            </div>
                                            <button
                                                onClick={handleSaveNotes}
                                                disabled={isSavingNotes}
                                                className="group flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl text-xs font-bold hover:shadow-2xl hover:shadow-slate-500/20 active:scale-95 disabled:opacity-50 transition-all duration-300"
                                            >
                                                {isSavingNotes ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                                        <span>Syncing...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaSave className="group-hover:scale-110 transition-transform" />
                                                        <span>Save Records</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
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
