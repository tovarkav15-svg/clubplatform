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
  const toggleDone = (key) => { const s = doneSet(); s.has(key) ? s.delete(key) : s.add(key); store.set('done', [...s]); return s.has(key); };

  /* ---------- общие элементы ---------- */
  const STAR = ['....#....', '....#....', '...###...', '#########', '.###.###.', '..#####..', '..##.##..', '.##...##.', '.#.....#.'];
  const starRects = () => STAR.flatMap((r, y) => [...r].map((c, x) => (c === '#' ? `<rect x="${x}" y="${y}" width="1.02" height="1.02"/>` : ''))).join('');
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    news: '<path d="M4 5h13v14a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2zM17 9h3v10a2 2 0 0 1-2 2M8 9h5M8 13h5M8 17h3"/>',
    guides: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5zM4 19.5A1.5 1.5 0 0 0 5.5 21H20M9 8h6"/>',
    support: '<path d="M4 5h16v11H9l-5 4zM9 9.5h6M9 12.5h4"/>',
    arrow: '<path d="M7 17 17 7M9 7h8v8"/>',
  };
  const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;
  const NAV = [['index.html', 'home', 'Главная'], ['news.html', 'news', 'Новости'], ['guides.html', 'guides', 'Гайды'], ['support.html', 'support', 'Поддержка']];
  const cur = { index: 'index.html', news: 'news.html', guides: 'guides.html', guide: 'guides.html', support: 'support.html' }[page];

  document.body.insertAdjacentHTML('afterbegin', `
  <svg style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false"><defs>
    <linearGradient id="chrome" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".22" stop-color="#c9ccd1"/><stop offset=".42" stop-color="#6b7078"/><stop offset=".55" stop-color="#f2f3f5"/><stop offset=".75" stop-color="#9aa0a8"/><stop offset="1" stop-color="#2d3036"/><animateTransform attributeName="gradientTransform" type="rotate" from="0 .5 .5" to="360 .5 .5" dur="6s" repeatCount="indefinite"/></linearGradient>
    <linearGradient id="chromeEdge" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#2d3036"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#55595f"/></linearGradient>
    <radialGradient id="glint" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <symbol id="cs8" viewBox="0 0 100 100"><path d="M50 0 C54 32 68 46 100 50 C68 54 54 68 50 100 C46 68 32 54 0 50 C32 46 46 32 50 0Z" transform="translate(50 50) rotate(45) scale(.62) translate(-50 -50)" fill="url(#chrome)" stroke="url(#chromeEdge)" stroke-width="1.6"/><path d="M50 0 C54 32 68 46 100 50 C68 54 54 68 50 100 C46 68 32 54 0 50 C32 46 46 32 50 0Z" fill="url(#chrome)" stroke="url(#chromeEdge)" stroke-width="1.4"/><circle cx="44" cy="42" r="10" fill="url(#glint)"/></symbol>
  </defs></svg>
  <header class="top"><div class="wrap">
    <a class="logo" href="index.html" aria-label="F-Producers Club — платформа"><span>F-PRODUCERS<br>CLUB</span><svg class="px" viewBox="0 0 9 9" aria-hidden="true">${starRects()}</svg><small>платформа</small></a>
    <nav class="menu" aria-label="Разделы">${NAV.map(([h, i, t]) => `<a href="${h}" class="${h === cur ? 'on' : ''}">${icon(i)}${t}</a>`).join('')}</nav>
    <a class="site" href="${SITE}" target="_blank" rel="noopener">сайт клуба ↗</a>
  </div></header>`);
  document.body.insertAdjacentHTML('beforeend', `
  <footer class="foot"><div class="wrap"><span class="mono">F-Producers Club · платформа для участников</span><span class="mono"><a href="https://t.me/${TG}" target="_blank" rel="noopener">@${TG}</a> · <a href="${SITE}" target="_blank" rel="noopener">сайт клуба</a></span></div></footer>
  <nav class="tabbar" aria-label="Разделы">${NAV.map(([h, i, t]) => `<a href="${h}" class="${h === cur ? 'on' : ''}">${icon(i)}${t}</a>`).join('')}</nav>`);

  const reveal = () => {
    const els = $$('.fade:not(.in)');
    if (!('IntersectionObserver' in window)) return els.forEach((e) => e.classList.add('in'));
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .08 });
    els.forEach((e) => io.observe(e));
  };

  const load = (f) => fetch(`data/${f}.json?v=${Date.now() / 6e5 | 0}`).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
  const fmtDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const lessonsTotal = (mods) => mods.reduce((n, m) => n + m.lessons.length, 0);
  const modDone = (m, done) => m.lessons.filter((_, i) => done.has(`${m.id}:${i}`)).length;
  const plural = (n, one, few, many) => { const d = n % 10, h = n % 100; return d === 1 && h !== 11 ? one : d >= 2 && d <= 4 && (h < 12 || h > 14) ? few : many; };
  const fail = (box, what) => { box.innerHTML = `<div class="empty">Не удалось загрузить ${what}. Обнови страницу.</div>`; };

  /* ---------- блоки контента ---------- */
  const inline = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\[(.+?)\]\((https?:\/\/[^\s)]+|[\w-]+\.html[^\s)]*)\)/g, (_, txt, url) => `<a href="${url}"${/^https?:/.test(url) ? ' target="_blank" rel="noopener"' : ''} style="border-bottom:1px solid currentColor">${txt}</a>`);
  const blocks = (arr) => (arr || []).map((b) => {
    if (typeof b === 'string') return `<p>${inline(b)}</p>`;
    if (b.h) return `<h2>${inline(b.h)}</h2>`;
    if (b.list) return `<ul>${b.list.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>`;
    if (b.steps) return `<ol>${b.steps.map((x) => `<li>${inline(x)}</li>`).join('')}</ol>`;
    if (b.tip) return `<div class="tip"><b>${inline(b.title || 'Важно')}</b>${inline(b.tip)}</div>`;
    if (b.video) return `<div class="video"><iframe src="${esc(b.video)}" allowfullscreen loading="lazy" title="Видео"></iframe></div>`;
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
  if (page === 'index') {
    Promise.all([load('news'), load('guides')]).then(([news, mods]) => {
      const done = doneSet(), total = lessonsTotal(mods), n = done.size;
      const last = store.get('last', null);
      const lm = last && mods.find((m) => m.id === last.m);
      const target = lm ? { m: lm, l: Math.min(last.l, lm.lessons.length - 1) } : { m: mods[0], l: 0 };
      $('#cont').innerHTML = `
        <span class="cstar" aria-hidden="true"><svg><use href="#cs8"/></svg></span>
        <div><span class="mono">${lm ? 'продолжить обучение' : 'начни отсюда'}</span>
        <h3>${esc(target.m.lessons[target.l].title)}</h3><p>Модуль «${esc(target.m.title)}» · урок ${target.l + 1} из ${target.m.lessons.length}</p></div>
        <div><div class="prog" style="--p:${total ? Math.round(n / total * 100) : 0}%"><i></i></div><p class="mono" style="margin-top:10px">пройдено ${n} из ${total} уроков</p></div>
        <a class="btn" href="guide.html?m=${encodeURIComponent(target.m.id)}&l=${target.l}">${lm ? 'Продолжить' : 'Начать'} <span class="ar">→</span></a>`;
      $('#st-guides').textContent = mods.length;
      $('#st-lessons').textContent = total;
      const sorted = [...news].sort((a, b) => (b.pin - a.pin) || b.date.localeCompare(a.date));
      $('#home-news').innerHTML = sorted.slice(0, 3).map((x) => `<a class="card hov post" href="news.html#${encodeURIComponent(x.id)}" style="display:block"><div class="meta mono"><span class="pill">${esc(x.tag)}</span><span>${fmtDate(x.date)}</span></div><h3>${esc(x.title)}</h3><div class="body">${inline(x.lead)}</div></a>`).join('');
      $('#sc-news').textContent = `${news.length} ${plural(news.length, 'запись', 'записи', 'записей')}`;
      $('#sc-guides').textContent = `${mods.length} модулей · ${total} уроков`;
      reveal();
    }).catch(() => fail($('#home-news'), 'данные'));
  }

  /* ---------- новости ---------- */
  if (page === 'news') {
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

  /* ---------- список гайдов ---------- */
  if (page === 'guides') {
    const box = $('#mods');
    load('guides').then((mods) => {
      const done = doneSet();
      box.innerHTML = mods.map((m, i) => {
        const d = modDone(m, done), p = Math.round(d / m.lessons.length * 100);
        return `<a class="card mod fade ${m.start ? 'start' : ''}" style="--d:${i % 6}" href="guide.html?m=${encodeURIComponent(m.id)}&l=0">
          <div class="row mono"><span>${esc(m.num)}</span><span class="pill">${m.lessons.length} ${plural(m.lessons.length, 'урок', 'урока', 'уроков')}</span></div>
          <h3>${esc(m.title)}</h3><p>${esc(m.desc)}</p>
          <div class="bar" style="--p:${p}%"><i></i></div>
          <div class="foot mono"><span>${d ? `пройдено ${d} из ${m.lessons.length}` : 'не начат'}</span><span>${p}%</span></div></a>`;
      }).join('');
      reveal();
    }).catch(() => fail(box, 'гайды'));
  }

  /* ---------- урок ---------- */
  if (page === 'guide') {
    const box = $('#reader');
    load('guides').then((mods) => {
      const q = new URLSearchParams(location.search);
      const m = mods.find((x) => x.id === q.get('m')) || mods[0];
      let l = Math.max(0, Math.min(m.lessons.length - 1, parseInt(q.get('l'), 10) || 0));
      const draw = () => {
        const done = doneSet(), les = m.lessons[l], key = `${m.id}:${l}`, isDone = done.has(key);
        store.set('last', { m: m.id, l });
        document.title = `${les.title} — ${m.title} · F-Producers Club`;
        const mi = mods.indexOf(m), next = l < m.lessons.length - 1 ? { m, l: l + 1 } : mods[mi + 1] ? { m: mods[mi + 1], l: 0 } : null;
        box.innerHTML = `
          <aside class="card toc">
            <span class="mono">${esc(m.num)}</span><h4>${esc(m.title)}</h4>
            <ol>${m.lessons.map((x, i) => `<li><a href="?m=${encodeURIComponent(m.id)}&l=${i}" data-l="${i}" class="${i === l ? 'on' : ''} ${done.has(`${m.id}:${i}`) ? 'done' : ''}"><span class="ck">${done.has(`${m.id}:${i}`) ? '✓' : i + 1}</span><span>${esc(x.title)}</span></a></li>`).join('')}</ol>
          </aside>
          <article class="card lesson">
            <div class="crumbs mono"><a href="guides.html">Гайды</a><span>/</span><span>${esc(m.title)}</span></div>
            <div class="meta mono"><span class="pill">урок ${l + 1} из ${m.lessons.length}</span>${les.time ? `<span>${esc(les.time)}</span>` : ''}</div>
            <h1>${esc(les.title)}</h1>
            <div class="content">${les.content && les.content.length ? blocks(les.content) : `<div class="soon"><b>Материал готовится</b><p>Урок скоро появится на платформе — об этом напишем в новостях клуба. Есть вопрос по теме уже сейчас? Задай его Артёму.</p><a class="btn sm ghost" href="support.html?topic=${encodeURIComponent(m.title)}&about=${encodeURIComponent(les.title)}">Задать вопрос <span class="ar">→</span></a></div>`}</div>
            <div class="nav2">
              <button class="btn sm done-btn ${isDone ? 'is' : ''}" type="button">${isDone ? '✓ Пройдено' : 'Отметить пройденным'}</button>
              ${next ? `<a class="btn sm ghost" href="guide.html?m=${encodeURIComponent(next.m.id)}&l=${next.l}">${next.m === m ? 'Следующий урок' : 'Следующий модуль'} <span class="ar">→</span></a>` : '<a class="btn sm ghost" href="guides.html">Все гайды</a>'}
            </div>
          </article>`;
        $('.done-btn', box).addEventListener('click', () => { toggleDone(key); draw(); });
        $$('.toc a', box).forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); l = +a.dataset.l; history.replaceState(null, '', `?m=${encodeURIComponent(m.id)}&l=${l}`); draw(); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
      };
      draw();
    }).catch(() => fail(box, 'урок'));
  }

  /* ---------- поддержка ---------- */
  if (page === 'support') {
    const q = new URLSearchParams(location.search);
    const topics = ['Гайды', 'Упаковка', 'Прогревы', 'Запуск', 'Трафик', 'Договор', 'Другое'];
    let topic = q.get('topic') || store.get('topic', 'Гайды');
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
