# Yol Haritası

Her adım kendi başına çalışan bir sürüm verir. Bitmeden sonrakine geçme. Bitince kutuyu işaretle.

## Adım 0: Hazırlık
- [x] VS Code + Live Server kurulu
- [ ] Git kurulu, GitHub'da `petka-ariza-kayit` reposu açıldı
- [x] Klasör yapısı ve boş dosyalar oluşturuldu (CLAUDE.md'deki yapı)

## Adım 1: Kayıt ekle ve listele
- [x] Form: başlık, kategori, belirti, çözüm
- [x] Dexie ile kaydet (`js/db.js`)
- [x] Ana ekranda liste (en yeni üstte, son 20 kayıt + "Daha fazla yükle")
- [ ] Test: 5 sahte kayıt, sayfa yenilenince duruyor

## Adım 2: Detay, düzenle, sil
- [x] Detay ekranı
- [x] Düzenle / Sil (silmeden önce onay)
- [x] Diğer alanlar: cihaz, hata kodu, etiketler, sebep, durum ("Daha fazla" altında)

## Adım 3: Arama
- [x] Türkçe normalleştirme fonksiyonu
- [x] Fuse.js ve alan ağırlıkları
- [x] Kategori çipleri ile filtre
- [x] Test sorguları (`docs/arama.md`) çalışıyor

## Adım 4: Yedekleme
- [x] JSON dışa aktar
- [x] JSON içe aktar (birleştir / üzerine yaz seçeneği)
- [ ] Yedek QNAP veya Drive'a konabiliyor
- Bu adımdan sonra gerçek veri girilebilir.

## Adım 5: PWA ve telefona kurulum
- [x] `manifest.json` + ikonlar
- [x] `service-worker.js` (çevrimdışı)
- [ ] GitHub Pages'te yayın
- [ ] Telefonda "Ana ekrana ekle" ve internetsiz açılıyor

## Adım 6: Kullanışlılık
- [x] "Bu yine oldu" butonu ve tekrar sayacı
- [x] Yeni kayıt yazarken benzer kayıt önerisi
- [x] Fotoğraf ekleme (küçülterek + JPEG %75 kalite)
- [x] Karanlık tema
- [x] Etiket otomatik tamamlama
- [x] Kayıt şablonları (sık sorun tipleri için)
- [x] Arama geçmişi (son 5 arama)
- [x] CSV dışa aktarma
- [x] Sabitleme (pin) özelliği
- [x] Yazdırma görünümü

## Adım 7: Eski kayıtları içeri al
- [x] CSV içe aktarma
- [x] İlk 20-30 sorun girildi (25 örnek kayıt `docs/ornek-kayitlar.csv` dosyasında)

## Sonra
- [x] İstatistik ekranı (kategori/cihaz bazında)
- [ ] Bilgisayardan erişim: QNAP üzerinde PocketBase veya Supabase (`docs/plan.md` bölüm 6)
