# BPM Counter

マイク入力からリアルタイムにBPMを自動検出するWebアプリです。

**デモ:** https://unc.jp/bpm2/

## 機能

- **BPM自動検出** — [essentia.js](https://essentia.upf.edu/essentia.js/) の `RhythmExtractor2013` アルゴリズム（multifeatureモード）を Web Worker + WASM で処理
- **オートゲイン** — 音量レベルに応じてゲインを自動補間し、無音〜大音量まで安定した検出
- **エフェクトチェーン（FX）** — ハイパス / ローシェルフ / ミッドカット / ハイシェルフ / コンプレッサーによる音質最適化
- **波形ビジュアライザー** — オシロスコープ波形・グラフィックイコライザー・スクロール波形（ビートマーカー付き）
- **スリープ防止** — Wake Lock API でスマートフォンの画面オフを抑制

## 技術構成

| レイヤー | 技術 |
|---|---|
| 音声キャプチャ | `getUserMedia` + AudioWorklet（メインスレッドをブロックしないバッファリング） |
| BPM解析 | Web Worker + essentia.js 0.1.3（WASM） |
| エフェクト | Web Audio API（BiquadFilter / DynamicsCompressor / GainNode） |
| 描画 | Canvas 2D API |

## ファイル構成

```
bpm2/
├── index.html       # メインUI・オーディオグラフ・描画ロジック
├── bpm-worker.js    # BPM解析 Web Worker（essentia.js呼び出し）
└── css/
    └── style.css    # スタイルシート
```

## 使い方

1. ブラウザでページを開く
2. **Start** ボタンを押してマイクの使用を許可
3. 音楽を流すと数秒後にBPMが表示される

> **注意:** マイク入力が必要なため、ローカルファイルではなく HTTP(S) サーバー経由でのアクセスが必要です。

## 動作環境

Chrome / Edge など、AudioWorklet・Wake Lock API をサポートするモダンブラウザ推奨。
