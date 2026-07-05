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
| `ENABLE_PUBLIC_PRICE_CHECKS` | `false` | İzinli public sayfa kontrolünü açıkça etkinleştirir |
| `DEBUG_SCRAPER` | `false` | Debug ekran görüntülerini `scraper-debug/` içine yazar |
| `SCRAPER_MIN_INTERVAL_MS` | `60000` | Aynı public kaynağa minimum istek aralığı; kod 60 saniyeden aşağıya izin vermez |
| `SCRAPER_MAX_CONCURRENCY` | `1` | Gelecek worker'lar için eşzamanlılık ayarı; MVP runner tek sayfayla seri çalışır |
| `SCRAPER_NAVIGATION_TIMEOUT_MS` | `30000` | Playwright gezinme zaman aşımı |
| `SCRAPER_USER_AGENT` | Açık OdaRadar kimliği | Kendisini tanıtan user-agent |

> `AppSetting` tablosundaki `ENABLE_PUBLIC_PRICE_CHECKS` satırı yalnızca arayüz/audit amaçlıdır. Public erişim sadece `.env` içindeki değer tam olarak `true` olduğunda açılır.

## Public fiyat kontrolünü açma

Public kontrol varsayılan olarak kapalıdır ve yalnızca dashboard'daki manuel butonla çalışır. Otomatik veya zamanlanmış public tarama yapılmaz.

1. Playwright Chromium tarayıcısını bir kez kurun:

   ```powershell
   npx playwright install chromium
   ```

2. `.env` dosyasında kontrolü açın ve uygulamayı yeniden başlatın:

   ```dotenv
   ENABLE_PUBLIC_PRICE_CHECKS=true
   ```

3. **Rakip Oteller** sayfasında kaynak olarak **ETS placeholder** seçin ve izinli, herkese açık otel sayfasının `https://` URL'sini girin.
4. Rakibi ilgili arama profiline bağlayın.
5. Dashboard'da profili seçip **Public fiyat kontrolü çalıştır** düğmesine basın.

### CSS selector kullanımı

Rakip ekleme/düzenleme formundaki gelişmiş alanlara tarayıcı geliştirici araçlarından doğruladığınız CSS selector'ları girebilirsiniz. Örneğin fiyat için `.total-price`, oda adı için `.room-name` kullanılabilir. Selector her zaman ilk görünür eşleşmenin metnini okur; sayfaya tıklamaz, form göndermez ve gizli içeriğe erişmez.

- **Fiyat CSS selector** boş bırakılırsa görünür sayfa metnindeki `₺3.450`, `3.450 TL`, `3450 TL` ve `TRY 3450` biçimleri aranır.
- Oda, pansiyon, iptal ve müsaitlik selector'ları isteğe bağlıdır.
- Birden fazla generic fiyat güvenilir biçimde ayırt edilemezse fiyat tahmin edilmez; gözlem `unavailable` olarak kaydedilir.
- Selector alanına yalnızca CSS selector yazın; JavaScript çalıştırılmaz.

Public kontrol yalnızca otomasyona izin veren, herkese açık sayfalarda kullanılmalıdır. CAPTCHA çözülmez; login, üyelik, paywall veya üye fiyatına erişilmez; proxy/stealth tekniği kullanılmaz. HTTP 401, 403, 429, bot kontrolü veya doğrulama ekranında işlem `blocked` olarak kaydedilip durdurulur. Site şartlarını ve robots kurallarını değerlendirmek kullanıcı sorumluluğundadır.

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
- Demo, manuel ve güvenli public sayfa adaptörleri
- Hazır Docker Compose PostgreSQL servisi
- Otomatik job çalıştırmayan gelecek cron mimarisi placeholder'ı

## Scraper mimarisi

Adaptör sözleşmesi `lib/scraper/types.ts` içindedir. Runner her sonucu `success`, `unavailable`, `blocked` veya `error` olarak saklar.

- `DemoAdapter`: geliştirme için güne göre kararlı, gerçekçi sahte fiyat üretir.
- `ManualAdapter`: ağ isteği yapmaz; manuel fiyatlar gözlem API'si üzerinden doğrudan saklanır.
- `EtsPlaceholderAdapter`: yalnızca ortam değişkeni açıkken public URL'yi yavaşça yükler. Kullanıcı tanımlı CSS selector'lardan veya görünür metindeki güvenilir TRY/TL adayından fiyat okur; CAPTCHA, login, Cloudflare/doğrulama, HTTP 401/403/429 veya başka bir engel sinyalinde hemen durur.

MVP'de arka plan işi yoktur. Dashboard'daki **Demo kontrolü çalıştır** veya **Public fiyat kontrolü çalıştır** düğmesi kullanılır; CLI demo kontrolü için `npm run scrape:demo` çalıştırılabilir. Gelecek cron giriş noktası `lib/scheduler/index.ts` dosyasında belgelenmiştir.

## API

- `GET /api/competitors`, `POST /api/competitors`
- `PUT /api/competitors/:id`, `DELETE /api/competitors/:id`
- `GET /api/profiles`, `POST /api/profiles`
- `PUT /api/profiles/:id`, `DELETE /api/profiles/:id`
- `GET /api/observations?competitorId=&profileId=&status=&limit=`
- `POST /api/observations` (manuel rakip fiyatı)
- `POST /api/own-prices`
- `POST /api/scrape/demo`
- `POST /api/scrape/public` (body: isteğe bağlı `profileId`)
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
