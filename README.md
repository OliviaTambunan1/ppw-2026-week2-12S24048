# Portofolio Web — Olivia Tambunan (12S24048)

Tugas Mandiri Minggu 3 — Mata Kuliah Pemrograman dan Pengujian Aplikasi Web (12S3101)
Program Studi S1 Sistem Informasi, Institut Teknologi Del
Dosen Pengampu: Chandro Pardede, S.Kom., M.Sc.

## Identitas Pengembang

| Atribut       | Keterangan             |
| ------------- | ---------------------- |
| Nama          | Olivia Tambunan        |
| NIM           | 12S24048               |
| Kelas         | 13 SI                  |
| Program Studi | S1 Sistem Informasi    |
| Institusi     | Institut Teknologi Del |

## Live Demo

GitHub Pages: https://oliviatambunan1.github.io/ppw-2026-week2-12S24048/

## Minggu 4 — Pemodelan Arsitektur Web

### Diagram C4 Container

Diagram berikut memetakan batas browser, penyedia berkas statis, CDN, penyedia data JSON, dan REST API. Berkas JSON proyek, profil, dan layanan merupakan sumber data statis yang disajikan oleh host yang sama dengan aplikasi; sumber tersebut bukan server basis data terpisah.

```mermaid
flowchart LR
    pengunjung["Pengunjung"]

    subgraph browser["Peramban — Presentation Tier"]
        ui["index.html<br/>Antarmuka HTML5 dan Bootstrap"]
        style["css/custom-style.css<br/>Gaya kustom"]
        app["js/app.js<br/>Render CSR, filter, modal,<br/>state UI, dan formulir"]
        service["js/api-service.js<br/>Akses data dan pengiriman HTTP"]
        ui --> app
        style -. "mengatur tampilan" .-> ui
        app --> service
    end

    subgraph hosting["GitHub Pages — Static Server"]
        shell["Shell HTML, CSS, dan JavaScript"]
        data["JSON Providers<br/>data/profile.json<br/>data/projects.json<br/>data/services.json"]
    end

    cdn["CDN<br/>Bootstrap 5.3 dan aset antarmuka"]
    rest["REST API mock<br/>JSONPlaceholder"]

    pengunjung -->|"menggunakan"| ui
    browser -->|"GET berkas aplikasi"| shell
    service -->|"GET data JSON"| data
    browser -->|"memuat dependensi antarmuka"| cdn
    service -->|"POST JSON formulir layanan"| rest
```

### Tanggung Jawab dan Aliran Data

| Komponen | Lapisan | Tanggung jawab |
|---|---|---|
| Peramban (`index.html`, `css/custom-style.css`, `js/app.js`) | Presentation Tier | Menyajikan antarmuka, mengelola interaksi dan filter, merender kartu serta modal secara dinamis, dan menampilkan state UI. |
| `js/api-service.js` | Application / Service Logic Tier | Mengisolasi pemanggilan HTTP, membaca sumber JSON, memeriksa respons, dan mengirim payload formulir ke REST API. |
| GitHub Pages | Static Server | Mengirim shell aplikasi dan berkas statis melalui HTTP(S); tidak menjalankan logika aplikasi sisi server. |
| `data/*.json` di GitHub Pages | JSON Provider | Menyediakan data profil, proyek, dan paket layanan sebagai berkas terstruktur yang dibaca peramban. |
| CDN Bootstrap | CDN | Menyediakan aset Bootstrap yang dirujuk oleh halaman; kegagalan akses CDN dapat memengaruhi gaya atau komponen Bootstrap. |
| JSONPlaceholder | REST API eksternal (mock) | Menerima POST formulir untuk demonstrasi request jaringan; endpoint publik ini bukan penyimpanan pesanan produksi. |

Alur baca dimulai saat peramban meminta shell aplikasi dari host statis. JavaScript pada Presentation Tier kemudian meminta berkas JSON melalui `api-service.js`; `app.js` mengubah data yang diterima menjadi elemen antarmuka di sisi klien. Alur kirim formulir berbeda: `api-service.js` mengirim payload JSON dengan HTTP POST ke endpoint mock JSONPlaceholder dan antarmuka menampilkan hasilnya tanpa navigasi ulang. Penyimpanan status/pesanan lokal yang akan digunakan antarmuka berada di sisi klien (`localStorage`), bukan di GitHub Pages atau endpoint mock.

Pemisahan ini menerapkan *Separation of Concerns*: HTML dan CSS menangani presentasi, `app.js` menangani kontrol interaksi dan render, `api-service.js` menjadi batas akses jaringan, berkas JSON menyimpan konten terstruktur, dan layanan REST mock menangani demonstrasi request. Dengan batas ini, sumber data atau endpoint dapat diganti tanpa menanam ulang konten proyek ke dalam markup kartu. Karena berkas JSON dan aplikasi sama-sama statis, model ini tidak menyediakan autentikasi, validasi bisnis tepercaya, maupun penyimpanan pesanan sisi server.

### Perbandingan Paradigma Rendering

| Paradigma | Tempat render utama | Implikasi pada aplikasi ini |
|---|---|---|
| SSR (Server-Side Rendering) | Server aplikasi merangkai HTML untuk setiap request. | Membutuhkan server runtime dan logika render sisi server; tidak menjadi pilihan untuk hosting statis GitHub Pages. |
| CSR (Client-Side Rendering) | Peramban merangkai UI menggunakan JavaScript dan data yang diminta asinkron. | Dipakai untuk mengisi kartu proyek, menerapkan filter, dan memperbarui state UI tanpa *full page reload*. Shell awal ringan, tetapi render data bergantung pada JavaScript dan request JSON. |
| Jamstack / decoupled static | Aset statis disajikan dari CDN/hosting statis; interaksi dinamis menggunakan API. | Sesuai dengan GitHub Pages, JSON statis, dan request REST mock. Tidak memerlukan server aplikasi khusus, tetapi kemampuan backend dan persistensi produksi tidak disediakan oleh mock tersebut. |

### Perbandingan Sebelum dan Sesudah Refactoring Minggu 4

| Aspek | Sebelum (Minggu 3) | Sesudah (Minggu 4) |
|---|---|---|
| Sumber data portofolio | Konten proyek dan katalog layanan berada di halaman statis. | Profil, proyek, dan layanan dibaca dari `data/profile.json`, `data/projects.json`, dan `data/services.json`. |
| Render proyek | Kartu proyek ditulis pada HTML. | Kartu dirender di browser setelah data proyek dimuat asinkron melalui `api-service.js`. |
| Detail proyek | Modal terpisah untuk masing-masing proyek. | Satu modal universal diisi berdasarkan ID proyek dan dibuka melalui Bootstrap Modal API. |
| Formulir layanan | Formulir belum mengirim payload melalui REST API. | Formulir mengirim JSON dengan HTTP POST ke JSONPlaceholder tanpa navigasi ulang; salinan state pesanan disimpan di `localStorage`. |
| Hosting dan persistensi | Halaman statis. | Tetap menggunakan hosting statis; JSONPlaceholder adalah API mock dan `localStorage` hanya menyimpan pesanan di perangkat/peramban pengguna. |

### Profil Jaringan dengan DevTools

Isi tabel berikut berdasarkan pengamatan nyata di tab **Network** DevTools pada deployment yang diuji. Untuk *Cold Load*, mulai dengan cache nonaktif di DevTools lalu muat ulang. Untuk *Warm Load*, aktifkan cache dan muat ulang halaman setelah aset sempat dimuat. Catat nilai yang benar-benar terlihat; status `304 Not Modified` hanya dicatat bila muncul pada respons aktual.

| Pengukuran | Cold Load | Warm Load |
|---|---|---|
| Status HTTP dokumen utama | [ISI DARI DEVTOOLS] | [ISI DARI DEVTOOLS] |
| Status HTTP `data/projects.json` | [ISI DARI DEVTOOLS] | [ISI DARI DEVTOOLS] |
| Status HTTP `data/profile.json` dan `data/services.json` | [ISI DARI DEVTOOLS] | [ISI DARI DEVTOOLS] |
| Ukuran transfer | [ISI DARI DEVTOOLS] | [ISI DARI DEVTOOLS] |
| TTFB | [ISI DARI DEVTOOLS] | [ISI DARI DEVTOOLS] |
| FCP | [ISI DARI DEVTOOLS] | [ISI DARI DEVTOOLS] |
| Respons `304 Not Modified` (resource dan status aktual) | [ISI DARI DEVTOOLS] | [ISI DARI DEVTOOLS] |

**Analisis cache:** [JELASKAN PERBEDAAN COLD LOAD DAN WARM LOAD BERDASARKAN HASIL DEVTOOLS. JIKA TIDAK ADA RESPONS 304, CATAT STATUS YANG TERAMATI; JANGAN MENGASUMSIKAN 304.]

**Screenshot waterfall Network DevTools:** [LAMPIRKAN SCREENSHOT WATERFALL DARI DEVTOOLS DI SINI]

## Ringkasan Pembaruan Minggu 3

Proyek portofolio dari Minggu 2 (HTML5 semantik + CSS3 murni) direfaktor total menggunakan
Bootstrap 5.3.3 yang dipadukan dengan Custom CSS Overrides, tanpa menghilangkan struktur
semantik HTML5 yang sudah dibangun sebelumnya. Pembaruan utama meliputi:

- Integrasi Bootstrap 5.3.3 CDN (CSS & JS Bundle) + Bootstrap Icons, dimuat sebelum style.css kustom.
- Responsive Navbar sticky-top dengan brand identity dan hamburger toggle (navbar-toggler + collapse).
- Hero Section dua kolom (Bootstrap Grid) dengan kartu profil dan dua tombol CTA.
- Grid Portofolio 12-kolom (row-cols-1 row-cols-md-2 row-cols-lg-3 g-4) berisi 4 kartu proyek,
  masing-masing terhubung ke Bootstrap Modal dengan konten detail berbeda.
- Formulir Layanan dimodernisasi dengan Floating Labels, Input Group berikon, select,
  radio, checkbox, serta umpan balik validasi visual (valid-feedback / invalid-feedback).
- CSS Custom Properties pada :root (11 variabel: warna, font, shadow, transisi) untuk tema
  personal yang konsisten, dipadukan dengan Advanced Selectors (>, ~, :hover, :focus-visible,
  :focus-within, :nth-child(), :is(), :not()) — tanpa satupun !important.

## Perbandingan: Sebelum vs Sesudah Integrasi Framework

| Aspek         | Sebelum (Minggu 2 — CSS Murni)                      | Sesudah (Minggu 3 — Bootstrap 5)                                                              |
| ------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| CSS Framework | Tidak ada, seluruh gaya ditulis manual di style.css | Bootstrap 5.3.3 (CDN) + Bootstrap Icons, di-override dengan style.css kustom                  |
| Sistem Grid   | CSS Grid manual (grid-template-columns)             | Grid 12-kolom Bootstrap (row-cols-1 row-cols-md-2 row-cols-lg-3)                              |
| Navigasi      | Nav statis tanpa menu mobile                        | Navbar sticky-top dengan hamburger toggle (navbar-toggler + collapse) responsif               |
| Detail Proyek | Tidak ada tampilan detail, hanya kartu statis       | Bootstrap Modal Dialog interaktif per proyek (4 modal berbeda)                                |
| Formulir      | Input polos dengan label di atas input              | Floating Labels (.form-floating), Input Group berikon, validasi visual valid/invalid-feedback |
| Ikon          | Tidak ada ikon                                      | Bootstrap Icons pada tombol, navbar, dan form                                                 |
| Variabel Tema | Warna ditulis langsung (hex berulang)               | 11 CSS Custom Properties di :root (warna, font, shadow, transisi terpusat)                    |
| Selector CSS  | Selector dasar (class & element)                    | Advanced selectors: combinator > ~, :nth-child(), :focus-within, :is(), :not()                |
| Responsivitas | 1 breakpoint (@media max-width: 768px)              | Multi-breakpoint bawaan Bootstrap (sm, md, lg, xl) + custom media query                       |

## Teknologi

- HTML5 semantik (header, nav, main, section, article, aside, footer)
- Bootstrap 5.3.3 (CDN) + Bootstrap Icons 1.11.3
- CSS3 kustom: Custom Properties, Advanced Selectors, Flexbox, Grid, Media Queries
- Google Fonts: Playfair Display & Plus Jakarta Sans
- Git & GitHub Pages

## Struktur Proyek

ppw-2026-week2-12S24048/
├── index.html
├── css/
│   └── custom-style.css
├── data/
│   ├── profile.json
│   ├── projects.json
│   └── services.json
├── img/
│   ├── jexpress.svg
│   ├── lost-and-found.svg
│   ├── temani.svg
│   └── the-kit-co.svg
├── js/
│   ├── api-service.js
│   └── app.js
├── screenshot/
│ └── desktop.png
└── README.md

## Screenshot

![Tampilan Desktop](screenshot/desktop.png)

## Menjalankan Secara Lokal

```bash
git clone https://github.com/oliviatambunan1/ppw-2026-week2-12S24048.git
cd ppw-2026-week2-12S24048
git checkout week4-architecture
```

Jalankan proyek melalui server lokal seperti ekstensi Live Server di VS Code agar permintaan Fetch ke berkas JSON dapat diuji melalui HTTP.

## Penulis

Olivia Tambunan (12S24048) — S1 Sistem Informasi, Institut Teknologi Del
