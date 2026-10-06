(function () {
  'use strict';

  /* ==========================================================================
     Core behavior (build-contract-v2 section 7.1): nav, active link, sticky
     bar, layout preview, FAQ, inquiry form, session prefill, year stamp.
     No reveal, header-scroll, sound, zoom or doodle logic lives here.
     ========================================================================== */

  var DESKTOP_QUERY = '(min-width: 64em)';
  var SECTION_ROOT_MARGIN = '-45% 0px -50% 0px';
  var DEFAULT_CAPTION = 'Your moments';
  var ALLOWED_SESSIONS = Object.freeze(['two-hour', 'three-hour']);
  var INQUIRY_EMAIL = 'iteraphotobooth@gmail.com';
  var MOTION_STORAGE_KEY = 'itera-motion-paused';

  var NAME_MIN = 2;
  var NAME_MAX = 80;
  var VENUE_MIN = 2;
  var VENUE_MAX = 120;
  var MESSAGE_MAX = 1000;
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var PHONE_PATTERN = /^[0-9+()\-\s]{7,20}$/;
  var DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

  var MAILTO_MAX_LENGTH = 1800; /* some mail handlers drop longer mailto links */
  var FALLBACK_HELP = 'If nothing opened, write to ' + INQUIRY_EMAIL + ', message us on Messenger or call 0994 575 5823.';
  var MESSAGES = Object.freeze({
    name: 'Please enter your name.',
    email: 'Please enter a valid email address.',
    phone: 'Please enter a valid phone number.',
    eventType: 'Please choose an event type.',
    eventDate: 'Please choose today or a future date.',
    venue: 'Please tell us the venue.',
    message: 'Message is too long (1000 characters max).',
    fixFields: 'Please fix the highlighted fields.',
    success: 'Opening your email app with your inquiry ready to send. Please press send there. ' + FALLBACK_HELP,
    trimmed: ' Your message was long, so we shortened it in the email. Please paste the rest before you send, or message us on Messenger.'
  });

  /* Validated fields, in DOM order. Optional ones pass when empty. */
  var FIELD_KEYS = Object.freeze([
    'name', 'email', 'phone', 'event-type', 'event-date', 'venue', 'message'
  ]);

  /* ==========================================================================
     Small DOM helpers
     ========================================================================== */

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function listenMedia(query, handler) {
    if (typeof window.matchMedia !== 'function') return;
    var mql = window.matchMedia(query);
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handler);
    } else if (typeof mql.addListener === 'function') {
      mql.addListener(handler);
    }
  }

  function hasObserver() {
    return typeof window.IntersectionObserver === 'function';
  }

  /* ==========================================================================
     Pure helpers
     ========================================================================== */

  function pad2(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function localDateString(date) {
    return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
  }

  function result(valid, message) {
    return Object.freeze({ valid: valid, message: valid ? '' : message });
  }

  function lengthBetween(text, min, max) {
    return text.length >= min && text.length <= max;
  }

  var RULES = Object.freeze({
    name: function (value) {
      return result(lengthBetween(value.trim(), NAME_MIN, NAME_MAX), MESSAGES.name);
    },
    email: function (value) {
      return result(EMAIL_PATTERN.test(value.trim()), MESSAGES.email);
    },
    phone: function (value) {
      var text = value.trim();
      return result(text === '' || PHONE_PATTERN.test(text), MESSAGES.phone);
    },
    'event-type': function (value) {
      return result(value.trim() !== '', MESSAGES.eventType);
    },
    'event-date': function (value) {
      var text = value.trim();
      if (text === '') return result(true, '');
      var ok = DATE_PATTERN.test(text) && text >= localDateString(new Date());
      return result(ok, MESSAGES.eventDate);
    },
    venue: function (value) {
      return result(lengthBetween(value.trim(), VENUE_MIN, VENUE_MAX), MESSAGES.venue);
    },
    message: function (value) {
      return result(value.length <= MESSAGE_MAX, MESSAGES.message);
    }
  });

  function validateField(name, value) {
    var rule = RULES[name];
    var text = typeof value === 'string' ? value : '';
    return rule ? rule(text) : result(true, '');
  }

  /* ==========================================================================
     Mobile nav toggle
     ========================================================================== */

  function initNav() {
    var nav = qs('[data-nav]');
    var toggle = qs('[data-nav-toggle]');
    var menu = qs('[data-nav-menu]');
    if (!nav || !toggle || !menu) return;

    function isOpen() {
      return nav.classList.contains('is-open');
    }

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    toggle.addEventListener('click', function () {
      setOpen(!isOpen());
    });

    menu.addEventListener('click', function (event) {
      var target = event.target;
      if (target && typeof target.closest === 'function' && target.closest('.nav__link, .nav__cta')) {
        setOpen(false);
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' || !isOpen()) return;
      setOpen(false);
      toggle.focus();
    });

    document.addEventListener('click', function (event) {
      if (isOpen() && !nav.contains(event.target)) setOpen(false);
    });

    listenMedia(DESKTOP_QUERY, function (event) {
      if (event.matches) setOpen(false);
    });
  }

  /* ==========================================================================
     Active-section nav highlight
     ========================================================================== */

  function initActiveNav() {
    var sections = qsa('[data-section]');
    var links = qsa('.nav__link');
    if (!hasObserver() || sections.length === 0 || links.length === 0) return;

    function setActive(id) {
      links.forEach(function (link) {
        var active = id !== '' && link.getAttribute('href') === '#' + id;
        link.classList.toggle('is-active', active);
        if (active) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id || '');
      });
    }, { rootMargin: SECTION_ROOT_MARGIN });

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ==========================================================================
     Sticky "Book now" bar (visible after the hero, hidden over the inquiry)
     ========================================================================== */

  function initStickyBar() {
    var bar = qs('[data-sticky-bar]');
    var hero = qs('#hero');
    var inquiry = qs('#inquiry');
    if (!bar) return;

    function show(visible) {
      bar.classList.toggle('is-visible', visible);
      if (visible) {
        bar.removeAttribute('aria-hidden');
      } else {
        bar.setAttribute('aria-hidden', 'true');
      }
    }

    if (!hasObserver() || !hero || !inquiry) {
      show(true);
      return;
    }

    var state = Object.freeze({ heroVisible: true, inquiryVisible: false });
    show(false);

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.target === hero) {
          state = Object.freeze({ heroVisible: entry.isIntersecting, inquiryVisible: state.inquiryVisible });
        } else if (entry.target === inquiry) {
          state = Object.freeze({ heroVisible: state.heroVisible, inquiryVisible: entry.isIntersecting });
        }
      });
      show(!state.heroVisible && !state.inquiryVisible);
    });

    observer.observe(hero);
    observer.observe(inquiry);
  }

  /* ==========================================================================
     Layout preview (2-frame / 4-frame tabs, strip color, caption)
     ========================================================================== */

  function initLayoutTabs(root) {
    var tabs = qsa('[data-layout-tab]', root);
    var panels = qsa('[data-layout-panel]', root);
    if (tabs.length === 0) return;

    function select(tab, moveFocus) {
      var key = tab.getAttribute('data-layout-tab');
      tabs.forEach(function (item) {
        var selected = item === tab;
        item.setAttribute('aria-selected', selected ? 'true' : 'false');
        item.setAttribute('tabindex', selected ? '0' : '-1');
        item.classList.toggle('is-selected', selected);
      });
      panels.forEach(function (panel) {
        panel.hidden = panel.getAttribute('data-layout-panel') !== key;
      });
      if (moveFocus) tab.focus();
    }

    function nextIndex(current, keyName) {
      var last = tabs.length - 1;
      if (keyName === 'ArrowRight') return current === last ? 0 : current + 1;
      if (keyName === 'ArrowLeft') return current === 0 ? last : current - 1;
      if (keyName === 'Home') return 0;
      if (keyName === 'End') return last;
      return -1;
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () {
        select(tab, false);
      });
      tab.addEventListener('keydown', function (event) {
        var target = nextIndex(index, event.key);
        if (target < 0) return;
        event.preventDefault();
        select(tabs[target], true);
      });
    });
  }

  function initStripThemes(root) {
    var buttons = qsa('[data-strip-theme]', root);
    var strips = qsa('[data-strip]', root);
    if (buttons.length === 0) return;

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var theme = button.getAttribute('data-strip-theme');
        if (!theme) return;
        strips.forEach(function (strip) {
          strip.setAttribute('data-theme', theme);
        });
        buttons.forEach(function (item) {
          var selected = item === button;
          item.setAttribute('aria-pressed', selected ? 'true' : 'false');
          item.classList.toggle('is-selected', selected);
        });
      });
    });
  }

  function initStripCaption(root) {
    var input = qs('[data-strip-caption-input]', root);
    if (!input) return;
    var captions = qsa('[data-strip-caption]', root);

    input.addEventListener('input', function () {
      var text = input.value.trim() || DEFAULT_CAPTION;
      captions.forEach(function (caption) {
        caption.textContent = text;
      });
    });
  }

  function initLayouts() {
    var root = qs('[data-layouts]');
    if (!root) return;
    initLayoutTabs(root);
    initStripThemes(root);
    initStripCaption(root);
  }

  /* ==========================================================================
     FAQ: one open at a time
     ========================================================================== */

  function initFaq() {
    var root = qs('[data-faq]');
    if (!root) return;
    var items = qsa('details', root);

    items.forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) return;
        items.forEach(function (other) {
          if (other !== item && other.open) other.open = false;
        });
      });
    });
  }

  /* ==========================================================================
     Package CTA prefill: [data-session-cta] -> #field-session
     ========================================================================== */

  function initSessionPrefill() {
    var links = qsa('[data-session-cta]');
    var select = qs('#field-session');
    if (links.length === 0 || !select) return;

    links.forEach(function (link) {
      link.addEventListener('click', function () {
        var value = link.getAttribute('data-session-cta');
        if (ALLOWED_SESSIONS.indexOf(value) !== -1) select.value = value;
      });
    });
  }

  /* ==========================================================================
     Year stamp: optional [data-year] element (no year is hard-coded)
     ========================================================================== */

  function initYear() {
    var year = String(new Date().getFullYear());
    qsa('[data-year]').forEach(function (node) {
      node.textContent = year;
    });
  }

  /* ==========================================================================
     Inquiry form
     ========================================================================== */

  /* ==========================================================================
     Mailto message (no backend: the inquiry opens in the visitor's email app)
     ========================================================================== */

  function selectedLabel(form, id) {
    var select = qs('#' + id, form);
    if (!select || select.value === '') return '';
    var option = select.options[select.selectedIndex];
    return option ? option.text.trim() : '';
  }

  function readableDate(value) {
    if (!DATE_PATTERN.test(value)) return '';
    var parts = value.split('-');
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function fieldValue(form, id) {
    var control = qs('#' + id, form);
    return control ? control.value.trim() : '';
  }

  function checkedAddOns(form) {
    return qsa('input[name="addons"]:checked', form).map(function (box) {
      var label = box.parentNode ? box.parentNode.textContent : box.value;
      return label.trim();
    });
  }

  function buildMailBody(form) {
    var addOns = checkedAddOns(form);
    var lines = [
      'Hello Itera Collectives,',
      '',
      'I would like to ask about booking the photobooth.',
      '',
      'Name: ' + fieldValue(form, 'field-name'),
      'Email: ' + fieldValue(form, 'field-email'),
      'Phone: ' + (fieldValue(form, 'field-phone') || 'Not provided'),
      'Event type: ' + selectedLabel(form, 'field-event-type'),
      'Event date: ' + (readableDate(fieldValue(form, 'field-event-date')) || 'Not sure yet'),
      'Venue: ' + fieldValue(form, 'field-venue'),
      'Session length: ' + (selectedLabel(form, 'field-session') || 'Not sure yet'),
      'Add ons: ' + (addOns.length > 0 ? addOns.join(', ') : 'None'),
      ''
    ];
    var message = fieldValue(form, 'field-message');
    if (message !== '') lines.push('Message:', message, '');
    lines.push('Thank you!');
    return lines.join('\r\n');
  }

  function mailtoUrl(subject, body) {
    return 'mailto:' + INQUIRY_EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
  }

  /* Returns the link and whether the body had to be shortened to stay under the length cap. */
  function buildMailto(form) {
    var subject = 'Photobooth inquiry: ' + selectedLabel(form, 'field-event-type');
    var body = buildMailBody(form);
    var url = mailtoUrl(subject, body);
    var cut = body.length;
    while (url.length > MAILTO_MAX_LENGTH && cut > 0) {
      cut = Math.max(0, cut - Math.max(20, url.length - MAILTO_MAX_LENGTH));
      url = mailtoUrl(subject, body.slice(0, cut));
    }
    return { url: url, trimmed: cut < body.length };
  }

  function ensureErrorNode(wrapper, key) {
    var existing = qs('#error-' + key, wrapper);
    if (existing) return existing;
    var node = document.createElement('p');
    node.className = 'form__error';
    node.id = 'error-' + key;
    node.hidden = true;
    wrapper.appendChild(node);
    return node;
  }

  function getFieldParts(form, key) {
    var wrapper = qs('[data-field="' + key + '"]', form);
    var control = qs('#field-' + key, form);
    if (!wrapper || !control) return null;
    var error = ensureErrorNode(wrapper, key);
    var baseDescribedBy = (control.getAttribute('aria-describedby') || '')
      .split(/\s+/)
      .filter(function (id) { return id && id !== error.id; });
    return { key: key, wrapper: wrapper, control: control, error: error, baseDescribedBy: baseDescribedBy };
  }

  /* Hint ids stay on the control; the error id is added only while invalid. */
  function writeDescribedBy(parts, includeError) {
    var ids = includeError ? parts.baseDescribedBy.concat(parts.error.id) : parts.baseDescribedBy;
    if (ids.length === 0) {
      parts.control.removeAttribute('aria-describedby');
      return;
    }
    parts.control.setAttribute('aria-describedby', ids.join(' '));
  }

  function renderFieldState(parts, outcome) {
    parts.wrapper.classList.toggle('is-invalid', !outcome.valid);
    if (outcome.valid) {
      parts.control.removeAttribute('aria-invalid');
      writeDescribedBy(parts, false);
      parts.error.textContent = '';
      parts.error.hidden = true;
      return;
    }
    parts.control.setAttribute('aria-invalid', 'true');
    writeDescribedBy(parts, true);
    parts.error.textContent = outcome.message;
    parts.error.hidden = false;
  }

  function createStatusView(statusEl) {
    function show(state, text) {
      if (!statusEl) return;
      statusEl.setAttribute('data-state', state);
      statusEl.textContent = text; /* element stays rendered so the live region announces the change */
    }
    return Object.freeze({
      show: show,
      focus: function () {
        if (!statusEl) return;
        statusEl.setAttribute('tabindex', '-1');
        statusEl.focus();
      }
    });
  }

  function limitEventDateToToday(form) {
    var input = qs('#field-event-date', form);
    if (input) input.setAttribute('min', localDateString(new Date()));
  }

  function initInquiryForm() {
    var form = qs('form[data-inquiry-form]');
    if (!form) return;

    var fields = FIELD_KEYS.map(function (key) {
      return getFieldParts(form, key);
    }).filter(Boolean);
    var status = createStatusView(qs('#form-status'));
    var fallback = qs('#form-messenger');
    var touched = new Set();

    limitEventDateToToday(form);

    function check(parts) {
      var outcome = validateField(parts.key, parts.control.value);
      renderFieldState(parts, outcome);
      return outcome.valid;
    }

    function highlightFallback() {
      if (fallback) fallback.classList.add('is-highlighted');
    }

    function openEmailApp() {
      var mail = buildMailto(form);
      window.location.href = mail.url;
      status.show('success', MESSAGES.success + (mail.trimmed ? MESSAGES.trimmed : ''));
      status.focus();
      highlightFallback();
    }

    function handleSubmit(event) {
      event.preventDefault();
      var results = fields.map(check);
      var firstInvalid = fields[results.indexOf(false)];
      if (firstInvalid) {
        status.show('error', MESSAGES.fixFields);
        firstInvalid.control.focus();
        return;
      }
      openEmailApp();
    }

    fields.forEach(function (parts) {
      function recheck() {
        if (touched.has(parts.key) || parts.wrapper.classList.contains('is-invalid')) check(parts);
      }
      parts.control.addEventListener('blur', function () {
        touched = new Set(touched).add(parts.key);
        check(parts);
      });
      parts.control.addEventListener('input', recheck);
      parts.control.addEventListener('change', recheck);
    });

    form.addEventListener('submit', handleSubmit);
  }

  /* ==========================================================================
     Bootstrap (each init is isolated so one failure never blocks the rest)
     ========================================================================== */

  function readPausedPreference() {
    try {
      return window.localStorage.getItem(MOTION_STORAGE_KEY) === '1';
    } catch (error) {
      return false;
    }
  }

  function writePausedPreference(paused) {
    try {
      window.localStorage.setItem(MOTION_STORAGE_KEY, paused ? '1' : '0');
    } catch (error) {
      /* storage unavailable: preference lasts for this page view only */
    }
  }

  /* On-page pause for the continuously moving background (WCAG 2.2.2). */
  function initMotionToggle() {
    var button = qs('[data-motion-toggle]');
    if (!button) return;
    var root = document.documentElement;
    function apply(paused, announce) {
      root.classList.toggle('motion-paused', paused);
      button.setAttribute('aria-pressed', paused ? 'true' : 'false');
      if (announce) document.dispatchEvent(new CustomEvent('itera:motion-pause', { detail: { paused: paused } }));
    }
    apply(readPausedPreference(), false);
    button.addEventListener('click', function () {
      var next = !root.classList.contains('motion-paused');
      writePausedPreference(next);
      apply(next, true);
    });
  }

  function safely(task) {
    try {
      task();
    } catch (error) {
      /* a failing enhancement must never break the page */
    }
  }

  function init() {
    [initNav, initActiveNav, initStickyBar, initLayouts, initFaq,
      initSessionPrefill, initYear, initInquiryForm, initMotionToggle].forEach(safely);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
