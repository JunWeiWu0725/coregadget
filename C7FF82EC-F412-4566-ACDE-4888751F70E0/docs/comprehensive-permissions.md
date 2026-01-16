# 綜合紀錄表（Comprehensive）權限整理

## 主要檔案位置
- 權限判斷：`src/app/role.service.ts`
- 導覽列顯示：`src/app/app.component.html`
- 綜合紀錄表主頁：`src/app/comprehensive/comprehensive.component.ts`
- 路由：`src/app/app-routing.module.ts`（路由 `/comprehensive`）

## 權限旗標
- 變數：`_enableComprehensive`
- 預設允許角色字串（僅供標示）：`"管理者 輔導老師"`

## 實際啟用邏輯（`role.service.ts` > `reload()`）
1) 初始化時 `_enableComprehensive.permitted = false`
2) 若登入者角色包含 **「管理者」** → 設為 **true**
3) 若角色包含 **「輔導老師」** 的邏輯目前被註解掉（`// this._enableComprehensive.permitted = true;`），因此目前只有「管理者」會被啟用。

## 導覽列顯示條件
- `app.component.html` 中的綜合紀錄表 tab 需要 `roleService.enableComprehensive === true` 才會啟用/可點擊。

## 結論（現況）
- **能看到/進入綜合紀錄表的角色**：僅「管理者」。
- 「輔導老師」目前不會啟用，因為對應的程式碼被註解。

## 如需調整
- 取消註解或新增判斷，讓「輔導老師」也設為 `_enableComprehensive.permitted = true`。

