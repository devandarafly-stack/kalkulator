# CivilStruct Pro Enterprise - Structural & Bridge Engineering Suite

**CivilStruct Pro Enterprise (v3.0)** adalah aplikasi web interaktif tingkat enterprise (*suite*) untuk analisis dan verifikasi rekayasa struktur bangunan gedung dan jembatan sesuai standar **Standar Nasional Indonesia (SNI)** terkini.

Aplikasi ini ditujukan untuk **Structural Engineer**, konsultan perencana, kontraktor, dan civitas akademika teknik sipil untuk melakukan evaluasi kapasitas elemen beton bertulang, analisis gelagar jembatan, penentuan beban seismik gempa statik ekuivalen, penjadwalan pemotongan tulangan (BBS), estimasi material (MTO/RAB), serta penerbitan lembar perhitungan resmi (*Calculation Sheet*).

---

## 🏛️ Standar Acuan Teknis (Indonesian Codes)
1. **SNI 2847:2019** - *Persyaratan Beton Struktural untuk Bangunan Gedung dan Penjelasan*.
2. **SNI 1725:2016** - *Pembebanan untuk Jembatan*.
3. **SNI 1726:2019** - *Tata Cara Perencanaan Ketahanan Gempa untuk Struktur Bangunan Gedung dan Non-Gedung*.
4. **SNI 1727:2020** - *Beban Desain Minimum dan Kriteria Terkait untuk Bangunan Gedung dan Struktur Lain*.

---

## 🌟 Modul & Fitur Enterprise

### 1. Modul 1: Analisis Balok & Kolom Beton Bertulang (SNI 2847:2019)
- **Kapasitas Lentur Nominal Terfaktor ($\phi M_n$)**:
  - Penentuan faktor reduksi $\phi$ secara dinamis berdasarkan regangan tarik baja ekstrim $\epsilon_t$ (Terkontrol Tarik $\phi = 0.90$, Tekan $\phi = 0.65$, dan Zona Transisi).
  - Kedalaman blok tegangan ekuivalen Whitney ($a$) dan posisi sumbu netral ($c$).
- **Kapasitas Geser Penampang ($\phi V_n$)**:
  - Pengaruh gaya aksial tekan $P_u$ terhadap kekuatan geser beton:
    $$V_c = 0.17 \cdot \left(1 + \frac{P_u \cdot 10^3}{14 A_g}\right) \sqrt{f'_c} \cdot b \cdot d$$
  - Kapasitas sengkang ties dua kaki: $V_s = \frac{A_v \cdot f_y \cdot d}{s}$.
  - Kekuatan geser terfaktor: $\phi V_n = 0.75 \cdot (V_c + V_s)$.
- **Dual Visualizer Canvas**:
  - **Visualizer 1**: Penampang melintang balok/kolom, sengkang ties, titik-titik tulangan longitudinal, arsiran blok Whitney ($a$), sumbu netral ($c$), dan dimensi ukuran.
  - **Visualizer 2**: **Kurva Interaksi P-M Kolom ($\phi P_n - \phi M_n$)** real-time dengan plot titik kerja $(M_u, P_u)$ dan envelope kapasitas batas.

### 2. Modul 2: Analisis Gelagar Jembatan & Pembebanan Truk/Lajur (SNI 1725:2016)
- **Kombinasi Pembebanan Kuat I (Ultimate)**:
  - Beban Mati Sendiri ($MS$), Mati Tambahan ($MA$), Beban Lajur Terbagi Rata ($BTR / q$), dan Beban Garis Terpusat ($BGT / P$).
  - Beban Truk "TT" 500 kN dengan konfigurasi beban gandar terberat.
  - **Faktor Beban Dinamis (FBD / DLA)** otomatis sesuai bentang jembatan $L$:
    - $DLA = 0.40$ (untuk $L \le 50$ m)
    - $DLA = 0.40 - 0.0025 \cdot (L - 50)$ (untuk $50 < L < 90$ m)
    - $DLA = 0.30$ (untuk $L \ge 90$ m)
- **Gaya Dalam & Batas Lendutan**:
  - Momen Maksimum terfaktor $M_u$ dan Geser Maksimum $V_u$.
  - Lendutan aktual midspan ($\delta_{\max}$) kondisi layan (Service I).
  - Kontrol lendutan ijin jembatan lalu lintas: $\delta_{\text{ijin}} = L / 800$.
- **Visualisasi SFD, BMD & Deflection**:
  - Diagram Gaya Geser (SFD) dan Diagram Momen Lentur (BMD) dengan kurva parabola.
  - Profil kurva lendutan balok gelagar.
  - *Interactive cursor hover tooltip* menampilkan nilai $x$, $V(x)$, $M(x)$, dan $\delta(x)$.

### 3. Modul 3: Analisis Iteratif Jembatan Kabel Pancang (Cable-Stayed Bridge - Metode Praktikum UNTIDAR)
- **Parameter Input Interaktif**:
  - Diameter Kabel Utama ($D$) [mm] (Default: 60 mm)
  - Tegangan Ijin Baja Kabel ($\sigma_s$) [MPa] (Default: 160 MPa)
  - Beban Merata Gelagar ($q$) [kN/m'] (Default: 10 kN/m')
  - Sudut Kabel Terluar ($\alpha_1$) [derajat] (Default: 45°)
  - Bentang Utama Tengah ($L_{\text{main}}$) [m] (Default: 450 m)
  - Bentang Tepi Kiri & Kanan ($L_{\text{side}}$) [m] (Default: 225 m)
- **Algoritma Perhitungan Iteratif**:
  - Kapasitas Tarik Ijin Kabel:
    $$P_{\text{kabel}} = \sigma_s \cdot \left[0.25 \cdot \pi \cdot \left(\frac{D}{1000}\right)^2\right] \cdot 1000 \quad [\text{kN}]$$
  - Tinggi Pilar di atas Gelagar:
    $$H_{\text{pilar}} = \tan(\alpha_1) \cdot \left(\frac{L_{\text{main}}}{2}\right) \quad [\text{m}]$$
  - Loop Iterasi Kabel Menuju Pilar ($i = 1, 2, \dots$):
    - $x_1 = L_{\text{main}} / 2$, $\alpha_1 = \text{input}$
    - $x_i = x_{i-1} - \Delta L_{i-1}$
    - $\alpha_i = \arctan(H_{\text{pilar}} / x_i)$
    - Segmen pikul: $\Delta L_i = (P_{\text{kabel}} \cdot \sin \alpha_i) / q \quad [\text{m}]$
    - Panjang kabel: $L_{\text{kabel}, i} = \sqrt{H_{\text{pilar}}^2 + x_i^2} \quad [\text{m}]$
    - Kondisi Berhenti: $x_i < \Delta L_i$ (atau $x_i \le 0$)
  - Total Panjang Kabel:
    - Total 1 Sisi Pylon = $\sum L_{\text{kabel}, i}$
    - Total 4 Sisi Jembatan = $4 \times \text{Total 1 Sisi}$
- **Visualisasi Canvas HTML5 Jembatan 2-Pylon**:
  - 2 Pylon Merah proporsional ($H_{\text{pilar}}$), Gelagar Hijau, Abutment Kuning di kedua ujung bentang, Air Sungai Teal di bawah jembatan, serta kabel-kabel pancang hitam/kontras dari pylon ke titik simpul ($x_i$) di gelagar.
  - Tabel hasil iterasi kabel lengkap per baris.

### 4. Modul 4: Analisis Jembatan Gantung (Suspension Bridge - Metode Praktikum UNTIDAR)
- **Parameter Input Interaktif**:
  - Beban Merata Lantai/Gelagar ($q$) [kN/m'] (Default: 10 kN/m')
  - Panjang Bentang Utama / Tengah ($L$) [m] (Default: 45 m)
  - Lendutan Maksimum / Sag Kabel Utama ($f$) [m] (Default: 9 m)
  - Tegangan Ijin Baja Kabel ($\sigma_s$) [MPa] (Default: 160 MPa)
  - Sudut Kemiringan Kabel Tepi / Backstay ($\alpha$) [derajat] (Default: 45°)
  - Jarak Horizontal Kabel Tepi ke Abutment ($x_{\text{tepi}}$) [m] (Default: 10 m)
  - Tinggi Pilar di atas Gelagar ($h_{\text{pilar}}$) [m] (Default: 10 m)
- **Formulasi & Algoritma Perhitungan**:
  - Rasio Sag: $n = f / L$
  - Gaya Horisontal Kabel: $H = \frac{q \cdot L^2}{8 \cdot f} \quad [\text{kN}]$
  - Gaya Tarik Maksimum Kabel Tengah: $T = H \cdot \sqrt{1 + 16 \cdot n^2} \quad [\text{kN}]$
  - Gaya Tarik Kabel Tepi: $T^* = \frac{H}{\cos(\alpha \cdot \pi / 180)} \quad [\text{kN}]$
  - Dimensi Diameter Kabel (Pembulatan ke atas mm terdekat):
    - Luas & Diameter Kabel Tengah: $A_{\text{tengah}} = \frac{T}{\sigma_s \cdot 1000}$, $d_{\text{tengah}} = \lceil\sqrt{4 A / \pi} \cdot 1000\rceil \quad [\text{mm}]$
    - Luas & Diameter Kabel Tepi: $A_{\text{tepi}} = \frac{T^*}{\sigma_s \cdot 1000}$, $d_{\text{tepi}} = \lceil\sqrt{4 A / \pi} \cdot 1000\rceil \quad [\text{mm}]$
  - Panjang Kabel Total:
    - $L_{\text{tengah}} = L \cdot (1 + \frac{8}{3} n^2) \quad [\text{m}]$
    - $L_{\text{tepi}} = \sqrt{x_{\text{tepi}}^2 + h_{\text{pilar}}^2} \quad [\text{m}]$
    - $L_{\text{total}} = 2 \cdot L_{\text{tepi}} + L_{\text{tengah}} \quad [\text{m}]$
  - Sudut Keseimbangan Kritis: $\alpha_{\text{kritis}} = \arccos(H / T) \cdot \frac{180}{\pi} \quad [\text{derajat}]$
- **Visualisasi Canvas HTML5 Jembatan Gantung**:
  - 2 Pilar Pylon Merah, Kabel Utama Parabolik Putih/Baja ($y = 4f(x/L)(1 - x/L)$), Kabel Tepi Backstay lurus ke Abutment Kuning, Garis Hanger Vertikal ke Gelagar Lantai Hijau, dan Air Sungai Teal dengan efek gelombang.

### 5. Modul 5: Beban Gempa Statik Ekuivalen (SNI 1726:2019)
- **Parameter Spektra Gempa**:
  - Kelas situs tanah ($S_A, S_B, S_C, S_D, S_E, S_F$).
  - Akselerasi batuan dasar $S_s$ (0.2s) dan $S_1$ (1.0s).
  - Koefisien situs $F_a$ dan $F_v$ otomatis (Tabel 5 & 6 SNI).
  - Spektrum desain percepatan: $S_{DS} = \frac{2}{3} F_a S_s$ dan $S_{D1} = \frac{2}{3} F_v S_1$.
  - Kategori Desain Seismik (**KDS A - F**).
- **Gaya Geser Dasar & Distribusi Vertikal**:
  - Periode alami pendekatan $T_a = C_t \cdot h_n^x$.
  - Koefisien respons seismik $C_s$ terpakai dengan batas $C_{s,\max}$ dan $C_{s,\min}$.
  - Geser dasar seismik total $V = C_s \cdot W$.
  - Distribusi vertikal gaya gempa lateral per lantai ($F_x$) dan geser tingkat ($V_x$).
- **Visualisasi Canvas Elevasi Gedung**:
  - Elevasi portal gedung 2D dengan vektor panah horizontal gaya gempa $F_x$ proporsional di setiap lantai.

### 6. Modul 6: Bar Bending Schedule (BBS) & Material Take-Off (MTO / RAB)
- **Perhitungan Berat Baja Tulangan Standar**:
  $$BJ = 0.006165 \cdot D^2 \cdot L \quad (\text{kg})$$
- **Shape Code Internasional**:
  - **Shape 00**: Tulangan Lurus ($L = A$).
  - **Shape 11**: Sengkang Persegi Tertutup ($L = 2A + 2B + 20D$).
  - **Shape 51**: Tulangan Bengkokan L / Angkur ($L = A + B$).
- **Canvas Sketsa Shape**: Tampilan geometri interaktif saat memilih bentuk tulangan.
- **Tabel Rekapitulasi MTO & RAB**:
  - Volume Beton Struktural ($m^3$).
  - Luas Bekisting Permukaan ($m^2$).
  - Berat Total Baja Tulangan (kg & Ton).
  - Kalkulator Estimasi Anggaran Biaya (RAB) berdasarkan harga satuan dinamis.

### 7. Modul 7: Calculation Sheet Generator & Lembar Audit Lengkap
- Audit perhitungan numerik langkah-demi-langkah (*Step-by-Step Numerical Verification*).
- Pemeriksaan batasan limitasi SNI dan tingkat utilitas beban (*Demand/Capacity Ratio*).
- **Lembar Pengesahan & Tanda Tangan**:
  - Disiapkan Oleh: *Structural Engineer* (dengan Nomor Registrasi SKA/PII).
  - Diperiksa Oleh: *Lead Structural Checker*.
  - Disetujui Oleh: *Project Director / Klien*.
- **Cetak Laporan Perhitungan (PDF/Print)**: Dioptimalkan dengan CSS `@media print` sehingga tercetak bersih berlatar putih dengan Kop Dokumen resmi, bebas elemen navigasi web.

### 8. Modul 8: Konverter Satuan & Formularium SNI
- Konverter 2 arah real-time:
  - $\text{MPa} \leftrightarrow \text{kg/cm}^2$
  - $\text{kN} \leftrightarrow \text{Ton force}$
  - $\text{kNm} \leftrightarrow \text{Ton}\cdot\text{m}$
- Bank rumus lengkap SNI 2847:2019, SNI 1725:2016, dan SNI 1726:2019.

---

## 💻 Struktur Folder & File

```
analisa struktur bangunan dan jembatan/
│
├── index.html                   # Antarmuka utama aplikasi, tabs, kop print, & lembar audit
├── css/
│   └── styles.css               # Styling custom, glow status, canvas styling, & CSS @media print
├── js/
│   ├── beam-column.js           # Modul 1: Balok, Kolom, phi dinamis, Geser, Kurva P-M
│   ├── bridge-enterprise.js     # Modul 2: Gelagar Jembatan, Kuat I, Truk 500kN, SFD/BMD, Deflection
│   ├── cable-stayed.js          # Modul 3: Analisis Iteratif Jembatan Kabel Pancang (UNTIDAR)
│   ├── suspension-bridge.js     # Modul 4: Analisis Jembatan Gantung (UNTIDAR)
│   ├── seismic-sni.js           # Modul 5: Gempa Statik Ekuivalen SNI 1726, KDS, Fx, Elevasi Gedung
│   ├── bbs-mto.js               # Modul 6: Bar Bending Schedule, Shape Code, MTO & Estimator RAB
│   ├── calc-sheet.js            # Modul 7: Calculation Sheet Generator, Lembar Audit, & Print Handler
│   ├── converter.js             # Modul 8: Konverter Satuan Interaktif
│   └── app.js                   # Master Controller aplikasi
└── README.md                    # Dokumentasi teknis & panduan penggunaan
```

---

## 🚀 Panduan Menjalankan Aplikasi

Aplikasi dibangun murni menggunakan teknologi web modern (**HTML5 Canvas**, **Tailwind CSS**, **FontAwesome Icons**, **Vanilla JavaScript**) tanpa dependensi *node_modules* yang berat.

1. Buka File Explorer ke folder proyek:
   `D:\DEVAN\APLIKOM\aplikasi\analisa struktur bangunan dan jembatan`
2. Klik ganda file `index.html` untuk langsung membukanya di browser apa pun (Google Chrome, Microsoft Edge, Firefox, Safari).
3. Untuk mencetak atau menyimpan laporan ke PDF, klik tombol **"Cetak Laporan (PDF)"** di pojok kanan atas.
