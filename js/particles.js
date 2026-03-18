/* ═════════════════════════════════════
   AIOS-X · Particle Canvas System
═════════════════════════════════════ */
(function() {
  'use strict';

  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [], mouse = { x: -9999, y: -9999 };
  const COUNT = 80;
  const COLORS = ['#38bdf8','#818cf8','#34d399','#fb923c','#f472b6'];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function randBetween(a, b) { return a + Math.random() * (b - a); }

  function createParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: randBetween(-0.3, 0.3),
      vy: randBetween(-0.4, -0.1),
      r: randBetween(1, 2.5),
      alpha: randBetween(0.1, 0.5),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: COUNT }, createParticle);
  }

  function drawConnections() {
    const MAX_DIST = 120;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < MAX_DIST) {
          const alpha = (1 - d / MAX_DIST) * 0.08;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(56,189,248,${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  function drawMouseConnections() {
    const MAX_DIST = 160;
    particles.forEach(p => {
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < MAX_DIST) {
        const alpha = (1 - d / MAX_DIST) * 0.25;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(56,189,248,${alpha})`;
        ctx.lineWidth = 1;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    });
  }

  function update() {
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      // Mouse repel
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 80) {
        p.x += (dx / d) * 0.5;
        p.y += (dy / d) * 0.5;
      }

      // Wrap
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    drawConnections();
    drawMouseConnections();

    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2,'0');
      ctx.fill();
    });
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

  init();
  loop();
})();
