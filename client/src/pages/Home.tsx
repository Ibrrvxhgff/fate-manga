import { ArrowLeft, BarChart3, CalendarDays, ShieldCheck, Zap } from "lucide-react";
import { Link } from "wouter";
import SiteShell from "@/components/SiteShell";
import MatchesView from "@/components/MatchesView";

export default function Home() {
  return (
    <SiteShell>
      <section className="hero-grid">
        <div className="hero-panel">
          <div className="eyebrow"><span className="eyebrow__line" /> مركز النتائج <span className="eyebrow__live">LIVE</span></div>
          <h1>النتيجة أمامك.<br /><em>واللحظة لا تنتظر.</em></h1>
          <p>جدول مباريات واضح، نتائج مباشرة، وتحديثات خفيفة مصممة لشاشة جوالك — بلا ضوضاء ولا خطوات زائدة.</p>
          <div className="hero-panel__actions"><Link href="/matches" className="button button--primary">استعرض كل المباريات <ArrowLeft size={17} /></Link><Link href="/competitions" className="button button--ghost">تصفح البطولات</Link></div>
          <div className="hero-panel__signal"><span className="signal-bars"><i /><i /><i /><i /></span><span>البيانات التجريبية جاهزة للربط بمصدر API مصرح به</span></div>
        </div>
        <div className="hero-orbit" aria-hidden="true"><div className="orbit__ring orbit__ring--outer" /><div className="orbit__ring orbit__ring--inner" /><div className="orbit__core"><span>90</span><small>دقيقة</small></div><span className="orbit__label orbit__label--one">النتيجة</span><span className="orbit__label orbit__label--two">مباشر</span><span className="orbit__label orbit__label--three">الوقت</span></div>
      </section>

      <section className="benefit-row" aria-label="مزايا الموقع">
        <div className="benefit"><span className="benefit__icon"><Zap size={17} /></span><div><strong>تحديث كل دقيقة</strong><small>مع زر تحديث يدوي</small></div></div>
        <div className="benefit"><span className="benefit__icon"><CalendarDays size={17} /></span><div><strong>كل أيام المباريات</strong><small>تنقل سريع بالتاريخ</small></div></div>
        <div className="benefit"><span className="benefit__icon"><ShieldCheck size={17} /></span><div><strong>مصدر آمن</strong><small>لا أسرار في المتصفح</small></div></div>
        <div className="benefit"><span className="benefit__icon"><BarChart3 size={17} /></span><div><strong>معلومة مركزة</strong><small>حسب البطولة والحالة</small></div></div>
      </section>

      <MatchesView mode="home" />
    </SiteShell>
  );
}
