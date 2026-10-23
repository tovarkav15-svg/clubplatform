(() => {
  const TG = 'fedonko';
  const SITE = 'https://tovarkav15-svg.github.io/fclub/';
  const page = document.body.dataset.page;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- хранилище (только удобства в этом браузере) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('fpc-' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('fpc-' + k, JSON.stringify(v)); } catch (e) {} },
  };
  const doneSet = () => new Set(store.get('done', []));
  /* ---------- доступ по коду ---------- */
  const API = 'https://fpc-api.tovarkav15.workers.dev';
  const BOT = 'prodrclubot';
  const sess = store.get('session', null);
  const isOwner = !!(sess && sess.role === 'owner');
  const device = (() => { let d = store.get('device', ''); if (!d) { d = [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join(''); store.set('device', d); } return d; })();
  const call = (path, opt = {}) => fetch(API + path, { ...opt, headers: { 'content-type': 'application/json', ...(sess ? { authorization: `Bearer ${sess.token}` } : {}), ...(opt.headers || {}) } })
    .then(async (r) => { const j = await r.json().catch(() => ({})); if (r.status === 401 && sess) { store.set('session', null); location.reload(); } if (!r.ok) throw new Error(j.error || 'Ошибка сервера'); return j; });
  window.FPC = { call, sess, isOwner, store };
  const toggleDone = (key) => { const s = doneSet(); s.has(key) ? s.delete(key) : s.add(key); store.set('done', [...s]); return s.has(key); };

  /* ---------- уведомления и окно подтверждения ---------- */
  const toast = (msg) => {
    let el = document.querySelector('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2600);
  };
  const confirmBox = ({ title, html, ok = 'Продолжить', cancel = 'Отмена' }) => new Promise((res) => {
    const m = document.createElement('div');
    m.className = 'modal';
    m.innerHTML = `<div class="mbox" role="dialog" aria-modal="true" aria-labelledby="mtitle"><span class="mic" aria-hidden="true">!</span><h3 id="mtitle">${title}</h3><div class="mtx">${html}</div><div class="mact"><button class="btn" data-r="1" type="button">${ok}</button><button class="btn ghost" data-r="0" type="button">${cancel}</button></div></div>`;
    const key = (e) => { if (e.key === 'Escape') done(false); };
    const done = (v) => { m.classList.remove('on'); setTimeout(() => m.remove(), 350); document.removeEventListener('keydown', key); res(v); };
    m.addEventListener('click', (e) => { const b = e.target.closest('[data-r]'); if (b) done(b.dataset.r === '1'); else if (e.target === m) done(false); });
    document.addEventListener('keydown', key);
    document.body.appendChild(m);
    requestAnimationFrame(() => m.classList.add('on'));
    m.querySelector('[data-r="1"]').focus();
  });

  /* ---------- избранное (хранится на сервере, копия — в браузере) ---------- */
  const favs = {
    list: store.get('favs', []),
    has(k) { return this.list.includes(k); },
    set(l) { this.list = Array.isArray(l) ? l : []; store.set('favs', this.list); },
    async sync() { if (sess) { try { this.set(await call('/api/favs')); } catch (e) {} } return this.list; },
    async toggle(k) {
      const on = !this.has(k), before = this.list;
      this.set(on ? [k, ...before.filter((x) => x !== k)] : before.filter((x) => x !== k));
      try { this.set(await call('/api/favs', { method: 'POST', body: JSON.stringify({ key: k, on }) })); toast(on ? 'Добавлено в избранное' : 'Убрано из избранного'); }
      catch (e) { this.set(before); toast('Не получилось сохранить — проверь интернет'); }
      return this.has(k);
    },
  };
  const favBtn = (k, cls = 'sfav') => `<button class="${cls} ${favs.has(k) ? 'is' : ''}" type="button" data-fav="${k}" aria-pressed="${favs.has(k)}" title="${favs.has(k) ? 'Убрать из избранного' : 'В избранное'}" aria-label="Избранное">${icon('bm')}</button>`;
  const paintFavs = (root = document) => $$('[data-fav]', root).forEach((b) => { const on = favs.has(b.dataset.fav); b.classList.toggle('is', on); b.setAttribute('aria-pressed', on); b.title = on ? 'Убрать из избранного' : 'В избранное'; });
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-fav]');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    b.classList.toggle('is', !favs.has(b.dataset.fav));
    await favs.toggle(b.dataset.fav);
    paintFavs();
    document.dispatchEvent(new CustomEvent('favs'));
  });
  const favList = (T, box) => {
    if (!box) return;
    const items = favs.list.map((k) => { const [ti, si] = k.split(':'); const t = T.find((x) => x.id === ti), s = t && t.steps.find((x) => x.id === si); return t && s ? { t, s, k } : null; }).filter(Boolean);
    box.hidden = !items.length;
    box.innerHTML = items.length ? `<div class="sec-t"><h2>Избранное</h2><span class="mono">${items.length} ${plural(items.length, 'шаг', 'шага', 'шагов')}</span></div>
      <div class="favs">${items.map(({ t, s, k }) => `<div class="card favi"><a href="${stepUrl(t, s)}"><span class="mono">${esc(t.title)} · ${esc(s.num)}</span><b>${esc(s.title)}</b><small class="mono">${s.video ? '▶ видео' : 'видео скоро'}</small></a>${favBtn(k)}</div>`).join('')}</div>` : '';
  };

  /* ---------- общие элементы ---------- */
  const STAR = ['....#....', '....#....', '...###...', '#########', '.###.###.', '..#####..', '..##.##..', '.##...##.', '.#.....#.'];
  const starRects = () => STAR.flatMap((r, y) => [...r].map((c, x) => (c === '#' ? `<rect x="${x}" y="${y}" width="1.02" height="1.02"/>` : ''))).join('');
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    news: '<path d="M4 5h13v14a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2zM17 9h3v10a2 2 0 0 1-2 2M8 9h5M8 13h5M8 17h3"/>',
    guides: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5zM4 19.5A1.5 1.5 0 0 0 5.5 21H20M9 8h6"/>',
    support: '<path d="M4 5h16v11H9l-5 4zM9 9.5h6M9 12.5h4"/>',
    bm: '<path d="M6.5 3.5h11v17l-5.5-4-5.5 4z"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',
    arrow: '<path d="M7 17 17 7M9 7h8v8"/>',
  };
  const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;
  const NAV = [['index.html', 'home', 'Главная'], ['news.html', 'news', 'Новости'], ['guides.html', 'guides', 'Обучение'], ['support.html', 'support', 'Поддержка']];
  const MENU = isOwner ? [...NAV, ['admin.html', 'edit', 'Кабинет']] : NAV;
  const cur = { index: 'index.html', news: 'news.html', guides: 'guides.html', track: 'guides.html', guide: 'guides.html', support: 'support.html', admin: 'admin.html' }[page];

  document.body.insertAdjacentHTML('afterbegin', `
  <svg style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false"><defs>
    <linearGradient id="chrome" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".22" stop-color="#c9ccd1"/><stop offset=".42" stop-color="#6b7078"/><stop offset=".55" stop-color="#f2f3f5"/><stop offset=".75" stop-color="#9aa0a8"/><stop offset="1" stop-color="#2d3036"/><animateTransform attributeName="gradientTransform" type="rotate" from="0 .5 .5" to="360 .5 .5" dur="6s" repeatCount="indefinite"/></linearGradient>
    <linearGradient id="chromeEdge" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#2d3036"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#55595f"/></linearGradient>
    <radialGradient id="glint" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <symbol id="cs8" viewBox="0 0 100 100"><path d="M50 0 C54 32 68 46 100 50 C68 54 54 68 50 100 C46 68 32 54 0 50 C32 46 46 32 50 0Z" transform="translate(50 50) rotate(45) scale(.62) translate(-50 -50)" fill="url(#chrome)" stroke="url(#chromeEdge)" stroke-width="1.6"/><path d="M50 0 C54 32 68 46 100 50 C68 54 54 68 50 100 C46 68 32 54 0 50 C32 46 46 32 50 0Z" fill="url(#chrome)" stroke="url(#chromeEdge)" stroke-width="1.4"/><circle cx="44" cy="42" r="10" fill="url(#glint)"/></symbol>
  </defs></svg>
  <header class="top"><div class="wrap">
    <a class="logo" href="index.html" aria-label="F-Producers Club — платформа"><span>F-PRODUCERS<br>CLUB</span><svg class="px" viewBox="0 0 9 9" aria-hidden="true">${starRects()}</svg><small>платформа</small></a>
    <nav class="menu" aria-label="Разделы">${MENU.map(([h, i, t]) => `<a href="${h}" class="${h === cur ? 'on' : ''}">${icon(i)}${t}</a>`).join('')}</nav>
    <a class="site" href="${SITE}" target="_blank" rel="noopener">сайт клуба ↗</a>
  </div></header>`);
  document.body.insertAdjacentHTML('beforeend', `
  <footer class="foot"><div class="wrap"><span class="mono">F-Producers Club · платформа для участников</span><span class="mono"><a href="https://t.me/${TG}" target="_blank" rel="noopener">@${TG}</a> · <a href="${SITE}" target="_blank" rel="noopener">сайт клуба</a>${isOwner ? ' · <a href="admin.html">кабинет</a>' : ''}${sess ? ' · <a href="#" id="logout">выйти</a>' : ''}</span></div></footer>
  <nav class="tabbar" aria-label="Разделы">${NAV.map(([h, i, t]) => `<a href="${h}" class="${h === cur ? 'on' : ''}">${icon(i)}${t}</a>`).join('')}</nav>`);

  const reveal = () => {
    const els = $$('.fade:not(.in)');
    if (!('IntersectionObserver' in window)) return els.forEach((e) => e.classList.add('in'));
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .08 });
    els.forEach((e) => io.observe(e));
  };

  const load = (f) => call(`/api/data?f=${f}`);
  const lo = $('#logout');
  if (lo) lo.addEventListener('click', (e) => { e.preventDefault(); call('/api/logout', { method: 'POST' }).catch(() => {}).finally(() => { store.set('session', null); location.href = 'index.html'; }); });

  /* ---------- экран входа ---------- */
  const locked = ['index', 'news', 'guides', 'track', 'guide', 'admin'].includes(page) && !sess;
  if (locked) {
    $('main').innerHTML = `
      <section class="phead fade"><span class="kick mono">платформа участников · F-Producers Club</span>
        <h1>Вход по <span class="tag-box">коду</span><span class="cstar" aria-hidden="true"><svg><use href="#cs8"/></svg></span></h1>
        <p>Гайды и новости клуба открываются по личному коду. Код выдаёт наш Telegram-бот после одобрения Артёма.</p></section>
      <section class="sup">
        <form class="card ask fade" id="login">
          <h2>Твой код</h2><p>Код выглядит так: FP-XXXX-XXXX. Он одноразовый — привяжется к устройству, на котором ты его введёшь.</p>
          <div class="field"><label class="mono" for="code">код доступа</label><input id="code" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" placeholder="FP-XXXX-XXXX" maxlength="20" style="font-family:'JetBrains Mono',monospace;letter-spacing:.08em"></div>
          <div class="actions"><button class="btn" type="submit">Войти <span class="ar">→</span></button><a class="btn ghost" href="https://t.me/${BOT}" target="_blank" rel="noopener">Получить код в боте</a></div>
          <div class="ok" id="lerr" role="alert"></div>
        </form>
        <aside class="side"><div class="card how fade"><h3>Как получить доступ</h3><ol>
          <li>Открой бота <a href="https://t.me/${BOT}" target="_blank" rel="noopener" style="border-bottom:1px solid currentColor">@${BOT}</a> и нажми «Старт».</li>
          <li>Артём получит заявку и одобрит её — бот пришлёт тебе личный код.</li>
          <li>Введи код здесь — на том устройстве и в том браузере, где будешь заниматься.</li></ol></div></aside>
      </section>`;
    const f = $('#login'), err = $('#lerr');
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const b = $('button[type=submit]', f);
      if (!$('#code').value.trim()) { $('#code').focus(); return; }
      err.classList.remove('on');
      const tgApp = /Telegram/i.test(navigator.userAgent) || !!window.TelegramWebviewProxy;
      const go = await confirmBox({
        title: 'Код активируется один раз',
        html: `<p>Код привяжется к <b>этому устройству и этому браузеру</b>. На другом телефоне, компьютере или в другом браузере он <b>не заработает</b>.</p>
          <ul>${tgApp ? '<li><b>Сейчас ты во встроенном браузере Telegram.</b> Лучше открой платформу в Safari или Chrome и активируй код там.</li>' : '<li>Открой платформу там, где будешь заниматься, — не во встроенном браузере Telegram.</li>'}
          <li>Не используй режим инкогнито и не очищай данные сайта — иначе вход пропадёт.</li></ul>
          <p class="mono">Сменил устройство — напиши Артёму, он сбросит привязку.</p>`,
        ok: 'Активировать здесь', cancel: 'Отмена',
      });
      if (!go) return;
      b.disabled = true;
      try {
        const r = await call('/api/login', { method: 'POST', body: JSON.stringify({ code: $('#code').value, device }) });
        store.set('session', { token: r.token, role: r.role, name: r.name });
        location.reload();
      } catch (x) { err.textContent = x.message === 'Failed to fetch' ? 'Нет связи с сервером. Проверь интернет и попробуй ещё раз.' : x.message; err.classList.add('on'); b.disabled = false; }
    });
  }
  const fmtDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const stepsTotal = (T) => T.reduce((n, t) => n + t.steps.length, 0);
  const tDone = (t, done) => t.steps.filter((s) => done.has(`${t.id}:${s.id}`)).length;
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const plural = (n, one, few, many) => { const d = n % 10, h = n % 100; return d === 1 && h !== 11 ? one : d >= 2 && d <= 4 && (h < 12 || h > 14) ? few : many; };
  const fail = (box, what) => { box.innerHTML = `<div class="empty">Не удалось загрузить ${what}. Обнови страницу.</div>`; };
  const stepUrl = (t, s) => `guide.html?t=${encodeURIComponent(t.id)}&s=${encodeURIComponent(s.id)}`;

  /* ---------- видео: YouTube, Rutube, VK, Kinescope, файл ---------- */
  const embed = (u) => {
    u = String(u || '').trim();
    if (!u) return null;
    let m;
    if ((m = u.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/))) return { type: 'yt', src: `https://www.youtube.com/embed/${m[1]}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1` };
    if ((m = u.match(/rutube\.ru\/(?:video|play\/embed)\/([\w]+)/))) return { type: 'rt', src: `https://rutube.ru/play/embed/${m[1]}` };
    if ((m = u.match(/vk(?:video)?\.(?:com|ru)\/(?:video|clip)(-?\d+)_(\d+)/))) return { type: 'vk', src: `https://vk.com/video_ext.php?oid=${m[1]}&id=${m[2]}&hd=2` };
    if ((m = u.match(/kinescope\.io\/(?:embed\/)?([\w]+)/))) return { type: 'ks', src: `https://kinescope.io/embed/${m[1]}` };
    if (/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(u)) return { type: 'file', src: u };
    return /^https:\/\//.test(u) ? { type: 'frame', src: u } : null;
  };
  const player = (v) => (v.type === 'file'
    ? `<video id="vid" src="${esc(v.src)}" controls playsinline preload="metadata"></video>`
    : `<iframe id="vid" src="${esc(v.src)}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen title="Видео урока"></iframe>`);
  const seek = (v, s) => {
    const el = $('#vid');
    if (!el) return;
    if (matchMedia('(max-width: 1000px)').matches) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    if (v.type === 'file') { el.currentTime = s; el.play().catch(() => {}); return; }
    const post = (o) => el.contentWindow && el.contentWindow.postMessage(JSON.stringify(o), '*');
    if (v.type === 'yt') { post({ event: 'command', func: 'seekTo', args: [s, true] }); post({ event: 'command', func: 'playVideo', args: [] }); return; }
    if (v.type === 'rt') { post({ type: 'player:setCurrentTime', data: { time: s } }); post({ type: 'player:play', data: {} }); return; }
    const u = new URL(v.src);
    u.searchParams.set('t', v.type === 'vk' ? `${Math.floor(s / 60)}m${s % 60}s` : String(s));
    u.searchParams.set('autoplay', '1');
    el.src = u.toString();
  };

  /* ---------- обложка направления (типографика, без чужих картинок) ---------- */
  const cover = (t, i) => `
    <div class="ncover ${t.main ? 'main' : ''}" aria-hidden="true">
      <span class="nnum">${String(i + 1).padStart(2, '0')}</span>
      <span class="ngrid"></span>
      <span class="cstar"><svg><use href="#cs8"/></svg></span>
      <span class="ntags mono">${(t.tags || []).slice(0, 4).map((x) => `<span>— ${esc(x)}</span>`).join('')}</span>
      <b class="ntitle">${esc(t.title)}</b>
      ${t.main ? '<span class="nbadge mono"><svg class="px" viewBox="0 0 9 9">' + starRects() + '</svg>главное направление</span>' : ''}
    </div>`;

  const ncard = (t, i, done) => {
    const d = tDone(t, done), n = t.steps.length, p = pct(d, n), vids = t.steps.filter((s) => s.video).length;
    return `<a class="card ncard fade ${t.main ? 'main' : ''}" style="--d:${i}" href="track.html?t=${encodeURIComponent(t.id)}">
      ${cover(t, i)}
      <div class="nbody">
        <div class="nmeta mono"><span>${n} ${plural(n, 'шаг', 'шага', 'шагов')}</span><span>${vids ? `${vids} видео` : 'видео скоро'}</span></div>
        <h3>${esc(t.title)}</h3><p>${esc(t.desc)}</p>
        <div class="pbar" style="--p:${p}%"><i></i></div>
        <div class="nfoot mono"><span>${d ? (d === n ? 'пройдено полностью' : `пройдено ${d} из ${n}`) : 'не начато'}</span><span class="go">Открыть →</span></div>
      </div></a>`;
  };

  /* ---------- блоки контента ---------- */
  const inline = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\[(.+?)\]\((https?:\/\/[^\s)]+|[\w-]+\.html[^\s)]*)\)/g, (_, txt, url) => `<a href="${url}"${/^https?:/.test(url) ? ' target="_blank" rel="noopener"' : ''} style="border-bottom:1px solid currentColor">${txt}</a>`);
  const blocks = (arr) => (arr || []).map((b) => {
    if (typeof b === 'string') return `<p>${inline(b)}</p>`;
    if (b.h) return `<h2>${inline(b.h)}</h2>`;
    if (b.list) return `<ul>${b.list.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>`;
    if (b.steps) return `<ol>${b.steps.map((x) => `<li>${inline(x)}</li>`).join('')}</ol>`;
    if (b.tip) return `<div class="tip"><b>${inline(b.title || 'Важно')}</b>${inline(b.tip)}</div>`;
    if (b.video) { const v = embed(b.video); return v ? `<div class="video">${player(v).replace(' id="vid"', '')}</div>` : ''; }
    if (b.img) return `<img src="${esc(b.img)}" alt="${esc(b.alt || '')}" style="border-radius:16px">`;
    return '';
  }).join('');

  const postHTML = (n, full) => `
    <article class="card post ${n.pin ? 'pin' : ''}" id="${esc(n.id)}">
      <div class="meta mono">${n.pin ? '<span class="pill dark">закреп</span>' : ''}<span class="pill">${esc(n.tag)}</span><span>${fmtDate(n.date)}</span></div>
      <h3>${esc(n.title)}</h3>
      <div class="body">${full ? `<p>${inline(n.lead)}</p>${n.body && n.body.length ? `<div class="more"><div>${blocks(n.body)}</div></div>` : ''}` : inline(n.lead)}</div>
      ${full && n.body && n.body.length ? '<button class="tog" type="button">Читать полностью</button>' : ''}
    </article>`;

  /* ---------- главная ---------- */
  if (page === 'index' && !locked) {
    Promise.all([load('news'), load('tracks')]).then(([news, T]) => {
      const done = doneSet(), total = stepsTotal(T), n = T.reduce((a, t) => a + tDone(t, done), 0);
      const last = store.get('last', null);
      const lt = last && last.t && T.find((x) => x.id === last.t);
      const li = lt ? lt.steps.findIndex((s) => s.id === last.s) : -1;
      const tg = li >= 0 ? { t: lt, i: li } : { t: T.find((x) => x.main) || T[0], i: 0 };
      const s = tg.t && tg.t.steps[tg.i];
      $('#cont').innerHTML = s ? `
        <span class="cstar" aria-hidden="true"><svg><use href="#cs8"/></svg></span>
        <div><span class="mono">${li >= 0 ? 'продолжить обучение' : 'начни отсюда'}</span>
        <h3>${esc(s.title)}</h3><p>${esc(tg.t.title)} · шаг ${esc(s.num)} из ${tg.t.steps.length}</p></div>
        <div><div class="prog" style="--p:${pct(n, total)}%"><i></i></div><p class="mono" style="margin-top:10px">пройдено ${n} из ${total} ${plural(total, 'шага', 'шагов', 'шагов')}</p></div>
        <a class="btn" href="${stepUrl(tg.t, s)}">${li >= 0 ? 'Продолжить' : 'Начать'} <span class="ar">→</span></a>` : '<div><h3>Обучение скоро появится</h3></div>';
      $('#st-guides').textContent = T.length;
      $('#st-lessons').textContent = total;
      const ht = $('#home-tracks');
      if (ht) ht.innerHTML = T.map((t, i) => ncard(t, i, done)).join('');
      const hf = $('#home-favs');
      favList(T, hf);
      favs.sync().then(() => favList(T, hf));
      document.addEventListener('favs', () => favList(T, hf));
      const sorted = [...news].sort((a, b) => (b.pin - a.pin) || b.date.localeCompare(a.date));
      $('#home-news').innerHTML = sorted.slice(0, 3).map((x) => `<a class="card hov post" href="news.html#${encodeURIComponent(x.id)}" style="display:block"><div class="meta mono"><span class="pill">${esc(x.tag)}</span><span>${fmtDate(x.date)}</span></div><h3>${esc(x.title)}</h3><div class="body">${inline(x.lead)}</div></a>`).join('');
      $('#sc-news').textContent = `${news.length} ${plural(news.length, 'запись', 'записи', 'записей')}`;
      $('#sc-guides').textContent = `${T.length} ${plural(T.length, 'направление', 'направления', 'направлений')} · ${total} ${plural(total, 'шаг', 'шага', 'шагов')}`;
      reveal();
    }).catch(() => fail($('#home-news'), 'данные'));
  }

  /* ---------- новости ---------- */
  if (page === 'news' && !locked) {
    const box = $('#feed');
    load('news').then((news) => {
      const sorted = [...news].sort((a, b) => (b.pin - a.pin) || b.date.localeCompare(a.date));
      const tags = ['Все', ...new Set(sorted.map((n) => n.tag))];
      let tag = 'Все';
      const draw = () => {
        const list = sorted.filter((n) => tag === 'Все' || n.tag === tag);
        box.innerHTML = list.length ? list.map((n) => postHTML(n, true)).join('') : '<div class="empty">Здесь пока пусто.</div>';
        $$('.post', box).forEach((p) => { const b = $('.tog', p); if (b) b.addEventListener('click', () => { p.classList.toggle('open'); b.textContent = p.classList.contains('open') ? 'Свернуть' : 'Читать полностью'; }); });
      };
      $('#filters').innerHTML = tags.map((t) => `<button type="button" class="${t === tag ? 'on' : ''}">${esc(t)}</button>`).join('');
      $$('#filters button').forEach((b) => b.addEventListener('click', () => { tag = b.textContent; $$('#filters button').forEach((x) => x.classList.toggle('on', x === b)); draw(); }));
      draw();
      const h = decodeURIComponent(location.hash.slice(1));
      if (h) { const el = document.getElementById(h); if (el) { el.classList.add('open'); const b = $('.tog', el); if (b) b.textContent = 'Свернуть'; setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120); } }
    }).catch(() => fail(box, 'новости'));
  }

  /* ---------- направления ---------- */
  if (page === 'guides' && !locked) {
    const box = $('#tracks');
    load('tracks').then((T) => {
      const done = doneSet();
      box.innerHTML = T.length ? T.map((t, i) => ncard(t, i, done)).join('') : '<div class="empty">Направления скоро появятся.</div>';
      const fs = $('#favsec');
      favList(T, fs);
      favs.sync().then(() => favList(T, fs));
      document.addEventListener('favs', () => favList(T, fs));
      reveal();
    }).catch(() => fail(box, 'обучение'));
  }

  /* ---------- шаги направления ---------- */
  if (page === 'track' && !locked) {
    const box = $('#track');
    load('tracks').then((T) => {
      const q = new URLSearchParams(location.search);
      const i = Math.max(0, T.findIndex((x) => x.id === q.get('t')));
      const t = T[i];
      if (!t) return fail(box, 'направление');
      const done = doneSet(), d = tDone(t, done), n = t.steps.length, p = pct(d, n);
      const ni = t.steps.findIndex((s) => !done.has(`${t.id}:${s.id}`));
      const go = t.steps[ni < 0 ? 0 : ni];
      document.title = `${t.title} — обучение · F-Producers Club`;
      box.innerHTML = `
        <div class="crumbs mono fade"><a href="guides.html">Обучение</a><span>/</span><span>${esc(t.title)}</span></div>
        <section class="thero fade">
          ${cover(t, i)}
          <div class="tinfo">
            <span class="kick mono">направление · ${String(i + 1).padStart(2, '0')}${t.main ? ' · главное' : ''}</span>
            <h1>${esc(t.title)}</h1><p>${esc(t.desc)}</p>
            <div class="tprog"><div class="pbar" style="--p:${p}%"><i></i></div><span class="mono">${d} / ${n} · ${p}%</span></div>
            ${go ? `<a class="btn" href="${stepUrl(t, go)}">${d === 0 ? `Начать с шага ${esc(go.num)}` : d === n ? 'Пересмотреть с начала' : `Продолжить: шаг ${esc(go.num)}`} <span class="ar">→</span></a>` : ''}
          </div>
        </section>
        <section class="sec">
          <div class="sec-t"><h2>Шаги</h2><span class="mono">${n} ${plural(n, 'шаг', 'шага', 'шагов')}</span></div>
          ${n ? `<ol class="srows">${t.steps.map((s, k) => {
            const ok = done.has(`${t.id}:${s.id}`), tc = (s.timecodes || []).length;
            return `<li class="sli fade" style="--d:${k % 8}"><a class="card srow ${ok ? 'done' : ''}" href="${stepUrl(t, s)}">
              <span class="snum">${esc(s.num)}</span>
              <span class="stx"><b>${esc(s.title)}</b><small class="mono">${s.video ? '▶ видео' : 'видео скоро'}${tc ? ` · ${tc} ${plural(tc, 'таймкод', 'таймкода', 'таймкодов')}` : ''}${s.notes && s.notes.length ? ' · конспект' : ''}</small></span>
              <span></span><span class="sck" aria-label="${ok ? 'пройдено' : 'не пройдено'}">${ok ? '✓' : '→'}</span></a>${favBtn(`${t.id}:${s.id}`)}</li>`;
          }).join('')}</ol>` : '<div class="empty">Шаги скоро появятся.</div>'}
        </section>`;
      favs.sync().then(() => paintFavs(box));
      reveal();
    }).catch(() => fail(box, 'направление'));
  }

  /* ---------- урок ---------- */
  if (page === 'guide' && !locked) {
    const box = $('#reader');
    load('tracks').then((T) => {
      const q = new URLSearchParams(location.search);
      const t = T.find((x) => x.id === q.get('t')) || T.find((x) => x.main) || T[0];
      if (!t || !t.steps.length) { box.innerHTML = '<div class="empty" style="grid-column:1/-1">Шаги скоро появятся. <a href="guides.html" style="border-bottom:1px solid currentColor">К обучению</a></div>'; return; }
      let si = Math.max(0, t.steps.findIndex((s) => s.id === q.get('s')));
      const draw = () => {
        const done = doneSet(), s = t.steps[si], key = `${t.id}:${s.id}`, isDone = done.has(key);
        const p = pct(tDone(t, done), t.steps.length), v = embed(s.video), tcs = s.timecodes || [];
        const prev = t.steps[si - 1], next = t.steps[si + 1];
        store.set('last', { t: t.id, s: s.id });
        document.title = `${s.num} ${s.title} — ${t.title} · F-Producers Club`;
        box.innerHTML = `
          <aside class="card ltoc">
            <a class="back mono" href="track.html?t=${encodeURIComponent(t.id)}">← ${esc(t.title)}</a>
            <div class="tprog"><div class="pbar" style="--p:${p}%"><i></i></div><span class="mono">${p}%</span></div>
            <ol>${t.steps.map((x, k) => { const ok = done.has(`${t.id}:${x.id}`); return `<li><a href="${stepUrl(t, x)}" data-i="${k}" class="${k === si ? 'on' : ''} ${ok ? 'done' : ''}"><span class="n mono">${esc(x.num)}</span><span class="tt">${esc(x.title)}</span><span class="ck">${ok ? '✓' : ''}</span></a></li>`; }).join('')}</ol>
          </aside>
          <article class="card lesson">
            <div class="lhead">
              <div><span class="kick mono">шаг ${esc(s.num)} · ${esc(t.title)}</span><h1>${esc(s.title)}</h1></div>
              <div class="lbtns">${favBtn(key, 'fbtn')}<button class="dbtn ${isDone ? 'is' : ''}" type="button" aria-pressed="${isDone}" title="${isDone ? 'Снять отметку' : 'Отметить пройденным'}">✓</button></div>
            </div>
            <div class="vbox">${v ? player(v) : `<div class="vsoon"><svg class="px" viewBox="0 0 9 9">${starRects()}</svg><b>Видео скоро появится</b><span class="mono">шаг ${esc(s.num)}</span></div>`}</div>
            <div class="tcs"><h3>Таймкоды</h3>${tcs.length
              ? `<ol>${tcs.map((c) => `<li><button type="button" data-s="${c.s}" ${v ? '' : 'disabled'}><span class="mono">${esc(c.t)}</span><span>${esc(c.label)}</span></button></li>`).join('')}</ol>`
              : '<p>Появятся вместе с видео.</p>'}</div>
            ${s.notes && s.notes.length ? `<div class="content">${blocks(s.notes)}</div>` : ''}
            <div class="nav2">
              ${prev ? `<a class="btn sm ghost" href="${stepUrl(t, prev)}" data-i="${si - 1}">← ${esc(prev.num)}</a>` : '<span></span>'}
              <span class="mid">
                <button class="btn sm ghost done-btn ${isDone ? 'is' : ''}" type="button">${isDone ? '✓ Пройдено' : 'Отметить пройденным'}</button>
                ${isOwner ? `<a class="btn sm ghost" href="admin.html#t=${encodeURIComponent(t.id)}&s=${encodeURIComponent(s.id)}">✎ Править</a>` : ''}
              </span>
              ${next ? `<a class="btn sm" href="${stepUrl(t, next)}" data-i="${si + 1}">Шаг ${esc(next.num)} <span class="ar">→</span></a>` : `<a class="btn sm" href="track.html?t=${encodeURIComponent(t.id)}">К направлению <span class="ar">→</span></a>`}
            </div>
            <p class="askq">Остался вопрос по шагу? <a href="support.html?topic=${encodeURIComponent(t.title)}&about=${encodeURIComponent(s.num + ' ' + s.title)}">Спросить Артёма →</a></p>
          </article>`;
        const tog = () => {
          const on = toggleDone(key), dn = doneSet(), pp = pct(tDone(t, dn), t.steps.length);
          const db = $('.dbtn', box), bb = $('.done-btn', box), ta = $(`.ltoc a[data-i="${si}"]`, box);
          db.classList.toggle('is', on); db.setAttribute('aria-pressed', on); db.title = on ? 'Снять отметку' : 'Отметить пройденным';
          bb.classList.toggle('is', on); bb.textContent = on ? '✓ Пройдено' : 'Отметить пройденным';
          if (ta) { ta.classList.toggle('done', on); $('.ck', ta).textContent = on ? '✓' : ''; }
          $('.ltoc .pbar', box).style.setProperty('--p', pp + '%'); $('.ltoc .tprog .mono', box).textContent = pp + '%';
          if (on) toast('Шаг отмечен пройденным');
        };
        $('.dbtn', box).addEventListener('click', tog);
        $('.done-btn', box).addEventListener('click', tog);
        $$('[data-i]', box).forEach((a) => a.addEventListener('click', (e) => {
          e.preventDefault(); si = +a.dataset.i;
          history.replaceState(null, '', stepUrl(t, t.steps[si]).replace('guide.html', ''));
          draw(); window.scrollTo({ top: 0, behavior: 'smooth' });
        }));
        $$('.tcs button[data-s]', box).forEach((b) => b.addEventListener('click', () => {
          $$('.tcs button', box).forEach((x) => x.classList.toggle('on', x === b));
          seek(v, +b.dataset.s);
        }));
      };
      draw();
      favs.sync().then(() => paintFavs(box));
    }).catch(() => fail(box, 'урок'));
  }

  /* ---------- поддержка ---------- */
  if (page === 'support') {
    const q = new URLSearchParams(location.search);
    const topics = ['Продюсирование', 'Инфобизнес', 'Продажи в звонках', 'Платформа', 'Другое'];
    let topic = q.get('topic') || store.get('topic', 'Продюсирование');
    if (!topics.includes(topic)) topics.splice(topics.length - 1, 0, topic);
    const ta = $('#q'), cnt = $('#cnt'), chips = $('#topics');
    ta.value = q.get('about') ? `Вопрос по уроку «${q.get('about')}»: ` : store.get('draft', '');
    chips.innerHTML = topics.map((t) => `<button type="button" class="${t === topic ? 'on' : ''}">${esc(t)}</button>`).join('');
    $$('button', chips).forEach((b) => b.addEventListener('click', () => { topic = b.textContent; store.set('topic', topic); $$('button', chips).forEach((x) => x.classList.toggle('on', x === b)); }));
    const msg = () => `Вопрос из платформы F-Producers Club\nТема: ${topic}\n\n${ta.value.trim()}`;
    const upd = () => { cnt.textContent = `${ta.value.length} / 1500`; $('#send').disabled = $('#copy').disabled = ta.value.trim().length < 5; store.set('draft', ta.value); };
    ta.addEventListener('input', upd); upd();
    const ok = (t) => { const o = $('#ok'); o.textContent = t; o.classList.remove('on'); void o.offsetWidth; o.classList.add('on'); };
    $('#send').addEventListener('click', () => {
      window.open(`https://t.me/${TG}?text=${encodeURIComponent(msg())}`, '_blank', 'noopener');
      ok('Открыли Telegram с твоим вопросом — осталось нажать «Отправить». Если текст не подставился, нажми «Скопировать вопрос» и вставь его в чат.');
    });
    $('#copy').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(msg()); ok('Вопрос скопирован. Открой чат с @' + TG + ' и вставь его.'); }
      catch (e) { ta.select(); ok('Не получилось скопировать автоматически — выдели текст и скопируй вручную.'); }
    });
    reveal();
  }

  reveal();
})();
