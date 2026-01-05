import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/50346ba1-6398-4d3a-b7ae-e83d28e057d9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProtectedRoute.tsx:9',message:'ProtectedRoute render',data:{isAuthenticated,hasUser:!!user,pathname:location.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  if (!isAuthenticated) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/50346ba1-6398-4d3a-b7ae-e83d28e057d9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProtectedRoute.tsx:13',message:'ProtectedRoute: redirecting to login',data:{pathname:location.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    // Redirect to login with return path
    return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

