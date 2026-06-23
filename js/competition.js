/**
 * Competition Hub - Vanilla JS SPA Logic
 * Multi-view: Hub → Details → Login/Register → Dashboard
 * Supabase integration for participants table + challenge-submissions storage
 */
const CompApp = (() => {
  // --- Supabase Config ---
  const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
  const SUPABASE_KEY = 'YOUR_ANON_KEY';
  let sb = null;
  try { if (window.supabase?.createClient) sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); } catch(e) {}

  // --- Competition Data (fetched from Supabase or fallback) ---
  const fallbackComps = [
    { id: 1, title: "Research Visionary Challenge 2026", description: "Submit a groundbreaking scientific proposal focusing on AI integration in modern classroom ecosystems. Compete with top minds.", rulebook: "1. Submission must be original research.\n2. PDF should not exceed 10 pages.\n3. Format: IEEE double-column.\n4. Plagiarism tolerance: 15%.\n5. Deadline: December 31, 2026.", prizes: "🥇 Grand Prize: $1,500 + Certificate\n🥈 Runner Up: $800 + Certificate\n🥉 Third Place: $400 + Certificate\n\nAll participants receive a digital badge.", status: "active" },
    { id: 2, title: "Autonomous Rover Design Challenge", description: "Design code for a simulation-based autonomous rover navigating dynamic terrain obstacles in real-time.", rulebook: "1. Code in Python or C++.\n2. Rover must complete track in under 5 min.\n3. Standard dimensional specs required.", prizes: "🥇 Winner: $1,200 + Medals\n🥈 Runner Up: $600", status: "active" },
    { id: 3, title: "EWU Robocup Season 2025", description: "Robocup tournament for autonomous football-playing micro rovers. Successfully concluded October 2025.", rulebook: "", prizes: "Concluded", status: "completed" },
    { id: 4, title: "Smart Classroom Hackathon 2024", description: "48-hour development marathon building interactive widgets for virtual science labs.", rulebook: "", prizes: "Concluded", status: "completed" }
  ];
  let competitions = [];
  let selectedComp = null;
  let currentUser = null;
  let selectedFile = null;

  // --- DOM Ready ---
  function init() {
    loadCompetitions();
    setupThemeToggle();
    setupLoginForm();
    setupRegisterForm();
    setupUpload();
    setupBadgeActions();
  }

  // --- View Management ---
  function showView(viewId) {
    document.querySelectorAll('.comp-view').forEach(v => v.classList.remove('active'));
    const el = document.getElementById('view-' + viewId);
    if (el) { el.classList.add('active'); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }

  // --- Load Competitions ---
  async function loadCompetitions() {
    try {
      if (sb) {
        const { data, error } = await sb.from('competitions').select('*').order('created_at', { ascending: false });
        if (!error && data?.length) { competitions = data; } else { competitions = fallbackComps; }
      } else { competitions = fallbackComps; }
    } catch(e) { competitions = fallbackComps; }
    renderHub();
  }

  function renderHub() {
    const activeBox = document.getElementById('active-competitions');
    const completedBox = document.getElementById('completed-competitions');
    if (!activeBox || !completedBox) return;

    const active = competitions.filter(c => c.status === 'active');
    const completed = competitions.filter(c => c.status === 'completed');

    activeBox.innerHTML = active.map(c => `
      <div class="comp-comp-card" onclick="CompApp.openDetails(${c.id})">
        <span class="card-status active"><i class="fas fa-bolt"></i> Active</span>
        <h3>${c.title}</h3>
        <p>${c.description}</p>
        <div class="card-cta">View Rulebook & Participate <i class="fas fa-chevron-right"></i></div>
      </div>
    `).join('') || '<p style="color:var(--c-muted)">No active challenges right now.</p>';

    completedBox.innerHTML = completed.map(c => `
      <div class="comp-comp-card completed-card" onclick="CompApp.openDetails(${c.id})">
        <span class="card-status completed"><i class="fas fa-award"></i> Completed</span>
        <h3>${c.title}</h3>
        <p>${c.description}</p>
      </div>
    `).join('') || '<p style="color:var(--c-muted)">No previous challenges yet.</p>';
  }

  // --- Detail View ---
  function openDetails(compId) {
    selectedComp = competitions.find(c => c.id === compId);
    if (!selectedComp) return;

    document.getElementById('detail-status').textContent = selectedComp.status === 'active' ? '● ACTIVE' : '● COMPLETED';
    document.getElementById('detail-status').className = 'comp-detail-status ' + (selectedComp.status === 'active' ? '' : 'completed');
    document.getElementById('detail-title').textContent = selectedComp.title;
    document.getElementById('detail-description').textContent = selectedComp.description;
    document.getElementById('detail-rulebook').textContent = selectedComp.rulebook || 'No rules published yet.';
    document.getElementById('detail-prizes').textContent = selectedComp.prizes || 'To be announced.';

    // CTA Button
    const cta = document.getElementById('detail-cta');
    if (selectedComp.status === 'active') {
      cta.innerHTML = `<button class="comp-btn comp-btn-primary" style="width:auto;padding:.9rem 2.5rem;" onclick="CompApp.showView('login')"><i class="fas fa-sign-in-alt"></i> Login to Participate</button>`;
    } else {
      cta.innerHTML = `<span style="color:var(--c-muted);font-size:.9rem;">This challenge has concluded.</span>`;
    }

    document.getElementById('register-comp-name').textContent = selectedComp.title;
    showView('details');
  }

  // --- Theme Toggle ---
  function setupThemeToggle() {
    // Default: light mode (class is set in HTML)
    const body = document.body;
    const stored = localStorage.getItem('comp_theme');
    if (stored === 'dark') { body.classList.remove('light-mode'); body.classList.add('dark-mode'); }

    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const isDark = body.classList.contains('dark-mode');
        body.classList.toggle('dark-mode', !isDark);
        body.classList.toggle('light-mode', isDark);
        localStorage.setItem('comp_theme', isDark ? 'light' : 'dark');
      });
    }
  }

  // --- Login Form ---
  function setupLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      if (!email) return;
      const btn = document.getElementById('login-btn');
      btn.disabled = true; btn.innerHTML = '<span class="comp-spinner"></span> Checking...';

      try {
        if (sb) {
          const { data, error } = await sb.from('participants').select('*').eq('email', email).maybeSingle();
          if (error) throw error;
          if (!data) throw new Error('Email not found. Please register first.');
          currentUser = data;
        } else {
          currentUser = { id: Math.floor(Math.random()*9000)+1000, full_name: 'Demo User', email, university: 'Demo University', status: 'Draft' };
        }
        localStorage.setItem('comp_user', JSON.stringify(currentUser));
        showDashboard();
        toast('Welcome back, ' + currentUser.full_name + '!');
      } catch(err) {
        toast(err.message || 'Login failed.', true);
      }
      btn.disabled = false; btn.innerHTML = '<i class="fas fa-arrow-right"></i> Access My Dashboard';
    });
  }

  // --- Register Form ---
  function setupRegisterForm() {
    const form = document.getElementById('register-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('register-btn');
      btn.disabled = true; btn.innerHTML = '<span class="comp-spinner"></span> Registering...';

      const payload = {
        full_name: document.getElementById('reg-name').value.trim(),
        email: document.getElementById('reg-email').value.trim(),
        university: document.getElementById('reg-university').value.trim(),
        department: document.getElementById('reg-department').value.trim(),
        study_level: document.getElementById('reg-level').value,
        social_media_link: document.getElementById('reg-social').value.trim()
      };

      try {
        if (sb) {
          // Check duplicate
          const { data: existing } = await sb.from('participants').select('email').eq('email', payload.email).maybeSingle();
          if (existing) throw new Error('Email already registered!');
          const { data, error } = await sb.from('participants').insert([payload]).select().single();
          if (error) throw error;
          currentUser = data;
        } else {
          currentUser = { ...payload, id: Math.floor(Math.random()*9000)+1000, status: 'Draft' };
        }
        localStorage.setItem('comp_user', JSON.stringify(currentUser));
        showDashboard();
        toast('Registration successful!');
      } catch(err) {
        toast(err.message || 'Registration failed.', true);
      }
      btn.disabled = false; btn.innerHTML = '<i class="fas fa-rocket"></i> Complete Registration';
    });
  }

  // --- Dashboard ---
  function showDashboard() {
    if (!currentUser || !selectedComp) return;

    document.getElementById('dash-comp-title').textContent = selectedComp.title + ' — Dashboard';
    document.getElementById('dash-welcome').textContent = 'Hello, ' + currentUser.full_name;

    const statusEl = document.getElementById('dash-status');
    const st = currentUser.submission_url ? 'Submitted' : (currentUser.status || 'Draft');
    statusEl.textContent = st;
    statusEl.className = 'comp-dash-status ' + (st === 'Submitted' ? 'submitted' : 'draft');

    // Badge
    document.getElementById('badge-event').textContent = selectedComp.title.split(' ').slice(0,2).join(' ');
    document.getElementById('badge-name').textContent = currentUser.full_name;
    document.getElementById('badge-university').textContent = currentUser.university || '—';
    document.getElementById('badge-id').textContent = 'ID: RVC-' + String(currentUser.id).padStart(4, '0');

    // Submission state
    if (currentUser.submission_url) {
      document.getElementById('submitted-state').style.display = 'block';
      document.getElementById('upload-state').style.display = 'none';
      document.getElementById('submitted-link').href = currentUser.submission_url;
    } else {
      document.getElementById('submitted-state').style.display = 'none';
      document.getElementById('upload-state').style.display = 'block';
    }

    showView('dashboard');
  }

  // --- Upload ---
  function setupUpload() {
    const zone = document.getElementById('upload-zone');
    const input = document.getElementById('file-input');
    const info = document.getElementById('file-info');
    const removeBtn = document.getElementById('file-remove');
    const submitBtn = document.getElementById('submit-btn');
    if (!zone) return;

    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('dragover'); if (e.dataTransfer.files[0]) selectFile(e.dataTransfer.files[0]); });
    input.addEventListener('change', e => { if (e.target.files[0]) selectFile(e.target.files[0]); });
    removeBtn.addEventListener('click', () => { selectedFile = null; input.value = ''; info.classList.remove('show'); submitBtn.disabled = true; });

    submitBtn.addEventListener('click', async () => {
      if (!selectedFile || !currentUser) return;
      submitBtn.disabled = true; submitBtn.innerHTML = '<span class="comp-spinner"></span> Uploading...';
      const progress = document.getElementById('upload-progress');
      const fill = document.getElementById('progress-fill');
      const pText = document.getElementById('progress-text');
      progress.classList.add('show');

      let p = 0;
      const iv = setInterval(() => { p += Math.random()*15; if (p > 90) p = 90; fill.style.width = p+'%'; pText.textContent = Math.round(p)+'%'; }, 250);

      try {
        if (sb) {
          const path = `submissions/${currentUser.email.replace(/[^a-z0-9]/gi,'_')}_${Date.now()}.pdf`;
          const { error: upErr } = await sb.storage.from('challenge-submissions').upload(path, selectedFile, { cacheControl: '3600', upsert: true });
          if (upErr) throw upErr;
          const { data: urlData } = sb.storage.from('challenge-submissions').getPublicUrl(path);
          const { error: dbErr } = await sb.from('participants').update({ submission_url: urlData.publicUrl }).eq('email', currentUser.email);
          if (dbErr) throw dbErr;
          currentUser.submission_url = urlData.publicUrl;
        } else {
          currentUser.submission_url = '#demo-url';
        }

        clearInterval(iv); fill.style.width = '100%'; pText.textContent = '100%';
        localStorage.setItem('comp_user', JSON.stringify(currentUser));

        setTimeout(() => {
          document.getElementById('success-overlay').classList.add('show');
          progress.classList.remove('show'); fill.style.width = '0%';
          selectedFile = null; input.value = ''; info.classList.remove('show');
          showDashboard();
        }, 400);
      } catch(err) {
        clearInterval(iv); progress.classList.remove('show'); fill.style.width = '0%';
        toast(err.message || 'Upload failed.', true);
      }
      submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Project';
    });
  }

  function selectFile(file) {
    if (file.type !== 'application/pdf') { toast('Only PDF files accepted.', true); return; }
    if (file.size > 10*1024*1024) { toast('File must be under 10MB.', true); return; }
    selectedFile = file;
    document.getElementById('file-name').textContent = file.name;
    document.getElementById('file-size').textContent = (file.size / 1048576).toFixed(1) + ' MB';
    document.getElementById('file-info').classList.add('show');
    document.getElementById('submit-btn').disabled = false;
  }

  // --- Badge Actions ---
  function setupBadgeActions() {
    document.getElementById('download-badge-btn')?.addEventListener('click', async () => {
      const btn = document.getElementById('download-badge-btn');
      btn.disabled = true; btn.innerHTML = '<span class="comp-spinner"></span> Generating...';
      try {
        const url = await htmlToImage.toPng(document.getElementById('participant-badge'), { quality: 1, pixelRatio: 3 });
        const a = document.createElement('a');
        a.download = `Badge_${(currentUser?.full_name || 'Participant').replace(/\s+/g, '_')}.png`;
        a.href = url; a.click();
        toast('Badge downloaded!');
      } catch(e) { toast('Download failed.', true); }
      btn.disabled = false; btn.innerHTML = '<i class="fas fa-download"></i> Download Badge';
    });

    document.getElementById('copy-caption-btn')?.addEventListener('click', () => {
      const text = document.getElementById('caption-template')?.textContent || '';
      navigator.clipboard.writeText(text).then(() => toast('Caption copied!')).catch(() => toast('Copy failed.', true));
    });
  }

  // --- Toast ---
  function toast(msg, isError = false) {
    const el = document.getElementById('comp-toast');
    const icon = document.getElementById('toast-icon');
    const text = document.getElementById('toast-text');
    if (!el) return;
    icon.className = isError ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
    text.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3500);
  }

  // --- Public API ---
  document.addEventListener('DOMContentLoaded', init);
  return { showView, openDetails };
})();
