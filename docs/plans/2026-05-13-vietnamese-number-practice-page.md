# 越南語數字練習 Page 專案規劃

本檔是 repo 內簡版規劃索引。完整規劃來源在 Hermes workspace：

- `.hermes/plans/2026-05-13_193150-vietnamese-number-practice-page.md`
- `.hermes/plans/2026-05-13_200211-vietnamese-number-practice-development-phases.md`

## 已定方向

- 北越為主，南越作為補充註解。
- 千位練習包含教材式完整念法與日常簡略念法。
- Gemini TTS 固定音檔大量產生；成本優先。
- 頁面提供越南語輸入鍵盤。
- 手機／電話號碼練習延後到第二階段。

## 目前進度

- Phase 0–3：MVP 題庫、越南語鍵盤、練習 UI 已完成並通過 Codex pre-commit review。
- Phase 4–6：已加入靜態音訊 manifest 契約、OpenRouter Gemini TTS batch JSONL 產生器，以及頁面播放按鈕接線。
- 真實 TTS 批次產生尚未執行：API 呼叫會離開本機且可能消耗額度，需取得明確同意後再跑。

## TTS manifest 契約

網頁讀取：`audio/manifest.json`。

每筆音檔 entry 以 `value` + `audioStyle` 對應題目：

```json
{
  "id": "northern-explicit-105",
  "value": 105,
  "audioStyle": "northern-explicit",
  "dialect": "Northern Vietnamese",
  "text": "một trăm lẻ năm",
  "file": "audio/northern-explicit/105.mp3",
  "format": "mp3"
}
```

支援的 `audioStyle`：

- `northern-explicit`：教材式完整念法。
- `northern-compact`：日常簡略念法。
