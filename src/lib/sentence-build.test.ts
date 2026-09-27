import { describe, expect, it } from "vitest";
import {
  assembledSentence,
  getSentenceBuild,
  starPieceIndex,
} from "./sentence-build";

const expected = [
  {
    answer: 1,
    sentence:
      "どんなに高かろうがどうしても手に入れたいと思わせるほどのすばらしい作品だった。",
  },
  { answer: 1, sentence: "本日はお礼かたがたこちらに伺った次第です。" },
  { answer: 3, sentence: "犯人は人質とひきかえに大金を要求した。" },
  { answer: 1, sentence: "空が暗くなるや大粒の雨が降り出した。" },
  {
    answer: 3,
    sentence: "この島は隔離された環境であるがゆえに、動植物が独自の進化を遂げた。",
  },
  {
    answer: 2,
    sentence: "パスポートをいったいどこにしまったのやら、まったく思い出せない。",
  },
  {
    answer: 3,
    sentence: "少子高齢化に悩んでいるのは我が国に限ったことではない。",
  },
  {
    answer: 1,
    sentence: "年をとったせいか聞いたそばから忘れてしまうので困っている。",
  },
  {
    answer: 2,
    sentence:
      "平日ですら行列ができる人気店とあって連休ともなると500人からの客が来るという。",
  },
  {
    answer: 4,
    sentence:
      "彼のレポートは何度も検討を重ねただけあって他の学生のとは比べものにならないほど濃い内容のものだった。",
  },
  {
    answer: 2,
    sentence: "前もって予約しておいたおかげで長い時間並ばずにすんだ。",
  },
  {
    answer: 1,
    sentence: "どんなに大変でも、必ずやると言った手前やらないわけにはいかない。",
  },
  {
    answer: 2,
    sentence: "独立の機会は今をおいてほかにないと思い思い切って店長に打ち明けた。",
  },
  {
    answer: 1,
    sentence:
      "数えればきりがないほど失敗を繰り返してきたがそれでもあきらめなかったからこそ、今の地位があるのだと思う。",
  },
  {
    answer: 4,
    sentence:
      "あまりに疲れていたので、うちへ帰っても食事はおろか着替えすらせずに、そのままベッドに倒れこんだ。",
  },
];

describe("sentence build", () => {
  const items = getSentenceBuild();

  it("covers the fifteen drill items", () => {
    expect(items.map((item) => item.id)).toEqual(
      expected.map((_, index) => index + 1),
    );
  });

  it("places each star on the answer-key piece", () => {
    items.forEach((item, index) => {
      expect(item.order).toHaveLength(4);
      expect(new Set(item.order)).toEqual(new Set([0, 1, 2, 3]));
      expect(starPieceIndex(item) + 1).toBe(expected[index].answer);
      expect(assembledSentence(item)).toBe(expected[index].sentence);
      expect(item.explanation.length).toBeGreaterThan(0);
    });
  });
});
