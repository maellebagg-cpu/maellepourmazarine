/* Canvas 2D particle field — atelier gallery atmosphere.
   Self-contained, no external dependencies, works on file:// and http://. */

(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const containers = document.querySelectorAll("[data-particles]");
  if (!containers.length) return;

  const COUNT = 180;
  const COLORS = [
    [232, 220, 200], // cream accent
    [248, 248, 248], // off-white
    [200, 175, 130], // warm gold
  ];

  containers.forEach((container) => {
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      if (!w || !h) return;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    window.addEventListener("resize", resize);
    resize();

    const particles = [];
    const seed = () => {
      particles.length = 0;
      for (let i = 0; i < COUNT; i++) {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z: Math.random() * 0.85 + 0.25,            // depth: 0.25 (far) → 1.10 (close)
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18 - 0.05,    // slight upward drift
          radius: Math.random() * 1.6 + 0.6,
          color,
          baseAlpha: Math.random() * 0.5 + 0.25,
          phase: Math.random() * Math.PI * 2,
          freq: Math.random() * 0.6 + 0.3,
        });
      }
    };
    seed();
    window.addEventListener("resize", () => {
      // re-seed on resize so particles fill the new dimensions evenly
      requestAnimationFrame(seed);
    });

    let t = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      t += 0.016;

      // soft trail: clear with low alpha for slight motion blur
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, w, h);

      // additive blend so colors brighten when they overlap
      ctx.globalCompositeOperation = "lighter";

      for (const p of particles) {
        // organic drift
        p.x += p.vx + Math.sin(t * p.freq + p.phase) * 0.25;
        p.y += p.vy + Math.cos(t * p.freq * 0.7 + p.phase) * 0.2;

        // wrap edges
        if (p.x < -8) p.x = w + 8;
        if (p.x > w + 8) p.x = -8;
        if (p.y < -8) p.y = h + 8;
        if (p.y > h + 8) p.y = -8;

        // pulsing alpha
        const a = p.baseAlpha * (0.7 + 0.3 * Math.sin(t * p.freq * 1.4 + p.phase)) * p.z;
        const r = p.radius * p.z;
        const haloR = r * 5;
        const [cr, cg, cb] = p.color;

        // halo (soft glow)
        const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, haloR);
        halo.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${a * 0.6})`);
        halo.addColorStop(0.4, `rgba(${cr}, ${cg}, ${cb}, ${a * 0.18})`);
        halo.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2);
        ctx.fill();

        // bright core
        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${Math.min(1, a * 1.6)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    animate();
  });
})();
