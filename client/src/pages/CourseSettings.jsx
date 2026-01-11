import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { FaArrowLeft, FaSave, FaPlus, FaTrash, FaPalette } from 'react-icons/fa';
import toast from 'react-hot-toast';

const CourseSettings = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'Draft',
        lectureStatuses: [],
        completedStatus: 'Completed'
    });

    useEffect(() => {
        fetchCourse();
    }, [id]);

    const fetchCourse = async () => {
        try {
            const res = await api.get(`/courses/${id}`);
            setCourse(res.data);
            setFormData({
                title: res.data.title,
                description: res.data.description,
                status: res.data.status || 'Draft',
                lectureStatuses: res.data.lectureStatuses && res.data.lectureStatuses.length > 0
                    ? res.data.lectureStatuses
                    : [
                        { label: 'Not Started', color: '#64748b' },
                        { label: 'In Progress', color: '#f59e0b' },
                        { label: 'Completed', color: '#10b981' }
                    ],
                completedStatus: res.data.completedStatus || 'Completed'
            });
            setLoading(false);
        } catch (err) {
            toast.error('Failed to load course settings');
            navigate(`/admin/course/${id}`);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/courses/${id}`, formData);
            toast.success('Settings saved successfully');
            navigate(`/admin/course/${id}`);
        } catch (error) {
            toast.error('Error saving settings');
        }
    };

    const addStatus = () => {
        setFormData({
            ...formData,
            lectureStatuses: [...formData.lectureStatuses, { label: '', color: '#475569' }]
        });
    };

    const removeStatus = (index) => {
        const updated = formData.lectureStatuses.filter((_, i) => i !== index);
        setFormData({ ...formData, lectureStatuses: updated });
    };

    const updateStatus = (index, field, value) => {
        const updated = [...formData.lectureStatuses];
        updated[index][field] = value;
        setFormData({ ...formData, lectureStatuses: updated });
    };

    if (loading) return <div className="p-8 text-center animate-pulse">Loading settings...</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-12">
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-16 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate(`/admin/course/${id}`)}
                        className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <FaArrowLeft /> Back to Management
                    </button>
                    <h1 className="text-lg font-bold">Course Settings</h1>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2 rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
                    >
                        <FaSave /> Save Changes
                    </button>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <form onSubmit={handleSave} className="space-y-8">

                    {/* General Settings */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">General Information</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Course Title</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none transition-all"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Visibility Status</label>
                                    <select
                                        className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none transition-all"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="Draft">Draft</option>
                                        <option value="Published">Published</option>
                                        <option value="Archived">Archived</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase">Description</label>
                                <textarea
                                    className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none transition-all min-h-[120px]"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Completion Management */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Progress Management</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-400 uppercase">Completion Status</label>
                                <p className="text-xs text-slate-500 mb-2">Select which status label indicates that a student has finished a lecture. This is <b>compulsory</b> to accurately track and review student progress.</p>
                                <select
                                    className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none transition-all"
                                    value={formData.completedStatus}
                                    onChange={(e) => setFormData({ ...formData, completedStatus: e.target.value })}
                                    required
                                >
                                    <option value="">Select a status...</option>
                                    {formData.lectureStatuses.map((stat, i) => (
                                        <option key={i} value={stat.label}>{stat.label}</option>
                                    ))}
                                </select>
                                {!formData.lectureStatuses.find(s => s.label === formData.completedStatus) && formData.completedStatus && (
                                    <p className="text-[10px] text-red-500 font-bold mt-1">Warning: Current completion status "{formData.completedStatus}" is not in the list above.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Lesson Statuses */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50 flex justify-between items-center">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Lecture Status Options</h2>
                            <button
                                type="button"
                                onClick={addStatus}
                                className="text-xs flex items-center gap-1.5 text-slate-900 dark:text-white font-bold hover:underline"
                            >
                                <FaPlus /> Add Custom Status
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-xs text-slate-400 mb-6">These statuses will be shown to students as progress updates. You can customize the labels and colors.</p>

                            <div className="space-y-3">
                                {formData.lectureStatuses.map((stat, index) => (
                                    <div key={index} className="flex items-center gap-4 group">
                                        <div className="flex-1 flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 rounded-full border border-gray-200 dark:border-slate-700 shrink-0 flex items-center justify-center relative overflow-hidden"
                                                style={{ backgroundColor: stat.color }}
                                            >
                                                <input
                                                    type="color"
                                                    value={stat.color}
                                                    onChange={(e) => updateStatus(index, 'color', e.target.value)}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                                <FaPalette className="text-white text-[10px] drop-shadow-sm pointer-events-none" />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Status Label (e.g. In Review)"
                                                className="flex-1 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none transition-all"
                                                value={stat.label}
                                                onChange={(e) => updateStatus(index, 'label', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeStatus(index)}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete Status"
                                        >
                                            <FaTrash size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {formData.lectureStatuses.length === 0 && (
                                <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
                                    <p className="text-sm text-slate-400">No custom statuses defined. Students will see default progress.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-center pt-4">
                        <p className="text-xs text-slate-400 text-center max-w-sm">Changes made here will affect how all enrolled students perceive their progress in this course.</p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CourseSettings;
