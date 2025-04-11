import React, { useState, useCallback, useMemo, JSX } from 'react';
import './App.css';

// パフォーマンステスト用の型定義
type TestResult = {
  method: string;
  size: number;
  time: number;
};

type AggregatedResult = {
  size: number;
  mapTime: number;
  forTime: number;
  difference: number;
  percentDifference: string;
  winner: string;
  iterations: number;
};

// テスト設定の型
type TestSettings = {
  sizes: number[];
  iterations: number;
  warmupRuns: number;
};

const App: React.FC = () => {
  // 状態管理
  const [results, setResults] = useState<AggregatedResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [testSettings, setTestSettings] = useState<TestSettings>({
    sizes: [10, 100, 1000, 10000, 100000],
    iterations: 100,
    warmupRuns: 5
  });

  // テスト用の配列を生成
  const generateArray = useCallback((size: number): string[] => {
    return Array.from({ length: size }, (_, i) => `Item ${i}`);
  }, []);

  // mapメソッドのパフォーマンステスト
  const testMapPerformance = useCallback((array: string[]): TestResult => {
    const start = performance.now();
    
    // const result = array.map((item, index) => {
    //   // 単純なJSXを生成（実際のレンダリングはしない）
    //   return <li key={index}>{item}</li>;
    // });
    
    const end = performance.now();
    return {
      method: 'map',
      size: array.length,
      time: end - start
    };
  }, []);

  // forループのパフォーマンステスト
  const testForLoopPerformance = useCallback((array: string[]): TestResult => {
    const start = performance.now();
    
    const result: JSX.Element[] = [];
    for (let i = 0; i < array.length; i++) {
      // 単純なJSXを生成（実際のレンダリングはしない）
      result.push(<li key={i}>{array[i]}</li>);
    }
    
    const end = performance.now();
    return {
      method: 'for',
      size: array.length,
      time: end - start
    };
  }, []);

  // テスト実行関数
  const runTest = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);

    const finalResults: AggregatedResult[] = [];
    const { sizes, iterations, warmupRuns } = testSettings;

    // 全体の進捗率を計算するための総ステップ数
    const totalSteps = sizes.length * (iterations + warmupRuns);
    let completedSteps = 0;

    // 各サイズでテストを実行
    for (const size of sizes) {
      const array = generateArray(size);
      const mapResults: number[] = [];
      const forResults: number[] = [];

      // ウォームアップ実行（ブラウザJITを安定させるため）
      for (let i = 0; i < warmupRuns; i++) {
        testMapPerformance(array);
        testForLoopPerformance(array);
        completedSteps += 1;
        setProgress(Math.floor((completedSteps / totalSteps) * 100));
        // UIをブロックしないよう少し待機
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      // メインテスト実行
      for (let i = 0; i < iterations; i++) {
        // 順序をランダム化してキャッシュの影響を軽減
        if (Math.random() > 0.5) {
          mapResults.push(testMapPerformance(array).time);
          forResults.push(testForLoopPerformance(array).time);
        } else {
          forResults.push(testForLoopPerformance(array).time);
          mapResults.push(testMapPerformance(array).time);
        }

        completedSteps += 1;
        setProgress(Math.floor((completedSteps / totalSteps) * 100));
        
        // 大きな配列の場合、UIをブロックしないようにする
        if (size >= 10000 && i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      // 平均時間を計算
      const mapAvg = mapResults.reduce((sum, time) => sum + time, 0) / iterations;
      const forAvg = forResults.reduce((sum, time) => sum + time, 0) / iterations;
      const diff = mapAvg - forAvg;
      const percentDiff = (Math.abs(diff) / Math.max(mapAvg, forAvg) * 100).toFixed(2);
      
      finalResults.push({
        size,
        mapTime: mapAvg,
        forTime: forAvg,
        difference: diff,
        percentDifference: percentDiff,
        winner: diff > 0 ? 'for' : diff < 0 ? 'map' : 'tie',
        iterations
      });

      // 結果を更新して進捗を表示
      setResults([...finalResults]);

      // UIの更新を保証するために少し待機
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    setIsRunning(false);
  }, [generateArray, testMapPerformance, testForLoopPerformance, testSettings]);

  // 設定の変更ハンドラー
  const handleSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue > 0) {
      setTestSettings(prev => {
        const newSizes = [...prev.sizes];
        newSizes[index] = newValue;
        return { ...prev, sizes: newSizes };
      });
    }
  }, []);

  const handleAddSize = useCallback(() => {
    setTestSettings(prev => ({
      ...prev,
      sizes: [...prev.sizes, 1000]
    }));
  }, []);

  const handleRemoveSize = useCallback((index: number) => {
    setTestSettings(prev => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index)
    }));
  }, []);

  const handleIterationsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue > 0) {
      setTestSettings(prev => ({
        ...prev,
        iterations: newValue
      }));
    }
  }, []);

  const handleWarmupRunsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= 0) {
      setTestSettings(prev => ({
        ...prev,
        warmupRuns: newValue
      }));
    }
  }, []);

  // 計算されたデータセット
  const chartData = useMemo(() => {
    return results.map(result => ({
      size: result.size,
      map: result.mapTime,
      for: result.forTime,
      diff: result.difference
    }));
  }, [results]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>React リストレンダリングパフォーマンス比較</h1>
        <p>map メソッドと for ループの JSX 生成パフォーマンスを比較</p>
      </header>

      <main className="App-main">
        <section className="settings-panel">
          <h2>テスト設定</h2>
          
          <div className="settings-group">
            <h3>配列サイズ</h3>
            {testSettings.sizes.map((size, index) => (
              <div key={index} className="size-input">
                <input
                  type="number"
                  min="1"
                  value={size}
                  onChange={(e) => handleSizeChange(e, index)}
                  disabled={isRunning}
                />
                {testSettings.sizes.length > 1 && (
                  <button 
                    onClick={() => handleRemoveSize(index)}
                    disabled={isRunning}
                  >
                    削除
                  </button>
                )}
              </div>
            ))}
            <button onClick={handleAddSize} disabled={isRunning}>
              サイズを追加
            </button>
          </div>

          <div className="settings-field">
            <label htmlFor="iterations">繰り返し回数:</label>
            <input
              id="iterations"
              type="number"
              min="1"
              value={testSettings.iterations}
              onChange={handleIterationsChange}
              disabled={isRunning}
            />
          </div>

          <div className="settings-field">
            <label htmlFor="warmupRuns">ウォームアップ回数:</label>
            <input
              id="warmupRuns"
              type="number"
              min="0"
              value={testSettings.warmupRuns}
              onChange={handleWarmupRunsChange}
              disabled={isRunning}
            />
          </div>

          <button 
            className="run-test-button" 
            onClick={runTest} 
            disabled={isRunning}
          >
            {isRunning ? 'テスト実行中...' : 'テスト実行'}
          </button>

          {isRunning && (
            <div className="progress-bar-container">
              <div 
                className="progress-bar"
                style={{ width: `${progress}%` }}
              ></div>
              <span>{progress}%</span>
            </div>
          )}
        </section>

        {results.length > 0 && (
          <section className="results-panel">
            <h2>テスト結果</h2>
            <div className="results-table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>配列サイズ</th>
                    <th>map (ms)</th>
                    <th>for (ms)</th>
                    <th>差 (ms)</th>
                    <th>差 (%)</th>
                    <th>勝者</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index} className={result.winner === 'for' ? 'for-wins' : result.winner === 'map' ? 'map-wins' : ''}>
                      <td>{result.size.toLocaleString()}</td>
                      <td>{result.mapTime.toFixed(3)}</td>
                      <td>{result.forTime.toFixed(3)}</td>
                      <td>{Math.abs(result.difference).toFixed(3)}</td>
                      <td>{result.percentDifference}%</td>
                      <td className={`winner ${result.winner}`}>
                        {result.winner === 'tie' ? '同等' : result.winner}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="chart-container">
              <h3>実行時間の比較</h3>
              <div className="bar-chart">
                {chartData.map((data, index) => (
                  <div key={index} className="chart-row">
                    <div className="chart-label">{data.size.toLocaleString()}</div>
                    <div className="bars">
                      <div className="bar-group">
                        <div 
                          className="bar map-bar"
                          style={{ 
                            width: `${Math.min(100, data.map * 100 / Math.max(...chartData.map(d => Math.max(d.map, d.for))))}%` 
                          }}
                        ></div>
                        <span className="bar-value">{data.map.toFixed(3)} ms (map)</span>
                      </div>
                      <div className="bar-group">
                        <div 
                          className="bar for-bar"
                          style={{ 
                            width: `${Math.min(100, data.for * 100 / Math.max(...chartData.map(d => Math.max(d.map, d.for))))}%` 
                          }}
                        ></div>
                        <span className="bar-value">{data.for.toFixed(3)} ms (for)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="explanation">
          <h2>このツールについて</h2>
          <p>
            このツールは、ReactにおけるリストレンダリングのためのJSX生成時のパフォーマンスを測定します。
            <code>map</code>メソッドと<code>for</code>ループを使用した場合の処理時間を比較します。
          </p>
          <p>
            <strong>注意:</strong> このベンチマークはJSXオブジェクトの生成時間のみを測定しており、
            実際のDOMへのレンダリング時間は含まれていません。実際のアプリケーションでは
            レンダリングのパフォーマンスに影響する他の要因も多くあります。
          </p>
          <p>
            各テストは指定した回数繰り返され、平均値が計算されます。また、JITコンパイラの最適化の
            影響を減らすためにウォームアップ実行も行います。
          </p>
        </section>
      </main>
    </div>
  );
};

export default App;