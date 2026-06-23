import React from 'react';
import { Trophy } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-205 dark:border-slate-800 transition-colors duration-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand */}
          <div className="space-y-4 col-span-1 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                <Trophy className="w-4.5 h-4.5" />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">Smart Classroom</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Empowering students and researchers with high-fidelity simulators, expert courses, and dynamic competition segments.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://www.facebook.com/profile.php?id=61576756049338" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 transition-all" aria-label="Facebook">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                </svg>
              </a>
              <a href="https://www.linkedin.com/in/arup-bhowmik-pritom-a7a7a23a4/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-655 dark:hover:text-indigo-400 transition-all" aria-label="LinkedIn">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a href="https://www.youtube.com/@CodeWithPritom-360" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-655 dark:hover:text-indigo-400 transition-all" aria-label="YouTube">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.163c-.272-1.216-1.14-2.197-2.3-2.472-2.046-.541-10.232-.541-10.232-.541s-8.186 0-10.232.541c-1.16.275-2.028 1.256-2.3 2.472-.54 2.052-.54 6.337-.54 6.337s0 4.285.54 6.337c.272 1.216 1.14 2.197 2.3 2.472 2.046.541 10.232.541 10.232.541s8.186 0 10.232-.541c1.16-.275 2.028-1.256 2.3-2.472.54-2.052.54-6.337.54-6.337s0-4.285-.54-6.337zm-14.498 9.337v-7l6.5 3.5-6.5 3.5z"/>
                </svg>
              </a>
              <a href="https://github.com/CodeWithPritom" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-655 dark:hover:text-indigo-400 transition-all" aria-label="GitHub">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v-3.293c0-.319.192-.694.801-.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm font-semibold text-slate-650 dark:text-slate-350">
              <li><a href="https://www.catalyst-smart-classroom.me/index.html" className="hover:text-indigo-655 dark:hover:text-indigo-400 transition-colors">Home</a></li>
              <li><a href="https://www.catalyst-smart-classroom.me/subjects.html" className="hover:text-indigo-655 dark:hover:text-indigo-400 transition-colors">Subjects</a></li>
              <li><a href="https://www.catalyst-smart-classroom.me/simulators.html" className="hover:text-indigo-655 dark:hover:text-indigo-400 transition-colors">Simulators</a></li>
              <li><a href="https://www.catalyst-smart-classroom.me/about.html" className="hover:text-indigo-655 dark:hover:text-indigo-400 transition-colors">About Us</a></li>
            </ul>
          </div>

          {/* Ecosystem */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Ecosystem</h4>
            <ul className="space-y-2 text-sm font-semibold text-slate-650 dark:text-slate-350">
              <li><a href="https://scholarhub-ai.me" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-655 dark:hover:text-indigo-400 transition-colors">ScholarHub AI</a></li>
              <li><a href="https://ewu-studentsdesk.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-655 dark:hover:text-indigo-400 transition-colors">EWU Student Desk</a></li>
            </ul>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
          &copy; {new Date().getFullYear()} Smart Classroom by Arup Bhowmik Pritom. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
