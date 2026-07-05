import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { Browser, BrowserContext, Page } from "playwright";
import { addDays } from "@/lib/utils";
import type { AdapterObservation, PriceSourceAdapter, ScrapeContext } from "./types";

const blockedSignals = /captcha|robot değilim|access denied|erişim engellendi|unusual traffic|giriş yap|login|üye girişi|cloudflare|doğrulama/i;
const dateSelectionSignals = /tarih seç|giriş tarihi|çıkış tarihi|check-in|check-out|konaklama tarihi|tarihleri seçin/i;
const hotelsDateScreenMessage = "Sayfa fiyat yerine tarih seçme ekranı gösterdi. Hotels üzerinde tarih ve kişi seçip fiyat görünen tam URL’yi Public URL alanına kaydedin.";
const contextualWords: Array<[RegExp, number]> = [
  [/toplam/i, 4],
  [/başlayan/i, 3],
  [/gece/i, 2],
  [/oda/i, 2],
];

type PriceCandidate = { amount: number; index: number; score: number; context: string };
type Closeable = { close(): Promise<void> };

function shortText(value: string, maxLength: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function addHotelsProfileParameters(publicUrl: string, profile: ScrapeContext["profile"]) {
  try {
    const url = new URL(publicUrl);
    const hostname = url.hostname.toLowerCase();
    const isHotels = hostname === "hotels.com" || hostname.endsWith(".hotels.com");
    const dateParameters = ["chkin", "chkout", "checkin", "checkout", "checkInDate", "checkOutDate"];
    if (!isHotels || dateParameters.some((name) => url.searchParams.has(name))) return { url: publicUrl, parametersAdded: false };

    url.searchParams.set("chkin", profile.checkIn.toISOString().slice(0, 10));
    url.searchParams.set("chkout", addDays(profile.checkIn, profile.nights).toISOString().slice(0, 10));
    url.searchParams.set("rm1", `a${profile.adults}`);
    return { url: url.toString(), parametersAdded: true };
  } catch {
    return { url: publicUrl, parametersAdded: false };
  }
}

function parseAmount(value: string) {
  const compact = value.replace(/\s/g, "").replace(/[^\d.,]/g, "");
  let normalized: string;
  if (compact.includes(",")) normalized = compact.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(?:\.\d{3})+$/.test(compact)) normalized = compact.replace(/\./g, "");
  else normalized = compact;
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 && amount <= 10_000_000 ? amount : undefined;
}

function priceCandidates(text: string): PriceCandidate[] {
  const pattern = /(?:₺\s*([\d.\s]+(?:,\d{1,2})?)|TRY\s*([\d.\s]+(?:[,.]\d{1,2})?)|([\d.\s]+(?:,\d{1,2})?)\s*(?:TL|TRY))/giu;
  const candidates = new Map<number, PriceCandidate>();

  for (const match of text.matchAll(pattern)) {
    const amount = parseAmount(match[1] ?? match[2] ?? match[3] ?? "");
    if (amount === undefined) continue;
    const index = match.index ?? 0;
    const context = shortText(text.slice(Math.max(0, index - 80), index + match[0].length + 80), 200);
    const score = contextualWords.reduce((total, [word, weight]) => total + (word.test(context) ? weight : 0), 0);
    const existing = candidates.get(amount);
    if (!existing || score > existing.score) candidates.set(amount, { amount, index, score, context });
  }

  return [...candidates.values()].sort((left, right) => right.score - left.score || left.index - right.index);
}

function selectGenericPrice(text: string) {
  const candidates = priceCandidates(text);
  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1 && candidates[0].score > 0 && candidates[0].score > candidates[1].score) return candidates[0];
  return undefined;
}

function selectPriceFromSelector(text: string) {
  const currencyCandidate = priceCandidates(text)[0];
  if (currencyCandidate) return currencyCandidate.amount;
  const number = text.match(/\d[\d.\s]*(?:,\d{1,2})?/u)?.[0];
  return number ? parseAmount(number) : undefined;
}

async function selectorText(page: Page, selector: string | null, label: string, maxLength: number) {
  if (!selector) return undefined;
  try {
    const locator = page.locator(selector).first();
    if (!await locator.isVisible({ timeout: 5_000 })) return undefined;
    return shortText(await locator.innerText(), maxLength) || undefined;
  } catch {
    throw new Error(`${label} CSS selector okunamadı. Selector değerini kontrol edin.`);
  }
}

async function closeQuietly(resource: Closeable | undefined) {
  if (!resource) return;
  try { await resource.close(); } catch { /* Kaynak zaten kapanmış olabilir. */ }
}

export class EtsPlaceholderAdapter implements PriceSourceAdapter {
  readonly source = "ets_placeholder" as const;

  async check({ competitor, profile }: ScrapeContext): Promise<AdapterObservation[]> {
    if (process.env.ENABLE_PUBLIC_PRICE_CHECKS !== "true") {
      return [{ status: "blocked", currency: profile.currency, sourceUrl: competitor.publicUrl ?? undefined, errorMessage: "Public kontroller .env içinde kapalı. ENABLE_PUBLIC_PRICE_CHECKS=true olmadan ağ isteği yapılmadı." }];
    }
    if (!competitor.publicUrl) {
      return [{ status: "error", currency: profile.currency, errorMessage: "Rakip için public URL tanımlı değil." }];
    }

    let browser: Browser | undefined;
    let context: BrowserContext | undefined;
    let page: Page | undefined;
    let bodyText = "";
    let enhancedHotelsNavigationStarted = false;
    const target = addHotelsProfileParameters(competitor.publicUrl, profile);

    try {
      const { chromium } = await import("playwright");
      browser = await chromium.launch({ headless: true });
      context = await browser.newContext({
        locale: "tr-TR",
        userAgent: process.env.SCRAPER_USER_AGENT ?? "OdaRadar/0.1 public-price-research",
      });
      page = await context.newPage();
      await page.waitForTimeout(2_000);

      enhancedHotelsNavigationStarted = target.parametersAdded;
      const response = await page.goto(target.url, {
        waitUntil: "domcontentloaded",
        timeout: Number(process.env.SCRAPER_NAVIGATION_TIMEOUT_MS ?? 30_000),
      });
      await page.waitForTimeout(1_000);
      bodyText = await page.locator("body").innerText({ timeout: 5_000 });
      enhancedHotelsNavigationStarted = false;
      const statusCode = response?.status();

      if (statusCode === 401 || statusCode === 403 || statusCode === 429 || blockedSignals.test(bodyText)) {
        return [{ status: "blocked", currency: profile.currency, sourceUrl: target.url, errorMessage: `Kaynak erişimi engelledi veya insan doğrulaması istedi${statusCode ? ` (HTTP ${statusCode})` : ""}. Kontrol durduruldu.` }];
      }
      if (!response || (statusCode !== undefined && statusCode >= 400)) {
        if (target.parametersAdded) {
          return [{ status: "unavailable", currency: profile.currency, sourceUrl: target.url, availabilityText: hotelsDateScreenMessage, rawSnapshotText: bodyText.slice(0, 1_000) }];
        }
        return [{ status: "error", currency: profile.currency, sourceUrl: target.url, errorMessage: response ? `Public sayfa HTTP ${statusCode} yanıtı verdi.` : "Public sayfadan HTTP yanıtı alınamadı." }];
      }

      if (process.env.DEBUG_SCRAPER === "true") {
        const dir = path.join(process.cwd(), "scraper-debug");
        await mkdir(dir, { recursive: true });
        await page.screenshot({ path: path.join(dir, `${competitor.id}-${Date.now()}.png`), fullPage: true });
      }

      const priceText = await selectorText(page, competitor.priceSelector, "Fiyat", 500);
      const genericCandidate = competitor.priceSelector ? undefined : selectGenericPrice(bodyText);
      const priceAmount = priceText ? selectPriceFromSelector(priceText) : genericCandidate?.amount;
      const showsDateSelection = dateSelectionSignals.test(bodyText);

      if (priceAmount === undefined && showsDateSelection) {
        return [{ status: "unavailable", currency: "TRY", sourceUrl: target.url, availabilityText: hotelsDateScreenMessage, rawSnapshotText: bodyText.slice(0, 1_000) }];
      }

      const roomName = await selectorText(page, competitor.roomSelector, "Oda adı", 200) ?? "Public sayfa";
      const boardType = await selectorText(page, competitor.boardSelector, "Pansiyon", 120) ?? (profile.boardPreference === "breakfast_included" ? "Kahvaltı dahil" : "Sadece oda");
      const cancellationPolicy = await selectorText(page, competitor.cancellationSelector, "İptal koşulu", 500);
      const availabilityText = await selectorText(page, competitor.availabilitySelector, "Müsaitlik", 300) ?? "Public sayfadan okundu";

      if (priceAmount === undefined) {
        const reason = competitor.priceSelector
          ? "Fiyat selector alanında geçerli bir fiyat bulunamadı."
          : "Görünür metindeki fiyat adayları güvenilir biçimde ayırt edilemedi.";
        return [{ status: "unavailable", currency: "TRY", sourceUrl: target.url, roomName, boardType, cancellationPolicy, availabilityText: reason, rawSnapshotText: shortText(bodyText, 1_000) }];
      }

      const rawSnapshotText = priceText
        ? `Public fiyat selector metninden TRY ${priceAmount} okundu: ${shortText(priceText, 200)}`
        : `Public görünür metninden TRY ${priceAmount} okundu. Bağlam: ${genericCandidate?.context ?? "tek fiyat adayı"}`;
      return [{ status: "success", currency: "TRY", sourceUrl: target.url, roomName, boardType, cancellationPolicy, availabilityText, priceAmount, rawSnapshotText: shortText(rawSnapshotText, 500) }];
    } catch (error) {
      if (enhancedHotelsNavigationStarted) {
        return [{ status: "unavailable", currency: profile.currency, sourceUrl: target.url, availabilityText: hotelsDateScreenMessage, rawSnapshotText: bodyText.slice(0, 1_000) }];
      }
      const detail = error instanceof Error ? shortText(error.message, 300) : "Bilinmeyen tarayıcı hatası";
      return [{ status: "error", currency: profile.currency, sourceUrl: target.url, errorMessage: `Public sayfa okunurken hata oluştu: ${detail}` }];
    } finally {
      await closeQuietly(page);
      await closeQuietly(context);
      await closeQuietly(browser);
    }
  }
}
