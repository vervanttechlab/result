/**
 * "Budget picks" built with Vue.js 3 (the JavaScript framework requirement).
 * Uses a render function (h) instead of a template, so Vue never compiles code in the
 * browser and the strict Content Security Policy needs no 'unsafe-eval'.
 * Vue loads from the Cloudflare CDN (cdnjs); offline, the local copy in vendor/ is used.
 */
const PICKS_API = 'http://localhost:3000/menu';
const PICKS_LOCAL = 'data/menu.json';

/** Creates and mounts the Vue app once Vue is available. */
function startVueApp() {
  const { createApp, ref, computed, onMounted, h } = window.Vue;

  createApp({
    setup() {
      const items = ref([]);          // reactive state: the menu
      const maxPrice = ref(100);      // reactive state: the slider value
      const status = ref('Loading...');

      // Load the menu once: API first, local JSON copy when the API is down
      onMounted(async () => {
        try {
          let res = await fetch(PICKS_API).catch(() => null);
          if (!res || !res.ok) res = await fetch(PICKS_LOCAL);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          items.value = await res.json();
          status.value = '';
        } catch (err) {
          console.error('Budget picks failed:', err);
          status.value = 'Budget picks are unavailable.';
        }
      });

      // Recalculated automatically whenever items or maxPrice change
      const picks = computed(() =>
        items.value.filter(item => item.available && item.price <= maxPrice.value));

      // h(tag, attributes, children) builds the same elements a template would.
      // Text is set as text, so Vue escapes it (output encoding, no XSS).
      // Bootstrap classes: card, form-range, list-group, d-flex justify-content-between.
      return () => h('div', { class: 'card picks' }, [
        h('div', { class: 'card-body' }, [
          h('label', { for: 'max-price', class: 'form-label' }, `Show items up to PHP ${maxPrice.value}`),
          h('input', {
            id: 'max-price', type: 'range', class: 'form-range', min: 40, max: 160, step: 10, value: maxPrice.value,
            onInput: e => { maxPrice.value = Number(e.target.value); }
          }),
          h('p', { role: 'status', class: 'text-body-secondary mb-2' }, status.value || `${picks.value.length} item(s) available`)
        ]),
        h('ul', { class: 'list-group list-group-flush' }, picks.value.map(item =>
          h('li', { key: item.id, class: 'list-group-item d-flex justify-content-between' }, [
            h('span', item.name),
            h('span', `PHP ${item.price.toFixed(2)}`)
          ])))
      ]);
    }
  }).mount('#budget-picks');
}

// CDN fallback: deferred scripts run in order, so if the CDN copy loaded, window.Vue exists now
if (window.Vue) {
  startVueApp();
} else {
  const local = document.createElement('script');
  local.src = 'vendor/vue.global.prod.js';
  local.addEventListener('load', startVueApp);
  document.head.append(local);
}
