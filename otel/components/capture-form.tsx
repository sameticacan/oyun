"use client";

import Link from "next/link";
import { useState } from "react";
import { parseVisiblePriceText, type VisiblePriceParseResult } from "@/lib/visible-price-parser";

type CaptureDraft = {
  priceAmount: string;
  currency: string;
  roomName: string;
  boardType: string;
  cancellationPolicy: string;
  availabilityText: string;
};

type CaptureFormProps = {
  competitors: Array<{ id: string; name: string; publicUrl: string | null }>;
  profiles: Array<{ id: string; name: string }>;
  initialCompetitorId?: string;
  initialProfileId?: string;
};

const emptyDraft: CaptureDraft = { priceAmount: "", currency: "TRY", roomName: "", boardType: "", cancellationPolicy: "", availabilityText: "" };

export function CaptureForm({ competitors, profiles, initialCompetitorId, initialProfileId }: CaptureFormProps) {
  const initialCompetitor = competitors.find((item) => item.id === initialCompetitorId);
  const [competitorId, setCompetitorId] = useState(initialCompetitor?.id ?? "");
  const [profileId, setProfileId] = useState(profiles.some((item) => item.id === initialProfileId) ? initialProfileId! : "");
  const [sourceUrl, setSourceUrl] = useState(initialCompetitor?.publicUrl ?? "");
  const [rawText, setRawText] = useState("");
  const [result, setResult] = useState<VisiblePriceParseResult | null>(null);
  const [draft, setDraft] = useState<CaptureDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success" | "info"; text: string } | null>(null);

  function selectCompetitor(id: string) {
    setCompetitorId(id);
    setSourceUrl(competitors.find((item) => item.id === id)?.publicUrl ?? "");
  }

  function parseText() {
    if (!rawText.trim()) {
      setMessage({ tone: "error", text: "Ayrıştırmak için sayfadaki görünür metni yapıştırın." });
      return;
    }
    const parsed = parseVisiblePriceText(rawText);
    setResult(parsed);
    setDraft({
      priceAmount: parsed.suggestedPrice?.toString() ?? "",
      currency: parsed.currency,
      roomName: parsed.roomName ?? "",
      boardType: parsed.boardType ?? "",
      cancellationPolicy: parsed.cancellationPolicy ?? "",
      availabilityText: parsed.availabilityText ?? "",
    });
    setMessage(parsed.candidates.length
      ? { tone: "info", text: `${parsed.candidates.length} farklı fiyat adayı bulundu. Kaydetmeden önce seçimi kontrol edin.` }
      : { tone: "error", text: "Metinde TRY/TL fiyatı bulunamadı. Fiyatı sonuç kartına elle yazabilirsiniz." });
  }

  function field(name: keyof CaptureDraft, value: string) {
    setDraft((current) => ({ ...current, [name]: value }));
  }

  async function saveObservation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!competitorId || !profileId) {
      setMessage({ tone: "error", text: "Kaydetmeden önce arama profili ve rakip otel seçin." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/observations/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitorId, profileId, sourceUrl, rawSnapshotText: rawText, ...draft, priceAmount: Number(draft.priceAmount) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ tone: "error", text: data.error ?? "Gözlem kaydedilemedi. Alanları kontrol edip tekrar deneyin." });
        return;
      }
      setMessage({ tone: "success", text: "Fiyat gözlemi kaydedildi." });
    } catch {
      setMessage({ tone: "error", text: "Sunucuya ulaşılamadı. Lütfen bağlantınızı kontrol edip tekrar deneyin." });
    } finally {
      setSaving(false);
    }
  }

  const messageColor = message?.tone === "error" ? "text-red-600" : message?.tone === "success" ? "text-emerald-700" : "text-teal-700";

  return <div className="space-y-5">
    <section className="card p-5 md:p-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Arama profili"><select className="input" value={profileId} onChange={(event) => setProfileId(event.target.value)}><option value="">Profil seçin</option>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></Field>
        <Field label="Rakip otel"><select className="input" value={competitorId} onChange={(event) => selectCompetitor(event.target.value)}><option value="">Rakip seçin</option>{competitors.map((competitor) => <option key={competitor.id} value={competitor.id}>{competitor.name}</option>)}</select></Field>
        <Field label="Kaynak URL"><input className="input" type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://…" /></Field>
      </div>
      <Field label="Görünür sayfa metni"><textarea className="input min-h-72 resize-y font-mono text-xs leading-relaxed" maxLength={200_000} value={rawText} onChange={(event) => { setRawText(event.target.value); setResult(null); }} placeholder="ETS/Hotels sayfasından kopyaladığınız metni buraya yapıştırın" /></Field>
      <div className="flex flex-wrap items-center gap-3"><button type="button" className="btn-primary" onClick={parseText}>Metni ayrıştır</button><p className="text-xs text-black/45">Metin yalnızca bu tarayıcıda ayrıştırılır; üçüncü taraf siteye istek gönderilmez.</p></div>
    </section>

    {message && <p className={`text-sm font-medium ${messageColor}`}>{message.text} {message.tone === "success" && <Link className="underline" href="/observations">Fiyat gözlemlerini aç</Link>}</p>}

    {result && <form onSubmit={saveObservation} className="card p-5 md:p-6">
      <div className="mb-5"><p className="label">Ayrıştırma sonucu</p><h2 className="text-lg font-bold">Bulunan bilgileri kontrol edin</h2><p className="mt-1 text-xs text-black/45">Bunlar metinden yapılan tahminlerdir. Kaydetmeden önce tüm alanları değiştirebilirsiniz.</p></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Bulunan fiyat"><input className="input" required type="number" min="0.01" max="10000000" step="0.01" value={draft.priceAmount} onChange={(event) => field("priceAmount", event.target.value)} /></Field>
        <Field label="Para birimi"><input className="input uppercase" required minLength={3} maxLength={3} value={draft.currency} onChange={(event) => field("currency", event.target.value.toUpperCase())} /></Field>
        <Field label="Oda adı"><input className="input" list="capture-room-candidates" value={draft.roomName} onChange={(event) => field("roomName", event.target.value)} /><datalist id="capture-room-candidates">{result.roomCandidates.map((room) => <option key={room} value={room} />)}</datalist></Field>
        <Field label="Pansiyon"><input className="input" value={draft.boardType} onChange={(event) => field("boardType", event.target.value)} placeholder="Sadece Oda / Kahvaltı dahil" /></Field>
        <Field label="İptal koşulu"><input className="input" value={draft.cancellationPolicy} onChange={(event) => field("cancellationPolicy", event.target.value)} /></Field>
        <Field label="Müsaitlik"><input className="input" value={draft.availabilityText} onChange={(event) => field("availabilityText", event.target.value)} placeholder="Örn. Son 2 Oda" /></Field>
      </div>

      <div className="mt-2 border-t border-black/5 pt-5"><p className="label">Tüm fiyat adayları</p>{result.candidates.length ? <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{result.candidates.map((candidate, index) => <button type="button" key={`${candidate.amount}-${index}`} onClick={() => { field("priceAmount", candidate.amount.toString()); field("currency", candidate.currency); }} className={`rounded-xl border p-3 text-left transition ${Number(draft.priceAmount) === candidate.amount ? "border-teal-500 bg-teal-50" : "border-black/10 hover:bg-black/[0.02]"}`}><span className="block font-bold">{candidate.amount.toLocaleString("tr-TR", { style: "currency", currency: candidate.currency })}</span><span className="mt-1 block text-[11px] text-black/45">Puan {candidate.score} · {candidate.context || candidate.raw}</span></button>)}</div> : <p className="text-sm text-black/45">Otomatik fiyat adayı bulunamadı; fiyatı yukarıdaki alana elle girebilirsiniz.</p>}</div>

      {result.roomCandidates.length > 1 && <div className="mt-5"><p className="label">Oda adı adayları</p><div className="flex flex-wrap gap-2">{result.roomCandidates.map((room) => <button type="button" className="pill bg-black/5 hover:bg-teal-50" key={room} onClick={() => field("roomName", room)}>{room}</button>)}</div></div>}
      <div className="mt-6 flex flex-wrap items-center gap-3"><button className="btn-primary" disabled={saving}>{saving ? "Kaydediliyor…" : "Gözlem olarak kaydet"}</button><span className="text-xs text-black/45">Kaynak <b>manual</b>, durum <b>success</b> olarak saklanır.</span></div>
    </form>}
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="mb-4 block"><span className="label">{label}</span>{children}</label>;
}
