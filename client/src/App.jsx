import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext, { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import CourseManage from './pages/CourseManage';
import CourseView from './pages/CourseView';
import StudentDetail from './pages/StudentDetail';
import StudentCourseDetails from './pages/StudentCourseDetails';
import AdminLectureView from './pages/AdminLectureView';
import Profile from './pages/Profile';
import CourseSettings from './pages/CourseSettings';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="flex h-screen items-center justify-center dark:bg-slate-950"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
};

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 flex flex-col">
            <Navbar />
            <div className="flex-1">
              <Toaster position="top-right" toastOptions={{
                duration: 3000,
                style: {
                  background: '#333',
                  color: '#fff',
                },
                success: {
                  style: {
                    background: '#10B981', // green-500
                    color: '#fff',
                  },
                },
                error: {
                  style: {
                    background: '#EF4444', // red-500
                    color: '#fff',
                  },
                },
              }} />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/course/:id" element={<ProtectedRoute adminOnly={true}><CourseManage /></ProtectedRoute>} />
                <Route path="/admin/course/:id/settings" element={<ProtectedRoute adminOnly={true}><CourseSettings /></ProtectedRoute>} />
                <Route path="/admin/course/:courseId/student/:studentId" element={<ProtectedRoute adminOnly={true}><StudentDetail /></ProtectedRoute>} />
                <Route path="/admin/course/:courseId/lecture/:lectureId" element={<ProtectedRoute adminOnly={true}><AdminLectureView /></ProtectedRoute>} />

                <Route path="/" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/course/:id" element={<ProtectedRoute><StudentCourseDetails /></ProtectedRoute>} />
                <Route path="/course/:id/lecture/:lectureId" element={<ProtectedRoute><CourseView /></ProtectedRoute>} />
              </Routes>
            </div>
            <Footer />
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
