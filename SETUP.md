# のまぼど LINE Mini App セットアップ手順

## 必要なアカウント

- [x] LINEデベロッパーアカウント
- [x] LINE公式アカウント
- [x] Stripeアカウント
- [ ] Vercelアカウント（無料）

---

## Step 1: Vercelセットアップ

1. [vercel.com](https://vercel.com) でアカウント作成
2. GitHubにこのプロジェクトをpush
3. Vercelで「New Project」→ リポジトリを選択してデプロイ
4. デプロイ後のURL（例: `https://nomabodo-liff.vercel.app`）をメモ

### Vercel Postgresデータベース作成

1. Vercelダッシュボード → Project → Storage → Create Database → Postgres
2. 「Connect」をクリックすると環境変数が自動設定される
3. ローカル開発用に環境変数を取得:
   ```bash
   npx vercel env pull .env.local
   ```

### データベースの初期化

```bash
# マイグレーション実行
npx prisma migrate deploy

# 初期データ投入（料金設定）
npm run db:seed
```

---

## Step 2: LINEデベロッパー設定

### LINEログインチャネル作成

1. [LINE Developers Console](https://developers.line.biz/console/)
2. 新規プロバイダー作成（または既存のものを選択）
3. 「新規チャネル作成」→「LINE Login」を選択
4. チャネル名: のまぼど など
5. チャネル設定を保存

### LIFFアプリ作成

1. 作成したLINEログインチャネル → 「LIFF」タブ
2. 「追加」をクリック
3. 設定:
   - LIFFアプリ名: のまぼど
   - サイズ: Full
   - エンドポイントURL: `https://nomabodo-liff.vercel.app`（VercelのURL）
   - Scope: profile, openid
   - LINEログイン: チャネル同意画面のスコープに合わせる
4. LIFF IDをメモ（形式: `1234567890-xxxxxxxx`）

### チャネルシークレット取得

1. LINEログインチャネル → 「チャネル基本設定」
2. チャネルID と チャネルシークレットをメモ

---

## Step 3: Stripeセットアップ

### 商品と価格の作成

1. [Stripe Dashboard](https://dashboard.stripe.com) → 商品 → 新規作成
2. **月額プラン商品**を作成:
   - 商品名: のまぼど 月額プラン
   - 価格: ¥XXXX/月（金額は決定後に設定）
   - 定期支払い / 毎月
3. 作成された価格ID（`price_...`）をメモ

### Webhookの設定

1. Stripe Dashboard → デベロッパー → Webhook → エンドポイントを追加
2. エンドポイントURL: `https://nomabodo-liff.vercel.app/api/stripe/webhook`
3. 以下のイベントを選択:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Webhookシークレット（`whsec_...`）をメモ

---

## Step 4: 環境変数設定

`.env.local.example` を参考に `.env.local` を作成（ローカル開発用）:

```bash
cp .env.local.example .env.local
# 各値を埋める
```

Vercelの環境変数設定（本番用）:
1. Vercelダッシュボード → Project → Settings → Environment Variables
2. 以下を追加:
   - `NEXT_PUBLIC_LIFF_ID`
   - `LINE_CHANNEL_ID`
   - `LINE_CHANNEL_SECRET`
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_SUBSCRIPTION_PRICE_ID`
   - `NEXT_PUBLIC_APP_URL`
   - `ADMIN_COOKIE_SECRET`（`openssl rand -base64 32` で生成）

---

## Step 5: 管理者設定

最初のスタッフアカウントを管理者に設定:

1. 自分のLINEアカウントでアプリにアクセスして自動登録
2. Prisma Studioでデータを確認・更新:
   ```bash
   npx prisma studio
   ```
3. `profiles` テーブルで自分のレコードを探し、`isAdmin` を `true` に変更

---

## Step 6: LINEミニアプリとして公開

1. LINE公式アカウントのリッチメニューにLIFF URLを設定
   - LIFF URL形式: `https://liff.line.me/{LIFF_ID}`
2. または、ユーザーにLIFF URLを直接共有

---

## ローカル開発

```bash
# 依存パッケージインストール
npm install

# 環境変数設定（Vercel CLIを使う場合）
npx vercel env pull .env.local

# Prismaクライアント生成
npx prisma generate

# 開発サーバー起動
npm run dev

# Stripe Webhookのローカル転送（別ターミナル）
stripe listen --forward-to localhost:3000/api/stripe/webhook

# DB管理UI
npm run db:studio
```

---

## 料金設定の変更

管理画面 `/admin/pricing` から変更可能:
- 通常料金の単位時間と金額
- 会員料金の単位時間と金額（¥0 = 無料）
