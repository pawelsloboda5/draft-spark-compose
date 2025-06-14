
import { useHasProfile } from "@/hooks/useHasProfile";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Navigate } from "react-router-dom";

/**
 * - If not logged in, go to /auth
 * - If on /setup, only allow if !hasProfile; else go to /dashboard
 * - For protected routes, if !hasProfile, go to /setup
 */
const RequireProfile = ({
  children,
  setupOnly = false,
}: {
  children: React.ReactNode;
  setupOnly?: boolean;
}) => {
  const { user, loading } = useAuth();
  const { hasProfile, isLoading } = useHasProfile();
  const location = useLocation();

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-lg">Loading…</span>
      </div>
    );
  }

  // Not logged in → always go to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If on /setup
  if (location.pathname === "/setup") {
    if (hasProfile) {
      // Profile exists, skip setup
      return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
  }

  // For all other protected routes, require profile
  if (!hasProfile) {
    return <Navigate to="/setup" replace />;
  }

  // Everything OK!
  return <>{children}</>;
};

export default RequireProfile;
