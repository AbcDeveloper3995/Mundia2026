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
          { path: 'groups', element: <GroupsManager /> },
          { path: 'teams', element: <TeamsManager /> },
          { path: 'matches', element: <MatchesManager /> },
          { path: 'results', element: <ResultsPage /> },
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
