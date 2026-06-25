import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Trophy, Award, FileText, Download, Copy, ExternalLink, Upload, AlertCircle, FileCheck, CheckCircle2, FileImage, CheckCircle, Mail } from 'lucide-react';
import useDocumentMetadata from '../hooks/useDocumentMetadata';
import { compressImage } from '../utils/imageCompressor';

export default function UserDashboard() {
  useDocumentMetadata({
    title: 'Participant Dashboard - Catalyst Competitions',
    description: 'Access your registered segments, customize and download your premium participant card badge, and upload PDF project files.',
    canonicalUrl: 'https://www.catalyst-smart-classroom.me/competition.html#/dashboard'
  });

  const { user, profile } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({ participated: 0, wins: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null); // active registration ID or 'settings'

  // Settings tab states
  const [fullName, setFullName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Sync profile full name
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    }
  }, [profile]);

  // Timer state for dynamic countdowns
  const [currentTime, setCurrentTime] = useState(new Date());

  // Upload states
  const [uploading, setUploading] = useState({});
  const [progress, setProgress] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  // Download states
  const [downloading, setDownloading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const badgeRefs = useRef({});

  // Certificate states
  const [certificateName, setCertificateName] = useState('');
  const [certificateApplied, setCertificateApplied] = useState(false);
  const [generatingCert, setGeneratingCert] = useState(false);
  const [showCertConfirm, setShowCertConfirm] = useState(false);
  const certificateRef = useRef(null);

  // Re-submission state tracking per registration ID
  const [reSubmitting, setReSubmitting] = useState({});

  // Start live clock for timeline countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset certificate status when changing active tab
  useEffect(() => {
    setCertificateApplied(false);
    setCertificateName('');
  }, [activeTab]);

  useEffect(() => {
    if (!user) return;

    async function fetchDashboardData() {
      try {
        setLoading(true);
        // Fetch registrations in parallel: where user is leader, and where user is a team member
        const [leaderRegsRes, memberRegsRes] = await Promise.all([
          supabase
            .from('registrations')
            .select(`
              *,
              profiles (
                id,
                full_name,
                avatar_url,
                email
              ),
              competitions (
                id,
                title,
                type,
                status,
                deadline,
                submission_start,
                submission_end,
                sponsors,
                signature_url,
                description
              )
            `)
            .eq('user_id', user.id),
          supabase
            .from('registrations')
            .select(`
              *,
              profiles (
                id,
                full_name,
                avatar_url,
                email
              ),
              competitions (
                id,
                title,
                type,
                status,
                deadline,
                submission_start,
                submission_end,
                sponsors,
                signature_url,
                description
              ),
              team_members!inner(
                member_email
              )
            `)
            .ilike('team_members.member_email', user.email.trim())
        ]);

        if (leaderRegsRes.error) throw leaderRegsRes.error;
        if (memberRegsRes.error) throw memberRegsRes.error;

        const leaderRegs = leaderRegsRes.data || [];
        const memberRegs = memberRegsRes.data || [];

        // Combine registrations and remove duplicate IDs in O(N)
        const combinedMap = new Map();
        leaderRegs.forEach(r => combinedMap.set(r.id, r));
        memberRegs.forEach(r => combinedMap.set(r.id, r));
        const regs = Array.from(combinedMap.values());

        setRegistrations(regs);
        if (regs.length > 0) {
          setActiveTab(regs[0].id);
        } else {
          setActiveTab('settings');
        }

        // Calculate stats
        const participatedCount = regs.length;
        const winsCount = regs.filter(r => r.status === 'winner' || r.status === 'runner_up').length;
        setStats({ participated: participatedCount, wins: winsCount });

      } catch (err) {
        console.error('Error fetching dashboard:', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  const activeReg = registrations.find(r => r.id === activeTab);
  const isLeader = activeReg ? activeReg.user_id === user?.id : true;

  // Calculate submission timeline
  const getSubmissionTimeline = () => {
    if (!activeReg || !activeReg.competitions) return null;
    const comp = activeReg.competitions;
    const now = currentTime.getTime();
    
    // Fallbacks
    const subStart = comp.submission_start ? new Date(comp.submission_start).getTime() : new Date(comp.created_at || Date.now()).getTime();
    const subEnd = comp.submission_end ? new Date(comp.submission_end).getTime() : new Date(comp.deadline || Date.now()).getTime();
    
    if (now < subStart) {
      return {
        status: 'pending',
        label: 'Submission Window Opens In',
        timeLeft: subStart - now,
        disabled: true
      };
    } else if (now >= subStart && now <= subEnd) {
      return {
        status: 'open',
        label: 'Submission Window Closes In',
        timeLeft: subEnd - now,
        disabled: false
      };
    } else {
      return {
        status: 'closed',
        label: 'Submission Window Closed',
        timeLeft: 0,
        disabled: true
      };
    }
  };

  const timeline = getSubmissionTimeline();

  const formatTimeLeft = (ms) => {
    if (ms <= 0) return '00:00:00';
    const totalSecs = Math.floor(ms / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    
    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    parts.push(`${String(hours).padStart(2, '0')}h`);
    parts.push(`${String(mins).padStart(2, '0')}m`);
    parts.push(`${String(secs).padStart(2, '0')}s`);
    return parts.join(' ');
  };

  const handleDownloadBadge = async (regId, compTitle) => {
    const node = badgeRefs.current[regId];
    if (!node) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(node, { quality: 1, pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `Participant_Badge_${compTitle.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
      showToast('Badge downloaded successfully!');
    } catch (err) {
      console.error('Download failed:', err);
      showToast('Could not download badge', true);
    } finally {
      setDownloading(false);
    }
  };

  const handleApplyCertificate = () => {
    if (!certificateName.trim()) return;
    setShowCertConfirm(true);
  };

  const confirmAndGenerateCertificate = () => {
    setShowCertConfirm(false);
    setCertificateApplied(true);
    showToast('Name confirmed! Ready to download.');
  };

  const handleDownloadCertificate = async (format) => {
    const node = certificateRef.current;
    if (!node) {
      showToast('Certificate layout node not found', true);
      return;
    }
    setGeneratingCert(true);
    try {
      const dataUrl = await toPng(node, {
        quality: 1.0,
        pixelRatio: 2,
        width: 842,
        height: 595
      });

      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `Certificate_${activeReg.competitions?.title.replace(/\s+/g, '_')}_${certificateName.replace(/\s+/g, '_')}.png`;
        link.href = dataUrl;
        link.click();
        showToast('Certificate downloaded as Image!');
      } else if (format === 'pdf') {
        const pdf = new jsPDF('landscape', 'pt', 'a4');
        pdf.addImage(dataUrl, 'PNG', 0, 0, 842, 595);
        pdf.save(`Certificate_${activeReg.competitions?.title.replace(/\s+/g, '_')}_${certificateName.replace(/\s+/g, '_')}.pdf`);
        showToast('Certificate downloaded as PDF!');
      }

      // Update database row to permanently issue the certificate
      const { error: updateErr } = await supabase
        .from('registrations')
        .update({
          certificate_issued: true,
          certificate_name: certificateName
        })
        .eq('id', activeReg.id);

      if (updateErr) throw updateErr;

      // Update local state registrations to disable re-download
      setRegistrations(prev =>
        prev.map(r => r.id === activeReg.id ? { ...r, certificate_issued: true, certificate_name: certificateName } : r)
      );

      setCertificateApplied(false);
    } catch (err) {
      console.error('Certificate generation failed:', err);
      showToast('Failed to generate certificate', true);
    } finally {
      setGeneratingCert(false);
    }
  };

  const handleCopyCaption = (compTitle) => {
    const caption = `🏆 Just registered for the ${compTitle}!

🔬 Powered by Smart Classroom — the free academic hub.

💡 Join the challenge:
🌐 https://www.catalyst-smart-classroom.me/competition.html

#CatalystChallenges #SmartClassroom #Academic`;

    navigator.clipboard.writeText(caption)
      .then(() => showToast('Caption copied!'))
      .catch(() => showToast('Failed to copy', true));
  };

  const showToast = (msg, isError = false) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are supported');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Maximum file size is 10MB');
      return;
    }
    setUploadError('');
    setSelectedFile(file);
  };

  const handleUploadSubmission = async (regId) => {
    if (!selectedFile || timeline?.disabled) return;
    setUploading(prev => ({ ...prev, [regId]: true }));
    setUploadError('');
    setProgress(prev => ({ ...prev, [regId]: 10 }));

    try {
      if (activeReg.submission_url) {
        try {
          const fileUrl = activeReg.submission_url;
          const storagePrefix = '/challenge-submissions/';
          const idx = fileUrl.indexOf(storagePrefix);
          if (idx !== -1) {
            const oldPath = decodeURIComponent(fileUrl.substring(idx + storagePrefix.length));
            const { error: delErr } = await supabase.storage
              .from('challenge-submissions')
              .remove([oldPath]);
            if (delErr) {
              console.warn('Could not delete old submission file:', delErr);
            } else {
              console.log('Old submission file deleted successfully:', oldPath);
            }
          }
        } catch (delEx) {
          console.warn('Exception deleting old submission file:', delEx);
        }
      }

      const compressedSubmissionFile = await compressImage(selectedFile, { maxWidth: 1200, maxHeight: 1200 });
      const originalExt = selectedFile.name.split('.').pop() || 'pdf';
      const fileExt = compressedSubmissionFile.type.startsWith('image/') 
        ? (compressedSubmissionFile.type === 'image/png' ? 'png' : 'jpg') 
        : originalExt;
      const path = `submissions/${activeReg.competition_id}/${user.id}_${Date.now()}.${fileExt}`;

      const { error: upErr } = await supabase.storage
        .from('challenge-submissions')
        .upload(path, compressedSubmissionFile, { cacheControl: '3600', upsert: true });

      if (upErr) throw upErr;
      setProgress(prev => ({ ...prev, [regId]: 70 }));

      const { data: urlData } = supabase.storage
        .from('challenge-submissions')
        .getPublicUrl(path);

      const { error: dbErr } = await supabase
        .from('registrations')
        .update({
          submission_url: urlData.publicUrl,
          status: 'submitted'
        })
        .eq('id', regId);

      if (dbErr) throw dbErr;

      setProgress(prev => ({ ...prev, [regId]: 100 }));
      
      // Update local state
      setRegistrations(prev => prev.map(r => r.id === regId ? { ...r, submission_url: urlData.publicUrl, status: 'submitted' } : r));
      setSelectedFile(null);
      setReSubmitting(prev => ({ ...prev, [regId]: false }));
      setShowSuccessOverlay(true);
    } catch (err) {
      setUploadError(err.message || 'File upload failed.');
    } finally {
      setUploading(prev => ({ ...prev, [regId]: false }));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');
    setSettingsLoading(true);

    try {
      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          role: profile?.role || 'user'
        });

      if (profileErr) throw profileErr;
      setSettingsSuccess('Profile name updated successfully!');
    } catch (err) {
      setSettingsError(err.message || 'Failed to update profile.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');

    if (newPassword.length < 6) {
      setSettingsError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setSettingsError('Passwords do not match.');
      return;
    }

    setSettingsLoading(true);
    try {
      // Reauthenticate user
      const { error: reauthErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (reauthErr) {
        throw new Error('Current password verification failed. Please try again.');
      }

      // Update password
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateErr) throw updateErr;

      setSettingsSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setSettingsError(err.message || 'Failed to update password.');
    } finally {
      setSettingsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex items-center gap-4 shadow-sm transition-all duration-300">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs text-slate-500 font-bold uppercase tracking-wider">Participated</h4>
            <p className="text-2xl font-black">{stats.participated}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex items-center gap-4 shadow-sm transition-all duration-300">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/30 rounded-xl flex items-center justify-center text-amber-500">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs text-slate-500 font-bold uppercase tracking-wider">Wins</h4>
            <p className="text-2xl font-black">{stats.wins}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Side menu: Competitions list & Settings */}
        <div className="lg:col-span-1 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 px-1">My Segments</h3>
            {registrations.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic px-1 mb-4">No active enrollments</p>
            ) : (
              <div className="space-y-2">
                {registrations.map(reg => (
                  <button
                    key={reg.id}
                    onClick={() => setActiveTab(reg.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all text-sm font-semibold flex items-center justify-between ${
                      activeTab === reg.id
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/30 dark:border-indigo-900/50 dark:text-indigo-400'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{reg.competitions?.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          <div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 px-1">Security & Profile</h3>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left p-4 rounded-xl border transition-all text-sm font-semibold flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/30 dark:border-indigo-900/50 dark:text-indigo-400'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              🔒 Account Settings
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div className="lg:col-span-3">
          {activeTab === 'settings' ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-8 shadow-sm transition-colors duration-300">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Account Settings & Security</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage your profile details and update your password securely</p>
              </div>

              {settingsError && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg p-4 flex items-start gap-3 text-red-700 dark:text-red-400 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{settingsError}</span>
                </div>
              )}

              {settingsSuccess && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg p-4 flex items-start gap-3 text-emerald-700 dark:text-emerald-400 text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{settingsSuccess}</span>
                </div>
              )}

              {/* Profile form */}
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white border-l-2 border-indigo-500 pl-2">Profile Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Email Address</label>
                    <input
                      disabled
                      type="email"
                      value={user?.email || ''}
                      className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none text-slate-500 cursor-not-allowed text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Full Name</label>
                    <input
                      required
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm"
                      placeholder="Your full name"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={settingsLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-md transition-all disabled:opacity-75"
                  >
                    {settingsLoading ? 'Saving...' : 'Save Profile Name'}
                  </button>
                </div>
              </form>

              <hr className="border-slate-200 dark:border-slate-800" />

              {/* Password form */}
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white border-l-2 border-indigo-500 pl-2">Change Password</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">For security, you must reauthenticate by verifying your current password first.</p>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Current Password</label>
                    <input
                      required
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full max-w-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">New Password</label>
                      <input
                        required
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Confirm New Password</label>
                      <input
                        required
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={settingsLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-md transition-all disabled:opacity-75"
                  >
                    {settingsLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          ) : activeReg ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Badge Panel */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Your Participant Badge</h3>
                
                {/* HTML Badge (rendered for download) */}
                <div className="flex justify-center items-center py-4 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-slate-200 dark:border-slate-850">
                  <div
                    ref={el => badgeRefs.current[activeReg.id] = el}
                    style={{
                      width: '320px',
                      height: '440px',
                      backgroundColor: '#ffffff',
                      backgroundImage: 'radial-gradient(#e2e8f0 1.2px, #ffffff 1.2px)',
                      backgroundSize: '16px 16px',
                      color: '#0f172a',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '28px',
                      boxSizing: 'border-box',
                      borderRadius: '28px',
                      border: '1.5px solid rgba(99, 102, 241, 0.15)',
                      boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.08)',
                      overflow: 'hidden',
                      fontFamily: '"Outfit", "Inter", sans-serif'
                    }}
                  >
                    {/* Glowing light overlays */}
                    <div style={{
                      position: 'absolute',
                      top: '-100px',
                      right: '-100px',
                      width: '200px',
                      height: '200px',
                      background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0) 70%)',
                      pointerEvents: 'none'
                    }}></div>
                    <div style={{
                      position: 'absolute',
                      bottom: '-100px',
                      left: '-100px',
                      width: '200px',
                      height: '200px',
                      background: 'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, rgba(6, 182, 212, 0) 70%)',
                      pointerEvents: 'none'
                    }}></div>

                    {/* Cyber grids/lines */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '1.5px',
                      background: 'linear-gradient(to right, transparent, rgba(99, 102, 241, 0.3), transparent)'
                    }}></div>

                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Golden Contact Pad Chip */}
                        <div style={{
                          width: '32px',
                          height: '24px',
                          backgroundColor: '#fbbf24',
                          backgroundImage: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                          borderRadius: '5px',
                          position: 'relative',
                          border: '1px solid #b45309',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)'
                        }}>
                          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1px', backgroundColor: '#b45309', opacity: 0.25 }}></div>
                          <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1px', backgroundColor: '#b45309', opacity: 0.25 }}></div>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '1.5px', color: '#1e293b' }}>CATALYST</span>
                      </div>
                      
                      {/* LED Status Light */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#6366f1', boxShadow: '0 0 6px #6366f1' }}></div>
                        <span style={{ fontSize: '7px', fontWeight: 900, color: '#6366f1', letterSpacing: '1px' }}>VERIFIED</span>
                      </div>
                    </div>

                    {/* Middle Card Frame */}
                    <div style={{ textAlign: 'center', margin: '20px 0', position: 'relative', zIndex: 10 }}>
                      <div style={{
                        display: 'inline-flex',
                        padding: '4px 10px',
                        backgroundColor: 'rgba(99, 102, 241, 0.06)',
                        border: '1px solid rgba(99, 102, 241, 0.15)',
                        borderRadius: '9999px',
                        marginBottom: '16px'
                      }}>
                        <span style={{ fontSize: '8px', fontWeight: 900, color: '#4f46e5', letterSpacing: '1px', textTransform: 'uppercase' }}>
                          OFFICIAL PARTICIPANT
                        </span>
                      </div>

                      <h2 style={{
                        fontSize: '24px',
                        fontWeight: 900,
                        letterSpacing: '-0.5px',
                        color: '#0f172a',
                        marginBottom: '10px',
                        lineHeight: 1.2
                      }}>
                        {profile?.full_name || user?.email?.split('@')[0]}
                      </h2>

                      {activeReg.team_name && (
                        <p style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#4f46e5',
                          marginBottom: '8px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Team: {activeReg.team_name}
                        </p>
                      )}

                      <div style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#312e81',
                        background: 'linear-gradient(to right, #f1f5f9, #e2e8f0)',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        display: 'inline-block',
                        maxWidth: '240px',
                        wordWrap: 'break-word',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                      }}>
                        {activeReg.competitions?.title}
                      </div>

                      {/* Badge Sponsors Area */}
                      {activeReg.competitions?.sponsors && activeReg.competitions.sponsors.length > 0 && (
                        <div style={{
                          marginTop: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <span style={{
                            fontSize: '7px',
                            fontWeight: 900,
                            color: '#94a3b8',
                            letterSpacing: '1px',
                            textTransform: 'uppercase'
                          }}>
                            Supported By
                          </span>
                          <div style={{
                            display: 'flex',
                            gap: '8px',
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexWrap: 'wrap'
                          }}>
                            {activeReg.competitions.sponsors.slice(0, 3).map((sp, idx) => (
                              <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                padding: '3px 6px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                              }}>
                                {sp.logo_url && (
                                  <img
                                    src={sp.logo_url}
                                    alt=""
                                    style={{
                                      height: '14px',
                                      maxWidth: '35px',
                                      objectFit: 'contain'
                                    }}
                                    crossOrigin="anonymous"
                                  />
                                )}
                                <span style={{
                                  fontSize: '8px',
                                  fontWeight: 800,
                                  color: '#334155'
                                }}>
                                  {sp.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer barcode/metadata */}
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 10 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 700 }}>{activeReg.form_data?.university || 'Academic Core'}</span>
                        <span style={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'monospace' }}>ID: C-{String(activeReg.id).padStart(4, '0')}</span>
                      </div>

                      {/* CSS Barcode */}
                      <div style={{ display: 'flex', gap: '2px', height: '26px', alignItems: 'center', opacity: 0.85 }}>
                        <div style={{ width: '2px', height: '100%', backgroundColor: '#0f172a' }}></div>
                        <div style={{ width: '1px', height: '100%', backgroundColor: '#0f172a' }}></div>
                        <div style={{ width: '3px', height: '100%', backgroundColor: '#0f172a' }}></div>
                        <div style={{ width: '1px', height: '100%', backgroundColor: '#0f172a' }}></div>
                        <div style={{ width: '4px', height: '100%', backgroundColor: '#0f172a' }}></div>
                        <div style={{ width: '1px', height: '100%', backgroundColor: '#0f172a' }}></div>
                        <div style={{ width: '2px', height: '100%', backgroundColor: '#0f172a' }}></div>
                        <div style={{ width: '3px', height: '100%', backgroundColor: '#0f172a' }}></div>
                        <div style={{ width: '1px', height: '100%', backgroundColor: '#0f172a' }}></div>
                        <div style={{ width: '2px', height: '100%', backgroundColor: '#0f172a' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-center max-w-[320px] mx-auto">
                  <button
                    onClick={() => handleDownloadBadge(activeReg.id, activeReg.competitions?.title)}
                    disabled={downloading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition-all disabled:opacity-75"
                  >
                    <Download className="w-4 h-4" /> Download Badge
                  </button>
                  <button
                    onClick={() => handleCopyCaption(activeReg.competitions?.title)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all"
                    title="Copy Social Caption"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-2.5 justify-center max-w-[320px] mx-auto pt-1">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://www.catalyst-smart-classroom.me/competition.html')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] rounded-xl transition-all"
                    title="Share on Facebook"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                    </svg>
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://www.catalyst-smart-classroom.me/competition.html')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 text-[#0A66C2] rounded-xl transition-all"
                    title="Share on LinkedIn"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent('I am participating in Catalyst ' + activeReg.competitions?.title + '! Check it out: https://www.catalyst-smart-classroom.me/competition.html')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-xl transition-all"
                    title="Share on WhatsApp"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.859-4.407 9.862-9.83.001-2.628-1.02-5.1-2.875-6.958C16.604 1.97 14.148 1.95 11.53 1.95c-5.438 0-9.863 4.41-9.866 9.833-.001 2.028.528 4.017 1.53 5.781l-.992 3.624 3.73-.978L6.647 19.15z"/>
                    </svg>
                  </a>
                </div>

                {/* Certificate Section */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Official Certificate
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Generate and download your official, verified competition certificate containing organizers' signatures and sponsors.
                  </p>

                  {activeReg.certificate_issued ? (
                    <div className="space-y-3">
                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-250 text-amber-700 dark:text-amber-400 rounded-2xl p-4 text-xs font-semibold flex items-start gap-2.5">
                        <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-bold text-amber-900 dark:text-amber-300">Certificate Issued</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            The certificate has already been issued under the name <strong className="text-indigo-600 dark:text-indigo-400">"{activeReg.certificate_name}"</strong>. To ensure security and credential integrity, certificates can only be generated and downloaded once.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : !certificateApplied ? (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Enter Full Name for Certificate
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Pritom Bhowmik"
                          value={certificateName}
                          onChange={(e) => setCertificateName(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-xs dark:text-white font-medium"
                        />
                      </div>
                      <button
                        onClick={handleApplyCertificate}
                        disabled={!certificateName.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl shadow-md hover:shadow-indigo-500/10 transition-all text-xs flex justify-center items-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" /> Apply for Certificate
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 text-emerald-800 dark:text-emerald-400 rounded-xl p-3 text-[11px] font-semibold flex items-center gap-1.5">
                        <CheckCircle className="w-4.5 h-4.5 shrink-0 text-emerald-600 dark:text-emerald-500" />
                        <span>Certificate ready for download!</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownloadCertificate('png')}
                          disabled={generatingCert}
                          className="flex-1 bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-xl shadow-sm text-xs transition-all flex justify-center items-center gap-1.5"
                        >
                          {generatingCert ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <FileImage className="w-4 h-4" /> Download JPG
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDownloadCertificate('pdf')}
                          disabled={generatingCert}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-md text-xs transition-all flex justify-center items-center gap-1.5"
                        >
                          {generatingCert ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <FileText className="w-4 h-4" /> Download PDF
                            </>
                          )}
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setCertificateApplied(false);
                          setCertificateName('');
                        }}
                        className="w-full text-center text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase pt-1"
                      >
                        Change Name / Re-apply
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Submission Window Panel */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" /> Project Submission
                </h3>

                {/* Dynamic Countdown */}
                {timeline && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl space-y-1.5">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{timeline.label}</p>
                    <p className="text-lg font-black tracking-tight text-slate-800 dark:text-white">
                      {timeline.status === 'closed' ? 'Submission Window Has Ended' : formatTimeLeft(timeline.timeLeft)}
                    </p>
                  </div>
                )}

                {activeReg.submission_url && !reSubmitting[activeReg.id] ? (
                  <div className="space-y-4 text-center py-6">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">Submission Received</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">We have successfully logged your PDF report.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center items-center pt-2">
                      <a
                        href={activeReg.submission_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs transition-colors w-full sm:w-auto justify-center"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View Submitted PDF
                      </a>

                      {isLeader && timeline && timeline.status !== 'closed' && (
                        <button
                          onClick={() => setReSubmitting(prev => ({ ...prev, [activeReg.id]: true }))}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors w-full sm:w-auto justify-center"
                        >
                          <Upload className="w-3.5 h-3.5" /> Replace / Re-submit
                        </button>
                      )}
                    </div>

                    {!isLeader && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium max-w-xs mx-auto mt-2">
                        Only the Team Leader ({activeReg.profiles?.full_name || 'Leader'}) is authorized to replace or re-submit the project report.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {!isLeader ? (
                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-6 text-amber-800 dark:text-amber-400 text-xs space-y-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0" />
                          <h4 className="font-extrabold uppercase tracking-wider">Team Leader Only Submission</h4>
                        </div>
                        <p className="leading-relaxed">
                          Only the Team Leader <strong className="text-slate-900 dark:text-white">({activeReg.profiles?.full_name || 'Leader'})</strong> is authorized to upload or submit the final project report for the competition segment.
                        </p>
                        <p className="leading-relaxed text-[11px] text-slate-500">
                          Please send your project report PDF to your leader so they can submit it before the deadline.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                              {activeReg.submission_url ? 'Replace Project Report (PDF)' : 'Upload Project Report (PDF)'}
                            </label>
                            {reSubmitting[activeReg.id] && (
                              <button
                                onClick={() => {
                                  setReSubmitting(prev => ({ ...prev, [activeReg.id]: false }));
                                  setSelectedFile(null);
                                  setUploadError('');
                                }}
                                className="text-[10px] font-extrabold text-red-500 hover:text-red-600 uppercase tracking-wider"
                              >
                                Cancel Re-submit
                              </button>
                            )}
                          </div>
                          <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors relative ${
                            timeline?.disabled 
                              ? 'border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 opacity-60 cursor-not-allowed'
                              : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500/70 cursor-pointer'
                          }`}>
                            <Upload className={`w-8 h-8 mx-auto mb-2 ${timeline?.disabled ? 'text-slate-400' : 'text-indigo-600'}`} />
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                              {timeline?.status === 'pending' ? 'Submission Not Opened' : timeline?.status === 'closed' ? 'Submission Closed' : 'Click to select or drag PDF file'}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {timeline?.status === 'pending' ? 'Upload opens soon' : timeline?.status === 'closed' ? 'Deadline passed' : 'PDF report • Max 10MB'}
                            </p>
                            {!timeline?.disabled && (
                              <input
                                type="file"
                                accept=".pdf"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                              />
                            )}
                          </div>
                        </div>

                        {selectedFile && (
                          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="w-5 h-5 text-red-600 shrink-0" />
                              <div className="truncate">
                                <p className="text-xs font-semibold truncate">{selectedFile.name}</p>
                                <p className="text-[10px] text-slate-500 font-medium">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedFile(null)}
                              className="text-xs font-bold text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        )}

                        {uploadError && (
                          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 text-red-700 dark:text-red-400 rounded-lg p-3 text-xs flex items-center gap-1.5 font-medium">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{uploadError}</span>
                          </div>
                        )}

                        {progress[activeReg.id] > 0 && (
                          <div className="space-y-1">
                            <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-indigo-600 h-full transition-all duration-300"
                                style={{ width: `${progress[activeReg.id]}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                              <span>Uploading...</span>
                              <span>{progress[activeReg.id]}%</span>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => handleUploadSubmission(activeReg.id)}
                          disabled={!selectedFile || uploading[activeReg.id] || timeline?.disabled}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-md hover:shadow-emerald-500/10 transition-all flex justify-center items-center gap-2 text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                          {uploading[activeReg.id] ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <FileCheck className="w-4 h-4" /> {activeReg.submission_url ? 'Replace & Submit Report' : 'Submit Report'}
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Rulebook & Guidelines and Prizes & Recognition Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Rulebook & Guidelines */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Rulebook & Guidelines
                </h3>
                <div className="space-y-4 pt-2">
                  <a
                    href="https://drive.google.com/file/d/1vJQep5_L7nwJN5Y3sy9r0qe8ncBqUqtL/view?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline break-all block flex items-center gap-1.5"
                  >
                    <span>https://drive.google.com/file/d/1vJQep5_L7nwJN5Y3sy9r0qe8ncBqUqtL/view?usp=sharing</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                  
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      Please join this Community for Get Update :
                    </p>
                    <a
                      href="https://discord.gg/Y9aAT5ER8E"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline break-all block flex items-center gap-1.5"
                    >
                      <span>https://discord.gg/Y9aAT5ER8E</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Prizes & Recognition */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-indigo-650 dark:text-indigo-400" /> Prizes & Recognition
                </h3>
                <div className="space-y-4 pt-2">
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-bold">
                    Check Rule Book
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold">No active enrollments</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
                You haven't registered for any competition segments yet. Go to Challenges to register!
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Success Celebration Overlay */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Submission Successful! 🎉</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Your research project proposal has been received. You can view the status inside your segment dashboard anytime.
              </p>
            </div>
            <button
              onClick={() => setShowSuccessOverlay(false)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all text-sm"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-full shadow-lg text-xs font-bold flex items-center gap-1.5 animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{toastMsg}</span>
        </div>
      )}
      {activeReg && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div
            ref={certificateRef}
            style={{
              width: '842px',
              height: '595px',
              backgroundColor: '#ffffff',
              backgroundImage: 'radial-gradient(#f1f5f9 1.5px, transparent 1.5px)',
              backgroundSize: '24px 24px',
              color: '#0f172a',
              padding: '48px',
              boxSizing: 'border-box',
              border: '16px solid #1e3a8a',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              fontFamily: '"Outfit", "Inter", sans-serif'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '8px',
              bottom: '8px',
              left: '8px',
              right: '8px',
              border: '2px solid #d97706',
              pointerEvents: 'none'
            }}></div>

            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: 0.03,
              pointerEvents: 'none',
              zIndex: 0
            }}>
              <Trophy style={{ width: '320px', height: '320px', color: '#1e3a8a' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/iconi.png" alt="Catalyst Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                <span style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '2px', color: '#1e3a8a' }}>CATALYST SMART CLASSROOM</span>
              </div>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase' }}>
                VERIFIED CREDENTIAL
              </div>
            </div>

            <div style={{ textAlign: 'center', margin: 'auto 0', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h1 style={{
                fontSize: '36px',
                fontWeight: 900,
                color: '#1e3a8a',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                margin: 0
              }}>
                {activeReg.status === 'winner' || activeReg.status === 'runner_up'
                  ? 'Certificate of Excellence'
                  : 'Certificate of Participation'}
              </h1>
              
              <p style={{ fontSize: '13px', color: '#475569', fontStyle: 'italic', margin: 0 }}>
                This certificate is proudly presented to
              </p>

              <h2 style={{
                fontSize: '32px',
                fontWeight: 800,
                color: '#0f172a',
                borderBottom: '2px solid #cbd5e1',
                display: 'inline-block',
                margin: '8px auto',
                paddingBottom: '8px',
                minWidth: '320px',
                textAlign: 'center'
              }}>
                {activeReg.certificate_issued ? activeReg.certificate_name : (certificateName || 'Participant')}
              </h2>

              <p style={{ fontSize: '13px', color: '#475569', maxWidth: '580px', margin: '0 auto', lineHeight: 1.6 }}>
                for {activeReg.status === 'winner' || activeReg.status === 'runner_up' ? 'securing a podium placement' : 'active participation'} in the challenge segment{' '}
                <strong style={{ color: '#1e3a8a', fontWeight: 800 }}>{activeReg.competitions?.title}</strong>.
                {activeReg.team_name && (
                  <span> Representing <strong style={{ color: '#4f46e5' }}>{activeReg.team_name}</strong>.</span>
                )}
              </p>

              <p style={{
                fontSize: '11px',
                color: '#64748b',
                maxWidth: '640px',
                margin: '12px auto 0 auto',
                lineHeight: 1.5,
                borderTop: '1px dashed #cbd5e1',
                paddingTop: '10px',
                fontStyle: 'normal'
              }}>
                <span style={{ fontWeight: 850, textTransform: 'uppercase', fontSize: '9px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Segment Description & Details</span>
                {activeReg.competitions?.description ? (activeReg.competitions.description.length > 200 ? activeReg.competitions.description.slice(0, 197) + '...' : activeReg.competitions.description) : 'No description available for this segment.'}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 10, borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '220px' }}>
                {activeReg.competitions?.sponsors && activeReg.competitions.sponsors.length > 0 && (
                  <>
                    <span style={{ fontSize: '8px', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      In Collaboration With
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                      {activeReg.competitions.sponsors.slice(0, 3).map((sp, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {sp.logo_url && (
                            <img
                              src={sp.logo_url}
                              alt={sp.name}
                              style={{ height: '24px', objectFit: 'contain' }}
                            />
                          )}
                          <span style={{ fontSize: '8px', fontWeight: 700, color: '#64748b' }}>
                            {sp.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'monospace' }}>
                  CREDENTIAL ID: C-{String(activeReg.id).padStart(4, '0')}
                </span>
                <span style={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'monospace' }}>
                  DATE: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>

              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '220px' }}>
                {activeReg.competitions?.signature_url ? (
                  <img
                    src={activeReg.competitions.signature_url}
                    alt="Organizer Signature"
                    style={{ height: '36px', objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ height: '36px', borderBottom: '1px solid #94a3b8', width: '120px' }}></div>
                )}
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#1e293b' }}>
                  Lead Organizer
                </span>
                <span style={{ fontSize: '8px', color: '#64748b' }}>
                  Catalyst Committee
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Certificate Name Confirmation Modal */}
      {showCertConfirm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 transform transition-all scale-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Double-Check Your Name!
                </h3>
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500">
                  Action cannot be undone later
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                আপনার এই প্রতিযোগিতার সার্টিফিকেটটি শুধুমাত্র <strong className="text-slate-900 dark:text-white">একবারই</strong> তৈরি করা সম্ভব। একবার তৈরি হয়ে গেলে পরবর্তীতে নাম পরিবর্তন বা নতুন নাম দিয়ে পুনরায় জেনারেট/ডাউনলোড করা যাবে না।
              </p>

              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 text-center">
                <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                  Name to print on Certificate
                </span>
                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                  {certificateName}
                </p>
              </div>

              <p className="text-[11px] text-slate-400 text-center font-semibold">
                আপনার নামের বানান কি একদম সঠিক আছে?
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-1">
              <button
                onClick={() => setShowCertConfirm(false)}
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 font-extrabold text-xs rounded-xl border border-slate-200/60 dark:border-slate-700/50 transition-all cursor-pointer"
              >
                No, Edit Name
              </button>
              <button
                onClick={confirmAndGenerateCertificate}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-indigo-500/10 transition-all cursor-pointer"
              >
                Yes, Confirm & Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help & Support Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-[999] md:bottom-8 md:right-8">
        <a
          href="mailto:pritombhowmik360@gmail.com?subject=Catalyst%20Smart%20Classroom%20Support%20Request"
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-full shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 font-extrabold text-xs tracking-wider uppercase group cursor-pointer border border-indigo-500/10 active:scale-95"
        >
          <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Help & Support</span>
        </a>
      </div>
    </div>
  );
}
