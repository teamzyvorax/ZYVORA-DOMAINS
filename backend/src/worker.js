const RESERVED = new Set(["www","api","admin","mail","ftp","smtp","pop","imap","ns1","ns2","status","support","help","docs","blog"]);
const NAME_RE = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;
const json = (data, status = 200, origin = "*") => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": origin, "vary": "Origin" }
});
function cors(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = env.ALLOWED_ORIGIN || "";
  return origin && allowed && origin === allowed ? origin : "null";
}
async function hash(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2,"0")).join("");
}
async function limited(db, ip) {
  const now = Math.floor(Date.now()/1000);
  const key = await hash(ip || "unknown");
  await db.prepare(`INSERT INTO request_rate_limits(ip_hash,window_start,request_count)
    VALUES(?,?,1)
    ON CONFLICT(ip_hash) DO UPDATE SET
      request_count=CASE WHEN window_start < ? THEN 1 ELSE request_count+1 END,
      window_start=CASE WHEN window_start < ? THEN excluded.window_start ELSE window_start END`)
    .bind(key, now, now-3600, now-3600).run();
  const row = await db.prepare("SELECT request_count FROM request_rate_limits WHERE ip_hash=?").bind(key).first();
  return (row?.request_count || 0) > 5;
}
function validName(name) {
  return typeof name === "string" && NAME_RE.test(name) && !RESERVED.has(name);
}
export default {
  async fetch(request, env) {
    const origin = cors(request, env);
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: {
        "access-control-allow-origin": origin, "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "content-type", "access-control-max-age": "86400", "vary": "Origin"
      }});
    }
    if (url.pathname === "/health" && request.method === "GET") return json({ ok: true, service: "zyvora-domains-api" }, 200, origin);
    if (url.pathname === "/api/check" && request.method === "GET") {
      const name = (url.searchParams.get("name") || "").toLowerCase();
      if (!validName(name)) return json({ ok:false, error:"invalid_name" }, 400, origin);
      const existing = await env.DB.prepare("SELECT status FROM domain_requests WHERE name=? COLLATE NOCASE").bind(name).first();
      return json({ ok:true, name, available:!existing, note:"Availability is based on Zyvora's request database, not public DNS registration." }, 200, origin);
    }
    if (url.pathname === "/api/requests" && request.method === "POST") {
      if (!env.DB) return json({ ok:false, error:"database_not_configured" }, 503, origin);
      let body;
      try { body = await request.json(); } catch { return json({ ok:false, error:"invalid_json" }, 400, origin); }
      if (body.website) return json({ ok:true, status:"pending" }, 202, origin); // honeypot
      const name = String(body.name || "").trim().toLowerCase();
      const email = String(body.email || "").trim().toLowerCase();
      const projectUrl = String(body.projectUrl || "").trim().slice(0,300);
      const reason = String(body.reason || "").trim().slice(0,1000);
      if (!validName(name)) return json({ ok:false, error:"invalid_name" }, 400, origin);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return json({ ok:false, error:"invalid_email" }, 400, origin);
      if (await limited(env.DB, request.headers.get("CF-Connecting-IP"))) return json({ ok:false, error:"rate_limited" }, 429, origin);
      const id = crypto.randomUUID();
      try {
        await env.DB.prepare("INSERT INTO domain_requests(id,name,email,project_url,reason) VALUES(?,?,?,?,?)")
          .bind(id,name,email,projectUrl,reason).run();
      } catch (error) {
        return json({ ok:false, error:"name_unavailable_or_database_error" }, 409, origin);
      }
      return json({ ok:true, id, name, status:"pending", message:"Request received for manual review. No DNS record has been created." }, 202, origin);
    }
    return json({ ok:false, error:"not_found" }, 404, origin);
  }
};
