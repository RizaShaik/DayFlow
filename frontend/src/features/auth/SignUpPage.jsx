import { useRef, useState } from 'react';
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
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const logoInputRef = useRef(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleLogoChange(e) {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    setLogoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
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
      const formData = new FormData();
      formData.append('companyName', form.companyName);
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('password', form.password);
      if (logoFile) formData.append('logo', logoFile);

      const { loginId, verificationUrl } = await signUp(formData);
      setResult({ loginId, email: form.email, verificationUrl });
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
          Account created. {result.verificationUrl ? '' : `We sent a verification link to ${result.email}.`}
        </Alert>
        <p className="text-sm text-text-muted">
          Your Login ID is <strong className="text-text">{result.loginId}</strong> — you&rsquo;ll
          use it to sign in from now on.
        </p>
        {result.verificationUrl ? (
          <div className="rounded-md border border-warning/30 bg-warning/10 p-4 text-sm">
            <p className="text-text">
              SMTP isn&rsquo;t configured, so no email was actually sent — verify your account
              directly:
            </p>
            <Link
              to={result.verificationUrl.replace(/^https?:\/\/[^/]+/, '')}
              className="mt-2 inline-block break-all font-medium text-primary hover:underline"
            >
              {result.verificationUrl}
            </Link>
          </div>
        ) : (
          <Link to="/signin" className="text-sm text-primary hover:underline">
            Back to Sign In
          </Link>
        )}
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set up Dayflow" subtitle="Create your company workspace and admin account.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Alert>{error}</Alert>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden
                       rounded-full border border-dashed border-border bg-surface-alt text-xs
                       text-text-muted hover:border-primary hover:text-primary"
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Company logo preview" className="h-full w-full object-cover" />
            ) : (
              'Logo'
            )}
          </button>
          <div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleLogoChange}
              className="hidden"
            />
            <Button type="button" variant="ghost" onClick={() => logoInputRef.current?.click()}>
              {logoPreview ? 'Change logo' : 'Upload company logo'}
            </Button>
            <p className="mt-1 text-xs text-text-muted">Optional. JPEG, PNG, or WebP.</p>
          </div>
        </div>

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
