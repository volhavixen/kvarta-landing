/* Общая логика макетов «Кварта»: даты, расчёт подписки, форма. Дизайн в каждом макете свой. */
(function () {
  'use strict';
  var MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  var WD = ['воскресенье','понедельник','вторник','среду','четверг','пятницу','субботу'];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  /* ---------- Минское время (UTC+3 без перехода) ---------- */
  function minskNow() {
    var p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Minsk', hour12: false, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }).formatToParts(new Date());
    var o = {}; p.forEach(function (x) { o[x.type] = +x.value; });
    return new Date(o.year, o.month - 1, o.day, o.hour % 24, o.minute);
  }

  /* ---------- Ближайшая обжарка: четверг (сегодня, если сегодня четверг) ---------- */
  function isoWeek(d) {
    var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var n = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - n);
    var y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil(((t - y0) / 864e5 + 1) / 7);
  }
  var now = minskNow();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var roast = new Date(today); roast.setDate(today.getDate() + ((4 - today.getDay() + 7) % 7));
  var add = function (d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; };
  var long = function (d) { return d.getDate() + ' ' + MONTHS[d.getMonth()]; };
  var short = function (d) { return pad(d.getDate()) + '.' + pad(d.getMonth() + 1); };
  var diff = Math.round((roast - today) / 864e5);
  var when = diff === 0 ? 'сегодня' : diff === 1 ? 'завтра' : 'в четверг';

  var map = {
    date: long(roast), dm: short(roast), when: when,
    batch: '№ ' + pad(isoWeek(roast)) + '-' + String(roast.getFullYear()).slice(2),
    batchnum: pad(isoWeek(roast)) + '-' + String(roast.getFullYear()).slice(2),
    fri: long(add(roast, 1)), fridm: short(add(roast, 1)),
    sun: long(add(roast, 3)), sundm: short(add(roast, 3)),
    d1: short(add(roast, 1)), d2: short(add(roast, 2)), d3: short(add(roast, 3)),
    year: String(roast.getFullYear())
  };
  $$('[data-roast]').forEach(function (el) { var v = map[el.getAttribute('data-roast')]; if (v != null) el.textContent = v; });

  /* ---------- Расчёт подписки: честная разница разово vs подписка ---------- */
  var SUB = 54;
  $$('[data-calc]').forEach(function (root) {
    var a = $('[data-calc-a]', root), b = $('[data-calc-b]', root);
    function run() {
      var once = +a.value + +b.value, d = once - SUB;
      $('[data-calc-once]', root).textContent = once;
      $('[data-calc-sub]', root).textContent = SUB;
      var dEl = $('[data-calc-diff]', root), note = $('[data-calc-note]', root);
      dEl.textContent = (d > 0 ? '−' : d < 0 ? '+' : '') + Math.abs(d);
      root.setAttribute('data-calc-state', d > 0 ? 'save' : d < 0 ? 'more' : 'same');
      note.textContent = d > 0
        ? 'Подписка дешевле на ' + d + ' BYN в месяц, это ' + d * 12 + ' BYN за год. Доставка бесплатна и так, и так: обе суммы выше 50 BYN.'
        : d === 0
          ? 'Цена одинаковая. Разница в том, что заказывать каждый месяц заново не нужно.'
          : 'С этой парой подписка дороже на ' + (-d) + ' BYN: цена у неё одна на любые сорта. Выгода здесь только в том, что не нужно каждый месяц оформлять заказ.';
    }
    a.addEventListener('change', run); b.addEventListener('change', run); run();
  });

  /* ---------- Телефон (Беларусь) ---------- */
  var CODES = ['25', '29', '33', '44', '17'];
  function national(raw) {
    var d = String(raw).replace(/\D/g, '');
    if (d.indexOf('375') === 0) d = d.slice(3);
    if (d.indexOf('80') === 0) d = d.slice(2);
    return d.slice(0, 9);
  }
  function fmt(n) {
    if (!n) return '';
    var s = '+375 (' + n.slice(0, 2);
    if (n.length >= 2) s += ')';
    if (n.length > 2) s += ' ' + n.slice(2, 5);
    if (n.length > 5) s += '-' + n.slice(5, 7);
    if (n.length > 7) s += '-' + n.slice(7, 9);
    return s;
  }
  function checkPhone(raw) {
    var n = national(raw);
    if (!n) return 'Введите номер, чтобы менеджер мог перезвонить.';
    if (n.length >= 2 && CODES.indexOf(n.slice(0, 2)) < 0) return 'Код «' + n.slice(0, 2) + '» не белорусский. Мобильные у нас начинаются с 25, 29, 33 или 44.';
    if (n.length < 9) return 'Не хватает ' + (9 - n.length) + ' ' + (9 - n.length === 1 ? 'цифры' : 'цифр') + '. Номер выглядит так: +375 29 123-45-67.';
    return '';
  }

  /* ---------- Когда перезвонят (по Минску) ---------- */
  function callbackText() {
    var n = minskNow(), dow = n.getDay(), h = n.getHours() + n.getMinutes() / 60;
    var open = function (d) { return d === 0 || d === 6 ? [10, 18] : [8, 20]; };
    var o = open(dow);
    if (h >= o[0] && h < o[1] - 0.5) return 'в течение 30 минут: сейчас мастерская работает.';
    var day = dow, add1 = 0;
    if (h < o[0]) { /* до открытия: сегодня */ } else { day = (dow + 1) % 7; add1 = 1; }
    var t = open(day)[0] + ':00';
    return (add1 ? 'завтра' : 'сегодня') + ' после ' + t + '.';
  }

  /* ---------- Форма ---------- */
  var form = $('#lead');
  if (form) {
    var phone = $('[name=phone]', form), err = $('[data-phone-error]', form), state = 'idle', btn = $('[data-submit]', form);
    var label = $('[data-submit-label]', form) || btn, baseLabel = label.textContent;
    var show = function (name) { $$('[data-show]', form).forEach(function (el) { el.hidden = el.getAttribute('data-show') !== name; }); };
    var setErr = function (m) {
      err.textContent = m; err.hidden = !m;
      phone.classList.toggle('is-invalid', !!m);
      phone.setAttribute('aria-invalid', m ? 'true' : 'false');
    };
    phone.addEventListener('input', function () { var n = national(phone.value); phone.value = fmt(n); if (!err.hidden) setErr(checkPhone(phone.value)); });
    phone.addEventListener('blur', function () { if (phone.value) setErr(checkPhone(phone.value)); });
    var failFlag = function () { try { return localStorage.getItem('kv-fail') === '1' || /[?&]fail=1/.test(location.search); } catch (e) { return false; } };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (state === 'loading') return; /* двойное нажатие */
      var m = checkPhone(phone.value);
      if (m) { setErr(m); phone.focus(); return; }
      setErr('');
      state = 'loading'; btn.disabled = true; label.textContent = 'Отправляем…'; form.setAttribute('data-state', 'loading');
      setTimeout(function () {
        btn.disabled = false; label.textContent = baseLabel;
        if (failFlag()) { state = 'error'; show('error'); form.setAttribute('data-state', 'error'); return; }
        state = 'success'; show('success'); form.setAttribute('data-state', 'success');
        var c = $('[data-callback]', form); if (c) c.textContent = callbackText();
        var ph = $('[data-echo-phone]', form); if (ph) ph.textContent = phone.value;
        var nm = $('[data-echo-name]', form); if (nm) nm.textContent = ($('[name=name]', form).value || '').trim();
      }, 1300);
    });
    $$('[data-retry]', form).forEach(function (b) { b.addEventListener('click', function () { state = 'idle'; show('form-body'); form.setAttribute('data-state', 'idle'); }); });
    $$('[data-reset]', form).forEach(function (b) { b.addEventListener('click', function () { form.reset(); state = 'idle'; show('form-body'); form.setAttribute('data-state', 'idle'); }); });

    /* кнопки из блоков выше предвыбирают тип заявки и подставляют сорт */
    $$('[data-pick-type]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        var r = $('[name=type][value=' + b.getAttribute('data-pick-type') + ']', form); if (r) r.checked = true;
        var note = b.getAttribute('data-pick-note'), c = $('[name=comment]', form);
        if (note && c && !c.value) c.value = 'Интересует: ' + note;
        if (b.tagName === 'A') return; /* якорь сам прокрутит */
        e.preventDefault(); $('#form').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  /* ---------- Панель макета (не часть дизайна) ---------- */
  var bar = document.createElement('div');
  bar.setAttribute('style', 'font:12px/1.2 ui-monospace,Menlo,monospace;background:#1b1b1b;color:#ddd;padding:8px 12px;display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;position:relative;z-index:99');
  var cur = (location.pathname.split('/').pop() || 'a.html').replace('.html', '');
  bar.innerHTML = '<a href="index.html" style="color:#9cf">структура</a>' +
    ['a', 'b', 'c', 'd'].map(function (v) { return '<a href="' + v + '.html" style="color:' + (v === cur ? '#fff;font-weight:700' : '#999') + '">' + v.toUpperCase() + '</a>'; }).join('') +
    '<label style="margin-left:auto;cursor:pointer"><input type="checkbox" id="kvfail"> имитировать сбой отправки</label>';
  document.body.insertBefore(bar, document.body.firstChild);
  var cb = $('#kvfail', bar);
  try { cb.checked = localStorage.getItem('kv-fail') === '1'; } catch (e) {}
  cb.addEventListener('change', function () { try { localStorage.setItem('kv-fail', cb.checked ? '1' : '0'); } catch (e) {} });
})();
