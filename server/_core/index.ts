import "dotenv/config";
import crypto from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getCompetitionSummary, getDates, getMatchById, getMatches } from "../data/matches";
import type { MatchStatus } from "@shared/matches";
import { codeHash, newCode, publicSources, readStore, sourceCookie, verifyCode, writeStore } from "../data/dev-settings";

const allowedStatuses = new Set<MatchStatus>(["live", "scheduled", "done"]);
const apiWindows = new Map<string, { startedAt: number; count: number }>();
const sourceHosts = new Set([
  "starzmanga.net", "appswat.com", "meshmanga.com", "manonga.online", "hijala.com",
  "azorafly.com", "mangalik.net", "lavascans.com", "olympustaff.com", "3asq.online",
  "mangatuk.com", "lagoonscans.com", "ar.kenmanga.com", "mangatek.com",
  "kingofshojo.com", "vortexscans.org", "asurascans.com",
]);
const proxyWindows = new Map<string, { startedAt: number; count: number }>();
const devSessions = new Map<string, number>();
const devLoginWindows = new Map<string, { startedAt: number; count: number }>();
const metadataCache = new Map<string, { at: number; value: unknown }>();
const metadataWindows = new Map<string, { startedAt: number; count: number }>();

function isAllowedSourceUrl(value: string) {
  try {
    const u = new URL(value);
    const configuredHosts = readStore().sources.flatMap(source => { try { return [new URL(source.base).hostname]; } catch { return []; } });
    return u.protocol === "https:" && !isUnsafeHostname(u.hostname) && [...sourceHosts, ...configuredHosts].some(
      host => u.hostname === host || u.hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}

function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const octets = address.split(".").map(Number);
    const [a, b] = octets;
    return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 0 || b === 168)) || (a === 198 && (b === 18 || b === 19 || b === 51)) || (a === 203 && b === 0);
  }
  if (isIP(address) === 6) {
    const value = address.toLowerCase();
    if (value.startsWith("::ffff:")) {
      const mapped = value.slice("::ffff:".length);
      return isIP(mapped) === 4 ? isPrivateAddress(mapped) : true;
    }
    return value === "::" || value === "::1" || value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe8") || value.startsWith("fe9") || value.startsWith("fea") || value.startsWith("feb");
  }
  return true;
}

function isUnsafeHostname(hostname: string) {
  const value = hostname.toLowerCase().replace(/\.$/, "");
  return !value || value === "localhost" || value.endsWith(".localhost") || value.endsWith(".local") || value.endsWith(".internal") || (isIP(value) !== 0 && isPrivateAddress(value));
}

async function assertSafeSourceUrl(value: string) {
  if (!isAllowedSourceUrl(value)) throw new Error("SOURCE_NOT_ALLOWED");
  const hostname = new URL(value).hostname;
  let addresses: { address: string }[];
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error("SOURCE_NOT_ALLOWED");
  }
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) throw new Error("SOURCE_NOT_ALLOWED");
}

function cookieValue(req: express.Request, name: string) {
  return req.headers.cookie?.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))?.[1] || "";
}

function sameOriginMutation(req: express.Request, res: express.Response, next: express.NextFunction) {
  const origin = req.headers.origin;
  if (!origin) return next();
  const forwardedHost = req.headers["x-forwarded-host"];
  const expectedHost = (typeof forwardedHost === "string" ? forwardedHost.split(",")[0].trim() : req.headers.host) || "";
  const forwardedProto = req.headers["x-forwarded-proto"];
  const expectedProtocol = (typeof forwardedProto === "string" ? forwardedProto.split(",")[0].trim() : req.protocol) || "https";
  try {
    const parsed = new URL(origin);
    if (parsed.host !== expectedHost || parsed.protocol !== `${expectedProtocol}:`) return res.status(403).json({ error: "CROSS_ORIGIN_REQUEST" });
  } catch {
    return res.status(403).json({ error: "CROSS_ORIGIN_REQUEST" });
  }
  return next();
}

function requireDeveloperCsrf(req: express.Request, res: express.Response, next: express.NextFunction) {
  const cookie = cookieValue(req, "fate_dev_csrf");
  const header = req.headers["x-csrf-token"];
  const token = typeof header === "string" ? header : "";
  if (!cookie || !token || cookie.length !== token.length || !crypto.timingSafeEqual(Buffer.from(cookie), Buffer.from(token))) return res.status(403).json({ error: "CSRF_REQUIRED" });
  return next();
}

function proxyRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const address = req.ip || "unknown";
  const now = Date.now();
  const current = proxyWindows.get(address);
  if (!current || now - current.startedAt > 60_000) {
    proxyWindows.set(address, { startedAt: now, count: 1 });
    return next();
  }
  if (current.count >= 180) return res.status(429).json({ error: "RATE_LIMITED" });
  current.count += 1;
  return next();
}

async function fetchSource(url: string) {
  let current = url;
  for (let i = 0; i < 4; i += 1) {
    await assertSafeSourceUrl(current);
    const upstream = await fetch(current, {
      redirect: "manual",
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/149 Safari/537.36",
        "Accept-Language": "ar,en;q=0.8",
        Referer: `${new URL(current).origin}/`,
        ...(sourceCookie(new URL(current).hostname) ? { Cookie: sourceCookie(new URL(current).hostname) } : {}),
      },
    });
    if (upstream.status >= 300 && upstream.status < 400) {
      const location = upstream.headers.get("location");
      if (!location) return upstream;
      current = new URL(location, current).href;
      continue;
    }
    return upstream;
  }
  throw new Error("TOO_MANY_REDIRECTS");
}

function apiRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const now = Date.now();
  const address = req.ip || "unknown";
  const current = apiWindows.get(address);
  if (!current || now - current.startedAt > 60_000) {
    apiWindows.set(address, { startedAt: now, count: 1 });
    return next();
  }
  if (current.count >= 120) {
    res.set("Retry-After", "60");
    return res.status(429).json({ error: "RATE_LIMITED", message: "عدد الطلبات كبير مؤقتًا. حاول بعد قليل." });
  }
  current.count += 1;
  return next();
}

function sessionFrom(req: express.Request) {
  const raw = cookieValue(req, "fate_dev_session");
  if (!raw) return false;
  const expires = devSessions.get(raw) || 0;
  if (expires < Date.now()) { devSessions.delete(raw); return false; }
  return true;
}

function requireDeveloper(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!sessionFrom(req)) return res.status(401).json({ error: "DEVELOPER_AUTH_REQUIRED" });
  return next();
}

function devLoginRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const address = req.ip || "unknown";
  const now = Date.now();
  const current = devLoginWindows.get(address);
  if (!current || now - current.startedAt > 10 * 60_000) { devLoginWindows.set(address, { startedAt: now, count: 1 }); return next(); }
  if (current.count >= 10) return res.status(429).json({ error: "LOGIN_RATE_LIMITED" });
  current.count += 1;
  return next();
}

function metadataRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const address = req.ip || "unknown";
  const now = Date.now();
  const current = metadataWindows.get(address);
  if (!current || now - current.startedAt > 60_000) { metadataWindows.set(address, { startedAt: now, count: 1 }); return next(); }
  if (current.count >= 10) return res.status(429).json({ error: "METADATA_RATE_LIMITED" });
  current.count += 1;
  return next();
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "X-DNS-Prefetch-Control": "off",
      "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https:; frame-src https:; font-src 'self' data: https:; object-src 'none'; base-uri 'self'; form-action 'self'",
    });
    if (req.headers["x-forwarded-proto"] === "https" || process.env.NODE_ENV === "production") res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
  });
  // Keep request bodies bounded; this app does not accept file uploads.
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "64kb", extended: true, parameterLimit: 100 }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/source-config", (_req, res) => res.json({ sources: publicSources(), settings: readStore().settings }));
  app.post("/api/dev/login", sameOriginMutation, devLoginRateLimit, (req, res) => {
    const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
    if (!code || code.length > 128 || !verifyCode(code)) return res.status(401).json({ error: "INVALID_DEVELOPER_CODE" });
    const token = crypto.randomBytes(32).toString("hex");
    const csrf = crypto.randomBytes(32).toString("hex");
    devSessions.set(token, Date.now() + 8 * 60 * 60 * 1000);
    const secure = req.headers["x-forwarded-proto"] === "https" || process.env.NODE_ENV === "production" ? "; Secure" : "";
    res.set("Set-Cookie", `fate_dev_session=${token}; Path=/; HttpOnly; SameSite=None; Max-Age=28800${secure}`);
    res.append("Set-Cookie", `fate_dev_csrf=${csrf}; Path=/; SameSite=None; Max-Age=28800${secure}`);
    return res.json({ ok: true });
  });
  app.post("/api/dev/logout", sameOriginMutation, requireDeveloper, requireDeveloperCsrf, (req, res) => {
    const raw = cookieValue(req, "fate_dev_session");
    if (raw) devSessions.delete(raw);
    res.set("Set-Cookie", "fate_dev_session=; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=0");
    res.append("Set-Cookie", "fate_dev_csrf=; Path=/; SameSite=None; Secure; Max-Age=0");
    return res.json({ ok: true });
  });
  app.get("/api/dev/state", requireDeveloper, (_req, res) => {
    const store = readStore();
    return res.json({ codes: store.codes.map(c => ({ id: c.id, label: c.label, createdAt: c.createdAt, active: c.active })), sources: store.sources, settings: store.settings });
  });
  app.post("/api/dev/codes", sameOriginMutation, requireDeveloper, requireDeveloperCsrf, (req, res) => {
    const store = readStore();
    const code = newCode();
    store.codes.push({ id: crypto.randomUUID(), label: typeof req.body?.label === "string" ? req.body.label.slice(0, 80) : "كود مطوّر", hash: codeHash(code), createdAt: new Date().toISOString(), active: true });
    writeStore(store);
    return res.json({ code });
  });
  app.delete("/api/dev/codes/:id", sameOriginMutation, requireDeveloper, requireDeveloperCsrf, (req, res) => {
    const store = readStore();
    const active = store.codes.filter(c => c.active);
    if (active.length <= 1 && active.some(c => c.id === req.params.id)) return res.status(400).json({ error: "LAST_CODE" });
    store.codes = store.codes.filter(c => c.id !== req.params.id);
    writeStore(store);
    return res.json({ ok: true });
  });
  app.put("/api/dev/sources", sameOriginMutation, requireDeveloper, requireDeveloperCsrf, (req, res) => {
    const sources = Array.isArray(req.body?.sources) ? req.body.sources.slice(0, 100) : [];
    const clean = sources.filter((s: any) => {
      if (typeof s?.id !== "string" || typeof s?.name !== "string") return false;
      try { const base = new URL(String(s.base)); return base.protocol === "https:" && !base.username && !base.password && !base.port && !isUnsafeHostname(base.hostname); } catch { return false; }
    }).map((s: any) => ({
      id: String(s.id).slice(0, 80), name: String(s.name).slice(0, 120), base: String(s.base).replace(/\/+$/, "").slice(0, 500), kind: String(s.kind || "madara").slice(0, 30), api: String(s.api || "").slice(0, 500), list: String(s.list || "").slice(0, 500), search: String(s.search || "").slice(0, 500), alt: Array.isArray(s.alt) ? s.alt.slice(0, 10).map(String) : [], sel: s.sel && typeof s.sel === "object" ? s.sel : {}, imgT: !!s.imgT, viaP: !!s.viaP, enabled: s.enabled !== false, cookie: String(s.cookie || "").slice(0, 12000),
    }));
    const store = readStore(); store.sources = clean; writeStore(store); return res.json({ ok: true, count: clean.length });
  });
  app.put("/api/dev/settings", sameOriginMutation, requireDeveloper, requireDeveloperCsrf, (req, res) => {
    const proxyTemplate = typeof req.body?.proxyTemplate === "string" ? req.body.proxyTemplate.slice(0, 1000) : "/api/source-proxy?url={url}";
    if (!proxyTemplate.includes("{url}") || /javascript:|data:|@/.test(proxyTemplate)) return res.status(400).json({ error: "INVALID_PROXY_TEMPLATE" });
    const store = readStore(); store.settings.proxyTemplate = proxyTemplate; writeStore(store); return res.json({ ok: true });
  });
  app.post("/api/manga-meta", metadataRateLimit, async (req, res) => {
    const rawTitles: unknown[] = Array.isArray(req.body?.titles) ? req.body.titles : [];
    const titles: string[] = [...new Set(rawTitles.map(x => String(x).trim()).filter((x: string) => x.length >= 2 && x.length <= 160))].slice(0, 12);
    const result: Record<string, unknown> = {};
    const missing: string[] = [];
    for (const title of titles) {
      const key = title.toLowerCase(); const hit = metadataCache.get(key);
      if (hit && Date.now() - hit.at < 86_400_000) result[title] = hit.value; else missing.push(title);
    }
    if (missing.length) {
      try {
        const variables: Record<string, string> = {};
        const fields = missing.map((title, i) => { const key = `t${i}`; variables[key] = title; return `m${i}: Page(perPage: 1) { media(search: $${key}, type: MANGA, sort: SEARCH_MATCH) { id idMal title { romaji english native } genres averageScore popularity format status } }`; }).join(" ");
        const query = `query(${missing.map((_, i) => `$t${i}: String!`).join(",")}) { ${fields} }`;
        const upstream = await fetch("https://graphql.anilist.co", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ query, variables }) });
        const payload = await upstream.json() as { data?: Record<string, { media?: unknown[] }> };
        missing.forEach((title, i) => { const value = payload.data?.[`m${i}`]?.media?.[0] || null; metadataCache.set(title.toLowerCase(), { at: Date.now(), value }); result[title] = value; });
      } catch { missing.forEach(title => { result[title] = null; }); }
    }
    return res.json({ source: "AniList", items: result });
  });
  app.get("/api/source-proxy", proxyRateLimit, async (req, res) => {
    const target = typeof req.query.url === "string" ? req.query.url : "";
    if (!isAllowedSourceUrl(target)) return res.status(400).json({ error: "SOURCE_NOT_ALLOWED" });
    try {
      const upstream = await fetchSource(target);
      const body = Buffer.from(await upstream.arrayBuffer());
      if (body.byteLength > 20 * 1024 * 1024) return res.status(413).json({ error: "RESPONSE_TOO_LARGE" });
      res.status(upstream.status);
      const contentType = upstream.headers.get("content-type");
      if (contentType) res.set("Content-Type", contentType);
      res.set("Cache-Control", "no-store");
      return res.send(body);
    } catch (error) {
      const message = error instanceof Error ? error.message : "UPSTREAM_FAILED";
      return res.status(message === "SOURCE_NOT_ALLOWED" ? 400 : 502).json({ error: message });
    }
  });
  app.get("/api/matches", apiRateLimit, (req, res) => {
    const rawStatus = typeof req.query.status === "string" ? req.query.status : undefined;
    const status = rawStatus && allowedStatuses.has(rawStatus as MatchStatus) ? rawStatus as MatchStatus : undefined;
    const date = typeof req.query.date === "string" && req.query.date.length <= 10 ? req.query.date : undefined;
    const competition = typeof req.query.competition === "string" && req.query.competition.length <= 48 ? req.query.competition : undefined;
    const q = typeof req.query.q === "string" ? req.query.q.slice(0, 80) : undefined;
    const matches = getMatches({ date, status, competition, q });
    res.set("Cache-Control", "no-store").json({
      matches,
      dates: getDates(),
      competitions: getCompetitionSummary(),
      updatedAt: new Date().toISOString(),
      source: "demo",
    });
  });
  app.get("/api/matches/:id", apiRateLimit, (req, res) => {
    const id = req.params.id.slice(0, 64);
    const match = getMatchById(id);
    if (!match) return res.status(404).json({ error: "NOT_FOUND", message: "المباراة غير موجودة." });
    return res.set("Cache-Control", "no-store").json(match);
  });
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  server.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
}

startServer().catch(error => { console.error(error); process.exit(1); });
