import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { FullPageSpinner } from './components/Spinner';

// Auth
import Welcome  from './pages/auth/Welcome';
import Login    from './pages/auth/Login';
import Register from './pages/auth/Register';
import Terms       from './pages/auth/Terms';
import VerifyEmail from './pages/auth/VerifyEmail';

// Onboarding
import KYC from './pages/onboarding/KYC';

// App
import Dashboard       from './pages/app/Dashboard';
import Estates         from './pages/app/Estates';
import Contracts       from './pages/app/Contracts';
import Payment         from './pages/app/Payment';
import PaymentCallback from './pages/app/PaymentCallback';
import PaymentReceipt  from './pages/app/PaymentReceipt';
import Profile         from './pages/app/Profile';
import Documents       from './pages/app/Documents';
import Notifications   from './pages/app/Notifications';
import Support         from './pages/app/Support';
import Referral        from './pages/app/Referral';
import LoanRequest     from './pages/app/LoanRequest';
import ROICalculator   from './pages/app/ROICalculator';
import Inspection      from './pages/app/Inspection';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!user)   return <Navigate to="/login" replace />;
  if (!user.terms_accepted) return <Navigate to="/terms" replace />;
  if (user.kyc_status === 'not_submitted') return <Navigate to="/kyc" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (user && user.terms_accepted && user.kyc_status !== 'not_submitted')
    return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"         element={<PublicRoute><Welcome /></PublicRoute>} />
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/terms"        element={<Terms />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/kyc"          element={<KYC />} />

      {/* Protected */}
      <Route path="/dashboard"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/estates"         element={<ProtectedRoute><Estates /></ProtectedRoute>} />
      <Route path="/contracts"       element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
      <Route path="/payment"          element={<ProtectedRoute><Payment /></ProtectedRoute>} />
      <Route path="/payment/callback" element={<ProtectedRoute><PaymentCallback /></ProtectedRoute>} />
      <Route path="/payment-receipt"  element={<ProtectedRoute><PaymentReceipt /></ProtectedRoute>} />
      <Route path="/profile"         element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/documents"       element={<ProtectedRoute><Documents /></ProtectedRoute>} />
      <Route path="/notifications"   element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/support"         element={<ProtectedRoute><Support /></ProtectedRoute>} />
      <Route path="/referral"        element={<ProtectedRoute><Referral /></ProtectedRoute>} />
      <Route path="/loan"            element={<ProtectedRoute><LoanRequest /></ProtectedRoute>} />
      <Route path="/roi"             element={<ProtectedRoute><ROICalculator /></ProtectedRoute>} />
      <Route path="/inspection"      element={<ProtectedRoute><Inspection /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
