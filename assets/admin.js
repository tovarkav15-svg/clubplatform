(() => {
  const F = window.FPC;
  if (!F || !F.sess) return;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const main = $('main');
  if (!F.isOwner) {
    main.innerHTML = '<section class="phead"><span class="kick mono">кабинет</span><h1>Только для <span class="tag-box">владельца</span></h1><p>Этот раздел доступен только Артёму. <a href="index.html" style="border-bottom:1px solid currentColor">Вернуться на главную</a></p></section>';
    return;
  }

  /* ---------- разметка уроков: текст ⇄ блоки ---------- */
  const embed = (u) => {
    const y = u.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/);
    if (y) return `https://www.youtube.com/embed/${y[1]}`;
    const r = u.match(/rutube\.ru\/video\/([\w]+)/);
    if (r) return `https://rutube.ru/play/embed/${r[1]}`;
    return u;
  };
  const toText = (arr) => (arr || []).map((b) => {
    if (typeof b === 'string') return b;
    if (b.h) return '## ' + b.h;
    if (b.list) return b.list.map((x) => '- ' + x).join('\n');
    if (b.steps) return b.steps.map((x, i) => `${i + 1}. ${x}`).join('\n');
    if (b.tip) return '> ' + (b.title ? b.title + ' | ' : '') + b.tip;
    if (b.video) return 'video: ' + b.video;
    if (b.img) return 'img: ' + b.img;
    return '';
  }).filter(Boolean).join('\n\n');
  const fromText = (t) => {
    const out = [];
    String(t || '').replace(/\r/g, '').split(/\n\s*\n/).forEach((chunk) => {
      const L = chunk.split('\n').map((s) => s.trim()).filter(Boolean);
      let para = [], i = 0;
      const flush = () => { if (para.length) { out.push(para.join(' ')); para = []; } };
      const take = (re) => { const a = []; while (i < L.length && re.test(L[i])) a.push(L[i++].replace(re, '')); return a; };
      while (i < L.length) {
        const s = L[i];
        if (/^##\s+/.test(s)) { flush(); out.push({ h: s.replace(/^##\s+/, '') }); i++; }
        else if (/^[-•]\s+/.test(s)) { flush(); out.push({ list: take(/^[-•]\s+/) }); }
        else if (/^\d+[.)]\s+/.test(s)) { flush(); out.push({ steps: take(/^\d+[.)]\s+/) }); }
        else if (/^>\s?/.test(s)) {
          flush();
          const x = take(/^>\s?/).join(' '), k = x.indexOf(' | ');
          out.push(k > 0 ? { title: x.slice(0, k).trim(), tip: x.slice(k + 3).trim() } : { tip: x });
        }
        else if (/^video:\s*\S/i.test(s)) { flush(); out.push({ video: embed(s.replace(/^video:\s*/i, '')) }); i++; }
        else if (/^img:\s*\S/i.test(s)) { flush(); out.push({ img: s.replace(/^img:\s*/i, '') }); i++; }
        else { para.push(s); i++; }
      }
      flush();
    });
    return out;
  };
  const parseTC = (txt) => String(txt || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const m = l.match(/^(\d{1,2}(?::\d{1,2}){1,2})\s*[-–—|.:]?\s*(.*)$/);
    return m ? { t: m[1], s: m[1].split(':').reduce((a, x) => a * 60 + (+x || 0), 0), label: m[2] || '' } : null;
  }).filter(Boolean);
  const tcText = (arr) => (arr || []).map((c) => `${c.t} ${c.label}`.trim()).join('\n');
  const vidKind = (u) => {
    u = String(u || '').trim();
    if (!u) return 'видео не добавлено — на платформе будет «Видео скоро появится»';
    if (/youtu\.?be/.test(u)) return '✓ YouTube';
    if (/rutube\.ru/.test(u)) return '✓ Rutube';
    if (/vk(video)?\.(com|ru)\/(video|clip)-?\d+_\d+/.test(u)) return '✓ VK Видео';
    if (/kinescope\.io/.test(u)) return '✓ Kinescope';
    if (/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(u)) return '✓ видеофайл';
    if (/^https:\/\//.test(u)) return 'ссылка будет встроена как плеер (проверь на сайте)';
    return '⚠ нужна ссылка, начинающаяся с https://';
  };
  const HELP = `Пустая строка — новый абзац · <code>## Заголовок</code> · <code>- пункт списка</code> · <code>1. шаг</code> · <code>&gt; Важно | текст подсказки</code> · <code>video: ссылка YouTube/Rutube</code> · <code>img: ссылка на картинку</code> · <code>**жирный**</code> · <code>[текст](https://ссылка)</code>`;

  /* ---------- состояние ---------- */
  const S = { data: {}, dirty: { tracks: false, news: false }, tab: 'tracks', m: 0, l: null, n: null, saving: false, members: null };
  const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const short = (num, i) => (String(num || '').split('·')[0].trim() || String(i).padStart(2, '0'));
  const dirty = (f) => { S.dirty[f] = true; bar(); };

  main.innerHTML = `
    <section class="phead"><span class="kick mono">кабинет владельца</span>
      <h1>Управление <span class="tag-box">платформой</span></h1>
      <p>Добавляй и правь направления, шаги, видео и новости, одобряй участников. После «Сохранить» изменения сразу видны всем.</p></section>
    <div class="ownbar">
      <div class="card who"><span class="av">А<i></i></span><div><b>@fedonko</b><span>владелец платформы</span></div></div>
      <div class="filters" id="atabs"><button type="button" data-t="tracks">Обучение</button><button type="button" data-t="news">Новости</button><button type="button" data-t="members">Участники</button></div>
    </div>
    <section class="adm" id="adm"><div class="empty">Загружаем…</div></section>
    <div class="savebar" id="savebar"><span class="st"></span><button class="btn sm" id="save" type="button">Сохранить</button></div>`;
  const adm = $('#adm');

  const bar = () => {
    const d = S.dirty.tracks || S.dirty.news, sb = $('#savebar');
    sb.classList.toggle('dirty', d);
    sb.classList.toggle('show', d || S.saving || !!sb.dataset.msg);
    $('.st', sb).textContent = S.saving ? 'Сохраняем…' : sb.dataset.msg || (d ? 'Есть несохранённые изменения' : 'Всё сохранено');
    $('#save').disabled = !d || S.saving;
  };
  const flash = (msg, err) => {
    const sb = $('#savebar'); sb.dataset.msg = msg; sb.classList.toggle('err', !!err); bar();
    clearTimeout(flash.t); flash.t = setTimeout(() => { sb.dataset.msg = ''; sb.classList.remove('err'); bar(); }, 4000);
  };
  window.addEventListener('beforeunload', (e) => { if (S.dirty.tracks || S.dirty.news) { e.preventDefault(); e.returnValue = ''; } });

  const validate = () => {
    for (const m of S.data.tracks) {
      if (!m.title.trim()) return 'У одного из направлений пустое название.';
      if (m.steps.some((x) => !x.title.trim())) return `В направлении «${m.title}» есть шаг без названия.`;
    }
    for (const n of S.data.news) {
      if (!n.title.trim()) return 'У одной из новостей пустой заголовок.';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(n.date)) return `У новости «${n.title}» не указана дата.`;
    }
    return '';
  };
  $('#save').addEventListener('click', async () => {
    const v = validate();
    if (v) return flash(v, true);
    S.saving = true; bar();
    try {
      for (const f of ['tracks', 'news']) {
        if (!S.dirty[f]) continue;
        await F.call(`/api/data?f=${f}`, { method: 'PUT', body: JSON.stringify(S.data[f]) });
        S.dirty[f] = false;
      }
      S.saving = false; flash('Сохранено — изменения уже на платформе');
    } catch (e) { S.saving = false; flash('Не удалось сохранить: ' + e.message, true); }
  });

  /* ---------- вкладки ---------- */
  const draw = () => {
    document.querySelectorAll('#atabs button').forEach((b) => b.classList.toggle('on', b.dataset.t === S.tab));
    if (S.tab === 'tracks') drawGuides();
    else if (S.tab === 'news') drawNews();
    else drawMembers();
    bar();
  };
  $('#atabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { S.tab = b.dataset.t; draw(); } });

  /* ---------- гайды ---------- */
  const listItem = (i, on, num, title, extra) => `
    <div class="it ${on ? 'on' : ''}"><button type="button" class="pick" data-pick="${i}"><span class="mono">${esc(num)}</span><b>${esc(title || 'Без названия')}</b></button>${extra || ''}</div>`;

  const drawGuides = () => {
    const G = S.data.tracks;
    if (S.m >= G.length) S.m = Math.max(0, G.length - 1);
    adm.innerHTML = `
      <aside class="card alist"><span class="mono lab">направления · ${G.length}</span>
        ${G.map((m, i) => listItem(i, i === S.m, String(i + 1).padStart(2, '0') + (m.main ? ' ★' : ''), m.title, `<span class="mv"><button type="button" class="ibtn" data-up="${i}" title="Выше" ${i ? '' : 'disabled'}>↑</button><button type="button" class="ibtn" data-down="${i}" title="Ниже" ${i < G.length - 1 ? '' : 'disabled'}>↓</button></span>`)).join('')}
        <button class="btn sm ghost add" type="button" data-act="addm">+ Направление</button>
      </aside>
      <div class="card aed" id="aed"></div>`;
    G.length ? (S.l === null ? drawModule() : drawLesson()) : ($('#aed').innerHTML = '<div class="empty">Направлений пока нет. Нажми «+ Направление».</div>');
  };

  const drawModule = () => {
    const m = S.data.tracks[S.m];
    $('#aed').innerHTML = `
      <div class="aed-h"><span class="mono">направление</span><a class="btn sm ghost" href="track.html?t=${encodeURIComponent(m.id)}" target="_blank" rel="noopener">Открыть на сайте ↗</a></div>
      <div class="field"><label class="mono">название</label><input data-k="title" value="${esc(m.title)}"></div>
      <div class="field"><label class="mono">описание — видно на карточке</label><textarea data-k="desc" rows="2" style="min-height:0">${esc(m.desc)}</textarea></div>
      <div class="field"><label class="mono">метки на обложке — через запятую, до 4</label><input data-k="tags" value="${esc((m.tags || []).join(', '))}" placeholder="профиль, клиенты, созвоны, запуск"></div>
      <label class="chk"><input type="checkbox" data-k="main" ${m.main ? 'checked' : ''}> Главное направление (большая тёмная карточка)</label>
      <h3 class="sub-h">Шаги · ${m.steps.length}</h3>
      <div class="lrows">${m.steps.length ? m.steps.map((x, i) => `
        <div class="lrow"><span class="mono">${esc(x.num || i + 1)}</span>
          <button type="button" class="lt" data-open="${i}"><b>${esc(x.title || 'Без названия')}</b><small>${x.video ? 'видео ✓' : 'без видео'} · таймкодов ${(x.timecodes || []).length}${x.notes && x.notes.length ? ' · конспект' : ''}</small></button>
          <button type="button" class="ibtn" data-lup="${i}" title="Выше" ${i ? '' : 'disabled'}>↑</button>
          <button type="button" class="ibtn" data-ldown="${i}" title="Ниже" ${i < m.steps.length - 1 ? '' : 'disabled'}>↓</button>
          <button type="button" class="ibtn del" data-ldel="${i}" title="Удалить">✕</button></div>`).join('') : '<div class="empty" style="padding:22px">Шагов пока нет.</div>'}</div>
      <div class="actions"><button class="btn sm" type="button" data-act="addl">+ Шаг</button><button class="btn sm ghost danger" type="button" data-act="delm">Удалить направление</button></div>`;
  };

  const drawLesson = () => {
    const m = S.data.tracks[S.m], st = m.steps[S.l];
    if (!st) { S.l = null; return drawModule(); }
    $('#aed').innerHTML = `
      <div class="aed-h"><button class="btn sm ghost" type="button" data-act="back">← ${esc(m.title)}</button><a class="btn sm ghost" href="guide.html?t=${encodeURIComponent(m.id)}&s=${encodeURIComponent(st.id)}" target="_blank" rel="noopener">Открыть на сайте ↗</a></div>
      <div class="arow" style="grid-template-columns:120px 1fr">
        <div class="field"><label class="mono">номер</label><input data-lk="num" value="${esc(st.num || '')}" placeholder="1.1"></div>
        <div class="field"><label class="mono">название шага</label><input data-lk="title" value="${esc(st.title)}"></div>
      </div>
      <div class="field"><label class="mono">ссылка на видео</label><input data-lk="video" value="${esc(st.video || '')}" placeholder="https://youtu.be/… · rutube.ru/video/… · vkvideo.ru/video-…">
        <div class="help" id="vkind">${esc(vidKind(st.video))}</div></div>
      <div class="field"><label class="mono">таймкоды — каждый с новой строки</label>
        <textarea data-lk="timecodes" rows="8" placeholder="0:00 Вступление&#10;3:15 Что такое продюсирование&#10;12:40 Кто такой продюсер">${esc(tcText(st.timecodes))}</textarea>
        <div class="help" id="tcinfo">Распознано таймкодов: ${(st.timecodes || []).length}. Формат: <code>0:00 Название</code> или <code>1:02:30 Название</code> — на сайте по клику видео перемотается.</div></div>
      <div class="field"><label class="mono">конспект под видео (необязательно)</label>
        <textarea data-lk="notes" rows="8" placeholder="Пусто — под видео будут только таймкоды">${esc(toText(st.notes))}</textarea>
        <div class="help">${HELP}</div></div>
      <div class="actions"><button class="btn sm ghost danger" type="button" data-act="dell">Удалить шаг</button></div>`;
  };

  /* ---------- новости ---------- */
  const newsOrder = () => S.data.news.map((n, i) => ({ n, i })).sort((a, b) => (b.n.pin - a.n.pin) || String(b.n.date).localeCompare(String(a.n.date)));
  const drawNews = () => {
    const N = S.data.news, ord = newsOrder();
    if (S.n !== null && !N[S.n]) S.n = null;
    if (S.n === null && ord.length) S.n = ord[0].i;
    adm.innerHTML = `
      <aside class="card alist"><span class="mono lab">записи · ${N.length}</span>
        ${ord.map(({ n, i }) => listItem(i, i === S.n, (n.pin ? '📌 ' : '') + String(n.date || '').slice(5).split('-').reverse().join('.'), n.title)).join('')}
        <button class="btn sm ghost add" type="button" data-act="addn">+ Запись</button>
      </aside>
      <div class="card aed" id="aed"></div>`;
    const n = N[S.n];
    if (!n) { $('#aed').innerHTML = '<div class="empty">Новостей пока нет. Нажми «+ Запись».</div>'; return; }
    const tags = [...new Set(N.map((x) => x.tag).filter(Boolean))];
    $('#aed').innerHTML = `
      <div class="aed-h"><span class="mono">новость</span><a class="btn sm ghost" href="news.html#${encodeURIComponent(n.id)}" target="_blank" rel="noopener">Открыть на сайте ↗</a></div>
      <div class="field"><label class="mono">заголовок</label><input data-nk="title" value="${esc(n.title)}"></div>
      <div class="arow">
        <div class="field"><label class="mono">рубрика</label><input data-nk="tag" value="${esc(n.tag)}" list="tags"><datalist id="tags">${tags.map((x) => `<option value="${esc(x)}">`).join('')}</datalist></div>
        <div class="field"><label class="mono">дата</label><input type="date" data-nk="date" value="${esc(n.date)}"></div>
      </div>
      <label class="chk"><input type="checkbox" data-nk="pin" ${n.pin ? 'checked' : ''}> Закрепить сверху</label>
      <div class="field"><label class="mono">коротко — видно в ленте</label><textarea data-nk="lead" rows="3" style="min-height:0">${esc(n.lead)}</textarea></div>
      <div class="field"><label class="mono">полный текст — по кнопке «Читать полностью»</label><textarea data-nk="body" rows="10">${esc(toText(n.body))}</textarea><div class="help">${HELP}</div></div>
      <div class="actions"><button class="btn sm ghost danger" type="button" data-act="deln">Удалить запись</button></div>`;
  };

  /* ---------- участники ---------- */
  const ST = { pending: 'ждёт одобрения', approved: 'доступ открыт', denied: 'отклонён', revoked: 'доступ отозван' };
  const drawMembers = async () => {
    if (!S.members) adm.innerHTML = '<div class="empty" style="grid-column:1/-1">Загружаем участников…</div>';
    try { S.members = await F.call('/api/members'); } catch (e) { adm.innerHTML = `<div class="empty" style="grid-column:1/-1">${esc(e.message)}</div>`; return; }
    if (S.tab !== 'members') return;
    const M = S.members, cnt = (s) => M.filter((u) => u.s === s).length;
    adm.innerHTML = `
      <div class="card aed mem" style="grid-column:1/-1">
        <div class="aed-h"><span class="mono">участники · ${M.length} · открыт доступ ${cnt('approved')} · ждут ${cnt('pending')}</span><button class="btn sm ghost" type="button" data-act="reload">Обновить</button></div>
        ${M.length ? `<div class="lrows">${M.map((u) => `
          <div class="lrow mrow s-${esc(u.s)}">
            <div class="lt"><b>${esc(u.n)}${u.un ? ` <span class="un">@${esc(u.un)}</span>` : ''}</b><small>${ST[u.s] || esc(u.s)}${u.c ? ` · <span class="mono">${esc(u.c)}</span>` : ''}${u.s === 'approved' ? ` · устройств ${u.d || 0} из 2` : ''}${u.at ? ` · ${new Date(u.at).toLocaleDateString('ru-RU')}` : ''}</small></div>
            <div class="mact">
              ${u.s === 'pending' ? `<button class="btn sm" data-ma="approve" data-id="${u.id}">Выдать код</button><button class="btn sm ghost" data-ma="deny" data-id="${u.id}">Отклонить</button>` : ''}
              ${u.s === 'approved' ? `<button class="btn sm ghost" data-ma="reset" data-id="${u.id}" ${u.d ? '' : 'disabled'}>Сбросить устройства</button><button class="btn sm ghost danger" data-ma="revoke" data-id="${u.id}">Отозвать</button>` : ''}
              ${u.s === 'denied' || u.s === 'revoked' ? `<button class="btn sm ghost" data-ma="approve" data-id="${u.id}">Выдать новый код</button>` : ''}
            </div></div>`).join('')}</div>` : '<div class="empty">Пока никто не запросил доступ. Отправь людям ссылку на бота.</div>'}
      </div>`;
  };
  const MA = { approve: 'Выдать код? Бот сразу пришлёт его участнику.', deny: 'Отклонить заявку?', revoke: 'Отозвать доступ? Код перестанет работать на всех устройствах.', reset: 'Сбросить устройства? Участник сможет войти заново на двух новых устройствах.' };

  /* ---------- события ---------- */
  adm.addEventListener('input', (e) => {
    const el = e.target, val = el.type === 'checkbox' ? el.checked : el.value;
    if (el.dataset.k) {
      const m = S.data.tracks[S.m], k = el.dataset.k;
      if (k === 'main') { if (val) m.main = true; else delete m.main; }
      else if (k === 'tags') m.tags = val.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 4);
      else m[k] = val;
      dirty('tracks');
    } else if (el.dataset.lk) {
      const st = S.data.tracks[S.m].steps[S.l], k = el.dataset.lk;
      if (k === 'notes') { const b = fromText(val); st.notes = b.length ? b : null; }
      else if (k === 'timecodes') { st.timecodes = parseTC(val); const h = $('#tcinfo'); if (h) h.firstChild.textContent = `Распознано таймкодов: ${st.timecodes.length}. `; }
      else if (k === 'video') { st.video = val.trim(); const h = $('#vkind'); if (h) h.textContent = vidKind(val); }
      else st[k] = val;
      dirty('tracks');
    } else if (el.dataset.nk) {
      const n = S.data.news[S.n], k = el.dataset.nk;
      n[k] = k === 'body' ? fromText(val) : val;
      dirty('news');
    }
  });
  adm.addEventListener('change', (e) => {
    if (!e.target.dataset.k && !e.target.dataset.nk) return;
    const a = $('.alist', adm);
    if (!a) return;
    const y = a.scrollTop;
    if (S.tab === 'tracks') {
      const G = S.data.tracks, i = S.m, it = a.querySelectorAll('.it')[i];
      if (it) { $('.mono', it).textContent = String(i + 1).padStart(2, '0') + (G[i].main ? ' ★' : ''); $('b', it).textContent = G[i].title || 'Без названия'; }
    } else drawNews();
    a.scrollTop = y;
  });
  adm.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    const d = b.dataset, G = S.data.tracks, N = S.data.news;
    const swap = (arr, i, j) => { [arr[i], arr[j]] = [arr[j], arr[i]]; };
    if (d.pick !== undefined) { if (S.tab === 'tracks') { S.m = +d.pick; S.l = null; } else S.n = +d.pick; draw(); }
    else if (d.up !== undefined) { swap(G, +d.up, +d.up - 1); S.m = +d.up - 1; S.l = null; dirty('tracks'); draw(); }
    else if (d.down !== undefined) { swap(G, +d.down, +d.down + 1); S.m = +d.down + 1; S.l = null; dirty('tracks'); draw(); }
    else if (d.open !== undefined) { S.l = +d.open; drawLesson(); }
    else if (d.lup !== undefined) { swap(G[S.m].steps, +d.lup, +d.lup - 1); dirty('tracks'); drawModule(); }
    else if (d.ldown !== undefined) { swap(G[S.m].steps, +d.ldown, +d.ldown + 1); dirty('tracks'); drawModule(); }
    else if (d.ldel !== undefined) {
      const les = G[S.m].steps[+d.ldel];
      if (confirm(`Удалить шаг «${les.title}»?`)) { G[S.m].steps.splice(+d.ldel, 1); dirty('tracks'); drawModule(); }
    } else if (d.act === 'addm') {
      G.push({ id: uid('t'), title: 'Новое направление', desc: '', tags: [], steps: [] });
      S.m = G.length - 1; S.l = null; dirty('tracks'); draw(); const t = $('#aed input[data-k=title]'); t.focus(); t.select();
    } else if (d.act === 'delm') {
      const m = G[S.m];
      if (confirm(`Удалить направление «${m.title}» вместе со всеми шагами (${m.steps.length})?`)) { G.splice(S.m, 1); S.m = Math.max(0, S.m - 1); dirty('tracks'); draw(); }
    } else if (d.act === 'addl') {
      G[S.m].steps.push({ id: uid('s'), num: `1.${G[S.m].steps.length + 1}`, title: 'Новый шаг', video: '', timecodes: [], notes: null });
      S.l = G[S.m].steps.length - 1; dirty('tracks'); drawLesson(); const t = $('#aed input[data-lk=title]'); t.focus(); t.select();
    } else if (d.act === 'dell') {
      const les = G[S.m].steps[S.l];
      if (confirm(`Удалить шаг «${les.title}»?`)) { G[S.m].steps.splice(S.l, 1); S.l = null; dirty('tracks'); drawModule(); }
    } else if (d.act === 'back') { S.l = null; drawModule(); }
    else if (d.act === 'addn') {
      N.push({ id: uid('n'), date: today(), tag: 'Новости', pin: false, title: 'Новая запись', lead: '', body: [] });
      S.n = N.length - 1; dirty('news'); draw(); const t = $('#aed input[data-nk=title]'); t.focus(); t.select();
    } else if (d.act === 'deln') {
      if (confirm(`Удалить запись «${N[S.n].title}»?`)) { N.splice(S.n, 1); S.n = null; dirty('news'); draw(); }
    } else if (d.act === 'reload') { drawMembers(); }
    else if (d.ma) {
      if (!confirm(MA[d.ma])) return;
      b.disabled = true;
      try { await F.call('/api/members', { method: 'POST', body: JSON.stringify({ action: d.ma, id: +d.id }) }); flash('Готово'); }
      catch (x) { flash(x.message, true); }
      drawMembers();
    }
  });

  /* ---------- старт ---------- */
  Promise.all([F.call('/api/data?f=tracks'), F.call('/api/data?f=news')]).then(([g, n]) => {
    S.data = { tracks: g, news: n };
    const q = new URLSearchParams(location.hash.slice(1));
    if (q.get('t')) { const i = g.findIndex((m) => m.id === q.get('t')); if (i >= 0) { S.m = i; const l = g[i].steps.findIndex((x) => x.id === q.get('s')); S.l = l >= 0 ? l : null; } }
    draw();
  }).catch((e) => { adm.innerHTML = `<div class="empty" style="grid-column:1/-1">Не удалось загрузить данные: ${esc(e.message)}</div>`; });
})();
