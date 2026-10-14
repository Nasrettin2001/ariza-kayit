# Veri Modeli

Her çözülen sorun = bir kayıt. Dexie tablo adı: `kayitlar`.

## Alanlar
| Alan | Tür | Örnek | Zorunlu | Not |
|---|---|---|---|---|
| `id` | sayı (otomatik) | 42 | evet | Dexie `++id` |
| `baslik` | metin | "Muhasebe yazıcısı soluk basıyor" | evet | |
| `kategori` | listeden | "Yazıcı" | evet | |
| `altKategori` | listeden | "Drum / Toner" | hayır | |
| `cihaz` | metin | "Brother HL-L2350, Muhasebe" | hayır | Önceki girişlerden öneri |
| `kullaniciBolum` | metin | "Muhasebe" | hayır | |
| `belirti` | uzun metin | "Sol taraf soluk, gri çizgi" | evet | |
| `hataKodu` | metin | "Drum End Soon" | hayır | |
| `sebep` | uzun metin | "Drum ömrü dolmuş" | hayır | |
| `cozum` | uzun metin | "1) Drum değişti 2) Sayaç sıfırlandı" | evet | |
| `etiketler` | metin dizisi | `["drum","brother"]` | hayır | Dexie çoklu indeks `*etiketler` |
| `sure` | sayı (dk) | 20 | hayır | |
| `fotograflar` | Blob dizisi | | hayır | Kaydetmeden önce ~1280px'e küçült, JPEG kalite %75 |
| `tarih` | `YYYY-AA-GG` | "2026-10-13" | otomatik | |
| `tekrarSayisi` | sayı | 1 | otomatik | "Bu yine oldu" ile artar |
| `sonTekrar` | `YYYY-AA-GG` | | otomatik | |
| `durum` | listeden | "Çözüldü" | evet | Çözüldü / Geçici çözüm / Açık |
| `guncellenme` | ISO tarih-saat | | otomatik | İleride senkron için |

## Önerilen Dexie şeması (sürüm 1)
```js
db.version(1).stores({
  kayitlar: '++id, kategori, cihaz, durum, tarih, tekrarSayisi, *etiketler',
  ayarlar: 'anahtar'
});
```
Sadece indekslenecek alanlar yazılır; diğer alanlar yine saklanır.

## Başlangıç kategorileri
Yazıcı · Ağ / Kablolama · Firewall (Zyxel USG) · VLAN · VPN · IP / MAC · NAS (QNAP) · Donanım ·
Windows / Yazılım · Office / E-posta · Kullanıcı hesabı · Sistem odası · Diğer

Kategoriler ve cihaz listesi `ayarlar` tablosunda tutulur, Ayarlar ekranından düzenlenir.

## Yasak
Şifre, parola, VPN anahtarı alanı yok. "Şifre KeePass'te" gibi işaret yazılabilir.

## Yedek dosyası biçimi
```json
{ "uygulama": "cozum-defteri", "surum": 1, "tarih": "2026-10-13T18:00:00Z",
  "kayitlar": [ ... ], "ayarlar": [ ... ] }
```
Fotoğraflar JSON'a base64 olarak yazılır.
Çok fotoğraflı yedekler büyük olabilir (50+ kayıt × 2-3 foto ≈ onlarca MB).
Dışa aktarma sırasında boyut uyarısı gösterilir.
