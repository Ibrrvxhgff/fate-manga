import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_SOURCES } from "./default-sources";

export type DevSource = {
  id: string;
  name: string;
  base: string;
  icon?: string;
  kind?: string;
  api?: string;
  list?: string;
  search?: string;
  alt?: string[];
  sel?: Record<string, string>;
  imgT?: boolean;
  viaP?: boolean;
  enabled?: boolean;
  cookie?: string;
};

type DevCode = { id: string; label: string; hash: string; createdAt: string; active: boolean };
type Store = { version: number; codes: DevCode[]; sources: DevSource[]; settings: { proxyTemplate: string } };

const file = path.resolve(process.cwd(), "server/data/dev-settings.json");
const initialHash = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4";
const fallback: Store = { version: 1, codes: [{ id: "primary", label: "الرمز الأساسي", hash: initialHash, createdAt: new Date().toISOString(), active: true }], sources: [], settings: { proxyTemplate: "/api/source-proxy?url={url}" } };

function ensureFile() {
  if (!fs.existsSync(file)) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
  }
}

export function readStore(): Store {
  try {
    ensureFile();
    return JSON.parse(fs.readFileSync(file, "utf8")) as Store;
  } catch {
    return fallback;
  }
}

export function writeStore(store: Store) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(store, null, 2));
  fs.renameSync(temp, file);
}

export function codeHash(code: string) {
  return crypto.createHash("sha256").update(code, "utf8").digest("hex");
}

export function verifyCode(code: string) {
  const hash = codeHash(code);
  return readStore().codes.some(c => c.active && c.hash.length === hash.length && crypto.timingSafeEqual(Buffer.from(c.hash), Buffer.from(hash)));
}

export function newCode() {
  return crypto.randomBytes(5).toString("hex").toUpperCase();
}

export function publicSources() {
  const sources = effectiveSources();
  return sources.filter(s => s.enabled !== false).map(({ cookie: _cookie, ...safe }) => safe);
}

/** Use bundled public sources when the optional writable store is empty. */
export function effectiveSources() {
  const configured = readStore().sources;
  return configured.length ? configured : DEFAULT_SOURCES;
}

export function sourceCookie(hostname: string) {
  return effectiveSources().find(s => {
    try { const h = new URL(s.base).hostname; return hostname === h || hostname.endsWith(`.${h}`); } catch { return false; }
  })?.cookie || "";
}
