# 越南語數字練習

北越為主的越南語數字練習 GitHub Pages 靜態頁。

## 目標

- 練習越南語數字 `0–9999`。
- 北越念法為主，南越作為補充註解與可接受別名。
- 支援閃卡、選擇題、輸入練習、聽力選擇。
- 輸入練習提供頁面內越南語鍵盤。
- 使用預先產生的 Gemini TTS 固定音檔；瀏覽器端不呼叫 API、不暴露金鑰。
- 最終音檔策略採 B 方案：北越口音為正式主線，片段式重用降低產生成本；程式保留未來南越語音接口。

## 開發

```bash
npm test
python3 -m http.server 4173
```

打開：<http://127.0.0.1:4173/>

## 目前狀態

- 最新本機內容：commit `015012b` 已產生北越 B 方案完整片段音檔，共 `1117` 個 WAV chunks，並更新 `audio/manifest.json`。
- Manifest 目前保留 `11` 筆 `0–10 / northern-explicit` 完整題目相容 entry，另含 `1117` 筆北越 chunk entries。
- 測試基準：`npm test`，目前 `66/66` 通過。
- 已完成本機瀏覽器 smoke test：頁面可渲染、完整 chunk manifest 載入、千位教材式完整／日常簡略播放會組出正確 chunk 序列，代表題 `6007` 會分別使用 `explicit-low-remainder` 與 `compact-low-digit` 補片段；console clean。
- GitHub Pages 已啟用：<https://suzune-maid.github.io/vietnamese-number-practice-page/>。本輪完整音檔目前只在本機 commit，尚未 push；需確認後才會上線。

## TTS 批次準備

最終採 **B 方案 / 北越口音**：

- `0–999`：保留完整自然片段，共 1000 個。
- `1000–9999`：由片段組合播放，包含 9 個千位前綴、99 個完整念法低位補片段、9 個簡略念法 `lẻ <digit>` 補片段。
- 北越正式片段數：`1000 + 9 + 99 + 9 = 1117`。
- manifest 可同時支援舊的完整題目 entry（`entries`）與 B 方案片段（`chunks`）；播放端會先找完整音檔，找不到時再組片段序列。
- 目前主線只產生北越口音；未來若要加南越口音，可新增 `southern-explicit` / `southern-compact` 的 chunk entries，不需改題庫核心。

產生 OpenRouter Gemini TTS batch JSONL：

```bash
npm run tts:batch -- --min=0 --max=99 --audio-style=northern-explicit
npm run tts:batch -- --min=1000 --max=9999 --audio-style=northern-compact

node scripts/prepare-tts-chunk-batches.js --accent=northern --output-dir=tmp/tts-batches/chunks/northern
node scripts/build-audio-manifest.js --accent=northern
```

建議語音風格：

```text
Natural Northern Vietnamese pronunciation. Clear, friendly, medium-slow pace for a beginner language learner. Read the number exactly once.
```

預期靜態音檔位置：

- 完整題目相容路徑：`audio/northern-explicit/<number>.wav`、`audio/northern-compact/<number>.wav`
- B 方案片段路徑：`audio/chunks/northern/under-1000/<number>.wav`
- B 方案片段路徑：`audio/chunks/northern/thousand-prefix/<digit>.wav`
- B 方案片段路徑：`audio/chunks/northern/explicit-low-remainder/<number>.wav`
- B 方案片段路徑：`audio/chunks/northern/compact-low-digit/<digit>.wav`
- 未來南越語音預留：`audio/chunks/southern/<kind>/<value>.wav`

目前 OpenRouter 的 Gemini TTS 回覆 `pcm`，本地包成 WAV；若未來上游支援 mp3，manifest 也可改為指向 `.mp3`。

網頁會嘗試讀取 `audio/manifest.json`。只有 manifest 中有對應 `value` + `audioStyle` 的完整題目音檔，或能組出完整 B 方案 `chunks` 序列的題目，才會顯示播放按鈕。

後續正式語音生成 runbook：[`docs/tts-generation-runbook.md`](docs/tts-generation-runbook.md)。
