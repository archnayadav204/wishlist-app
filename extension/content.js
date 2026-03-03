(function () {
  const API_BASE = 'https://wishlist-app-n5yh.onrender.com'

  const href = window.location.href
  const isAmazon   = href.includes('amazon.in') || href.includes('amazon.com')
  const isFlipkart = href.includes('flipkart.com')

  // Guard: only run on product detail pages and avoid duplicate injection
  if (isAmazon   && !href.includes('/dp/')) return
  if (isFlipkart && !href.includes('/p/')) return
  if (!isAmazon && !isFlipkart) return
  if (document.getElementById('wl-save-btn')) return

  // ─── Shared helpers ───────────────────────────────────────────────────────

  // Try a list of selectors in order, return first non-empty text found
  function queryText(...selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel)
      const text = el?.innerText?.trim() || el?.textContent?.trim()
      if (text) return text
    }
    return null
  }

  // Try a list of selectors, return first element found
  function queryEl(...selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel)
      if (el) return el
    }
    return null
  }

  // Clean a price string into a float
  function parsePrice(raw) {
    if (!raw) return 0
    const cleaned = raw.replace(/[₹$£€,\s\u00a0]/g, '').trim()
    const parsed  = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }

  // ─── Amazon extractors ────────────────────────────────────────────────────

  function amazonTitle() {
    const raw = queryText(
      '#productTitle',
      '#title',
      'h1.product-title-word-break',
      'h1[data-automation-id="product-title"]'
    )
    return raw ? raw.replace(/\s+/g, ' ').trim() : 'Title not found'
  }

  function amazonPrice() {
    return parsePrice(queryText(
      '.a-price .a-offscreen',
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '#corePriceDisplay_desktop_feature_div .a-price .a-offscreen',
      '#corePriceDisplay_desktop_feature_div .a-price-whole',
      '.a-price-whole',
      '#price_inside_buybox',
      '#newBuyBoxPrice'
    ))
  }

  function amazonImage() {
    const landing = document.getElementById('landingImage')
    if (landing) {
      const hiRes = landing.getAttribute('data-old-hires') || landing.src
      if (hiRes?.startsWith('http')) return hiRes
    }
    const mainImg = queryEl('#imgTagWrapperId img', '#main-image-container img', '#imageBlock img')
    if (mainImg?.src?.startsWith('http')) return mainImg.src
    const ogImg = document.querySelector('meta[property="og:image"]')
    if (ogImg?.content?.startsWith('http')) return ogImg.content
    return ''
  }

  // ─── Flipkart extractors ──────────────────────────────────────────────────

  function flipkartTitle() {
    // og:title is always set on Flipkart product pages and contains clean product name
    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle?.content?.trim()) return ogTitle.content.trim().replace(/\s+/g, ' ')
    // page <title> fallback — format is "Product Name - Buy ... | Flipkart"
    if (document.title) {
      const clean = document.title.split(' - ')[0].trim()
      if (clean) return clean
    }
    // last resort: h1
    const h1 = document.querySelector('h1')
    const raw = h1?.innerText?.trim() || h1?.textContent?.trim()
    return raw ? raw.replace(/\s+/g, ' ').trim() : 'Title not found'
  }

  function flipkartPrice() {
    // og:price:amount meta tag is stable
    const ogPrice = document.querySelector('meta[property="og:price:amount"]')
    if (ogPrice?.content) {
      const p = parseFloat(ogPrice.content)
      if (!isNaN(p)) return p
    }
    // Fallback: find ₹ price text on page — pick the largest visible one (likely the selling price)
    const priceEls = [...document.querySelectorAll('div, span')]
      .filter(el => el.childElementCount === 0 && /^₹[\d,]+$/.test(el.textContent.trim()))
    if (priceEls.length) {
      const prices = priceEls.map(el => parsePrice(el.textContent)).filter(p => p > 0)
      if (prices.length) return Math.min(...prices)  // lowest = selling price
    }
    return 0
  }

  function flipkartImage() {
    // og:image is the most stable — always present on Flipkart product pages
    const ogImg = document.querySelector('meta[property="og:image"]')
    if (ogImg?.content?.startsWith('http')) return ogImg.content
    // Fallback: first large product image on page
    const img = [...document.querySelectorAll('img')]
      .find(i => i.width > 100 && i.src?.startsWith('http') && i.src.includes('rukminim'))
    return img?.src || ''
  }

  // ─── Shared: canonical URL ────────────────────────────────────────────────

  function extractURL() {
    const canonical = document.querySelector('link[rel="canonical"]')
    return canonical?.href || window.location.href
  }

  // ─── Assemble product data ────────────────────────────────────────────────

  function extractProductData() {
    const data = isFlipkart
      ? {
          title:       flipkartTitle(),
          price:       flipkartPrice(),
          image_url:   flipkartImage(),
          product_url: extractURL(),
          source:      'flipkart',
        }
      : {
          title:       amazonTitle(),
          price:       amazonPrice(),
          image_url:   amazonImage(),
          product_url: extractURL(),
          source:      'amazon',
        }

    console.log('[Wishlist Saver] Extracted product:', JSON.stringify(data, null, 2))
    return data
  }

  // ─── Button factory ───────────────────────────────────────────────────────
  function createButton() {
    const btn = document.createElement('button')
    btn.id = 'wl-save-btn'
    btn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682
                 a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318
                 a4.5 4.5 0 00-6.364 0z"/>
      </svg>
      Save to Dashboard
    `
    btn.style.cssText = `
      display:         inline-flex;
      align-items:     center;
      gap:             8px;
      background:      #4f46e5;
      color:           white;
      border:          none;
      border-radius:   8px;
      padding:         10px 18px;
      font-size:       14px;
      font-weight:     600;
      font-family:     -apple-system, sans-serif;
      cursor:          pointer;
      margin:          10px 0;
      width:           100%;
      justify-content: center;
      transition:      background 0.2s, opacity 0.2s;
      box-shadow:      0 2px 6px rgba(79,70,229,0.35);
    `
    btn.addEventListener('mouseenter', () => { if (!btn.disabled) btn.style.background = '#4338ca' })
    btn.addEventListener('mouseleave', () => { if (!btn.disabled) btn.style.background = '#4f46e5' })
    return btn
  }

  // ─── Button state helpers ─────────────────────────────────────────────────
  const STATES = {
    idle:     { html: '♥ Save to Dashboard',           bg: '#4f46e5', disabled: false },
    saving:   { html: '⏳ Saving...',                   bg: '#6366f1', disabled: true  },
    success:  { html: '✓ Saved to Dashboard!',          bg: '#16a34a', disabled: true  },
    exists:   { html: '✓ Already in Wishlist',          bg: '#16a34a', disabled: true  },
    noauth:   { html: '🔒 Login via extension first',   bg: '#dc2626', disabled: false },
    expired:  { html: '🔒 Session expired — Login again', bg: '#dc2626', disabled: false },
    failed:   { html: '⚠ Save failed — Try again',     bg: '#b45309', disabled: false },
  }

  function applyState(btn, key) {
    const s = STATES[key]
    btn.innerHTML   = s.html
    btn.style.background = s.bg
    btn.disabled    = s.disabled
    btn.style.opacity = s.disabled ? '0.85' : '1'

    if (key === 'success') {
      setTimeout(() => applyState(btn, 'idle'), 3000)
    }
  }

  // ─── Save product to Django API ───────────────────────────────────────────
  async function handleSave(btn) {
    applyState(btn, 'saving')

    // Guard: chrome context is lost if extension was reloaded without refreshing the page
    if (!chrome?.storage?.local) {
      btn.textContent = '↺ Refresh page and try again'
      btn.style.background = '#b45309'
      return
    }

    // Step 1: Read JWT token from chrome.storage (set by popup.js on login)
    const { access_token } = await chrome.storage.local.get('access_token')
    if (!access_token) {
      applyState(btn, 'noauth')
      return
    }

    // Step 2: Assemble POST payload from extracted product data
    const payload = { ...extractProductData(), status: 'wishlist' }

    try {
      // Step 3: POST to Django API with JWT in Authorization header
      const res = await fetch(`${API_BASE}/api/products/`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',        // tell Django to parse as JSON
          'Authorization': `Bearer ${access_token}`,  // JWT token for authentication
        },
        body: JSON.stringify(payload),
      })

      // Step 4: Handle response by HTTP status code
      if (res.ok) {
        // 201 Created — product saved successfully
        applyState(btn, 'success')
      } else if (res.status === 400) {
        // 400 Bad Request — unique_together constraint: user already saved this product
        applyState(btn, 'exists')
      } else if (res.status === 401) {
        // 401 Unauthorized — token expired; clear storage so popup shows login
        await chrome.storage.local.remove(['access_token', 'refresh_token', 'username'])
        applyState(btn, 'expired')
      } else {
        // 403, 500, etc.
        applyState(btn, 'failed')
      }
    } catch {
      // Network error — backend not running or no internet
      applyState(btn, 'failed')
    }
  }

  // ─── Inject button ────────────────────────────────────────────────────────
  function inject() {
    if (document.getElementById('wl-save-btn')) return true

    if (isFlipkart) {
      // Flipkart's React aggressively re-renders its DOM tree, removing
      // any manually injected nodes. Append directly to document.body as a
      // fixed overlay — completely outside React's control.
      const wrapper = document.createElement('div')
      wrapper.style.cssText = `
        position: fixed;
        bottom: 90px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2147483647;
        width: 260px;
      `
      const btn = createButton()
      btn.addEventListener('click', () => handleSave(btn))
      wrapper.appendChild(btn)
      document.body.appendChild(wrapper)
      return true
    }

    // ── Amazon: inject into buy box ────────────────────────────────────────
    const buyBox =
      document.getElementById('desktop_buybox_feature_div') ||
      document.getElementById('desktop_buybox')              ||
      document.getElementById('addToCart_feature_div')       ||
      document.querySelector('#centerCol')
    if (!buyBox) return false
    const btn = createButton()
    btn.addEventListener('click', () => handleSave(btn))
    buyBox.prepend(btn)
    return true
  }

  // Try immediately; for slow pages retry via MutationObserver
  if (!inject()) {
    const observer = new MutationObserver(() => {
      if (inject()) observer.disconnect()
    })
    observer.observe(document.body, { childList: true, subtree: true })
    setTimeout(() => observer.disconnect(), 15000)
  }
})()
