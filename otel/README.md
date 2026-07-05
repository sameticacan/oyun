# OdaRadar

OdaRadar, Türkiye'deki küçük ve butik oteller için yerel çalışan, üretim yaklaşımıyla hazırlanmış bir rakip fiyat izleme MVP'sidir. Rakipleri ve arama profillerini yönetir; fiyat gözlemlerini tam arama bağlamıyla saklar; pazar ortalaması, trendler ve basit ±%10 fiyat sinyalleri sunar.

İlk kullanımda **demo adaptörü** ile çalışır. Gerçek public sayfa kontrolleri varsayılan olarak kapalıdır.

## Gereksinimler

- Node.js 20.11 veya üzeri
- npm 10 veya üzeri
- Docker Desktop (yerel PostgreSQL için)
- Windows PowerShell 7 önerilir

## Windows PowerShell ile kurulum

Proje klasöründe sırasıyla çalıştırın:

```powershell
Copy-Item .env.example .env
docker compose up -d
npm install
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

Ardından `http://localhost:3000` adresini açın. Seed işlemi İzmir'den 5 demo rakip, 3 arama profili ve 30 günlük fiyat geçmişi ekler.

Tek komutlu veritabanı hazırlığı için PostgreSQL ayağa kalktıktan sonra şunu da kullanabilirsiniz:

```powershell
npm run setup
```

## Ortam ayarları

`.env.example` dosyasını `.env` olarak kopyalayın:

| Değişken | Varsayılan | Açıklama |
|---|---:|---|
| `DATABASE_URL` | Yerel PostgreSQL | Prisma bağlantısı |
| `ENABLE_PUBLIC_PRICE_CHECKS` | `false` | Placeholder public sayfa kontrolünü açıkça etkinleştirir |
| `DEBUG_SCRAPER` | `false` | Debug ekran görüntülerini `scraper-debug/` içine yazar |
| `SCRAPER_MIN_INTERVAL_MS` | `60000` | Aynı public kaynağa minimum istek aralığı; kod 60 saniyeden aşağıya izin vermez |
| `SCRAPER_MAX_CONCURRENCY` | `1` | Gelecek worker'lar için eşzamanlılık ayarı; MVP runner tek sayfayla seri çalışır |
| `SCRAPER_NAVIGATION_TIMEOUT_MS` | `30000` | Playwright gezinme zaman aşımı |
| `SCRAPER_USER_AGENT` | Açık OdaRadar kimliği | Kendisini tanıtan user-agent |

> `AppSetting` tablosundaki `ENABLE_PUBLIC_PRICE_CHECKS` satırı yalnızca arayüz/audit amaçlıdır. Public erişim sadece `.env` içindeki değer tam olarak `true` olduğunda açılır.

## Sık kullanılan komutlar

```powershell
npm run dev             # Geliştirme sunucusu
npm run build           # Production build
npm run start           # Production sunucusu
npm run typecheck       # TypeScript kontrolü
npm run lint            # ESLint
npm run db:generate     # Prisma Client üret
npm run db:migrate      # Geliştirme migration'ı oluştur/uygula
npm run db:seed         # Demo veriyi sıfırdan yükle
npm run db:studio       # Prisma Studio
npm run scrape:demo     # Yeni demo gözlemleri ekle
```

`db:seed` mevcut OdaRadar verilerini silip demo veriyle yeniden kurar; üretim veritabanında çalıştırmayın.

## Özellikler

- Türkçe, responsive dashboard
- Bugünkü son rakip fiyatları, pazar ortalaması ve manuel otel fiyatı
- `%10` altı/üstü eşiklere göre fiyat önerisi
- Rakip otel CRUD işlemleri
- Arama profili CRUD ve rakip ilişkilendirme
- Manuel rakip fiyatı ve kendi otel fiyatı girişi
- Filtrelenebilir, bağlamı tam fiyat gözlemleri
- 30 günlük pazar ortalaması / kendi fiyatımız / en ucuz rakip grafiği
- Audit edilebilir scrape run kayıtları
- Demo, manuel ve güvenli ETS placeholder adaptörleri
- Hazır Docker Compose PostgreSQL servisi
- Otomatik job çalıştırmayan gelecek cron mimarisi placeholder'ı

## Scraper mimarisi

Adaptör sözleşmesi `lib/scraper/types.ts` içindedir. Runner her sonucu `success`, `unavailable`, `blocked` veya `error` olarak saklar.

- `DemoAdapter`: geliştirme için güne göre kararlı, gerçekçi sahte fiyat üretir.
- `ManualAdapter`: ağ isteği yapmaz; manuel fiyatlar gözlem API'si üzerinden doğrudan saklanır.
- `EtsPlaceholderAdapter`: fiyat ayrıştırmaz. Yalnızca ortam değişkeni açıkken public URL'yi yavaşça yükler; CAPTCHA, login, HTTP 401/403/429 veya engel sinyalinde hemen durur.

MVP'de arka plan işi yoktur. Dashboard'daki **Demo kontrolü çalıştır** düğmesi veya `npm run scrape:demo` kullanılır. Gelecek cron giriş noktası `lib/scheduler/index.ts` dosyasında belgelenmiştir.

## API

- `GET /api/competitors`, `POST /api/competitors`
- `PUT /api/competitors/:id`, `DELETE /api/competitors/:id`
- `GET /api/profiles`, `POST /api/profiles`
- `PUT /api/profiles/:id`, `DELETE /api/profiles/:id`
- `GET /api/observations?competitorId=&profileId=&status=&limit=`
- `POST /api/observations` (manuel rakip fiyatı)
- `POST /api/own-prices`
- `POST /api/scrape/demo`
- `GET /api/dashboard?profileId=`

## Klasör yapısı

```text
app/                  Next.js App Router sayfaları ve API route'ları
components/           Etkileşimli formlar ve grafikler
lib/                  DB, validation, dashboard ve scraper servisleri
lib/scraper/          Adaptörler, rate limiter ve runner
lib/scheduler/        Gelecek cron mimarisi placeholder'ı
prisma/               Şema ve demo seed
scripts/              CLI demo scraper
docker-compose.yml    Yerel PostgreSQL
```

## Hukuki ve etik kullanım

OdaRadar yalnızca kurum içi gelir yönetimi analizi içindir. Yalnızca herkese açık ve otomasyona izin veren sayfaları kontrol edin. Her sitenin kullanım koşulları ve robots kuralları için sorumluluk kullanıcıdadır.

Uygulama CAPTCHA çözmez, proxy döndürmez, login taklit etmez, üye/özel fiyatları toplamaz, erişim kontrolünü aşmaz ve kişisel veri toplamaz. Kaynak engellerse işlem durur. İzin belirsizse public kontrolü kapalı tutun ve manuel gözlem kullanın.

Playwright tarayıcısı gerekirse bir kez kurun:

```powershell
npx playwright install chromium
```

Bu komut yalnızca açıkça izin verilen public placeholder kontrolünü deneyeceğiniz zaman gereklidir; demo kullanım için tarayıcı indirmesi gerekmez.
