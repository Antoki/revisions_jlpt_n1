const N1_PATTERN_LIST = [
  "に越したことはない",
  "てからというもの",
  "もさることながら",
  "ないではすまない",
  "ないではおかない",
  "ないものでもない",
  "ずにはいられない",
  "ずにはすまない",
  "ずにはおかない",
  "を余儀なくさせ",
  "を余儀なくされ",
  "ではあるまいか",
  "いかんによらず",
  "いかんによって",
  "をものともせず",
  "ともあろうもの",
  "にしたところで",
  "とはいうものの",
  "を禁じ得ない",
  "にかたくない",
  "にしてみれば",
  "に至るまで",
  "に至っては",
  "を皮切りに",
  "を踏まえて",
  "に先駆けて",
  "に照らして",
  "と相まって",
  "と思いきや",
  "かと思うと",
  "とばかりに",
  "んばかりに",
  "んばかりの",
  "を顧みず",
  "を問わず",
  "をよそに",
  "をおいて",
  "にひきかえ",
  "にもまして",
  "ならでは",
  "ともなると",
  "なくして",
  "ことなしに",
  "がゆえに",
  "が早いか",
  "や否や",
  "そばから",
  "かたわら",
  "かたがた",
  "とあれば",
  "ながらに",
  "きらいがある",
  "はおろか",
  "べからざる",
  "べからず",
  "たるもの",
  "極まりない",
  "ばこそ",
  "始末だ",
  "ずくめ",
  "まみれ",
  "を限りに",
  "を境に",
  "に即して",
  "んがため",
  "といえども",
  "とみるや",
  "たら最後",
  "が最後",
  "ないまでも",
  "までもない",
  "をもって",
  "を契機に",
  "を機に",
  "に則って",
  "に足る",
  "に値する",
  "からある",
  "からする",
  "といわず",
  "にたえない",
  "てやまない",
] as const;

function catalog(patterns: readonly string[]): readonly string[] {
  const unique = [...new Set(patterns)];
  if (unique.length !== patterns.length) {
    throw new Error("Duplicate N1 patterns.");
  }

  for (const pattern of unique) {
    const overlap = unique.find(
      (other) => other !== pattern && other.includes(pattern),
    );
    if (overlap) {
      throw new Error(`N1 pattern ${pattern} overlaps ${overlap}.`);
    }
  }

  return unique.sort(
    (left, right) => right.length - left.length || left.localeCompare(right, "ja"),
  );
}

export const N1_PATTERNS = catalog(N1_PATTERN_LIST);

const PATTERN_SET = new Set<string>(N1_PATTERNS);

export function isN1Pattern(pattern: string): boolean {
  return PATTERN_SET.has(pattern);
}

export function findN1Pattern(text: string): string | undefined {
  return N1_PATTERNS.find((pattern) => text.includes(pattern));
}

export function patternCatalog(): string {
  return ["<patterns>", ...N1_PATTERNS, "</patterns>"].join("\n");
}
