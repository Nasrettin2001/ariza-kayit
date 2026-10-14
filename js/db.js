// Dexie global olarak yükleniyor (CDN script), burada kullanıyoruz
const db = new Dexie('CozumDefteri');

// Veritabanı şeması: sadece indekslenecek alanlar yazılır, diğer alanlar da saklanır
db.version(1).stores({
  kayitlar: '++id, kategori, cihaz, durum, tarih, tekrarSayisi, *etiketler',
  ayarlar: 'anahtar'
});

// Başlangıç kategorileri
const VARSAYILAN_KATEGORILER = [
  'Yazıcı',
  'Ağ / Kablolama',
  'Firewall (Zyxel USG)',
  'VLAN',
  'VPN',
  'IP / MAC',
  'NAS (QNAP)',
  'Donanım',
  'Windows / Yazılım',
  'Office / E-posta',
  'Kullanıcı hesabı',
  'Sistem odası',
  'Diğer'
];

async function kategorileriYukle() {
  let kayit = await db.ayarlar.get('kategoriler');
  if (!kayit) {
    await db.ayarlar.put({ anahtar: 'kategoriler', deger: VARSAYILAN_KATEGORILER });
    return VARSAYILAN_KATEGORILER;
  }
  return kayit.deger;
}

async function kayitEkle(veri) {
  veri.tarih = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  veri.tekrarSayisi = 1;
  veri.sonTekrar = null;
  veri.guncellenme = new Date().toISOString();

  if (typeof veri.etiketler === 'string') {
    veri.etiketler = veri.etiketler
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0);
  }

  const id = await db.kayitlar.add(veri);
  return id;
}

async function kayitGuncelle(id, veri) {
  veri.guncellenme = new Date().toISOString();

  if (typeof veri.etiketler === 'string') {
    veri.etiketler = veri.etiketler
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0);
  }

  await db.kayitlar.update(id, veri);
}

async function kayitSil(id) {
  await db.kayitlar.delete(id);
}

async function kayitGetir(id) {
  return await db.kayitlar.get(id);
}

// Sayfalı listeleme: sabitlenenler en üstte, sonra en yeni
async function kayitlariListele(sayfa = 0, adet = 20) {
  const tumKayitlar = await db.kayitlar
    .orderBy('id')
    .reverse()
    .toArray();

  // Sabitlenenler üste, diğerleri aşağı
  const sabitler = tumKayitlar.filter(k => k.sabitlendi);
  const digerleri = tumKayitlar.filter(k => !k.sabitlendi);
  const sirali = [...sabitler, ...digerleri];

  const toplam = sirali.length;
  const kayitlar = sirali.slice(sayfa * adet, (sayfa + 1) * adet);
  return { kayitlar, toplam, dahaVar: (sayfa + 1) * adet < toplam };
}

async function sabitleToggle(id) {
  const kayit = await db.kayitlar.get(id);
  if (!kayit) return false;
  const yeniDurum = !kayit.sabitlendi;
  await db.kayitlar.update(id, { sabitlendi: yeniDurum });
  return yeniDurum;
}

// "Bu yine oldu" — tekrar sayacını 1 artırır, sonTekrar tarihini günceller
async function tekrarArtir(id) {
  const kayit = await db.kayitlar.get(id);
  if (!kayit) return null;
  const yeniSayi = (kayit.tekrarSayisi || 1) + 1;
  await db.kayitlar.update(id, {
    tekrarSayisi: yeniSayi,
    sonTekrar: new Date().toISOString().slice(0, 10),
    guncellenme: new Date().toISOString()
  });
  return yeniSayi;
}

// Tüm kayıtlardaki etiketleri toplar (otomatik tamamlama için)
async function tumEtiketleriGetir() {
  const tumKayitlar = await db.kayitlar.toArray();
  const etiketSet = new Set();
  tumKayitlar.forEach(k => {
    if (Array.isArray(k.etiketler)) {
      k.etiketler.forEach(e => etiketSet.add(e));
    }
  });
  return [...etiketSet].sort();
}

export {
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
};
