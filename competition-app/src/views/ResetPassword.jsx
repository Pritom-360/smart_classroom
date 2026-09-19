import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { verifyOtpSafe, resendOtpSafe, parseSupabaseError } from '../utils/supabaseErrorHelper';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, Key, Mail, ShieldCheck, RotateCcw, ArrowRight, ArrowLeft, Timer } from 'lucide-react';
import useDocumentMetadata from '../hooks/useDocumentMetadata';
import { getResendStatus, recordResendAttempt, RESEND_COOLDOWN_SECONDS, MAX_DAILY_RESENDS } from '../utils/otpRateLimiter';

const CODE_VALIDITY_DURATION_SEC = 600; // 10 minutes code validity

export default function ResetPassword() {
  useDocumentMetadata({
    title: 'Reset Password via 6-Digit Code - Catalyst Competitions',
    description: 'Set a new password for your Catalyst Smart Classroom account using your 6-digit recovery code.',
    canonicalUrl: 'https://www.catalyst-smart-classroom.me/competition.html#/reset-password'
  });

  const navigate = useNavigate();

  // Step 1: 'request' (email) | Step 2: 'verify_and_set' (6-digit code + new password)
  const [step, setStep] = useState('request');

  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Live Code Expiration Timer (10 Minutes)
  const [expiresIn, setExpiresIn] = useState(CODE_VALIDITY_DURATION_SEC);

  // Rate Limiting Cooldown State
  const [cooldown, setCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState(() => getResendStatus(email, 'recovery'));

  useEffect(() => {
    if (email) {
      setResendStatus(getResendStatus(email.trim().toLowerCase(), 'recovery'));
    }
  }, [email]);

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
    if (step === 'verify_and_set' && expiresIn > 0) {
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
  }, [step, expiresIn]);

  // Format seconds to MM:SS string
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Step 1: Send 6-Digit Code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const safeEmail = email.trim().toLowerCase();

      // 1. Generate real 6-digit OTP and send via EmailJS
      const code = generateOtpCode();
      await sendOtpEmail(safeEmail, '', code, 'recovery');

      // 2. Also trigger Supabase recovery as backup
      try {
        await resendOtpSafe(supabase, safeEmail, 'recovery');
      } catch (e) {
        // ignore
      }

      setStep('verify_and_set');
      setExpiresIn(CODE_VALIDITY_DURATION_SEC);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setSuccess(`আপনার ইমেইলে একটি ৬-সংখ্যার রিকভারি কোড পাঠানো হয়েছে! (6-digit recovery code sent to ${safeEmail})`);
    } catch (err) {
      setError(err.message || 'Failed to send recovery code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 6-Digit Code & Set New Password
  const handleVerifyAndSet = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanToken = otpCode.replace(/\s+/g, '').trim();
    if (!cleanToken || cleanToken.length < 6) {
      setError('Please enter the full 6-digit reset code.');
      return;
    }

    if (expiresIn === 0) {
      setError('⚠️ This 6-digit code has expired (10 minutes limit). Please click "Resend Code" below to receive a fresh code.');
      return;
    }

    if (password.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const safeEmail = email.trim().toLowerCase();

      // 1. Check custom 6-digit recovery OTP
      const customCheck = verifyOtpCode(safeEmail, cleanToken, 'recovery');

      if (customCheck.success) {
        try {
          await supabase.auth.updateUser({ password: password });
        } catch (e) {
          // ignore
        }

        setSuccess('🎉 পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! লগইন পেজে নিয়ে যাওয়া হচ্ছে...');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
        return;
      }

      // 2. Backup: Supabase verifyOtpSafe for recovery
      const { data, error: verifyErr } = await verifyOtpSafe(supabase, safeEmail, cleanToken, 'recovery');

      if (!verifyErr) {
        await supabase.auth.updateUser({ password: password });
        setSuccess('🎉 Your password has been reset successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
        return;
      }

      setError(customCheck.message || '❌ ভুল ওটিপি কোড। আপনার ইমেইলে পাওয়া ৬ সংখ্যার কোডটি দিন।');

    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  // Resend Helper
  const handleResend = async () => {
    if (cooldown > 0) return;
    const safeEmail = email.trim().toLowerCase();
    const status = getResendStatus(safeEmail, 'recovery');

    if (status.isMaxed) {
      setError('⚠️ You have reached the maximum limit of 3 resends for today. Please check your Spam folder or try again tomorrow.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // 1. Generate fresh 6-digit OTP and send via EmailJS
      const code = generateOtpCode();
      await sendOtpEmail(safeEmail, '', code, 'recovery');

      // 2. Also trigger Supabase recovery as backup
      try {
        await resendOtpSafe(supabase, safeEmail, 'recovery');
      } catch (e) {
        // ignore
      }

      recordResendAttempt(safeEmail, 'recovery');
      const updatedStatus = getResendStatus(safeEmail, 'recovery');
      setResendStatus(updatedStatus);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setExpiresIn(CODE_VALIDITY_DURATION_SEC);

      setSuccess(`একটি নতুন ৬ সংখ্যার রিকভারি কোড পাঠানো হয়েছে! (${updatedStatus.remaining} attempts left today)`);
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  const isExpired = expiresIn === 0;
  const isLowTime = expiresIn > 0 && expiresIn < 120;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6 transition-colors duration-300">
        
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Key className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Reset Password
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            {step === 'request'
              ? 'Enter your email to receive a 6-digit reset code'
              : `Enter the code sent to ${email} & set new password`}
          </p>
        </div>

        {/* Live Expiration Countdown Badge in Step 2 */}
        {step === 'verify_and_set' && (
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
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 flex items-start gap-3 text-red-700 dark:text-red-400 text-xs font-bold animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>{error}</p>
              {(error.includes('expired') || error.includes('invalid')) && (
                <p className="text-[11px] font-medium text-red-600/90 dark:text-red-400/90">
                  💡 If you requested multiple codes, only the <strong>latest code</strong> from your newest email is valid.
                </p>
              )}
            </div>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-4 flex items-start gap-3 text-emerald-700 dark:text-emerald-400 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Account Email Address
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium"
                placeholder="you@example.com"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>Send 6-Digit Recovery Code <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndSet} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Recovery Code (OTP)
              </label>
              <input
                required
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9a-zA-Z]/g, '').trim())}
                placeholder="e.g. 62524107"
                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-indigo-200 dark:border-indigo-900/60 focus:border-indigo-600 rounded-xl px-4 py-2.5 text-center text-lg font-black tracking-[0.2em] outline-none dark:text-white"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> New Password
              </label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                placeholder="•••••••• (min 6 characters)"
                minLength={6}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Confirm New Password
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
              disabled={loading || otpCode.length < 6 || isExpired}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>Set New Password & Log In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            {/* Resend Section */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                <span>Resends today: <strong className="text-slate-800 dark:text-slate-200">{resendStatus.count}/{MAX_DAILY_RESENDS}</strong></span>
                <span>{resendStatus.remaining} remaining</span>
              </div>

              <button
                type="button"
                disabled={cooldown > 0 || resendStatus.isMaxed || loading}
                onClick={handleResend}
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
                setStep('request');
                setOtpCode('');
                setError('');
                setSuccess('');
              }}
              className="w-full text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center justify-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" /> Change email address
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link to="/login" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
