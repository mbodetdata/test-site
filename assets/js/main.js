/**
 * BM Data — JavaScript principal
 * Léger, sans dépendance externe
 */

(function () {
  'use strict';

  /* ─── Header scroll ─── */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ─── Navigation mobile ─── */
  const navToggle  = document.querySelector('.nav-toggle');
  const siteNav    = document.querySelector('.site-nav');
  const navBackdrop = document.getElementById('nav-backdrop');
  let savedScrollY = 0;

  function openNav() {
    savedScrollY = window.scrollY;
    siteNav.classList.add('nav-open');
    navToggle.classList.add('active');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + savedScrollY + 'px';
    document.body.style.width = '100%';
    if (navBackdrop) navBackdrop.classList.add('active');
    // Désactiver backdrop-filter du header (bug de rendu navigateur au survol)
    if (header) header.classList.add('nav-is-open');
  }

  function closeNav() {
    siteNav.classList.remove('nav-open');
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, savedScrollY);
    if (navBackdrop) navBackdrop.classList.remove('active');
    if (header) header.classList.remove('nav-is-open');
  }

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', () => {
      siteNav.classList.contains('nav-open') ? closeNav() : openNav();
    });

    // Fermer en cliquant sur un lien
    siteNav.querySelectorAll('.nav-link, .nav-mobile-hub').forEach(link => {
      link.addEventListener('click', closeNav);
    });

    // Hover forcé sur le bouton Contact mobile (contourne tous les conflits CSS)
    var navCta = siteNav.querySelector('.nav-link.nav-cta');
    if (navCta) {
      navCta.addEventListener('mouseenter', function () {
        this.style.setProperty('background', 'linear-gradient(135deg, #2bd48f 0%, #22c47a 100%)', 'important');
        this.style.setProperty('color', 'white', 'important');
        this.style.setProperty('filter', 'brightness(1.12)', 'important');
        this.style.setProperty('transform', 'translateY(-2px)', 'important');
        this.style.setProperty('box-shadow', '0 8px 28px rgba(43,212,143,.5)', 'important');
      });
      navCta.addEventListener('mouseleave', function () {
        this.style.removeProperty('background');
        this.style.removeProperty('color');
        this.style.removeProperty('filter');
        this.style.removeProperty('transform');
        this.style.removeProperty('box-shadow');
      });
    }

    // Fermer via le backdrop
    if (navBackdrop) {
      navBackdrop.addEventListener('click', closeNav);
    }

    // Fermer avec Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && siteNav.classList.contains('nav-open')) {
        closeNav();
        navToggle.focus();
      }
    });
  }

  /* ─── Active nav link ─── */
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href !== '/' && currentPath.startsWith(href)) {
      link.classList.add('active');
    } else if (href === '/' && currentPath === '/') {
      link.classList.add('active');
    }
  });

  /* ─── Nav pill indicator (desktop uniquement) ─── */
  (function () {
    var nav  = document.querySelector('.site-nav');
    var pill = document.getElementById('nav-pill');
    if (!nav || !pill) return;

    var links    = Array.from(nav.querySelectorAll('.nav-link:not(.nav-cta)'));
    var pinnedEl = nav.querySelector('.nav-link.active:not(.nav-cta)') || null;
    var currentHovered = null;

    function movePill(el, instant) {
      var navRect = nav.getBoundingClientRect();
      var rect    = el.getBoundingClientRect();
      if (instant) {
        pill.style.transition = 'none';
        requestAnimationFrame(function () { pill.style.transition = ''; });
      }
      pill.style.left   = (rect.left   - navRect.left) + 'px';
      pill.style.top    = (rect.top    - navRect.top)  + 'px';
      pill.style.width  = rect.width   + 'px';
      pill.style.height = rect.height  + 'px';
      pill.classList.add('visible');
    }

    links.forEach(function (link) {
      link.addEventListener('mouseenter', function () {
        currentHovered = link;
        movePill(link);
      });
      link.addEventListener('mouseleave', function () {
        currentHovered = null;
      });
    });

    nav.addEventListener('mouseleave', function () {
      if (pinnedEl) { movePill(pinnedEl); }
      else { pill.classList.remove('visible'); }
    });

    /* Position initiale sur le lien actif */
    if (pinnedEl) {
      setTimeout(function () { movePill(pinnedEl, true); }, 150);
    }

    /* Repositionnement quand le nav se compacte au scroll */
    window.addEventListener('scroll', function () {
      if (pill.classList.contains('visible')) {
        var target = currentHovered || pinnedEl;
        if (target) requestAnimationFrame(function () { movePill(target); });
      }
    }, { passive: true });

    window.addEventListener('resize', function () {
      if (pinnedEl && pill.classList.contains('visible')) {
        requestAnimationFrame(function () { movePill(pinnedEl, true); });
      }
    }, { passive: true });
  }());

  /* ─── Nav cursor glow (desktop) ─── */
  (function () {
    var header = document.querySelector('.site-header');
    if (!header || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.innerWidth < 768) return;

    var glow = document.createElement('div');
    glow.className = 'nav-cursor-glow';
    header.prepend(glow);

    header.addEventListener('mousemove', function (e) {
      var rect = header.getBoundingClientRect();
      glow.style.left    = (e.clientX - rect.left) + 'px';
      glow.style.top     = (e.clientY - rect.top)  + 'px';
      glow.style.opacity = '1';
    });
    header.addEventListener('mouseleave', function () {
      glow.style.opacity = '0';
    });
  }());

  /* ─── FAQ Accordion ─── */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');

      // Fermer tous les autres
      document.querySelectorAll('.faq-item.open').forEach(openItem => {
        if (openItem !== item) {
          openItem.classList.remove('open');
          openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        }
      });

      item.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  /* ─── Timeline Parcours — chemin SVG courbé + accordion ─── */
  (function () {
    var tl = document.querySelector('.timeline');
    if (!tl) return;

    /* ── Construit le chemin SVG bezier reliant les dots ── */
    function buildTimelinePath() {
      var dots = tl.querySelectorAll('.timeline-line');
      if (dots.length < 2) return;

      var isMobile = window.innerWidth < 640;
      var tlRect = tl.getBoundingClientRect();
      var H = tl.scrollHeight;
      var W = tlRect.width;

      /* Amplitude : forte sur desktop pour le S bien visible, nulle sur mobile (trait droit) */
      var amp = isMobile ? 0 : Math.min(W * 0.22, 130);

      /* Centre de chaque dot : top + 1rem (offset CSS) + 9px (demi-dot 18px) */
      var pts = Array.prototype.map.call(dots, function (dot) {
        var r = dot.getBoundingClientRect();
        return {
          x: r.left - tlRect.left + r.width / 2,
          y: r.top - tlRect.top + 25
        };
      });

      /*
       * Arc alterné : les DEUX points de contrôle sont du MÊME côté (sign).
       * Segment 1 → arc à DROITE  | Segment 2 → arc à GAUCHE | etc.
       * Résultat : sinusoïde lisse droite-gauche-droite...
       */
      var d = 'M ' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1);
      for (var i = 1; i < pts.length; i++) {
        var p0 = pts[i - 1], p1 = pts[i];
        var dy = p1.y - p0.y;
        var sign = (i % 2 === 1) ? 1 : -1;
        d += ' C ' + (p0.x + sign * amp).toFixed(1) + ' ' + (p0.y + dy * 0.35).toFixed(1) +
             ', '  + (p1.x + sign * amp).toFixed(1) + ' ' + (p1.y - dy * 0.35).toFixed(1) +
             ', '  + p1.x.toFixed(1) + ' ' + p1.y.toFixed(1);
      }

      var ns  = 'http://www.w3.org/2000/svg';
      var svg = tl.querySelector('.timeline-svg-path');

      if (!svg) {
        svg = document.createElementNS(ns, 'svg');
        svg.classList.add('timeline-svg-path');
        svg.setAttribute('aria-hidden', 'true');

        /* Dégradé */
        var defs = document.createElementNS(ns, 'defs');
        var grad = document.createElementNS(ns, 'linearGradient');
        grad.id = 'tlGrad';
        grad.setAttribute('gradientUnits', 'userSpaceOnUse');
        grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0');
        grad.setAttribute('x2', '0'); grad.setAttribute('y2', String(H));
        [['0%','#2bd48f'],['50%','#4aa8ff'],['100%','#6677ff']].forEach(function (s) {
          var stop = document.createElementNS(ns, 'stop');
          stop.setAttribute('offset', s[0]);
          stop.setAttribute('stop-color', s[1]);
          grad.appendChild(stop);
        });
        defs.appendChild(grad);
        svg.appendChild(defs);

        /* Halo flou */
        var glow = document.createElementNS(ns, 'path');
        glow.classList.add('tl-path-glow');
        glow.setAttribute('fill', 'none');
        glow.setAttribute('stroke', 'rgba(102,119,255,0.13)');
        glow.setAttribute('stroke-width', '10');
        glow.setAttribute('stroke-linecap', 'round');
        svg.appendChild(glow);

        /* Trait principal */
        var main = document.createElementNS(ns, 'path');
        main.classList.add('tl-path-main');
        main.setAttribute('fill', 'none');
        main.setAttribute('stroke', 'url(#tlGrad)');
        main.setAttribute('stroke-width', '2.5');
        main.setAttribute('stroke-linecap', 'round');
        svg.appendChild(main);

        tl.insertBefore(svg, tl.firstChild);
      }

      svg.setAttribute('viewBox', '0 0 ' + W.toFixed(0) + ' ' + H);
      svg.style.height = H + 'px';

      var gGrad = svg.querySelector('#tlGrad');
      if (gGrad) gGrad.setAttribute('y2', String(H));

      var mPath = svg.querySelector('.tl-path-main');
      var gPath = svg.querySelector('.tl-path-glow');
      if (gPath) gPath.setAttribute('d', d);
      if (mPath) {
        mPath.setAttribute('d', d);
        /* Animation draw-in */
        if (mPath.getTotalLength) {
          var len = mPath.getTotalLength();
          mPath.style.transition = 'none';
          mPath.style.strokeDasharray  = len;
          mPath.style.strokeDashoffset = len;
          /* Force reflow puis anime */
          mPath.getBoundingClientRect();
          mPath.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.4,0,.2,1)';
          mPath.style.strokeDashoffset = '0';
        }
      }
    }

    /* ── Accordion ── */
    var toggles = tl.querySelectorAll('.timeline-toggle');
    toggles.forEach(function (btn, idx) {
      var body = btn.nextElementSibling;

      /* Premier item ouvert par défaut */
      if (idx === 0) {
        btn.setAttribute('aria-expanded', 'true');
        body.classList.add('timeline-body--open');
      }

      btn.addEventListener('click', function () {
        var isOpen = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!isOpen));
        body.classList.toggle('timeline-body--open', !isOpen);
        /* Recalculer le chemin après la transition */
        setTimeout(buildTimelinePath, 420);
      });
    });

    /* Construction initiale après fonts/images chargées + délai pour la transition CSS du 1er item ouvert */
    if (document.readyState === 'complete') {
      setTimeout(buildTimelinePath, 450);
    } else {
      window.addEventListener('load', function () { setTimeout(buildTimelinePath, 450); });
    }
    window.addEventListener('resize', buildTimelinePath);
  }());

  /* ─── FAQ filtres par catégorie ─── */
  const faqFilters = document.querySelectorAll('.faq-filter');
  if (faqFilters.length > 0) {
    faqFilters.forEach(filter => {
      filter.addEventListener('click', () => {
        const cat = filter.dataset.category;
        faqFilters.forEach(f => f.classList.remove('active'));
        filter.classList.add('active');

        document.querySelectorAll('.faq-section').forEach(section => {
          if (cat === 'all' || section.dataset.category === cat) {
            section.style.display = '';
          } else {
            section.style.display = 'none';
          }
        });
      });
    });
  }

  /* ─── Filtres Réalisations ─── */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.realisation-card[data-category]');
  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        projectCards.forEach(card => {
          const match = filter === 'tous' || card.dataset.category === filter;
          card.style.display = match ? '' : 'none';
          card.style.opacity = match ? '1' : '0';
        });
      });
    });
  }

  /* ─── Fade-in au scroll (fallback sans motion) ─── */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    document.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
  }

  /* ─── Formulaire contact ─── */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('[type="submit"]');
      const successMsg = document.getElementById('form-success');
      const errorMsg   = document.getElementById('form-error');

      btn.disabled = true;
      btn.textContent = 'Envoi en cours…';

      // Formspree ou Netlify Forms
      const formData = new FormData(contactForm);
      const action = contactForm.getAttribute('action') || '#';

      try {
        if (action === '#') {
          // Demo : simuler succès
          await new Promise(r => setTimeout(r, 800));
          contactForm.style.display = 'none';
          if (successMsg) successMsg.style.display = 'block';
        } else {
          const res = await fetch(action, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
          });
          if (res.ok) {
            contactForm.style.display = 'none';
            if (successMsg) successMsg.style.display = 'block';
          } else {
            throw new Error('Server error');
          }
        }
      } catch {
        btn.disabled = false;
        btn.textContent = 'Envoyer ma demande';
        if (errorMsg) errorMsg.style.display = 'block';
      }
    });
  }

  /* ─── Lien téléphone : tracking optionnel ─── */
  document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.addEventListener('click', () => {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'click_phone', { event_category: 'cta' });
      }
    });
  });

  /* ─── Pré-remplissage formulaire depuis URL ─── */
  const params = new URLSearchParams(window.location.search);
  const serviceParam = params.get('service');
  const serviceSelect = document.getElementById('service');
  if (serviceParam && serviceSelect) {
    const options = serviceSelect.querySelectorAll('option');
    options.forEach(opt => {
      if (opt.value.toLowerCase().includes(serviceParam.replace(/-/g, ' '))) {
        opt.selected = true;
      }
    });
  }
  const auditParam = params.get('audit');
  if (auditParam === '1' && serviceSelect) {
    const options = serviceSelect.querySelectorAll('option');
    options.forEach(opt => {
      if (opt.value.toLowerCase().includes('audit')) {
        opt.selected = true;
      }
    });
  }

  /* ─── Révélation des sections au scroll ─── */
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {

    // Chaque enfant de .section-header apparaît en cascade : eyebrow → h2 → p
    document.querySelectorAll('.section-header').forEach(header => {
      Array.from(header.children).forEach((child, i) => {
        child.classList.add('fade-up');
        child.style.transitionDelay = (i * 0.14) + 's';
      });
    });

    // Blocs entiers qui se révèlent
    ['.cta-banner', '.featured-quote', '.process-steps', '.about-intro-layout', '.contact-layout']
      .forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          if (!el.classList.contains('fade-up')) el.classList.add('fade-up');
        });
      });

    // Stat items en cascade (desktop + mobile)
    document.querySelectorAll('.stats-grid .stat-item').forEach((item, i) => {
      item.classList.add('fade-up');
      item.style.transitionDelay = (i * 0.12) + 's';
    });

    // Observer unique pour tous les éléments fade-up (nouveaux + existants)
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -72px 0px', threshold: 0.1 });

    document.querySelectorAll('.fade-up').forEach(el => revealObserver.observe(el));
  }

  /* ─── Barre de progression au scroll ─── */
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  progressBar.setAttribute('aria-hidden', 'true');
  document.body.prepend(progressBar);
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    progressBar.style.width = (scrolled * 100) + '%';
  }, { passive: true });

  /* ─── Orbes animés dans le hero ─── */
  const hero = document.querySelector('.hero');
  if (hero && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    [1, 2, 3].forEach(i => {
      const orb = document.createElement('div');
      orb.className = `hero-orb hero-orb-${i}`;
      orb.setAttribute('aria-hidden', 'true');
      hero.appendChild(orb);
    });

    /* Indicateur scroll (flèche bas) */
    const scrollHint = document.createElement('div');
    scrollHint.className = 'hero-scroll-hint';
    scrollHint.setAttribute('aria-hidden', 'true');
    scrollHint.innerHTML = '<div class="scroll-mouse"><div class="scroll-wheel"></div></div><span>Défiler</span>';
    hero.appendChild(scrollHint);
    /* Masquer au premier scroll */
    window.addEventListener('scroll', function hideHint() {
      if (window.scrollY > 80) {
        scrollHint.style.opacity = '0';
        window.removeEventListener('scroll', hideHint);
      }
    }, { passive: true });
  }

  /* ─── Compteur animé des statistiques ─── */
  function animateCounter(el) {
    const raw = el.textContent.trim();
    const match = raw.match(/([\d.]+)/);
    if (!match) return;
    const numStr = match[1];
    const target = parseFloat(numStr);
    const suffix = raw.replace(numStr, '');
    const isFloat = numStr.includes('.');
    const decimals = isFloat ? (numStr.split('.')[1] || '').length : 0;
    const duration = 1600;
    const startTime = performance.now();
    el.classList.add('counting');
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = eased * target;
      el.textContent = (isFloat ? value.toFixed(decimals) : Math.round(value)) + suffix;
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = raw;
        el.classList.remove('counting');
      }
    };
    requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const grid = entry.target.closest('.stats-grid');
          const idx = grid ? Array.from(grid.querySelectorAll('.stat-value')).indexOf(entry.target) : 0;
          setTimeout(() => animateCounter(entry.target), idx * 150);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('.stat-value').forEach(el => counterObserver.observe(el));
  }

  /* ─── Animations en cascade pour les grilles ─── */
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.problems-grid, .skills-grid').forEach(grid => {
      grid.querySelectorAll('.fade-up').forEach((card, i) => {
        card.style.transitionDelay = (i * 0.11) + 's';
      });
    });
    /* Grilles génériques 3 colonnes */
    document.querySelectorAll('.grid-3, .grid-auto').forEach(grid => {
      grid.querySelectorAll('.fade-up').forEach((card, i) => {
        if (!card.style.transitionDelay) {
          card.style.transitionDelay = (i * 0.1) + 's';
        }
      });
    });
  }

  /* ─── Cursor spotlight sur sections sombres ─── */
  if (window.innerWidth > 768 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const spotlight = document.createElement('div');
    spotlight.className = 'cursor-spotlight';
    spotlight.setAttribute('aria-hidden', 'true');
    document.body.appendChild(spotlight);
    let spotX = 0, spotY = 0, rafSpot;
    document.addEventListener('mousemove', (e) => {
      spotX = e.clientX;
      spotY = e.clientY;
      const darkEl = e.target.closest('.section--dark, .section--navy, .hero, .stats-band, .cta-banner');
      if (darkEl) {
        spotlight.classList.add('active');
      } else {
        spotlight.classList.remove('active');
      }
      if (!rafSpot) {
        rafSpot = requestAnimationFrame(() => {
          spotlight.style.left = spotX + 'px';
          spotlight.style.top  = spotY + 'px';
          rafSpot = null;
        });
      }
    }, { passive: true });
  }

  /* ─── Effet magnétique sur les boutons principaux ─── */
  if (window.innerWidth > 768 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.btn-gold, .btn-primary').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.18;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.18;
        btn.style.transform = `translateY(-1px) translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* ─── Effet tilt 3D sur les cards (desktop) ─── */
  if (window.innerWidth > 1024 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.service-card, .realisation-card, .testimonial-card').forEach(card => {
      card.style.transformStyle = 'preserve-3d';
      card.style.transition = 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease';
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientY - rect.top - rect.height / 2) / rect.height;
        const y = (e.clientX - rect.left - rect.width / 2) / rect.width;
        card.style.transform = `perspective(700px) rotateX(${-x * 5}deg) rotateY(${y * 5}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }


  /* ─── Particules connectées globales ─── */
  const _bmdExcluded = ['page-404', 'page-blog', 'page-contact'];
  if (
    !_bmdExcluded.some(c => document.body.classList.contains(c)) &&
    window.innerWidth >= 768 &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    const bmdCanvas = document.getElementById('bmd-particles-bg');
    if (bmdCanvas) {
      const bmdCtx = bmdCanvas.getContext('2d');
      let bmdW, bmdH, bmdPts, bmdRaf;
      const BMD_COUNT = 60;
      const BMD_LINK  = 130;
      const BMD_COLS  = [
        [102, 119, 255],   /* periwinkle */
        [43,  212, 143],   /* vert signature */
        [29,  185, 154]    /* teal */
      ];

      function bmdResize() {
        bmdW = bmdCanvas.width  = window.innerWidth;
        bmdH = bmdCanvas.height = window.innerHeight;
      }

      function bmdMkPt() {
        const col = BMD_COLS[Math.floor(Math.random() * BMD_COLS.length)];
        return {
          x:  Math.random() * bmdW,
          y:  Math.random() * bmdH,
          vx: (Math.random() - .5) * .25,
          vy: (Math.random() - .5) * .25,
          r:  Math.random() * 1.5 + .5,
          col,
          a:  Math.random() * .35 + .2
        };
      }

      function bmdTick() {
        bmdCtx.clearRect(0, 0, bmdW, bmdH);

        /* lignes de connexion */
        for (let i = 0; i < bmdPts.length; i++) {
          for (let j = i + 1; j < bmdPts.length; j++) {
            const dx = bmdPts[i].x - bmdPts[j].x;
            const dy = bmdPts[i].y - bmdPts[j].y;
            const d2 = dx * dx + dy * dy;
            if (d2 < BMD_LINK * BMD_LINK) {
              const dist = Math.sqrt(d2);
              bmdCtx.beginPath();
              bmdCtx.strokeStyle = 'rgba(102,119,255,' + (.18 * (1 - dist / BMD_LINK)) + ')';
              bmdCtx.lineWidth = .6;
              bmdCtx.moveTo(bmdPts[i].x, bmdPts[i].y);
              bmdCtx.lineTo(bmdPts[j].x, bmdPts[j].y);
              bmdCtx.stroke();
            }
          }
        }

        /* points */
        bmdPts.forEach(p => {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0) p.x = bmdW; else if (p.x > bmdW) p.x = 0;
          if (p.y < 0) p.y = bmdH; else if (p.y > bmdH) p.y = 0;
          bmdCtx.beginPath();
          bmdCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          bmdCtx.fillStyle = 'rgba(' + p.col[0] + ',' + p.col[1] + ',' + p.col[2] + ',' + p.a + ')';
          bmdCtx.fill();
        });

        bmdRaf = requestAnimationFrame(bmdTick);
      }

      bmdResize();
      bmdPts = Array.from({ length: BMD_COUNT }, bmdMkPt);
      bmdTick();

      window.addEventListener('resize', bmdResize, { passive: true });

      /* Pause quand l'onglet est caché (économie CPU/batterie) */
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          cancelAnimationFrame(bmdRaf);
        } else {
          bmdTick();
        }
      });
    }
  }

})();

/* ═══ PAGE: faq.html ═══ */
if (document.querySelector('.faq-hero')) {
  (function () {
    'use strict';

    /* ── Utilitaires ── */
    function escHtml(str) {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    function highlightInElement(el, term) {
      if (!el || !term) return;
      // Restaurer le texte brut d'abord
      el.querySelectorAll('mark.faq-hl').forEach(m => m.replaceWith(document.createTextNode(m.textContent)));
      el.normalize();
      const text = el.textContent;
      const idx  = text.toLowerCase().indexOf(term.toLowerCase());
      if (idx === -1) return;
      el.innerHTML =
        escHtml(text.substring(0, idx)) +
        '<mark class="faq-hl">' + escHtml(text.substring(idx, idx + term.length)) + '</mark>' +
        escHtml(text.substring(idx + term.length));
    }

    function removeHighlights(root) {
      root.querySelectorAll('mark.faq-hl').forEach(m => {
        m.replaceWith(document.createTextNode(m.textContent));
      });
      root.normalize();
    }

    /* ── Accordion ── */
    document.querySelectorAll('.faq-card__question').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card   = btn.closest('.faq-card');
        var isOpen = card.classList.contains('open');

        // Fermer tous les autres
        document.querySelectorAll('.faq-card.open').forEach(function (c) {
          if (c !== card) {
            c.classList.remove('open');
            c.querySelector('.faq-card__question').setAttribute('aria-expanded', 'false');
          }
        });

        card.classList.toggle('open', !isOpen);
        btn.setAttribute('aria-expanded', String(!isOpen));
      });
    });

    /* ── Filtres ── */
    var filterBtns = document.querySelectorAll('.faq-filter-btn');

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.dataset.category;

        filterBtns.forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        document.querySelectorAll('.faq-category').forEach(function (section) {
          var show = cat === 'all' || section.dataset.category === cat;
          section.hidden = !show;
        });

        // Réinitialiser la recherche
        var searchInput = document.getElementById('faq-search');
        if (searchInput && searchInput.value) {
          searchInput.value = '';
          clearSearch();
        }
      });
    });

    /* ── Recherche live ── */
    var searchInput = document.getElementById('faq-search');
    var searchClear = document.getElementById('faq-search-clear');
    var faqEmpty    = document.getElementById('faq-empty');
    var faqReset    = document.getElementById('faq-reset');

    function clearSearch() {
      // Retirer les masques et highlights
      document.querySelectorAll('.faq-card').forEach(function (card) {
        card.removeAttribute('data-hidden');
        removeHighlights(card);
      });

      // Restaurer la visibilité des catégories selon le filtre actif
      var activeCat = (document.querySelector('.faq-filter-btn.active') || {}).dataset && document.querySelector('.faq-filter-btn.active').dataset.category;
      document.querySelectorAll('.faq-category').forEach(function (cat) {
        cat.hidden = activeCat !== 'all' && activeCat !== cat.dataset.category;
      });

      if (faqEmpty)    faqEmpty.hidden = true;
      if (searchClear) searchClear.classList.remove('visible');
    }

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        var raw  = searchInput.value;
        var term = raw.trim().toLowerCase();

        // Bouton effacer
        if (searchClear) searchClear.classList.toggle('visible', raw.length > 0);

        if (term.length === 0) {
          clearSearch();
          return;
        }

        // En recherche : activer filtre "Tout"
        filterBtns.forEach(function (b) {
          var isAll = b.dataset.category === 'all';
          b.classList.toggle('active', isAll);
          b.setAttribute('aria-selected', String(isAll));
        });
        document.querySelectorAll('.faq-category').forEach(function (c) { c.hidden = false; });

        var visibleCount = 0;

        document.querySelectorAll('.faq-card').forEach(function (card) {
          // Retirer highlights précédents
          removeHighlights(card);

          var qEl = card.querySelector('.faq-card__text');
          var aEl = card.querySelector('[itemprop="text"]');
          var qTxt = (qEl && qEl.textContent.toLowerCase()) || '';
          var aTxt = (aEl && aEl.textContent.toLowerCase()) || '';
          var matches = qTxt.includes(term) || aTxt.includes(term);

          if (matches) {
            card.removeAttribute('data-hidden');
            visibleCount++;
            if (qEl && qTxt.includes(term)) highlightInElement(qEl, raw.trim());
          } else {
            card.setAttribute('data-hidden', 'true');
          }
        });

        // Masquer les catégories vides
        document.querySelectorAll('.faq-category').forEach(function (cat) {
          var hasVisible = cat.querySelectorAll('.faq-card:not([data-hidden])').length > 0;
          cat.hidden = !hasVisible;
        });

        if (faqEmpty) faqEmpty.hidden = visibleCount > 0;
      });

      if (searchClear) {
        searchClear.addEventListener('click', function () {
          searchInput.value = '';
          clearSearch();
          searchInput.focus();
        });
      }
    }

    if (faqReset) {
      faqReset.addEventListener('click', function () {
        if (searchInput) searchInput.value = '';
        clearSearch();
      });
    }

    /* ── Sticky shadow — supprimé (sidebar remplace la top bar) ── */

    /* ── Stagger animation des cards ── */
    document.querySelectorAll('.faq-card').forEach(function (card, i) {
      card.style.animationDelay = (i * 0.045) + 's';
    });

  })();
}

/* ═══ PAGE: contact.html ═══ */
if (document.querySelector('.page-contact')) {
  (function () {
    'use strict';

    /* ── MODAL ── */
    var overlay  = document.getElementById('bookingModal');
    var backdrop = document.getElementById('bmodalBackdrop');
    var closeBtn = document.getElementById('bmodalClose');
    var iframe   = document.getElementById('bookingIframe');
    var loader   = document.getElementById('bmodalLoader');
    var loaded   = false;

    function openModal() {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (!loaded) {
        iframe.src = iframe.getAttribute('data-src');
        iframe.addEventListener('load', function () { loader.style.display = 'none'; }, { once: true });
        loaded = true;
      }
      closeBtn.focus();
    }

    function closeModal() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('.open-booking').forEach(function (btn) {
      btn.addEventListener('click', openModal);
    });
    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });

    /* ── TABS ── */
    var tabForm   = document.getElementById('tab-form');
    var tabBook   = document.getElementById('tab-book');
    var panelForm = document.getElementById('panel-form');
    var panelBook = document.getElementById('panel-book');

    function switchTab(activeTab, activePanel, inactiveTab, inactivePanel) {
      activeTab.classList.add('active');
      activeTab.setAttribute('aria-selected', 'true');
      inactiveTab.classList.remove('active');
      inactiveTab.setAttribute('aria-selected', 'false');
      activePanel.classList.add('active');
      inactivePanel.classList.remove('active');
    }

    tabForm.addEventListener('click', function () { switchTab(tabForm, panelForm, tabBook, panelBook); });
    tabBook.addEventListener('click', function () { switchTab(tabBook, panelBook, tabForm, panelForm); });

    /* ── FORM ── */
    var form      = document.getElementById('contact-form');
    var successEl = document.getElementById('pf-success');
    var errorEl   = document.getElementById('pf-error');
    var submitBtn = document.getElementById('pf-submit');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var nameEl    = form.querySelector('#name');
      var emailEl   = form.querySelector('#email');
      var messageEl = form.querySelector('#message');
      var name      = nameEl.value.trim();
      var email     = emailEl.value.trim();
      var message   = messageEl.value.trim();
      var company   = form.querySelector('#company').value.trim();
      var phone     = form.querySelector('#phone').value.trim();
      var service   = form.querySelector('#service').value;

      /* Réinitialiser les erreurs visuelles */
      [nameEl, emailEl, messageEl].forEach(function (el) { el.classList.remove('field-error'); });
      errorEl.style.display = 'none';

      /* Validation */
      var errors = [];
      if (!name)    { nameEl.classList.add('field-error');    errors.push('nom'); }
      if (!email)   { emailEl.classList.add('field-error');   errors.push('email'); }
      if (!message) { messageEl.classList.add('field-error'); errors.push('message'); }

      if (errors.length) {
        errorEl.textContent = 'Merci de remplir les champs obligatoires : ' + errors.join(', ') + '.';
        errorEl.style.display = 'block';
        errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }

      /* ── ENVOI VIA MAILTO ──
         Quand n8n sera prêt, remplacer ce bloc par un fetch POST vers le webhook n8n.
         Exemple :
           fetch('https://votre-n8n.fr/webhook/contact', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ name, email, company, phone, service, message })
           }).then(...);
      */
      var serviceLabel = service ? form.querySelector('#service option:checked').textContent : 'Non précisé';
      var subject = encodeURIComponent('Demande de contact BM Data — ' + (service ? serviceLabel : name));
      var body = encodeURIComponent(
        'Nom : ' + name + '\n' +
        'Email : ' + email + '\n' +
        (phone   ? 'Téléphone : ' + phone + '\n' : '') +
        (company ? 'Entreprise : ' + company + '\n' : '') +
        'Sujet : ' + serviceLabel + '\n\n' +
        'Message :\n' + message
      );

      window.location.href = 'mailto:contact@bmdata.fr?subject=' + subject + '&body=' + body;

      /* Afficher la confirmation après ouverture du client mail */
      setTimeout(function () {
        form.style.display = 'none';
        successEl.style.display = 'block';
      }, 500);
    });

    /* ── SCROLL ANIMATIONS ── */
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    document.querySelectorAll('.fade-up').forEach(function (el) { observer.observe(el); });

  })();
}

/* ═══ PAGE: blog.html ═══ */
if (document.querySelector('.blog-stat')) {
  (function() {
    /* ── Count-up utility ── */
    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    function animateCount(el, target, duration) {
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var value = Math.round(easeOutCubic(progress) * target);
        el.textContent = value;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target;
      }
      requestAnimationFrame(step);
    }

    /* ── Trigger on viewport entry ── */
    var stats = document.querySelectorAll('.blog-stat');
    if (!stats.length) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var card = entry.target;
        card.classList.add('is-visible');

        var countEl = card.querySelector('.blog-stat__count');
        if (countEl && !card.dataset.animated) {
          card.dataset.animated = '1';
          var target = parseInt(card.dataset.count, 10) || 0;
          /* Slightly longer duration for larger numbers */
          var dur = target > 50 ? 1800 : 1200;
          animateCount(countEl, target, dur);
        }
        observer.unobserve(card);
      });
    }, { threshold: 0.25 });

    stats.forEach(function(card) { observer.observe(card); });
  })();
}

/* ═══ Hero particles — toutes les pages hero ═══ */
(function () {
  var canvases = document.querySelectorAll('.hero-particles');
  if (!canvases.length) return;

  var COLORS = ['rgba(102,119,255,', 'rgba(43,212,143,', 'rgba(29,185,154,'];

  function initParticles(canvas) {
    var ctx = canvas.getContext('2d');
    var W, H, pts;
    var COUNT = 85, LINK = 130;

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }

    function mkPt() {
      return {
        x:  Math.random() * W,
        y:  Math.random() * H,
        vx: (Math.random() - .5) * .38,
        vy: (Math.random() - .5) * .38,
        r:  Math.random() * 1.6 + .5,
        c:  COLORS[Math.floor(Math.random() * COLORS.length)],
        a:  Math.random() * .55 + .2
      };
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        for (var j = i + 1; j < pts.length; j++) {
          var dx = pts[i].x - pts[j].x;
          var dy = pts[i].y - pts[j].y;
          var d  = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(102,119,255,' + (.14 * (1 - d / LINK)) + ')';
            ctx.lineWidth = .55;
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }
      pts.forEach(function (p) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; else if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; else if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.c + p.a + ')';
        ctx.fill();
      });
      requestAnimationFrame(tick);
    }

    resize();
    pts = Array.from({ length: COUNT }, mkPt);
    tick();
    window.addEventListener('resize', resize);
  }

  canvases.forEach(function (c) { initParticles(c); });
}());

/* ═══ PAGE: 404.html ═══ */
if (document.querySelector('.page-404')) {
  (function () {
    const canvas = document.getElementById('e404-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, pts;
    const COUNT = 85, LINK = 130;
    const COLORS = [
      'rgba(102,119,255,',
      'rgba(43,212,143,',
      'rgba(29,185,154,'
    ];

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }

    function mkPt() {
      return {
        x:  Math.random() * W,
        y:  Math.random() * H,
        vx: (Math.random() - .5) * .38,
        vy: (Math.random() - .5) * .38,
        r:  Math.random() * 1.6 + .5,
        c:  COLORS[Math.floor(Math.random() * COLORS.length)],
        a:  Math.random() * .55 + .2
      };
    }

    function init() { resize(); pts = Array.from({ length: COUNT }, mkPt); }

    function tick() {
      ctx.clearRect(0, 0, W, H);

      /* lignes */
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(102,119,255,' + (.14 * (1 - d / LINK)) + ')';
            ctx.lineWidth = .55;
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }

      /* points */
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; else if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; else if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.c + p.a + ')';
        ctx.fill();
      });

      requestAnimationFrame(tick);
    }

    init();
    tick();
    window.addEventListener('resize', resize);
  })();
}

/* ═══ PAGE: _layouts/post.html ═══ */
if (document.getElementById('postArticle')) {
  (function () {
    'use strict';

    /* ─── 1. Reading progress bar ─── */
    var bar  = document.getElementById('readingProgressBar');
    var prog = document.getElementById('readingProgress');
    var art  = document.getElementById('postArticle');

    if (bar && art) {
      window.addEventListener('scroll', function () {
        var rect  = art.getBoundingClientRect();
        var total = art.offsetHeight - window.innerHeight;
        var done  = Math.max(0, -rect.top);
        var pct   = total > 0 ? Math.min(100, (done / total) * 100) : 0;
        bar.style.width = pct + '%';
        prog.setAttribute('aria-valuenow', Math.round(pct));
      }, { passive: true });
    }

    /* ─── 2. Table des matières ─── */
    var content = document.getElementById('postContent');
    var tocEl   = document.getElementById('postToc');
    var tocList = document.getElementById('postTocList');

    if (content && tocList) {
      var headings = content.querySelectorAll('h2, h3');

      if (headings.length >= 2) {
        tocEl.classList.remove('post-toc--hidden');

        headings.forEach(function (h, i) {
          /* assign id if missing */
          if (!h.id) {
            h.id = 'heading-' + i + '-' + h.textContent
              .toLowerCase()
              .replace(/[^a-z0-9\u00C0-\u017E]+/gi, '-')
              .replace(/^-|-$/g, '')
              .substring(0, 50);
          }

          var li  = document.createElement('li');
          var a   = document.createElement('a');
          a.href  = '#' + h.id;
          a.textContent = h.textContent;
          a.className   = 'post-toc__link';
          if (h.tagName === 'H3') li.classList.add('post-toc__item--sub');
          li.className  = 'post-toc__item';
          li.appendChild(a);
          tocList.appendChild(li);

          /* smooth scroll */
          a.addEventListener('click', function (e) {
            e.preventDefault();
            var target = document.getElementById(h.id);
            if (target) {
              var offset = 88;
              var top    = target.getBoundingClientRect().top + window.scrollY - offset;
              window.scrollTo({ top: top, behavior: 'smooth' });
            }
          });
        });

        /* ── Active heading tracking via IntersectionObserver ── */
        var links     = tocList.querySelectorAll('.post-toc__link');
        var headingIds = Array.from(headings).map(function (h) { return h.id; });

        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var idx = headingIds.indexOf(entry.target.id);
              links.forEach(function (l) { l.classList.remove('is-active'); });
              if (idx > -1 && links[idx]) links[idx].classList.add('is-active');
            }
          });
        }, { rootMargin: '-10% 0px -80% 0px', threshold: 0 });

        headings.forEach(function (h) { observer.observe(h); });
      }
    }

    /* ─── 3. Scroll-reveal ─── */
    if ('IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08 });

      /* auto-reveal post content children */
      if (content) {
        var revealEls = content.querySelectorAll(
          'h2, h3, p, ul, ol, blockquote, pre, img, table, .post-tags, .post-share-banner, .post-author-card'
        );
        revealEls.forEach(function (el) {
          el.classList.add('reveal');
          revealObserver.observe(el);
        });
      }

      /* manual .reveal on other elements */
      document.querySelectorAll('.reveal').forEach(function (el) {
        if (!el.classList.contains('is-visible')) revealObserver.observe(el);
      });
    } else {
      /* fallback: show everything */
      document.querySelectorAll('.reveal').forEach(function (el) {
        el.classList.add('is-visible');
      });
    }

    /* ─── 4. Copy link ─── */
    function setupCopy(btn, label) {
      if (!btn) return;
      btn.addEventListener('click', function () {
        var self = this;
        navigator.clipboard.writeText(window.location.href).then(function () {
          var svg = self.querySelector('svg') ? self.querySelector('svg').outerHTML : '';
          self.innerHTML = svg + (label ? '<span>Copié !</span>' : 'Copié !');
          self.classList.add('is-copied');
          setTimeout(function () {
            self.classList.remove('is-copied');
            self.innerHTML = svg + (label ? '<span>' + label + '</span>' : label || 'Copier');
          }, 2200);
        });
      });
    }

    setupCopy(document.getElementById('copyLinkBtn'),  'Copier le lien');
    setupCopy(document.getElementById('copyLinkBtn2'), false);

    /* ─── Native share ─── */
    function setupNativeShare(btn) {
      if (!btn) return;
      if (navigator.share) {
        btn.addEventListener('click', function () {
          var meta = document.querySelector('meta[name="description"]');
          navigator.share({
            title: document.title,
            text: meta ? meta.content : '',
            url: window.location.href
          }).catch(function () {});
        });
      } else {
        /* Fallback : copie l'URL si Web Share API indisponible */
        btn.addEventListener('click', function () {
          var self = this;
          navigator.clipboard.writeText(window.location.href).then(function () {
            var orig = self.innerHTML;
            self.innerHTML = orig.replace(/Partager/, 'Copié !');
            setTimeout(function () { self.innerHTML = orig; }, 2200);
          });
        });
      }
    }

    setupNativeShare(document.getElementById('nativeShareHero'));
    setupNativeShare(document.getElementById('nativeShareSidebar'));
    setupNativeShare(document.getElementById('nativeShareCta'));

    /* ─── 5. Back to top ─── */
    var btt = document.getElementById('backToTop');
    if (btt) {
      window.addEventListener('scroll', function () {
        btt.classList.toggle('is-visible', window.scrollY > 600);
      }, { passive: true });
      btt.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

  })();

  /* ─── Hero tagline premium — home page ─── */
  var sub = document.querySelector('.hero-subtitle');
  if (sub) {
    var phrase = 'Avec BM Data, la bonne donn\u00e9e, au bon endroit, au bon moment.';
    var html = sub.innerHTML;
    var idx = html.indexOf(phrase);
    if (idx !== -1) {
      sub.innerHTML =
        html.slice(0, idx) +
        '<span class="hero-tagline">' + phrase + '</span>' +
        html.slice(idx + phrase.length);
    }
  }
}
