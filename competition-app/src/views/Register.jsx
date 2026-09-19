import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  Clock,
  ArrowLeft,
  Sparkles,
  Timer
} from 'lucide-react';
import { supabase } from '../utils/supabase';
import { verifyOtpSafe, resendOtpSafe, parseSupabaseError } from '../utils/supabaseErrorHelper';
import useDocumentMetadata from '../hooks/useDocumentMetadata';
import {
  getResendStatus,
  recordResendAttempt,
  RESEND_COOLDOWN_SECONDS,
  MAX_DAILY_RESENDS
} from '../utils/otpRateLimiter';

const CODE_VALIDITY_DURATION_SEC = 600; // 10 minutes code validity

export default function Register() {
  useDocumentMetadata({
    title: 'Sign Up & Email Confirmation - Catalyst Competitions',
    description: 'Create and verify your Smart Classroom competition account to join research and robotics challenges, build badges, and upload project files.',
    canonicalUrl: 'https://www.catalyst-smart-classroom.me/competition.html#/register'
  });

  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Registration Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(() => {
    return sessionStorage.getItem('catalyst_pending_verify_email') || '';
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Verification State (persisted across refreshes)
  const [isVerifying, setIsVerifying] = useState(() => {
    return Boolean(sessionStorage.getItem('catalyst_pending_verify_email'));
  });
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');

  // Live Code Expiration Timer (10 Minutes)
  const [expiresIn, setExpiresIn] = useState(() => {
    const savedExpire = sessionStorage.getItem('catalyst_otp_expires_at');
    if (savedExpire) {
      const diff = Math.floor((parseInt(savedExpire, 10) - Date.now()) / 1000);
      return diff > 0 ? diff : 0;
    }
    return CODE_VALIDITY_DURATION_SEC;
  });

  // Resend Cooldown & Daily Limit State
  const [cooldown, setCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState(() => getResendStatus(email, 'signup'));

  // Sync resend status when email changes
  useEffect(() => {
    if (email) {
      setResendStatus(getResendStatus(email, 'signup'));
    }
  }, [email]);

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
    if (isVerifying && expiresIn > 0) {
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
  }, [isVerifying, expiresIn]);

  // Live Auto-Detection: Polls every 3 seconds to check if user clicked the email confirmation link
  useEffect(() => {
    let pollInterval;
    if (isVerifying && email && password) {
      pollInterval = setInterval(async () => {
        try {
          const safeEmail = email.toLowerCase().trim();
          const { data, error } = await supabase.auth.signInWithPassword({
            email: safeEmail,
            password: password,
          });
          if (!error && data?.session) {
            clearInterval(pollInterval);
            setOtpSuccess('🎉 ইমেইল নিশ্চিতকরণ সফল হয়েছে! Dashboard-এ নিয়ে যাওয়া হচ্ছে...');
            sessionStorage.removeItem('catalyst_pending_verify_email');
            sessionStorage.removeItem('catalyst_pending_verify_name');
            sessionStorage.removeItem('catalyst_otp_expires_at');
            setTimeout(() => {
              navigate('/dashboard');
            }, 800);
          }
        } catch (e) {
          // silently wait for next tick
        }
      }, 3000);
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isVerifying, email, password, navigate]);

  // Format seconds to MM:SS string
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    const safeEmail = email.toLowerCase().trim();
    const safeName = fullName.trim();

    try {
      const data = await signUp(safeEmail, password, safeName);
      
      // If email confirmation is disabled in Supabase, session is created instantly!
      if (data?.session) {
        navigate('/dashboard');
        return;
      }

      const expireTime = Date.now() + CODE_VALIDITY_DURATION_SEC * 1000;
      sessionStorage.setItem('catalyst_pending_verify_email', safeEmail);
      sessionStorage.setItem('catalyst_pending_verify_name', safeName);
      sessionStorage.setItem('catalyst_otp_expires_at', String(expireTime));

      setIsVerifying(true);
      setExpiresIn(CODE_VALIDITY_DURATION_SEC);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setOtpSuccess(`আপনার ইমেইলে একটি ৬-সংখ্যার ওটিপি কোড পাঠানো হয়েছে! (6-digit confirmation code sent to ${safeEmail})`);
    } catch (err) {
      setError(err.message || 'Failed to register account.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');

    const cleanToken = otpCode.replace(/\s+/g, '').trim();
    if (!cleanToken || cleanToken.length < 6) {
      setOtpError('Please enter the full 6-digit confirmation code.');
      return;
    }

    if (expiresIn === 0) {
      setOtpError('⚠️ This 6-digit code has expired (10 minutes limit). Please click "Resend Confirmation Code" below to receive a fresh code.');
      return;
    }

    setOtpLoading(true);

    try {
      const safeEmail = email.toLowerCase().trim();

      // Verify 6-digit OTP code directly with Supabase
      const { data, error: verifyErr } = await verifyOtpSafe(supabase, safeEmail, cleanToken, 'signup');

      if (!verifyErr) {
        setOtpSuccess('🎉 একাউন্ট সফলভাবে ভেরিফাই হয়েছে! Dashboard-এ পাঠানো হচ্ছে...');
        sessionStorage.removeItem('catalyst_pending_verify_email');
        sessionStorage.removeItem('catalyst_pending_verify_name');
        sessionStorage.removeItem('catalyst_otp_expires_at');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
        return;
      }

      // If user already clicked the email link, sign in automatically
      if (password) {
        try {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: safeEmail,
            password: password,
          });
          if (!signInErr && signInData?.session) {
            setOtpSuccess('🎉 অ্যাকাউন্টটি ইতিমধ্যেই ভেরিফাইড হয়েছে! Dashboard-এ পাঠানো হচ্ছে...');
            sessionStorage.removeItem('catalyst_pending_verify_email');
            sessionStorage.removeItem('catalyst_pending_verify_name');
            sessionStorage.removeItem('catalyst_otp_expires_at');
            setTimeout(() => {
              navigate('/dashboard');
            }, 1000);
            return;
          }
        } catch (e) {
          // ignore
        }
      }

      const parsed = parseSupabaseError(verifyErr);
      setOtpError(parsed.message || '❌ ভুল ওটিপি কোড। আপনার ইমেইলে পাওয়া ৬ সংখ্যার কোডটি দিন।');

    } catch (err) {
      setOtpError(err.message || 'Failed to verify code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCheckEmailLink = async () => {
    setOtpError('');
    setOtpSuccess('');
    setOtpLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setOtpSuccess('🎉 অ্যাকাউন্টটি সফলভাবে ভেরিফাই হয়েছে! Dashboard-এ পাঠানো হচ্ছে...');
        sessionStorage.removeItem('catalyst_pending_verify_email');
        sessionStorage.removeItem('catalyst_pending_verify_name');
        sessionStorage.removeItem('catalyst_otp_expires_at');
        setTimeout(() => navigate('/dashboard'), 1000);
        return;
      }

      const safeEmail = email.toLowerCase().trim();
      if (password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: safeEmail,
          password: password,
        });
        if (!error && data?.session) {
          setOtpSuccess('🎉 অ্যাকাউন্টটি সফলভাবে ভেরিফাই হয়েছে! Dashboard-এ পাঠানো হচ্ছে...');
          sessionStorage.removeItem('catalyst_pending_verify_email');
          sessionStorage.removeItem('catalyst_pending_verify_name');
          sessionStorage.removeItem('catalyst_otp_expires_at');
          setTimeout(() => navigate('/dashboard'), 1000);
          return;
        }
      }

      setOtpError('⚠️ ইমেইলটি এখনো ভেরিফাই হয়নি। আপনার ইনবক্সে পাঠানো "Confirm My Email" লিঙ্কে ক্লিক করুন অথবা ৬ সংখ্যার কোডটি দিন।');
    } catch (err) {
      setOtpError(err.message || 'Verification check failed.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (cooldown > 0) return;
    const safeEmail = email.toLowerCase().trim();
    const status = getResendStatus(safeEmail, 'signup');

    if (status.isMaxed) {
      setOtpError('⚠️ You have reached the maximum limit of 3 resends for today. Please check your Spam folder or try again tomorrow.');
      return;
    }

    setOtpError('');
    setOtpSuccess('');
    setOtpLoading(true);

    try {
      const { success, parsed } = await resendOtpSafe(supabase, safeEmail, 'signup');

      if (!success) {
        setOtpError(parsed?.message || 'Failed to resend confirmation code.');
        if (parsed?.isRateLimit) setCooldown(120);
        return;
      }

      recordResendAttempt(safeEmail, 'signup');
      const updatedStatus = getResendStatus(safeEmail, 'signup');
      setResendStatus(updatedStatus);
      setCooldown(RESEND_COOLDOWN_SECONDS);

      const expireTime = Date.now() + CODE_VALIDITY_DURATION_SEC * 1000;
      sessionStorage.setItem('catalyst_otp_expires_at', String(expireTime));
      setExpiresIn(CODE_VALIDITY_DURATION_SEC);

      setOtpSuccess(`একটি নতুন ৬ সংখ্যার ওটিপি কোড পাঠানো হয়েছে! (${updatedStatus.remaining} attempts left today)`);
    } catch (err) {
      setOtpError(err.message || 'Failed to resend confirmation code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSwitchAccount = () => {
    sessionStorage.removeItem('catalyst_pending_verify_email');
    sessionStorage.removeItem('catalyst_pending_verify_name');
    sessionStorage.removeItem('catalyst_otp_expires_at');
    setIsVerifying(false);
    setOtpCode('');
    setOtpError('');
    setOtpSuccess('');
  };

  // -------------------------------------------------------------
  // VIEW: 6-Digit OTP Verification Screen with Live Validity Timer
  // -------------------------------------------------------------
  if (isVerifying) {
    const isExpired = expiresIn === 0;
    const isLowTime = expiresIn > 0 && expiresIn < 120; // less than 2 mins

    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6 transition-colors duration-300">
          
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Enter Confirmation Code
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              We sent a 6-digit confirmation code to <br />
              <strong className="text-slate-800 dark:text-slate-200">{email}</strong>
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
                {isExpired ? (
                  'Code Expired (00:00)'
                ) : (
                  `Code Valid for: ${formatTime(expiresIn)} min`
                )}
              </span>
            </div>
          </div>

          {/* Feedback Alerts */}
          {otpError && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-3.5 flex items-start gap-2.5 text-red-700 dark:text-red-400 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>{otpError}</p>
                {otpError.includes('expired') || otpError.includes('invalid') ? (
                  <p className="text-[11px] font-medium text-red-600/90 dark:text-red-400/90">
                    💡 If you requested multiple codes, only the <strong>latest code</strong> from your newest email is valid.
                  </p>
                ) : null}
              </div>
            </div>
          )}

          {otpSuccess && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-3.5 flex items-start gap-2.5 text-emerald-700 dark:text-emerald-400 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{otpSuccess}</span>
            </div>
          )}

          {/* OTP Verification Form */}
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Confirmation Code (OTP)</span>
                <span className="text-[10px] text-indigo-600 font-bold lowercase">from email</span>
              </label>
              
              <input
                required
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9a-zA-Z]/g, '').trim())}
                placeholder="e.g. 62524107"
                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-indigo-200 dark:border-indigo-900/60 focus:border-indigo-600 rounded-2xl px-4 py-3.5 text-center text-xl sm:text-2xl font-black tracking-[0.25em] outline-none transition-all dark:text-white"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={otpLoading || otpCode.trim().length < 6 || isExpired}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {otpLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>Confirm & Activate Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Resend Code Section with Daily Rate Limit & Cooldown */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
              <span>Resends today: <strong className="text-slate-800 dark:text-slate-200">{resendStatus.count}/{MAX_DAILY_RESENDS}</strong></span>
              <span>{resendStatus.remaining} remaining</span>
            </div>

            <button
              type="button"
              disabled={cooldown > 0 || resendStatus.isMaxed || otpLoading}
              onClick={handleResendCode}
              className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isExpired
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-md shadow-indigo-600/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
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
                `Resend Confirmation Code (${resendStatus.remaining} left today)`
              )}
            </button>
          </div>

          {/* Alternative: Link Verification Check Button */}
          <div className="pt-2">
            <button
              type="button"
              disabled={otpLoading}
              onClick={handleCheckEmailLink}
              className="w-full py-2.5 px-4 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>🔗 Clicked the link in email? Click here to continue</span>
            </button>
          </div>

          {/* Prominent Notice */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 text-xs text-amber-900 dark:text-amber-300 space-y-2 leading-relaxed">
            <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-amber-800 dark:text-amber-400">
              <AlertCircle className="w-4 h-4 shrink-0" /> Important Notice:
            </div>
            <p>
              📧 <strong>Two Ways to Verify:</strong> Enter the <strong>6-digit code</strong> from your email, OR simply click the <strong>"Confirm My Email"</strong> link inside your email.
            </p>
            <p>
              🔍 <strong>Check Spam / Promotions:</strong> If you don't find the email in your inbox, please check your <strong>Spam</strong>, <strong>Junk</strong>, or <strong>Promotions</strong> folder.
            </p>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80">
              ⏰ Code is valid for 10 minutes. Maximum 3 daily resend attempts allowed.
            </p>
          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleSwitchAccount}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" /> Change email address or register again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: Registration Input Form
  // -------------------------------------------------------------
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6 transition-colors duration-300">
        
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <UserPlus className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Create Account
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Join Catalyst research & robotics competitions
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 flex items-start gap-3 text-red-700 dark:text-red-400 text-xs font-bold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Full Name
            </label>
            <input
              required
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium"
              placeholder="e.g. Arup Bhowmik Pritom"
            />
          </div>

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
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Password
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium"
              placeholder="•••••••• (min 6 characters)"
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
              <>Register & Get 6-Digit Code <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
          Already registered?{' '}
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
