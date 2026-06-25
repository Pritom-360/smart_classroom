import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { Trophy, Award, Search, Sparkles } from 'lucide-react';
import useDocumentMetadata from '../hooks/useDocumentMetadata';

export default function GlobalLeaderboard() {
  useDocumentMetadata({
    title: 'Global Leaderboard - Catalyst Challenges',
    description: 'Track candidate scores and rankings based on completed academic research and robotics segments.',
    canonicalUrl: 'https://www.catalyst-smart-classroom.me/competition.html#/leaderboard'
  });

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function calculateScores() {
      try {
        setLoading(true);
        
        // 1. Fetch all user profiles for email matching
        const { data: allProfiles, error: profErr } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url');

        if (profErr) throw profErr;

        // 2. Fetch all registrations with profiles, competitions, and team members
        const { data: regs, error: regsErr } = await supabase
          .from('registrations')
          .select(`
            id,
            status,
            placement,
            user_id,
            team_name,
            profiles (
              full_name,
              avatar_url,
              email
            ),
            competitions (
              type,
              ranking_structure
            ),
            team_members (
              member_name,
              member_email
            )
          `);

        if (regsErr) throw regsErr;

        // Group by user and calculate scores
        const userScores = {};

        const addPoints = (userId, name, email, avatar, isWin, placementVal, compObj) => {
          if (!userId) return;
          if (!userScores[userId]) {
            userScores[userId] = {
              name: name || email?.split('@')[0] || 'Anonymous User',
              avatar: avatar || null,
              email: email || '',
              participations: 0,
              wins: 0,
              points: 0
            };
          }

          userScores[userId].participations += 1;
          userScores[userId].points += 10; // Basic participation pts

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

        regs.forEach(reg => {
          const isWin = reg.status === 'winner' || reg.status === 'runner_up';
          const placementVal = reg.placement;

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
                    reg.competitions
                  );
                }
              }
            });
          }
        });

        // Convert object to array, exclude email field for public privacy, and sort by points
        const sorted = Object.values(userScores)
          .map(({ email, ...rest }) => rest)
          .sort((a, b) => b.points - a.points);
        setLeaderboard(sorted);

      } catch (err) {
        console.error('Error calculating leaderboard:', err.message);
      } finally {
        setLoading(false);
      }
    }

    calculateScores();
  }, []);

  const filteredLeaderboard = leaderboard.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/10 text-amber-500 text-xs font-bold uppercase tracking-wider rounded-full">
          <Sparkles className="w-3 h-3" /> Hall of Achievements
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Global Leaderboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Rankings are calculated dynamically: Participation (+10 Pts), Champion (+100 Pts), 1st Runner Up (+60 Pts), and 2nd Runner Up (+40 Pts).
        </p>
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="w-full sm:max-w-xs relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search participants..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
        </div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest shrink-0">
          Total Competitors: {leaderboard.length}
        </div>
      </div>

      {/* Leaderboard list */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                <th className="px-6 py-4 text-center w-16">Rank</th>
                <th className="px-6 py-4">Competitor</th>
                <th className="px-6 py-4 text-center w-32">Participations</th>
                <th className="px-6 py-4 text-center w-24">Wins</th>
                <th className="px-6 py-4 text-right w-32 pr-8">Total Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-sm font-semibold">
              {filteredLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">
                    No competitors found matching your search.
                  </td>
                </tr>
              ) : (
                filteredLeaderboard.map((user, idx) => {
                  const rank = idx + 1;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors">
                      <td className="px-6 py-4 text-center font-bold">
                        {rank === 1 ? (
                          <span className="inline-flex w-7 h-7 rounded-full bg-amber-100 text-amber-700 items-center justify-center font-black shadow-sm">
                            🏆
                          </span>
                        ) : rank === 2 ? (
                          <span className="inline-flex w-7 h-7 rounded-full bg-slate-100 text-slate-700 items-center justify-center font-black shadow-sm">
                            🥈
                          </span>
                        ) : rank === 3 ? (
                          <span className="inline-flex w-7 h-7 rounded-full bg-amber-100 text-amber-700 items-center justify-center font-black shadow-sm">
                            🥉
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs font-bold">{rank}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border" />
                          ) : (
                            <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                              {user.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white leading-tight">{user.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-500 font-semibold">{user.participations}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full text-xs font-bold">
                          <Award className="w-3.5 h-3.5" /> {user.wins}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right pr-8 font-black text-indigo-600 dark:text-indigo-400 text-base">
                        {user.points} <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">pts</span>
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
  );
}
