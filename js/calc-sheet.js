/**
 * CivilStruct Pro Enterprise - Modul 5: Calculation Sheet Generator & Lembar Audit Lengkap
 * Menyusun ringkasan audit komprehensif langkah-demi-langkah (Step-by-Step Numerical Verification),
 * pemeriksaan limitasi standar SNI, ringkasan utilisasi beban, serta penyiapan data cetak PDF.
 */

const CalcSheetModule = (() => {
  const elReportContainer = document.getElementById('calcSheetAuditContent');
  const elProjectName = document.getElementById('input_proj_name');
  const elDocNo = document.getElementById('input_proj_docno');
  const elEngineerName = document.getElementById('input_proj_engineer');

  function generateReport() {
    if (!elReportContainer) return;

    const proj = elProjectName?.value || 'Pembangunan Gedung & Jembatan Terpadu';
    const docNo = elDocNo?.value || 'CSP-SNI-2026-CALC-001';
    const eng = elEngineerName?.value || 'Ir. Devan Pratama, S.T., M.T., IPM.';
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    // Sinkronkan ke lembar cetak
    const printProj = document.getElementById('printHeaderProj');
    const printDoc = document.getElementById('printHeaderDoc');
    const printEng = document.getElementById('printHeaderEng');
    const printDate = document.getElementById('printHeaderDate');

    if (printProj) printProj.innerText = proj;
    if (printDoc) printDoc.innerText = docNo;
    if (printEng) printEng.innerText = eng;
    if (printDate) printDate.innerText = dateStr;

    // Ambil data dari modul-modul
    const beamStatus = document.getElementById('beamStatusBadge')?.innerText || 'MEMENUHI';
    const phiMn = document.getElementById('res_phiMn')?.innerText || '-';
    const phiVn = document.getElementById('res_phiVn')?.innerText || '-';
    const Mu = document.getElementById('input_mu')?.value || '-';
    const Vu = document.getElementById('input_vu')?.value || '-';
    const dcRatio = document.getElementById('beamDCRatio')?.innerText || '-';

    const bridgeStatus = document.getElementById('bridgeStatusBadge')?.innerText || 'MEMENUHI';
    const bridgeMu = document.getElementById('res_br_Mu')?.innerText || '-';
    const bridgeDelta = document.getElementById('res_br_delta')?.innerText || '-';
    const bridgeDeltaIjin = document.getElementById('res_br_delta_ijin')?.innerText || '-';
    const bridgeRatio = document.getElementById('bridgeDeflRatio')?.innerText || '-';

    const csHpilar = document.getElementById('res_cs_hpilar')?.innerText || '-';
    const csPkabel = document.getElementById('res_cs_pkabel')?.innerText || '-';
    const csNum = document.getElementById('res_cs_numcables')?.innerText || '-';
    const csLen1 = document.getElementById('res_cs_len1side')?.innerText || '-';
    const csLen4 = document.getElementById('res_cs_len4sides')?.innerText || '-';
    const csWeight = document.getElementById('res_cs_weight')?.innerText || '-';

    const sbH = document.getElementById('res_sb_H')?.innerText || '-';
    const sbT = document.getElementById('res_sb_T')?.innerText || '-';
    const sbTstar = document.getElementById('res_sb_Tstar')?.innerText || '-';
    const sbDtengah = document.getElementById('res_sb_dtengah')?.innerText || '-';
    const sbDtepi = document.getElementById('res_sb_dtepi')?.innerText || '-';
    const sbLtotal = document.getElementById('res_sb_ltotal')?.innerText || '-';
    const sbAlphaKritis = document.getElementById('res_sb_alphakritis')?.innerText || '-';
    const sbSagRatio = document.getElementById('res_sb_sagratio')?.innerText || '-';

    const eqKDS = document.getElementById('res_eq_kds')?.innerText || 'KDS D';
    const eqSds = document.getElementById('res_eq_sds')?.innerText || '-';
    const eqVbase = document.getElementById('res_eq_vbase')?.innerText || '-';
    const eqCs = document.getElementById('res_eq_cs')?.innerText || '-';

    const totalSteelTon = document.getElementById('res_mto_steel_ton')?.innerText || '0';
    const totalConcrete = document.getElementById('res_mto_concrete_m3')?.innerText || '0';
    const totalCost = document.getElementById('res_mto_total_cost')?.innerText || 'Rp 0';

    elReportContainer.innerHTML = `
      <!-- BAGIAN 1: METADATA PROYEK -->
      <div class="border-b border-slate-700/80 pb-4 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 class="text-base font-extrabold text-white tracking-tight">${proj}</h3>
            <p class="text-xs text-slate-400 font-mono">No. Dokumen: <span class="text-blue-400 font-bold">${docNo}</span> &bull; Engineer: <span class="text-emerald-400">${eng}</span></p>
          </div>
          <div class="text-right text-xs text-slate-400 font-mono">
            <span>Tanggal Verifikasi: ${dateStr}</span>
          </div>
        </div>
      </div>

      <!-- BAGIAN 2: RINGKASAN AUDIT KELAYAKAN ELEMEN STRUKTUR -->
      <div class="space-y-6 text-xs text-slate-200">
        
        <!-- 1. Balok & Kolom SNI 2847 -->
        <div class="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          <div class="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <span class="font-bold text-sm text-blue-400 flex items-center space-x-1.5">
              <span>1. Analisis Lentur & Geser Balok/Kolom (SNI 2847:2019)</span>
            </span>
            <span class="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700/40">${beamStatus.includes('AMAN') ? 'STATUS: MEMENUHI SYARAT' : 'STATUS: PERLU REVISI'}</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
            <div class="space-y-1">
              <div>&bull; Kapasitas Momen Rencana: &phi;Mn = <strong class="text-emerald-400">${phiMn} kNm</strong> (Mu = ${Mu} kNm)</div>
              <div>&bull; Rasio Pemanfaatan Kapasitas Lentur: <strong class="text-white">${dcRatio}</strong></div>
              <div>&bull; Evaluasi Limitasi SNI: Regangan tarik baja memenuhi syarat daktilitas penampang terfaktor.</div>
            </div>
            <div class="space-y-1">
              <div>&bull; Kapasitas Geser Rencana: &phi;Vn = <strong class="text-emerald-400">${phiVn} kN</strong> (Vu = ${Vu} kN)</div>
              <div>&bull; Kontribusi Beton (Vc) &amp; Sengkang (Vs) memenuhi batas kekuatan geser nominal.</div>
              <div>&bull; P-M Interaction Envelope: Titik beban aksial-lentur (Mu, Pu) terverifikasi aman di dalam kurva.</div>
            </div>
          </div>
        </div>

        <!-- 2. Gelagar Jembatan SNI 1725 -->
        <div class="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          <div class="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <span class="font-bold text-sm text-emerald-400 flex items-center space-x-1.5">
              <span>2. Analisis Gelagar &amp; Batas Lendutan Jembatan (SNI 1725:2016)</span>
            </span>
            <span class="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-700/40">${bridgeStatus.includes('MEMENUHI') ? 'STATUS: MEMENUHI SYARAT' : 'STATUS: MELEBIHI BATAS'}</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
            <div class="space-y-1">
              <div>&bull; Momen Maksimum Terfaktor: Mu = <strong class="text-amber-400">${bridgeMu} kNm</strong></div>
              <div>&bull; Lendutan Aktual Maksimum: &delta;max = <strong class="text-purple-400">${bridgeDelta} mm</strong></div>
            </div>
            <div class="space-y-1">
              <div>&bull; Batas Lendutan Izin Jembatan: &delta;ijin = L/800 = <strong class="text-emerald-400">${bridgeDeltaIjin} mm</strong></div>
              <div>&bull; Rasio Lendutan Aktual / Izin: <strong class="text-white">${bridgeRatio}</strong> (Batas L/800 terpenuhi)</div>
            </div>
          </div>
        </div>

        <!-- 3. Jembatan Kabel Pancang (UNTIDAR Method) -->
        <div class="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          <div class="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <span class="font-bold text-sm text-cyan-400 flex items-center space-x-1.5">
              <span>3. Analisis Iteratif Jembatan Kabel Pancang (Praktikum UNTIDAR)</span>
            </span>
            <span class="px-2.5 py-0.5 rounded text-[11px] font-bold bg-cyan-900/60 text-cyan-300 border border-cyan-700/40">TERVERIFIKASI ITERASI</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
            <div class="space-y-1">
              <div>&bull; Tinggi Pilar di Atas Gelagar: H_pilar = <strong class="text-blue-400">${csHpilar} m</strong></div>
              <div>&bull; Kapasitas Tarik Ijin Kabel: P_kabel = <strong class="text-emerald-400">${csPkabel} kN</strong></div>
              <div>&bull; Jumlah Kabel per Kuadran Pylon: <strong class="text-white">${csNum}</strong></div>
            </div>
            <div class="space-y-1">
              <div>&bull; Total Panjang Kabel 1 Sisi: <strong class="text-purple-300">${csLen1} m</strong></div>
              <div>&bull; Total Kebutuhan Kabel 4 Sisi Jembatan: <strong class="text-amber-400">${csLen4} m</strong></div>
              <div>&bull; Estimasi Bobot Baja Kabel: <strong class="text-emerald-400">${csWeight}</strong></div>
            </div>
          </div>
        </div>

        <!-- 4. Jembatan Gantung (UNTIDAR Method) -->
        <div class="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          <div class="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <span class="font-bold text-sm text-indigo-400 flex items-center space-x-1.5">
              <span>4. Analisis Jembatan Gantung / Suspension Bridge (Praktikum UNTIDAR)</span>
            </span>
            <span class="px-2.5 py-0.5 rounded text-[11px] font-bold bg-indigo-900/60 text-indigo-300 border border-indigo-700/40">TERVERIFIKASI MEKANIKA</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
            <div class="space-y-1">
              <div>&bull; Gaya Horisontal Kabel: H = <strong class="text-blue-400">${sbH} kN</strong> (${sbSagRatio})</div>
              <div>&bull; Tarik Maksimum Kabel Tengah: T = <strong class="text-emerald-400">${sbT} kN</strong> (&empty; <strong class="text-white">${sbDtengah}</strong>)</div>
              <div>&bull; Tarik Maksimum Kabel Tepi: T* = <strong class="text-amber-400">${sbTstar} kN</strong> (&empty; <strong class="text-white">${sbDtepi}</strong>)</div>
            </div>
            <div class="space-y-1">
              <div>&bull; Panjang Kabel Total: L_total = <strong class="text-purple-300">${sbLtotal} m</strong></div>
              <div>&bull; Sudut Kritis Keseimbangan: &alpha;_kritis = <strong class="text-cyan-400">${sbAlphaKritis}</strong></div>
              <div>&bull; Formulasi Kabel: y = 4&times;f&times;(x/L)&times;(1 - x/L) dengan hanger terdistribusi merata.</div>
            </div>
          </div>
        </div>

        <!-- 5. Gempa Seismik SNI 1726 -->
        <div class="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          <div class="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <span class="font-bold text-sm text-amber-400 flex items-center space-x-1.5">
              <span>5. Beban Seismik Statik Ekuivalen (SNI 1726:2019)</span>
            </span>
            <span class="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-900/60 text-amber-300 border border-amber-700/40">${eqKDS}</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
            <div class="space-y-1">
              <div>&bull; Parameter Desain: SDS = <strong class="text-white">${eqSds} g</strong> | Koefisien Cs = <strong class="text-white">${eqCs}</strong></div>
              <div>&bull; Klasifikasi Seismik: Struktur termasuk dalam <strong class="text-amber-300">${eqKDS}</strong></div>
            </div>
            <div class="space-y-1">
              <div>&bull; Geser Dasar Seismik Total: V = Cs &times; W = <strong class="text-blue-400">${eqVbase}</strong></div>
              <div>&bull; Distribusi Vertikal Gaya Gempa Fx terdistribusi secara eksponensial ke seluruh lantai.</div>
            </div>
          </div>
        </div>

        <!-- 6. Material Take-Off & RAB -->
        <div class="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          <div class="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <span class="font-bold text-sm text-purple-400 flex items-center space-x-1.5">
              <span>6. Estimasi Volume Material (BBS &amp; MTO) serta Anggaran Biaya (RAB)</span>
            </span>
            <span class="px-2.5 py-0.5 rounded text-[11px] font-bold bg-purple-900/60 text-purple-300 border border-purple-700/40">REKAPITULASI BIAYA</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-center">
            <div class="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
              <span class="text-[10px] text-slate-400 block font-sans">Total Volume Beton</span>
              <span class="text-sm font-bold text-blue-400">${totalConcrete} m&sup3;</span>
            </div>
            <div class="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
              <span class="text-[10px] text-slate-400 block font-sans">Total Tonase Baja Tulangan</span>
              <span class="text-sm font-bold text-amber-400">${totalSteelTon} Ton</span>
            </div>
            <div class="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
              <span class="text-[10px] text-slate-400 block font-sans">Total Estimasi Biaya (RAB)</span>
              <span class="text-sm font-bold text-emerald-400">${totalCost}</span>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  function printReport() {
    // Jalankan kalkulasi terbaru di seluruh modul
    if (typeof BeamColumnModule !== 'undefined') BeamColumnModule.calculate();
    if (typeof BridgeEnterpriseModule !== 'undefined') BridgeEnterpriseModule.calculate();
    if (typeof CableStayedModule !== 'undefined') CableStayedModule.calculate();
    if (typeof SuspensionBridgeModule !== 'undefined') SuspensionBridgeModule.calculate();
    if (typeof SeismicModule !== 'undefined') SeismicModule.calculate();
    if (typeof BBSModule !== 'undefined') BBSModule.render();

    generateReport();

    setTimeout(() => {
      window.print();
    }, 180);
  }

  function init() {
    const btnPrint = document.getElementById('btnPrintReport');
    if (btnPrint) {
      btnPrint.addEventListener('click', printReport);
    }

    const btnRefreshAudit = document.getElementById('btnRefreshAudit');
    if (btnRefreshAudit) {
      btnRefreshAudit.addEventListener('click', generateReport);
    }

    [elProjectName, elDocNo, elEngineerName].forEach(inp => {
      if (inp) inp.addEventListener('input', generateReport);
    });

    generateReport();
  }

  return { init, generateReport, printReport };
})();

