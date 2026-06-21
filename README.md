# 致富魔法短線策略實驗室

這是一個投資情報、假設實驗、模擬交易與策略復盤的研究工具。

第一階段已支援 GitHub Pages 遠端觀看，並透過 GitHub Actions 自動刷新行情與新聞資料。

第二階段改用 Firebase：Firebase Auth 登入、Cloud Firestore 儲存個人實驗資料、Cloud Functions 處理「立即更新」。

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

## Firebase 雲端模式

Firebase 第二階段設定文件見：

```text
docs/cloud-lab-phase2.md
```

網站在沒有 Firebase secrets 時會維持展示模式；設定完成後，左側 `雲端控制` 頁會啟用登入、同步、還原與立即更新。

## 隱私提醒

GitHub Pages 適合公開或非敏感的研究儀表板。真實持股、帳戶資訊、券商紀錄、API key、個人資產與私密交易日誌不要放進公開 repo。
