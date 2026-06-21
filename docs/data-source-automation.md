# 自動資料來源與情報實驗流程

## 目前版本

本專案現在有兩種資料進入方式：

1. 自動刷新：`npm run refresh:data`
2. 手動情報：在「情報來源」頁貼上新聞、影片摘要、法說筆記或我的分析結果。

自動刷新會輸出：

```text
public/data/market-lab-latest.json
```

前端啟動時會優先讀取這個檔案。讀不到時才使用 seed 示範資料。

## 自動刷新來源

- TWSE OpenAPI：台股上市日成交資訊。
- Yahoo Finance chart endpoint：追蹤美股、ETF、ADR 與部分台股 chart 資料。
- SEC RSS：官方 SEC 新聞 RSS。
- Google News RSS：主題新聞搜尋 RSS。

## 如何更新自動挖掘新聞

盤前或你想重新整理新聞時執行：

```powershell
npm run refresh:data
```

如果開發服務已經在跑，執行完後重新整理瀏覽器即可。若要刷新資料後直接開發：

```powershell
npm run dev:daily
```

前端讀取的是：

```text
public/data/market-lab-latest.json
```

這個檔案會包含行情、候選清單、RSS 新聞、來源狀態與每則新聞的原始 RSS 摘要。

## 如何挖掘新聞

目前流程：

1. 對預設主題建立 RSS 查詢。
2. 抓取 SEC 官方 RSS 與 Google News RSS。
3. 解析每則 RSS item 的標題、摘要、連結、發布時間與查詢來源。
4. 用追蹤清單的股票代號、公司名稱、題材關鍵字做比對。
5. 用題材、情緒字、相關標的數量計算新聞相關度。
6. 將相關新聞映射到候選清單與假設草稿。

目前主題查詢：

- AI semiconductor NVIDIA TSMC data center
- 台股 AI 伺服器 半導體
- AI data center power grid
- 台股 高股息 ETF 配息
- SEC official announcements

限制：

- RSS 摘要不是完整付費內文。
- Google News 連結常是新聞聚合頁或跳轉頁。
- 真正完整新聞內文需要正式新聞 API、授權資料源、或由使用者貼上全文/影片逐字稿。

## 候選清單產生邏輯

候選分數由下列因素組成：

```text
setupScore = 基礎分 + 價格動能 + 量能加分 + 新聞來源加分 + 週期加分
```

候選清單不是買進建議，而是「值得建立假設觀察」的標的。

## 情報轉假設

手動或影片資訊會轉成：

- 來源類型
- 來源可信度
- 題材
- 可能影響標的
- 短線/波段/長線週期
- 假設論點
- 進場條件
- 出場條件
- 失敗撤退條件

## 來源可靠性迭代

未來每個來源都要回測：

```text
來源可靠性 = 來源轉成假設後的命中率、期望值、平均反應時間、錯誤訊號率
```

這會讓系統不只找股票，也找出哪些資訊來源真的有參考價值。
