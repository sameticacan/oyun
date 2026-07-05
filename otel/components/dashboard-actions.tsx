"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DashboardActions({ profileId, currency }: { profileId: string; currency: string }) {
  const router = useRouter();
  const [price, setPrice] = useState("");
  const [running, setRunning] = useState<"demo" | "public" | null>(null);
  const [message, setMessage] = useState("");

  async function runDemo() {
    setRunning("demo"); setMessage("");
    try {
      const response = await fetch("/api/scrape/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profileId }) });
      const data = await response.json().catch(() => ({}));
      setMessage(response.ok ? `${data.succeeded}/${data.requested} fiyat güncellendi.` : data.error ?? "Demo kontrolü başarısız.");
      if (response.ok) router.refresh();
    } catch {
      setMessage("Sunucuya ulaşılamadı. Lütfen bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setRunning(null);
    }
  }
  async function runPublic() {
    setRunning("public"); setMessage("");
    try {
      const response = await fetch("/api/scrape/public", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profileId }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error === "Public kontroller .env içinde kapalı" ? data.error : "Otomatik okuma yapılamadı. Fiyat Yakala sayfasıyla gördüğünüz fiyatı kaydedebilirsiniz.");
        return;
      }
      const unavailable = Math.max(0, Number(data.requested ?? 0) - Number(data.succeeded ?? 0) - Number(data.blocked ?? 0) - Number(data.failed ?? 0));
      if (data.requested === 0) setMessage("Bu profile bağlı aktif bir ETS placeholder rakibi yok.");
      else if (data.status === "blocked") setMessage("Otomatik okuma yapılamadı. Fiyat Yakala sayfasıyla gördüğünüz fiyatı kaydedebilirsiniz.");
      else if (unavailable > 0) setMessage("Sayfa açıldı ama fiyat görünmedi. Tarih seçme ekranı veya belirsiz fiyat olabilir. Fiyat görünen tam URL’yi kaydedin.");
      else if (data.failed > 0) setMessage("Otomatik okuma yapılamadı. Fiyat Yakala sayfasıyla gördüğünüz fiyatı kaydedebilirsiniz.");
      else setMessage(`${data.succeeded}/${data.requested} public fiyat güncellendi.`);
      router.refresh();
    } catch {
      setMessage("Otomatik okuma yapılamadı. Fiyat Yakala sayfasıyla gördüğünüz fiyatı kaydedebilirsiniz.");
    } finally {
      setRunning(null);
    }
  }
  async function savePrice(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/own-prices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profileId, priceAmount: Number(price), currency, date: new Date().toISOString() }) });
    const data = await response.json(); setMessage(response.ok ? "Fiyatınız kaydedildi." : data.error ?? "Kayıt başarısız.");
    if (response.ok) { setPrice(""); router.refresh(); }
  }
  return <div className="card p-4">
    <div className="flex flex-col gap-3 sm:flex-row">
      <form onSubmit={savePrice} className="flex flex-1 gap-2"><input className="input" type="number" min="1" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder={`Bizim fiyatımız (${currency})`} /><button className="btn-secondary" type="submit">Kaydet</button></form>
      <button className="btn-secondary" onClick={runDemo} disabled={running !== null}>{running === "demo" ? "Kontrol ediliyor…" : "Demo kontrolü çalıştır"}</button>
      <button className="btn-primary" onClick={runPublic} disabled={running !== null}>{running === "public" ? "Kontrol ediliyor…" : "Public fiyat kontrolü çalıştır"}</button>
    </div><p className="mt-2 text-[11px] text-black/45">Public kontrol yalnızca izinli ve herkese açık sayfalarda kullanılır; CAPTCHA, login veya erişim engeli aşılmaz.</p>{message && <p className="mt-2 text-xs font-medium text-teal-700">{message}</p>}
  </div>;
}
