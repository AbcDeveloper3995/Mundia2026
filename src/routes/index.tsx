import { Navigate, Outlet, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { AuthLayout } from '@/layouts/AuthLayout';
import { MainLayout } from '@/layouts/MainLayout';
import { LoginPage } from '@/modules/auth/pages/LoginPage';
import { RegisterPage } from '@/modules/auth/pages/RegisterPage';
import { DashboardPage } from '@/modules/dashboard/pages/DashboardPage';
import { GroupsManager } from '@/modules/admin/pages/GroupsManager';
import { TeamsManager } from '@/modules/admin/pages/TeamsManager';
import { MatchesManager } from '@/modules/admin/pages/MatchesManager';
import { ResultsPage } from '@/modules/dashboard/pages/ResultsPage';
import { PredictionsPage } from '@/modules/dashboard/pages/PredictionsPage';
import { LeaderboardPage } from '@/modules/dashboard/pages/LeaderboardPage';
import { Box, CircularProgress } from '@mui/material';

const ProtectedRoute = () => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const AdminRoute = () => {
  const { role, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

const PublicRoute = () => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { index: true, element: <Navigate to="/login" replace /> },
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
        ],
      },
    ],
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'results', element: <ResultsPage /> },
          { path: 'predictions', element: <PredictionsPage /> },
          { path: 'leaderboard', element: <LeaderboardPage /> },
          { 
            element: <AdminRoute />, 
            children: [
              { path: 'groups', element: <GroupsManager /> },
              { path: 'teams', element: <TeamsManager /> },
              { path: 'matches', element: <MatchesManager /> },
            ] 
          }
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
