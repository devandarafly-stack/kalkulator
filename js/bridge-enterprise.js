/**
 * CivilStruct Pro Enterprise - Modul 2: Analisis Gelagar Jembatan & Pembebanan Truk/Lajur (SNI 1725:2016)
 * Kombinasi Kuat I (MS, MA, BTR, BGT, Truk TT 500 kN, DLA), Kontrol Lendutan L/800,
 * dan Visualisasi Diagram SFD, BMD, serta Profil Lendutan Balok Gelagar.
 */

const BridgeEnterpriseModule = (() => {
  // DOM Inputs
  const elL = document.getElementById('input_br_L');
  const elMS = document.getElementById('input_br_MS');
  const elMA = document.getElementById('input_br_MA');
  const elQ = document.getElementById('input_br_q');
  const elPBGT = document.getElementById('input_br_PBGT');
  const elPTruck = document.getElementById('input_br_PTruck');
  const elE = document.getElementById('input_br_E');
  const elI = document.getElementById('input_br_I');

  // DOM Outputs
  const elMu = document.getElementById('res_br_Mu');
  const elVu = document.getElementById('res_br_Vu');
  const elDelta = document.getElementById('res_br_delta');
  const elDeltaIjin = document.getElementById('res_br_delta_ijin');
  const elDLA = document.getElementById('res_br_dla');

  // Status & Progress Cards
  const elStatusCard = document.getElementById('bridgeStatusCard');
  const elStatusBadge = document.getElementById('bridgeStatusBadge');
  const elStatusDetail = document.getElementById('bridgeStatusDetail');
  const elDeflRatio = document.getElementById('bridgeDeflRatio');
  const elDeflBar = document.getElementById('bridgeDeflBar');
  const elStepCalc = document.getElementById('bridgeStepCalc');

  // Canvas & Tooltip
  const canvas = document.getElementById('bridgeCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const tooltip = document.getElementById('canvasTooltip');

  let currentBridgeData = null;
  let mouseHoverX = null;

  // Presets
  const presets = {
    'gelagar-komposit-25m': { L: 25, MS: 28, MA: 12, q: 32, PBGT: 140, PTruck: 225, E: 200000, I: 0.048 },
    'box-girder-35m': { L: 35, MS: 45, MA: 18, q: 38, PBGT: 160, PTruck: 250, E: 200000, I: 0.145 },
    'girder-beton-20m': { L: 20, MS: 35, MA: 10, q: 28, PBGT: 120, PTruck: 200, E: 32000, I: 0.082 },
    'jpo-pejalan-kaki': { L: 16, MS: 8, MA: 3, q: 15, PBGT: 30, PTruck: 0, E: 200000, I: 0.012 }
  };

  /**
   * Menghitung Faktor Beban Dinamis (FBD / DLA) SNI 1725:2016 Pasal 8.6
   */
  function getDLA(L) {
    if (L <= 50) return 0.40;
    if (L < 90) return 0.40 - 0.0025 * (L - 50);
    return 0.30;
  }

  function calculate() {
    const L = Math.max(2, parseFloat(elL?.value) || 25);
    const MS = Math.max(0, parseFloat(elMS?.value) || 28);
    const MA = Math.max(0, parseFloat(elMA?.value) || 12);
    const qLajur = Math.max(0, parseFloat(elQ?.value) || 32);
    const PBGT = Math.max(0, parseFloat(elPBGT?.value) || 140);
    const PTruck = Math.max(0, parseFloat(elPTruck?.value) || 225);
    const E = Math.max(5000, parseFloat(elE?.value) || 200000); // MPa
    const I = Math.max(0.0001, parseFloat(elI?.value) || 0.048); // m4

    // 1. FAKTOR BEBAN DINAMIS (DLA)
    const DLA = getDLA(L);

    // 2. KOMBINASI KUAT I (ULTIMATE) SNI 1725:2016 Tabel 1
    // Beban Mati: 1.3 MS + 2.0 MA
    // Beban Hidup: 1.8 * Beban Lajur atau 1.8 * Beban Truk
    const q_ult = (1.3 * MS) + (2.0 * MA) + (1.8 * qLajur); // kN/m

    // Beban terpusat rencana dengan DLA
    const P_BGT_ult = 1.8 * PBGT * (1 + DLA);
    const P_Truck_ult = 1.8 * PTruck * (1 + DLA);
    const P_ult = Math.max(P_BGT_ult, P_Truck_ult); // Ambil kondisi paling menentukan

    // 3. GAYA DALAM TERFAKTOR
    const Mu_q = (q_ult * Math.pow(L, 2)) / 8;
    const Mu_P = (P_ult * L) / 4;
    const Mu = Mu_q + Mu_P; // kNm

    const Vu = (q_ult * L / 2) + (P_ult / 2); // kN

    // 4. KONTROL LENDUTAN LAYAN (SERVICE I)
    const q_srv = MS + MA + (1.0 * qLajur);
    const P_srv = Math.max(PBGT, PTruck) * (1 + DLA);

    // delta (mm) = (5 * q * L^4) / (384 * E * I) + (P * L^3) / (48 * E * I)
    const delta_q = (5 * q_srv * Math.pow(L, 4)) / (384 * E * I);
    const delta_P = (P_srv * Math.pow(L, 3)) / (48 * E * I);
    const delta_max = delta_q + delta_P; // mm

    // Batas Izin SNI 1725: delta_ijin = L / 800
    const delta_ijin = (L * 1000) / 800; // mm
    const deflRatio = delta_ijin > 0 ? (delta_max / delta_ijin) : 0;
    const isCompliant = delta_max <= delta_ijin;

    currentBridgeData = {
      L, MS, MA, qLajur, PBGT, PTruck, DLA, q_ult, P_ult, Mu, Vu,
      q_srv, P_srv, delta_q, delta_P, delta_max, delta_ijin, isCompliant
    };

    // Update DOM
    if (elMu) elMu.innerText = Mu.toFixed(1);
    if (elVu) elVu.innerText = Vu.toFixed(1);
    if (elDelta) elDelta.innerText = delta_max.toFixed(2);
    if (elDeltaIjin) elDeltaIjin.innerText = delta_ijin.toFixed(2);
    if (elDLA) elDLA.innerText = `${(DLA * 100).toFixed(1)} %`;

    if (elDeflRatio) elDeflRatio.innerText = `${(deflRatio * 100).toFixed(1)} %`;
    if (elDeflBar) {
      elDeflBar.style.width = `${Math.min(100, Math.max(5, deflRatio * 100))}%`;
      elDeflBar.className = isCompliant ? 'h-full bg-emerald-500 rounded-full transition-all duration-500' : 'h-full bg-rose-500 rounded-full transition-all duration-500';
    }

    if (isCompliant) {
      if (elStatusBadge) {
        elStatusBadge.className = 'text-lg sm:text-2xl font-black px-4 py-1.5 rounded-xl tracking-wide flex items-center space-x-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 glow-emerald';
        elStatusBadge.innerHTML = `
          <svg class="w-6 h-6 text-emerald-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>LENDUTAN MEMENUHI SYARAT SNI 1725</span>
        `;
      }
      if (elStatusCard) elStatusCard.className = 'p-5 rounded-2xl border transition-all duration-300 bg-slate-900 border-emerald-500/30 shadow-xl';
      if (elStatusDetail) {
        elStatusDetail.innerHTML = `Lendutan aktual <strong class="text-emerald-400">${delta_max.toFixed(2)} mm</strong> lebih kecil dari batas lendutan izin <strong class="text-white">${delta_ijin.toFixed(2)} mm</strong> (L/800).`;
      }
    } else {
      if (elStatusBadge) {
        elStatusBadge.className = 'text-lg sm:text-2xl font-black px-4 py-1.5 rounded-xl tracking-wide flex items-center space-x-2 bg-rose-500/20 text-rose-400 border border-rose-500/40 glow-rose';
        elStatusBadge.innerHTML = `
          <svg class="w-6 h-6 text-rose-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span>LENDUTAN MELEBIHI BATAS IZIN (DEFLECTION OVER LIMIT)</span>
        `;
      }
      if (elStatusCard) elStatusCard.className = 'p-5 rounded-2xl border transition-all duration-300 bg-slate-900 border-rose-500/40 shadow-xl';
      if (elStatusDetail) {
        elStatusDetail.innerHTML = `Lendutan <strong class="text-rose-400">${delta_max.toFixed(2)} mm</strong> MELEBIHI batas izin <strong class="text-white">${delta_ijin.toFixed(2)} mm</strong>. Tambahkan momen inersia (I) atau mutu bahan gelagar.`;
      }
    }

    // Step-by-Step Breakdown
    if (elStepCalc) {
      elStepCalc.innerHTML = `
        <div class="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
          <div class="text-slate-400 text-[11px]">1. Faktor Beban Dinamis (DLA) & Kombinasi Kuat I:</div>
          <div class="text-white text-xs">Bentang L = ${L} m &rarr; DLA = <strong>${(DLA*100).toFixed(1)}%</strong></div>
          <div class="text-slate-300 text-xs mt-0.5">&bull; qu = 1.3(${MS}) + 2.0(${MA}) + 1.8(${qLajur}) = <strong class="text-blue-400">${q_ult.toFixed(1)} kN/m</strong></div>
          <div class="text-slate-300 text-xs">&bull; Pu = 1.8 &times; ${Math.max(PBGT, PTruck)} &times; (1 + ${DLA}) = <strong class="text-amber-400">${P_ult.toFixed(1)} kN</strong></div>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
          <div class="text-slate-400 text-[11px]">2. Gaya Dalam Maksimum Terfaktor:</div>
          <div class="text-white text-xs">Mu = (qu&times;L&sup2;)/8 + (Pu&times;L)/4 = <strong class="text-amber-400">${Mu.toFixed(1)} kNm</strong></div>
          <div class="text-white text-xs mt-0.5">Vu = (qu&times;L)/2 + (Pu/2) = <strong class="text-blue-400">${Vu.toFixed(1)} kN</strong></div>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
          <div class="text-slate-400 text-[11px]">3. Evaluasi Lendutan Layan (SNI 1725:2016):</div>
          <div class="text-white text-xs">&delta;max = &delta;q (${delta_q.toFixed(2)} mm) + &delta;P (${delta_P.toFixed(2)} mm) = <strong class="text-purple-400">${delta_max.toFixed(2)} mm</strong></div>
          <div class="text-slate-300 text-xs mt-0.5">&delta;ijin = L / 800 = <strong class="text-emerald-400">${delta_ijin.toFixed(2)} mm</strong> &rarr; Rasio: <strong>${(deflRatio*100).toFixed(1)}%</strong></div>
        </div>
      `;
    }

    drawBridgeDiagrams();
  }

  function evaluateAtX(x) {
    if (!currentBridgeData) return { V: 0, M: 0, defl: 0 };
    const { L, q_ult, P_ult, q_srv, P_srv, delta_max } = currentBridgeData;
    const clampedX = Math.max(0, Math.min(L, x));
    const Ra_u = (q_ult * L / 2) + (P_ult / 2);

    let V = Ra_u - (q_ult * clampedX);
    if (clampedX > L / 2) V -= P_ult;

    let M = (Ra_u * clampedX) - (q_ult * Math.pow(clampedX, 2) / 2);
    if (clampedX > L / 2) M -= P_ult * (clampedX - L / 2);

    // Profil lendutan parabolik pendekatan
    const defl = (4 * delta_max / Math.pow(L, 2)) * clampedX * (L - clampedX);

    return { x: clampedX, V, M: Math.max(0, M), defl };
  }

  function drawBridgeDiagrams() {
    if (!ctx || !canvas || !currentBridgeData) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cw = rect.width || 720;
    const ch = rect.height || 420;

    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    ctx.resetTransform ? ctx.resetTransform() : ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, cw, ch);

    const padLeft = 70;
    const padRight = 50;
    const plotW = cw - padLeft - padRight;
    const { L, Vu, Mu, q_ult, P_ult, delta_max } = currentBridgeData;

    const sfdBaselineY = 110;
    const sfdH = 55;
    const bmdBaselineY = 245;
    const bmdH = 75;
    const deflBaselineY = 360;

    const xToPx = (xm) => padLeft + (xm / L) * plotW;
    const pxToX = (px) => ((px - padLeft) / plotW) * L;

    // 1. DIAGRAM SFD (Gaya Geser)
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText('DIAGRAM GAYA GESER TERFAKTOR (SFD) [kN]', padLeft, 30);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft - 10, sfdBaselineY);
    ctx.lineTo(padLeft + plotW + 10, sfdBaselineY);
    ctx.stroke();

    const vScale = sfdH / (Vu > 0 ? Vu : 1);
    const px0 = xToPx(0);
    const pxMid = xToPx(L / 2);
    const pxL = xToPx(L);

    const yV0 = sfdBaselineY - (Vu * vScale);
    const yVmidL = sfdBaselineY - ((Vu - q_ult * (L / 2)) * vScale);
    const yVmidR = sfdBaselineY - ((Vu - q_ult * (L / 2) - P_ult) * vScale);
    const yVL = sfdBaselineY - ((-Vu) * vScale);

    // Fill SFD Positif & Negatif
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.beginPath();
    ctx.moveTo(px0, sfdBaselineY);
    ctx.lineTo(px0, yV0);
    ctx.lineTo(pxMid, yVmidL);
    ctx.lineTo(pxMid, sfdBaselineY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
    ctx.beginPath();
    ctx.moveTo(pxMid, sfdBaselineY);
    ctx.lineTo(pxMid, yVmidR);
    ctx.lineTo(pxL, yVL);
    ctx.lineTo(pxL, sfdBaselineY);
    ctx.closePath();
    ctx.fill();

    // Garis Kontur SFD
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px0, sfdBaselineY);
    ctx.lineTo(px0, yV0);
    ctx.lineTo(pxMid, yVmidL);
    ctx.lineTo(pxMid, yVmidR);
    ctx.lineTo(pxL, yVL);
    ctx.lineTo(pxL, sfdBaselineY);
    ctx.stroke();

    ctx.fillStyle = '#bae6fd';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`+${Vu.toFixed(0)} kN`, px0 - 6, yV0 + 4);
    ctx.textAlign = 'left';
    ctx.fillText(`-${Vu.toFixed(0)} kN`, pxL + 6, yVL + 4);

    // 2. DIAGRAM BMD (Momen Lentur)
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText('DIAGRAM MOMEN LENTUR TERFAKTOR (BMD) [kNm]', padLeft, bmdBaselineY - 45);

    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(padLeft - 10, bmdBaselineY);
    ctx.lineTo(padLeft + plotW + 10, bmdBaselineY);
    ctx.stroke();

    const mScale = bmdH / (Mu > 0 ? Mu : 1);
    const steps = 60;
    const bmdPoints = [];

    for (let i = 0; i <= steps; i++) {
      const xm = (i / steps) * L;
      const res = evaluateAtX(xm);
      const px = xToPx(xm);
      const py = bmdBaselineY + (res.M * mScale);
      bmdPoints.push({ x: px, y: py, M: res.M });
    }

    ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
    ctx.beginPath();
    ctx.moveTo(px0, bmdBaselineY);
    bmdPoints.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pxL, bmdBaselineY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(px0, bmdBaselineY);
    bmdPoints.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();

    // Titik Puncak Mmax
    const peakPt = bmdPoints[Math.floor(steps / 2)];
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Mmax = +${Mu.toFixed(1)} kNm`, peakPt.x, peakPt.y + 16);

    // 3. KURVA LENDUTAN GELAGAR (DEFLECTION PROFILE)
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`PROFIL LENDUTAN LAYAN (MAX = ${delta_max.toFixed(2)} mm)`, padLeft, deflBaselineY - 20);

    ctx.strokeStyle = '#334155';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(px0, deflBaselineY);
    ctx.lineTo(pxL, deflBaselineY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px0, deflBaselineY);
    for (let i = 0; i <= steps; i++) {
      const xm = (i / steps) * L;
      const res = evaluateAtX(xm);
      const py = deflBaselineY + (res.defl * 1.5);
      ctx.lineTo(xToPx(xm), py);
    }
    ctx.stroke();

    // 4. INTERACTIVE HOVER TOOLTIP
    if (mouseHoverX !== null && mouseHoverX >= px0 && mouseHoverX <= pxL) {
      const xm = pxToX(mouseHoverX);
      const res = evaluateAtX(xm);

      ctx.save();
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(mouseHoverX, 40);
      ctx.lineTo(mouseHoverX, ch - 20);
      ctx.stroke();
      ctx.restore();

      if (tooltip) {
        tooltip.style.display = 'block';
        tooltip.innerHTML = `
          <div class="font-bold text-white border-b border-slate-700 pb-1 mb-1">Posisi x = ${res.x.toFixed(2)} m</div>
          <div class="text-sky-400">Gaya Geser Vu(x) = ${res.V.toFixed(1)} kN</div>
          <div class="text-amber-400">Momen Mu(x) = ${res.M.toFixed(1)} kNm</div>
          <div class="text-purple-400">Lendutan &delta;(x) = ${res.defl.toFixed(2)} mm</div>
        `;
        const toolX = Math.min(cw - 180, Math.max(10, mouseHoverX + 15));
        tooltip.style.left = `${toolX}px`;
        tooltip.style.top = `75px`;
      }
    } else {
      if (tooltip) tooltip.style.display = 'none';
    }
  }

  function init() {
    const inputs = [elL, elMS, elMA, elQ, elPBGT, elPTruck, elE, elI];
    inputs.forEach(inp => {
      if (inp) {
        inp.addEventListener('input', calculate);
        inp.addEventListener('change', calculate);
      }
    });

    const presetSelect = document.getElementById('bridgePresetSelect');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (presets[val]) {
          const p = presets[val];
          if (elL) elL.value = p.L;
          if (elMS) elMS.value = p.MS;
          if (elMA) elMA.value = p.MA;
          if (elQ) elQ.value = p.q;
          if (elPBGT) elPBGT.value = p.PBGT;
          if (elPTruck) elPTruck.value = p.PTruck;
          if (elE) elE.value = p.E;
          if (elI) elI.value = p.I;
          calculate();
        }
      });
    }

    if (canvas) {
      canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseHoverX = e.clientX - rect.left;
        drawBridgeDiagrams();
      });

      canvas.addEventListener('mouseleave', () => {
        mouseHoverX = null;
        if (tooltip) tooltip.style.display = 'none';
        drawBridgeDiagrams();
      });
    }

    calculate();
    window.addEventListener('resize', calculate);
  }

  return { init, calculate };
})();

