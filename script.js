/* ═══════════════════════════════════════════════════════
   AYA İLK TEMAS  —  Scene Controller v2
   ═══════════════════════════════════════════════════════
   Akış: Intro Video → Quiz Paneli → Ana İçerik
   ═══════════════════════════════════════════════════════ */

// ── Yıldızlı Arka Plan ─────────────────────────────────
(function initStars() {
  const canvas = document.getElementById('starsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  const STAR_COUNT = 220;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    generateStars();
  }

  function generateStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.4 + 0.3,
        alpha: Math.random(),
        speed: Math.random() * 0.005 + 0.002,
        dir: Math.random() > 0.5 ? 1 : -1,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach((s) => {
      s.alpha += s.speed * s.dir;
      if (s.alpha >= 1) { s.alpha = 1; s.dir = -1; }
      if (s.alpha <= 0.1) { s.alpha = 0.1; s.dir = 1; }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
})();


// ── DOM Referansları ────────────────────────────────────
const $ = (id) => document.getElementById(id);

const introScreen = $('introScreen');
const introVideo = $('introVideo');
const introFallback = $('introFallback');
const introLoaderBar = $('introLoaderBar');
const btnSkipIntro = $('btnSkipIntro');
const quizScreen = $('quizScreen');
const quizOptions = $('quizOptions');
const quizFeedbackW = $('quizFeedbackWrong');
const quizQuestionArea = $('quizQuestionArea');
const quizBio = $('quizBio');
const btnEnter = $('btnEnter');
const mainContent = $('mainContent');


// ═══════════════════════════════════════════════════════
// BÖLÜM 1: INTRO VIDEO / ANIMASYON
// ═══════════════════════════════════════════════════════

const INTRO_DURATION = 5000; // 5 saniye (video yoksa fallback süresi)
let introTimer = null;

function startIntro() {
  // Video kaynağı var mı kontrol et
  const hasVideo = introVideo.querySelector('source') !== null
    || introVideo.src !== '';

  if (hasVideo) {
    // Gerçek video varsa: video bitince quiz'e geç
    introFallback.classList.add('hidden');
    introVideo.play().catch(() => { });
    introVideo.addEventListener('ended', endIntro, { once: true });
  } else {
    // Video yoksa: animasyonlu fallback göster
    introVideo.style.display = 'none';
    animateLoaderBar();
    introTimer = setTimeout(endIntro, INTRO_DURATION);
  }
}

function animateLoaderBar() {
  let progress = 0;
  const interval = setInterval(() => {
    progress += 2;
    introLoaderBar.style.width = progress + '%';
    if (progress >= 100) clearInterval(interval);
  }, INTRO_DURATION / 50);
}

function endIntro() {
  clearTimeout(introTimer);
  // Fade-out intro
  introScreen.style.animation = 'fadeOut 0.6s ease forwards';
  introScreen.addEventListener('animationend', () => {
    introScreen.classList.add('hidden');
    showQuiz();
  }, { once: true });
}

// Atla butonu
btnSkipIntro.addEventListener('click', () => {
  introVideo.pause();
  endIntro();
});

// Sayfa yüklenince intro başlat
window.addEventListener('DOMContentLoaded', startIntro);


// ═══════════════════════════════════════════════════════
// BÖLÜM 2: QUIZ PANELİ
// ═══════════════════════════════════════════════════════

const CORRECT_ANSWER = 'alper';

function showQuiz() {
  quizScreen.classList.remove('hidden');
}

// Seçenek tıklama
quizOptions.addEventListener('click', (e) => {
  const btn = e.target.closest('.quiz-option');
  if (!btn || btn.classList.contains('disabled')) return;

  const answer = btn.dataset.answer;

  // Önceki durumları temizle
  clearOptionStates();

  if (answer === CORRECT_ANSWER) {
    handleCorrectAnswer(btn);
  } else {
    handleWrongAnswer(btn);
  }
});

function clearOptionStates() {
  document.querySelectorAll('.quiz-option').forEach((opt) => {
    opt.classList.remove('wrong');
  });
  quizFeedbackW.classList.add('hidden');
}

function handleCorrectAnswer(btn) {
  // Doğru seçeneği işaretle
  btn.classList.add('correct');
  btn.querySelector('.option-icon').textContent = '✓';

  // Diğer seçenekleri devre dışı bırak
  document.querySelectorAll('.quiz-option').forEach((opt) => {
    if (opt !== btn) opt.classList.add('disabled');
  });

  // Soru alanını küçült, bio'yu göster
  setTimeout(() => {
    quizQuestionArea.style.transition = 'opacity 0.4s ease';
    quizQuestionArea.style.opacity = '0.6';
    quizQuestionArea.style.pointerEvents = 'none';
    quizBio.classList.remove('hidden');

    // Paneli bio kartına kaydır
    quizBio.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 500);
}

function handleWrongAnswer(btn) {
  btn.classList.add('wrong');
  btn.querySelector('.option-icon').textContent = '✗';

  // Uyarı göster
  quizFeedbackW.classList.remove('hidden');

  // 1.5 saniye sonra wrong durumunu temizle
  setTimeout(() => {
    btn.classList.remove('wrong');
    btn.querySelector('.option-icon').textContent = '';
    quizFeedbackW.classList.add('hidden');
  }, 1800);
}


// ═══════════════════════════════════════════════════════
// BÖLÜM 3: İÇERİ GİR → ANA İÇERİK
// ═══════════════════════════════════════════════════════

btnEnter.addEventListener('click', () => {
  quizScreen.style.animation = 'fadeOut 0.6s ease forwards';
  quizScreen.addEventListener('animationend', () => {
    quizScreen.classList.add('hidden');
    mainContent.classList.remove('hidden');
    sahneMotorunu_Baslat();
  }, { once: true });
});


// ═══════════════════════════════════════════════════════
// BÖLÜM 4: SAHNE YÖNETİM SİSTEMİ  v3
// ═══════════════════════════════════════════════════════
//
// Her sahne bir video dosyası içerir. Video oynarken
// belirlenen saniyelerde (durak noktaları) otomatik durur,
// bilgi kartı ekrana gelir. Kullanıcı butona basınca
// video kaldığı yerden devam eder.

// ── Sahne Verileri Dizisi ───────────────────────────────
const sahneler = [
  {
    id: 1,
    videoDosyasi: '',                     // 'assets/sahne-01.mp4'
    badge: 'Giriş',
    baslik: 'Yolculuk Başlıyor',
    aciklama: 'Türkiye Uzay Ajansı\'nın tarihi Ay görevine hoş geldin. Bu interaktif deneyimde Apollo çağından ilham alan ve geleceğe uzanan bir hikâyeye tanık olacaksın.',
    meta: ['⏱ 2 dk', '🎧 Kulaklık Önerilir'],

    // Durak noktaları — video bu saniyelerde otomatik durur
    durakNoktalari: [
      {
        durmaSaniyesi: 2,
        bilgiMetni: 'TUA\'nın Ay görevine hoş geldin. Bu yolculukta seni tarihi anlar bekliyor.',
        butonYazisi: 'Hazırım, Devam Et',
        bilgiKarti: null,
      },
    ],
  },
  {
    id: 2,
    videoDosyasi: '',                     // 'assets/sahne-02.mp4'
    badge: 'Hazırlık',
    baslik: 'Fırlatma Öncesi',
    aciklama: 'Mürettebat son kontrollerini yapıyor. Roket fırlatma rampasında, geri sayım başladı.',
    meta: ['🚀 T-10 dakika', '📡 Telemetri aktif'],

    durakNoktalari: [
      {
        durmaSaniyesi: 2,
        bilgiMetni: 'Mürettebat koltuk kemerlerini bağladı. Son sistem kontrolü devam ediyor.',
        butonYazisi: 'Kontrolü Onayla',
        bilgiKarti: {
          konum: 'sag',
          buyuk: true,
          etiket: 'Vizyon',
          baslik: 'Türkiye Uzay Ajansı (TUA)',
          metin: 'Türkiye Uzay Ajansı, ülkemizin uzay alanındaki dağınık faaliyetlerini tek bir stratejik merkezden yönetmek ve küresel uzay yarışında Türkiye’yi \'oyun kurucu\' bir güç haline getirmek amacıyla kurulmuştur. TUA’nın misyonu, sadece bir roket fırlatmanın ötesinde; kendi fırlatma sistemlerine ve uydu teknolojilerine sahip, tam bağımsız bir Türkiye ekosistemi inşa etmektir. Bu vizyonun Türkiye’nin geleceğine katkısı ise çok boyutludur: Bir yandan uzay ekonomisinden pay alarak yüksek katma değerli bir sanayi dönüşümü başlatırken, diğer yandan \'tersine beyin göçünü\' tetikleyerek en parlak zihinlerimize kendi vatanlarında dünya çapında projeler üretme imkanı sunmaktadır. Kısacası TUA; stratejik bağımsızlığımızı gökyüzüne perçinleyen, teknolojik sıçramamızı hızlandıran ve Türk gençliğinin hayallerini evrenin derinliklerine taşıyan en güçlü milli projemizdir. Çünkü biliyoruz ki; bugün gökyüzünde izi olmayanın, yarın yeryüzünde sözü olmayacaktır.',
          gorsel: '',
          emoji: '🇹🇷',
        },
      },
      {
        durmaSaniyesi: 4,
        bilgiMetni: 'T-10… Geri sayım başladı! Tüm sistemler nominal durumda.',
        butonYazisi: 'Fırlatmayı Başlat',
        bilgiKarti: null,
      },
    ],
  },
  {
    id: 3,
    videoDosyasi: '',                     // 'assets/sahne-03.mp4'
    badge: 'Fırlatma',
    baslik: 'Kalkış Anı',
    aciklama: 'Motor ateşlemesi tamamlandı! Roket yeryüzünden ayrılarak atmosferin üst katmanlarına doğru yükseliyor.',
    meta: ['🔥 Motor gücü: %100', '⚡ Max-Q aşıldı'],

    durakNoktalari: [
      {
        durmaSaniyesi: 2,
        bilgiMetni: 'Ana motorlar tam güçte ateşlendi! G-kuvveti artıyor.',
        butonYazisi: 'Yükselişi İzle',
        bilgiKarti: {
          konum: 'sag',
          etiket: 'Teknik',
          baslik: 'Roket Motorları',
          metin: 'Ana motorlar 4.5 milyon Newton itki üretiyor. Yakıt: sıvı oksijen ve RP-1.',
          gorsel: '',
          emoji: '🔥',
        },
      },
      {
        durmaSaniyesi: 4,
        bilgiMetni: 'Max-Q noktası aşıldı! Atmosferin en yoğun bölgesinden geçiliyor.',
        butonYazisi: 'Devam Et',
        bilgiKarti: {
          konum: 'sag',
          buyuk: true,
          etiket: 'Milli Teknoloji',
          baslik: 'Uzay Aracı ve Milli Hibrit Roket Motoru',
          metin: 'Ay misyonu için tasarlanan bir uzay aracı; derin uzaydaki -170°C ile +120°C arası ekstrem sıcaklıklara dayanacak çok katmanlı ısıl yalıtım (MLI), kozmik radyasyona dirençli zırhlı gövde, yön bulma için Yıldız İzler (Star Tracker) kameraları ve kesintisiz enerji için yüksek verimli güneş panellerine sahip olmalıdır. Türkiye’nin bu alandaki en kritik devlet destekli hamlesi, DeltaV Uzay Teknolojileri tarafından geliştirilen **"Milli Hibrit Roket Motoru"**dur; bu teknoloji, geleneksel sistemlere göre çok daha güvenli ve düşük maliyetli bir itki gücü sağlayarak aracın Ay yörüngesine transferini hedefler. TÜBİTAK UZAY ile koordineli yürütülen bu yerli sistem çalışmaları, şu anki insansız Ay\'a sert/yumuşak iniş hedeflerinin ötesinde, Türkiye\'nin gelecekteki insanlı derin uzay misyonları için en temel teknik ve donanımsal basamağı oluşturmaktadır.',
          gorsel: '',
          emoji: '🚀',
        },
      },
    ],
  },
  {
    id: 4,
    videoDosyasi: '',
    badge: 'Savunma',
    baslik: 'Uzay Savunma Görevi',
    aciklama: 'Ay yolculuğu sırasında uzay savunma simülasyonu! Düşman drone\'larını etkisiz hale getir ve güvenli yolculuk koridorunu temizle.',
    meta: ['🎮 İnteraktif Oyun', '🛸 Düşman Dalgaları'],

    durakNoktalari: [
      {
        durmaSaniyesi: 4, // Biraz daha yavaş izleme payı bırakıldı
        bilgiMetni: 'Yolculuk rotasında tehditler tespit edildi! Uzay savunma simülasyonuna başla.',
        butonYazisi: 'Simülasyonu Başlat',
        uzayOyunuTetikle: true,
        bilgiKarti: {
          konum: 'sol',
          etiket: 'Görev',
          baslik: 'Savunma Simülasyonu',
          metin: 'Uzay araçlarını ve uyduları korumak için düşman drone\'larını imha et. WASD veya ok tuşları ile hareket, SPACE ile ateş!',
          gorsel: '',
          emoji: '🎯',
        },
      },
    ],
  },
  {
    id: 5,
    videoDosyasi: '',                     // 'assets/sahne-06.mp4'
    badge: 'İniş',
    baslik: 'Ay Yüzeyine Temas',
    aciklama: 'İniş modülü Ay yüzeyine yaklaşıyor… Ve… temas! Türkiye\'nin Ay\'daki ilk adımı atıldı!',
    meta: ['🏁 İniş başarılı', '🇹🇷 Bayrak dikildi'],

    durakNoktalari: [
      {
        durmaSaniyesi: 3, // 1'den 3'e çıkarıldı, inişin yavaş izlenmesi için pay bırakıldı
        bilgiMetni: 'TEMAS! Türkiye\'nin Ay\'daki ilk adımı atıldı! 🇹🇷',
        butonYazisi: 'Ay Yüzeyini Keşfet (Oyunu Oyna)',
        oyunTetikle: true,
        bilgiKarti: {
          konum: 'sol',
          buyuk: true,
          etiket: 'Uzay Çağı',
          baslik: 'Tarihî Dönüm Noktaları',
          metin: 'İnsanlığın uzay serüveni, 1957’de Sputnik 1 uydusunun fırlatılmasıyla başlasa da, gerçek dönüm noktası 12 Nisan 1961’de yaşandı. Sovyet kozmonot Yuri Gagarin, Vostok 1 göreviyle Dünya yörüngesine ulaşarak uzaya çıkan ilk insan olarak tarihe geçti. Bu başarıyı, 1969’da ABD’nin Apollo 11 misyonu takip etti ve Neil Armstrong Ay’a ayak basan ilk insan oldu. Süreç içerisinde Voyager sondaları güneş sisteminin dışına çıkarak sınırları zorlarken, Hubble Uzay Teleskobu evrenin derinliklerini görmemizi sağladı. Günümüzde ise Artemis programıyla Ay’a geri dönmeyi ve Mars misyonlarıyla kızıl gezegene yerleşmeyi hedefleyen, devletlerin ötesinde özel şirketlerin de dahil olduğu yepyeni bir uzay çağına tanıklık ediyoruz.',
          gorsel: '',
          emoji: '🌌',
        },
      },
    ],
  },
  {
    id: 6,
    videoDosyasi: '', // Kapanis metnini ve CSS animasyonunu tetikler
    badge: 'Final',
    baslik: 'Görev Tamamlandı',
    aciklama: 'Kusursuz bir görev animasyonu. Buraya AI video aracında ürettiğiniz kapanış eklenecek.',
    meta: ['✨ Destansı Bitiş', '🌍 Dünya'],
    durakNoktalari: [], // Sadece videoyu oynat ve bitince jeneriği göster
  }
];


// ── DOM Referansları (Sahne Sistemi) ────────────────────
const sceneVideo = $('sceneVideo');
const sceneVideoPlaceholder = $('sceneVideoPlaceholder');
const videoControls = $('videoControls');
const btnPlay = $('btnPlay');
const sceneInfoOverlay = $('sceneInfoOverlay');
const sceneInfoBadge = $('sceneInfoBadge');
const sceneInfoTitle = $('sceneInfoTitle');
const sceneInfoText = $('sceneInfoText');
const sceneInfoMeta = $('sceneInfoMeta');
const navSceneNum = $('navSceneNum');
const navSceneTotal = $('navSceneTotal');
const sceneProgressFill = $('sceneProgressFill');
const sceneDots = $('sceneDots');
const btnPrev = $('btnPrev');
const btnNext = $('btnNext');

// Bilgi Kartı DOM'ları
const bilgiKartiWrapper = $('bilgiKartiWrapper');
const bilgiKartiEl = $('bilgiKarti');
const bilgiKartiKapat = $('bilgiKartiKapat');
const bilgiKartiGorsel = $('bilgiKartiGorsel');
const bilgiKartiEtiket = $('bilgiKartiEtiket');
const bilgiKartiBaslik = $('bilgiKartiBaslik');
const bilgiKartiMetin = $('bilgiKartiMetin');

// ── Durum Değişkenleri ──────────────────────────────────
let mevcutSahne = 0;     // Aktif sahne index'i
let mevcutDurak = 0;     // Sahne içi aktif durak noktası index'i
let gecisKilidi = false; // Geçiş animasyonu sırasında kilitle
let videoDurakta = false; // Video bir durak noktasında mı?
let timeUpdateBound = null;  // timeupdate event referansı (temizlik için)


// ═══════════════════════════════════════════════════════
// Motor Başlatma
// ═══════════════════════════════════════════════════════
function sahneMotorunu_Baslat() {
  navSceneTotal.textContent = sahneler.length;
  noktalariOlustur();
  sahneDegistir(0);

  // Devam Et butonu → videoDevamEt()
  btnNext.addEventListener('click', () => videoDevamEt());
  btnPrev.addEventListener('click', () => oncekiSahne());

  // Klavye kontrolleri
  document.addEventListener('keydown', (e) => {
    if (mainContent.classList.contains('hidden')) return;
    if (window.isGameActive) return; // Oyun oynanırken hikaye akışını durdur
    
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      videoDevamEt();
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      oncekiSahne();
    }
  });

  // Video tıklama → oynat/duraklat
  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      if (videoDurakta) {
        videoDevamEt();   // Duraktaysa devam et
      } else if (sceneVideo.paused) {
        sceneVideo.play();
        videoControls.classList.add('hidden');
      } else {
        sceneVideo.pause();
        videoControls.classList.remove('hidden');
      }
    });
  }

  if (sceneVideo) {
    sceneVideo.addEventListener('click', () => btnPlay.click());
    sceneVideo.addEventListener('pause', () => {
      if (!videoDurakta) videoControls.classList.remove('hidden');
    });
  }
}


// ═══════════════════════════════════════════════════════
// sahneDegistir(index)  —  Yeni Sahneye Geçiş
// ═══════════════════════════════════════════════════════

function sahneDegistir(index) {
  if (index < 0 || index >= sahneler.length) return;
  if (gecisKilidi) return;

  gecisKilidi = true;
  const sahne = sahneler[index];

  // Önceki timeupdate listener'ını temizle
  durakDinleyicisiniKaldir();
  bilgiKartiGizle();

  // Fade-out
  sceneVideo.classList.add('fade-out');
  sceneInfoOverlay.classList.add('fade-out');

  setTimeout(() => {
    // ── Durak state'ini sıfırla ─────────────────────
    mevcutSahne = index;
    mevcutDurak = 0;
    videoDurakta = false;

    // ── Video kaynağını güncelle ─────────────────────
    if (sahne.videoDosyasi && sahne.videoDosyasi.length > 0) {
      // Canvas animasyonunu durdur (varsa)
      if (typeof SahneAnimasyonlari !== 'undefined') SahneAnimasyonlari.durdur();

      sceneVideo.src = sahne.videoDosyasi;
      sceneVideo.load();
      sceneVideoPlaceholder.classList.add('fade-out');

      // Video hazır olunca oynat + durak dinleyicisini kur
      sceneVideo.addEventListener('loadeddata', () => {
        sceneVideo.play().catch(() => { });
        videoControls.classList.add('hidden');
        durakDinleyicisiniKur();
      }, { once: true });
    } else {
      // Video yoksa → Canvas animasyonunu başlat
      sceneVideo.removeAttribute('src');
      sceneVideo.load();

      // Canvas animasyonunu başlat
      if (typeof SahneAnimasyonlari !== 'undefined') {
        SahneAnimasyonlari.baslat(index);
        sceneVideoPlaceholder.classList.add('fade-out');
      } else {
        sceneVideoPlaceholder.classList.remove('fade-out');
      }

      videoControls.classList.remove('hidden');

      // Video yokken ilk durak bilgisini hemen göster
      if (sahne.durakNoktalari && sahne.durakNoktalari.length > 0) {
        setTimeout(() => durakNoktasinaGelindi(), 800);
      }
    }

    // ── Alt bilgi kartını güncelle ───────────────────
    sceneInfoBadge.textContent = sahne.badge;
    sceneInfoTitle.textContent = sahne.baslik;
    sceneInfoText.textContent = sahne.aciklama;
    sceneInfoMeta.innerHTML = sahne.meta
      .map(m => `<span class="meta-item">${m}</span>`)
      .join('');

    // Fade-in
    sceneVideo.classList.remove('fade-out');
    
    // Eğer 7. Sahne (Final Kapanış Sahnesi) ise diğer tüm UI'ları gizle
    if (index === 7) {
        document.getElementById('sceneNavbar').classList.add('hidden');
        document.getElementById('sceneNavActions').classList.add('hidden');
        sceneInfoOverlay.classList.add('hidden');

        // YEDEK: Eğer kullanıcı kapanis.mp4 dosyasını eklememişse videonun bitişini simüle et
        if (!sahne.videoDosyasi || sahne.videoDosyasi.length === 0) {
            setTimeout(() => videoSonunaGelindi(), 1500);
        }
    } else {
        document.getElementById('sceneNavbar').classList.remove('hidden');
        document.getElementById('sceneNavActions').classList.remove('hidden');
        sceneInfoOverlay.classList.remove('fade-out');
        const card = $('sceneInfoCard');
        card.style.animation = 'none';
        card.offsetHeight;
        card.style.animation = 'fadeSlideUp 0.6s var(--ease-out-expo) both';
    }

    // UI güncelle
    navbarGuncelle();
    ilerlemeGuncelle();
    noktalariGuncelle();
    butonDurumlariniGuncelle();

    gecisKilidi = false;
  }, 500);
}


// ═══════════════════════════════════════════════════════
// DURAK NOKTASI SİSTEMİ
// ═══════════════════════════════════════════════════════
//
// Video oynarken `timeupdate` event'i her ~250ms tetiklenir.
// Mevcut saniye, aktif durak noktası saniyesine eşit veya
// büyükse video otomatik durur ve bilgi kartı belirir.

function durakDinleyicisiniKur() {
  const sahne = sahneler[mevcutSahne];
  if (!sahne || !sahne.durakNoktalari || sahne.durakNoktalari.length === 0) return;

  // timeupdate handler — her frame'de kontrol eder
  timeUpdateBound = function () {
    if (videoDurakta) return;  // Zaten duraktaysa tekrar tetikleme

    const duraklar = sahne.durakNoktalari;
    if (mevcutDurak >= duraklar.length) return;  // Tüm duraklar geçildi

    const hedefSaniye = duraklar[mevcutDurak].durmaSaniyesi;

    if (sceneVideo.currentTime >= hedefSaniye) {
      // ── OTOMATİK DURAKLAT ──────────────────────────
      sceneVideo.pause();
      sceneVideo.currentTime = hedefSaniye;  // Tam saniyeye snap
      videoDurakta = true;
      videoControls.classList.add('hidden');  // Play butonunu gizle

      // Bilgi göster
      durakNoktasinaGelindi();
    }
  };

  sceneVideo.addEventListener('timeupdate', timeUpdateBound);

  // Video tamamen bittiğinde
  sceneVideo.addEventListener('ended', videoSonunaGelindi);
}

function durakDinleyicisiniKaldir() {
  if (timeUpdateBound && sceneVideo) {
    sceneVideo.removeEventListener('timeupdate', timeUpdateBound);
    sceneVideo.removeEventListener('ended', videoSonunaGelindi);
    timeUpdateBound = null;
  }
}


// ── Durak noktasına gelindiğinde çağrılır ───────────────
function durakNoktasinaGelindi() {
  const sahne = sahneler[mevcutSahne];
  if (!sahne || !sahne.durakNoktalari) return;

  const durak = sahne.durakNoktalari[mevcutDurak];
  if (!durak) return;

  // Alt bilgi overlay'ını güncelle
  sceneInfoText.textContent = durak.bilgiMetni;

  // Animasyonla tekrar göster
  const card = $('sceneInfoCard');
  card.style.animation = 'none';
  card.offsetHeight;
  card.style.animation = 'fadeSlideUp 0.6s var(--ease-out-expo) both';

  // Buton yazısını güncelle
  const nextText = btnNext.querySelector('span');
  nextText.textContent = durak.butonYazisi || 'Devam Et';
  btnNext.disabled = false;

  // Bilgi kartı (eğer tanımlanmışsa)
  if (durak.bilgiKarti) {
    setTimeout(() => bilgiKartiGoster(durak.bilgiKarti), 500);
  }

  // Oyun tetiklenme otomatik süresi kaldırıldı.
  // Kullanıcı "Simülasyonu Başlat" VEYA "Ay Yüzeyini Keşfet" butonuna (btnNext) basarak manuel geçecek.
  // (İstek: "4. sahneye gelindiğinde oyunu başlatabilmemiz için bir buton yap")

  console.log(`⏸ Durak ${mevcutDurak + 1}/${sahne.durakNoktalari.length} — ${durak.durmaSaniyesi}s — "${durak.bilgiMetni}"`);
}


// ── Video Dosyasi Bulunamadığında Fallback (Kapanış Videosu Yoksa) ──
const checkVideo = document.getElementById('sceneVideoBg') || document.querySelector('video.scene-video');
if (checkVideo) {
    checkVideo.addEventListener('error', function(e) {
        if (mevcutSahne === 4) {
           videoSonunaGelindi();
        }
    });
}

// ── Video sonuna gelindiğinde ───────────────────────────
function videoSonunaGelindi() {
  videoDurakta = false;
  
  if (mevcutSahne !== 5) {
     videoControls.classList.remove('hidden');
  } else {
     videoControls.classList.add('hidden'); // 5. Sahnede play butonu çıkmasın
  }

  // Sonraki sahneye otomatik geçiş (son sahne değilse)
  if (mevcutSahne < sahneler.length - 1) {
    const nextText = btnNext.querySelector('span');
    nextText.textContent = 'Sonraki Sahne →';
    btnNext.disabled = false;
  } else {
    // 5. Sahne video bitişi -> Jenerik Goster!
    if (mevcutSahne === sahneler.length - 1) {
        const closureTarget = document.getElementById('finalClosureOverlay');
        if (closureTarget) {
            closureTarget.classList.remove('hidden');
            setTimeout(() => {
                closureTarget.classList.add('fade-in');
            }, 100);
        }
    }
    const nextText = btnNext.querySelector('span');
    if (nextText) nextText.textContent = 'Hikâye Tamamlandı ✓';
    btnNext.disabled = true;
  }
}


// ═══════════════════════════════════════════════════════
// videoDevamEt()  —  Devam butonu mantığı
// ═══════════════════════════════════════════════════════
//
// 1. Eğer video bir durak noktasındaysa:
//    → Bilgi kartını kapat
//    → Videoyu kaldığı yerden devam ettir
//    → mevcutDurak'ı bir artır (sonraki durağa hazırlan)
//
// 2. Eğer video bitmişse veya tüm duraklar geçilmişse:
//    → Sonraki sahneye geç
//
// 3. Eğer video yoksa (placeholder):
//    → mevcutDurak'ı artır, sonraki durak bilgisini göster
//    → Tüm duraklar bittiyse sonraki sahneye geç

function videoDevamEt() {
  if (gecisKilidi) return; // Sahne geçişi sırasında tuşlara basılı tutulursa engelle
  
  const sahne = sahneler[mevcutSahne];

  // UZAY SAVAŞI OYUNU TETIKLEME
  if (sahne.durakNoktalari && sahne.durakNoktalari[mevcutDurak] && sahne.durakNoktalari[mevcutDurak].uzayOyunuTetikle) {
    initSpaceShooterGame();
    return;
  }

  // LUNAR ROVER OYUN TETIKLEME KONTROLU
  if (sahne.durakNoktalari && sahne.durakNoktalari[mevcutDurak] && sahne.durakNoktalari[mevcutDurak].oyunTetikle) {
    if (typeof initLunarRoverGame === 'function') {
      const gTr = document.createElement('div');
      gTr.style.cssText = 'position:fixed;inset:0;background:#000;z-index:9999;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.8rem;text-align:center;letter-spacing:2px;font-family:var(--font-display);opacity:0;transition:opacity 1s ease;';
      gTr.innerHTML = 'AY YÜZEYİ İNİŞİ BAŞARILI.<br>KEŞİF BAŞLATILIYOR...';
      document.body.appendChild(gTr);
      
      setTimeout(() => gTr.style.opacity = '1', 50); // Ekran kararıyor
      
      setTimeout(() => {
        initLunarRoverGame();
        gTr.style.opacity = '0'; // Kararma bitiyor, oyun açılıyor
        setTimeout(() => gTr.remove(), 1000);
      }, 3000); // 3 saniyelik görsel bir geçiş
    }
    return;
  }

  // ── Video durakta → devam ettir ───────────────────
  if (videoDurakta) {
    bilgiKartiGizle();
    videoDurakta = false;
    mevcutDurak++;

    // Alt bilgi metnini sahne açıklamasına geri döndür
    sceneInfoText.textContent = sahne.aciklama;

    // Videoyu devam ettir
    sceneVideo.play().catch(() => { });
    videoControls.classList.add('hidden');

    // Buton yazısını güncelle
    butonDurumlariniGuncelle();
    return;
  }

  // ── Video yoksa (placeholder modu) ────────────────
  if (!sahne.videoDosyasi || sahne.videoDosyasi.length === 0) {
    bilgiKartiGizle();
    mevcutDurak++;

    const duraklar = sahne.durakNoktalari || [];

    if (mevcutDurak < duraklar.length) {
      // Sonraki durak bilgisini göster
      durakNoktasinaGelindi();
    } else {
      // Tüm duraklar bitti → sonraki sahne
      if (mevcutSahne < sahneler.length - 1) {
        sahneDegistir(mevcutSahne + 1);
      }
    }
    return;
  }

  // ── Video bitti veya tüm duraklar geçildi → sonraki sahne
  if (mevcutSahne < sahneler.length - 1) {
    sahneDegistir(mevcutSahne + 1);
  }
}


// ── Önceki sahne ────────────────────────────────────────
function oncekiSahne() {
  if (mevcutSahne > 0) {
    sahneDegistir(mevcutSahne - 1);
  }
}


// ── Navbar Güncelle ─────────────────────────────────────
function navbarGuncelle() {
  navSceneNum.textContent = mevcutSahne + 1;
}


// ── İlerleme Çubuğu Güncelle ────────────────────────────
function ilerlemeGuncelle() {
  const yuzde = ((mevcutSahne + 1) / sahneler.length) * 100;
  sceneProgressFill.style.width = yuzde + '%';
}


// ── Nokta (Dot) Navigasyonu ─────────────────────────────
function noktalariOlustur() {
  sceneDots.innerHTML = '';
  sahneler.forEach((s, i) => {
    const dot = document.createElement('button');
    dot.className = 'scene-dot';
    dot.setAttribute('aria-label', `Sahne ${i + 1}: ${s.baslik}`);
    dot.addEventListener('click', () => sahneDegistir(i));
    sceneDots.appendChild(dot);
  });
}

function noktalariGuncelle() {
  const dots = sceneDots.querySelectorAll('.scene-dot');
  dots.forEach((dot, i) => {
    dot.classList.remove('active', 'visited');
    if (i === mevcutSahne) {
      dot.classList.add('active');
    } else if (i < mevcutSahne) {
      dot.classList.add('visited');
    }
  });
}


// ── Buton Durumları ─────────────────────────────────────
function butonDurumlariniGuncelle() {
  btnPrev.disabled = mevcutSahne === 0;

  if (mevcutSahne === sahneler.length - 1) {
    const sahne = sahneler[mevcutSahne];
    const duraklar = sahne.durakNoktalari || [];
    if (mevcutDurak >= duraklar.length && !videoDurakta) {
      btnNext.disabled = true;
      btnNext.querySelector('span').textContent = 'Hikâye Tamamlandı ✓';
    } else {
      btnNext.disabled = false;
    }
  } else {
    btnNext.disabled = false;
    if (!videoDurakta) {
      btnNext.querySelector('span').textContent = 'Devam Et';
    }
  }
}


// ═══════════════════════════════════════════════════════
// BÖLÜM 5: BİLGİ KARTI BİLEŞENİ
// ═══════════════════════════════════════════════════════

let bilgiKartiTimer = null;

/**
 * Bilgi kartını verilen verilerle ekrana getirir.
 * @param {Object} veri - { konum, etiket, baslik, metin, gorsel, emoji }
 */
function bilgiKartiGoster(veri) {
  if (!bilgiKartiWrapper || !veri) return;

  bilgiKartiWrapper.classList.remove('acik', 'kapaniyor', 'sag', 'buyuk');
  bilgiKartiWrapper.classList.add('hidden');

  if (veri.konum === 'sag') {
    bilgiKartiWrapper.classList.add('sag');
  }
  if (veri.buyuk) {
    bilgiKartiWrapper.classList.add('buyuk');
  }

  bilgiKartiEtiket.textContent = veri.etiket || 'Bilgi';
  bilgiKartiBaslik.textContent = veri.baslik || '';
  bilgiKartiMetin.textContent = veri.metin || '';

  if (veri.gorsel && veri.gorsel.length > 0) {
    bilgiKartiGorsel.innerHTML = `<img src="${veri.gorsel}" alt="${veri.baslik}" />`;
  } else {
    const emoji = veri.emoji || '🛰️';
    bilgiKartiGorsel.innerHTML = `<span class="bilgi-karti-gorsel-placeholder">${emoji}</span>`;
  }

  bilgiKartiWrapper.classList.remove('hidden');
  bilgiKartiWrapper.offsetHeight;
  bilgiKartiWrapper.classList.add('acik');
}

/**
 * Bilgi kartını fade-out ile kapatır.
 */
function bilgiKartiGizle() {
  if (!bilgiKartiWrapper) return;
  if (bilgiKartiWrapper.classList.contains('hidden')) return;

  clearTimeout(bilgiKartiTimer);

  bilgiKartiWrapper.classList.remove('acik');
  bilgiKartiWrapper.classList.add('kapaniyor');

  bilgiKartiWrapper.addEventListener('animationend', () => {
    bilgiKartiWrapper.classList.add('hidden');
    bilgiKartiWrapper.classList.remove('kapaniyor', 'sag');
  }, { once: true });
}

// Kapat butonuna tıklama
if (bilgiKartiKapat) {
  bilgiKartiKapat.addEventListener('click', bilgiKartiGizle);
}


// ═══════════════════════════════════════════════════════
// BÖLÜM 6: UZAY SAVAŞI OYUNU ENTEGRASYONu
// ═══════════════════════════════════════════════════════

let spaceGameActive = false;

function initSpaceShooterGame() {
  const overlay = document.getElementById('spaceGameOverlay');
  if (!overlay) return;

  spaceGameActive = true;
  window.isGameActive = true;

  // Canvas animasyonunu durdur
  if (typeof SahneAnimasyonlari !== 'undefined') SahneAnimasyonlari.durdur();

  // Overlay'ı göster
  overlay.classList.remove('hidden');

  // Game canvas'ı boyutla
  const gameCanvas = document.getElementById('gameCanvas');
  if (gameCanvas) {
    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight;
  }

  // main.js modülündeki startSpaceGame çağır
  if (typeof window.startSpaceGame === 'function') {
    window.startSpaceGame();
  }
  console.log('🛸 Uzay Savunma Simülasyonu başlatıldı!');
}

function exitSpaceShooterGame() {
  const overlay = document.getElementById('spaceGameOverlay');
  if (overlay) overlay.classList.add('hidden');

  // Oyun motorunu durdur
  if (typeof window.stopSpaceGame === 'function') {
    window.stopSpaceGame();
  }
  const goScreen = document.getElementById('game-over-screen');
  const victoryScreen = document.getElementById('victory-screen');
  if (goScreen) goScreen.classList.add('hidden');
  if (victoryScreen) victoryScreen.classList.add('hidden');

  spaceGameActive = false;
  window.isGameActive = false;

  // Sonraki sahneye geç
  bilgiKartiGizle();
  mevcutDurak++;
  if (mevcutSahne < sahneler.length - 1) {
    sahneDegistir(mevcutSahne + 1);
  }
}

// Çıkış butonları
document.addEventListener('DOMContentLoaded', () => {
  const exitBtn = document.getElementById('btnExitSpaceGame');
  const exitVictoryBtn = document.getElementById('btnExitSpaceGameVictory');
  if (exitBtn) exitBtn.addEventListener('click', exitSpaceShooterGame);
  if (exitVictoryBtn) exitVictoryBtn.addEventListener('click', exitSpaceShooterGame);
});
