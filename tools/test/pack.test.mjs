import test from "node:test";
import assert from "node:assert";
import { buildPack, checkAll, isoWeek, sceneGroupPlan, formatPack, MIN } from "../pack.mjs";

const word = (i) => ({ word: `sample${i}`, category: i % 2 ? "tech" : "general", meaning: "見本の語", pos: "名詞", ipa: "/ˈsæmpəl/", stress: "SAM-ple", stressNote: "sam を強く", example: `We use sample${i} every day.`, translation: "毎日使います。", synonyms: ["example"], tip: "a は口を横に開く", source: "テスト" });
const sentence = (i) => ({ text: `Could you tell me more about sample${i} please?`, ja: "もう少し教えてください。", category: "conversation", scene: "雑談", focus: ["tell"], source: "テスト" });
const scene = (i) => ({ group: "旅行・日常", title: `見本の場面${i}`, emoji: "🧪", role: "a friendly hotel clerk at the front desk", setting: "At a hotel front desk in the evening.", goal: "Ask for a late check-out politely.", goal_ja: "レイトチェックアウトを頼む", opener: "Good evening. How can I help?", opener_ja: "こんばんは。どうしましたか？", phrases: [{ en: "Could I check out late?", ja: "遅めにチェックアウトできますか？" }, { en: "Is there a fee?", ja: "料金はかかりますか？" }, { en: "Thank you so much.", ja: "ありがとうございます。" }], twists: ["The clerk says late check-out costs extra.", "The clerk asks for your room number."], targets: ["sample0"] });
const input = (n = 0) => ({ words: Array.from({ length: MIN.words }, (_, i) => word(i + n)), sentences: Array.from({ length: MIN.sentences }, (_, i) => sentence(i + n)), scenes: Array.from({ length: MIN.scenes }, (_, i) => scene(i + n)) });

test("ISO 週番号", () => {
  assert.equal(isoWeek("2026-11-16"), "2026-W47");
  assert.equal(isoWeek("2026-11-22"), "2026-W47");
  assert.equal(isoWeek("2027-01-01"), "2026-W53");
  assert.equal(isoWeek("2026-01-01"), "2026-W01");
});

test("場面の分野：週ごとに順番をずらし、3つの分野をまんべんなく", () => {
  const p = sceneGroupPlan("2026-W47");
  assert.equal(p.length, 7);
  assert.equal(new Set(p).size, 3);
  assert.notDeepEqual(sceneGroupPlan("2026-W48")[0], p[0]);
});

test("組み立て：文・場面に ID を付け、アプリと同じ検査に通る", () => {
  const r = buildPack([], input(), "2026-W47", "2026-11-16");
  assert.deepEqual(r.errors, []);
  assert.equal(r.pack.sentences[0].id, "k2026w47-s01");
  assert.equal(r.pack.scenes[4].id, "k2026w47-c5");
  const back = JSON.parse(formatPack(r.pack));
  assert.deepEqual(back, r.pack);
});

test("組み立て：前のパックにある単語・文・場面は飛ばし、数が足りなければ断る", () => {
  const first = buildPack([], input(), "2026-W47", "2026-11-16").pack;
  const r = buildPack([first], input(), "2026-W48", "2026-11-23");
  assert.ok(r.skipped.length >= MIN.words);
  assert.ok(r.errors.some((m) => /単語は/.test(m)));
  assert.ok(buildPack([first], input(), "2026-W47", "x").errors[0].includes("すでに"));
});

test("組み立て：targets はパックの単語から", () => {
  const i = input(); i.scenes[0].targets = ["unknownword"];
  assert.ok(buildPack([], i, "2026-W47", "2026-11-16").errors.some((m) => /targets/.test(m)));
});

test("全体の検査：一覧と中身の食い違い・パックをまたぐ単語の重複", () => {
  const a = buildPack([], input(), "2026-W47", "2026-11-16").pack;
  const b = { ...buildPack([], input(), "2026-W48", "2026-11-23").pack };
  const idx = { format: 1, packs: [a, b].map((p) => ({ id: p.id, file: `packs/${p.id}.json`, published: p.published, words: p.words.length, sentences: p.sentences.length, scenes: p.scenes.length })) };
  const e = checkAll(idx, new Map([[a.id, a], [b.id, b]]), ["2026-W47.json", "2026-W48.json"]);
  assert.ok(e.some((m) => /両方/.test(m)));
  assert.deepEqual(checkAll({ format: 1, packs: idx.packs.slice(0, 1) }, new Map([[a.id, a]]), ["2026-W47.json"]), []);
  assert.ok(checkAll({ format: 1, packs: [] }, new Map(), ["2026-W47.json"]).length);
});
