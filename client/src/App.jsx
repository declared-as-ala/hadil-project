import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import { RequireAuth } from './hooks/useRoles';
import AppLayout from './components/layout/AppLayout';
import { ROLES } from './utils/constants';

// Auth pages
import LoginPage from './pages/auth/LoginPage';

// Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import EmployesPage from './pages/employes/EmployesPage';
import EmployeDetailPage from './pages/employes/EmployeDetailPage';
import EmployeFormPage from './pages/employes/EmployeFormPage';
import AbsencesPage from './pages/absences/AbsencesPage';
import CongesPage from './pages/conges/CongesPage';
import HeuresSupPage from './pages/heuresSup/HeuresSupPage';
import MessagesPage from './pages/messages/MessagesPage';

import DocumentsAdminPage from './pages/documentsAdmin/DocumentsAdminPage';
import PaiePage from './pages/paie/PaiePage';
import ProfilePage from './pages/profile/Profile';
import UnauthorizedPage from './pages/errors/UnauthorizedPage';
import CvAiPage from './pages/cvAi/CvAiPage';
import CvAiDetailPage from './pages/cvAi/CvAiDetailPage';
import CvAiChatPage from './pages/cvAi/CvAiChatPage';
import CvAiHistoryPage from './pages/cvAi/CvAiHistoryPage';

// Styles
import './styles/variables.css';
import './styles/global.css';

// Wrapper for pages that need the layout
function LayoutPage({ children }) {
  return (
    <RequireAuth>
      <AppLayout>{children}</AppLayout>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<Navigate to="/login" replace />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <LayoutPage>
                  <DashboardPage />
                </LayoutPage>
              }
            />

            {/* Employees */}
            <Route
              path="/employes"
              element={
                <LayoutPage>
                  <RequireAuth roles={[ROLES.ADMIN, ROLES.RH]}>
                    <EmployesPage />
                  </RequireAuth>
                </LayoutPage>
              }
            />
            <Route
              path="/employes/:id"
              element={
                <LayoutPage>
                  <RequireAuth roles={[ROLES.ADMIN, ROLES.RH]}>
                    <EmployeDetailPage />
                  </RequireAuth>
                </LayoutPage>
              }
            />
            <Route
              path="/employes/new"
              element={
                <LayoutPage>
                  <RequireAuth roles={[ROLES.ADMIN, ROLES.RH]}>
                    <EmployeFormPage />
                  </RequireAuth>
                </LayoutPage>
              }
            />
            <Route
              path="/employes/:id/edit"
              element={
                <LayoutPage>
                  <RequireAuth roles={[ROLES.ADMIN, ROLES.RH]}>
                    <EmployeFormPage />
                  </RequireAuth>
                </LayoutPage>
              }
            />


            {/* Absences */}
            <Route
              path="/absences"
              element={
                <LayoutPage>
                  <RequireAuth roles={[ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE]}>
                    <AbsencesPage />
                  </RequireAuth>
                </LayoutPage>
              }
            />

            {/* Conges */}
            <Route
              path="/conges"
              element={
                <LayoutPage>
                  <RequireAuth roles={[ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE]}>
                    <CongesPage />
                  </RequireAuth>
                </LayoutPage>
              }
            />

            {/* Heures Supplementaires */}
            <Route
              path="/heures-sup"
              element={
                <LayoutPage>
                  <RequireAuth roles={[ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE]}>
                    <HeuresSupPage />
                  </RequireAuth>
                </LayoutPage>
              }
            />



            {/* Messages */}
            <Route
              path="/messages"
              element={
                <LayoutPage>
                  <RequireAuth roles={[ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE]}>
                    <MessagesPage />
                  </RequireAuth>
                </LayoutPage>
              }
            />




            {/* Profile */}
            <Route
              path="/profile"
              element={
                <LayoutPage>
                  <ProfilePage />
                </LayoutPage>
              }
            />

            {/* Documents Administratifs */}
            <Route
              path="/documents-admin"
              element={
                <LayoutPage>
                  <RequireAuth roles={[ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE]}>
                    <DocumentsAdminPage />
                  </RequireAuth>
                </LayoutPage>
              }
            />

            {/* Paie */}
            <Route
              path="/paie"
              element={
                <LayoutPage>
                  <RequireAuth roles={[ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE]}>
                    <PaiePage />
                  </RequireAuth>
                </LayoutPage>
              }
            />

            {/* AI CV Analyzer */}
            <Route
              path="/hr/cv-ai"
              element={
                <LayoutPage>
                  <RequireAuth roles={[ROLES.ADMIN, ROLES.RH]}>
                    <CvAiPage />
                  </RequireAuth>
                </LayoutPage>
              }
            />
            <Route
              path="/hr/cv-ai/history"
              element={
                <LayoutPage>
                  <RequireAuth roles={[ROLES.ADMIN, ROLES.RH]}>
                    <CvAiHistoryPage />
                  </RequireAuth>
                </LayoutPage>
              }
            />
            <Route
              path="/hr/cv-ai/:id"
              element={
                <LayoutPage>
                  <RequireAuth roles={[ROLES.ADMIN, ROLES.RH]}>
                    <CvAiDetailPage />
                  </RequireAuth>
                </LayoutPage>
              }
            />
            <Route
              path="/hr/cv-ai/:id/chat"
              element={
                <LayoutPage>
                  <RequireAuth roles={[ROLES.ADMIN, ROLES.RH]}>
                    <CvAiChatPage />
                  </RequireAuth>
                </LayoutPage>
              }
            />



            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
