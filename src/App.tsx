import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider, useLang } from './i18n/LanguageContext';
import PublicLayout, { dashboardPathFor } from './components/layout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import { Spinner } from './components/ui/Primitives';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import AvailableDonationsPage from './pages/AvailableDonationsPage';
import ImpactPage from './pages/ImpactPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import DonorOverview from './pages/donor/DonorOverview';
import DonorDonations from './pages/donor/DonorDonations';
import NewDonationPage from './pages/donor/NewDonationPage';
import DonorRequests from './pages/donor/DonorRequests';
import BeneficiaryOverview from './pages/beneficiary/BeneficiaryOverview';
import BrowseFoodPage from './pages/beneficiary/BrowseFoodPage';
import MyRequestsPage from './pages/beneficiary/MyRequestsPage';
import NewRequestPage from './pages/beneficiary/NewRequestPage';
import VolunteerOverview from './pages/volunteer/VolunteerOverview';
import VolunteerTasksPage from './pages/volunteer/VolunteerTasksPage';
import VolunteerHistoryPage from './pages/volunteer/VolunteerHistoryPage';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminDonationsPage from './pages/admin/AdminDonationsPage';
import AdminRequestsPage from './pages/admin/AdminRequestsPage';
import AdminMatchingPage from './pages/admin/AdminMatchingPage';
import AdminDeliveriesPage from './pages/admin/AdminDeliveriesPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import type { Role } from './lib/types';

function RequireAuth({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth();
  const { t } = useLang();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner label={t('common.loading')} />
      </div>
    );
  }
  if (!profile) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return <>{children}</>;
}

function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { profile } = useAuth();
  if (!profile) return null;
  if (profile.role !== role) return <Navigate to={dashboardPathFor(profile.role)} replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/donations" element={<AvailableDonationsPage />} />
              <Route path="/impact" element={<ImpactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            <Route
              element={
                <RequireAuth>
                  <DashboardLayout />
                </RequireAuth>
              }
            >
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />

              <Route
                path="/donor"
                element={
                  <RequireRole role="donor">
                    <DonorOverview />
                  </RequireRole>
                }
              />
              <Route
                path="/donor/donations"
                element={
                  <RequireRole role="donor">
                    <DonorDonations />
                  </RequireRole>
                }
              />
              <Route
                path="/donor/donations/new"
                element={
                  <RequireRole role="donor">
                    <NewDonationPage />
                  </RequireRole>
                }
              />
              <Route
                path="/donor/requests"
                element={
                  <RequireRole role="donor">
                    <DonorRequests />
                  </RequireRole>
                }
              />

              <Route
                path="/beneficiary"
                element={
                  <RequireRole role="beneficiary">
                    <BeneficiaryOverview />
                  </RequireRole>
                }
              />
              <Route
                path="/beneficiary/browse"
                element={
                  <RequireRole role="beneficiary">
                    <BrowseFoodPage />
                  </RequireRole>
                }
              />
              <Route
                path="/beneficiary/requests"
                element={
                  <RequireRole role="beneficiary">
                    <MyRequestsPage />
                  </RequireRole>
                }
              />
              <Route
                path="/beneficiary/requests/new"
                element={
                  <RequireRole role="beneficiary">
                    <NewRequestPage />
                  </RequireRole>
                }
              />

              <Route
                path="/volunteer"
                element={
                  <RequireRole role="volunteer">
                    <VolunteerOverview />
                  </RequireRole>
                }
              />
              <Route
                path="/volunteer/tasks"
                element={
                  <RequireRole role="volunteer">
                    <VolunteerTasksPage />
                  </RequireRole>
                }
              />
              <Route
                path="/volunteer/history"
                element={
                  <RequireRole role="volunteer">
                    <VolunteerHistoryPage />
                  </RequireRole>
                }
              />

              <Route
                path="/admin"
                element={
                  <RequireRole role="admin">
                    <AdminOverview />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <RequireRole role="admin">
                    <AdminUsersPage />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/donations"
                element={
                  <RequireRole role="admin">
                    <AdminDonationsPage />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/requests"
                element={
                  <RequireRole role="admin">
                    <AdminRequestsPage />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/matching"
                element={
                  <RequireRole role="admin">
                    <AdminMatchingPage />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/deliveries"
                element={
                  <RequireRole role="admin">
                    <AdminDeliveriesPage />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <RequireRole role="admin">
                    <AdminAnalyticsPage />
                  </RequireRole>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}
