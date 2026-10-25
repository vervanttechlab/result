// @ts-check
/**
 * Barako Brew front-end script (vanilla JavaScript, no libraries).
 * Loads the menu from the REST API (or the local JSON copy when the API is down),
 * renders, filters and searches the cards, keeps the order in a Cart object
 * (quantities, discount, totals), checks out through a modal with pickup-time
 * validation, and validates and sends the contact form.
 * Layout and components (grid, cards, list group, modal, form states) come from Bootstrap 5.
 * Security: input validation, output encoding (textContent), CSRF token, secure cookie,
 * session idle timeout. The Content Security Policy is in index.html.
 */

// ----- Configuration and state -----
const API_URL = 'http://localhost:3000';   // change to the real back-end URL later
const LOCAL_DATA = 'data/menu.json';       // offline fallback copy of GET /menu
const SESSION_IDLE_MS = 15 * 60 * 1000;    // 15-minute idle timeout

const grid = document.getElementById('menu-grid');
const menuStatus = document.getElementById('menu-status');
const cartCount = document.getElementById('cart-count');
const searchInput = document.getElementById('search');
const csrfField = document.getElementById('csrf-token');
let menu = [];
let currentCategory = 'All';
let searchText = '';

/**
 * Rounds money to centavos (two decimals).
 * @param {number} amount
 */
function roundMoney(amount) {
  return Math.round(amount * 100) / 100;
}

/**
 * Formats an amount as pesos, e.g. 95 -> "PHP 95.00".
 * @param {number} amount
 */
function formatPeso(amount) {
  return `PHP ${amount.toFixed(2)}`;
}

/**
 * Marks a form field valid or invalid. Bootstrap shows the field's .invalid-feedback
 * text when the field has the class is-invalid; aria-invalid tells screen readers.
 * @param {HTMLElement} field
 * @param {boolean} invalid
 * @returns {boolean} the same invalid value, so results can be collected
 */
function markField(field, invalid) {
  field.classList.toggle('is-invalid', invalid);
  field.setAttribute('aria-invalid', String(invalid));
  return invalid;
}

// ----- Session management (simulated on the front end) -----
/** Ends the session after 15 idle minutes; otherwise records activity. */
function touchSession() {
  const now = Date.now();
  const last = Number(sessionStorage.getItem('lastActivity'));
  if (last && now - last > SESSION_IDLE_MS) {
    sessionStorage.clear();                 // expiry: drop session data and the old CSRF token
  }
  sessionStorage.setItem('lastActivity', String(now));
}

/**
 * Returns this session's CSRF token, creating a random one if needed.
 * A real server issues and checks this token; here we simulate both sides.
 * @returns {string}
 */
function getCsrfToken() {
  let token = sessionStorage.getItem('csrfToken');
  if (!token) {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    token = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem('csrfToken', token);
  }
  return token;
}

/**
 * Saves a preference cookie with secure attributes.
 * HttpOnly cannot be set from JavaScript; the server sets it on session cookies.
 * @param {string} name
 * @param {string} value
 */
function setPrefCookie(name, value) {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=1800; Path=/; SameSite=Strict${secure}`;
}

/**
 * Reads one cookie value.
 * @param {string} name
 * @returns {string | null}
 */
function getCookie(name) {
  const pair = document.cookie.split('; ').find(c => c.startsWith(name + '='));
  return pair ? decodeURIComponent(pair.split('=')[1]) : null;
}

// ----- Web service / API -----
/**
 * GETs a URL and parses the JSON; throws on HTTP errors.
 * @param {string} url
 */
async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * POSTs JSON with the CSRF token header; throws on HTTP errors.
 * Success is judged by the status code only, so an empty reply (204) also counts.
 * @param {string} path - e.g. "/orders"
 * @param {object} body
 */
async function postJSON(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfField.value },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

/** Loads the menu from the API; falls back to the local JSON file when the API is down. */
async function loadMenu() {
  menuStatus.textContent = 'Loading menu...';
  try {
    try {
      menu = await getJSON(`${API_URL}/menu`);
    } catch (apiErr) {
      console.warn('API unavailable, using local data:', apiErr);
      menu = await getJSON(LOCAL_DATA);
    }
    currentCategory = getCookie('menuFilter') || 'All';
    setActiveFilter(currentCategory);
    renderMenu();
  } catch (err) {
    console.error('Menu load failed:', err);  // details for the developer only
    menuStatus.textContent = 'Sorry, the menu is unavailable. Please try again later.';
  }
}

// ----- DOM rendering (output encoding: textContent, never innerHTML) -----
/**
 * Renders the menu cards that match the current category and search text.
 * Each card sits in a Bootstrap column: 12 of 12 on phones, 6 from 768px, 4 from 992px.
 */
function renderMenu() {
  grid.replaceChildren();
  const items = menu.filter(item =>
    (currentCategory === 'All' || item.category === currentCategory) &&
    item.name.toLowerCase().includes(searchText));
  menuStatus.textContent = items.length ? '' : 'No items match your search.';

  for (const item of items) {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';
    const card = document.createElement('article');
    card.className = 'card h-100 shadow-sm';

    const img = document.createElement('img');
    img.className = 'card-img-top';
    img.src = item.image;
    img.alt = item.name;
    img.width = 400;
    img.height = 300;
    img.loading = 'lazy';

    // d-flex flex-column + mt-auto keeps every button at the bottom of its card
    const body = document.createElement('div');
    body.className = 'card-body d-flex flex-column';
    const title = document.createElement('h3');
    title.className = 'h5 card-title';
    title.textContent = item.name;            // text, not HTML: blocks XSS
    const price = document.createElement('p');
    price.className = 'card-text';
    price.textContent = formatPeso(item.price);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-coffee mt-auto align-self-start';
    if (item.available) {
      btn.textContent = 'Add to order';
      btn.addEventListener('click', () => addToCart(item));
    } else {
      btn.textContent = 'Sold out';
      btn.disabled = true;
    }

    body.append(title, price, btn);
    card.append(img, body);
    col.append(card);
    grid.append(col);
  }
}

// ----- Filters and search -----
/**
 * Highlights the filter button for one category.
 * @param {string} category
 */
function setActiveFilter(category) {
  document.querySelectorAll('.filter').forEach(b => {
    const on = b.dataset.category === category;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  });
}

document.querySelectorAll('.filter').forEach(button => {
  button.addEventListener('click', () => {
    currentCategory = button.dataset.category || 'All';
    setActiveFilter(currentCategory);
    renderMenu();
    setPrefCookie('menuFilter', currentCategory);   // remembered for 30 minutes
  });
});

// Search: runs on every keystroke; matches part of the name, ignoring capitals
searchInput.addEventListener('input', () => {
  searchText = searchInput.value.trim().toLowerCase();
  renderMenu();
});

// ----- Cart (object-oriented) -----
/**
 * The customer's order: menu items with quantities, and the price computation.
 * total = subtotal - discount, where subtotal = sum of (price x quantity).
 */
class Cart {
  static MAX_QTY = 20;
  static DISCOUNT_RATE = 0.2;   // senior citizen / PWD, simplified practice rule

  constructor() {
    /** @type {{item: {id: number, name: string, price: number}, qty: number}[]} */
    this.lines = [];
    this.discounted = false;
  }

  /**
   * Adds one of an item, or one more if it is already in the cart (up to MAX_QTY).
   * @param {{id: number, name: string, price: number}} item
   */
  add(item) {
    const line = this.lines.find(l => l.item.id === item.id);
    if (line) line.qty = Math.min(line.qty + 1, Cart.MAX_QTY);
    else this.lines.push({ item, qty: 1 });
  }

  /**
   * Sets a quantity. Below 1 removes the line; blank or not a number is ignored.
   * @param {number} id
   * @param {number | string} qty
   */
  setQty(id, qty) {
    if (String(qty).trim() === '') return;
    const n = Math.trunc(Number(qty));
    if (!Number.isFinite(n)) return;
    if (n < 1) { this.remove(id); return; }
    const line = this.lines.find(l => l.item.id === id);
    if (line) line.qty = Math.min(n, Cart.MAX_QTY);
  }

  /** @param {number} id */
  remove(id) {
    this.lines = this.lines.filter(l => l.item.id !== id);
  }

  clear() {
    this.lines = [];
  }

  /** Number of items (sum of quantities). */
  get count() {
    return this.lines.reduce((sum, l) => sum + l.qty, 0);
  }

  get subtotal() {
    return roundMoney(this.lines.reduce((sum, l) => sum + l.item.price * l.qty, 0));
  }

  /** 20% of the subtotal, only when the box is ticked AND the cart is not empty. */
  get discount() {
    return this.discounted && this.lines.length > 0 ? roundMoney(this.subtotal * Cart.DISCOUNT_RATE) : 0;
  }

  get total() {
    return roundMoney(this.subtotal - this.discount);
  }
}

const cart = new Cart();

/**
 * Adds a menu item to the cart and redraws the order panel.
 * @param {{id: number, name: string, price: number}} item
 */
function addToCart(item) {
  cart.add(item);
  renderCart();
}

// ----- Order panel -----
const cartLines = document.getElementById('cart-lines');
const cartEmpty = document.getElementById('cart-empty');
const subtotalEl = document.getElementById('subtotal');
const discountEl = document.getElementById('discount-amount');
const totalEl = document.getElementById('total');
const discountBox = document.getElementById('discount');
const checkoutBtn = document.getElementById('checkout-btn');
const orderTitle = document.getElementById('order-title');

/**
 * Creates a button for a cart line.
 * @param {string} text - visible text
 * @param {string} label - what a screen reader announces
 * @param {string} key - used to put the focus back after redrawing
 * @param {string} className
 * @param {() => void} onClick
 */
function lineButton(text, label, key, className, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = className;
  b.textContent = text;
  b.setAttribute('aria-label', label);
  b.dataset.key = key;
  b.addEventListener('click', () => { onClick(); renderCart(key); });
  return b;
}

/**
 * Creates a Bootstrap column holding the given elements.
 * @param {string} className - e.g. "col-auto"
 * @param {...HTMLElement} children
 */
function column(className, ...children) {
  const div = document.createElement('div');
  div.className = className;
  div.append(...children);
  return div;
}

/**
 * Redraws the order lines, totals and header count from the cart object.
 * Each line is a Bootstrap list-group item with a row inside:
 * phones: name on its own row, then [- qty +] [amount] [Remove]; from 576px: all on one row.
 * @param {string} [focusKey] - the control to focus again after redrawing (keyboard users)
 */
function renderCart(focusKey) {
  cartLines.replaceChildren();
  for (const line of cart.lines) {
    const { id, name, price } = line.item;
    const li = document.createElement('li');
    li.className = 'list-group-item';

    const label = document.createElement('span');
    label.className = 'fw-semibold';
    label.textContent = name;

    // Bootstrap input group: [-][qty][+] joined together
    const group = document.createElement('div');
    group.className = 'input-group input-group-sm';
    const minus = lineButton('−', `One less ${name}`, `${id}-minus`, 'btn btn-outline-secondary', () => cart.setQty(id, line.qty - 1));
    const qty = document.createElement('input');
    qty.type = 'number';
    qty.className = 'form-control qty-input';
    qty.min = '1';
    qty.max = String(Cart.MAX_QTY);
    qty.value = String(line.qty);
    qty.dataset.key = `${id}-qty`;
    qty.setAttribute('aria-label', `Quantity of ${name}`);
    qty.addEventListener('change', () => { cart.setQty(id, qty.value); renderCart(`${id}-qty`); });
    const plus = lineButton('+', `One more ${name}`, `${id}-plus`, 'btn btn-outline-secondary', () => cart.setQty(id, line.qty + 1));
    group.append(minus, qty, plus);

    const amount = document.createElement('span');
    amount.className = 'cart-amount';
    amount.textContent = formatPeso(price * line.qty);
    const remove = lineButton('Remove', `Remove ${name} from the order`, `${id}-remove`, 'btn btn-link btn-sm text-danger', () => cart.remove(id));

    const row = document.createElement('div');
    row.className = 'row g-2 align-items-center';
    row.append(
      column('col-12 col-sm', label),
      column('col-auto', group),
      column('col col-sm-auto text-end', amount),
      column('col-auto', remove)
    );
    li.append(row);
    cartLines.append(li);
  }

  cartEmpty.hidden = cart.lines.length > 0;
  cartCount.textContent = String(cart.count);
  subtotalEl.textContent = formatPeso(cart.subtotal);
  discountEl.textContent = `- ${formatPeso(cart.discount)}`;
  totalEl.textContent = formatPeso(cart.total);
  checkoutBtn.disabled = cart.lines.length === 0;

  if (focusKey) {
    const again = cartLines.querySelector(`[data-key="${focusKey}"]`);
    (again || orderTitle).focus();   // the line was removed: move focus to the heading
  }
}

discountBox.addEventListener('change', () => {
  cart.discounted = discountBox.checked;
  renderCart();
});

// ----- Checkout modal (Bootstrap) -----
const modalEl = document.getElementById('checkout');
const checkoutForm = document.getElementById('checkout-form');
const checkoutSummary = document.getElementById('checkout-summary');
const checkoutTotal = document.getElementById('checkout-total');
const pickupName = document.getElementById('pickup-name');
const pickupTime = document.getElementById('pickup-time');
const pickupTimeError = document.getElementById('pickup-time-error');
const checkoutStatus = document.getElementById('checkout-status');
const orderStatus = document.getElementById('order-status');
let lastOrder = null;   // set after a successful POST, used once the modal has closed

/** The Bootstrap Modal object; created on first use (bootstrap.bundle.min.js loads before this file). */
function checkoutModal() {
  return bootstrap.Modal.getOrCreateInstance(modalEl);
}

/**
 * Checks a pickup time ("HH:MM") for today: within opening hours (7:00-21:00)
 * and at least 15 minutes from now.
 * @param {string} value - from <input type="time">
 * @param {Date} [now]
 * @returns {string} an error message, or '' when the time is valid
 */
function validatePickup(value, now = new Date()) {
  if (!/^\d{2}:\d{2}$/.test(value)) return 'Choose a pickup time.';
  const [hours, minutes] = value.split(':').map(Number);
  const pickup = new Date(now);
  pickup.setHours(hours, minutes, 0, 0);
  const opens = new Date(now);
  opens.setHours(7, 0, 0, 0);
  const closes = new Date(now);
  closes.setHours(21, 0, 0, 0);
  const earliest = new Date(now.getTime() + 15 * 60 * 1000);

  if (pickup < opens || pickup > closes) return 'We are open from 7:00 to 21:00.';
  if (pickup < earliest) return 'Pickup must be at least 15 minutes from now.';
  return '';
}

checkoutBtn.addEventListener('click', () => {
  touchSession();
  checkoutSummary.replaceChildren(...cart.lines.map(l => {
    const li = document.createElement('li');
    li.textContent = `${l.qty} × ${l.item.name} - ${formatPeso(l.item.price * l.qty)}`;
    return li;
  }));
  checkoutTotal.textContent = cart.discount
    ? `Total: ${formatPeso(cart.total)} (20% discount: ${formatPeso(cart.discount)})`
    : `Total: ${formatPeso(cart.total)}`;
  checkoutStatus.textContent = '';
  markField(pickupName, false);
  markField(pickupTime, false);
  checkoutModal().show();   // Bootstrap: dims the page, traps focus, Esc closes
});

// Bootstrap modal events: focus the first field once open; tidy up once closed
modalEl.addEventListener('shown.bs.modal', () => pickupName.focus());
modalEl.addEventListener('hide.bs.modal', () => {
  if (modalEl.contains(document.activeElement)) document.activeElement.blur();
});
modalEl.addEventListener('hidden.bs.modal', () => {
  if (!lastOrder) { checkoutBtn.focus(); return; }   // Cancel or Esc: back to Checkout
  orderStatus.textContent = `Order confirmed for ${lastOrder.pickupName}: pickup at ${lastOrder.pickupTime}, ${formatPeso(lastOrder.total)}.`;
  orderStatus.className = 'alert alert-success mt-3';
  lastOrder = null;
  cart.clear();
  cart.discounted = false;
  discountBox.checked = false;
  renderCart();
  orderStatus.focus();   // keyboard and screen-reader users land on the confirmation
});

checkoutForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  touchSession();
  const name = pickupName.value.trim();
  const timeError = validatePickup(pickupTime.value);
  pickupTimeError.textContent = timeError || 'Choose a pickup time.';

  const invalid = [
    markField(pickupName, !name || name.length > 50),
    markField(pickupTime, timeError !== '')
  ].some(Boolean);
  if (invalid) { checkoutForm.querySelector('.is-invalid').focus(); return; }
  if (csrfField.value !== getCsrfToken()) { checkoutStatus.textContent = 'Your session expired. Please reload the page.'; return; }

  // Send ids and quantities; the server must recompute prices and totals itself
  const order = {
    items: cart.lines.map(l => ({ id: l.item.id, qty: l.qty })),
    subtotal: cart.subtotal,
    discount: cart.discount,
    total: cart.total,
    pickupName: name,
    pickupTime: pickupTime.value,
    date: new Date().toISOString()
  };
  try {
    await postJSON('/orders', order);
    lastOrder = order;
    checkoutForm.reset();
    checkoutModal().hide();   // the cart is cleared in 'hidden.bs.modal'
  } catch (err) {
    console.error(err);
    checkoutStatus.textContent = 'Order not sent. Please try again.';
  }
});

// ----- Contact form: validation, CSRF, POST -----
const form = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');
const nameField = document.getElementById('name');
const emailField = document.getElementById('email');
const messageField = document.getElementById('message');
const consentField = document.getElementById('consent');

// A field stops being red as soon as the user changes it
form.addEventListener('input', (e) => {
  if (e.target.classList.contains('is-invalid')) markField(e.target, false);
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  touchSession();
  const name = nameField.value.trim();
  const email = emailField.value.trim();
  const message = messageField.value.trim();

  // Input validation: required, length, format, consent (the server must check again).
  // Every field is checked so all problems show at once.
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const invalid = [
    markField(nameField, !name || name.length > 50),
    markField(emailField, !emailOk),
    markField(messageField, message.length < 5 || message.length > 500),
    markField(consentField, !consentField.checked)
  ].some(Boolean);
  if (invalid) {
    formStatus.textContent = 'Please fix the highlighted fields.';
    form.querySelector('.is-invalid').focus();
    return;
  }

  // CSRF check (simulates the server comparing the form token with the session token)
  if (csrfField.value !== getCsrfToken()) {
    formStatus.textContent = 'Your session expired. Please reload the page.';
    return;
  }

  try {
    await postJSON('/messages', { name, email, message, date: new Date().toISOString() });
    formStatus.textContent = 'Thank you! We will reply soon.';
    form.reset();
    csrfField.value = getCsrfToken();        // reset() clears hidden fields too
  } catch (err) {
    console.error(err);
    formStatus.textContent = 'Message not sent. Please try again.';
  }
});

// ----- Start -----
touchSession();
csrfField.value = getCsrfToken();
renderCart();
loadMenu();
