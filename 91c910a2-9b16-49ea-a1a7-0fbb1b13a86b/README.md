# 學校基本資料管理表單

## 專案說明
這是一個使用 React + DaisyUI 開發的學校基本資料管理表單，用於設定學校的基本資訊。表單支援資料驗證，並與 ischool gadget 系統整合。

## 快速開始
1. 下載專案資料夾
2. 雙擊 `index.html` 開啟表單
3. 填寫學校基本資料
4. 點擊「儲存」按鈕提交資料

## 系統需求
- 現代化瀏覽器（Chrome、Firefox、Safari、Edge 最新版本）
- 需要「超級管理員」身份才能使用

## 專案結構
```
school-info/
├── description.xml         # ischool gadget 設定檔
├── index.html              # 主頁面
├── src/
│   ├── main.tsx           # 應用程式入口點
│   ├── App.tsx            # 根組件（包含表單邏輯）
│   ├── types.ts           # 型別定義
│   ├── validation.ts      # 表單驗證邏輯
│   └── index.css          # 樣式檔案
├── public/                # 靜態資源
│   └── js/
│       └── gadget.js      # ischool gadget
└── README.md              # 專案說明文件
```

## 功能特點
- 完整的表單驗證
- 即時錯誤提示
- 響應式設計
- 離線使用支援
- 與 ischool gadget 系統整合

## 注意事項
- 確保 ischool gadget 系統正確載入
- 表單提交前請確認資料正確性
- 所有必填欄位都必須填寫
- 學年度必須為數字
- 學期必須為 1 或 2

## 維護說明
- 定期檢查 ischool gadget 系統更新
- 確保所有第三方函式庫為最新版本
- 保持錯誤訊息的準確性

## 版本歷史
- v1.0.0：初始版本
  - 基本表單功能
  - 資料驗證
  - ischool gadget 整合