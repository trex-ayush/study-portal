import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext, { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import CourseManage from './pages/CourseManage';
import CourseView from './pages/CourseView';
import StudentDetail from './pages/StudentDetail';
import StudentCourseDetails from './pages/StudentCourseDetails';
import Profile from './pages/Profile';
import CourseSettings from './pages/CourseSettings';
import GlobalActivity from './pages/GlobalActivity';
import CourseAnalytics from './pages/CourseAnalytics';
import QuizManage from './pages/QuizManage';
import QuizTake from './pages/QuizTake';
import QuizAnalytics from './pages/QuizAnalytics';
import StudentProgressDetail from './pages/StudentProgressDetail';
import NotFound from './pages/NotFound';

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

// Route for course owners (admin OR course owner - verified by backend)
const CourseOwnerRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="flex h-screen items-center justify-center dark:bg-slate-950"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Backend will verify ownership, frontend just ensures user is logged in
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

                {/* Admin-only routes */}
                <Route path="/admin/activities" element={<ProtectedRoute adminOnly={true}><GlobalActivity /></ProtectedRoute>} />

                {/* Course owner routes (admin OR course owner - backend verifies ownership) */}
                <Route path="/admin/course/:id" element={<CourseOwnerRoute><CourseManage /></CourseOwnerRoute>} />
                <Route path="/admin/course/:id/settings" element={<CourseOwnerRoute><CourseSettings /></CourseOwnerRoute>} />
                <Route path="/admin/course/:id/analytics" element={<CourseOwnerRoute><CourseAnalytics /></CourseOwnerRoute>} />
                <Route path="/admin/course/:courseId/student/:studentId" element={<CourseOwnerRoute><StudentDetail /></CourseOwnerRoute>} />
                <Route path="/admin/course/:courseId/student/:studentId/progress" element={<CourseOwnerRoute><StudentProgressDetail /></CourseOwnerRoute>} />
                <Route path="/admin/course/:courseId/quizzes" element={<CourseOwnerRoute><QuizManage /></CourseOwnerRoute>} />
                <Route path="/admin/course/:courseId/quiz/:quizId/analytics" element={<CourseOwnerRoute><QuizAnalytics /></CourseOwnerRoute>} />

                <Route path="/" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/course/:id" element={<ProtectedRoute><StudentCourseDetails /></ProtectedRoute>} />
                <Route path="/course/:id/lecture/:lectureId" element={<ProtectedRoute><CourseView /></ProtectedRoute>} />
                <Route path="/course/:courseId/quiz/:quizId" element={<ProtectedRoute><QuizTake /></ProtectedRoute>} />

                {/* 404 Not Found - Catch all undefined routes */}
                <Route path="*" element={<NotFound />} />
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
