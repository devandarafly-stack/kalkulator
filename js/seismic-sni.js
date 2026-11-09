/**
 * CivilStruct Pro Enterprise - Modul 3: Beban Gempa Statik Ekuivalen (SNI 1726:2019)
 * Koefisien Situs Fa & Fv, Spektrum Desain SDS & SD1, Kategori Desain Seismik (KDS A-F),
 * Geser Dasar Seismik Total (V = Cs * W), Distribusi Gaya Gempa Lateral Fx & Geser Tingkat Vx,
 * Serta Visualisasi Elevasi Gedung dengan Vektor Panah Seismik Real-Time.
 */

const SeismicModule = (() => {
  // DOM Inputs
  const elSiteClass = document.getElementById('input_eq_site');
  const elSs = document.getElementById('input_eq_ss');
  const elS1 = document.getElementById('input_eq_s1');
  const elRiskCat = document.getElementById('input_eq_risk');
  const elR = document.getElementById('input_eq_r');
  const elStories = document.getElementById('input_eq_stories');
  const elHeightStory = document.getElementById('input_eq_hstory');
  const elWeightTotal = document.getElementById('input_eq_wtotal');

  // DOM Outputs
  const elFa = document.getElementById('res_eq_fa');
  const elFv = document.getElementById('res_eq_fv');
  const elSds = document.getElementById('res_eq_sds');
  const elSd1 = document.getElementById('res_eq_sd1');
  const elKDS = document.getElementById('res_eq_kds');
  const elTa = document.getElementById('res_eq_ta');
  const elCs = document.getElementById('res_eq_cs');
  const elVBase = document.getElementById('res_eq_vbase');

  // Status & Detail
  const elStatusCard = document.getElementById('seismicStatusCard');
  const elStatusBadge = document.getElementById('seismicStatusBadge');
  const elStatusDetail = document.getElementById('seismicStatusDetail');
  const elStepCalc = document.getElementById('seismicStepCalc');
  const elStoryTableBody = document.getElementById('seismicStoryTableBody');

  // Canvas
  const canvas = document.getElementById('seismicCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;

  let currentSeismicData = null;

  // Presets Gempa Kota Besar Indonesia
  const presets = {
    'jakarta-sedang': { site: 'SD', ss: 0.85, s1: 0.38, risk: 'II', r: 8.0, stories: 8, hstory: 3.8, wtotal: 24000 },
    'padang-keras': { site: 'SC', ss: 1.45, s1: 0.65, risk: 'IV', r: 8.0, stories: 6, hstory: 4.0, wtotal: 18000 },
    'surabaya-lunak': { site: 'SE', ss: 0.68, s1: 0.28, risk: 'II', r: 8.0, stories: 10, hstory: 3.5, wtotal: 32000 },
    'bandung-sedang': { site: 'SD', ss: 1.15, s1: 0.48, risk: 'III', r: 8.0, stories: 12, hstory: 3.6, wtotal: 45000 }
  };

  /**
   * Tabel 5 SNI 1726:2019 - Koefisien Situs Fa
   */
  function calculateFa(site, Ss) {
    const tableFa = {
      'SA': [0.8, 0.8, 0.8, 0.8, 0.8],
      'SB': [0.9, 0.9, 0.9, 0.9, 0.9],
      'SC': [1.3, 1.3, 1.2, 1.2, 1.2],
      'SD': [1.6, 1.4, 1.2, 1.1, 1.0],
      'SE': [2.4, 1.9, 1.3, 1.1, 0.9],
      'SF': [1.0, 1.0, 1.0, 1.0, 1.0] // Diperlukan analisis respons spesifik situs
    };
    const ssLevels = [0.25, 0.50, 0.75, 1.00, 1.25];
    const row = tableFa[site] || tableFa['SD'];

    if (Ss <= ssLevels[0]) return row[0];
    if (Ss >= ssLevels[4]) return row[4];

    for (let i = 0; i < 4; i++) {
      if (Ss >= ssLevels[i] && Ss <= ssLevels[i + 1]) {
        const t = (Ss - ssLevels[i]) / (ssLevels[i + 1] - ssLevels[i]);
        return row[i] + t * (row[i + 1] - row[i]);
      }
    }
    return 1.2;
  }

  /**
   * Tabel 6 SNI 1726:2019 - Koefisien Situs Fv
   */
  function calculateFv(site, S1) {
    const tableFv = {
      'SA': [0.8, 0.8, 0.8, 0.8, 0.8],
      'SB': [0.8, 0.8, 0.8, 0.8, 0.8],
      'SC': [1.5, 1.5, 1.5, 1.5, 1.4],
      'SD': [2.4, 2.2, 2.0, 1.9, 1.8],
      'SE': [4.2, 3.3, 2.8, 2.4, 2.2],
      'SF': [1.0, 1.0, 1.0, 1.0, 1.0]
    };
    const s1Levels = [0.10, 0.20, 0.30, 0.40, 0.50];
    const row = tableFv[site] || tableFv['SD'];

    if (S1 <= s1Levels[0]) return row[0];
    if (S1 >= s1Levels[4]) return row[4];

    for (let i = 0; i < 4; i++) {
      if (S1 >= s1Levels[i] && S1 <= s1Levels[i + 1]) {
        const t = (S1 - s1Levels[i]) / (s1Levels[i + 1] - s1Levels[i]);
        return row[i] + t * (row[i + 1] - row[i]);
      }
    }
    return 1.8;
  }

  /**
   * Kategori Desain Seismik (KDS) SNI 1726:2019 Tabel 8 & 9
   */
  function determineKDS(Sds, Sd1, riskCat) {
    // Berdasarkan SDS
    let kds_sds = 'A';
    if (riskCat === 'IV') {
      if (Sds >= 0.50) kds_sds = 'D';
      else if (Sds >= 0.33) kds_sds = 'C';
      else if (Sds >= 0.167) kds_sds = 'B';
    } else {
      if (Sds >= 0.50) kds_sds = 'D';
      else if (Sds >= 0.33) kds_sds = 'C';
      else if (Sds >= 0.167) kds_sds = 'B';
    }

    // Berdasarkan SD1
    let kds_sd1 = 'A';
    if (riskCat === 'IV') {
      if (Sd1 >= 0.20) kds_sd1 = 'D';
      else if (Sd1 >= 0.133) kds_sd1 = 'C';
      else if (Sd1 >= 0.067) kds_sd1 = 'B';
    } else {
      if (Sd1 >= 0.20) kds_sd1 = 'D';
      else if (Sd1 >= 0.133) kds_sd1 = 'C';
      else if (Sd1 >= 0.067) kds_sd1 = 'B';
    }

    // Ambil yang paling parah (A < B < C < D)
    const priority = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6 };
    let finalKDS = priority[kds_sds] >= priority[kds_sd1] ? kds_sds : kds_sd1;

    // SNI: jika S1 >= 0.75, otomatis KDS E atau F
    return finalKDS;
  }

  function calculate() {
    const site = elSiteClass?.value || 'SD';
    const Ss = Math.max(0.05, parseFloat(elSs?.value) || 0.85);
    const S1 = Math.max(0.02, parseFloat(elS1?.value) || 0.38);
    const riskCat = elRiskCat?.value || 'II';
    const R = Math.max(1.0, parseFloat(elR?.value) || 8.0);
    const N = Math.max(1, parseInt(elStories?.value) || 8);
    const h_story = Math.max(2.5, parseFloat(elHeightStory?.value) || 3.8);
    const W_total = Math.max(100, parseFloat(elWeightTotal?.value) || 24000);

    // 1. FAKTOR KEUTAMAAN GEMPA Ie (SNI 1726:2019 Tabel 3)
    let Ie = 1.0;
    if (riskCat === 'III') Ie = 1.25;
    if (riskCat === 'IV') Ie = 1.50;

    // 2. KOEFISIEN SITUS & SPEKTRUM DESAIN
    const Fa = calculateFa(site, Ss);
    const Fv = calculateFv(site, S1);

    const SMS = Fa * Ss;
    const SM1 = Fv * S1;
    const SDS = (2 / 3) * SMS;
    const SD1 = (2 / 3) * SM1;

    // 3. KATEGORI DESAIN SEISMIK (KDS)
    const KDS = determineKDS(SDS, SD1, riskCat);

    // 4. PERIODE FUNDAMENTAL PENDEKATAN (Ta)
    // Untuk sistem rangka pemikul momen beton (Pasal 7.8.2.1): Ct = 0.0466, x = 0.9
    const hn = N * h_story; // Tinggi total bangunan (m)
    const Ta = 0.0466 * Math.pow(hn, 0.9);

    // 5. KOEFISIEN RESPONS SEISMIK (Cs)
    let Cs = SDS / (R / Ie);
    const CsMax = SD1 / (Ta * (R / Ie));
    const CsMin = Math.max(0.044 * SDS * Ie, 0.01);

    let CsUsed = Math.min(Cs, CsMax);
    CsUsed = Math.max(CsUsed, CsMin);

    // 6. GAYA GESER DASAR SEISMIK TOTAL (V = Cs * W)
    const Vbase = CsUsed * W_total; // kN

    // 7. DISTRIBUSI VERTIKAL GAYA GEMPA PER LANTAI (Fx & Vx)
    // Eksponen k: k = 1 jika Ta <= 0.5s; k = 2 jika Ta >= 2.5s; interpolasi linier di antaranya
    let k = 1.0;
    if (Ta >= 2.5) k = 2.0;
    else if (Ta > 0.5) k = 1.0 + ((Ta - 0.5) / 2.0);

    const storyData = [];
    const w_story = W_total / N; // Distribusi berat merata per lantai
    let sum_w_hk = 0;

    for (let i = 1; i <= N; i++) {
      const hi = i * h_story;
      const w_hk = w_story * Math.pow(hi, k);
      sum_w_hk += w_hk;
      storyData.push({ floor: i, hi, w_story, w_hk, Cvx: 0, Fx: 0, Vx: 0 });
    }

    // Hitung Cvx dan Fx
    for (let i = 0; i < N; i++) {
      storyData[i].Cvx = sum_w_hk > 0 ? (storyData[i].w_hk / sum_w_hk) : (1 / N);
      storyData[i].Fx = storyData[i].Cvx * Vbase;
    }

    // Geser Tingkat (Vx) dari atas ke bawah
    let accumV = 0;
    for (let i = N - 1; i >= 0; i--) {
      accumV += storyData[i].Fx;
      storyData[i].Vx = accumV;
    }

    currentSeismicData = {
      site, Ss, S1, riskCat, Ie, R, N, hn, h_story, W_total,
      Fa, Fv, SDS, SD1, KDS, Ta, CsUsed, Vbase, k, storyData
    };

    // Update Output DOM
    if (elFa) elFa.innerText = Fa.toFixed(3);
    if (elFv) elFv.innerText = Fv.toFixed(3);
    if (elSds) elSds.innerText = SDS.toFixed(3);
    if (elSd1) elSd1.innerText = SD1.toFixed(3);
    if (elKDS) elKDS.innerText = `KDS ${KDS}`;
    if (elTa) elTa.innerText = `${Ta.toFixed(3)} s`;
    if (elCs) elCs.innerText = CsUsed.toFixed(4);
    if (elVBase) elVBase.innerText = `${Vbase.toFixed(1)} kN`;

    // Status Card & Badge
    if (elStatusBadge) {
      elStatusBadge.className = 'text-lg sm:text-2xl font-black px-4 py-1.5 rounded-xl tracking-wide flex items-center space-x-2 bg-blue-500/20 text-blue-400 border border-blue-500/40 glow-blue';
      elStatusBadge.innerHTML = `
        <svg class="w-6 h-6 text-blue-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        <span>ANALISIS GEMPA SELESAI (KDS ${KDS})</span>
      `;
    }

    if (elStatusDetail) {
      elStatusDetail.innerHTML = `Geser dasar total V = <strong class="text-white">${Vbase.toFixed(1)} kN</strong> (${(CsUsed * 100).toFixed(2)}% dari berat total W). Sistem struktur wajib memenuhi persyaratan sistem penahan gaya seismik untuk <strong>KDS ${KDS}</strong>.`;
    }

    // Isi Tabel Distribusi Tingkat
    if (elStoryTableBody) {
      let rowsHtml = '';
      for (let i = N - 1; i >= 0; i--) {
        const s = storyData[i];
        rowsHtml += `
          <tr class="hover:bg-slate-800/40 border-b border-slate-800 text-xs font-mono">
            <td class="py-2 px-3 font-sans text-slate-300 font-bold">Lantai ${s.floor}</td>
            <td class="py-2 px-3 text-slate-400">${s.hi.toFixed(1)} m</td>
            <td class="py-2 px-3 text-slate-300">${s.w_story.toFixed(0)} kN</td>
            <td class="py-2 px-3 text-emerald-400 font-bold">${s.Fx.toFixed(1)} kN</td>
            <td class="py-2 px-3 text-blue-400 font-bold">${s.Vx.toFixed(1)} kN</td>
          </tr>
        `;
      }
      elStoryTableBody.innerHTML = rowsHtml;
    }

    // Step-by-Step Breakdown
    if (elStepCalc) {
      elStepCalc.innerHTML = `
        <div class="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
          <div class="text-slate-400 text-[11px]">1. Parameter Respons Spektra Desain:</div>
          <div class="text-white text-xs">SMS = ${Fa.toFixed(2)} &times; ${Ss} = <strong>${SMS.toFixed(3)}</strong> | SDS = 2/3 &times; SMS = <strong class="text-amber-400">${SDS.toFixed(3)} g</strong></div>
          <div class="text-white text-xs mt-0.5">SM1 = ${Fv.toFixed(2)} &times; ${S1} = <strong>${SM1.toFixed(3)}</strong> | SD1 = 2/3 &times; SM1 = <strong class="text-amber-400">${SD1.toFixed(3)} g</strong></div>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
          <div class="text-slate-400 text-[11px]">2. Periode Alami Bangunan & Koefisien Cs:</div>
          <div class="text-white text-xs">Ta = 0.0466 &times; (${hn.toFixed(1)})^0.9 = <strong class="text-purple-400">${Ta.toFixed(3)} detik</strong> (Eksponen k = ${k.toFixed(2)})</div>
          <div class="text-white text-xs mt-0.5">Cs = SDS / (R/Ie) = ${SDS.toFixed(3)} / (${R}/${Ie}) = <strong class="text-emerald-400">${CsUsed.toFixed(4)}</strong></div>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
          <div class="text-slate-400 text-[11px]">3. Geser Dasar Seismik Total (Base Shear):</div>
          <div class="text-white text-xs">V = Cs &times; W = ${CsUsed.toFixed(4)} &times; ${W_total} kN = <strong class="text-blue-400 font-bold">${Vbase.toFixed(1)} kN</strong></div>
        </div>
      `;
    }

    drawSeismicBuilding();
  }

  /**
   * Menggambar Elevasi Gedung Bertingkat dengan Vektor Panah Gaya Lateral Fx pada Canvas
   */
  function drawSeismicBuilding() {
    if (!ctx || !canvas || !currentSeismicData) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cw = rect.width || 420;
    const ch = rect.height || 360;

    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    ctx.resetTransform ? ctx.resetTransform() : ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, cw, ch);

    const { N, storyData, Vbase } = currentSeismicData;
    const bldgW = 120;
    const bldgBaseX = cw * 0.42;
    const groundY = ch - 40;
    const totalAvailH = ch - 80;
    const floorH = Math.min(32, totalAvailH / N);

    // 1. Gambar Garis Tanah & Pondasi
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bldgBaseX - 60, groundY);
    ctx.lineTo(bldgBaseX + bldgW + 60, groundY);
    ctx.stroke();

    // Arsiran tanah
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    for (let x = bldgBaseX - 50; x <= bldgBaseX + bldgW + 50; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x - 8, groundY + 12);
      ctx.stroke();
    }

    // 2. Gambar Rangka Portal Gedung Tiap Lantai
    const maxFx = storyData[N - 1]?.Fx || 1;
    const maxArrowW = cw * 0.30;

    for (let i = 0; i < N; i++) {
      const s = storyData[i];
      const floorY = groundY - (i + 1) * floorH;

      // Pelat Lantai
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.fillRect(bldgBaseX, floorY, bldgW, 6);
      ctx.strokeRect(bldgBaseX, floorY, bldgW, 6);

      // Kolom Kiri & Kanan
      const colTopY = floorY;
      const colBotY = floorY + floorH;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bldgBaseX + 8, colBotY);
      ctx.lineTo(bldgBaseX + 8, colTopY + 6);
      ctx.moveTo(bldgBaseX + bldgW - 8, colBotY);
      ctx.lineTo(bldgBaseX + bldgW - 8, colTopY + 6);
      ctx.stroke();

      // Jendela Gedung Kecil
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.fillRect(bldgBaseX + 28, floorY + 10, bldgW - 56, floorH - 14);

      // 3. Vektor Panah Gaya Gempa Lateral Fx (Panah Merah/Pink Menekan dari Kiri)
      const arrowLen = Math.max(25, (s.Fx / maxFx) * maxArrowW);
      const arrowStartX = bldgBaseX - arrowLen - 8;
      const arrowEndX = bldgBaseX - 4;
      const arrowY = floorY + 3;

      ctx.save();
      ctx.strokeStyle = '#ec4899';
      ctx.fillStyle = '#ec4899';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(arrowStartX, arrowY);
      ctx.lineTo(arrowEndX, arrowY);
      ctx.stroke();

      // Kepala Panah
      ctx.beginPath();
      ctx.moveTo(arrowEndX, arrowY);
      ctx.lineTo(arrowEndX - 7, arrowY - 4);
      ctx.lineTo(arrowEndX - 7, arrowY + 4);
      ctx.closePath();
      ctx.fill();

      // Anotasi Nilai Fx
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillStyle = '#f472b6';
      ctx.textAlign = 'right';
      ctx.fillText(`${s.Fx.toFixed(0)} kN`, arrowStartX - 4, arrowY + 3);

      // Anotasi Label Lantai di Kanan
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'left';
      ctx.fillText(`L${s.floor} (Vx=${s.Vx.toFixed(0)})`, bldgBaseX + bldgW + 10, arrowY + 3);
      ctx.restore();
    }

    // Judul Elevasi
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DISTRIBUSI GAYA LATERAL GEMPA (Fx)', cw / 2, 25);
  }

  function init() {
    const inputs = [elSiteClass, elSs, elS1, elRiskCat, elR, elStories, elHeightStory, elWeightTotal];
    inputs.forEach(inp => {
      if (inp) {
        inp.addEventListener('input', calculate);
        inp.addEventListener('change', calculate);
      }
    });

    const presetSelect = document.getElementById('seismicPresetSelect');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (presets[val]) {
          const p = presets[val];
          if (elSiteClass) elSiteClass.value = p.site;
          if (elSs) elSs.value = p.ss;
          if (elS1) elS1.value = p.s1;
          if (elRiskCat) elRiskCat.value = p.risk;
          if (elR) elR.value = p.r;
          if (elStories) elStories.value = p.stories;
          if (elHeightStory) elHeightStory.value = p.hstory;
          if (elWeightTotal) elWeightTotal.value = p.wtotal;
          calculate();
        }
      });
    }

    calculate();
    window.addEventListener('resize', calculate);
  }

  return { init, calculate };
})();

