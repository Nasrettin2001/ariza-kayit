import {
  db,
  kategorileriYukle,
  kayitEkle,
  kayitGuncelle,
  kayitSil,
  kayitGetir,
  kayitlariListele,
  tekrarArtir,
  tumEtiketleriGetir,
  sabitleToggle
} from './db.js';
import { kayitAra } from './arama.js';
import { disaAktar, iceAktar, csvDisaAktar, csvIceAktar } from './yedek.js';

// ===== EKRAN YÖNETİMİ =====
// Ekran geçmişi: telefonun geri tuşuyla önceki ekrana dönmek için
let ekranGecmisi = ['ekran-liste'];

function ekranGoster(ekranId, geriMi = false) {
  document.querySelectorAll('.ekran').forEach(el => el.classList.remove('aktif'));
  document.getElementById(ekranId).classList.add('aktif');
  window.scrollTo(0, 0);

  if (!geriMi) {
    if (ekranGecmisi[ekranGecmisi.length - 1] !== ekranId) {
      ekranGecmisi.push(ekranId);
      history.pushState({ ekran: ekranId }, '');
    }
  }

  // Alt bar aktif butonu güncelle
  altBarGuncelle(ekranId);
}

// Telefonun geri tuşunu yakala
window.addEventListener('popstate', () => {
  if (ekranGecmisi.length > 1) {
    ekranGecmisi.pop();
    const oncekiEkran = ekranGecmisi[ekranGecmisi.length - 1];
    ekranGoster(oncekiEkran, true);
  }
});

// Alt navigasyon barını güncelle
function altBarGuncelle(ekranId) {
  document.querySelectorAll('.alt-bar-btn').forEach(btn => {
    btn.classList.toggle('aktif', btn.dataset.ekran === ekranId);
  });
}

// ===== SAYFA DURUMU =====
let mevcutSayfa = 0;
let duzenlenecekId = null;
let seciliKategori = null; // kategori filtresi
let aramaZamanlayici = null; // debounce için
let benzeriZamanlayici = null; // benzer kayıt önerisi debounce
let etiketZamanlayici = null; // etiket otomatik tamamlama debounce
let fotografBase64 = null; // formda seçilen fotoğrafın küçültülmüş hali

// ===== BAŞLANGIÇ =====
document.addEventListener('DOMContentLoaded', async () => {
  temaYukle();
  await kategorileriDoldur();
  await kategoriCipleriniOlustur();
  await listeYenile();
  aramaGecmisiniGoster();
  olaylariKur();
  // İlk ekran için history state ayarla
  history.replaceState({ ekran: 'ekran-liste' }, '');
});

// Kategori <select> alanını doldur
async function kategorileriDoldur() {
  const kategoriler = await kategorileriYukle();
  const select = document.getElementById('f-kategori');
  // İlk "Seçiniz" seçeneğini koru, geri kalanını temizle
  while (select.options.length > 1) select.remove(1);

  kategoriler.forEach(kat => {
    const opt = document.createElement('option');
    opt.value = kat;
    opt.textContent = kat;
    select.appendChild(opt);
  });
}

// ===== KATEGORİ ÇİPLERİ =====
let filtrelerAcik = false;

async function kategoriCipleriniOlustur() {
  const kategoriler = await kategorileriYukle();
  const wrap = document.getElementById('kategori-cipler');
  wrap.innerHTML = '';

  // "Filtrele" aç/kapa butonu
  const filtreBtn = document.createElement('button');
  filtreBtn.type = 'button';
  filtreBtn.className = 'cip filtre-toggle';
  filtreBtn.textContent = '⚙ Filtrele';
  filtreBtn.addEventListener('click', () => {
    filtrelerAcik = !filtrelerAcik;
    cipGizle(filtrelerAcik);
    filtreBtn.textContent = filtrelerAcik ? '✕ Kapat' : '⚙ Filtrele';
  });
  wrap.appendChild(filtreBtn);

  // Seçili kategori göstergesi
  if (seciliKategori) {
    const aktifCip = document.createElement('button');
    aktifCip.type = 'button';
    aktifCip.className = 'cip secili';
    aktifCip.textContent = seciliKategori + ' ✕';
    aktifCip.addEventListener('click', () => {
      seciliKategori = null;
      kategoriCipleriniOlustur();
      aramaYap();
    });
    wrap.appendChild(aktifCip);
  }

  // Gizlenebilir kategori listesi
  const cipListesi = document.createElement('div');
  cipListesi.className = 'cip-listesi';
  cipListesi.style.display = filtrelerAcik ? '' : 'none';

  const tumBtn = document.createElement('button');
  tumBtn.type = 'button';
  tumBtn.className = 'cip' + (!seciliKategori ? ' secili' : '');
  tumBtn.textContent = 'Tümü';
  tumBtn.addEventListener('click', () => {
    seciliKategori = null;
    filtrelerAcik = false;
    kategoriCipleriniOlustur();
    aramaYap();
  });
  cipListesi.appendChild(tumBtn);

  kategoriler.forEach(kat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cip' + (seciliKategori === kat ? ' secili' : '');
    btn.textContent = kat;
    btn.addEventListener('click', () => {
      seciliKategori = kat;
      filtrelerAcik = false;
      kategoriCipleriniOlustur();
      aramaYap();
    });
    cipListesi.appendChild(btn);
  });

  wrap.appendChild(cipListesi);
}

function cipGizle(goster) {
  const liste = document.querySelector('.cip-listesi');
  if (liste) liste.style.display = goster ? '' : 'none';
}

// ===== ARAMA =====
async function aramaYap() {
  const sorgu = document.getElementById('arama-kutusu').value.trim();
  const filtre = seciliKategori ? { kategori: seciliKategori } : {};
  const liste = document.getElementById('kayit-listesi');

  // Arama veya filtre aktifse arama moduna geç
  if (sorgu || seciliKategori) {
    if (sorgu) aramaGecmisiKaydet(sorgu);
    const sonuclar = await kayitAra(sorgu, filtre);
    liste.innerHTML = '';
    document.getElementById('daha-fazla-wrap').style.display = 'none';

    if (sonuclar.length === 0) {
      liste.innerHTML = '<p class="bos-mesaj">Sonuç bulunamadı.</p>';
      return;
    }

    const bilgi = document.createElement('p');
    bilgi.className = 'arama-bilgi';
    bilgi.textContent = `${sonuclar.length} sonuç bulundu`;
    liste.appendChild(bilgi);

    sonuclar.forEach(k => liste.appendChild(kartOlustur(k)));
  } else {
    await listeYenile();
  }
}

// Kategori ikonları (SVG)
const KATEGORI_IKONLARI = {
  'Yazıcı': '<svg class="kategori-grup-ikon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
  'Ağ / Kablolama': '<svg class="kategori-grup-ikon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>',
  'VPN': '<svg class="kategori-grup-ikon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>',
  'Windows / Yazılım': '<svg class="kategori-grup-ikon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  'Kullanıcı hesabı': '<svg class="kategori-grup-ikon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  'Office / E-posta': '<svg class="kategori-grup-ikon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  'Donanım': '<svg class="kategori-grup-ikon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>',
  'Firewall': '<svg class="kategori-grup-ikon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
};

function kategoriIkonGetir(kategori) {
  return KATEGORI_IKONLARI[kategori] || '<svg class="kategori-grup-ikon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
}

// ===== LİSTE =====
async function listeYenile() {
  mevcutSayfa = 0;
  const liste = document.getElementById('kayit-listesi');
  liste.innerHTML = '';

  const sonuc = await kayitlariListele(0);
  if (sonuc.kayitlar.length === 0) {
    liste.innerHTML = '<p class="bos-mesaj">Henüz kayıt yok. Alttaki "Yeni Kayıt" butonuyla ilk kaydını ekle.</p>';
    document.getElementById('daha-fazla-wrap').style.display = 'none';
    return;
  }

  kategoriGrupluListeOlustur(sonuc.kayitlar, liste);
  document.getElementById('daha-fazla-wrap').style.display = sonuc.dahaVar ? '' : 'none';
}

function kategoriGrupluListeOlustur(kayitlar, liste) {
  const gruplar = {};
  // Sabitlenenleri ayrı tut
  const sabitlenenler = kayitlar.filter(k => k.sabitlendi);
  const normalKayitlar = kayitlar.filter(k => !k.sabitlendi);

  if (sabitlenenler.length > 0) {
    const baslik = document.createElement('div');
    baslik.className = 'kategori-grup-baslik';
    baslik.innerHTML = `<svg class="kategori-grup-ikon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg> Sabitlenmiş <span class="grup-sayi">${sabitlenenler.length}</span>`;
    liste.appendChild(baslik);
    sabitlenenler.forEach(k => liste.appendChild(kartOlustur(k)));
  }

  normalKayitlar.forEach(k => {
    const kat = k.kategori || 'Diğer';
    if (!gruplar[kat]) gruplar[kat] = [];
    gruplar[kat].push(k);
  });

  Object.entries(gruplar).forEach(([kategori, kayitListesi]) => {
    const baslik = document.createElement('div');
    baslik.className = 'kategori-grup-baslik';
    baslik.innerHTML = `${kategoriIkonGetir(kategori)} ${htmlKacis(kategori)} <span class="grup-sayi">${kayitListesi.length}</span>`;
    liste.appendChild(baslik);
    kayitListesi.forEach(k => liste.appendChild(kartOlustur(k)));
  });
}

async function dahaFazlaYukle() {
  mevcutSayfa++;
  const sonuc = await kayitlariListele(mevcutSayfa);
  const liste = document.getElementById('kayit-listesi');
  sonuc.kayitlar.forEach(k => liste.appendChild(kartOlustur(k)));
  document.getElementById('daha-fazla-wrap').style.display = sonuc.dahaVar ? '' : 'none';
}

// Tarih formatı: YYYY-MM-DD → GG.AA.YYYY
function tarihFormatla(isoTarih) {
  if (!isoTarih) return '';
  const [y, m, d] = isoTarih.split('-');
  return `${d}.${m}.${y}`;
}

// Tek bir kayıt kartı HTML'i
function kartOlustur(kayit) {
  const div = document.createElement('div');
  div.className = 'kayit-kart';
  div.dataset.id = kayit.id;

  const durumBadge = kayit.durum === 'Açık'
    ? '<span class="durum-badge durum-acik">Açık</span>'
    : kayit.durum === 'Geçici çözüm'
    ? '<span class="durum-badge durum-gecici">Geçici</span>'
    : '';

  div.innerHTML = `
    <h4>${htmlKacis(kayit.baslik)}</h4>
    <div class="meta">
      <span>${tarihFormatla(kayit.tarih)}</span>
      ${durumBadge}
      ${kayit.tekrarSayisi > 1 ? `<span class="tekrar-badge">${kayit.tekrarSayisi}x tekrar</span>` : ''}
    </div>
  `;

  div.addEventListener('click', () => detayGoster(kayit.id));
  return div;
}

// XSS koruması: kullanıcı girdisini HTML'e güvenli şekilde basmak için
function htmlKacis(metin) {
  if (!metin) return '';
  const div = document.createElement('div');
  div.textContent = metin;
  return div.innerHTML;
}

// ===== DETAY EKRANI =====
async function detayGoster(id) {
  const kayit = await kayitGetir(id);
  if (!kayit) return;

  const icerik = document.getElementById('detay-icerik');
  let html = `<h3>${htmlKacis(kayit.baslik)}</h3>`;

  const alanlar = [
    { etiket: 'Kategori', deger: kayit.kategori },
    { etiket: 'Durum', deger: kayit.durum },
    { etiket: 'Belirti', deger: kayit.belirti },
    { etiket: 'Çözüm', deger: kayit.cozum },
    { etiket: 'Sebep', deger: kayit.sebep },
    { etiket: 'Cihaz', deger: kayit.cihaz },
    { etiket: 'Hata Kodu', deger: kayit.hataKodu },
    { etiket: 'Kullanıcı / Bölüm', deger: kayit.kullaniciBolum },
    { etiket: 'Etiketler', deger: Array.isArray(kayit.etiketler) ? kayit.etiketler.join(', ') : kayit.etiketler },
    { etiket: 'Süre', deger: kayit.sure ? kayit.sure + ' dk' : null },
    { etiket: 'Tarih', deger: tarihFormatla(kayit.tarih) },
    { etiket: 'Tekrar', deger: kayit.tekrarSayisi > 1 ? kayit.tekrarSayisi + ' kez' : null },
  ];

  alanlar.forEach(a => {
    if (a.deger) {
      html += `<div class="detay-alan"><strong>${a.etiket}</strong>${htmlKacis(String(a.deger))}</div>`;
    }
  });

  if (kayit.fotograf) {
    html += `<div class="detay-alan"><strong>Fotoğraf</strong><img src="${kayit.fotograf}" alt="Kayıt fotoğrafı" style="max-width:100%; border-radius:var(--pico-border-radius); margin-top:0.3rem; cursor:pointer;" onclick="window.open(this.src)"></div>`;
  }

  icerik.innerHTML = html;

  // Sabitleme butonu durumunu güncelle
  const btnSabitle = document.getElementById('btn-sabitle');
  btnSabitle.textContent = kayit.sabitlendi ? '📌 Sabiti Kaldır' : '📌 Sabitle';
  btnSabitle.onclick = () => sabitleIsaretle(id);

  // Butonlara kaydın id'sini bağla
  document.getElementById('btn-tekrar').onclick = () => tekrarIsaretle(id);
  document.getElementById('btn-duzenle').onclick = () => duzenlemeyeGec(id);
  document.getElementById('btn-yazdir').onclick = () => window.print();
  document.getElementById('btn-sil').onclick = () => kayitSilOnay(id);

  ekranGoster('ekran-detay');
}

// ===== FORM: YENİ KAYIT / DÜZENLEME =====
function formuTemizle() {
  document.getElementById('kayit-formu').reset();
  document.getElementById('f-durum').value = 'Çözüldü';
  document.getElementById('ek-alanlar').removeAttribute('open');
  duzenlenecekId = null;
  document.getElementById('form-baslik').textContent = 'Yeni Kayıt';
  document.getElementById('benzer-oneriler').style.display = 'none';
  fotografTemizle();
  document.getElementById('sablon-secici').style.display = '';
  sablonlariOlustur();
}

async function duzenlemeyeGec(id) {
  const kayit = await kayitGetir(id);
  if (!kayit) return;

  duzenlenecekId = id;
  document.getElementById('form-baslik').textContent = 'Kaydı Düzenle';
  document.getElementById('sablon-secici').style.display = 'none';

  // Formu doldur
  document.getElementById('f-baslik').value = kayit.baslik || '';
  document.getElementById('f-kategori').value = kayit.kategori || '';
  document.getElementById('f-belirti').value = kayit.belirti || '';
  document.getElementById('f-cozum').value = kayit.cozum || '';
  document.getElementById('f-cihaz').value = kayit.cihaz || '';
  document.getElementById('f-hataKodu').value = kayit.hataKodu || '';
  document.getElementById('f-sebep').value = kayit.sebep || '';
  document.getElementById('f-etiketler').value = Array.isArray(kayit.etiketler) ? kayit.etiketler.join(', ') : (kayit.etiketler || '');
  document.getElementById('f-durum').value = kayit.durum || 'Çözüldü';
  document.getElementById('f-sure').value = kayit.sure || '';
  document.getElementById('f-kullaniciBolum').value = kayit.kullaniciBolum || '';

  // Mevcut fotoğrafı yükle
  if (kayit.fotograf) {
    fotografOnizlemeGoster(kayit.fotograf);
  } else {
    fotografTemizle();
  }

  // Ek alanlar kısmını aç
  document.getElementById('ek-alanlar').setAttribute('open', '');

  ekranGoster('ekran-form');
}

async function formuKaydet(e) {
  e.preventDefault();

  const form = document.getElementById('kayit-formu');

  // Zorunlu alanları kontrol et
  const baslik = document.getElementById('f-baslik').value.trim();
  const kategori = document.getElementById('f-kategori').value;
  const belirti = document.getElementById('f-belirti').value.trim();
  const cozum = document.getElementById('f-cozum').value.trim();

  if (!baslik || !kategori || !belirti || !cozum) {
    alert('Lütfen zorunlu alanları doldurun: Başlık, Kategori, Belirti ve Çözüm.');
    return;
  }

  const veri = {
    baslik,
    kategori,
    belirti,
    cozum,
    cihaz: document.getElementById('f-cihaz').value.trim(),
    hataKodu: document.getElementById('f-hataKodu').value.trim(),
    sebep: document.getElementById('f-sebep').value.trim(),
    etiketler: document.getElementById('f-etiketler').value,
    durum: document.getElementById('f-durum').value,
    sure: parseInt(document.getElementById('f-sure').value) || null,
    kullaniciBolum: document.getElementById('f-kullaniciBolum').value.trim(),
    fotograf: fotografBase64 || null,
  };

  if (duzenlenecekId) {
    await kayitGuncelle(duzenlenecekId, veri);
  } else {
    await kayitEkle(veri);
  }

  formuTemizle();
  await listeYenile();
  ekranGoster('ekran-liste');
}

async function kayitSilOnay(id) {
  if (!confirm('Bu kaydı silmek istediğine emin misin?')) return;
  await kayitSil(id);
  await listeYenile();
  ekranGoster('ekran-liste');
}

// "Bu yine oldu" — tekrar sayacını artır, detayı güncelle
async function tekrarIsaretle(id) {
  const yeniSayi = await tekrarArtir(id);
  if (yeniSayi) {
    await detayGoster(id);
    await listeYenile();
  }
}

// Sabitle / sabiti kaldır
async function sabitleIsaretle(id) {
  await sabitleToggle(id);
  await detayGoster(id);
  await listeYenile();
}

// Yeni kayıt yazarken benzer kayıt önerisi
async function benzerleriGoster() {
  const baslik = document.getElementById('f-baslik').value.trim();
  const onerilerDiv = document.getElementById('benzer-oneriler');

  if (baslik.length < 3 || duzenlenecekId) {
    onerilerDiv.style.display = 'none';
    return;
  }

  const sonuclar = await kayitAra(baslik, {});
  if (sonuclar.length === 0) {
    onerilerDiv.style.display = 'none';
    return;
  }

  const ilkUc = sonuclar.slice(0, 3);
  onerilerDiv.innerHTML = '<small><strong>Benzer kayıtlar:</strong></small>';
  ilkUc.forEach(k => {
    const div = document.createElement('div');
    div.className = 'benzer-oneri-kart';
    div.innerHTML = `<small>${htmlKacis(k.baslik)} <span class="kategori-etiket">${htmlKacis(k.kategori)}</span></small>`;
    div.addEventListener('click', () => {
      onerilerDiv.style.display = 'none';
      formuTemizle();
      detayGoster(k.id);
    });
    onerilerDiv.appendChild(div);
  });
  onerilerDiv.style.display = '';
}

// ===== OLAY DİNLEYİCİLERİ =====
function olaylariKur() {
  // Alt navigasyon barı
  document.querySelectorAll('.alt-bar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const hedef = btn.dataset.ekran;
      if (hedef === 'ekran-form') {
        formuTemizle();
      } else if (hedef === 'ekran-istatistik') {
        istatistikGoster();
        return;
      }
      ekranGoster(hedef);
    });
  });

  // Form gönder
  document.getElementById('kayit-formu').addEventListener('submit', formuKaydet);

  // Geri butonları
  document.getElementById('btn-form-geri').addEventListener('click', () => {
    formuTemizle();
    ekranGoster('ekran-liste');
  });
  document.getElementById('btn-detay-geri').addEventListener('click', () => {
    ekranGoster('ekran-liste');
  });

  // Daha fazla yükle
  document.getElementById('btn-daha-fazla').addEventListener('click', dahaFazlaYukle);

  // Arama kutusu: 300ms debounce ile arama yapar
  document.getElementById('arama-kutusu').addEventListener('input', () => {
    clearTimeout(aramaZamanlayici);
    aramaZamanlayici = setTimeout(aramaYap, 300);
  });

  // Yeni kayıt başlığı yazarken benzer kayıt önerisi
  document.getElementById('f-baslik').addEventListener('input', () => {
    clearTimeout(benzeriZamanlayici);
    benzeriZamanlayici = setTimeout(benzerleriGoster, 400);
  });

  // Etiket otomatik tamamlama
  document.getElementById('f-etiketler').addEventListener('input', () => {
    clearTimeout(etiketZamanlayici);
    etiketZamanlayici = setTimeout(etiketOneriGoster, 300);
  });

  // Fotoğraf seçildiğinde küçültüp önizleme göster
  document.getElementById('f-fotograf').addEventListener('change', async (e) => {
    const dosya = e.target.files[0];
    if (!dosya) return;
    try {
      const base64 = await fotografKucult(dosya);
      fotografOnizlemeGoster(base64);
    } catch (hata) {
      alert('Fotoğraf yüklenemedi: ' + hata.message);
    }
  });

  // Fotoğraf kaldır butonu
  document.getElementById('btn-fotograf-sil').addEventListener('click', fotografTemizle);

  // Arama kutusu odaklanınca geçmişi göster
  document.getElementById('arama-kutusu').addEventListener('focus', aramaGecmisiniGoster);

  // Karanlık tema butonu
  document.getElementById('btn-tema').addEventListener('click', temaToggle);

  // İstatistik ve ayarlar geri butonları
  document.getElementById('btn-istatistik-geri').addEventListener('click', () => {
    ekranGoster('ekran-liste');
  });
  document.getElementById('btn-ayarlar-geri').addEventListener('click', () => {
    ekranGoster('ekran-liste');
  });

  // CSV dışa aktar
  document.getElementById('btn-csv-aktar').addEventListener('click', async () => {
    const sonucDiv = document.getElementById('yedek-sonuc');
    try {
      const sayi = await csvDisaAktar();
      if (sayi !== undefined) {
        sonucDiv.innerHTML = `<p style="color:green">${sayi} kayıt CSV olarak dışa aktarıldı.</p>`;
      }
    } catch (hata) {
      sonucDiv.innerHTML = `<p style="color:red">Hata: ${hata.message}</p>`;
    }
  });

  // JSON dışa aktar
  document.getElementById('btn-disa-aktar').addEventListener('click', async () => {
    const sonucDiv = document.getElementById('yedek-sonuc');
    try {
      const sayi = await disaAktar();
      if (sayi !== undefined) {
        sonucDiv.innerHTML = `<p style="color:green">${sayi} kayıt dışa aktarıldı.</p>`;
      }
    } catch (hata) {
      sonucDiv.innerHTML = `<p style="color:red">Hata: ${hata.message}</p>`;
    }
  });

  // İçe aktar
  document.getElementById('btn-ice-aktar').addEventListener('click', async () => {
    const dosyaInput = document.getElementById('f-yedek-dosya');
    const sonucDiv = document.getElementById('yedek-sonuc');

    if (!dosyaInput.files || dosyaInput.files.length === 0) {
      sonucDiv.innerHTML = '<p style="color:red">Lütfen bir yedek dosyası seç.</p>';
      return;
    }

    const mod = document.querySelector('input[name="ice-aktar-mod"]:checked').value;

    if (mod === 'uzerineYaz') {
      if (!confirm('Mevcut tüm kayıtlar silinecek ve yedekteki kayıtlarla değiştirilecek. Emin misin?')) {
        return;
      }
    }

    try {
      const dosya = dosyaInput.files[0];
      const csvMi = dosya.name.toLowerCase().endsWith('.csv');
      const sayi = csvMi
        ? await csvIceAktar(dosya, mod)
        : await iceAktar(dosya, mod);
      sonucDiv.innerHTML = `<p style="color:green">${sayi} kayıt ${csvMi ? 'CSV' : 'JSON'} dosyasından içe aktarıldı.</p>`;
      dosyaInput.value = '';
      await listeYenile();
    } catch (hata) {
      sonucDiv.innerHTML = `<p style="color:red">Hata: ${hata.message}</p>`;
    }
  });
}

// ===== ETİKET OTOMATİK TAMAMLAMA =====
async function etiketOneriGoster() {
  const input = document.getElementById('f-etiketler');
  const onerilerDiv = document.getElementById('etiket-oneriler');
  const deger = input.value;

  // Son virgülden sonraki kısmı al (şu an yazılan etiket)
  const parcalar = deger.split(',');
  const yazilan = parcalar[parcalar.length - 1].trim().toLowerCase();

  if (yazilan.length < 1) {
    onerilerDiv.style.display = 'none';
    return;
  }

  const tumEtiketler = await tumEtiketleriGetir();
  // Zaten eklenmiş etiketleri hariç tut
  const mevcutlar = parcalar.slice(0, -1).map(p => p.trim().toLowerCase());
  const eslesen = tumEtiketler
    .filter(e => e.includes(yazilan) && !mevcutlar.includes(e))
    .slice(0, 8);

  if (eslesen.length === 0) {
    onerilerDiv.style.display = 'none';
    return;
  }

  onerilerDiv.innerHTML = '';
  eslesen.forEach(etiket => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'etiket-oneri';
    btn.textContent = etiket;
    btn.addEventListener('click', () => {
      // Son yazılan kısmı seçilen etiketle değiştir
      parcalar[parcalar.length - 1] = ' ' + etiket;
      input.value = parcalar.join(',') + ', ';
      onerilerDiv.style.display = 'none';
      input.focus();
    });
    onerilerDiv.appendChild(btn);
  });
  onerilerDiv.style.display = '';
}

// ===== KAYIT ŞABLONLARI =====
const SABLONLAR = [
  {
    ad: '🖨️ Yazıcı',
    kategori: 'Yazıcı',
    baslik: '',
    belirti: '',
    cozum: '',
    etiketler: 'yazıcı'
  },
  {
    ad: '🌐 Ağ/İnternet',
    kategori: 'Ağ / Kablolama',
    baslik: '',
    belirti: 'İnternet bağlantısı yok / yavaş',
    cozum: '',
    etiketler: 'ağ, internet'
  },
  {
    ad: '🔒 VPN',
    kategori: 'VPN',
    baslik: 'VPN bağlantı sorunu',
    belirti: 'VPN bağlanamıyor',
    cozum: '',
    etiketler: 'vpn'
  },
  {
    ad: '💻 Windows',
    kategori: 'Windows / Yazılım',
    baslik: '',
    belirti: '',
    cozum: '',
    etiketler: 'windows'
  },
  {
    ad: '👤 Hesap',
    kategori: 'Kullanıcı hesabı',
    baslik: '',
    belirti: 'Kullanıcı giriş yapamıyor',
    cozum: '',
    etiketler: 'hesap, şifre'
  },
  {
    ad: '📧 E-posta',
    kategori: 'Office / E-posta',
    baslik: '',
    belirti: 'E-posta gönderilemiyor / alınamıyor',
    cozum: '',
    etiketler: 'e-posta, outlook'
  }
];

function sablonlariOlustur() {
  const wrap = document.getElementById('sablon-butonlar');
  wrap.innerHTML = '';
  SABLONLAR.forEach(sablon => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cip';
    btn.textContent = sablon.ad;
    btn.addEventListener('click', () => sablonUygula(sablon));
    wrap.appendChild(btn);
  });
}

function sablonUygula(sablon) {
  if (sablon.baslik) document.getElementById('f-baslik').value = sablon.baslik;
  if (sablon.kategori) document.getElementById('f-kategori').value = sablon.kategori;
  if (sablon.belirti) document.getElementById('f-belirti').value = sablon.belirti;
  if (sablon.cozum) document.getElementById('f-cozum').value = sablon.cozum;
  if (sablon.etiketler) {
    document.getElementById('f-etiketler').value = sablon.etiketler;
    document.getElementById('ek-alanlar').setAttribute('open', '');
  }
}

// ===== FOTOĞRAF KÜÇÜLTME =====
// Canvas kullanarak fotoğrafı max 800px genişliğe küçültür ve JPEG %75 kaliteye sıkıştırır
function fotografKucult(dosya) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_GEN = 800;
        let gen = img.width;
        let yuk = img.height;
        if (gen > MAX_GEN) {
          yuk = Math.round(yuk * MAX_GEN / gen);
          gen = MAX_GEN;
        }
        const canvas = document.createElement('canvas');
        canvas.width = gen;
        canvas.height = yuk;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, gen, yuk);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = () => reject(new Error('Fotoğraf yüklenemedi'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Dosya okunamadı'));
    reader.readAsDataURL(dosya);
  });
}

function fotografOnizlemeGoster(base64) {
  fotografBase64 = base64;
  const onizleme = document.getElementById('fotograf-onizleme');
  document.getElementById('fotograf-img').src = base64;
  onizleme.style.display = '';
}

function fotografTemizle() {
  fotografBase64 = null;
  document.getElementById('f-fotograf').value = '';
  document.getElementById('fotograf-onizleme').style.display = 'none';
}

// ===== KARANLIK TEMA =====
function temaYukle() {
  const tema = localStorage.getItem('cozum-defteri-tema');
  if (tema === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  temaButonGuncelle();
}

function temaToggle() {
  const suAnki = document.documentElement.getAttribute('data-theme');
  if (suAnki === 'dark') {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('cozum-defteri-tema', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('cozum-defteri-tema', 'dark');
  }
  temaButonGuncelle();
}

function temaButonGuncelle() {
  const btn = document.getElementById('btn-tema');
  if (!btn) return;
  const karanlik = document.documentElement.getAttribute('data-theme') === 'dark';
  btn.textContent = karanlik ? 'Aydınlık Tema' : 'Karanlık Tema';
}

// ===== ARAMA GEÇMİŞİ =====
const ARAMA_GECMIS_ANAHTAR = 'cozum-defteri-arama-gecmisi';
const ARAMA_GECMIS_LIMIT = 5;

function aramaGecmisiKaydet(sorgu) {
  if (!sorgu || sorgu.length < 2) return;
  let gecmis = [];
  try { gecmis = JSON.parse(localStorage.getItem(ARAMA_GECMIS_ANAHTAR)) || []; } catch(e) {}
  // Aynı sorgu varsa sil (en başa taşınacak)
  gecmis = gecmis.filter(g => g !== sorgu);
  gecmis.unshift(sorgu);
  if (gecmis.length > ARAMA_GECMIS_LIMIT) gecmis = gecmis.slice(0, ARAMA_GECMIS_LIMIT);
  try { localStorage.setItem(ARAMA_GECMIS_ANAHTAR, JSON.stringify(gecmis)); } catch(e) {}
}

function aramaGecmisiniGoster() {
  const div = document.getElementById('arama-gecmisi');
  let gecmis = [];
  try { gecmis = JSON.parse(localStorage.getItem(ARAMA_GECMIS_ANAHTAR)) || []; } catch(e) {}

  if (gecmis.length === 0) {
    div.style.display = 'none';
    return;
  }

  div.innerHTML = '<small class="arama-gecmisi-baslik">Son aramalar:</small><br>';
  gecmis.forEach(sorgu => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'arama-gecmisi-oge';
    btn.textContent = sorgu;
    btn.addEventListener('click', () => {
      document.getElementById('arama-kutusu').value = sorgu;
      aramaYap();
    });
    div.appendChild(btn);
  });
  div.style.display = '';
}

// ===== İSTATİSTİK =====
async function istatistikGoster() {
  const tumKayitlar = await db.kayitlar.toArray();
  const toplam = tumKayitlar.length;

  if (toplam === 0) {
    document.getElementById('ist-ozet').innerHTML = '<p class="bos-mesaj">Henüz kayıt yok.</p>';
    return;
  }

  // Toplam süre
  const toplamSure = tumKayitlar.reduce((t, k) => t + (k.sure || 0), 0);
  const toplamTekrar = tumKayitlar.reduce((t, k) => t + (k.tekrarSayisi || 1), 0);
  const acikSorun = tumKayitlar.filter(k => k.durum === 'Açık' || k.durum === 'Geçici çözüm').length;

  // Özet kartları
  document.getElementById('ist-ozet').innerHTML = `
    <div class="ist-kart"><span class="sayi">${toplam}</span><span class="etiket">Toplam Kayıt</span></div>
    <div class="ist-kart"><span class="sayi">${acikSorun}</span><span class="etiket">Açık / Geçici</span></div>
    <div class="ist-kart"><span class="sayi">${toplamSure}</span><span class="etiket">Toplam dk</span></div>
    <div class="ist-kart"><span class="sayi">${toplamTekrar}</span><span class="etiket">Toplam Tekrar</span></div>
  `;

  // Kategori dağılımı
  const kategoriSayac = {};
  tumKayitlar.forEach(k => {
    const kat = k.kategori || 'Diğer';
    kategoriSayac[kat] = (kategoriSayac[kat] || 0) + 1;
  });
  const kategoriSirali = Object.entries(kategoriSayac).sort((a, b) => b[1] - a[1]);
  document.getElementById('ist-kategori').innerHTML = kategoriSirali.map(([kat, sayi]) =>
    cubukHTML(kat, sayi, toplam)
  ).join('');

  // Durum dağılımı
  const durumSayac = {};
  tumKayitlar.forEach(k => {
    const d = k.durum || 'Çözüldü';
    durumSayac[d] = (durumSayac[d] || 0) + 1;
  });
  const durumSirali = Object.entries(durumSayac).sort((a, b) => b[1] - a[1]);
  document.getElementById('ist-durum').innerHTML = durumSirali.map(([durum, sayi]) =>
    cubukHTML(durum, sayi, toplam)
  ).join('');

  // En çok tekrar eden (tekrarSayisi > 1 olanlar)
  const tekrarlilar = tumKayitlar
    .filter(k => (k.tekrarSayisi || 1) > 1)
    .sort((a, b) => (b.tekrarSayisi || 1) - (a.tekrarSayisi || 1))
    .slice(0, 10);

  if (tekrarlilar.length === 0) {
    document.getElementById('ist-tekrar').innerHTML = '<p><small>Henüz tekrar eden sorun yok.</small></p>';
  } else {
    document.getElementById('ist-tekrar').innerHTML = '<ul class="ist-tekrar-liste">' +
      tekrarlilar.map(k =>
        `<li><span>${htmlKacis(k.baslik)}</span><strong>${k.tekrarSayisi}x</strong></li>`
      ).join('') + '</ul>';
  }

  // Aylık kayıt sayısı (son 6 ay)
  const aylikSayac = {};
  tumKayitlar.forEach(k => {
    if (!k.tarih) return;
    const ayAnahtar = k.tarih.slice(0, 7); // YYYY-MM
    aylikSayac[ayAnahtar] = (aylikSayac[ayAnahtar] || 0) + 1;
  });
  const aylarSirali = Object.entries(aylikSayac).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
  const aylikMax = Math.max(...aylarSirali.map(a => a[1]));

  document.getElementById('ist-aylik').innerHTML = aylarSirali.map(([ay, sayi]) => {
    const [y, m] = ay.split('-');
    const ayAdi = ayAdiGetir(parseInt(m));
    return cubukHTML(`${ayAdi} ${y}`, sayi, aylikMax);
  }).join('');

  ekranGoster('ekran-istatistik');
}

function cubukHTML(etiket, sayi, maks) {
  const yuzde = Math.round((sayi / maks) * 100);
  return `<div class="ist-cubuk-wrap">
    <div class="ist-cubuk-baslik"><span>${htmlKacis(etiket)}</span><span>${sayi}</span></div>
    <div class="ist-cubuk"><div class="ist-cubuk-dolu" style="width:${yuzde}%"></div></div>
  </div>`;
}

function ayAdiGetir(ay) {
  const aylar = ['', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  return aylar[ay] || '';
}
