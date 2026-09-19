// Centralized Supabase Error Handling & OTP Verification Helper
// Prevents triple-fallback 403 errors and handles 429 rate limits gracefully.

/**
 * Parse a Supabase error into a user-friendly message.
 * Detects 429 (Too Many Requests), 403 (Token invalid), and other common errors.
 * @param {Error|object} err - The error from Supabase SDK
 * @returns {{ message: string, isRateLimit: boolean, isTokenInvalid: boolean }}
 */
export const parseSupabaseError = (err) => {
  const msg = err?.message || err?.error_description || String(err || '');
  const status = err?.status || err?.statusCode || 0;

  // 429 Too Many Requests — Supabase's own server-side rate limit
  if (
    status === 429 ||
    msg.toLowerCase().includes('too many requests') ||
    msg.toLowerCase().includes('rate limit') ||
    msg.toLowerCase().includes('email rate limit')
  ) {
    return {
      message:
        '⏳ Supabase সার্ভারে অনেক বেশি request পাঠানো হয়েছে। অনুগ্রহ করে ২-৩ মিনিট অপেক্ষা করে আবার চেষ্টা করুন। (Too many requests — please wait 2-3 minutes before trying again.)',
      isRateLimit: true,
      isTokenInvalid: false,
    };
  }

  // 403 Token expired/invalid
  if (
    status === 403 ||
    msg.toLowerCase().includes('token has expired') ||
    msg.toLowerCase().includes('invalid') ||
    msg.toLowerCase().includes('otp_expired')
  ) {
    return {
      message:
        'কোডটি মেয়াদ উত্তীর্ণ বা ভুল। আপনি যদি একাধিক কোড রিকুয়েস্ট করে থাকেন, তাহলে শুধুমাত্র সর্বশেষ ইমেইলের কোডটি কাজ করবে। নিচের "Resend" বাটনে ক্লিক করে নতুন কোড নিন। (Token has expired or is invalid. Only the code from your latest email works.)',
      isRateLimit: false,
      isTokenInvalid: true,
    };
  }

  // Generic
  return {
    message: msg || 'Something went wrong. Please try again.',
    isRateLimit: false,
    isTokenInvalid: false,
  };
};

/**
 * Verify an OTP with Supabase using ONLY the correct type.
 * Does NOT cascade through multiple types (which causes triple 403 errors).
 *
 * @param {object} supabase - Supabase client
 * @param {string} email - User email (will be lowercased/trimmed)
 * @param {string} token - 6-digit OTP code
 * @param {'signup'|'recovery'} purpose - 'signup' for registration/email confirmation, 'recovery' for password reset
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export const verifyOtpSafe = async (supabase, email, token, purpose = 'signup') => {
  const safeEmail = email.toLowerCase().trim();
  const cleanToken = token.replace(/\s+/g, '').trim();

  // Map purpose to the single correct Supabase OTP type
  const otpType = purpose === 'recovery' ? 'recovery' : 'signup';

  const { data, error } = await supabase.auth.verifyOtp({
    email: safeEmail,
    token: cleanToken,
    type: otpType,
  });

  return { data, error };
};

/**
 * Resend OTP with proper error handling (especially 429 rate-limit detection).
 *
 * @param {object} supabase - Supabase client
 * @param {string} email - User email
 * @param {'signup'|'recovery'} purpose
 * @returns {Promise<{ success: boolean, error: object|null, parsed: object|null }>}
 */
export const resendOtpSafe = async (supabase, email, purpose = 'signup') => {
  const safeEmail = email.toLowerCase().trim();

  try {
    let result;
    if (purpose === 'recovery') {
      result = await supabase.auth.resetPasswordForEmail(safeEmail);
    } else {
      result = await supabase.auth.resend({
        type: 'signup',
        email: safeEmail,
      });
    }

    if (result.error) {
      const parsed = parseSupabaseError(result.error);
      return { success: false, error: result.error, parsed };
    }

    return { success: true, error: null, parsed: null };
  } catch (err) {
    const parsed = parseSupabaseError(err);
    return { success: false, error: err, parsed };
  }
};
