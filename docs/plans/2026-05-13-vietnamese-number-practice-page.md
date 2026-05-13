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

- Phase 0–3：MVP 題庫、越南語鍵盤、練習 UI 已完成並通過 Codex pre-commit review。
- Phase 4–6：已加入靜態音訊 manifest 契約、OpenRouter Gemini TTS batch JSONL 產生器，以及頁面播放按鈕接線。
- Phase 6.5：已決定最終音訊方案為 B 方案 + 北越口音；程式支援 `entries` 完整音檔與 `chunks` 片段序列，並預留 `southern-*` accent 接口。
- 大批次真實 TTS 尚未執行：API 呼叫會離開本機且可能消耗額度，需取得明確同意後再擴大範圍；正式擴產前需先補 B 方案 chunk 專用 batch 產生器。
- 2026-05-13：已取得同意並產生 `0–10 / northern-explicit` WAV smoke pack，manifest 已指向 11 筆 validated audio assets。

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
