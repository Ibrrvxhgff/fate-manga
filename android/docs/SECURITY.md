# Security notes

- Cookies are read from the device WebView CookieManager only through the local JavaScript bridge.
- No Cookie value is hard-coded, logged, uploaded, or committed.
- Clear session removes WebView cookies, cache, and history on the device.
- Cloudflare challenges remain a manual user step. The app does not bypass, solve, or disguise the challenge.
- Release signing keys must stay outside the repository.
