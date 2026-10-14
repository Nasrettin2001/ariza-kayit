# Çözülen Sorunlar Uygulaması: Yapım Planı

Amaç: Şirkette bir kez çözdüğün her sorunu telefondan 30 saniyede kaydetmek, sorun tekrar ettiğinde veya benzeri çıktığında birkaç kelime yazıp geçmiş çözümü bulmak.

---

## 1. Hangi yolla yapılır? (Öneri: PWA)

| Seçenek | Ne demek | Artısı | Eksisi | Kime uygun |
|---|---|---|---|---|
| **A. Kodsuz: Google Sheets + AppSheet** | Tablo Google E-Tablolar'da durur, AppSheet ondan otomatik mobil uygulama üretir | 1 günde çalışır, kod yok, fotoğraf ekleme hazır | Arama "benzerini bul" konusunda zayıf, Google hesabına bağlı, özelleştirme sınırlı | Hemen başlamak isteyen |
| **B. Notion / Airtable şablonu** | Hazır veritabanı + mobil uygulaması | Çok hızlı, güzel görünür | Gerçek "uygulama" değil, Türkçe benzerlik araması yok, ücretli limitler | Not tutma alışkanlığı olan |
| **C. PWA (önerilen)** | Kendi yazdığın web uygulaması; telefonda "Ana ekrana ekle" ile uygulama gibi açılır, internetsiz çalışır | Ücretsiz, tamamen senin, akıllı arama yapılabilir, veri telefonunda kalır, öğrenirken yazılım becerisi kazandırır | Birkaç akşam emek ister | Kendin geliştirmek isteyen |
| D. Gerçek mobil uygulama (Flutter / React Native) | Play Store tipi uygulama | En "native" his | Bu ihtiyaç için gereksiz zor, derleme/yayın uğraşı | Şimdilik değil |

**Önerim: C, yani PWA.** Sebebi: "benzer sorunu bul" özelliği uygulamanın kalbi, bunu ancak kendi yazdığın uygulamada iyi yaparsın. Tek HTML/JavaScript projesi olduğu için sunucu, veritabanı kurulumu, Play Store gerekmez. Acele varsa önce A ile başlayıp verileri sonra PWA'ya aktarabilirsin (CSV ile).

### Önerilen teknik yığın (hepsi ücretsiz)
- **Arayüz:** Düz HTML + JavaScript (istersen Vue/React yerine sadece bu; basit kalsın). Görünüm için **Pico.css** veya **Tailwind**.
- **Veri saklama:** Tarayıcının içindeki veritabanı **IndexedDB**, kolay kullanım için **Dexie.js** kütüphanesi. Veri telefonda durur, internet gerekmez.
- **Arama:** **Fuse.js** (yazım hatalarını tolere eden "bulanık" arama) + kendi Türkçe karakter düzeltmen.
- **Çevrimdışı + ana ekrana ekleme:** `manifest.json` + `service-worker.js` (PWA'nın iki zorunlu dosyası).
- **Yayın:** **GitHub Pages** veya **Netlify** (ücretsiz, HTTPS hazır; PWA HTTPS ister). Veri yine sadece telefonunda kalır, siteye yüklenmez.
- **Yedek:** Uygulama içinde "JSON dışa aktar / içe aktar" butonu. Haftada bir dosyayı QNAP'a veya Drive'a at.

> Not: Veri sadece telefonda olursa telefon değişince/bozulunca gider. Yedek butonu bu yüzden ilk sürümde olmalı. İleride bilgisayardan da erişmek istersen bölüm 6'ya bak.

---

## 2. Veri modeli (bir "kayıt" neleri tutar)

Her çözülen sorun = bir kayıt.

| Alan | Tür | Örnek | Zorunlu mu |
|---|---|---|---|
| `id` | otomatik | 42 | evet |
| `baslik` | kısa metin | "Muhasebe yazıcısı soluk basıyor" | evet |
| `kategori` | listeden seç | Yazıcı | evet |
| `altKategori` | listeden seç | Drum / Toner | hayır |
| `cihaz` | metin (listeden önerili) | "Brother HL-L2350, Muhasebe" | hayır |
| `kullaniciBolum` | metin | "Ayşe H., Muhasebe" | hayır |
| `belirti` | uzun metin | "Sayfanın sol tarafı soluk, gri çizgi var" | evet |
| `hataKodu` | metin | "Drum End Soon", "0x0000011b" | hayır |
| `sebep` | uzun metin | "Drum ömrü dolmuş" | hayır |
| `cozum` | uzun metin, adım adım | "1) Drum değişti 2) Sayaç sıfırlandı..." | evet |
| `etiketler` | çoklu etiket | drum, soluk-baski, brother | hayır |
| `sure` | dakika | 20 | hayır |
| `fotograflar` | resim (küçültülmüş) | hata ekranı | hayır |
| `tarih` | tarih | 2026-10-13 | otomatik |
| `tekrarSayisi` | sayı | 3 | otomatik ("Bu yine oldu" butonuna basınca artar) |
| `sonTekrar` | tarih | | otomatik |
| `durum` | Çözüldü / Geçici çözüm / Açık | Çözüldü | evet |

**Başlangıç kategorileri** (sonra ayarlardan eklenebilsin):
Yazıcı · Ağ / Kablolama · Firewall (Zyxel USG) · VLAN · VPN · IP / MAC · NAS (QNAP) · Donanım · Windows / Yazılım · Office / E-posta · Kullanıcı hesabı · Sistem odası · Diğer

**Önemli kural:** Şifre, VPN anahtarı, admin parolası gibi bilgileri bu uygulamaya yazma. Bunlar için şifre yöneticisi (Bitwarden, KeePass) kullan. Uygulamaya "şifre X yerinde" gibi işaret yazmak yeterli.

---

## 3. "Benzer sorunu bul" nasıl çalışır

Kullanıcı arama kutusuna "yazıcı soluk" veya "vpn baglanmiyo" yazar. Uygulama şu sırayla çalışır:

1. **Türkçe normalleştirme:** Hem aranan metin hem kayıtlar küçük harfe çevrilir ve `ı→i, ş→s, ğ→g, ü→u, ö→o, ç→c` yapılır. Böylece "baglanmiyor" ile "bağlanmıyor" eşleşir.
2. **Bulanık arama (Fuse.js):** Başlık, belirti, hata kodu, etiketler, sebep, çözüm alanlarında aranır. Yazım hataları tolere edilir.
3. **Alan ağırlıkları:** Eşleşme nerede olduğuna göre puan alır. Öneri: hataKodu ×3, başlık ×2.5, etiketler ×2, belirti ×2, cihaz ×1.5, sebep ×1, çözüm ×0.5.
4. **Filtreler:** Üstte kategori çipleri (Yazıcı, VPN...) ve cihaz filtresi. Seçilirse sonuçlar daralır.
5. **Sıralama bonusu:** Çok tekrar eden ve yakın tarihli kayıtlar biraz yukarı çıkar.
6. **Yeni kayıt girerken otomatik öneri:** Başlık/belirti yazarken altta "Buna benzer 3 kayıt var" çıkar. Hem çözümü hemen bulursun hem aynı sorunu iki kez kaydetmezsin (o kayıtta "Bu yine oldu" dersin).

İleri seviye (zorunlu değil, sonra): Anlam benzerliği ("internet yok" ile "ağ bağlantısı kesik" eşleşsin) için yapay zeka vektör araması eklenebilir. İlk sürüm için gerek yok; iyi etiketleme + Fuse.js çok iş görür.

---

## 4. Ekranlar

1. **Ana ekran / Arama:** Üstte büyük arama kutusu, altında kategori çipleri, altında son eklenen ve en çok tekrar eden kayıtlar. Sağ altta büyük "+" butonu.
2. **Kayıt detayı:** Başlık, kategori, belirti, sebep, çözüm adımları, fotoğraflar. Butonlar: "Bu yine oldu" (tekrar sayısını artırır), Düzenle, Kopyala (benzer yeni kayıt için şablon).
3. **Yeni kayıt / düzenle:** Zorunlu alanlar üstte (başlık, kategori, belirti, çözüm), gerisi "Daha fazla" altında. Amaç: sahada 30 saniyede kaydetmek, detayı sonra tamamlamak.
4. **Ayarlar:** Kategori ve cihaz listesi düzenleme, JSON/CSV dışa aktar, içe aktar.
5. (Sonra) **İstatistik:** Hangi kategoride kaç sorun, en çok arıza veren cihaz. Yönetime "en çok sorun çıkaran yazıcı bu, değişmeli" demek için işe yarar.

---

## 5. Adım adım yapım yolu

Her adım kendi başına çalışan bir sürüm verir. Bir adımı bitirmeden diğerine geçme.

**Adım 0: Hazırlık (1 akşam)**
- Bilgisayara **VS Code** kur, eklenti olarak **Live Server** ekle.
- Ücretsiz **GitHub** hesabın var; yeni bir repo aç: `petka-ariza-kayit`.
- Klasör yapısı:
  ```
  index.html
  app.js
  style.css
  manifest.json
  service-worker.js
  icons/ (192px ve 512px ikon)
  ```

**Adım 1: Kayıt ekle ve listele (1-2 akşam)**
- Form: başlık, kategori, belirti, çözüm.
- Dexie.js ile IndexedDB'ye kaydet, ana ekranda listele.
- Performans: Ana ekranda son 20 kayıt gösterilir, "Daha fazla yükle" butonu ile sayfalama.
- Test: 5 sahte kayıt gir, sayfayı yenile, kayıtlar duruyor mu?

**Adım 2: Detay, düzenle, sil (1 akşam)**
- Kayda tıklayınca detay ekranı; düzenle ve sil.
- Diğer alanları (cihaz, hata kodu, etiketler, sebep, durum) ekle.

**Adım 3: Arama (1-2 akşam)**
- Fuse.js ekle, Türkçe normalleştirme fonksiyonunu yaz, alan ağırlıklarını ver.
- Kategori çipleriyle filtre.
- Test: "yazici soluk", "vpn baglanmiyo" gibi bozuk yazımlarla ara.

**Adım 4: Yedekleme (1 akşam)**
- "Dışa aktar" butonu: tüm kayıtları `.json` dosyası olarak indirir.
- "İçe aktar" butonu: dosyadan geri yükler.
- Bu adım bitmeden gerçek verini girmeye başlama.

**Adım 5: PWA yap ve telefona kur (1 akşam)**
- `manifest.json` (ad, ikon, renk) ve `service-worker.js` (dosyaları önbelleğe alır, internetsiz çalışır).
- CDN dosyaları da önbelleğe alınır; kurulumda CDN'e erişilemezse kullanıcıya uyarı gösterilir.
- GitHub Pages'te yayınla (repo Ayarlar > Pages).
- Telefonda Chrome ile adresi aç > menü > "Ana ekrana ekle". Artık uygulama gibi açılır.

**Adım 6: Kullanışlılık (isteğe göre)**
- "Bu yine oldu" butonu ve tekrar sayacı.
- Yeni kayıt yazarken benzer kayıt önerisi.
- Fotoğraf ekleme (yüklemeden önce küçült + JPEG %75 kalite, yoksa telefon hafızası dolar).
- Karanlık tema.
- Etiket otomatik tamamlama (daha önce kullanılan etiketlerden öneri).
- Kayıt şablonları (sık sorun tipleri için hazır form — ör. "Yazıcı arızası", "VPN sorunu").
- Son 5 aramayı hatırlama (hızlı erişim).
- CSV dışa aktarma (Excel'de açılabilir).
- Sabitleme: çok başvurulan çözümleri üste pin'leme.
- Yazdırma görünümü (sistem odası talimatı gibi çözümleri kağıda basma).

**Adım 7: Mevcut kayıtları içeri al**
- Projedeki `bilgi-bankasi/cozulen-sorunlar.md` tablosu ve kafandaki eski çözümler için CSV içe aktarma ekle; ilk 20-30 sorunu bir oturuşta gir. Uygulama ancak dolu olunca işe yarar.

---

## 6. İleride: Bilgisayardan da erişmek / ekibe açmak

İlk sürüm tek kişilik ve telefonda. Sonra ihtiyaç olursa iki yol:
- **Supabase** (ücretsiz katman): Bulutta veritabanı + giriş sistemi. Telefon ve bilgisayar aynı veriyi görür. Şirket verisi dışarıda durur, IT müdürüne sor.
- **QNAP üzerinde kendi sunucun:** QNAP'ın Container Station'ında küçük bir veritabanı (ör. PocketBase) çalıştırırsın, veri şirket içinde kalır. VPN ile dışarıdan da erişirsin. Şirket için en doğru yol bu, ama önce 1-5 adımları bitir.

---

## 7. Başka sayfada geliştirmeye başlarken kullanabileceğin istem

Yeni bir Claude sohbetinde şunu yapıştırabilirsin:

> Şirketteki IT sorunlarını kaydedip sonra arayabileceğim bir PWA yapmak istiyorum. Yazılım tecrübem az, her adımı açıklayarak ilerle. Teknoloji: düz HTML/JS, Dexie.js (IndexedDB), Fuse.js, Pico.css; GitHub Pages'te yayınlanacak, telefonda çevrimdışı çalışacak. Veri modeli ve adımlar ekteki plandaki gibi. Önce Adım 0 ve Adım 1'i yapalım: klasör yapısını ve kayıt ekleyip listeleyen ilk sürümü yaz, VS Code Live Server ile nasıl deneyeceğimi anlat.

(Bu dosyayı da o sohbete ekle.)
