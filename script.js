/* ============================================================
   AURA Arquitetura — script.js
   ============================================================ */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- 1. Cursor double dot ---------- */
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');

  if (isFinePointer && dot && ring) {
    document.body.classList.add('has-custom-cursor');
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
    });

    (function followRing() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(followRing);
    })();

    const hoverables = 'a, button, input, select, textarea, .card, .about__badge, .pillar, .contact__item';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverables)) { ring.classList.add('is-hover'); dot.classList.add('is-hover'); }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverables)) { ring.classList.remove('is-hover'); dot.classList.remove('is-hover'); }
    });
    document.addEventListener('mouseleave', () => { dot.style.opacity = 0; ring.style.opacity = 0; });
    document.addEventListener('mouseenter', () => { dot.style.opacity = ''; ring.style.opacity = ''; });
  }

  /* ---------- 2. Header, menu mobile e link ativo ---------- */
  const header = document.getElementById('header');
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const navLinks = document.querySelectorAll('.nav__link');

  const onHeaderScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onHeaderScroll, { passive: true });
  onHeaderScroll();

  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open);
    burger.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
  });
  navLinks.forEach((l) => l.addEventListener('click', () => {
    nav.classList.remove('is-open');
    burger.innerHTML = '<i class="fa-solid fa-bars"></i>';
  }));

  const sectionIds = ['inicio', 'projetos', 'sobre', 'processo', 'feedback'];
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((l) => l.classList.toggle('is-active', l.dataset.section === entry.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sectionIds.forEach((id) => { const el = document.getElementById(id); if (el) sectionObserver.observe(el); });

  /* ---------- 3. Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = parseInt(el.dataset.delay || '0', 10);
      setTimeout(() => el.classList.add('is-visible'), delay);
      obs.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  revealEls.forEach((el) => revealObserver.observe(el));

  /* ---------- 4. Hero: animação ao rolar ---------- */
  const heroContent = document.getElementById('heroContent');
  const hero = document.getElementById('inicio');
  let scrollProgress = 0; // 0 a 1, usado também pela cena 3D

  function onHeroScroll() {
    const h = hero.offsetHeight;
    scrollProgress = Math.min(Math.max(window.scrollY / h, 0), 1);
    if (!reduceMotion) {
      heroContent.style.transform = `translateY(${scrollProgress * 60}px)`;
      heroContent.style.opacity = String(1 - scrollProgress * 1.1);
    }
  }
  window.addEventListener('scroll', onHeroScroll, { passive: true });
  onHeroScroll();

  /* ---------- 5. Hero 3D interativo (Three.js, geometria procedural) ---------- */
  const canvas = document.getElementById('heroCanvas');

  function initHero3D() {
    if (typeof THREE === 'undefined' || !canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 1.2, 9);

    const ORANGE = 0xFFA600;
    const group = new THREE.Group();
    scene.add(group);

    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(4, 6, 5);
    scene.add(dir);

    // Volumes arquitetônicos: [x, y, z, w, h, d, tipo]
    const volumes = [
      [0, -0.9, 0, 4.2, 0.18, 3.2, 'slab'],
      [-1.2, 0.1, -0.4, 1.4, 2.0, 1.6, 'solid'],
      [0.6, -0.1, 0.3, 2.2, 1.6, 1.8, 'glass'],
      [1.5, 0.95, -0.2, 1.8, 0.14, 1.9, 'slab'],
      [-0.2, 1.4, -0.5, 1.2, 0.8, 1.0, 'accent'],
      [1.9, 0.2, 0.9, 0.12, 2.2, 0.12, 'pillar'],
      [-1.9, 0.2, 0.9, 0.12, 2.2, 0.12, 'pillar']
    ];
    const meshes = [];

    volumes.forEach(([x, y, z, w, h, d, type]) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      let mat;
      if (type === 'solid') mat = new THREE.MeshStandardMaterial({ color: 0xEDEDED, roughness: .85 });
      else if (type === 'glass') mat = new THREE.MeshStandardMaterial({ color: 0xFFD27A, transparent: true, opacity: .22, roughness: .2 });
      else if (type === 'accent') mat = new THREE.MeshStandardMaterial({ color: ORANGE, roughness: .5 });
      else if (type === 'pillar') mat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      else mat = new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: .6 });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.userData.base = mesh.position.clone();
      mesh.userData.depth = 0.4 + Math.random() * 0.9;

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: type === 'accent' ? 0x111111 : 0x777777, transparent: true, opacity: .55 })
      );
      mesh.add(edges);
      group.add(mesh);
      meshes.push(mesh);
    });

    // Grid de piso
    const grid = new THREE.GridHelper(14, 28, ORANGE, 0xCCCCCC);
    grid.position.y = -1.0;
    grid.material.transparent = true;
    grid.material.opacity = .35;
    scene.add(grid);

    let tx = 0, ty = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', (e) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    function resize() {
      const w = hero.clientWidth, h = hero.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // desloca o modelo para a direita em telas largas
      group.position.x = w > 900 ? 2.6 : 0;
      group.position.y = w > 900 ? 0 : 1.6;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    let visible = true;
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(hero);

    const clock = new THREE.Clock();
    (function loop() {
      requestAnimationFrame(loop);
      if (!visible) return;
      const t = clock.getElapsedTime();

      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;

      // rotação: cursor + rolagem + leve deriva automática
      group.rotation.y = -0.55 + cx * 0.45 + scrollProgress * 1.4 + (reduceMotion ? 0 : Math.sin(t * 0.3) * 0.06);
      group.rotation.x = 0.18 + cy * 0.18 - scrollProgress * 0.25;

      // volumes "se afastam" ao interagir (explosão suave com cursor e rolagem)
      meshes.forEach((m) => {
        const spread = (Math.abs(cx) + Math.abs(cy)) * 0.18 + scrollProgress * 0.9;
        m.position.y = m.userData.base.y + spread * m.userData.depth * (m.userData.base.y >= 0 ? 1 : -0.4);
      });

      grid.position.z = (t * 0.15) % 0.5;
      renderer.render(scene, camera);
    })();
  }

  try { initHero3D(); } catch (err) { console.warn('Hero 3D indisponível:', err); }

  /* ---------- 6. Carrossel de depoimentos (7s) ---------- */
  const slides = document.querySelectorAll('.testimonial');
  const count = document.getElementById('carouselCount');
  const fill = document.getElementById('carouselProgressFill');
  const prev = document.getElementById('carouselPrev');
  const next = document.getElementById('carouselNext');
  const DURATION = 7000;
  let current = 0, startTime = performance.now(), rafId;

  function goTo(i) {
    slides[current].classList.remove('is-active');
    current = (i + slides.length) % slides.length;
    slides[current].classList.add('is-active');
    count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    startTime = performance.now();
  }
  function tick(now) {
    const p = Math.min((now - startTime) / DURATION, 1);
    fill.style.width = (p * 100) + '%';
    if (p >= 1) goTo(current + 1);
    rafId = requestAnimationFrame(tick);
  }
  count.textContent = `01 / ${String(slides.length).padStart(2, '0')}`;
  rafId = requestAnimationFrame(tick);
  prev.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));

  /* ---------- 7. Formulário (validação sem envio real) ---------- */
  const form = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  const rules = {
    nome: (v) => v.trim().split(/\s+/).length >= 2 ? '' : 'Informe seu nome completo.',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Informe um e-mail válido.',
    tipo: (v) => v ? '' : 'Selecione o tipo de projeto.',
    faixa: (v) => v ? '' : 'Selecione uma faixa de investimento.',
    prazo: (v) => v.trim().length >= 3 ? '' : 'Informe o prazo desejado.',
    mensagem: (v) => v.trim().length >= 15 ? '' : 'Conte um pouco mais (mín. 15 caracteres).'
  };

  function validateField(name) {
    const input = form.elements[name];
    const msg = rules[name](input.value);
    document.getElementById('field-' + name).classList.toggle('has-error', !!msg);
    document.getElementById('erro-' + name).textContent = msg;
    return !msg;
  }
  Object.keys(rules).forEach((name) => {
    form.elements[name].addEventListener('blur', () => validateField(name));
    form.elements[name].addEventListener('input', () => {
      if (document.getElementById('field-' + name).classList.contains('has-error')) validateField(name);
    });
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = Object.keys(rules).map(validateField).every(Boolean);
    if (!ok) { success.hidden = true; return; }
    form.reset();
    success.hidden = false;
    success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  /* ---------- 8. Fallback de imagens quebradas ---------- */
  document.querySelectorAll('img').forEach((img) => {
    img.addEventListener('error', () => {
      if (img.dataset.fallback) return;
      img.dataset.fallback = '1';
      img.src = `https://picsum.photos/seed/${encodeURIComponent(img.alt || 'aura')}/900/700`;
    });
  });
})();