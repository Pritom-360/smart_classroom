import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Trophy, Award, ArrowLeft, Check, Trash2, HelpCircle } from 'lucide-react';

export default function AdminResults() {
  const { id } = useParams();
  const [comp, setComp] = useState(null);
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Competition details
        const { data: compData, error: compErr } = await supabase
          .from('competitions')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (compErr) throw compErr;
        setComp(compData);

        // Fetch submissions/registrations
        const { data: regsData, error: regsErr } = await supabase
          .from('registrations')
          .select(`
            *,
            profiles (
              full_name,
              email
            )
          `)
          .eq('competition_id', id);

        if (regsErr) throw regsErr;
        setRegs(regsData || []);

      } catch (err) {
        console.error('Error fetching data:', err.message);
        setError('Could not load participants list.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const getRanks = () => {
    if (comp && comp.ranking_structure && Array.isArray(comp.ranking_structure)) {
      return comp.ranking_structure;
    }
    return [
      { placement: 1, title: 'Champion', points: 100 },
      { placement: 2, title: '1st Runner Up', points: 60 },
      { placement: 3, title: '2nd Runner Up', points: 40 }
    ];
  };

  const declareWinner = async (regId, placement) => {
    setUpdating(true);
    try {
      const statusMap = placement === 1 ? 'winner' : 'runner_up';
      
      // Clean up previous registration with same placement in this competition in database
      const { error: resetErr } = await supabase
        .from('registrations')
        .update({
          status: 'submitted',
          placement: null
        })
        .eq('competition_id', id)
        .eq('placement', placement);

      if (resetErr) throw resetErr;

      // Update targeted registration
      const { error: updateErr } = await supabase
        .from('registrations')
        .update({
          status: statusMap,
          placement: placement
        })
        .eq('id', regId);

      if (updateErr) throw updateErr;

      // Update local state
      setRegs(prev => prev.map(r => {
        if (r.id === regId) {
          return { ...r, status: statusMap, placement };
        }
        // If another reg had the same placement, reset it
        if (r.placement === placement && r.id !== regId) {
          return { ...r, status: 'submitted', placement: null };
        }
        return r;
      }));

    } catch (err) {
      alert(err.message || 'Failed to update result.');
    } finally {
      setUpdating(false);
    }
  };

  const resetResult = async (regId) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('registrations')
        .update({
          status: 'submitted',
          placement: null
        })
        .eq('id', regId);

      if (error) throw error;
      setRegs(prev => prev.map(r => r.id === regId ? { ...r, status: 'submitted', placement: null } : r));
    } catch (err) {
      alert(err.message || 'Failed to reset result.');
    } finally {
      setUpdating(false);
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Console
      </Link>

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
          Declare Challenge Winners
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Select winner ranks for: <strong className="text-indigo-600 dark:text-indigo-400">{comp?.title}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Placements overview */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 self-start">
          <h3 className="font-extrabold text-base border-b border-slate-100 dark:border-slate-850 pb-3">Ranks Standings</h3>
          
          <div className="space-y-4">
            {getRanks().map((rank, index) => {
              const winner = regs.find(r => r.placement === rank.placement);
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold shrink-0">
                    {rank.placement}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs text-slate-500 font-bold uppercase truncate">{rank.title}</h4>
                    <p className="text-sm font-extrabold truncate">
                      {winner ? (comp.type === 'team' ? winner.team_name : winner.profiles?.full_name) : 'Not Declared'}
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold">{rank.points} points</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Entries Grid */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-extrabold text-base">Participants / Submissions</h3>

          {regs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 italic">No registrations for this competition yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {regs.map(reg => (
                <div key={reg.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-black truncate">
                        {comp.type === 'team' ? reg.team_name : reg.profiles?.full_name}
                      </h4>
                      {reg.placement && (
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          {getRanks().find(r => r.placement === reg.placement)?.title || `Rank ${reg.placement}`}
                        </span>
                      )}
                    </div>
                    {comp.type === 'team' && (
                      <p className="text-xs text-slate-500 font-semibold">Leader: {reg.profiles?.full_name} ({reg.profiles?.email})</p>
                    )}
                    {reg.submission_url ? (
                      <a
                        href={reg.submission_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-bold"
                      >
                        View Project PDF &rarr;
                      </a>
                    ) : (
                      <p className="text-xs text-slate-400 italic font-medium">No project report submitted yet.</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {reg.placement ? (
                      <button
                        disabled={updating}
                        onClick={() => resetResult(reg.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Reset
                      </button>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1">
                        {getRanks().map((rank, rIdx) => (
                          <button
                            key={rIdx}
                            disabled={updating}
                            onClick={() => declareWinner(reg.id, rank.placement)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-150 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 text-xs font-bold rounded-lg border border-indigo-500/15 cursor-pointer transition-all"
                            title={`Declare as ${rank.title}`}
                          >
                            {rank.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
