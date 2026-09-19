// Rate Limiting & Cooldown Helper for OTP / Confirmation Code Resends

export const MAX_DAILY_RESENDS = 3;
export const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Returns the current daily resend status for an email address and action type.
 * @param {string} email 
 * @param {'signup' | 'recovery'} type 
 */
export const getResendStatus = (email, type = 'signup') => {
  if (!email) {
    return {
      count: 0,
      remaining: MAX_DAILY_RESENDS,
      canResend: true,
      isMaxed: false
    };
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const key = `catalyst_resend_${type}_${email.toLowerCase().trim()}_${today}`;
  const count = parseInt(localStorage.getItem(key) || '0', 10);
  const remaining = Math.max(0, MAX_DAILY_RESENDS - count);

  return {
    count,
    remaining,
    canResend: remaining > 0,
    isMaxed: remaining === 0
  };
};

/**
 * Records a resend attempt in local storage.
 * @param {string} email 
 * @param {'signup' | 'recovery'} type 
 */
export const recordResendAttempt = (email, type = 'signup') => {
  if (!email) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const key = `catalyst_resend_${type}_${email.toLowerCase().trim()}_${today}`;
  const current = parseInt(localStorage.getItem(key) || '0', 10);
  const next = current + 1;
  localStorage.setItem(key, String(next));
  return next;
};
