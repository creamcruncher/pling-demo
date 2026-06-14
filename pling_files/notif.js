/* Pling — global notifications. Injects the bell + dropdown into #headerRight
   on every page. Tap a friend's pling to act (Reply / Join). Shared so pings
   are reachable from any tab, not just Home. */
(function () {
    /* One coherent feed (matches the RN mock + the rest of the prototype):
       - every Join pling has a matching card on Home's Invites tab (hid = hangout id there)
       - "Pickup at RPAC" is THE Lifting Monkeys group event (groups.html + plans.html, same time)
       - the Study Crew line is the group event that also sits in Plans */
    const NOTIFS = [
        { emoji: '👋', name: 'Nora Whitfield', html: '<b>Nora Whitfield</b> wants to be friends', time: 'just now', action: 'Add', done: false },
        { emoji: '👋', name: 'Emily Carter', html: '<b>Emily Carter</b> plinged you — free for 30 min', time: '2 min ago', action: 'Reply', done: false },
        { emoji: '☕', name: 'Ashley Turner', html: '<b>Ashley Turner</b> wants to grab coffee', time: '8 min ago', action: 'Join', hid: '6', done: false },
        { emoji: '🏀', name: 'Jacob Miller', html: '<b>Jacob Miller</b> started a pickup game at RPAC — today 4 PM', time: '15 min ago', action: 'Join', hid: '3', done: false },
        { emoji: '📚', name: 'Study Crew', html: '<b>Midterm cram session</b> proposed in <b>Study Crew</b> — Thu 2 PM', time: '1h ago', action: '', done: false },
    ];
    /* group proposals (groups.html) fan out via localStorage → every page's bell */
    try {
        JSON.parse(localStorage.getItem('pling_extra_notifs') || '[]')
            .reverse().forEach(n => NOTIFS.unshift({ emoji: n.emoji, name: n.name, html: n.html, time: n.time, action: n.action || '', done: false }));
    } catch (e) { /* no-op */ }
    const PAST = { Reply: 'Replied', Join: 'Joined', Add: 'Added' };
    const TOAST = { Reply: '💬 Replied to', Join: '🎉 Joined', Add: '✅ Added' };

    const slot = document.getElementById('headerRight');
    const screen = document.querySelector('.screen');
    if (!slot || !screen) return;

    const BELL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e1457e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8z"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>';

    // bell button (sits at the end of the header-right row)
    const bell = document.createElement('div');
    bell.className = 'gear bell';
    bell.id = 'bellBtn';
    bell.innerHTML = `<span class="nav-ic">${BELL}<span class="nav-badge" id="bellBadge"></span></span>`;
    slot.appendChild(bell);

    // scrim + dropdown card
    const scrim = document.createElement('div');
    scrim.className = 'notif-scrim';
    scrim.id = 'notifScrim';

    const card = document.createElement('div');
    card.className = 'notif-card';
    card.id = 'notifCard';
    card.innerHTML =
        '<div class="notif-head"><span class="t">NEW PLINGS</span><span class="clear" id="notifClear">Mark all read</span></div>' +
        '<div id="notifList"></div>' +
        '<div class="notif-empty" id="notifEmpty" style="display:none">All caught up 🎉</div>';

    screen.appendChild(scrim);
    screen.appendChild(card);

    const badge = bell.querySelector('#bellBadge');
    const list = card.querySelector('#notifList');
    const empty = card.querySelector('#notifEmpty');

    function render() {
        const pending = NOTIFS.filter(n => !n.done).length;
        badge.textContent = pending;
        badge.style.display = pending ? '' : 'none';
        empty.style.display = NOTIFS.length ? 'none' : '';
        list.innerHTML = NOTIFS.map((n, i) => {
            const trailing = n.done
                ? `<span class="notif-done">✓ ${PAST[n.action] || 'Done'}</span>`
                : n.mode ? '' /* expanded → hide the Reply button */
                : n.action ? `<button class="notif-btn" data-i="${i}">${n.action}</button>`
                : ''; /* info-only (e.g. your own group proposal) — no action button */
            const reply = n.mode
                ? `<div class="notif-reply" data-i="${i}">${n.mode === 'custom' ? customHTML() : pillsHTML(i)}</div>`
                : '';
            return `<div class="notif-item${n.done ? ' done' : ''}">
                <div class="notif-row">
                    <div class="notif-emoji">${n.emoji}</div>
                    <div class="notif-info"><div class="notif-tx">${n.html}</div><div class="notif-time">${n.time}</div></div>
                    ${trailing}
                </div>${reply}
            </div>`;
        }).join('');
        wireList();
    }

    const pillsHTML = (i) =>
        `<button class="np-pill" data-i="${i}" data-act="coffee">☕ Coffee?</button>` +
        `<button class="np-pill" data-i="${i}" data-act="study">📚 Study?</button>` +
        `<button class="np-pill custom" data-i="${i}" data-act="custom">✏️ Custom</button>`;
    const customHTML = () =>
        `<input class="np-input" placeholder="What do you want to do? (e.g., take a walk)" />` +
        `<button class="np-send">Send ⚡</button>`;

    function wireList() {
        list.querySelectorAll('.notif-btn[data-i]').forEach(b =>
            b.addEventListener('click', () => onAction(+b.dataset.i)));
        list.querySelectorAll('.np-pill[data-i]').forEach(b =>
            b.addEventListener('click', () => onPill(+b.dataset.i, b.dataset.act)));
        list.querySelectorAll('.notif-reply').forEach(area => wireCustom(area, +area.dataset.i));
    }
    function wireCustom(area, i) {
        const send = area.querySelector('.np-send');
        if (!send) return;
        const input = area.querySelector('.np-input');
        send.addEventListener('click', () => sendCustom(i, input.value));
        input.addEventListener('keydown', e => { if (e.key === 'Enter') sendCustom(i, input.value); });
    }

    /* Reply → inline quick-choices; Join/Add → confirm directly. No in-app chat (CLAUDE.md):
       a real build wires the choice to iMessage / the activity; here we confirm the pling. */
    function onAction(i) {
        const n = NOTIFS[i];
        if (!n || n.done) return;
        if (n.action === 'Reply') { n.mode = 'pills'; render(); return; }
        // Join from the bell also RSVPs the matching card on Home's Invites tab
        if (n.action === 'Join' && n.hid && window.plingJoinHangout) {
            try { window.plingJoinHangout(n.hid); } catch (e) {}
        }
        fire(i, TOAST[n.action] || 'Done', n.name.split(' ')[0]);
    }
    function onPill(i, act) {
        if (act === 'custom') return goCustom(i);
        const label = act === 'coffee' ? 'coffee ☕' : 'study sesh 📚';
        fire(i, '💬 Plinged', `${NOTIFS[i].name.split(' ')[0]} · ${label}`);
    }
    function goCustom(i) {
        NOTIFS[i].mode = 'custom';
        const area = list.querySelector(`.notif-reply[data-i="${i}"]`);
        if (!area) return render();
        area.innerHTML = customHTML();   // swap pills→input in place (no collapse/re-expand)
        wireCustom(area, i);
        area.querySelector('.np-input').focus();
    }
    function sendCustom(i, value) {
        const v = (value || '').trim();
        fire(i, '💬 Plinged', `${NOTIFS[i].name.split(' ')[0]}${v ? ' · ' + v : ''}`);
    }
    function fire(i, verb, detail) {
        const n = NOTIFS[i];
        if (!n || n.done) return;
        n.done = true; n.mode = null;
        toast(`${verb} ${detail}`);
        render();
    }

    let toastEl;
    function toast(msg) {
        if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'notif-toast'; screen.appendChild(toastEl); }
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        clearTimeout(toastEl._t);
        toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 1800);
    }

    function open() { scrim.classList.add('open'); card.classList.add('open'); }
    function close() { scrim.classList.remove('open'); card.classList.remove('open'); }

    bell.addEventListener('click', open);
    scrim.addEventListener('click', close);
    card.querySelector('#notifClear').addEventListener('click', () => {
        NOTIFS.length = 0;
        render();
    });

    /* live-add for same-page producers (groups.html proposal → this page's bell) */
    window.plingAddNotif = function (n) {
        NOTIFS.unshift({ emoji: n.emoji, name: n.name, html: n.html, time: n.time || 'just now', action: n.action || '', done: false });
        render();
    };

    render();
})();
