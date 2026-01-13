import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { FaEye, FaEyeSlash, FaEdit, FaTrash, FaChevronDown, FaBook, FaCog, FaUsers, FaBullhorn, FaUserTie, FaTimes, FaSignOutAlt, FaChartBar, FaClipboardList } from 'react-icons/fa';
import Modal from '../components/Modal';
import BroadcastList from '../components/BroadcastList';
import TeacherManagement from '../components/TeacherManagement';
import toast from 'react-hot-toast';
import AuthContext from '../context/AuthContext';

const CourseManage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useContext(AuthContext);

    // Active tab from URL or default to 'curriculum'
    const activeTab = searchParams.get('tab') || 'curriculum';

    const [course, setCourse] = useState(null);
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [newSectionIsPublic, setNewSectionIsPublic] = useState(true);
    const [expandedSections, setExpandedSections] = useState({});

    // Section State
    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
    const [editingSectionId, setEditingSectionId] = useState(null);

    // Lecture State
    const [isLectureModalOpen, setIsLectureModalOpen] = useState(false);
    const [activeSectionId, setActiveSectionId] = useState(null);
    const [editingLectureId, setEditingLectureId] = useState(null);
    const [newLecture, setNewLecture] = useState({ title: '', number: '', resourceUrl: '', description: '', dueDate: '', status: 'Pending', isPublic: true });

    // Students State
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [studentsLoaded, setStudentsLoaded] = useState(false);

    // Broadcast State
    const [broadcasts, setBroadcasts] = useState([]);
    const [broadcastsLoaded, setBroadcastsLoaded] = useState(false);
    const [allowStudentBroadcasts, setAllowStudentBroadcasts] = useState(false);
    const [broadcastPage, setBroadcastPage] = useState(1);
    const [broadcastPagination, setBroadcastPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [unreadBroadcastCount, setUnreadBroadcastCount] = useState(0);

    // User permissions state
    const [userPermissions, setUserPermissions] = useState({
        isAdmin: false,
        isCreator: false,
        isTeacher: false,
        permissions: {
            manage_content: false,
            manage_students: false,
            full_access: false,
            manage_teachers: false
        }
    });

    // Check if user can manage teachers
    const canManageTeachers = userPermissions.isAdmin || userPermissions.isCreator ||
        userPermissions.permissions.manage_teachers || userPermissions.permissions.full_access;

    // Check if user is owner (admin or creator)
    const isOwner = userPermissions.isAdmin || userPermissions.isCreator;

    // State for dismissing teacher permissions banner
    const [showPermissionsBanner, setShowPermissionsBanner] = useState(true);

    // Tab configuration - Curriculum, Broadcasts, Students, Teachers
    const tabs = [
        { id: 'curriculum', label: 'Curriculum', icon: FaBook },
        { id: 'broadcasts', label: 'Broadcasts', icon: FaBullhorn },
        { id: 'students', label: 'Students', icon: FaUsers },
        { id: 'teachers', label: 'Teachers', icon: FaUserTie },
    ];

    const setActiveTab = (tabId) => {
        setSearchParams({ tab: tabId });
    };

    // Fetch course data (always needed for header)
    const fetchCourse = async () => {
        try {
            const res = await api.get(`/courses/${id}`);
            setCourse(res.data);
            // Initialize expanded sections - only first section expanded by default
            if (res.data.sections && res.data.sections.length > 0) {
                const initialExpanded = {};
                res.data.sections.forEach((section, index) => {
                    initialExpanded[section._id] = index === 0; // Only first section expanded
                });
                setExpandedSections(initialExpanded);
            }
        } catch (err) {
            console.error("Failed to fetch course", err);
        }
    };

    // Fetch students (lazy load)
    const fetchStudents = async () => {
        if (studentsLoaded) return;
        try {
            const res = await api.get(`/courses/${id}/progresses`);
            setEnrolledStudents(res.data);
            setStudentsLoaded(true);
        } catch (err) {
            console.error("Failed to fetch students", err);
        }
    };

    // Fetch broadcasts (lazy load)
    const fetchBroadcasts = async (page = 1) => {
        try {
            const res = await api.get(`/broadcasts/course/${id}?page=${page}&limit=5`);
            setBroadcasts(res.data.broadcasts);
            setBroadcastPagination(res.data.pagination);
            setBroadcastPage(page);
            setBroadcastsLoaded(true);
        } catch (err) {
            console.error("Failed to fetch broadcasts", err);
        }
    };

    const fetchBroadcastSettings = async () => {
        try {
            const res = await api.get(`/broadcasts/course/${id}/can-broadcast`);
            setAllowStudentBroadcasts(res.data.allowStudentBroadcasts || false);
        } catch (err) {
            console.error("Failed to fetch broadcast settings", err);
        }
    };

    // Fetch unread broadcast count
    const fetchUnreadCount = async () => {
        try {
            const res = await api.get(`/broadcasts/course/${id}/unread-count`);
            setUnreadBroadcastCount(res.data.unreadCount || 0);
        } catch (err) {
            console.error("Failed to fetch unread count", err);
        }
    };

    // Mark broadcasts as read
    const markBroadcastsAsRead = async () => {
        try {
            await api.post(`/broadcasts/course/${id}/mark-read`);
            setUnreadBroadcastCount(0);
        } catch (err) {
            console.error("Failed to mark broadcasts as read", err);
        }
    };

    // Fetch user permissions for this course
    const fetchUserPermissions = async () => {
        try {
            const res = await api.get(`/courses/${id}/my-permissions`);
            setUserPermissions(res.data);
        } catch (err) {
            console.error("Failed to fetch user permissions", err);
        }
    };

    // Initial load - fetch course, unread count, and permissions
    useEffect(() => {
        fetchCourse();
        fetchUnreadCount();
        fetchUserPermissions();
    }, [id]);

    // Lazy load data based on active tab
    useEffect(() => {
        if (activeTab === 'students' && !studentsLoaded) {
            fetchStudents();
        }
        if (activeTab === 'broadcasts') {
            if (!broadcastsLoaded) {
                fetchBroadcasts();
                fetchBroadcastSettings();
            }
            // Mark broadcasts as read when viewing the tab
            if (unreadBroadcastCount > 0) {
                markBroadcastsAsRead();
            }
        }
    }, [activeTab, studentsLoaded, broadcastsLoaded, unreadBroadcastCount]);

    const handleSaveSection = async (e) => {
        e.preventDefault();
        try {
            if (editingSectionId) {
                await api.put(`/courses/${id}/sections/${editingSectionId}`, { title: newSectionTitle, isPublic: newSectionIsPublic });
            } else {
                await api.post(`/courses/${id}/sections`, { title: newSectionTitle, isPublic: newSectionIsPublic });
            }
            setNewSectionTitle('');
            setNewSectionIsPublic(true);
            setEditingSectionId(null);
            fetchCourse();
            toast.success(editingSectionId ? 'Section updated!' : 'Section added!');
        } catch (error) {
            toast.error('Error saving section');
        }
    };

    const handleDeleteSection = async (sectionId) => {
        if (!window.confirm('Are you sure? This will delete the section and ALL its lectures.')) return;
        try {
            await api.delete(`/courses/${id}/sections/${sectionId}`);
            fetchCourse();
            toast.success('Section deleted');
        } catch (error) {
            toast.error('Error deleting section');
        }
    };

    const handleSaveLecture = async (e) => {
        e.preventDefault();
        try {
            if (editingLectureId) {
                await api.put(`/courses/lectures/${editingLectureId}`, newLecture);
            } else {
                if (!activeSectionId) return alert('Select a section first');
                await api.post(`/courses/${id}/sections/${activeSectionId}/lectures`, newLecture);
            }

            setNewLecture({ title: '', number: '', resourceUrl: '', description: '', dueDate: '', status: 'Pending', isPublic: true });
            setActiveSectionId(null);
            setEditingLectureId(null);
            fetchCourse();
            toast.success(editingLectureId ? 'Lecture updated!' : 'Lecture added!');
        } catch (error) {
            if (!error.handled) {
                toast.error(error.response?.data?.message || 'Error saving lecture');
            }
        }
    };

    const handleEditClick = (lec, sectionId) => {
        setNewLecture({
            title: lec.title,
            number: lec.number,
            resourceUrl: lec.resourceUrl,
            description: lec.description,
            dueDate: lec.dueDate ? lec.dueDate.split('T')[0] : '',
            status: lec.status || 'Pending',
            isPublic: lec.isPublic
        });
        setEditingLectureId(lec._id);
        setActiveSectionId(sectionId);
    };

    const handleDeleteLecture = async (lectureId) => {
        if (!window.confirm('Are you sure you want to delete this lecture?')) return;
        try {
            await api.delete(`/courses/lectures/${lectureId}`);
            fetchCourse();
            toast.success('Lecture deleted');
        } catch (error) {
            toast.error('Error deleting lecture');
        }
    };

    const handleToggleSectionVisibility = async (sectionId, currentStatus) => {
        try {
            await api.put(`/courses/${id}/sections/${sectionId}`, { isPublic: !currentStatus });
            fetchCourse();
            toast.success(currentStatus ? 'Section hidden' : 'Section is now Public');
        } catch (error) {
            toast.error('Error updating visibility');
        }
    };

    const handleToggleLectureVisibility = async (lectureId, currentStatus) => {
        try {
            await api.put(`/courses/lectures/${lectureId}`, { isPublic: !currentStatus });
            fetchCourse();
            toast.success(currentStatus ? 'Lecture hidden' : 'Lecture is now Public');
        } catch (error) {
            toast.error('Error updating visibility');
        }
    };

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    // Toggle student broadcasts
    const handleToggleStudentBroadcasts = async () => {
        try {
            const res = await api.put(`/broadcasts/course/${id}/settings`);
            setAllowStudentBroadcasts(res.data.allowStudentBroadcasts);
            toast.success(res.data.allowStudentBroadcasts ? 'Students can now broadcast' : 'Student broadcasts disabled');
        } catch (error) {
            toast.error('Error updating broadcast settings');
        }
    };

    // Leave course (for teachers)
    const handleLeaveCourse = async () => {
        if (!window.confirm('Are you sure you want to leave this course? You will lose access to manage this course.')) return;
        try {
            await api.delete(`/courses/${id}/teachers/leave`);
            toast.success('You have left the course');
            navigate('/dashboard');
        } catch (error) {
            if (!error.handled) {
                toast.error(error.response?.data?.message || 'Error leaving course');
            }
        }
    };

    if (!course) return <div className="p-8 text-center text-slate-500 font-medium animate-pulse">Loading Course...</div>;

    // Render Curriculum Tab Content
    const renderCurriculumTab = () => (
        <div className="space-y-4 sm:space-y-6">
            {/* Sections Header & Add Form */}
            <div className="flex items-start sm:items-end justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">Course Curriculum</h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">Organize your course content into sections and lectures</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(`/admin/course/${id}/quizzes`)}
                        className="flex items-center gap-1 sm:gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-colors h-8 sm:h-9"
                    >
                        <FaClipboardList className="text-slate-400" size={10} /> <span className="hidden xs:inline">Quizzes</span>
                    </button>
                    <button
                        onClick={() => {
                            setEditingSectionId(null);
                            setNewSectionTitle('');
                            setNewSectionIsPublic(true);
                            setIsSectionModalOpen(true);
                        }}
                        className="flex items-center gap-1 sm:gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-colors h-8 sm:h-9"
                    >
                        + Add Section
                    </button>
                </div>
            </div>

            {/* Sections List */}
            <div className="space-y-4">
                {course.sections && course.sections.length > 0 ? (
                    course.sections.map((section) => (
                        <div key={section._id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden group transition-colors duration-300">
                            <div
                                className="bg-gray-50/50 dark:bg-slate-950/50 px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center gap-2 transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800/50"
                                onClick={() => toggleSection(section._id)}
                            >
                                <h3 className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-white flex items-center gap-1.5 sm:gap-2 select-none min-w-0">
                                    <div className={`transition-transform duration-200 shrink-0 ${expandedSections[section._id] ? 'rotate-180' : ''}`}>
                                        <FaChevronDown className="text-slate-400 text-xs" />
                                    </div>
                                    <FaBook className="text-slate-300 dark:text-slate-600 text-xs shrink-0 hidden sm:block" />
                                    <span className="truncate">{section.title}</span>
                                    <span className="text-[10px] sm:text-xs text-slate-400 font-normal shrink-0">({section.lectures?.length || 0})</span>
                                </h3>
                                <div className="flex items-center gap-1 sm:gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => handleToggleSectionVisibility(section._id, section.isPublic)}
                                        className="p-1 sm:p-1.5 transition-colors"
                                        title={section.isPublic ? "Public (Click to Hide)" : "Hidden (Click to Make Public)"}
                                    >
                                        {section.isPublic ? <FaEye className="text-green-500" size={12} /> : <FaEyeSlash className="text-slate-400" size={12} />}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingSectionId(section._id);
                                            setNewSectionTitle(section.title);
                                            setNewSectionIsPublic(section.isPublic);
                                            setIsSectionModalOpen(true);
                                        }}
                                        className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                        title="Edit Section"
                                    >
                                        <FaEdit size={11} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSection(section._id)}
                                        className="p-1 sm:p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                        title="Delete Section"
                                    >
                                        <FaTrash size={11} />
                                    </button>
                                    <div className="h-4 w-px bg-gray-200 dark:bg-slate-700 mx-0.5 sm:mx-1 hidden xs:block"></div>
                                    <button
                                        onClick={() => {
                                            setActiveSectionId(section._id);
                                            setEditingLectureId(null);
                                            setNewLecture({ title: '', number: '', resourceUrl: '', description: '', dueDate: '', status: 'Pending', isPublic: true });
                                            setIsLectureModalOpen(true);
                                        }}
                                        className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium transition-colors bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 shadow-sm whitespace-nowrap"
                                    >
                                        + <span className="hidden xs:inline">Add </span>Lecture
                                    </button>
                                </div>
                            </div>

                            {/* Lectures List */}
                            {expandedSections[section._id] && (
                                <div className="divide-y divide-gray-100 dark:divide-slate-800 animate-in slide-in-from-top-2 duration-200">
                                    {section.lectures && section.lectures.length > 0 ? (
                                        section.lectures.map((lec) => (
                                            <div key={lec._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 shadow-sm shrink-0">
                                                        {lec.number}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <a
                                                            href={`/course/${id}/lecture/${lec._id}`}
                                                            className="font-medium text-xs sm:text-sm text-slate-900 dark:text-white hover:underline decoration-slate-400 transition-all cursor-pointer line-clamp-1"
                                                        >
                                                            {lec.title}
                                                        </a>
                                                        <div className="flex items-center gap-2 sm:gap-3 mt-0.5 flex-wrap">
                                                            {lec.dueDate && (
                                                                <span className="text-[9px] sm:text-[10px] bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-1 sm:px-1.5 py-0.5 rounded font-medium">
                                                                    Due {new Date(lec.dueDate).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                            {lec.resourceUrl && (
                                                                <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 hidden xs:inline">Resource Attached</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 sm:gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                                                    <button
                                                        onClick={() => handleToggleLectureVisibility(lec._id, lec.isPublic)}
                                                        className="p-1.5 sm:p-2 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
                                                        title={lec.isPublic ? "Public (Click to Hide)" : "Hidden (Click to Make Public)"}
                                                    >
                                                        {lec.isPublic ? <FaEye className="text-green-500" size={11} /> : <FaEyeSlash className="text-slate-400" size={11} />}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            handleEditClick(lec, section._id);
                                                            setIsLectureModalOpen(true);
                                                        }}
                                                        className="p-1.5 sm:p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
                                                        title="Edit"
                                                    >
                                                        <FaEdit size={11} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteLecture(lec._id)}
                                                        className="p-1.5 sm:p-2 text-red-300 dark:text-red-900/50 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
                                                        title="Delete"
                                                    >
                                                        <FaTrash size={11} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-6 text-center">
                                            <p className="text-xs text-slate-400 dark:text-slate-500 italic">No lectures yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 border-dashed transition-colors">
                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FaBook className="text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-900 dark:text-white">Start your curriculum</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Add a section to organize your lectures.</p>
                    </div>
                )}
            </div>
        </div>
    );

    // Render Students Tab Content
    const renderStudentsTab = () => (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex items-start sm:items-end justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">Enrolled Students</h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">Manage students enrolled in this course</p>
                </div>
                <button
                    onClick={() => navigate(`/admin/course/${id}/students`)}
                    className="bg-slate-900 dark:bg-blue-600 text-white px-3 sm:px-4 h-8 sm:h-9 rounded-md text-[10px] sm:text-xs font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
                >
                    Manage Students
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-slate-800 p-3 sm:p-6">
                    <p className="text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Enrolled</p>
                    <p className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1 sm:mt-2">{enrolledStudents.length}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-slate-800 p-3 sm:p-6">
                    <p className="text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Active</p>
                    <p className="text-xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mt-1 sm:mt-2">
                        {enrolledStudents.filter(s => {
                            const lastActive = new Date(s.updatedAt);
                            const today = new Date();
                            return lastActive.toDateString() === today.toDateString();
                        }).length}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-slate-800 p-3 sm:p-6">
                    <p className="text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Avg. Progress</p>
                    <p className="text-xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1 sm:mt-2">
                        {enrolledStudents.length > 0
                            ? Math.round(enrolledStudents.reduce((acc, s) => {
                                const total = course.sections?.reduce((t, sec) => t + (sec.lectures?.length || 0), 0) || 1;
                                const completed = s.completedLectures?.length || 0;
                                return acc + (completed / total) * 100;
                            }, 0) / enrolledStudents.length)
                            : 0}%
                    </p>
                </div>
            </div>

            {/* Students List */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden">
                {enrolledStudents.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-slate-800">
                        {enrolledStudents.slice(0, 10).map((progress) => {
                            const totalLectures = course.sections?.reduce((t, sec) => t + (sec.lectures?.length || 0), 0) || 0;
                            const completedLectures = progress.completedLectures?.length || 0;
                            const progressPercent = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

                            return (
                                <div key={progress._id} className="px-3 sm:px-4 py-3 sm:py-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        {/* Avatar */}
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center shrink-0">
                                            <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                                                {progress.student?.name?.charAt(0)?.toUpperCase() || '?'}
                                            </span>
                                        </div>

                                        {/* Info & Progress */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white truncate">{progress.student?.name || 'Unknown'}</p>
                                                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">{progress.student?.email || ''}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                                                        {progressPercent}%
                                                    </p>
                                                    <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500">
                                                        {completedLectures}/{totalLectures}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Progress Bar */}
                                            <div className="mt-2 w-full h-1.5 sm:h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${
                                                        progressPercent === 100 ? 'bg-green-500' :
                                                        progressPercent >= 50 ? 'bg-blue-500' :
                                                        progressPercent > 0 ? 'bg-amber-500' : 'bg-gray-300'
                                                    }`}
                                                    style={{ width: `${progressPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 sm:py-12">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FaUsers className="text-slate-300 dark:text-slate-600 text-sm sm:text-base" />
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">No students enrolled yet</p>
                    </div>
                )}
                {enrolledStudents.length > 10 && (
                    <div className="px-3 sm:px-4 py-3 border-t border-gray-100 dark:border-slate-800 text-center">
                        <button
                            onClick={() => navigate(`/admin/course/${id}/students`)}
                            className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                            View all {enrolledStudents.length} students →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    // Render Broadcasts Tab Content (using shared component)
    const renderBroadcastsTab = () => {
        if (!broadcastsLoaded) {
            return (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
                </div>
            );
        }

        return (
            <BroadcastList
                courseId={id}
                broadcasts={broadcasts}
                pagination={broadcastPagination}
                currentPage={broadcastPage}
                onPageChange={fetchBroadcasts}
                onRefresh={() => fetchBroadcasts(broadcastPage)}
                canBroadcast={true}
                isOwner={isOwner}
                allowStudentBroadcasts={allowStudentBroadcasts}
                onToggleStudentBroadcasts={handleToggleStudentBroadcasts}
                currentUserId={user?._id}
            />
        );
    };

    // Render Teachers Tab Content
    const renderTeachersTab = () => (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Course Teachers</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage teachers and their permissions for this course</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
                <TeacherManagement
                    courseId={id}
                    canManageTeachers={canManageTeachers}
                    isOwner={isOwner}
                />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-gray-100 pb-12 transition-colors duration-300">

            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-16 z-10 transition-colors duration-300">
                <div className="container mx-auto px-3 sm:px-4">
                    <div className="h-12 sm:h-16 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <h1 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white truncate">{course.title}</h1>
                        </div>
                        <div className="flex gap-1.5 sm:gap-2 shrink-0">
                            <button
                                onClick={() => navigate(`/course/${id}`)}
                                className="flex items-center gap-1 sm:gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-colors"
                            >
                                <FaEye className="text-slate-400" size={10} /> <span className="hidden xs:inline">Preview</span><span className="xs:hidden">View</span>
                            </button>
                            <button
                                onClick={() => navigate(`/admin/course/${id}/analytics`)}
                                className="flex items-center gap-1 sm:gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-colors"
                            >
                                <FaChartBar className="text-slate-400" size={10} /> <span className="hidden xs:inline">Analytics</span>
                            </button>
                            <button
                                onClick={() => navigate(`/admin/course/${id}/settings`)}
                                className="flex items-center gap-1 sm:gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium hover:opacity-90 transition-colors"
                            >
                                <FaCog size={10} /> <span className="hidden xs:inline">Settings</span>
                            </button>
                        </div>
                    </div>

                    {/* Tabs - Mobile Friendly */}
                    <div className="flex -mb-px overflow-x-auto scrollbar-hide">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const showBadge = tab.id === 'broadcasts' && unreadBroadcastCount > 0;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                        activeTab === tab.id
                                            ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                >
                                    <Icon className="shrink-0 text-[12px] sm:text-sm" />
                                    {tab.label}
                                    {showBadge && (
                                        <span className="bg-red-500 text-white text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full min-w-[16px] sm:min-w-[18px] text-center">
                                            {unreadBroadcastCount > 99 ? '99+' : unreadBroadcastCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Teacher Permissions Banner - Compact & Mobile Friendly */}
            {userPermissions.isTeacher && !isOwner && showPermissionsBanner && (
                <div className="container mx-auto px-4 pt-3">
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5">
                        <div className="flex items-center justify-between gap-2">
                            {/* Left: Icon + Text */}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                                    <FaUserTie className="text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white whitespace-nowrap">You're a Teacher</span>
                                        <span className="hidden sm:inline text-slate-400 dark:text-slate-500">|</span>
                                        <div className="flex flex-wrap gap-1">
                                            {userPermissions.permissions.full_access ? (
                                                <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-medium">
                                                    Full Access
                                                </span>
                                            ) : (
                                                <>
                                                    {userPermissions.permissions.manage_content && (
                                                        <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium">
                                                            Content
                                                        </span>
                                                    )}
                                                    {userPermissions.permissions.manage_students && (
                                                        <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 font-medium">
                                                            Students
                                                        </span>
                                                    )}
                                                    {userPermissions.permissions.manage_teachers && (
                                                        <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 font-medium">
                                                            Teachers
                                                        </span>
                                                    )}
                                                    {!userPermissions.permissions.manage_content &&
                                                     !userPermissions.permissions.manage_students &&
                                                     !userPermissions.permissions.manage_teachers && (
                                                        <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 font-medium">
                                                            View Only
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Right: Actions */}
                            <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                    onClick={handleLeaveCourse}
                                    className="flex items-center gap-1 px-1.5 sm:px-2 py-1 text-[10px] sm:text-[11px] font-medium text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                    title="Leave this course"
                                >
                                    <FaSignOutAlt size={10} />
                                    <span className="hidden xs:inline">Leave</span>
                                </button>
                                <button
                                    onClick={() => setShowPermissionsBanner(false)}
                                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors"
                                    title="Dismiss"
                                >
                                    <FaTimes size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Content */}
            <div className="container mx-auto px-4 py-6">
                {activeTab === 'curriculum' && renderCurriculumTab()}
                {activeTab === 'broadcasts' && renderBroadcastsTab()}
                {activeTab === 'students' && renderStudentsTab()}
                {activeTab === 'teachers' && renderTeachersTab()}
            </div>

            {/* Section Modal */}
            <Modal
                isOpen={isSectionModalOpen}
                onClose={() => setIsSectionModalOpen(false)}
                title={editingSectionId ? "Edit Section" : "Add New Section"}
            >
                <form onSubmit={(e) => {
                    handleSaveSection(e);
                    setIsSectionModalOpen(false);
                }} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3 mb-2">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Visible to Students</label>
                        <button
                            type="button"
                            onClick={() => setNewSectionIsPublic(!newSectionIsPublic)}
                            className={`w-9 h-5 rounded-full flex items-center transition-colors px-1 ${newSectionIsPublic ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                            <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform ${newSectionIsPublic ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Section Title</label>
                        <input
                            type="text"
                            className="w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-white"
                            value={newSectionTitle}
                            onChange={(e) => setNewSectionTitle(e.target.value)}
                            placeholder="e.g. Introduction to React"
                            required
                        />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-full text-sm font-bold shadow-lg hover:shadow-xl hover:bg-slate-800 transition-all transform hover:-translate-y-0.5">
                            {editingSectionId ? "Update Section" : "Add Section"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Lecture Modal */}
            <Modal
                isOpen={isLectureModalOpen}
                onClose={() => setIsLectureModalOpen(false)}
                title={editingLectureId ? 'Edit Lecture' : 'New Lecture'}
            >
                <form onSubmit={(e) => {
                    handleSaveLecture(e);
                    setIsLectureModalOpen(false);
                }} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3 mb-2">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Visible to Students</label>
                        <button
                            type="button"
                            onClick={() => setNewLecture({ ...newLecture, isPublic: !newLecture.isPublic })}
                            className={`w-9 h-5 rounded-full flex items-center transition-colors px-1 ${newLecture.isPublic ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                            <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform ${newLecture.isPublic ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-3">
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Number</label>
                            <input
                                type="number"
                                className="w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-white"
                                value={newLecture.number}
                                onChange={(e) => setNewLecture({ ...newLecture, number: e.target.value })}
                                required
                            />
                        </div>
                        <div className="col-span-9">
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Title</label>
                            <input
                                type="text"
                                className="w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-white"
                                value={newLecture.title}
                                onChange={(e) => setNewLecture({ ...newLecture, title: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Resource URL</label>
                        <input
                            type="url"
                            className="w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-white"
                            value={newLecture.resourceUrl}
                            onChange={(e) => setNewLecture({ ...newLecture, resourceUrl: e.target.value })}
                            placeholder="https://..."
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Due Date</label>
                        <input
                            type="date"
                            className="w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-white"
                            value={newLecture.dueDate}
                            onChange={(e) => setNewLecture({ ...newLecture, dueDate: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Description</label>
                        <textarea
                            className="w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-white min-h-[100px]"
                            value={newLecture.description}
                            onChange={(e) => setNewLecture({ ...newLecture, description: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-full text-sm font-bold shadow-lg hover:shadow-xl hover:bg-slate-800 transition-all transform hover:-translate-y-0.5">
                            {editingLectureId ? 'Update Lecture' : 'Save Lecture'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default CourseManage;
