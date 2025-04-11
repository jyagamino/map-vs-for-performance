# map-vs-for-performance

Reactでリストをレンダリングする際の`map`メソッドと`for`ループのパフォーマンス比較ツール

**Live Demo**: [https://jyagamino.github.io/map-vs-for-performance/](https://jyagamino.github.io/map-vs-for-performance/)

## 概要

このプロジェクトは、Reactでリストをレンダリングする際に一般的に使用される`map`メソッドと、従来の`for`ループのパフォーマンスを比較するためのブラウザベースのベンチマークツールです。JSX要素の生成にかかる時間を測定し、様々な配列サイズでのパフォーマンスの違いを視覚的に確認できます。


## 測定方法

このツールは以下の手法でパフォーマンスを測定しています：

1. **JSX生成時間の測定**：
   - `performance.now()`を使用して高精度のタイミング計測
   - 実際のDOM操作は含まず、純粋なJSX要素の生成時間のみを測定

2. **統計的信頼性の確保**：
   - 指定した回数の繰り返し実行による平均値の算出
   - JITコンパイラの最適化の影響を減らすためのウォームアップ実行
   - 実行順序のランダム化によるキャッシュ効果の軽減

3. **`map`メソッドのテスト**：
```javascript
const testMapPerformance = (array) => {
  const start = performance.now();
  
  const result = array.map((item, index) => {
    return <li key={index}>{item}</li>;
  });
  
  const end = performance.now();
  return end - start;
};
```

4. **`for`ループのテスト**：
```javascript
const testForLoopPerformance = (array) => {
  const start = performance.now();
  
  const result = [];
  for (let i = 0; i < array.length; i++) {
    result.push(<li key={i}>{array[i]}</li>);
  }
  
  const end = performance.now();
  return end - start;
};
```

## 使い方

### オンラインデモ

1. [https://jyagamino.github.io/map-vs-for-performance/](https://jyagamino.github.io/map-vs-for-performance/) にアクセス
2. テスト設定をカスタマイズ（オプション）
3. 「テスト実行」ボタンをクリック
4. 結果を確認

### テスト設定のカスタマイズ

- **配列サイズ**：
  - デフォルトでは複数のサイズ（10, 100, 1000, 10000, 100000）が設定されています
  - 「サイズを追加」ボタンで新しいサイズを追加
  - 各サイズの横の「削除」ボタンでサイズを削除
  - 入力フィールドでサイズを直接編集

- **繰り返し回数**：
  - テストを何回実行して平均を取るかを設定
  - 値を大きくすると精度が上がるが、実行時間も長くなる

- **ウォームアップ回数**：
  - 測定前に実行する準備的な実行回数
  - JITコンパイラの最適化を安定させるために使用

### 結果の見方

1. **結果テーブル**：
   - 各配列サイズに対する`map`と`for`の実行時間（ミリ秒）
   - 両者の差（絶対値とパーセンテージ）
   - 勝者（より速い方法）の表示

2. **バーチャート**：
   - 各配列サイズにおける実行時間の視覚的な比較
   - 緑のバー：`map`メソッドの実行時間
   - 赤のバー：`for`ループの実行時間

## 注意点

- このベンチマークはJSX要素の生成時間のみを測定しており、実際のDOMへのレンダリング時間は含まれていません。
- 結果はブラウザやデバイスのパフォーマンスによって異なる場合があります。
- 非常に大きな配列サイズでテストを実行すると、ブラウザが一時的に応答しなくなる場合があります。
- 測定結果はミリ秒単位で表示されるため、小さな配列サイズでは差がわずかである可能性があります。

## 技術的背景

このツールはReactの一般的なリストレンダリングパターンについての議論に貢献することを目的としています。

1. **一般的なアプローチ**：
   - Reactでは`map`メソッドを使用したリストレンダリングが一般的です
   - 公式ドキュメントやチュートリアルでも`map`メソッドが推奨されています

2. **代替アプローチ**：
   - `for`ループを使用したアプローチは、従来のJavaScriptプログラミングに慣れた開発者にとって馴染み深いです
   - JSX内に直接記述できないため、レンダリング前に配列を構築する必要があります

3. **考慮点**：
   - 純粋なパフォーマンス
   - コードの可読性と簡潔さ
   - Reactの宣言的プログラミングモデルとの一貫性
   - メンテナンス性

## ローカルでの実行

```bash
# リポジトリのクローン
git clone https://github.com/jyagamino/map-vs-for-performance.git
cd map-vs-for-performance

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

## 構築されたツール

- [Vite](https://vitejs.dev/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)

## ライセンス

MITライセンス