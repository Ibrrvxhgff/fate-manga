# Fate Manga Android

تطبيق Android مستقل لـ Fate Manga، يعتمد على WebView أصلي ويحمّل نسخة `client/index.html` من مستودع GitHub داخل `app/src/main/assets/index.html`. لا يحتاج التطبيق إلى فتح واجهة الموقع من Vercel لعرض الواجهة؛ طلبات المصادر تخرج عبر الجسر الأصلي مع Cookies وUser-Agent المحليين.

## المزايا

- WebView أصلي مع JavaScript وDOM Storage وCookies محلية.
- جسر JavaScript: `Android.getCookies(url)` و`Android.getUserAgent()` و`Android.request(payload)`.
- واجهة Fate HTML مضمّنة من نسخة GitHub وقت البناء؛ أي تحديث من GitHub يحتاج إعادة بناء APK.
- تحديث الصفحة، فتح الرابط خارجيًا، ومسح Cookies/cache/history محليًا.
- إصدار التطبيق `1.2026`.
- لا توجد أسرار أو Cookies مضمّنة في المصدر.

## البناء الرسمي

هذا مجلد مصدر Android مستقل. استخدم بيئة Android/Gradle الرسمية أو عملية Mobile Build في Manus/EAS لإنشاء APK. بعد توفر Android SDK وGradle:

```bash
gradle assembleDebug
```

الخرج المتوقع:

```text
app/build/outputs/apk/debug/app-debug.apk
```

نسخة release النهائية يجب أن تُبنى وتُوقّع بمفتاح المستخدم الخاص، ولا ينبغي نشر مفتاح التوقيع داخل المستودع.
