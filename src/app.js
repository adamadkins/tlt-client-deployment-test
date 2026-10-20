// Fictional storefront interaction only. No persistence, checkout, analytics,
// personal information collection, payment calls, or external services.
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
      const sub = makeNode('p', `Size ${item.size}`);
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
    trigger.setAttribute('aria-label', `Open demo cart, ${countItems} item${countItems === 1 ? '' : 's'}`);
    subtotalEl.textContent = currency.format(sum);
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
      notify(`${name} added to your demo bag`);
    });
  });
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
