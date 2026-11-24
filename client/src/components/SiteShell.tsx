import { Activity, CalendarDays, ChevronLeft, Trophy } from "lucide-react";
import { Link, useLocation } from "wouter";

const navigation = [
  { href: "/", label: "الرئيسية", icon: Activity },
  { href: "/matches", label: "المباريات", icon: CalendarDays },
  { href: "/competitions", label: "البطولات", icon: Trophy },
];

function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Fate Manga — الرئيسية">
      <span className="brand__mark" aria-hidden="true"><span /></span>
      <span className="brand__copy"><strong>كورة</strong><small>OLED</small></span>
    </Link>
  );
}

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const pathname = location.split("?")[0];

  return (
    <div className="app-shell" dir="rtl">
      <header className="topbar">
        <div className="shell topbar__inner">
          <Brand />
          <nav className="topnav" aria-label="التنقل الرئيسي">
            {navigation.map(item => {
              const Icon = item.icon;
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return <Link key={item.href} href={item.href} className={`topnav__link ${active ? "is-active" : ""}`}><Icon size={16} strokeWidth={2.2} />{item.label}</Link>;
            })}
          </nav>
          <div className="topbar__live"><span className="live-dot" /> بيانات حية</div>
        </div>
      </header>
      <main className="shell page-content">{children}</main>
      <footer className="shell footer">
        <span>Fate Manga</span>
        <span className="footer__separator">·</span>
        <span>مركز مباريات مستقل بواجهة عربية</span>
        <Link href="/matches" className="footer__link">كل المباريات <ChevronLeft size={14} /></Link>
      </footer>
    </div>
  );
}
