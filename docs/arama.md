# "Benzer Sorunu Bul" Araması

1. **Türkçe normalleştirme** (hem sorgu hem kayıt metni):
   küçük harf (`toLocaleLowerCase('tr')`), sonra `ı→i, ş→s, ğ→g, ü→u, ö→o, ç→c`.
   "bağlanmıyor" ile "baglanmiyor" eşleşir.
2. **Fuse.js bulanık arama**, alan ağırlıkları:
   | Alan | Ağırlık |
   |---|---|
   | hataKodu | 3 |
   | baslik | 2.5 |
   | etiketler | 2 |
   | belirti | 2 |
   | cihaz | 1.5 |
   | sebep | 1 |
   | cozum | 0.5 |
   Başlangıç ayarları: `threshold: 0.35`, `ignoreLocation: true`, `includeScore: true`.
   (0.4 çok geniş, alakasız sonuçlar döndürebilir; 0.35 ile başla, gerekirse ayarla.)
   Normalleştirme için Fuse'a normalleştirilmiş kopya alanlar verilir ya da `getFn` kullanılır.
3. **Filtreler:** kategori çipleri ve cihaz filtresi aramadan önce uygulanır.
4. **Sıralama bonusu:** Fuse puanı, tekrar sayısı ve yakın tarih ile hafifçe düzeltilir
   (ör. `puan * (1 - 0.05 * min(tekrar,5))`, son 90 gün için küçük bonus).
5. **Yeni kayıtta öneri:** Başlık/belirti yazılırken (300 ms gecikmeyle) en iyi 3 eşleşme
   "Buna benzer kayıtlar var" kutusunda gösterilir; oradan "Bu yine oldu" seçilebilir.

## Test sorguları
"yazici soluk", "vpn baglanmiyo", "drum end", "nas acilmiyor", "0x11b"

İleri seviye (sonra): anlam benzerliği için vektör arama. İlk sürümde yok.
