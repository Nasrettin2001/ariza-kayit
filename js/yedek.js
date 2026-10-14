import { db } from './db.js';

// Tüm kayıtları ve ayarları JSON dosyası olarak indirir
async function disaAktar() {
  const kayitlar = await db.kayitlar.toArray();
  const ayarlar = await db.ayarlar.toArray();

  const yedek = {
    uygulama: 'cozum-defteri',
    surum: 1,
    tarih: new Date().toISOString(),
    kayitSayisi: kayitlar.length,
    kayitlar,
    ayarlar
  };

  const json = JSON.stringify(yedek, null, 2);
  const boyutMB = (new Blob([json]).size / (1024 * 1024)).toFixed(2);

  if (parseFloat(boyutMB) > 10) {
    if (!confirm(`Yedek dosyası ${boyutMB} MB boyutunda (fotoğraflar dahil). Devam etmek istiyor musun?`)) {
      return;
    }
  }

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const tarihStr = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cozum-defteri-yedek-${tarihStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return kayitlar.length;
}

// JSON dosyasından kayıtları içe aktarır
// mod: 'birlestir' (mevcut kayıtların üstüne ekle) veya 'uzerineYaz' (önce sil, sonra yükle)
async function iceAktar(dosya, mod = 'birlestir') {
  const metin = await dosya.text();
  let veri;

  try {
    veri = JSON.parse(metin);
  } catch {
    throw new Error('Geçersiz JSON dosyası. Dosya bozulmuş olabilir.');
  }

  if (veri.uygulama !== 'cozum-defteri') {
    throw new Error('Bu dosya Çözüm Defteri yedeği değil.');
  }

  if (!Array.isArray(veri.kayitlar)) {
    throw new Error('Yedek dosyasında kayıt bulunamadı.');
  }

  if (mod === 'uzerineYaz') {
    await db.kayitlar.clear();
    if (veri.ayarlar) {
      await db.ayarlar.clear();
    }
  }

  let eklenen = 0;
  for (const kayit of veri.kayitlar) {
    const { id, ...veriSiz } = kayit;

    if (mod === 'birlestir') {
      // id olmadan ekle, yeni id oluşsun
      await db.kayitlar.add(veriSiz);
    } else {
      // Orijinal id ile ekle
      await db.kayitlar.add(kayit);
    }
    eklenen++;
  }

  // Ayarları da geri yükle (üzerine yaz modunda)
  if (mod === 'uzerineYaz' && Array.isArray(veri.ayarlar)) {
    for (const ayar of veri.ayarlar) {
      await db.ayarlar.put(ayar);
    }
  }

  return eklenen;
}

// Kayıtları CSV dosyası olarak indirir (Excel / Google Sheets uyumlu)
async function csvDisaAktar() {
  const kayitlar = await db.kayitlar.toArray();
  if (kayitlar.length === 0) {
    alert('Dışa aktarılacak kayıt yok.');
    return 0;
  }

  const basliklar = ['ID', 'Başlık', 'Kategori', 'Belirti', 'Çözüm', 'Sebep', 'Cihaz', 'Hata Kodu', 'Durum', 'Etiketler', 'Süre (dk)', 'Kullanıcı/Bölüm', 'Tarih', 'Tekrar', 'Sabitlendi'];

  const satirlar = kayitlar.map(k => [
    k.id,
    k.baslik || '',
    k.kategori || '',
    k.belirti || '',
    k.cozum || '',
    k.sebep || '',
    k.cihaz || '',
    k.hataKodu || '',
    k.durum || '',
    Array.isArray(k.etiketler) ? k.etiketler.join('; ') : (k.etiketler || ''),
    k.sure || '',
    k.kullaniciBolum || '',
    k.tarih || '',
    k.tekrarSayisi || 1,
    k.sabitlendi ? 'Evet' : ''
  ]);

  // CSV satırı oluştur — çift tırnak içine al, içindeki çift tırnakları iki katla
  const csvSatir = (dizi) => dizi.map(d => {
    const s = String(d);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }).join(',');

  // BOM (Byte Order Mark) ekle — Excel Türkçe karakterleri doğru okusun
  const bom = '﻿';
  const csv = bom + csvSatir(basliklar) + '\n' + satirlar.map(csvSatir).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const tarihStr = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cozum-defteri-${tarihStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return kayitlar.length;
}

// CSV dosyasını satırlara ve sütunlara ayıran yardımcı fonksiyon
// Çift tırnak içindeki virgül ve satır sonlarını doğru işler
function csvParcala(metin) {
  const satirlar = [];
  let satir = [];
  let alan = '';
  let tirnaklaMi = false;

  for (let i = 0; i < metin.length; i++) {
    const c = metin[i];

    if (tirnaklaMi) {
      if (c === '"') {
        if (metin[i + 1] === '"') {
          alan += '"';
          i++;
        } else {
          tirnaklaMi = false;
        }
      } else {
        alan += c;
      }
    } else {
      if (c === '"') {
        tirnaklaMi = true;
      } else if (c === ',') {
        satir.push(alan.trim());
        alan = '';
      } else if (c === '\n' || (c === '\r' && metin[i + 1] === '\n')) {
        if (c === '\r') i++;
        satir.push(alan.trim());
        if (satir.some(s => s.length > 0)) satirlar.push(satir);
        satir = [];
        alan = '';
      } else {
        alan += c;
      }
    }
  }
  satir.push(alan.trim());
  if (satir.some(s => s.length > 0)) satirlar.push(satir);

  return satirlar;
}

// CSV dosyasından kayıtları içe aktarır
async function csvIceAktar(dosya, mod = 'birlestir') {
  let metin = await dosya.text();

  // BOM varsa kaldır
  if (metin.charCodeAt(0) === 0xFEFF) metin = metin.slice(1);

  const satirlar = csvParcala(metin);
  if (satirlar.length < 2) {
    throw new Error('CSV dosyası boş veya sadece başlık satırı içeriyor.');
  }

  // Başlık satırından sütun eşlemesi
  const basliklar = satirlar[0].map(b => b.toLowerCase().trim());

  // Bilinen sütun adları → kayıt alanları eşlemesi
  const eslesme = {
    'başlık': 'baslik', 'baslik': 'baslik', 'title': 'baslik',
    'kategori': 'kategori', 'category': 'kategori',
    'belirti': 'belirti', 'symptom': 'belirti',
    'çözüm': 'cozum', 'cozum': 'cozum', 'solution': 'cozum',
    'sebep': 'sebep', 'cause': 'sebep', 'neden': 'sebep',
    'cihaz': 'cihaz', 'device': 'cihaz',
    'hata kodu': 'hataKodu', 'hatakodu': 'hataKodu', 'error code': 'hataKodu',
    'durum': 'durum', 'status': 'durum',
    'etiketler': 'etiketler', 'tags': 'etiketler',
    'süre (dk)': 'sure', 'süre': 'sure', 'sure': 'sure', 'duration': 'sure',
    'kullanıcı/bölüm': 'kullaniciBolum', 'kullanıcı / bölüm': 'kullaniciBolum',
    'kullanici/bolum': 'kullaniciBolum', 'user': 'kullaniciBolum',
    'tarih': 'tarih', 'date': 'tarih',
    'tekrar': 'tekrarSayisi', 'repeat': 'tekrarSayisi',
  };

  // Sütun indeksleri
  const sutunlar = {};
  basliklar.forEach((b, i) => {
    const alan = eslesme[b];
    if (alan) sutunlar[i] = alan;
  });

  // En az başlık sütunu olmalı
  const alanDegerleri = Object.values(sutunlar);
  if (!alanDegerleri.includes('baslik')) {
    throw new Error('CSV dosyasında "Başlık" sütunu bulunamadı. Sütun başlıkları doğru mu?');
  }

  if (mod === 'uzerineYaz') {
    await db.kayitlar.clear();
  }

  let eklenen = 0;
  const bugun = new Date().toISOString().slice(0, 10);

  for (let i = 1; i < satirlar.length; i++) {
    const degerler = satirlar[i];
    const kayit = {
      tarih: bugun,
      tekrarSayisi: 1,
      sonTekrar: null,
      durum: 'Çözüldü',
      guncellenme: new Date().toISOString()
    };

    for (const [idx, alan] of Object.entries(sutunlar)) {
      const deger = degerler[parseInt(idx)] || '';
      if (!deger) continue;

      if (alan === 'etiketler') {
        kayit.etiketler = deger.split(/[;,]/).map(e => e.trim().toLowerCase()).filter(e => e);
      } else if (alan === 'sure' || alan === 'tekrarSayisi') {
        const sayi = parseInt(deger);
        if (!isNaN(sayi)) kayit[alan] = sayi;
      } else if (alan === 'tarih') {
        // GG.AA.YYYY veya YYYY-MM-DD formatını kabul et
        if (deger.includes('.')) {
          const [g, a, y] = deger.split('.');
          if (y && a && g) kayit.tarih = `${y}-${a.padStart(2,'0')}-${g.padStart(2,'0')}`;
        } else {
          kayit.tarih = deger;
        }
      } else {
        kayit[alan] = deger;
      }
    }

    // Başlık zorunlu
    if (!kayit.baslik) continue;
    // Kategori yoksa "Diğer" ata
    if (!kayit.kategori) kayit.kategori = 'Diğer';

    await db.kayitlar.add(kayit);
    eklenen++;
  }

  return eklenen;
}

export { disaAktar, iceAktar, csvDisaAktar, csvIceAktar };
