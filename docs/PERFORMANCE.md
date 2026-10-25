# Performance — Barako Brew Front-End

Measured with Lighthouse (Chrome DevTools, Mobile, Slow 4G).
Before = source files served by Live Server. After = the minified `release/` folder served with `http-server release -p 8081`.

| Metric | Before | After |
|---|---|---|
| Performance score | | |
| Accessibility score | | |
| Total page weight (KB) | | |
| Number of requests | | |
| Largest image (KB) | | |
| app.js (KB) | 20.7 | 11.2 |
| style.css (KB) | 3.2 | 2.5 |
| index.html (KB) | 3.3 | 2.8 |
| Images, total (KB) | 2,000 (originals/) | 48 (images/) |

## What was done

- **Images:** resized to display size in GIMP and exported as WebP at quality 75 (originals/ → images/); `width` and `height` set; `loading="lazy"` on menu cards.
- **Scripts:** `defer`; no unused libraries; vanilla JavaScript everywhere except the small Vue.js Budget picks.
- **Minified:** terser (JS), clean-css (CSS), html-minifier-terser (HTML) into `release/` with `release.ps1`.
- **CDN:** Vue.js from the Cloudflare CDN (cdnjs), with a local copy in `vendor/` as fallback.
- **Mobile:** viewport meta, Bootstrap's mobile-first grid, tested with the Device Toolbar at 375 px and Slow 4G throttling.
- **Trade-off:** `bootstrap.min.css` (233 KB, about 30 KB when the server compresses it) is the largest file. It is served locally and cached after the first visit; removing unused Bootstrap CSS (e.g. with PurgeCSS) is a possible next step.
- **Cross-browser:** Lighthouse in Chrome and Edge; manual check in Firefox.
- **Debugging:** DevTools Console (0 errors), Sources breakpoints, Network status codes; ESLint in VS Code.
