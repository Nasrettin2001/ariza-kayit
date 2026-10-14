# CLAUDE.md: Çözüm Defteri (geçici ad)

Bu dosya Claude Code'un bu klasörde her oturumda okuduğu proje talimatlarıdır.

## Proje nedir
Petka (kalıp şirketi) IT biriminde çözülen sorunları telefondan hızlıca kaydetmek ve
sorun tekrar ettiğinde birkaç kelimeyle geçmiş çözümü bulmak için bir **PWA** (ana ekrana
eklenebilen, çevrimdışı çalışan web uygulaması).

- Uygulama adı: **Çözüm Defteri** (geçici; seçenekler `docs/isim-onerileri.md` içinde).
  Ad değişirse: bu dosya, `README.md`, `manifest.json` (`name`, `short_name`) ve `index.html` `<title>` güncellenir.
- Tam plan: `docs/plan.md` · Veri modeli: `docs/veri-modeli.md` · Arama: `docs/arama.md` · Yapım adımları ve ilerleme: `docs/yol-haritasi.md`

## Geliştirici hakkında
- Nasrettin, IT uzman yardımcısı. Yazılım tecrübesi az, öğrenerek ilerliyor.
- **Her zaman Türkçe konuş.** Kod içindeki yorumlar da Türkçe olsun.
- Her adımda ne yaptığını ve neden yaptığını kısa ve sade anlat; yeni bir kavram (IndexedDB,
  service worker, promise vb.) ilk geçtiğinde bir cümleyle açıkla.
- Büyük değişiklikleri tek seferde yapma. Küçük, denenebilir parçalar halinde ilerle ve her
  parçadan sonra "şimdi tarayıcıda şunu dene" diye nasıl test edileceğini söyle.

## Teknik yığın (değiştirmeden önce sor)
- Düz **HTML + JavaScript (ES modülleri)**. React/Vue/derleme aracı (npm build, Vite vb.) YOK.
- Görünüm: **Pico.css** (CDN). Mobil öncelikli tasarım.
- Veri: **IndexedDB**, **Dexie.js** ile (CDN). Veri sadece cihazda kalır.
- Arama: **Fuse.js** (CDN) + kendi Türkçe normalleştirme fonksiyonu.
- PWA: `manifest.json` + `service-worker.js`.
- Yayın: GitHub Pages (repo adı önerisi: `petka-ariza-kayit`).
- Kütüphaneler CDN'den belirli bir sürümle yüklenir (ör. `dexie@4.0.8`), sürümsüz bağlantı kullanma.
  Service worker çevrimdışı çalışma için bu CDN dosyalarını da önbelleğe almalı.

## Klasör yapısı
```
index.html          ana sayfa (tüm ekranlar tek sayfada, JS ile değişir)
style.css           Pico üstüne küçük özelleştirmeler
js/app.js           ekranlar ve olaylar
js/db.js            Dexie veritabanı tanımı ve kayıt işlemleri
js/arama.js         Türkçe normalleştirme + Fuse.js arama
js/yedek.js         JSON/CSV dışa ve içe aktarma
manifest.json
service-worker.js
icons/              icon-192.png, icon-512.png
docs/               plan ve tasarım belgeleri
```

## Kurallar
- **Şifre, VPN anahtarı, admin parolası gibi gizli bilgiler için alan ekleme.** Uygulama
  bunları saklamak için değil. Kullanıcı bu tür bilgi girmeye çalışırsa uyarı metni gösterilebilir.
- Gerçek şirket verisi (IP, kullanıcı adları) repoya / örnek veriye konmaz; örnek veriler uydurma olsun.
- Veritabanı şeması değişirse Dexie `version()` numarasını artır ve eski veriyi taşı; mevcut kayıtlar asla kaybolmamalı.
- Yedekleme (Adım 4) bitmeden "gerçek veri girmeye başla" deme.
- Service worker'da önbellek adı sürümlü olsun (`cozum-defteri-v1`); dosyalar değişince sürümü artır,
  yoksa telefon eski sürümü göstermeye devam eder.
- Arayüz metinleri Türkçe. Tarihler `GG.AA.YYYY` biçiminde gösterilir, `YYYY-AA-GG` olarak saklanır.

## Nasıl çalıştırılır / test edilir
- VS Code + **Live Server** eklentisi: `index.html` sağ tık > "Open with Live Server".
- Alternatif (Python kuruluysa): klasörde `python -m http.server 8000`, sonra `http://localhost:8000`.
- Dosyayı çift tıklayıp `file://` ile açma: modüller ve service worker çalışmaz.
- Telefonda deneme: GitHub Pages'e yayınladıktan sonra Chrome > menü > "Ana ekrana ekle".

## İlerleme takibi
`docs/yol-haritasi.md` içindeki kutucukları bir adım bittiğinde işaretle (`- [x]`). Yeni oturumda
önce bu dosyaya bakıp kalınan yerden devam et.
