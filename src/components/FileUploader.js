// FileUploader.js
import { useState, useEffect } from 'react';

/**
 * オブジェクトの全キーをキャメルケースに変換する
 * ※再帰的にネストされたオブジェクトや配列にも対応
 */
function toCamelCaseKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(value => toCamelCaseKeys(value));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      // 先頭文字を小文字に変換してキャメルケース風にする
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      acc[camelKey] = toCamelCaseKeys(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

export default function FileUploader({ onResult }) {
  const [jsonWorker, setJsonWorker] = useState(null);
  const [resultText, setResultText] = useState("");

  useEffect(() => {
    const jw = new Worker('/AndeanWeb/workers/jsonWorker.js');
    setJsonWorker(jw);
    return () => {
      jw.terminate();
    };
  }, []);

  useEffect(() => {
    if (!jsonWorker) return;

    jsonWorker.onmessage = (event) => {
      let jsonData;
      if (typeof event.data === 'string') {
        try {
          jsonData = JSON.parse(event.data);
        } catch (error) {
          onResult && onResult({ error: 'jsonWorker の結果の JSON パースに失敗しました' });
          return;
        }
      } else {
        jsonData = event.data;
      }
      // ここですべてのキーをキャメルケースに変換
      jsonData = toCamelCaseKeys(jsonData);

      const processorWorker = new Worker('/AndeanWeb/workers/processorWorker.js');
      processorWorker.onmessage = (event) => {
        // オブジェクトの場合は整形して表示
        const output = typeof event.data === 'object' ? JSON.stringify(event.data, null, 2) : event.data;
        if (event.data.type === 'processComplete') {
          alert('ファイルからのマッチ生成が完了しました！');
          window.location.reload();
        }
        setResultText(output);
        onResult && onResult(output);
      };
      // 変換済みの jsonData を processorWorker に渡す
      processorWorker.postMessage(jsonData);
    };
  }, [jsonWorker, onResult]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (jsonWorker) {
        jsonWorker.postMessage(e.target.result);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <pre>{resultText}</pre>
    </div>
  );
}
