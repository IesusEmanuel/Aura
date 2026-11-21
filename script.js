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

  function updateCount() {
    count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  }
  function goTo(i) {
    slides[current].classList.remove('is-active');
    current = (i + slides.length) % slides.length;
    slides[current].classList.add('is-active');
    updateCount();
    startTime = performance.now();
  }
  function tick(now) {
    const p = Math.min((now - startTime) / DURATION, 1);
    fill.style.width = (p * 100) + '%';
    if (p >= 1) goTo(current + 1);
    rafId = requestAnimationFrame(tick);
  }
  updateCount();
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

  /* ---------- 7.1 Modal de detalhes dos projetos (blur no fundo + expansão do card) ---------- */
  // Dados ilustrativos: substitua por clientes, valores e fotos reais da AURA.
  const U = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1100&q=80`;
  const PROJECTS = {
    horizonte: {
      tag: 'RESIDENCIAL', title: 'Casa Horizonte', year: '2024', tipo: 'Residência unifamiliar',
      lead: 'Uma residência pensada para dissolver a fronteira entre dentro e fora. O concreto aparente dá peso e permanência, enquanto os muxarabis de madeira filtram a luz e criam sombras que mudam ao longo do dia. O paisagismo nativo entra pela casa e conduz a circulação entre os ambientes.',
      facts: [
        ['fa-user', 'Cliente', 'Família Mendonça'],
        ['fa-location-dot', 'Local', 'São Paulo, SP'],
        ['fa-calendar', 'Ano', '2024'],
        ['fa-ruler-combined', 'Área', '480 m²'],
        ['fa-coins', 'Investimento', 'R$ 14.2 mil'],
        ['fa-clock', 'Prazo de obra', '18 meses']
      ],
      materials: ['Concreto aparente', 'Muxarabi de madeira', 'Vidro de alto desempenho', 'Paisagismo nativo', 'Pedra natural'],
      images: [U('1600596542815-ffad4c1539a9'), U('1600585154340-be6161a56a0c'), U('1600210492486-724fe5c67fb0'), U('1613490493576-7fde63acd811')],
      process: [
        ['Imersão & Briefing', 'Mapeamos a rotina da família, o terreno e a insolação ao longo do ano.', '3 semanas'],
        ['Estudo Preliminar & 3D', 'Maquetes de volumetria, estudo de sombras e paleta de materiais.', '2 meses'],
        ['Projeto Executivo', 'Caderno técnico completo, incluindo marcenaria e paisagismo.', '4 meses'],
        ['Consultoria de Obra', 'Visitas semanais e controle de qualidade dos acabamentos.', '18 meses']
      ]
    },
    alameda: {
      tag: 'INTERIORES', title: 'Apartamento Alameda', year: '2023', tipo: 'Reforma de apartamento',
      lead: 'A reforma derrubou paredes que fragmentavam o apartamento e reorganizou a planta a partir da luz natural. A cozinha gourmet passou a conversar com o living, e a marcenaria sob medida esconde o que precisa ser escondido e valoriza o que merece destaque.',
      facts: [
        ['fa-user', 'Cliente', 'Rafael Tavares'],
        ['fa-location-dot', 'Local', 'Curitiba, PR'],
        ['fa-calendar', 'Ano', '2023'],
        ['fa-ruler-combined', 'Área', '210 m²'],
        ['fa-coins', 'Investimento', 'R$ 6 mil'],
        ['fa-clock', 'Prazo de obra', '9 meses']
      ],
      materials: ['Marcenaria sob medida', 'Carvalho natural', 'Mármore travertino', 'Iluminação indireta', 'Texturas em linho'],
      images: [U('1618221195710-dd6b41faaea6'), U('1616594039964-ae9021a400a0'), U('1556909114-f6e7ad7d3136'), U('1600607687939-ce8a6c25118c')],
      process: [
        ['Imersão & Briefing', 'Levantamento das necessidades funcionais e do acervo do cliente.', '2 semanas'],
        ['Estudo Preliminar & 3D', 'Três propostas de layout e simulações de iluminação natural.', '6 semanas'],
        ['Projeto Executivo', 'Detalhamento de marcenaria, elétrica e paginação de pisos.', '3 meses'],
        ['Consultoria de Obra', 'Acompanhamento técnico e compatibilização com os fornecedores.', '9 meses']
      ]
    },
    vertice: {
      tag: 'COMERCIAL', title: 'Estúdio Vértice', year: '2024', tipo: 'Ambiente corporativo',
      lead: 'Um escritório pensado para mudar de configuração com a equipe. A acústica foi tratada em camadas, as divisórias em vidro canelado preservam a privacidade sem escurecer o ambiente, e a paleta biofílica traz presença de natureza para a rotina de trabalho.',
      facts: [
        ['fa-user', 'Cliente', 'Estúdio Vértice'],
        ['fa-location-dot', 'Local', 'Belo Horizonte, MG'],
        ['fa-calendar', 'Ano', '2024'],
        ['fa-ruler-combined', 'Área', '350 m²'],
        ['fa-coins', 'Investimento', 'R$ 18 mil'],
        ['fa-clock', 'Prazo de obra', '11 meses']
      ],
      materials: ['Vidro canelado', 'Painéis acústicos', 'Vegetação interna', 'Madeira clara', 'Piso vinílico'],
      images: [U('1497366216548-37526070297c'), U('1497366811353-6870744d04b2'), U('1524758631624-e2822e304c36'), U('1497215728101-856f4ea42174')],
      process: [
        ['Imersão & Briefing', 'Entrevistas com a equipe para entender fluxos, rituais e picos de uso.', '2 semanas'],
        ['Estudo Preliminar & 3D', 'Layouts flexíveis, estudo acústico e paleta biofílica.', '5 semanas'],
        ['Projeto Executivo', 'Especificação de divisórias, forros acústicos e infraestrutura.', '3 meses'],
        ['Consultoria de Obra', 'Obra faseada para a equipe continuar operando durante a entrega.', '11 meses']
      ]
    }
  };

  const modal = document.getElementById('projectModal');
  const modalPanel = document.getElementById('modalPanel');
  const modalScroll = document.getElementById('modalScroll');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const pageParts = document.querySelectorAll('header, main, footer');
  let modalTrigger = null, modalCloseTimer = null, modalOpen = false;

  function renderProject(p) {
    const facts = p.facts.map(([icon, label, value]) =>
      `<div class="pm__fact"><dt><i class="fa-solid ${icon}"></i>${label}</dt><dd>${value}</dd></div>`).join('');
    const chips = p.materials.map((m) => `<li>${m}</li>`).join('');
    const thumbs = p.images.map((src, i) =>
      `<button type="button" class="pm__thumb${i === 0 ? ' is-active' : ''}" data-src="${src}" data-index="${i + 1}" aria-label="Ver imagem ${i + 1} de ${p.images.length}"><img src="${src}" alt="" loading="lazy"></button>`).join('');
    const steps = p.process.map(([title, text, time], i) =>
      `<li class="pm__step"><span class="pm__step-num">0${i + 1}</span><h4>${title}</h4><p>${text}</p><small><i class="fa-regular fa-clock"></i> ${time}</small></li>`).join('');

    return `
      <div class="pm">
        <div class="pm__gallery">
          <div class="pm__main"><img id="pmMainImg" src="${p.images[0]}" alt="${p.title}, imagem 1"><span class="tag">${p.tag}</span></div>
          <div class="pm__thumbs" id="pmThumbs">${thumbs}</div>
        </div>
        <div class="pm__info">
          <span class="eyebrow">${p.tag} • ${p.year}</span>
          <h2 class="pm__title" id="modalTitle">${p.title}</h2>
          <p class="pm__lead">${p.lead}</p>
          <dl class="pm__facts">${facts}</dl>
          <h3 class="pm__sub">Materiais e acabamentos</h3>
          <ul class="pm__chips">${chips}</ul>
        </div>
        <div class="pm__process">
          <h3 class="pm__sub">Processo do projeto</h3>
          <ol class="pm__steps">${steps}</ol>
        </div>
        <div class="pm__cta">
          <p>Quer um projeto como este?</p>
          <button type="button" class="btn btn--dark" id="modalCta" data-tipo="${p.tipo}">QUERO UM PROJETO ASSIM</button>
        </div>
      </div>`;
  }

  // Posiciona o painel exatamente sobre o card (efeito de expansão do card para o modal)
  function placePanelOver(card) {
    const c = card.getBoundingClientRect();
    const p = modalPanel.getBoundingClientRect();
    modalPanel.style.transform = `translate(${c.left - p.left}px, ${c.top - p.top}px) scale(${c.width / p.width}, ${c.height / p.height})`;
    modalPanel.style.opacity = '0';
  }

  function openProject(key, trigger) {
    const data = PROJECTS[key];
    if (!data || modalOpen) return;
    clearTimeout(modalCloseTimer);
    modalOpen = true;
    modalTrigger = trigger;

    modalBody.innerHTML = renderProject(data);
    modalBody.querySelectorAll('img').forEach((img) => img.addEventListener('error', () => {
      if (img.dataset.fallback) return;
      img.dataset.fallback = '1';
      img.src = `https://picsum.photos/seed/${encodeURIComponent(data.title + Math.random())}/1000/800`;
    }));
    modalScroll.scrollTop = 0;

    modal.classList.add('is-visible');
    modal.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('modal-open');
    pageParts.forEach((el) => { el.inert = true; });

    const card = trigger.closest('.project-card');
    if (!reduceMotion && card) {
      modalPanel.style.transition = 'none';
      placePanelOver(card);
      void modalPanel.offsetWidth;              // força o reflow antes de animar
      modalPanel.style.transition = '';
    }
    requestAnimationFrame(() => {
      modalPanel.style.transform = '';
      modalPanel.style.opacity = '';
      modal.classList.add('is-open');
      modalClose.focus({ preventScroll: true });
    });
  }

  function closeProject(afterClose) {
    if (!modalOpen) return;
    modalOpen = false;
    modal.classList.remove('is-open');

    const card = modalTrigger && modalTrigger.closest('.project-card');
    if (!reduceMotion && card) placePanelOver(card);

    modalCloseTimer = setTimeout(() => {
      modal.classList.remove('is-visible');
      modal.setAttribute('aria-hidden', 'true');
      modalPanel.style.transform = '';
      modalPanel.style.opacity = '';
      modalBody.innerHTML = '';
      document.documentElement.classList.remove('modal-open');
      pageParts.forEach((el) => { el.inert = false; });
      if (modalTrigger) modalTrigger.focus({ preventScroll: true });
      if (typeof afterClose === 'function') afterClose();
    }, reduceMotion ? 0 : 600);
  }

  document.querySelectorAll('[data-project]').forEach((btn) =>
    btn.addEventListener('click', () => openProject(btn.dataset.project, btn)));
  modalClose.addEventListener('click', () => closeProject());
  modalBackdrop.addEventListener('click', () => closeProject());
  modal.addEventListener('click', (e) => { if (e.target === modal) closeProject(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modalOpen) closeProject(); });

  // Troca de imagem na galeria e botão de contato (delegação de eventos)
  modalBody.addEventListener('click', (e) => {
    const thumb = e.target.closest('.pm__thumb');
    if (thumb) {
      const main = document.getElementById('pmMainImg');
      modalBody.querySelectorAll('.pm__thumb').forEach((t) => t.classList.toggle('is-active', t === thumb));
      main.classList.add('is-swapping');
      setTimeout(() => {
        main.src = thumb.dataset.src;
        main.alt = `Imagem ${thumb.dataset.index}`;
        main.classList.remove('is-swapping');
      }, 280);
      return;
    }
    const cta = e.target.closest('#modalCta');
    if (cta) {
      const tipo = cta.dataset.tipo;
      closeProject(() => {
        form.elements.tipo.value = tipo;
        document.getElementById('contato').scrollIntoView({ behavior: 'smooth' });
      });
    }
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