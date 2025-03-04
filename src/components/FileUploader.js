// FileUploader.js
import { useState, useEffect } from 'react';

export default function FileUploader({ onResult }) {
  const [jsonWorker, setJsonWorker] = useState(null);
  const [resultText, setResultText] = useState("");

  useEffect(() => {
    const jw = new Worker('/workers/jsonWorker.js');
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

      const processorWorker = new Worker('/workers/processorWorker.js');
      processorWorker.onmessage = (event) => {
        // ここではオブジェクトではなく、文字列に変換して表示
        const output = typeof event.data === 'object' ? JSON.stringify(event.data, null, 2) : event.data;
        //console.log(event.data.type);
        if (event.data.type === 'processComplete') {
          alert('ファイルからのマッチ生成が完了しました！');
          // OK押下後にページリロード
          window.location.reload();
        }
        setResultText(output);
        onResult && onResult(output);
        //processorWorker.terminate();
      };
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
