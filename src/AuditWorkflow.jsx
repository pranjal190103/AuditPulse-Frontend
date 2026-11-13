import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight,
  Download, ExternalLink, FileCheck2, Globe2, LockKeyhole, Play, Plus, Presentation, RotateCw, ShieldCheck, Trash2,
} from 'lucide-react';

const qualityItems = [
  ['completeness', 'Completeness', 'Required audit areas and evidence are present; no placeholder sections remain.'],
  ['technical_accuracy', 'Technical accuracy', 'Metrics, technical statements, and source evidence have been cross-checked.'],
  ['client_relevance', 'Client relevance', 'Findings and recommendations reflect this client’s goals and constraints.'],
  ['clarity', 'Clarity and tone', 'The narrative is clear, professional, and understandable to the client.'],
  ['design', 'Design and evidence', 'Evidence cards, annotations, and the client-facing report are ready to share.'],
  ['methodology', 'Methodology', 'The audit follows the approved framework and uses evidence-led conclusions.'],
];

const packages = [
  {
    id: 'foundation-sprint',
    name: 'Foundation Fix Sprint',
    price: 4500,
    cadence: '14-day pilot',
    description: 'A focused pilot for urgent remediation and a clear path into the 90-day roadmap.',
    includes: ['Tracking and conversion quick wins', 'Technical remediation', 'One focused implementation sprint'],
  },
  {
    id: 'omnichannel-scale',
    name: 'Omnichannel Scale Retainer',
    price: 8500,
    cadence: 'per month',
    description: 'A 90-day engagement to execute the agreed roadmap across channels.',
    includes: ['Execution of the 30/60/90-day roadmap', 'Paid media and CRO optimization', 'Bi-weekly growth reviews'],
    recommended: true,
  },
  {
    id: 'category-dominance',
    name: 'Category Dominance Squad',
    price: 14500,
    cadence: 'per month',
    description: 'A dedicated cross-functional team for broader growth initiatives.',
    includes: ['Dedicated full-stack engineering capacity', 'Retention and lifecycle automation', 'Direct collaboration and priority support'],
  },
];

const stages = [
  ['profile', 'Client profile'],
  ['team', 'Audit team'],
  ['assets', 'Client assets'],
  ['assessment', 'Assessment'],
  ['findings', 'Findings'],
  ['roadmap', 'Roadmap'],
  ['quality', 'Quality review'],
  ['report', 'Final report'],
  ['delivery', 'Client delivery'],
  ['commercial', 'Follow-up'],
];

const industryOptions = [
  'DTC E-commerce / Modern Home Goods',
  'B2B SaaS / Financial Enterprise',
  'Healthcare and Medical Practice',
  'Professional and Legal Services',
];
const auditCategoryOptions = [
  'Full 360-Degree Growth Audit (Comprehensive)',
  'Technical SEO & Core Web Vitals Deep Dive',
  'Paid Performance Media & Ad ROAS Optimization',
  'Conversion Rate Optimization (CRO) & Funnel UX',
  'Local Search',
  'Business & Reputation',
];
const assetCategories = [
  { name: 'Website & sitemap', title: 'Website & sitemap', detail: 'Primary domain, key pages, and sitemap references.' },
  { name: 'Google Business Profile', title: 'Google Business Profile', detail: 'Listing URL or client-provided access confirmation.' },
  { name: 'Analytics & pixels', title: 'Analytics & pixels', detail: 'GA4, tag manager, ad pixels, and measurement references.' },
  { name: 'Search Console', title: 'Search Console', detail: 'Property reference and team-recorded access status.' },
  { name: 'Social media', title: 'Social media', detail: 'Client social profiles relevant to the audit scope.' },
  { name: 'Competitor', title: 'Competitors', detail: 'Competitor domains and the source of each comparison.' },
  { name: 'Other', title: 'Other assets', detail: 'Additional client-provided assets or platform references.' },
];
const defaultTeam = { lead_name: '', lead_role: '', sla: 'Standard (5 business days)', notes: '', smes: [] };
const defaultRoadmap = { kpis: [], items: [] };
const defaultDelivery = { presenter: '', scheduled_at: '', meeting_url: '', agenda: '' };
const defaultCommercial = {
  package_id: '',
  package_name: '',
  price: '',
  cadence: '',
  status: 'not_started',
  consultation_status: 'not_scheduled',
  consultation_at: '',
  resource_allocation: [
    { role: 'Lead strategist', hours: 20 },
    { role: 'Paid media architect', hours: 35 },
    { role: 'CRO & UX engineer', hours: 30 },
    { role: 'Analytics engineer', hours: 15 },
  ],
  notes: '',
};

function WorkflowField({ label, value, onChange, type = 'text', placeholder = '', rows, readOnly = false }) {
  const Control = rows ? 'textarea' : 'input';
  return <label className="workflow-field">
    <span>{label}</span>
    <Control
      type={rows ? undefined : type}
      rows={rows}
      value={value ?? ''}
      placeholder={placeholder}
      readOnly={readOnly}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>;
}

function StageNavigation({ previousStep, nextStep, onPrevious, onContinue, saving, editable = true, requiresSave = false }) {
  return <div className="workflow-stage-navigation">
    {previousStep ? <button className="button button-outline" type="button" disabled={saving} onClick={onPrevious}><ArrowLeft size={14} /> Previous stage</button> : <span />}
    {nextStep && <button className="button button-primary" type="button" disabled={saving || (requiresSave && !editable)} onClick={onContinue}>{saving ? 'Saving…' : requiresSave ? 'Save & continue' : 'Continue'} <ArrowRight size={14} /></button>}
  </div>;
}

function StagePanel({ eyebrow, title, description, children, onSave, saving, actionText = 'Save changes', footer, navigation, editable = true }) {
  return <section className="workflow-panel panel">
    <header className="workflow-panel-heading">
      <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{description}</p></div>
    </header>
    <fieldset className="workflow-panel-body" disabled={!editable}>{children}</fieldset>
    {(onSave || footer || navigation) && <footer className="workflow-panel-footer">
      {footer}
      {onSave && <button className="button button-primary" type="button" disabled={saving || !editable} onClick={onSave}>{saving ? 'Saving…' : actionText} <Check size={14} /></button>}
      {navigation}
    </footer>}
  </section>;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function PresentationDeck({ audit, findings, roadmap, moduleScores, assessmentScore, onClose }) {
  const slides = useMemo(() => [
    { title: audit.client || 'Client audit', subtitle: audit.type || 'Digital growth audit', body: [audit.audit_category, audit.goal, audit.website_url, audit.industry].filter(Boolean).join('\n') || 'Client-specific audit scope and business objective.' },
    { title: 'Marketing health score', subtitle: 'Assessment & evidence', body: [`Average scored-module health: ${assessmentScore === null ? 'not scored' : `${assessmentScore}/100`}`, ...moduleScores.map((item) => `${item.title}: ${item.score}/100`)].join('\n') || 'Score audit modules to summarize current health.' },
    { title: 'Priority findings', subtitle: 'Evidence · impact · action', body: findings.slice(0, 3).map((finding, index) => `${index + 1}. ${finding.title} (${finding.priority || 'priority'})\nEvidence: ${finding.evidence || 'Not provided'}\nBusiness impact: ${finding.impact || 'Not quantified'}\nActionable solution: ${finding.recommendation || 'Not provided'}`).join('\n\n') || 'Add evidence-backed findings to present the highest-priority opportunities.' },
    { title: '30 / 60 / 90-day roadmap', subtitle: 'Sequenced execution', body: (roadmap.items || []).map((item) => `${item.phase}: ${item.title}${item.owner ? ` · ${item.owner}` : ''}${item.description ? `\n${item.description}` : ''}`).join('\n\n') || 'Add roadmap actions to shape a practical implementation plan.' },
    { title: 'Agree the next step', subtitle: 'Client debrief & follow-up', body: audit.delivery_data?.agenda || 'Review the evidence and recommendations together, confirm priorities, and agree owners and next steps.' },
  ], [assessmentScore, audit.audit_category, audit.client, audit.delivery_data?.agenda, audit.goal, audit.industry, audit.type, audit.website_url, findings, moduleScores, roadmap.items]);
  const [slide, setSlide] = useState(0);

  const downloadPresentation = () => {
    const slideMarkup = slides.map((item, index) => `
      <section class="slide">
        <p class="eyebrow">${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')} · ${escapeHtml(item.subtitle)}</p>
        <h1>${escapeHtml(item.title)}</h1>
        <p class="body">${escapeHtml(item.body)}</p>
        <footer>FIELDNOTES · VE STUDIO <span>${escapeHtml(audit.client)} · ${index + 1} / ${slides.length}</span></footer>
      </section>`).join('');
    const documentHtml = `<!doctype html>
      <html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${escapeHtml(audit.client)} — Audit presentation</title>
      <style>
        *{box-sizing:border-box}body{margin:0;background:#e8e9e3;color:#30352b;font-family:Arial,sans-serif}
        @page{size:A4 landscape;margin:0}
        .slide{position:relative;display:flex;flex-direction:column;justify-content:center;min-height:100vh;padding:10vh 12vw;background:#fafbf7;page-break-after:always;break-after:page}
        .eyebrow{color:#758166;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase}
        h1{max-width:900px;margin:12px 0 24px;font-size:clamp(42px,7vw,82px);line-height:1.05;letter-spacing:-2px}
        .body{max-width:800px;color:#686d60;font-size:clamp(18px,2.4vw,25px);line-height:1.7;white-space:pre-wrap}
        footer{position:absolute;right:6vw;bottom:5vh;left:6vw;display:flex;justify-content:space-between;border-top:1px solid #e1e4da;padding-top:12px;color:#73796a;font-size:11px;font-weight:700;letter-spacing:.7px}
        @media print{body{background:#fff}.slide{width:297mm;height:210mm;min-height:0;padding:20mm 30mm;print-color-adjust:exact;-webkit-print-color-adjust:exact}footer{right:18mm;bottom:12mm;left:18mm}}
      </style></head><body>${slideMarkup}</body></html>`;
    const file = new Blob([documentHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(audit.client || 'client').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '') || 'client'}-audit-presentation.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') setSlide((value) => Math.min(slides.length - 1, value + 1));
      if (event.key === 'ArrowLeft') setSlide((value) => Math.max(0, value - 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, slides.length]);

  return <div className="presentation-overlay" role="dialog" aria-modal="true" aria-label="Client audit presentation">
    <div className="presentation-window">
      <header><span><Presentation size={16} /> FIELDNOTES · CLIENT BRIEFING</span><div className="presentation-header-actions"><button type="button" onClick={downloadPresentation}><Download size={14} /> Download slides (.html)</button><button type="button" onClick={onClose}>Close <span aria-hidden="true">×</span></button></div></header>
      <main className="presentation-slide">
        <p className="eyebrow">0{slide + 1} / 0{slides.length} · {slides[slide].subtitle}</p>
        <h2>{slides[slide].title}</h2>
        <p>{slides[slide].body}</p>
      </main>
      <footer><span>Use ← → keys · print the downloaded HTML deck to PDF</span><div><button type="button" disabled={slide === 0} onClick={() => setSlide((value) => value - 1)}><ChevronLeft size={16} /> Previous</button><button type="button" disabled={slide === slides.length - 1} onClick={() => setSlide((value) => value + 1)}>Next <ChevronRight size={16} /></button></div></footer>
    </div>
  </div>;
}

export default function AuditWorkflow({
  step, audit, reviewer, reviewStatus, progress, auditEditable, assessmentScore, scoredModules,
  evidenceCount, findings, moduleScores = [], onSave, onSaveChecks, onSubmit,
  onApprove, onRequestChanges, onCloseDeal, onDownloadReport, onCreateShare,
  shareUrl, onCopyShare, onRevokeShare, onNavigate, onNotice, children,
}) {
  const [form, setForm] = useState(() => ({
    client: audit.client || '',
    contact_email: audit.contact_email || '',
    website_url: audit.website_url || '',
    industry: audit.industry || '',
    audit_category: audit.audit_category || '',
    goal: audit.goal || '',
    team_assignments: { ...defaultTeam, ...(audit.team_assignments || {}) },
    client_assets: audit.client_assets || [],
    roadmap_data: {
      ...defaultRoadmap,
      ...(audit.roadmap_data || {}),
      kpis: Array.isArray(audit.roadmap_data?.kpis) ? audit.roadmap_data.kpis : [],
      items: Array.isArray(audit.roadmap_data?.items) ? audit.roadmap_data.items : [],
    },
    quality_checks: audit.quality_checks || {},
    delivery_data: { ...defaultDelivery, ...(audit.delivery_data || {}) },
    commercial_data: { ...defaultCommercial, ...(audit.commercial_data || {}) },
  }));
  const [busy, setBusy] = useState(false);
  const [assetDraft, setAssetDraft] = useState({ category: 'Website & sitemap', label: '', url: '', notes: '', status: 'pending' });
  const [smeDraft, setSmeDraft] = useState({ name: '', expertise: '' });
  const [kpiDraft, setKpiDraft] = useState({ name: '', baseline: '', target: '', unit: '' });
  const [roadmapDraft, setRoadmapDraft] = useState({ title: '', phase: 'Days 1–30', description: '', owner: '' });
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [presentationOpen, setPresentationOpen] = useState(false);
  const [inspectionResult, setInspectionResult] = useState(null);
  const [industryChoice, setIndustryChoice] = useState(industryOptions.includes(audit.industry) ? audit.industry : audit.industry ? 'Other' : '');
  const [industryCustom, setIndustryCustom] = useState(industryOptions.includes(audit.industry) ? '' : audit.industry || '');
  const [auditCategoryChoice, setAuditCategoryChoice] = useState(auditCategoryOptions.includes(audit.audit_category) ? audit.audit_category : audit.audit_category ? 'Other' : '');
  const [auditCategoryCustom, setAuditCategoryCustom] = useState(auditCategoryOptions.includes(audit.audit_category) ? '' : audit.audit_category || '');

  useEffect(() => {
    const industryIsKnown = industryOptions.includes(audit.industry);
    const categoryIsKnown = auditCategoryOptions.includes(audit.audit_category);
    setForm({
      client: audit.client || '',
      contact_email: audit.contact_email || '',
      website_url: audit.website_url || '',
      industry: audit.industry || '',
      audit_category: audit.audit_category || '',
      goal: audit.goal || '',
      team_assignments: { ...defaultTeam, ...(audit.team_assignments || {}) },
      client_assets: audit.client_assets || [],
      roadmap_data: {
        ...defaultRoadmap,
        ...(audit.roadmap_data || {}),
        kpis: Array.isArray(audit.roadmap_data?.kpis) ? audit.roadmap_data.kpis : [],
        items: Array.isArray(audit.roadmap_data?.items) ? audit.roadmap_data.items : [],
      },
      quality_checks: audit.quality_checks || {},
      delivery_data: { ...defaultDelivery, ...(audit.delivery_data || {}) },
      commercial_data: { ...defaultCommercial, ...(audit.commercial_data || {}) },
    });
    setIndustryChoice(industryIsKnown ? audit.industry : audit.industry ? 'Other' : '');
    setIndustryCustom(industryIsKnown ? '' : audit.industry || '');
    setAuditCategoryChoice(categoryIsKnown ? audit.audit_category : audit.audit_category ? 'Other' : '');
    setAuditCategoryCustom(categoryIsKnown ? '' : audit.audit_category || '');
  }, [audit]);

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateObject = (key, field, value) => setForm((current) => ({ ...current, [key]: { ...current[key], [field]: value } }));
  const save = async (payload) => {
    setBusy(true);
    try {
      await onSave(payload);
      return true;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  };
  const navigateStage = (currentStep, payload, canSave = auditEditable) => {
    const currentIndex = stages.findIndex(([id]) => id === currentStep);
    const previousStep = currentIndex > 0 ? stages[currentIndex - 1][0] : null;
    const nextStep = currentIndex >= 0 && currentIndex < stages.length - 1 ? stages[currentIndex + 1][0] : null;
    return {
      previousStep,
      nextStep,
      requiresSave: Boolean(payload && canSave),
      onPrevious: () => previousStep && onNavigate?.(previousStep),
      onContinue: async () => {
        if (payload && canSave && !(await save(payload))) return;
        if (nextStep) onNavigate?.(nextStep);
      },
    };
  };
  const inspectWebsite = () => {
    const input = form.website_url.trim();
    try {
      if (!input) throw new Error('Enter a website URL to inspect.');
      const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(input) ? input : `https://${input}`;
      const parsed = new URL(candidate);
      if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) {
        throw new Error('Enter a valid HTTP or HTTPS website URL without embedded credentials.');
      }
      setInspectionResult({
        url: parsed.href,
        origin: parsed.origin,
        hostname: parsed.hostname,
        protocol: parsed.protocol.replace(':', '').toUpperCase(),
        secure: parsed.protocol === 'https:',
        port: parsed.port || (parsed.protocol === 'https:' ? '443 (default)' : '80 (default)'),
        path: parsed.pathname === '/' ? 'Root domain' : parsed.pathname,
        pathDepth: parsed.pathname === '/' ? 0 : parsed.pathname.split('/').filter(Boolean).length,
        queryCount: [...parsed.searchParams.keys()].length,
        hasHash: Boolean(parsed.hash),
        subdomain: parsed.hostname.split('.').length > 2 ? parsed.hostname.split('.').slice(0, -2).join('.') : 'None detected',
        domain: parsed.hostname.split('.').slice(-2).join('.'),
      });
    } catch (error) {
      setInspectionResult({ error: error.message || 'Enter a valid HTTP or HTTPS website URL.' });
    }
  };
  const saveQuality = async () => {
    setBusy(true);
    try {
      await onSaveChecks(
        Object.fromEntries(qualityItems.map(([key]) => [key, form.quality_checks[key] === true])),
        form.quality_checks.reviewer_notes || '',
      );
    } catch {
      return;
    } finally {
      setBusy(false);
    }
  };

  if (step === 'profile') return <StagePanel
    eyebrow="STEP 01 · ONBOARDING"
    title="Client profile & audit parameters"
    description="Capture the client context and define what this audit is intended to answer."
    saving={busy}
    editable={auditEditable}
    onSave={() => save({ client: form.client, contact_email: form.contact_email, website_url: form.website_url, industry: form.industry, audit_category: form.audit_category, goal: form.goal })}
    navigation={<StageNavigation {...navigateStage('profile', { client: form.client, contact_email: form.contact_email, website_url: form.website_url, industry: form.industry, audit_category: form.audit_category, goal: form.goal })} saving={busy} editable={auditEditable} />}
  >
    <div className="workflow-form-grid">
      <WorkflowField label="Client organization" value={form.client} onChange={(value) => updateForm('client', value)} />
      <WorkflowField label="Primary contact email" type="email" value={form.contact_email} onChange={(value) => updateForm('contact_email', value)} placeholder="name@company.com" />
      <div className="workflow-inspect"><WorkflowField label="Target website" type="url" value={form.website_url} onChange={(value) => { updateForm('website_url', value); setInspectionResult(null); }} placeholder="https://example.com" /><button className="button button-outline" type="button" onClick={inspectWebsite}><ExternalLink size={14} /> Inspect URL</button></div>
      <label className="workflow-field"><span>Industry vertical</span><select value={industryChoice} onChange={(event) => {
        const choice = event.target.value;
        setIndustryChoice(choice);
        updateForm('industry', choice === 'Other' ? industryCustom : choice);
      }}><option value="">Select an industry</option>{industryOptions.map((industry) => <option key={industry}>{industry}</option>)}<option value="Other">Other / specify</option></select></label>
      {industryChoice === 'Other' && <WorkflowField label="Custom industry" value={industryCustom} onChange={(value) => { setIndustryCustom(value); updateForm('industry', value); }} placeholder="Enter the client’s industry" />}
      <label className="workflow-field"><span>Primary audit category</span><select value={auditCategoryChoice} onChange={(event) => {
        const choice = event.target.value;
        setAuditCategoryChoice(choice);
        updateForm('audit_category', choice === 'Other' ? auditCategoryCustom : choice);
      }}><option value="">Select an audit category</option>{auditCategoryOptions.map((category) => <option key={category}>{category}</option>)}<option value="Other">Other / specify</option></select></label>
      {auditCategoryChoice === 'Other' && <WorkflowField label="Custom audit category" value={auditCategoryCustom} onChange={(value) => { setAuditCategoryCustom(value); updateForm('audit_category', value); }} placeholder="Enter the audit category" />}
      <WorkflowField label="Audit framework" value={audit.type} onChange={() => {}} readOnly />
      <WorkflowField label="Business objective" rows={3} value={form.goal} onChange={(value) => updateForm('goal', value)} placeholder="What business question should this audit answer?" />
    </div>
    {inspectionResult && <div className={`workflow-domain-overview ${inspectionResult.error ? 'has-error' : ''}`}>
      {inspectionResult.error ? <p role="alert">{inspectionResult.error}</p> : <>
        <div className="workflow-domain-header"><span className="workflow-domain-icon"><Globe2 size={18} /></span><span><span className="workflow-tag">URL INSPECTION · STRUCTURE VERIFIED</span><strong>{inspectionResult.hostname}</strong></span><span className="workflow-domain-status"><CheckCircle2 size={13} /> Ready to add</span></div>
        <div className="workflow-domain-grid">
          <div><dt>Transport</dt><dd><span className={inspectionResult.secure ? 'domain-good' : 'domain-warn'}>{inspectionResult.secure ? <LockKeyhole size={12} /> : <ShieldCheck size={12} />}{inspectionResult.protocol}</span></dd></div>
          <div><dt>Domain</dt><dd>{inspectionResult.domain}</dd></div>
          <div><dt>Subdomain</dt><dd>{inspectionResult.subdomain}</dd></div>
          <div><dt>Port</dt><dd>{inspectionResult.port}</dd></div>
          <div><dt>Path</dt><dd title={inspectionResult.path}>{inspectionResult.path}</dd></div>
          <div><dt>Path depth</dt><dd>{inspectionResult.pathDepth} level{inspectionResult.pathDepth === 1 ? '' : 's'}</dd></div>
          <div><dt>Query params</dt><dd>{inspectionResult.queryCount}</dd></div>
          <div><dt>Fragment</dt><dd>{inspectionResult.hasHash ? 'Present' : 'None'}</dd></div>
        </div>
        <div className="workflow-domain-actions"><a href={inspectionResult.url} target="_blank" rel="noopener noreferrer">Open website <ExternalLink size={13} /></a><span>Use the linked page to confirm live performance and access manually.</span></div>
        <small><ShieldCheck size={12} /> This check validates the URL format only. It does not crawl the site or test DNS, TLS, analytics, CMS, or third-party permissions.</small>
      </>}
    </div>}
    <div className="workflow-note"><ShieldCheck size={16} /> Website inspection and third-party connections are not simulated. Record verified observations and their evidence in the next steps.</div>
  </StagePanel>;

  if (step === 'team') {
    const team = form.team_assignments;
    const updateTeam = (field, value) => updateObject('team_assignments', field, value);
    return <StagePanel eyebrow="STEP 02 · RESOURCING" title="Audit team & subject matter experts" description="Record the delivery lead, audit SLA, and specialists contributing to this engagement." saving={busy} editable={auditEditable} onSave={() => save({ team_assignments: team })} navigation={<StageNavigation {...navigateStage('team', { team_assignments: team })} saving={busy} editable={auditEditable} />}>
      <div className="workflow-form-grid">
        <WorkflowField label="Lead auditor" value={team.lead_name} onChange={(value) => updateTeam('lead_name', value)} placeholder="Name" />
        <WorkflowField label="Lead role" value={team.lead_role} onChange={(value) => updateTeam('lead_role', value)} placeholder="Role or title" />
        <WorkflowField label="Lead sign-off authority" value={team.sign_off_authority || ''} onChange={(value) => updateTeam('sign_off_authority', value)} placeholder="Name or role authorized to sign off" />
        <label className="workflow-field"><span>Delivery SLA</span><select value={team.sla} onChange={(event) => updateTeam('sla', event.target.value)}><option>Standard (5 business days)</option><option>Accelerated (48 hours)</option><option>Custom</option></select></label>
        <label className="workflow-field"><span>NDA status</span><select value={team.nda_status || 'not_required'} onChange={(event) => updateTeam('nda_status', event.target.value)}><option value="not_required">Not required</option><option value="pending">Pending</option><option value="received">Received</option></select></label>
        <WorkflowField label="Collaboration channel / notes" value={team.notes} onChange={(value) => updateTeam('notes', value)} placeholder="#audit-client · working notes" />
      </div>
      <div className="workflow-list-heading"><div><h3>Subject matter experts</h3><p>List the specialist and the audit area they own.</p></div></div>
      <div className="workflow-inline-add"><input aria-label="SME name" placeholder="Specialist name" value={smeDraft.name} onChange={(event) => setSmeDraft({ ...smeDraft, name: event.target.value })} /><input aria-label="SME expertise" placeholder="Expertise (e.g. paid media)" value={smeDraft.expertise} onChange={(event) => setSmeDraft({ ...smeDraft, expertise: event.target.value })} /><button type="button" disabled={!smeDraft.name.trim()} onClick={() => { updateTeam('smes', [...(team.smes || []), { ...smeDraft }]); setSmeDraft({ name: '', expertise: '' }); }}><Plus size={14} /> Add specialist</button></div>
      <div className="workflow-chip-list">{(team.smes || []).map((sme, index) => <div className="workflow-chip" key={`${sme.name}-${index}`}><span><strong>{sme.name}</strong><small>{sme.expertise || 'Expertise not specified'}</small></span><button type="button" aria-label={`Remove ${sme.name}`} onClick={() => updateTeam('smes', team.smes.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={14} /></button></div>)}</div>
    </StagePanel>;
  }

  if (step === 'assets') {
    const addAsset = () => {
      if (!assetDraft.label.trim()) return;
      updateForm('client_assets', [...form.client_assets, { ...assetDraft, id: `${Date.now()}` }]);
      setAssetDraft({ category: 'Website & sitemap', label: '', url: '', notes: '', status: 'pending' });
    };
    const reverifyAssets = async () => {
      if (!form.client_assets.length) {
        onNotice?.('Add at least one client asset before re-verifying.');
        return;
      }
      const checkedAt = new Date().toISOString();
      const clientAssets = form.client_assets.map((asset) => {
        const value = (asset.url || '').trim();
        if (!value) return { ...asset, reverification: { status: 'manual_review', checked_at: checkedAt } };
        const looksLikeUrl = /^(?:[a-z][a-z\d+.-]*:\/\/|www\.)/i.test(value) || /^[^\s/]+\.[a-z]{2,}(?:[/:?#]|$)/i.test(value);
        if (!looksLikeUrl) return { ...asset, reverification: { status: 'manual_review', checked_at: checkedAt } };
        try {
          const parsed = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`);
          const valid = ['http:', 'https:'].includes(parsed.protocol) && Boolean(parsed.hostname) && !parsed.username && !parsed.password;
          return { ...asset, reverification: { status: valid ? 'url_format_valid' : 'invalid_url', checked_at: checkedAt } };
        } catch {
          return { ...asset, reverification: { status: 'invalid_url', checked_at: checkedAt } };
        }
      });
      updateForm('client_assets', clientAssets);
      if (await save({ client_assets: clientAssets })) {
        onNotice?.('Asset re-check saved. URL formats were checked; access and third-party connectivity still require team confirmation.');
      }
    };
    const assetsByCategory = (category) => form.client_assets.map((asset, index) => ({ asset, index })).filter(({ asset }) => asset.category === category);
    return <StagePanel eyebrow="STEP 03 · ASSET COLLECTION" title="Client digital asset collection" description="Organize client-provided websites, platforms, and competitor references into reusable evidence cards." saving={busy} editable={auditEditable} onSave={() => save({ client_assets: form.client_assets })} navigation={<StageNavigation {...navigateStage('assets', { client_assets: form.client_assets })} saving={busy} editable={auditEditable} />}>
      <div className="workflow-list-heading asset-heading"><div><h3>Client asset library</h3><p>Record the source and team-confirmed access status for each item.</p></div><button className="button button-outline" type="button" disabled={busy || !auditEditable || !form.client_assets.length} onClick={reverifyAssets}><RotateCw size={14} /> Re-verify assets</button></div>
      <div className="workflow-inline-add asset-add">
        <select aria-label="Asset category" value={assetDraft.category} onChange={(event) => setAssetDraft({ ...assetDraft, category: event.target.value })}>{assetCategories.map(({ name }) => <option key={name}>{name}</option>)}</select>
        <input aria-label="Asset name" placeholder="Asset name or account" value={assetDraft.label} onChange={(event) => setAssetDraft({ ...assetDraft, label: event.target.value })} />
        <input aria-label="Asset URL" placeholder="URL or account reference" value={assetDraft.url} onChange={(event) => setAssetDraft({ ...assetDraft, url: event.target.value })} />
        <button type="button" disabled={!assetDraft.label.trim()} onClick={addAsset}><Plus size={14} /> Add asset</button>
      </div>
      <WorkflowField label="Access, verification, or source notes" value={assetDraft.notes} onChange={(value) => setAssetDraft({ ...assetDraft, notes: value })} placeholder="Record who confirmed access and when, or note what is still needed." />
      <div className="workflow-asset-categories">{assetCategories.map(({ name, title, detail }) => {
        const entries = assetsByCategory(name);
        return <section className="workflow-asset-category" key={name}>
          <header><span><strong>{title}</strong><small>{detail}</small></span><i>{entries.length}</i></header>
          {entries.length ? <div className="workflow-asset-list">{entries.map(({ asset, index }) => <article className="workflow-asset" key={asset.id || index}>
            <div className="workflow-asset-info"><h3>{asset.label}</h3><p>{asset.url || 'No link or account reference provided'}</p>{asset.notes && <small>{asset.notes}</small>}
              {asset.reverification && <small className={`asset-recheck asset-recheck-${asset.reverification.status}`}>{asset.reverification.status === 'url_format_valid' ? 'URL format valid — connection not tested' : asset.reverification.status === 'invalid_url' ? 'URL format needs correction' : 'Manual access confirmation needed'} · {new Date(asset.reverification.checked_at).toLocaleString()}</small>}
            </div><div className="workflow-asset-actions"><select aria-label={`Verification status for ${asset.label}`} value={asset.status || 'pending'} onChange={(event) => updateForm('client_assets', form.client_assets.map((item, itemIndex) => itemIndex === index ? { ...item, status: event.target.value } : item))}><option value="pending">Not verified</option><option value="verified">Verified by team</option><option value="issue">Access issue</option></select><button type="button" aria-label={`Remove ${asset.label}`} onClick={() => updateForm('client_assets', form.client_assets.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={14} /></button></div>
          </article>)}</div> : <p className="asset-category-empty">No assets added yet.</p>}
        </section>;
      })}</div>
      <div className="workflow-note"><ShieldCheck size={16} /> Re-verification checks URL format and flags items needing manual review. “Verified by team” remains your human access check; no third-party service is contacted.</div>
    </StagePanel>;
  }

  if (step === 'roadmap') {
    const roadmap = form.roadmap_data;
    const addKpi = () => {
      if (!kpiDraft.name.trim()) return;
      updateObject('roadmap_data', 'kpis', [...roadmap.kpis, { ...kpiDraft, id: `${Date.now()}` }]);
      setKpiDraft({ name: '', baseline: '', target: '', unit: '' });
    };
    const addItem = () => {
      if (!roadmapDraft.title.trim()) return;
      updateObject('roadmap_data', 'items', [...roadmap.items, { ...roadmapDraft, id: `${Date.now()}`, status: 'planned' }]);
      setRoadmapDraft({ title: '', phase: 'Days 1–30', description: '', owner: '' });
    };
    const generateFromFindings = () => {
      const sourceKey = (finding) => String(finding.id || `title:${finding.title}`);
      const existing = new Set(roadmap.items.map((item) => item.source_finding_id || (item.source_finding_title ? `title:${item.source_finding_title}` : '')).filter(Boolean).map(String));
      const priorityRank = { critical: 0, high: 1, medium: 2, low: 3 };
      const generated = [...findings]
        .filter((finding) => !existing.has(sourceKey(finding)))
        .sort((left, right) => (priorityRank[left.priority] ?? 2) - (priorityRank[right.priority] ?? 2))
        .map((finding, index) => {
          const priority = finding.priority || 'medium';
          const phase = priority === 'critical' || priority === 'high' ? 'Days 1–30' : priority === 'medium' ? 'Days 31–60' : 'Days 61–90';
          return {
            id: `finding-${finding.id || Date.now()}-${index}`,
            source_finding_id: sourceKey(finding),
            source_finding_title: finding.title,
            title: finding.title,
            phase,
            description: [finding.recommendation, finding.impact ? `Business impact: ${finding.impact}` : ''].filter(Boolean).join('\n'),
            owner: finding.owner_name || '',
            status: 'planned',
          };
        });
      if (!generated.length) {
        onNotice?.(findings.length ? 'All findings are already represented in the roadmap.' : 'Add findings before generating roadmap actions.');
        return;
      }
      setForm((current) => ({
        ...current,
        roadmap_data: { ...current.roadmap_data, items: [...current.roadmap_data.items, ...generated] },
      }));
      onNotice?.(`${generated.length} roadmap action${generated.length === 1 ? '' : 's'} generated from existing findings. Review owners and sequencing before sharing.`);
    };
    return <StagePanel eyebrow="STEP 06 · STRATEGY & KPIS" title="30 / 60 / 90-day implementation roadmap" description="Turn the recommendations into sequenced actions with owners and measurable targets." saving={busy} editable={auditEditable} onSave={() => save({ roadmap_data: roadmap })} navigation={<StageNavigation {...navigateStage('roadmap', { roadmap_data: form.roadmap_data })} saving={busy} editable={auditEditable} />}>
      <div className="workflow-list-heading"><div><h3>KPI targets</h3><p>Use client-verified baselines and label projections as targets, not guarantees.</p></div></div>
      <div className="workflow-inline-add"><input aria-label="KPI name" placeholder="Metric" value={kpiDraft.name} onChange={(event) => setKpiDraft({ ...kpiDraft, name: event.target.value })} /><input aria-label="KPI baseline" placeholder="Baseline" value={kpiDraft.baseline} onChange={(event) => setKpiDraft({ ...kpiDraft, baseline: event.target.value })} /><input aria-label="KPI target" placeholder="Target" value={kpiDraft.target} onChange={(event) => setKpiDraft({ ...kpiDraft, target: event.target.value })} /><input aria-label="KPI unit" placeholder="Unit / timeframe" value={kpiDraft.unit} onChange={(event) => setKpiDraft({ ...kpiDraft, unit: event.target.value })} /><button type="button" disabled={!kpiDraft.name.trim()} onClick={addKpi}><Plus size={14} /> Add KPI</button></div>
      <div className="workflow-kpi-grid">{roadmap.kpis.map((kpi, index) => <article className="workflow-kpi" key={kpi.id || index}><div><small>{kpi.name}</small><strong>{kpi.baseline || '—'} <ArrowRight size={13} /> {kpi.target || '—'}</strong><span>{kpi.unit || 'Target'}</span></div><button type="button" aria-label={`Remove ${kpi.name}`} onClick={() => updateObject('roadmap_data', 'kpis', roadmap.kpis.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={14} /></button></article>)}</div>
      {!roadmap.kpis.length && <div className="workflow-empty">No KPI targets yet. Add verified baselines and proposed targets; blank metrics are not generated automatically.</div>}
      <div className="workflow-list-heading roadmap-heading"><div><h3>Roadmap actions</h3><p>Organize recommendations into practical delivery windows.</p></div><button className="button button-outline" type="button" disabled={!auditEditable || !findings.length} onClick={generateFromFindings}><CheckCircle2 size={14} /> Generate from findings</button></div>
      <div className="workflow-inline-add roadmap-add"><input aria-label="Action title" placeholder="Action" value={roadmapDraft.title} onChange={(event) => setRoadmapDraft({ ...roadmapDraft, title: event.target.value })} /><select aria-label="Action phase" value={roadmapDraft.phase} onChange={(event) => setRoadmapDraft({ ...roadmapDraft, phase: event.target.value })}><option>Days 1–30</option><option>Days 31–60</option><option>Days 61–90</option></select><input aria-label="Action owner" placeholder="Owner" value={roadmapDraft.owner} onChange={(event) => setRoadmapDraft({ ...roadmapDraft, owner: event.target.value })} /><button type="button" disabled={!roadmapDraft.title.trim()} onClick={addItem}><Plus size={14} /> Add action</button></div>
      <WorkflowField label="Action detail" value={roadmapDraft.description} onChange={(value) => setRoadmapDraft({ ...roadmapDraft, description: value })} placeholder="Define the intended outcome and dependencies." />
      <div className="workflow-roadmap-list">{roadmap.items.map((item, index) => <article className="workflow-roadmap-item" key={item.id || index}><span className="workflow-tag">{item.phase}</span><div><strong>{item.title}</strong>{item.source_finding_title && <small className="roadmap-source">From finding: {item.source_finding_title}</small>}<p>{item.description || 'No action detail provided.'}</p><small>{item.owner ? `Owner: ${item.owner}` : 'Owner to be assigned'}</small></div><button type="button" aria-label={`Remove ${item.title}`} onClick={() => updateObject('roadmap_data', 'items', roadmap.items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={14} /></button></article>)}</div>
      {!roadmap.items.length && <div className="workflow-empty">{findings.length ? 'Generate roadmap actions from your findings, then review the suggested delivery windows and owners.' : 'No findings are ready to sequence yet. Add findings first, or create roadmap actions manually.'}</div>}
    </StagePanel>;
  }

  if (step === 'quality') {
    const allPassed = qualityItems.every(([key]) => form.quality_checks[key] === true);
    const savedAllPassed = qualityItems.every(([key]) => audit.quality_checks?.[key] === true);
    return <StagePanel eyebrow="STEP 07 · GOVERNANCE & QA" title="Quality review & executive sign-off" description="A reviewer records each verification independently. Approval is blocked until every check passes." saving={busy} onSave={reviewer && reviewStatus === 'In review' ? saveQuality : null} actionText="Save checklist" navigation={<StageNavigation {...navigateStage('quality')} saving={busy} />}>
      <div className="workflow-status-banner"><span className={`workflow-status-dot ${reviewStatus === 'Approved' ? 'is-approved' : ''}`} /><div><strong>{reviewStatus === 'In review' ? 'Reviewer sign-off in progress' : reviewStatus}</strong><small>{reviewer ? 'You are viewing the reviewer controls.' : 'Only an authorized quality reviewer can approve an audit.'}</small></div></div>
      <div className="workflow-check-grid">{qualityItems.map(([key, label, detail], index) => <label className="workflow-check" key={key}><input type="checkbox" disabled={!reviewer || reviewStatus !== 'In review'} checked={form.quality_checks[key] === true} onChange={(event) => updateObject('quality_checks', key, event.target.checked)} /><span><strong>{String(index + 1).padStart(2, '0')} · {label}</strong><small>{detail}</small></span></label>)}</div>
      {reviewer && reviewStatus === 'In review' && <WorkflowField label="Reviewer notes" rows={3} value={form.quality_checks.reviewer_notes || ''} onChange={(value) => updateObject('quality_checks', 'reviewer_notes', value)} placeholder="Optional notes for the audit record." />}
      {reviewer && reviewStatus === 'In review' && <div className="workflow-review-actions"><button className="button button-dark" type="button" disabled={!allPassed || !savedAllPassed || busy} onClick={onApprove}>Approve audit <CheckCircle2 size={15} /></button><div className="workflow-return"><input aria-label="Change request feedback" value={reviewFeedback} onChange={(event) => setReviewFeedback(event.target.value)} placeholder="What needs to change?" /><button className="button button-outline" type="button" disabled={!reviewFeedback.trim()} onClick={() => onRequestChanges(reviewFeedback)}>Return for changes</button></div></div>}
      {!reviewer && reviewStatus !== 'Approved' && reviewStatus !== 'In review' && <div className="workflow-review-actions"><p>Required modules {progress === 100 ? 'are complete' : 'must be completed with evidence before review'}.</p><button className="button button-dark" type="button" disabled={progress !== 100} onClick={onSubmit}>Submit for quality review <ArrowRight size={15} /></button></div>}
      {reviewer && reviewStatus === 'In review' && (!allPassed || !savedAllPassed) && <p className="workflow-validation"><ShieldCheck size={15} /> {!allPassed ? 'All six checks must pass before approval is enabled.' : 'Save the completed checklist before approval.'}</p>}
      {reviewStatus === 'Approved' && <div className="workflow-approved-note"><CheckCircle2 size={18} /><span>This audit is approved and ready for client delivery.{audit.approved_at && <small>Approved by {audit.approved_by_name || 'quality reviewer'} on {new Date(audit.approved_at).toLocaleString()}.</small>}</span></div>}
    </StagePanel>;
  }

  if (step === 'report') return <StagePanel eyebrow="STEP 08 · REPORT ASSEMBLED" title="Final audit report" description="The report is assembled from the audit profile, assessed modules, evidence register, findings, and roadmap." footer={<button className="button button-primary" type="button" disabled={reviewStatus !== 'Approved'} onClick={onDownloadReport}><FileCheck2 size={15} /> Download approved PDF</button>} navigation={<StageNavigation {...navigateStage('report')} saving={busy} />}>
    {reviewStatus !== 'Approved' && <div className="workflow-validation"><ShieldCheck size={15} /> The downloadable client report becomes available after quality approval.</div>}
    <div className="workflow-report-preview"><p className="eyebrow">CONFIDENTIAL · {audit.type || 'DIGITAL GROWTH AUDIT'}</p><h3>{audit.client}</h3><p>{audit.goal || 'Audit objective has not been added yet.'}</p><div className="workflow-report-stats"><span><strong>{assessmentScore === null ? '—' : `${assessmentScore}/100`}</strong><small>average module score · {scoredModules} scored</small></span><span><strong>{evidenceCount}</strong><small>evidence items</small></span><span><strong>{findings.length}</strong><small>structured findings</small></span><span><strong>{(form.roadmap_data.items || []).length}</strong><small>roadmap actions</small></span></div><div className="workflow-report-findings">{findings.slice(0, 3).map((finding) => <article key={finding.id}><span>{finding.priority || 'priority'}</span><strong>{finding.title}</strong><small>{finding.recommendation}</small></article>)}</div></div>
  </StagePanel>;

  if (step === 'delivery') return <>
    <StagePanel eyebrow="STEP 09 · CLIENT ENGAGEMENT" title="Client presentation & delivery" description="Schedule the findings debrief, prepare a live briefing, and manage the approved client portal." saving={busy} editable={reviewStatus === 'Approved'} onSave={() => save({ delivery_data: form.delivery_data })} navigation={<StageNavigation {...navigateStage('delivery', { delivery_data: form.delivery_data }, reviewStatus === 'Approved')} saving={busy} editable={reviewStatus === 'Approved'} />}>
      <div className="workflow-delivery-grid"><WorkflowField label="Lead presenter" value={form.delivery_data.presenter} onChange={(value) => updateObject('delivery_data', 'presenter', value)} placeholder="Name" /><WorkflowField label="Scheduled delivery call" type="datetime-local" value={form.delivery_data.scheduled_at} onChange={(value) => updateObject('delivery_data', 'scheduled_at', value)} /><WorkflowField label="Meeting link or location" type="url" value={form.delivery_data.meeting_url} onChange={(value) => updateObject('delivery_data', 'meeting_url', value)} placeholder="https://…" /><WorkflowField label="Presentation agenda" rows={3} value={form.delivery_data.agenda} onChange={(value) => updateObject('delivery_data', 'agenda', value)} placeholder="Key questions and discussion points." /></div>
      <div className="workflow-share-row"><div><strong>Approved client portal</strong><small>{shareUrl ? 'Secure link ready to copy or preview from the audit header.' : (audit.shared ? 'A secure client link is active. Use Open client link above to reveal or revoke it.' : 'Create a secure, revocable client view after approval.')}</small></div>{shareUrl && <button className="button button-outline" type="button" onClick={onCopyShare}>Copy link</button>}{reviewStatus === 'Approved' && <button className="button button-primary" type="button" onClick={onCreateShare}>{audit.shared || shareUrl ? 'Open client link' : 'Create secure link'}</button>}      {(audit.shared || shareUrl) && <button className="text-link" type="button" onClick={onRevokeShare}>Revoke access</button>}</div>
      <button className="button button-outline launch-presentation" type="button" onClick={() => setPresentationOpen(true)}><Play size={15} /> Launch live presentation</button>
    </StagePanel>
    {children}
    {presentationOpen && <PresentationDeck
      audit={audit}
      findings={findings}
      roadmap={form.roadmap_data}
      moduleScores={moduleScores}
      assessmentScore={assessmentScore}
      onClose={() => setPresentationOpen(false)}
    />}
  </>;

  if (step === 'commercial') {
    const commercial = form.commercial_data;
    const selectedPackage = packages.find((item) => item.id === commercial.package_id);
    return <StagePanel eyebrow="STEP 10 · COMMERCIAL FOLLOW-UP" title="Proposal & service engagement" description="Record a follow-up option grounded in the approved audit roadmap. This records pipeline status; it does not create or sign a legal contract." saving={busy} editable={reviewStatus === 'Approved'} onSave={() => save({ commercial_data: commercial })} actionText="Save proposal" navigation={<StageNavigation {...navigateStage('commercial', { commercial_data: commercial }, reviewStatus === 'Approved')} saving={busy} editable={reviewStatus === 'Approved'} />}>
      <div className="workflow-form-grid">
        <label className="workflow-field"><span>Consultation debrief</span><select value={commercial.consultation_status || 'not_scheduled'} onChange={(event) => updateObject('commercial_data', 'consultation_status', event.target.value)}><option value="not_scheduled">Not scheduled</option><option value="scheduled">Scheduled</option><option value="completed">Completed</option></select></label>
        <WorkflowField label="Consultation date" type="datetime-local" value={commercial.consultation_at || ''} onChange={(value) => updateObject('commercial_data', 'consultation_at', value)} />
      </div>
      <div className="workflow-list-heading"><div><h3>Resource allocation</h3><p>Estimate delivery capacity for the proposed engagement (hours per month).</p></div></div>
      <div className="workflow-resource-grid">{(commercial.resource_allocation || []).map((resource, index) => <div className="workflow-resource" key={`${resource.role}-${index}`}><WorkflowField label="Role" value={resource.role} onChange={(value) => updateObject('commercial_data', 'resource_allocation', commercial.resource_allocation.map((item, itemIndex) => itemIndex === index ? { ...item, role: value } : item))} /><WorkflowField label="Hours / month" type="number" value={resource.hours} onChange={(value) => updateObject('commercial_data', 'resource_allocation', commercial.resource_allocation.map((item, itemIndex) => itemIndex === index ? { ...item, hours: value === '' ? '' : Math.max(0, Number(value)) } : item))} /></div>)}</div>
      <div className="workflow-package-grid">{packages.map((item) => <article className={`workflow-package ${item.recommended ? 'recommended' : ''} ${commercial.package_id === item.id ? 'selected' : ''}`} key={item.id}>{item.recommended && <span className="workflow-recommended">Recommended</span>}<p className="eyebrow">{item.cadence.toUpperCase()}</p><h3>{item.name}</h3><strong className="workflow-price">${item.price.toLocaleString()}<small> / {item.cadence}</small></strong><p>{item.description}</p><ul>{item.includes.map((feature) => <li key={feature}><Check size={13} /> {feature}</li>)}</ul><button className={commercial.package_id === item.id ? 'button button-dark full-width' : 'button button-outline full-width'} type="button" onClick={() => updateForm('commercial_data', { ...commercial, package_id: item.id, package_name: item.name, price: item.price, cadence: item.cadence, status: 'proposal_selected' })}>{commercial.package_id === item.id ? 'Selected' : 'Select package'}</button></article>)}</div>
      <WorkflowField label="Proposal / follow-up notes" rows={3} value={commercial.notes} onChange={(value) => updateObject('commercial_data', 'notes', value)} placeholder="Scope clarifications, decision makers, or follow-up date." />
      <div className="workflow-pipeline"><span className={reviewStatus === 'Approved' ? 'complete' : ''}>Audit approved</span><i>→</i><span className={shareUrl || audit.shared ? 'complete' : ''}>Audit delivered</span><i>→</i><span className={commercial.consultation_status === 'completed' ? 'complete' : ''}>Consultation debrief</span><i>→</i><span className={commercial.package_id ? 'complete' : ''}>Proposal selected</span><i>→</i><span className={commercial.status === 'won' ? 'complete' : ''}>Engagement won</span></div>
      {selectedPackage && <div className="workflow-close-deal"><div><small>SELECTED PACKAGE</small><strong>{selectedPackage.name} · ${selectedPackage.price.toLocaleString()} {selectedPackage.cadence}</strong><span>{commercial.status === 'won' ? 'Marked as won' : 'Ready to record the engagement as won.'}</span></div><button className="button button-dark" type="button" disabled={reviewStatus !== 'Approved' || commercial.status === 'won'} onClick={() => onCloseDeal(commercial)}>{commercial.status === 'won' ? 'Deal recorded' : 'Mark deal won'} <CheckCircle2 size={15} /></button></div>}
      {reviewStatus !== 'Approved' && <p className="workflow-validation">The commercial handoff is available after the audit is approved.</p>}
      {selectedPackage && <button className="button button-outline" type="button" disabled={busy} onClick={() => save({ commercial_data: commercial })}><CalendarDays size={14} /> Save selected proposal</button>}
    </StagePanel>;
  }

  return <div className="workflow-child">{children}</div>;
}

export { stages };
