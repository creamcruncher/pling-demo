/* Pling — shared profile sheet + friend sort.
   Used by index.html (Home) and friends.html.
   Action buttons (Message / Call / FaceTime) are placeholders;
   wire to iOS sms:/tel:/facetime: handlers later. */

/* week: 7 rows (Mon→Sun) × 4 slots (Morn/Aft/Eve/Night).
   each char: f = free, m = maybe, b = busy */
const FRIENDS = {
    'Emily Carter': {
        status: 'free', statusText: 'Free for 30 min', loc: 'Thompson Library',
        week: ['bbff', 'bmff', 'fbbm', 'bbff', 'fffm', 'mffb', 'bffb'],
    },
    'Jacob Miller': {
        status: 'free', statusText: 'Free for 1 hr', loc: 'RPAC Gym',
        week: ['ffbb', 'fmbf', 'bbff', 'ffmb', 'fbff', 'ffff', 'bbmf'],
    },
    'Michael Brooks': {
        status: 'busy', statusText: 'In class until 3:30', loc: 'Hitchcock Hall',
        week: ['bbmf', 'bbff', 'mbbf', 'bfff', 'bbmf', 'ffbb', 'bfmb'],
    },
    'Ashley Turner': {
        status: 'free', statusText: 'Free for 15 min', loc: 'Caffe Apropos',
        week: ['fbbf', 'fmbf', 'bffb', 'fbmf', 'ffbb', 'mffb', 'bffm'],
    },
    'J.E.': {
        status: 'busy', statusText: 'Studying · do not disturb', loc: 'Hagerty Hall',
        week: ['bbff', 'bmbf', 'fbbm', 'bbff', 'ffmb', 'mffb', 'bffb'],
    },
    'Sarah Bennett': {
        status: 'offline', statusText: 'Offline', loc: 'Last seen 2h ago',
        week: ['bbbb', 'bbbm', 'bbbb', 'bbmb', 'bbbb', 'bmbb', 'bbbb'],
    },
    'Kayla Yeung': {
        status: 'free', statusText: 'Free for 45 min', loc: 'Caffe Apropos',
        week: ['fbff', 'ffbm', 'bffb', 'ffmf', 'fbff', 'mffb', 'bffm'],
    },
    'Grace Nguyen': {
        status: 'busy', statusText: 'In lab until 5', loc: 'Caldwell Lab',
        week: ['bbmf', 'bfbf', 'mbbf', 'bbff', 'fbmb', 'ffbb', 'bbmf'],
    },
    'Jisoo Park': {
        status: 'free', statusText: 'Free · no timer', loc: 'Oxley Hall',
        week: ['ffbf', 'fmff', 'bffb', 'fbff', 'ffbb', 'fffb', 'mffb'],
    },
    'Camila Reyes': {
        status: 'free', statusText: 'Free for 20 min', loc: 'Sullivant Hall',
        week: ['fbbf', 'ffbm', 'bffm', 'fbbf', 'ffbb', 'mffb', 'bffb'],
    },
    'Diego Morales': {
        status: 'busy', statusText: 'At work until 6', loc: 'Hudson St',
        week: ['bbmf', 'bbff', 'mbbf', 'bbmf', 'bbff', 'fbbb', 'bfmb'],
    },
    'Kevin Zhang': {
        status: 'offline', statusText: 'Offline', loc: 'Last seen 1h ago',
        week: ['bbbb', 'bbmb', 'bbbb', 'bbbm', 'bbbb', 'bmbb', 'bbbb'],
    },
};
/* alias: Home shows "J.E.", Friends shows full name — same person */
FRIENDS['Daniel Foster'] = FRIENDS['J.E.'];

function initials(name) {
    const parts = name.replace(/[^A-Za-z .]/g, '').split(/[ .]+/).filter(Boolean);
    if (!parts.length) return '?';
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

function buildSheet() {
    if (document.getElementById('profileSheet')) return;
    const scrim = document.createElement('div');
    scrim.className = 'sheet-scrim';
    scrim.id = 'profileScrim';
    scrim.addEventListener('click', closeProfile);

    const sheet = document.createElement('div');
    sheet.className = 'sheet';
    sheet.id = 'profileSheet';
    sheet.innerHTML = `
        <div class="sheet-handle"></div>
        <button class="sheet-fav" id="pfFav" onclick="toggleFav()" aria-label="Favorite">
            <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
        </button>
        <div class="sheet-scroll">
        <div class="sheet-head">
            <div class="sheet-avatar" id="pfAvatar"></div>
            <div class="sheet-name" id="pfName"></div>
            <div class="sheet-status" id="pfStatus"></div>
        </div>
        <div class="sheet-actions">
            <div class="act" onclick="alert('Message — links to iMessage later')">
                <div class="act-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#e1457e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.6 8.6 0 0 1-3.9-.9L3 21l1.9-5.1A8.4 8.4 0 0 1 4 11.5 8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5z"/></svg>
                </div>
                <span class="act-lbl">Message</span>
            </div>
            <div class="act" onclick="alert('Call — links to iOS dialer later')">
                <div class="act-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#34c759" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>
                </div>
                <span class="act-lbl">Call</span>
            </div>
            <div class="act" onclick="alert('FaceTime — links to iOS FaceTime later')">
                <div class="act-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#e1457e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5.5" width="14" height="13" rx="3"/><path d="M16 10l5.4-3.1a.6.6 0 0 1 .9.5v9.2a.6.6 0 0 1-.9.5L16 14z"/></svg>
                </div>
                <span class="act-lbl">FaceTime</span>
            </div>
        </div>
        <div class="sheet-section">THIS WEEK</div>
        <div id="pfSchedule"></div>
        </div>
        <div class="pf-recs-wrap" id="pfRecsWrap">
            <div class="pf-recs" id="pfRecs"></div>
            <div class="pf-recs-input" id="pfRecsInput">
                <input type="text" id="pfCustomInput" placeholder="What do you want to do? (e.g. study, gym, eat)" maxlength="40" />
            </div>
        </div>
        <button class="sheet-pling" id="pfPling"></button>
    `;
    const screen = document.querySelector('.screen');
    screen.appendChild(scrim);
    screen.appendChild(sheet);
}

function renderWeek(week) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const cols = ['Morn', 'Aft', 'Eve', 'Night'];
    const cls = { f: 'free', m: 'maybe', b: 'busy' };
    let html = '<div class="wk-grid">';
    html += '<div></div>' + cols.map(c => `<div class="wk-head">${c.toUpperCase()}</div>`).join('');
    for (let r = 0; r < 7; r++) {
        html += `<div class="wk-day">${days[r]}</div>`;
        for (let c = 0; c < 4; c++) {
            html += `<div class="wk-cell ${cls[week[r][c]] || 'busy'}"></div>`;
        }
    }
    html += '</div>';
    html += '<div class="wk-legend">' +
        '<div class="wk-leg"><span class="sw busy"></span>Busy</div>' +
        '<div class="wk-leg"><span class="sw maybe"></span>Maybe</div>' +
        '<div class="wk-leg"><span class="sw free"></span>Free</div>' +
        '</div>';
    return html;
}

/* activity recommendation pool — 2 picked at random per profile open */
const ACTIVITY_POOL = [
    {emoji:'☕', label:'Coffee'},
    {emoji:'🚶', label:'Walk'},
    {emoji:'📚', label:'Study'},
    {emoji:'🍔', label:'Lunch'},
    {emoji:'🏋️', label:'Gym'},
    {emoji:'🍵', label:'Boba'},
    {emoji:'🏃', label:'Run'},
    {emoji:'🎮', label:'Games'},
    {emoji:'🍜', label:'Dinner'},
    {emoji:'🌳', label:'Park'},
    {emoji:'🎬', label:'Movie'},
    {emoji:'🧘', label:'Yoga'},
    {emoji:'🥗', label:'Salad'},
    {emoji:'🏀', label:'Hoop'},
];

function pickTwoActivities() {
    const pool = ACTIVITY_POOL.slice();
    const picks = [];
    for (let i = 0; i < 2 && pool.length; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        picks.push(pool.splice(idx, 1)[0]);
    }
    return picks;
}

let pfSelectedActivity = null;

function renderRecs() {
    const wrap = document.getElementById('pfRecsWrap');
    const recs = document.getElementById('pfRecs');
    const input = document.getElementById('pfCustomInput');
    if (!wrap || !recs) return;
    wrap.classList.remove('input-mode');
    pfSelectedActivity = null;
    if (input) input.value = '';
    const picks = pickTwoActivities();
    recs.innerHTML = picks.map(p =>
        `<button class="pf-rec-chip" type="button" onclick="pickRec(this, '${p.emoji}', '${p.label}')">${p.emoji} ${p.label}?</button>`
    ).join('') +
    `<button class="pf-rec-chip custom" type="button" onclick="openRecCustom()">✏️ Custom</button>`;
    // restore display in case prior open hard-hid chips
    recs.style.display = '';
}

function pickRec(el, emoji, label) {
    document.querySelectorAll('#pfRecs .pf-rec-chip').forEach(c => c.classList.remove('sel'));
    el.classList.add('sel');
    pfSelectedActivity = `${emoji} ${label}`;
}

function openRecCustom() {
    const wrap = document.getElementById('pfRecsWrap');
    const recs = document.getElementById('pfRecs');
    const input = document.getElementById('pfCustomInput');
    if (!wrap || !input) return;
    wrap.classList.add('input-mode');
    setTimeout(() => {
        if (recs) recs.style.display = 'none';
        input.focus({ preventScroll: true });
    }, 280);
}

/* favorites (per friend) — demo-local; persist to the friend graph later */
let currentProfile = null;
const FAVORITES = new Set(['Emily Carter', 'Ashley Turner']);
function toggleFav() {
    if (!currentProfile) return;
    const on = !FAVORITES.has(currentProfile);
    if (on) FAVORITES.add(currentProfile); else FAVORITES.delete(currentProfile);
    const fav = document.getElementById('pfFav');
    fav.classList.toggle('on', on);
    const svg = fav.querySelector('svg');          // replay grow+spin on every tap
    svg.classList.remove('spin'); void svg.offsetWidth; svg.classList.add('spin');
}

function openProfile(name) {
    const data = FRIENDS[name];
    if (!data) return;
    buildSheet();

    currentProfile = name;
    document.getElementById('pfFav').classList.toggle('on', FAVORITES.has(name));
    document.getElementById('pfAvatar').textContent = initials(name);
    document.getElementById('pfName').textContent = name;
    document.getElementById('pfStatus').innerHTML =
        `<span class="dot ${data.status}"></span> ${data.statusText} · ${data.loc}`;

    document.getElementById('pfSchedule').innerHTML = renderWeek(data.week);

    const pling = document.getElementById('pfPling');
    const recsWrap = document.getElementById('pfRecsWrap');
    if (data.status === 'free') {
        pling.textContent = `Pling ${name.split(/[ .]/)[0]}`;
        pling.style.display = '';
        pling.onclick = () => doPling(name);
        if (recsWrap) recsWrap.style.display = '';
        renderRecs();
    } else {
        pling.style.display = 'none';
        if (recsWrap) recsWrap.style.display = 'none';
    }

    document.getElementById('profileScrim').classList.add('open');
    document.getElementById('profileSheet').classList.add('open');
}

function doPling(name) {
    const wrap = document.getElementById('pfRecsWrap');
    const input = document.getElementById('pfCustomInput');
    const isCustom = wrap?.classList.contains('input-mode');
    const activity = isCustom ? (input?.value.trim() || 'a hang') : (pfSelectedActivity || 'a hang');
    const first = name.split(/[ .]/)[0];
    alert(`Plinged ${first} for: ${activity}`);
}

function closeProfile() {
    const scrim = document.getElementById('profileScrim');
    const sheet = document.getElementById('profileSheet');
    if (scrim) scrim.classList.remove('open');
    if (sheet) sheet.classList.remove('open');
}

/* ---- Friend list sort (Home) ---- */
const STATUS_RANK = { free: 0, busy: 1, offline: 2 };

function statusOf(row) {
    const dot = row.querySelector('.f-dot');
    if (!dot) return 2;
    if (dot.classList.contains('free')) return 0;
    if (dot.classList.contains('busy')) return 1;
    return 2;
}
function nameOf(row) {
    const n = row.querySelector('.f-name');
    return n ? n.textContent.trim() : '';
}
/* minutes of remaining free time; non-free sort last */
function freeMins(row) {
    const t = row.querySelector('.f-timer');
    if (!t || t.classList.contains('away')) return 1e9;
    const txt = t.textContent;
    const h = txt.match(/(\d+)\s*h/);
    const m = txt.match(/(\d+)\s*m/);
    return (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0);
}

function sortFriends(mode) {
    const list = document.getElementById('friendList');
    if (!list) return;
    const rows = [...list.querySelectorAll('.friend')];
    rows.sort((a, b) => {
        if (mode === 'name')  return nameOf(a).localeCompare(nameOf(b));
        if (mode === 'time')  return freeMins(a) - freeMins(b) || nameOf(a).localeCompare(nameOf(b));
        /* availability (default) */
        return statusOf(a) - statusOf(b) || freeMins(a) - freeMins(b);
    });
    rows.forEach(r => list.appendChild(r));

    const label = { avail: 'Availability', name: 'Name', time: 'Time left' }[mode];
    const chipLabel = document.getElementById('sortChipLabel');
    if (chipLabel) chipLabel.textContent = label;
}

/* one-tap cycle: Availability -> Time left -> Name -> back */
const SORT_MODES = ['avail', 'time', 'name'];
let sortIdx = 0;
function cycleSort() {
    sortIdx = (sortIdx + 1) % SORT_MODES.length;
    sortFriends(SORT_MODES[sortIdx]);
}

/* Pre-build the profile sheet on page load so the FIRST openProfile call
   animates cleanly. Without this, the browser batches DOM insert + .open
   class change into one frame and skips the slide-up transition. */
function autoBuildProfileSheet() {
    if (document.querySelector('.screen')) buildSheet();
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoBuildProfileSheet);
} else {
    autoBuildProfileSheet();
}
