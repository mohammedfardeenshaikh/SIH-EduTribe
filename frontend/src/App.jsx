import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import EligibilityChecker from './pages/EligibilityChecker';
import ApplicantDashboard from './pages/ApplicantDashboard';
import AdminDashboard from './pages/AdminDashboard';
import InstituteOfficerDashboard from './pages/InstituteOfficerDashboard';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import EduTribeAssistant from './components/EduTribeAssistant';

import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <EduTribeAssistant />


        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/eligibility" element={<EligibilityChecker />} />

            
            <Route 
              path="/applicant" 
              element={
                <ProtectedRoute roles={['APPLICANT']}>
                  <ApplicantDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/officer" 
              element={
                <ProtectedRoute roles={['INSTITUTE_OFFICER']}>
                  <InstituteOfficerDashboard />
                </ProtectedRoute>
              } 
            />

            
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute roles={['MINISTRY_ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </LanguageProvider>
  </AuthProvider>
);
}

