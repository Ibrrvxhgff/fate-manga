import { ArrowRight, SearchX } from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";

const NOT_FOUND_PATH = "/404";

export default function NotFound() {
  useEffect(() => {
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex";
    document.head.appendChild(robots);
    if (window.location.pathname.replace(/\/$/, "") !== NOT_FOUND_PATH) window.location.replace(NOT_FOUND_PATH);
    return () => robots.remove();
  }, []);

  return <main className="not-found"><div className="not-found__mark"><SearchX size={36} /></div><span className="eyebrow"><span className="eyebrow__line" /> 404 · لا توجد هذه الصفحة</span><h1>الملعب فارغ هنا.</h1><p>الرابط الذي فتحته غير موجود أو تم تغييره. عد إلى مركز المباريات لتكمل المتابعة.</p><Link href="/" className="button button--primary"><ArrowRight size={17} /> العودة للرئيسية</Link></main>;
}
