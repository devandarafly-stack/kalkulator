/**
 * CivilStruct Pro Enterprise - Modul 4: Bar Bending Schedule (BBS) & Material Take-Off (MTO / RAB)
 * Menghitung berat baja presisi BJ = 0.006165 * D^2 * L, Shape Code 00, 11, 51,
 * Volume Beton Struktural, Luas Bekisting, dan Estimasi Biaya (RAB) Proyek.
 */

const BBSModule = (() => {
  // DOM Elements
  const elBbsTableBody = document.getElementById('bbsTableBody');
  const elTotalWeightKg = document.getElementById('res_mto_steel_kg');
  const elTotalWeightTon = document.getElementById('res_mto_steel_ton');
  const elTotalConcrete = document.getElementById('res_mto_concrete_m3');
  const elTotalFormwork = document.getElementById('res_mto_formwork_m2');
  const elTotalCost = document.getElementById('res_mto_total_cost');

  // Unit Price Inputs
  const elPriceConcrete = document.getElementById('input_price_concrete');
  const elPriceSteel = document.getElementById('input_price_steel');
  const elPriceFormwork = document.getElementById('input_price_formwork');

  // Input Tambah Item
  const elAddElem = document.getElementById('input_bbs_elem');
  const elAddShape = document.getElementById('input_bbs_shape');
  const elAddD = document.getElementById('input_bbs_d');
  const elAddDimA = document.getElementById('input_bbs_dimA');
  const elAddDimB = document.getElementById('input_bbs_dimB');
  const elAddQty = document.getElementById('input_bbs_qty');
  const elBtnAddRow = document.getElementById('btnAddBbsRow');

  // Canvas Sketsa Shape
  const canvasShape = document.getElementById('bbsShapeCanvas');
  const ctxShape = canvasShape ? canvasShape.getContext('2d') : null;

  // Initial Data BBS
  let bbsItems = [
    { id: 1, element: 'Balok B1 Utama', shape: '00', D: 22, dimA: 6.0, dimB: 0, qty: 8, concreteM3: 1.36, formworkM2: 9.9 },
    { id: 2, element: 'Sengkang B1', shape: '11', D: 10, dimA: 0.30, dimB: 0.60, qty: 40, concreteM3: 0, formworkM2: 0 },
    { id: 3, element: 'Kolom K1 Utama', shape: '51', D: 25, dimA: 4.2, dimB: 0.60, qty: 8, concreteM3: 1.0, formworkM2: 8.0 },
    { id: 4, element: 'Sengkang K1', shape: '11', D: 12, dimA: 0.45, dimB: 0.45, qty: 35, concreteM3: 0, formworkM2: 0 },
    { id: 5, element: 'Tulangan Tarik Gelagar', shape: '00', D: 28, dimA: 12.0, dimB: 0, qty: 12, concreteM3: 4.5, formworkM2: 24.0 }
  ];

  /**
   * Menghitung panjang potong per batang (cut length L dalam meter)
   */
  function calculateCutLength(shape, A, B, D) {
    const d_m = D / 1000;
    if (shape === '00') {
      // Shape 00: Lurus
      return A;
    } else if (shape === '11') {
      // Shape 11: Sengkang Persegi Tertutup (2A + 2B + 2 hook 135 deg ~ 20*D)
      const hook_m = 20 * d_m;
      return (2 * A) + (2 * B) + hook_m;
    } else if (shape === '51') {
      // Shape 51: Bengkokan L / Angkur (A + B)
      return A + B;
    }
    return A;
  }

  /**
   * Menghitung berat baja standar: BJ = 0.006165 * D^2 * L (kg)
   */
  function calculateBarWeight(D, cutLength, qty) {
    const unitWeight = 0.006165 * Math.pow(D, 2); // kg/m
    return unitWeight * cutLength * qty;
  }

  /**
   * Render Tabel BBS & Hitung MTO + RAB
   */
  function render() {
    if (!elBbsTableBody) return;

    let rowsHtml = '';
    let totalWeightKg = 0;
    let totalConcreteM3 = 0;
    let totalFormworkM2 = 0;

    bbsItems.forEach((item, index) => {
      const cutLength = calculateCutLength(item.shape, item.dimA, item.dimB, item.D);
      const totalLen = cutLength * item.qty;
      const weightKg = calculateBarWeight(item.D, cutLength, item.qty);

      totalWeightKg += weightKg;
      totalConcreteM3 += (item.concreteM3 || 0);
      totalFormworkM2 += (item.formworkM2 || 0);

      let shapeDesc = 'Lurus (00)';
      if (item.shape === '11') shapeDesc = 'Sengkang (11)';
      if (item.shape === '51') shapeDesc = 'Bengkukan L (51)';

      rowsHtml += `
        <tr class="hover:bg-slate-800/40 border-b border-slate-800 text-xs font-mono">
          <td class="py-2.5 px-3 font-sans text-slate-200 font-medium">${item.element}</td>
          <td class="py-2.5 px-3 text-blue-400 font-bold">${shapeDesc}</td>
          <td class="py-2.5 px-3 text-slate-300">D${item.D}</td>
          <td class="py-2.5 px-3 text-slate-300">${cutLength.toFixed(2)} m</td>
          <td class="py-2.5 px-3 text-slate-300">${item.qty} bh</td>
          <td class="py-2.5 px-3 text-slate-400">${totalLen.toFixed(1)} m</td>
          <td class="py-2.5 px-3 text-amber-400 font-bold">${weightKg.toFixed(1)} kg</td>
          <td class="py-2.5 px-3 text-right">
            <button onclick="BBSModule.deleteItem(${item.id})" class="text-rose-400 hover:text-rose-300 font-sans text-[11px] px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all">Hapus</button>
          </td>
        </tr>
      `;
    });

    elBbsTableBody.innerHTML = rowsHtml;

    // Update Totals
    const totalWeightTon = totalWeightKg / 1000;
    if (elTotalWeightKg) elTotalWeightKg.innerText = Math.round(totalWeightKg).toLocaleString('id-ID');
    if (elTotalWeightTon) elTotalWeightTon.innerText = totalWeightTon.toFixed(2);
    if (elTotalConcrete) elTotalConcrete.innerText = totalConcreteM3.toFixed(2);
    if (elTotalFormwork) elTotalFormwork.innerText = totalFormworkM2.toFixed(1);

    // Hitung RAB (Estimasi Biaya)
    const priceConcrete = parseFloat(elPriceConcrete?.value) || 1200000;
    const priceSteel = parseFloat(elPriceSteel?.value) || 16000;
    const priceFormwork = parseFloat(elPriceFormwork?.value) || 190000;

    const costConcrete = totalConcreteM3 * priceConcrete;
    const costSteel = totalWeightKg * priceSteel;
    const costFormwork = totalFormworkM2 * priceFormwork;
    const totalCost = costConcrete + costSteel + costFormwork;

    if (elTotalCost) {
      elTotalCost.innerText = `Rp ${Math.round(totalCost).toLocaleString('id-ID')}`;
    }

    drawShapeSketch();
  }

  /**
   * Visualisasi Sketsa Shape Code pada Canvas Mini
   */
  function drawShapeSketch() {
    if (!ctxShape || !canvasShape) return;

    const shape = elAddShape?.value || '00';
    const rect = canvasShape.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cw = rect.width || 200;
    const ch = rect.height || 120;

    canvasShape.width = cw * dpr;
    canvasShape.height = ch * dpr;
    ctxShape.resetTransform ? ctxShape.resetTransform() : ctxShape.setTransform(1, 0, 0, 1, 0, 0);
    ctxShape.scale(dpr, dpr);

    ctxShape.fillStyle = '#020617';
    ctxShape.fillRect(0, 0, cw, ch);

    ctxShape.strokeStyle = '#f59e0b';
    ctxShape.lineWidth = 3;
    ctxShape.lineCap = 'round';
    ctxShape.lineJoin = 'round';

    ctxShape.font = '10px JetBrains Mono, monospace';
    ctxShape.fillStyle = '#cbd5e1';
    ctxShape.textAlign = 'center';

    if (shape === '00') {
      // Shape 00: Lurus
      ctxShape.beginPath();
      ctxShape.moveTo(25, ch / 2);
      ctxShape.lineTo(cw - 25, ch / 2);
      ctxShape.stroke();
      ctxShape.fillText('Dimensi A (Panjang Lurus)', cw / 2, ch / 2 - 10);
    } else if (shape === '11') {
      // Shape 11: Sengkang Persegi Tertutup
      const boxW = cw * 0.45;
      const boxH = ch * 0.55;
      const ox = (cw - boxW) / 2;
      const oy = (ch - boxH) / 2;

      ctxShape.beginPath();
      ctxShape.strokeRect(ox, oy, boxW, boxH);

      // Kaitan hook 135 deg
      ctxShape.beginPath();
      ctxShape.moveTo(ox, oy);
      ctxShape.lineTo(ox + 12, oy + 12);
      ctxShape.moveTo(ox, oy + 6);
      ctxShape.lineTo(ox + 16, oy - 2);
      ctxShape.stroke();

      ctxShape.fillText('A (Lebar)', ox + boxW / 2, oy - 6);
      ctxShape.save();
      ctxShape.translate(ox - 8, oy + boxH / 2);
      ctxShape.rotate(-Math.PI / 2);
      ctxShape.fillText('B (Tinggi)', 0, 0);
      ctxShape.restore();
    } else if (shape === '51') {
      // Shape 51: Bentuk L
      const ox = 35;
      const oy = 25;
      const w = cw - 70;
      const h = ch - 50;

      ctxShape.beginPath();
      ctxShape.moveTo(ox, oy);
      ctxShape.lineTo(ox, oy + h);
      ctxShape.lineTo(ox + w, oy + h);
      ctxShape.stroke();

      ctxShape.fillText('Dimensi A', ox + w / 2, oy + h + 15);
      ctxShape.save();
      ctxShape.translate(ox - 10, oy + h / 2);
      ctxShape.rotate(-Math.PI / 2);
      ctxShape.fillText('B (Hook)', 0, 0);
      ctxShape.restore();
    }
  }

  function addItem() {
    const element = elAddElem?.value?.trim() || 'Elemen Struktur';
    const shape = elAddShape?.value || '00';
    const D = parseFloat(elAddD?.value) || 16;
    const dimA = Math.max(0.1, parseFloat(elAddDimA?.value) || 1.0);
    const dimB = Math.max(0, parseFloat(elAddDimB?.value) || 0);
    const qty = Math.max(1, parseInt(elAddQty?.value) || 1);

    const newItem = {
      id: Date.now(),
      element,
      shape,
      D,
      dimA,
      dimB,
      qty,
      concreteM3: shape === '00' ? 0.35 : 0,
      formworkM2: shape === '00' ? 2.5 : 0
    };

    bbsItems.push(newItem);
    render();
  }

  function deleteItem(id) {
    bbsItems = bbsItems.filter(item => item.id !== id);
    render();
  }

  function init() {
    if (elBtnAddRow) elBtnAddRow.addEventListener('click', addItem);
    if (elAddShape) elAddShape.addEventListener('change', drawShapeSketch);

    [elPriceConcrete, elPriceSteel, elPriceFormwork].forEach(p => {
      if (p) p.addEventListener('input', render);
    });

    render();
    window.addEventListener('resize', drawShapeSketch);
  }

  return { init, render, addItem, deleteItem, getItems: () => bbsItems };
})();

