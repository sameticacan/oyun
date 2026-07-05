import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { PriceSourceAdapter, ScrapeContext } from "./types";

const blockedSignals = /captcha|robot değilim|access denied|erişim engellendi|unusual traffic|giriş yap|login|üye girişi/i;

export class EtsPlaceholderAdapter implements PriceSourceAdapter {
  readonly source = "ets_placeholder" as const;

  async check({ competitor, profile }: ScrapeContext) {
    if (process.env.ENABLE_PUBLIC_PRICE_CHECKS !== "true") {
      return [{ status: "blocked" as const, currency: profile.currency, sourceUrl: competitor.publicUrl ?? undefined, errorMessage: "Public fiyat kontrolleri kapalı. ENABLE_PUBLIC_PRICE_CHECKS=true olmadan ağ isteği yapılmadı." }];
    }
    if (!competitor.publicUrl) {
      return [{ status: "error" as const, currency: profile.currency, errorMessage: "Rakip için public_url tanımlı değil." }];
    }

    // Placeholder only: this deliberately does not parse a price or bypass any control.
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ userAgent: process.env.SCRAPER_USER_AGENT ?? "OdaRadar/0.1 internal-rate-research (+contact: revenue@example.com)" });
    try {
      await page.waitForTimeout(2_000);
      const response = await page.goto(competitor.publicUrl, { waitUntil: "domcontentloaded", timeout: Number(process.env.SCRAPER_NAVIGATION_TIMEOUT_MS ?? 30_000) });
      const bodyText = (await page.locator("body").innerText({ timeout: 5_000 })).slice(0, 12_000);
      if (!response || response.status() === 401 || response.status() === 403 || response.status() === 429 || blockedSignals.test(bodyText)) {
        return [{ status: "blocked" as const, currency: profile.currency, sourceUrl: competitor.publicUrl, errorMessage: `Kaynak erişimi engelledi veya insan doğrulaması istedi${response ? ` (HTTP ${response.status()})` : ""}. Kontrol durduruldu.` }];
      }
      if (process.env.DEBUG_SCRAPER === "true") {
        const dir = path.join(process.cwd(), "scraper-debug");
        await mkdir(dir, { recursive: true });
        await page.screenshot({ path: path.join(dir, `${competitor.id}-${Date.now()}.png`), fullPage: true });
      }
      return [{ status: "unavailable" as const, currency: profile.currency, sourceUrl: competitor.publicUrl, availabilityText: "Sayfa izinli biçimde açıldı; fiyat ayrıştırma bu güvenli placeholder sürümünde uygulanmadı.", rawSnapshotText: bodyText.slice(0, 1000) }];
    } catch (error) {
      return [{ status: "error" as const, currency: profile.currency, sourceUrl: competitor.publicUrl, errorMessage: error instanceof Error ? error.message : "Bilinmeyen tarayıcı hatası" }];
    } finally {
      await browser.close();
    }
  }
}
