/* АльтернативаМонтаж — скрипты сайта (все страницы).
   Лайтбокс работ (нативный <dialog>), появление секций при прокрутке,
   мобильное меню, фильтр работ, честная заглушка форм (бэкенд позже),
   предупреждение безопасности в гарантийной форме. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- появление секций при прокрутке ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (n) { io.observe(n); });
  } else {
    reveals.forEach(function (n) { n.classList.add('in'); });
  }

  /* ---------- мобильное меню ---------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('site-nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    });
    nav.addEventListener('click', function (e) {
      // закрыть меню после перехода по ссылке (не по выпадающему пункту)
      if (e.target.closest('a')) {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- выпадающее «Услуги»: закрытие по клику мимо ---------- */
  document.querySelectorAll('details.navdrop').forEach(function (d) {
    document.addEventListener('click', function (e) {
      if (d.open && !d.contains(e.target)) d.open = false;
    });
  });

  /* ---------- лайтбокс (страницы с галереями) ---------- */
  var GALS = {};
  var dataTag = document.getElementById('galleries');
  if (dataTag) {
    try { GALS = JSON.parse(dataTag.textContent); } catch (e) { GALS = {}; }
  }

  var lb = document.getElementById('lightbox');
  var el = {
    title: document.getElementById('lb-title'),
    sub: document.getElementById('lb-sub'),
    count: document.getElementById('lb-count'),
    img: document.getElementById('lb-img'),
    cap: document.getElementById('lb-cap'),
    thumbs: document.getElementById('lb-thumbs'),
    prev: document.getElementById('lb-prev'),
    next: document.getElementById('lb-next'),
    close: document.getElementById('lb-close')
  };
  var cur = null;   // активная галерея
  var idx = 0;      // активный слайд

  function buildThumbs(g) {
    el.thumbs.innerHTML = '';
    g.slides.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'lb__thumb';
      b.setAttribute('aria-label', 'Фото ' + (i + 1));
      var im = document.createElement('img');
      im.src = s.t; im.alt = '';
      im.loading = 'lazy';
      b.appendChild(im);
      b.addEventListener('click', function () { show(i); });
      el.thumbs.appendChild(b);
    });
  }

  function show(i) {
    var n = cur.slides.length;
    idx = ((i % n) + n) % n; // цикл по кругу
    var s = cur.slides[idx];
    el.img.src = s.img;
    el.img.alt = s.cap || cur.title;
    el.cap.textContent = s.cap || '';
    el.count.textContent = (idx + 1) + ' / ' + n;
    var kids = el.thumbs.children;
    for (var k = 0; k < kids.length; k++) {
      kids[k].classList.toggle('is-cur', k === idx);
      if (k === idx) kids[k].scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

  function openGallery(id, start) {
    var g = GALS[id];
    if (!g) return;
    cur = g;
    el.title.textContent = g.title;
    el.sub.textContent = g.date || '';
    buildThumbs(g);
    show(start || 0);
    lb.showModal();
  }

  if (lb) {
    document.querySelectorAll('[data-open]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var start = parseInt(btn.getAttribute('data-idx'), 10) || 0;
        openGallery(btn.getAttribute('data-open'), start);
      });
    });
    el.prev.addEventListener('click', function () { show(idx - 1); });
    el.next.addEventListener('click', function () { show(idx + 1); });
    el.close.addEventListener('click', function () { lb.close(); });

    // клик по подложке закрывает; клики по содержимому — нет
    lb.addEventListener('click', function (e) {
      if (e.target === lb) lb.close();
    });

    // клавиатура
    document.addEventListener('keydown', function (e) {
      if (!lb.open) return;
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* ---------- фильтр работ (страница «Работы») ---------- */
  var filters = document.getElementById('filters');
  if (filters) {
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-cat]');
      if (!b) return;
      filters.querySelectorAll('button').forEach(function (x) { x.classList.toggle('is-on', x === b); });
      var cat = b.getAttribute('data-cat');
      document.querySelectorAll('.case[data-cat]').forEach(function (c) {
        c.classList.toggle('is-hidden', cat !== 'all' && c.getAttribute('data-cat') !== cat);
      });
    });
  }

  /* ---------- формы (честная заглушка) ----------
     Бэкенда ещё нет: не показываем фальшивое «заявка принята».
     Каждая форма со своим элементом .form__msg обрабатывается отдельно. */
  document.querySelectorAll('form.form').forEach(function (form) {
    var msg = form.querySelector('.form__msg');
    if (!msg) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var need = [];
      form.querySelectorAll('[required]').forEach(function (f) {
        var v = (f.type === 'checkbox') ? f.checked : f.value.trim();
        if (!v) need.push(f.closest('label,fieldset').querySelector('span,legend').textContent.trim());
      });
      if (need.length) {
        msg.textContent = 'Заполните обязательные поля: ' + need.join(', ') + '.';
        return;
      }
      msg.textContent = 'Демо-версия: отправка заявок подключается на этапе бэкенда. Пока позвоните нам: +7 (922) 575-85-95.';
    });
  });

  /* ---------- кнопка «наверх» (к хедеру) ---------- */
  var totop = document.createElement('button');
  totop.className = 'totop';
  totop.type = 'button';
  totop.setAttribute('aria-label', 'Перемотать наверх');
  totop.innerHTML = '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M10 4v12M4 10l6-6 6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.appendChild(totop);
  var totopVis = false;
  function totopToggle() {
    var need = window.scrollY > 400;
    if (need !== totopVis) {
      totopVis = need;
      totop.classList.toggle('is-vis', need);
    }
  }
  window.addEventListener('scroll', totopToggle, { passive: true });
  totopToggle();
  totop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* ---------- гарантийная форма: предупреждение об угрозе безопасности ---------- */
  var danger = document.getElementById('danger-check');
  var warn = document.getElementById('danger-warn');
  if (danger && warn) {
    danger.addEventListener('change', function () {
      warn.classList.toggle('is-on', danger.checked);
    });
  }
})();