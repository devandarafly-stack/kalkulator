/**
 * CivilStruct Pro Enterprise - Modul Analisis Jembatan Kabel Pancang (Cable-Stayed Bridge)
 * Sesuai Kurikulum Praktikum Analisis Struktur Jembatan Universitas Tidar (UNTIDAR):
 * 1. Metode 1: Sudut Memusat / Berbeda Per Segmen (Pertemuan IIIb) - 6 Kabel Valid
 * 2. Metode 2: Sudut Seragam / Konstan 45° Harp System (Pertemuan IIIa) - 8 Kabel Valid
 */

const CableStayedModule = (() => {
  // DOM Inputs
  const elMethod = document.getElementById('input_cs_method');
  const elDiameter = document.getElementById('input_cs_diameter');
  const elSigmaS = document.getElementById('input_cs_sigmas');
  const elQ = document.getElementById('input_cs_q');
  const elAlpha1 = document.getElementById('input_cs_alpha1');
  const elLmain = document.getElementById('input_cs_lmain');
  const elLside = document.getElementById('input_cs_lside');
  const elMethodDesc = document.getElementById('csMethodDescription');

  // DOM Outputs
  const elHpilar = document.getElementById('res_cs_hpilar');
  const elPkabel = document.getElementById('res_cs_pkabel');
  const elNumCables = document.getElementById('res_cs_numcables');
  const elTotalLen1Side = document.getElementById('res_cs_len1side');
  const elTotalLen4Sides = document.getElementById('res_cs_len4sides');
  const elEstSteelWeight = document.getElementById('res_cs_weight');

  // Status, Table & Step Calc
  const elStatusBadge = document.getElementById('csStatusBadge');
  const elStatusDetail = document.getElementById('csStatusDetail');
  const elTableHeader = document.getElementById('csTableHeader');
  const elTableBody = document.getElementById('csTableBody');
  const elTableTitle = document.getElementById('csTableTitle');
  const elStepCalc = document.getElementById('csStepCalc');

  // Canvas
  const canvas = document.getElementById('cableStayedCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;

  let currentResults = null;

  // Presets
  const presets = {
    'untidar-standar': { method: 'metode-berbeda', d: 60, sigma_s: 160, q: 10, alpha_1: 45, l_main: 450, l_side: 225 },
    'untidar-seragam': { method: 'metode-seragam', d: 60, sigma_s: 160, q: 10, alpha_1: 45, l_main: 450, l_side: 225 },
    'suramadu-scale': { method: 'metode-berbeda', d: 75, sigma_s: 180, q: 14, alpha_1: 42, l_main: 434, l_side: 192 },
    'pedestrian-cable': { method: 'metode-seragam', d: 35, sigma_s: 150, q: 4.5, alpha_1: 45, l_main: 150, l_side: 75 }
  };

  /**
   * Fungsi Utama Kalkulasi Jembatan Kabel Pancang
   */
  function calculate() {
    const method = elMethod?.value || 'metode-berbeda';
    const Diameter_kabel = Math.max(10, parseFloat(elDiameter?.value) || 60); // mm
    const sigma_s = Math.max(10, parseFloat(elSigmaS?.value) || 160); // MPa
    const q = Math.max(0.1, parseFloat(elQ?.value) || 10); // kN/m'
    const alpha_1_deg = Math.max(15, Math.min(85, parseFloat(elAlpha1?.value) || 45)); // derajat
    const L_main = Math.max(20, parseFloat(elLmain?.value) || 450); // m
    const L_side = Math.max(10, parseFloat(elLside?.value) || 225); // m

    // Kapasitas Gaya Tarik 1 Kabel (Berlaku Semua Metode):
    // P_kabel = sigma_s * (0.25 * Math.PI * Math.pow(Diameter_kabel / 1000, 2)) * 1000  [kN]
    const d_meter = Diameter_kabel / 1000;
    const area_m2 = 0.25 * Math.PI * Math.pow(d_meter, 2);
    const P_kabel = sigma_s * area_m2 * 1000; // kN

    let cables = [];
    let H_pilar = 0;
    let totalLen1Side = 0;
    let totalLen4Sides = 0;
    let delta_L_standard = 0;
    let segmen_rata = 0;
    let N_kabel = 0;

    if (method === 'metode-berbeda') {
      // ==========================================================
      // METODE 1: SUDUT MEMUSAT / BERBEDA PER SEGMEN (PERTEMUAN IIIb)
      // ==========================================================
      if (elMethodDesc) {
        elMethodDesc.innerText = 'Metode IIIb: Kabel memusat di puncak pylon dengan sudut bervariasi (αi) dari kabel terluar ke pilar. Stop sebelum jarak negatif.';
      }

      // a. Tinggi Pilar di atas Gelagar:
      // H_pilar = tan(alpha_1) * (L_main / 2) [m]
      const alpha_1_rad = alpha_1_deg * (Math.PI / 180);
      H_pilar = Math.tan(alpha_1_rad) * (L_main / 2);

      // b. Loop Iterasi Kabel dari Luar ke Pilar:
      let current_x = L_main / 2;
      let i = 1;
      const maxIter = 50;

      while (i <= maxIter && current_x > 0) {
        let alpha_deg, alpha_rad;
        if (i === 1) {
          alpha_deg = alpha_1_deg;
          alpha_rad = alpha_1_rad;
        } else {
          alpha_rad = Math.atan(H_pilar / current_x);
          alpha_deg = alpha_rad * (180 / Math.PI);
        }

        // Hitung segmen pikul delta_L_i
        const delta_L_i = (P_kabel * Math.sin(alpha_rad)) / q;

        // Hitung panjang fisik kabel i
        const L_kabel_i = Math.sqrt(Math.pow(H_pilar, 2) + Math.pow(current_x, 2));

        // Tambahkan kabel i yang valid
        cables.push({
          no: i,
          alpha_deg: alpha_deg,
          delta_L: delta_L_i,
          x_i: current_x,
          y_i: H_pilar, // semua kabel berakar di puncak pylon
          L_kabel: L_kabel_i
        });

        // c. SYARAT PENGHENTIAN CRITICAL (Mencegah Bug Jarak Negatif):
        // Jika sisa jarak current_x kurang dari delta_L_i, maka kabel berikutnya akan bernilai negatif!
        // Oleh karena itu, hentikan iterasi di sini agar kabel ke-7 yang negatif tidak ditambahkan!
        if (current_x < delta_L_i) {
          break;
        }

        // Hitung koordinat kabel berikutnya
        current_x = current_x - delta_L_i;
        if (current_x <= 0) {
          break;
        }

        i++;
      }

      totalLen1Side = cables.reduce((sum, c) => sum + c.L_kabel, 0);
      totalLen4Sides = 4 * totalLen1Side;

    } else {
      // ==========================================================
      // METODE 2: SUDUT SERAGAM / KONSTAN (PERTEMUAN IIIa)
      // ==========================================================
      if (elMethodDesc) {
        elMethodDesc.innerText = 'Metode IIIa: Kabel sejajar dengan sudut kemiringan seragam/konstan (Harp arrangement) dengan segmen gelagar terbagi rata.';
      }

      const alpha_rad = alpha_1_deg * (Math.PI / 180);

      // a. Hitung Panjang Segmen Pikul Standar (delta_L):
      // delta_L = (P_kabel * Math.sin(alpha_1)) / q  [m]
      delta_L_standard = (P_kabel * Math.sin(alpha_rad)) / q;

      // b. Hitung Jumlah Kabel per Sisi (Pembulatan ke Atas):
      // N_kabel = Math.ceil((L_main / 2) / delta_L)
      N_kabel = Math.ceil((L_main / 2) / delta_L_standard);

      // c. Hitung Panjang Segmen Gelagar Terbagi Rata:
      // segmen_rata = (L_main / 2) / N_kabel  [m]
      segmen_rata = (L_main / 2) / N_kabel;

      // d. Tabel Iterasi Koordinat Kabel (i = 1 s.d. N_kabel):
      for (let i = 1; i <= N_kabel; i++) {
        // x_i = segmen_rata * (i - 0.5) [m] (Titik tengah tiap segmen)
        const x_i = segmen_rata * (i - 0.5);
        // y_i = x_i * Math.tan(alpha_1) [m] (Tinggi titik jangkar di pylon)
        const y_i = x_i * Math.tan(alpha_rad);
        // L_kabel_i = Math.sqrt(x_i^2 + y_i^2) [m]
        const L_kabel_i = Math.sqrt(Math.pow(x_i, 2) + Math.pow(y_i, 2));

        cables.push({
          no: i,
          alpha_deg: alpha_1_deg,
          delta_L: segmen_rata,
          x_i: x_i,
          y_i: y_i,
          L_kabel: L_kabel_i
        });
      }

      // Tinggi pilar adalah ketinggian kabel teratas di pylon
      H_pilar = cables[cables.length - 1].y_i;

      // e. Total Panjang Kabel:
      totalLen1Side = cables.reduce((sum, c) => sum + c.L_kabel, 0);
      totalLen4Sides = 4 * totalLen1Side;
    }

    // Estimasi Tonase Baja Kabel (Kerapatan baja 7850 kg/m3)
    const steelVolumeM3 = area_m2 * totalLen4Sides;
    const steelWeightTon = (steelVolumeM3 * 7850) / 1000;

    currentResults = {
      method,
      Diameter_kabel,
      sigma_s,
      q,
      alpha_1_deg,
      L_main,
      L_side,
      P_kabel,
      H_pilar,
      cables,
      totalLen1Side,
      totalLen4Sides,
      steelWeightTon,
      delta_L_standard,
      segmen_rata,
      N_kabel
    };

    // Update Output DOM
    if (elHpilar) elHpilar.innerText = H_pilar.toFixed(2);
    if (elPkabel) elPkabel.innerText = P_kabel.toFixed(2);
    if (elNumCables) elNumCables.innerText = `${cables.length} kabel`;
    if (elTotalLen1Side) elTotalLen1Side.innerText = totalLen1Side.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (elTotalLen4Sides) elTotalLen4Sides.innerText = totalLen4Sides.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (elEstSteelWeight) elEstSteelWeight.innerText = `${steelWeightTon.toFixed(2)} Ton`;

    // Update Status Badge
    if (elStatusBadge) {
      if (method === 'metode-berbeda') {
        elStatusBadge.className = 'text-base sm:text-xl font-black px-3.5 py-1.5 rounded-xl tracking-wide flex items-center space-x-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 glow-cyan';
        elStatusBadge.innerHTML = `
          <i class="fa-solid fa-circle-check text-cyan-400"></i>
          <span>METODE IIIb: SUDUT MEMUSAT (${cables.length} KABEL VALID)</span>
        `;
      } else {
        elStatusBadge.className = 'text-base sm:text-xl font-black px-3.5 py-1.5 rounded-xl tracking-wide flex items-center space-x-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 glow-emerald';
        elStatusBadge.innerHTML = `
          <i class="fa-solid fa-circle-check text-emerald-400"></i>
          <span>METODE IIIa: SUDUT SERAGAM 45° (${cables.length} KABEL VALID)</span>
        `;
      }
    }

    if (elStatusDetail) {
      if (method === 'metode-berbeda') {
        elStatusDetail.innerHTML = `Analisis kabel memusat (Pertemuan IIIb) menghasilkan <strong class="text-white">${cables.length} kabel per sisi</strong> (total <strong class="text-cyan-400">${cables.length * 4} kabel</strong>). Total 1 sisi = <strong class="text-white">${totalLen1Side.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m</strong>. Tidak ada kabel dengan jarak negatif.`;
      } else {
        elStatusDetail.innerHTML = `Analisis sudut seragam 45° (Pertemuan IIIa) menghasilkan <strong class="text-white">${cables.length} kabel per sisi</strong> (total <strong class="text-emerald-400">${cables.length * 4} kabel</strong>) dengan segmen gelagar terbagi rata <strong class="text-white">${segmen_rata.toFixed(3)} m</strong>. Total 1 sisi = <strong class="text-white">${totalLen1Side.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m</strong>.`;
      }
    }

    // Update Judul & Header Tabel
    if (elTableTitle) {
      elTableTitle.innerText = method === 'metode-berbeda'
        ? 'Tabel Iterasi Kabel Sudut Memusat (Pertemuan IIIb)'
        : 'Tabel Koordinat Kabel Sudut Seragam (Pertemuan IIIa)';
    }

    if (elTableHeader) {
      if (method === 'metode-berbeda') {
        elTableHeader.innerHTML = `
          <th class="py-2.5 px-3 text-center">Kabel No</th>
          <th class="py-2.5 px-3">Sudut &alpha; (&deg;)</th>
          <th class="py-2.5 px-3 text-amber-400">&Delta;L Pikul (m)</th>
          <th class="py-2.5 px-3 text-emerald-400">Jarak Pilar x_i (m)</th>
          <th class="py-2.5 px-3 text-purple-300">Panjang Kabel (m)</th>
        `;
      } else {
        elTableHeader.innerHTML = `
          <th class="py-2.5 px-3 text-center">Kabel No</th>
          <th class="py-2.5 px-3">Sudut &alpha; (&deg;)</th>
          <th class="py-2.5 px-3 text-amber-400">Jarak Gelagar x_i (m)</th>
          <th class="py-2.5 px-3 text-cyan-400">Tinggi di Pylon y_i (m)</th>
          <th class="py-2.5 px-3 text-purple-300">Panjang Kabel (m)</th>
        `;
      }
    }

    // Render Body Tabel
    if (elTableBody) {
      let rowsHtml = '';
      cables.forEach(c => {
        if (method === 'metode-berbeda') {
          rowsHtml += `
            <tr class="hover:bg-slate-800/50 border-b border-slate-800 text-xs font-mono transition-colors">
              <td class="py-2.5 px-3 font-sans text-center font-bold text-cyan-400">K-${c.no}</td>
              <td class="py-2.5 px-3 text-slate-200">${c.alpha_deg.toFixed(2)}&deg;</td>
              <td class="py-2.5 px-3 text-amber-400 font-semibold">${c.delta_L.toFixed(2)} m</td>
              <td class="py-2.5 px-3 text-emerald-400 font-semibold">${c.x_i.toFixed(2)} m</td>
              <td class="py-2.5 px-3 text-purple-300 font-bold">${c.L_kabel.toFixed(2)} m</td>
            </tr>
          `;
        } else {
          rowsHtml += `
            <tr class="hover:bg-slate-800/50 border-b border-slate-800 text-xs font-mono transition-colors">
              <td class="py-2.5 px-3 font-sans text-center font-bold text-emerald-400">K-${c.no}</td>
              <td class="py-2.5 px-3 text-slate-200">${c.alpha_deg.toFixed(2)}&deg;</td>
              <td class="py-2.5 px-3 text-amber-400 font-semibold">${c.x_i.toFixed(3)} m</td>
              <td class="py-2.5 px-3 text-cyan-400 font-semibold">${c.y_i.toFixed(3)} m</td>
              <td class="py-2.5 px-3 text-purple-300 font-bold">${c.L_kabel.toFixed(2)} m</td>
            </tr>
          `;
        }
      });
      elTableBody.innerHTML = rowsHtml;
    }

    // Render Step-by-Step Breakdown
    if (elStepCalc) {
      if (method === 'metode-berbeda') {
        elStepCalc.innerHTML = `
          <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div class="text-slate-400 text-[11px]">1. Kapasitas Tarik Ijin Kabel Utama:</div>
            <div class="text-white text-xs">P_kabel = &sigma;s &times; (&pi;/4 &times; D&sup2;) = ${sigma_s} &times; (&pi;/4 &times; ${(Diameter_kabel/1000).toFixed(4)}&sup2;) &times; 1000 = <strong class="text-emerald-400">${P_kabel.toFixed(2)} kN</strong></div>
          </div>
          <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div class="text-slate-400 text-[11px]">2. Tinggi Pilar Di Atas Gelagar:</div>
            <div class="text-white text-xs">H_pilar = tan(&alpha;1) &times; (L_main / 2) = tan(${alpha_1_deg}&deg;) &times; (${L_main} / 2) = <strong class="text-blue-400">${H_pilar.toFixed(2)} meter</strong></div>
          </div>
          <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div class="text-slate-400 text-[11px]">3. Hasil Iterasi Kabel (Pertemuan IIIb):</div>
            <div class="text-slate-300 text-xs">&bull; Kabel 1: x1 = ${cables[0]?.x_i.toFixed(2)} m &rarr; &Delta;L1 = <strong class="text-amber-400">${cables[0]?.delta_L.toFixed(2)} m</strong> &rarr; L = <strong class="text-purple-400">${cables[0]?.L_kabel.toFixed(2)} m</strong></div>
            <div class="text-slate-300 text-xs">&bull; Kabel 6 (Terakhir): x6 = ${cables[5]?.x_i.toFixed(2)} m &rarr; &Delta;L6 = <strong class="text-amber-400">${cables[5]?.delta_L.toFixed(2)} m</strong> &rarr; L = <strong class="text-purple-400">${cables[5]?.L_kabel.toFixed(2)} m</strong></div>
            <div class="text-emerald-400 text-[11px] pt-1 font-semibold">&check; Syarat Berhenti: x6 (${cables[5]?.x_i.toFixed(2)} m) &lt; &Delta;L6 (${cables[5]?.delta_L.toFixed(2)} m). Iterasi dihentikan tepat pada 6 kabel valid!</div>
          </div>
          <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div class="text-slate-400 text-[11px]">4. Total Kebutuhan Panjang Kabel:</div>
            <div class="text-white text-xs">&bull; Total Panjang 1 Sisi = &Sigma; L_kabel_i = <strong class="text-cyan-400">${totalLen1Side.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m</strong></div>
            <div class="text-white text-xs">&bull; Total Panjang 4 Sisi = 4 &times; ${totalLen1Side.toFixed(2)} = <strong class="text-emerald-400">${totalLen4Sides.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m</strong></div>
          </div>
        `;
      } else {
        elStepCalc.innerHTML = `
          <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div class="text-slate-400 text-[11px]">1. Segmen Pikul Standar & Jumlah Kabel (Pertemuan IIIa):</div>
            <div class="text-white text-xs">&bull; &Delta;L = (P_kabel &times; sin(&alpha;1)) / q = (${P_kabel.toFixed(2)} &times; sin(${alpha_1_deg}&deg;)) / ${q} = <strong class="text-amber-400">${delta_L_standard.toFixed(4)} m</strong></div>
            <div class="text-white text-xs mt-0.5">&bull; N_kabel = ceil((L_main / 2) / &Delta;L) = ceil(${L_main/2} / ${delta_L_standard.toFixed(4)}) = ceil(${((L_main/2)/delta_L_standard).toFixed(4)}) = <strong class="text-emerald-400">${N_kabel} Kabel / Sisi</strong></div>
          </div>
          <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div class="text-slate-400 text-[11px]">2. Segmen Gelagar Terbagi Rata:</div>
            <div class="text-white text-xs">segmen_rata = (L_main / 2) / N_kabel = ${L_main/2} / ${N_kabel} = <strong class="text-blue-400">${segmen_rata.toFixed(3)} meter</strong></div>
          </div>
          <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div class="text-slate-400 text-[11px]">3. Formulasi Kabel Sejajar (Harp Arrangement):</div>
            <div class="text-slate-300 text-xs">&bull; Jarak Gelagar: x_i = segmen_rata &times; (i - 0.5)</div>
            <div class="text-slate-300 text-xs">&bull; Tinggi di Pylon: y_i = x_i &times; tan(${alpha_1_deg}&deg;)</div>
            <div class="text-slate-300 text-xs">&bull; Panjang Kabel: L_kabel_i = &radic;(x_i&sup2; + y_i&sup2;)</div>
          </div>
          <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div class="text-slate-400 text-[11px]">4. Total Kebutuhan Panjang Kabel:</div>
            <div class="text-white text-xs">&bull; Total Panjang 1 Sisi = &Sigma; L_kabel_i = <strong class="text-cyan-400">${totalLen1Side.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m</strong></div>
            <div class="text-white text-xs">&bull; Total Panjang 4 Sisi = 4 &times; ${totalLen1Side.toFixed(2)} = <strong class="text-emerald-400">${totalLen4Sides.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m</strong></div>
          </div>
        `;
      }
    }

    drawBridgeCanvas();
  }

  /**
   * VISUALISASI CANVAS: Jembatan Kabel Pancang 2-Pylon
   * Mendukung:
   * 1. Metode 1 (Sudut Memusat): Kabel memancar dari puncak pylon ke 6 titik gelagar.
   * 2. Metode 2 (Sudut Seragam 45°): Kabel sejajar (Harp) dari pylon ke 8 titik gelagar.
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

    // Latar Belakang Canvas
    const skyGrad = ctx.createLinearGradient(0, 0, 0, ch);
    skyGrad.addColorStop(0, '#020617');
    skyGrad.addColorStop(0.55, '#0f172a');
    skyGrad.addColorStop(0.75, '#1e293b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, cw, ch);

    const { method, L_main, L_side, H_pilar, cables, alpha_1_deg } = currentResults;
    const totalBridgeLength = L_side + L_main + L_side;

    // Margin & Geometri
    const padX = 65;
    const drawW = cw - padX * 2;
    const deckY = ch * 0.62;
    const waterY = deckY + 35;

    const meterToPx = (m) => padX + (m / totalBridgeLength) * drawW;

    // Posisi Pylon 1 & 2
    const pylon1_m = L_side;
    const pylon2_m = L_side + L_main;
    const pylon1_px = meterToPx(pylon1_m);
    const pylon2_px = meterToPx(pylon2_m);

    // Skala Pylon
    const maxPylonDrawH = (deckY - 45);
    const pylonScale = maxPylonDrawH / (H_pilar > 0 ? H_pilar : 200);
    const pylonTopY = deckY - (H_pilar * pylonScale);
    const pylonFoundationY = ch - 25;

    // ==========================================
    // 1. AIR SUNGAI TEAL
    // ==========================================
    ctx.save();
    const waterGrad = ctx.createLinearGradient(0, waterY, 0, ch);
    waterGrad.addColorStop(0, 'rgba(13, 148, 136, 0.45)');
    waterGrad.addColorStop(0.5, 'rgba(15, 118, 110, 0.6)');
    waterGrad.addColorStop(1, 'rgba(19, 78, 74, 0.85)');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, waterY, cw, ch - waterY);

    ctx.strokeStyle = 'rgba(45, 212, 191, 0.35)';
    ctx.lineWidth = 1.2;
    for (let waveY = waterY + 8; waveY < ch - 10; waveY += 14) {
      ctx.beginPath();
      for (let wx = 0; wx <= cw; wx += 25) {
        const wy = waveY + Math.sin((wx + waveY * 2) * 0.04) * 2;
        if (wx === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.stroke();
    }
    ctx.restore();

    // ==========================================
    // 2. KAKI PYLON DI BAWAH GELAGAR
    // ==========================================
    ctx.save();
    [pylon1_px, pylon2_px].forEach(px => {
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 2;
      ctx.fillRect(px - 14, deckY + 6, 28, pylonFoundationY - deckY - 6);
      ctx.strokeRect(px - 14, deckY + 6, 28, pylonFoundationY - deckY - 6);

      ctx.fillStyle = '#475569';
      ctx.fillRect(px - 22, pylonFoundationY - 12, 44, 18);
      ctx.strokeStyle = '#64748b';
      ctx.strokeRect(px - 22, pylonFoundationY - 12, 44, 18);
    });
    ctx.restore();

    // ==========================================
    // 3. KABEL-KABEL PANCANG (CABLE STAYS)
    // ==========================================
    ctx.save();
    ctx.lineWidth = 1.8;

    cables.forEach((c, idx) => {
      const dist_m = c.x_i;

      // Koordinat anchor di pylon (metode 1 memusat di atas, metode 2 tersebar harp)
      let pylonAnchorY;
      if (method === 'metode-berbeda') {
        // Memusat di puncak pylon dengan variasi sedikit agar kabel tidak bertumpuk
        pylonAnchorY = pylonTopY + (idx * (maxPylonDrawH * 0.28) / Math.max(1, cables.length));
      } else {
        // Metode 2: Sudut seragam 45° sejajar (y_i diukur dari deck)
        pylonAnchorY = deckY - (c.y_i * pylonScale);
      }

      // Target titik simpul di gelagar:
      // Pylon 1: tengah (+dist), sisi kiri (-dist)
      // Pylon 2: tengah (-dist), sisi kanan (+dist)
      const anchor_P1_mid_m = pylon1_m + dist_m;
      const anchor_P1_side_m = Math.max(0, pylon1_m - dist_m);
      const anchor_P2_mid_m = pylon2_m - dist_m;
      const anchor_P2_side_m = Math.min(totalBridgeLength, pylon2_m + dist_m);

      const cableTargets = [
        { pylonPx: pylon1_px, anchorPx: meterToPx(anchor_P1_mid_m) },
        { pylonPx: pylon1_px, anchorPx: meterToPx(anchor_P1_side_m) },
        { pylonPx: pylon2_px, anchorPx: meterToPx(anchor_P2_mid_m) },
        { pylonPx: pylon2_px, anchorPx: meterToPx(anchor_P2_side_m) }
      ];

      cableTargets.forEach(tgt => {
        ctx.save();
        ctx.shadowColor = method === 'metode-berbeda' ? 'rgba(56, 189, 248, 0.5)' : 'rgba(16, 185, 129, 0.5)';
        ctx.shadowBlur = 4;
        ctx.strokeStyle = '#0f172a'; // kabel hitam tegas
        ctx.beginPath();
        ctx.moveTo(tgt.pylonPx, pylonAnchorY);
        ctx.lineTo(tgt.anchorPx, deckY);
        ctx.stroke();

        // Titik simpul jangkar
        ctx.fillStyle = method === 'metode-berbeda' ? '#38bdf8' : '#10b981';
        ctx.beginPath();
        ctx.arc(tgt.anchorPx, deckY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Titik jangkar di pylon
        ctx.beginPath();
        ctx.arc(tgt.pylonPx, pylonAnchorY, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    });
    ctx.restore();

    // ==========================================
    // 4. GELAGAR JEMBATAN HIJAU
    // ==========================================
    ctx.save();
    const deckStartX = meterToPx(0);
    const deckEndX = meterToPx(totalBridgeLength);
    const deckLengthPx = deckEndX - deckStartX;
    const deckThickness = 10;

    ctx.fillStyle = '#10b981';
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 2;
    ctx.fillRect(deckStartX, deckY - deckThickness / 2, deckLengthPx, deckThickness);
    ctx.strokeRect(deckStartX, deckY - deckThickness / 2, deckLengthPx, deckThickness);

    ctx.fillStyle = '#334155';
    ctx.fillRect(deckStartX, deckY - deckThickness / 2 - 3, deckLengthPx, 3);
    ctx.restore();

    // ==========================================
    // 5. DUA PYLON MERAH
    // ==========================================
    ctx.save();
    [
      { px: pylon1_px, label: 'PYLON 1 (P1)' },
      { px: pylon2_px, label: 'PYLON 2 (P2)' }
    ].forEach(pylon => {
      const px = pylon.px;
      const towerW = 16;

      ctx.fillStyle = '#ef4444';
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

      const crossBeamY = pylonTopY + (deckY - pylonTopY) * 0.45;
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(px - towerW / 2 - 4, crossBeamY, towerW + 8, 6);

      ctx.beginPath();
      ctx.arc(px, pylonTopY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(pylon.label, px, pylonTopY - 14);
    });
    ctx.restore();

    // ==========================================
    // 6. DUA ABUTMENT KUNING
    // ==========================================
    ctx.save();
    const abutmentW = 24;
    const abutmentH = 38;

    ctx.fillStyle = '#eab308';
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;

    ctx.fillRect(deckStartX - abutmentW + 4, deckY - deckThickness / 2, abutmentW, abutmentH);
    ctx.strokeRect(deckStartX - abutmentW + 4, deckY - deckThickness / 2, abutmentW, abutmentH);

    ctx.fillRect(deckEndX - 4, deckY - deckThickness / 2, abutmentW, abutmentH);
    ctx.strokeRect(deckEndX - 4, deckY - deckThickness / 2, abutmentW, abutmentH);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ABUTMENT A1', deckStartX - abutmentW / 2, deckY + abutmentH + 12);
    ctx.fillText('ABUTMENT A2', deckEndX + abutmentW / 2, deckY + abutmentH + 12);
    ctx.restore();

    // ==========================================
    // 7. GARIS DIMENSI & ANOTASI
    // ==========================================
    ctx.save();
    const dimY = deckY + 65;
    ctx.strokeStyle = '#64748b';
    ctx.fillStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';

    drawDimLine(ctx, deckStartX, dimY, pylon1_px, dimY, `L_side = ${L_side} m`);
    drawDimLine(ctx, pylon1_px, dimY, pylon2_px, dimY, `L_main = ${L_main} m`);
    drawDimLine(ctx, pylon2_px, dimY, deckEndX, dimY, `L_side = ${L_side} m`);

    const hDimX = pylon1_px - 32;
    ctx.strokeStyle = '#38bdf8';
    ctx.fillStyle = '#38bdf8';
    drawVertDimLine(ctx, hDimX, deckY, hDimX, pylonTopY, `H = ${H_pilar.toFixed(1)} m`);

    // Judul Visualisasi
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('VISUALISASI JEMBATAN KABEL PANCANG 2-PYLON (CABLE-STAYED)', padX, 25);

    ctx.fillStyle = method === 'metode-berbeda' ? '#38bdf8' : '#10b981';
    ctx.font = '10px Inter, sans-serif';
    const methodTitle = method === 'metode-berbeda'
      ? `Metode IIIb UNTIDAR (Sudut Memusat) \u2022 ${cables.length} Kabel Valid / Sisi \u2022 Total 1 Sisi = ${totalLen1Side.toFixed(2)} m`
      : `Metode IIIa UNTIDAR (Sudut Seragam 45\u00B0) \u2022 ${cables.length} Kabel Sejajar / Sisi \u2022 Total 1 Sisi = ${totalLen1Side.toFixed(2)} m`;
    ctx.fillText(methodTitle, padX, 40);

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
    ctx.translate(x1 - 6, (y1 + y2) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }

  /**
   * Setup Event Listeners
   */
  function init() {
    const inputs = [elMethod, elDiameter, elSigmaS, elQ, elAlpha1, elLmain, elLside];
    inputs.forEach(inp => {
      if (inp) {
        inp.addEventListener('input', calculate);
        inp.addEventListener('change', calculate);
      }
    });

    const presetSelect = document.getElementById('csPresetSelect');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (presets[val]) {
          const p = presets[val];
          if (elMethod) elMethod.value = p.method;
          if (elDiameter) elDiameter.value = p.d;
          if (elSigmaS) elSigmaS.value = p.sigma_s;
          if (elQ) elQ.value = p.q;
          if (elAlpha1) elAlpha1.value = p.alpha_1;
          if (elLmain) elLmain.value = p.l_main;
          if (elLside) elLside.value = p.l_side;
          calculate();
        }
      });
    }

    const btnReset = document.getElementById('btnResetCS');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        const p = presets['untidar-standar'];
        if (elMethod) elMethod.value = p.method;
        if (elDiameter) elDiameter.value = p.d;
        if (elSigmaS) elSigmaS.value = p.sigma_s;
        if (elQ) elQ.value = p.q;
        if (elAlpha1) elAlpha1.value = p.alpha_1;
        if (elLmain) elLmain.value = p.l_main;
        if (elLside) elLside.value = p.l_side;
        calculate();
      });
    }

    const btnDownload = document.getElementById('btnDownloadCSCanvas');
    if (btnDownload && canvas) {
      btnDownload.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `CivilStruct-CableStayed-${elMethod?.value || 'metode'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }

    calculate();
    window.addEventListener('resize', calculate);
  }

  return { init, calculate, getResults: () => currentResults };
})();
