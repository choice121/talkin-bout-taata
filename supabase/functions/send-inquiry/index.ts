// Choice Properties — Edge Function: send-inquiry
// Handles all inquiry-related emails server-side.
//
// Handles:
//   type: 'inquiry_submit'            → server-side validated insert + emails
//   type: 'tenant_reply'              → landlord notification after tenant reply
//   type: 'app_id_recovery_by_email'  → multi-result recovery by email address
//   type: 'app_id_recovery'           → single app-id recovery link
//   (default)                         → legacy inquiry email path (kept for compatibility)
//
// Called from: cp-api.js Inquiries.submit() and Applications.sendRecoveryEmail()
// No auth required — these are public-facing actions.
//
// Rate limiting: max 5 requests per IP per 5 minutes.
// tenant_reply and app_id_recovery requests are exempt (internal callbacks).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── In-memory rate-limit store ────────────────────────────────
const RATE_LIMIT_MAX    = 5;
const RATE_LIMIT_WINDOW = 5 * 60 * 1000;

const ipStore = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = ipStore.get(ip);
  if (!rec || now - rec.windowStart > RATE_LIMIT_WINDOW) {
    ipStore.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (rec.count >= RATE_LIMIT_MAX) return true;
  rec.count++;
  return false;
}

function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  // ── Parse body early — needed to check type for rate-limit exemptions ──
  let body: any = {}
  try { body = await req.json() } catch { /* empty body */ }
  const { type } = body

  // ── Rate-limit check ──────────────────────────────────────────────────
  // tenant_reply and app_id_recovery are internal callbacks — exempt from IP rate limit.
  const clientIp = getClientIp(req)
  const rateLimitExempt = type === 'tenant_reply' || type === 'app_id_recovery'
  if (!rateLimitExempt && isRateLimited(clientIp)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Too many requests. Please wait a few minutes before trying again.' }),
      { status: 429, headers: { ...cors, 'Content-Type': 'application/json', 'Retry-After': '300' } }
    )
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const gasUrl    = Deno.env.get('GAS_EMAIL_URL')
    const gasSecret = Deno.env.get('GAS_RELAY_SECRET')

    // ── Inquiry Submit: validated insert + email (P7) ─────────────────────
    // This branch runs even when GAS is not configured — the DB insert always
    // succeeds; emails are silently skipped if the relay is unavailable.
    // This replaces the former direct-from-browser DB insert in cp-api.js.
    if (type === 'inquiry_submit') {
      const { tenant_name, tenant_email, tenant_phone, tenant_language, message, property_id } = body

      // ── Server-side validation ─────────────────────────────────────────
      const nameClean  = typeof tenant_name  === 'string' ? tenant_name.trim()  : ''
      const emailClean = typeof tenant_email === 'string' ? tenant_email.trim().toLowerCase() : ''
      const msgClean   = typeof message      === 'string' ? message.trim()      : ''
      const phoneClean = typeof tenant_phone === 'string' ? tenant_phone.trim().substring(0, 30) : null

      if (!nameClean)                                           throw new Error('Name is required.')
      if (!emailClean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) throw new Error('A valid email address is required.')
      if (!msgClean)                                            throw new Error('Message is required.')
      if (msgClean.length > 2000)                              throw new Error('Message must be 2000 characters or fewer.')
      if (!property_id)                                        throw new Error('property_id is required.')

      const lang = (typeof tenant_language === 'string' && tenant_language) ? tenant_language : 'en'

      // ── Verify property is active ──────────────────────────────────────
      const { data: prop, error: propErr } = await supabase
        .from('properties')
        .select('id, title, address, city, status, landlords(email, contact_name, business_name)')
        .eq('id', property_id)
        .maybeSingle()

      if (propErr || !prop) throw new Error('Property not found.')
      if ((prop as any).status !== 'active') throw new Error('This property is no longer accepting inquiries.')

      // ── Insert inquiry (service role — bypasses RLS) ───────────────────
      const { data: inquiry, error: insertErr } = await supabase
        .from('inquiries')
        .insert({
          property_id,
          tenant_name:  nameClean.substring(0, 120),
          tenant_email: emailClean,
          tenant_phone: phoneClean,
          message:      msgClean,
          read:         false,
        })
        .select()
        .single()

      if (insertErr) throw new Error('Failed to save inquiry: ' + insertErr.message)

      // ── Emails: fire-and-forget after successful insert ────────────────
      // Skip silently if GAS is not configured (inquiry is already saved).
      if (gasUrl && gasSecret) {
        // Tenant confirmation
        fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: gasSecret,
            template: 'inquiry_reply',
            to: emailClean,
            data: { name: nameClean, message: msgClean, property: property_id, preferred_language: lang },
          }),
        }).then(async (r) => {
          const json = await r.json().catch(() => ({}))
          const ok = r.ok && json.success !== false
          await supabase.from('email_logs').insert({ type: 'inquiry_reply', recipient: emailClean, status: ok ? 'sent' : 'failed', error_msg: ok ? null : (json.error || `HTTP ${r.status}`) })
        }).catch(async (e) => {
          await supabase.from('email_logs').insert({ type: 'inquiry_reply', recipient: emailClean, status: 'failed', error_msg: e?.message || 'Network error' })
        })

        // Landlord notification
        const landlordEmail = (prop as any)?.landlords?.email
        if (landlordEmail) {
          const landlordName =
            (prop as any)?.landlords?.business_name ||
            (prop as any)?.landlords?.contact_name  ||
            'Landlord'
          const propertyLabel = `${(prop as any).title} — ${(prop as any).address}, ${(prop as any).city}`
          fetch(gasUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              secret: gasSecret,
              template: 'new_message_landlord',
              to: landlordEmail,
              data: { landlordName, tenantName: nameClean, tenantEmail: emailClean, message: msgClean, property: propertyLabel, propertyId: property_id },
            }),
          }).then(async (r) => {
            const json = await r.json().catch(() => ({}))
            const ok = r.ok && json.success !== false
            await supabase.from('email_logs').insert({ type: 'new_message_landlord', recipient: landlordEmail, status: ok ? 'sent' : 'failed', error_msg: ok ? null : (json.error || `HTTP ${r.status}`) })
          }).catch(async (e) => {
            await supabase.from('email_logs').insert({ type: 'new_message_landlord', recipient: landlordEmail, status: 'failed', error_msg: e?.message || 'Network error' })
          })
        }
      }

      return new Response(JSON.stringify({ success: true, data: inquiry }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    // ── For all remaining branches, GAS relay is required ─────────────────
    if (!gasUrl || !gasSecret) {
      console.warn('GAS_EMAIL_URL or GAS_RELAY_SECRET not configured — email skipped')
      return new Response(JSON.stringify({ success: true, warning: 'Email relay not configured' }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    // ── Tenant Reply → Landlord Notification (rate-limit exempt) ──────────
    if (type === 'tenant_reply') {
      const { app_id, tenant_name, message } = body
      if (!app_id || !message) throw new Error('app_id and message required')

      const { data: appRow } = await supabase
        .from('applications')
        .select('landlord_id, first_name, last_name')
        .eq('app_id', app_id)
        .maybeSingle()

      if (appRow?.landlord_id) {
        const { data: landlordRow } = await supabase
          .from('landlords')
          .select('email, contact_name, business_name')
          .eq('id', appRow.landlord_id)
          .maybeSingle()

        if (landlordRow?.email) {
          const landlordName  = landlordRow.business_name || landlordRow.contact_name || 'Landlord'
          const applicantName = tenant_name || `${appRow.first_name || ''} ${appRow.last_name || ''}`.trim() || 'Tenant'
          fetch(gasUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              secret: gasSecret,
              template: 'new_message_landlord',
              to: landlordRow.email,
              data: { app_id, landlordName, tenantName: applicantName, message },
            }),
          }).then(async (r) => {
            const json = await r.json().catch(() => ({}))
            const ok = r.ok && json.success !== false
            await supabase.from('email_logs').insert({ type: 'new_message_landlord', recipient: landlordRow.email, status: ok ? 'sent' : 'failed', app_id, error_msg: ok ? null : (json.error || `HTTP ${r.status}`) })
          }).catch(async (e) => {
            await supabase.from('email_logs').insert({ type: 'new_message_landlord', recipient: landlordRow.email, status: 'failed', app_id, error_msg: e?.message || 'Network error' })
          })
        }
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    // ── App-ID Recovery by Email ───────────────────────────────────────────
    if (type === 'app_id_recovery_by_email') {
      const { email, dashboard_url } = body
      if (!email) throw new Error('email required')

      const dashBase = (dashboard_url || '').replace(/\/+$/, '')

      const { data: appRows } = await supabase
        .from('applications')
        .select('app_id, preferred_language, property_address, created_at')
        .ilike('email', email)
        .order('created_at', { ascending: false })
        .limit(5)

      // Always return success to prevent email enumeration
      if (appRows && appRows.length > 0) {
        for (const row of appRows) {
          const link = `${dashBase}?id=${row.app_id}`
          const preferred_language = row.preferred_language || 'en'
          fetch(gasUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              secret: gasSecret,
              template: 'app_id_recovery',
              to: email,
              data: { app_id: row.app_id, email, dashboard_url: link, preferred_language },
            }),
          }).catch(() => {})
          await supabase.from('email_logs').insert({
            type: 'app_id_recovery',
            recipient: email,
            status: 'sent',
            app_id: row.app_id,
          }).catch(() => {})
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    // ── App-ID Recovery (single) ───────────────────────────────────────────
    if (type === 'app_id_recovery') {
      const { email, app_id, dashboard_url } = body
      if (!email || !app_id) throw new Error('email and app_id required')

      const { data: appRow } = await supabase
        .from('applications')
        .select('preferred_language')
        .eq('app_id', app_id)
        .maybeSingle()
      const preferred_language = appRow?.preferred_language || 'en'

      fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: gasSecret,
          template: 'app_id_recovery',
          to: email,
          data: { app_id, email, dashboard_url, preferred_language },
        }),
      }).catch(() => {})

      await supabase.from('email_logs').insert({
        type: 'app_id_recovery',
        recipient: email,
        status: 'sent',
        app_id,
      })

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    // ── Legacy: Direct Inquiry Email (kept for compatibility) ──────────────
    // This path is no longer reached by cp-api.js (which now uses inquiry_submit).
    // Kept so any existing integrations sending just tenant_email + message + property_id
    // continue to work during the transition period.
    const { tenant_name, tenant_email, tenant_language, message, property_id } = body
    if (!tenant_email) throw new Error('tenant_email required')

    fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: gasSecret,
        template: 'inquiry_reply',
        to: tenant_email,
        data: { name: tenant_name, message, property: property_id, preferred_language: tenant_language || 'en' },
      }),
    }).then(async (r) => {
      const json = await r.json().catch(() => ({}))
      const ok = r.ok && json.success !== false
      await supabase.from('email_logs').insert({ type: 'inquiry_reply', recipient: tenant_email, status: ok ? 'sent' : 'failed', error_msg: ok ? null : (json.error || `HTTP ${r.status}`) })
    }).catch(async (e) => {
      await supabase.from('email_logs').insert({ type: 'inquiry_reply', recipient: tenant_email, status: 'failed', error_msg: e?.message || 'Network error' })
    })

    if (property_id) {
      const { data: prop } = await supabase
        .from('properties')
        .select('title, address, city, landlords(email, contact_name, business_name)')
        .eq('id', property_id)
        .single()

      const landlordEmail = (prop as any)?.landlords?.email
      if (landlordEmail) {
        const landlordName =
          (prop as any)?.landlords?.business_name ||
          (prop as any)?.landlords?.contact_name  ||
          'Landlord'
        fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: gasSecret,
            template: 'new_message_landlord',
            to: landlordEmail,
            data: {
              landlordName,
              tenantName:  tenant_name,
              tenantEmail: tenant_email,
              message,
              property: prop ? `${(prop as any).title} — ${(prop as any).address}, ${(prop as any).city}` : property_id,
              propertyId: property_id,
            },
          }),
        }).then(async (r) => {
          const json = await r.json().catch(() => ({}))
          const ok = r.ok && json.success !== false
          await supabase.from('email_logs').insert({ type: 'new_message_landlord', recipient: landlordEmail, status: ok ? 'sent' : 'failed', error_msg: ok ? null : (json.error || `HTTP ${r.status}`) })
        }).catch(async (e) => {
          await supabase.from('email_logs').insert({ type: 'new_message_landlord', recipient: landlordEmail, status: 'failed', error_msg: e?.message || 'Network error' })
        })
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  }
})
