"use client";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/utils";

export function PriceChart({ data, currency }: { data: Array<{ date: string; average: number; ownPrice: number | null; cheapestPrice: number | null }>; currency: string }) {
  return <div className="h-[310px] w-full">
    <ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 10, right: 15, left: 5, bottom: 0 }}>
      <CartesianGrid stroke="#e8e5dd" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={25} />
      <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}b`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={35} domain={["auto", "auto"]} />
      <Tooltip formatter={(value) => formatMoney(Number(value), currency)} labelFormatter={(v) => new Date(v).toLocaleDateString("tr-TR")} /><Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
      <Line name="Pazar ortalaması" type="monotone" dataKey="average" stroke="#2a8d7c" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
      <Line name="Bizim fiyatımız" type="monotone" dataKey="ownPrice" stroke="#e7795f" strokeWidth={2.5} dot={false} connectNulls />
      <Line name="En ucuz rakip" type="monotone" dataKey="cheapestPrice" stroke="#8a93a0" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
    </LineChart></ResponsiveContainer>
  </div>;
}
