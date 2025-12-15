# TODO – SetCourseExamScoreWithExtension 儲存邏輯修正（Extension 清除與讀卡子成績）

⚠️ **修改完成後：請將本次修改結果、影響範圍、更新內容寫入  
《高中評量成績調整1118.md》**  
（由 Cursor 完成程式後，你再整理成最終紀錄）

---

## 🎯 目標

1. 修正「從缺／免改成一般分數」時，**舊 Extension 內的 Score / UseText / Text 沒有正確清除** 的問題。
2. 修正「有讀卡子成績 (`isSubScoreMode = true`) 且輸入一般分數」時，  
   可能發生 `data.Extension` 為 `undefined`，導致 `data.Extension.Extension[...]` 觸發 JS 錯誤的問題。
3. 一般分數狀態：
   - `Score` = 一般分數（例如 `52.5`）
   - **Extension 內 Element 結構要保留**，但要把這套功能使用到的三個欄位清空：
     - `Extension.Extension.Score = ''`
     - `Extension.Extension.UseText = ''`
     - `Extension.Extension.Text = ''`
   - 其他欄位（例如 `CScore`、`PScore`、其他 Extension 子節點）一律保留不動。
4. 特殊成績（缺考 / 免試等）：
   - `Score` = `map.use_value`（通常 `-1`、`-2`）
   - `Extension.Extension.Score / UseText / Text` 完全來自 `examExtensionMap`（由 `buildScoreAndExtension` 已處理）

---

## A. 修改目標位置

- 檔案：`gradebook.js`
- Function / 區塊：
  - `saveAll()` 中，呼叫服務 `_.SetCourseExamScoreWithExtension` 的組資料邏輯。
  - 請搜尋關鍵字：`SetCourseExamScoreWithExtension`，找到組 `data` 的那一段：

    ```javascript
    var be = buildScoreAndExtension(rawValue, $scope.examExtensionMap);

    if (be.error) {
        return;
    }

    var data = {
        '@StudentID': studentRec.StudentID,
        '@Score': (be.score == null ? '' : be.score)
    };

    if (be.extension) {
        data.Extension = {
            Extension: {
                Score: be.extension.Score,
                UseText: be.extension.UseText,
                Text: be.extension.Text
            }
        };
    }

    // 之後還有 examRec.isSubScoreMode 判斷並寫 CScore / PScore
    ```

---

## B. 調整 Extension 建立時機與內容

### B-1. 先統一建立 data.Extension 殼（必要時）

**問題點：**  
當 `be.extension == null`（一般分數）、但 `examRec.isSubScoreMode == true` 時，  
原本程式會執行：

```javascript
if (examRec.isSubScoreMode) {
    data.Extension.Extension['CScore'] = ...
    data.Extension.Extension['PScore'] = ...
}
```

但此時 `data.Extension` 根本不存在，會噴錯。

同時，我們現在的規格是：  
> 即使從「缺／免」改成一般分數，`<Extension>` 節點與其內其他子節點（例如 `CScore`、`PScore`）仍然要保留，只清空 `Score / UseText / Text`。

**修正方向：**

1. 在 `var data = { ... }` 之後，新增一段邏輯，用來決定是否要建立 Extension 殼：

   - 以下任一條件成立就建立 `data.Extension = { Extension: {} }`：
     - `be.extension` 有值（代表特殊成績，需要寫入 Score / UseText / Text）
     - `examRec.isSubScoreMode == true`（有讀卡子成績，要放 CScore / PScore）
     - 有文字評量欄位要寫入（例如 `studentRec['Exam' + examRec.ExamID + '_文字評量']` 不為空）
     - 之後在 B-3 要「清除舊 Extension 三欄位」時

2. 範例結構（請 Cursor 依實際變數名稱套用）：

   ```javascript
   var data = {
       '@StudentID': studentRec.StudentID,
       '@Score': (be.score == null ? '' : be.score)
   };

   var needExtensionShell = false;

   if (be.extension) {
       needExtensionShell = true;
   }

   var hasText = studentRec['Exam' + examRec.ExamID + '_文字評量'];
   if (hasText) {
       needExtensionShell = true;
   }

   if (examRec.isSubScoreMode) {
       needExtensionShell = true;
   }

   // 若要明確清除舊 Extension 三欄位（一般分數時），會在 B-3 再設 needExtensionShell = true;

   if (needExtensionShell) {
       data.Extension = { Extension: {} };
   }
   ```

---

### B-2. 寫入「特殊成績」的 Extension 內容

若 `be.extension` 有值（代表 `buildScoreAndExtension` 判斷為缺 / 免等特殊成績），  
在前一步中一定已經建立了 `data.Extension = { Extension: {} }`。

請改成：

```javascript
if (be.extension && data.Extension) {
    data.Extension.Extension.Score = be.extension.Score;
    data.Extension.Extension.UseText = be.extension.UseText;
    data.Extension.Extension.Text = be.extension.Text;
}
```

> 注意：  
> - `Score / UseText / Text` 一律來自 `be.extension`，不要再用 `rawValue`。  
> - 這樣可以保證 Extension 的內容與 `examExtensionMap` 一致。

---

### B-3. 一般分數時「保留 Extension 結構，但清空三欄位」的策略

**需求重點：**

> 從「缺／免」改成一般分數時，在 Extension 內 Element 結構都要保留，  
> 只清空這功能使用的 `Score / UseText / Text` 三個欄位。  
> 其他欄位（例如 CScore / PScore / 其他自訂節點）不得刪除。

**實作建議：**

1. 判斷為「一般分數」的條件：

   ```javascript
   var isNormalScore = (be.extension == null) && (be.score != null);
   ```

2. 若是一般分數，需要同時：
   - 保留 Extension 結構（所以 `needExtensionShell = true`）
   - 清空三個欄位

   在 B-1 的邏輯中加上：

   ```javascript
   if (isNormalScore) {
       needExtensionShell = true;
   }
   ```

3. 在寫入 Extension 的最後，加上「只清空三欄位」的邏輯：

   ```javascript
   if (isNormalScore && data.Extension) {
       // 只清空這次功能使用的三個欄位，其餘欄位保留
       data.Extension.Extension.Score = '';
       data.Extension.Extension.UseText = '';
       data.Extension.Extension.Text = '';
   }
   ```

> 如此一來：  
> - 從「缺 / 免」改成一般分數時，前端會送出一個 Extension，  
>   其內的三個欄位為空，其他欄位（例如 CScore / PScore）保持原狀。  
> - 後端若採覆蓋寫入方式，舊的 `<Score>~-1~</Score>` / `<UseText>缺</UseText>` / `<Text>缺考</Text>` 會被清空，  
>   但讀卡之類的其他 Extension 資料仍被保留。

---

### B-4. 讀卡子成績 (`isSubScoreMode`) CScore / PScore 寫入

請將原來：

```javascript
if (examRec.isSubScoreMode) {
    data.Extension.Extension['CScore'] = studentRec['Exam' + examRec.ExamID + 'CScore'];
    data.Extension.Extension['PScore'] = studentRec['Exam' + examRec.ExamID + 'PScore'];
}
```

改成：

```javascript
if (examRec.isSubScoreMode && data.Extension) {
    var cScore = studentRec['Exam' + examRec.ExamID + 'CScore'] || '';
    var pScore = studentRec['Exam' + examRec.ExamID + 'PScore'] || '';

    data.Extension.Extension.CScore = cScore;
    data.Extension.Extension.PScore = pScore;
}
```

> 前提是 B-1 已經保證：`examRec.isSubScoreMode == true` 時，`data.Extension` 一定會被建立。  
> 此處只是防止空值造成 undefined，維持欄位結構完整。

---

## C. 測試情境（修改後請人工驗證）

### 測試 1：一般分數（無缺／免歷史）

1. 成績輸入：`52.5`
2. 預期寫入：
   - `Score = 52.5`
   - 若本來無 Extension 資料，後端可不產生 `<Extension>`，或產生 Extension 節點但三欄位為空。
3. 重新讀取畫面：
   - 顯示成績為 `52.5`
   - 不應再顯示 `缺` / `免試` 等特殊文字。

---

### 測試 2：先「缺」，後改「52.5」

1. 第一次：老師輸入「缺」
   - 產生特殊成績 Extension：
     - `Score = -1`
     - `UseText = '缺'`
     - `Text = map.report_value`（例如「缺考」）
     - 若有子成績，Extension 內還可能有 `CScore`、`PScore`
2. 第二次：老師把同一格改為 `52.5`
   - 送出的一筆資料：
     - `Score = 52.5`
     - `Extension.Extension.Score = ''`
     - `Extension.Extension.UseText = ''`
     - `Extension.Extension.Text = ''`
     - 其他欄位（如 `CScore`、`PScore`）仍保留原本值（若有）
3. 重新讀取畫面：
   - 顯示 `52.5`
   - 不再顯示「缺」或其他特殊文字。
   - 平均成績計算使用 52.5。

---

### 測試 3：讀卡子成績 + 一般分數

1. 設定某個評量 `isSubScoreMode = true`，且該學生有 `CScore/PScore`。
2. 老師在主成績輸入：`80`
3. 預期寫入：
   - `Score = 80`
   - `Extension.Extension` 內至少包含：
     - `CScore`、`PScore` 欄位
     - 若無特殊成績，`Score/UseText/Text` 依 B-3 策略為空字串
4. 確認前端 `saveAll()` 不會因為 `data.Extension` 為 undefined 掛掉。

---

### 測試 4：免試（use_value = -2）

1. 對照表：`use_text = '免'`, `use_value = -2`, `score_type = '免試'`
2. 老師輸入：`免`
3. 預期：
   - `Score = -2`
   - `Extension.Extension.Score = -2`
   - `UseText = '免'`
   - `Text = 對照表報表值`
4. 平均計算邏輯應排除這筆（現有 avg 計算程式不需改，只要資料一致即可）。

---

## D. 修改完成後文件紀錄

### 請在《高中評量成績調整1118.md》補上：

1. **修改目的**
   - 處理從缺 / 免改為一般分數時 Extension 三欄位錯亂或殘留問題。
   - 處理讀卡子成績 `isSubScoreMode` 在一般分數下造成 `data.Extension` 為 undefined 的錯誤。

2. **修改檔案與主要區塊**
   - `gradebook.js`
   - `saveAll()` → 組 `SetCourseExamScoreWithExtension` 的區段
   - 新增判斷與 `data.Extension` 建立邏輯

3. **行為變更摘要**
   - 特殊成績：仍使用 `buildScoreAndExtension` 決定 Score / Extension。
   - 一般分數：保留 Extension Element 結構，只清空 Score / UseText / Text 三欄位。
   - 讀卡子成績：一律有 Extension 殼，避免 runtime error，同時保留 CScore / PScore 與其他節點。

4. **測試結果**
   - 對照上面四種測試情境，列出實際測試狀態與結果。
