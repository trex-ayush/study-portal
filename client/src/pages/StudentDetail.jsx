import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { FaArrowLeft, FaUserGraduate, FaStickyNote, FaPlayCircle, FaCheckCircle, FaClock } from 'react-icons/fa';

const StudentDetail = () => {
    const { courseId, studentId } = useParams();
    const navigate = useNavigate();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [studentName, setStudentName] = useState('Student');

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                // Fetch student name from one of the enrollment endpoints or just user detail if available.
                // Re-using current endpoints: 
                const actRes = await api.get(`/courses/${courseId}/activity/${studentId}`);
                setActivities(actRes.data);

                // Try to guess student name from first activity if populated or fetch specific endpoint if created.
                // For now, let's just show "Student Activity".
                if (actRes.data.length > 0 && actRes.data[0].student && actRes.data[0].student.name) {
                    // Check if populate included student name. The controller didn't populate student.
                    // I will trust the user just wants the logs for now.
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchActivity();
    }, [courseId, studentId]);

    const getIcon = (action) => {
        if (action === 'Comment') return <FaStickyNote className="text-purple-500" />;
        if (action.includes('Note')) return <FaStickyNote className="text-yellow-500" />;
        if (action.includes('Completed')) return <FaCheckCircle className="text-green-500" />;
        if (action.includes('Started') || action.includes('Progress')) return <FaPlayCircle className="text-blue-500" />;
        return <FaClock className="text-gray-400" />;
    }

    if (loading) return <div className="p-8 flex justify-center text-slate-500 dark:text-slate-400">Loading records...</div>;

    return (
        <div className="container mx-auto p-6 bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors">
                <FaArrowLeft /> Back to Course
            </button>

            <div className="flex items-center gap-4 mb-8">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-full shadow-md text-slate-900 dark:text-white transition-colors">
                    <FaUserGraduate size={32} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Student Activity Log</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Tracking learning progress and study notes</p>
                </div>
            </div>

            <div className="relative border-l-2 border-gray-200 dark:border-slate-800 ml-6 space-y-8 transition-colors">
                {activities.length > 0 ? (
                    activities.map((act) => (
                        <div key={act._id} className="ml-8 relative">
                            {/* Timeline Dot */}
                            <div className="absolute -left-[41px] bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-full p-2 transition-colors">
                                {getIcon(act.action)}
                            </div>

                            {/* Content Card */}
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-lg shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className={`font-bold text-lg ${act.action.includes('Note') ? 'text-slate-900 dark:text-white' : 'text-blue-600 dark:text-blue-400'}`}>
                                            {act.action}
                                        </h3>
                                        {act.lecture && (
                                            <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs px-2 py-1 rounded font-medium mt-1 inline-block border border-blue-100 dark:border-blue-900/10">
                                                Lecture {act.lecture.number}: {act.lecture.title}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-400 dark:text-slate-500 font-mono">
                                        {new Date(act.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-950/50 p-3 rounded border border-gray-100 dark:border-slate-800 text-sm leading-relaxed transition-colors">
                                    {act.details}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="ml-8 text-gray-400 dark:text-slate-500 italic">No activity recorded for this student yet.</div>
                )}
            </div>
        </div>
    );
};

export default StudentDetail;
