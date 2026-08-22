import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthCard } from '../../components/common/AuthCard.jsx';
import { TextField } from '../../components/common/TextField.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Alert } from '../../components/common/Alert.jsx';
import { useAuth } from '../../hooks/useAuth.js';

const initialForm = { companyName: '', name: '', email: '', password: '', confirmPassword: '' };

export function SignUpPage() {
  const { signUp } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const { loginId } = await signUp({
        companyName: form.companyName,
        name: form.name,
        email: form.email,
        password: form.password,
      });
      setResult({ loginId, email: form.email });
    } catch (err) {
      const apiError = err.response?.data?.error;
      const message =
        apiError?.details?.map((d) => d.message).join(' ') ||
        apiError?.message ||
        'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <AuthCard title="Check your email">
        <Alert variant="success">
          Account created. We sent a verification link to <strong>{result.email}</strong>.
        </Alert>
        <p className="text-sm text-text-muted">
          Your Login ID is <strong className="text-text">{result.loginId}</strong> — you&rsquo;ll
          use it to sign in from now on.
        </p>
        <Link to="/signin" className="text-sm text-primary hover:underline">
          Back to Sign In
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set up Dayflow" subtitle="Create your company workspace and admin account.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Alert>{error}</Alert>
        <TextField
          id="companyName"
          label="Company Name"
          value={form.companyName}
          onChange={update('companyName')}
          required
        />
        <TextField id="name" label="Your Name" value={form.name} onChange={update('name')} required />
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={update('email')}
          required
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={update('password')}
          required
        />
        <TextField
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={update('confirmPassword')}
          required
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Sign Up'}
        </Button>
      </form>
      <p className="text-center text-sm text-text-muted">
        Already have an account?{' '}
        <Link to="/signin" className="text-primary hover:underline">
          Sign In
        </Link>
      </p>
    </AuthCard>
  );
}
