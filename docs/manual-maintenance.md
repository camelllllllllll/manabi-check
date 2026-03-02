# まなびチェック 保守管理マニュアル

## システム概要

| 項目 | 内容 |
|------|------|
| フレームワーク | Next.js 16 (App Router, TypeScript) |
| UI | Tailwind CSS + shadcn/ui |
| データベース | Supabase (PostgreSQL) |
| 画像ストレージ | Supabase Storage |
| ホスティング | ローカル / Vercel（予定） |

---

## ディレクトリ構成

```
manabi-check/
├── src/
│   ├── app/
│   │   ├── (admin)/admin/    ← 講師向け画面
│   │   │   ├── units/        ← 単元管理
│   │   │   ├── questions/    ← 問題管理
│   │   │   ├── tests/        ← テスト管理
│   │   │   └── students/     ← 生徒管理
│   │   ├── (parent)/parent/  ← 保護者向け画面
│   │   │   ├── login/        ← ログイン
│   │   │   ├── tests/        ← テスト選択
│   │   │   ├── input/[testId] ← ○×入力
│   │   │   ├── results/[testId] ← 採点結果
│   │   │   └── review/[testId]  ← 復習教材
│   │   └── api/              ← APIエンドポイント
│   ├── components/           ← UIコンポーネント
│   ├── lib/
│   │   ├── supabase.ts       ← Supabaseクライアント
│   │   └── utils.ts          ← ユーティリティ
│   └── types/
│       └── database.ts       ← DB型定義
├── supabase/
│   ├── migrations/
│   │   └── 001_create_tables.sql  ← テーブル定義
│   └── seed.sql              ← サンプルデータ
├── docs/                     ← マニュアル類
├── .env.local                ← 環境変数（Git管理外）
└── .env.local.example        ← 環境変数テンプレート
```

---

## 環境構築手順

### 前提条件
- Node.js 18以上
- npm
- Supabase アカウント

### 手順

1. リポジトリをクローン
2. 依存パッケージをインストール
   ```
   cd manabi-check
   npm install
   ```
3. `.env.local.example` をコピーして `.env.local` を作成
   ```
   cp .env.local.example .env.local
   ```
4. Supabase プロジェクトを作成し、`.env.local` に以下を設定
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Supabase SQL Editor でテーブル作成
   - `supabase/migrations/001_create_tables.sql` を実行
6. サンプルデータ投入（任意）
   - `supabase/seed.sql` を実行
7. 開発サーバー起動
   ```
   npm run dev
   ```
8. http://localhost:3000 にアクセス

---

## データベース構成

### テーブル一覧

| テーブル | 用途 |
|---------|------|
| subjects | 教科マスタ |
| units | 単元マスタ（階層構造対応） |
| questions | 問題マスタDB（蓄積資産） |
| tests | テスト回の定義 |
| test_questions | テスト回と問題の紐付け |
| students | 生徒情報 |
| answer_records | 解答履歴（累積分析の基礎データ） |

### ストレージ
- バケット名: `question-images`
- 用途: 問題に紐づく図表画像
- アクセス: public（MVP段階）

---

## API一覧

| メソッド | パス | 機能 |
|---------|------|------|
| GET/POST | /api/subjects | 教科の取得・作成 |
| GET/POST/PUT/DELETE | /api/units | 単元のCRUD |
| GET/POST/PUT/DELETE | /api/questions | 問題のCRUD |
| GET/POST/PUT/DELETE | /api/tests | テストのCRUD |
| GET | /api/tests/[id]/questions | テスト回の問題一覧取得 |
| GET/POST | /api/students | 生徒の取得・作成 |
| POST | /api/auth/login | アクセスコードログイン |
| GET/POST | /api/answers | 解答の取得・保存 |
| GET | /api/review | 復習教材データ取得 |
| POST | /api/upload | 画像アップロード |

---

## セキュリティに関する注意（本番化前に対応必須）

### 1. RLS（Row Level Security）
現在は全テーブルで全操作を許可する簡易ポリシーを設定しています。
本番環境では以下を実装してください：
- 保護者は自分の生徒データのみアクセス可能
- 管理系テーブルは講師ロールのみ書き込み可能

### 2. 認証
現在はアクセスコード + Cookie の簡易認証です。
本番ではSupabase Authまたはメールアドレス認証への移行を推奨します。

### 3. ストレージ
`question-images` バケットはpublicです。
機密性のある画像を扱う場合はprivateバケットに変更してください。

### 4. 環境変数
`.env.local` にはSupabaseのキーが含まれます。
Git管理に含めないよう `.gitignore` に記載済みか確認してください。

---

## Vercelへのデプロイ手順（参考）

1. GitHubリポジトリにプッシュ
2. Vercelでプロジェクトをインポート
3. 環境変数を設定（`.env.local` と同じ値）
4. デプロイ実行
5. カスタムドメインを設定（任意）

---

## 今後の拡張予定（Phase 2以降）

- CSV一括インポート機能
- 累積データ分析（単元別推移グラフ）
- 講師向けダッシュボード
- メールアドレス認証への移行
- Claude APIによる解説自動生成
- 他教科への拡張
