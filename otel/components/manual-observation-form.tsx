"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ManualObservationForm({ competitors, profiles }: { competitors: Array<{ id: string; name: string }>; profiles: Array<{ id: string; name: string }> }) {
  const router = useRouter(); const [open, setOpen] = useState(false); const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/observations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) }); const data = await response.json();
    if (!response.ok) return setMessage(data.error ?? "Kayıt başarısız."); setMessage("Rakip fiyatı kaydedildi."); event.currentTarget.reset(); router.refresh();
  }
  return <div><button className="btn-primary" onClick={() => setOpen((v) => !v)}>{open ? "Formu kapat" : "Manuel rakip fiyatı gir"}</button>{open && <form onSubmit={submit} className="card mt-4 grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
    <label><span className="label">Rakip</span><select required name="competitorId" className="input"><option value="">Seçin</option>{competitors.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
    <label><span className="label">Profil</span><select required name="profileId" className="input"><option value="">Seçin</option>{profiles.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
    <label><span className="label">Fiyat</span><input required name="priceAmount" type="number" min="1" step="0.01" className="input" /></label>
    <label><span className="label">Oda adı</span><input name="roomName" className="input" placeholder="Standart Oda" /></label>
    <label><span className="label">Pansiyon</span><input name="boardType" className="input" placeholder="Kahvaltı dahil" /></label>
    <label className="md:col-span-2"><span className="label">İptal koşulu</span><input name="cancellationPolicy" className="input" placeholder="Ücretsiz iptal…" /></label>
    <div className="flex items-end"><button className="btn-primary w-full">Fiyatı kaydet</button></div>{message && <p className="text-sm text-teal-700 md:col-span-full">{message}</p>}
  </form>}</div>;
}
