# 致富魔法短線策略實驗室

這是一個投資情報與策略實驗室。第一階段支援 GitHub Pages 遠端觀看，並用 GitHub Actions 自動刷新行情與新聞資料。

## 本機使用

```powershell
npm install
npm run dev:daily
```

開啟：

```text
http://127.0.0.1:5173/
```

## 更新資料

```powershell
npm run refresh:data
```

資料會寫入：

```text
public/data/market-lab-latest.json
```

## 建置網站

```powershell
npm run build
```

## GitHub Pages 遠端模式

部署流程在：

```text
.github/workflows/deploy-pages.yml
```

它會在以下情況自動執行：

- 推送到 `main`
- 手動從 GitHub Actions 執行
- 台灣時間週一到週五 08:00
- 台灣時間週一到週五 06:30

更多設定說明見：

```text
docs/github-pages-phase1.md
```

## 第二階段雲端模式

第二階段加入登入、Supabase 資料庫、雲端快照與手動「立即更新」按鈕。設定文件見：

```text
docs/cloud-lab-phase2.md
```

網站在沒有 Supabase secrets 時會維持展示模式；設定完成後，左側 `雲端控制` 頁會啟用登入、同步、還原與立即更新。

## 隱私提醒

GitHub Pages 適合公開或非敏感的研究儀表板。真實持股、帳戶資訊、券商紀錄、API key、個人資產與私密交易日誌不要放進公開 Pages。
