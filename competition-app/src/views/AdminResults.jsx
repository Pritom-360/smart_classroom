import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import {
  Trophy,
  Award,
  Medal,
  ArrowLeft,
  Check,
  Trash2,
  Search,
  Filter,
  Users,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  RotateCcw,
  SlidersHorizontal,
  Eye,
  UserCheck,
  ShieldAlert
} from 'lucide-react';

export default function AdminResults() {
  const { id } = useParams();
  const [comp, setComp] = useState(null);
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, submitted, ranked, unranked, pending
  const [sortBy, setSortBy] = useState('default'); // default, placement, name_asc, newest, oldest

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal Detail State
  const [activeInspectReg, setActiveInspectReg] = useState(null);

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
              avatar_url
            )
          `)
          .eq('competition_id', id)
          .order('created_at', { ascending: false });

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

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const getRanks = useMemo(() => {
    if (comp && comp.ranking_structure && Array.isArray(comp.ranking_structure) && comp.ranking_structure.length > 0) {
      return comp.ranking_structure;
    }
    return [
      { placement: 1, title: 'Champion', points: 100 },
      { placement: 2, title: '1st Runner Up', points: 60 },
      { placement: 3, title: '2nd Runner Up', points: 40 }
    ];
  }, [comp]);

  const declareWinner = async (regId, placement) => {
    setUpdatingId(regId);
    try {
      const targetPlacement = Number(placement);
      const rankObj = getRanks.find(r => r.placement === targetPlacement);
      const statusMap = targetPlacement === 1 ? 'winner' : 'runner_up';

      // Clean up previous registration with same placement in this competition in database
      const { error: resetErr } = await supabase
        .from('registrations')
        .update({
          status: 'submitted',
          placement: null
        })
        .eq('competition_id', id)
        .eq('placement', targetPlacement);

      if (resetErr) throw resetErr;

      // Update targeted registration
      const { error: updateErr } = await supabase
        .from('registrations')
        .update({
          status: statusMap,
          placement: targetPlacement
        })
        .eq('id', regId);

      if (updateErr) throw updateErr;

      // Update local state
      setRegs(prev => prev.map(r => {
        if (r.id === regId) {
          return { ...r, status: statusMap, placement: targetPlacement };
        }
        // If another reg had the same placement, reset it
        if (r.placement === targetPlacement && r.id !== regId) {
          return { ...r, status: 'submitted', placement: null };
        }
        return r;
      }));

      showToast(`Assigned ${rankObj?.title || `Rank #${targetPlacement}`} successfully!`);

    } catch (err) {
      showToast(err.message || 'Failed to update result.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const resetResult = async (regId) => {
    setUpdatingId(regId);
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
      showToast('Rank removed successfully.');
    } catch (err) {
      showToast(err.message || 'Failed to reset result.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Metrics calculations
  const totalCount = regs.length;
  const submittedCount = regs.filter(r => Boolean(r.submission_url)).length;
  const rankedCount = regs.filter(r => r.placement != null).length;
  const unrankedCount = totalCount - rankedCount;
  const pendingCount = totalCount - submittedCount;

  // Filtered and Sorted Registrations
  const filteredRegs = useMemo(() => {
    return regs.filter(reg => {
      // Status filter
      if (statusFilter === 'submitted' && !reg.submission_url) return false;
      if (statusFilter === 'ranked' && reg.placement == null) return false;
      if (statusFilter === 'unranked' && reg.placement != null) return false;
      if (statusFilter === 'pending' && Boolean(reg.submission_url)) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const teamName = (reg.team_name || '').toLowerCase();
        const leaderName = (reg.profiles?.full_name || '').toLowerCase();
        const memberNames = Array.isArray(reg.team_members)
          ? reg.team_members.map(m => (m.name || '') + ' ' + (m.email || '')).join(' ').toLowerCase()
          : '';

        if (!teamName.includes(q) && !leaderName.includes(q) && !memberNames.includes(q)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'placement') {
        if (a.placement != null && b.placement != null) return a.placement - b.placement;
        if (a.placement != null) return -1;
        if (b.placement != null) return 1;
        return 0;
      }
      if (sortBy === 'name_asc') {
        const nameA = comp?.type === 'team' ? (a.team_name || '') : (a.profiles?.full_name || '');
        const nameB = comp?.type === 'team' ? (b.team_name || '') : (b.profiles?.full_name || '');
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'newest') {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }
      // Default: Ranked first, then by placement, then newest
      if (a.placement != null && b.placement != null) return a.placement - b.placement;
      if (a.placement != null) return -1;
      if (b.placement != null) return 1;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [regs, statusFilter, searchQuery, sortBy, comp]);

  // Pagination calculation
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(filteredRegs.length / (typeof pageSize === 'number' ? pageSize : 10)));
  const paginatedRegs = useMemo(() => {
    if (pageSize === 'all') return filteredRegs;
    const start = (currentPage - 1) * pageSize;
    return filteredRegs.slice(start, start + pageSize);
  }, [filteredRegs, currentPage, pageSize]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 200, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-400">Loading challenge entries...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-bold animate-in fade-in slide-in-from-bottom-4 duration-200 ${
          toastMessage.type === 'error'
            ? 'bg-red-500 text-white border-red-600 shadow-red-500/20'
            : 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-600/20'
        }`}>
          {toastMessage.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="space-y-1.5">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Console
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Declare Challenge Results
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              {comp?.type === 'team' ? '👥 Team Challenge' : '👤 Solo Challenge'}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              comp?.status === 'completed'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
            }`}>
              ● {comp?.status || 'Active'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Review submitted project PDF files, dynamic registration responses, and assign final standings for <strong className="text-slate-800 dark:text-slate-200">{comp?.title}</strong>.
          </p>
        </div>

        <Link
          to={`/${id}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm transition-all shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5 text-indigo-600" /> Public Challenge Page
        </Link>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Enrolled</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{totalCount}</p>
          <p className="text-[11px] text-slate-400 font-medium">Registered participants & teams</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Reports Submitted</span>
            <FileText className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {submittedCount} <span className="text-xs text-slate-400 font-normal">({totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0}%)</span>
          </p>
          <p className="text-[11px] text-slate-400 font-medium">{pendingCount} pending submission</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Ranks Assigned</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-500">
            {rankedCount} <span className="text-xs text-slate-400 font-normal">/ {getRanks.length} Ranks</span>
          </p>
          <p className="text-[11px] text-slate-400 font-medium">
            {getRanks.length - rankedCount > 0 ? `${getRanks.length - rankedCount} ranks remaining` : 'All ranks declared!'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Unranked Pool</span>
            <Medal className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-700 dark:text-slate-300">{unrankedCount}</p>
          <p className="text-[11px] text-slate-400 font-medium">Available to be awarded</p>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sticky Sidebar: Ranking Structure & Current Winners */}
        <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h2 className="font-extrabold text-base text-slate-900 dark:text-white">Rankings Standings</h2>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {rankedCount}/{getRanks.length}
              </span>
            </div>

            {/* Rank Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getRanks.length > 0 ? (rankedCount / getRanks.length) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 text-right font-medium">
                {Math.round(getRanks.length > 0 ? (rankedCount / getRanks.length) * 100 : 0)}% completed
              </p>
            </div>

            {/* Scrollable Rank Slot List */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {getRanks.map((rank) => {
                const winner = regs.find(r => r.placement === rank.placement);
                const isChampion = rank.placement === 1;
                const isRunnerUp = rank.placement === 2 || rank.placement === 3;

                return (
                  <div
                    key={rank.placement}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      winner
                        ? isChampion
                          ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/50 shadow-sm'
                          : 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/50'
                        : 'bg-slate-50/70 dark:bg-slate-950/30 border-slate-200/80 dark:border-slate-800/60 border-dashed'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        winner
                          ? isChampion
                            ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                            : isRunnerUp
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-700 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {rank.placement}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 truncate">
                            {rank.title}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-500">
                            +{rank.points} pts
                          </span>
                        </div>
                        <p className={`text-xs font-bold truncate mt-0.5 ${
                          winner ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 italic'
                        }`}>
                          {winner
                            ? (comp?.type === 'team' ? winner.team_name : winner.profiles?.full_name || 'Participant')
                            : 'Not Declared'}
                        </p>
                      </div>
                    </div>

                    {winner && (
                      <button
                        disabled={updatingId === winner.id}
                        onClick={() => resetResult(winner.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Unassign rank"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                💡 Tip for Organizers:
              </p>
              <p>
                Selecting a rank on any participant card automatically updates the global leaderboard and certificate verification records.
              </p>
            </div>
          </div>
        </aside>

        {/* Right Section: Search, Filters, Participants List & Pagination */}
        <main className="lg:col-span-8 space-y-6">
          
          {/* Search and Filters Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
            
            {/* Search and Sort Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search by participant name, team name, or member..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-8 py-2.5 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200 cursor-pointer"
                >
                  <option value="default">Sort: Default (Ranked First)</option>
                  <option value="placement">Sort: Placement (1st &rarr; Last)</option>
                  <option value="name_asc">Sort: Name (A &rarr; Z)</option>
                  <option value="newest">Sort: Newest First</option>
                  <option value="oldest">Sort: Oldest First</option>
                </select>

                <select
                  value={pageSize}
                  onChange={(e) => {
                    const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                    setPageSize(val);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200 cursor-pointer"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value="all">Show All</option>
                </select>
              </div>
            </div>

            {/* Quick Status Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filter:
              </span>
              {[
                { id: 'all', label: 'All', count: totalCount },
                { id: 'submitted', label: 'Report Submitted', count: submittedCount },
                { id: 'ranked', label: 'Ranked / Winners', count: rankedCount },
                { id: 'unranked', label: 'Unranked', count: unrankedCount },
                { id: 'pending', label: 'Pending Report', count: pendingCount }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => {
                    setStatusFilter(f.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    statusFilter === f.id
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    statusFilter === f.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Results Counter Summary */}
          <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>
              Showing {filteredRegs.length === 0 ? 0 : (currentPage - 1) * (typeof pageSize === 'number' ? pageSize : filteredRegs.length) + 1} -{' '}
              {pageSize === 'all' ? filteredRegs.length : Math.min(currentPage * pageSize, filteredRegs.length)} of {filteredRegs.length} matching participants
            </span>
            {(searchQuery || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset Filters
              </button>
            )}
          </div>

          {/* Participant Cards List */}
          {filteredRegs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">No matching participants found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
                Try searching with a different term or clearing the active filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all inline-block"
              >
                View All Participants
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedRegs.map((reg) => {
                const isRanked = reg.placement != null;
                const assignedRankObj = getRanks.find(r => r.placement === reg.placement);
                const isChampion = reg.placement === 1;

                return (
                  <div
                    key={reg.id}
                    className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 sm:p-6 shadow-sm transition-all duration-200 space-y-4 ${
                      isRanked
                        ? isChampion
                          ? 'border-amber-300 dark:border-amber-600/50 ring-1 ring-amber-400/20'
                          : 'border-indigo-300 dark:border-indigo-600/40 ring-1 ring-indigo-400/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Top Row: Participant / Team Header + Status Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                          isRanked
                            ? isChampion
                              ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md shadow-amber-500/20'
                              : 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-md shadow-indigo-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          {isRanked ? (
                            `#${reg.placement}`
                          ) : comp?.type === 'team' ? (
                            <Users className="w-5 h-5" />
                          ) : (
                            reg.profiles?.full_name?.charAt(0)?.toUpperCase() || 'P'
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                              {comp?.type === 'team' ? reg.team_name : reg.profiles?.full_name}
                            </h3>
                            {isRanked && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                🏆 {assignedRankObj?.title || `Rank #${reg.placement}`} (+{assignedRankObj?.points || 0} pts)
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                            {comp?.type === 'team' ? (
                              <>Lead: <strong className="text-slate-700 dark:text-slate-300">{reg.profiles?.full_name}</strong></>
                            ) : (
                              reg.profiles?.full_name || 'Participant'
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Submission Status Pill */}
                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                        {reg.submission_url ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Report Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                            <Clock className="w-3.5 h-3.5" /> No Report Yet
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Team Members (if team) & Project PDF Link */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {comp?.type === 'team' && reg.team_members && Array.isArray(reg.team_members) && reg.team_members.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Team Roster ({reg.team_members.length + 1} members):</span>
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                              👑 {reg.profiles?.full_name} (Lead)
                            </span>
                            {reg.team_members.map((m, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                {m.name || `Member #${idx + 2}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 flex-wrap self-center">
                        {reg.submission_url ? (
                          <a
                            href={reg.submission_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold border border-indigo-200 dark:border-indigo-800/60 transition-all shadow-sm"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            <span>View Submitted PDF Report</span>
                            <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No report file uploaded.</span>
                        )}

                        <button
                          onClick={() => setActiveInspectReg(reg)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold hover:underline cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect Answers
                        </button>
                      </div>
                    </div>

                    {/* Bottom Action Bar: Sleek Dropdown & Quick Assign Controls */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-2xl">
                      
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                          {isRanked ? 'Award Action:' : 'Assign Winner Placement:'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {isRanked ? (
                          <>
                            {/* Dropdown to change rank */}
                            <select
                              disabled={updatingId === reg.id}
                              value={reg.placement}
                              onChange={(e) => declareWinner(reg.id, e.target.value)}
                              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
                            >
                              {getRanks.map(rank => {
                                const currentOccupant = regs.find(r => r.placement === rank.placement && r.id !== reg.id);
                                return (
                                  <option key={rank.placement} value={rank.placement}>
                                    #{rank.placement} {rank.title} ({rank.points} pts) {currentOccupant ? `[replaces ${comp?.type === 'team' ? currentOccupant.team_name : currentOccupant.profiles?.full_name}]` : ''}
                                  </option>
                                );
                              })}
                            </select>

                            <button
                              disabled={updatingId === reg.id}
                              onClick={() => resetResult(reg.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-extrabold border border-red-200 dark:border-red-900/40 transition-all cursor-pointer shadow-sm"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Remove Rank
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Clean Dropdown Selector for All Available Ranks */}
                            <select
                              disabled={updatingId === reg.id}
                              defaultValue=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  declareWinner(reg.id, e.target.value);
                                }
                              }}
                              className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/80 hover:border-indigo-500 rounded-xl px-3.5 py-1.5 text-xs font-extrabold text-indigo-700 dark:text-indigo-300 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
                            >
                              <option value="" disabled>🏆 Select Placement to Award ▼</option>
                              {getRanks.map(rank => {
                                const currentOccupant = regs.find(r => r.placement === rank.placement);
                                return (
                                  <option key={rank.placement} value={rank.placement}>
                                    #{rank.placement} {rank.title} (+{rank.points} pts) {currentOccupant ? `[⚠️ assigned to: ${comp?.type === 'team' ? currentOccupant.team_name : currentOccupant.profiles?.full_name}]` : '✨ Available'}
                                  </option>
                                );
                              })}
                            </select>

                            {/* Quick Top-3 Buttons for Super-Fast 1-Click Awarding */}
                            <div className="hidden sm:flex items-center gap-1">
                              {getRanks.slice(0, 3).map((rank) => {
                                const isTaken = regs.some(r => r.placement === rank.placement);
                                return (
                                  <button
                                    key={rank.placement}
                                    disabled={updatingId === reg.id}
                                    onClick={() => declareWinner(reg.id, rank.placement)}
                                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                                      rank.placement === 1
                                        ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                        : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                                    }`}
                                    title={isTaken ? `Assign ${rank.title} (will replace current occupant)` : `Assign ${rank.title}`}
                                  >
                                    {rank.placement === 1 ? '🥇' : rank.placement === 2 ? '🥈' : '🥉'} {rank.title}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {pageSize !== 'all' && totalPages > 1 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Page {currentPage} of {totalPages}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="text-xs text-slate-400 px-1 font-bold">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(p)}
                        className={`w-8 h-8 rounded-xl text-xs font-extrabold transition-all ${
                          currentPage === p
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                            : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Inspect Registration Details Modal */}
      {activeInspectReg && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setActiveInspectReg(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                Entry Inspection
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {comp?.type === 'team' ? activeInspectReg.team_name : activeInspectReg.profiles?.full_name}
              </h2>
              <p className="text-xs text-slate-400">
                Enrolled on {new Date(activeInspectReg.created_at).toLocaleString()}
              </p>
            </div>

            {/* Profile & Contact Details */}
            <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 space-y-2 text-xs">
              <h4 className="font-extrabold uppercase tracking-wider text-slate-500">Leader / Participant Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                <p><strong>Name:</strong> {activeInspectReg.profiles?.full_name}</p>
              </div>
            </div>

            {/* Team Members List */}
            {comp?.type === 'team' && activeInspectReg.team_members && Array.isArray(activeInspectReg.team_members) && activeInspectReg.team_members.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Team Members</h4>
                <div className="space-y-1.5">
                  {activeInspectReg.team_members.map((m, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">#{idx + 2}: {m.name || 'Unnamed'}</span>
                      <span className="text-slate-500">{m.email || 'No email'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Custom Form Answers */}
            {activeInspectReg.form_data && typeof activeInspectReg.form_data === 'object' && Object.keys(activeInspectReg.form_data).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Custom Form Answers</h4>
                <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 space-y-2 text-xs">
                  {Object.entries(activeInspectReg.form_data).map(([k, v]) => (
                    <div key={k} className="border-b border-slate-200/40 dark:border-slate-800/40 pb-1.5 last:border-b-0 last:pb-0">
                      <span className="font-extrabold text-slate-500 capitalize">{k.replace(/_/g, ' ')}: </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 break-words">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submission File */}
            <div className="pt-2">
              {activeInspectReg.submission_url ? (
                <a
                  href={activeInspectReg.submission_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all"
                >
                  <FileText className="w-4 h-4" /> Open Submitted PDF Document <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-2xl text-xs font-bold text-center border border-amber-200 dark:border-amber-800">
                  No project PDF submission uploaded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
