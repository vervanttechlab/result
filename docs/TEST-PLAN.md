# Test Plan — Barako Brew Front-End

Tester: <your name> | Reviewer: Team Leader | Distributed to: Project Manager, Team Leader, Owner | Date: <date>

## Objectives

Confirm that FR1–FR10 work and NFR1–NFR7 are met before release.

## Scope

`index.html` (vanilla JavaScript and the Vue.js Budget picks), the mock API and the `release/` build. Out of scope: the real back-end.

## Environment and resources

- Test environment: a clone of the repository at `D:\DEMO\test-env`, served with Live Server; the mock API on port 3000.
- Browsers: Chrome, Edge, Firefox. Widths: 375, 768 and 1280 px (DevTools Device Toolbar).
- Tools: DevTools (Console, Network, Application, Lighthouse), W3C validator / html-validate, axe linter.

## Schedule

14:35–14:45 prepare | 14:45–15:10 execute | 15:10–15:20 fix, retest, report

## Test cases

| ID | Parameter | Steps | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|
| T01 | Functionality | Open index.html with the API running | 6 menu cards load from the API | | |
| T02 | Functionality | Click "Cold" | Only the 2 cold drinks show | | |
| T03 | Functionality | Click "Add to order" twice | Cart shows 2 | | |
| T04 | Error handling and validation | Submit the empty form | Error message; nothing sent | | |
| T05 | Validation | Fill the form correctly, tick consent, submit | Success message; message saved in db.json | | |
| T06 | Exception handling | Stop json-server, reload | Menu still loads from data/menu.json; no blank page | | |
| T07 | Responsiveness | 375 / 768 / 1280 px | Menu cards 1 / 2 / 3 per row; navbar toggler below 768 px; order summary beside the lines from 992 px | | |
| T08 | Cross-browser | Open in Chrome, Edge, Firefox | Same layout and behaviour | | |
| T09 | Accessibility | Keyboard only; Lighthouse | Every control reachable, focus visible; score ≥ 90 | | |
| T10 | Security | Name = `<script>alert(1)</script>` | Shown as text, not run | | |
| T11 | Performance, low bandwidth | Lighthouse mobile on release/; throttling Slow 4G | Performance ≥ 80; menu visible in about 5 s | | |
| T12 | Framework | Wi-Fi off, reload; move the Budget picks slider to PHP 100 | 3 items listed (local Vue copy); no CSP error in the Console | | |
| T13 | Price computation | Add Kapeng Barako ×2 and Ensaymada ×1 | Subtotal PHP 255.00; Cart (3) | | |
| T14 | Discount | Tick Senior citizen / PWD | Discount PHP 51.00; total PHP 204.00 | | |
| T15 | Validation (quantity) | Type 99, then 0, then "abc" in a quantity box | 99 becomes 20; 0 removes the line; "abc" is ignored | | |
| T16 | Validation (dates) | Checkout; pickup 05:00, then a time 5 minutes from now, then a valid time | Two error messages, then "Order confirmed"; order saved in db.json | | |
| T17 | Accessibility (modal) | Open checkout with the keyboard; press Esc | Focus starts in Name; Esc closes; focus back on Checkout | | |
| T18 | Functionality (search) | Type "ens" in Search, with "All" selected | Only Ensaymada shows | | |
| T19 | Usability, user satisfaction | The owner orders two items and sends a message unaided | Done in under 2 minutes; sign-off recorded | | |

Critical cases: T01, T04, T05, T06, T10, T12, T13, T16.

## Results

- Passed: __ / 19 → pass rate = passed ÷ 19 × 100 = __ %
- Page load times (s), 5 runs: __, __, __, __, __
  - Mean = sum ÷ 5 = __
  - Median = middle value after sorting = __
  - Mode = most frequent value = __
- Defects found and fixed: <test ID, problem, fix, commit hash>
- Feedback incorporated: <who, what changed>
- Decision: **Accepted / Not accepted.** Rule: all critical cases pass and the pass rate is at least 90%.
- Integrated into production: tag `v1.0` pushed on <date>.
