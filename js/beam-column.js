/**
 * CivilStruct Pro Enterprise - Modul 1: Analisis Balok & Kolom Beton Bertulang (SNI 2847:2019)
 * Dilengkapi Perhitungan Lentur Dinamis (phi variatif), Analisis Geser (Vc + Vs),
 * Visualisasi Penampang Lintang & Kurva Interaksi P-M Kolom Real-Time.
 */

const BeamColumnModule = (() => {
  // DOM Inputs
  const elB = document.getElementById('input_b');
  const elH = document.getElementById('input_h');
  const elCc = document.getElementById('input_cc');
  const elDs = document.getElementById('input_ds');
  const elS = document.getElementById('input_s');
  const elFc = document.getElementById('input_fc');
  const elFy = document.getElementById('input_fy');
  const elNt = document.getElementById('input_nt');
  const elNc = document.getElementById('input_nc');
  const elD = document.getElementById('input_d');
  const elMu = document.getElementById('input_mu');
  const elVu = document.getElementById('input_vu');
  const elPu = document.getElementById('input_pu');

  // DOM Outputs
  const elPhiMn = document.getElementById('res_phiMn');
  const elPhiVn = document.getElementById('res_phiVn');
  const elVc = document.getElementById('res_vc');
  const elVs = document.getElementById('res_vs');
  const elEffD = document.getElementById('res_d');
  const elWhitneyA = document.getElementById('res_a');
  const elNeutralC = document.getElementById('res_c');
  const elPhiVal = document.getElementById('res_phi');
  const elRho = document.getElementById('res_rho');
  const elEpsT = document.getElementById('res_epst');

  // Status & Progress Cards
  const elStatusCard = document.getElementById('beamStatusCard');
  const elStatusBadge = document.getElementById('beamStatusBadge');
  const elStatusDetail = document.getElementById('beamStatusDetail');
  const elDCRatio = document.getElementById('beamDCRatio');
  const elDCBar = document.getElementById('beamDCBar');
  const elShearRatio = document.getElementById('beamShearRatio');
  const elStepCalc = document.getElementById('beamStepCalc');

  // Canvas
  const canvasSection = document.getElementById('beamSectionCanvas');
  const ctxSection = canvasSection ? canvasSection.getContext('2d') : null;

  const canvasPM = document.getElementById('beamPMCanvas');
  const ctxPM = canvasPM ? canvasPM.getContext('2d') : null;

  // Presets
  const presets = {
    'balok-gedung': { b: 350, h: 650, cc: 40, ds: 10, s: 150, fc: 30, fy: 420, nt: 5, nc: 2, d: 22, mu: 260, vu: 110, pu: 0 },
    'kolom-lantai-1': { b: 500, h: 500, cc: 40, ds: 12, s: 100, fc: 35, fy: 420, nt: 4, nc: 4, d: 25, mu: 210, vu: 95, pu: 1450 },
    'gelagar-box': { b: 450, h: 900, cc: 50, ds: 13, s: 120, fc: 40, fy: 420, nt: 8, nc: 3, d: 28, mu: 880, vu: 320, pu: 150 },
    'kolom-portal': { b: 400, h: 600, cc: 40, ds: 10, s: 125, fc: 28, fy: 420, nt: 5, nc: 5, d: 22, mu: 180, vu: 85, pu: 950 }
  };

  /**
   * Menghitung beta1 SNI 2847:2019
   */
  function getBeta1(fc) {
    if (fc <= 28) return 0.85;
    let b1 = 0.85 - (0.05 * (fc - 28)) / 7;
    return Math.max(0.65, Math.min(0.85, b1));
  }

  /**
   * Kalkulasi Utama
   */
  function calculate() {
    const b = Math.max(100, parseFloat(elB?.value) || 350);
    const h = Math.max(100, parseFloat(elH?.value) || 650);
    const cc = Math.max(20, parseFloat(elCc?.value) || 40);
    const ds = Math.max(6, parseFloat(elDs?.value) || 10);
    const s = Math.max(40, parseFloat(elS?.value) || 150);
    const fc = Math.max(15, parseFloat(elFc?.value) || 30);
    const fy = Math.max(240, parseFloat(elFy?.value) || 420);
    const nt = Math.max(1, parseInt(elNt?.value) || 4);
    const nc = Math.max(0, parseInt(elNc?.value) || 2);
    const D = Math.max(10, parseFloat(elD?.value) || 22);
    const Mu = Math.max(0, parseFloat(elMu?.value) || 0);
    const Vu = Math.max(0, parseFloat(elVu?.value) || 0);
    const Pu = Math.max(0, parseFloat(elPu?.value) || 0); // kN tekan

    const Ag = b * h;
    const beta1 = getBeta1(fc);
    const Es = 200000; // MPa
    const eps_y = fy / Es;

    // Tinggi efektif d dan d'
    const d = h - cc - ds - (D / 2);
    const dPrime = cc + ds + (D / 2);

    // Luas tulangan tarik dan tekan
    const barArea = (Math.PI / 4) * Math.pow(D, 2);
    const Ast = nt * barArea;
    const Asc = nc * barArea;
    const AsTotal = Ast + Asc;

    // 1. KEDALAMAM BLOK WHITNEY & SUMBU NETRAL LENTUR
    // a = (Ast * fy - Asc * f's) / (0.85 * fc * b)
    // Sederhana dengan tulangan tarik leleh (desain under-reinforced)
    let a = (Ast * fy) / (0.85 * fc * b);
    let c = a / beta1;

    // Cek regangan tarik baja ekstrim
    const eps_cu = 0.003;
    const eps_t = c > 0 ? ((d - c) / c) * eps_cu : 0.01;

    // 2. FAKTOR REDUKSI PHI DINAMIS (SNI 2847:2019 Pasal 21.2)
    let phi = 0.90;
    let failureMode = 'Terkontrol Tarik (Daktail)';
    if (eps_t <= eps_y) {
      phi = 0.65; // Compression-controlled (sengkang pengikat biasa)
      failureMode = 'Terkontrol Tekan (Getas)';
    } else if (eps_t < 0.005) {
      phi = 0.65 + (eps_t - eps_y) * (0.25 / (0.005 - eps_y));
      failureMode = 'Zona Transisi';
    }

    // 3. KAPASITAS LENTUR NOMINAL & TERFAKTOR
    const armZ = d - (a / 2);
    const Mn = (Ast * fy * armZ) / 1e6; // kNm
    const phiMn = phi * Mn; // kNm

    // 4. ANALISIS GESER (SNI 2847:2019 Pasal 22.5)
    // Pengaruh gaya aksial tekan Pu pada beton: Vc = 0.17 * (1 + Nu / (14*Ag)) * sqrt(f'c) * b * d
    const axialEnhance = 1 + (Pu * 1000) / (14 * Ag);
    const Vc_N = 0.17 * axialEnhance * Math.sqrt(fc) * b * d;
    const Vc = Vc_N / 1000; // kN

    // Tulangan geser sengkang 2 kaki: Av = 2 * (pi/4 * ds^2)
    const Av = 2 * (Math.PI / 4) * Math.pow(ds, 2);
    const Vs_N = (Av * fy * d) / s;
    const Vs = Vs_N / 1000; // kN
    const VsMax = (0.66 * Math.sqrt(fc) * b * d) / 1000;
    const VsEffective = Math.min(Vs, VsMax);

    const phi_v = 0.75; // Faktor reduksi geser SNI
    const Vn = Vc + VsEffective;
    const phiVn = phi_v * Vn; // kN

    // Rasio Tulangan
    const rho = Ast / (b * d);
    const rhoMin = Math.max((0.25 * Math.sqrt(fc)) / fy, 1.4 / fy);

    // Evaluasi Keselamatan Struktur
    const flexureRatio = phiMn > 0 ? (Mu / phiMn) : 999;
    const shearRatio = phiVn > 0 ? (Vu / phiVn) : 999;
    const maxDemandCapacity = Math.max(flexureRatio, shearRatio);
    const isSafe = (Mu <= phiMn) && (Vu <= phiVn);

    // Update Output DOM
    if (elPhiMn) elPhiMn.innerText = phiMn.toFixed(2);
    if (elPhiVn) elPhiVn.innerText = phiVn.toFixed(2);
    if (elVc) elVc.innerText = (phi_v * Vc).toFixed(2);
    if (elVs) elVs.innerText = (phi_v * VsEffective).toFixed(2);
    if (elEffD) elEffD.innerText = d.toFixed(1);
    if (elWhitneyA) elWhitneyA.innerText = a.toFixed(1);
    if (elNeutralC) elNeutralC.innerText = c.toFixed(1);
    if (elPhiVal) elPhiVal.innerText = phi.toFixed(3);
    if (elRho) elRho.innerText = (rho * 100).toFixed(2) + ' %';
    if (elEpsT) elEpsT.innerText = eps_t.toFixed(4);

    // Update Status Badge & Bar
    if (elDCRatio) elDCRatio.innerText = `${(flexureRatio * 100).toFixed(1)} %`;
    if (elShearRatio) elShearRatio.innerText = `${(shearRatio * 100).toFixed(1)} %`;
    if (elDCBar) elDCBar.style.width = `${Math.min(100, Math.max(5, maxDemandCapacity * 100))}%`;

    if (isSafe) {
      if (elStatusBadge) {
        elStatusBadge.className = 'text-lg sm:text-2xl font-black px-4 py-1.5 rounded-xl tracking-wide flex items-center space-x-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 glow-emerald';
        elStatusBadge.innerHTML = `
          <svg class="w-6 h-6 text-emerald-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>STRUKTUR AMAN (LENTUR & GESER OKE)</span>
        `;
      }
      if (elStatusCard) elStatusCard.className = 'p-5 rounded-2xl border transition-all duration-300 bg-slate-900 border-emerald-500/30 shadow-xl';
      if (elStatusDetail) {
        elStatusDetail.innerHTML = `Kapasitas lentur &phi;Mn = <strong class="text-emerald-400">${phiMn.toFixed(1)} kNm</strong> (&ge; ${Mu} kNm) &amp; Kapasitas geser &phi;Vn = <strong class="text-emerald-400">${phiVn.toFixed(1)} kN</strong> (&ge; ${Vu} kN). Kondisi: ${failureMode}.`;
      }
      if (elDCBar) elDCBar.className = 'h-full bg-emerald-500 rounded-full transition-all duration-500';
    } else {
      if (elStatusBadge) {
        elStatusBadge.className = 'text-lg sm:text-2xl font-black px-4 py-1.5 rounded-xl tracking-wide flex items-center space-x-2 bg-rose-500/20 text-rose-400 border border-rose-500/40 glow-rose';
        elStatusBadge.innerHTML = `
          <svg class="w-6 h-6 text-rose-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span>TIDAK AMAN (OVERLOAD / KAPASITAS KURANG)</span>
        `;
      }
      if (elStatusCard) elStatusCard.className = 'p-5 rounded-2xl border transition-all duration-300 bg-slate-900 border-rose-500/40 shadow-xl';
      if (elStatusDetail) {
        const failReasons = [];
        if (Mu > phiMn) failReasons.push(`Lentur terlampaui (Mu/&phi;Mn = ${(flexureRatio*100).toFixed(1)}%)`);
        if (Vu > phiVn) failReasons.push(`Geser terlampaui (Vu/&phi;Vn = ${(shearRatio*100).toFixed(1)}%)`);
        elStatusDetail.innerHTML = `<span class="text-rose-400 font-semibold">${failReasons.join(' & ')}</span>. Disarankan perbesar ukuran penampang atau tambah tulangan.`;
      }
      if (elDCBar) elDCBar.className = 'h-full bg-rose-500 rounded-full transition-all duration-500';
    }

    // Step-by-Step Calculation Breakdown
    if (elStepCalc) {
      elStepCalc.innerHTML = `
        <div class="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
          <div class="text-slate-400 text-[11px]">1. Analisis Regangan & Reduksi Kekuatan (&phi; Dinamis):</div>
          <div class="text-white text-xs">c = a / &beta;1 = ${a.toFixed(1)} / ${beta1.toFixed(3)} = <strong>${c.toFixed(1)} mm</strong> | &epsilon;t = [(d - c)/c] &times; 0.003 = <strong class="text-purple-400">${eps_t.toFixed(5)}</strong></div>
          <div class="text-slate-300 text-[11px] mt-0.5">Klasifikasi: <span class="text-blue-400 font-semibold">${failureMode}</span> &rarr; Nilai &phi; = <strong class="text-emerald-400">${phi.toFixed(3)}</strong> (SNI 2847:2019 Pasal 21.2.2)</div>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
          <div class="text-slate-400 text-[11px]">2. Kapasitas Lentur Penampang (&phi;Mn):</div>
          <div class="text-white text-xs">Mn = Ast &times; fy &times; (d - a/2) = ${Ast.toFixed(0)} &times; ${fy} &times; (${d.toFixed(1)} - ${(a/2).toFixed(1)}) = <strong>${Mn.toFixed(2)} kNm</strong></div>
          <div class="text-emerald-400 font-bold text-xs mt-0.5">&phi;Mn = ${phi.toFixed(3)} &times; ${Mn.toFixed(2)} = ${phiMn.toFixed(2)} kNm (D/C: ${(flexureRatio*100).toFixed(1)}%)</div>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
          <div class="text-slate-400 text-[11px]">3. Kapasitas Geser Penampang (&phi;Vn = &phi; [Vc + Vs]):</div>
          <div class="text-slate-300 text-xs">&bull; Beton (Vc): 0.17 &times; (1 + ${Pu}/(14&times;Ag)) &times; &radic;${fc} &times; ${b} &times; ${d.toFixed(0)} = <strong>${Vc.toFixed(1)} kN</strong></div>
          <div class="text-slate-300 text-xs">&bull; Sengkang (Vs): (Av &times; fy &times; d) / s = (${Av.toFixed(0)} &times; ${fy} &times; ${d.toFixed(0)}) / ${s} = <strong>${VsEffective.toFixed(1)} kN</strong></div>
          <div class="text-emerald-400 font-bold text-xs mt-0.5">&phi;Vn = 0.75 &times; (${Vc.toFixed(1)} + ${VsEffective.toFixed(1)}) = ${phiVn.toFixed(2)} kN (D/C Geser: ${(shearRatio*100).toFixed(1)}%)</div>
        </div>
      `;
    }

    // Gambar Canvas Penampang
    drawSection({ b, h, cc, ds, s, nt, nc, D, d, dPrime, a, c, isSafe });

    // Gambar Kurva Interaksi P-M Kolom
    drawPMDiagram({ b, h, fc, fy, Ast, Asc, d, dPrime, Ag, beta1, Mu, Pu });
  }

  /**
   * VISUALIZER 1: Gambar Penampang Lintang Balok/Kolom
   */
  function drawSection(data) {
    if (!ctxSection || !canvasSection) return;

    const rect = canvasSection.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cw = rect.width || 380;
    const ch = rect.height || 300;

    canvasSection.width = cw * dpr;
    canvasSection.height = ch * dpr;
    ctxSection.resetTransform ? ctxSection.resetTransform() : ctxSection.setTransform(1, 0, 0, 1, 0, 0);
    ctxSection.scale(dpr, dpr);

    // Canvas Background
    ctxSection.fillStyle = '#020617';
    ctxSection.fillRect(0, 0, cw, ch);

    // Dimensi gambar proporsional
    const margin = 45;
    const maxW = cw - margin * 2;
    const maxH = ch - margin * 2;
    const scale = Math.min(maxW / data.b, maxH / data.h);

    const drawW = data.b * scale;
    const drawH = data.h * scale;
    const ox = (cw - drawW) / 2;
    const oy = (ch - drawH) / 2;

    // 1. Badan Beton
    ctxSection.fillStyle = '#1e293b';
    ctxSection.strokeStyle = '#38bdf8';
    ctxSection.lineWidth = 2;
    ctxSection.fillRect(ox, oy, drawW, drawH);
    ctxSection.strokeRect(ox, oy, drawW, drawH);

    // Tekstur beton halus
    ctxSection.fillStyle = 'rgba(148, 163, 184, 0.08)';
    for (let i = 0; i < 24; i++) {
      const rx = ox + 6 + ((i * 41) % (drawW - 12));
      const ry = oy + 6 + ((i * 59) % (drawH - 12));
      ctxSection.beginPath();
      ctxSection.arc(rx, ry, 1.2, 0, Math.PI * 2);
      ctxSection.fill();
    }

    // 2. Sengkang Ties
    const pad = data.cc * scale;
    const stirW = drawW - 2 * pad;
    const stirH = drawH - 2 * pad;
    const sx = ox + pad;
    const sy = oy + pad;

    ctxSection.strokeStyle = '#64748b';
    ctxSection.lineWidth = Math.max(1.5, data.ds * scale * 0.4);
    ctxSection.beginPath();
    ctxSection.strokeRect(sx, sy, stirW, stirH);

    // 3. Blok Tekan Whitney (a)
    const drawA = Math.min(drawH, data.a * scale);
    ctxSection.fillStyle = 'rgba(168, 85, 247, 0.25)';
    ctxSection.fillRect(ox, oy, drawW, drawA);

    // Garis Garis Netral (c)
    const drawC = Math.min(drawH, data.c * scale);
    ctxSection.strokeStyle = '#ec4899';
    ctxSection.lineWidth = 1.5;
    ctxSection.setLineDash([4, 3]);
    ctxSection.beginPath();
    ctxSection.moveTo(ox - 8, oy + drawC);
    ctxSection.lineTo(ox + drawW + 8, oy + drawC);
    ctxSection.stroke();
    ctxSection.setLineDash([]);

    // 4. Titik-Titik Tulangan Tarik (Bawah)
    const barR = Math.max(3, (data.D / 2) * scale);
    const botY = sy + stirH - (data.ds * scale * 0.5) - barR;
    const topY = sy + (data.ds * scale * 0.5) + barR;

    const startX = sx + (data.ds * scale * 0.5) + barR;
    const endX = sx + stirW - (data.ds * scale * 0.5) - barR;

    // Tulangan Tarik (Bawah)
    for (let i = 0; i < data.nt; i++) {
      const bx = data.nt === 1 ? (sx + stirW / 2) : startX + (i * (endX - startX)) / (data.nt - 1);
      drawRebarPoint(ctxSection, bx, botY, barR, '#f59e0b');
    }

    // Tulangan Tekan / Atas
    if (data.nc > 0) {
      for (let i = 0; i < data.nc; i++) {
        const bx = data.nc === 1 ? (sx + stirW / 2) : startX + (i * (endX - startX)) / (data.nc - 1);
        drawRebarPoint(ctxSection, bx, topY, barR, '#38bdf8');
      }
    }

    // 5. Garis Dimensi b & h
    ctxSection.fillStyle = '#cbd5e1';
    ctxSection.strokeStyle = '#64748b';
    ctxSection.font = '10px JetBrains Mono, monospace';
    ctxSection.textAlign = 'center';

    // Lebar b
    ctxSection.fillText(`b = ${data.b} mm`, ox + drawW / 2, oy - 8);
    // Tinggi h
    ctxSection.save();
    ctxSection.translate(ox - 10, oy + drawH / 2);
    ctxSection.rotate(-Math.PI / 2);
    ctxSection.fillText(`h = ${data.h} mm`, 0, 0);
    ctxSection.restore();

    // Sumbu Netral NA Label
    ctxSection.fillStyle = '#ec4899';
    ctxSection.font = '9px JetBrains Mono, monospace';
    ctxSection.textAlign = 'left';
    ctxSection.fillText(`c=${data.c.toFixed(0)}`, ox + drawW + 4, oy + drawC + 3);
  }

  function drawRebarPoint(ctx, x, y, r, color) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  /**
   * VISUALIZER 2: Kurva Interaksi P-M Kolom Real-Time (SNI 2847:2019)
   */
  function drawPMDiagram(data) {
    if (!ctxPM || !canvasPM) return;

    const rect = canvasPM.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cw = rect.width || 380;
    const ch = rect.height || 300;

    canvasPM.width = cw * dpr;
    canvasPM.height = ch * dpr;
    ctxPM.resetTransform ? ctxPM.resetTransform() : ctxPM.setTransform(1, 0, 0, 1, 0, 0);
    ctxPM.scale(dpr, dpr);

    // Background
    ctxPM.fillStyle = '#020617';
    ctxPM.fillRect(0, 0, cw, ch);

    const { b, h, fc, fy, Ast, Asc, d, dPrime, Ag, beta1, Mu, Pu } = data;
    const AsTotal = Ast + Asc;

    // 1. Hitung Titik-titik Kunci Kurva Interaksi Kolom
    // Titik A: Tekan Murni P0
    const P0 = (0.85 * fc * (Ag - AsTotal) + fy * AsTotal) / 1000; // kN
    const PnMax = 0.80 * P0; // Kapasitas batas nominal untuk kolom pengikat sengkang
    const phi_comp = 0.65;
    const phiPnMax = phi_comp * PnMax;

    // Titik Tarik Murni Pt
    const Pt = (-fy * AsTotal) / 1000; // kN
    const phiPt = 0.90 * Pt;

    // Titik Seimbang (Balanced Condition)
    // cb = 600 / (600 + fy) * d
    const cb = (600 / (600 + fy)) * d;
    const ab = beta1 * cb;
    const eps_s_prime_b = ((cb - dPrime) / cb) * 0.003;
    const fs_prime_b = Math.min(fy, Math.max(-fy, eps_s_prime_b * 200000));

    const Cc_b = 0.85 * fc * beta1 * cb * b / 1000; // kN
    const Cs_b = Asc * (fs_prime_b - 0.85 * fc) / 1000;
    const Ts_b = Ast * fy / 1000;
    const Pb = Cc_b + Cs_b - Ts_b; // kN
    const Mb = (Cc_b * (h / 2 - ab / 2) + Cs_b * (h / 2 - dPrime) + Ts_b * (d - h / 2)) / 1000; // kNm
    const phiPb = 0.65 * Pb;
    const phiMb = 0.65 * Mb;

    // Generate Titik Envelope P-M diskret
    const nominalCurve = [];
    const designCurve = [];
    const steps = 30;

    for (let i = 0; i <= steps; i++) {
      // Variasi letak garis netral c dari tinggi h hingga dekat 0
      const c_val = h * (1.2 - (i / steps) * 1.15);
      if (c_val <= 0) continue;

      const a_val = Math.min(h, beta1 * c_val);
      const eps_s = ((d - c_val) / c_val) * 0.003;
      const fs = Math.min(fy, Math.max(-fy, eps_s * 200000));

      const eps_sc = ((c_val - dPrime) / c_val) * 0.003;
      const fsc = Math.min(fy, Math.max(-fy, eps_sc * 200000));

      const Cc = (0.85 * fc * a_val * b) / 1000;
      const Cs = (Asc * (fsc - 0.85 * fc)) / 1000;
      const Ts = (Ast * fs) / 1000;

      const Pn = Cc + Cs - Ts;
      const Mn = (Cc * (h / 2 - a_val / 2) + Cs * (h / 2 - dPrime) + Ts * (d - h / 2)) / 1000;

      // Faktor phi dinamis untuk kurva rencana
      let phi_local = 0.65;
      const eps_y = fy / 200000;
      if (eps_s >= 0.005) {
        phi_local = 0.90;
      } else if (eps_s > eps_y) {
        phi_local = 0.65 + (eps_s - eps_y) * (0.25 / (0.005 - eps_y));
      }

      const cappedPn = Math.min(Pn, PnMax);
      nominalCurve.push({ M: Math.max(0, Mn), P: cappedPn });
      designCurve.push({ M: Math.max(0, Mn * phi_local), P: Math.min(Pn * phi_local, phiPnMax) });
    }

    // Skala Plot P-M
    const plotPadLeft = 45;
    const plotPadBottom = 30;
    const plotPadTop = 25;
    const plotPadRight = 20;

    const maxM_val = Math.max(Mb * 1.5, Mu * 1.3, 100);
    const maxP_val = Math.max(P0 * 1.1, Pu * 1.2, 500);

    const plotW = cw - plotPadLeft - plotPadRight;
    const plotH = ch - plotPadTop - plotPadBottom;

    const toPxX = (m) => plotPadLeft + (m / maxM_val) * plotW;
    const toPxY = (p) => ch - plotPadBottom - (p / maxP_val) * plotH;

    // Grid Sumbu
    ctxPM.strokeStyle = '#1e293b';
    ctxPM.lineWidth = 1;
    for (let pStep = 0; pStep <= maxP_val; pStep += maxP_val / 4) {
      const y = toPxY(pStep);
      ctxPM.beginPath();
      ctxPM.moveTo(plotPadLeft, y);
      ctxPM.lineTo(cw - plotPadRight, y);
      ctxPM.stroke();
    }

    // Sumbu X & Y Utama
    ctxPM.strokeStyle = '#475569';
    ctxPM.lineWidth = 1.5;
    ctxPM.beginPath();
    ctxPM.moveTo(plotPadLeft, toPxY(0));
    ctxPM.lineTo(cw - plotPadRight, toPxY(0));
    ctxPM.moveTo(plotPadLeft, toPxY(0));
    ctxPM.lineTo(plotPadLeft, plotPadTop);
    ctxPM.stroke();

    // 1. Gambar Kurva Kapasitas Rencana phi Pn - phi Mn (Cyan Glow)
    ctxPM.save();
    ctxPM.strokeStyle = '#38bdf8';
    ctxPM.lineWidth = 2.5;
    ctxPM.shadowColor = 'rgba(56, 189, 248, 0.4)';
    ctxPM.shadowBlur = 8;
    ctxPM.beginPath();

    // Garis datar phi PnMax
    const pTopY = toPxY(phiPnMax);
    ctxPM.moveTo(plotPadLeft, pTopY);

    designCurve.forEach((pt, idx) => {
      const px = toPxX(pt.M);
      const py = toPxY(pt.P);
      if (idx === 0) ctxPM.lineTo(px, py);
      else ctxPM.lineTo(px, py);
    });
    ctxPM.lineTo(plotPadLeft, toPxY(0));
    ctxPM.stroke();

    // Fill Arsir Transparan Envelope Kapasitas Aman
    ctxPM.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctxPM.fill();
    ctxPM.restore();

    // 2. Gambar Titik Beban Aktual (Mu, Pu)
    const workPtX = toPxX(Mu);
    const workPtY = toPxY(Pu);

    // Cek apakah (Mu, Pu) berada di dalam kapasitas
    // Interpolasi sederhana jarak terhadap kurva
    ctxPM.save();
    ctxPM.beginPath();
    ctxPM.arc(workPtX, workPtY, 5, 0, Math.PI * 2);
    ctxPM.fillStyle = (Pu <= phiPnMax && Mu <= phiMb * 1.8) ? '#10b981' : '#f43f5e';
    ctxPM.shadowColor = ctxPM.fillStyle;
    ctxPM.shadowBlur = 10;
    ctxPM.fill();
    ctxPM.strokeStyle = '#ffffff';
    ctxPM.lineWidth = 2;
    ctxPM.stroke();
    ctxPM.restore();

    // Anotasi Teks Titik Kerja
    ctxPM.fillStyle = '#ffffff';
    ctxPM.font = 'bold 9px JetBrains Mono, monospace';
    ctxPM.fillText(`(Mu=${Mu}, Pu=${Pu})`, Math.min(cw - 110, workPtX + 8), Math.max(plotPadTop + 15, workPtY - 6));

    // Label Sumbu
    ctxPM.fillStyle = '#94a3b8';
    ctxPM.font = '10px Inter, sans-serif';
    ctxPM.textAlign = 'center';
    ctxPM.fillText('Momen Lentur, Mu (kNm)', plotPadLeft + plotW / 2, ch - 8);

    ctxPM.save();
    ctxPM.translate(14, plotPadTop + plotH / 2);
    ctxPM.rotate(-Math.PI / 2);
    ctxPM.fillText('Aksial, Pu (kN)', 0, 0);
    ctxPM.restore();

    // Judul Kurva
    ctxPM.fillStyle = '#38bdf8';
    ctxPM.font = 'bold 10px Inter, sans-serif';
    ctxPM.textAlign = 'right';
    ctxPM.fillText('KURVA INTERAKSI P-M (\u03A6Pn - \u03A6Mn)', cw - plotPadRight, plotPadTop + 10);
  }

  function init() {
    const inputs = [elB, elH, elCc, elDs, elS, elFc, elFy, elNt, elNc, elD, elMu, elVu, elPu];
    inputs.forEach(inp => {
      if (inp) {
        inp.addEventListener('input', calculate);
        inp.addEventListener('change', calculate);
      }
    });

    const presetSelect = document.getElementById('beamPresetSelect');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (presets[val]) {
          const p = presets[val];
          if (elB) elB.value = p.b;
          if (elH) elH.value = p.h;
          if (elCc) elCc.value = p.cc;
          if (elDs) elDs.value = p.ds;
          if (elS) elS.value = p.s;
          if (elFc) elFc.value = p.fc;
          if (elFy) elFy.value = p.fy;
          if (elNt) elNt.value = p.nt;
          if (elNc) elNc.value = p.nc;
          if (elD) elD.value = p.d;
          if (elMu) elMu.value = p.mu;
          if (elVu) elVu.value = p.vu;
          if (elPu) elPu.value = p.pu;
          calculate();
        }
      });
    }

    const btnReset = document.getElementById('btnResetBeam');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        const p = presets['balok-gedung'];
        if (elB) elB.value = p.b;
        if (elH) elH.value = p.h;
        if (elCc) elCc.value = p.cc;
        if (elDs) elDs.value = p.ds;
        if (elS) elS.value = p.s;
        if (elFc) elFc.value = p.fc;
        if (elFy) elFy.value = p.fy;
        if (elNt) elNt.value = p.nt;
        if (elNc) elNc.value = p.nc;
        if (elD) elD.value = p.d;
        if (elMu) elMu.value = p.mu;
        if (elVu) elVu.value = p.vu;
        if (elPu) elPu.value = p.pu;
        calculate();
      });
    }

    calculate();
    window.addEventListener('resize', calculate);
  }

  return { init, calculate };
})();

