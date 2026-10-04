/* ================================================================
   Para Julieta — interacciones
   ================================================================ */
(() => {
'use strict';

// ── UTILIDADES ────────────────────────────────────────────────────
const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rand  = (a, b) => a + Math.random() * (b - a);
const pick  = arr => arr[Math.floor(Math.random() * arr.length)];
const pad   = n => String(n).padStart(2, '0');
const center = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer  = matchMedia('(hover: hover) and (pointer: fine)').matches;

const store = {
    get(k)    { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* sin storage */ } }
};

let locks = 0;
const lockScroll   = () => { if (locks++ === 0) document.documentElement.classList.add('no-scroll'); };
const unlockScroll = () => { if (locks > 0 && --locks === 0) document.documentElement.classList.remove('no-scroll'); };

const PINKS = ['#ff2e63', '#ff4d78', '#ff7a9a', '#ffb3c6', '#ffd6e0', '#e8001e'];
const GOLDS = ['#f5c842', '#ffe29a', '#fff1c4', '#ffffff'];
const HEART_D = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

// ── FOTOS ─────────────────────────────────────────────────────────
const PHOTOS = [
    ['Aniversario.jpeg',         'Aniversario 💕',               'Uno de nuestros momentos más importantes.'],
    ['Playa.jpg',                'En la playa 🏖️',               'Te llevo a todos lados aunque no estemos juntos.'],
    ['Cute.jpeg',                'Nosotros ? Lindos 🥰',         'Genética buena para Bauti, Benja y Rena.'],
    ['Modelo.jpeg',              'Mi modelo favorita ✨',         'Siempre tan hermosa.'],
    ['Ella.jpeg',                'Ella 💖',                      'La persona que más amo.'],
    ['Besito parlante.jpeg',     'Besito 😘',                    'Nunca me canso de ese besito.'],
    ['Mascara.jpeg',             'Hermosha 💄',                  'Te ponés cualquier cosa y seguís siendo hermosa.'],
    ['Sillon.jpeg',              'Momentos tranquis 🛋️',         'Los mejores planes son con vos.'],
    ['Fachas.jpeg',              'Intenso...❤️‍🔥',                'Por vos me saco el corazón y lo pongo en la mesa.'],
    ['lengua.jpeg',              'Jajaja 😜',                    'Sos lo más divertida.'],
    ['Ducha.jpeg',               'Duchas 🚿',                    'Por infinitas duchas más juntos.'],
    ['Siesta.jpg',               'La siesta 😴',                 'No hay momento en el cual te veas mal.'],
    ['bs as juntos.jpeg',        'Buenos Aires juntos 🌆',       'La ciudad nuestra, con vos es diferente.'],
    ['con nuestros hjitos.jpeg', 'Con nuestros hijitos 👨‍👩‍👧',    'La familia que vamos a armar.'],
    ['flia por siempre.jpeg',    'Familia por siempre 🤍',       'Para siempre, sin dudas.']
].map(([file, caption, desc]) => ({
    full:  encodeURI(`Fotos Julieta/${file}`),
    thumb: encodeURI(`Fotos Julieta/mini/${file.replace(/\.\w+$/, '')}.jpg`),
    caption,
    desc
}));

// ── FECHAS ────────────────────────────────────────────────────────
const START      = new Date(2026, 2, 2);  // 2 de Marzo 2026
const REAL_START = new Date(2023, 4, 6);  // 6 de Mayo 2023

// ── TOAST ─────────────────────────────────────────────────────────
const toastEl = $('#toast');
let toastTimer;
function toast(msg, ms = 3400) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
}

// ── EFECTOS (corazones, chispas, confeti) ─────────────────────────
const FX = (() => {
    const bg = $('#bg-canvas'), fx = $('#fx-canvas');
    const bctx = bg.getContext('2d'), fctx = fx.getContext('2d');
    const HEART = new Path2D(HEART_D);
    const MAX_FLOATERS = reduceMotion ? 0 : (finePointer ? 34 : 20);
    const stars = Array.from({ length: 150 }, () => ({
        x: Math.random(), y: Math.random(), r: rand(.35, 1.35), p: rand(0, 6.28), s: rand(.5, 1.7)
    }));
    let W = 0, H = 0, dpr = 1, floaters = [], parts = [], lastSpawn = 0, rainUntil = 0, last = performance.now();
    const pointer = { x: -9999, y: -9999 };

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth; H = window.innerHeight;
        for (const c of [bg, fx]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    }
    resize();
    window.addEventListener('resize', resize);

    function heart(ctx, x, y, size, rot, color, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(x, y);
        if (rot) ctx.rotate(rot);
        const s = size / 24;
        ctx.scale(s, s);
        ctx.translate(-12, -12);
        ctx.fillStyle = color;
        ctx.fill(HEART);
        ctx.restore();
    }

    function spawnFloater() {
        floaters.push({
            x: Math.random() * W, y: H + 30, size: rand(8, 22), vy: rand(.35, 1.05),
            sway: rand(.4, 1.2), ph: rand(0, 6.28), color: pick(PINKS), a: 0, max: rand(.22, .55), ox: 0, oy: 0, rot: rand(-.3, .3)
        });
    }

    function burst(x, y, o = {}) {
        const n = Math.round((o.count ?? 14) * (reduceMotion ? .35 : 1));
        const colors = o.colors ?? PINKS, power = o.power ?? 5, size = o.size ?? [8, 18];
        for (let i = 0; i < n; i++) {
            const ang = o.angle != null ? o.angle + rand(-(o.spread ?? .6), o.spread ?? .6) : rand(0, Math.PI * 2);
            const sp = rand(.35, 1) * power;
            const type = o.type ?? (Math.random() < .72 ? 'heart' : 'spark');
            // las chispas sueltas de una explosión de corazones son puntitos chicos
            const sz = type === 'spark' && !o.type ? rand(1.4, 3) : rand(size[0], size[1]);
            parts.push({
                type, x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - (o.lift ?? 1.4), g: o.gravity ?? .12,
                size: sz, rot: rand(-.5, .5), vr: rand(-.08, .08),
                color: pick(colors), life: 0, max: rand(50, 85)
            });
        }
    }

    function trail(x, y) {
        parts.push({
            type: 'spark', x, y, vx: rand(-.4, .4), vy: rand(-.6, .1), g: .01, size: rand(1.4, 3),
            rot: 0, vr: 0, color: pick(['#ffd6e0', '#ff7a9a', '#f5c842']), life: 0, max: rand(26, 42)
        });
    }

    function confetti(n = 160) {
        if (reduceMotion) n = 30;
        for (let i = 0; i < n; i++) {
            parts.push({
                type: 'conf', x: rand(0, W), y: rand(-H * .6, -10), vx: rand(-1, 1), vy: rand(2, 4.5), g: .04,
                size: rand(6, 11), rot: rand(0, 6.28), vr: rand(-.15, .15), wob: rand(0, 6.28),
                color: pick([...PINKS, ...GOLDS, '#c77dff']), life: 0, max: rand(200, 280)
            });
        }
    }

    function rain(ms = 3800) { rainUntil = performance.now() + (reduceMotion ? 600 : ms); }

    function frame(now) {
        const dt = Math.min(50, now - last); last = now;
        const k = dt / 16.667;
        bctx.setTransform(dpr, 0, 0, dpr, 0, 0); bctx.clearRect(0, 0, W, H);
        fctx.setTransform(dpr, 0, 0, dpr, 0, 0); fctx.clearRect(0, 0, W, H);

        // estrellas
        bctx.fillStyle = '#ffe9f0';
        const sy = window.scrollY;
        for (const s of stars) {
            bctx.globalAlpha = .18 + .5 * (.5 + .5 * Math.sin((reduceMotion ? 0 : now * .001 * s.s) + s.p));
            const y = ((s.y * H - sy * .03 * s.r) % H + H) % H;
            bctx.beginPath(); bctx.arc(s.x * W, y, s.r, 0, 6.283); bctx.fill();
        }
        bctx.globalAlpha = 1;

        // corazones flotantes
        if (floaters.length < MAX_FLOATERS && now - lastSpawn > 650) { spawnFloater(); lastSpawn = now; }
        for (const f of floaters) {
            f.y -= f.vy * k; f.ph += .012 * k;
            const tx = Math.sin(f.ph) * 18 * f.sway;
            const dx = f.x + tx + f.ox - pointer.x, dy = f.y + f.oy - pointer.y, d2 = dx * dx + dy * dy;
            if (d2 < 19600) {
                const d = Math.sqrt(d2) || 1, force = (140 - d) / 140;
                f.ox += dx / d * force * 4 * k; f.oy += dy / d * force * 3 * k;
            }
            f.ox *= Math.pow(.97, k); f.oy *= Math.pow(.97, k);
            f.a = Math.min(f.max, f.a + .008 * k);
            const fade = clamp((f.y + f.oy) / (H * .35), 0, 1);
            heart(bctx, f.x + tx + f.ox, f.y + f.oy, f.size, f.rot + Math.sin(f.ph) * .15, f.color, f.a * fade);
        }
        floaters = floaters.filter(f => f.y > -40);

        // lluvia de corazones
        if (now < rainUntil) {
            for (let i = 0; i < 3; i++) {
                parts.push({ type: 'heart', x: rand(0, W), y: -24, vx: rand(-.5, .5), vy: rand(2, 4), g: .015,
                    size: rand(12, 30), rot: rand(-.4, .4), vr: rand(-.03, .03), color: pick(PINKS), life: 0, max: 600 });
            }
        }

        // partículas
        for (let i = parts.length - 1; i >= 0; i--) {
            const p = parts[i];
            p.life += k;
            p.vy += p.g * k;
            p.vx *= Math.pow(.985, k);
            if (p.type === 'conf') { p.vy = Math.min(p.vy, 3.2); p.wob += .1 * k; p.x += Math.sin(p.wob) * .7 * k; }
            p.x += p.vx * k; p.y += p.vy * k; p.rot += p.vr * k;
            const t = p.life / p.max;
            if (t >= 1 || p.y > H + 40) { parts[i] = parts[parts.length - 1]; parts.pop(); continue; }
            const a = t < .08 ? t / .08 : 1 - Math.max(0, (t - .6) / .4);
            if (p.type === 'heart') {
                heart(fctx, p.x, p.y, p.size, p.rot, p.color, a);
            } else if (p.type === 'spark') {
                fctx.globalAlpha = a * .3; fctx.fillStyle = p.color;
                fctx.beginPath(); fctx.arc(p.x, p.y, p.size * 2.6, 0, 6.283); fctx.fill();
                fctx.globalAlpha = a;
                fctx.beginPath(); fctx.arc(p.x, p.y, p.size, 0, 6.283); fctx.fill();
            } else {
                fctx.save();
                fctx.globalAlpha = a; fctx.fillStyle = p.color;
                fctx.translate(p.x, p.y); fctx.rotate(p.rot);
                fctx.fillRect(-p.size / 2, -p.size / 4 * Math.abs(Math.cos(p.wob)), p.size, p.size / 2 * Math.abs(Math.cos(p.wob)) + .5);
                fctx.restore();
            }
        }
        fctx.globalAlpha = 1;
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    let trailTick = 0;
    window.addEventListener('pointermove', e => {
        pointer.x = e.clientX; pointer.y = e.clientY;
        if (finePointer && !reduceMotion && e.pointerType === 'mouse' && trailTick++ % 2 === 0) trail(e.clientX, e.clientY);
    }, { passive: true });
    window.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') { pointer.x = pointer.y = -9999; } }, { passive: true });
    document.addEventListener('mouseleave', () => { pointer.x = pointer.y = -9999; });

    return { burst, confetti, rain };
})();

// Un toque en cualquier lado suelta corazoncitos
document.addEventListener('click', e => {
    if (e.detail === 0) return; // clic de teclado
    if (e.target.closest('[data-fx="own"], .modal, #intro')) return;
    FX.burst(e.clientX, e.clientY, { count: 9, power: 4, size: [7, 14] });
});

// ── HERO ──────────────────────────────────────────────────────────
const Hero = (() => {
    const nameEl = $('#hero-name');
    const word = nameEl.textContent.trim();
    nameEl.textContent = '';
    [...word].forEach((ch, i) => {
        const outer = document.createElement('span');
        outer.className = 'ltr';
        outer.style.setProperty('--i', i);
        outer.setAttribute('aria-hidden', 'true');
        const inner = document.createElement('span');
        inner.className = 'ltr-in';
        inner.style.setProperty('--i', i);
        inner.textContent = ch;
        outer.appendChild(inner);
        nameEl.appendChild(outer);
        outer.addEventListener('animationend', e => {
            if (e.target !== outer) return;
            if (e.animationName === 'ltrIn') outer.classList.add('in');
            if (e.animationName === 'boing') outer.classList.remove('boing');
        });
        outer.addEventListener('pointerenter', () => {
            if (outer.classList.contains('in')) restart(outer, 'boing');
        });
    });

    // Parallax suave con el mouse
    if (finePointer && !reduceMotion) {
        const hero = $('.hero');
        let raf = 0, mx = 0, my = 0;
        window.addEventListener('pointermove', e => {
            mx = e.clientX / window.innerWidth * 2 - 1;
            my = e.clientY / window.innerHeight * 2 - 1;
            if (!raf) raf = requestAnimationFrame(() => {
                hero.style.setProperty('--mx', mx.toFixed(3));
                hero.style.setProperty('--my', my.toFixed(3));
                raf = 0;
            });
        }, { passive: true });
    }

    // Easter egg: tocar el ∞ tres veces
    let taps = 0, tapTimer;
    $('#inf-egg').addEventListener('click', e => {
        const [x, y] = center(e.currentTarget);
        FX.burst(x, y, { count: 8, colors: GOLDS.concat(PINKS), power: 4 });
        taps++;
        clearTimeout(tapTimer);
        tapTimer = setTimeout(() => { taps = 0; }, 900);
        if (taps >= 3) { taps = 0; FX.rain(); toast('infinito al infinito ∞'); }
    });

    function start() {
        const el = $('#typed');
        const LINES = ['Gracias por hacer que cada momento valga la pena.', 'No te vayas nunca.'];
        if (reduceMotion) { el.innerHTML = LINES.join('<br>'); el.parentElement.classList.add('typed-done'); return; }
        let li = 0, ci = 0;
        const step = () => {
            ci++;
            el.innerHTML = LINES.slice(0, li).map(l => l + '<br>').join('') + LINES[li].slice(0, ci);
            if (ci < LINES[li].length) setTimeout(step, 34 + Math.random() * 46);
            else if (++li < LINES.length) { ci = 0; setTimeout(step, 700); }
            else el.parentElement.classList.add('typed-done');
        };
        setTimeout(step, 1300);
    }

    return { start };
})();

// ── INTRO: mantener apretado el corazón ───────────────────────────
(() => {
    const intro = $('#intro'), hold = $('#hold'), fill = $('.hold-fill', hold), hint = $('#intro-hint');
    const CIRC = 2 * Math.PI * 54, HOLD_MS = 1200;
    let progress = 0, holding = false, done = false, raf = 0, last = 0;

    lockScroll();

    function tick(t) {
        const dt = last ? t - last : 16;
        last = t;
        progress = clamp(progress + (holding ? dt / HOLD_MS : -dt / 450), 0, 1);
        fill.style.strokeDashoffset = CIRC * (1 - progress);
        hold.style.setProperty('--p', progress.toFixed(3));
        if (progress >= 1) { raf = 0; enter(); return; }
        if (holding || progress > 0) raf = requestAnimationFrame(tick);
        else { raf = 0; last = 0; }
    }
    function run() { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } }

    function start(e) {
        if (done) return;
        if (e.cancelable) e.preventDefault();
        if (e.pointerId != null) { try { hold.setPointerCapture(e.pointerId); } catch { /* ok */ } }
        holding = true;
        hold.classList.add('holding');
        if (navigator.vibrate) { try { navigator.vibrate(10); } catch { /* ok */ } }
        run();
    }
    function stop() {
        if (!holding || done) return;
        holding = false;
        hold.classList.remove('holding');
        if (progress < .6) {
            hint.textContent = '¡un poquito más! mantenelo apretado 💕';
            restart(hint, 'nudge');
        }
        run();
    }

    hold.addEventListener('pointerdown', start);
    hold.addEventListener('pointerup', stop);
    hold.addEventListener('pointercancel', stop);
    hold.addEventListener('lostpointercapture', stop);
    hold.addEventListener('contextmenu', e => e.preventDefault());
    hold.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) start(e); });
    hold.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') stop(); });
    hold.addEventListener('click', e => e.preventDefault());

    function enter() {
        done = true; holding = false;
        hold.classList.remove('holding');
        const [x, y] = center(hold);
        FX.burst(x, y, { count: 70, power: 10, size: [10, 28], lift: 2 });
        FX.burst(x, y, { count: 24, colors: GOLDS, type: 'spark', power: 8, size: [1.5, 3.5] });
        if (navigator.vibrate) { try { navigator.vibrate([20, 40, 30]); } catch { /* ok */ } }
        intro.classList.add('leaving');
        unlockScroll();
        document.body.classList.add('ready');
        Hero.start();
        setTimeout(() => intro.remove(), 1300);
    }
})();

// ── CONTADOR ──────────────────────────────────────────────────────
(() => {
    const sec = $('#contador');
    const odos = Object.fromEntries($$('.odo', sec).map(el => [el.dataset.unit, el]));
    const ringFill = $('#ring-fill'), RC = 2 * Math.PI * 52;
    let real = false;

    function build(el, len) {
        el.dataset.len = len;
        el.innerHTML = Array.from({ length: len }, () =>
            '<span class="odo-cell"><span class="odo-strip">' +
            '01234567890'.split('').map(d => `<span>${d}</span>`).join('') +
            '</span></span>').join('');
    }
    function roll(el, str) {
        [...str].forEach((ch, i) => {
            const strip = el.children[i].firstElementChild, d = +ch;
            if (strip._d === d) return;
            if (strip._pos === 10) {
                strip.style.transition = 'none';
                strip.style.transform = 'translateY(0)';
                void strip.offsetHeight;
                strip.style.transition = '';
            }
            const pos = strip._d === 9 && d === 0 ? 10 : d;
            strip.style.transform = `translateY(${-pos * 100 / 11}%)`;
            strip._d = d; strip._pos = pos;
        });
    }
    function setOdo(el, str) {
        if (el.dataset.len !== String(str.length)) {
            build(el, str.length);
            requestAnimationFrame(() => requestAnimationFrame(() => roll(el, str)));
        } else roll(el, str);
    }
    // 9 → 0 sigue rodando hacia adelante y vuelve al inicio sin que se note
    sec.addEventListener('transitionend', e => {
        const s = e.target;
        if (s.classList?.contains('odo-strip') && s._pos === 10) {
            s.style.transition = 'none';
            s.style.transform = 'translateY(0)';
            s._pos = 0;
            void s.offsetHeight;
            s.style.transition = '';
        }
    });

    const addMonths = (d, n) => { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; };
    function monthsBetween(a, b) {
        let m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
        if (addMonths(a, m) > b) m--;
        return Math.max(0, m);
    }

    function tick() {
        const now = new Date(), from = real ? REAL_START : START;
        const diff = Math.max(0, now - from);
        const days = Math.floor(diff / 864e5);
        const h = Math.floor(diff % 864e5 / 36e5), m = Math.floor(diff % 36e5 / 6e4), s = Math.floor(diff % 6e4 / 1e3);
        setOdo(odos.days, String(days));
        setOdo(odos.hours, pad(h));
        setOdo(odos.minutes, pad(m));
        setOdo(odos.seconds, pad(s));
        $('#cnt-sr').textContent = `${days} días, ${h} horas y ${m} minutos`;

        const months = monthsBetween(from, now);
        $('#st-months').textContent = months.toLocaleString('es');
        $('#st-weeks').textContent = Math.floor(days / 7).toLocaleString('es');
        $('#st-beats').textContent = Math.floor(diff / 1000 * 1.25).toLocaleString('es');

        // Próximo mesiversario (o aniversario, en modo "real")
        const step = real ? 12 : 1;
        const n = Math.floor(months / step) + 1;
        const prev = addMonths(from, (n - 1) * step), next = addMonths(from, n * step);
        const pct = clamp((now - prev) / (next - prev), 0, 1);
        ringFill.style.strokeDashoffset = RC * (1 - pct);
        const isToday = n > 1 && now.toDateString() === prev.toDateString();
        const unit = real ? 'años' : 'meses', unitOne = real ? 'año' : 'mes';
        if (isToday) {
            $('#ring-num').textContent = '🎉';
            $('#ring-unit').textContent = 'hoy';
            $('#ring-pre').textContent = '¡hoy cumplimos!';
            $('#ring-text').textContent = `${n - 1} ${n - 1 === 1 ? unitOne : unit} 💕`;
        } else {
            const left = Math.ceil((next - now) / 864e5);
            $('#ring-num').textContent = left;
            $('#ring-unit').textContent = left === 1 ? 'día' : 'días';
            $('#ring-pre').textContent = left === 1 ? 'falta' : 'faltan';
            $('#ring-text').textContent = n === 1
                ? (real ? 'para el primer año ✨' : 'para nuestro primer mes ✨')
                : `para ${real ? 'los' : 'nuestros'} ${n} ${unit} ✨`;
        }
    }
    tick();
    setInterval(tick, 1000);

    const TEXT = {
        normal: { eyebrow: '❤ el contador ❤',     title: 'Llevamos <em>juntos</em>',               sub: '📅 desde el 2 de Marzo, 2026', btn: 'Pero... ¿solo eso? 👀' },
        real:   { eyebrow: '❤ la verdad es... ❤', title: 'lo nuestro viene <em>de mucho antes</em>', sub: '📅 desde el 6 de Mayo, 2023',  btn: 'Ok, ok… volvamos al 2 de Marzo ❤' }
    };
    const btn = $('#secret-btn'), head = $('#cnt-head');
    btn.addEventListener('click', () => {
        real = !real;
        const t = TEXT[real ? 'real' : 'normal'];
        sec.classList.toggle('real', real);
        $('#cnt-eyebrow').textContent = t.eyebrow;
        $('#cnt-title').innerHTML = t.title;
        $('#cnt-sub').textContent = t.sub;
        btn.textContent = t.btn;
        restart(head, 'swap');
        const [x, y] = center(btn);
        FX.burst(x, y, { count: real ? 26 : 12, colors: real ? GOLDS.concat(PINKS) : PINKS, power: 7 });
        tick();
    });
})();

// ── LIGHTBOX ──────────────────────────────────────────────────────
const Lightbox = (() => {
    const box = $('#lightbox'), img = $('#lb-img');
    let list = [], pos = 0, opener = null, token = 0;

    function render(dir = 0) {
        const p = PHOTOS[list[pos]], my = ++token;
        img.style.setProperty('--dir', dir);
        restart(img, 'anim');
        img.src = p.thumb;
        img.alt = p.caption;
        const full = new Image();
        full.onload = () => { if (my === token) img.src = p.full; };
        full.src = p.full;
        $('#lb-title').textContent = p.caption;
        $('#lb-desc').textContent = p.desc;
        $('#lb-count').textContent = `${pos + 1} / ${list.length}`;
        box.classList.toggle('single', list.length < 2);
    }
    function open(i) {
        list = PHOTOS.map((_, k) => k).filter(k => Gallery.isFlipped(k));
        pos = Math.max(0, list.indexOf(i));
        opener = document.activeElement;
        render();
        box.classList.add('open');
        box.setAttribute('aria-hidden', 'false');
        lockScroll();
        $('#lb-close').focus({ preventScroll: true });
    }
    function close() {
        if (!isOpen()) return;
        box.classList.remove('open');
        box.setAttribute('aria-hidden', 'true');
        unlockScroll();
        opener?.focus?.({ preventScroll: true });
    }
    function go(d) {
        if (list.length < 2) return;
        pos = (pos + d + list.length) % list.length;
        render(d);
    }
    const isOpen = () => box.classList.contains('open');

    $('#lb-close').addEventListener('click', close);
    $('#lb-prev').addEventListener('click', () => go(-1));
    $('#lb-next').addEventListener('click', () => go(1));
    box.addEventListener('click', e => { if (e.target === box) close(); });

    // Deslizar para cambiar de foto / hacia abajo para cerrar
    const fig = $('.lb-figure', box);
    let sx = null, sy = 0;
    fig.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; });
    fig.addEventListener('pointerup', e => {
        if (sx == null) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        sx = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
        else if (dy > 90) close();
    });
    fig.addEventListener('pointercancel', () => { sx = null; });

    return { open, close, go, isOpen };
})();

// ── RECUERDO PREMIUM (raspadita) ──────────────────────────────────
const Premium = (() => {
    const btn = $('#premium-btn'), modal = $('#premium'), frame = $('.premium-frame', modal);
    const img = $('#premium-img'), cvs = $('#scratch'), cap = $('#premium-caption');
    const ctx = cvs.getContext('2d', { willReadFrequently: true });
    let unlocked = false, revealed = false, ready = false, opener = null;

    btn.addEventListener('click', () => {
        if (!unlocked) {
            restart(btn, 'shake');
            toast(`Revelá todos los recuerdos primero (${Gallery.count()}/${PHOTOS.length})`);
            return;
        }
        open();
    });

    function unlock() {
        unlocked = true;
        btn.classList.remove('locked');
        btn.textContent = '⭐ Recuerdo Premium';
        if (!img.src) img.src = img.dataset.src;
    }

    function open() {
        if (!img.src) img.src = img.dataset.src;
        opener = document.activeElement;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        lockScroll();
        if (!ready) requestAnimationFrame(setup);
        $('#premium-close').focus({ preventScroll: true });
    }
    function close() {
        if (!isOpen()) return;
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        unlockScroll();
        opener?.focus?.({ preventScroll: true });
    }
    const isOpen = () => modal.classList.contains('open');

    function setup() {
        const w = frame.offsetWidth, h = frame.offsetHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
        cvs.width = Math.round(w * dpr); cvs.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, '#b8862b'); g.addColorStop(.28, '#f5d77a'); g.addColorStop(.5, '#fff1c4');
        g.addColorStop(.72, '#e9b949'); g.addColorStop(1, '#a8741f');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 90; i++) {
            ctx.globalAlpha = rand(.25, .8);
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(rand(0, w), rand(0, h), rand(.3, 1.8), 0, 6.283); ctx.fill();
        }
        ctx.globalAlpha = .55;
        ctx.save();
        const s = w / 5 / 24;
        ctx.translate(w / 2 - 12 * s, h / 2 - 12 * s - w / 9);
        ctx.scale(s, s);
        ctx.fillStyle = '#a3123f';
        ctx.fill(new Path2D(HEART_D));
        ctx.restore();
        ctx.globalAlpha = .75;
        ctx.fillStyle = '#5a3500';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `800 ${Math.round(w / 12)}px Nunito, sans-serif`;
        ctx.fillText('rascá acá', w / 2, h / 2 + w / 9);
        ctx.font = `700 ${Math.round(w / 15)}px Caveat, cursive`;
        ctx.fillText('✦ con el dedo ✦', w / 2, h / 2 + w / 9 + w / 9);
        ctx.globalAlpha = 1;
        ready = true;
    }

    let drawing = false, lx = 0, ly = 0, moves = 0;
    const local = e => {
        const r = cvs.getBoundingClientRect(), sx = cvs.offsetWidth / r.width, sy = cvs.offsetHeight / r.height;
        return [(e.clientX - r.left) * sx, (e.clientY - r.top) * sy];
    };
    function scratch(e) {
        const [x, y] = local(e);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = Math.max(40, cvs.offsetWidth / 7);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(x + .01, y);
        ctx.stroke();
        lx = x; ly = y;
        if (Math.random() < .35) FX.burst(e.clientX, e.clientY, { count: 2, type: 'spark', colors: GOLDS, power: 2.5, size: [1.5, 3] });
        if (++moves % 14 === 0) check();
    }
    cvs.addEventListener('pointerdown', e => {
        if (revealed) return;
        drawing = true;
        try { cvs.setPointerCapture(e.pointerId); } catch { /* ok */ }
        [lx, ly] = local(e);
        scratch(e);
    });
    cvs.addEventListener('pointermove', e => { if (drawing) scratch(e); });
    const end = () => { if (drawing) { drawing = false; check(); } };
    cvs.addEventListener('pointerup', end);
    cvs.addEventListener('pointercancel', end);

    function check() {
        if (revealed) return;
        const data = ctx.getImageData(0, 0, cvs.width, cvs.height).data;
        let clear = 0, total = 0;
        for (let i = 3; i < data.length; i += 4 * 23) { total++; if (data[i] < 40) clear++; }
        if (clear / total > .48) reveal();
    }
    function reveal() {
        revealed = true;
        cvs.classList.add('gone');
        cap.textContent = 'Nuestra primera foto juntos';
        cap.classList.add('revealed');
        const [x, y] = center(frame);
        FX.burst(x, y, { count: 50, colors: GOLDS.concat(PINKS), power: 10 });
        FX.confetti(120);
    }

    $('#premium-close').addEventListener('click', close);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });

    return { unlock, close, isOpen };
})();

// ── RECUERDOS (polaroids) ─────────────────────────────────────────
const Gallery = (() => {
    const grid = $('#gallery'), total = PHOTOS.length;
    const TILT = [-4, 3, -2, 4, -3, 2, -5, 3, -1, 4, -3, 2, -4, 3, -2];
    let flipped = 0;

    const pols = PHOTOS.map((p, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'pol';
        b.dataset.fx = 'own';
        b.style.setProperty('--r0', `${TILT[i % TILT.length]}deg`);
        b.style.setProperty('--i', i);
        b.setAttribute('aria-label', `Recuerdo ${i + 1} de ${total}: tocá para revelarlo`);
        b.innerHTML = `
            <span class="pol-inner">
                <span class="pol-face pol-front">
                    <span class="pol-tape"></span>
                    <span class="pol-stamp"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-heart"/></svg></span>
                    <span class="pol-no">N° ${pad(i + 1)}</span>
                    <span class="pol-hint">tocá para revelar</span>
                </span>
                <span class="pol-face pol-back">
                    <span class="pol-tape"></span>
                    <span class="pol-photo"><img src="${p.thumb}" alt="${p.caption}" loading="lazy" decoding="async"></span>
                    <span class="pol-cap">${p.caption}</span>
                </span>
            </span>`;

        b.addEventListener('click', () => {
            if (!b.classList.contains('flipped')) {
                b.classList.add('flipped');
                flipped++;
                const [x, y] = center(b);
                FX.burst(x, y, { count: 16, power: 6 });
                b.setAttribute('aria-label', `${p.caption}: tocá para ampliar`);
                update();
            } else {
                Lightbox.open(i);
            }
        });

        if (finePointer && !reduceMotion) {
            b.addEventListener('pointermove', e => {
                const r = b.getBoundingClientRect();
                b.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - .5) * 16}deg`);
                b.style.setProperty('--rx', `${-((e.clientY - r.top) / r.height - .5) * 16}deg`);
            });
            b.addEventListener('pointerleave', () => {
                b.style.setProperty('--ry', '0deg');
                b.style.setProperty('--rx', '0deg');
            });
        }

        grid.appendChild(b);
        return b;
    });

    function update() {
        $('#mem-bar-fill').style.width = `${flipped / total * 100}%`;
        $('#mem-count').textContent = `${flipped} / ${total}`;
        const txt = $('#mem-text');
        if (flipped === total) {
            txt.textContent = '¡Todos desbloqueados! Tocá las fotos para verlas más grandes 💕';
            txt.classList.add('gold');
            Premium.unlock();
            FX.confetti();
            toast('¡Todos los recuerdos desbloqueados! Ahora abrí el recuerdo premium ⭐', 4200);
        } else {
            txt.textContent = `${flipped} de ${total} revelados · tocá una foto revelada para ampliarla`;
        }
    }

    new IntersectionObserver((entries, io) => {
        if (entries.some(e => e.isIntersecting)) { grid.classList.add('in'); io.disconnect(); }
    }, { rootMargin: '0px 0px -10% 0px' }).observe(grid);

    return {
        isFlipped: i => pols[i].classList.contains('flipped'),
        count: () => flipped
    };
})();

// ── CARTA ─────────────────────────────────────────────────────────
(() => {
    const stage = $('#env-stage'), env = $('#envelope'), seal = $('#env-seal');
    const letter = $('#letter'), sub = $('#carta-sub');
    $$('.letter-body p, .letter-footer', letter).forEach((p, i) => p.style.setProperty('--i', i));

    seal.addEventListener('click', () => {
        if (env.classList.contains('open')) return;
        const [x, y] = center(seal);
        FX.burst(x, y, { count: 26, colors: ['#e8001e', '#ff2e63', ...GOLDS], power: 7 });
        env.classList.add('open');
        sub.textContent = 'para vos, con todo mi amor';
        setTimeout(() => stage.classList.add('done'), 1500);
        setTimeout(() => {
            stage.hidden = true;
            letter.hidden = false;
            requestAnimationFrame(() => requestAnimationFrame(() => letter.classList.add('show')));
            letter.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        }, 2100);
    });

    $('#letter-close').addEventListener('click', () => {
        letter.classList.remove('show');
        setTimeout(() => {
            letter.hidden = true;
            stage.hidden = false;
            stage.classList.remove('done');
            env.classList.remove('open');
            sub.textContent = 'tocá el sello para abrirla';
            $('#carta').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        }, 500);
    });
})();

// ── 10 RAZONES (mazo para deslizar) ───────────────────────────────
(() => {
    const deck = $('#deck'), cards = $$('.r-card', deck), N = cards.length - 1;
    const countEl = $('#deck-count'), prevBtn = $('#deck-prev'), nextBtn = $('#deck-next');
    const out = [];
    let idx = 0, drag = null;

    function layout() {
        cards.forEach((c, i) => {
            c.classList.toggle('top', i === idx);
            if (i < idx) {
                const d = out[i] || 1;
                c.style.transform = `translate3d(${d * (window.innerWidth * .6 + 280)}px, -40px, 0) rotate(${d * 28}deg)`;
                c.style.opacity = '0';
                c.style.zIndex = 50 + i;
                c.setAttribute('aria-hidden', 'true');
                return;
            }
            const k = i - idx;
            c.style.transform = `translate3d(0, ${k * 14}px, 0) scale(${1 - k * .05}) rotate(${k === 0 ? 0 : (k % 2 ? 2.5 : -2.5)}deg)`;
            c.style.opacity = k > 3 ? '0' : '1';
            c.style.zIndex = 40 - k;
            c.setAttribute('aria-hidden', k === 0 ? 'false' : 'true');
        });
        countEl.textContent = idx < N ? `${idx + 1} / ${N}` : '∞';
        prevBtn.disabled = idx === 0;
        nextBtn.disabled = idx >= N;
    }

    function fling(dir) {
        if (idx >= N) return;
        const [x, y] = center(cards[idx]);
        out[idx] = dir;
        idx++;
        layout();
        FX.burst(x + dir * 60, y, { count: 12, power: 6, angle: dir > 0 ? 0 : Math.PI, spread: .9 });
        if (idx === N) {
            setTimeout(() => {
                const [fx, fy] = center(cards[N]);
                FX.burst(fx, fy, { count: 34, colors: GOLDS.concat(PINKS), power: 9 });
            }, 380);
        }
    }
    function back() { if (idx > 0) { idx--; layout(); } }

    deck.addEventListener('pointerdown', e => {
        const c = e.target.closest('.r-card');
        if (!c || cards.indexOf(c) !== idx || idx >= N) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        drag = { c, id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, vx: 0, px: e.clientX, pt: performance.now() };
        try { c.setPointerCapture(e.pointerId); } catch { /* ok */ }
        c.classList.add('dragging');
        c.classList.remove('hint');
    });
    deck.addEventListener('pointermove', e => {
        if (!drag || e.pointerId !== drag.id) return;
        const now = performance.now();
        drag.dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        drag.vx = drag.vx * .6 + ((e.clientX - drag.px) / Math.max(1, now - drag.pt)) * .4;
        drag.px = e.clientX; drag.pt = now;
        drag.c.style.transform = `translate3d(${drag.dx}px, ${dy * .25}px, 0) rotate(${drag.dx * .06}deg)`;
        drag.c.style.setProperty('--like', clamp(Math.abs(drag.dx) / 120, 0, 1).toFixed(2));
    });
    const release = e => {
        if (!drag || e.pointerId !== drag.id) return;
        const { c, dx, vx } = drag;
        drag = null;
        c.classList.remove('dragging');
        c.style.setProperty('--like', 0);
        if (Math.abs(dx) > deck.offsetWidth * .3 || (Math.abs(vx) > .55 && Math.abs(dx) > 30)) fling(Math.sign(dx) || 1);
        else layout();
    };
    deck.addEventListener('pointerup', release);
    deck.addEventListener('pointercancel', release);
    deck.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') { e.preventDefault(); fling(1); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); back(); }
    });

    prevBtn.addEventListener('click', back);
    nextBtn.addEventListener('click', () => fling(1));
    $('#deck-reset').addEventListener('click', () => { idx = 0; out.length = 0; layout(); });

    layout();

    // Una sacudidita para que se note que se puede deslizar
    new IntersectionObserver((entries, io) => {
        if (entries.some(e => e.isIntersecting) && !reduceMotion) {
            setTimeout(() => { if (idx === 0 && !drag) cards[0].classList.add('hint'); }, 500);
            io.disconnect();
        }
    }, { threshold: .6 }).observe(deck);
    cards[0].addEventListener('animationend', () => cards[0].classList.remove('hint'));
})();

// ── PLANES ────────────────────────────────────────────────────────
(() => {
    const items = $$('.plan-item'), total = items.length;
    const heart = $('.plans-heart'), liquid = $('#ph-liquid');
    let seen = false;

    function update(celebrate) {
        const done = items.filter(i => i.classList.contains('checked')).length, pct = done / total;
        $('#planes-progress-num').textContent = done;
        $('#planes-pct').textContent = `${Math.round(pct * 100)}%`;
        if (seen) liquid.style.transform = `translateY(${22 - pct * 20.5}px)`;
        if (celebrate && done === total) {
            toast('¡Cumplimos todos nuestros planes! Te amo infinito 💕', 4200);
            FX.confetti();
        }
    }

    items.forEach(item => {
        const cb = $('input', item);
        if (store.get('plan_' + item.dataset.plan) === 'true') {
            cb.checked = true;
            item.classList.add('checked');
        }
        cb.addEventListener('change', () => {
            item.classList.toggle('checked', cb.checked);
            store.set('plan_' + item.dataset.plan, cb.checked);
            if (cb.checked) {
                const [x, y] = center($('.plan-check', item));
                FX.burst(x, y, { count: 18, colors: GOLDS.concat(PINKS), power: 6 });
                toast('¡Un plan más cerca de cumplirse! 💕');
            }
            update(cb.checked);
        });
    });
    update(false);

    // El corazón se llena recién cuando se ve
    new IntersectionObserver((entries, io) => {
        if (entries.some(e => e.isIntersecting)) { seen = true; update(false); io.disconnect(); }
    }, { threshold: .4 }).observe(heart);
})();

// ── CANCIONES ─────────────────────────────────────────────────────
(() => {
    const songs = $$('.song');

    function stop(s) {
        if (!s.classList.contains('playing')) return;
        s.classList.remove('playing');
        $('.player-box', s).innerHTML = '';
        $('.song-art', s).setAttribute('aria-label', `Reproducir ${$('h3', s).textContent}`);
    }
    function play(s) {
        songs.forEach(o => { if (o !== s) stop(o); });
        const id = s.dataset.video, title = $('h3', s).textContent;
        const frame = document.createElement('iframe');
        frame.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
        frame.title = title;
        frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        frame.allowFullscreen = true;
        $('.player-box', s).appendChild(frame);
        s.classList.add('playing');
        $('.song-art', s).setAttribute('aria-label', `Pausar ${title}`);
        const [x, y] = center($('.song-art', s));
        FX.burst(x, y, { count: 14, power: 5 });
    }

    songs.forEach(s => {
        s.style.setProperty('--art', `url("https://img.youtube.com/vi/${s.dataset.video}/mqdefault.jpg")`);
        $('.song-art', s).addEventListener('click', () => (s.classList.contains('playing') ? stop(s) : play(s)));
    });
})();

// ── BESITOS ───────────────────────────────────────────────────────
(() => {
    const btn = $('#kiss-btn'), countEl = $('#kiss-count');
    let n = parseInt(store.get('besitos') || '0', 10) || 0;
    const MILESTONES = {
        10:  '¡10 besitos! Te los devuelvo todos en persona 😘',
        50:  '50 besitos… estás muy cariñosa hoy 🥰',
        100: '¡100 besitos! Sos la mejor, gorda 💕',
        500: '500… esto ya es amor infinito al infinito ∞'
    };
    const render = () => {
        countEl.textContent = n
            ? `${n.toLocaleString('es')} ${n === 1 ? 'besito enviado' : 'besitos enviados'} 💋`
            : 'tocá el corazón 💋';
    };
    render();

    btn.addEventListener('click', () => {
        n++;
        store.set('besitos', n);
        render();
        restart(btn, 'squish');
        const [x, y] = center(btn);
        const k = document.createElement('span');
        k.className = 'kiss-fly';
        k.textContent = pick(['😘', '💋', '💕', '💗', '😚']);
        k.style.left = `${x + rand(-30, 30)}px`;
        k.style.top = `${y - 20}px`;
        k.style.setProperty('--dx', `${rand(-90, 90)}px`);
        k.style.setProperty('--rot', `${rand(-40, 40)}deg`);
        document.body.appendChild(k);
        k.addEventListener('animationend', () => k.remove());
        FX.burst(x, y, { count: 8, power: 5 });
        if (MILESTONES[n]) toast(MILESTONES[n]);
    });
    btn.addEventListener('animationend', e => { if (e.animationName === 'squish') btn.classList.remove('squish'); });
})();

// ── NAVEGACIÓN, PROGRESO Y APARICIONES ────────────────────────────
(() => {
    const links = $$('#dock a'), pill = $('#dock-pill');
    const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    let current;

    function setActive(id) {
        const a = byId.get(id) || null;
        if (a === current) return;
        current = a;
        links.forEach(l => {
            l.classList.toggle('active', l === a);
            if (l === a) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
        });
        if (a) { pill.style.transform = `translateX(${a.offsetLeft}px)`; pill.style.opacity = '1'; }
        else pill.style.opacity = '0';
    }
    const navIO = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-50% 0px -50% 0px' });
    $$('main > section, main > footer').forEach(s => navIO.observe(s));
    window.addEventListener('resize', () => { if (current) pill.style.transform = `translateX(${current.offsetLeft}px)`; });

    const bar = $('#progress');
    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
            ticking = false;
        });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const revealIO = new IntersectionObserver((entries, io) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(el => revealIO.observe(el));
})();

// ── TECLADO + SECRETO ─────────────────────────────────────────────
let typedBuf = '';
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { Lightbox.close(); Premium.close(); return; }
    if (Lightbox.isOpen()) {
        if (e.key === 'ArrowRight') Lightbox.go(1);
        if (e.key === 'ArrowLeft')  Lightbox.go(-1);
        return;
    }
    if (e.key.length === 1) {
        typedBuf = (typedBuf + e.key.toLowerCase()).replace(/\s/g, '').slice(-10);
        if (typedBuf.endsWith('teamo')) {
            typedBuf = '';
            FX.rain();
            toast('yo te amo más 💕 infinito al infinito');
        }
    }
});

})();
