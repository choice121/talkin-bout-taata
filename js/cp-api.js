// ============================================================
// Choice Properties — Shared API Client (cp-api.js)
// All pages import this after config.js
// ============================================================

// Supabase client (lazy singleton)
let _sb = null;
function sb() {
  if (!_sb) {
    _sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
  }
  return _sb;
}

// ── Auth helpers ──────────────────────────────────────────
const Auth = {
  async getUser()       { const { data } = await sb().auth.getUser(); return data?.user || null; },
  async getSession()    { const { data } = await sb().auth.getSession(); return data?.session || null; },
  async signOut() {
    await sb().auth.signOut();
    // Route to the correct login page based on current URL path
    const path = location.pathname;
    if (path.includes('/admin/'))  { location.href = '/admin/login.html'; }
    else if (path.includes('/apply/')) { location.href = '/apply/login.html'; }
    else { location.href = '/landlord/login.html'; }
  },
  async isAdmin()       {
    const user = await Auth.getUser();
    if (!user) return false;
    const { data } = await sb().from('admin_roles').select('id').eq('user_id', user.id).maybeSingle();
    return !!data;
  },
  async requireLandlord(redirectTo = '../landlord/login.html') {
    const user = await Auth.getUser();
    if (!user) { location.href = redirectTo; return null; }
    let { data } = await sb().from('landlords').select('*').eq('user_id', user.id).maybeSingle();
    // Profile missing — user signed up with email confirmation enabled and the INSERT
    // was intentionally deferred. Create it now from user_metadata on first login.
    // createLandlordProfileIfMissing retries on RLS failures caused by JWT propagation delay.
    if (!data) {
      let profileErr = null;
      try {
        await createLandlordProfileIfMissing(user);
        const result = await sb().from('landlords').select('*').eq('user_id', user.id).maybeSingle();
        data = result.data;
      } catch (err) {
        profileErr = err;
        console.error('[CP] requireLandlord: profile creation failed after retries:', err.message);
      }
      // Profile creation failed — user IS authenticated but the row could not be written.
      // Do NOT redirect to login here: that causes an infinite login → dashboard loop.
      // Return null so the calling page stops loading gracefully (no redirect loop).
      if (!data && profileErr) return null;
    }
    if (!data) { location.href = redirectTo; return null; }
    return data;
  },
  async requireAdmin(redirectTo = '../admin/login.html') {
    const isAdmin = await Auth.isAdmin();
    if (!isAdmin) { location.href = redirectTo; return false; }
    return true;
  },
};

// ── Applicant Auth (passwordless OTP) ─────────────────────
// Separate from landlord/admin Auth — applicants sign in with
// a one-time code emailed to them (no password required).
const ApplicantAuth = {
  async sendOTP(email) {
    const { error } = await sb().auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  },
  async verifyOTP(email, token) {
    const { data, error } = await sb().auth.verifyOtp({ email, token, type: 'email' });
    if (error) throw error;
    return data;
  },
  async getUser()    { return Auth.getUser(); },
  async getSession() { return Auth.getSession(); },
  async signOut() {
    await sb().auth.signOut();
    location.href = '/apply/login.html';
  },
  // Returns {success, applications[]} for the currently signed-in applicant.
  async getMyApplications() {
    const { data, error } = await sb().rpc('get_my_applications');
    if (error) return { success: false, error: error.message };
    return data;
  },
  // Links a legacy (pre-auth) application to the current user by verifying email match.
  async claimApplication(appId, email) {
    const { data, error } = await sb().rpc('claim_application', {
      p_app_id: appId,
      p_email:  email,
    });
    if (error) return { success: false, error: error.message };
    return data;
  },
};

// ── Edge Function caller ──────────────────────────────────
async function callEdgeFunction(name, payload) {
  // Get the current user session JWT so Edge Functions can verify the caller is an admin
  const session = await Auth.getSession();
  const token = session?.access_token || CONFIG.SUPABASE_ANON_KEY;
  const res = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': CONFIG.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ── Application API ───────────────────────────────────────
const Applications = {
  async submit(formData)        { return callEdgeFunction('process-application', formData); },
  async getStatus(appId)        {
    // Rate-limited via the get-application-status Edge Function (Fix Group 7).
    const result = await callEdgeFunction('get-application-status', { app_id: appId });
    return result;
  },
  async getAll(filters = {})    {
    let q = sb().from('admin_application_view').select('*').order('created_at', { ascending: false });
    if (filters.status)         q = q.eq('status', filters.status);
    if (filters.landlord_id)    q = q.eq('landlord_id', filters.landlord_id);
    if (filters.search) {
      q = q.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,app_id.ilike.%${filters.search}%`);
    }
    const { data, error } = await q;
    return { data: data || [], error };
  },
  async getOne(appId)           {
    const { data, error } = await sb().from('applications').select('*').eq('app_id', appId).single();
    return { data, error };
  },
  async updateStatus(appId, status, notes)  { return callEdgeFunction('update-status', { app_id: appId, status, notes }); },
  async markPaid(appId, notes)              { return callEdgeFunction('mark-paid', { app_id: appId, notes }); },
  async generateLease(payload)              { return callEdgeFunction('generate-lease', payload); },
  async signLease(appId, sig, ip, token)    { return callEdgeFunction('sign-lease', { app_id: appId, signature: sig, ip_address: ip, token: token || undefined }); },
  async signLeaseCoApplicant(appId, sig, ip, coToken){ return callEdgeFunction('sign-lease', { app_id: appId, signature: sig, ip_address: ip, is_co_applicant: true, co_token: coToken || undefined }); },
  async markMoveIn(appId, date, notes)      { return callEdgeFunction('mark-movein', { app_id: appId, move_in_date: date, notes }); },
  async sendMessage(appId, message, sender, senderName) { return callEdgeFunction('send-message', { app_id: appId, message, sender, sender_name: senderName }); },
  async sendRecoveryEmail(email, appId, origin) { return callEdgeFunction('send-inquiry', { type: 'app_id_recovery', email, app_id: appId, dashboard_url: origin + '/apply/dashboard.html?id=' + appId }); },
  async tenantReply(appId, message, name)   {
    const { data, error } = await sb().rpc('submit_tenant_reply', { p_app_id: appId, p_message: message, p_name: name });
    if (error) return { success: false, error: error.message };
    // P1-B: Non-blocking landlord notification — submit_tenant_reply() is a DB RPC with no HTTP
    // capability, so we fire the notification here after the reply is persisted successfully.
    fetch(`${CONFIG.SUPABASE_URL}/functions/v1/send-inquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: CONFIG.SUPABASE_ANON_KEY },
      body: JSON.stringify({ type: 'tenant_reply', app_id: appId, tenant_name: name, message }),
    }).catch(() => {}); // fire-and-forget — never block the tenant UX
    return data;
  },
};

// ── Properties API ────────────────────────────────────────
const Properties = {
  async getAll(filters = {}) {
    let q = sb().from('properties').select('*, landlords(contact_name, business_name, avatar_url, verified)').order('created_at', { ascending: false });
    if (filters.status)    q = q.eq('status', filters.status);
    if (filters.landlord)  q = q.eq('landlord_id', filters.landlord);
    if (filters.bedrooms)  q = q.gte('bedrooms', filters.bedrooms);
    if (filters.max_rent)  q = q.lte('monthly_rent', filters.max_rent);
    if (filters.state)     q = q.eq('state', filters.state);
    const { data, error } = await q;
    return { data: data || [], error };
  },
  async getOne(id) {
    const { data, error } = await sb().from('properties').select('*, landlords(*)').eq('id', id).single();
    return { data, error };
  },
  async create(payload)   {
    // Generate property ID server-side via DB function (prevents client-side ID forgery)
    const { data: newId, error: idErr } = await sb().rpc('generate_property_id');
    if (idErr || !newId) throw new Error(idErr?.message || 'Failed to generate property ID');
    const { data, error } = await sb().from('properties').insert({ ...payload, id: newId }).select().single();
    return { data, error };
  },
  async update(id, payload) {
    const { data, error } = await sb().from('properties').update(payload).eq('id', id).select().single();
    return { data, error };
  },
  async delete(id)        { return sb().from('properties').delete().eq('id', id); },
  async incrementView(id) { return sb().rpc('increment_counter', { p_table: 'properties', p_id: id, p_column: 'views_count' }); },
};

// ── Inquiries API ─────────────────────────────────────────
const Inquiries = {
  async submit(payload) {
    // Routes through the send-inquiry Edge Function (type: inquiry_submit).
    // The Edge Function validates all fields server-side, verifies the property
    // is active, inserts using the service role, and fires the confirmation +
    // landlord notification emails — all in one atomic server-side call.
    // The open anon INSERT policy on the inquiries table has been removed.
    const result = await callEdgeFunction('send-inquiry', {
      type:            'inquiry_submit',
      tenant_name:     payload.tenant_name,
      tenant_email:    payload.tenant_email,
      tenant_phone:    payload.tenant_phone    || null,
      tenant_language: payload.tenant_language || (typeof localStorage !== 'undefined' ? localStorage.getItem('cp_lang') : null) || 'en',
      message:         payload.message,
      property_id:     payload.property_id,
    });
    if (!result.success) return { data: null, error: { message: result.error || 'Failed to submit inquiry.' } };
    return { data: result.data || null, error: null };
  },
  async getForLandlord(landlordId) {
    // Fetch landlord's property IDs first so errors surface properly
    const { data: propRows, error: propErr } = await sb().from('properties').select('id').eq('landlord_id', landlordId);
    if (propErr) return { data: [], error: propErr };
    const propIds = (propRows || []).map(p => p.id);
    if (!propIds.length) return { data: [], error: null };
    const { data, error } = await sb().from('inquiries').select('*, properties(title, address)').in('property_id', propIds).order('created_at', { ascending: false });
    return { data: data || [], error };
  },
  async markRead(id) { return sb().from('inquiries').update({ read: true }).eq('id', id); },
};

// ── Landlords API ─────────────────────────────────────────
const Landlords = {
  async getProfile(userId)  {
    const { data, error } = await sb().from('landlords').select('*').eq('user_id', userId).maybeSingle();
    return { data, error };
  },
  async update(id, payload) {
    const { data, error } = await sb().from('landlords').update(payload).eq('id', id).select().single();
    return { data, error };
  },
  async getAll()            {
    const { data, error } = await sb().from('landlords').select('*, properties(count)').order('created_at', { ascending: false });
    return { data: data || [], error };
  },
};

// ── Email Logs API ────────────────────────────────────────
const EmailLogs = {
  async getAll(filters = {}) {
    let q = sb().from('email_logs').select('*').order('created_at', { ascending: false }).limit(500);
    if (filters.app_id)  q = q.eq('app_id', filters.app_id);
    if (filters.type)    q = q.eq('type', filters.type);
    if (filters.status)  q = q.eq('status', filters.status);
    const { data, error } = await q;
    return { data: data || [], error };
  },
};

// ── Realtime helper ───────────────────────────────────────
// Subscribes to status changes for a SPECIFIC application only.
// Scoped by app_id filter to prevent cross-tenant reload pollution.
function subscribeToApplication(appId, callback) {
  return sb().channel('application-' + appId)
    .on('postgres_changes', {
      event  : '*',
      schema : 'public',
      table  : 'applications',
      filter : `app_id=eq.${appId}`
    }, callback)
    .subscribe();
}
// Keep old name as alias for admin use (intentionally broad)
function subscribeToApplications(callback) {
  return sb().channel('applications-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, callback)
    .subscribe();
}
function subscribeToMessages(appId, callback) {
  return sb().channel('messages-' + appId)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `app_id=eq.${appId}` }, callback)
    .subscribe();
}

// ── UI utilities ──────────────────────────────────────────
const UI = {
  fmt: {
    currency: (n) => `$${parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    date:     (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—',
    dateTime: (d) => d ? new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
    status:   (s) => s ? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—',
    phone:    (p) => p ? p.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') : '',
  },
  statusBadge(status) {
    const map = {
      pending:      'badge-warning',
      under_review: 'badge-info',
      approved:     'badge-success',
      denied:       'badge-danger',
      withdrawn:    'badge-secondary',
      waitlisted:   'badge-secondary',
    };
    return `<span class="badge ${map[status] || 'badge-secondary'}">${UI.fmt.status(status)}</span>`;
  },
  paymentBadge(status) {
    const map = { unpaid:'badge-danger', paid:'badge-success', waived:'badge-info', refunded:'badge-warning' };
    return `<span class="badge ${map[status] || 'badge-secondary'}">${UI.fmt.status(status)}</span>`;
  },
  leaseBadge(status) {
    const map = { none:'badge-secondary', sent:'badge-info', signed:'badge-success', awaiting_co_sign:'badge-warning', co_signed:'badge-success', voided:'badge-danger', expired:'badge-warning' };
    return `<span class="badge ${map[status] || 'badge-secondary'}">${UI.fmt.status(status)}</span>`;
  },
  toast(msg, type = 'info', duration = 4000) {
    const t = document.createElement('div');
    t.className = `cp-toast cp-toast-${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, duration);
  },
  loading(el, on) {
    if (on) { el.dataset.origText = el.textContent; el.disabled = true; el.textContent = 'Loading…'; }
    else    { el.textContent = el.dataset.origText || el.textContent; el.disabled = false; }
  },
  confirm(msg) { return window.confirm(msg); },
  // Promise-based confirm dialog — replaces native confirm() with inline modal
  cpConfirm(message, { confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false } = {}) {
    return new Promise((resolve) => {
      const existing = document.getElementById('_cpConfirmOverlay');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = '_cpConfirmOverlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';

      const btnColor = danger ? '#dc2626' : 'var(--gold,#c9a84c)';
      overlay.innerHTML = `
        <div style="background:var(--surface,#1a2332);border:1px solid var(--border,#2a3a4a);border-radius:12px;max-width:440px;width:100%;padding:28px;box-shadow:0 24px 64px rgba(0,0,0,.5);">
          <div style="font-size:.95rem;font-weight:600;color:var(--text,#e8eaf0);line-height:1.6;margin-bottom:24px;">${message}</div>
          <div style="display:flex;justify-content:flex-end;gap:10px;">
            <button id="_cpConfirmCancel" style="background:transparent;border:1px solid var(--border,#2a3a4a);color:var(--muted,#8892a2);border-radius:6px;padding:9px 18px;font-size:.82rem;font-weight:600;cursor:pointer;">${cancelLabel}</button>
            <button id="_cpConfirmOk" style="background:${btnColor};border:none;color:${danger ? '#fff' : '#0e1825'};border-radius:6px;padding:9px 18px;font-size:.82rem;font-weight:600;cursor:pointer;">${confirmLabel}</button>
          </div>
        </div>`;

      document.body.appendChild(overlay);

      const cleanup = (val) => { overlay.remove(); resolve(val); };
      document.getElementById('_cpConfirmOk').addEventListener('click', () => cleanup(true));
      document.getElementById('_cpConfirmCancel').addEventListener('click', () => cleanup(false));
      overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(false); });
    });
  },
};

// ── Expose globally ───────────────────────────────────────

// ── XSS-safe HTML escape ─────────────────────────────────
// Use esc() whenever injecting user-supplied text into innerHTML.
function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
window.CP_esc = esc;

window.CP = { sb, Auth, ApplicantAuth, Applications, Properties, Inquiries, Landlords, EmailLogs, UI, subscribeToApplication, subscribeToApplications, subscribeToMessages };

// ── ES Module exports — used by landlord pages and property.html ──────────────

export const supabase = CP.sb();

export function buildApplyURL(property) {
  const params = new URLSearchParams({
    propertyAddress : `${property.address}, ${property.city}, ${property.state} ${property.zip || ''}`.trim(),
    rent            : property.monthly_rent,
    propertyId      : property.id,
    landlordId      : property.landlord_id,
    moveIn          : property.available_date || '',
    fee             : property.application_fee || 0,
    title           : property.title
  });
  return `/apply.html?${params.toString()}`;
}

export async function incrementCounter(table, id, column) {
  return CP.sb().rpc('increment_counter', { p_table: table, p_id: id, p_column: column });
}

// ── Also attach to window.CP so non-module pages (index.html) can call them ──
// index.html loads cp-api.js as a plain <script>, not an ES module, so ES
// exports are invisible to it. Attaching here lets it call buildApplyURL(p)
// and incrementCounter(...) the same way as module-based pages.
window.buildApplyURL    = buildApplyURL;
window.incrementCounter = incrementCounter;

export async function getSession()          { return CP.Auth.getSession(); }
export async function getLandlordProfile()  { const user = await CP.Auth.getUser(); if (!user) return null; return (await CP.Landlords.getProfile(user.id)).data; }
export async function requireAuth(r)        { return CP.Auth.requireLandlord(r); }
export async function signIn(e, p)          { const { data, error } = await CP.sb().auth.signInWithPassword({ email: e, password: p }); if (error) throw error; return data; }
export async function signUp(email, password, profile) {
  const { data, error } = await CP.sb().auth.signUp({ email, password, options: { data: profile } });
  if (error) throw error;
  // Never INSERT into landlords here — auth token is not yet propagated to the
  // database connection at this point, causing auth.uid() to return null and
  // failing the RLS check regardless of session state.
  // createLandlordProfileIfMissing() handles profile creation safely on first login
  // via requireLandlord(), when the user is fully authenticated.
  return data;
}

// Creates a landlord profile row from user_metadata if one doesn't exist yet.
// Called after login to handle users who signed up with email confirmation enabled.
//
// Retry strategy: after auth.signUp() the JWT is valid for Supabase Auth but can
// take a moment to propagate to PostgREST / Postgres, causing auth.uid() to return
// NULL and triggering an RLS failure on the first INSERT attempt. We detect that
// specific error and retry with linear backoff (400 ms, 800 ms, 1200 ms) before
// giving up. Four attempts cover the observed worst-case propagation window without
// introducing noticeable delay for the happy path.
async function createLandlordProfileIfMissing(user) {
  const meta = user.user_metadata || {};
  const payload = {
    user_id:       user.id,
    email:         user.email,
    contact_name:  meta.contact_name  || user.email,
    business_name: meta.business_name || null,
    phone:         meta.phone         || null,
    account_type:  meta.account_type  || 'landlord',
    avatar_url:    meta.avatar_url    || null,
  };

  const MAX_ATTEMPTS = 4;
  const BACKOFF_MS   = 400; // linear: 400 ms, 800 ms, 1200 ms between retries

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const { error } = await sb().from('landlords').insert(payload);

    // Success
    if (!error) return;

    // Duplicate key — another concurrent call already created the row; treat as success
    if (
      error.message.includes('duplicate') ||
      error.message.includes('unique')    ||
      error.message.includes('already exists')
    ) return;

    // RLS violation — almost certainly auth.uid() is still NULL due to JWT propagation.
    // Retry with linear backoff on all attempts except the last.
    const isRlsError =
      error.message.includes('row-level security') ||
      error.message.includes('violates row-level');

    if (isRlsError && attempt < MAX_ATTEMPTS) {
      console.warn(`[CP] createLandlordProfileIfMissing: RLS failure on attempt ${attempt}, retrying in ${BACKOFF_MS * attempt} ms…`);
      await new Promise(resolve => setTimeout(resolve, BACKOFF_MS * attempt));
      continue;
    }

    // Non-retryable error, or RLS still failing after all attempts
    console.error('[CP] createLandlordProfileIfMissing: failed (attempt %d/%d):', attempt, MAX_ATTEMPTS, error.message);
    throw new Error('Profile setup failed: ' + error.message);
  }
}
export async function signOut() {
  await CP.sb().auth.signOut();
  const isAdminPath = window.location.pathname.includes('/admin/');
  window.location.href = isAdminPath ? '/admin/login.html' : '/landlord/login.html';
}
export async function resetPassword(email)  { const { error } = await CP.sb().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/landlord/login.html` }); if (error) throw error; }
export async function updateNav()           {
  const session = await CP.Auth.getSession();
  const authLink = document.getElementById('navAuthLink');
  if (!authLink) return;
  if (session) { authLink.href = '/landlord/dashboard.html'; authLink.textContent = 'My Dashboard'; }
  else         { authLink.href = '/landlord/login.html';     authLink.textContent = 'List Your Property'; }
}
