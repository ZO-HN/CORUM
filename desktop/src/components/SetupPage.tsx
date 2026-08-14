import React, { useState } from 'react';
import { User, Mail, Lock, ShieldCheck, KeyRound, Crown, AlertTriangle, X, Eye, EyeOff, Check, XCircle, Download, Camera } from 'lucide-react';

import defaultLogo from '../assets/logo.png';

// intentionally stricter than the HTML5 `type="email"` check, which accepts
// things like "a@b" — requires a real-looking domain with a dot.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Requires at least a first and last name (so "Juan" alone is rejected), and
// that the first/last parts are real names rather than stray single letters.
// A middle part may be a bare or period-terminated initial (e.g. "D." / "D"),
// so "Juan D. Cruz" and "Juan D Cruz" are both valid.
function isValidFullName(name: string): boolean {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return false;
  const first = parts[0];
  const last = parts[parts.length - 1];
  return first.length >= 2 && last.length >= 2;
}

type FieldErrors = Partial<Record<
  'fullName' | 'email' | 'password' | 'confirmPassword' | 'securityPasskey' | 'confirmSecurityPasskey',
  string
>>;

interface SetupPageProps {
  onSetup: (fullName: string, email: string, password: string, securityPasskey: string) => void;
  setupError: string | null;
  isSettingUp: boolean;
  dbStatus: 'connected' | 'disconnected';
  barangayLogo: string;
  onBackToLogin?: () => void;
}

// Small reusable "does this match?" indicator shown next to confirm fields.
function MatchBadge({ matches, mismatches }: { matches: boolean; mismatches: boolean }) {
  if (matches) {
    return (
      <span className="absolute inset-y-0 right-10 flex items-center text-emerald-500" title="Matches">
        <Check className="w-4 h-4" />
      </span>
    );
  }
  if (mismatches) {
    return (
      <span className="absolute inset-y-0 right-10 flex items-center text-red-500" title="Does not match">
        <XCircle className="w-4 h-4" />
      </span>
    );
  }
  return null;
}

const baseInputClass = "w-full bg-surface-container-highest border rounded-lg py-3 pl-10 text-on-surface placeholder:text-on-surface-variant/40 transition-all duration-200 font-body text-sm";
const okBorder = "border-transparent focus:ring-1 focus:ring-primary/50";
const errBorder = "border-red-500/60 ring-1 ring-red-500/40 focus:ring-1 focus:ring-red-500/60";

export default function SetupPage({
  onSetup,
  setupError,
  isSettingUp,
  dbStatus,
  barangayLogo,
  onBackToLogin,
}: SetupPageProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityPasskey, setSecurityPasskey] = useState('');
  const [confirmSecurityPasskey, setConfirmSecurityPasskey] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);
  const [showConfirmPasskey, setShowConfirmPasskey] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const passkeysMatch = confirmSecurityPasskey.length > 0 && securityPasskey === confirmSecurityPasskey;
  const passkeysMismatch = confirmSecurityPasskey.length > 0 && securityPasskey !== confirmSecurityPasskey;

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors(prev => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: FieldErrors = {};

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required.';
    } else if (!isValidFullName(fullName)) {
      errors.fullName = 'Enter a first and last name (e.g. "Juan Cruz" or "Juan D. Cruz").';
    }

    if (!email.trim()) {
      errors.email = 'Email is required.';
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = 'Enter a valid email address (e.g. officer@sk.gov).';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Must be at least 8 characters long.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please re-enter the password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!securityPasskey) {
      errors.securityPasskey = 'Security passkey is required.';
    } else if (securityPasskey.length < 5) {
      errors.securityPasskey = 'Must be at least 5 characters long.';
    }

    if (!confirmSecurityPasskey) {
      errors.confirmSecurityPasskey = 'Please re-enter the security passkey.';
    } else if (securityPasskey !== confirmSecurityPasskey) {
      errors.confirmSecurityPasskey = 'Security passkeys do not match.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setAcknowledged(false);
    setHasSavedCredentials(false);
    setShowConfirmModal(true);
  };

  const handleDownloadCredentials = () => {
    const contents =
      `CORUM — Super Admin Account Credentials\n` +
      `Generated: ${new Date().toLocaleString()}\n\n` +
      `Full Name: ${fullName}\n` +
      `Email: ${email}\n` +
      `Password: ${password}\n` +
      `Settings Security Passkey: ${securityPasskey}\n\n` +
      `Keep this file somewhere secure and delete it once the credentials have been\n` +
      `safely handed off to the authorized administrator. This information will not\n` +
      `be shown again after the account is created.\n`;

    const blob = new Blob([contents], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'corum-super-admin-credentials.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setHasSavedCredentials(true);
  };

  const handleConfirmCreate = () => {
    setShowConfirmModal(false);
    onSetup(fullName.trim(), email.trim(), password, securityPasskey);
  };

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen flex items-center justify-center p-4 selection:bg-primary selection:text-on-primary relative overflow-hidden">
      {/* Background Atmospheric Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-secondary/5 blur-[120px]"></div>
      </div>

      <main className="relative w-full max-w-md">
        {/* Setup Container */}
        <div className="glass-panel glow-accent rounded-xl p-8 md:p-10 flex flex-col items-center">
          {/* Branding Header */}
          <div className="mb-8 text-center">
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center mb-1 mx-auto">
              <img
                src={defaultLogo}
                alt="CORUM Logo Frame"
                className="w-full h-full object-contain z-10"
              />
              {barangayLogo && barangayLogo !== defaultLogo && (
                <img
                  src={barangayLogo}
                  alt="Barangay Logo"
                  className="absolute w-[44%] h-[44%] rounded-full object-cover z-0"
                  style={{
                    top: '28%',
                    left: '28%'
                  }}
                />
              )}
            </div>
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
              CORUM
            </h1>
            <p className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant mt-2 font-semibold text-secondary">
              Youth Information System
            </p>
            <p className="text-[10px] italic text-on-surface-variant/70 mt-1 max-w-[280px] mx-auto">
              "Kabataang Magkakaugnay. Pamayanang Maunlad."
            </p>
          </div>

          {/* Setup Intro */}
          <div className="w-full flex items-start gap-2.5 bg-primary/10 border border-primary/20 text-primary text-xs rounded-lg p-3 mb-4">
            <Crown className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Welcome to CORUM. No administrator account exists yet — set one up below.
              This account will be granted full Super Admin access immediately.
            </span>
          </div>

          {/* Setup Form */}
          <form onSubmit={handleSubmit} noValidate className="w-full space-y-4">
            {setupError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg p-3 text-center">
                {setupError}
              </div>
            )}

            {/* Full Name Field */}
            <div className="space-y-1.5">
              <label className="font-label text-xs font-medium text-on-surface-variant px-1" htmlFor="fullName">
                Full Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <input
                  className={`${baseInputClass} pr-4 ${fieldErrors.fullName ? errBorder : okBorder}`}
                  id="fullName"
                  name="fullName"
                  placeholder="e.g. Juan D. Cruz"
                  type="text"
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); clearFieldError('fullName'); }}
                  autoComplete="name"
                />
              </div>
              {fieldErrors.fullName && (
                <p className="text-red-500 text-[10px] px-1">{fieldErrors.fullName}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="font-label text-xs font-medium text-on-surface-variant px-1" htmlFor="email">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  className={`${baseInputClass} pr-4 ${fieldErrors.email ? errBorder : okBorder}`}
                  id="email"
                  name="email"
                  placeholder="officer_id@sk.gov"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                  autoComplete="email"
                />
              </div>
              {fieldErrors.email && (
                <p className="text-red-500 text-[10px] px-1">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="font-label text-xs font-medium text-on-surface-variant px-1" htmlFor="password">
                Account Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  className={`${baseInputClass} pr-10 ${fieldErrors.password ? errBorder : okBorder}`}
                  id="password"
                  name="password"
                  placeholder="Minimum 8 characters"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-on-surface-variant hover:text-primary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-500 text-[10px] px-1">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label className="font-label text-xs font-medium text-on-surface-variant px-1" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  className={`${baseInputClass} pr-16 ${fieldErrors.confirmPassword ? errBorder : okBorder}`}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); }}
                  autoComplete="new-password"
                />
                <MatchBadge matches={passwordsMatch} mismatches={passwordsMismatch} />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-on-surface-variant hover:text-primary transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-red-500 text-[10px] px-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Security Passkey Field */}
            <div className="space-y-1.5">
              <label className="font-label text-xs font-medium text-on-surface-variant px-1" htmlFor="securityPasskey">
                Settings Security Passkey
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <input
                  className={`${baseInputClass} pr-10 ${fieldErrors.securityPasskey ? errBorder : okBorder}`}
                  id="securityPasskey"
                  name="securityPasskey"
                  placeholder="Minimum 5 characters"
                  type={showPasskey ? 'text' : 'password'}
                  value={securityPasskey}
                  onChange={(e) => { setSecurityPasskey(e.target.value); clearFieldError('securityPasskey'); }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasskey(v => !v)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-on-surface-variant hover:text-primary transition-colors"
                  aria-label={showPasskey ? 'Hide passkey' : 'Show passkey'}
                >
                  {showPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.securityPasskey && (
                <p className="text-red-500 text-[10px] px-1">{fieldErrors.securityPasskey}</p>
              )}
              <p className="text-[10px] text-on-surface-variant/70 px-1 leading-relaxed">
                Note: this passkey is separate from your account password. It will be used later in
                Settings → User Management &amp; Configuration to unlock those screens.
              </p>
            </div>

            {/* Confirm Security Passkey Field */}
            <div className="space-y-1.5">
              <label className="font-label text-xs font-medium text-on-surface-variant px-1" htmlFor="confirmSecurityPasskey">
                Confirm Security Passkey
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  className={`${baseInputClass} pr-16 ${fieldErrors.confirmSecurityPasskey ? errBorder : okBorder}`}
                  id="confirmSecurityPasskey"
                  name="confirmSecurityPasskey"
                  placeholder="Re-enter security passkey"
                  type={showConfirmPasskey ? 'text' : 'password'}
                  value={confirmSecurityPasskey}
                  onChange={(e) => { setConfirmSecurityPasskey(e.target.value); clearFieldError('confirmSecurityPasskey'); }}
                  autoComplete="new-password"
                />
                <MatchBadge matches={passkeysMatch} mismatches={passkeysMismatch} />
                <button
                  type="button"
                  onClick={() => setShowConfirmPasskey(v => !v)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-on-surface-variant hover:text-primary transition-colors"
                  aria-label={showConfirmPasskey ? 'Hide passkey' : 'Show passkey'}
                >
                  {showConfirmPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.confirmSecurityPasskey && (
                <p className="text-red-500 text-[10px] px-1">{fieldErrors.confirmSecurityPasskey}</p>
              )}
            </div>

            {/* Setup Button */}
            <div className="pt-4">
              <button
                className="w-full bg-primary hover:bg-primary-fixed-dim text-on-primary font-headline font-bold py-3.5 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50"
                type="submit"
                disabled={isSettingUp}
              >
                {isSettingUp ? 'Creating Account...' : 'Create Super Admin Account'}
              </button>
            </div>

            {onBackToLogin && (
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="font-label text-xs text-on-surface-variant hover:text-primary transition-colors"
                >
                  Back to Login
                </button>
              </div>
            )}
          </form>

          {/* Footer Compliance */}
          <div className="mt-8 pt-4 border-t border-outline-variant/10 w-full text-center">
            <p className="font-label text-[10px] text-on-surface-variant/60 leading-relaxed uppercase tracking-tighter">
              This setup screen only appears once. <br/>
              Secure encrypted channel active.
            </p>
          </div>
        </div>

        {/* System Status Bar */}
        <div className="mt-6 flex justify-between items-center px-4">
          <div className="flex items-center gap-2">
            {dbStatus === 'connected' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-label text-[10px] text-on-surface-variant/40">Database: Connected</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                <span className="font-label text-[10px] text-on-surface-variant/40">Database: Not Connected</span>
              </>
            )}
          </div>
          <div className="flex gap-4">
            <a className="font-label text-[10px] text-on-surface-variant/40 hover:text-primary" href="#">Privacy Policy & Terms</a>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-surface/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-xl p-6 md:p-8 space-y-5 border border-[#353535]/20 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-[#353535]/10 pb-4">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="font-headline font-black text-lg text-on-surface pt-1">
                  Confirm Super Admin Creation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1 hover:bg-surface-container-highest rounded-lg transition-colors text-on-surface-variant hover:text-on-surface shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-on-surface-variant leading-relaxed">
              <p>You are about to create the account:</p>
              <div className="bg-[#181818] rounded-lg p-3 border border-outline-variant/10 space-y-1">
                <p className="text-on-surface font-semibold text-sm">{fullName || '(no name entered)'}</p>
                <p className="text-on-surface-variant">{email}</p>
                <p className="text-on-surface-variant">Password: <span className="text-on-surface font-mono">{password}</span></p>
                <p className="text-on-surface-variant">Security Passkey: <span className="text-on-surface font-mono">{securityPasskey}</span></p>
              </div>
              <p>Please make sure you understand the following before continuing:</p>
              <ul className="list-disc list-inside space-y-1.5">
                <li>This action <span className="text-on-surface font-semibold">cannot be undone</span> — this exact setup screen will not appear again.</li>
                <li>This is the <span className="text-on-surface font-semibold">only</span> way a super admin account is created this way; there is no equivalent flow to create another one later.</li>
                <li>It is strongly recommended this account be given to the person with actual authority over this system (e.g. the SK Chairperson or designated administrator), not a placeholder or shared login.</li>
                <li>
                  <span className="text-on-surface font-semibold">Take a screenshot or download the credentials below</span> — the
                  password and passkey are shown here in plain text one time only and will never be displayed again.
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleDownloadCredentials}
              className="w-full flex items-center justify-center gap-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-500 font-bold text-xs py-2.5 rounded-lg transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download Credentials as .txt (plaintext — handle with care)
            </button>

            {!hasSavedCredentials && (
              <p className="flex items-center gap-1.5 text-[10px] text-on-surface-variant/70 justify-center">
                <Camera className="w-3 h-3" />
                Or take a screenshot of this dialog before continuing.
              </p>
            )}

            <label className="flex items-start gap-2.5 text-xs text-on-surface cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 accent-primary w-3.5 h-3.5 shrink-0"
              />
              <span>I understand this cannot be undone, I have saved these credentials, and confirm this account should belong to the authorized administrator.</span>
            </label>

            <div className="flex justify-end gap-3 border-t border-[#353535]/10 pt-4">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-[#181818] text-on-surface rounded-lg font-bold text-xs hover:bg-[#202020] transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                disabled={!acknowledged || isSettingUp}
                className="px-5 py-2.5 bg-primary text-on-primary rounded-lg font-headline font-black text-xs hover:opacity-95 shadow-md active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSettingUp ? 'Creating...' : 'Yes, Create Super Admin Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
