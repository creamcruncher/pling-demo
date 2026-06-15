/* ---- Pling theme engine (shared across every prototype page) ----
   A theme = an accent + a 2-stop gradient + a wordmark 2nd stop. Applying a theme
   just overrides CSS custom properties on <html>, so anything using var(--accent),
   var(--accent-2), var(--grad-start/-end), var(--shadow) recolors instantly.
   Saved theme lives in localStorage('pling_theme'); applied here before paint so
   every page (Home/Circles/Plans/Friends) stays in sync. The `free` green is a
   fixed semantic — themes never touch it. */
/* Per theme: accent (+ a2 wordmark stop), the brand gradient g1→g2 (also the AVAILABLE status
   card) — two distinct colors travelling a wide hue distance — and the BUSY gradient b1→b2.
   All hardcoded, no derivation. */
window.PLING_THEMES = {
    sunset:     { name: 'Sunset',     accent: '#e1457e', g1: '#ff8a5c', g2: '#9a5cf0', a2: '#a96cf0', b1: '#3d2b8f', b2: '#5b4acd' },
    berry:      { name: 'Berry',      accent: '#6366f1', g1: '#f472b6', g2: '#6366f1', a2: '#f472b6', b1: '#2d1b6b', b2: '#4a1a5c' },
    lagoon:     { name: 'Lagoon',     accent: '#a855f7', g1: '#22d3ee', g2: '#a855f7', a2: '#22d3ee', b1: '#1a1a6b', b2: '#2d1b8f' },
    watermelon: { name: 'Watermelon', accent: '#fb7185', g1: '#fb7185', g2: '#34d399', a2: '#34d399', b1: '#1a4a3a', b2: '#0f3a2a' },
    citrus:     { name: 'Citrus Pop', accent: '#ec4899', g1: '#fbbf24', g2: '#ec4899', a2: '#fbbf24', b1: '#4a1a4a', b2: '#2d0f3a' },
    graphite:   { name: 'Graphite',   accent: '#475569', g1: '#64748b', g2: '#334155', a2: '#94a3b8', b1: '#1a2a3a', b2: '#0f1a2a' },
};
window.PLING_THEME_ORDER = ['sunset', 'berry', 'lagoon', 'watermelon', 'citrus', 'graphite'];
(function themeEngine() {
    function hexToRgb(h) {
        h = String(h).replace('#', '');
        if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
        var n = parseInt(h, 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }
    function mix(rgb, target, amt) { // amt 0..1 toward target (255=lighten, 0=darken)
        return rgb.map(function (c) { return clamp(c + (target - c) * amt); });
    }
    function toHex(rgb) { return '#' + rgb.map(function (c) { return ('0' + clamp(c).toString(16)).slice(-2); }).join(''); }

    /* Resolve a stored value into the colors we set. Accepts a preset object,
       a preset key, or a custom-color payload {custom:'#hex'} (gradient derived). */
    function resolve(t) {
        if (typeof t === 'string') t = window.PLING_THEMES[t];
        if (t && t.custom) {
            var rgb = hexToRgb(t.custom);
            return {
                accent: t.custom, a2: toHex(mix(rgb, 255, 0.22)),
                g1: toHex(mix(rgb, 255, 0.28)), g2: t.custom,
                b1: toHex(mix(rgb, 255, 0.42)), b2: toHex(mix(rgb, 255, 0.66)),
            };
        }
        return t || window.PLING_THEMES.sunset;
    }
    function shadowOf(hex, a) { return 'rgba(' + hexToRgb(hex).join(', ') + ', ' + a + ')'; }

    window.plingApplyTheme = function (t) {
        var c = resolve(t);
        var r = document.documentElement.style;
        r.setProperty('--accent', c.accent);
        r.setProperty('--accent-2', c.a2);
        r.setProperty('--grad-start', c.g1);
        r.setProperty('--grad-end', c.g2);
        var rgb = hexToRgb(c.accent);
        r.setProperty('--accent-rgb', rgb.join(', '));
        r.setProperty('--shadow', 'rgba(' + rgb.join(', ') + ', 0.14)');
        // status cards: available = brand gradient, busy = hardcoded gradient; shadows tint to match
        r.setProperty('--avail-1', c.g1);
        r.setProperty('--avail-2', c.g2);
        r.setProperty('--busy-1', c.b1);
        r.setProperty('--busy-2', c.b2);
        r.setProperty('--avail-shadow', shadowOf(c.accent, 0.4));
        r.setProperty('--busy-shadow', shadowOf(c.b1, 0.42));
    };
    /* persist whatever the picker passes (preset key string or {custom}) */
    window.plingSaveTheme = function (payload) {
        try { localStorage.setItem('pling_theme', JSON.stringify(payload)); } catch (e) {}
        window.plingApplyTheme(payload);
    };
    window.plingGetTheme = function () {
        try { return JSON.parse(localStorage.getItem('pling_theme') || 'null'); } catch (e) { return null; }
    };

    var saved = window.plingGetTheme();
    if (saved) window.plingApplyTheme(saved);

    /* Live sync: localStorage 'storage' events fire in EVERY other same-origin
       document (sibling prototype tabs, and the app.html nested inside the
       landing's hero/demo iframes). Re-apply so a theme change anywhere — incl.
       the marketing site's floating picker — recolors every open frame instantly. */
    window.addEventListener('storage', function (e) {
        if (e.key === 'pling_theme') window.plingApplyTheme(window.plingGetTheme() || 'sunset');
    });
})();

/* Real mobile device → fill the screen, no phone frame, no page scroll.
   Adds `pling-mobile` to <html> ONLY when this page is the top window (not a
   marketing-site embed) on a narrow viewport. styles.css keys the fullscreen
   layout off that class. Embeds (?demo=1 / iframed) are left framed. */
(function mobileFullscreen() {
    try {
        var params = new URLSearchParams(location.search);
        var embedded = (window.self !== window.top) || params.get('demo') === '1';
        if (embedded) return;
        var mq = window.matchMedia && window.matchMedia('(max-width: 768px)');
        if (!mq) return;
        function apply() {
            document.documentElement.classList.toggle('pling-mobile', mq.matches);
        }
        apply();
        if (mq.addEventListener) mq.addEventListener('change', apply);
        else if (mq.addListener) mq.addListener(apply); // older Safari
    } catch (e) { /* no-op */ }
})();

/* Back-to-site button — persists across ALL prototype tabs once you arrive
   from the marketing landing (?from=landing). Uses sessionStorage so switching
   tabs (Circles/Plans/Friends) keeps it. Never shown inside the demo/hero
   iframes (embedded or ?demo=1). */
(function backToSite() {
    try {
        var params = new URLSearchParams(location.search);
        if (params.get('from') === 'landing') {
            sessionStorage.setItem('pling_from_landing', '1');
        }
        var embedded = (window.self !== window.top) || params.get('demo') === '1';
        if (embedded) return;
        if (sessionStorage.getItem('pling_from_landing') !== '1') return;
        if (document.getElementById('lpBackToSite')) return;

        var s = document.createElement('style');
        s.textContent =
            '#lpBackToSite{position:fixed;top:22px;left:22px;z-index:9999;' +
            'display:inline-flex;align-items:center;gap:8px;padding:11px 18px 11px 15px;' +
            'background:rgba(255,255,255,0.82);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);' +
            'border:1px solid rgba(224, 90, 132,0.15);border-radius:999px;color:#e1457e;font-weight:700;font-size:14px;' +
            "font-family:'SF Pro Display',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-decoration:none;" +
            'box-shadow:0 8px 24px rgba(224, 90, 132,0.18);transition:transform 0.18s ease,box-shadow 0.2s ease;}' +
            '#lpBackToSite:hover{transform:translateY(-1px);box-shadow:0 12px 28px rgba(224, 90, 132,0.24);}' +
            '#lpBackToSite:active{transform:translateY(0) scale(0.97);}' +
            /* mobile: just the arrow, circular, no label — cleaner on a phone */
            '@media (max-width:768px){#lpBackToSite{gap:0;padding:0;width:44px;height:44px;justify-content:center;}' +
            '#lpBackToSite .lp-bts-label{display:none;}}';
        document.head.appendChild(s);

        var a = document.createElement('a');
        a.id = 'lpBackToSite';
        a.href = '../index.html';
        a.setAttribute('aria-label', 'Back to site');
        a.innerHTML =
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
            'stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M19 12H5M12 19l-7-7 7-7"/></svg><span class="lp-bts-label"> Back to site</span>';
        a.addEventListener('click', function () {
            try { sessionStorage.removeItem('pling_from_landing'); } catch (e) {}
        });

        // flag so the page header can clear the fixed back button on mobile
        document.documentElement.classList.add('lp-bts-on');

        function mount() { if (document.body) document.body.appendChild(a); }
        if (document.body) mount();
        else document.addEventListener('DOMContentLoaded', mount, { once: true });
    } catch (e) { /* no-op */ }
})();

/* Pling — shared bottom nav. Renders into <div id="nav"></div>.
   Home sits in the center. Active tab inferred from the page URL. */
(function () {
    const ICONS = {
        friends:  '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16.5 5.2a3 3 0 0 1 0 5.6M19 19.5c0-2.5-1.3-4.3-3.2-5"/>',
        plans:    '<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9h18"/><path d="M8 2.5v4M16 2.5v4"/>',
        home:     '<path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z"/>',
        groups:   '<rect x="3" y="3" width="8" height="8" rx="2.2"/><rect x="13" y="3" width="8" height="8" rx="2.2"/><rect x="3" y="13" width="8" height="8" rx="2.2"/><rect x="13" y="13" width="8" height="8" rx="2.2"/>',
        discover: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z"/>',
    };
    /* 4 tabs. Circles merges Friends + Groups behind a segmented control (friends.html +
       groups.html both = Circles). Order: Home · Circles · Discover · Plans. */
    const ITEMS = [
        { key: 'home',     href: 'app.html',      label: 'Home' },
        { key: 'groups',   href: 'groups.html',   label: 'Circles' },
        { key: 'plans',    href: 'plans.html',    label: 'Plans' },
        { key: 'discover', href: 'discover.html', label: 'Discover' },
    ];

    /* Prototype home now lives at app.html (index.html is the marketing landing). */
    const file = (location.pathname.split('/').pop() || 'app.html').toLowerCase();
    const cur = file === '' ? 'app.html' : file;

    const nav = document.getElementById('nav');
    if (!nav) return;
    nav.className = 'nav';
    nav.innerHTML = ITEMS.map(it => {
        const active = it.href === cur
            || (it.key === 'home' && cur === 'app.html')
            || (it.key === 'groups' && cur === 'friends.html'); // Friends pane lives under Circles
        const sw = active ? '2.2' : '2';
        const svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[it.key]}</svg>`;
        const icon = it.badge
            ? `<span class="nav-ic">${svg}<span class="nav-badge">${it.badge}</span></span>`
            : svg;
        return `<a class="nav-item${active ? ' active' : ''}" href="${it.href}">${icon}<span>${it.label}</span><div class="nav-dot"></div></a>`;
    }).join('');
})();
