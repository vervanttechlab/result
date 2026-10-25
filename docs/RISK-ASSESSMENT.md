# Risk Assessment — Barako Brew Front-End

Prepared by: <your name> | Reported to: Team Leader | Date: <date>

## 1. Scope and assets

- **Scope:** public website (`index.html`) with its Vue.js Budget picks, contact form, API calls.
- **Assets:** customer names, emails and messages; menu data; site availability; the café's reputation.

## 2. Threats, vulnerabilities, analysis and prioritisation

Score = Likelihood × Impact (1–3 each). 6–9 High, 3–4 Medium, 1–2 Low.

| Threat | Vulnerability | L | I | Score | Priority | Control / mitigation | Where |
|---|---|---|---|---|---|---|---|
| Cross-Site Scripting (XSS) | User and API text shown on the page | 2 | 3 | 6 | High | Output encoding, input validation, CSP | `textContent` in `renderMenu()`; Vue sets text, never HTML, in `js/vue-app.js`; CSP meta tag |
| Cross-Site Request Forgery (CSRF) | Form POST could be forged by another site | 2 | 3 | 6 | High | Anti-CSRF token, SameSite cookie | `getCsrfToken()`, hidden field, `X-CSRF-Token` header; `SameSite=Strict` |
| Data interception | HTTP is not encrypted | 2 | 3 | 6 | High | HTTPS/TLS and HSTS in production | Hosting requirement |
| Personal data misuse (RA 10173) | Collecting more data than needed | 2 | 3 | 6 | High | Consent, minimum data | `#consent` checkbox; only name, email, message |
| Session hijacking | Sessions that never expire | 2 | 2 | 4 | Medium | Idle timeout, token renewal, secure cookies | `touchSession()`; HttpOnly + Secure set by the server |
| Vulnerable third-party scripts | Outdated or tampered library | 1 | 3 | 3 | Medium | Pinned version, local copy, CSP allow-list | Bootstrap 5.3.3 and Vue 3.4.38 in `vendor/`; CSP allows only cdnjs.cloudflare.com |
| Price tampering | Order totals are computed in the browser | 2 | 3 | 6 | High | Server recomputes totals from its own prices | Order sends item ids and quantities; back-end requirement in docs/API.md |
| Spam / flooding | Open contact form | 3 | 1 | 3 | Medium | Length limits now; rate limit and CAPTCHA on the server | `maxlength`, length checks in the submit handler |
| Information leakage | Detailed errors shown to users | 1 | 2 | 2 | Low | Friendly messages; details only in the console | `catch` blocks in `loadMenu()` and the submit handler |

## 3. Control evaluation

| Control | Tested how | Result |
|---|---|---|
| Output encoding | Name `<script>alert(1)</script>`; also edited a menu name in db.json to `<b>x</b>` | Shown as text, nothing ran |
| CSP | DevTools Console | Inline scripts blocked (Live Server's injected script shows the violation) |
| CSRF token | Changed the hidden token in DevTools, then submitted | "Your session expired", no POST sent |
| Cookie attributes | DevTools → Application → Cookies | `menuFilter` has SameSite=Strict, expires in 30 min |
| Validation | Empty and invalid submissions; quantity 99, 0, "abc"; pickup 05:00 | Error message, no POST sent; quantity capped at 20 or ignored |

## 4. Framework and CSP

Vue.js can compile templates in the browser, which needs `'unsafe-eval'` in the CSP. To avoid that, the Budget picks component uses a render function (`h()`), so the CSP stays strict on the whole site. Tested: a template version is blocked by the CSP; the render-function version runs with no CSP errors.

## 5. Back-end phase (authentication, sessions, transmission)

- **Authentication:** hashed passwords, OTP / step (two-factor) authentication for staff, hardware tokens (YubiKey, SecurID) or biometrics for admins, digital certificates, SSH keys for server access.
- **Authorisation:** role-based access (owner, staff). Hiding admin buttons is a UI restriction only; the server must check every request.
- **Sessions:** unique random session IDs, expiration, a new ID after login, cookies with Secure + HttpOnly + SameSite=Strict, session auditing and monitoring.
- **Transmission:** HTTPS (TLS) everywhere with security headers: Content-Security-Policy, Strict-Transport-Security, X-Frame-Options (or CSP `frame-ancestors`), X-Content-Type-Options: nosniff.

## 6. Monitoring and review

Re-assess at every release, and whenever a library or the back-end changes. Run `npm audit` when online.
