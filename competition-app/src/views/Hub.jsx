import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, Users, Award, ShieldAlert, ChevronRight, Mail } from 'lucide-react';
import useDocumentMetadata from '../hooks/useDocumentMetadata';

export default function Hub() {
  useDocumentMetadata({
    title: 'Competition Hub - Robotics & Research Challenges',
    description: 'Participate in university level research and autonomous robotics competitions. Generate your digital badge, register teams, and win prize awards.',
    canonicalUrl: 'https://www.catalyst-smart-classroom.me/competition.html',
    ogImage: 'https://www.catalyst-smart-classroom.me/assets/icon/iconi.png'
  });

  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showArrangeModal, setShowArrangeModal] = useState(false);

  useEffect(() => {
    async function fetchCompetitions() {
      try {
        const { data, error } = await supabase
          .from('competitions')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCompetitions(data || []);
      } catch (err) {
        console.error('Error fetching competitions:', err.message);
        setCompetitions([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCompetitions();
  }, []);

  const activeComps = competitions.filter(c => c.status === 'active');
  const completedComps = competitions.filter(c => c.status === 'completed');

  // Aggregate unique sponsors across all competitions
  const allSponsorsMap = {};
  competitions.forEach(c => {
    if (c.sponsors && Array.isArray(c.sponsors)) {
      c.sponsors.forEach(s => {
        if (s && s.name) {
          allSponsorsMap[s.name.toLowerCase()] = s;
        }
      });
    }
  });
  const uniqueSponsors = Object.values(allSponsorsMap);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-700 py-20 px-4 sm:px-6 lg:px-8 text-center text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8 mt-6 shadow-xl shadow-indigo-600/10">
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5" /> Competition Hub
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Catalyst Challenges
          </h1>
          <p className="text-lg text-indigo-100 leading-relaxed font-medium">
            Explore active research & robotics challenges. Build your digital participant card, form team alliances, and upload submissions.
          </p>
          {uniqueSponsors.length > 0 && (
            <p className="text-xs text-indigo-200/90 font-semibold tracking-wider uppercase">
              ⚡ Supported by {uniqueSponsors.length} leading academic & industry sponsors
            </p>
          )}
          <div className="pt-4 flex justify-center">
            <button
              onClick={() => setShowArrangeModal(true)}
              className="px-5 py-2.5 bg-white text-indigo-650 hover:bg-slate-50 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 font-extrabold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700"
            >
              🤝 Want to arrange competition? Please contact with Founder
            </button>
          </div>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none"></div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-16">
        {/* Active Challenges */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-7 bg-indigo-600 rounded-full"></div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Active Challenges</h2>
          </div>
          {activeComps.length === 0 ? (
            <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
              <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-500 dark:text-slate-400 font-semibold">No active competitions currently running.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeComps.map(comp => (
                <Link
                  key={comp.id}
                  to={`/competition/${comp.id}`}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 shadow-md hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider rounded-md">
                        ● Active
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <Users className="w-3.5 h-3.5" />
                        {comp.type === 'team' ? 'Team (Max ' + (comp.max_team_size || 4) + ')' : 'Solo'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {comp.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                      {comp.description}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Calendar className="w-4 h-4" />
                      Ends {new Date(comp.deadline).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      View Details & Participate <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Previous Challenges (Hall of Fame) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-7 bg-amber-500 rounded-full"></div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Hall of Fame — Completed Challenges</h2>
          </div>
          {completedComps.length === 0 ? (
            <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
              <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-500 dark:text-slate-400 font-semibold">No previous challenges recorded.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {completedComps.map(comp => (
                <Link
                  key={comp.id}
                  to={`/competition/${comp.id}`}
                  className="group bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-amber-500 hover:ring-1 hover:ring-amber-500 opacity-80 hover:opacity-100 shadow-sm transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded">
                        <Award className="w-3 h-3" /> Completed
                      </span>
                    </div>
                    <h3 className="text-base font-bold group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {comp.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {comp.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span>Ended {new Date(comp.deadline).toLocaleDateString()}</span>
                    <span>View Winners & Rules &rarr;</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Sponsors & Partners Section */}
        <section className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-900/10 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 text-center space-y-8">
          <div className="max-w-2xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider rounded-full">
              Sponsors & Partners
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Empowered By Industry Leaders
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Proudly collaborating with {uniqueSponsors.length > 0 ? (
                <>
                  <strong className="text-indigo-600 dark:text-indigo-400">{uniqueSponsors.length}</strong> top-tier organizations
                </>
              ) : (
                "top-tier organizations"
              )} to provide world-class mentoring, platforms, and prize pools.
            </p>
          </div>

          {uniqueSponsors.length >= 4 ? (
            <div className="relative overflow-hidden w-full py-4">
              {/* Fade overlays on the sides */}
              <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-slate-50 dark:from-slate-950 to-transparent pointer-events-none z-10" />
              <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent pointer-events-none z-10" />
              
              <div className="flex gap-6 animate-marquee whitespace-nowrap">
                {/* Render multiple sets to ensure seamless infinite looping */}
                {[...uniqueSponsors, ...uniqueSponsors, ...uniqueSponsors].map((sp, idx) => (
                  <div key={idx} className="inline-block w-56 sm:w-72 shrink-0">
                    {sp.website_url ? (
                      <a
                        href={sp.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-500/50 transition-all duration-300 h-28"
                      >
                        {sp.logo_url ? (
                          <img
                            src={sp.logo_url}
                            alt={sp.name}
                            className="max-h-24 w-auto max-w-[92%] object-contain dark:brightness-95 transition-all duration-300"
                          />
                        ) : (
                          <span className="font-black text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 text-sm tracking-wider uppercase">
                            {sp.name}
                          </span>
                        )}
                      </a>
                    ) : (
                      <div
                        className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm h-28 w-full"
                      >
                        {sp.logo_url ? (
                          <img
                            src={sp.logo_url}
                            alt={sp.name}
                            className="max-h-24 w-auto max-w-[92%] object-contain dark:brightness-95"
                          />
                        ) : (
                          <span className="font-black text-slate-800 dark:text-slate-200 text-sm tracking-wider uppercase">
                            {sp.name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Scoped CSS for hardware accelerated smooth marquee animation */}
              <style>{`
                @keyframes marqueeLoop {
                  0% { transform: translate3d(0, 0, 0); }
                  100% { transform: translate3d(-33.3333%, 0, 0); }
                }
                .animate-marquee {
                  display: flex;
                  width: max-content;
                  animation: marqueeLoop 20s linear infinite;
                }
                .animate-marquee:hover {
                  animation-play-state: paused;
                }
              `}</style>
            </div>
          ) : uniqueSponsors.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-6 py-4">
              {uniqueSponsors.map((sp, idx) => (
                <div key={idx} className="group relative w-56 sm:w-72 shrink-0">
                  {sp.website_url ? (
                    <a
                      href={sp.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-500/50 transition-all duration-300 h-28"
                    >
                      {sp.logo_url ? (
                        <img
                          src={sp.logo_url}
                          alt={sp.name}
                          className="max-h-24 w-auto max-w-[92%] object-contain dark:brightness-95 transition-all duration-300"
                        />
                      ) : (
                        <span className="font-black text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 text-sm tracking-wider uppercase">
                          {sp.name}
                        </span>
                      )}
                    </a>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm h-28 w-full"
                    >
                      {sp.logo_url ? (
                        <img
                          src={sp.logo_url}
                          alt={sp.name}
                          className="max-h-24 w-auto max-w-[92%] object-contain dark:brightness-95"
                        />
                      ) : (
                        <span className="font-black text-slate-800 dark:text-slate-200 text-sm tracking-wider uppercase">
                          {sp.name}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-md mx-auto p-6 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl shadow-sm">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                No active sponsors or collaborations configured yet. Admin can set up segment sponsors inside the Challenge Console to showcase them on the hub.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Arrange Competition Modal */}
      {showArrangeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowArrangeModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              aria-label="Close"
            >
              ✕
            </button>
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-950 dark:text-white">Arrange Competition</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                To arrange a competition, please get in touch with our founder directly.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <a
                href="https://wa.me/8801737697736"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.859-4.407 9.862-9.83.001-2.628-1.02-5.1-2.875-6.958C16.604 1.97 14.148 1.95 11.53 1.95c-5.438 0-9.863 4.41-9.866 9.833-.001 2.028.528 4.017 1.53 5.781l-.992 3.624 3.73-.978L6.647 19.15z"/>
                </svg>
                Chat on WhatsApp
              </a>
              <a
                href="mailto:pritombhowmik360@gmail.com?subject=Arrange%20Competition%20Inquiry"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Mail className="w-4.5 h-4.5" />
                Send Email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
