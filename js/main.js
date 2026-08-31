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

    mouseX += (targetMX - mouseX) * 0.04;
    mouseY += (targetMY - mouseY) * 0.04;

    stars.forEach(s => {
      s.tw += s.twSpeed;
      const alpha = s.baseAlpha + Math.sin(s.tw) * 0.25;
      const px = s.x + mouseX * s.depth * 18;
      const py = s.y + mouseY * s.depth * 18;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${Math.max(alpha, 0)})`;
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', (e) => {
    targetMX = (e.clientX / w - 0.5) * -2;
    targetMY = (e.clientY / h - 0.5) * -2;
  });

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

    document.querySelectorAll('a, button, .work-card, .local-card, input, textarea').forEach(el => {
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
  /* Hero load-in                  */
  /* ============================= */
  window.addEventListener('load', () => {
    document.querySelector('.hero').classList.add('loaded');
  });

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

  /* ============================= */
  /* Tech marquee (monochrome logos) */
  /* ============================= */
  const TECH_LOGOS = [
    { label: 'OpenAI', color: '#10A37F', path: 'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z' },
    { label: 'n8n', color: '#EA4B71', path: 'M21.4737 5.6842c-1.1772 0-2.1663.8051-2.4468 1.8947h-2.8955c-1.235 0-2.289.893-2.492 2.111l-.1038.623a1.263 1.263 0 0 1-1.246 1.0555H11.289c-.2805-1.0896-1.2696-1.8947-2.4468-1.8947s-2.1663.8051-2.4467 1.8947H4.973c-.2805-1.0896-1.2696-1.8947-2.4468-1.8947C1.1311 9.4737 0 10.6047 0 12s1.131 2.5263 2.5263 2.5263c1.1772 0 2.1663-.8051 2.4468-1.8947h1.4223c.2804 1.0896 1.2696 1.8947 2.4467 1.8947 1.1772 0 2.1663-.8051 2.4468-1.8947h1.0008a1.263 1.263 0 0 1 1.2459 1.0555l.1038.623c.203 1.218 1.257 2.111 2.492 2.111h.3692c.2804 1.0895 1.2696 1.8947 2.4468 1.8947 1.3952 0 2.5263-1.131 2.5263-2.5263s-1.131-2.5263-2.5263-2.5263c-1.1772 0-2.1664.805-2.4468 1.8947h-.3692a1.263 1.263 0 0 1-1.246-1.0555l-.1037-.623A2.52 2.52 0 0 0 13.9607 12a2.52 2.52 0 0 0 .821-1.4794l.1038-.623a1.263 1.263 0 0 1 1.2459-1.0555h2.8955c.2805 1.0896 1.2696 1.8947 2.4468 1.8947 1.3952 0 2.5263-1.131 2.5263-2.5263s-1.131-2.5263-2.5263-2.5263m0 1.2632a1.263 1.263 0 0 1 1.2631 1.2631 1.263 1.263 0 0 1-1.2631 1.2632 1.263 1.263 0 0 1-1.2632-1.2632 1.263 1.263 0 0 1 1.2632-1.2631M2.5263 10.7368A1.263 1.263 0 0 1 3.7895 12a1.263 1.263 0 0 1-1.2632 1.2632A1.263 1.263 0 0 1 1.2632 12a1.263 1.263 0 0 1 1.2631-1.2632m6.3158 0A1.263 1.263 0 0 1 10.1053 12a1.263 1.263 0 0 1-1.2632 1.2632A1.263 1.263 0 0 1 7.579 12a1.263 1.263 0 0 1 1.2632-1.2632m10.1053 3.7895a1.263 1.263 0 0 1 1.2631 1.2632 1.263 1.263 0 0 1-1.2631 1.2631 1.263 1.263 0 0 1-1.2632-1.2631 1.263 1.263 0 0 1 1.2632-1.2632' },
    { label: 'Zapier', color: '#FF4A00', path: 'M4.157 0A4.151 4.151 0 0 0 0 4.161v15.678A4.151 4.151 0 0 0 4.157 24h15.682A4.152 4.152 0 0 0 24 19.839V4.161A4.152 4.152 0 0 0 19.839 0H4.157Zm10.61 8.761h.03a.577.577 0 0 1 .23.038.585.585 0 0 1 .201.124.63.63 0 0 1 .162.431.612.612 0 0 1-.162.435.58.58 0 0 1-.201.128.58.58 0 0 1-.23.042.529.529 0 0 1-.235-.042.585.585 0 0 1-.332-.328.559.559 0 0 1-.038-.235.613.613 0 0 1 .17-.431.59.59 0 0 1 .405-.162Zm2.853 1.572c.03.004.061.004.095.004.325-.011.646.064.937.219.238.144.431.355.552.609.128.279.189.582.185.888v.193a2 2 0 0 1 0 .219h-2.498c.003.227.075.45.204.642a.78.78 0 0 0 .646.265.714.714 0 0 0 .484-.136.642.642 0 0 0 .23-.318l.915.257a1.398 1.398 0 0 1-.28.537c-.14.159-.321.284-.521.355a2.234 2.234 0 0 1-.836.136 1.923 1.923 0 0 1-1.001-.245 1.618 1.618 0 0 1-.665-.703 2.221 2.221 0 0 1-.227-1.036 1.95 1.95 0 0 1 .48-1.398 1.9 1.9 0 0 1 1.3-.488Zm-9.607.023c.162.004.325.026.48.079.207.065.4.174.563.314.26.302.393.692.366 1.088v2.276H8.53l-.109-.711h-.065c-.064.163-.155.31-.272.439a1.122 1.122 0 0 1-.374.264 1.023 1.023 0 0 1-.453.083 1.334 1.334 0 0 1-.866-.264.965.965 0 0 1-.329-.801.993.993 0 0 1 .076-.431 1.02 1.02 0 0 1 .242-.363 1.478 1.478 0 0 1 1.043-.303h.952v-.181a.696.696 0 0 0-.136-.454.553.553 0 0 0-.438-.154.695.695 0 0 0-.378.086.48.48 0 0 0-.193.254l-.99-.144a1.26 1.26 0 0 1 .257-.563c.14-.174.321-.302.533-.378.261-.091.54-.136.82-.129.053-.003.106-.007.163-.007Zm4.384.007c.174 0 .347.038.506.114.182.083.34.211.458.374.257.423.377.911.351 1.406a2.53 2.53 0 0 1-.355 1.448 1.148 1.148 0 0 1-1.009.517c-.204 0-.401-.045-.582-.136a1.052 1.052 0 0 1-.48-.457 1.298 1.298 0 0 1-.114-.234h-.045l.004 1.784h-1.059v-4.713h.904l.117.805h.057c.068-.208.177-.401.328-.56a1.129 1.129 0 0 1 .843-.344h.076v-.004Zm7.559.084h.903l.113.805h.053a1.37 1.37 0 0 1 .235-.484.813.813 0 0 1 .313-.242.82.82 0 0 1 .39-.076h.234v1.051h-.401a.662.662 0 0 0-.313.008.623.623 0 0 0-.272.155.663.663 0 0 0-.174.26.683.683 0 0 0-.027.314v1.875h-1.054v-3.666Zm-17.515.003h3.262v.896L3.73 13.104l.034.113h1.973l.042.9H2.4v-.9l1.931-1.754-.045-.117H2.441v-.896Zm11.815 0h1.055v3.659h-1.055V10.45Zm3.443.684.019.016a.69.69 0 0 0-.351.045.756.756 0 0 0-.287.204c-.11.155-.174.336-.189.522h1.545c-.034-.526-.257-.787-.74-.787h.003Zm-5.718.163c-.026 0-.057 0-.083.004a.78.78 0 0 0-.31.053.746.746 0 0 0-.257.189 1.016 1.016 0 0 0-.204.695v.064c-.015.257.057.507.204.711a.634.634 0 0 0 .253.196.638.638 0 0 0 .314.061.644.644 0 0 0 .578-.265c.14-.223.204-.48.189-.74a1.216 1.216 0 0 0-.181-.711.677.677 0 0 0-.503-.257Zm-4.509 1.266a.464.464 0 0 0-.268.102.373.373 0 0 0-.114.276c0 .053.008.106.027.155a.375.375 0 0 0 .087.132.576.576 0 0 0 .397.11v.004a.863.863 0 0 0 .563-.182.573.573 0 0 0 .211-.457v-.14h-.903Z' },
    { label: 'Make', color: '#7B61FF', path: 'M13.38 3.498c-.27 0-.511.19-.566.465L9.85 18.986a.578.578 0 0 0 .453.678l4.095.826a.58.58 0 0 0 .682-.455l2.963-15.021a.578.578 0 0 0-.453-.678l-4.096-.826a.589.589 0 0 0-.113-.012zm-5.876.098a.576.576 0 0 0-.516.318L.062 17.697a.575.575 0 0 0 .256.774l3.733 1.877a.578.578 0 0 0 .775-.258l6.926-13.781a.577.577 0 0 0-.256-.776L7.762 3.658a.571.571 0 0 0-.258-.062zm11.74.115a.576.576 0 0 0-.576.576v15.426c0 .318.258.578.576.578h4.178a.58.58 0 0 0 .578-.578V4.287a.578.578 0 0 0-.578-.576Z' },
    { label: 'Python', color: '#3776AB', path: 'M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z' },
    { label: 'Airtable', color: '#FCB400', path: 'M11.992 1.966c-.434 0-.87.086-1.28.257L1.779 5.917c-.503.208-.49.908.012 1.116l8.982 3.558a3.266 3.266 0 0 0 2.454 0l8.982-3.558c.503-.196.503-.908.012-1.116l-8.957-3.694a3.255 3.255 0 0 0-1.272-.257zM23.4 8.056a.589.589 0 0 0-.222.045l-10.012 3.877a.612.612 0 0 0-.38.564v8.896a.6.6 0 0 0 .821.552L23.62 18.1a.583.583 0 0 0 .38-.551V8.653a.6.6 0 0 0-.6-.596zM.676 8.095a.644.644 0 0 0-.48.19C.086 8.396 0 8.53 0 8.69v8.355c0 .442.515.737.908.54l6.27-3.006.307-.147 2.969-1.436c.466-.22.43-.908-.061-1.092L.883 8.138a.57.57 0 0 0-.207-.044z' },
    { label: 'Slack', color: '#E01E5A', path: 'M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z' },
    { label: 'Shopify', color: '#95BF47', path: 'M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z' },
    { label: 'Stripe', color: '#635BFF', path: 'M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z' },
    { label: 'Notion', color: '#9B9BA8', path: 'M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z' },
    { label: 'Twilio', color: '#F22F46', path: 'M12 0C5.381-.008.008 5.352 0 11.971V12c0 6.64 5.359 12 12 12 6.64 0 12-5.36 12-12 0-6.641-5.36-12-12-12zm0 20.801c-4.846.015-8.786-3.904-8.801-8.75V12c-.014-4.846 3.904-8.786 8.75-8.801H12c4.847-.014 8.786 3.904 8.801 8.75V12c.015 4.847-3.904 8.786-8.75 8.801H12zm5.44-11.76c0 1.359-1.12 2.479-2.481 2.479-1.366-.007-2.472-1.113-2.479-2.479 0-1.361 1.12-2.481 2.479-2.481 1.361 0 2.481 1.12 2.481 2.481zm0 5.919c0 1.36-1.12 2.48-2.481 2.48-1.367-.008-2.473-1.114-2.479-2.48 0-1.359 1.12-2.479 2.479-2.479 1.361-.001 2.481 1.12 2.481 2.479zm-5.919 0c0 1.36-1.12 2.48-2.479 2.48-1.368-.007-2.475-1.113-2.481-2.48 0-1.359 1.12-2.479 2.481-2.479 1.358-.001 2.479 1.12 2.479 2.479zm0-5.919c0 1.359-1.12 2.479-2.479 2.479-1.367-.007-2.475-1.112-2.481-2.479 0-1.361 1.12-2.481 2.481-2.481 1.358 0 2.479 1.12 2.479 2.481z' },
    { label: 'Postgres', color: '#336791', path: 'M23.5594 14.7228a.5269.5269 0 0 0-.0563-.1191c-.139-.2632-.4768-.3418-1.0074-.2321-1.6533.3411-2.2935.1312-2.5256-.0191 1.342-2.0482 2.445-4.522 3.0411-6.8297.2714-1.0507.7982-3.5237.1222-4.7316a1.5641 1.5641 0 0 0-.1509-.235C21.6931.9086 19.8007.0248 17.5099.0005c-1.4947-.0158-2.7705.3461-3.1161.4794a9.449 9.449 0 0 0-.5159-.0816 8.044 8.044 0 0 0-1.3114-.1278c-1.1822-.0184-2.2038.2642-3.0498.8406-.8573-.3211-4.7888-1.645-7.2219.0788C.9359 2.1526.3086 3.8733.4302 6.3043c.0409.818.5069 3.334 1.2423 5.7436.4598 1.5065.9387 2.7019 1.4334 3.582.553.9942 1.1259 1.5933 1.7143 1.7895.4474.1491 1.1327.1441 1.8581-.7279.8012-.9635 1.5903-1.8258 1.9446-2.2069.4351.2355.9064.3625 1.39.3772a.0569.0569 0 0 0 .0004.0041 11.0312 11.0312 0 0 0-.2472.3054c-.3389.4302-.4094.5197-1.5002.7443-.3102.064-1.1344.2339-1.1464.8115-.0025.1224.0329.2309.0919.3268.2269.4231.9216.6097 1.015.6331 1.3345.3335 2.5044.092 3.3714-.6787-.017 2.231.0775 4.4174.3454 5.0874.2212.5529.7618 1.9045 2.4692 1.9043.2505 0 .5263-.0291.8296-.0941 1.7819-.3821 2.5557-1.1696 2.855-2.9059.1503-.8707.4016-2.8753.5388-4.1012.0169-.0703.0357-.1207.057-.1362.0007-.0005.0697-.0471.4272.0307a.3673.3673 0 0 0 .0443.0068l.2539.0223.0149.001c.8468.0384 1.9114-.1426 2.5312-.4308.6438-.2988 1.8057-1.0323 1.5951-1.6698zM2.371 11.8765c-.7435-2.4358-1.1779-4.8851-1.2123-5.5719-.1086-2.1714.4171-3.6829 1.5623-4.4927 1.8367-1.2986 4.8398-.5408 6.108-.13-.0032.0032-.0066.0061-.0098.0094-2.0238 2.044-1.9758 5.536-1.9708 5.7495-.0002.0823.0066.1989.0162.3593.0348.5873.0996 1.6804-.0735 2.9184-.1609 1.1504.1937 2.2764.9728 3.0892.0806.0841.1648.1631.2518.2374-.3468.3714-1.1004 1.1926-1.9025 2.1576-.5677.6825-.9597.5517-1.0886.5087-.3919-.1307-.813-.5871-1.2381-1.3223-.4796-.839-.9635-2.0317-1.4155-3.5126zm6.0072 5.0871c-.1711-.0428-.3271-.1132-.4322-.1772.0889-.0394.2374-.0902.4833-.1409 1.2833-.2641 1.4815-.4506 1.9143-1.0002.0992-.126.2116-.2687.3673-.4426a.3549.3549 0 0 0 .0737-.1298c.1708-.1513.2724-.1099.4369-.0417.156.0646.3078.26.3695.4752.0291.1016.0619.2945-.0452.4444-.9043 1.2658-2.2216 1.2494-3.1676 1.0128zm2.094-3.988-.0525.141c-.133.3566-.2567.6881-.3334 1.003-.6674-.0021-1.3168-.2872-1.8105-.8024-.6279-.6551-.9131-1.5664-.7825-2.5004.1828-1.3079.1153-2.4468.079-3.0586-.005-.0857-.0095-.1607-.0122-.2199.2957-.2621 1.6659-.9962 2.6429-.7724.4459.1022.7176.4057.8305.928.5846 2.7038.0774 3.8307-.3302 4.7363-.084.1866-.1633.3629-.2311.5454zm7.3637 4.5725c-.0169.1768-.0358.376-.0618.5959l-.146.4383a.3547.3547 0 0 0-.0182.1077c-.0059.4747-.054.6489-.115.8693-.0634.2292-.1353.4891-.1794 1.0575-.11 1.4143-.8782 2.2267-2.4172 2.5565-1.5155.3251-1.7843-.4968-2.0212-1.2217a6.5824 6.5824 0 0 0-.0769-.2266c-.2154-.5858-.1911-1.4119-.1574-2.5551.0165-.5612-.0249-1.9013-.3302-2.6462.0044-.2932.0106-.5909.019-.8918a.3529.3529 0 0 0-.0153-.1126 1.4927 1.4927 0 0 0-.0439-.208c-.1226-.4283-.4213-.7866-.7797-.9351-.1424-.059-.4038-.1672-.7178-.0869.067-.276.1831-.5875.309-.9249l.0529-.142c.0595-.16.134-.3257.213-.5012.4265-.9476 1.0106-2.2453.3766-5.1772-.2374-1.0981-1.0304-1.6343-2.2324-1.5098-.7207.0746-1.3799.3654-1.7088.5321a5.6716 5.6716 0 0 0-.1958.1041c.0918-1.1064.4386-3.1741 1.7357-4.4823a4.0306 4.0306 0 0 1 .3033-.276.3532.3532 0 0 0 .1447-.0644c.7524-.5706 1.6945-.8506 2.802-.8325.4091.0067.8017.0339 1.1742.081 1.939.3544 3.2439 1.4468 4.0359 2.3827.8143.9623 1.2552 1.9315 1.4312 2.4543-1.3232-.1346-2.2234.1268-2.6797.779-.9926 1.4189.543 4.1729 1.2811 5.4964.1353.2426.2522.4522.2889.5413.2403.5825.5515.9713.7787 1.2552.0696.087.1372.1714.1885.245-.4008.1155-1.1208.3825-1.0552 1.717-.0123.1563-.0423.4469-.0834.8148-.0461.2077-.0702.4603-.0994.7662zm.8905-1.6211c-.0405-.8316.2691-.9185.5967-1.0105a2.8566 2.8566 0 0 0 .135-.0406 1.202 1.202 0 0 0 .1342.103c.5703.3765 1.5823.4213 3.0068.1344-.2016.1769-.5189.3994-.9533.6011-.4098.1903-1.0957.333-1.7473.3636-.7197.0336-1.0859-.0807-1.1721-.151zm.5695-9.2712c-.0059.3508-.0542.6692-.1054 1.0017-.055.3576-.112.7274-.1264 1.1762-.0142.4368.0404.8909.0932 1.3301.1066.887.216 1.8003-.2075 2.7014a3.5272 3.5272 0 0 1-.1876-.3856c-.0527-.1276-.1669-.3326-.3251-.6162-.6156-1.1041-2.0574-3.6896-1.3193-4.7446.3795-.5427 1.3408-.5661 2.1781-.463zm.2284 7.0137a12.3762 12.3762 0 0 0-.0853-.1074l-.0355-.0444c.7262-1.1995.5842-2.3862.4578-3.4385-.0519-.4318-.1009-.8396-.0885-1.2226.0129-.4061.0666-.7543.1185-1.0911.0639-.415.1288-.8443.1109-1.3505.0134-.0531.0188-.1158.0118-.1902-.0457-.4855-.5999-1.938-1.7294-3.253-.6076-.7073-1.4896-1.4972-2.6889-2.0395.5251-.1066 1.2328-.2035 2.0244-.1859 2.0515.0456 3.6746.8135 4.8242 2.2824a.908.908 0 0 1 .0667.1002c.7231 1.3556-.2762 6.2751-2.9867 10.5405zm-8.8166-6.1162c-.025.1794-.3089.4225-.6211.4225a.5821.5821 0 0 1-.0809-.0056c-.1873-.026-.3765-.144-.5059-.3156-.0458-.0605-.1203-.178-.1055-.2844.0055-.0401.0261-.0985.0925-.1488.1182-.0894.3518-.1226.6096-.0867.3163.0441.6426.1938.6113.4186zm7.9305-.4114c.0111.0792-.049.201-.1531.3102-.0683.0717-.212.1961-.4079.2232a.5456.5456 0 0 1-.075.0052c-.2935 0-.5414-.2344-.5607-.3717-.024-.1765.2641-.3106.5611-.352.297-.0414.6111.0088.6356.1851z' }
  ];
  const marqueeTrack = document.getElementById('marqueeTrack');
  if (marqueeTrack){
    const itemsHTML = TECH_LOGOS.map(({ label, path }, i) => {
      const icon = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${path}"/></svg>`;
      return `<span class="marquee-item" style="--i:${i}"><span class="tech-logo">${icon}</span><span>${label}</span></span><i>·</i>`;
    }).join('');
    marqueeTrack.innerHTML = itemsHTML + itemsHTML;
  }

  const marqueeSection = document.querySelector('.marquee-section');
  if (marqueeSection){
    const marqueeIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          marqueeSection.classList.add('landed');
          marqueeIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });
    marqueeIO.observe(marqueeSection);
  }

  /* ============================= */
  /* Hero icon cluster -> collapses into marquee on scroll */
  /* ============================= */
  const heroCluster = document.getElementById('heroIconCluster');
  if (heroCluster && !isTouch){
    const PHONE_ICON = {
      color: '#FFB020',
      path: 'M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C11.6 21 3 12.4 3 2c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8z'
    };

    // Asymmetric, hand-placed cluster, deliberately not mirrored left/right
    const CLUSTER_LAYOUT = [
      { key: 'Phone', left: '24%', top: '9%', rot: -9, fd: '.2s', sz: 56 },
      { key: 'OpenAI', left: '5%', top: '31%', rot: 16, fd: '1.1s', sz: 50 },
      { key: 'Zapier', left: '71%', top: '8%', rot: -13, fd: '.5s', sz: 46 },
      { key: 'n8n', left: '94%', top: '23%', rot: 9, fd: '1.4s', sz: 60 },
      { key: 'Python', left: '9%', top: '61%', rot: -7, fd: '.8s', sz: 44 },
      { key: 'Stripe', left: '89%', top: '55%', rot: 15, fd: '.3s', sz: 52 },
      { key: 'Slack', left: '19%', top: '84%', rot: -11, fd: '1.6s', sz: 48 },
      { key: 'Shopify', left: '79%', top: '79%', rot: 7, fd: '.65s', sz: 58 },
      { key: 'Twilio', left: '44%', top: '14%', rot: -5, fd: '1.9s', sz: 42 }
    ];

    heroCluster.innerHTML = CLUSTER_LAYOUT.map(({ key, left, top, rot, fd, sz }) => {
      const logo = key === 'Phone' ? PHONE_ICON : TECH_LOGOS.find(l => l.label === key);
      if (!logo) return '';
      const icon = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${logo.path}"/></svg>`;
      return `<div class="hero-icon" style="left:${left}; top:${top};" data-rot="${rot}">
        <div class="hero-icon-float" style="--fd:${fd}">
          <div class="hero-icon-badge" style="--ic:${logo.color}; --sz:${sz}px">${icon}</div>
        </div>
      </div>`;
    }).join('');

    const clusterOuters = [...heroCluster.querySelectorAll('.hero-icon')];
    const clusterBadges = [...heroCluster.querySelectorAll('.hero-icon-badge')];
    const clusterRots = clusterOuters.map(el => parseFloat(el.getAttribute('data-rot')) || 0);
    const heroEl = document.querySelector('.hero');
    const marqueeTargetEl = document.querySelector('.marquee-section');

    function updateHeroFall(){
      if (!marqueeTargetEl) return;
      const heroHeight = heroEl.offsetHeight;
      const progress = Math.min(Math.max(-heroEl.getBoundingClientRect().top / heroHeight, 0), 1);
      const marqueeRect = marqueeTargetEl.getBoundingClientRect();
      const marqueeCenterY = marqueeRect.top + marqueeRect.height / 2;
      const marqueeCenterX = marqueeRect.left + marqueeRect.width / 2;

      clusterOuters.forEach((outer, i) => {
        const badge = clusterBadges[i];
        const outerRect = outer.getBoundingClientRect();
        const baseCenterY = outerRect.top + outerRect.height / 2;
        const baseCenterX = outerRect.left + outerRect.width / 2;

        const translateY = progress * (marqueeCenterY - baseCenterY);
        const translateX = progress * (marqueeCenterX - baseCenterX) * 0.5;
        const scale = 1 - progress * 0.72;
        const rot = (1 - progress) * clusterRots[i];
        const opacity = progress < 0.82 ? 1 : Math.max(0, 1 - (progress - 0.82) / 0.18);

        badge.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${rot}deg)`;
        badge.style.opacity = opacity;
      });
    }
    window.addEventListener('scroll', updateHeroFall, { passive: true });
    window.addEventListener('resize', updateHeroFall);
    updateHeroFall();
  }

  /* ============================= */
  /* Animated stat counters         */
  /* ============================= */
  const statEls = document.querySelectorAll('.stat-num');
  const statIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.getAttribute('data-count'));
      const prefix = el.getAttribute('data-prefix') || '';
      const suffix = el.getAttribute('data-suffix') || '';
      const decimals = parseInt(el.getAttribute('data-decimal') || '0', 10);
      const duration = 1600;
      const start = performance.now();

      function tick(now){
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = target * eased;
        el.textContent = prefix + val.toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = prefix + target.toFixed(decimals) + suffix;
      }
      requestAnimationFrame(tick);

      const row = el.closest('.impact-row');
      if (row){
        const bar = row.querySelector('.impact-row-bar');
        if (bar) requestAnimationFrame(() => { bar.style.width = bar.getAttribute('data-fill'); });
      }

      statIO.unobserve(el);
    });
  }, { threshold: 0.5 });
  statEls.forEach(el => statIO.observe(el));

  /* ============================= */
  /* Timeline progress fill         */
  /* ============================= */
  const timelineItems = document.querySelectorAll('.timeline-item');
  const timelineFill = document.getElementById('timelineFill');
  const timeline = document.querySelector('.timeline');

  function updateTimeline(){
    if (!timeline) return;
    const rect = timeline.getBoundingClientRect();
    const vh = window.innerHeight;
    const progress = Math.min(Math.max((vh * 0.75 - rect.top) / rect.height, 0), 1);
    timelineFill.style.height = (progress * 100) + '%';

    timelineItems.forEach((item, i) => {
      const itemRect = item.getBoundingClientRect();
      if (itemRect.top < vh * 0.75) item.classList.add('active');
      else item.classList.remove('active');
    });
  }
  window.addEventListener('scroll', updateTimeline, { passive: true });
  window.addEventListener('resize', updateTimeline);
  updateTimeline();

  /* ============================= */
  /* Contact form (template)        */
  /* ============================= */
  const form = document.getElementById('contact');
  const formNote = document.getElementById('formNote');
  const formSuccess = document.getElementById('formSuccess');
  const customCheck = document.getElementById('customAutomationsCheck');
  const customField = document.getElementById('customAutomationField');
  const customTextarea = document.getElementById('message');
  customCheck.addEventListener('change', () => {
    const show = customCheck.checked;
    customField.classList.toggle('is-visible', show);
    customTextarea.required = show;
    if (!show) customTextarea.value = '';
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const formData = new FormData(form);
    let website = formData.get('website') || '';
    if (website && !/^https?:\/\//i.test(website)) website = 'https://' + website;
    const payload = {
      name: formData.get('name') || '',
      email: formData.get('email') || '',
      phone: formData.get('phone') || '',
      company: formData.get('company') || '',
      website,
      services: formData.getAll('services'),
      message: formData.get('message') || ''
    };

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'contact_form_submittded',
      ...payload
    });

    submitBtn.disabled = true;
    formNote.textContent = 'Sending...';
    formNote.style.color = 'var(--text-faint)';

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Request failed');
      form.reset();
      customField.classList.remove('is-visible');
      customTextarea.required = false;
      formNote.textContent = '';
      form.style.display = 'none';
      formSuccess.classList.add('is-visible');
    } catch (err) {
      formNote.textContent = 'Something went wrong, please email hello@universeaiconsulting.com directly.';
      formNote.style.color = '#FF5C72';
    } finally {
      submitBtn.disabled = false;
    }
  });

  /* ============================= */
  /* Active nav link on scroll      */
  /* ============================= */
  const sections = document.querySelectorAll('main section[id], .hero');
  const navLinks = document.querySelectorAll('.nav-link');
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.getAttribute('id');
      if (!id) return;
      const link = document.querySelector(`.nav-link[href="#${id}"]`);
      if (!link) return;
      if (entry.isIntersecting){
        navLinks.forEach(l => l.style.color = '');
        link.style.color = 'var(--text)';
      }
    });
  }, { threshold: 0.5 });
  sections.forEach(s => { if (s.id) sectionIO.observe(s); });

  /* ============================= */
  /* Project modal                  */
  /* ============================= */
  const PROJECTS = {
    'testimonial-engine': {
      category: 'Reviews Automation', stack: 'n8n / OpenAI',
      title: 'Testimonial & Review Engine',
      problem: 'Reviews only came in when a customer happened to think of it, so the review count barely moved and the website’s testimonials page hadn’t been touched in over a year. There was no system to ask for reviews, and no way to turn what did come back into usable marketing copy.',
      built: 'An n8n workflow fires the moment a job is marked complete in the CRM, sending a timed SMS or email review request while the experience is still fresh. In parallel, a scheduled job scrapes new Google and Yelp reviews daily, and an OpenAI step reads each one, filters for 4- and 5-star reviews, and drafts a short, publish-ready pull-quote in the business’s own voice. Approved snippets post straight to the website and a social queue. No copy-paste required.',
      result: 'Review volume roughly tripled in the first quarter, the average rating climbed as requests started going out right after a good experience instead of never, and the testimonials page now updates itself instead of sitting stale.',
      tags: ['n8n', 'OpenAI', 'Reviews'],
      accent: '#FFD24C',
      statNum: '3×', statLabel: 'review volume in 90 days',
      flow: [
        { icon: 'check', label: 'Job Completed' },
        { icon: 'sparkles', label: 'AI Drafts & Requests' },
        { icon: 'send', label: 'Published' }
      ],
      tools: [{ name: 'n8n' }, { name: 'OpenAI' }]
    },
    'lead-router': {
      category: 'Local Business Ops', stack: 'n8n / Twilio',
      title: 'Unified Lead Intake & Booking Router',
      problem: 'An HVAC company was pulling in leads from four different places (phone calls, a website form, Google Local Services Ads, and Facebook), each landing in a different inbox or spreadsheet. Leads sat unanswered for hours, and some were never followed up at all.',
      built: 'A single n8n workflow ingests all four sources through webhooks, normalizes and dedupes each contact against the CRM, and enriches it with prior job history. Routine requests from known customers get booked directly onto the calendar; anything ambiguous or high-value triggers an instant SMS to the on-call tech with the customer’s full context already attached.',
      result: 'Average first-response time dropped from over 4 hours to under 3 minutes, and booked-job conversion from inbound leads rose noticeably within the first month.',
      tags: ['n8n', 'Twilio', 'CRM'],
      accent: '#4FE3FF',
      statNum: '3 min', statLabel: 'avg. first response, down from 4+ hrs',
      flow: [
        { icon: 'merge', label: '4 Sources Merge' },
        { icon: 'target', label: 'Matched to CRM' },
        { icon: 'calendar', label: 'Booked or Alerted' }
      ],
      tools: [{ name: 'n8n' }, { name: 'Twilio' }]
    },
    'movein-leadgen': {
      category: 'Lead Generation', stack: 'n8n / Public Records',
      title: 'New-Homeowner Lead Generator',
      problem: 'A residential cleaning company’s best-converting customers were brand-new homeowners: a deep clean is one of the first things people book after a move. But every lead looked the same on a spreadsheet, and by the time anyone reviewed the weekly list and started calling, the best ones were already gone.',
      built: 'A scheduled n8n workflow pulls fresh deed transfer records from the county’s public records feed every morning and filters to owner-occupied residential sales inside the service area. Each new homeowner is then scored against the business’s ideal-customer profile (home value, home size, distance from the shop, and how recently the sale closed) and ranked Hot, Warm, or Cold. The moment a lead scores Hot, it’s pushed immediately as a text straight to the owner’s phone with the homeowner’s name, address, and score attached. No dashboard to check, no weekly list to review.',
      result: 'New-homeowner leads now reach the business within minutes of the deed hitting public record instead of days later. It became one of their top three lead sources within two months, and the team just calls the number that texts them instead of hunting through a spreadsheet.',
      tags: ['n8n', 'Public Records', 'Lead Gen'],
      accent: '#C875FF',
      statNum: 'Top 3', statLabel: 'lead source within 60 days',
      flow: [
        { icon: 'document', label: 'Records Pulled Daily' },
        { icon: 'target', label: 'Scored & Qualified' },
        { icon: 'send', label: 'Delivered Instantly' }
      ],
      tools: [{ name: 'n8n' }, { name: 'Public Records' }],
      extra: `
        <div class="pm-section">
          <div class="pm-section-label">How Leads Are Scored</div>
          <div class="pm-scan-results">
            <div class="pm-scan-field"><span>Home Value</span><span>$410K</span></div>
            <div class="pm-scan-field"><span>Home Size</span><span>4 BR / 3 BA</span></div>
            <div class="pm-scan-field"><span>Distance to Service Area</span><span>3.2 mi</span></div>
            <div class="pm-scan-field"><span>Days Since Closing</span><span>2 days</span></div>
          </div>
          <div class="pm-lead-score">
            <span class="pm-lead-score-num">92<span>/100</span></span>
            <span class="pm-lead-score-tag">Hot Lead</span>
          </div>
        </div>
        <div class="pm-section">
          <div class="pm-section-label">Delivered Instantly</div>
          <div class="pm-alert-card accent">
            <div class="pm-alert-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3a5 5 0 0 0-5 5v3.5c0 .9-.36 1.77-1 2.4L4.5 15.4c-.6.6-.18 1.6.67 1.6h13.66c.85 0 1.27-1 .67-1.6l-1.5-1.5a3.4 3.4 0 0 1-1-2.4V8a5 5 0 0 0-5-5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9.5 19a2.5 2.5 0 0 0 5 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></div>
            <div class="pm-alert-body">
              <div class="pm-alert-title">New Hot Lead: 414 Aiden Ct, Cary NC</div>
              <p>Texted straight to the owner’s phone within minutes of the score clearing 80. No dashboard, no daily digest, just a name and number to call.</p>
            </div>
          </div>
        </div>
      `
    },
    'fulfillment-sync': {
      category: 'Systems', stack: 'Shopify / Stripe',
      title: 'Fulfillment Sync Layer',
      problem: 'Orders, payments, and fulfillment lived in three disconnected systems, requiring manual re-entry that caused mismatched shipments and refund errors.',
      built: 'A resilient sync layer connects the storefront, payment processor, and 3PL, with retry logic and conflict resolution so order state can never drift out of sync.',
      result: 'Double-entry was eliminated and fulfillment errors dropped to near zero.',
      tags: ['Shopify', 'Stripe', 'Systems']
    },
    'market-intel': {
      category: 'Research', stack: 'Claude / Web',
      title: 'Market Intel Pipeline',
      problem: 'Competitive research was happening ad hoc, if at all: nobody had the bandwidth to consistently track competitor pricing, positioning, and moves.',
      built: 'A scheduled research agent scans defined sources every morning, synthesizes findings with Claude, and delivers a structured brief before the team’s first meeting.',
      result: 'The team now starts every day with a current competitive snapshot instead of none at all.',
      tags: ['Claude', 'Automation', 'Research']
    },
    'invoice-recon': {
      category: 'Finance Ops', stack: 'Make / QuickBooks',
      title: 'Invoice Reconciliation',
      problem: 'Matching incoming invoices to payments was a manual, error-prone process that stretched the monthly close to two full days.',
      built: 'An automated matching engine in Make reconciles invoices against QuickBooks payment records and flags only genuine mismatches for human review.',
      result: 'Monthly close time dropped from two days to under an hour.',
      tags: ['Make', 'QuickBooks', 'Finance']
    }
  };

  const modal = document.getElementById('projectModal');
  const modalBody = document.getElementById('projectModalBody');
  const modalBackdrop = document.getElementById('projectModalBackdrop');
  const modalClose = document.getElementById('projectModalClose');
  let lastFocused = null;

  const typewriterTimers = [];

  function runTypewriters(){
    modalBody.querySelectorAll('.pm-typewriter').forEach(el => {
      const text = el.getAttribute('data-text') || '';
      const start = parseFloat(el.getAttribute('data-start') || '0') * 1000;
      const startTimer = setTimeout(() => {
        el.classList.add('pm-typing');
        let i = 0;
        function tick(){
          el.textContent = text.slice(0, i);
          i++;
          if (i <= text.length){
            const jitter = 14 + Math.random() * 22;
            typewriterTimers.push(setTimeout(tick, jitter));
          } else {
            el.classList.remove('pm-typing');
          }
        }
        tick();
      }, start);
      typewriterTimers.push(startTimer);
    });
  }

  function clearTypewriters(){
    typewriterTimers.forEach(t => clearTimeout(t));
    typewriterTimers.length = 0;
  }

  function openModal(html){
    clearTypewriters();
    modalBody.innerHTML = html;
    lastFocused = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('modal-open');
    modalClose.focus();
    runTypewriters();
  }

  function closeModal(){
    clearTypewriters();
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('modal-open');
    modalBody.querySelectorAll('audio').forEach(a => a.pause());
    if (lastFocused) lastFocused.focus();
  }

  const FLOW_ICONS = {
    check: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/><path d="M8.5 12.5l2.3 2.3L16 9.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    sparkles: '<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M19 14.5l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7.7-1.9z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>',
    send: '<path d="M21 3L10.5 13.5M21 3l-7 18-4-8-8-4 19-6z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
    merge: '<path d="M4 4h16l-6.5 8v6L10.5 20v-8L4 4z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
    target: '<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke="currentColor" stroke-width="1.6"/><path d="M8 3v4M16 3v4M3.5 10h17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M9 15l2 2 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
    document: '<path d="M7 2.5h7l4.5 4.5v14.5H7V2.5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M14 2.5V7h4.5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 13h6M10 17h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
  };
  const PUBLIC_RECORDS_ICON = '<path d="M3 21h18M4 21V10l8-6 8 6v11M9 21v-6h6v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>';
  const ARROW_SVG = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function renderProjectFlow(accent, flow){
    if (!flow) return '';
    const nodes = flow.map((f, i) => {
      const node = `<div class="wf-node"><div class="wf-node-icon" style="--wc:${accent}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none">${FLOW_ICONS[f.icon] || ''}</svg></div><span>${f.label}</span></div>`;
      return i < flow.length - 1 ? node + `<div class="wf-arrow">${ARROW_SVG}</div>` : node;
    }).join('');
    return `<div class="wf-flow pm-flow-diagram">${nodes}</div>`;
  }

  function renderProjectTools(tools){
    if (!tools) return '';
    const chips = tools.map(t => {
      if (t.name === 'Public Records'){
        return `<span class="work-stack-icon generic" title="Public Records"><svg viewBox="0 0 24 24" fill="none">${PUBLIC_RECORDS_ICON}</svg></span>`;
      }
      const logo = TECH_LOGOS.find(l => l.label === t.name);
      if (!logo) return '';
      return `<span class="work-stack-icon" style="--tc:${logo.color}" title="${logo.label}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="${logo.path}"/></svg></span>`;
    }).join('');
    return `<div class="work-stack pm-work-stack">${chips}</div>`;
  }

  function openProject(id){
    const p = PROJECTS[id];
    if (!p) return;
    const flowHTML = renderProjectFlow(p.accent, p.flow);
    const toolsHTML = renderProjectTools(p.tools);
    const statHTML = p.statNum ? `<div class="work-stat pm-work-stat" style="--wc:${p.accent}"><span class="work-stat-num">${p.statNum}</span><span class="work-stat-label">${p.statLabel}</span></div>` : '';
    openModal(`
      <div class="pm-meta"><span>${p.category}</span><span class="dot">·</span><span>${p.stack}</span></div>
      <h3 class="pm-title">${p.title}</h3>
      ${flowHTML}
      ${statHTML}
      <div class="pm-section"><div class="pm-section-label">The Problem</div><p>${p.problem}</p></div>
      <div class="pm-section"><div class="pm-section-label">What We Built</div><p>${p.built}</p></div>
      ${p.extra || ''}
      <div class="pm-section"><div class="pm-section-label">The Result</div><p>${p.result}</p></div>
      ${toolsHTML}
      <div class="pm-tags">${p.tags.map(t => `<span class="pm-tag">${t}</span>`).join('')}</div>
    `);
  }

  document.querySelectorAll('.work-card[data-project]').forEach(card => {
    card.addEventListener('click', () => openProject(card.getAttribute('data-project')));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        openProject(card.getAttribute('data-project'));
      }
    });
  });

  /* ============================= */
  /* "See it in action" examples    */
  /* ============================= */
  const CHECK_SVG = '<svg viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const EXAMPLES = {
    receptionist: {
      category: 'Virtual Receptionist', stack: 'Live Call Recording',
      title: 'Hear It Handle a Real Call',
      intro: 'This is an unscripted, real customer call: answered, understood, and handled end-to-end by the AI receptionist. No hold music, no missed call, no "let me transfer you."',
      summary: 'Connor called to book an ongoing weekly house cleaning service for his 3-bedroom, 2-bathroom home in Cary, North Carolina. He requested general cleaning on Wednesday mornings at 8 AM and provided his contact information. The team will follow up with pricing and scheduling details.',
      summaryFields: [
        ['Customer', 'Connor'],
        ['Service', 'Weekly House Cleaning'],
        ['Property', '3 bed / 2 bath, Cary, NC'],
        ['Requested Time', 'Wednesdays, 8:00 AM'],
        ['Phone', '630-485-1419'],
        ['Email', 'test@gmail.com']
      ],
      render(){
        return `
          <div class="pm-meta"><span>${this.category}</span><span class="dot">·</span><span>${this.stack}</span></div>
          <h3 class="pm-title">${this.title}</h3>
          <p class="pm-example-intro">${this.intro}</p>
          <div class="pm-audio-card pm-fade-in" style="--d:0s">
            <div class="pm-audio-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C11.6 21 3 12.4 3 2c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
            <div class="pm-audio-body">
              <div class="pm-audio-title">Incoming Call · 2 min</div>
              <audio controls preload="none" src="assets/receptionist-call-demo.m4a"></audio>
            </div>
          </div>
          <div class="pm-summary-card pm-fade-in" style="--d:.3s">
            <div class="pm-summary-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 6.5L12 13l8.5-6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Auto-Generated Call Summary: Sent Immediately After Hangup</span>
            </div>
            <p class="pm-summary-text">${this.summary}</p>
            <div class="pm-summary-grid">
              ${this.summaryFields.map(([k, v], i) => `<div class="pm-summary-field pm-fade-in" style="--d:${(0.5 + i * 0.12).toFixed(2)}s"><span>${k}</span><span>${v}</span></div>`).join('')}
            </div>
            <div class="pm-summary-footer pm-fade-in" style="--d:1.3s">Next step: follow up with pricing &amp; scheduling</div>
          </div>
        `;
      }
    },
    teammate: {
      category: 'Virtual Teammate', stack: 'Daily Activity Log',
      title: 'A Day in the Life of a Virtual Teammate',
      intro: 'One role, fully owned. Watch a real slice of what a Virtual Teammate checks off in a single day without anyone lifting a finger.',
      log: [
        { time: '8:47 AM', text: 'Order #4471 entered into QuickBooks' },
        { time: '9:15 AM', text: 'Appointment booked for Thursday' },
        { time: '11:40 AM', text: 'Customer address updated in CRM' },
        { time: '1:05 PM', text: 'Reorder draft created for approval' },
        { time: '4:30 PM', text: 'Daily summary sent to owner' }
      ],
      render(){
        return `
          <div class="pm-meta"><span>${this.category}</span><span class="dot">·</span><span>${this.stack}</span></div>
          <h3 class="pm-title">${this.title}</h3>
          <p class="pm-example-intro">${this.intro}</p>
          <ul class="pm-checklist">
            ${this.log.map((l, i) => `
              <li class="pm-check-item" style="--d:${(i * 0.55).toFixed(2)}s">
                <span class="pm-check-circle">${CHECK_SVG}</span>
                <span class="pm-check-text">${l.text}</span>
                <span class="pm-check-time">${l.time}</span>
              </li>
            `).join('')}
          </ul>
        `;
      }
    },
    autobot: {
      category: 'Auto-Bot', stack: 'Document Intake',
      title: 'Reading a Document and Pulling Out What Matters',
      intro: 'Drop in a form, contract, or intake sheet: the Auto-Bot reads it and extracts exactly what your systems need, automatically.',
      fields: [
        ['Name', 'Connor Bolin'],
        ['Email', 'connor@example.com'],
        ['Phone', '(919) 555-0148'],
        ['Address', '412 Maple St, Cary, NC'],
        ['Contract Value', '$2,400 / yr'],
        ['Start Date', 'August 11, 2026']
      ],
      render(){
        return `
          <div class="pm-meta"><span>${this.category}</span><span class="dot">·</span><span>${this.stack}</span></div>
          <h3 class="pm-title">${this.title}</h3>
          <p class="pm-example-intro">${this.intro}</p>
          <div class="pm-scan-doc">
            <div class="pm-scan-line"></div>
            <div class="pm-scan-doc-title">New Client Intake Form</div>
            <div class="pm-scan-doc-row" style="width:78%"></div>
            <div class="pm-scan-doc-row" style="width:88%"></div>
            <div class="pm-scan-doc-row" style="width:62%"></div>
            <div class="pm-scan-doc-row" style="width:70%"></div>
            <div class="pm-scan-doc-row" style="width:50%"></div>
          </div>
          <div class="pm-scan-results-label pm-fade-in" style="--d:1.7s">Extracted automatically</div>
          <div class="pm-scan-results">
            ${this.fields.map(([k, v], i) => `<div class="pm-scan-field pm-fade-in" style="--d:${(1.85 + i * 0.22).toFixed(2)}s"><span>${k}</span><span>${v}</span></div>`).join('')}
          </div>
        `;
      }
    },
    leadfollowup: {
      category: 'Lead Follow-Up Automation', stack: 'Form + SMS Thread',
      title: 'From Form Submission to First Reply in Under a Minute',
      intro: 'Speed is the whole game. Watch a new lead go from form submission to a personal reply, automatically.',
      form: [
        ['Name', 'Sarah Combs'],
        ['Phone', '(919) 555-0199'],
        ['Interested In', 'Kitchen remodel quote']
      ],
      render(){
        return `
          <div class="pm-meta"><span>${this.category}</span><span class="dot">·</span><span>${this.stack}</span></div>
          <h3 class="pm-title">${this.title}</h3>
          <p class="pm-example-intro">${this.intro}</p>
          <div class="pm-form-mock">
            ${this.form.map(([k, v]) => `<div class="pm-form-row"><span>${k}</span><span>${v}</span></div>`).join('')}
            <div class="pm-form-submit" style="--d:.3s">${CHECK_SVG.replace('viewBox="0 0 16 16"', 'viewBox="0 0 16 16" width="16" height="16"')}<span>Submitted</span></div>
          </div>
          <div class="pm-chat">
            <div class="pm-chat-meta pm-fade-in" style="--d:1.1s">Form submitted at 2:41:03 PM</div>
            <div class="pm-chat-typing" style="--d:1.3s"><span></span><span></span><span></span></div>
            <div class="pm-chat-msg out pm-fade-in" style="--d:2.3s">Hi Sarah, thanks for reaching out about a kitchen remodel quote! When’s a good time this week for a quick 10-minute call?</div>
            <div class="pm-chat-meta pm-fade-in" style="--d:2.6s">Sent 44 seconds after form submission</div>
          </div>
        `;
      }
    },
    reviews: {
      category: 'Review & Reputation Management', stack: 'Alert + Client Email',
      title: 'Catching a Bad Review Before It Ever Goes Public',
      intro: 'The moment a low review comes in, the system catches it, raises an internal alert, and gets the business owner in the loop, before anyone else sees it.',
      render(){
        return `
          <div class="pm-meta"><span>${this.category}</span><span class="dot">·</span><span>${this.stack}</span></div>
          <h3 class="pm-title">${this.title}</h3>
          <p class="pm-example-intro">${this.intro}</p>

          <div class="pm-flow-step" style="--d:.1s">
            <span class="pm-flow-step-num">1</span>
            <div class="pm-flow-step-body">
              <span class="pm-flow-step-label">Review Submitted</span>
              <div class="pm-review-card flag">
                <div class="pm-review-stars">★★☆☆☆</div>
                <p>"<span class="pm-typewriter" data-text="Technician was late and didn't explain the pricing clearly." data-start="0.7"></span>"</p>
              </div>
            </div>
          </div>
          <span class="pm-flow-connector" style="--d:2.3s"></span>

          <div class="pm-flow-step" style="--d:2.5s">
            <span class="pm-flow-step-num">2</span>
            <div class="pm-flow-step-body">
              <span class="pm-flow-step-label">Alert Created</span>
              <div class="pm-alert-card">
                <div class="pm-alert-icon">!</div>
                <div class="pm-alert-body">
                  <div class="pm-alert-title">New Review Detected: 2★</div>
                  <p>Flagged internally within seconds, before it ever posted publicly.</p>
                </div>
              </div>
            </div>
          </div>
          <span class="pm-flow-connector" style="--d:3.7s"></span>

          <div class="pm-flow-step" style="--d:3.9s">
            <span class="pm-flow-step-num">3</span>
            <div class="pm-flow-step-body">
              <span class="pm-flow-step-label">Email Sent to Client</span>
              <div class="pm-email-card">
                <div class="pm-email-header"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 6.5L12 13l8.5-6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg> To: owner@riversidelandscaping.com</div>
                <div class="pm-email-subject">Subject: A customer left 2 stars, here's what they said.</div>
                <p class="pm-email-body"><span class="pm-typewriter" data-text="A review just came in below your usual rating. We've drafted a reply for you to review and send whenever you're ready." data-start="4.5"></span></p>
              </div>
            </div>
          </div>
        `;
      }
    },
    invoicing: {
      category: 'Invoicing & Payment Follow-Up', stack: 'Invoice + Reminder Timeline',
      title: 'Invoices That Chase Themselves',
      intro: 'Every invoice follows the same automatic path: no one has to remember to send a reminder.',
      invoice: { number: '#1042', client: 'Riverside Landscaping', amount: '$1,240.00', terms: 'Net 15' },
      timeline: ['Day 0: Invoice #1042 sent automatically', 'Day 7: Friendly reminder sent', 'Day 14: Second reminder sent', 'Day 15: Paid in full'],
      render(){
        return `
          <div class="pm-meta"><span>${this.category}</span><span class="dot">·</span><span>${this.stack}</span></div>
          <h3 class="pm-title">${this.title}</h3>
          <p class="pm-example-intro">${this.intro}</p>
          <div class="pm-invoice-mock">
            <div class="pm-invoice-row"><span>Invoice</span><span>${this.invoice.number}</span></div>
            <div class="pm-invoice-row"><span>Client</span><span>${this.invoice.client}</span></div>
            <div class="pm-invoice-row"><span>Amount</span><span>${this.invoice.amount}</span></div>
            <div class="pm-invoice-row"><span>Terms</span><span>${this.invoice.terms}</span></div>
            <div class="pm-invoice-status" style="--d:.5s"><span class="pm-invoice-badge">${CHECK_SVG.replace('viewBox="0 0 16 16"', 'viewBox="0 0 16 16" width="12" height="12"')} Sent</span></div>
          </div>
          <ul class="pm-timeline-mini">
            ${this.timeline.map((t, i) => `<li style="--d:${(1.1 + i * 0.55).toFixed(2)}s">${t}</li>`).join('')}
          </ul>
        `;
      }
    }
  };

  function openExample(key){
    const ex = EXAMPLES[key];
    if (!ex) return;
    openModal(ex.render());
  }

  document.querySelectorAll('.local-card[data-example]').forEach(card => {
    card.addEventListener('click', () => openExample(card.getAttribute('data-example')));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        openExample(card.getAttribute('data-example'));
      }
    });
  });

  modalBackdrop.addEventListener('click', closeModal);
  modalClose.addEventListener('click', closeModal);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

})();
