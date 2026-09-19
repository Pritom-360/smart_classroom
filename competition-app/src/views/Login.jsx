import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Key,
  ShieldCheck,
  RotateCcw,
  ArrowRight,
  Timer
} from 'lucide-react';
import { supabase } from '../utils/supabase';
import useDocumentMetadata from '../hooks/useDocumentMetadata';
import { getResendStatus, recordResendAttempt, RESEND_COOLDOWN_SECONDS, MAX_DAILY_RESENDS } from '../utils/otpRateLimiter';

const CODE_VALIDITY_DURATION_SEC = 600; // 10 minutes code validity

export default function Login() {
  useDocumentMetadata({
    title: 'Sign In & Verify - Catalyst Competitions',
    description: 'Log in to your Smart Classroom competition account to access dashboards, build badges, and submit project files.',
    canonicalUrl: 'https://www.catalyst-smart-classroom.me/competition.html#/login'
  });

  const { signIn } = useAuth();
  const navigate = useNavigate();

  // Mode: 'login' | 'unconfirmed_verify' | 'forgot_request' | 'forgot_verify'
  const [viewMode, setViewMode] = useState('login');

  // Sign In Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP State (Used for both unconfirmed signup verification & forgot password recovery)
  const [otpCode, setOtpCode] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');

  // Live Code Expiration Timer (10 Minutes)
  const [expiresIn, setExpiresIn] = useState(CODE_VALIDITY_DURATION_SEC);

  // Password Reset State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Rate Limiting Cooldown State
  const [cooldown, setCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState(() => getResendStatus(otpEmail || email, 'signup'));

  useEffect(() => {
    const targetEmail = otpEmail || email;
    if (targetEmail) {
      const type = viewMode.startsWith('forgot') ? 'recovery' : 'signup';
      setResendStatus(getResendStatus(targetEmail, type));
    }
  }, [otpEmail, email, viewMode]);

  // Cooldown countdown timer (60s)
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Code Expiration countdown timer (10 mins)
  useEffect(() => {
    let timer;
    if ((viewMode === 'unconfirmed_verify' || viewMode === 'forgot_verify') && expiresIn > 0) {
      timer = setInterval(() => {
        setExpiresIn(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [viewMode, expiresIn]);

  // Format seconds to MM:SS string
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // 1. Regular Sign In Handler
  // -------------------------------------------------------------
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email.trim().toLowerCase(), password);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message || '';
      // If the email is unconfirmed, automatically route to the OTP confirmation view
      if (msg.toLowerCase().includes('confirm') || msg.toLowerCase().includes('verified') || msg.toLowerCase().includes('not confirmed')) {
        const safeEmail = email.trim().toLowerCase();
        setOtpEmail(safeEmail);
        setOtpCode('');
        setOtpError('');
        setOtpSuccess('Your email is not verified yet. Please enter the 6-digit confirmation code sent to your inbox.');
        setViewMode('unconfirmed_verify');
        setExpiresIn(CODE_VALIDITY_DURATION_SEC);
        setCooldown(0);
      } else {
        setError(msg || 'Invalid login credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 2. Unconfirmed Email OTP Verification Handler
  // -------------------------------------------------------------
  const handleVerifyUnconfirmedOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');

    const cleanToken = otpCode.replace(/\s+/g, '').trim();
    if (!cleanToken || cleanToken.length < 6) {
      setOtpError('Please enter the full 6-digit confirmation code.');
      return;
    }

    if (expiresIn === 0) {
      setOtpError('⚠️ This 6-digit code has expired (10 minutes limit). Please click "Resend Code" below to receive a fresh code.');
      return;
    }

    const safeEmail = otpEmail.trim().toLowerCase();
    setOtpLoading(true);
    try {
      let { data, error: verifyErr } = await supabase.auth.verifyOtp({
        email: safeEmail,
        token: cleanToken,
        type: 'signup'
      });

      if (verifyErr) {
        const { data: retryData, error: retryErr } = await supabase.auth.verifyOtp({
          email: safeEmail,
          token: cleanToken,
          type: 'email'
        });

        if (retryErr) {
          const { error: magicErr } = await supabase.auth.verifyOtp({
            email: safeEmail,
            token: cleanToken,
            type: 'magiclink'
          });

          if (magicErr) {
            throw new Error(
              verifyErr.message ||
              'Token has expired or is invalid. If you received multiple emails, please enter the code from your newest email or click Resend.'
            );
          }
        }
      }

      setOtpSuccess('🎉 Email verified successfully! Redirecting to your dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);

    } catch (err) {
      setOtpError(err.message || 'Token has expired or is invalid. Please check your latest email.');
    } finally {
      setOtpLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 3. Forgot Password Request (Step 1: Send OTP)
  // -------------------------------------------------------------
  const handleForgotRequestSubmit = async (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');
    setOtpLoading(true);

    const targetEmail = otpEmail.trim().toLowerCase();
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(targetEmail);
      if (resetErr) throw resetErr;

      setViewMode('forgot_verify');
      setExpiresIn(CODE_VALIDITY_DURATION_SEC);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setOtpSuccess('A 6-digit password reset code has been sent to your email!');
    } catch (err) {
      setOtpError(err.message || 'Failed to send reset code.');
    } finally {
      setOtpLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 4. Forgot Password Verify & Update (Step 2: OTP + New Password)
  // -------------------------------------------------------------
  const handleForgotVerifySubmit = async (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');

    const cleanToken = otpCode.replace(/\s+/g, '').trim();
    if (!cleanToken || cleanToken.length < 6) {
      setOtpError('Please enter the full 6-digit reset code.');
      return;
    }

    if (expiresIn === 0) {
      setOtpError('⚠️ This 6-digit code has expired (10 minutes limit). Please click "Resend Code" below to receive a fresh code.');
      return;
    }

    if (newPassword.length < 6) {
      setOtpError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setOtpError('Passwords do not match.');
      return;
    }

    const safeEmail = otpEmail.trim().toLowerCase();
    setOtpLoading(true);
    try {
      // Verify Recovery OTP
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        email: safeEmail,
        token: cleanToken,
        type: 'recovery'
      });

      if (verifyErr) throw verifyErr;

      // Update to new password
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateErr) throw updateErr;

      setOtpSuccess('🎉 Password reset successfully! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (err) {
      setOtpError(err.message || 'Token has expired or is invalid. If you requested multiple codes, please enter the code from your latest email.');
    } finally {
      setOtpLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 5. Resend Code Helper with Daily Limit
  // -------------------------------------------------------------
  const handleResendOtp = async (type = 'signup') => {
    if (cooldown > 0) return;
    const targetEmail = (otpEmail || email).trim().toLowerCase();
    const status = getResendStatus(targetEmail, type);

    if (status.isMaxed) {
      setOtpError('⚠️ You have reached the maximum limit of 3 resends for today. Please check your Spam folder or try again tomorrow.');
      return;
    }

    setOtpError('');
    setOtpSuccess('');
    setOtpLoading(true);

    try {
      if (type === 'recovery') {
        const { error: resErr } = await supabase.auth.resetPasswordForEmail(targetEmail);
        if (resErr) throw resErr;
      } else {
        const { error: resErr } = await supabase.auth.resend({
          type: 'signup',
          email: targetEmail
        });
        if (resErr) throw resErr;
      }

      recordResendAttempt(targetEmail, type);
      const updatedStatus = getResendStatus(targetEmail, type);
      setResendStatus(updatedStatus);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setExpiresIn(CODE_VALIDITY_DURATION_SEC);

      setOtpSuccess(`A fresh 6-digit code has been sent! Valid for 10 minutes (${updatedStatus.remaining} attempts remaining today)`);
    } catch (err) {
      setOtpError(err.message || 'Failed to resend code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const isExpired = expiresIn === 0;
  const isLowTime = expiresIn > 0 && expiresIn < 120;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6 transition-colors duration-300">
        
        {/* ========================================================= */}
        {/* VIEW 1: UNCONFIRMED EMAIL OTP VERIFICATION                 */}
        {/* ========================================================= */}
        {viewMode === 'unconfirmed_verify' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Confirm Your Email
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Enter the 6-digit confirmation code sent to <br />
                <strong className="text-slate-800 dark:text-slate-200">{otpEmail}</strong>
              </p>
            </div>

            {/* Live Expiration Countdown Badge */}
            <div className="flex items-center justify-center">
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black border transition-all ${
                isExpired
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900'
                  : isLowTime
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 animate-pulse'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
              }`}>
                <Timer className="w-4 h-4" />
                <span>
                  {isExpired ? 'Code Expired (00:00)' : `Code Valid for: ${formatTime(expiresIn)} min`}
                </span>
              </div>
            </div>

            {otpError && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-3.5 flex items-start gap-2.5 text-red-700 dark:text-red-400 text-xs font-bold animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>{otpError}</p>
                  {(otpError.includes('expired') || otpError.includes('invalid')) && (
                    <p className="text-[11px] font-medium text-red-600/90 dark:text-red-400/90">
                      💡 If you requested multiple codes, only the <strong>latest code</strong> from your newest email is valid.
                    </p>
                  )}
                </div>
              </div>
            )}

            {otpSuccess && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-3.5 flex items-start gap-2.5 text-emerald-700 dark:text-emerald-400 text-xs font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{otpSuccess}</span>
              </div>
            )}

            <form onSubmit={handleVerifyUnconfirmedOtp} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>6-Digit Confirmation Code</span>
                  <span className="text-[10px] text-indigo-600 font-bold lowercase">from email</span>
                </label>
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0 2 0 4 5 3"
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-indigo-200 dark:border-indigo-900/60 focus:border-indigo-600 rounded-2xl px-4 py-3.5 text-center text-2xl font-black tracking-[0.4em] outline-none transition-all dark:text-white"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={otpLoading || otpCode.length < 6 || isExpired}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
              >
                {otpLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>Verify & Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {/* Resend Section */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                <span>Resends today: <strong className="text-slate-800 dark:text-slate-200">{resendStatus.count}/{MAX_DAILY_RESENDS}</strong></span>
                <span>{resendStatus.remaining} remaining</span>
              </div>

              <button
                type="button"
                disabled={cooldown > 0 || resendStatus.isMaxed || otpLoading}
                onClick={() => handleResendOtp('signup')}
                className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isExpired
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-md shadow-indigo-600/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {resendStatus.isMaxed ? (
                  'Daily Resend Limit Reached (3/3)'
                ) : cooldown > 0 ? (
                  `Resend Code in ${cooldown}s...`
                ) : isExpired ? (
                  '🔄 Request Fresh 6-Digit Code'
                ) : (
                  `Resend Code (${resendStatus.remaining} left today)`
                )}
              </button>
            </div>

            {/* Spam Folder Reminder */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 text-xs text-amber-900 dark:text-amber-300 space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-amber-800 dark:text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0" /> Check Spam Folder
              </div>
              <p>
                If the email is not in your Inbox, please check your <strong>Spam</strong> or <strong>Promotions</strong> folder. Max 3 resends allowed per day.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setViewMode('login');
                setOtpCode('');
                setOtpError('');
                setOtpSuccess('');
              }}
              className="w-full text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center justify-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" /> Back to Sign In
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: FORGOT PASSWORD (STEP 1: REQUEST OTP)              */}
        {/* ========================================================= */}
        {viewMode === 'forgot_request' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Key className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Reset Password
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Enter your email address to receive a 6-digit recovery code.
              </p>
            </div>

            {otpError && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-3.5 flex items-start gap-2.5 text-red-700 dark:text-red-400 text-xs font-bold animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleForgotRequestSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Account Email Address
                </label>
                <input
                  required
                  type="email"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium"
                  placeholder="you@example.com"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={otpLoading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
              >
                {otpLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>Send 6-Digit Recovery Code <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setViewMode('login');
                setOtpError('');
                setOtpSuccess('');
              }}
              className="w-full text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center justify-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" /> Back to Sign In
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: FORGOT PASSWORD (STEP 2: OTP + NEW PASSWORD)       */}
        {/* ========================================================= */}
        {viewMode === 'forgot_verify' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Enter Code & New Password
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Enter the 6-digit recovery code sent to <br />
                <strong className="text-slate-800 dark:text-slate-200">{otpEmail}</strong>
              </p>
            </div>

            {/* Live Expiration Countdown Badge */}
            <div className="flex items-center justify-center">
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black border transition-all ${
                isExpired
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900'
                  : isLowTime
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 animate-pulse'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
              }`}>
                <Timer className="w-4 h-4" />
                <span>
                  {isExpired ? 'Code Expired (00:00)' : `Code Valid for: ${formatTime(expiresIn)} min`}
                </span>
              </div>
            </div>

            {otpError && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-3.5 flex items-start gap-2.5 text-red-700 dark:text-red-400 text-xs font-bold animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>{otpError}</p>
                  {(otpError.includes('expired') || otpError.includes('invalid')) && (
                    <p className="text-[11px] font-medium text-red-600/90 dark:text-red-400/90">
                      💡 If you requested multiple codes, only the <strong>latest code</strong> from your newest email is valid.
                    </p>
                  )}
                </div>
              </div>
            )}

            {otpSuccess && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-3.5 flex items-start gap-2.5 text-emerald-700 dark:text-emerald-400 text-xs font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{otpSuccess}</span>
              </div>
            )}

            <form onSubmit={handleForgotVerifySubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  6-Digit Recovery Code
                </label>
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0 2 0 4 5 3"
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-indigo-200 dark:border-indigo-900/60 focus:border-indigo-600 rounded-xl px-4 py-2.5 text-center text-xl font-black tracking-[0.3em] outline-none dark:text-white"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  New Password
                </label>
                <input
                  required
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  placeholder="•••••••• (min 6 characters)"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={otpLoading || otpCode.length < 6 || isExpired}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer mt-2"
              >
                {otpLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>Set New Password & Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {/* Resend Section */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                <span>Resends today: <strong className="text-slate-800 dark:text-slate-200">{resendStatus.count}/{MAX_DAILY_RESENDS}</strong></span>
                <span>{resendStatus.remaining} remaining</span>
              </div>

              <button
                type="button"
                disabled={cooldown > 0 || resendStatus.isMaxed || otpLoading}
                onClick={() => handleResendOtp('recovery')}
                className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isExpired
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-md shadow-indigo-600/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {resendStatus.isMaxed ? (
                  'Daily Limit Reached (3/3)'
                ) : cooldown > 0 ? (
                  `Resend Code in ${cooldown}s...`
                ) : isExpired ? (
                  '🔄 Request Fresh 6-Digit Code'
                ) : (
                  `Resend Code (${resendStatus.remaining} left today)`
                )}
              </button>
            </div>

            {/* Spam Reminder */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-3.5 text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
              🔍 <strong>Check Spam Folder:</strong> Recovery emails may land in Spam/Junk. Max 3 resend attempts allowed per day.
            </div>

            <button
              type="button"
              onClick={() => {
                setViewMode('login');
                setOtpCode('');
                setOtpError('');
                setOtpSuccess('');
              }}
              className="w-full text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center justify-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" /> Back to Sign In
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: REGULAR SIGN IN FORM                              */}
        {/* ========================================================= */}
        {viewMode === 'login' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <LogIn className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Welcome Back
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Sign in to your competition dashboard
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 flex items-start gap-3 text-red-700 dark:text-red-400 text-xs font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpEmail(email);
                      setViewMode('forgot_request');
                      setError('');
                    }}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all flex justify-center items-center gap-2 text-sm disabled:opacity-75 cursor-pointer mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <div className="text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline">
                Register here
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
