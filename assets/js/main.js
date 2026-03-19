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
  const navToggle = document.querySelector('.nav-toggle');
  const siteNav   = document.querySelector('.site-nav');
  if (navToggle && siteNav) {
    navToggle.addEventListener('click', () => {
      const open = siteNav.classList.toggle('nav-open');
      navToggle.classList.toggle('active', open);
      navToggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });

    // Fermer en cliquant sur un lien
    siteNav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        siteNav.classList.remove('nav-open');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Fermer avec Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && siteNav.classList.contains('nav-open')) {
        siteNav.classList.remove('nav-open');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
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

  /* ─── Fade-in au scroll ─── */
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -60px 0px', threshold: 0.1 }
    );
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
  } else {
    // Pas d'animation : rendre visible immédiatement
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

})();
