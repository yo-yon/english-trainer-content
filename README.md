# English Trainer 共通教材

英語学習アプリ [English Trainer](https://github.com/yo-yon/english-trainer-template)（v0.19.0 以降）が、週に1回自動で取り込む教材です。
海外のカンファレンス・旅行・日常・職場で使う単語・シャドーイングの文・会話ロールプレイの場面が、毎週1つのパックとして増えます。

- 字幕ログや利用者のデータは使っていません。一般的な教材だけです
- アプリはここを読みに行くだけで、こちらには何も送りません。取り込みたくない場合は、アプリの一覧タブで自動の取り込みをオフにするか、環境変数 `CONTENT_FEED_URL` を `off` にします
- 教材の誤りは、アプリの👎（作者にも送る）で知らせてください

## 中身

| ファイル | 内容 |
|---|---|
| `index.json` | パックの一覧（アプリが最初に読む） |
| `packs/<年>-W<週>.json` | 週ごとのパック（単語約70・文約35・会話の場面7） |
| `tools/pack.mjs` | パックを作る・検査するツール（`tools/pack-rules.cjs` はアプリと同じ検査の規則） |
| `docs/WEEKLY-PACK.md` | 毎週パックを作る手順（Claude の定期タスクが従う） |

## パックの形式（format 1）

```json
{
 "format": 1, "id": "2026-W47", "published": "2026-11-15",
 "words": [{ "word": "...", "category": "general", "meaning": "...", "pos": "...", "ipa": "/…/", "stress": "...", "stressNote": "...", "example": "...", "translation": "...", "synonyms": ["..."], "tip": "...", "source": "..." }],
 "sentences": [{ "id": "k2026w47-s01", "text": "...", "ja": "...", "category": "conversation", "scene": "...", "focus": ["..."], "source": "..." }],
 "scenes": [{ "id": "k2026w47-c1", "group": "...", "title": "...", "emoji": "...", "role": "...", "setting": "...", "goal": "...", "goal_ja": "...", "opener": "...", "opener_ja": "...", "phrases": [{ "en": "...", "ja": "..." }], "twists": ["..."], "targets": ["..."] }]
}
```

形式を変えるときは、アプリ（english-trainer・english-trainer-template の `api/src/pack.js`）とこのリポジトリの `tools/pack-rules.cjs` を同じ作業で直します。

## ライセンス

MIT（[LICENSE](LICENSE)）
