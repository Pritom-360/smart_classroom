import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, UserPlus, AlertCircle } from 'lucide-react';
import useDocumentMetadata from '../hooks/useDocumentMetadata';

export default function Register() {
  useDocumentMetadata({
    title: 'Sign Up - Catalyst Competitions',
    description: 'Create your Smart Classroom competition account to join research and robotics challenges, build badges, and upload project files.',
    canonicalUrl: 'https://www.catalyst-smart-classroom.me/competition.html#/register'
  });

  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp(email, password, fullName);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to register.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-8 text-center space-y-6 transition-colors duration-300">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <Mail className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Verify Your Email</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              A verification link has been sent to <span className="font-extrabold text-slate-850 dark:text-slate-205">{email}</span>.
            </p>
          </div>
          
          <div className="bg-amber-55/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 text-xs text-amber-850 dark:text-amber-400 space-y-2.5 leading-relaxed text-left">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-900 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" /> Important Instructions:
            </div>
            <p>
              1. 📧 **Check your email inbox** and click the confirmation link to activate your account.
            </p>
            <p>
              2. 🔍 **Spam / Promotion Folders**: If you don't receive the email within a couple of minutes, please check your **Spam**, **Junk**, or **Promotions** folder, as authentication emails sometimes get routed there.
            </p>
          </div>

          <Link
            to="/login"
            className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-indigo-500/30 transition-all text-sm text-center"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-8 transition-colors duration-300">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-4">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Create Account</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Get started with Catalyst Competitions</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg p-4 mb-6 flex items-start gap-3 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
              Full Name
            </label>
            <input
              required
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              placeholder="Arup Bhowmik"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-4 h-4" /> Email Address
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4" /> Password
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-indigo-500/30 transition-all flex justify-center items-center gap-2 disabled:opacity-75"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Register Account'}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}
