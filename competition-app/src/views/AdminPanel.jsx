import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Users, Plus, Shield, Check, Edit, Trash2, Calendar, FileText, ArrowRight, UserCheck, Download, Search, Sparkles, Award, X } from 'lucide-react';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [comps, setComps] = useState([]);
  const [regs, setRegs] = useState([]);
  const [selectedCompId, setSelectedCompId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalComps: 0, totalParticipants: 0, totalSubmissions: 0 });
  const [activeTab, setActiveTab] = useState('comps');
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [leaderboardSearch, setLeaderboardSearch] = useState('');

  useEffect(() => {
    async function fetchAdminData() {
      try {
        setLoading(true);
        // Fetch competitions
        const { data: competitions, error: compsErr } = await supabase
          .from('competitions')
          .select('*')
          .order('created_at', { ascending: false });

        if (compsErr) throw compsErr;
        setComps(competitions || []);

        // Fetch all profiles for leaderboard matching
        const { data: allProfiles, error: profErr } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url');

        if (profErr) throw profErr;

        // Fetch registrations with full relationships
        const { data: registrations, error: regsErr } = await supabase
          .from('registrations')
          .select(`
            *,
            competitions (
              title,
              type,
              ranking_structure
            ),
            profiles (
              id,
              full_name,
              email,
              avatar_url
            ),
            team_members (
              member_name,
              member_email
            )
          `)
          .order('created_at', { ascending: false });

        if (regsErr) throw regsErr;
        setRegs(registrations || []);

        // Calculate statistics
        const totalCompsCount = competitions?.length || 0;
        const totalRegCount = registrations?.length || 0;
        const totalSubmissionsCount = registrations?.filter(r => r.submission_url).length || 0;
        setStats({ totalComps: totalCompsCount, totalParticipants: totalRegCount, totalSubmissions: totalSubmissionsCount });

        // Group by user and calculate scores for the Admin Leaderboard
        const userScores = {};

        const addPoints = (userId, name, email, avatar, isWin, placementVal, compTitle, statusVal, compObj) => {
          if (!userId) return;
          if (!userScores[userId]) {
            userScores[userId] = {
              id: userId,
              name: name || email?.split('@')[0] || 'Anonymous User',
              avatar: avatar || null,
              email: email || '',
              participations: 0,
              wins: 0,
              points: 0,
              history: []
            };
          }

          userScores[userId].participations += 1;
          userScores[userId].points += 10; // Basic participation pts

          // Add to participation history
          userScores[userId].history.push({
            compTitle,
            status: statusVal,
            placement: placementVal
          });

          if (isWin) {
            userScores[userId].wins += 1;
            const ranks = compObj?.ranking_structure || [
              { placement: 1, title: 'Champion', points: 100 },
              { placement: 2, title: '1st Runner Up', points: 60 },
              { placement: 3, title: '2nd Runner Up', points: 40 }
            ];
            const rankMatch = Array.isArray(ranks) && ranks.find(r => r.placement === placementVal);
            if (rankMatch) {
              userScores[userId].points += Number(rankMatch.points) || 0;
            } else {
              if (placementVal === 1) {
                userScores[userId].points += 100;
              } else if (placementVal === 2) {
                userScores[userId].points += 60;
              } else if (placementVal === 3) {
                userScores[userId].points += 40;
              }
            }
          }
        };

        registrations.forEach(reg => {
          const isWin = reg.status === 'winner' || reg.status === 'runner_up';
          const placementVal = reg.placement;
          const compTitle = reg.competitions?.title || 'Unknown Challenge';
          const statusVal = reg.status;

          // 1. Leader / solo competitor gets points
          const leaderProfile = reg.profiles;
          if (leaderProfile) {
            addPoints(
              reg.user_id,
              leaderProfile.full_name,
              leaderProfile.email,
              leaderProfile.avatar_url,
              isWin,
              placementVal,
              compTitle,
              statusVal,
              reg.competitions
            );
          }

          // 2. All team members get the exact same points if they have registered profiles
          const isTeam = reg.competitions?.type === 'team';
          if (isTeam && reg.team_members && reg.team_members.length > 0) {
            reg.team_members.forEach(member => {
              if (member.member_email) {
                // Find registered profile matching this email
                const matchProf = allProfiles?.find(
                  p => p.email?.toLowerCase() === member.member_email.toLowerCase()
                );
                if (matchProf) {
                  addPoints(
                    matchProf.id,
                    matchProf.full_name,
                    matchProf.email,
                    matchProf.avatar_url,
                    isWin,
                    placementVal,
                    compTitle,
                    statusVal,
                    reg.competitions
                  );
                }
              }
            });
          }
        });

        // Convert object to array and sort by points
        const sorted = Object.values(userScores).sort((a, b) => b.points - a.points);
        setLeaderboard(sorted);

      } catch (err) {
        console.error('Error fetching admin data:', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAdminData();
  }, []);

  const handleUpdateStatus = async (compId, status) => {
    try {
      const { error } = await supabase
        .from('competitions')
        .update({ status })
        .eq('id', compId);

      if (error) throw error;
      setComps(prev => prev.map(c => c.id === compId ? { ...c, status } : c));
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const handleDeleteComp = async (compId) => {
    if (!confirm('Are you sure you want to delete this competition? All related registrations will be lost.')) return;
    try {
      const { error } = await supabase
        .from('competitions')
        .delete()
        .eq('id', compId);

      if (error) throw error;
      setComps(prev => prev.filter(c => c.id !== compId));
      setStats(prev => ({ ...prev, totalComps: prev.totalComps - 1 }));
    } catch (err) {
      alert(err.message || 'Failed to delete competition.');
    }
  };

  const handleExportCSV = () => {
    const filteredRegs = selectedCompId === 'all'
      ? regs
      : regs.filter(r => r.competition_id === selectedCompId);

    if (filteredRegs.length === 0) {
      alert('No data to export!');
      return;
    }

    const headers = [
      'Participant Name',
      'Participant Email',
      'Competition Title',
      'Format',
      'Team Name',
      'Submitted Details',
      'Submission URL',
      'Registered At'
    ];

    const rows = filteredRegs.map(reg => {
      const details = Object.entries(reg.form_data || {})
        .map(([k, v]) => `${k.replace('_', ' ').toUpperCase()}: ${v}`)
        .join(' | ');

      const compTitle = reg.competitions?.title || '';
      const format = reg.team_name ? 'Team' : 'Solo';
      const teamName = reg.team_name || 'N/A';
      const submissionUrl = reg.submission_url || 'No File';
      const registeredAt = new Date(reg.created_at).toLocaleString();

      return [
        reg.profiles?.full_name || '',
        reg.profiles?.email || '',
        compTitle,
        format,
        teamName,
        details,
        submissionUrl,
        registeredAt
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const activeComp = comps.find(c => c.id === selectedCompId);
    const filename = activeComp
      ? `${activeComp.title.replace(/[^a-zA-Z0-9]/g, '_')}_Participants.csv`
      : 'All_Enrolled_Participants.csv';

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-8 h-8 text-amber-500" /> Admin Console
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Organize competition segments, manage team rosters, custom form fields, and declare winners.
          </p>
        </div>
        <Link
          to="/admin/create"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-indigo-500/10 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Challenge
        </Link>
      </div>

      {/* Admin stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h4 className="text-xs text-slate-500 font-bold uppercase tracking-wider">Challenges Managed</h4>
          <p className="text-2xl font-black mt-1 text-slate-900 dark:text-white">{stats.totalComps}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h4 className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Enrollments</h4>
          <p className="text-2xl font-black mt-1 text-slate-900 dark:text-white">{stats.totalParticipants}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h4 className="text-xs text-slate-500 font-bold uppercase tracking-wider">Submitted Project Reports</h4>
          <p className="text-2xl font-black mt-1 text-slate-900 dark:text-white">{stats.totalSubmissions}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('comps')}
          className={`pb-4 border-b-2 transition-all ${
            activeTab === 'comps'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Challenges
        </button>
        <button
          onClick={() => setActiveTab('regs')}
          className={`pb-4 border-b-2 transition-all ${
            activeTab === 'regs'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Enrolled Participants
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-4 border-b-2 transition-all ${
            activeTab === 'leaderboard'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Leaderboard & Stats
        </button>
      </div>

      {/* Tab: Competitions */}
      {activeTab === 'comps' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-850 text-xs font-bold text-slate-500 dark:text-slate-404 uppercase tracking-wider">
                  <th className="py-4 px-6">Challenge Title</th>
                  <th className="py-4 px-6 text-center">Format</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-center">Deadline</th>
                  <th className="py-4 px-6 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-sm font-semibold">
                {comps.map(comp => (
                  <tr key={comp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                    <td className="py-4 px-6 text-slate-900 dark:text-white">
                      <p className="font-extrabold">{comp.title}</p>
                    </td>
                    <td className="py-4 px-6 text-center text-slate-500 dark:text-slate-400 capitalize">
                      {comp.type === 'team' ? `Team (Max ${comp.max_team_size})` : 'Solo'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <select
                        value={comp.status}
                        onChange={(e) => handleUpdateStatus(comp.id, e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-center text-slate-500 dark:text-slate-400">
                      {new Date(comp.deadline).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right pr-6 space-x-2">
                      <Link
                        to={`/admin/edit/${comp.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-500/20 text-xs font-bold border border-indigo-500/15"
                        title="Edit Challenge"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </Link>
                      <Link
                        to={`/admin/results/${comp.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-500/20 text-xs font-bold border border-amber-500/15"
                      >
                        <Trophy className="w-3.5 h-3.5" /> Winners
                      </Link>
                      <button
                        onClick={() => handleDeleteComp(comp.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 rounded-lg transition-colors inline-flex items-center"
                        title="Delete Challenge"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Registrations */}
      {activeTab === 'regs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/50">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Filter by Segment:</span>
              <select
                value={selectedCompId}
                onChange={(e) => setSelectedCompId(e.target.value)}
                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 text-slate-705 dark:text-slate-200 outline-none"
              >
                <option value="all">All Segment Challenges</option>
                {comps.map(comp => (
                  <option key={comp.id} value={comp.id}>{comp.title}</option>
                ))}
              </select>
              <span className="text-xs font-semibold text-slate-400">
                ({selectedCompId === 'all' ? regs.length : regs.filter(r => r.competition_id === selectedCompId).length} registrations found)
              </span>
            </div>
            
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-705 text-white text-xs font-extrabold rounded-xl shadow-sm hover:shadow-emerald-500/10 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export CSV / Excel
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Participant</th>
                    <th className="py-4 px-6">Competition</th>
                    <th className="py-4 px-6">Team Name</th>
                    <th className="py-4 px-6">Submit Details</th>
                    <th className="py-4 px-6 text-right pr-6">Report File</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-semibold">
                  {(selectedCompId === 'all'
                    ? regs
                    : regs.filter(r => r.competition_id === selectedCompId)
                  ).map(reg => (
                    <tr key={reg.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-extrabold text-slate-900 dark:text-white">{reg.profiles?.full_name}</p>
                        <p className="text-[10px] text-slate-500">{reg.profiles?.email}</p>
                      </td>
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-300">
                        {reg.competitions?.title}
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {reg.team_name || 'Solo'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-0.5 max-w-[200px] text-[10px] text-slate-500 leading-normal">
                          {Object.entries(reg.form_data || {}).map(([key, val]) => (
                            <p key={key} className="truncate">
                              <span className="font-bold text-slate-700 dark:text-slate-405 capitalize">{key.replace('_',' ')}:</span> {String(val)}
                            </p>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right pr-6">
                        {reg.submission_url ? (
                          <a
                            href={reg.submission_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold"
                          >
                            <FileText className="w-4 h-4" /> View PDF
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">No File</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Leaderboard & Stats */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/50">
            <div className="w-full sm:max-w-xs relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={leaderboardSearch}
                onChange={(e) => setLeaderboardSearch(e.target.value)}
                placeholder="Search competitors by name or email..."
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Total Ranked Competitors: {leaderboard.length}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-404 uppercase tracking-wider">
                    <th className="py-4 px-6 text-center w-16">Rank</th>
                    <th className="py-4 px-6">Competitor (Click to view history)</th>
                    <th className="py-4 px-6 text-center w-32">Participations</th>
                    <th className="py-4 px-6 text-center w-24">Wins</th>
                    <th className="py-4 px-6 text-right pr-8 w-32">Total Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-semibold">
                  {leaderboard.filter(user => 
                    user.name.toLowerCase().includes(leaderboardSearch.toLowerCase()) ||
                    user.email.toLowerCase().includes(leaderboardSearch.toLowerCase())
                  ).length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-404 italic">
                        No competitors found matching your search.
                      </td>
                    </tr>
                  ) : (
                    leaderboard.filter(user => 
                      user.name.toLowerCase().includes(leaderboardSearch.toLowerCase()) ||
                      user.email.toLowerCase().includes(leaderboardSearch.toLowerCase())
                    ).map((user, idx) => {
                      const rank = idx + 1;
                      return (
                        <tr
                          key={user.id}
                          onClick={() => setSelectedUser(user)}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors cursor-pointer"
                        >
                          <td className="py-4 px-6 text-center font-bold">
                            {rank === 1 ? (
                              <span className="inline-flex w-6 h-6 rounded-full bg-amber-100 text-amber-700 items-center justify-center font-black shadow-sm">
                                🏆
                              </span>
                            ) : rank === 2 ? (
                              <span className="inline-flex w-6 h-6 rounded-full bg-slate-100 text-slate-700 items-center justify-center font-black shadow-sm">
                                🥈
                              </span>
                            ) : rank === 3 ? (
                              <span className="inline-flex w-6 h-6 rounded-full bg-amber-100 text-amber-700 items-center justify-center font-black shadow-sm">
                                🥉
                              </span>
                            ) : (
                              <span className="text-slate-500">{rank}</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border" />
                              ) : (
                                <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-[10px] uppercase">
                                  {user.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <p className="font-extrabold text-slate-900 dark:text-white leading-tight">{user.name}</p>
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center text-slate-500">{user.participations}</td>
                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <Award className="w-3 h-3" /> {user.wins}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right pr-8 font-black text-indigo-600 dark:text-indigo-400 text-sm">
                            {user.points} <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider ml-0.5">pts</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Competitor History Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar} alt={selectedUser.name} className="w-12 h-12 rounded-full border border-indigo-100" />
                ) : (
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-lg uppercase">
                    {selectedUser.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{selectedUser.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Points</span>
                  <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{selectedUser.points}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Joined</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-200">{selectedUser.participations}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Wins</span>
                  <span className="text-xl font-black text-emerald-600">{selectedUser.wins}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Challenge Participation History</h4>
                
                {selectedUser.history.length === 0 ? (
                  <p className="text-xs text-slate-450 italic">No registrations found for this user.</p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedUser.history.map((hist, index) => {
                      const isWin = hist.status === 'winner' || hist.status === 'runner_up';
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800/80 rounded-xl"
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{hist.compTitle}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 capitalize">Status: {hist.status.replace('_', ' ')}</p>
                          </div>
                          {isWin ? (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                              <Award className="w-3.5 h-3.5" /> Winner (Rank {hist.placement})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                              Participant
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-850 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
