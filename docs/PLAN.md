# Barako Brew Front-End — Project Plan

Prepared by: <your name> | Submitted to: Project Manager / Owner | Date: <date>

## 1. Requirements

Discussed with: café owner (client), project manager, back-end developer.

- **Discovery:** customers want to see the menu and send questions online; staff want fewer phone calls.
- **Content / functional needs:** menu with categories and search, order with quantities and totals, checkout with a pickup time, contact form.
- **Branding / design preferences:** brown and cream colours, café photos, logo from the owner (mockup: designer files).
- **Technical / operational considerations:** back-end not ready (mock API), no internet after setup, latest Chrome/Edge/Firefox.
- **Timeline and budget:** 1 day (8 hours), in-house; open-source tools, no licence cost.
- **Success metrics:** Lighthouse performance ≥ 80 and accessibility ≥ 90; test pass rate ≥ 90%; owner sign-off.

### Functional requirements (what the system does)

| ID | Requirement |
|---|---|
| FR1 | Show the menu loaded from the API (GET /menu) |
| FR2 | Filter the menu by category: All, Hot, Cold, Pastry |
| FR3 | Order panel: add items, change quantities, remove items; subtotal and total computed live |
| FR4 | Mark unavailable items "Sold out" |
| FR5 | Contact form that validates input and sends to POST /messages |
| FR6 | Mobile navigation menu |
| FR7 | Budget picks built with Vue.js: list available items up to a chosen price |
| FR8 | Senior citizen / PWD discount checkbox: 20% off the subtotal |
| FR9 | Checkout in a modal: name and pickup time today (7:00–21:00, at least 15 minutes ahead); POST /orders |
| FR10 | Search the menu by name, together with the category filter |

### Non-functional requirements (how well it does it)

| ID | Category | Requirement |
|---|---|---|
| NFR1 | Performance | Lighthouse mobile ≥ 80; usable on Slow 4G |
| NFR2 | Responsiveness | Works at 375, 768 and 1280 px |
| NFR3 | Accessibility | WCAG 2.1 AA; Lighthouse accessibility ≥ 90 |
| NFR4 | Compatibility | Latest Chrome, Edge, Firefox |
| NFR5 | Security | Input validation, output encoding, CSP, CSRF token, secure cookies |
| NFR6 | Legal | RA 10173 consent on the form; RA 8293 licensed images only |
| NFR7 | Scalability | API URL in one constant; data-driven rendering; CSS variables |

## 2. Resources

- **Personnel:** 1 front-end developer (me); owner (client); project manager; team leader; back-end developer (later).
- **Hardware:** 1 computer.
- **Software:** VS Code (Live Server, ESLint, HTMLHint, W3C validation, MinifyAll, REST Client), Node.js, Git, json-server, Bootstrap 5.3.3 (CSS framework, local copy), Vue.js 3, Chrome/Edge/Firefox, GIMP, office application software.
- **Project management tool:** this plan's schedule table plus the Git log as the progress record.

## 3. Feasibility and scalability

- **Resources:** all tools are free and installed during setup, so the project is feasible.
- **Budget:** no licence costs; effort 7.6 person-hours.
- **Schedule:** 7.6 hours of work fits the 8-hour window.
- **Scalability and flexibility:** the API base URL is one constant, so switching to the real back-end changes one line. New menu items need no code because the cards are built from data. Bootstrap's grid and components give a consistent, responsive layout that other developers already know; CSS variables keep the brand colours in one place. The Vue.js component approach can grow into the future ordering app.

## 4. Software development methodology

**Selected: Agile, tailored.** One 8-hour sprint is split into 8 small increments. Each increment is committed to Git and checked against the requirements.

- **Why:** the back-end is not ready and the owner will add features later, so requirements will change. Agile delivers working parts early and accepts change.
- **Rejected:** Waterfall, because it assumes fixed requirements. RAD, because the owner is not available for repeated prototype reviews.
- **Tailoring for a one-person team:** the daily stand-up becomes a short check after each increment; the sprint review is the test report and owner sign-off.

## 5. Component breakdown, effort and schedule

| # | Component | Tasks | Effort (h) | Start | End |
|---|---|---|---|---|---|
| 1 | Plan | requirements, methodology, schedule, risks | 0.67 | 8:00 | 8:40 |
| 2 | HTML/CSS and images | slicing, markup, responsive CSS, WebP | 1.5 | 8:40 | 10:10 |
| 3 | JavaScript and API | fetch, render, filters, form | 1.25 | 10:10 | 11:25 |
| – | Lunch | | | 11:25 | 12:25 |
| 4 | Framework version | Vue.js menu page | 1.5 | 12:25 | 13:55 |
| 5 | Optimisation | minify, images, CDN | 0.67 | 13:55 | 14:35 |
| 6 | Testing | test environment, test cases, results | 0.75 | 14:35 | 15:20 |
| 7 | Security | risk assessment, controls | 0.58 | 15:20 | 15:55 |
| 8 | Documentation | README, diagrams, comments | 0.67 | 15:55 | 16:35 |
| | **Total** | | **7.6** | | |

Version control runs throughout: one commit at the end of every component.

Task allocation: all tasks to the front-end developer; API contract questions to the back-end developer; design questions to the owner.

## 6. Schedule controls and monitoring

- After each component, write the actual end time next to the planned end time below.
- More than 15 minutes behind: drop optional items (extra styling, extra tests).
- Every component ends with a Git commit, which is the progress record (`git log --oneline`).

| # | Planned end | Actual end | Notes |
|---|---|---|---|
| 1 | 8:40 | | |
| 2 | 10:10 | | |
| 3 | 11:25 | | |
| 4 | 13:55 | | |
| 5 | 14:35 | | |
| 6 | 15:20 | | |
| 7 | 15:55 | | |
| 8 | 16:35 | | |

## 7. Testing and user-acceptance parameters

Cross-browser compatibility, responsiveness, performance and page load time, accessibility, functionality and feature testing, usability and user experience, error handling and validation, exception handling, security, performance on low-bandwidth networks, user satisfaction.

Accepted when all critical test cases pass and the pass rate is at least 90% (details in docs/TEST-PLAN.md).

## 8. Coordination with the back-end

The API contract is in docs/API.md. The mock API (json-server) uses the same endpoints and JSON shapes, so the back-end developer builds against the same contract.
