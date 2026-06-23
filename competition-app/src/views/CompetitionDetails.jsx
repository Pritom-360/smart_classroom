import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import FormRenderer from '../components/FormRenderer';
import { Trophy, Calendar, Users, Award, FileText, ArrowLeft, Plus, Minus, UserCheck, ShieldAlert } from 'lucide-react';
import useDocumentMetadata from '../hooks/useDocumentMetadata';
import { compressImage } from '../utils/imageCompressor';

const renderClickableText = (text) => {
  if (!text) return null;
  // Match URLs starting with http/https or www.
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      const href = part.startsWith('http') ? part : `https://${part}`;
      return (
        <a 
          key={index} 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export default function CompetitionDetails() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [comp, setComp] = useState(null);
  const [registered, setRegistered] = useState(false);
  const [regData, setRegData] = useState(null);
  const [winners, setWinners] = useState([]);
  const [segmentRegistrations, setSegmentRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regLoading, setRegLoading] = useState(false);
  const [error, setError] = useState('');

  // Team state (if type === 'team')
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState([{ name: '', email: '' }]); // array of {name, email}

  useDocumentMetadata({
    title: comp ? `${comp.title} - Academic Challenge` : 'Challenge Details',
    description: comp ? `${comp.description.slice(0, 160)}... Review rulebooks, prizes, and register solo or in teams.` : 'View active academic challenges and submit your research or project report.',
    canonicalUrl: comp ? `https://www.catalyst-smart-classroom.me/competition.html#/competition/${comp.id}` : 'https://www.catalyst-smart-classroom.me/competition.html',
    ogImage: 'https://www.catalyst-smart-classroom.me/assets/icon/iconi.png'
  });

  useEffect(() => {
    async function fetchCompDetails() {
      try {
        setLoading(true);
        // Fetch competition details
        const { data, error } = await supabase
          .from('competitions')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        setComp(data);

        // Fetch winners if completed
        if (data?.status === 'completed') {
          const { data: winData, error: winErr } = await supabase
            .from('registrations')
            .select(`
              id,
              placement,
              team_name,
              form_data,
              profiles (
                id,
                full_name,
                avatar_url
              )
            `)
            .eq('competition_id', id)
            .in('status', ['winner', 'runner_up'])
            .order('placement', { ascending: true });

          if (!winErr) setWinners(winData || []);
        }

        // Fetch all registrations for segment leaderboard
        const { data: regsData, error: regsErr } = await supabase
          .from('registrations')
          .select(`
            id,
            status,
            placement,
            team_name,
            profiles (
              id,
              full_name,
              avatar_url,
              email
            ),
            team_members (
              member_name,
              member_email
            )
          `)
          .eq('competition_id', id)
          .order('placement', { ascending: true })
          .order('status', { ascending: false });

        if (!regsErr) {
          setSegmentRegistrations(regsData || []);
        }

        // Check if current user is registered
        if (user) {
          const { data: reg, error: regErr } = await supabase
            .from('registrations')
            .select('*')
            .eq('competition_id', id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (reg) {
            setRegistered(true);
            setRegData(reg);
          } else {
            // Check if user is registered as a team member for this competition
            const { data: memberRegs, error: memberErr } = await supabase
              .from('team_members')
              .select(`
                registration_id,
                registrations!inner(*)
              `)
              .ilike('member_email', user.email.trim())
              .eq('registrations.competition_id', id);

            if (memberRegs && memberRegs.length > 0) {
              setRegistered(true);
              setRegData(memberRegs[0].registrations);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching competition:', err.message);
        setError('Could not load competition details.');
      } finally {
        setLoading(false);
      }
    }

    fetchCompDetails();
  }, [id, user]);

  const handleAddTeamMember = () => {
    if (teamMembers.length < (comp.max_team_size || 4) - 1) {
      setTeamMembers([...teamMembers, { name: '', email: '' }]);
    }
  };

  const handleRemoveTeamMember = (index) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const handleTeamMemberChange = (index, field, value) => {
    const updated = [...teamMembers];
    updated[index] = { ...updated[index], [field]: value };
    setTeamMembers(updated);
  };

  const handleRegister = async (formData, files) => {
    if (!user) return;
    setRegLoading(true);
    setError('');

    try {
      // 0. Double check if already registered (as leader or teammate) to prevent duplicate submissions
      const { data: existingReg } = await supabase
        .from('registrations')
        .select('id')
        .eq('competition_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingReg) {
        throw new Error('You are already registered for this competition.');
      }

      const { data: memberReg } = await supabase
        .from('team_members')
        .select('registration_id')
        .ilike('member_email', user.email.trim())
        .maybeSingle();

      if (memberReg) {
        const { data: memberComp } = await supabase
          .from('registrations')
          .select('id')
          .eq('id', memberReg.registration_id)
          .eq('competition_id', id)
          .maybeSingle();

        if (memberComp) {
          throw new Error('You are already registered as a team member for this competition.');
        }
      }

      // 1. Upload files if any
      const uploadedUrls = {};
      for (const fieldId in files) {
        const file = files[fieldId];
        const compressedFile = await compressImage(file, { maxWidth: 1200, maxHeight: 1200 });
        const originalExt = file.name.split('.').pop() || 'pdf';
        const fileExt = compressedFile.type.startsWith('image/') 
          ? (compressedFile.type === 'image/png' ? 'png' : 'jpg') 
          : originalExt;
        const path = `registrations/${id}/${user.id}_${fieldId}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('challenge-submissions')
          .upload(path, compressedFile, { cacheControl: '3600', upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('challenge-submissions')
          .getPublicUrl(path);

        uploadedUrls[fieldId] = urlData.publicUrl;
      }

      // Merge file URLs into custom field responses
      const finalFormData = { ...formData, ...uploadedUrls };

      // 2. Insert registration
      const registrationPayload = {
        user_id: user.id,
        competition_id: id,
        team_name: comp.type === 'team' ? teamName : null,
        form_data: finalFormData,
        status: 'registered'
      };

      const { data: regInsert, error: regError } = await supabase
        .from('registrations')
        .insert([registrationPayload])
        .select()
        .single();

      if (regError) throw regError;

      // 3. Insert team members if team type
      if (comp.type === 'team' && teamMembers.filter(m => m.email).length > 0) {
        const memberPayloads = teamMembers
          .filter(m => m.email)
          .map(member => ({
            registration_id: regInsert.id,
            member_name: member.name || null,
            member_email: member.email.trim().toLowerCase(),
            role: 'member'
          }));

        const { error: memberError } = await supabase
          .from('team_members')
          .insert(memberPayloads);

        if (memberError) {
          // If member_name column is missing, fall back to email-only insertion
          if (memberError.message?.includes('member_name') || memberError.code === 'PGRST204' || String(memberError.message).includes('column')) {
            console.warn('member_name column missing in database, falling back to email-only insertion.');
            const fallbackPayloads = teamMembers
              .filter(m => m.email)
              .map(member => ({
                registration_id: regInsert.id,
                member_email: member.email.trim().toLowerCase(),
                role: 'member'
              }));

            const { error: fallbackError } = await supabase
              .from('team_members')
              .insert(fallbackPayloads);

            if (fallbackError) throw fallbackError;
          } else {
            throw memberError;
          }
        }
      }

      setRegistered(true);
      setRegData(regInsert);

      // Async email notification via EmailJS
      try {
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_myloo04';
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_default';
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

        const motivationalMsg = `Every great researcher and engineer started exactly where you are today. The courage to compete, design, and share your ideas is your first step toward changing the status quo. Push your boundaries, stay curious, and make us proud!`;

        const emailParams = {
          to_name: profile?.full_name || user?.email?.split('@')[0] || 'Participant',
          name: profile?.full_name || user?.email?.split('@')[0] || 'Participant',
          to_email: user?.email,
          email: user?.email,
          competition_title: comp?.title,
          registration_id: `C-${String(regInsert.id).padStart(4, '0')}`,
          deadline: new Date(comp?.deadline).toLocaleDateString(),
          message: motivationalMsg,
          dashboard_url: 'https://www.catalyst-smart-classroom.me/competition.html#/dashboard'
        };

        if (publicKey) {
          emailjs.send(serviceId, templateId, emailParams, publicKey)
            .then((res) => {
              console.log('Confirmation email sent successfully via EmailJS!', res.status, res.text);
            })
            .catch((err) => {
              console.error('EmailJS sending failed:', err);
            });
        } else {
          emailjs.send(serviceId, templateId, emailParams)
            .then((res) => {
              console.log('Confirmation email sent successfully!', res.status, res.text);
            })
            .catch((err) => {
              console.warn('EmailJS sending failed (no public key provided):', err);
            });
        }

        // Send invite emails to all team members
        if (comp.type === 'team' && teamMembers.filter(m => m.email && m.name).length > 0) {
          teamMembers
            .filter(m => m.email && m.name)
            .forEach(member => {
              const inviteMsg = `Hi ${member.name},\n\nYou have been added as a team member of team "${teamName}" by your team leader ${profile?.full_name || user.email} for the competition "${comp.title}".\n\nPlease create an account or sign in using this email address (${member.email}) at Catalyst Challenges to check your participant badge and stay updated on the submission status!`;

              const inviteParams = {
                to_name: member.name,
                name: member.name,
                to_email: member.email,
                email: member.email,
                competition_title: comp?.title,
                registration_id: `C-${String(regInsert.id).padStart(4, '0')}`,
                deadline: new Date(comp?.deadline).toLocaleDateString(),
                message: inviteMsg,
                dashboard_url: 'https://www.catalyst-smart-classroom.me/competition.html#/dashboard'
              };

              if (publicKey) {
                emailjs.send(serviceId, templateId, inviteParams, publicKey)
                  .then(res => console.log('Invite email sent to team member successfully:', member.email, res.status, res.text))
                  .catch(err => console.error('Failed to send invite email to member:', member.email, err));
              } else {
                emailjs.send(serviceId, templateId, inviteParams)
                  .then(res => console.log('Invite email sent to team member successfully:', member.email, res.status, res.text))
                  .catch(err => console.error('Failed to send invite email to member:', member.email, err));
              }
            });
        }
      } catch (emailErr) {
        console.error('Error initiating email send:', emailErr);
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setRegLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!comp) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Competition not found</h2>
        <Link to="/" className="text-indigo-600 font-semibold mt-4 inline-block hover:underline">&larr; Back to Challenges</Link>
      </div>
    );
  }

  const now = new Date();
  const regDeadline = comp ? (comp.registration_deadline ? new Date(comp.registration_deadline) : new Date(comp.deadline)) : null;
  const isRegClosed = regDeadline ? now > regDeadline : false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Challenges
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Rules & Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider rounded-md mb-4">
              {comp.status}
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight mb-4">
              {comp.title}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {comp.description}
            </p>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-850">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h4 className="text-xs text-slate-500 font-semibold">Deadline</h4>
                  <p className="text-sm font-bold">{new Date(comp.deadline).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h4 className="text-xs text-slate-500 font-semibold">Format</h4>
                  <p className="text-sm font-bold capitalize">{comp.type === 'team' ? `Team (Max ${comp.max_team_size || 4})` : 'Individual Solo'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rulebook */}
            <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" /> Rulebook & Guidelines
              </h3>
              <p className="text-sm text-slate-555 dark:text-slate-404 whitespace-pre-line leading-relaxed">
                {renderClickableText(comp.rules) || 'No rules configured.'}
              </p>
            </div>

            {/* Prizes */}
            <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-indigo-600" /> Prizes & Recognition
              </h3>
              <p className="text-sm text-slate-555 dark:text-slate-404 whitespace-pre-line leading-relaxed">
                {renderClickableText(comp.prizes) || 'To be announced.'}
              </p>
            </div>
          </div>

          {/* Sponsors Section (Dynamic) */}
          {comp.sponsors && comp.sponsors.length > 0 && (
            <div className="bg-gradient-to-r from-indigo-50/50 to-indigo-100/30 dark:from-indigo-950/20 dark:to-indigo-950/5 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                </span>
                <h3 className="text-sm font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-widest">
                  Official Segment Sponsors
                </h3>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {comp.sponsors.map((sp, idx) => (
                  <div key={idx} className="group relative w-36 sm:w-44 shrink-0">
                    {sp.website_url ? (
                      <a
                        href={sp.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs hover:border-indigo-500 transition-all duration-300 h-20"
                      >
                        {sp.logo_url ? (
                          <img
                            src={sp.logo_url}
                            alt={sp.name}
                            className="max-h-16 w-auto max-w-[90%] object-contain dark:brightness-95 transition-all duration-300"
                          />
                        ) : (
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 text-xs tracking-wide">
                            {sp.name}
                          </span>
                        )}
                      </a>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs h-20 w-full">
                        {sp.logo_url ? (
                          <img
                            src={sp.logo_url}
                            alt={sp.name}
                            className="max-h-16 w-auto max-w-[90%] object-contain dark:brightness-95"
                          />
                        ) : (
                          <span className="font-extrabold text-slate-850 dark:text-slate-200 text-xs tracking-wide">
                            {sp.name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Segment Leaderboard */}
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" /> Segment Leaderboard & Participants
            </h3>
            {segmentRegistrations.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-405 italic">No registrations for this competition yet.</p>
            ) : (
              <div className="space-y-3">
                {segmentRegistrations.map((reg) => {
                  const isWinner = reg.status === 'winner' || reg.status === 'runner_up';
                  return (
                    <div key={reg.id} className={`p-4 rounded-xl border ${
                      reg.placement === 1 ? 'bg-amber-500/5 border-amber-300 dark:border-amber-900/60' :
                      reg.placement === 2 ? 'bg-slate-100/50 border-slate-350 dark:border-slate-800' :
                      reg.placement === 3 ? 'bg-amber-600/5 border-amber-500/30' :
                      'bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-900/60'
                    } flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {reg.placement && (
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              reg.placement === 1 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-450' :
                              reg.placement === 2 ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300' :
                              'bg-amber-50 text-amber-805'
                            }`}>
                              {reg.placement === 1 ? '🏆 Champion' : reg.placement === 2 ? '🥈 1st Runner Up' : '🥉 2nd Runner Up'}
                            </span>
                          )}
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {comp.type === 'team' ? reg.team_name : reg.profiles?.full_name}
                          </h4>
                        </div>
                        
                        {comp.type === 'team' && (
                          <div className="space-y-1 mt-1.5 pl-2 border-l-2 border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 font-semibold">
                            <p>
                              Leader: <span className="text-slate-900 dark:text-slate-200 font-bold">{reg.profiles?.full_name}</span> ({reg.profiles?.email})
                            </p>
                            {reg.team_members && reg.team_members.length > 0 && (
                              <p className="flex items-center gap-1 flex-wrap mt-0.5">
                                <span className="text-slate-400 font-medium">Members:</span>
                                {reg.team_members.map((m, i) => (
                                  <span key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 px-1.5 py-0.5 rounded text-[10px]">
                                    {m.member_name} ({m.member_email})
                                  </span>
                                ))}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider ${
                          reg.status === 'submitted' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450' :
                          isWinner ? 'bg-indigo-50 text-indigo-750 dark:bg-indigo-950/20 dark:text-indigo-405' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {reg.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Registration Gate */}
        <div className="lg:col-span-1">
          {comp.status === 'completed' ? (
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-205 dark:border-slate-800 rounded-2xl p-6 text-center shadow-sm">
              <Award className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h3 className="font-bold text-slate-900 dark:text-white">Challenge Concluded</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                This competition has ended. Check out the winners leaderboard or browse active challenges!
              </p>
            </div>
          ) : !user ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md text-center space-y-4">
              <UserCheck className="w-10 h-10 text-indigo-600 mx-auto" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Participate in Segment</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Log in or register your account to enroll for this competition and build your digital card.
              </p>
              <Link
                to="/login"
                className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow-md hover:shadow-indigo-500/10 transition-all text-sm"
              >
                Sign In to Register
              </Link>
            </div>
          ) : registered ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md text-center space-y-4">
              <UserCheck className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Already Registered</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                You are registered for this competition. Go to your dashboard to export your badge, add members, or upload project files.
              </p>
              <Link
                to="/dashboard"
                className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow-md hover:shadow-indigo-500/10 transition-all text-sm"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : isRegClosed ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center shadow-md space-y-3">
              <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto animate-pulse" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Registration Closed</h3>
              <p className="text-xs text-slate-550 dark:text-slate-404 leading-relaxed">
                Registration for this challenge ended on {regDeadline?.toLocaleString()}. Submissions are open only to registered candidates.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl p-6 shadow-md space-y-6">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Register Entry</h3>

              {error && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 text-red-700 dark:text-red-405 rounded-lg p-3 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Team specific inputs */}
              {comp.type === 'team' && (
                <div className="space-y-4 pb-4 border-b border-slate-100 dark:border-slate-850">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-404 uppercase tracking-wider">
                      Team Name <span className="text-red-550">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. Robo Rangers"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Team Members (Name & Email)
                    </label>
                    {teamMembers.length < (comp.max_team_size || 4) - 1 && (
                      <button
                        type="button"
                        onClick={handleAddTeamMember}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center gap-0.5 hover:underline"
                      >
                        <Plus className="w-3 h-3" /> Add Member
                      </button>
                    )}
                  </div>
                  {teamMembers.map((member, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/50">
                      <input
                        required
                        type="text"
                        value={member.name || ''}
                        onChange={(e) => handleTeamMemberChange(idx, 'name', e.target.value)}
                        placeholder={`Member #${idx + 2} Name`}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-xs dark:text-white"
                      />
                      <input
                        required
                        type="email"
                        value={member.email || ''}
                        onChange={(e) => handleTeamMemberChange(idx, 'email', e.target.value)}
                        placeholder={`Member #${idx + 2} Email`}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-xs dark:text-white"
                      />
                      {teamMembers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTeamMember(idx)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  </div>
                </div>
              )}

              {/* Custom dynamic fields */}
              <FormRenderer
                fields={comp.custom_fields || []}
                onSubmit={handleRegister}
                loading={regLoading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
