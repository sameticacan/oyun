export type VisiblePriceCandidate = {
  amount: number;
  currency: "TRY";
  raw: string;
  context: string;
  score: number;
};

export type VisiblePriceParseResult = {
  suggestedPrice?: number;
  currency: "TRY";
  roomName?: string;
  roomCandidates: string[];
  boardType?: string;
  cancellationPolicy?: string;
  availabilityText?: string;
  candidates: VisiblePriceCandidate[];
};

const priorityWords: Array<[RegExp, number]> = [
  [/toplam/i, 12],
  [/kahvaltı dahil/i, 9],
  [/sadece oda/i, 9],
  [/vergiler dahil/i, 8],
  [/gece/i, 7],
  [/müsait/i, 6],
  [/oda/i, 6],
  [/iptal/i, 5],
  [/rezervasyon/i, 4],
  [/\bson\b/i, 4],
  [/seç/i, 3],
];

function cleanLine(value: string, maxLength = 200) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function parseTurkishAmount(value: string) {
  const compact = value.replace(/[\s\u00a0]/g, "").replace(/[^\d.,]/g, "");
  let normalized: string;
  if (compact.includes(",")) normalized = compact.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(?:\.\d{3})+$/.test(compact)) normalized = compact.replace(/\./g, "");
  else normalized = compact;
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 && amount <= 10_000_000 ? amount : undefined;
}

function lineAt(text: string, index: number) {
  const start = Math.max(0, text.lastIndexOf("\n", index - 1) + 1);
  const endIndex = text.indexOf("\n", index);
  return cleanLine(text.slice(start, endIndex === -1 ? text.length : endIndex));
}

function candidateScore(text: string, index: number, matchLength: number) {
  const line = lineAt(text, index);
  const context = cleanLine(text.slice(Math.max(0, index - 120), index + matchLength + 120), 300);
  const score = priorityWords.reduce((total, [word, weight]) => {
    if (word.test(line)) return total + weight * 2;
    if (word.test(context)) return total + weight;
    return total;
  }, 0);
  return { score, context: line || context };
}

function inferFirstLabel(text: string, labels: Array<[RegExp, string]>) {
  return labels
    .map(([pattern, label]) => ({ index: text.search(pattern), label }))
    .filter(({ index }) => index >= 0)
    .sort((left, right) => left.index - right.index)[0]?.label;
}

function findRoomCandidates(text: string) {
  const roomPattern = /\b(?:deluxe|standart|standard|superior|suit|suite|ekonomik)\b/i;
  const seen = new Set<string>();
  const candidates: string[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = cleanLine(rawLine);
    if (!line || line.length > 200 || !roomPattern.test(line)) continue;
    const key = line.toLocaleLowerCase("tr-TR");
    if (!seen.has(key)) {
      seen.add(key);
      candidates.push(line);
    }
  }
  return candidates.sort((left, right) => Number(!/oda/i.test(left)) - Number(!/oda/i.test(right))).slice(0, 10);
}

export function parseVisiblePriceText(text: string): VisiblePriceParseResult {
  const pattern = /(?:₺\s*(\d{1,3}(?:[.\u00a0 ]\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?)|TRY\s*(\d{1,3}(?:[.\u00a0 ]\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?)|(\d{1,3}(?:[.\u00a0 ]\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?)\s*(?:TL|TRY))/giu;
  const byAmount = new Map<number, VisiblePriceCandidate>();

  for (const match of text.matchAll(pattern)) {
    const amount = parseTurkishAmount(match[1] ?? match[2] ?? match[3] ?? "");
    if (amount === undefined) continue;
    const { score, context } = candidateScore(text, match.index ?? 0, match[0].length);
    const candidate: VisiblePriceCandidate = { amount, currency: "TRY", raw: cleanLine(match[0], 80), context, score };
    const existing = byAmount.get(amount);
    if (!existing || candidate.score > existing.score) byAmount.set(amount, candidate);
  }

  const candidates = [...byAmount.values()].sort((left, right) => right.score - left.score || left.amount - right.amount);
  const roomCandidates = findRoomCandidates(text);
  const availabilityMatch = text.match(/son\s+\d+\s+oda(?:\s+kaldı)?/i)?.[0];

  return {
    suggestedPrice: candidates[0]?.amount,
    currency: "TRY",
    roomName: roomCandidates[0],
    roomCandidates,
    boardType: inferFirstLabel(text, [[/sadece oda/i, "Sadece Oda"], [/kahvaltı dahil/i, "Kahvaltı dahil"]]),
    cancellationPolicy: inferFirstLabel(text, [[/iptal edilemez/i, "İptal Edilemez"], [/ücretsiz iptal/i, "Ücretsiz iptal"]]),
    availabilityText: availabilityMatch ? cleanLine(availabilityMatch, 300) : undefined,
    candidates,
  };
}
