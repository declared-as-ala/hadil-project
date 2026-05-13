import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import { RequireAuth } from './hooks/useRoles';
import AppLayout from './components/layout/AppLayout';
import { ROLES } from './utils/constants';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

// Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import EmployesPage from './pages/employes/EmployesPage';
import EmployeDetailPage from './pages/employes/EmployeDetailPage';
import EmployeFormPage from './pages/employes/EmployeFormPage';
import StagiairesPage from './pages/stagiaires/StagiairesPage';
import AbsencesPage from './pages/absences/AbsencesPage';
import CongesPage from './pages/conges/CongesPage';
import HeuresSupPage from './pages/heuresSup/HeuresSupPage';
import DemandesPage from './pages/demandes/DemandesPage';
import MessagesPage from './pages/messages/MessagesPage';
import ProjetsPage from './pages/projets/ProjetsPage';
import TachesPage from './pages/taches/TachesPage';
import ReunionsPage from './pages/reunions/ReunionsPage';
import ContratsPage from './pages/contrats/ContratsPage';
import AdminPage from './pages/admin/AdminPage';
import DocumentsAdminPage from './pages/documentsAdmin/DocumentsAdminPage';
import PaiePage from './pages/paie/PaiePage';
import ProfilePage from './pages/profile/Profile';
import UnauthorizedPage from './pages/errors/UnauthorizedPage';

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
            <Route path="/signup" element={<SignupPage />} />
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

            {/* Stagiaires */}
            <Route
              path="/stagiaires"
              element={
                <LayoutPage>
                  <RequireAuth roles={[ROLES.ADMIN, ROLES.RH]}>
                    <StagiairesPage />
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

            {/* Demandes */}
            <Route
              path="/demandes"
              element={
                <LayoutPage>
                  <RequireAuth roles={[ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE, ROLES.STAGIAIRE]}>
                    <DemandesPage />
                  </RequireAuth>
                </LayoutPage>
              }
            />

            {/* Messages */}
            <Route
              path="/messages"
              element={
                <LayoutPage>
                  <RequireAuth roles={[ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE, ROLES.STAGIAIRE]}>
                    <MessagesPage />
                  </RequireAuth>
                </LayoutPage>
              }
            />

            {/* Projets */}
            <Route
              path="/projets"
              element={
                <LayoutPage>
                  <RequireAuth roles={[ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE]}>
                    <ProjetsPage />
                  </RequireAuth>
                </LayoutPage>
              }
            />

            {/* Taches */}
            <Route
              path="/taches"
              element={
                <LayoutPage>
                  <RequireAuth roles={[ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE]}>
                    <TachesPage />
                  </RequireAuth>
                </LayoutPage>
              }
            />

            {/* Reunions */}
            <Route
              path="/reunions"
              element={
                <LayoutPage>
                  <RequireAuth roles={[ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE]}>
                    <ReunionsPage />
                  </RequireAuth>
                </LayoutPage>
              }
            />

            {/* Contrats */}
            <Route
              path="/contrats"
              element={
                <LayoutPage>
                  <RequireAuth roles={[ROLES.ADMIN, ROLES.RH]}>
                    <ContratsPage />
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

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <LayoutPage>
                  <RequireAuth roles={[ROLES.ADMIN]}>
                    <AdminPage />
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
