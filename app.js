// ============================================
//  ROSETTE BOOTH — app.js
//  Tahap 3: Snap + Filter + Frame
// ============================================


// ── REFERENSI ELEMENT ──
const video            = document.getElementById('video');
const noCam            = document.getElementById('no-cam');
const snapBtn          = document.getElementById('btn-snap');
const resetBtn         = document.getElementById('btn-reset');
const shotCounter      = document.getElementById('shot-counter');
const captureCanvas    = document.getElementById('capture-canvas');
const flash            = document.getElementById('flash');
const countdownDisplay = document.getElementById('countdown-display');
const countdownNum     = document.getElementById('countdown-num');
const frameOverlay     = document.getElementById('frame-overlay');


// ── STATE ──
// Semua "kondisi saat ini" app disimpan di sini.
let shots       = [null, null, null];
let currentSlot = 0;
let isShooting  = false;
let activeFilter = 'none';   // filter yang sedang dipilih
let activeFrame  = 'none';   // frame yang sedang dipilih


// ================================================================
//  BAGIAN 1: KAMERA
// ================================================================

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width:  { ideal: 1280 },
        height: { ideal: 720 },
        aspectRatio: { ideal: 16/9 }   // paksa landscape dari awal
      },
      audio: false
    });
    video.srcObject = stream;
    await video.play();
    video.classList.add('active');
    snapBtn.disabled = false;
    console.log('✅ Kamera aktif!');
  } catch (err) {
    console.error('❌ Kamera error:', err.message);
    if (noCam) noCam.classList.add('show');
  }
}


// ================================================================
//  BAGIAN 2: FILTER
//  Cara kerja: ubah CSS filter di element <video>
//  supaya live preview langsung berubah.
//  Saat capture, filter yang sama kita terapkan ke canvas.
// ================================================================

// Daftar semua filter — id harus sama dengan yang ada di HTML
const FILTERS = [
  { id: 'none',  css: 'none' },
  { id: 'mono',  css: 'grayscale(100%)' },
  { id: 'warm',  css: 'sepia(40%) saturate(120%) hue-rotate(-10deg)' },
  { id: 'rose',  css: 'sepia(30%) saturate(140%) hue-rotate(-20deg) brightness(1.05)' },
  { id: 'faded', css: 'contrast(80%) brightness(115%) saturate(70%)' },
  { id: 'vivid', css: 'saturate(180%) contrast(110%)' },
];

function getFilterCSS() {
  // Cari CSS string berdasarkan activeFilter yang sedang dipilih
  const found = FILTERS.find(f => f.id === activeFilter);
  return found ? found.css : 'none';
}

function applyFilter(filterId) {
  activeFilter = filterId;

  // Langsung terapkan ke video supaya live preview berubah
  video.style.filter = getFilterCSS();

  // Update tampilan tombol — hapus .active dari semua, kasih ke yang dipilih
  document.querySelectorAll('.filter-btn').forEach((btn, index) => {
    btn.classList.toggle('active', index === FILTERS.findIndex(f => f.id === filterId));
  });
}

// Pasang event listener ke semua tombol filter
// querySelectorAll() ambil semua element dengan class itu → hasilnya array
document.querySelectorAll('.filter-btn').forEach((btn, index) => {
  btn.addEventListener('click', () => {
    applyFilter(FILTERS[index].id);
  });
});


// ================================================================
//  BAGIAN 3: FRAME
//  Cara kerja: inject SVG ke dalam div #frame-overlay
//  yang posisinya absolute di atas video.
//  SVG pakai preserveAspectRatio="none" supaya stretch ikut ukuran.
// ================================================================

const FRAMES = [
  {
    id: 'none',
    label: 'None',
    svg: ''   // kosong = tidak ada frame
  },
  {
    id: 'petals',
    label: 'Petals',
    // Bunga kecil di tiap sudut
    svg: `<svg width="100%" height="100%" viewBox="0 0 100 56" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <text x="3"  y="9"  font-size="7" opacity="0.6">🌸</text>
      <text x="88" y="9"  font-size="7" opacity="0.6">🌸</text>
      <text x="3"  y="54" font-size="7" opacity="0.6">🌸</text>
      <text x="88" y="54" font-size="7" opacity="0.6">🌸</text>
    </svg>`
  },
  {
    id: 'vine',
    label: 'Vine',
    // Border tipis dengan aksen mawar di sudut
    svg: `<svg width="100%" height="100%" viewBox="0 0 100 56" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="96" height="52" rx="1" fill="none" stroke="rgba(192,72,90,0.5)" stroke-width="0.8"/>
      <rect x="4" y="4" width="92" height="48" rx="1" fill="none" stroke="rgba(192,72,90,0.2)" stroke-width="0.4"/>
      <circle cx="2"  cy="2"  r="1.5" fill="rgba(192,72,90,0.6)"/>
      <circle cx="98" cy="2"  r="1.5" fill="rgba(192,72,90,0.6)"/>
      <circle cx="2"  cy="54" r="1.5" fill="rgba(192,72,90,0.6)"/>
      <circle cx="98" cy="54" r="1.5" fill="rgba(192,72,90,0.6)"/>
    </svg>`
  },
  {
    id: 'dots',
    label: 'Dots',
    // Border titik-titik
    svg: `<svg width="100%" height="100%" viewBox="0 0 100 56" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="96" height="52" rx="2" fill="none"
        stroke="rgba(192,72,90,0.5)" stroke-width="1"
        stroke-dasharray="2 3"/>
    </svg>`
  },
  {
    id: 'arch',
    label: 'Arch',
    // Lengkungan dekoratif atas dan bawah
    svg: `<svg width="100%" height="100%" viewBox="0 0 100 56" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10,4 Q50,-2 90,4" fill="none" stroke="rgba(192,72,90,0.6)" stroke-width="0.8"/>
      <path d="M10,52 Q50,58 90,52" fill="none" stroke="rgba(192,72,90,0.6)" stroke-width="0.8"/>
      <text x="48" y="7"  font-size="4" text-anchor="middle" opacity="0.5">🌹</text>
      <text x="48" y="55" font-size="4" text-anchor="middle" opacity="0.5">🌹</text>
    </svg>`
  },
  {
    id: 'lace',
    label: 'Lace',
    // Border double klasik
    svg: `<svg width="100%" height="100%" viewBox="0 0 100 56" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1.5" y="1.5" width="97" height="53" rx="0" fill="none" stroke="rgba(192,72,90,0.6)" stroke-width="0.6"/>
      <rect x="4"   y="4"   width="92" height="48" rx="0" fill="none" stroke="rgba(192,72,90,0.4)" stroke-width="0.4"/>
      <line x1="1.5" y1="8"  x2="4"   y2="8"  stroke="rgba(192,72,90,0.4)" stroke-width="0.4"/>
      <line x1="1.5" y1="48" x2="4"   y2="48" stroke="rgba(192,72,90,0.4)" stroke-width="0.4"/>
      <line x1="95.5" y1="8"  x2="98.5" y2="8"  stroke="rgba(192,72,90,0.4)" stroke-width="0.4"/>
      <line x1="95.5" y1="48" x2="98.5" y2="48" stroke="rgba(192,72,90,0.4)" stroke-width="0.4"/>
    </svg>`
  },
];

function applyFrame(frameId) {
  activeFrame = frameId;

  // Cari frame yang dipilih lalu inject SVG-nya ke overlay
  const found = FRAMES.find(f => f.id === frameId);
  frameOverlay.innerHTML = found ? found.svg : '';

  // Update tampilan tombol
  document.querySelectorAll('.frame-btn').forEach((btn, index) => {
    btn.classList.toggle('active', index === FRAMES.findIndex(f => f.id === frameId));
  });
}

// Pasang event listener ke semua tombol frame
document.querySelectorAll('.frame-btn').forEach((btn, index) => {
  btn.addEventListener('click', () => {
    applyFrame(FRAMES[index].id);
  });
});


// ================================================================
//  BAGIAN 4: SNAP — COUNTDOWN → CAPTURE
// ================================================================

// Countdown rekursif: 3 → 2 → 1 → 0 → panggil callback
function countdown(n, onDone) {
  countdownDisplay.classList.add('active');
  countdownNum.textContent = n;

  // Reset animasi CSS biar angka "pop" tiap ganti
  countdownNum.style.animation = 'none';
  void countdownNum.offsetWidth;  // paksa browser reflow
  countdownNum.style.animation = '';

  if (n <= 0) {
    countdownDisplay.classList.remove('active');
    onDone();
    return;
  }
  setTimeout(() => countdown(n - 1, onDone), 1000);
}

function takePhoto() {
  // Efek flash
  flash.className = 'flash go';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    flash.className = 'flash fade';
  }));

  // Ambil dimensi asli video stream
  let W = video.videoWidth;
  let H = video.videoHeight;

  // Fallback kalau stream belum siap (mobile kadang 0x0)
  if (!W || !H) {
    W = video.clientWidth  || 1280;
    H = video.clientHeight || 720;
  }

  // Gunakan dimensi video stream apa adanya — JANGAN rotate manual
  // Browser/OS sudah handle orientasi lewat stream,
  // rotate manual justru bikin miring di Vercel/production
  captureCanvas.width  = W;
  captureCanvas.height = H;

  const ctx = captureCanvas.getContext('2d');
  ctx.filter = getFilterCSS();

  // Mirror horizontal saja (selfie feel) — tanpa rotate
  ctx.save();
  ctx.translate(W, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, W, H);
  ctx.restore();

  ctx.filter = 'none';

  // Ambil hasil sebagai dataURL
  // Kalau masih portrait (H > W) — normalize ke landscape
  let dataURL;
  const finalW = captureCanvas.width;
  const finalH = captureCanvas.height;

  if (finalH > finalW) {
    // Buat canvas landscape baru (swap dimensi)
    const rotCanvas    = document.createElement('canvas');
    rotCanvas.width    = finalH;
    rotCanvas.height   = finalW;
    const rotCtx       = rotCanvas.getContext('2d');
    // Rotate -90° (counter-clockwise) supaya portrait → landscape
    rotCtx.translate(finalH / 2, finalW / 2);
    rotCtx.rotate(-Math.PI / 2);
    rotCtx.drawImage(captureCanvas, -finalW / 2, -finalH / 2);
    dataURL = rotCanvas.toDataURL('image/jpeg', 0.92);
  } else {
    dataURL = captureCanvas.toDataURL('image/jpeg', 0.92);
  }

  // Simpan ke array dan tampilkan di slot
  shots[currentSlot] = dataURL;
  fillSlot(currentSlot, dataURL);

  currentSlot++;
  shotCounter.textContent = `${currentSlot} / 3`;
  isShooting = false;

  if (currentSlot < 3) {
    snapBtn.disabled = false;
  } else {
    snapBtn.disabled = true;
    snapBtn.textContent = '🌹 Done!';
    console.log('✅ 3 foto siap!');
    buildStrip();
  }
}


// ── Event listener tombol Snap ──
snapBtn.addEventListener('click', () => {
  if (isShooting || currentSlot >= 3) return;
  isShooting = true;
  snapBtn.disabled = true;
  countdown(3, takePhoto);
});


// ================================================================
//  BAGIAN 5: SLOT & RETAKE
// ================================================================

function fillSlot(idx, dataURL) {
  const slot = document.getElementById(`slot-${idx}`);
  slot.classList.add('filled');
  slot.innerHTML = '';

  const img = document.createElement('img');
  img.src = dataURL;
  slot.appendChild(img);

  // Tombol retake kecil
  const retakeBtn = document.createElement('button');
  retakeBtn.className   = 'slot-retake';
  retakeBtn.textContent = 'retake';
  retakeBtn.addEventListener('click', () => retakeSlot(idx));
  slot.appendChild(retakeBtn);
}

function retakeSlot(idx) {
  // Hapus foto di slot ini dan semua slot setelahnya
  for (let i = idx; i < 3; i++) {
    shots[i] = null;
    const slot = document.getElementById(`slot-${i}`);
    slot.classList.remove('filled');
    slot.innerHTML = `<span class="slot-num">0${i + 1}</span>`;
  }
  currentSlot = idx;
  shotCounter.textContent = `${currentSlot} / 3`;
  snapBtn.disabled  = false;
  snapBtn.textContent = '🌹 Snap';
}


// ── Tombol Reset ──
resetBtn.addEventListener('click', () => {
  shots       = [null, null, null];
  currentSlot = 0;
  isShooting  = false;
  shotCounter.textContent = '0 / 3';
  snapBtn.disabled        = false;
  snapBtn.textContent     = '🌹 Snap';
  for (let i = 0; i < 3; i++) {
    const slot = document.getElementById(`slot-${i}`);
    slot.classList.remove('filled');
    slot.innerHTML = `<span class="slot-num">0${i + 1}</span>`;
  }
});


// ================================================================
//  JALANKAN
// ================================================================
startCamera();


// ================================================================
//  BAGIAN 6: BUILD STRIP & DOWNLOAD
// ================================================================

const stripPreviewCanvas = document.getElementById('strip-preview-canvas');
const previewHint        = document.querySelector('.preview-hint');
const btnDownload        = document.getElementById('btn-download');

// Helper: object-fit cover untuk canvas
// Crop tengah supaya tidak gepeng/stretch
function drawImageCover(ctx, img, dx, dy, dw, dh) {
  const srcW     = img.naturalWidth  || img.width;
  const srcH     = img.naturalHeight || img.height;
  const srcRatio = srcW / srcH;
  const dstRatio = dw / dh;
  let sx, sy, sw, sh;

  if (srcRatio > dstRatio) {
    // Gambar lebih lebar — crop kiri-kanan, center horizontal
    sh = srcH;
    sw = srcH * dstRatio;
    sx = (srcW - sw) / 2;
    sy = 0;
  } else {
    // Gambar lebih tinggi — crop atas-bawah, center vertical
    sw = srcW;
    sh = srcW / dstRatio;
    sx = 0;
    sy = (srcH - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

async function buildStrip() {
  const PAD     = 20;
  const STRIP_W = 840;

  // Load semua foto dulu supaya bisa baca dimensi aslinya
  const images = await Promise.all(shots.map(src => new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  })));

  // Tentukan rasio slot dari foto pertama
  // — pakai rasio asli supaya tidak ada crop paksa
  const firstW   = images[0].naturalWidth  || images[0].width  || 1280;
  const firstH   = images[0].naturalHeight || images[0].height || 720;
  const ratio    = firstW / firstH;
  const PHOTO_W  = STRIP_W - PAD * 2;
  const PHOTO_H  = Math.round(PHOTO_W / ratio);   // tinggi ikut rasio foto asli

  const STRIP_H  = PHOTO_H * 3 + PAD * 4;

  stripPreviewCanvas.width  = STRIP_W;
  stripPreviewCanvas.height = STRIP_H;

  const ctx = stripPreviewCanvas.getContext('2d');

  // Background strip
  ctx.fillStyle = '#fdf6f0';
  ctx.fillRect(0, 0, STRIP_W, STRIP_H);

  // Gambar tiap foto — cover crop supaya proporsional
  for (let i = 0; i < 3; i++) {
    const y = PAD + i * (PHOTO_H + PAD);
    drawImageCover(ctx, images[i], PAD, y, PHOTO_W, PHOTO_H);
  }

  // Render frame aktif di atas tiap foto
  const frameData = FRAMES.find(f => f.id === activeFrame);
  if (frameData && frameData.svg) {
    for (let i = 0; i < 3; i++) {
      const y = PAD + i * (PHOTO_H + PAD);
      const svgFull = `<svg xmlns="http://www.w3.org/2000/svg" width="${PHOTO_W}" height="${PHOTO_H}" viewBox="0 0 100 56" preserveAspectRatio="none">${frameData.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</svg>`;
      const blob   = new Blob([svgFull], { type: 'image/svg+xml' });
      const url    = URL.createObjectURL(blob);
      const svgImg = new Image();
      svgImg.src   = url;
      await new Promise(resolve => {
        svgImg.onload = () => {
          ctx.drawImage(svgImg, PAD, y, PHOTO_W, PHOTO_H);
          URL.revokeObjectURL(url);
          resolve();
        };
        svgImg.onerror = resolve; // skip kalau gagal
      });
    }
  }

  // Label bawah strip
  ctx.fillStyle = '#9a7a7a';
  ctx.font      = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('rosette booth 🌹', STRIP_W / 2, STRIP_H - 6);

  // Aktifkan tombol download
  if (previewHint) previewHint.style.display = 'none';
  btnDownload.disabled = false;
  console.log('✅ Strip siap!');
}

function downloadStrip() {
  const dataURL = stripPreviewCanvas.toDataURL('image/png');
  const now     = new Date();
  const ts      = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
  const a       = document.createElement('a');
  a.href        = dataURL;
  a.download    = `rosette-booth_${ts}.png`;
  a.click();
}

btnDownload.addEventListener('click', downloadStrip);

// Reset bersihkan strip preview juga
resetBtn.addEventListener('click', () => {
  stripPreviewCanvas.width  = 0;
  stripPreviewCanvas.height = 0;
  if (previewHint) previewHint.style.display = '';
  btnDownload.disabled = true;
});