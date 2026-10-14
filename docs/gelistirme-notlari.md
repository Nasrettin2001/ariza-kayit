# Geliştirme Notları

Bu dosya her kodlama oturumunda yapılan değişiklikleri kaydeder.

---

## Oturum 1 — 13.10.2026

### Tamamlanan adımlar
- **Adım 0: Hazırlık** — Klasör yapısı ve tüm dosyalar oluşturuldu
- **Adım 1: Kayıt ekle ve listele** — Temel CRUD (oluştur, oku, güncelle, sil) işlemleri
- **Adım 2: Detay, düzenle, sil** — Detay ekranı ve düzenleme formu

### Oluşturulan dosyalar
| Dosya | Açıklama |
|---|---|
| `index.html` | Ana sayfa — 3 ekran: liste, form, detay (SPA yapısı) |
| `style.css` | Pico.css üstüne özelleştirmeler: FAB butonu, kart tasarımı, ekran geçişleri |
| `js/db.js` | Dexie.js veritabanı tanımı, CRUD fonksiyonları, sayfalı listeleme |
| `js/app.js` | Ekran yönetimi, form işleme, kayıt listeleme, detay görüntüleme |
| `js/arama.js` | Yer tutucu (Adım 3'te doldurulacak) |
| `js/yedek.js` | Yer tutucu (Adım 4'te doldurulacak) |
| `manifest.json` | PWA manifest dosyası (ad, ikon, renk tanımları) |
| `service-worker.js` | Yer tutucu (Adım 5'te doldurulacak) |

### Kullanılan kütüphaneler
| Kütüphane | Sürüm | CDN |
|---|---|---|
| Pico.css | 2.0.6 | `cdn.jsdelivr.net/npm/@picocss/pico@2.0.6` |
| Dexie.js | 4.0.8 | `cdn.jsdelivr.net/npm/dexie@4.0.8` |

### Uygulanan özellikler
1. **3 ekranlı SPA yapısı:** Ana liste, yeni kayıt formu, kayıt detayı — tek HTML'de JS ile geçiş
2. **Dexie.js ile IndexedDB:** Kayıtlar tarayıcıda saklanır, sayfa yenilenince korunur
3. **13 başlangıç kategorisi:** Yazıcı, Ağ/Kablolama, Firewall, VLAN, VPN vb.
4. **Sayfalı listeleme:** Son 20 kayıt gösterilir, "Daha fazla yükle" butonu ile devam
5. **Zorunlu alan kontrolü:** Başlık, Kategori, Belirti, Çözüm alanları boş geçilemez
6. **Ek alanlar "Daha fazla" altında:** Hızlı kayıt için sadece 4 zorunlu alan görünür, detaylar açılır menüde
7. **Tarih formatı:** Saklamada `YYYY-MM-DD`, gösterimde `GG.AA.YYYY`
8. **Etiketler:** Virgülle ayrılır, küçük harfe çevrilir, dizi olarak saklanır
9. **XSS koruması:** Kullanıcı girdisi `htmlKacis()` fonksiyonuyla temizlenir
10. **Düzenle/Sil:** Detay ekranından kayıt düzenlenebilir veya silinebilir (silmeden önce onay)
11. **Mobil uyumlu tasarım:** Pico.css + FAB butonu, telefonda da düzgün görünür

### Dokümantasyonda yapılan güncellemeler
- `docs/veri-modeli.md`: Fotoğraf alanına JPEG %75 kalite notu, yedek boyut uyarısı eklendi
- `docs/arama.md`: Fuse.js eşiği 0.4 → 0.35 olarak düzeltildi
- `docs/plan.md`: Sayfalama notu, CDN uyarısı, 6 yeni özellik önerisi eklendi
- `docs/yol-haritasi.md`: Sayfalama detayı, 6 yeni özellik kutucuğu eklendi

### Test sonuçları
- Kayıt ekleme: Başarılı
- Kayıtları listeleme: Başarılı
- Detay görüntüleme: Başarılı
- Sayfa yenileme sonrası veri korunması: Başarılı
- Mobil görünüm (375x812): Başarılı

### Bilinen eksikler (sonraki adımlarda)
- ~~Arama henüz yok (Adım 3)~~ Tamamlandı
- Yedekleme henüz yok (Adım 4)
- PWA çevrimdışı çalışma henüz yok (Adım 5)
- İkon dosyaları henüz oluşturulmadı (`icons/` klasörü boş)

---

## Oturum 2 — 13.10.2026

### Tamamlanan adımlar
- **Adım 3: Arama** — Türkçe normalleştirme + Fuse.js bulanık arama + kategori filtreleri

### Değişen / eklenen dosyalar
| Dosya | Değişiklik |
|---|---|
| `js/arama.js` | Türkçe normalleştirme fonksiyonu (`turkceNormalize`) ve Fuse.js arama (`kayitAra`) yazıldı |
| `js/app.js` | Arama modülü import edildi, kategori çipleri oluşturma, debounce'lu arama olayı eklendi |
| `index.html` | Fuse.js CDN eklendi (`fuse.js@7.0.0`), kategori çipleri HTML bölümü eklendi |
| `style.css` | Kategori çipleri (`.cip`, `.cip.secili`) ve arama bilgisi (`.arama-bilgi`) stilleri eklendi |

### Kullanılan yeni kütüphane
| Kütüphane | Sürüm | CDN |
|---|---|---|
| Fuse.js | 7.0.0 | `cdn.jsdelivr.net/npm/fuse.js@7.0.0` |

### Uygulanan özellikler
1. **Türkçe normalleştirme:** `ışğüöç` → `isgüöc` dönüşümü, "baglanmiyo" ile "bağlanmıyor" eşleşir
2. **Fuse.js bulanık arama:** Yazım hatalarını tolere eder, threshold 0.35
3. **Alan ağırlıkları:** Hata kodu (×3) > Başlık (×2.5) > Etiketler/Belirti (×2) > Cihaz (×1.5) > Sebep (×1) > Çözüm (×0.5)
4. **Sıralama bonusu:** Çok tekrar eden ve son 90 gün içindeki kayıtlar üste çıkar
5. **Kategori çipleri:** "Tümü" + 13 kategori butonu, tıklayınca o kategoriye göre filtreler
6. **Arama + filtre birlikte:** Kategori seçili iken de arama yapılabilir
7. **Debounce (300ms):** Her tuş vuruşunda değil, 300ms bekleyip arar — performans için
8. **Sonuç sayısı gösterimi:** "X sonuç bulundu" bilgisi

### Test sonuçları
| Sorgu | Beklenen | Sonuç |
|---|---|---|
| `yazici soluk` | "Muhasebe yazıcısı soluk basıyor" ilk sırada | 2 sonuç, doğru sırada |
| `vpn baglanmiyo` | "VPN bağlantısı kopuyor" | 1 sonuç, doğru |
| `0x11b` | "Ağ yazıcısı bulunamıyor" (hata kodu 0x0000011b) | 1 sonuç, doğru |
| Yazıcı filtresi | Sadece Yazıcı kategorisindekiler | 2 sonuç, doğru |
| Yazıcı filtresi + "soluk" | Sadece soluk baskı kaydı | 1 sonuç, doğru |

---

## Oturum 3 — 13.10.2026

### Tamamlanan adımlar
- **Adım 4: Yedekleme** — JSON dışa/içe aktarma + Ayarlar ekranı

### Değişen / eklenen dosyalar
| Dosya | Değişiklik |
|---|---|
| `js/yedek.js` | `disaAktar()` ve `iceAktar()` fonksiyonları yazıldı |
| `js/app.js` | Yedek modülü import, Ayarlar ekranı geçişi, dışa/içe aktar olay dinleyicileri eklendi |
| `index.html` | Ayarlar ekranı (Ekran 4) eklendi, başlık yanına dişli butonu eklendi |
| `style.css` | Başlık satırı düzeni, ayarlar butonu, ayar butonları stilleri eklendi |

### Uygulanan özellikler
1. **JSON dışa aktarma:** Tüm kayıtları ve ayarları `.json` dosyası olarak indirir
2. **Dosya adı otomatik:** `cozum-defteri-yedek-2026-10-13.json` formatında
3. **Büyük dosya uyarısı:** 10 MB üzerinde onay sorar (fotoğraflar dahil olduğunda)
4. **JSON içe aktarma:** Dosya seçip yükler, iki mod:
   - **Birleştir:** Mevcut kayıtların üstüne yeni id ile ekler
   - **Üzerine yaz:** Önce tüm kayıtları siler, sonra yedeği yükler (onay sorar)
5. **Dosya doğrulama:** `uygulama: 'cozum-defteri'` kontrolü — başka dosya kabul etmez
6. **Ayarlar ekranı:** Dişli butonuyla açılır, yedekleme araçlarını içerir
7. **Sonuç mesajı:** İşlem sonrası yeşil (başarılı) / kırmızı (hata) bilgi mesajı

---

## Oturum 4 — 13.10.2026

### Tamamlanan adımlar
- **Adım 5: PWA ve telefona kurulum** — Service worker, manifest, ikonlar, çevrimdışı çalışma

### Değişen / eklenen dosyalar
| Dosya | Değişiklik |
|---|---|
| `service-worker.js` | Önbellekleme stratejisi yazıldı (install/activate/fetch) |
| `manifest.json` | PWA alanları tamamlandı (description, scope, orientation, lang) |
| `icons/icon-192.svg` | SVG ikon oluşturuldu (mavi zemin, "ÇD" yazısı) |
| `icons/icon-512.svg` | SVG ikon oluşturuldu (büyük versiyon) |
| `index.html` | PWA meta etiketleri + service worker kaydı eklendi |

### Uygulanan özellikler
1. **Service Worker:** `cozum-defteri-v1` adlı sürümlü önbellek
2. **Önbellek stratejisi:** Önce önbellek, yoksa ağ (cache-first). Dinamik istekler de önbelleğe eklenir
3. **CDN önbellekleme:** Pico.css, Dexie.js, Fuse.js CDN dosyaları da çevrimdışı erişilebilir
4. **Eski önbellek temizleme:** Sürüm değişince eski önbellek otomatik silinir
5. **Manifest:** standalone mod, portre yönelim, Türkçe dil, tema rengi
6. **Apple desteği:** `apple-mobile-web-app-capable` + `apple-touch-icon` meta etiketleri
7. **SVG ikonlar:** 192x192 ve 512x512, mavi zemin üzerine "ÇD" kısaltması

### Test sonuçları
- Service worker kaydı: Başarılı (`[SW] Kayıt başarılı`)
- Önbellek durumu: `cozum-defteri-v1`, 13 dosya önbelleğe alındı
- Manifest yükleme: Başarılı (name, display, icons doğru)

### Telefona kurulum adımları
1. GitHub Pages'e yayınla (repo Ayarlar > Pages)
2. Telefonda Chrome ile adresi aç
3. Menü (⋮) > "Ana ekrana ekle"
4. Artık uygulama gibi açılır, internetsiz de çalışır

### Sıradaki adım
Adım 6 devam: Fotoğraf ekleme, karanlık tema, etiket otomatik tamamlama, kayıt şablonları, arama geçmişi, CSV dışa aktarma, sabitleme, yazdırma görünümü

---

## Oturum 5 — 13.10.2026

### Tamamlanan adımlar
- **Adım 6 (kısmi): Kullanışlılık** — "Bu yine oldu" butonu + benzer kayıt önerisi

### Değişen / eklenen dosyalar
| Dosya | Değişiklik |
|---|---|
| `js/db.js` | `tekrarArtir()` ve `tumEtiketleriGetir()` fonksiyonları eklendi |
| `js/app.js` | `tekrarIsaretle()`, `benzerleriGoster()` fonksiyonları eklendi; import'lar güncellendi; başlık alanına debounce'lu öneri dinleyicisi eklendi |
| `index.html` | Detay ekranına "Bu yine oldu" butonu, form ekranına benzer öneriler `<div>` eklendi |
| `style.css` | `.benzer-oneriler` ve `.benzer-oneri-kart` stilleri eklendi |

### Uygulanan özellikler
1. **"Bu yine oldu" butonu:** Detay ekranında `contrast` stilinde buton. Tıklayınca `tekrarSayisi` 1 artar, `sonTekrar` tarihi bugüne güncellenir, detay anında yenilenir
2. **Benzer kayıt önerisi:** Yeni kayıt formunda başlık alanına 3+ karakter yazınca mevcut Fuse.js arama motoru ile en benzer 3 kayıt önerilir. Öneriye tıklayınca o kaydın detayına gider (zaten çözülmüşse tekrar yazmaya gerek kalmaz)
3. **`tumEtiketleriGetir()` fonksiyonu:** Etiket otomatik tamamlama için hazırlık (henüz kullanılmıyor, sonraki oturumda)

### Test sonuçları
- "Bu yine oldu" butonu: Başarılı (tekrar 1→2 oldu, detay güncellendi)
- Benzer kayıt önerisi ("yazıcı soluk"): Başarılı (2 öneri gösterildi)
- Öneriye tıklama → detay ekranı: Başarılı
- Konsol hatası: Yok

### Sıradaki adım
Adım 6 devam: Karanlık tema, etiket otomatik tamamlama, arama geçmişi, CSV, sabitleme, yazdırma, fotoğraf, şablonlar

---

## Oturum 6 — 14.10.2026

### Tamamlanan adımlar
- **Adım 6 (devam): Kullanışlılık** — Karanlık tema, etiket otomatik tamamlama, arama geçmişi, CSV dışa aktarma, sabitleme (pin), yazdırma görünümü

### Değişen / eklenen dosyalar
| Dosya | Değişiklik |
|---|---|
| `js/db.js` | `sabitleToggle()` fonksiyonu eklendi. `kayitlariListele()` sabitlenen kayıtları üstte gösterecek şekilde güncellendi |
| `js/yedek.js` | `csvDisaAktar()` fonksiyonu eklendi (BOM'lu UTF-8, Excel uyumlu) |
| `js/app.js` | `temaYukle()`, `temaToggle()`, `temaButonGuncelle()`, `etiketOneriGoster()`, `aramaGecmisiKaydet()`, `aramaGecmisiniGoster()`, `sabitleIsaretle()` fonksiyonları eklendi. Yazdır butonu bağlandı. Kart başlıklarına pin ikonu eklendi |
| `index.html` | Ayarlar: Görünüm bölümü + tema butonu, CSV butonu. Form: etiket öneri div. Liste: arama geçmişi div. Detay: sabitle + yazdır butonları |
| `style.css` | Etiket önerileri, arama geçmişi, yazdırma görünümü (`@media print`) stilleri eklendi |

### Uygulanan özellikler
1. **Karanlık tema:** Pico.css `data-theme="dark"` ile tek butonla geçiş. Tercih `localStorage`'a kaydedilir
2. **Etiket otomatik tamamlama:** Yazarken mevcut etiketlerden eşleşenler gösterilir, tıklayınca ekler. Zaten eklenmişler hariç tutulur
3. **Arama geçmişi:** Son 5 arama `localStorage`'da saklanır, arama kutusu altında butonlar olarak gösterilir
4. **CSV dışa aktarma:** BOM ile UTF-8 encoding (Excel Türkçe karakter desteği). Virgül/tırnak içeren alanlar doğru escape edilir
5. **Sabitleme (pin):** Detay ekranında "📌 Sabitle" butonu. Sabitlenenler listede en üstte gösterilir, kart başlığında pin ikonu çıkar
6. **Yazdırma görünümü:** Detay ekranında "🖨️ Yazdır" butonu. `@media print` ile sadece detay içeriği yazdırılır, butonlar gizlenir

### Test sonuçları
- Karanlık tema geçişi: Başarılı
- Etiket otomatik tamamlama ("dr" → "drum", "sm" → "smb/smtp"): Başarılı
- Arama geçmişi kaydı ve tıklama: Başarılı
- Sabitleme (pin) → listeye en üste çıkma: Başarılı
- CSV butonu: Görünüyor (indirme tarayıcıda test edilebilir)
- Yazdır butonu: Eklenmiş, print CSS hazır
- Mobil görünüm (375x812): Başarılı
- Konsol hatası: Yok

### Sıradaki adım
Adım 6 devam: Fotoğraf ekleme, kayıt şablonları

---

## Oturum 7 — 14.10.2026

### Tamamlanan adımlar
- **Adım 6 (tamamlandı): Kullanışlılık** — Fotoğraf ekleme + kayıt şablonları

### Değişen / eklenen dosyalar
| Dosya | Değişiklik |
|---|---|
| `index.html` | Form: fotoğraf `<input type="file">` + önizleme alanı eklendi. Form üstüne şablon seçici butonlar eklendi |
| `js/app.js` | `fotografKucult()` (Canvas ile max 800px, JPEG %75), `fotografOnizlemeGoster()`, `fotografTemizle()` fonksiyonları eklendi. `SABLONLAR` dizisi ve `sablonlariOlustur()`, `sablonUygula()` fonksiyonları eklendi. Form kaydetme fotoğraf dahil güncellendi. Düzenleme modunda mevcut fotoğraf yüklenir, şablonlar gizlenir. Detay ekranında fotoğraf gösterilir |
| `service-worker.js` | Önbellek sürümü `v2` → `v3` |
| `docs/yol-haritasi.md` | Fotoğraf ekleme ve kayıt şablonları kutuları işaretlendi |

### Uygulanan özellikler
1. **Fotoğraf ekleme:** Telefonun kamerasından veya galeriden fotoğraf seçilir (`capture="environment"` ile arka kamera tercih edilir). Canvas API ile max 800px genişliğe küçültülür ve JPEG %75 kaliteye sıkıştırılır. Base64 olarak IndexedDB'de saklanır. Detay ekranında fotoğrafa tıklayınca büyük görüntülenir
2. **Fotoğraf önizleme:** Seçildikten sonra formda küçük önizleme gösterilir, "Fotoğrafı kaldır" butonuyla silinebilir
3. **Kayıt şablonları:** 6 hazır şablon (Yazıcı, Ağ/İnternet, VPN, Windows, Hesap, E-posta). Yeni kayıt formunun üstünde renkli butonlar. Tıklayınca kategori, belirti ve etiket alanlarını önceden doldurur. Düzenleme modunda şablonlar gizlenir

### Sıradaki adım
Adım 6 tamamen tamamlandı! Sırada Adım 7: CSV içe aktarma + ilk 20-30 sorun girişi

---

## Oturum 8 — 14.10.2026

### Tamamlanan adımlar
- **Adım 7: Eski kayıtları içeri al** — CSV içe aktarma + 25 örnek kayıt

### Değişen / eklenen dosyalar
| Dosya | Değişiklik |
|---|---|
| `js/yedek.js` | `csvParcala()` (çift tırnak destekli CSV parser) ve `csvIceAktar()` fonksiyonları eklendi. Export listesine `csvIceAktar` eklendi |
| `js/app.js` | `csvIceAktar` import edildi. İçe aktarma butonu artık dosya uzantısına göre JSON veya CSV fonksiyonunu çağırıyor |
| `index.html` | Dosya input `.csv` uzantısını da kabul ediyor. Label metni güncellendi |
| `service-worker.js` | Önbellek sürümü `v3` → `v4` |
| `docs/ornek-kayitlar.csv` | 25 adet yaygın IT sorunu içeren örnek CSV dosyası |
| `docs/yol-haritasi.md` | Adım 7 kutuları işaretlendi |

### Uygulanan özellikler
1. **CSV içe aktarma:** `.csv` dosyalarını okuyup kayıtlara dönüştürür. Sütun başlıklarını otomatik eşler (Türkçe ve İngilizce destekli). Çift tırnak içindeki virgül ve satır sonlarını doğru parse eder. BOM'u otomatik kaldırır. GG.AA.YYYY ve YYYY-MM-DD tarih formatlarını tanır. Başlık sütunu zorunlu, kategori yoksa "Diğer" atanır. Birleştir ve üzerine yaz modları çalışır
2. **25 örnek kayıt:** Yazıcı (3), Ağ (2), VPN (2), Windows (3), Office/E-posta (4), Kullanıcı hesabı (2), Firewall (1), VLAN (1), NAS (2), IP/MAC (2), Donanım (2), Sistem odası (1) kategorilerinde gerçekçi IT sorunları. Her kayıtta belirti, çözüm, sebep, cihaz, etiketler, süre ve kullanıcı/bölüm bilgisi var

### Test sonuçları
- CSV import: 25 kayıt başarıyla içe aktarıldı
- Alan eşleme: Tüm alanlar doğru (başlık, kategori, belirti, çözüm, sebep, cihaz, hata kodu, etiketler, süre, tarih, kullanıcı/bölüm)
- Tarih dönüşümü: GG.AA.YYYY → YYYY-MM-DD başarılı
- Etiketler: Noktalı virgülle ayrılan etiketler diziye dönüştürüldü
- Süre: String → sayı dönüşümü başarılı
- Arama testi ("yazıcı soluk"): 2 sonuç, doğru sırada
- Detay ekranı: Tüm alanlar gösteriliyor
- Konsol hatası: Yok

### Sıradaki adım
Adım 7 tamamlandı! Sırada: İstatistik ekranı veya GitHub Pages yayını

---

## Oturum 9 — 14.10.2026

### Tamamlanan adımlar
- **İstatistik ekranı** — Kategori, durum, tekrar ve aylık dağılım grafikleri

### Değişen / eklenen dosyalar
| Dosya | Değişiklik |
|---|---|
| `index.html` | Başlığa istatistik butonu (☰) eklendi. Yeni Ekran 5: İstatistik ekranı eklendi |
| `js/app.js` | `db` import edildi. `istatistikGoster()`, `cubukHTML()`, `ayAdiGetir()` fonksiyonları eklendi. İstatistik butonu olay dinleyicisi eklendi |
| `style.css` | İstatistik kartları (`.ist-kart`), çubuk grafikleri (`.ist-cubuk`), tekrar listesi stilleri eklendi |
| `service-worker.js` | Önbellek sürümü `v4` → `v5` |

### Uygulanan özellikler
1. **Özet kartları:** Toplam kayıt, açık/geçici sorun sayısı, toplam çözüm süresi (dakika), toplam tekrar sayısı — 4 büyük kart halinde
2. **Kategori dağılımı:** Yatay çubuk grafik, en çok kayıt olan kategori en üstte
3. **Durum dağılımı:** Çözüldü / Geçici çözüm / Açık — çubuk grafik
4. **En çok tekrar eden sorunlar:** Top 10, liste halinde (tekrar sayısıyla birlikte)
5. **Aylık kayıt sayısı:** Son 6 ayın çubuk grafiği, Türkçe ay adlarıyla

### Test sonuçları
- 25 kayıtla test: Tüm istatistikler doğru hesaplandı
- Kategori dağılımı: Office/E-posta (4), Yazıcı (3), Windows (3)... doğru
- Aylık: Ağustos (9), Eylül (11), Ekim (5) — doğru
- Konsol hatası: Yok

### Sıradaki adım
GitHub Pages yayını (Adım 5 kalan) veya diğer geliştirmeler
