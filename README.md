# Çözüm Defteri

Petka IT biriminde çözülen sorunların kaydedildiği ve sonradan aranabildiği mobil uygulama (PWA).
Telefonda ana ekrana eklenir, internetsiz çalışır, veriler cihazda kalır.

> Ad geçicidir. Diğer seçenekler: `docs/isim-onerileri.md`

## Ne işe yarar
- Çözdüğün her sorunu sahada 30 saniyede kaydet (başlık, kategori, belirti, çözüm).
- "yazici soluk", "vpn baglanmiyo" gibi bozuk yazımla bile eski çözümü bul.
- Aynı sorun tekrar ederse "Bu yine oldu" de; en çok sorun çıkaran cihazları gör.
- JSON yedeğini al, QNAP'a veya Drive'a koy.

## Belgeler
| Dosya | İçerik |
|---|---|
| `CLAUDE.md` | Claude Code için proje talimatları |
| `docs/plan.md` | Orijinal yapım planı (tamamı) |
| `docs/veri-modeli.md` | Kayıt alanları ve kategoriler |
| `docs/arama.md` | "Benzer sorunu bul" mantığı |
| `docs/yol-haritasi.md` | Adım adım yapım listesi ve ilerleme |
| `docs/isim-onerileri.md` | Uygulama adı seçenekleri |

## Çalıştırma
1. VS Code ile bu klasörü aç, **Live Server** eklentisini kur.
2. `index.html` sağ tık > **Open with Live Server**.

## Teknoloji
HTML + JavaScript, Pico.css, Dexie.js (IndexedDB), Fuse.js, GitHub Pages.
