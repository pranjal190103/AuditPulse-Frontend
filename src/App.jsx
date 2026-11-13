import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Filter,
  Globe2,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import AuditWorkflow, { stages as auditWorkflowStages } from './AuditWorkflow';

const initialAudits = [
  { id: 'AUD-0264', client: 'Northstar Living', initials: 'NL', color: 'peach', type: 'Digital growth audit', owner: 'Ariana James', date: 'Oct 24, 2026', progress: 75, status: 'In progress', modules: '6 of 8 modules' },
  { id: 'AUD-0263', client: 'Form & Field', initials: 'FF', color: 'mint', type: 'SEO & content audit', owner: 'Marcus Chen', date: 'Oct 22, 2026', progress: 100, status: 'In review', modules: '8 of 8 modules' },
  { id: 'AUD-0262', client: 'Goodkind Coffee', initials: 'GC', color: 'lavender', type: 'Digital growth audit', owner: 'Nina Patel', date: 'Oct 20, 2026', progress: 50, status: 'In progress', modules: '4 of 8 modules' },
  { id: 'AUD-0261', client: 'Morrow & Co.', initials: 'MC', color: 'blue', type: 'Paid media audit', owner: 'Olivia Reid', date: 'Oct 18, 2026', progress: 100, status: 'Complete', modules: '8 of 8 modules' },
];

const starterModules = [
  { id: 'business', title: 'Business & goals', description: 'Understand the business model, audience, and what success means.', category: 'FOUNDATION', required: true, evidence: 'Client brief', questions: 5, icon: Target },
  { id: 'website', title: 'Website & experience', description: 'Review site performance, conversion paths, and user experience.', category: 'OWNED CHANNELS', required: true, evidence: 'Analytics access', questions: 8, icon: Globe2 },
  { id: 'seo', title: 'SEO & discoverability', description: 'Check technical foundations, organic visibility, and content gaps.', category: 'OWNED CHANNELS', required: true, evidence: 'Search Console', questions: 12, icon: Search },
  { id: 'paid', title: 'Paid media', description: 'Assess campaign structure, efficiency, audience, and creative.', category: 'PAID CHANNELS', required: false, evidence: 'Ad platform access', questions: 10, icon: Activity },
  { id: 'content', title: 'Content & brand', description: 'Evaluate messaging, content quality, consistency, and coverage.', category: 'OWNED CHANNELS', required: false, evidence: 'Content inventory', questions: 7, icon: FileText },
  { id: 'social', title: 'Social & community', description: 'Review channel fit, engagement, and community signals.', category: 'EARNED CHANNELS', required: false, evidence: 'Social profiles', questions: 6, icon: MessageSquareText },
  { id: 'measurement', title: 'Measurement & data', description: 'Validate analytics setup, attribution, and reporting confidence.', category: 'FOUNDATION', required: true, evidence: 'Analytics access', questions: 8, icon: BarChart3 },
  { id: 'competitors', title: 'Market & competitors', description: 'Compare positioning and visibility against relevant competitors.', category: 'FOUNDATION', required: false, evidence: 'Competitor list', questions: 5, icon: Users },
];

function selectedModuleKeys(audit) {
  if (Array.isArray(audit.selectedModules) && audit.selectedModules.length) return audit.selectedModules;
  if (Array.isArray(audit.module_keys) && audit.module_keys.length) return audit.module_keys;
  return starterModules.map((module) => module.id);
}

function readAuditDetail(id) {
  try {
    return JSON.parse(localStorage.getItem(`auditflow-detail-${id}`) || '{}');
  } catch {
    return {};
  }
}

const checklist = [
  'Completeness: required modules and evidence are present',
  'Technical accuracy: metrics and sources are cross-checked',
  'Client relevance: findings reflect goals and constraints',
  'Clarity: client-ready language and recommendations',
  'Design and evidence: report and evidence cards are ready',
  'Methodology: work follows the agreed audit framework',
];

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'audits', label: 'My audits', icon: ClipboardCheck, count: '04' },
  { id: 'quality', label: 'Quality review', icon: ShieldCheck },
];

const API_URL = import.meta.env.VITE_API_URL || '';
const REFRESH_PATH = '/api/auth/token/refresh/';
let currentAccessToken = null;
let refreshRequest = null;
let accessTokenChanged = () => {};
let sessionExpired = () => {};

async function renewAccessToken() {
  if (!refreshRequest) {
    refreshRequest = fetch(`${API_URL}${REFRESH_PATH}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
      .then(readApiResponse)
      .then((result) => {
        currentAccessToken = result.access;
        accessTokenChanged(result.access);
        return result.access;
      })
      .catch(() => null)
      .finally(() => { refreshRequest = null; });
  }
  return refreshRequest;
}

async function apiRequest(url, options = {}) {
  const send = (token) => {
    const headers = new Headers(options.headers || {});
    if (options.body instanceof FormData) headers.delete('Content-Type');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(url, { ...options, headers, credentials: 'include' });
  };
  let response = await send(currentAccessToken);
  if (response.status !== 401 || url.includes('/api/auth/')) return response;
  const token = await renewAccessToken();
  if (!token) {
    currentAccessToken = null;
    accessTokenChanged(null);
    sessionExpired();
    throw new Error('Your session expired. Please sign in again.');
  }
  response = await send(token);
  if (response.status === 401) {
    currentAccessToken = null;
    accessTokenChanged(null);
    sessionExpired();
    throw new Error('Your session expired. Please sign in again.');
  }
  return response;
}

async function readApiResponse(response) {
  const body = await response.text();
  let data = {};
  if (body) {
    try {
      data = JSON.parse(body);
    } catch {
      throw new Error(`The API returned an unexpected response (HTTP ${response.status}).`);
    }
  }
  if (!response.ok) {
    const detail = data.detail || data.non_field_errors?.[0] || Object.values(data).flat()[0];
    throw new Error(typeof detail === 'string' ? detail : `Request failed (HTTP ${response.status}).`);
  }
  return data;
}

function readSession() {
  try {
    const session = JSON.parse(localStorage.getItem('auditflow-session') || 'null');
    if (!session) return null;
    if (session.demo) return { name: session.name, email: session.email, demo: true };
    if (!session.email) return null;
    const safeSession = { name: session.name, email: session.email, demo: false, isStaff: Boolean(session.isStaff) };
    if (session.token || session.refresh) localStorage.setItem('auditflow-session', JSON.stringify(safeSession));
    return safeSession;
  } catch {
    return null;
  }
}

function readAudits() {
  try {
    const saved = localStorage.getItem('auditflow-demo-audits');
    return (saved ? JSON.parse(saved) : initialAudits).map((audit) => ({
      ...audit,
      selectedModules: selectedModuleKeys(audit),
    }));
  } catch {
    return initialAudits;
  }
}

function App() {
  const shareToken = new URLSearchParams(window.location.search).get('share');
  const [accessToken, setAccessToken] = useState(null);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [authReady, setAuthReady] = useState(false);
  const accessTokenRef = useRef(null);
  const updateAccessToken = useCallback((token) => {
    currentAccessToken = token;
    accessTokenRef.current = token;
    setAccessToken(token);
  }, []);
  const [user, setUser] = useState(readSession);
  const [audits, setAudits] = useState(() => user?.demo ? readAudits() : []);
  const [page, setPage] = useState('overview');
  const [showWizard, setShowWizard] = useState(false);
  const [activeAudit, setActiveAudit] = useState(null);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [profileMenu, setProfileMenu] = useState(false);

  useEffect(() => {
    if (shareToken) return undefined;
    accessTokenChanged = updateAccessToken;
    sessionExpired = () => {
      localStorage.removeItem('auditflow-session');
      setUser(null);
      setNotice('Your session expired. Please sign in again.');
    };
    return () => {
      accessTokenChanged = () => {};
      sessionExpired = () => {};
    };
  }, [shareToken, updateAccessToken]);

  useEffect(() => {
    if (shareToken) return undefined;
    if (!user || user.demo) {
      setAuthReady(true);
      return undefined;
    }
    if (accessTokenRef.current) {
      setAuthReady(true);
      return undefined;
    }
    let cancelled = false;
    setAuthReady(false);
    renewAccessToken().then((token) => {
      if (cancelled) return;
      if (!token) {
        localStorage.removeItem('auditflow-session');
        setUser(null);
        setNotice('Your sign-in session expired. Please sign in again.');
      }
      setAuthReady(true);
    });
    return () => { cancelled = true; };
  }, [shareToken, user]);

  useEffect(() => {
    if (shareToken) return undefined;
    if (!user || user.demo || !authReady || !accessToken) return undefined;
    const controller = new AbortController();
    apiRequest(`${API_URL}/api/audits/`, {
      headers: { Authorization: `Bearer ${user.token}` },
      signal: controller.signal,
    })
      .then(readApiResponse)
      .then((data) => saveAudits((data.results || data).map((audit) => ({ ...audit, selectedModules: audit.module_keys }))))
      .catch((error) => {
        if (error.name !== 'AbortError') setNotice(error.message);
      });
    return () => controller.abort();
  }, [accessToken, authReady, shareToken, user]);

  useEffect(() => {
    if (shareToken) return undefined;
    if (!user || !authReady) return undefined;
    if (user.demo) {
      setReviewQueue(audits.filter((audit) => audit.status === 'In review'));
      return undefined;
    }
    if (page !== 'quality') return undefined;
    const controller = new AbortController();
    apiRequest(`${API_URL}/api/audits/review_queue/`, { signal: controller.signal })
      .then(readApiResponse)
      .then((data) => setReviewQueue(data.map((audit) => ({ ...audit, selectedModules: audit.module_keys }))))
      .catch((error) => {
        if (error.name !== 'AbortError') setNotice(error.message || 'Could not load the quality review queue.');
      });
    return () => controller.abort();
  }, [accessToken, audits, authReady, page, shareToken, user]);

  const saveAudits = (next) => {
    setAudits(next);
    if (user?.demo) {
      try {
        localStorage.setItem('auditflow-demo-audits', JSON.stringify(next));
      } catch {
        setNotice('Could not save locally. Check your browser storage settings.');
      }
    }
  };

  const startSession = (session, token) => {
    const safeSession = {
      name: session.name || session.email?.split('@')[0] || 'VE Studio member',
      email: session.email,
      demo: Boolean(session.demo),
      isStaff: Boolean(session.isStaff),
    };
    updateAccessToken(token || null);
    localStorage.setItem('auditflow-session', JSON.stringify(safeSession));
    setAudits(safeSession.demo ? readAudits() : []);
    setReviewQueue([]);
    setUser(safeSession);
    setAuthReady(true);
  };

  const updateAudit = (updatedAudit) => {
    const nextAudit = {
      ...updatedAudit,
      selectedModules: selectedModuleKeys(updatedAudit),
    };
    setAudits((current) => {
      const next = current.map((audit) => audit.id === nextAudit.id ? nextAudit : audit);
      if (user?.demo) {
        try {
          localStorage.setItem('auditflow-demo-audits', JSON.stringify(next));
        } catch {
          setNotice('Could not save audit updates in this browser.');
        }
      }
      return next;
    });
    setActiveAudit(nextAudit);
    if (nextAudit.status === 'In review') {
      setReviewQueue((current) => [nextAudit, ...current.filter((audit) => audit.id !== nextAudit.id)]);
    } else {
      setReviewQueue((current) => current.filter((audit) => audit.id !== nextAudit.id));
    }
  };

  const deleteAudit = async (audit) => {
    if (audit.status === 'In review' || audit.status === 'Approved') {
      setNotice('Audits in review or approved cannot be deleted. Return the audit for changes first.');
      return;
    }
    if (!window.confirm(`Delete the audit for ${audit.client}? This permanently removes its findings, modules, and uploaded evidence.`)) return;
    if (!user?.demo) {
      try {
        const response = await apiRequest(`${API_URL}/api/audits/${audit.id}/`, { method: 'DELETE' });
        if (!response.ok) await readApiResponse(response);
      } catch (error) {
        setNotice(error.message || 'Could not delete this audit.');
        return;
      }
    }
    setAudits((current) => {
      const next = current.filter((item) => item.id !== audit.id);
      if (user?.demo) {
        try {
          localStorage.setItem('auditflow-demo-audits', JSON.stringify(next));
          localStorage.removeItem(`auditflow-detail-${audit.id}`);
        } catch {
          setNotice('Audit was removed from this view, but some browser data could not be cleared.');
        }
      }
      return next;
    });
    setReviewQueue((current) => current.filter((item) => item.id !== audit.id));
    setActiveAudit((current) => current?.id === audit.id ? null : current);
    setNotice(`${audit.client} audit deleted.`);
  };

  const createAudit = async (audit) => {
    if (user && !user.demo) {
      try {
        const response = await apiRequest(`${API_URL}/api/audits/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
          body: JSON.stringify({ client: audit.client, type: audit.type, goal: audit.goal, selected_modules: audit.selectedModules }),
        });
        const created = await readApiResponse(response);
        const savedAudit = { ...created, selectedModules: created.module_keys };
        saveAudits([savedAudit, ...audits]);
        setShowWizard(false);
        setActiveAudit(savedAudit);
        setNotice('Your audit workspace is ready.');
      } catch (error) {
        setNotice(error.message || 'Could not reach the audit server.');
      }
      return;
    }
    saveAudits([audit, ...audits]);
    setShowWizard(false);
    setActiveAudit(audit);
    setNotice('Your audit workspace is ready in this demo.');
  };

  const signOut = async () => {
    if (user && !user.demo) {
      try {
        const response = await apiRequest(`${API_URL}/api/auth/logout/`, { method: 'POST' });
        if (!response.ok) setNotice('Signed out locally; the server could not revoke this refresh session.');
      } catch {
        setNotice('Signed out locally; the server could not revoke this refresh session.');
      }
    }
    updateAccessToken(null);
    localStorage.removeItem('auditflow-session');
    setUser(null);
    setProfileMenu(false);
  };

  if (shareToken) {
    return <SharedAuditPage token={shareToken} />;
  }
  if (!user) {
    return <LoginScreen onLogin={startSession} />;
  }
  if (!authReady || (!user.demo && !accessToken)) {
    return <main className="session-loading"><span className="brand-icon"><span /><span /><span /><span /></span><p>Securing your workspace…</p></main>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setPage('overview'); setActiveAudit(null); }}>
          <span className="brand-icon"><span /><span /><span /><span /></span>
          <span className="brand-name">AuditPulse<span>.</span></span>
        </a>
        <div className="workspace-switcher">
          <span className="workspace-avatar">V</span>
          <span className="workspace-copy"><strong>VE Studio</strong><small>Growth & strategy</small></span>
          <ChevronDown size={15} />
        </div>
        <p className="nav-caption">WORKSPACE</p>
        <nav className="primary-nav">
          {navItems.map(({ id, label, icon: Icon, count }) => {
            const navCount = id === 'quality' ? reviewQueue.length : id === 'audits' ? audits.length : count;
            return <button type="button" className={`nav-link ${page === id && !activeAudit ? 'selected' : ''}`} key={id} onClick={() => { setPage(id); setActiveAudit(null); }}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>{Number(navCount) > 0 && <span className="nav-count">{String(navCount).padStart(2, '0')}</span>}
            </button>;
          })}
        </nav>
        <p className="nav-caption tools-caption">TOOLS</p>
        <button type="button" className="nav-link" onClick={() => setNotice('Client library is coming soon.')}><Users size={17} strokeWidth={1.8} /><span>Clients</span></button>
        <button type="button" className="nav-link" onClick={() => setNotice('Reports are created from approved audits.')}><FileCheck2 size={17} strokeWidth={1.8} /><span>Client reports</span></button>
        <div className="sidebar-spacer" />
        <div className="sidebar-help"><span className="help-icon"><CircleHelp size={17} /></span><span><strong>Need a hand?</strong><small>Visit the audit playbook</small></span><ArrowUpRight size={14} /></div>
        <button type="button" className="profile-button" onClick={() => setProfileMenu(!profileMenu)}>
          <span className="profile-avatar">{initials(user.name || user.email || 'VE Studio')}</span><span className="profile-text"><strong>{user.name || user.email?.split('@')[0] || 'VE Studio member'}</strong><small>{user.demo ? 'Demo workspace' : user.isStaff ? 'Quality reviewer' : 'VE Studio member'}</small></span><MoreHorizontal size={18} />
        </button>
        {profileMenu && <div className="profile-popover"><button type="button" onClick={() => setNotice('Profile settings are coming soon.')}><Settings size={15} /> Account settings</button><button type="button" onClick={signOut}><LogOut size={15} /> Sign out</button></div>}
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-icon"><span /><span /><span /><span /></span> AuditPulse<span>.</span></div>
          <div className="breadcrumb"><span>VE Studio</span><ChevronRight size={13} /><strong>{activeAudit ? activeAudit.client : pageTitle(page)}</strong></div>
          <div className="topbar-right">
            <label className="global-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search anything..." /><kbd>⌘ K</kbd></label>
            <button className="icon-action notification-button" type="button" aria-label="Notifications" onClick={() => setNotice('You’re all caught up.')}><Bell size={17} /><i /></button>
            <button className="topbar-avatar" type="button" aria-label={`Open ${user.name || 'profile'} profile`} onClick={() => setProfileMenu(!profileMenu)}>{initials(user.name || user.email || 'VE Studio')}</button>
          </div>
        </header>

        {activeAudit ? <AuditWorkspace key={activeAudit.id} audit={activeAudit} token={accessToken} reviewer={user.isStaff} onAuditUpdated={updateAudit} onDelete={deleteAudit} onBack={() => setActiveAudit(null)} onNotice={setNotice} /> :
          page === 'overview' ? <Overview audits={audits} userName={user.name || user.email?.split('@')[0] || 'there'} onCreate={() => setShowWizard(true)} onOpen={setActiveAudit} onDelete={deleteAudit} onNavigate={setPage} /> :
            page === 'audits' ? <AuditsPage audits={audits} search={search} onCreate={() => setShowWizard(true)} onOpen={setActiveAudit} onDelete={deleteAudit} /> :
              <QualityPage onNotice={setNotice} onOpen={(audit) => setActiveAudit(audit)} audits={reviewQueue} />}
      </main>

      {showWizard && <AuditWizard ownerName={user.name || user.email?.split('@')[0] || 'VE Studio member'} onClose={() => setShowWizard(false)} onCreate={createAudit} />}
      {notice && <div className="toast"><CheckCircle2 size={17} /><span>{notice}</span><button type="button" aria-label="Dismiss" onClick={() => setNotice('')}><X size={15} /></button></div>}
    </div>
  );
}

function pageTitle(page) {
  return ({ overview: 'Overview', audits: 'My audits', quality: 'Quality review' })[page] || 'Overview';
}

function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [serviceStatus, setServiceStatus] = useState('checking');
  const isRegister = mode === 'register';

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/api/health/`, { signal: controller.signal })
      .then((response) => setServiceStatus(response.ok ? 'online' : 'offline'))
      .catch(() => setServiceStatus('offline'));
    return () => controller.abort();
  }, []);

  const submitAuth = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/${isRegister ? 'register' : 'token'}/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isRegister
          ? { first_name: firstName.trim(), last_name: lastName.trim(), email: email.trim(), password, password_confirm: passwordConfirm }
          : { email: email.trim(), password }),
      });
      const responseBody = await response.text();
      let result;
      try {
        result = responseBody ? JSON.parse(responseBody) : {};
      } catch {
        throw new Error(response.ok
          ? 'The account service returned an unexpected response.'
          : `The account service is unavailable at this URL (HTTP ${response.status}). Check that the latest Django server is running.`);
      }
      if (!response.ok) {
        const detail = result.detail || result.email?.[0] || result.password?.[0] || result.password_confirm?.[0];
        throw new Error(detail || 'Could not create your account. Check your details and try again.');
      }
      onLogin({ name: result.name || email.split('@')[0], email, isStaff: Boolean(result.is_staff) }, result.access);
    } catch (requestError) {
      if (requestError instanceof TypeError) {
        setError(`We couldn't reach the account service at ${API_URL || 'this address'}. Start the Django server, then try again.`);
      } else {
        setError(requestError.message || 'Could not reach the account service.');
      }
    } finally {
      setLoading(false);
    }
  };

  return <main className="login-page">
    <section className="login-story">
      <a className="login-brand" href="#"><span className="brand-icon"><span /><span /><span /><span /></span><span>AuditPulse<span>.</span></span></a>
      <div className="login-message"><p className="eyebrow"><span className="eyebrow-dot" /> THE VE AUDIT STUDIO</p><h1>Thoughtful audits.<br /><em>Built to repeat.</em></h1><p>One trusted framework. The right building blocks for every client. Evidence behind every recommendation.</p><div className="login-proof"><span><CheckCircle2 size={15} /> A consistent quality bar</span><span><CheckCircle2 size={15} /> Built around real client context</span></div></div>
      <div className="login-quote"><span>“</span><p>Good audits don’t just find gaps. They make the next move clear.</p><small>THE VE STUDIO STANDARD</small></div>
      <div className="login-story-footer">A calmer way to do ambitious work. <span>© 2026 VE Studio</span></div>
      <div className="login-orbit orbit-one" /><div className="login-orbit orbit-two" />
    </section>
    <section className="login-form-side">
      <form className="login-form" onSubmit={submitAuth}>
        <div className="login-form-meta"><p className="eyebrow">{isRegister ? 'JOIN VE STUDIO' : 'WELCOME BACK'}</p><span className={`service-status ${serviceStatus}`}><i />{serviceStatus === 'online' ? 'Secure service online' : serviceStatus === 'offline' ? 'Service unavailable' : 'Checking service'}</span></div><h2>{isRegister ? 'Create your account.' : 'Sign in to your studio.'}</h2><p className="login-hint">{isRegister ? 'Set up your VE Studio account to start building evidence-led client audits.' : 'Pick up where you left off. Your work is right where you left it.'}</p>
        {isRegister && <div className="register-name-fields"><label className="field-label">First name<input autoComplete="given-name" required value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="First name" /></label><label className="field-label">Last name<input autoComplete="family-name" required value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Last name" /></label></div>}
        <label className="field-label">Work email<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@yourcompany.com" /></label>
        <label className="field-label">Password<input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isRegister ? 'At least 8 characters' : 'Enter your password'} /></label>
        {isRegister ? <label className="field-label">Confirm password<input type="password" autoComplete="new-password" minLength={8} required value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} placeholder="Enter your password again" /></label> :
          <button type="button" className="forgot-link" onClick={() => setError('Ask your workspace administrator to reset your password.')}>Forgot password?</button>}
        {error && <div className="login-error" role="alert">{error}</div>}
        <button className="button button-primary login-submit" type="submit" disabled={loading}>{loading ? (isRegister ? 'Creating account…' : 'Signing in…') : (isRegister ? 'Create account' : 'Sign in')} {!loading && <ArrowRight size={15} />}</button>
        <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to VE Studio?'} <button type="button" onClick={() => { setMode(isRegister ? 'login' : 'register'); setError(''); }}>{isRegister ? 'Sign in' : 'Create an account'}</button></p>
        {!isRegister && <><div className="login-separator"><span /> or <span /></div><button className="button demo-button" type="button" onClick={() => onLogin({ name: 'Ariana James', email: 'ariana@ve.studio', demo: true })}>Explore the demo workspace <ArrowUpRight size={14} /></button></>}
        <p className="login-privacy"><LockKeyhole size={12} /> Your client work stays private to your workspace.</p>
      </form>
      <div className="login-mobile-footer">VE Studio · Digital audit workspace</div>
    </section>
  </main>;
}

function SharedAuditPage({ token }) {
  const [audit, setAudit] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/shared-audits/${encodeURIComponent(token)}/`)
      .then(readApiResponse)
      .then((data) => {
        if (!cancelled) setAudit(data);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message || 'This client audit link is not available.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return <main className="shared-audit-page"><p>Loading your audit…</p></main>;
  }
  if (error || !audit) {
    return <main className="shared-audit-page"><section className="shared-audit-card"><span className="brand-name">AuditPulse<span>.</span></span><h1>Audit link unavailable</h1><p>{error || 'This client audit link is invalid or no longer active.'}</p></section></main>;
  }

  return <main className="shared-audit-page">
    <article className="shared-audit-card">
      <header className="shared-audit-header">
        <div><span className="brand-name">AuditPulse<span>.</span></span><span className="shared-audit-label">APPROVED CLIENT AUDIT</span></div>
        <button className="button button-outline" type="button" onClick={() => window.print()}>Print / save</button>
      </header>
      <p className="eyebrow">A CLEARER PATH TO GROWTH</p>
      <h1>{audit.client}</h1>
      <p className="shared-audit-type">{audit.type}</p>
      {audit.goal && <section className="shared-audit-goal"><h2>What this audit is working toward</h2><p>{audit.goal}</p></section>}
      <section className="shared-audit-findings">
        <div className="shared-findings-heading"><div><p className="eyebrow">EVIDENCE → IMPACT → ACTION</p><h2>Priorities and next steps</h2></div><span>{audit.findings.length} finding{audit.findings.length === 1 ? '' : 's'}</span></div>
        {audit.findings.length ? audit.findings.map((finding, index) => <article className="shared-finding" key={`${finding.title}-${index}`}>
          <div className="shared-finding-title"><span>{String(index + 1).padStart(2, '0')}</span><div><small>{finding.module_title} · {finding.priority} priority</small><h3>{finding.title}</h3></div></div>
          <div className="shared-finding-grid"><section><h4>What we found</h4><p>{finding.evidence}</p></section><section><h4>Why it matters</h4><p>{finding.impact}</p></section><section><h4>Recommended next step</h4><p>{finding.recommendation}</p></section></div>
          {(finding.owner_name || finding.due_date) && <p className="shared-finding-owner">{finding.owner_name ? `Suggested owner: ${finding.owner_name}` : ''}{finding.owner_name && finding.due_date ? ' · ' : ''}{finding.due_date ? `Target date: ${finding.due_date}` : ''}</p>}
        </article>) : <div className="shared-audit-empty"><p>This audit was approved, but no client-facing findings have been added yet.</p></div>}
      </section>
      <footer className="shared-audit-footer"><ShieldCheck size={16} /><span>Reviewed and approved by the VE team. Discuss the priorities and follow-up opportunities with your VE contact.</span></footer>
    </article>
  </main>;
}

function Overview({ audits, userName, onCreate, onOpen, onDelete, onNavigate }) {
  const activeCount = audits.filter((audit) => audit.status === 'In progress').length;
  const reviewCount = audits.filter((audit) => audit.status === 'In review').length;
  const approvedCount = audits.filter((audit) => audit.status === 'Approved').length;
  const progress = audits.length ? Math.round(audits.reduce((sum, audit) => sum + audit.progress, 0) / audits.length) : 0;
  const firstName = userName.trim().split(/\s+/)[0] || 'there';
  const hour = new Date().getHours();
  const greetingText = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return (
    <div className="page-content">
      <section className="welcome-row">
        <div><p className="eyebrow"><span className="eyebrow-dot" /> YOUR AUDIT STUDIO</p><h1>{greetingText}, {firstName} <span className="wave">✳</span></h1><p className="welcome-subtitle">A clear view of your audits, what needs attention, and what’s next.</p></div>
        <button className="button button-primary" type="button" onClick={onCreate}><Plus size={17} /> Create an audit</button>
      </section>

      <section className="stat-grid" aria-label="Audit summary">
        <article className="stat-card"><div className="stat-label">Active audits <span className="stat-icon mint-icon"><Activity size={16} /></span></div><div className="stat-value">{String(activeCount).padStart(2, '0')}<span className="stat-note positive">in progress</span></div><div className="stat-foot"><span className="tiny-bars"><i /><i /><i /><i /><i /><i /><i /></span><span>Across your workspace</span></div></article>
        <article className="stat-card"><div className="stat-label">Ready for review <span className="stat-icon lilac-icon"><ShieldCheck size={16} /></span></div><div className="stat-value">{String(reviewCount).padStart(2, '0')}<span className="stat-note">awaiting a second look</span></div><div className="stat-foot"><span className="stat-dot purple-dot" /> Quality keeps every audit client-ready</div></article>
        <article className="stat-card"><div className="stat-label">Approved audits <span className="stat-icon mint-icon"><CheckCircle2 size={16} /></span></div><div className="stat-value">{String(approvedCount).padStart(2, '0')}<span className="stat-note positive">ready for delivery</span></div><div className="stat-foot"><span className="stat-dot mint-dot" /> Approved work is ready to share</div></article>
        <article className="stat-card"><div className="stat-label">Average completion <span className="stat-icon peach-icon"><Target size={16} /></span></div><div className="stat-value">{progress}<span className="percent-sign">%</span><span className="stat-note positive">workspace average</span></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></article>
      </section>

      <section className="content-grid">
        <div className="audit-panel panel">
          <div className="panel-heading"><div><p className="eyebrow">IN YOUR WORKSPACE</p><h2>Recent audits <span className="heading-count">{String(audits.length).padStart(2, '0')}</span></h2></div><button className="button button-quiet" type="button" onClick={() => onNavigate('audits')}>View all <ArrowRight size={15} /></button></div>
          <div className="audit-table">
            <div className="table-head"><span>CLIENT / AUDIT</span><span>OWNER</span><span>PROGRESS</span><span>STATUS</span><span>ACTIONS</span></div>
            {audits.slice(0, 4).map((audit) => <AuditRow key={audit.id} audit={audit} onOpen={onOpen} onDelete={onDelete} />)}
            {!audits.length && <div className="empty-state"><p>No audits yet. Create a client-specific audit and choose the modules that fit the engagement.</p><button className="button button-primary" type="button" onClick={onCreate}><Plus size={16} /> Create your first audit</button></div>}
          </div>
        </div>

        <aside className="right-rail">
          <div className="focus-card">
            <div className="focus-top"><span className="focus-icon"><Sparkles size={16} /></span><span className="focus-tag">YOUR NEXT STEP</span><MoreHorizontal size={17} /></div>
            <h3>Make every finding<br />feel grounded.</h3>
            <p>A strong recommendation starts with evidence. Link a source, explain the impact, and make the next step clear.</p>
            <button type="button" className="focus-link" onClick={() => onNavigate('audits')}>Open my audits <ArrowRight size={15} /></button>
            <div className="focus-decoration"><span /><span /><span /></div>
          </div>
          <div className="attention-card panel">
            <div className="panel-heading compact"><div><p className="eyebrow">DON’T MISS</p><h2>Needs attention</h2></div><span className="attention-number">{reviewCount || '0'}</span></div>
            {reviewCount ? audits.filter((audit) => audit.status === 'In review').slice(0, 2).map((audit) => <button className="attention-item" type="button" key={audit.id} onClick={() => onOpen(audit)}><span className="attention-file"><FileCheck2 size={16} /></span><span><strong>{audit.client}</strong><small>Waiting for quality review</small></span><ChevronRight size={15} /></button>) : <div className="no-attention"><CheckCircle2 size={17} /><span>Nothing is waiting on you.</span></div>}
            <button className="attention-footer" type="button" onClick={() => onNavigate('quality')}>Open quality review <ArrowRight size={14} /></button>
          </div>
        </aside>
      </section>
      <div className="page-footer"><span>AuditPulse helps you turn signals into confident growth decisions.</span><span>Audit system · v1.0</span></div>
    </div>
  );
}

function AuditRow({ audit, onOpen, onDelete }) {
  const canDelete = audit.status !== 'In review' && audit.status !== 'Approved';
  return <div className="audit-row">
    <button type="button" className="audit-row-open" onClick={() => onOpen(audit)}>
      <span className="audit-client-cell"><span className={`client-avatar ${audit.color}`}>{audit.initials}</span><span className="audit-client-text"><strong>{audit.client}</strong><small>{audit.type} <span>·</span> {audit.id}</small></span></span>
      <span className="owner-cell"><span className="owner-avatar">{initials(audit.owner)}</span>{audit.owner.split(' ')[0]}</span>
      <span className="progress-cell"><span className="progress-line"><i style={{ width: `${audit.progress}%` }} /></span><small>{audit.modules}</small></span>
      <span className={`status-pill ${statusClass(audit.status)}`}><i />{audit.status}</span>
      <ChevronRight className="row-chevron" size={16} />
    </button>
    {onDelete && <button className="audit-row-delete" type="button" disabled={!canDelete} aria-label={`Delete ${audit.client} audit`} title={canDelete ? 'Delete audit' : 'Audits in review or approved cannot be deleted'} onClick={() => onDelete(audit)}><Trash2 size={15} /></button>}
  </div>;
}

function AuditsPage({ audits, search, onCreate, onOpen, onDelete }) {
  const [filter, setFilter] = useState('All audits');
  const visible = useMemo(() => audits.filter((audit) => (filter === 'All audits' || audit.status === filter) && `${audit.client} ${audit.type} ${audit.owner}`.toLowerCase().includes(search.toLowerCase())), [audits, filter, search]);
  return <div className="page-content subpage">
    <section className="page-heading"><div><p className="eyebrow"><span className="eyebrow-dot" /> AUDIT WORKSPACE</p><h1>My audits</h1><p>Every client engagement, assembled from the same trusted building blocks.</p></div><button className="button button-primary" type="button" onClick={onCreate}><Plus size={17} /> Create an audit</button></section>
    <div className="filter-toolbar"><div className="filter-tabs">{['All audits', 'In progress', 'Needs changes', 'In review', 'Approved'].map((item) => <button type="button" key={item} className={`filter-tab ${filter === item ? 'active' : ''}`} onClick={() => setFilter(item)}>{item}<span>{item === 'All audits' ? audits.length : audits.filter((audit) => audit.status === item).length}</span></button>)}</div><button className="button button-outline" type="button"><Filter size={15} /> Filters <ChevronDown size={14} /></button></div>
    <div className="panel full-table"><div className="table-head"><span>CLIENT / AUDIT</span><span>OWNER</span><span>PROGRESS</span><span>STATUS</span><span>ACTIONS</span></div>{visible.map((audit) => <AuditRow key={audit.id} audit={audit} onOpen={onOpen} onDelete={onDelete} />)}{!visible.length && <div className="empty-state">No audits match this view.</div>}</div>
    <div className="page-footer"><span>{visible.length} audit{visible.length === 1 ? '' : 's'} shown</span><span>Updated just now</span></div>
  </div>;
}

function QualityPage({ audits, onNotice, onOpen }) {
  const reviews = audits.filter((audit) => audit.status === 'In review');
  return <div className="page-content subpage">
    <section className="page-heading"><div><p className="eyebrow"><span className="eyebrow-dot" /> BUILT-IN QUALITY GATES</p><h1>Quality review</h1><p>Catch the gaps before the client sees the work. Quality is part of the assembly process.</p></div><span className="quality-score"><ShieldCheck size={16} /> VE QUALITY STANDARD</span></section>
    <div className="quality-banner"><div className="quality-banner-icon"><ShieldCheck size={22} /></div><div><h2>Good audits earn trust.</h2><p>Every audit moves through the same review gates—so client-specific insight never comes at the expense of consistency.</p></div><span className="quality-banner-stat"><strong>{reviews.length}</strong><small>ready for review</small></span></div>
    <div className="quality-content"><section className="panel review-panel"><div className="panel-heading"><div><p className="eyebrow">REVIEW QUEUE</p><h2>Ready for a second look</h2></div><span className="heading-count">{String(reviews.length).padStart(2, '0')}</span></div>{reviews.length ? reviews.map((audit) => <button className="review-row" type="button" key={audit.id} onClick={() => onOpen(audit)}><span className={`client-avatar ${audit.color}`}>{audit.initials}</span><span className="review-client"><strong>{audit.client}</strong><small>{audit.type} · {audit.modules}</small></span><span className="review-owner">{audit.owner}</span><span className="review-time">Submitted {audit.date}</span><ChevronRight size={16} /></button>) : <div className="empty-state"><CheckCircle2 size={19} /><p>No audits are waiting for review.</p></div>}</section>
      <aside className="panel quality-checklist"><p className="eyebrow">THE REVIEW STANDARD</p><h2>Six checks, every time.</h2><p className="checklist-intro">A consistent gate for work that’s ready to share.</p>{checklist.map((item) => <div className="quality-check" key={item}><span className="check-box" /><span>{item}</span></div>)}<button className="text-link" type="button" onClick={() => onNotice('Record these six checks in each audit’s Quality review step.')}>Open a review checklist <ArrowRight size={14} /></button></aside></div>
  </div>;
}

function AuditWorkspace({ audit, token, reviewer, onAuditUpdated, onDelete, onBack, onNotice }) {
  const [tab, setTab] = useState('profile');
  const selectedKeys = audit.selectedModules || audit.module_keys || starterModules.map((module) => module.id);
  const visibleModules = starterModules.filter((module) => selectedKeys.includes(module.id));
  const initialCompleted = visibleModules.slice(0, Math.round((audit.progress || 0) * visibleModules.length / 100)).map((module) => module.id);
  const cachedDetail = readAuditDetail(audit.id);
  const [completed, setCompleted] = useState(() => cachedDetail.completed || initialCompleted);
  const [moduleRecords, setModuleRecords] = useState({});
  const [localEvidenceCounts, setLocalEvidenceCounts] = useState(() => cachedDetail.evidenceCounts || {});
  const [evidenceOpen, setEvidenceOpen] = useState('');
  const [evidenceDraft, setEvidenceDraft] = useState({ label: '', source_url: '', notes: '' });
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidenceFileInputKey, setEvidenceFileInputKey] = useState(0);
  const [evidenceSaving, setEvidenceSaving] = useState(false);
  const [evidenceItems, setEvidenceItems] = useState(() => cachedDetail.evidenceItems || []);
  const [reportBusy, setReportBusy] = useState(false);
  const [reviewStatus, setReviewStatus] = useState(audit.status);
  const [reviewFeedback, setReviewFeedback] = useState(audit.review_feedback || '');
  const [shareUrl, setShareUrl] = useState('');
  const [shareBusy, setShareBusy] = useState(false);
  const shareInputRef = useRef(null);
  const [findings, setFindings] = useState(() => cachedDetail.findings || []);
  const [findingFormOpen, setFindingFormOpen] = useState(false);
  const [clientViewSection, setClientViewSection] = useState('priorities');
  const [findingDraft, setFindingDraft] = useState({ module: visibleModules[0]?.id || '', title: '', problem: '', why_it_matters: '', evidence: '', impact: '', recommendation: '', strategic_opportunity: '', priority: 'medium', owner_name: '', due_date: '' });
  const completion = visibleModules.length ? Math.round(completed.filter((id) => selectedKeys.includes(id)).length / visibleModules.length * 100) : 0;
  const requiredModules = visibleModules.filter((module) => module.required);
  const auditEditable = reviewStatus === 'In progress' || reviewStatus === 'Needs changes';
  const requiredComplete = requiredModules.every((module) => completed.includes(module.id));
  const evidenceTotal = visibleModules.reduce((sum, module) => sum + (moduleRecords[module.id]?.evidence_count ?? localEvidenceCounts[module.id] ?? 0), 0);
  const scoredModules = visibleModules.filter((module) => Number.isInteger(moduleRecords[module.id]?.assessment_score));
  const averageAssessmentScore = scoredModules.length
    ? Math.round(scoredModules.reduce((total, module) => total + moduleRecords[module.id].assessment_score, 0) / scoredModules.length)
    : null;

  const saveWorkflow = async (updates) => {
    try {
      let updatedAudit = { ...audit, ...updates };
      if (token) {
        const response = await apiRequest(`${API_URL}/api/audits/${audit.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(updates),
        });
        const result = await readApiResponse(response);
        updatedAudit = { ...audit, ...result, selectedModules: audit.selectedModules || audit.module_keys || [] };
      }
      onAuditUpdated(updatedAudit);
      return updatedAudit;
    } catch (error) {
      onNotice(error.message || 'Could not save audit details.');
      throw error;
    }
  };

  const saveQualityChecks = async (checks, notes = '') => {
    try {
      const savedChecks = { ...checks, reviewer_notes: notes };
      let updatedAudit = { ...audit, quality_checks: savedChecks };
      if (token) {
        const response = await apiRequest(`${API_URL}/api/audits/${audit.id}/quality_checks/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ checks, notes }),
        });
        const result = await readApiResponse(response);
        updatedAudit = { ...audit, ...result, selectedModules: audit.selectedModules || audit.module_keys || [] };
      }
      onAuditUpdated(updatedAudit);
      onNotice('Quality checklist saved.');
      return updatedAudit;
    } catch (error) {
      onNotice(error.message || 'Could not save the quality checklist.');
      throw error;
    }
  };

  useEffect(() => {
    if (!token || !Number.isInteger(Number(audit.id))) return undefined;
    const controller = new AbortController();
    apiRequest(`${API_URL}/api/modules/?audit=${audit.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load the audit modules.');
        return response.json();
      })
      .then((data) => {
        const records = data.results || data;
        setModuleRecords(Object.fromEntries(records.map((record) => [record.key, record])));
        setCompleted(records.filter((record) => record.status === 'complete').map((record) => record.key));
      })
      .catch((error) => {
        if (error.name !== 'AbortError') onNotice(error.message);
      });
    return () => controller.abort();
  }, [audit.id, onNotice, token]);

  useEffect(() => {
    if (token) return;
    try {
      localStorage.setItem(`auditflow-detail-${audit.id}`, JSON.stringify({ completed, evidenceCounts: localEvidenceCounts, findings, evidenceItems }));
    } catch {
      onNotice('Could not save audit details in this browser.');
    }
  }, [audit.id, completed, evidenceItems, findings, localEvidenceCounts, onNotice, token]);

  useEffect(() => {
    if (!token || !Number.isInteger(Number(audit.id))) return undefined;
    const controller = new AbortController();
    apiRequest(`${API_URL}/api/findings/?audit=${audit.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load audit findings.');
        return response.json();
      })
      .then((data) => setFindings(data.results || data))
      .catch((error) => {
        if (error.name !== 'AbortError') onNotice(error.message);
      });
    return () => controller.abort();
  }, [audit.id, onNotice, token]);

  useEffect(() => {
    if (!token || !Number.isInteger(Number(audit.id))) return undefined;
    const controller = new AbortController();
    apiRequest(`${API_URL}/api/evidence/?audit=${audit.id}`, { signal: controller.signal })
      .then(readApiResponse)
      .then((data) => setEvidenceItems(data.results || data))
      .catch((error) => {
        if (error.name !== 'AbortError') onNotice(error.message || 'Could not load audit evidence.');
      });
    return () => controller.abort();
  }, [audit.id, onNotice, token]);

  const saveEvidence = async (module) => {
    if (!auditEditable) return;
    const draft = evidenceDraft;
    const label = draft.label.trim() || evidenceFile?.name || '';
    if (!label || (!draft.source_url.trim() && !draft.notes.trim() && !evidenceFile)) {
      onNotice('Add a name and at least one source link, context note, or file.');
      return;
    }
    if (token) {
      const record = moduleRecords[module.id];
      if (!record) {
        onNotice('This module is still loading. Try again in a moment.');
        return;
      }
      try {
        setEvidenceSaving(true);
        const formData = new FormData();
        formData.append('audit', String(audit.id));
        formData.append('module', String(record.id));
        formData.append('label', label);
        formData.append('source_url', draft.source_url.trim());
        formData.append('notes', draft.notes.trim());
        if (evidenceFile) formData.append('attachment', evidenceFile);
        const response = await apiRequest(`${API_URL}/api/evidence/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: formData,
        });
        const savedEvidence = await readApiResponse(response);
        setEvidenceItems((current) => [savedEvidence, ...current]);
        setModuleRecords((current) => ({ ...current, [module.id]: { ...record, evidence_count: record.evidence_count + 1 } }));
      } catch (error) {
        setEvidenceSaving(false);
        onNotice(error.message || 'Could not upload this evidence. Check the file type and 10 MB limit.');
        return;
      }
    } else {
      setLocalEvidenceCounts((current) => ({ ...current, [module.id]: (current[module.id] || 0) + 1 }));
      setEvidenceItems((current) => [{
        id: `local-${Date.now()}`,
        module: module.id,
        label,
        source_url: draft.source_url.trim(),
        notes: draft.notes.trim(),
        attachment_name: '',
        has_attachment: false,
        created_at: new Date().toISOString(),
      }, ...current]);
    }
    setEvidenceDraft({ label: '', source_url: '', notes: '' });
    setEvidenceFile(null);
    setEvidenceFileInputKey((current) => current + 1);
    setEvidenceSaving(false);
    setEvidenceOpen('');
    onNotice(evidenceFile ? 'Evidence file uploaded and saved.' : 'Evidence added to this module.');
  };

  const selectEvidenceFile = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setEvidenceFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      onNotice('Evidence files must be 10 MB or smaller.');
      event.target.value = '';
      setEvidenceFile(null);
      return;
    }
    setEvidenceFile(file);
  };

  const downloadEvidence = async (item) => {
    try {
      const response = await apiRequest(`${API_URL}/api/evidence/${item.id}/download/`);
      if (!response.ok) {
        await readApiResponse(response);
        return;
      }
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = item.attachment_name || item.label;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      onNotice(error.message || 'Could not download this evidence file.');
    }
  };

  const downloadReport = async () => {
    if (reviewStatus !== 'Approved') return;
    setReportBusy(true);
    try {
      const response = await apiRequest(`${API_URL}/api/audits/${audit.id}/report/`);
      if (!response.ok) {
        await readApiResponse(response);
        return;
      }
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${audit.client.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-audit-report.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      onNotice('Approved audit report downloaded.');
    } catch (error) {
      onNotice(error.message || 'Could not generate the audit report.');
    } finally {
      setReportBusy(false);
    }
  };

  const toggleModule = async (module) => {
    if (!auditEditable) return;
    const isDone = completed.includes(module.id);
    if (!isDone && !(moduleRecords[module.id]?.evidence_count ?? localEvidenceCounts[module.id])) {
      setEvidenceOpen(module.id);
      onNotice('Add at least one evidence item before completing this module.');
      return;
    }
    if (token) {
      const record = moduleRecords[module.id];
      if (!record) {
        onNotice('This module is still loading. Try again in a moment.');
        return;
      }
      try {
        const response = await apiRequest(`${API_URL}/api/modules/${record.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: isDone ? 'not_started' : 'complete' }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.status?.[0] || error.detail || 'Could not update this module.');
        }
        setModuleRecords((current) => ({ ...current, [module.id]: { ...record, status: isDone ? 'not_started' : 'complete' } }));
      } catch (error) {
        onNotice(error.message || 'Could not reach the audit server.');
        return;
      }
    }
    setCompleted((current) => isDone ? current.filter((id) => id !== module.id) : [...current, module.id]);
  };

  const saveAssessment = async (module) => {
    if (!auditEditable) return;
    const record = moduleRecords[module.id];
    if (token && !record) {
      onNotice('This assessment is still loading. Try again in a moment.');
      return;
    }
    const payload = {
      assessment_score: record?.assessment_score ?? null,
      assessment_notes: record?.assessment_notes || '',
      benchmark_notes: record?.benchmark_notes || '',
    };
    if (token) {
      try {
        const response = await apiRequest(`${API_URL}/api/modules/${record.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const saved = await readApiResponse(response);
        setModuleRecords((current) => ({ ...current, [module.id]: saved }));
      } catch (error) {
        onNotice(error.message || 'Could not save this assessment.');
        return;
      }
    }
    onNotice(`${module.title} assessment saved.`);
  };

  const updateAssessment = (moduleId, field, value) => {
    setModuleRecords((current) => ({
      ...current,
      [moduleId]: {
        ...(current[moduleId] || {}),
        [field]: value,
      },
    }));
  };

  const submitForReview = async () => {
    if (!requiredComplete) {
      onNotice('Complete all required modules with evidence before requesting review.');
      return;
    }
    let updatedAudit = { ...audit, status: 'In review' };
    if (token) {
      try {
        const response = await apiRequest(`${API_URL}/api/audits/${audit.id}/submit_for_review/`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.detail || 'Could not submit this audit.');
        updatedAudit = { ...audit, ...result, selectedModules: audit.selectedModules || audit.module_keys || [] };
      } catch (error) {
        onNotice(error.message || 'Could not reach the audit server.');
        return;
      }
    }
    setReviewStatus('In review');
    setReviewFeedback('');
    onAuditUpdated(updatedAudit);
    onNotice('Audit submitted for quality review.');
  };

  const approveAudit = async () => {
    try {
      const response = await apiRequest(`${API_URL}/api/audits/${audit.id}/approve/`, { method: 'POST' });
      const result = await readApiResponse(response);
      const updatedAudit = { ...audit, ...result, selectedModules: audit.selectedModules || audit.module_keys || [] };
      setReviewStatus(updatedAudit.status);
      onAuditUpdated(updatedAudit);
      onNotice('Audit approved. You can now create a client share link.');
    } catch (error) {
      onNotice(error.message || 'Could not approve this audit.');
    }
  };

  const requestChanges = async (feedbackValue) => {
    const feedback = feedbackValue.trim();
    if (!feedback) {
      onNotice('Add clear feedback before returning the audit.');
      return;
    }
    try {
      const response = await apiRequest(`${API_URL}/api/audits/${audit.id}/request_changes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });
      const result = await readApiResponse(response);
      const updatedAudit = { ...audit, ...result, selectedModules: audit.selectedModules || audit.module_keys || [] };
      setReviewStatus(updatedAudit.status);
      setReviewFeedback(updatedAudit.review_feedback);
      onAuditUpdated(updatedAudit);
      onNotice('Audit returned to the owner with your review notes.');
    } catch (error) {
      onNotice(error.message || 'Could not return this audit for changes.');
    }
  };

  const createShareLink = async () => {
    setShareBusy(true);
    try {
      const response = await apiRequest(`${API_URL}/api/audits/${audit.id}/share/`, { method: 'POST' });
      const result = await readApiResponse(response);
      const link = new URL(window.location.href);
      link.search = '';
      link.searchParams.set('share', result.token);
      setShareUrl(link.toString());
      onAuditUpdated({ ...audit, shared: true, shared_at: result.shared_at || audit.shared_at, selectedModules: audit.selectedModules || audit.module_keys || [] });
      onNotice(audit.shared ? 'Active client link is ready to copy or preview.' : 'Secure client link created. Anyone with the link can view this approved audit.');
    } catch (error) {
      onNotice(error.message || 'Could not create the client share link.');
    } finally {
      setShareBusy(false);
    }
  };

  const copyShareLink = async () => {
    if (!shareUrl) {
      await createShareLink();
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      onNotice('Client link copied to clipboard.');
    } catch {
      shareInputRef.current?.focus();
      shareInputRef.current?.select();
      onNotice('Copy was blocked by the browser. The link has been selected for you to copy.');
    }
  };

  const revokeShareLink = async () => {
    if (!window.confirm('Revoke this client link? Anyone using it will lose access.')) return;
    try {
      const response = await apiRequest(`${API_URL}/api/audits/${audit.id}/revoke_share/`, { method: 'POST' });
      await readApiResponse(response);
      setShareUrl('');
      onAuditUpdated({ ...audit, shared: false, shared_at: null, selectedModules: audit.selectedModules || audit.module_keys || [] });
      onNotice('Client share link revoked.');
    } catch (error) {
      onNotice(error.message || 'Could not revoke the client link.');
    }
  };

  const closeDeal = async (commercialData) => {
    try {
      if (!token) {
        onAuditUpdated({
          ...audit,
          commercial_data: { ...commercialData, status: 'won' },
          selectedModules: audit.selectedModules || audit.module_keys || [],
        });
      } else {
        await saveWorkflow({ commercial_data: commercialData });
        const response = await apiRequest(`${API_URL}/api/audits/${audit.id}/close_deal/`, { method: 'POST' });
        const result = await readApiResponse(response);
        onAuditUpdated({ ...audit, ...result, selectedModules: audit.selectedModules || audit.module_keys || [] });
      }
      onNotice('Engagement recorded as won.');
    } catch (error) {
      onNotice(error.message || 'Could not record the engagement.');
    }
  };

  const addFinding = async (event) => {
    event.preventDefault();
    if (!auditEditable) return;
    const module = visibleModules.find((item) => item.id === findingDraft.module);
    if (!module) return;
    const payload = { ...findingDraft, module_title: module.title };
    if (token) {
      const moduleRecord = moduleRecords[module.id];
      if (!moduleRecord) {
        onNotice('Audit modules are still loading. Try again in a moment.');
        return;
      }
      try {
        const response = await apiRequest(`${API_URL}/api/findings/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...findingDraft, audit: audit.id, module: moduleRecord.id }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.detail || 'Could not save this finding.');
        setFindings((current) => [{ ...result, module_title: module.title }, ...current]);
      } catch (error) {
        onNotice(error.message || 'Could not reach the audit server.');
        return;
      }
    } else {
      setFindings((current) => [{ ...payload, id: Date.now(), status: 'open' }, ...current]);
    }
    setFindingDraft({ module: visibleModules[0]?.id || '', title: '', problem: '', why_it_matters: '', evidence: '', impact: '', recommendation: '', strategic_opportunity: '', priority: 'medium', owner_name: '', due_date: '' });
    setFindingFormOpen(false);
    onNotice('Evidence-backed finding added to the audit.');
  };

  return <div className="page-content subpage audit-workspace">
    <button className="back-link" type="button" onClick={onBack}><ArrowLeft size={15} /> All audits</button>
    <section className="workspace-heading">
      <div><div className="workspace-title-row"><span className={`client-avatar ${audit.color}`}>{audit.initials}</span><div><p className="eyebrow">{audit.id} <span className="eyebrow-separator">/</span> {audit.type.toUpperCase()}</p><h1>{audit.client}</h1></div></div><p className="workspace-subtitle">A client-specific audit, assembled from VE Studio’s trusted framework.</p></div>
      <div className="workspace-actions">
        {token && reviewStatus === 'Approved' && <button className="button button-dark" type="button" disabled={reportBusy} onClick={downloadReport}><FileCheck2 size={15} /> {reportBusy ? 'Generating…' : 'Download report'}</button>}
        <button className="button button-outline" type="button" disabled={reviewStatus !== 'Approved' || shareBusy} onClick={createShareLink}><ArrowUpRight size={15} /> {shareBusy ? 'Preparing link…' : audit.shared || shareUrl ? 'Open client link' : 'Share audit'}</button>
        <button className="button button-danger" type="button" disabled={!auditEditable} title={auditEditable ? 'Delete this audit' : 'Audits in review or approved cannot be deleted'} onClick={() => onDelete(audit)}><Trash2 size={15} /> Delete audit</button>
      </div>
    </section>
    {(audit.shared || shareUrl) && <section className="share-link-panel" aria-live="polite"><div><strong>Approved client view</strong><small>{shareUrl ? `Secure link active${audit.shared_at ? ` · shared ${audit.shared_at}` : ''}. Anyone with the link can view this approved audit.` : 'A secure client link is active. Open it below to copy, preview, or revoke access.'}</small></div>{shareUrl ? <><input ref={shareInputRef} aria-label="Client share link" readOnly value={shareUrl} onFocus={(event) => event.target.select()} /><a className="button button-outline" href={shareUrl} target="_blank" rel="noreferrer">Preview</a><button className="button button-dark" type="button" onClick={copyShareLink}>Copy link</button></> : <button className="button button-dark" type="button" disabled={shareBusy} onClick={createShareLink}>{shareBusy ? 'Opening…' : 'Reveal link'}</button>}<button className="text-link" type="button" onClick={revokeShareLink}>Revoke access</button></section>}
    <div className="workspace-progress"><span className="workspace-progress-label"><strong>{completion}%</strong> complete</span><span className="progress-track"><i style={{ width: `${completion}%` }} /></span><span>{completed.length} of {visibleModules.length} modules</span><span className="workspace-progress-status"><i /> Autosaved</span></div>
    <div className="workflow-stepper-heading"><span>FULL AUDIT WORKFLOW · 10 STAGES</span><span>Step {Math.max(0, auditWorkflowStages.findIndex(([id]) => id === tab) + 1)} of 10</span></div>
    <nav className="workflow-stepper" aria-label="10-step audit workflow">{auditWorkflowStages.map(([id, label], index) => <button type="button" key={id} className={`workflow-step ${tab === id ? 'active' : ''}`} aria-current={tab === id ? 'step' : undefined} onClick={() => setTab(id)}><span className="workflow-step-index">{String(index + 1).padStart(2, '0')}</span><span>{label}</span></button>)}</nav>
    {tab === 'assessment' ? <><div className="workspace-columns">
      <section className="modules-column">
        <div className="assessment-scorecard"><span><small>AVERAGE HEALTH</small><strong>{averageAssessmentScore === null ? '—' : `${averageAssessmentScore}/100`}</strong></span><span><small>MODULES SCORED</small><strong>{scoredModules.length} / {visibleModules.length}</strong></span><span><small>FINDINGS LOGGED</small><strong>{findings.length}</strong></span></div>
        <div className="module-section-heading"><div><p className="eyebrow">THE BUILDING BLOCKS</p><h2>{tab === 'overview' ? 'Your audit modules' : 'All audit modules'}</h2><p>Complete each module with evidence and client-specific context.</p></div><button type="button" className="text-link" onClick={() => onNotice('Module ordering is managed by the audit template.')}><Menu size={15} /> Manage</button></div>
        <div className="module-list">{visibleModules.map((module, index) => {
          const Icon = module.icon;
          const isDone = completed.includes(module.id);
          const evidenceCount = moduleRecords[module.id]?.evidence_count ?? localEvidenceCounts[module.id] ?? 0;
          const moduleEvidence = evidenceItems.filter((item) => String(item.module) === String(moduleRecords[module.id]?.id || module.id));
          return <article className={`module-card ${isDone ? 'module-done' : ''}`} key={module.id}>
            <button className="module-main" type="button" onClick={() => onNotice(`${module.title}: ${module.questions} guided checks · evidence: ${module.evidence}.`)}>
              <span className="module-index">{String(index + 1).padStart(2, '0')}</span><span className={`module-icon ${module.id}`}><Icon size={17} /></span>
              <span className="module-info"><span className="module-cat">{module.category} {module.required && <i>· REQUIRED</i>}</span><strong>{module.title}</strong><small>{module.description}</small></span>
              <span className={`module-status ${isDone ? 'done' : ''}`}>{isDone ? <><CheckCircle2 size={15} /> Complete</> : <><span className="empty-ring" /> Not started</>}</span><ChevronRight className="module-chevron" size={16} />
            </button>
            <div className="module-footer"><span><FileText size={13} /> {module.questions} guided checks</span><span><Upload size={13} /> {evidenceCount} evidence item{evidenceCount === 1 ? '' : 's'}</span><button type="button" disabled={!auditEditable} className="module-toggle" onClick={() => { setEvidenceOpen(evidenceOpen === module.id ? '' : module.id); setEvidenceDraft({ label: '', source_url: '', notes: '' }); }}><Plus size={12} /> Add evidence</button><button type="button" disabled={!auditEditable} className={isDone ? 'module-toggle done-toggle' : 'module-toggle'} onClick={() => toggleModule(module)}>{isDone ? 'Mark incomplete' : 'Mark complete'} <Check size={13} /></button></div>
            <div className="module-assessment-editor">
              <label>Assessment score<input type="number" min="0" max="100" value={moduleRecords[module.id]?.assessment_score ?? ''} disabled={!auditEditable} onChange={(event) => updateAssessment(module.id, 'assessment_score', event.target.value === '' ? null : Number(event.target.value))} placeholder="0–100" /></label>
              <label>Assessment notes<textarea rows="2" value={moduleRecords[module.id]?.assessment_notes || ''} disabled={!auditEditable} onChange={(event) => updateAssessment(module.id, 'assessment_notes', event.target.value)} placeholder="Observed strengths, gaps, and supporting evidence." /></label>
              <label>Competitor / benchmark notes<textarea rows="2" value={moduleRecords[module.id]?.benchmark_notes || ''} disabled={!auditEditable} onChange={(event) => updateAssessment(module.id, 'benchmark_notes', event.target.value)} placeholder="Record the comparison and its source, when available." /></label>
              <button type="button" className="module-toggle" disabled={!auditEditable} onClick={() => saveAssessment(module)}>Save assessment <Check size={13} /></button>
            </div>
            {moduleEvidence.length > 0 && <div className="evidence-list">{moduleEvidence.map((item) => <article className="evidence-item" key={item.id}><span className="evidence-file-icon"><FileText size={15} /></span><span className="evidence-item-copy"><strong>{item.label}</strong><small>{item.attachment_name || (item.source_url ? 'Source link' : 'Evidence note')}{item.attachment_size ? ` · ${(item.attachment_size / 1024 / 1024).toFixed(1)} MB` : ''}</small>{item.notes && <small>{item.notes}</small>}</span>{item.source_url && <a className="evidence-source-link" href={item.source_url} target="_blank" rel="noreferrer">Open source <ArrowUpRight size={12} /></a>}{item.has_attachment && <button className="evidence-download" type="button" onClick={() => downloadEvidence(item)} aria-label={`Download ${item.attachment_name}`}><FileCheck2 size={15} /></button>}</article>)}</div>}
            {evidenceOpen === module.id && <div className="evidence-entry"><label>Evidence name<input value={evidenceDraft.label} onChange={(event) => setEvidenceDraft({ ...evidenceDraft, label: event.target.value })} placeholder={evidenceFile?.name || 'e.g. GA4 acquisition report'} /></label><label>Source URL<input type="url" value={evidenceDraft.source_url} onChange={(event) => setEvidenceDraft({ ...evidenceDraft, source_url: event.target.value })} placeholder="https://..." /></label><label className="evidence-notes">Context or observation<textarea value={evidenceDraft.notes} onChange={(event) => setEvidenceDraft({ ...evidenceDraft, notes: event.target.value })} placeholder="What does this evidence tell us?" rows="2" /></label><label className="evidence-file-input">Upload evidence file<input key={evidenceFileInputKey} type="file" accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.docx,.txt" onChange={selectEvidenceFile} />{evidenceFile && <small>{evidenceFile.name} · {(evidenceFile.size / 1024 / 1024).toFixed(1)} MB · max 10 MB</small>}</label><div className="evidence-entry-actions"><button type="button" disabled={evidenceSaving} onClick={() => { setEvidenceOpen(''); setEvidenceFile(null); setEvidenceFileInputKey((current) => current + 1); }}>Cancel</button><button type="button" disabled={evidenceSaving} onClick={() => saveEvidence(module)}>{evidenceSaving ? 'Uploading…' : 'Save evidence'} {!evidenceSaving && <Check size={13} />}</button></div></div>}
          </article>;
        })}</div>
      </section>
      <aside className="workspace-sidebar">
        <div className="panel audit-health"><div className="side-card-heading"><span className="health-icon"><Activity size={16} /></span><span><strong>Audit health</strong><small>Everything in one view</small></span><MoreHorizontal size={17} /></div>
          <div className="health-gauge"><div className="gauge-ring" style={{ '--gauge-progress': `${completion * 3.6}deg` }}><span>{completion}<small>%</small></span></div><div><strong>{completion > 70 ? 'Looking good' : 'Getting started'}</strong><small>Completion score</small></div></div>
          <div className="health-row"><span>Required modules</span><strong>{completed.filter((id) => requiredModules.some((module) => module.id === id)).length}/{requiredModules.length} complete</strong></div>
          <div className="health-row"><span>Evidence items</span><strong>{evidenceTotal} added</strong></div>
          <div className="health-row"><span>Quality review</span><span className="health-pending">{reviewStatus}</span></div>
          {reviewStatus === 'Needs changes' && <div className="review-feedback"><strong>Reviewer feedback</strong><p>{reviewFeedback}</p></div>}
          <button className="button button-dark full-width" type="button" onClick={() => setTab('quality')}>{reviewer && reviewStatus === 'In review' ? 'Complete quality review' : reviewStatus === 'Approved' ? 'View approval checks' : 'Continue audit workflow'} <ArrowRight size={15} /></button>
        </div>
        <div className="evidence-card"><div className="evidence-icon"><LockKeyhole size={15} /></div><div><strong>Evidence-first, always</strong><p>Every scored check asks for its source—so the client sees the why, not just the what.</p><button type="button" onClick={() => onNotice('Evidence can include analytics exports, URLs, screenshots, and client-provided files.')}>What counts as evidence? <ArrowRight size={13} /></button></div></div>
        <div className="client-context"><div className="context-title"><span><Users size={15} /></span><strong>Client context</strong><button type="button" onClick={() => setTab('profile')}><MoreHorizontal size={17} /></button></div><p>{audit.goal || 'Keep this audit grounded in what makes this client different.'}</p><button type="button" className="add-context" onClick={() => setTab('profile')}><Plus size={14} /> Edit client profile</button></div>
      </aside>
    </div><div className="workflow-stage-navigation"><button className="button button-outline" type="button" onClick={() => setTab('assets')}><ArrowLeft size={14} /> Previous stage</button><button className="button button-primary" type="button" onClick={() => setTab('findings')}>Continue to findings <ArrowRight size={14} /></button></div></> : tab === 'findings' ? <section className="findings-workspace">
      <div className="findings-heading"><div><p className="eyebrow">EVIDENCE → IMPACT → ACTION</p><h2>Findings & recommendations</h2><p>Make every opportunity specific, supported, and ready to act on.</p></div><button className="button button-primary" type="button" disabled={!auditEditable} onClick={() => setFindingFormOpen(!findingFormOpen)}><Plus size={15} /> Add a finding</button></div>
      {auditEditable && findingFormOpen && <form className="finding-form panel" onSubmit={addFinding}>
        <div className="finding-form-heading"><div><span className="placeholder-icon"><Target size={17} /></span><span><strong>New audit finding</strong><small>Capture the signal, why it matters, and the next step.</small></span></div><button type="button" className="icon-action" aria-label="Close finding form" onClick={() => setFindingFormOpen(false)}><X size={16} /></button></div>
        <label>Finding title<input required maxLength="220" value={findingDraft.title} onChange={(event) => setFindingDraft({ ...findingDraft, title: event.target.value })} placeholder="Describe the opportunity or issue" /></label>
        <label>Audit module<select value={findingDraft.module} onChange={(event) => setFindingDraft({ ...findingDraft, module: event.target.value })}>{visibleModules.map((module) => <option value={module.id} key={module.id}>{module.title}</option>)}</select></label>
        <label>The problem<textarea required rows="2" value={findingDraft.problem} onChange={(event) => setFindingDraft({ ...findingDraft, problem: event.target.value })} placeholder="Describe the issue or opportunity you observed." /></label>
        <label>Why it matters<textarea required rows="2" value={findingDraft.why_it_matters} onChange={(event) => setFindingDraft({ ...findingDraft, why_it_matters: event.target.value })} placeholder="Explain the client-specific relevance." /></label>
        <label>Evidence<input required value={findingDraft.evidence} onChange={(event) => setFindingDraft({ ...findingDraft, evidence: event.target.value })} placeholder="What did you observe? Include a source or metric." /></label>
        <label>Business impact (measured or estimated)<textarea required rows="2" value={findingDraft.impact} onChange={(event) => setFindingDraft({ ...findingDraft, impact: event.target.value })} placeholder="Explain the client or commercial impact; state assumptions if it is estimated." /></label>
        <label>Actionable solution<textarea required rows="2" value={findingDraft.recommendation} onChange={(event) => setFindingDraft({ ...findingDraft, recommendation: event.target.value })} placeholder="Define the specific action and intended outcome." /></label>
        <label>Strategic opportunity<textarea required rows="2" value={findingDraft.strategic_opportunity} onChange={(event) => setFindingDraft({ ...findingDraft, strategic_opportunity: event.target.value })} placeholder="What longer-term advantage could this create?" /></label>
        <div className="finding-form-row"><label>Priority<select value={findingDraft.priority} onChange={(event) => setFindingDraft({ ...findingDraft, priority: event.target.value })}><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label><label>Suggested owner<input value={findingDraft.owner_name} onChange={(event) => setFindingDraft({ ...findingDraft, owner_name: event.target.value })} placeholder="Optional" /></label><label>Target date<input type="date" value={findingDraft.due_date} onChange={(event) => setFindingDraft({ ...findingDraft, due_date: event.target.value })} /></label></div>
        <div className="finding-form-actions"><button type="button" onClick={() => setFindingFormOpen(false)}>Cancel</button><button type="submit">Save finding <Check size={14} /></button></div>
      </form>}
      {findings.length ? <div className="finding-list">{findings.map((finding) => <article className="finding-card panel" key={finding.id}><div className="finding-card-head"><span className={`priority-mark priority-${finding.priority}`}><i />{finding.priority || 'medium'} priority</span><span>{finding.module_title || visibleModules.find((module) => module.id === finding.module)?.title || 'Audit finding'}</span><span className="finding-state">{finding.status || 'open'}</span></div><h3>{finding.title}</h3><div className="finding-content-grid"><div><small>THE PROBLEM</small><p>{finding.problem || finding.evidence}</p></div><div><small>WHY IT MATTERS</small><p>{finding.why_it_matters || finding.impact}</p></div><div><small>EVIDENCE</small><p>{finding.evidence}</p></div><div><small>BUSINESS IMPACT</small><p>{finding.impact}</p></div><div><small>ACTIONABLE SOLUTION</small><p>{finding.recommendation}</p></div><div><small>STRATEGIC OPPORTUNITY</small><p>{finding.strategic_opportunity || 'Not specified'}</p></div></div><div className="finding-card-foot"><span>{finding.owner_name ? `Suggested owner: ${finding.owner_name}` : 'Owner to be assigned'}</span><span>{finding.due_date ? `Target: ${finding.due_date}` : 'No target date'}</span></div></article>)}</div> : <div className="panel empty-findings"><span className="placeholder-icon"><Target size={21} /></span><h3>Turn observations into action.</h3><p>Each finding links evidence to impact, then gives the client a specific next step.</p><button className="button button-outline" type="button" onClick={() => setFindingFormOpen(true)}><Plus size={15} /> Add your first finding</button></div>}
      <div className="workflow-stage-navigation"><button className="button button-outline" type="button" onClick={() => setTab('assessment')}><ArrowLeft size={14} /> Previous stage</button><button className="button button-primary" type="button" onClick={() => setTab('roadmap')}>Continue to roadmap <ArrowRight size={14} /></button></div>
    </section> : <AuditWorkflow
      step={tab}
      audit={audit}
      reviewer={reviewer}
      reviewStatus={reviewStatus}
      progress={completion}
      auditEditable={auditEditable}
      assessmentScore={averageAssessmentScore}
      scoredModules={scoredModules.length}
      evidenceCount={evidenceTotal}
      findings={findings}
      moduleScores={scoredModules.map((module) => ({
        title: moduleRecords[module.id]?.title || module.title,
        score: moduleRecords[module.id].assessment_score,
      }))}
      onSave={saveWorkflow}
      onSaveChecks={saveQualityChecks}
      onSubmit={submitForReview}
      onApprove={approveAudit}
      onRequestChanges={requestChanges}
      onCloseDeal={closeDeal}
      onDownloadReport={downloadReport}
      onCreateShare={createShareLink}
      shareUrl={shareUrl}
      onCopyShare={copyShareLink}
      onRevokeShare={revokeShareLink}
      onNavigate={setTab}
      onNotice={onNotice}
    >
      {tab === 'delivery' && <div className="panel client-preview"><div className="preview-client-top"><span className="preview-client-brand">FIELDNOTES <i>×</i> {audit.client.toUpperCase()}</span><span className="client-preview-badge"><LockKeyhole size={12} /> INTERACTIVE CLIENT VIEW</span></div><div className="client-preview-content"><p className="eyebrow">A CLEARER PATH TO GROWTH</p><h2>Your digital growth<br />opportunities.</h2><p>Your audit brings together the signals, the story behind them, and a practical plan to move forward.</p><div className="client-preview-tabs">{['priorities', 'action plan'].map((section) => <button type="button" key={section} className={clientViewSection === section ? 'active' : ''} onClick={() => setClientViewSection(section)}>{section === 'action plan' ? 'Action plan' : 'Key priorities'}</button>)}</div>{clientViewSection === 'priorities' ? findings.length ? findings.slice(0, 3).map((finding, index) => <article className="client-priority" key={finding.id}><span>0{index + 1}</span><div><strong>{finding.title}</strong><p>{finding.impact}</p></div><ChevronRight size={15} /></article>) : <div className="preview-note"><Sparkles size={16} /> Evidence-backed findings will appear here after they are added to the audit.</div> : <div className="client-action-plan">{findings.length ? findings.map((finding) => <div key={finding.id}><CheckCircle2 size={15} /><span><strong>{finding.recommendation}</strong><small>{finding.owner_name || 'Owner to be assigned'}{finding.due_date ? ` · ${finding.due_date}` : ''}</small></span></div>) : <p>Your prioritized actions will appear here when the audit findings are ready.</p>}</div>}<div className="preview-score"><span>Audit progress</span><strong>{completion}%</strong><span className="progress-track"><i style={{ width: `${completion}%` }} /></span></div><button className="client-followup" type="button" onClick={() => onNotice('Follow-up opportunity noted. Your VE team can use this in the client discussion.')}><MessageSquareText size={15} /> Discuss these opportunities with VE <ArrowRight size={14} /></button></div></div>}
    </AuditWorkflow>}
  </div>;
}

function AuditWizard({ ownerName, onClose, onCreate }) {
  const [step, setStep] = useState(1);
  const [client, setClient] = useState('');
  const [auditType, setAuditType] = useState('Digital growth audit');
  const [selectedModules, setSelectedModules] = useState(starterModules.map((module) => module.id));
  const [goal, setGoal] = useState('');
  const requiredIds = starterModules.filter((module) => module.required).map((module) => module.id);
  const toggleModule = (id) => {
    if (requiredIds.includes(id)) return;
    setSelectedModules(selectedModules.includes(id) ? selectedModules.filter((item) => item !== id) : [...selectedModules, id]);
  };
  const submit = () => {
    if (!client.trim()) return;
    const clientName = client.trim();
    const initialsText = clientName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
    onCreate({ id: `AUD-${String(Date.now()).slice(-4)}`, client: clientName, initials: initialsText, color: ['peach', 'mint', 'lavender', 'blue'][Math.floor(Math.random() * 4)], type: auditType, owner: ownerName, date: new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date()), progress: 0, status: 'In progress', modules: `0 of ${selectedModules.length} modules`, goal: goal.trim(), selectedModules });
  };
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="wizard-modal" role="dialog" aria-modal="true" aria-labelledby="wizard-title">
    <div className="wizard-header"><div className="wizard-heading"><span className="wizard-mark"><Sparkles size={17} /></span><span><p className="eyebrow">QUICK SETUP · FULL 10-STAGE WORKFLOW FOLLOWS</p><h2 id="wizard-title">Build an audit</h2></span></div><button className="icon-action" type="button" aria-label="Close dialog" onClick={onClose}><X size={18} /></button></div>
    <div className="wizard-stepper">{['Client & scope', 'Choose modules', 'Review & create'].map((label, index) => <div className={`step-item ${step === index + 1 ? 'current' : ''} ${step > index + 1 ? 'finished' : ''}`} key={label}><span className="step-number">{step > index + 1 ? <Check size={13} /> : `0${index + 1}`}</span><span>{label}</span>{index < 2 && <i />}</div>)}</div>
    <div className="wizard-body">
      {step === 1 && <><div className="wizard-intro"><h3>Start with the client.</h3><p>A little context now makes every module more relevant later.</p></div><label className="field-label">Client or business name <span>REQUIRED</span><input autoFocus value={client} onChange={(event) => setClient(event.target.value)} placeholder="e.g. Northstar Living" /></label><label className="field-label">Audit framework<select value={auditType} onChange={(event) => setAuditType(event.target.value)}><option>Digital growth audit</option><option>SEO & content audit</option><option>Paid media audit</option><option>Website & conversion audit</option></select></label><label className="field-label">What prompted this audit? <span>OPTIONAL</span><textarea value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="A short note on the client’s goals, challenge, or opportunity..." rows="3" /></label><div className="helper-note"><LockKeyhole size={14} /> Client context stays with the audit and shapes the recommendations.</div></>}
      {step === 2 && <><div className="wizard-intro"><h3>Pick your building blocks.</h3><p>The right audit for this client—not a one-size-fits-all checklist.</p></div><div className="module-picker">{starterModules.map((module) => { const Icon = module.icon; const checked = selectedModules.includes(module.id); return <button type="button" className={`picker-row ${checked ? 'picker-selected' : ''}`} key={module.id} onClick={() => toggleModule(module.id)}><span className={`picker-icon ${module.id}`}><Icon size={16} /></span><span className="picker-copy"><strong>{module.title}</strong><small>{module.description}</small></span><span className={`picker-check ${checked ? 'checked' : ''}`}>{checked && <Check size={12} />}</span></button>; })}</div><div className="helper-note"><ShieldCheck size={14} /> {requiredIds.length} core modules are locked in to protect audit quality.</div></>}
      {step === 3 && <><div className="wizard-intro"><h3>Ready to make it yours?</h3><p>Your audit workspace is assembled. You can refine it as you learn more.</p></div><div className="review-summary"><div className="summary-icon"><Users size={18} /></div><div><small>CLIENT</small><strong>{client || 'Untitled client'}</strong></div><span className="summary-divider" /><div><small>FRAMEWORK</small><strong>{auditType}</strong></div></div><div className="review-selection"><span className="review-selection-title">YOUR MODULES <strong>{selectedModules.length} selected</strong></span>{starterModules.filter((module) => selectedModules.includes(module.id)).map((module, index) => <div className="review-module" key={module.id}><span>{String(index + 1).padStart(2, '0')}</span><strong>{module.title}</strong>{module.required && <i>REQUIRED</i>}<CheckCircle2 size={14} /></div>)}</div><div className="helper-note"><ShieldCheck size={14} /> Your audit starts as a private draft. Nothing is shared with the client until you approve it.</div></>}
    </div>
    <div className="wizard-footer"><button type="button" className="button button-quiet" onClick={step === 1 ? onClose : () => setStep(step - 1)}>{step === 1 ? 'Cancel' : <><ArrowLeft size={15} /> Back</>}</button><span>Setup {step} of 3 · next: 10 audit stages</span>{step < 3 ? <button type="button" className="button button-primary" disabled={step === 1 && !client.trim()} onClick={() => setStep(step + 1)}>Continue <ArrowRight size={15} /></button> : <button type="button" className="button button-primary" onClick={submit}>Create audit <ArrowRight size={15} /></button>}</div>
  </section></div>;
}

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function statusClass(status) {
  return status === 'Complete' ? 'status-complete' : status === 'In review' ? 'status-review' : 'status-progress';
}

export default App;
