"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DashboardActions({ profileId, currency }: { profileId: string; currency: string }) {
  const router = useRouter();
  const [price, setPrice] = useState("");
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");

  async function runDemo() {
    setRunning(true); setMessage("");
    const response = await fetch("/api/scrape/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profileId }) });
    const data = await response.json();
    setMessage(response.ok ? `${data.succeeded}/${data.requested} fiyat güncellendi.` : data.error ?? "Kontrol başarısız.");
    setRunning(false); router.refresh();
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
      <button className="btn-primary" onClick={runDemo} disabled={running}>{running ? "Kontrol ediliyor…" : "Demo kontrolü çalıştır"}</button>
    </div>{message && <p className="mt-2 text-xs font-medium text-teal-700">{message}</p>}
  </div>;
}
