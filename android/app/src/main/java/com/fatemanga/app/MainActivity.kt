package com.fatemanga.app

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.setPadding
import android.util.Base64
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private val fateUrl = "https://fate-manga.vercel.app/"
    private val localUrl = "file:///android_asset/index.html"
    private val cookieManager by lazy { CookieManager.getInstance() }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.rgb(8, 11, 18)
        window.navigationBarColor = Color.rgb(8, 11, 18)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.rgb(8, 11, 18))
        }
        val bar = LinearLayout(this).apply {
            gravity = Gravity.CENTER_VERTICAL
            setPadding(8)
            setBackgroundColor(Color.rgb(13, 18, 32))
        }
        val title = TextView(this).apply {
            text = "Fate Manga  ·  1.2026"
            textSize = 16f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER_VERTICAL
        }
        bar.addView(title, LinearLayout.LayoutParams(0, 52, 1f))
        bar.addView(button("تحديث") { webView.reload() })
        bar.addView(button("مسح الجلسة") { clearSession() })
        bar.addView(button("فتح") { openExternal() })

        webView = WebView(this).apply {
            setBackgroundColor(Color.BLACK)
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                loadsImagesAutomatically = true
                mediaPlaybackRequiresUserGesture = true
                mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
                userAgentString = "$userAgentString FateManga/1.2026"
            }
            CookieManager.getInstance().setAcceptCookie(true)
            CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)
            webChromeClient = WebChromeClient()
            addJavascriptInterface(FateBridge(), "Android")
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    return request.url.scheme !in setOf("https", "http")
                }

                override fun onPageFinished(view: WebView, url: String) {
                    cookieManager.flush()
                    super.onPageFinished(view, url)
                }

                override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                    // Keep normal WebView networking and cookies intact; no proxy or challenge bypass.
                    return super.shouldInterceptRequest(view, request)
                }
            }
        }

        root.addView(bar, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 60))
        root.addView(webView, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))
        setContentView(root)
        // The UI is bundled from the GitHub checkout into app/src/main/assets.
        // Network requests are performed through the native bridge below.
        webView.loadUrl(localUrl)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })
    }

    private fun button(label: String, action: () -> Unit) = Button(this).apply {
        text = label
        textSize = 11f
        setOnClickListener { action() }
    }

    private fun clearSession() {
        cookieManager.removeAllCookies {
            cookieManager.flush()
            webView.clearCache(true)
            webView.clearHistory()
            Toast.makeText(this, "تم مسح جلسة WebView المحلية", Toast.LENGTH_SHORT).show()
            webView.loadUrl(fateUrl)
        }
    }

    private fun openExternal() {
        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(fateUrl)))
    }

    inner class FateBridge {
        @JavascriptInterface
        fun getCookies(url: String): String = cookieManager.getCookie(url).orEmpty()

        @JavascriptInterface
        fun getUserAgent(): String = webView.settings.userAgentString.orEmpty()

        @JavascriptInterface
        fun request(payload: String): String {
            return try {
                val input = JSONObject(payload)
                val target = input.optString("url")
                require(target.startsWith("https://") || target.startsWith("http://")) { "Unsupported URL" }
                val connection = (URL(target).openConnection() as HttpURLConnection).apply {
                    requestMethod = input.optString("method", "GET")
                    connectTimeout = 25_000
                    readTimeout = 25_000
                    instanceFollowRedirects = true
                    setRequestProperty("X-Fate-App", "android-webview/1.2026")
                    val headers = input.optJSONObject("headers")
                    headers?.keys()?.forEach { key -> setRequestProperty(key, headers.optString(key)) }
                    val body = input.optString("body", "")
                    if (body.isNotEmpty() && requestMethod !in setOf("GET", "HEAD")) {
                        doOutput = true
                        outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
                    }
                }
                val status = connection.responseCode
                val stream = if (status >= 400) connection.errorStream else connection.inputStream
                val bytes = stream?.use { it.readBytes() } ?: ByteArray(0)
                require(bytes.size <= 20 * 1024 * 1024) { "Response too large" }
                val binary = input.optBoolean("binary", false)
                val body = if (binary) Base64.encodeToString(bytes, Base64.NO_WRAP) else bytes.toString(Charsets.UTF_8)
                JSONObject().apply {
                    put("status", status)
                    put("body", body)
                    put("contentType", connection.contentType ?: "application/octet-stream")
                }.toString().also { connection.disconnect() }
            } catch (error: Exception) {
                JSONObject().apply {
                    put("status", 599)
                    put("body", "")
                    put("contentType", "text/plain")
                    put("error", error.message ?: "Native request failed")
                }.toString()
            }
        }

        @JavascriptInterface
        fun clearCookies() { runOnUiThread { clearSession() } }
    }
}
