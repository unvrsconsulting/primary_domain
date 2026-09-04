(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================= */
  /* Starfield / nebula background */
  /* ============================= */
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');
  let w, h, dpr;
  let stars = [];
  let mouseX = 0, mouseY = 0, targetMX = 0, targetMY = 0;

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = document.documentElement.clientWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildStars();
  }

  function buildStars(){
    const count = Math.round((w * h) / 9000);
    stars = new Array(count).fill(0).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.3 + 0.2,
      baseAlpha: Math.random() * 0.6 + 0.2,
      tw: Math.random() * Math.PI * 2,
      twSpeed: Math.random() * 0.015 + 0.004,
      depth: Math.random() * 0.6 + 0.2
    }));
  }

  const nebulae = [
    { x: 0.22, y: 0.28, r: 520, c: 'rgba(139,124,255,0.10)', dx: 0.015, dy: 0.01, t: 0 },
    { x: 0.78, y: 0.22, r: 480, c: 'rgba(200,117,255,0.09)', dx: -0.012, dy: 0.014, t: 2 },
    { x: 0.5, y: 0.82, r: 560, c: 'rgba(79,227,255,0.07)', dx: 0.01, dy: -0.012, t: 4 }
  ];

  function draw(){
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, w, h);

    nebulae.forEach(n => {
      n.t += 0.0035;
      const nx = (n.x + Math.sin(n.t) * n.dx) * w;
      const ny = (n.y + Math.cos(n.t * 0.8) * n.dy) * h;
      const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, n.r);
      grad.addColorStop(0, n.c);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    });

    const px = (targetMX - w / 2) * 0.012;
    const py = (targetMY - h / 2) * 0.012;

    stars.forEach(s => {
      s.tw += s.twSpeed;
      const alpha = s.baseAlpha * (0.6 + 0.4 * Math.sin(s.tw));
      ctx.beginPath();
      ctx.arc(s.x + px * s.depth, s.y + py * s.depth, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    });

    if (!reduceMotion){
      mouseX += (targetMX - mouseX) * 0.02;
      mouseY += (targetMY - mouseY) * 0.02;
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('mousemove', (e) => {
    targetMX = e.clientX;
    targetMY = e.clientY;
  });

  window.addEventListener('resize', resize, { passive: true });
  resize();
  draw();

  /* ============================= */
  /* Custom cursor (comet trail)    */
  /* ============================= */
  const cursorCore = document.getElementById('cursorCore');
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  if (!isTouch){
    let cx = 0, cy = 0;
    const trailCount = 7;
    const trail = [];

    for (let i = 0; i < trailCount; i++){
      const el = document.createElement('div');
      el.className = 'cursor-trail';
      el.style.setProperty('--i', i);
      document.body.appendChild(el);
      trail.push({ el, x: 0, y: 0 });
    }

    window.addEventListener('mousemove', (e) => {
      cx = e.clientX; cy = e.clientY;
      cursorCore.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
    });

    function trailLoop(){
      let px = cx, py = cy;
      trail.forEach((t) => {
        t.x += (px - t.x) * 0.32;
        t.y += (py - t.y) * 0.32;
        t.el.style.transform = `translate(${t.x}px, ${t.y}px) translate(-50%,-50%)`;
        px = t.x; py = t.y;
      });
      requestAnimationFrame(trailLoop);
    }
    trailLoop();

    document.querySelectorAll('a, button, .blog-card, .post-card, input, textarea').forEach(el => {
      el.addEventListener('mouseenter', () => cursorCore.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursorCore.classList.remove('hover'));
    });
  } else {
    cursorCore.style.display = 'none';
  }

  /* ============================= */
  /* Nav scroll state + mobile menu */
  /* ============================= */
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navMobile = document.getElementById('navMobile');

  function onScroll(){
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    navMobile.classList.toggle('open');
  });
  navMobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navToggle.classList.remove('open');
    navMobile.classList.remove('open');
  }));

  /* ============================= */
  /* Scroll reveal                 */
  /* ============================= */
  const revealEls = document.querySelectorAll('.reveal');
  revealEls.forEach(el => {
    const delay = el.getAttribute('data-delay');
    if (delay) el.style.setProperty('--d', delay + 's');
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => io.observe(el));

  /* ============================= */
  /* Magnetic buttons               */
  /* ============================= */
  if (!isTouch){
    document.querySelectorAll('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const mx = e.clientX - rect.left - rect.width / 2;
        const my = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${mx * 0.25}px, ${my * 0.35}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0,0)';
      });
    });
  }
})();
