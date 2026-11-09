/**
 * CivilStruct Pro - Modul 3: Konverter Satuan Interaktif Teknik Sipil
 * Menyediakan konversi dua arah secara real-time antara sistem SI dan Metrik/Teknik.
 */

const ConverterModule = (() => {
  // 1. Tegangan: MPa <-> kg/cm2
  const elMpa = document.getElementById('conv_mpa');
  const elKgcm2 = document.getElementById('conv_kgcm2');

  // Konstanta konversi tegangan
  // 1 MPa = 10^6 N/m^2 = 10^6 / 9.80665 kgf / (10000 cm^2) = 10.197162 kg/cm^2
  const MPA_TO_KGCM2 = 10.197162;

  // 2. Gaya: kN <-> Ton force (tf)
  const elKn = document.getElementById('conv_kn');
  const elTon = document.getElementById('conv_ton');

  // 1 tf = 1000 kgf = 9806.65 N = 9.80665 kN -> 1 kN = 0.1019716 tf
  const KN_TO_TON = 0.1019716;

  // 3. Momen: kNm <-> Ton.m
  const elKnm = document.getElementById('conv_knm');
  const elTonm = document.getElementById('conv_tonm');

  const KNM_TO_TONM = 0.1019716;

  function init() {
    // Handler Tegangan
    if (elMpa && elKgcm2) {
      elMpa.addEventListener('input', () => {
        const val = parseFloat(elMpa.value);
        if (!isNaN(val)) {
          elKgcm2.value = (val * MPA_TO_KGCM2).toFixed(2);
        } else {
          elKgcm2.value = '';
        }
      });

      elKgcm2.addEventListener('input', () => {
        const val = parseFloat(elKgcm2.value);
        if (!isNaN(val)) {
          elMpa.value = (val / MPA_TO_KGCM2).toFixed(2);
        } else {
          elMpa.value = '';
        }
      });
    }

    // Handler Gaya
    if (elKn && elTon) {
      elKn.addEventListener('input', () => {
        const val = parseFloat(elKn.value);
        if (!isNaN(val)) {
          elTon.value = (val * KN_TO_TON).toFixed(3);
        } else {
          elTon.value = '';
        }
      });

      elTon.addEventListener('input', () => {
        const val = parseFloat(elTon.value);
        if (!isNaN(val)) {
          elKn.value = (val / KN_TO_TON).toFixed(2);
        } else {
          elKn.value = '';
        }
      });
    }

    // Handler Momen
    if (elKnm && elTonm) {
      elKnm.addEventListener('input', () => {
        const val = parseFloat(elKnm.value);
        if (!isNaN(val)) {
          elTonm.value = (val * KNM_TO_TONM).toFixed(2);
        } else {
          elTonm.value = '';
        }
      });

      elTonm.addEventListener('input', () => {
        const val = parseFloat(elTonm.value);
        if (!isNaN(val)) {
          elKnm.value = (val / KNM_TO_TONM).toFixed(2);
        } else {
          elKnm.value = '';
        }
      });
    }
  }

  return {
    init
  };
})();

