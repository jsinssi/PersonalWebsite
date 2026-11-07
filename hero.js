// ============ HERO: animated scenes from my projects ============
// The hero background cycles through small live "simulations" of real projects.
// Each scene has its own drawing code and its own readouts in the HUD panel.
(function () {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const hero = canvas.closest(".hero");
  const titleEl = document.getElementById("hud-title");
  const fieldsEl = document.getElementById("hud-fields");
  const tabsEl = document.getElementById("scene-tabs");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const SCENE_MS = 10000, FADE_MS = 700;
  let W = 0, H = 0, dpr = 1, colors = {}, running = false, raf = 0;
  let sceneIndex = 0, sceneStart = 0, now = 0;

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    const v = (n) => cs.getPropertyValue(n).trim();
    colors = { accent: v("--accent"), text: v("--text"), muted: v("--muted"), border: v("--border"), card: v("--card"), bg: v("--bg") };
  }

  // Area on the right of the hero where scenes draw (text sits on the left)
  let stageTop = 0; // phones: top of the animation area, below the hero text
  function region() {
    if (W <= 600) return { x: 16, y: stageTop, w: W - 32, h: Math.max(200, H - stageTop - 70) };
    const narrow = W < 900;
    const x = narrow ? 16 : W * 0.46;
    const y = narrow ? 80 : 150;
    return { x, y, w: W - x - (narrow ? 16 : 70), h: H - y - (narrow ? 80 : 90) };
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function mono(size, weight) { ctx.font = `${weight || 500} ${size}px 'JetBrains Mono', monospace`; }

  // ------------------------------------------------------------------
  // Scene: SkySpot, drone's-eye car park scan
  // ------------------------------------------------------------------
  const carpark = {
    key: "skyspot", label: "SkySpot", title: "SKYSPOT // LIVE SCAN", href: "#projects",
    fields: ["ALT", "HDG", "MODEL", "FREE"],
    BAY_W: 38, BAY_H: 66, AISLE: 70, COLS: 30,
    init() {
      const { BAY_W, BAY_H, AISLE, COLS } = this;
      const palette = ["#9aa3b2", "#c7ccd4", "#5b6475", "#3a4150", "#b4483f", "#e6e8eb", "#2f5d8a"];
      this.bays = [];
      const rows = Math.ceil(H / (BAY_H * 2 + AISLE)) + 2;
      for (let r = 0; r < rows; r++)
        for (let side = 0; side < 2; side++)
          for (let c = 0; c < COLS; c++)
            this.bays.push({
              x: c * BAY_W, y: r * (BAY_H * 2 + AISLE) + side * BAY_H,
              occupied: Math.random() < 0.68, color: palette[(Math.random() * palette.length) | 0],
              conf: rand(0.71, 0.97), seen: -1e9, jitter: rand(-3, 3),
            });
      this.worldW = COLS * BAY_W;
      this.worldH = rows * (BAY_H * 2 + AISLE);
    },
    draw(t, local) {
      const { BAY_W, BAY_H, AISLE } = this;
      const ox = W < 900 ? 0 : W * 0.42, oy = -60 - ((t * 0.012) % (BAY_H * 2 + AISLE));
      const period = 7000;
      const scanX = ((local % period) / period) * (this.worldW + 200) - 100;
      let free = 0, total = 0;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(-0.06);
      mono(9, 600);
      for (const b of this.bays) {
        if (Math.abs(b.x + BAY_W / 2 - scanX) < 4 && t - b.seen > period * 0.6) {
          b.seen = t;
          if (Math.random() < 0.08) b.occupied = !b.occupied;
        }
        const vis = Math.max(0, 1 - (t - b.seen) / 5500);
        ctx.globalAlpha = 0.35; ctx.strokeStyle = colors.muted; ctx.lineWidth = 1;
        ctx.strokeRect(b.x + 0.5, b.y + 0.5, BAY_W, BAY_H);
        if (b.occupied) {
          ctx.globalAlpha = 0.55; ctx.fillStyle = b.color;
          roundRect(b.x + 7, b.y + 9 + b.jitter, BAY_W - 14, BAY_H - 18, 6); ctx.fill();
          ctx.globalAlpha = 0.25; ctx.fillStyle = "#000";
          roundRect(b.x + 10, b.y + 20 + b.jitter, BAY_W - 20, 12, 3); ctx.fill();
        }
        if (vis > 0) {
          ctx.globalAlpha = vis;
          if (b.occupied) {
            ctx.strokeStyle = colors.accent; ctx.lineWidth = 1.4;
            ctx.strokeRect(b.x + 5, b.y + 7 + b.jitter, BAY_W - 10, BAY_H - 14);
            const label = b.conf.toFixed(2);
            ctx.fillStyle = colors.accent;
            ctx.fillRect(b.x + 5, b.y - 4 + b.jitter, ctx.measureText(label).width + 6, 11);
            ctx.fillStyle = colors.bg; ctx.fillText(label, b.x + 8, b.y + 5 + b.jitter);
          } else {
            ctx.globalAlpha = vis * 0.18; ctx.fillStyle = colors.accent;
            ctx.fillRect(b.x + 2, b.y + 2, BAY_W - 3, BAY_H - 3);
            ctx.globalAlpha = vis; ctx.fillText("FREE", b.x + 6, b.y + BAY_H / 2 + 3);
          }
        }
        const sy = b.y + oy;
        if (sy > 0 && sy < H && b.x + ox > W * 0.45 && b.x + ox < W) { total++; if (!b.occupied) free++; }
      }
      const g = ctx.createLinearGradient(scanX - 120, 0, scanX, 0);
      g.addColorStop(0, "transparent"); g.addColorStop(1, colors.accent);
      ctx.globalAlpha = 0.12; ctx.fillStyle = g; ctx.fillRect(scanX - 120, -200, 120, this.worldH + 400);
      ctx.globalAlpha = 0.9; ctx.fillStyle = colors.accent; ctx.fillRect(scanX, -200, 1.5, this.worldH + 400);
      ctx.restore();
      return [
        (30 + Math.sin(t / 2100) * 0.6).toFixed(1) + " m",
        Math.round(274 + Math.sin(t / 3300) * 2) + "°",
        "YOLOv8s / Hailo-8",
        total ? `${free}/${total} bays` : "--",
      ];
    },
  };

  // ------------------------------------------------------------------
  // Scene: PetWatch, the feeder dispenses on schedule and a dog eats
  // ------------------------------------------------------------------
  const petwatch = {
    key: "petwatch", label: "PetWatch", title: "PETWATCH // FEEDER 01", href: "#projects",
    fields: ["SCHEDULE", "HOPPER", "BOWL", "TEMP / RH"],
    init() { this.falling = []; this.bowl = 0; this.lastDrop = 0; this.eaten = 0; },
    hopperAt(local) { return local < 2000 ? 78 : local < 4200 ? 78 - ((local - 2000) / 2200) * 9 : 69; },
    dogX(local, home, far) {
      if (local < 4300) return far;
      if (local < 5700) { const p = (local - 4300) / 1400; return far + (home - far) * (1 - (1 - p) * (1 - p)); }
      return home;
    },
    draw(t, local) {
      const r = region();
      const k = Math.min(1.5, r.h / 300, r.w / 430);
      const floorY = r.y + r.h * 0.9;
      const bx = r.x + r.w * 0.24, bw = 150 * k, bh = 210 * k, by = floorY - bh;
      ctx.globalAlpha = 1;
      // Floor
      ctx.strokeStyle = colors.muted; ctx.globalAlpha = 0.5; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(r.x + r.w * 0.12, floorY); ctx.lineTo(r.x + r.w, floorY); ctx.stroke();
      // Hopper body (grey 3D print)
      ctx.globalAlpha = 1;
      const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
      g.addColorStop(0, "#7d838c"); g.addColorStop(0.35, "#a9aeb5"); g.addColorStop(1, "#8a9098");
      ctx.fillStyle = g; roundRect(bx, by, bw, bh, 16 * k); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.lineWidth = 1; ctx.stroke();
      // Print layer lines
      ctx.globalAlpha = 0.08; ctx.fillStyle = "#000";
      for (let y = by + 6; y < by + bh - 4; y += 4 * k) ctx.fillRect(bx + 4, y, bw - 8, 1);
      // Lid seam + DHT sensor on top
      ctx.globalAlpha = 0.5; ctx.fillStyle = "#000"; ctx.fillRect(bx + 6, by + 22 * k, bw - 12, 1.5);
      ctx.globalAlpha = 1; ctx.fillStyle = "#2563eb"; roundRect(bx + bw * 0.62, by - 9 * k, 22 * k, 10 * k, 2); ctx.fill();
      ctx.fillStyle = "#e5e7eb"; ctx.fillRect(bx + bw * 0.62 + 3 * k, by - 7 * k, 16 * k, 3 * k);
      mono(Math.max(7, 8 * k), 700); ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillText("PetWatch 1.0", bx + 12 * k, by + 16 * k);
      // Cutaway window showing kibble level
      const wx = bx + 14 * k, wy = by + 34 * k, ww = 52 * k, wh = 120 * k;
      ctx.fillStyle = "#1f2430"; roundRect(wx, wy, ww, wh, 6); ctx.fill();
      const lvl = this.hopperAt(local) / 100;
      const fy = wy + wh * (1 - lvl);
      ctx.save(); roundRect(wx, wy, ww, wh, 6); ctx.clip();
      ctx.fillStyle = "#7a4a22"; ctx.fillRect(wx, fy, ww, wh);
      ctx.fillStyle = "#a8692f";
      for (let yy = fy + 3; yy < wy + wh; yy += 6 * k) for (let xx = wx + ((yy | 0) % 2) * 3; xx < wx + ww; xx += 7 * k) { ctx.beginPath(); ctx.ellipse(xx, yy, 2.6 * k, 1.8 * k, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      // Ultrasonic level sensor beam inside the hopper
      ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t / 120); ctx.strokeStyle = colors.accent; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy + 2); ctx.lineTo(wx + ww / 2, fy); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha = 0.9; mono(Math.max(7, 8 * k), 700); ctx.fillStyle = colors.accent;
      ctx.fillText(Math.round(lvl * 100) + "%", wx + ww + 4, fy + 4);
      // Front face: ultrasonic "eyes" + ESP32 camera
      ctx.globalAlpha = 1;
      const ex = bx + bw * 0.5, ey = by + bh * 0.42;
      ctx.fillStyle = "#c7cbd1"; roundRect(ex, ey, 52 * k, 22 * k, 3); ctx.fill();
      [[ex + 13 * k, ey + 11 * k], [ex + 39 * k, ey + 11 * k]].forEach(([cx, cy]) => {
        ctx.fillStyle = "#d1d5db"; ctx.beginPath(); ctx.arc(cx, cy, 9 * k, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#4b5563"; ctx.beginPath(); ctx.arc(cx, cy, 6 * k, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = "#111827"; ctx.fillRect(ex + 22 * k, ey - 18 * k, 8 * k, 14 * k);
      ctx.fillStyle = "#374151"; ctx.beginPath(); ctx.arc(ex + 26 * k, ey - 11 * k, 3 * k, 0, Math.PI * 2); ctx.fill();
      if (Math.floor(t / 600) % 2) { ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.arc(ex + 34 * k, ey - 16 * k, 2.2 * k, 0, Math.PI * 2); ctx.fill(); }
      // Chute
      const chx = ex + 26 * k, chy = by + bh * 0.68;
      ctx.fillStyle = "#1f2430"; roundRect(chx - 12 * k, chy, 24 * k, 12 * k, 3); ctx.fill();
      // Bowl in front of the feeder
      const bowlCx = bx + bw + 4 * k - 20 * k, bowlTop = floorY - 30 * k, bowlW = 110 * k;
      const bL = bx + bw * 0.55, bR = bL + bowlW;
      ctx.fillStyle = "#9aa0a8";
      ctx.beginPath(); ctx.moveTo(bL, bowlTop); ctx.lineTo(bR, bowlTop); ctx.lineTo(bR - 8 * k, floorY); ctx.lineTo(bL + 8 * k, floorY); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#6b7280"; ctx.beginPath(); ctx.ellipse((bL + bR) / 2, bowlTop, bowlW / 2, 8 * k, 0, 0, Math.PI * 2); ctx.fill();
      // Feed event: kibble falls from the chute into the bowl
      const feeding = local > 2000 && local < 4200;
      if (feeding && t - this.lastDrop > 70) {
        this.falling.push({ x: chx + rand(-5, 5) * k, y: chy + 10 * k, vy: rand(0.5, 1.5), tx: rand(bL + 18 * k, bR - 18 * k) });
        this.lastDrop = t;
      }
      ctx.fillStyle = "#a8692f";
      this.falling = this.falling.filter((p) => {
        p.vy += 0.35; p.y += p.vy; p.x += (p.tx - p.x) * 0.05;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, 3 * k, 2 * k, 0, 0, Math.PI * 2); ctx.fill();
        if (p.y >= bowlTop) { this.bowl++; return false; }
        return true;
      });
      // Dog eats once it arrives
      const eating = local > 5800;
      if (eating && this.bowl > 1 && Math.floor((local - 5800) / 420) > this.eaten) { this.eaten++; this.bowl--; }
      ctx.fillStyle = "#a8692f";
      const shown = Math.min(this.bowl, 22);
      for (let i = 0; i < shown; i++) {
        const px = bL + 16 * k + ((i * 37) % 70) * k * 1.1, py = bowlTop - 2 * k - (i % 3) * 2.5 * k;
        ctx.beginPath(); ctx.ellipse(px, py, 3.2 * k, 2.1 * k, (i % 4) * 0.6, 0, Math.PI * 2); ctx.fill();
      }
      // Dog (faces left towards the bowl)
      const home = bR - 6 * k, far = r.x + r.w + 40;
      const dx = this.dogX(local, home, far);
      if (dx < r.x + r.w + 30) this.drawDog(dx, floorY, k, local, eating);
      // Wall clock: counts up to 12:00, which is feeding time
      const mins = local < 2000 ? 718.5 + (local / 2000) * 1.5 : 720 + (local - 2000) / 3000;
      const ckx = r.x + r.w * 0.82, cky = r.y + 46 * k, cR = 30 * k;
      ctx.globalAlpha = 0.9; ctx.strokeStyle = colors.muted; ctx.lineWidth = 2;
      ctx.fillStyle = colors.card; ctx.beginPath(); ctx.arc(ckx, cky, cR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const ta = (i / 12) * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(ckx + Math.sin(ta) * cR * 0.8, cky - Math.cos(ta) * cR * 0.8);
        ctx.lineTo(ckx + Math.sin(ta) * cR * 0.92, cky - Math.cos(ta) * cR * 0.92); ctx.stroke();
      }
      const hA = ((mins % 720) / 720) * Math.PI * 2, mA = ((mins % 60) / 60) * Math.PI * 2;
      ctx.strokeStyle = colors.text; ctx.lineCap = "round";
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ckx, cky); ctx.lineTo(ckx + Math.sin(hA) * cR * 0.5, cky - Math.cos(hA) * cR * 0.5); ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = colors.accent; ctx.beginPath(); ctx.moveTo(ckx, cky); ctx.lineTo(ckx + Math.sin(mA) * cR * 0.78, cky - Math.cos(mA) * cR * 0.78); ctx.stroke();
      ctx.lineCap = "butt";
      const hh = Math.floor((mins % 720) / 60) || 12, mm2 = Math.floor(mins % 60);
      const clockTxt = String(hh).padStart(2, "0") + ":" + String(mm2).padStart(2, "0");
      mono(Math.max(10, 12 * k), 700); ctx.globalAlpha = 1;
      const feedTime = local >= 2000;
      ctx.fillStyle = feedTime ? colors.accent : colors.muted;
      const lbl = feedTime ? clockTxt + "  FEEDING TIME" : clockTxt;
      ctx.fillText(lbl, ckx - ctx.measureText(lbl).width / 2, cky + cR + 20 * k);
      ctx.globalAlpha = 1;
      const temp = 21.6 + Math.sin(t / 4000) * 0.4, rh = 57 + Math.sin(t / 5000) * 2;
      return [
        local < 2000 ? "NEXT 12:00" : feeding ? "DISPENSING" : "DONE 12:00",
        Math.round(this.hopperAt(local)) + " %",
        this.bowl > 0 ? Math.min(this.bowl, 22) + " pcs" + (eating ? " (eating)" : "") : "EMPTY",
        temp.toFixed(1) + "°C / " + rh.toFixed(0) + "%",
      ];
    },
    drawDog(dx, floorY, k, local, eating) {
      const walking = local > 4300 && local < 5700;
      const step = walking ? Math.sin(local / 70) : 0;
      const coat = "#3b3029", tan = "#b7834f", white = "#efe9e1";
      ctx.globalAlpha = 1;
      // Legs
      const legs = [[14, 1], [26, -1], [58, 1], [70, -1]];
      ctx.fillStyle = coat;
      legs.forEach(([lx, ph]) => {
        ctx.save(); ctx.translate(dx + lx * k, floorY - 30 * k); ctx.rotate(step * ph * 0.35);
        roundRect(-3.5 * k, 0, 7 * k, 30 * k, 3 * k); ctx.fill(); ctx.restore();
      });
      // Tail
      ctx.strokeStyle = coat; ctx.lineWidth = 5 * k; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(dx + 78 * k, floorY - 52 * k);
      ctx.quadraticCurveTo(dx + 96 * k, floorY - (70 + Math.sin(local / 90) * 6) * k, dx + 92 * k, floorY - 82 * k); ctx.stroke();
      ctx.lineCap = "butt";
      // Body
      ctx.fillStyle = coat; ctx.beginPath(); ctx.ellipse(dx + 44 * k, floorY - 46 * k, 38 * k, 17 * k, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = white; ctx.beginPath(); ctx.ellipse(dx + 20 * k, floorY - 40 * k, 12 * k, 10 * k, 0, 0, Math.PI * 2); ctx.fill();
      // Neck + head (lowered into the bowl when eating)
      const bob = eating ? Math.abs(Math.sin(local / 210)) * 4 * k : 0;
      const hx = dx + (eating ? -6 : 0) * k, hy = floorY - (eating ? 36 : 70) * k + bob;
      ctx.strokeStyle = coat; ctx.lineWidth = 14 * k; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(dx + 16 * k, floorY - 50 * k); ctx.lineTo(hx + 8 * k, hy); ctx.stroke(); ctx.lineCap = "butt";
      ctx.fillStyle = coat; ctx.beginPath(); ctx.arc(hx + 4 * k, hy, 13 * k, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = tan; ctx.beginPath(); ctx.ellipse(hx - 9 * k, hy + 4 * k, 9 * k, 6 * k, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(hx - 17 * k, hy + 2 * k, 2.5 * k, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(hx - 1 * k, hy - 4 * k, 2.4 * k, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(hx - 1.5 * k, hy - 4 * k, 1.3 * k, 0, Math.PI * 2); ctx.fill();
      // Big upright ears
      ctx.fillStyle = coat;
      ctx.beginPath(); ctx.moveTo(hx + 4 * k, hy - 8 * k); ctx.lineTo(hx + 12 * k, hy - 30 * k); ctx.lineTo(hx + 16 * k, hy - 6 * k); ctx.closePath(); ctx.fill();
      ctx.fillStyle = tan;
      ctx.beginPath(); ctx.moveTo(hx + 8 * k, hy - 10 * k); ctx.lineTo(hx + 12 * k, hy - 24 * k); ctx.lineTo(hx + 13 * k, hy - 9 * k); ctx.closePath(); ctx.fill();
      // Collar
      ctx.fillStyle = "#e11d74"; ctx.fillRect(hx + 10 * k, hy + 6 * k, 6 * k, 10 * k);
    },
  };

  // ------------------------------------------------------------------
  // Scene: Trosure, side view of the device inserting through tissue
  // ------------------------------------------------------------------
  const trosure = {
    key: "trosure", label: "Trosure", title: "TROSURE // FORCE-LIMITED ENTRY", href: "#projects",
    fields: ["FORCE LIMIT", "FORCE", "DEPTH", "SHIELD"],
    MAX_D: 50,
    layers: [
      { name: "SKIN", from: 0, to: 4, a: 0.55 },
      { name: "FAT", from: 4, to: 22, a: 0.22 },
      { name: "MUSCLE", from: 22, to: 38, a: 0.4 },
      { name: "PERITONEUM", from: 38, to: 42, a: 0.7 },
    ],
    limits: [24, 30, 36],
    init() { this.cycle = (this.cycle || 0) + 1; this.prevLimit = this.limit || 30; this.limit = this.limits[this.cycle % this.limits.length]; },
    rawForce(d) {
      if (d < 3) return (d / 3) * 13;
      if (d < 4) return 13 - (d - 3) * 6;
      if (d < 22) return 7 + ((d - 4) / 18) * 3;
      if (d < 38) return 10 + ((d - 22) / 16) * 24;
      if (d < 41) return 34 + (d - 38) * 3;
      if (d < 42) return 43 - (d - 41) * 40;
      return 3;
    },
    depthAt(local) {
      if (local < 1400) return -8;
      if (local < 6600) return -8 + ((local - 1400) / 5200) * 54;
      if (local < 8000) return 46;
      return 46 - ((local - 8000) / 1700) * 54;
    },
    drawDevice(tipX, cy, k, local, d, force, through) {
      // Obturator tip (cone)
      const steel = (y0, h) => { const g = ctx.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, "#6b7280"); g.addColorStop(0.35, "#f3f4f6"); g.addColorStop(0.6, "#cbd0d6"); g.addColorStop(1, "#4b5563"); return g; };
      const shaftH = 16 * k, shaftL = 210 * k, coneL = 22 * k;
      ctx.globalAlpha = 1;
      ctx.fillStyle = steel(cy - shaftH / 2, shaftH);
      ctx.beginPath(); ctx.moveTo(tipX, cy); ctx.lineTo(tipX - coneL, cy - shaftH / 2 + 1); ctx.lineTo(tipX - coneL, cy + shaftH / 2 - 1); ctx.closePath(); ctx.fill();
      // Cannula shaft
      ctx.fillRect(tipX - coneL - shaftL, cy - shaftH / 2, shaftL, shaftH);
      ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(tipX - coneL - 4 * k, cy - shaftH / 2, 3 * k, shaftH); // cannula lip
      // Safety shield springs over the blade on breakthrough
      if (through) {
        const ext = clamp((local - 6700) / 250, 0, 1);
        ctx.fillStyle = colors.accent; ctx.globalAlpha = 0.95;
        roundRect(tipX - coneL - 20 * k, cy - shaftH / 2 - 3 * k, 20 * k + ext * coneL + 4 * k, shaftH + 6 * k, 5 * k); ctx.fill();
        ctx.globalAlpha = 1;
      }
      // Valve housing with cone, knurled dial and stopcock
      const hx = tipX - coneL - shaftL;
      ctx.fillStyle = steel(cy - 24 * k, 48 * k);
      ctx.beginPath(); ctx.moveTo(hx, cy - shaftH / 2); ctx.lineTo(hx - 22 * k, cy - 22 * k); ctx.lineTo(hx - 22 * k, cy + 22 * k); ctx.lineTo(hx, cy + shaftH / 2); ctx.closePath(); ctx.fill();
      ctx.fillRect(hx - 52 * k, cy - 22 * k, 30 * k, 44 * k);
      // Stopcock on top
      ctx.fillRect(hx - 40 * k, cy - 52 * k, 8 * k, 30 * k);
      ctx.fillRect(hx - 48 * k, cy - 56 * k, 24 * k, 7 * k);
      ctx.fillStyle = "#f3f4f6"; ctx.fillRect(hx - 30 * k, cy - 46 * k, 20 * k, 4 * k);
      // Knurled dial: ridges scroll while the limit is being set
      const dialX = hx - 70 * k, dialW = 18 * k, dialH = 58 * k;
      ctx.fillStyle = "#9ca3af"; roundRect(dialX, cy - dialH / 2, dialW, dialH, 3 * k); ctx.fill();
      const spin = local < 1300 ? local / 40 : 1300 / 40;
      ctx.fillStyle = "#4b5563";
      for (let i = 0; i < 12; i++) {
        const yy = cy - dialH / 2 + (((i * 5 + spin) % 60) / 60) * dialH;
        ctx.fillRect(dialX, yy, dialW, 1.6 * k);
      }
      // Blue seal ring
      ctx.fillStyle = "#1e3a8a"; ctx.fillRect(dialX - 8 * k, cy - 18 * k, 6 * k, 36 * k);
      // Red handle: body + pistol grip with finger grooves
      const bodyR = dialX - 10 * k, bodyL = bodyR - 120 * k;
      const red = ctx.createLinearGradient(0, cy - 28 * k, 0, cy + 28 * k);
      red.addColorStop(0, "#e04a3f"); red.addColorStop(0.45, "#b92d23"); red.addColorStop(1, "#7f1d1d");
      ctx.fillStyle = red;
      ctx.beginPath();
      ctx.moveTo(bodyR, cy - 20 * k);
      ctx.lineTo(bodyR - 20 * k, cy - 28 * k);
      ctx.lineTo(bodyL + 10 * k, cy - 30 * k);
      ctx.quadraticCurveTo(bodyL, cy - 30 * k, bodyL, cy - 18 * k);
      ctx.lineTo(bodyL + 4 * k, cy + 26 * k);
      // grip down and back
      ctx.lineTo(bodyL - 8 * k, cy + 120 * k);
      ctx.quadraticCurveTo(bodyL - 8 * k, cy + 132 * k, bodyL + 6 * k, cy + 132 * k);
      ctx.lineTo(bodyL + 46 * k, cy + 130 * k);
      // finger grooves on the front of the grip
      ctx.quadraticCurveTo(bodyL + 40 * k, cy + 116 * k, bodyL + 48 * k, cy + 104 * k);
      ctx.quadraticCurveTo(bodyL + 40 * k, cy + 92 * k, bodyL + 48 * k, cy + 80 * k);
      ctx.quadraticCurveTo(bodyL + 40 * k, cy + 68 * k, bodyL + 50 * k, cy + 56 * k);
      ctx.quadraticCurveTo(bodyL + 46 * k, cy + 34 * k, bodyL + 70 * k, cy + 26 * k);
      ctx.lineTo(bodyR - 20 * k, cy + 22 * k);
      ctx.lineTo(bodyR, cy + 18 * k);
      ctx.closePath(); ctx.fill();
      // Gloss highlight
      ctx.globalAlpha = 0.25; ctx.fillStyle = "#fff";
      roundRect(bodyL + 12 * k, cy - 24 * k, 80 * k, 6 * k, 3 * k); ctx.fill(); ctx.globalAlpha = 1;
      // Trigger
      ctx.fillStyle = "#1f2937"; roundRect(bodyL + 56 * k, cy + 26 * k, 14 * k, 8 * k, 2 * k); ctx.fill();
      // Logo
      ctx.font = `600 ${Math.max(9, 13 * k)}px 'Space Grotesk', sans-serif`; ctx.fillStyle = "#fde8e6";
      ctx.fillText("TroSure", bodyL + 30 * k, cy - 6 * k);
      // Display (on the rear face)
      const dW = 34 * k, dH = 46 * k, dX = bodyL - 10 * k - dW, dY = cy - 26 * k;
      ctx.fillStyle = "#7f1d1d"; roundRect(dX - 4 * k, dY - 4 * k, dW + 12 * k, dH + 8 * k, 6 * k); ctx.fill();
      ctx.fillStyle = "#0b1220"; roundRect(dX, dY, dW, dH, 3 * k); ctx.fill();
      const shownLimit = local < 1300 ? Math.round(this.prevLimit + (this.limit - this.prevLimit) * (local / 1300)) : this.limit;
      mono(Math.max(6, 7 * k), 700); ctx.fillStyle = "#93c5fd";
      ctx.fillText("LIM", dX + 4 * k, dY + 10 * k);
      ctx.fillText(shownLimit + "N", dX + 4 * k, dY + 19 * k);
      const fb = clamp(force / this.limit, 0, 1);
      ctx.fillStyle = "#1e293b"; ctx.fillRect(dX + 4 * k, dY + 24 * k, dW - 8 * k, 6 * k);
      ctx.fillStyle = fb > 0.97 ? "#f59e0b" : "#60a5fa"; ctx.fillRect(dX + 4 * k, dY + 24 * k, (dW - 8 * k) * fb, 6 * k);
      ctx.fillStyle = through ? "#4ade80" : "#93c5fd";
      ctx.fillText(through ? "SAFE" : force.toFixed(0) + "N", dX + 4 * k, dY + 41 * k);
    },
    draw(t, local) {
      const r = region();
      const k = Math.min(1, r.w / 640, r.h / 420);
      const d = this.depthAt(local);
      const dd = clamp(d, 0, 50);
      const through = d >= 42;
      const force = d <= 0 ? 0 : Math.min(this.rawForce(dd), this.limit);
      const mm = (r.w * 0.28) / this.MAX_D;
      const x0 = r.x + r.w * 0.66;
      const top = r.y + r.h * 0.06, bot = r.y + r.h * 0.62, cy = r.y + r.h * 0.3;
      const tipX = x0 + d * mm;
      // Device first; tissue is drawn over it so the part inside looks embedded
      this.drawDevice(tipX, cy, k, local, d, force, through);
      this.layers.forEach((L) => {
        const lx = x0 + L.from * mm, lw = (L.to - L.from) * mm;
        ctx.globalAlpha = L.a * 0.8; ctx.fillStyle = L.name === "PERITONEUM" ? colors.accent : L.name === "MUSCLE" ? "#b45454" : L.name === "SKIN" ? "#d9a38a" : "#e8cf8f";
        ctx.fillRect(lx, top, lw, bot - top);
      });
      // Layer labels (vertical) + cavity
      mono(9, 700); ctx.fillStyle = colors.muted; ctx.globalAlpha = 0.95;
      this.layers.forEach((L) => {
        ctx.save(); ctx.translate(x0 + ((L.from + L.to) / 2) * mm + 3, bot - 6); ctx.rotate(-Math.PI / 2); ctx.fillText(L.name, 0, 0); ctx.restore();
      });
      ctx.fillText("CAVITY", x0 + 43 * mm, bot - 6);
      // Force vs depth chart along the bottom
      const gx = x0 - 0, gw = 50 * mm, gy = bot + 26, gh = Math.max(60, r.y + r.h - gy - 8), fmax = 46;
      ctx.globalAlpha = 0.5; ctx.strokeStyle = colors.muted; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();
      mono(9, 600); ctx.globalAlpha = 0.85; ctx.fillStyle = colors.muted;
      ctx.fillText("FORCE (N)", gx - 64, gy + 8); ctx.fillText("DEPTH →", gx + gw - 48, gy + gh + 13);
      const ly = gy + gh - (this.limit / fmax) * gh;
      ctx.strokeStyle = colors.accent; ctx.setLineDash([5, 4]); ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.moveTo(gx, ly); ctx.lineTo(gx + gw, ly); ctx.stroke(); ctx.setLineDash([]);
      mono(9, 700); ctx.fillStyle = colors.accent; ctx.fillText(`LIMIT ${this.limit} N`, gx - 64, ly + 3);
      const plot = (cap, upto, alpha, width, dash) => {
        ctx.beginPath(); ctx.setLineDash(dash);
        for (let i = 0; i <= 160; i++) {
          const q = (i / 160) * upto, f = cap ? Math.min(this.rawForce(q), this.limit) : this.rawForce(q);
          const x = gx + q * mm, y = gy + gh - (f / fmax) * gh;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.globalAlpha = alpha; ctx.lineWidth = width; ctx.stroke(); ctx.setLineDash([]);
      };
      ctx.strokeStyle = colors.muted; plot(false, 46, 0.5, 1, [2, 3]);
      if (dd > 0) { ctx.strokeStyle = colors.accent; plot(true, Math.min(dd, 46), 1, 2.2, []); }
      if (dd > 0 && dd <= 46) {
        ctx.globalAlpha = 1; ctx.fillStyle = colors.accent;
        ctx.beginPath(); ctx.arc(gx + dd * mm, gy + gh - (force / fmax) * gh, 4, 0, Math.PI * 2); ctx.fill();
        if (this.rawForce(dd) > this.limit && !through) { mono(9, 700); ctx.fillText("CAPPED", gx + dd * mm + 7, gy + gh - (force / fmax) * gh - 6); }
      }
      return [this.limit + " N", force.toFixed(1) + " N", Math.max(0, d).toFixed(0) + " mm", through ? "DEPLOYED" : "ARMED"];
    },
  };

  // ------------------------------------------------------------------
  // Scene: Headstrong, side view. The head starts slumped forward on a
  // deflated collar; as the tubes inflate they lift the head upright.
  // The head angle is driven by the tube inflation, never the reverse.
  // ------------------------------------------------------------------
  const headstrong = {
    key: "headstrong", label: "Headstrong", title: "HEADSTRONG", href: "#projects",
    fields: [],
    init() { this.hist = []; this.lastS = -1; },
    ease(p) { p = clamp(p, 0, 1); return p * p * (3 - 2 * p); },
    inflation(local) {
      // Front tubes: inflate, hold, ease back slightly to a comfortable setting
      let f = this.ease((local - 1000) / 3400);
      if (local > 6600) f = 1 - 0.25 * this.ease((local - 6600) / 1400);
      // Back tubes inflate a little to stabilise
      const b = 0.15 + 0.35 * this.ease((local - 1600) / 3000);
      return { f, b };
    },
    headPath(s) {
      // Profile facing right, origin at the top of the neck
      ctx.beginPath();
      ctx.moveTo(-26 * s, 4 * s);
      ctx.bezierCurveTo(-48 * s, -10 * s, -50 * s, -62 * s, -18 * s, -84 * s);
      ctx.bezierCurveTo(6 * s, -98 * s, 40 * s, -88 * s, 46 * s, -60 * s);
      ctx.lineTo(48 * s, -46 * s);
      ctx.lineTo(60 * s, -30 * s);
      ctx.lineTo(50 * s, -24 * s);
      ctx.quadraticCurveTo(54 * s, -18 * s, 50 * s, -14 * s);
      ctx.quadraticCurveTo(54 * s, -8 * s, 48 * s, -2 * s);
      ctx.quadraticCurveTo(46 * s, 8 * s, 34 * s, 8 * s);
      ctx.lineTo(16 * s, 6 * s);
      ctx.closePath();
    },
    draw(t, local) {
      const r = region();
      const s = Math.min(1.6, r.h / 270, r.w / 400);
      const { f, b } = this.inflation(local);
      // Head angle follows the front tubes: slumped at 34 deg, lifted to ~5 deg
      const ang = 34 - 29 * f + Math.sin(local / 700) * 0.6;
      const px = r.x + r.w * 0.32, py = r.y + r.h * 0.78;
      const neckL = 46 * s;
      // Shoulders
      ctx.globalAlpha = 1; ctx.lineWidth = 2; ctx.strokeStyle = colors.text; ctx.fillStyle = colors.card;
      ctx.beginPath();
      ctx.moveTo(px - 90 * s, r.y + r.h + 10);
      ctx.bezierCurveTo(px - 92 * s, py + 30 * s, px - 60 * s, py + 2 * s, px - 22 * s, py);
      ctx.lineTo(px + 26 * s, py);
      ctx.bezierCurveTo(px + 60 * s, py + 8 * s, px + 74 * s, py + 40 * s, px + 70 * s, r.y + r.h + 10);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // Neck + head
      const a = (ang * Math.PI) / 180;
      ctx.save(); ctx.translate(px, py); ctx.rotate(a);
      ctx.fillStyle = colors.card;
      ctx.beginPath(); ctx.moveTo(-20 * s, 2); ctx.lineTo(-18 * s, -neckL); ctx.lineTo(16 * s, -neckL); ctx.lineTo(22 * s, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.translate(0, -neckL);
      this.headPath(s); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-6 * s, -40 * s, 6 * s, 10 * s, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = colors.text; ctx.beginPath(); ctx.arc(34 * s, -44 * s, 2.4 * s, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // Chin position in world space, so the front tubes can rise to meet it
      const chinLocal = { x: 36 * s, y: -neckL + 8 * s };
      const chinX = px + chinLocal.x * Math.cos(a) - chinLocal.y * Math.sin(a);
      const chinY = py + chinLocal.x * Math.sin(a) + chinLocal.y * Math.cos(a);
      // Collar tubes
      const tubes = 9, cw = 92 * s, baseY = py + 4 * s;
      for (let i = 0; i < tubes; i++) {
        const q = i / (tubes - 1); // 0 = back, 1 = front
        const x = px - cw / 2 + q * cw;
        const isFront = q > 0.62, isBack = q < 0.38;
        const infl = isFront ? f : isBack ? b : (f + b) * 0.35;
        let h = (30 + infl * 26) * s * (0.85 + Math.sin(q * Math.PI) * 0.15);
        // The front-most tubes sit under the chin: their tops follow it as they lift the head
        if (isFront) h = Math.max(h * 0.6, Math.min(h, baseY - chinY - 2));
        const w = 10 * s;
        ctx.globalAlpha = isFront || isBack ? 1 : 0.75;
        ctx.fillStyle = infl > 0.08 ? colors.accent : colors.card;
        ctx.strokeStyle = infl > 0.08 ? colors.accent : colors.muted;
        ctx.lineWidth = 1.5;
        roundRect(x - w / 2, baseY - h, w, h, w / 2); ctx.fill(); ctx.stroke();
        if (infl > 0.08) { ctx.globalAlpha = 0.35; ctx.fillStyle = "#fff"; roundRect(x - w / 2 + 2, baseY - h + 3, 2.5, Math.max(2, h - 8), 1.5); ctx.fill(); }
      }
      ctx.globalAlpha = 0.9; ctx.fillStyle = colors.muted; ctx.fillRect(px - cw / 2 - 8 * s, baseY - 6 * s, cw + 16 * s, 8 * s);
      // Tilt arc + label
      ctx.globalAlpha = 0.9; ctx.strokeStyle = colors.accent; ctx.lineWidth = 1.5;
      const R = 165 * s;
      ctx.beginPath(); ctx.arc(px, py, R, -Math.PI / 2, -Math.PI / 2 + a); ctx.stroke();
      ctx.setLineDash([3, 4]); ctx.strokeStyle = colors.muted;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - R - 10); ctx.stroke(); ctx.setLineDash([]);
      mono(13, 700); ctx.fillStyle = colors.accent;
      ctx.fillText(ang.toFixed(0) + "°", px + Math.sin(a) * (R + 8) + 6, py - Math.cos(a) * (R + 8));
      // Chart: forward tilt falls as inflation rises
      if (local - this.lastS > 40) { this.hist.push({ local, ang, f }); this.lastS = local; }
      const gx = r.x + r.w * 0.62, gw = r.x + r.w - gx, gy = r.y + r.h * 0.12, gh = r.h * 0.45, amax = 40;
      ctx.globalAlpha = 0.5; ctx.strokeStyle = colors.muted; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();
      const ty = gy + gh - (10 / amax) * gh;
      ctx.globalAlpha = 0.1; ctx.fillStyle = colors.accent; ctx.fillRect(gx, ty, gw, gy + gh - ty);
      mono(9, 700); ctx.globalAlpha = 0.85; ctx.fillStyle = colors.muted;
      ctx.fillText("HEAD TILT (°)", gx, gy - 6);
      ctx.fillStyle = colors.accent; ctx.fillText("TARGET < 10°", gx + gw - 84, ty - 5);
      ctx.globalAlpha = 1; ctx.strokeStyle = colors.accent; ctx.lineWidth = 2; ctx.beginPath();
      this.hist.forEach((h, i) => { const x = gx + (h.local / SCENE_MS) * gw, y = gy + gh - (h.ang / amax) * gh; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
      // Pressure bars
      [["FRONT", 2 + f * 6], ["BACK", 2 + b * 6]].forEach(([n, p], i) => {
        const y = gy + gh + 30 + i * 26;
        mono(10, 700); ctx.globalAlpha = 0.9; ctx.fillStyle = colors.muted; ctx.fillText(n, gx, y + 9);
        ctx.globalAlpha = 0.25; ctx.fillRect(gx + 50, y, gw - 96, 10);
        ctx.globalAlpha = 1; ctx.fillStyle = colors.accent; ctx.fillRect(gx + 50, y, (gw - 96) * (p / 10), 10);
        ctx.fillStyle = colors.text; ctx.fillText(p.toFixed(1) + " kPa", gx + gw - 40, y + 9);
      });
      return [];
    },
  };

  const scenes = [carpark, petwatch, trosure, headstrong];

  // ------------------------------------------------------------------
  // HUD + tabs
  // ------------------------------------------------------------------
  let ddEls = [];
  function setHud(scene) {
    if (titleEl) titleEl.textContent = scene.title;
    if (fieldsEl) {
      fieldsEl.innerHTML = "";
      ddEls = scene.fields.map((f) => {
        const row = document.createElement("div");
        const dt = document.createElement("dt"); dt.textContent = f;
        const dd = document.createElement("dd"); dd.textContent = "--";
        row.append(dt, dd); fieldsEl.append(row);
        return dd;
      });
    }
    if (tabsEl) tabsEl.querySelectorAll("button").forEach((b, i) => {
      b.classList.toggle("active", i === sceneIndex);
      b.setAttribute("aria-pressed", i === sceneIndex);
    });
  }
  if (tabsEl) {
    scenes.forEach((s, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = `<span class="bar"><span></span></span><span class="txt">${s.label}</span>`;
      b.addEventListener("click", () => goTo(i));
      tabsEl.append(b);
    });
  }

  function goTo(i) {
    sceneIndex = (i + scenes.length) % scenes.length;
    sceneStart = now;
    scenes[sceneIndex].init();
    setHud(scenes[sceneIndex]);
    if (!running) frame(now);
  }

  function frame(t) {
    now = t;
    let local = t - sceneStart;
    if (!reduceMotion && local > SCENE_MS) { goTo(sceneIndex + 1); local = 0; }
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    const vals = scenes[sceneIndex].draw(t, reduceMotion ? 8000 : local) || [];
    ctx.restore();
    ctx.globalAlpha = 1;
    // Crossfade by veiling with the background colour
    if (!reduceMotion) {
      const a = clamp(Math.min(local / FADE_MS, (SCENE_MS - local) / FADE_MS), 0, 1);
      if (a < 1) { ctx.globalAlpha = 1 - a; ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    }
    vals.forEach((v, i) => { if (ddEls[i] && ddEls[i].textContent !== v) ddEls[i].textContent = v; });
    // Progress bar on the active tab
    if (tabsEl) {
      const bar = tabsEl.querySelector("button.active .bar span");
      if (bar) bar.style.transform = `scaleX(${reduceMotion ? 1 : clamp(local / SCENE_MS, 0, 1)})`;
    }
  }

  function loop(t) { frame(t); if (running) raf = requestAnimationFrame(loop); }
  function start() { if (running || reduceMotion) return; running = true; raf = requestAnimationFrame(loop); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  function resize() {
    const r = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    const inner = hero.querySelector(".hero-inner");
    stageTop = inner ? inner.getBoundingClientRect().bottom - r.top + 20 : H * 0.55;
    hero.style.setProperty("--stage-top", stageTop + "px");
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scenes[sceneIndex].init();
  }

  readColors();
  resize();
  setHud(scenes[sceneIndex]);
  if (reduceMotion) { carpark.bays.forEach((b) => (b.seen = 0)); frame(1500); }

  new IntersectionObserver((e) => (e[0].isIntersecting ? start() : stop()), { threshold: 0 }).observe(hero);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  let rt;
  let lastW = W;
  addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      const r = hero.getBoundingClientRect();
      if (r.width === lastW && Math.abs(r.height - H) < 2) return;
      lastW = r.width; resize(); if (!running) frame(now);
    }, 150);
  });
  new MutationObserver(() => { readColors(); if (!running) frame(now); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", readColors);
})();
