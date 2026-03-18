/* ═════════════════════════════════════
   AIOS-X · Particle Canvas System
═════════════════════════════════════ */
(function() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [], nodes = [], connections = [];
  const NUM_PARTICLES = 60;
  const NUM_NODES = 12;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function rnd(a, b) { return Math.random() * (b - a) + a; }

  function initParticles() {
    particles = [];
    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push({
        x: rnd(0, W), y: rnd(0, H),
        vx: rnd(-0.3, 0.3), vy: rnd(-0.3, 0.3),
        r: rnd(1, 2.5),
        alpha: rnd(0.1, 0.5),
        color: ['#38bdf8','#a78bfa','#34d399','#f472b6'][Math.floor(rnd(0,4))]
      });
    }
  }

  function initNodes() {
    nodes = [];
    connections = [];
    for (let i = 0; i < NUM_NODES; i++) {
      nodes.push({
        x: rnd(50, W - 50), y: rnd(50, H - 50),
        vx: rnd(-0.15, 0.15), vy: rnd(-0.15, 0.15),
        r: rnd(2, 5),
        pulse: rnd(0, Math.PI * 2),
        color: ['#38bdf8','#a78bfa','#34d399'][Math.floor(rnd(0,3))]
      });
    }
    // Create connections
    for (let i = 0; i < NUM_NODES; i++) {
      for (let j = i + 1; j < NUM_NODES; j++) {
        if (Math.random() < 0.3) {
          connections.push({
            a: i, b: j,
            packet: Math.random() < 0.4 ? {
              t: rnd(0, 1), speed: rnd(0.003, 0.008)
            } : null
          });
        }
      }
    }
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);

    // Draw connections
    connections.forEach(conn => {
      const na = nodes[conn.a], nb = nodes[conn.b];
      const dx = nb.x - na.x, dy = nb.y - na.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist > 400) return;
      const alpha = (1 - dist / 400) * 0.12;

      ctx.beginPath();
      ctx.moveTo(na.x, na.y);
      ctx.lineTo(nb.x, nb.y);
      ctx.strokeStyle = `rgba(56,189,248,${alpha})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Data packet
      if (conn.packet) {
        conn.packet.t += conn.packet.speed;
        if (conn.packet.t > 1) conn.packet.t = 0;
        const px = na.x + dx * conn.packet.t;
        const py = na.y + dy * conn.packet.t;
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56,189,248,${alpha * 4})`;
        ctx.fill();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      node.pulse += 0.03;
      const glowAlpha = (Math.sin(node.pulse) * 0.5 + 0.5) * 0.3;

      // Glow
      const grd = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.r * 4);
      grd.addColorStop(0, node.color + '44');
      grd.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r * 4, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.globalAlpha = 0.6;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Move
      node.x += node.vx; node.y += node.vy;
      if (node.x < 0 || node.x > W) node.vx *= -1;
      if (node.y < 0 || node.y > H) node.vy *= -1;
    });

    // Draw floating particles
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;

      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;
    });
  }

  function loop() {
    drawFrame();
    requestAnimationFrame(loop);
  }

  resize();
  initParticles();
  initNodes();
  loop();

  window.addEventListener('resize', () => {
    resize();
    initParticles();
    initNodes();
  });

  // Mouse interaction
  document.addEventListener('mousemove', (e) => {
    nodes.forEach(node => {
      const dx = e.clientX - node.x;
      const dy = e.clientY - node.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 120) {
        node.vx += dx * 0.0002;
        node.vy += dy * 0.0002;
        // Clamp
        node.vx = Math.max(-0.5, Math.min(0.5, node.vx));
        node.vy = Math.max(-0.5, Math.min(0.5, node.vy));
      }
    });
  });
})();
