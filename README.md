# 越南語數字練習

北越為主的越南語數字練習 GitHub Pages 靜態頁。

## 目標

- 練習越南語數字 `0–9999`。
- 北越念法為主，南越作為補充註解與可接受別名。
- 支援閃卡、選擇題、輸入練習、聽力選擇。
- 輸入練習提供頁面內越南語鍵盤。
- 使用預先產生的 Gemini TTS 固定音檔；瀏覽器端不呼叫 API、不暴露金鑰。

## 開發

```bash
npm test
python3 -m http.server 4173
```

打開：<http://127.0.0.1:4173/>

## TTS 批次準備

產生 OpenRouter Gemini TTS batch JSONL：

```bash
npm run tts:batch -- --min=0 --max=99 --audio-style=northern-explicit
npm run tts:batch -- --min=1000 --max=9999 --audio-style=northern-compact
```

建議語音風格：

```text
Natural Northern Vietnamese pronunciation. Clear, friendly, medium-slow pace for a beginner language learner. Read the number exactly once.
```

預期靜態音檔位置：

- `audio/northern-explicit/<number>.wav`
- `audio/northern-compact/<number>.wav`

目前 OpenRouter 的 Gemini TTS 回覆 `pcm`，本地包成 WAV；若未來上游支援 mp3，manifest 也可改為指向 `.mp3`。

網頁會嘗試讀取 `audio/manifest.json`。只有 manifest 中有對應 `value` + `audioStyle` 的題目，才會顯示播放按鈕。
