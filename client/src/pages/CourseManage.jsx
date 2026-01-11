import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { FaEye, FaEdit, FaTrash, FaPlus, FaUserPlus, FaChevronDown, FaChevronUp, FaBook, FaCog, FaUsers } from 'react-icons/fa';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const CourseManage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [newSectionTitle, setNewSectionTitle] = useState('');

    // Section State
    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
    const [editingSectionId, setEditingSectionId] = useState(null);

    // Course Settings
    // (State removed, now on separate page)

    // Lecture State
    const [isLectureModalOpen, setIsLectureModalOpen] = useState(false);
    const [activeSectionId, setActiveSectionId] = useState(null); // For adding new lecture
    const [editingLectureId, setEditingLectureId] = useState(null); // For editing existing lecture
    const [newLecture, setNewLecture] = useState({ title: '', number: '', resourceUrl: '', description: '', dueDate: '', status: 'Pending' });

    // Students State
    const [enrolledStudents, setEnrolledStudents] = useState([]);


    const fetchCourse = async () => {
        try {
            const res = await api.get(`/courses/${id}`);
            setCourse(res.data);

            const progRes = await api.get(`/courses/${id}/progresses`);
            setEnrolledStudents(progRes.data);
        } catch (err) {
            console.error("Failed to fetch data", err);
        }
    };

    useEffect(() => {
        fetchCourse();
    }, [id]);

    const handleSaveSection = async (e) => {
        e.preventDefault();
        try {
            if (editingSectionId) {
                // Update
                await api.put(`/courses/${id}/sections/${editingSectionId}`, { title: newSectionTitle });
            } else {
                // Create
                await api.post(`/courses/${id}/sections`, { title: newSectionTitle });
            }
            setNewSectionTitle('');
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
                // Update
                await api.put(`/courses/lectures/${editingLectureId}`, newLecture);
            } else {
                // Create
                if (!activeSectionId) return alert('Select a section first');
                await api.post(`/courses/${id}/sections/${activeSectionId}/lectures`, newLecture);
            }

            setNewLecture({ title: '', number: '', resourceUrl: '', description: '', dueDate: '', status: 'Pending' });
            setActiveSectionId(null);
            setEditingLectureId(null);
            fetchCourse();
            toast.success(editingLectureId ? 'Lecture updated!' : 'Lecture added!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error saving lecture');
        }
    };

    // (handleUpdateCourse removed)

    const handleEditClick = (lec, sectionId) => {
        setNewLecture({
            title: lec.title,
            number: lec.number,
            resourceUrl: lec.resourceUrl,
            description: lec.description,
            dueDate: lec.dueDate ? lec.dueDate.split('T')[0] : '',
            status: lec.status || 'Pending'
        });
        setEditingLectureId(lec._id);
        setActiveSectionId(sectionId); // Open the form in the relevant section
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



    if (!course) return <div className="p-8 text-center text-slate-500 font-medium animate-pulse">Loading Course...</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-gray-100 pb-12 transition-colors duration-300">

            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-16 z-10 transition-colors duration-300">
                <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{course.title}</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg truncate">{course.description}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate(`/course/${id}`)}
                            className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors"
                        >
                            <FaEye className="text-slate-400 dark:text-slate-500" /> Student View
                        </button>
                        <button
                            onClick={() => navigate(`/admin/course/${id}/settings`)}
                            className="flex items-center gap-2 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                        >
                            <FaCog /> Settings
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN: Course Content (2/3) */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Sections Header & Add Form */}
                        <div className="flex items-end justify-between border-b border-gray-200 dark:border-slate-800 pb-4">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Curriculum</h2>
                            <button
                                onClick={() => {
                                    setEditingSectionId(null);
                                    setNewSectionTitle('');
                                    setIsSectionModalOpen(true);
                                }}
                                className="bg-slate-900 dark:bg-blue-600 text-white px-4 h-9 rounded-md text-xs font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors"
                            >
                                + Add Section
                            </button>
                        </div>

                        {/* Sections List */}
                        <div className="space-y-6">
                            {course.sections && course.sections.length > 0 ? (
                                course.sections.map((section) => (
                                    <div key={section._id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden group transition-colors duration-300">
                                        <div className="bg-gray-50/50 dark:bg-slate-950/50 px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center transition-colors">
                                            <h3 className="font-semibold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                                                <FaBook className="text-slate-300 dark:text-slate-600 text-xs" />
                                                {section.title}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingSectionId(section._id);
                                                        setNewSectionTitle(section.title);
                                                        setIsSectionModalOpen(true);
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                                    title="Edit Section"
                                                >
                                                    <FaEdit size={12} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSection(section._id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                                    title="Delete Section"
                                                >
                                                    <FaTrash size={12} />
                                                </button>
                                                <div className="h-4 w-px bg-gray-200 dark:bg-slate-700 mx-1"></div>
                                                <button
                                                    onClick={() => {
                                                        setActiveSectionId(section._id);
                                                        setEditingLectureId(null);
                                                        setNewLecture({ title: '', number: '', resourceUrl: '', description: '', dueDate: '', status: 'Pending' });
                                                        setIsLectureModalOpen(true);
                                                    }}
                                                    className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 shadow-sm"
                                                >
                                                    + Add Lecture
                                                </button>
                                            </div>
                                        </div>

                                        {/* Lectures List */}
                                        <div className="divide-y divide-gray-100 dark:divide-slate-800">
                                            {section.lectures && section.lectures.length > 0 ? (
                                                section.lectures.map((lec) => (
                                                    <div key={lec._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors p-4 flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 shadow-sm shrink-0">
                                                                {lec.number}
                                                            </div>
                                                            <div>
                                                                <a
                                                                    href={`/course/${id}/lecture/${lec._id}`}
                                                                    className="font-medium text-sm text-slate-900 dark:text-white hover:underline decoration-slate-400 transition-all cursor-pointer"
                                                                >
                                                                    {lec.title}
                                                                </a>
                                                                <div className="flex items-center gap-3 mt-0.5">
                                                                    {lec.dueDate && (
                                                                        <span className="text-[10px] bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-medium">
                                                                            Due {new Date(lec.dueDate).toLocaleDateString()}
                                                                        </span>
                                                                    )}
                                                                    {lec.resourceUrl && (
                                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Resource Attached</span>
                                                                    )}
                                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter ${lec.status === 'Live' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                                                                        lec.status === 'Available' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                                                                            'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                                        }`}>
                                                                        {lec.status || 'Pending'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => {
                                                                    handleEditClick(lec, section._id);
                                                                    setIsLectureModalOpen(true);
                                                                }}
                                                                className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
                                                                title="Edit"
                                                            >
                                                                <FaEdit size={12} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteLecture(lec._id)}
                                                                className="p-2 text-red-300 dark:text-red-900/50 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
                                                                title="Delete"
                                                            >
                                                                <FaTrash size={12} />
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

                    {/* RIGHT COLUMN: Management (1/3) */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-6 transition-colors">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <FaUsers className="text-slate-400 dark:text-slate-500" /> Students
                            </h2>
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-3xl font-bold text-slate-900 dark:text-white">{enrolledStudents.length}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Enrolled</span>
                            </div>
                            <button
                                onClick={() => navigate(`/admin/course/${id}/students`)}
                                className="w-full bg-slate-900 dark:bg-blue-600 text-white py-2 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                Manage Students
                            </button>
                        </div>
                    </div>
                </div>
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
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Status (Managed by Admin)</label>
                        <select
                            className="w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-white"
                            value={newLecture.status}
                            onChange={(e) => setNewLecture({ ...newLecture, status: e.target.value })}
                        >
                            <option value="Pending">Pending</option>
                            {course?.lectureStatuses?.map(s => (
                                <option key={s.label} value={s.label}>{s.label}</option>
                            ))}
                            <option value="Hidden">Hidden</option>
                        </select>
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

        </div >
    );
};

export default CourseManage;
