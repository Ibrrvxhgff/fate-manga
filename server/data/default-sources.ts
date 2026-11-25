import type { DevSource } from "./dev-settings";

/**
 * Public, non-secret source definitions shipped with the application.
 * Cookies and developer overrides remain in dev-settings.json and are never
 * included in the public API response.
 */
export const DEFAULT_SOURCES: DevSource[] = [
  { id: "starz", name: "ستارز مانجا", base: "https://starzmanga.net", icon: "https://starzmanga.net/wp-content/512starzmanga.png", kind: "madara", list: "/manga/{pp}", search: "/?s={q}&post_type=wp-manga&paged={p}", alt: ["/?s=&post_type=wp-manga&paged={p}", "/manga/?page={p}", "/series/?page={p}"] },
  { id: "swat", name: "مانجا سوات", base: "https://appswat.com", kind: "swat", api: "https://appswat.com/v2/api/v2/", list: "", search: "" },
  { id: "manonga", name: "مانجا أونلاين", base: "https://manonga.online", icon: "https://www.onma.me/uploads/favicon.png", kind: "madara", list: "/manga/{pp}", search: "/?s={q}&post_type=wp-manga&paged={p}", alt: ["/?s=&post_type=wp-manga&paged={p}", "/manga/?page={p}", "/series/?page={p}"] },
  { id: "hijala", name: "مانجا حجالة", base: "https://hijala.com", kind: "madara", list: "/manga/?order=update&page={p}", search: "/?s={q}", alt: ["/manga/?order=update", "/page/{p}"] },
  { id: "azora", name: "أزورا", base: "https://azorafly.com", kind: "stream", list: "/series/?page={p}", search: "/series/?search={q}&page={p}", alt: ["/series/"] },
  { id: "mangalik", name: "مانجا ليك", base: "https://mangalik.net", icon: "https://io.mangalik.net/wp-content/app/lekmanganet/512.png", kind: "madara", list: "/manga/{pp}", search: "/?s={q}&post_type=wp-manga&paged={p}", alt: ["/?s=&post_type=wp-manga&paged={p}", "/manga/?page={p}", "/series/?page={p}"] },
  { id: "lava", name: "لافا سكانس", base: "https://lavascans.com", kind: "astro", imgT: true, list: "/series?page={p}", search: "/?s={q}&page={p}", alt: ["/series/?page={p}", "/?s=&page={p}", "/"] },
  { id: "teamx", name: "تيم إكس", base: "https://olympustaff.com", kind: "generic", list: "/series?page={p}", search: "/?s={q}&page={p}", alt: ["/series/?page={p}", "/"] },
  { id: "3asq", name: "العاشق", base: "https://3asq.online", kind: "madara", list: "/manga/{pp}", search: "/?s={q}&post_type=wp-manga&paged={p}", alt: ["/?s=&post_type=wp-manga&paged={p}", "/manga/?page={p}", "/series/?page={p}"] },
  { id: "mangatuk", name: "مانجا توك", base: "https://mangatuk.com", icon: "https://mangatuk.com/site-icons/17ca9e84/icon-192.png", kind: "generic", list: "/manga/?page={p}", search: "/?s={q}&page={p}", alt: ["/series/?page={p}", "/?s=&page={p}", "/"] },
  { id: "lagoonscans", name: "لاغون سكانز", base: "https://lagoonscans.com", kind: "madara", list: "/manga/{pp}", search: "/?s={q}&post_type=wp-manga&paged={p}", alt: ["/?s=&post_type=wp-manga&paged={p}", "/manga/?page={p}", "/series/?page={p}"] },
  { id: "kingofshojo", name: "King Of Shojo", base: "https://kingofshojo.com", kind: "madara", list: "/manga/{pp}", search: "/?s={q}&post_type=wp-manga&paged={p}", alt: ["/?s=&post_type=wp-manga&paged={p}", "/manga/?page={p}", "/series/?page={p}"] },
  { id: "vortexscans", name: "Vortex Scans", base: "https://vortexscans.org", kind: "stream", list: "/series/?page={p}", search: "/series/?search={q}&page={p}", alt: ["/series/"] },
  { id: "asurascans", name: "Asura Scans", base: "https://asurascans.com", kind: "astro", imgT: true, list: "/browse/comics?page={p}", search: "/browse/comics?q={q}&page={p}", alt: ["/browse/comics", "/"] },
];
