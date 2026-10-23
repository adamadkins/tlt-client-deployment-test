// Thread & Thistle storefront. The mittens are a fictional demo. The print shop is real: its products come
// from the studio portal (which reads the client's Printful store) and checkout opens Stripe's hosted page,
// so this page never sees a card number. No persistence, analytics or cookies.
(() => {
  const cart = new Map();
  const trigger = document.getElementById('open-cart');
  const count = document.getElementById('cart-count');
  const sheet = document.getElementById('cart-dialog');
  const backdrop = document.getElementById('cart-backdrop');
  const closeButton = document.getElementById('close-cart');
  const cartList = document.getElementById('cart-list');
  const subtotalEl = document.getElementById('cart-subtotal');
  const toast = document.getElementById('toast');
  const PORTAL = 'https://portal.tlt-studios.com';
  const checkoutButton = document.getElementById('checkout');
  const checkoutNote = document.getElementById('checkout-note');
  const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  let restoreFocusTo = trigger;
  let toastTimer;

  function notify(message) {
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 2500);
  }

  function openCart() {
    restoreFocusTo = document.activeElement || trigger;
    sheet.hidden = false;
    backdrop.hidden = false;
    sheet.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cart-open');
    closeButton.focus();
  }

  function closeCart() {
    sheet.hidden = true;
    backdrop.hidden = true;
    sheet.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cart-open');
    restoreFocusTo?.focus?.();
  }

  function changeQuantity(key, delta) {
    const item = cart.get(key);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) cart.delete(key);
    drawCart();
  }

  function makeNode(tag, text, className) {
    const node = document.createElement(tag);
    if (text != null) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function drawCart() {
    cartList.replaceChildren();
    let countItems = 0;
    let sum = 0;
    for (const [key, item] of cart) {
      countItems += item.quantity;
      sum += item.price * item.quantity;
      const article = makeNode('article', null, 'cart-item');
      const img = makeNode('img');
      img.src = item.img;
      img.alt = '';
      const detail = makeNode('div');
      const title = makeNode('h3', item.name);
      const sub = makeNode('p', item.variantId ? item.label : `Size ${item.size}`);
      const controls = makeNode('div', null, 'quantity-controls');
      const minus = makeNode('button', '−');
      minus.type = 'button';
      minus.setAttribute('aria-label', `Remove one ${item.name}, size ${item.size}`);
      minus.addEventListener('click', () => changeQuantity(key, -1));
      const qty = makeNode('span', String(item.quantity));
      qty.setAttribute('aria-label', 'Quantity');
      const plus = makeNode('button', '+');
      plus.type = 'button';
      plus.setAttribute('aria-label', `Add one ${item.name}, size ${item.size}`);
      plus.addEventListener('click', () => changeQuantity(key, 1));
      controls.append(minus, qty, plus);
      detail.append(title, sub, controls);
      article.append(img, detail, makeNode('strong', currency.format(item.price * item.quantity)));
      cartList.append(article);
    }
    if (!countItems) cartList.append(makeNode('p', 'A little empty in here. Let’s find you something cozy.', 'empty-cart'));
    count.textContent = String(countItems);
    trigger.setAttribute('aria-label', `Open bag, ${countItems} item${countItems === 1 ? '' : 's'}`);
    subtotalEl.textContent = currency.format(sum);
    const items = [...cart.values()];
    const live = items.filter(item => item.variantId);
    const demo = items.length - live.length;
    checkoutButton.disabled = !live.length || demo > 0;
    checkoutButton.setAttribute('aria-disabled', String(checkoutButton.disabled));
    checkoutNote.textContent = demo ? 'Remove the fictional mittens from your bag to check out.' : 'Print-shop items check out securely with Stripe. The fictional mittens can\'t be ordered.';
  }

  document.querySelectorAll('.product-card').forEach(card => {
    card.querySelector('.add-button').addEventListener('click', () => {
      const { id, name, price, img } = card.dataset;
      const size = card.querySelector('select').value;
      const key = `${id}:${size}`;
      const current = cart.get(key);
      if (current) current.quantity += 1;
      else cart.set(key, { name, price: Number(price), img, size, quantity: 1 });
      drawCart();
      notify(`${name} added to your bag`);
    });
  });

  // ---- Print shop: real products from the portal ----
  const liveGrid = document.getElementById('live-products');
  const liveStatus = document.getElementById('live-status');

  function drawLiveProduct(product) {
    const colors = [...new Set(product.variants.map(v => v.color || 'Standard'))];
    const card = makeNode('article', null, 'product-card');
    const media = makeNode('div', null, 'product-media product-oat');
    const img = makeNode('img');
    img.alt = product.name;
    img.width = 520; img.height = 580; img.loading = 'lazy';
    media.append(img);
    const meta = makeNode('div', null, 'product-meta');
    const heading = makeNode('div');
    heading.append(makeNode('h3', product.name), makeNode('p', `${colors.length} colour${colors.length === 1 ? '' : 's'}`));
    const price = makeNode('span', '', 'price');
    meta.append(heading, price);
    const actions = makeNode('div', null, 'product-actions');
    const colorSelect = makeNode('select');
    colorSelect.setAttribute('aria-label', `Colour for ${product.name}`);
    for (const color of colors) colorSelect.append(Object.assign(makeNode('option', color), { value: color }));
    const sizeSelect = makeNode('select');
    sizeSelect.setAttribute('aria-label', `Size for ${product.name}`);
    const add = makeNode('button', 'Add to bag ↗', 'add-button');
    add.type = 'button';
    for (const select of [colorSelect, sizeSelect]) { const label = makeNode('label'); label.append(select); actions.append(label); }
    actions.append(add);
    const chosen = () => product.variants.find(v => (v.color || 'Standard') === colorSelect.value && (v.size || 'One size') === sizeSelect.value);
    function refresh(changedColor) {
      const options = product.variants.filter(v => (v.color || 'Standard') === colorSelect.value);
      if (changedColor) {
        sizeSelect.replaceChildren();
        for (const v of options) {
          const option = Object.assign(makeNode('option', v.available ? (v.size || 'One size') : `${v.size || 'One size'} (sold out)`), { value: v.size || 'One size' });
          option.disabled = !v.available;
          sizeSelect.append(option);
        }
        const firstOpen = options.find(v => v.available);
        if (firstOpen) sizeSelect.value = firstOpen.size || 'One size';
        const picture = options.find(v => v.image)?.image || product.thumbnail;
        if (picture) img.src = picture;
      }
      const v = chosen();
      price.textContent = v ? currency.format(v.price_cents / 100) : '';
      add.disabled = !v || !v.available;
    }
    colorSelect.addEventListener('change', () => refresh(true));
    sizeSelect.addEventListener('change', () => refresh(false));
    add.addEventListener('click', () => {
      const v = chosen();
      if (!v || !v.available) return;
      const key = `live:${v.id}`;
      const current = cart.get(key);
      if (current) current.quantity += 1;
      else cart.set(key, { name: product.name, label: `${v.color} / ${v.size}`, price: v.price_cents / 100, img: v.image || product.thumbnail || '', variantId: v.id, size: v.size, quantity: 1 });
      drawCart();
      notify(`${product.name} added to your bag`);
    });
    card.append(media, meta, actions);
    refresh(true);
    return card;
  }

  async function loadPrintShop() {
    try {
      const response = await fetch(`${PORTAL}/api/site/printful/products`, { headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(data?.products)) throw new Error('unavailable');
      const products = data.products.filter(p => p.variants?.length);
      liveGrid.replaceChildren(...products.map(drawLiveProduct));
      liveStatus.textContent = products.length ? '' : 'Nothing in the print shop yet. Check back soon.';
      liveStatus.hidden = products.length > 0;
    } catch {
      liveStatus.textContent = 'The print shop is taking a moment. Please try again shortly.';
    }
  }

  checkoutButton.addEventListener('click', async () => {
    const lines = [...cart.values()].filter(item => item.variantId).map(item => ({ variant_id: item.variantId, quantity: item.quantity }));
    if (!lines.length || checkoutButton.disabled) return;
    checkoutButton.disabled = true;
    checkoutButton.textContent = 'Opening checkout…';
    try {
      const response = await fetch(`${PORTAL}/api/site/printful/checkout`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ lines, success_url: `${location.origin}/?order=success`, cancel_url: `${location.origin}/` })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Checkout is unavailable right now.');
      const target = new URL(data.url);
      if (target.protocol !== 'https:' || target.hostname !== 'checkout.stripe.com') throw new Error('Checkout is unavailable right now.');
      location.assign(target.href);
    } catch (error) {
      notify(error.message || 'Checkout is unavailable right now.');
      checkoutButton.textContent = 'Checkout';
      drawCart();
    }
  });
  if (new URLSearchParams(location.search).get('order') === 'success') {
    history.replaceState(null, '', location.pathname);
    notify('Thank you! Your order is in. A receipt is on its way to your email.');
  }
  loadPrintShop();
  trigger.addEventListener('click', openCart);
  closeButton.addEventListener('click', closeCart);
  backdrop.addEventListener('click', closeCart);
  document.addEventListener('keydown', event => {
    if (sheet.hidden) return;
    if (event.key === 'Escape') closeCart();
    if (event.key === 'Tab') {
      const elements = [...sheet.querySelectorAll('button:not(:disabled),a[href],select:not(:disabled)')].filter(x => x.getClientRects().length);
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  drawCart();
})();
