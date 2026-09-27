import sentenceBuildJson from "../../data/sentence-build.json";

export type SentenceBuildItem = {
  id: number;
  before: string;
  after: string;
  pieces: string[];
  order: number[];
  star: number;
  explanation: string;
  meaning: string;
};

export function getSentenceBuild(): SentenceBuildItem[] {
  return sentenceBuildJson as SentenceBuildItem[];
}

export function starPieceIndex(item: SentenceBuildItem): number {
  return item.order[item.star];
}

export function assembledSentence(item: SentenceBuildItem): string {
  const ordered = item.order.map((index) => item.pieces[index]).join("");
  return `${item.before}${ordered}${item.after}`;
}
