// 週ごとの共通教材パックを作る・検査するツール。手順は docs/WEEKLY-PACK.md
//   node pack.mjs --next [--week 2026-W47]     今週のパックの ID・作る数・場面の分野の割り振り・登録済みの単語や文を表示
//   node pack.mjs new.json [--week 2026-W47]   new.json を検査し、ID を付けて packs/<週>.json を作り、index.json に追記
//   node pack.mjs --check                      index.json とすべてのパックを、アプリと同じ規則で検査（PR の検証用）
// new.json の形：{ "words": [...], "sentences": [...], "scenes": [...], "skip": [{ "term": "...", "reason": "..." }] }
//   文・場面の id、出題順、追加日はツールとアプリが付ける。書かない。
import { readFile, writeFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const R = require("./pack-rules.cjs");
const ROOT = new URL("../", import.meta.url);
const INDEX = new URL("index.json", ROOT);
const PACKS = new URL("packs/", ROOT);

// 1週間に作る数。アプリの初期設定（1日の新しい単語10語・文5文）の7日分と、会話の場面を1日1つ
export const PER_WEEK = { general: 35, tech: 35, session: 14, conversation: 21, scenes: 7 };
export const MIN = { words: 50, sentences: 25, scenes: 5 };
// 場面の分野は週ごとに順番をずらして、3つの分野が偏らないようにする
export const SCENE_GROUPS = R.SCENE_GROUPS;

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const pad = (n) => String(n).padStart(2, "0");

/** 日本時間の日付（YYYY-MM-DD） */
export function jstDate(now = new Date()) {
  return new Date(now.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}
/** ISO 週番号（2026-W47）。日本時間の日付で決める */
export function isoWeek(dateStr) {
  const d = new Date(dateStr + "T00:00:00Z");
  const day = (d.getUTCDay() + 6) % 7; // 月曜=0
  d.setUTCDate(d.getUTCDate() - day + 3); // その週の木曜
  const year = d.getUTCFullYear();
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const week = 1 + Math.round(((d - jan4) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
  return `${year}-W${pad(week)}`;
}
/** その週の場面の分野（7つ）。週番号で開始位置をずらして回す */
export function sceneGroupPlan(week, n = PER_WEEK.scenes) {
  const k = R.packKeys(week);
  const start = k ? (k.base / 1000) % SCENE_GROUPS.length : 0;
  return Array.from({ length: n }, (_, i) => SCENE_GROUPS[(start + i) % SCENE_GROUPS.length]);
}

/** 新しいパックを組み立てる（ファイルには書かない）。errors があれば何も書かない */
export function buildPack(existingPacks, input, week, published) {
  const errors = [], skipped = [];
  if (!R.packKeys(week)) return { errors: ["週は 2026-W47 の形"] };
  if (existingPacks.some((p) => p.id === week)) return { errors: [`${week} のパックはすでにあります`] };
  const { prefix } = R.packKeys(week);
  const seenWords = new Set(existingPacks.flatMap((p) => p.words.map((w) => R.wordId(w.word))));
  const seenTexts = new Set(existingPacks.flatMap((p) => p.sentences.map((s) => norm(s.text))));
  const seenTitles = new Set(existingPacks.flatMap((p) => (p.scenes || []).map((c) => c.title)));

  const words = [];
  for (const w of Array.isArray(input.words) ? input.words : []) {
    const id = R.wordId(w && w.word);
    if (seenWords.has(id)) { skipped.push(`単語「${w.word}」は登録済み`); continue; }
    seenWords.add(id);
    words.push(w);
  }
  const sentences = [];
  for (const s of Array.isArray(input.sentences) ? input.sentences : []) {
    if (s && seenTexts.has(norm(s.text))) { skipped.push(`文「${s.text}」は登録済み`); continue; }
    if (s) seenTexts.add(norm(s.text));
    const { id, ...rest } = s || {};
    sentences.push({ id: `${prefix}-s${pad(sentences.length + 1)}`, ...rest });
  }
  const scenes = [];
  for (const c of Array.isArray(input.scenes) ? input.scenes : []) {
    if (c && seenTitles.has(c.title)) { skipped.push(`場面「${c.title}」は登録済み`); continue; }
    if (c) seenTitles.add(c.title);
    const { id, ...rest } = c || {};
    scenes.push({ id: `${prefix}-c${scenes.length + 1}`, ...rest });
  }
  // 場面の「使ってみたい表現」は、このパックか前のパックの単語から選ぶ
  for (const c of scenes) for (const t of (c && c.targets) || []) if (!seenWords.has(R.wordId(t))) errors.push(`場面「${c.title}」の targets「${t}」が単語にない`);
  if (words.length < MIN.words) errors.push(`単語は${MIN.words}語以上（いまは${words.length}語）`);
  if (sentences.length < MIN.sentences) errors.push(`文は${MIN.sentences}文以上（いまは${sentences.length}文）`);
  if (scenes.length < MIN.scenes) errors.push(`場面は${MIN.scenes}つ以上（いまは${scenes.length}つ）`);

  const pack = { format: R.FORMAT, id: week, published, words, sentences, scenes };
  const r = R.cleanPack(pack, week); // アプリが取り込むときと同じ検査
  if (r.errors) errors.push(...r.errors);
  return errors.length ? { errors, skipped } : { errors: [], skipped, pack };
}

/** index.json とパック全体の検査 */
export function checkAll(index, packs, files) {
  const e = [];
  if (!index || index.format !== R.FORMAT || !Array.isArray(index.packs)) return ["index.json の形式が違う"];
  const ids = new Set(), words = new Map();
  for (const x of index.packs) {
    if (ids.has(x.id)) e.push(`index.json に ${x.id} が2回ある`);
    ids.add(x.id);
    if (x.file !== `packs/${x.id}.json`) e.push(`${x.id} の file は packs/${x.id}.json`);
    const p = packs.get(x.id);
    if (!p) { e.push(`${x.file} がない`); continue; }
    const r = R.cleanPack(p, x.id);
    if (r.errors) { e.push(...r.errors.map((m) => `${x.id}：${m}`)); continue; }
    if (x.words !== r.words.length || x.sentences !== r.sentences.length || x.scenes !== r.scenes.length) e.push(`${x.id}：index.json の件数が中身と違う`);
    if (x.published !== p.published) e.push(`${x.id}：index.json の published が中身と違う`);
    for (const w of r.words) {
      if (words.has(w.id)) e.push(`単語「${w.word}」が ${words.get(w.id)} と ${x.id} の両方にある`);
      else words.set(w.id, x.id);
    }
  }
  for (const f of files) if (!ids.has(f.replace(/\.json$/, ""))) e.push(`packs/${f} が index.json にない`);
  return e;
}

/** パックの書き方：読みやすいように1件1行 */
export function formatPack(p) {
  const list = (a) => (a.length ? "[\n" + a.map((x) => "  " + JSON.stringify(x)).join(",\n") + "\n ]" : "[]");
  return `{\n "format": ${p.format},\n "id": ${JSON.stringify(p.id)},\n "published": ${JSON.stringify(p.published)},\n "words": ${list(p.words)},\n "sentences": ${list(p.sentences)},\n "scenes": ${list(p.scenes)}\n}\n`;
}

const readJson = async (u) => JSON.parse(await readFile(u, "utf8"));
async function loadAll() {
  const index = await readJson(INDEX);
  const files = (await readdir(PACKS)).filter((f) => f.endsWith(".json"));
  const packs = new Map();
  for (const f of files) packs.set(f.replace(/\.json$/, ""), await readJson(new URL(f, PACKS)));
  return { index, packs, files };
}

async function main(argv) {
  const wi = argv.indexOf("--week");
  const today = jstDate();
  // 日曜に作り、翌日（月曜）から始まる週の番号を付ける
  const week = wi >= 0 ? argv[wi + 1] : isoWeek(jstDate(new Date(Date.now() + 24 * 3600 * 1000)));
  const { index, packs, files } = await loadAll();
  const list = [...packs.values()];

  if (argv[0] === "--check") {
    const e = checkAll(index, packs, files);
    if (e.length) { console.error(e.map((m) => "✗ " + m).join("\n")); process.exit(1); }
    const n = list.reduce((a, p) => ({ w: a.w + p.words.length, s: a.s + p.sentences.length, c: a.c + (p.scenes || []).length }), { w: 0, s: 0, c: 0 });
    console.log(`OK：パック ${index.packs.length}（単語 ${n.w} 語、文 ${n.s} 文、場面 ${n.c}）`);
    return;
  }
  if (argv[0] === "--next") {
    console.log(JSON.stringify({
      week, published: today, exists: packs.has(week), perWeek: PER_WEEK,
      sceneGroups: sceneGroupPlan(week),
      sentenceScenes: R.SCENES,
      registeredWords: list.flatMap((p) => p.words.map((w) => w.word)),
      recentSentences: list.slice(-4).flatMap((p) => p.sentences.map((s) => s.text)),
      sceneTitles: list.flatMap((p) => (p.scenes || []).map((c) => c.title)),
    }, null, 1));
    return;
  }
  if (!argv[0] || argv[0].startsWith("--")) { console.error("使い方：node pack.mjs --next | --check | <new.json> [--week 2026-W47]"); process.exit(2); }

  const input = await readJson(new URL(argv[0], `file://${process.cwd()}/`));
  const r = buildPack(list, input, week, today);
  for (const m of r.skipped || []) console.log("・飛ばした：" + m);
  if (r.errors.length) { console.error(r.errors.map((m) => "✗ " + m).join("\n")); process.exit(1); }
  await writeFile(new URL(`${week}.json`, PACKS), formatPack(r.pack));
  index.packs.push({ id: week, file: `packs/${week}.json`, published: today, words: r.pack.words.length, sentences: r.pack.sentences.length, scenes: r.pack.scenes.length });
  index.packs.sort((a, b) => (a.id < b.id ? -1 : 1));
  await writeFile(INDEX, JSON.stringify(index, null, 1) + "\n");
  console.log(`作りました：packs/${week}.json（単語 ${r.pack.words.length} 語、文 ${r.pack.sentences.length} 文、場面 ${r.pack.scenes.length}）`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2)).catch((e) => { console.error(e.message); process.exit(1); });
