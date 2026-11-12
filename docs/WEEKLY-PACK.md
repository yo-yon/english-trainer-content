# 週ごとの共通教材パック — 手順書

毎週日曜の早朝（日本時間）に Claude の定期タスクがこの手順に従い、翌週の分のパックを1つ作ります。
「Check pack」に通ると「Auto-merge pack」が main に取り込み、各自のアプリ（English Trainer v0.19.0 以降）が週1回取り込みます。

**このリポジトリは公開です。** 字幕ログ・利用者のフィードバック・個人の学習データは使いません。書いた内容はそのまま誰でも読めます。

## 1週間に作る数

| 種類 | 数 | 出どころ |
|---|---|---|
| 会話の単語・フレーズ（`general`） | 35 | 海外のカンファレンス・旅行・日常・職場の会話でよく使う語・句動詞・決まり文句を Claude が選ぶ |
| 技術の単語（`tech`） | 35 | 10語までは直近7日の**公式発表**から。残りはクラウド・AI・ローコード・業務システムで仕事やカンファレンスに出てくる語を Claude が選ぶ |
| シャドーイングの文 | 35 | セッション 14文（`category: conference`、`scene: セッション`）、会話 21文（カンファレンス・旅行・日常の場面をまんべんなく）。その週の単語を使う |
| 会話の場面（ロールプレイ） | 7 | `--next` の `sceneGroups` の分野の順に。その週の単語から1〜3語を「使ってみたい表現」（`targets`）にする |

アプリの初期設定（1日の新しい単語10語・文5文）のちょうど7日分です。検査は単語50・文25・場面5以上で通ります（重複で飛ばした分の余裕）。

## 手順

1. リポジトリ `yo-yon/english-trainer-content` を取得し、main の最新にする
2. 今週の情報を確認する

   ```bash
   cd tools && node pack.mjs --next
   ```

   パックの週（`week`）、作る数、場面の分野の割り振り、文の場面の名前（`sentenceScenes`）、登録済みの単語、最近の文、登録済みの場面が出る。`exists` が true なら、その週はもう作ってあるので何もせずに終える
3. **技術の単語**：直近7日の公式発表を Web 検索で確認し、カンファレンスや仕事で聞きそうな用語を10語まで選ぶ。残りは、よく使う技術用語から選ぶ
   - 公式発表として使ってよい出どころ：Microsoft（Learn・公式ブログ・Microsoft 365 / Power Platform / Azure / Copilot のリリースノート）、Google（Workspace・Gemini・Cloud の公式ブログ）、Anthropic・OpenAI の公式ニュース、AWS の公式ブログ
   - コミュニティの記事・SNS は使わない
   - 製品名そのもの（固有名詞）より、説明や会話で使う一般的な用語を優先する
4. **会話の単語**：登録済みの単語と重ならない、実際の会話で使う語・句動詞・決まり文句を選ぶ。中学英語レベルで覚える必要がない語は選ばない
5. **文**：その週の単語を使って、自然な話し言葉の英文を新しく書く
   - セッション 14文：登壇者が話しそうな文（製品の説明・デモ・事例・質疑への答え）
   - 会話 21文：`sentenceScenes` の場面から、最近の文と重ならないように。カンファレンス（雑談・質疑・ブース）と旅行・日常（空港・ホテル・レストラン・交通・買い物・体調・電話）を半々くらい
   - 8〜20語程度（検査は4〜25語）。1文30秒以内で話せる長さ
6. **会話の場面**：`sceneGroups` の分野の順に7つ。登録済みの場面と重ならない場面にする
   - `targets` は、その週の単語（または前のパックの単語）から会話で自然に使える語を1〜3個
   - `role`・`setting`・`goal`・`opener`・`twists` は英語、`title`（20文字以内）・`goal_ja`・`opener_ja`・`phrases` の訳は日本語
   - `twists` は2〜4個。会話の途中で起きる小さな想定外（品切れ・聞き返される・予定が変わる など）
   - 実在の人名・会社名は使わない。体調・お金などの話題は一般的な範囲にとどめる
7. 次の形で `/tmp/new-pack.json` に書く（文・場面の `id` は書かない。ツールが付ける）

   ```json
   {
     "words": [
       {
         "word": "follow up", "category": "general",
         "meaning": "（あとで）連絡する・追って確認する", "pos": "句動詞",
         "ipa": "/ˈfɑloʊ ʌp/", "stress": "FOL-low up", "stressNote": "fol を強く",
         "example": "I'll follow up with you by email after the session.", "translation": "セッションの後、メールで改めてご連絡します。",
         "synonyms": ["get back to", "check in"], "tip": "follow の l は舌先を上の歯の裏に付ける",
         "source": "会話の頻出表現（共通教材）"
       }
     ],
     "sentences": [
       { "text": "Could you share the slides after the session?", "ja": "セッションの後でスライドを共有していただけますか？", "category": "conversation", "scene": "質疑応答", "focus": ["share"], "source": "会話文（共通教材）" }
     ],
     "scenes": [
       {
         "group": "旅行・日常", "title": "ホテルで部屋を替えてもらう", "emoji": "🏨",
         "role": "a front desk clerk at a busy hotel near a conference venue",
         "setting": "At the hotel front desk in the evening, after a long conference day.",
         "goal": "Explain a problem with your room and ask to change rooms.", "goal_ja": "部屋の問題を説明して、部屋を替えてもらう",
         "opener": "Good evening. How can I help you?", "opener_ja": "こんばんは。どうなさいましたか？",
         "phrases": [{ "en": "The air conditioner isn't working.", "ja": "エアコンが動きません。" }, { "en": "Would it be possible to change rooms?", "ja": "部屋を替えていただくことはできますか？" }, { "en": "That would be great, thank you.", "ja": "それは助かります、ありがとうございます。" }],
         "twists": ["The hotel is almost full, so only a smaller room is available.", "The clerk offers to send a technician first."],
         "targets": ["follow up"]
       }
     ]
   }
   ```

8. パックを作り、検査する。不備があれば直して、通るまでやり直す（`--week` は手順2の `week`）

   ```bash
   cd tools && node pack.mjs /tmp/new-pack.json --week <week> && node pack.mjs --check && node --test test/*.test.mjs
   ```

9. ブランチ `pack/<week>` を作り、`packs/<week>.json` と `index.json` だけをコミットして push する
10. プルリクエストを REST API で作る（`gh pr create` は使えない）。本文には、単語の数（会話・技術）と、技術の単語に使った公式発表のタイトルと URL、場面の題名を書く

    ```bash
    gh api repos/yo-yon/english-trainer-content/pulls -f title="pack: <week>" -f head="pack/<week>" -f base=main -F body=@/tmp/pr.md
    ```

11. マージは「Auto-merge pack」が行う（Claude はマージしない）。数分待って、マージされたことを確認する。「Check pack」が失敗した、またはマージされない場合は、理由をプルリクエストのコメントと報告に書く

## 書き方の決まり

| 項目 | 決まり |
|---|---|
| `ipa` | 一般米語の IPA を `/…/` で囲む。辞書で確かめられる発音にする |
| `stress` | 音節をハイフン（句は空白）で区切り、強く読む音節を1つだけ大文字にする（例：`LEV-er-age`、`go THROUGH`） |
| `meaning`・`translation`・`stressNote`・`tip` | 日本語。`tip` は日本人がつまずきやすい音のコツ |
| `example` | その語を含む、仕事やカンファレンスで使う自然な英文 |
| `synonyms` | 1〜3語。意味が近く、実際に置き換えられる語 |
| `source` | 公式発表：`公式発表：<タイトル>（<日付>）`／自分で選んだ語：`会話の頻出表現（共通教材）` か `仕事の頻出表現（共通教材）`／文：`会話文（共通教材）` か `セッション文（共通教材）` |

## 著作権・公開について

- 公式発表・記事の文を**そのまま写さない**。単語と題材だけを使い、例文と文は新しく書く
- 字幕ログ・利用者のフィードバック・個人の学習データは使わない
- 一度公開したパックは書き換えない。アプリは取り込み済みのパックを読み直さないため、直しても取り込み済みの人には届かない（今の版の制限）。誤りに気づいたら報告に書き、作者が対応を決める
