import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { FaPlayCircle, FaBook, FaCheckCircle, FaRegCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const StudentCourseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [progressMap, setProgressMap] = useState({});
    const [expandedSections, setExpandedSections] = useState({}); // New State

    // Toggle Section Logic
    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    // Set Document Title
    useEffect(() => {
        if (course) {
            document.title = `Skill Path | ${course.title}`;
        }
        return () => {
            document.title = 'Skill Path';
        };
    }, [course]);

    // Fetch Course & Progress
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get Course Details
                const courseRes = await api.get(`/courses/${id}`);
                setCourse(courseRes.data);

                // Auto-expand all sections by default
                if (courseRes.data.sections) {
                    const initialExpanded = {};
                    courseRes.data.sections.forEach(sec => initialExpanded[sec._id] = true);
                    setExpandedSections(initialExpanded);
                }

                // 2. Get Student's Progress
                const myRes = await api.get('/courses/my/enrolled');
                const currentCourseProgress = myRes.data.find(p => p.course._id === id || p.course === id);

                if (currentCourseProgress && currentCourseProgress.completedLectures) {
                    const map = {};
                    currentCourseProgress.completedLectures.forEach(item => {
                        map[item.lecture] = {
                            status: item.status,
                            completedAt: item.completedAt
                        };
                    });
                    setProgressMap(map);
                }

            } catch (err) {
                console.error("Failed to fetch data", err);
            }
        };
        fetchData();
    }, [id]);

    const getProgressStats = () => {
        if (!course) return { completed: 0, total: 0, percent: 0 };
        let totalLectures = 0;
        course.sections.forEach(s => totalLectures += s.lectures.length);

        let completed = 0;
        const completionLabel = course.completedStatus || 'Completed';
        Object.values(progressMap).forEach(p => {
            if (p.status === completionLabel) completed++;
        });

        const percent = totalLectures === 0 ? 0 : Math.round((completed / totalLectures) * 100);
        return { completed, total: totalLectures, percent };
    };

    if (!course) return <div className="p-8 text-center text-slate-500 font-medium animate-pulse">Loading Course...</div>;

    const stats = getProgressStats();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-gray-100 pb-12 transition-colors duration-300">

            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-16 z-30 transition-colors duration-300 shadow-sm">
                <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{course.title}</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-3xl">{course.description}</p>
                    </div>
                    {/* Resume Button */}
                    <div className="shrink-0 self-start md:self-center">
                        <button
                            onClick={() => {
                                // Logic to find first uncompleted lecture, or just first lecture
                                if (course.sections.length > 0 && course.sections[0].lectures.length > 0) {
                                    navigate(`/course/${id}/lecture/${course.sections[0].lectures[0]._id}`);
                                }
                            }}
                            className="flex items-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-3 rounded-full text-sm font-bold shadow-lg hover:shadow-xl hover:bg-slate-800 dark:hover:bg-white/90 transition-all transform hover:-translate-y-0.5"
                        >
                            <FaPlayCircle /> Start Learning
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN: Course Curriculum (2/3) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-end justify-between border-b border-gray-200 dark:border-slate-800 pb-4">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Curriculum</h2>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{course.sections.length} Sections</span>
                        </div>

                        <div className="space-y-6">
                            {course.sections && course.sections.length > 0 ? (
                                course.sections.map((section) => {
                                    // Section Progress Logic
                                    const totalSecLectures = section.lectures ? section.lectures.length : 0;
                                    const completionLabel = course.completedStatus || 'Completed';
                                    const completedSecLectures = section.lectures ? section.lectures.filter(l => progressMap[l._id]?.status === completionLabel).length : 0;
                                    const secPercent = totalSecLectures > 0 ? Math.round((completedSecLectures / totalSecLectures) * 100) : 0;
                                    const isExpanded = expandedSections[section._id];

                                    return (
                                        <div key={section._id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden group transition-colors duration-300">

                                            {/* Section Header (Accordion) */}
                                            <div
                                                onClick={() => toggleSection(section._id)}
                                                className="bg-gray-50/50 dark:bg-slate-950/50 px-5 py-4 border-b border-gray-100 dark:border-slate-800 transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800/80 flex flex-col gap-3"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-semibold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                                                        <FaBook className="text-slate-300 dark:text-slate-600 text-xs" />
                                                        {section.title}
                                                    </h3>
                                                    {isExpanded ?
                                                        <FaChevronUp className="text-slate-400 text-xs" /> :
                                                        <FaChevronDown className="text-slate-400 text-xs" />
                                                    }
                                                </div>

                                                {/* Section Progress Bar */}
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                                                            style={{ width: `${secPercent}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 min-w-[3rem] text-right">
                                                        {completedSecLectures} / {totalSecLectures}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Lectures List (Collapsible) */}
                                            {isExpanded && (
                                                <div className="divide-y divide-gray-100 dark:divide-slate-800 animate-in slide-in-from-top-2 duration-200">
                                                    {section.lectures && section.lectures.length > 0 ? (
                                                        section.lectures.map((lec) => {
                                                            const progress = progressMap[lec._id] || { status: 'Not Started' };
                                                            const status = progress.status;
                                                            const completedAt = progress.completedAt ? new Date(progress.completedAt) : null;
                                                            const dueDate = lec.dueDate ? new Date(lec.dueDate) : null;

                                                            const completionLabel = course.completedStatus || 'Completed';
                                                            const isLate = status === completionLabel && completedAt && dueDate && completedAt > dueDate;

                                                            return (
                                                                <div
                                                                    key={lec._id}
                                                                    onClick={() => navigate(`/course/${id}/lecture/${lec._id}`)}
                                                                    className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors p-4 flex items-center justify-between cursor-pointer"
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="shrink-0">
                                                                            {(status && status !== 'Not Started') ? (
                                                                                <div style={{ color: course?.lectureStatuses?.find(s => s.label === status)?.color || '#10b981' }}>
                                                                                    {status === completionLabel ?
                                                                                        <FaCheckCircle size={16} /> :
                                                                                        <FaPlayCircle size={16} />
                                                                                    }
                                                                                </div>
                                                                            ) : (
                                                                                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 shadow-sm transition-colors">
                                                                                    {lec.number}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <span className="font-medium text-sm text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                                                                                {lec.title}
                                                                            </span>
                                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                                {lec.dueDate ? (
                                                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isLate
                                                                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                                                                        {isLate ? 'Late Submission: ' : 'Due: '}
                                                                                        {new Date(lec.dueDate).toLocaleDateString()}
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">No Due Date</span>
                                                                                )}

                                                                                {/* Status Chip */}
                                                                                <span
                                                                                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium border transition-colors`}
                                                                                    style={{
                                                                                        backgroundColor: `${course?.lectureStatuses?.find(s => s.label === status)?.color || '#64748b'}20`,
                                                                                        borderColor: `${course?.lectureStatuses?.find(s => s.label === status)?.color || '#64748b'}40`,
                                                                                        color: course?.lectureStatuses?.find(s => s.label === status)?.color || '#64748b'
                                                                                    }}
                                                                                >
                                                                                    {status}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>


                                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-2 py-1 rounded-md">
                                                                            Watch
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="p-6 text-center">
                                                            <p className="text-xs text-slate-400 dark:text-slate-500 italic">No lectures available.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-slate-500 dark:text-slate-400">Course content is being prepared.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Progress (1/3) */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-6 sticky top-28 transition-colors">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-6">Your Progress</h2>

                            <div className="space-y-4">
                                <div className="flex items-end justify-between">
                                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.percent}%</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">{stats.completed}/{stats.total} Lectures</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-slate-900 dark:bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${stats.percent}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed pt-2">
                                    Keep it up! You are making great progress through the course material.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default StudentCourseDetails;
