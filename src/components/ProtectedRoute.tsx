import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute() {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-app-bg text-app-accent">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdopter = profile?.role === 'ADOPTER' || (user?.user_metadata?.role === 'ADOPTER');
  const hasOnboardingAnswers = profile?.onboarding_answers && Object.keys(profile.onboarding_answers).length > 0;
  
  if (isAdopter && !hasOnboardingAnswers && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (isAdopter && hasOnboardingAnswers && location.pathname === '/onboarding') {
     return <Navigate to="/" replace />;
  }

  // Если авторизован - рендерим дочерние роуты (Layout и страницы)
  return <Outlet />;
}
