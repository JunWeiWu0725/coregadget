/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        schoolAdminTheme: {
          "primary": "#5EC1C7",         // 主要色 (按鈕、標題圖標)
          "primary-content": "#FFFFFF", // 主要色文字
          "secondary": "#E5E7EB",       // 次要色 (次要按鈕)
          "secondary-content": "#1F2937", // 次要色文字
          "accent": "#5EC1C7",          // 強調色
          "accent-content": "#1F2937",  // 強調色文字
          "neutral": "#E5E7EB",         // 靜音背景
          "neutral-content": "#4B5563", // 靜音文字
          "base-100": "#F3F4F6",        // 頁面背景
          "base-200": "#FFFFFF",        // 卡片/表單區塊背景
          "base-300": "#E5E7EB",        // 次級背景
          "base-content": "#1F2937",    // 主要文字
          "info": "#6DCDD5",            // 資訊提示色 (基於 ring)
          "success": "#10B981",         // 成功提示色 (預設綠色，與配色表一致)
          "warning": "#FFF9C4",         // 警告提示色 (預設黃色)
          "error": "#F43F5E",           // 錯誤色
          "error-content": "#FAF9F9",   // 錯誤文字
          "border": "#D1D5DB",          // 邊框色
          "input": "#FFFFFF",           // 輸入框背景
          "ring": "#6DCDD5",            // 焦點環繞色
          "rounded-box": "0.5rem",      // 卡片圓角
          "rounded-btn": "0.25rem",     // 按鈕圓角
          "rounded-badge": "0.25rem",   // 徽章圓角
          "animation-btn": "0.2s",      // 按鈕動畫
          "animation-input": "0.2s",    // 輸入框動畫
          "btn-focus-scale": "0.95",    // 按鈕點擊縮放
          "border-btn": "1px",          // 按鈕邊框
        },
      },
    ],
  },
}