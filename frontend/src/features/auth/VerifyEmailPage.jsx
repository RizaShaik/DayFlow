import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthCard } from '../../components/common/AuthCard.jsx';
import { Alert } from '../../components/common/Alert.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export function VerifyEmailPage() {
  const { token } = useParams();
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    verifyEmail(token)
      .then((user) => {
        navigate(user.mustChangePassword ? '/change-password' : '/', { replace: true });
      })
      .catch((err) => {
        setError(err.response?.data?.error?.message || 'Verification link is invalid or expired.');
      });
  }, [token, verifyEmail, navigate]);

  return (
    <AuthCard title="Verifying your email…">
      <Alert>{error}</Alert>
      {error && (
        <Link to="/signin" className="text-sm text-primary hover:underline">
          Back to Sign In
        </Link>
      )}
    </AuthCard>
  );
}
