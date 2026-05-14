# 越南語數字練習 Page 專案規劃

本檔是 repo 內簡版規劃索引。完整規劃來源在 Hermes workspace：

- `.hermes/plans/2026-05-13_193150-vietnamese-number-practice-page.md`
- `.hermes/plans/2026-05-13_200211-vietnamese-number-practice-development-phases.md`

## 已定方向

- 北越為主，南越作為補充註解。
- 千位練習包含教材式完整念法與日常簡略念法。
- Gemini TTS 固定音檔大量產生；成本優先，最終採 B 方案北越片段式音檔（1117 clips）。
- 程式保留未來南越語音接口，但目前不產生南越音檔。
- 頁面提供越南語輸入鍵盤。
- 手機／電話號碼練習延後到第二階段。

## 目前進度

- Phase 0–3：MVP 題庫、越南語鍵盤、練習 UI 已完成並通過 Codex pre-commit review；commit `0c30bc3`。
- Phase 4–6：已加入靜態音訊 manifest 契約、OpenRouter Gemini TTS batch JSONL 產生器，以及頁面播放按鈕接線；commit `576aa48`。
- 2026-05-13：已取得同意並產生 `0–10 / northern-explicit` WAV smoke pack，manifest 已指向 11 筆 validated audio assets；commit `12f3097`。
- 2026-05-13：修正練習動作區距離；commit `af9061b`。
- Phase 6.5：已決定最終音訊方案為 B 方案 + 北越口音；程式支援 `entries` 完整音檔與 `chunks` 片段序列，並預留 `southern-*` accent 接口；commit `e1c0099`。
- Phase 6.5 驗證狀態：`npm test` 目前 `59/59` 通過；本機瀏覽器 smoke test 已驗證頁面渲染、播放按鈕短文案、模式命名與排序、聽聲音選阿拉伯數字、feedback 間距、兩種選擇模式點選選項播放該選項語音、頁面鍵盤不主動 focus 輸入框；Codex pre-commit review PASS。
- Phase 7：已依明確同意執行北越 B 方案真實 TTS，產生 `1117` 個 WAV chunks；`audio/manifest.json` 已更新為 `11` 筆完整題目 entry + `1117` 筆 chunk entry。新增 chunk batch generator、manifest builder、生成 runbook 與驗證測試；commit `015012b`。
- Phase 7 驗證狀態：`npm test` 目前 `66/66` 通過；完整 WAV 檢查 `1117/1117` 通過，manifest 引用、sha256、路徑安全檢查皆通過；本機瀏覽器 smoke test 已驗證千位教材式完整／日常簡略 chunk 序列與 `6007` 低位補片段路由；Codex pre-commit review PASS。
- Phase 7 發布狀態：本機 `main` 目前領先遠端，完整音檔包尚未 push 到 GitHub Pages，等待明確同意後再上線。
- 2026-05-13：已建立 GitHub repo、push `main`，並啟用 GitHub Pages；live URL：<https://suzune-maid.github.io/vietnamese-number-practice-page/>。
- Pages live 驗證狀態：`index.html`、`src/app.js`、`audio/manifest.json`、代表性 WAV asset 皆回傳 HTTP 200；browser smoke test 已確認頁面標題、marker、既有 TTS 播放路徑與 console clean。

## TTS manifest 契約

網頁讀取：`audio/manifest.json`。

Manifest 同時支援兩種音訊來源：

1. `entries`：相容舊版的完整題目音檔，以 `value` + `audioStyle` 直接對應題目。
2. `chunks`：B 方案片段音檔。播放端會依題目建立序列，確認每個 chunk 都存在且路徑安全後，按順序播放。

完整題目 entry 範例：

```json
{
  "id": "northern-explicit-105",
  "value": 105,
  "audioStyle": "northern-explicit",
  "dialect": "Northern Vietnamese",
  "text": "một trăm lẻ năm",
  "file": "audio/northern-explicit/105.wav",
  "format": "wav"
}
```

片段 chunk 範例：

```json
{
  "id": "northern-thousand-prefix-2",
  "accent": "northern",
  "kind": "thousand-prefix",
  "value": 2,
  "dialect": "Northern Vietnamese",
  "text": "hai nghìn",
  "file": "audio/chunks/northern/thousand-prefix/2.wav",
  "format": "wav"
}
```

B 方案北越片段種類：

- `under-1000`：`0–999` 完整自然片段。
- `thousand-prefix`：`1–9` 千位前綴，例如 `hai nghìn`。
- `explicit-low-remainder`：完整念法用 `1–99` 低位補片段，例如 `không trăm hai mươi sáu`。
- `compact-low-digit`：簡略念法用 `1–9` 個位補片段，例如 `lẻ năm`。

支援的 `audioStyle`：

- `northern-explicit`：北越教材式完整念法，正式主線。
- `northern-compact`：北越日常簡略念法，正式主線。
- `southern-explicit`：未來南越教材式完整念法接口，暫不產生。
- `southern-compact`：未來南越日常簡略念法接口，暫不產生。
