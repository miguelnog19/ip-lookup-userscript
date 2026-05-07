// ==UserScript==
// @name         IP Lookup
// @namespace    ip-lookup-tampermonkey
// @version      1.0.0
// @description  Select an IP address on any page to instantly look it up via ipinfo.io
// @author       Lykion
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @connect      ipinfo.io
// @run-at       document-idle
// ==/UserScript==

'use strict';

(function () {

  // ─── IDs ──────────────────────────────────────────────────────────────────
  const BUBBLE_ID = 'iplookup-bubble';
  const PANEL_ID  = 'iplookup-panel';

  // ─── IP Validation ────────────────────────────────────────────────────────
  const RE_IPV4 = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)$/;

  // Covers: full, compressed (::), link-local, and IPv4-mapped forms
  const IPV6_RE = new RegExp(
    '^(' +
    '([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|' +
    '([0-9a-fA-F]{1,4}:){1,7}:|' +
    '([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|' +
    '([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|' +
    '([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|' +
    '([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|' +
    '([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|' +
    '[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|' +
    ':((:[0-9a-fA-F]{1,4}){1,7}|:)|' +
    'fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]+|' +
    '::(ffff(:0{1,4})?:)?((25[0-5]|(2[0-4]|1?[0-9])?[0-9])\\.){3}(25[0-5]|(2[0-4]|1?[0-9])?[0-9])|' +
    '([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1?[0-9])?[0-9])\\.){3}(25[0-5]|(2[0-4]|1?[0-9])?[0-9])' +
    ')$'
  );

  function isValidIP(str) {
    return RE_IPV4.test(str) || IPV6_RE.test(str);
  }

  // ─── Token Management ─────────────────────────────────────────────────────
  GM_registerMenuCommand('⚙ Set ipinfo.io Token', () => {
    const current = GM_getValue('ipinfo_token', '');
    const input = prompt(
      'Enter your ipinfo.io API token.\nLeave blank to use the free anonymous tier (50k req/month).',
      current
    );
    if (input !== null) {
      GM_setValue('ipinfo_token', input.trim());
      alert(input.trim() ? '✓ Token saved.' : '✓ Token cleared (using anonymous access).');
    }
  });

  GM_registerMenuCommand('✕ Clear ipinfo.io Token', () => {
    GM_setValue('ipinfo_token', '');
    alert('✓ Token cleared.');
  });

  function getToken() {
    return GM_getValue('ipinfo_token', '');
  }

  // ─── CSS ──────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #${BUBBLE_ID} {
      all: initial;
      position: absolute;
      z-index: 2147483647;
      display: none;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #${BUBBLE_ID} button {
      all: initial;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      line-height: 1;
      cursor: pointer;
      background: #1a73e8;
      color: #fff;
      border: none;
      border-radius: 4px;
      padding: 6px 11px;
      white-space: nowrap;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      display: block;
      transition: background 0.15s;
    }
    #${BUBBLE_ID} button:hover {
      background: #1558b0;
    }

    #${PANEL_ID} {
      all: initial;
      position: fixed;
      z-index: 2147483646;
      top: 20px;
      right: 20px;
      width: 340px;
      min-width: 260px;
      background: #1e1e2e;
      color: #cdd6f4;
      border-radius: 10px;
      box-shadow: 0 6px 32px rgba(0,0,0,0.55);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      display: none;
      flex-direction: column;
      overflow: hidden;
      user-select: none;
    }
    #${PANEL_ID}.iplookup-visible {
      display: flex;
    }

    #iplookup-panel-header {
      background: #313244;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: grab;
      border-radius: 10px 10px 0 0;
    }
    #iplookup-panel-header.iplookup-dragging {
      cursor: grabbing;
    }
    #iplookup-panel-title {
      font-weight: 600;
      font-size: 13px;
      color: #cba6f7;
      letter-spacing: 0.2px;
    }
    #iplookup-panel-close {
      all: initial;
      font-family: inherit;
      cursor: pointer;
      color: #6c7086;
      font-size: 20px;
      line-height: 1;
      padding: 0 2px;
      transition: color 0.15s;
    }
    #iplookup-panel-close:hover {
      color: #f38ba8;
    }

    #iplookup-panel-body {
      padding: 12px 14px;
      overflow-y: auto;
      max-height: 440px;
    }
    #iplookup-panel-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 7px 14px;
      align-items: baseline;
    }
    .iplookup-label {
      color: #89dceb;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
    .iplookup-value {
      color: #cdd6f4;
      word-break: break-all;
      font-size: 13px;
      user-select: text;
    }
    .iplookup-value a {
      color: #89b4fa;
      text-decoration: none;
    }
    .iplookup-value a:hover {
      text-decoration: underline;
    }
    #iplookup-panel-spinner {
      padding: 22px 14px;
      text-align: center;
      color: #6c7086;
      font-size: 13px;
    }
    #iplookup-panel-error {
      padding: 14px 14px;
      color: #f38ba8;
      font-size: 13px;
    }
    #iplookup-panel-bogon {
      margin-bottom: 10px;
      padding: 6px 10px;
      background: rgba(250,179,135,0.12);
      border-left: 3px solid #fab387;
      border-radius: 4px;
      color: #fab387;
      font-size: 11px;
    }
  `;
  document.head.appendChild(style);

  // ─── Bubble ───────────────────────────────────────────────────────────────
  const bubble = document.createElement('div');
  bubble.id = BUBBLE_ID;
  const bubbleBtn = document.createElement('button');
  bubbleBtn.type = 'button';
  bubble.appendChild(bubbleBtn);
  document.body.appendChild(bubble);

  let currentIP = null;

  function showBubble(ip, rect) {
    currentIP = ip;
    bubbleBtn.textContent = `\uD83D\uDD0D\u00A0${ip}`;

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // Try to position above the selection; fall back to below if not enough space
    let top  = rect.top  + scrollY - 38;
    let left = rect.left + scrollX + rect.width / 2 - 60;

    if (top < scrollY + 4) {
      top = rect.bottom + scrollY + 8;
    }
    // Clamp horizontally to viewport
    left = Math.max(scrollX + 4, Math.min(left, scrollX + window.innerWidth - 160));

    bubble.style.top  = top  + 'px';
    bubble.style.left = left + 'px';
    bubble.style.display = 'block';
  }

  function hideBubble() {
    bubble.style.display = 'none';
    currentIP = null;
  }

  // ─── Panel ────────────────────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.id = PANEL_ID;

  // Header
  const panelHeader = document.createElement('div');
  panelHeader.id = 'iplookup-panel-header';

  const panelTitle = document.createElement('span');
  panelTitle.id = 'iplookup-panel-title';
  panelTitle.textContent = 'IP Lookup';

  const panelClose = document.createElement('button');
  panelClose.id = 'iplookup-panel-close';
  panelClose.type = 'button';
  panelClose.textContent = '\u00D7';
  panelClose.title = 'Close';

  panelHeader.appendChild(panelTitle);
  panelHeader.appendChild(panelClose);

  // Body
  const panelBody = document.createElement('div');
  panelBody.id = 'iplookup-panel-body';

  panel.appendChild(panelHeader);
  panel.appendChild(panelBody);
  document.body.appendChild(panel);

  function showPanel() {
    panel.classList.add('iplookup-visible');
  }

  function hidePanel() {
    panel.classList.remove('iplookup-visible');
  }

  function setPanelLoading(ip) {
    panelTitle.textContent = `IP Info \u2014 ${ip}`;
    panelBody.innerHTML = '<div id="iplookup-panel-spinner">Loading\u2026</div>';
    showPanel();
  }

  function setPanelError(msg) {
    panelBody.innerHTML = `<div id="iplookup-panel-error">\u26A0\uFE0F ${escHtml(msg)}</div>`;
  }

  // Fields to display, in order
  const FIELDS = [
    ['IP',       'ip'],
    ['Hostname', 'hostname'],
    ['City',     'city'],
    ['Region',   'region'],
    ['Country',  'country'],
    ['Org',      'org'],
    ['ASN',      'asn'],
    ['Timezone', 'timezone'],
    ['Postal',   'postal'],
    ['Location', 'loc'],
  ];

  function setPanelData(data) {
    let html = '';

    if (data.bogon) {
      html += '<div id="iplookup-panel-bogon">\u26A0 Private / reserved address \u2014 geolocation data unavailable</div>';
    }

    const rows = FIELDS
      .filter(([, key]) => data[key])
      .map(([label, key]) => {
        const raw = data[key];
        let display;
        if (key === 'loc') {
          const safeVal = escHtml(raw);
          const safeUrl = encodeURIComponent(raw);
          display = `<a href="https://maps.google.com/maps?q=${safeUrl}" target="_blank" rel="noopener noreferrer">${safeVal}</a>`;
        } else {
          display = escHtml(raw);
        }
        return `<span class="iplookup-label">${escHtml(label)}</span><span class="iplookup-value">${display}</span>`;
      })
      .join('');

    html += `<div id="iplookup-panel-grid">${rows}</div>`;
    panelBody.innerHTML = html;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ─── Drag ─────────────────────────────────────────────────────────────────
  let dragging    = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  panelHeader.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    const rect = panel.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    panelHeader.classList.add('iplookup-dragging');
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    let x = e.clientX - dragOffsetX;
    let y = e.clientY - dragOffsetY;
    // Clamp within viewport
    x = Math.max(0, Math.min(x, window.innerWidth  - panel.offsetWidth));
    y = Math.max(0, Math.min(y, window.innerHeight - panel.offsetHeight));
    panel.style.left  = x + 'px';
    panel.style.top   = y + 'px';
    panel.style.right = 'auto';
  });

  document.addEventListener('mouseup', () => {
    if (dragging) {
      dragging = false;
      panelHeader.classList.remove('iplookup-dragging');
    }
  });

  // ─── API Call ─────────────────────────────────────────────────────────────
  function lookupIP(ip) {
    const token = getToken();
    const url = token
      ? `https://ipinfo.io/${encodeURIComponent(ip)}/json?token=${encodeURIComponent(token)}`
      : `https://ipinfo.io/${encodeURIComponent(ip)}/json`;

    setPanelLoading(ip);

    GM_xmlhttpRequest({
      method:  'GET',
      url,
      headers: { Accept: 'application/json' },
      timeout: 10000,
      onload(resp) {
        if (resp.status < 200 || resp.status >= 300) {
          setPanelError(`HTTP ${resp.status} — request failed`);
          return;
        }
        let data;
        try {
          data = JSON.parse(resp.responseText);
        } catch {
          setPanelError('Invalid response from ipinfo.io');
          return;
        }
        setPanelData(data);
      },
      onerror() {
        setPanelError('Network error — could not reach ipinfo.io');
      },
      ontimeout() {
        setPanelError('Request timed out');
      },
    });
  }

  // ─── Selection → Bubble ───────────────────────────────────────────────────
  document.addEventListener('mouseup', (e) => {
    // Ignore events originating from our own UI
    if (e.target.closest && (e.target.closest(`#${BUBBLE_ID}`) || e.target.closest(`#${PANEL_ID}`))) return;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) { hideBubble(); return; }

    const text = sel.toString().trim();
    if (!isValidIP(text)) { hideBubble(); return; }

    try {
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      showBubble(text, rect);
    } catch {
      hideBubble();
    }
  });

  // Hide bubble on click outside it (but NOT on mouseup — that's handled above)
  document.addEventListener('mousedown', (e) => {
    if (!e.target.closest || !e.target.closest(`#${BUBBLE_ID}`)) {
      hideBubble();
    }
  });

  // Bubble click → trigger lookup
  bubbleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const ip = currentIP;
    hideBubble();
    if (ip) lookupIP(ip);
  });

  // Keyboard: Escape closes both
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideBubble();
      hidePanel();
    }
  });

  // Close button
  panelClose.addEventListener('click', (e) => {
    e.stopPropagation();
    hidePanel();
  });

})();
