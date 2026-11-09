/**
 * CivilStruct Pro Enterprise - Modul Analisis Jembatan Gantung (Suspension Bridge)
 * Sesuai Metode Praktikum Analisis Struktur Jembatan (Universitas Tidar)
 * Formulasi: Gaya Horisontal H, Tarik Maksimum Kabel Tengah T & Kabel Tepi T*,
 * Diameter Kabel (d_tengah, d_tepi), Panjang Kabel Total, Sudut Kritis Keseimbangan (alpha_kritis),
 * Serta Visualisasi Parabola Kabel Utama, Hanger, Pylon, & Abutment pada HTML5 Canvas.
 */

const SuspensionBridgeModule = (() => {
  // DOM Inputs
  const elQ = document.getElementById('input_sb_q');
  const elL = document.getElementById('input_sb_L');
  const elF = document.getElementById('input_sb_f');
  const elSigmaS = document.getElementById('input_sb_sigmas');
  const elAlpha = document.getElementById('input_sb_alpha');
  const elXtepi = document.getElementById('input_sb_xtepi');
  const elHpilar = document.getElementById('input_sb_hpilar');

  // DOM Outputs
  const elH = document.getElementById('res_sb_H');
  const elT = document.getElementById('res_sb_T');
  const elTstar = document.getElementById('res_sb_Tstar');
  const elDtengah = document.getElementById('res_sb_dtengah');
  const elDtepi = document.getElementById('res_sb_dtepi');
  const elLtengah = document.getElementById('res_sb_ltengah');
  const elLtepi = document.getElementById('res_sb_ltepi');
  const elLtotal = document.getElementById('res_sb_ltotal');
  const elAlphaKritis = document.getElementById('res_sb_alphakritis');
  const elSagRatio = document.getElementById('res_sb_sagratio');

  // Status & Progress Cards
  const elStatusBadge = document.getElementById('sbStatusBadge');
  const elStatusDetail = document.getElementById('sbStatusDetail');
  const elStepCalc = document.getElementById('sbStepCalc');

  // Canvas & Tooltip
  const canvas = document.getElementById('suspensionBridgeCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const tooltip = document.getElementById('sbCanvasTooltip');

  let currentResults = null;
  let mouseHoverPos = null;

  // Presets
  const presets = {
    'untidar-standar': { q: 10, L: 45, f: 9, sigma_s: 160, alpha: 45, x_tepi: 10, h_pilar: 10 },
    'golden-gate-scale': { q: 25, L: 120, f: 15, sigma_s: 200, alpha: 38, x_tepi: 35, h_pilar: 22 },
    'akashi-scale': { q: 35, L: 180, f: 20, sigma_s: 240, alpha: 35, x_tepi: 45, h_pilar: 30 },
    'pedestrian-suspension': { q: 5, L: 30, f: 3.5, sigma_s: 150, alpha: 48, x_tepi: 8, h_pilar: 6 }
  };

  /**
   * Fungsi Kalkulasi Utama Jembatan Gantung (UNTIDAR Method)
   */
  function calculate() {
    const q = Math.max(0.1, parseFloat(elQ?.value) || 10); // kN/m'
    const L = Math.max(5, parseFloat(elL?.value) || 45); // m
    const f = Math.max(0.5, parseFloat(elF?.value) || 9); // m
    const sigma_s = Math.max(10, parseFloat(elSigmaS?.value) || 160); // MPa
    const alpha_deg = Math.max(10, Math.min(85, parseFloat(elAlpha?.value) || 45)); // derajat
    const x_tepi = Math.max(2, parseFloat(elXtepi?.value) || 10); // m
    const h_pilar = Math.max(2, parseFloat(elHpilar?.value) || 10); // m

    // a. Rasio Sag: n = f / L
    const n = f / L;

    // b. Gaya Horisontal Kabel: H = (q * L^2) / (8 * f) [kN]
    const H = (q * Math.pow(L, 2)) / (8 * f);

    // c. Gaya Tarik Maksimum Kabel Tengah (T):
    // T = H * sqrt(1 + 16 * n^2) [kN]
    const T = H * Math.sqrt(1 + 16 * Math.pow(n, 2));

    // d. Gaya Tarik Kabel Tepi (T_star):
    // T_star = H / cos(alpha * PI / 180) [kN]
    const alpha_rad = alpha_deg * (Math.PI / 180);
    const cos_alpha = Math.cos(alpha_rad);
    const T_star = cos_alpha > 0.001 ? (H / cos_alpha) : 99999;

    // e. Luas & Diameter Kabel (Pembulatan ke atas mm terdekat):
    // Luas Tengah: A_tengah = T / (sigma_s * 1000) [m²]
    // Diameter Tengah: d_tengah = sqrt(4 * A_tengah / PI) * 1000 [mm]
    const A_tengah_m2 = T / (sigma_s * 1000);
    const d_tengah_exact_mm = Math.sqrt((4 * A_tengah_m2) / Math.PI) * 1000;
    const d_tengah = Math.ceil(d_tengah_exact_mm);

    // Luas Tepi: A_tepi = T_star / (sigma_s * 1000) [m²]
    // Diameter Tepi: d_tepi = sqrt(4 * A_tepi / PI) * 1000 [mm]
    const A_tepi_m2 = T_star / (sigma_s * 1000);
    const d_tepi_exact_mm = Math.sqrt((4 * A_tepi_m2) / Math.PI) * 1000;
    const d_tepi = Math.ceil(d_tepi_exact_mm);

    // f. Panjang Kabel Total:
    // L_tengah = L * (1 + (8/3) * n^2) [m]
    const L_tengah = L * (1 + (8 / 3) * Math.pow(n, 2));

    // L_tepi = sqrt(x_tepi^2 + h_pilar^2) [m]
    const L_tepi = Math.sqrt(Math.pow(x_tepi, 2) + Math.pow(h_pilar, 2));

    // L_total = 2 * L_tepi + L_tengah [m]
    const L_total = (2 * L_tepi) + L_tengah;

    // g. Sudut Keseimbangan Kritis (alpha_kritis agar T = T_star):
    // alpha_kritis = acos(H / T) * (180 / PI) [derajat]
    const ratio_H_T = Math.min(1.0, Math.max(0.0, H / T));
    const alpha_kritis = Math.acos(ratio_H_T) * (180 / Math.PI);

    // Evaluasi Kesetimbangan & Keamanan Kabel
    // Jika T_star <= T (atau alpha <= alpha_kritis), kabel tepi stabil dan efisien
    const isEquilibriumSafe = Math.abs(alpha_deg - alpha_kritis) <= 5.0 || (T_star <= T * 1.05);

    currentResults = {
      q, L, f, sigma_s, alpha_deg, x_tepi, h_pilar,
      n, H, T, T_star,
      A_tengah_m2, d_tengah, d_tengah_exact_mm,
      A_tepi_m2, d_tepi, d_tepi_exact_mm,
      L_tengah, L_tepi, L_total,
      alpha_kritis, isEquilibriumSafe
    };

    // Update Output DOM
    if (elH) elH.innerText = H.toFixed(2);
    if (elT) elT.innerText = T.toFixed(2);
    if (elTstar) elTstar.innerText = T_star.toFixed(2);
    if (elDtengah) elDtengah.innerText = `${d_tengah} mm (dia. ${d_tengah_exact_mm.toFixed(1)})`;
    if (elDtepi) elDtepi.innerText = `${d_tepi} mm (dia. ${d_tepi_exact_mm.toFixed(1)})`;
    if (elLtengah) elLtengah.innerText = L_tengah.toFixed(2);
    if (elLtepi) elLtepi.innerText = L_tepi.toFixed(2);
    if (elLtotal) elLtotal.innerText = L_total.toFixed(2);
    if (elAlphaKritis) elAlphaKritis.innerText = `${alpha_kritis.toFixed(2)}°`;
    if (elSagRatio) elSagRatio.innerText = `n = 1 / ${(1/n).toFixed(1)} (${n.toFixed(3)})`;

    // Status Badge & Detail
    if (elStatusBadge) {
      if (isEquilibriumSafe) {
        elStatusBadge.className = 'text-base sm:text-xl font-black px-3.5 py-1.5 rounded-xl tracking-wide flex items-center space-x-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 glow-emerald';
        elStatusBadge.innerHTML = `
          <i class="fa-solid fa-circle-check text-emerald-400"></i>
          <span>KESEIMBANGAN KABEL STABIL (T* &asymp; T)</span>
        `;
      } else {
        elStatusBadge.className = 'text-base sm:text-xl font-black px-3.5 py-1.5 rounded-xl tracking-wide flex items-center space-x-2 bg-amber-500/20 text-amber-400 border border-amber-500/40 glow-amber';
        elStatusBadge.innerHTML = `
          <i class="fa-solid fa-triangle-exclamation text-amber-400"></i>
          <span>PERBEDAAN TARIK KABEL (&alpha; &ne; &alpha;_kritis)</span>
        `;
      }
    }

    if (elStatusDetail) {
      elStatusDetail.innerHTML = `Gaya tarik utama T = <strong class="text-white">${T.toFixed(2)} kN</strong> (&empty; <strong class="text-emerald-400">${d_tengah} mm</strong>) &bull; Gaya tarik tepi T* = <strong class="text-white">${T_star.toFixed(2)} kN</strong> (&empty; <strong class="text-amber-400">${d_tepi} mm</strong>). Sudut kritis ideal &alpha; = <strong class="text-cyan-400">${alpha_kritis.toFixed(2)}&deg;</strong>.`;
    }

    // Step-by-Step Breakdown Calculation
    if (elStepCalc) {
      elStepCalc.innerHTML = `
        <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
          <div class="text-slate-400 text-[11px]">1. Rasio Sag & Gaya Horizontal Kabel Utama:</div>
          <div class="text-white text-xs">n = f / L = ${f} / ${L} = <strong class="text-cyan-400">${n.toFixed(4)}</strong></div>
          <div class="text-white text-xs mt-0.5">H = (q &times; L&sup2;) / (8 &times; f) = (${q} &times; ${L}&sup2;) / (8 &times; ${f}) = <strong class="text-blue-400">${H.toFixed(2)} kN</strong></div>
        </div>
        <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
          <div class="text-slate-400 text-[11px]">2. Gaya Tarik Maksimum Kabel Tengah & Kabel Tepi:</div>
          <div class="text-white text-xs">T = H &times; &radic;(1 + 16 &times; n&sup2;) = ${H.toFixed(2)} &times; &radic;(1 + 16 &times; ${n.toFixed(4)}&sup2;) = <strong class="text-emerald-400">${T.toFixed(2)} kN</strong></div>
          <div class="text-white text-xs mt-0.5">T* = H / cos(&alpha;) = ${H.toFixed(2)} / cos(${alpha_deg}&deg;) = <strong class="text-amber-400">${T_star.toFixed(2)} kN</strong></div>
        </div>
        <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
          <div class="text-slate-400 text-[11px]">3. Dimensi Kabel Baja (Tegangan Ijin &sigma;s = ${sigma_s} MPa):</div>
          <div class="text-slate-300 text-xs">&bull; Kabel Utama: Atengah = ${T.toFixed(1)} / (${sigma_s} &times; 1000) = ${(A_tengah_m2 * 1e6).toFixed(1)} mm&sup2; &rarr; <strong>d_tengah = ${d_tengah} mm</strong></div>
          <div class="text-slate-300 text-xs">&bull; Kabel Tepi: Atepi = ${T_star.toFixed(1)} / (${sigma_s} &times; 1000) = ${(A_tepi_m2 * 1e6).toFixed(1)} mm&sup2; &rarr; <strong>d_tepi = ${d_tepi} mm</strong></div>
        </div>
        <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
          <div class="text-slate-400 text-[11px]">4. Panjang Kabel & Sudut Kritis Keseimbangan:</div>
          <div class="text-white text-xs">&bull; Ltengah = L &times; (1 + 8/3 &times; n&sup2;) = ${L} &times; (1 + 8/3 &times; ${n.toFixed(4)}&sup2;) = <strong class="text-purple-300">${L_tengah.toFixed(2)} m</strong></div>
          <div class="text-white text-xs">&bull; Ltepi = &radic;(${x_tepi}&sup2; + ${h_pilar}&sup2;) = <strong class="text-purple-300">${L_tepi.toFixed(2)} m</strong> &rarr; Total L = <strong class="text-emerald-400">${L_total.toFixed(2)} m</strong></div>
          <div class="text-cyan-300 text-xs pt-1">&bull; &alpha;_kritis = arccos(H / T) = arccos(${H.toFixed(2)} / ${T.toFixed(2)}) = <strong class="text-cyan-400 font-bold">${alpha_kritis.toFixed(2)}&deg;</strong></div>
        </div>
      `;
    }

    drawBridgeCanvas();
  }

  /**
   * VISUALISASI CANVAS: Jembatan Gantung (Suspension Bridge)
   * Menggambar pylon merah, kabel utama parabola, kabel tepi / backstay,
   * penggantung vertikal (hangers), abutment kuning, gelagar lantai hijau, dan dasar sungai teal.
   */
  function drawBridgeCanvas() {
    if (!ctx || !canvas || !currentResults) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cw = rect.width || 800;
    const ch = rect.height || 420;

    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    ctx.resetTransform ? ctx.resetTransform() : ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // 1. Background Langit Gradien Malam/Modern
    const skyGrad = ctx.createLinearGradient(0, 0, 0, ch);
    skyGrad.addColorStop(0, '#020617');
    skyGrad.addColorStop(0.55, '#0f172a');
    skyGrad.addColorStop(0.8, '#1e293b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, cw, ch);

    const { L, f, x_tepi, h_pilar, alpha_deg, H, T, T_star, d_tengah, d_tepi } = currentResults;
    const totalBridgeSpan = x_tepi + L + x_tepi;

    // Geometri & Margin Canvas
    const padX = 70;
    const drawW = cw - padX * 2;
    const deckY = ch * 0.65; // Posisi vertikal gelagar lantai
    const waterY = deckY + 36; // Muka air sungai

    // Konversi koordinat x fisik (m) ke pixel canvas
    const meterToPx = (m) => padX + (m / totalBridgeSpan) * drawW;

    // Posisi Pylon 1 dan Pylon 2
    const pylon1_m = x_tepi;
    const pylon2_m = x_tepi + L;
    const pylon1_px = meterToPx(pylon1_m);
    const pylon2_px = meterToPx(pylon2_m);

    // Posisi Abutment Kiri & Kanan
    const abutment1_px = meterToPx(0);
    const abutment2_px = meterToPx(totalBridgeSpan);

    // Skala vertikal pylon & sag
    const maxPylonDrawH = deckY - 45;
    // Skala berdasarkan proporsi h_pilar
    const pylonScale = maxPylonDrawH / Math.max(h_pilar, f * 1.15, 10);
    const pylonTopY = deckY - (h_pilar * pylonScale);
    const sagPixels = f * pylonScale;
    const lowestCableY = pylonTopY + sagPixels; // Titik sag terbawah kabel
    const pylonFoundationY = ch - 22; // Pondasi pilar di dasar air

    // ==========================================
    // 2. DASAR / AIR SUNGAI TEAL
    // ==========================================
    ctx.save();
    const waterGrad = ctx.createLinearGradient(0, waterY, 0, ch);
    waterGrad.addColorStop(0, 'rgba(13, 148, 136, 0.45)');
    waterGrad.addColorStop(0.5, 'rgba(15, 118, 110, 0.65)');
    waterGrad.addColorStop(1, 'rgba(19, 78, 74, 0.9)');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, waterY, cw, ch - waterY);

    // Gelombang air
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.35)';
    ctx.lineWidth = 1.2;
    for (let wy = waterY + 8; wy < ch - 10; wy += 14) {
      ctx.beginPath();
      for (let wx = 0; wx <= cw; wx += 25) {
        const yOffset = Math.sin((wx + wy * 3) * 0.04) * 2.2;
        if (wx === 0) ctx.moveTo(wx, wy + yOffset);
        else ctx.lineTo(wx, wy + yOffset);
      }
      ctx.stroke();
    }
    ctx.restore();

    // ==========================================
    // 3. PIER PONDASI PYLON DI BAWAH AIR
    // ==========================================
    ctx.save();
    [pylon1_px, pylon2_px].forEach(px => {
      ctx.fillStyle = '#dc2626'; // red-600
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 2;
      ctx.fillRect(px - 15, deckY + 5, 30, pylonFoundationY - deckY - 5);
      ctx.strokeRect(px - 15, deckY + 5, 30, pylonFoundationY - deckY - 5);

      // Pile cap beton dasar
      ctx.fillStyle = '#475569';
      ctx.fillRect(px - 22, pylonFoundationY - 12, 44, 18);
      ctx.strokeStyle = '#64748b';
      ctx.strokeRect(px - 22, pylonFoundationY - 12, 44, 18);
    });
    ctx.restore();

    // ==========================================
    // 4. KABEL TEPI / BACKSTAY (LURUS KE ABUTMENT)
    // Sesuai sudut alpha dari puncak pylon ke angkur
    // ==========================================
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#cbd5e1'; // kabel baja terang / kontras
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowBlur = 6;

    // Backstay Kiri: Puncak P1 -> Abutment 1
    ctx.beginPath();
    ctx.moveTo(pylon1_px, pylonTopY);
    ctx.lineTo(abutment1_px, deckY);
    ctx.stroke();

    // Backstay Kanan: Puncak P2 -> Abutment 2
    ctx.beginPath();
    ctx.moveTo(pylon2_px, pylonTopY);
    ctx.lineTo(abutment2_px, deckY);
    ctx.stroke();
    ctx.restore();

    // ==========================================
    // 5. PENGGANTUNG VERTIKAL (HANGERS)
    // Ditarik dari kurva kabel utama ke gelagar lantai
    // ==========================================
    ctx.save();
    const numHangers = Math.max(8, Math.min(30, Math.round(L / 2)));
    const hangerStep_m = L / (numHangers + 1);

    ctx.strokeStyle = 'rgba(203, 213, 225, 0.75)'; // kabel penggantung
    ctx.lineWidth = 1.4;

    for (let i = 1; i <= numHangers; i++) {
      const xm = pylon1_m + i * hangerStep_m;
      const xRatio = (i * hangerStep_m) / L; // rasio 0 s/d 1
      // Persamaan parabola sag: y = y_top + 4 * f * (x/L) * (1 - x/L) * scale
      const cableY = pylonTopY + 4 * sagPixels * xRatio * (1 - xRatio);
      const px = meterToPx(xm);

      ctx.beginPath();
      ctx.moveTo(px, cableY);
      ctx.lineTo(px, deckY);
      ctx.stroke();

      // Titik klem penjepit atas & bawah
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(px, cableY, 2, 0, Math.PI * 2);
      ctx.arc(px, deckY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ==========================================
    // 6. KABEL UTAMA TENGAH MELENGKUNG PARABOLA
    // Persamaan: y = 4*f*(x/L)*(1 - x/L)
    // ==========================================
    ctx.save();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#f8fafc'; // kabel utama putih terang
    ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.moveTo(pylon1_px, pylonTopY);
    const curveSteps = 100;
    for (let s = 1; s <= curveSteps; s++) {
      const xRatio = s / curveSteps;
      const xm = pylon1_m + xRatio * L;
      const cableY = pylonTopY + 4 * sagPixels * xRatio * (1 - xRatio);
      ctx.lineTo(meterToPx(xm), cableY);
    }
    ctx.stroke();
    ctx.restore();

    // ==========================================
    // 7. GELAGAR LANTAI HIJAU (GIRDER DECK)
    // ==========================================
    ctx.save();
    const deckLengthPx = abutment2_px - abutment1_px;
    const deckThickness = 10;

    ctx.fillStyle = '#10b981'; // emerald-500
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 2;
    ctx.fillRect(abutment1_px, deckY - deckThickness / 2, deckLengthPx, deckThickness);
    ctx.strokeRect(abutment1_px, deckY - deckThickness / 2, deckLengthPx, deckThickness);

    // Aspal jalan di atas gelagar
    ctx.fillStyle = '#334155';
    ctx.fillRect(abutment1_px, deckY - deckThickness / 2 - 3, deckLengthPx, 3);
    ctx.restore();

    // ==========================================
    // 8. 2 PILAR PYLON MERAH
    // ==========================================
    ctx.save();
    [
      { px: pylon1_px, label: 'PYLON 1' },
      { px: pylon2_px, label: 'PYLON 2' }
    ].forEach(pylon => {
      const px = pylon.px;
      const towerW = 16;

      ctx.fillStyle = '#ef4444'; // red-500
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(px - towerW / 2 + 2, pylonTopY);
      ctx.lineTo(px + towerW / 2 - 2, pylonTopY);
      ctx.lineTo(px + towerW / 2 + 4, deckY);
      ctx.lineTo(px - towerW / 2 - 4, deckY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Portal balok pengikat menara
      const crossBeamY = pylonTopY + (deckY - pylonTopY) * 0.45;
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(px - towerW / 2 - 4, crossBeamY, towerW + 8, 6);

      // Sadel Kabel Puncak (Saddle)
      ctx.beginPath();
      ctx.arc(px, pylonTopY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label Pylon
      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(pylon.label, px, pylonTopY - 14);
    });
    ctx.restore();

    // ==========================================
    // 9. DUA ABUTMENT KUNING
    // ==========================================
    ctx.save();
    const abutW = 24;
    const abutH = 38;

    ctx.fillStyle = '#eab308'; // yellow-500
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;

    // Abutment Kiri
    ctx.fillRect(abutment1_px - abutW + 4, deckY - deckThickness / 2, abutW, abutH);
    ctx.strokeRect(abutment1_px - abutW + 4, deckY - deckThickness / 2, abutW, abutH);

    // Abutment Kanan
    ctx.fillRect(abutment2_px - 4, deckY - deckThickness / 2, abutW, abutH);
    ctx.strokeRect(abutment2_px - 4, deckY - deckThickness / 2, abutW, abutH);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ABUTMENT 1', abutment1_px - abutW / 2, deckY + abutH + 12);
    ctx.fillText('ABUTMENT 2', abutment2_px + abutW / 2, deckY + abutH + 12);
    ctx.restore();

    // ==========================================
    // 10. ANOTASI DIMENSI & KOTAK INFO
    // ==========================================
    ctx.save();
    const dimY = deckY + 68;
    ctx.strokeStyle = '#64748b';
    ctx.fillStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';

    // Dimensi Bentang Tepi Kiri x_tepi
    drawDimLine(ctx, abutment1_px, dimY, pylon1_px, dimY, `x_tepi = ${x_tepi} m`);

    // Dimensi Bentang Tengah L
    drawDimLine(ctx, pylon1_px, dimY, pylon2_px, dimY, `L_utama = ${L} m`);

    // Dimensi Bentang Tepi Kanan x_tepi
    drawDimLine(ctx, pylon2_px, dimY, abutment2_px, dimY, `x_tepi = ${x_tepi} m`);

    // Dimensi Sag Kabel f di tengah bentang
    const midX_px = (pylon1_px + pylon2_px) / 2;
    ctx.strokeStyle = '#38bdf8';
    ctx.fillStyle = '#38bdf8';
    drawVertDimLine(ctx, midX_px + 28, pylonTopY, midX_px + 28, lowestCableY, `f = ${f} m`);

    // Dimensi Tinggi Pilar h_pilar di pylon 1
    const hpDimX = pylon1_px - 32;
    ctx.strokeStyle = '#ec4899';
    ctx.fillStyle = '#ec4899';
    drawVertDimLine(ctx, hpDimX, deckY, hpDimX, pylonTopY, `h = ${h_pilar} m`);

    // Judul Visualisasi
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('VISUALISASI JEMBATAN GANTUNG (SUSPENSION BRIDGE)', padX, 25);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(`Metode Analisis Praktikum UNTIDAR \u2022 Sag f = ${f} m (n = ${(f/L).toFixed(3)}) \u2022 Sudut Backstay \u03B1 = ${alpha_deg}\u00B0`, padX, 40);

    ctx.restore();
  }

  function drawDimLine(ctx, x1, y1, x2, y2, label) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y1);
    ctx.moveTo(x1, y1 - 4); ctx.lineTo(x1, y1 + 4);
    ctx.moveTo(x2, y1 - 4); ctx.lineTo(x2, y1 + 4);
    ctx.stroke();
    ctx.fillText(label, (x1 + x2) / 2, y1 - 6);
  }

  function drawVertDimLine(ctx, x1, y1, x2, y2, label) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1, y2);
    ctx.moveTo(x1 - 4, y1); ctx.lineTo(x1 + 4, y1);
    ctx.moveTo(x1 - 4, y2); ctx.lineTo(x1 + 4, y2);
    ctx.stroke();

    ctx.save();
    ctx.translate(x1 + 10, (y1 + y2) / 2);
    ctx.rotate(Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }

  /**
   * Setup Event Listeners & Inisialisasi
   */
  function init() {
    const inputs = [elQ, elL, elF, elSigmaS, elAlpha, elXtepi, elHpilar];
    inputs.forEach(inp => {
      if (inp) {
        inp.addEventListener('input', calculate);
        inp.addEventListener('change', calculate);
      }
    });

    const presetSelect = document.getElementById('sbPresetSelect');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (presets[val]) {
          const p = presets[val];
          if (elQ) elQ.value = p.q;
          if (elL) elL.value = p.L;
          if (elF) elF.value = p.f;
          if (elSigmaS) elSigmaS.value = p.sigma_s;
          if (elAlpha) elAlpha.value = p.alpha;
          if (elXtepi) elXtepi.value = p.x_tepi;
          if (elHpilar) elHpilar.value = p.h_pilar;
          calculate();
        }
      });
    }

    const btnReset = document.getElementById('btnResetSB');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        const p = presets['untidar-standar'];
        if (elQ) elQ.value = p.q;
        if (elL) elL.value = p.L;
        if (elF) elF.value = p.f;
        if (elSigmaS) elSigmaS.value = p.sigma_s;
        if (elAlpha) elAlpha.value = p.alpha;
        if (elXtepi) elXtepi.value = p.x_tepi;
        if (elHpilar) elHpilar.value = p.h_pilar;
        calculate();
      });
    }

    const btnDownload = document.getElementById('btnDownloadSBCanvas');
    if (btnDownload && canvas) {
      btnDownload.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `CivilStruct-SuspensionBridge-L${elL?.value || 45}m.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }

    calculate();
    window.addEventListener('resize', calculate);
  }

  return { init, calculate, getResults: () => currentResults };
})();

