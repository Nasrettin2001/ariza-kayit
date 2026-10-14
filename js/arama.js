import { db } from './db.js';

// Türkçe karakterleri ASCII karşılıklarına çevirir
// "bağlanmıyor" → "baglanmiyor", "YAZICI" → "yazici"
const TURK_HARF = { 'ı': 'i', 'ş': 's', 'ğ': 'g', 'ü': 'u', 'ö': 'o', 'ç': 'c',
                     'İ': 'i', 'Ş': 's', 'Ğ': 'g', 'Ü': 'u', 'Ö': 'o', 'Ç': 'c' };

function turkceNormalize(metin) {
  if (!metin) return '';
  return metin
    .toLocaleLowerCase('tr')
    .replace(/[ışğüöçİŞĞÜÖÇ]/g, harf => TURK_HARF[harf] || harf);
}

// Kayıtları Fuse.js ile arar
// sorgu: kullanıcının yazdığı metin
// filtre: { kategori: 'Yazıcı' } gibi isteğe bağlı filtre
async function kayitAra(sorgu, filtre = {}) {
  let kayitlar = await db.kayitlar.toArray();

  // Önce kategori filtresi uygula (varsa)
  if (filtre.kategori) {
    kayitlar = kayitlar.filter(k => k.kategori === filtre.kategori);
  }

  // Sorgu boşsa filtrelenmiş listeyi tarih sırasıyla döndür
  if (!sorgu || !sorgu.trim()) {
    kayitlar.sort((a, b) => (b.id || 0) - (a.id || 0));
    return kayitlar;
  }

  const normalSorgu = turkceNormalize(sorgu);

  // Her kayda normalleştirilmiş alanlar ekle (Fuse'un arayacağı)
  const hazirKayitlar = kayitlar.map(k => ({
    ...k,
    _baslik: turkceNormalize(k.baslik),
    _belirti: turkceNormalize(k.belirti),
    _cozum: turkceNormalize(k.cozum),
    _sebep: turkceNormalize(k.sebep),
    _cihaz: turkceNormalize(k.cihaz),
    _hataKodu: turkceNormalize(k.hataKodu),
    _etiketler: Array.isArray(k.etiketler) ? k.etiketler.map(turkceNormalize).join(' ') : turkceNormalize(k.etiketler)
  }));

  // Fuse.js ayarları (docs/arama.md'deki ağırlıklara göre)
  const fuse = new Fuse(hazirKayitlar, {
    keys: [
      { name: '_hataKodu', weight: 3 },
      { name: '_baslik',   weight: 2.5 },
      { name: '_etiketler', weight: 2 },
      { name: '_belirti',  weight: 2 },
      { name: '_cihaz',    weight: 1.5 },
      { name: '_sebep',    weight: 1 },
      { name: '_cozum',    weight: 0.5 }
    ],
    threshold: 0.35,
    ignoreLocation: true,
    includeScore: true
  });

  let sonuclar = fuse.search(normalSorgu);

  // Sıralama bonusu: tekrar sayısı ve yakın tarih
  const bugun = new Date();
  sonuclar = sonuclar.map(s => {
    let bonus = 0;
    const tekrar = s.item.tekrarSayisi || 1;
    bonus -= 0.05 * Math.min(tekrar - 1, 5); // çok tekrar eden yukarı çıksın

    if (s.item.tarih) {
      const kayitTarih = new Date(s.item.tarih);
      const gunFarki = (bugun - kayitTarih) / (1000 * 60 * 60 * 24);
      if (gunFarki <= 90) bonus -= 0.03; // son 90 gün bonusu
    }

    return { ...s, skor: s.score + bonus };
  });

  sonuclar.sort((a, b) => a.skor - b.skor);

  return sonuclar.map(s => s.item);
}

export { turkceNormalize, kayitAra };
