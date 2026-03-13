# 章4 SSE基礎

## この章で学ぶこと

- SSEの通信モデル
- text/event-streamの意味
- event、data、id、retryの役割
- 再接続時の基本挙動
- 進捗バー配信でSSEを使う理由

## 背景

SSEは、サーバーからクライアントへイベントを継続配信するためのHTTPベース技術です。

進捗バー配信のような「サーバー側で状態が更新されるたびにUIを更新したい」場面では、
クライアントが短い間隔で何度も問い合わせるより、サーバーが更新時に通知する方が自然です。

SSEはこの用途に対して次の利点があります。

- ブラウザ標準APIで扱える
- メッセージ形式が定型で学習しやすい
- 再接続の仕組みが用意されている

## 仕組み

SSEでは、クライアントが1本のHTTP接続を開き、サーバーはその接続を閉じずにイベントを流し続けます。

基本フローは次の通りです。

1. クライアントがGETでSSEエンドポイントへ接続する
2. サーバーがContent-Typeをtext/event-streamで返す
3. サーバーがイベントを逐次送信する
4. クライアントがイベントを受信してUIを更新する
5. 接続断が起きたらクライアントが再接続する

### イベントフォーマット

1イベントは複数行テキストで構成し、空行で区切ります。

```text
event: progress
data: {"jobId":"job-1","percent":25,"message":"processing","timestamp":"2026-03-13T10:00:00Z"}
id: 25

```

代表フィールドは次の通りです。

- event: イベント種別
- data: ペイロード本体
- id: イベント識別子
- retry: 再接続待機ミリ秒

### text/event-streamである理由

レスポンスがこのMIME型であることで、クライアントは「継続イベントとして解釈する」前提で受信できます。

## 最小例

### サーバー側レスポンスヘッダー例

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

### クライアント側最小コード例

```js
const source = new EventSource('/progress-sse');

source.addEventListener('progress', (event) => {
  const payload = JSON.parse(event.data);
  updateProgress(payload.percent);
});

source.addEventListener('done', () => {
  markDone();
  source.close();
});
```

## 実装

案Aの進捗バー配信では、次の設計にします。

- 進捗イベント: event=progress
- 完了イベント: event=done
- dataの共通フィールド: jobId, percent, message, timestamp
- 心拍: コメント行を一定間隔で送信

### 心拍の目的

- 中間機器によるアイドル切断を減らす
- クライアント側で接続生存を観測しやすくする

心拍は次のような形式で送れます。

```text
: heartbeat

```

## よくある失敗

- Content-Typeがtext/event-streamになっていない
- イベント末尾の空行がなく、クライアント側でイベント確定しない
- dataを複数行で送る際の整形規則を崩す
- done受信後に接続を閉じず、UI状態が不整合になる

## 章末問題

1. SSEのeventとdataは何を分離するために使うか説明してください。
2. 進捗バー配信でidフィールドを使う利点を説明してください。
3. 心拍を送らない場合に起きやすい運用上の問題を挙げてください。

## 章末チェック

次を口頭または文章で説明できれば、この章の到達条件を満たします。

- SSEで接続が維持される理由
- event、data、id、retryの役割
- 進捗バー配信でSSEが適する理由
