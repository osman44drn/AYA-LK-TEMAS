/* ═══════════════════════════════════════════════════════
   AYA İLK TEMAS — Sahne Animasyon Motoru
   Canvas 2D tabanlı sinematik sahne animasyonları
   ═══════════════════════════════════════════════════════ */

const SahneAnimasyonlari = (function () {
  let canvas, ctx;
  let animFrameId = null;
  let aktifSahne = -1;
  let startTime = 0;

  // ── Ortak yardımcılar ─────────────────────────────────
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }
  function rand(a, b) { return Math.random() * (b - a) + a; }

  // Yıldız havuzu oluştur
  function yildizOlustur(count, w, h) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: rand(0.3, 1.8),
        a: Math.random(),
        s: rand(0.002, 0.008),
        d: Math.random() > 0.5 ? 1 : -1,
        hue: rand(180, 260),
      });
    }
    return arr;
  }

  function yildizCiz(stars, t) {
    stars.forEach(s => {
      s.a += s.s * s.d;
      if (s.a >= 1) { s.a = 1; s.d = -1; }
      if (s.a <= 0.15) { s.a = 0.15; s.d = 1; }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${s.hue}, 60%, 85%, ${s.a})`;
      ctx.fill();
    });
  }

  // Dünya çiz
  function dunyaCiz(cx, cy, r, t) {
    // Glow
    const grd = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 2.2);
    grd.addColorStop(0, 'rgba(60,140,255,0.15)');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(cx - r * 2.5, cy - r * 2.5, r * 5, r * 5);

    // Atmosfer
    const atm = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.15);
    atm.addColorStop(0, 'transparent');
    atm.addColorStop(0.7, 'rgba(100,180,255,0.12)');
    atm.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2);
    ctx.fillStyle = atm; ctx.fill();

    // Gezegen gövdesi
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
    const bg = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    bg.addColorStop(0, '#1a4a8a');
    bg.addColorStop(0.3, '#1b6b3a');
    bg.addColorStop(0.5, '#1a5a9a');
    bg.addColorStop(0.7, '#2a7a4a');
    bg.addColorStop(1, '#0d3366');
    ctx.fillStyle = bg; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

    // Kıtalar (basit şekiller)
    const offset = (t * 0.00003) % (r * 2);
    ctx.fillStyle = 'rgba(30,120,50,0.5)';
    for (let i = 0; i < 5; i++) {
      const bx = cx - r * 0.6 + offset + i * r * 0.35;
      const by = cy - r * 0.3 + Math.sin(i * 1.3) * r * 0.4;
      ctx.beginPath();
      ctx.ellipse(bx, by, r * 0.22, r * 0.15, i * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bulutlar
    ctx.fillStyle = 'rgba(255,255,255,0.13)';
    for (let i = 0; i < 8; i++) {
      const bx = cx - r + ((offset * 1.5 + i * r * 0.3) % (r * 2));
      const by = cy - r * 0.5 + Math.sin(i * 2.1 + t * 0.0001) * r * 0.6;
      ctx.beginPath();
      ctx.ellipse(bx, by, r * 0.18, r * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Terminator (gölge)
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
    const sh = ctx.createLinearGradient(cx - r * 0.5, cy, cx + r * 1.2, cy);
    sh.addColorStop(0, 'rgba(0,0,0,0)');
    sh.addColorStop(0.6, 'rgba(0,0,0,0.3)');
    sh.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = sh; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
  }

  // Ay çiz
  function ayCiz(cx, cy, r, t) {
    const grd = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    grd.addColorStop(0, '#e8e4d8');
    grd.addColorStop(0.6, '#c4bfad');
    grd.addColorStop(1, '#8a8577');
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grd; ctx.fill();

    // Kraterler
    const craters = [
      [0.2, -0.3, 0.12], [-0.3, 0.1, 0.09], [0.1, 0.25, 0.07],
      [-0.15, -0.15, 0.06], [0.35, 0.1, 0.05], [-0.05, 0.4, 0.08],
    ];
    craters.forEach(([ox, oy, cr]) => {
      ctx.beginPath();
      ctx.arc(cx + ox * r, cy + oy * r, cr * r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + ox * r - cr * r * 0.2, cy + oy * r - cr * r * 0.2, cr * r * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fill();
    });

    // Glow
    const glw = ctx.createRadialGradient(cx, cy, r, cx, cy, r * 1.6);
    glw.addColorStop(0, 'rgba(230,225,200,0.1)');
    glw.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.6, 0, Math.PI * 2);
    ctx.fillStyle = glw; ctx.fill();
  }

  // ═════════════════════════════════════════════════════
  // SAHNE 1: Yolculuk Başlıyor
  // ═════════════════════════════════════════════════════
  let s1Stars = [];
  function sahne1_init() {
    s1Stars = yildizOlustur(300, canvas.width, canvas.height);
  }
  function sahne1_draw(t) {
    const w = canvas.width, h = canvas.height;
    // Arka plan gradient
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#020010');
    bg.addColorStop(0.5, '#06061a');
    bg.addColorStop(1, '#0a0a2e');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

    // Nebula
    const nx = w * 0.7 + Math.sin(t * 0.00005) * 40;
    const ny = h * 0.3;
    const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, w * 0.4);
    ng.addColorStop(0, 'rgba(108,99,255,0.06)');
    ng.addColorStop(0.5, 'rgba(80,60,200,0.03)');
    ng.addColorStop(1, 'transparent');
    ctx.fillStyle = ng; ctx.fillRect(0, 0, w, h);

    yildizCiz(s1Stars, t);

    // Dünya — merkezden yaklaşıp düşüş (Hızlandırıldı)
    const elapsed = t - startTime;
    const zoom = 1 + elapsed * 0.0002;
    const er = Math.min(w, h) * 0.22 * zoom;
    const eY = h * 0.5 + (h * 0.3) * Math.max(0, 1 - elapsed * 0.0001); 
    dunyaCiz(w * 0.5, eY, er, t);

    // Parlama
    const grd2 = ctx.createRadialGradient(w * 0.85, h * 0.2, 0, w * 0.85, h * 0.2, 200);
    grd2.addColorStop(0, 'rgba(255,240,200,0.08)');
    grd2.addColorStop(1, 'transparent');
    ctx.fillStyle = grd2; ctx.fillRect(0, 0, w, h);
  }

  // ═════════════════════════════════════════════════════
  // SAHNE 2: Fırlatma Öncesi
  // ═════════════════════════════════════════════════════
  let s2Stars = [], s2Particles = [];
  function sahne2_init() {
    s2Stars = yildizOlustur(150, canvas.width, canvas.height * 0.5);
    s2Particles = [];
    for (let i = 0; i < 60; i++) {
      s2Particles.push({
        x: rand(0, canvas.width), y: rand(canvas.height * 0.4, canvas.height),
        vx: rand(-0.3, 0.3), vy: rand(-0.5, -0.1),
        r: rand(2, 6), a: rand(0.02, 0.08),
      });
    }
  }
  function sahne2_draw(t) {
    const w = canvas.width, h = canvas.height;
    const elapsed = t - startTime;

    // Gökyüzü — Aydınlık Mavi Gökyüzü (Gündüz Operasyonu)
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#1c7ed6'); // Üst gök
    bg.addColorStop(0.5, '#4dabf7'); // Orta
    bg.addColorStop(1, '#a5d8ff'); // Ufuk çizgisi
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

    // TUA Uzay Üssü Binası (Arka Planda, Solda)
    const bW = w * 0.35;
    const bH = h * 0.4;
    const bX = w * 0.08;
    const bY = h * 0.7 - bH;
    
    // Bina Ana Gövde
    ctx.fillStyle = '#16162a';
    ctx.fillRect(bX, bY, bW, bH);
    // Bina Çatısı ve Yapısal Detaylar
    ctx.fillStyle = '#1f1f3a';
    ctx.beginPath();
    ctx.moveTo(bX - 10, bY);
    ctx.lineTo(bX + bW + 10, bY);
    ctx.lineTo(bX + bW, bY - 25);
    ctx.lineTo(bX, bY - 25);
    ctx.closePath();
    ctx.fill();
    
    // Dev TUA Yazısı
    ctx.save();
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold ' + (bW * 0.28) + 'px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 15 + Math.sin(t * 0.002) * 5; // Hafif neon parlama efekti
    ctx.fillText("TUA", bX + bW / 2, bY + bH * 0.35);
    ctx.restore();
    
    // Pencereler (Araştırma test laboratuvarları)
    ctx.fillStyle = 'rgba(200, 240, 255, 0.3)';
    for (let i = 0; i < 6; i++) {
       for (let j = 0; j < 3; j++) {
           if (Math.random() < 0.95) { // Bazı camlar sönük veya titreşmeli olabilir ama performans için sabit çizelim
               ctx.fillRect(bX + bW * 0.1 + i * (bW * 0.14), bY + bH * 0.65 + j * (bH * 0.1), bW * 0.07, bH * 0.05);
           }
       }
    }
    
    // Gözlem Kulesi
    const towerX = bX + bW * 0.85;
    ctx.fillStyle = '#0e1124';
    ctx.fillRect(towerX, bY - 80, 40, 80);
    ctx.fillStyle = '#1c3460';
    ctx.fillRect(towerX - 10, bY - 105, 60, 25);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(towerX - 5, bY - 100, 50, 15); // Kule camı
    
    // Kule Anteni ve Kırmızı Çakar Işık
    ctx.strokeStyle = '#444'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(towerX + 20, bY - 105); ctx.lineTo(towerX + 20, bY - 150); ctx.stroke();
    if (Math.floor(t / 400) % 2 === 0) {
       ctx.save();
       ctx.fillStyle = '#ff2a2a'; 
       ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = 12;
       ctx.beginPath(); ctx.arc(towerX + 20, bY - 150, 5, 0, Math.PI*2); ctx.fill();
       ctx.restore();
    }

    // Zemin (Çimenlik doğa ve gri beton fırlatma sahası)
    ctx.fillStyle = '#2b4d24'; // Koyu yeşil temel
    ctx.fillRect(0, h * 0.7, w, h * 0.3);
    
    // Dalgalı yeşil yeryüzü
    ctx.fillStyle = '#3f6b35'; 
    ctx.beginPath();
    ctx.moveTo(0, h * 0.7);
    for (let x = 0; x <= w; x += 20) {
      ctx.lineTo(x, h * 0.7 - Math.sin(x * 0.01) * 8 - 4);
    }
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();

    // Tesis ve roketin altındaki devasa gri beton zemin
    ctx.fillStyle = '#7a7a85';
    ctx.beginPath();
    // Perspektifli beton döküm alanı
    ctx.moveTo(w * 0.35, h * 0.7 - 5);
    ctx.lineTo(w * 0.65, h * 0.7 - 5);
    ctx.lineTo(w * 0.85, h);
    ctx.lineTo(w * 0.15, h);
    ctx.closePath();
    ctx.fill();

    // Roket gövdesi
    const rx = w * 0.5, rBottom = h * 0.7 - 10;
    const rH = h * 0.35, rW = rH * 0.12;

    // Roket gölgesi / glow
    const rGlow = ctx.createRadialGradient(rx, rBottom - rH * 0.5, rW, rx, rBottom - rH * 0.5, rW * 8);
    rGlow.addColorStop(0, 'rgba(100,80,255,0.04)');
    rGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = rGlow; ctx.fillRect(rx - rW * 8, rBottom - rH - rW * 4, rW * 16, rH + rW * 8);

    // Rampa yapısı
    ctx.strokeStyle = 'rgba(150,150,180,0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rx - rW * 3, rBottom);
    ctx.lineTo(rx - rW * 1.5, rBottom - rH * 0.6);
    ctx.moveTo(rx + rW * 3, rBottom);
    ctx.lineTo(rx + rW * 1.5, rBottom - rH * 0.6);
    ctx.stroke();

    // Roket gövde
    ctx.fillStyle = '#d0d0d8';
    ctx.beginPath();
    ctx.moveTo(rx - rW, rBottom);
    ctx.lineTo(rx - rW, rBottom - rH * 0.75);
    ctx.quadraticCurveTo(rx, rBottom - rH * 1.05, rx + rW, rBottom - rH * 0.75);
    ctx.lineTo(rx + rW, rBottom);
    ctx.closePath(); ctx.fill();

    // Roket kırmızı bant
    ctx.fillStyle = '#cc2233';
    ctx.fillRect(rx - rW, rBottom - rH * 0.3, rW * 2, rH * 0.06);

    // Roket burun
    ctx.fillStyle = '#e8e0d0';
    ctx.beginPath();
    ctx.moveTo(rx - rW * 0.6, rBottom - rH * 0.75);
    ctx.quadraticCurveTo(rx, rBottom - rH * 1.05, rx + rW * 0.6, rBottom - rH * 0.75);
    ctx.closePath(); ctx.fill();

    // Kanatlar
    ctx.fillStyle = '#aa2030';
    ctx.beginPath();
    ctx.moveTo(rx - rW, rBottom);
    ctx.lineTo(rx - rW * 2.5, rBottom + 5);
    ctx.lineTo(rx - rW, rBottom - rH * 0.15);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(rx + rW, rBottom);
    ctx.lineTo(rx + rW * 2.5, rBottom + 5);
    ctx.lineTo(rx + rW, rBottom - rH * 0.15);
    ctx.closePath(); ctx.fill();

    // Buhar / duman
    s2Particles.forEach(p => {
      p.x += p.vx + Math.sin(t * 0.001 + p.y) * 0.3;
      p.y += p.vy;
      if (p.y < h * 0.3 || p.a < 0.005) {
        p.x = rx + rand(-rW * 4, rW * 4);
        p.y = rBottom + rand(-10, 20);
        p.a = rand(0.02, 0.08);
        p.r = rand(2, 6);
      }
      p.a *= 0.998;
      p.r += 0.03;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,200,220,${p.a})`;
      ctx.fill();
    });

    // Spot ışıkları
    for (let i = 0; i < 3; i++) {
      const sx = rx + (i - 1) * rW * 5;
      const sg = ctx.createRadialGradient(sx, rBottom + 20, 0, sx, rBottom - rH * 0.5, rH * 0.7);
      sg.addColorStop(0, `rgba(255,240,200,${0.015 + Math.sin(t * 0.002 + i) * 0.005})`);
      sg.addColorStop(1, 'transparent');
      ctx.fillStyle = sg;
      ctx.fillRect(sx - rH, rBottom - rH, rH * 2, rH * 1.2);
    }
  }

  // ═════════════════════════════════════════════════════
  // SAHNE 3 (YENİ): Uzay Savunma Simülasyonu
  // ═════════════════════════════════════════════════════
  let sBattleStars = [], sBattleDrones = [];
  function sahneBattle_init() {
    sBattleStars = yildizOlustur(250, canvas.width, canvas.height);
    sBattleDrones = [];
    for (let i = 0; i < 8; i++) {
      sBattleDrones.push({
        x: rand(canvas.width * 0.3, canvas.width * 0.9),
        y: rand(canvas.height * 0.1, canvas.height * 0.7),
        vx: rand(-0.4, -0.1), vy: 0, // Drone hızı yavaşlatıldı (S4)
        drift: rand(0, Math.PI * 2), driftSpeed: rand(0.5, 1.5), // Drift hızı yavaşlatıldı
        baseY: 0, size: rand(15, 30), alive: true,
      });
      sBattleDrones[i].baseY = sBattleDrones[i].y;
    }
  }
  function sahneBattle_draw(t) {
    const w = canvas.width, h = canvas.height;
    const elapsed = (t - startTime) / 1000;

    // Koyu kırmızı-mor arka plan (tehdit)
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#08001a');
    bg.addColorStop(0.5, '#10052a');
    bg.addColorStop(1, '#1a0520');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

    // Tehdit nebulası
    const ng = ctx.createRadialGradient(w * 0.6, h * 0.4, 0, w * 0.6, h * 0.4, w * 0.5);
    ng.addColorStop(0, 'rgba(200,50,50,0.04)');
    ng.addColorStop(0.5, 'rgba(150,30,100,0.02)');
    ng.addColorStop(1, 'transparent');
    ctx.fillStyle = ng; ctx.fillRect(0, 0, w, h);

    yildizCiz(sBattleStars, t);

    // Düşman drone'ları
    sBattleDrones.forEach((d, i) => {
      if (!d.alive) return;
      d.drift += d.driftSpeed * 0.008; // Yavaşlatıldı (eski: 0.016)
      d.y = d.baseY + Math.sin(d.drift) * 30;
      d.x += d.vx;
      if (d.x < -50) { d.x = w + 50; d.baseY = rand(h * 0.1, h * 0.7); }

      ctx.save(); ctx.translate(d.x, d.y);
      // Gövde
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(d.size, 0);
      ctx.lineTo(-d.size * 0.5, -d.size * 0.6);
      ctx.lineTo(-d.size * 0.3, 0);
      ctx.lineTo(-d.size * 0.5, d.size * 0.6);
      ctx.closePath(); ctx.fill();
      // Yeşil çekirdek
      ctx.beginPath(); ctx.arc(0, 0, d.size * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#34d399'; ctx.shadowBlur = 12;
      ctx.fill(); ctx.shadowBlur = 0;
      ctx.restore();
    });

    // Oyuncu gemisi silueti (sol tarafta)
    const px = w * 0.12, py = h * 0.5 + Math.sin(t * 0.002) * 15;
    ctx.save(); ctx.translate(px, py);
    // Motor ışığı
    const eG = ctx.createRadialGradient(-20, 0, 0, -20, 0, 25);
    eG.addColorStop(0, `rgba(56,189,248,${0.3 + Math.sin(t * 0.01) * 0.1})`);
    eG.addColorStop(1, 'transparent');
    ctx.fillStyle = eG; ctx.fillRect(-45, -25, 50, 50);
    // Gövde
    const hg = ctx.createLinearGradient(0, -18, 0, 18);
    hg.addColorStop(0, '#64748b'); hg.addColorStop(1, '#0f172a');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.moveTo(35, 0); ctx.lineTo(10, -14); ctx.lineTo(-15, -5);
    ctx.lineTo(-15, 5); ctx.lineTo(10, 14);
    ctx.closePath(); ctx.fill();
    // Kokpit
    ctx.fillStyle = '#fcd34d';
    ctx.beginPath();
    ctx.moveTo(28, 0); ctx.lineTo(12, -6); ctx.lineTo(8, 0); ctx.lineTo(12, 6);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // Lazer ateşi animasyonu
    const laserCount = Math.floor(elapsed * 2) % 3;
    for (let i = 0; i < 2; i++) {
      const lx = px + 35 + ((t * 0.8 + i * 200) % w);
      const ly = py + rand(-3, 3);
      if (lx < w) {
        ctx.strokeStyle = `rgba(74,222,128,${0.6 - (lx - px) / w * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 30, ly); ctx.stroke();
      }
    }

    // "UYARI" HUD overlay
    if (Math.sin(t * 0.005) > 0) {
      ctx.fillStyle = 'rgba(255,50,50,0.06)';
      ctx.fillRect(0, 0, w, h);
    }
  }

  // ═════════════════════════════════════════════════════
  // SAHNE 4: Kalkış Anı
  // ═════════════════════════════════════════════════════
  let s3Stars = [], s3Flames = [], s3Smokes = [];
  function sahne3_init() {
    s3Stars = yildizOlustur(200, canvas.width, canvas.height);
    s3Flames = []; s3Smokes = [];
    for (let i = 0; i < 40; i++) {
      s3Flames.push({ x: 0, y: 0, r: rand(3, 10), a: 1, vy: rand(3, 8), vx: rand(-1, 1), hue: rand(15, 50) });
    }
    for (let i = 0; i < 50; i++) {
      s3Smokes.push({ x: 0, y: 0, r: rand(5, 20), a: 0.4, vy: rand(0.5, 2), vx: rand(-2, 2), life: 0 });
    }
  }
  function sahne3_draw(t) {
    const w = canvas.width, h = canvas.height;
    const elapsed = (t - startTime) / 1000;

    // Arka plan (Gündüz kalkışı - Yükseldikçe kararır)
    const skyDarken = Math.min(elapsed * 0.1, 1);
    
    // Uzay boşluğu (En alt katman siyah)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    
    // Atmosfer mavisi (Roket yükseldikçe opacity azalır)
    if (skyDarken < 1) {
       const bg = ctx.createLinearGradient(0, 0, 0, h);
       bg.addColorStop(0, `rgba(28, 126, 214, ${1 - skyDarken})`); // Üst
       bg.addColorStop(0.5, `rgba(77, 171, 247, ${1 - skyDarken})`); // Orta
       bg.addColorStop(1, `rgba(165, 216, 255, ${1 - skyDarken})`); // Ufuk
       ctx.fillStyle = bg; 
       ctx.fillRect(0, 0, w, h);
    }

    yildizCiz(s3Stars, t);

    const countdown = 4 - elapsed;
    const isLaunched = countdown <= 0;

    // Geri sayım Metni
    if (!isLaunched) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + (countdown % 1) * 0.7})`;
      ctx.font = 'bold 120px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillText(Math.ceil(countdown), w * 0.5, h * 0.4);
      ctx.restore();
    } else if (elapsed - 4 < 3) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 50, 50, ${1 - (elapsed - 4) / 3})`;
      ctx.font = 'bold 80px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillText("ATEŞLEME!", w * 0.5, h * 0.4);
      ctx.restore();
    }

    // Roket pozisyonu — yavaş yükseliş
    const riseFactor = isLaunched ? (elapsed - 4) : 0;
    const riseSpeed = Math.min(riseFactor * 0.06, 1.2);
    const rx = w * 0.5 + (isLaunched ? Math.sin(t * 0.003) * 2 : 0);
    const baseY = h * 0.65;
    const ry = baseY - riseSpeed * h;
    const rH = h * 0.28, rW = rH * 0.11;
    const shake = isLaunched ? Math.sin(t * 0.05) * (1 + riseFactor * 0.1) * 0.8 : 0;

    ctx.save();
    ctx.translate(shake, 0);

    // Zemin (Çimenlik doğa ve gri beton fırlatma sahası)
    ctx.fillStyle = '#2b4d24'; // Koyu yeşil
    ctx.fillRect(0, h * 0.7, w, h * 0.3);
    
    ctx.fillStyle = '#3f6b35'; // Dalgalı çimen
    ctx.beginPath();
    ctx.moveTo(0, h * 0.7);
    for (let x = 0; x <= w; x += 20) {
      ctx.lineTo(x, h * 0.7 - Math.sin(x * 0.01) * 8 - 4);
    }
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();

    // Tesis ve roketin altındaki devasa gri beton zemin
    ctx.fillStyle = '#7a7a85';
    ctx.beginPath();
    ctx.moveTo(w * 0.35, h * 0.7 - 5);
    ctx.lineTo(w * 0.65, h * 0.7 - 5);
    ctx.lineTo(w * 0.85, h);
    ctx.lineTo(w * 0.15, h);
    ctx.closePath();
    ctx.fill();

    // Beyaz Fırlatma Rampası (Yer Yüzünde)
    const rampBaseY = h * 0.7;
    ctx.fillStyle = '#f8f9fa'; // Ekstra beyaz rampa gövdesi
    ctx.fillRect(w * 0.38, rampBaseY - 15, w * 0.24, 15); // Ana platform
    
    // Rampa destek kuleleri (Beyaz gölgeli)
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 5;
    ctx.beginPath();
    // Sol destek kulesi alanı
    ctx.moveTo(w * 0.4, rampBaseY - 15); ctx.lineTo(w * 0.4, rampBaseY - h * 0.25);
    ctx.moveTo(w * 0.43, rampBaseY - 15); ctx.lineTo(w * 0.43, rampBaseY - h * 0.15);
    // Sağ destek kulesi alanı
    ctx.moveTo(w * 0.6, rampBaseY - 15); ctx.lineTo(w * 0.6, rampBaseY - h * 0.25);
    ctx.moveTo(w * 0.57, rampBaseY - 15); ctx.lineTo(w * 0.57, rampBaseY - h * 0.15);
    ctx.stroke();

    // Alev partikülleri
    s3Flames.forEach(f => {
      f.x = rx + rand(-rW * 0.8, rW * 0.8);
      f.y = ry + rand(5, 15);
      f.vy = rand(4, 12);
      f.r = rand(3, 8 + elapsed * 0.5);
      for (let step = 0; step < 5; step++) {
        const py = f.y + f.vy * step * 3;
        const pr = f.r * (1 + step * 0.4);
        const pa = (1 - step / 5) * 0.6;
        ctx.beginPath(); ctx.arc(f.x + rand(-2, 2), py, pr, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${f.hue - step * 8}, 100%, ${60 - step * 8}%, ${pa})`;
        ctx.fill();
      }
    });

    // Duman
    s3Smokes.forEach(sm => {
      sm.life += 0.016;
      if (sm.life > 3) {
        sm.x = rx + rand(-rW * 2, rW * 2);
        sm.y = ry + 10;
        sm.vx = rand(-2, 2);
        sm.vy = rand(1, 3);
        sm.r = rand(5, 12);
        sm.a = 0.3;
        sm.life = 0;
      }
      sm.x += sm.vx;
      sm.y += sm.vy;
      sm.r += 0.5;
      sm.a *= 0.98;
      ctx.beginPath(); ctx.arc(sm.x, sm.y, sm.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,170,160,${sm.a})`;
      ctx.fill();
    });

    // Roket gövde
    ctx.fillStyle = '#d8d8e0';
    ctx.beginPath();
    ctx.moveTo(rx - rW, ry);
    ctx.lineTo(rx - rW, ry - rH * 0.8);
    ctx.quadraticCurveTo(rx, ry - rH * 1.08, rx + rW, ry - rH * 0.8);
    ctx.lineTo(rx + rW, ry);
    ctx.closePath(); ctx.fill();

    // Kırmızı bant
    ctx.fillStyle = '#cc2233';
    ctx.fillRect(rx - rW, ry - rH * 0.25, rW * 2, rH * 0.05);

    // Kanatlar
    ctx.fillStyle = '#aa2030';
    ctx.beginPath();
    ctx.moveTo(rx - rW, ry); ctx.lineTo(rx - rW * 2.5, ry + 8); ctx.lineTo(rx - rW, ry - rH * 0.12);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(rx + rW, ry); ctx.lineTo(rx + rW * 2.5, ry + 8); ctx.lineTo(rx + rW, ry - rH * 0.12);
    ctx.closePath(); ctx.fill();

    // Motor ışıması
    const eGlow = ctx.createRadialGradient(rx, ry + 5, 0, rx, ry + 20, rW * 6);
    eGlow.addColorStop(0, 'rgba(255,200,50,0.3)');
    eGlow.addColorStop(0.5, 'rgba(255,100,20,0.1)');
    eGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = eGlow;
    ctx.fillRect(rx - rW * 6, ry - rW * 2, rW * 12, rW * 10);

    ctx.restore();
  }

  // ═════════════════════════════════════════════════════
  // SAHNE 4: Dünya Yörüngesinde
  // ═════════════════════════════════════════════════════
  let s4Stars = [];
  function sahne4_init() {
    s4Stars = yildizOlustur(250, canvas.width, canvas.height);
  }
  function sahne4_draw(t) {
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#020012';
    ctx.fillRect(0, 0, w, h);
    yildizCiz(s4Stars, t);

    // Büyük Dünya — sol altta
    const er = Math.min(w, h) * 0.55;
    dunyaCiz(w * 0.25, h * 0.9, er, t);

    // Güneş ışığı sağ üstten
    const sg = ctx.createRadialGradient(w * 0.95, h * 0.05, 0, w * 0.95, h * 0.05, w * 0.5);
    sg.addColorStop(0, 'rgba(255,250,220,0.12)');
    sg.addColorStop(0.3, 'rgba(255,240,180,0.04)');
    sg.addColorStop(1, 'transparent');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, w, h);

    // Uzay aracı silueti
    const sx = w * 0.6 + Math.sin(t * 0.0004) * 30;
    const sy = h * 0.35 + Math.cos(t * 0.0003) * 15;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(0.3 + Math.sin(t * 0.0002) * 0.05);
    // Gövde
    ctx.fillStyle = '#b0b0c0';
    ctx.fillRect(-20, -4, 40, 8);
    // Solar paneller
    ctx.fillStyle = '#2244aa';
    ctx.fillRect(-45, -2, 22, 4);
    ctx.fillRect(23, -2, 22, 4);
    // Solar panel çerçeve
    ctx.strokeStyle = 'rgba(150,170,255,0.4)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(-45, -2, 22, 4);
    ctx.strokeRect(23, -2, 22, 4);
    ctx.restore();
  }

  // ═════════════════════════════════════════════════════
  // SAHNE 5: Ay'a Yolculuk
  // ═════════════════════════════════════════════════════
  let s5Stars = [];
  function sahne5_init() {
    s5Stars = yildizOlustur(350, canvas.width, canvas.height);
  }
  function sahne5_draw(t) {
    const w = canvas.width, h = canvas.height;
    const elapsed = (t - startTime) / 1000;

    ctx.fillStyle = '#010010';
    ctx.fillRect(0, 0, w, h);

    // Hız çizgileri efekti
    s5Stars.forEach(s => {
      const speed = 0.5 + elapsed * 0.02;
      s.x -= speed * (1 + s.r);
      if (s.x < -10) { s.x = w + 10; s.y = rand(0, h); }
      const len = 2 + speed * s.r * 2;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + len, s.y);
      ctx.strokeStyle = `hsla(${s.hue}, 50%, 80%, ${s.a * 0.7})`;
      ctx.lineWidth = s.r * 0.5;
      ctx.stroke();
    });

    // Dünya — sol arka planda küçülüyor
    const earthR = Math.max(20, Math.min(w, h) * 0.12 - elapsed * 0.5);
    dunyaCiz(w * 0.1, h * 0.3, earthR, t);

    // Ay — sağda büyüyor
    const moonR = Math.min(Math.min(w, h) * 0.3, 30 + elapsed * 3);
    ayCiz(w * 0.8, h * 0.45, moonR, t);

    // Uzay aracı merkez
    const sx = w * 0.45, sy = h * 0.5;
    ctx.save(); ctx.translate(sx, sy);
    // Motor ışığı
    const eG = ctx.createRadialGradient(-25, 0, 0, -25, 0, 20);
    eG.addColorStop(0, `rgba(100,180,255,${0.3 + Math.sin(t * 0.01) * 0.1})`);
    eG.addColorStop(1, 'transparent');
    ctx.fillStyle = eG; ctx.fillRect(-45, -20, 40, 40);
    // Gövde
    ctx.fillStyle = '#c0c0d0';
    ctx.fillRect(-15, -3, 30, 6);
    ctx.fillStyle = '#2244aa';
    ctx.fillRect(-35, -1.5, 18, 3);
    ctx.fillRect(17, -1.5, 18, 3);
    ctx.restore();
  }

  // ═════════════════════════════════════════════════════
  // SAHNE 6: Ay Yüzeyine İniş
  // ═════════════════════════════════════════════════════
  let s6Stars = [], s6Dust = [];
  function sahne6_init() {
    s6Stars = yildizOlustur(120, canvas.width, canvas.height * 0.5);
    s6Dust = [];
    for (let i = 0; i < 80; i++) {
      s6Dust.push({ x: 0, y: 0, vx: 0, vy: 0, r: rand(1, 4), a: 0, life: rand(0, 3) });
    }
  }
  function sahne6_draw(t) {
    const w = canvas.width, h = canvas.height;
    const elapsed = (t - startTime) / 1000;

    // Siyah uzay
    ctx.fillStyle = '#020012';
    ctx.fillRect(0, 0, w, h);
    yildizCiz(s6Stars, t);

    // Dünya uzakta
    dunyaCiz(w * 0.15, h * 0.15, Math.min(w, h) * 0.06, t);

    // Ay yüzeyi
    const surfY = h * 0.65;
    const surfGrd = ctx.createLinearGradient(0, surfY - 20, 0, h);
    surfGrd.addColorStop(0, '#8a8577');
    surfGrd.addColorStop(0.3, '#6a6560');
    surfGrd.addColorStop(1, '#3a3530');
    ctx.fillStyle = surfGrd;
    ctx.beginPath(); ctx.moveTo(0, surfY);
    for (let x = 0; x <= w; x += 8) {
      ctx.lineTo(x, surfY - Math.sin(x * 0.008) * 15 - Math.sin(x * 0.025) * 6);
    }
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();

    // Kraterler
    const craterPos = [[0.2, 0.78], [0.5, 0.82], [0.75, 0.76], [0.35, 0.85], [0.85, 0.83]];
    craterPos.forEach(([cx, cy]) => {
      const cr = rand(12, 25);
      ctx.beginPath(); ctx.ellipse(w * cx, h * cy, cr, cr * 0.3, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fill();
    });

    // İniş modülü — hızla alçalıyor (eski 0.6, yavaşlatıldı 0.25 -> ~4 saniyede iniyor)
    const descent = Math.min(1, elapsed * 0.25);
    const lmX = w * 0.5;
    const lmY = lerp(h * 0.15, surfY - 50, descent);

    // Retro-ateşleme
    if (descent < 0.95) {
      for (let i = 0; i < 6; i++) {
        const fLen = rand(20, 50) * (1 - descent * 0.5);
        const fx = lmX + rand(-8, 8);
        ctx.beginPath();
        ctx.moveTo(fx - 3, lmY + 20);
        ctx.lineTo(fx, lmY + 20 + fLen);
        ctx.lineTo(fx + 3, lmY + 20);
        ctx.closePath();
        ctx.fillStyle = `rgba(255,${180 + i * 10},50,${0.4 - i * 0.05})`;
        ctx.fill();
      }
    }

    // Toz partikülleri
    if (descent > 0.5) {
      s6Dust.forEach(d => {
        d.life += 0.016;
        if (d.life > 2.5) {
          d.x = lmX + rand(-20, 20);
          d.y = surfY - rand(0, 10);
          d.vx = rand(-3, 3);
          d.vy = rand(-2, -0.5);
          d.a = rand(0.1, 0.3) * (descent - 0.5) * 2;
          d.r = rand(1, 4);
          d.life = 0;
        }
        d.x += d.vx; d.y += d.vy; d.vy += 0.02;
        d.a *= 0.99; d.r += 0.02;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,170,150,${d.a})`; ctx.fill();
      });
    }

    // İniş modülü gövde
    ctx.save(); ctx.translate(lmX, lmY);
    // Bacaklar
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-8, 15); ctx.lineTo(-20, 22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, 15); ctx.lineTo(20, 22); ctx.stroke();
    // Pedler
    ctx.fillStyle = '#666';
    ctx.fillRect(-23, 21, 6, 2); ctx.fillRect(17, 21, 6, 2);
    // Gövde
    ctx.fillStyle = '#c8c0b0';
    ctx.beginPath();
    ctx.moveTo(-15, 15); ctx.lineTo(-18, 0); ctx.lineTo(-10, -15);
    ctx.lineTo(10, -15); ctx.lineTo(18, 0); ctx.lineTo(15, 15);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,0,0.3)'; ctx.lineWidth = 0.5; ctx.stroke();
    // Pencere
    ctx.beginPath(); ctx.arc(0, -5, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(100,200,255,0.4)'; ctx.fill();
    ctx.restore();
  }

  // ═════════════════════════════════════════════════════
  // SAHNE 7: Görev Tamamlandı
  // ═════════════════════════════════════════════════════
  let s7Stars = [];
  function sahne7_init() {
    s7Stars = yildizOlustur(200, canvas.width, canvas.height);
  }
  function sahne7_draw(t) {
    const w = canvas.width, h = canvas.height;
    const elapsed = (t - startTime) / 1000;

    ctx.fillStyle = '#020012';
    ctx.fillRect(0, 0, w, h);
    yildizCiz(s7Stars, t);

    // Dünya arkada
    dunyaCiz(w * 0.8, h * 0.2, Math.min(w, h) * 0.12, t);

    // -- Animasyon Zamanlamaları --
    const plantDuration = 2.6; // Orijinale göre %30 yavaşlatıldı (Daha uzun süre dikiyor)
    const plantProgress = Math.min(1, Math.max(0, elapsed / plantDuration));
    
    const pullBackStart = 2.6; // 2.6 saniyeden sonra kamera geri çekilir
    const pullBackDuration = 5.0; // Geri çekilme süresi de hafif uzatıldı
    let zoom = 1.0;
    if (elapsed > pullBackStart) {
        let p = (elapsed - pullBackStart) / pullBackDuration;
        p = Math.min(1, Math.max(0, p));
        const ease = p * (2 - p); // ease-out
        zoom = 1.0 - ease * 0.65; // Kamera %35'e kadar uzaklaşır
    }

    // Kamera Zoom için context ayarı
    ctx.save();
    const ay_merkez_x = w * 0.5;
    const ay_merkez_y = h * 0.6;
    ctx.translate(ay_merkez_x, ay_merkez_y);
    ctx.scale(zoom, zoom);
    ctx.translate(-ay_merkez_x, -ay_merkez_y);

    // Ay yüzeyi (Genişletilmiş çizim ki uzaklaşınca kenarlar kesilmesin)
    const surfY = h * 0.6;
    const surfGrd = ctx.createLinearGradient(0, surfY, 0, h * 2);
    surfGrd.addColorStop(0, '#9a9587');
    surfGrd.addColorStop(1, '#4a4540');
    ctx.fillStyle = surfGrd;
    ctx.beginPath(); ctx.moveTo(-w*2, surfY);
    for (let x = -w*2; x <= w*3; x += 20) {
      ctx.lineTo(x, surfY - Math.sin(x * 0.006) * 12 - Math.sin(x * 0.02) * 5);
    }
    ctx.lineTo(w*3, h*3); ctx.lineTo(-w*2, h*3); ctx.closePath(); ctx.fill();

    // Astronot pozisyonu
    const ax = w * 0.55, ay = surfY - 10;
    
    // Bayrak pozisyonu (Astronotun elinden aşağı doğru iniyor)
    const flagYOffset = (1 - plantProgress) * 50; 
    const fx = ax - 25, fy = surfY - 5 - flagYOffset;
    
    // Bayrak direği
    ctx.strokeStyle = '#ccc'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - 70); ctx.stroke();

    // Türk bayrağı bezi (Sola dalgalansın)
    const flagW = 50, flagH = 30;
    const wave = Math.sin(t * 0.003) * 3;
    ctx.fillStyle = '#e30a17';
    ctx.beginPath();
    ctx.moveTo(fx, fy - 70);
    ctx.lineTo(fx - flagW, fy - 70 + wave); 
    ctx.lineTo(fx - flagW, fy - 70 + flagH + wave * 0.5);
    ctx.lineTo(fx, fy - 70 + flagH);
    ctx.closePath(); ctx.fill();

    // Ay-yıldız (Ters çizim)
    const csx = fx - flagW * 0.5, csy = fy - 70 + flagH * 0.5 + wave * 0.6;
    ctx.beginPath(); ctx.arc(csx, csy, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.beginPath(); ctx.arc(csx - 2.5, csy, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = '#e30a17'; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '8px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('★', csx - 7, csy);

    // Astronot silueti
    ctx.save(); ctx.translate(ax, ay);
    // Kask
    ctx.beginPath(); ctx.arc(0, -35, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#e0ddd0'; ctx.fill();
    // Vizör (Sola, bayrağa bakıyor)
    ctx.beginPath(); ctx.arc(-2, -35, 6, Math.PI*0.5, Math.PI*1.5); 
    ctx.fillStyle = 'rgba(100,180,255,0.3)'; ctx.fill();
    // Gövde
    ctx.fillStyle = '#d5d0c5';
    ctx.fillRect(-9, -25, 18, 22);
    // Bacaklar
    ctx.fillRect(-8, -3, 7, 14);
    ctx.fillRect(1, -3, 7, 14);
    
    // Sağ Kol (Arkada sabit)
    ctx.fillRect(8, -23, 6, 14);
    
    // Sol Kol (Hareketli - Bayrağı tutan kol)
    ctx.save();
    ctx.translate(-9, -21); // Omuz mafsalı
    const dx = (fx) - (ax - 9);
    const dy = (fy - 35) - (ay - 21); // Direğin orta-üst kısmını kavrıyor
    const angle = Math.atan2(dy, dx) - Math.PI/2;
    ctx.rotate(angle);
    ctx.fillRect(-3, 0, 6, 20); // Kol uzanıyor
    ctx.restore();
    
    ctx.restore(); // Astronot restore

    // Rover (Ay Aracı) çizimi
    const rox = ax + 80;
    const roy = surfY - 5;
    ctx.save();
    ctx.translate(rox, roy); // Tekerler surfY hizasına hafif gömülü (Ay tozu gercekligi)
    
    // Gövde (Yükseltildi, tekerlekle çarpışma hatası giderildi)
    ctx.fillStyle = '#b0b5c0';
    ctx.fillRect(-25, -22, 50, 10);
    // Kabin
    ctx.fillStyle = '#d0d5e0';
    ctx.beginPath();
    ctx.moveTo(-20, -22);
    ctx.lineTo(-10, -35);
    ctx.lineTo(15, -35);
    ctx.lineTo(25, -22);
    ctx.closePath();
    ctx.fill();
    // Altın folyo detayı
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(-5, -22, 15, 4);
    // Anten
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-5, -35); ctx.lineTo(-5, -52); ctx.stroke();
    ctx.beginPath(); ctx.arc(-5, -52, 5, 0, Math.PI, true); ctx.stroke();
    
    // Süspansiyon kolları (Şaseden lastiklere inen görsel bağlantı)
    ctx.strokeStyle = '#d4af37'; 
    ctx.lineWidth = 2.5;
    [-18, 0, 18].forEach(wx => {
        ctx.beginPath();
        ctx.moveTo(wx, -12); // Gövde altı
        ctx.lineTo(wx, -4);  // Tekerlek merkezi
        ctx.stroke();
    });

    // Tekerlekler (Daha gerçekçi gri arazi lastikleri ve jant kapağı)
    [-18, 0, 18].forEach(wx => {
        // Lastik dışı (Koyu gri)
        ctx.fillStyle = '#4a4a50';
        ctx.beginPath(); ctx.arc(wx, -4, 7, 0, Math.PI * 2); ctx.fill();
        
        // Lastik Tırtıkları (Arazi detayı)
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        for(let a=0; a<Math.PI*2; a+=Math.PI/3) {
             ctx.beginPath();
             ctx.moveTo(wx + Math.cos(a)*4, -4 + Math.sin(a)*4);
             ctx.lineTo(wx + Math.cos(a)*7, -4 + Math.sin(a)*7);
             ctx.stroke();
        }
        
        // Jant Plakası (Metalik gri)
        ctx.fillStyle = '#b0b5c0';
        ctx.beginPath(); ctx.arc(wx, -4, 4, 0, Math.PI * 2); ctx.fill();
        
        // Jant göbeği / Somun (Kapak)
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(wx, -4, 1.5, 0, Math.PI * 2); ctx.fill();
    });
    
    ctx.restore(); // Rover restore

    // Ayak izleri (Sağdan sola yürümüş gibi)
    for (let i = 0; i < 5; i++) {
        const ix = w * 0.5 + i * 20 + 30; 
        const iy = surfY + 3 + Math.sin(i) * 2;
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.beginPath(); ctx.ellipse(ix, iy, 4, 2, 0.1 * i, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore(); // Kamera Zoom restore

    // Yazı ve Final Efektleri
    if (elapsed > pullBackStart + 1.2) { // Yazılar da gecikmeli başlar
        let opacity = Math.min(1, (elapsed - pullBackStart - 1.2) * 0.5);
        ctx.save();
        ctx.globalAlpha = opacity;
        
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Ana Görev Tamamlandı Yazısı
        ctx.font = 'bold 70px "Courier New", sans-serif';
        ctx.shadowColor = 'rgba(227, 10, 23, 0.9)'; // Kırmızı glow
        ctx.shadowBlur = 25;
        ctx.fillText("GÖREV TAMAMLANDI", w / 2, h * 0.45);
        ctx.shadowBlur = 0;
        
        // Alt başlık
        ctx.font = 'bold 30px "Courier New", sans-serif';
        ctx.fillStyle = '#e0e0e0';
        ctx.fillText("TÜRKİYE UZAY AJANSI", w / 2, h * 0.55);

        ctx.restore();
    }
  }

  // ═════════════════════════════════════════════════════
  // PUBLIC API
  // ═════════════════════════════════════════════════════
  const initFuncs = [sahne1_init, sahne2_init, sahne3_init, sahneBattle_init, sahne6_init, sahne7_init];
  const drawFuncs = [sahne1_draw, sahne2_draw, sahne3_draw, sahneBattle_draw, sahne6_draw, sahne7_draw];

  function baslat(sahneIndex) {
    canvas = document.getElementById('sceneAnimCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    durdur();
    aktifSahne = sahneIndex;
    startTime = performance.now();

    function resize() {
      const container = canvas.parentElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      if (initFuncs[aktifSahne]) initFuncs[aktifSahne]();
    }
    resize();
    window.addEventListener('resize', resize);
    canvas._resizeHandler = resize;

    function loop(t) {
      if (aktifSahne < 0) return;
      if (drawFuncs[aktifSahne]) drawFuncs[aktifSahne](t);
      animFrameId = requestAnimationFrame(loop);
    }
    animFrameId = requestAnimationFrame(loop);
    canvas.classList.add('active');
  }

  function durdur() {
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    aktifSahne = -1;
    if (canvas) {
      canvas.classList.remove('active');
      if (canvas._resizeHandler) {
        window.removeEventListener('resize', canvas._resizeHandler);
      }
    }
  }

  return { baslat, durdur };
})();
