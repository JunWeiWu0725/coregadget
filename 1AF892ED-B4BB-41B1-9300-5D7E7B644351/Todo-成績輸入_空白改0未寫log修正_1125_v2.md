# Todo-成績輸入_空白改0未寫log修正_1125_v2.md

## 目標

- 修正「成績空白 → 輸入 0 分 → 儲存」**沒有被 log** 的問題。
- 同時確保：
  - 0 分會被正確當成合法分數寫入後端。
  - 「空白 → 0」、「0 → 其他分數」、「其他分數 → 0」都會被 `1campus.log.teacher` 記錄。
- 修改完成後，請在 **高中評量成績調整1125.md** 中記錄本次修正內容與測試結果。

---

## 相關程式位置（gradebook.js）

1. **成績備份（建立 Origin）**
   - `dataBackUp = function () { ... }`
   - 功能：將目前畫面上各欄位值複製到 `XXXOrigin` 欄位，例如：  
     - `Exam5` → `Exam5Origin`

2. **儲存評量成績（會寫入 DB + 觸發 log）**
   - `SetCourseExamScoreWithExtension = function () { ... }`
   - 重要比較條件（決定是否產生 log）：  
     ```js
     if (studentRec['Exam' + examRec.ExamID] != studentRec['Exam' + examRec.ExamID + 'Origin']) {
         isChange = true;
         // 組 log 明細
     }
     ```

3. **成績值與 Extension 的解析**
   - `function buildScoreAndExtension(rawValue, examExtensionMap) { ... }`
   - 功能：將輸入值（含數字、缺考/免試等）轉換成：
     - `result.score`：實際要寫入的分數數值（或 null）
     - `result.extension`：缺考/免試等 Extension 結構
     - `result.error`：錯誤訊息

---

## 問題說明（為何「空白 → 0」沒有 log）

1. 原本從後端讀入時，空白成績會變成：  
   - `studentRec['ExamX'] = ''`
2. `dataBackUp()` 執行後：  
   - `ExamX = ''`
   - `ExamXOrigin = ''`
3. 老師輸入 0 分，經過畫面處理與驗證，如果有任何一段程式把 0 誤判為「無效／空白」（例如：`(rawValue || '')`、不當的判斷），就會導致：  
   - 最後 `studentRec['ExamX']` 仍然是 `''`（或沒有更新）。
4. 進入 `SetCourseExamScoreWithExtension()` 比對時：  
   ```js
   if (studentRec['Exam' + examRec.ExamID] != studentRec['Exam' + examRec.ExamID + 'Origin'])
   ```
   - 兩者都等於 `''` → 視為「沒有變更」 → `isChange` 保持 `false` → **不產生 log**。

5. 同時，在 `buildScoreAndExtension()` 中，舊寫法會「吃掉 0」：  
   ```js
   function buildScoreAndExtension(rawValue, examExtensionMap) {
       var val = (rawValue || '').toString().trim();
       ...
       if (val === '') {
           result.score = null;
           result.extension = null;
           return result;
       }
   }
   ```
   - 若 `rawValue` 是 **數字 0**，`(rawValue || '')` 會變成 `''`。
   - 導致 `score = null`，送到後端時 `@Score = ''`，資料庫也變成空白。

> 綜合結果：  
> - 畫面輸入 0 分，但內部處理時 0 被視為「空白」。  
> - 比對時「新值 == Origin（空白）」→ 不記 log。  
> - 寫入後 DB 仍是空白 → 使用者感覺「0 分消失，且沒有 log」。

---

## Todo 1：修正 buildScoreAndExtension，不再吃掉 0 分

### 1-1. 找到函式

在 `gradebook.js` 中搜尋：

```js
function buildScoreAndExtension(rawValue, examExtensionMap)
```

原始開頭大致如下：

```js
function buildScoreAndExtension(rawValue, examExtensionMap) {
    var val = (rawValue || '').toString().trim();

    var result = {
        score: null,
        extension: null,
        error: null
    };

    if (val === '') {
        result.score = null;
        result.extension = null;
        return result;
    }

    // 後續處理 examExtensionMap 與數字轉換的程式 ...
}
```

### 1-2. 修改為「只把 null / undefined 視為空白」

👉 將 `var val = ...` 改成：

```js
function buildScoreAndExtension(rawValue, examExtensionMap) {
    // ❌ 舊寫法：0 會被當成空值
    // var val = (rawValue || '').toString().trim();

    // ✅ 新寫法：只在 null / undefined 時當成空白，其餘一律轉成字串
    var val = (rawValue === null || rawValue === undefined)
        ? ''
        : rawValue.toString().trim();

    var result = {
        score: null,
        extension: null,
        error: null
    };

    if (val === '') {
        result.score = null;
        result.extension = null;
        return result;
    }

    // 後續處理 examExtensionMap 與數字轉換的程式維持原樣
}
```

> 修正後：  
> - `rawValue = 0` → `val = "0"` → 不會被當成空白。  
> - `rawValue = "0"` → `val = "0"`。  
> - `rawValue = null / undefined` → `val = ''` → 照舊視為「沒有輸入」。

---

## Todo 2：確認一般分數（包含 0 分）的 Extension 仍正確處理

> 這部分主要是「檢查」，順便幫自己在程式裡補註解。

在 `SetCourseExamScoreWithExtension = function () { ... }` 中，找到處理 Extension 的區塊（關鍵變數：`isNormalScore`）：

```js
var data = {
    '@StudentID': studentRec.StudentID,
    '@Score': (be.score == null ? '' : be.score)
};

// B-1: 判斷是否需要建立 Extension 殼
var needExtensionShell = false;

// 特殊成績需要 Extension
if (be.extension) {
    needExtensionShell = true;
}

// 檢查是否有文字評量欄位
var hasText = studentRec['Exam' + examRec.ExamID + '_文字評量'];
if (hasText) {
    needExtensionShell = true;
}

// 讀卡子成績需要 Extension
if (examRec.isSubScoreMode) {
    needExtensionShell = true;
}

// 一般分數時，需要保留 Extension 結構以便清空三欄位
var isNormalScore = (be.extension == null) && (be.score != null);
if (isNormalScore) {
    needExtensionShell = true;
}

// 建立 Extension 殼
if (needExtensionShell) {
    data.Extension = { Extension: {} };
}

// B-2: 寫入特殊成績的 Extension 內容
if (be.extension && data.Extension) {
    data.Extension.Extension.Score = be.extension.Score;
    data.Extension.Extension.UseText = be.extension.UseText;
    data.Extension.Extension.Text = be.extension.Text;
}

// B-3: 一般分數時，保留 Extension 結構但清空三欄位
if (isNormalScore && data.Extension) {
    // 只清空這次功能使用的三個欄位，其餘欄位保留
    data.Extension.Extension.Score = '';
    data.Extension.Extension.UseText = '';
    data.Extension.Extension.Text = '';
}
```

### 2-1. 檢查重點

- 在 Todo 1 修正後：
  - `be.score` 應為：
    - 空白 → `null`
    - 0 分 → `0`
    - 非 0 分（例如 50）→ 對應的數字
- `isNormalScore = (be.extension == null) && (be.score != null)`：
  - 0 分也會被視為「一般分數」。

若要更清楚，可補上一段註解：

```js
// 一般數字成績（包含 0 分）會走 isNormalScore：由 score 寫入 @Score，Extension 只保留殼並清空三欄位
var isNormalScore = (be.extension == null) && (be.score != null);
```

> 不需要修改此區塊，只要確認修正後 0 分會走一般數字流程即可。

---

## Todo 3：確認 log 比對邏輯能捕捉「空白 → 0」

在 `SetCourseExamScoreWithExtension` 中，找到設定 `isChange` 的地方：

```js
if (studentRec['Exam' + examRec.ExamID] != studentRec['Exam' + examRec.ExamID + 'Origin']) {
    isChange = true;
    // 組 logManangers & descriptSection
}
```

### 3-1. 檢查情境

- 修正後的預期：
  - 原始：`ExamX = ''`、`ExamXOrigin = ''`。
  - 老師輸入 0 分後：
    - `ExamX = 0` 或 `'0'`（視 Angular 綁定為 Number 或 String）。
  - 比對時：`'' != 0` 或 `'' != '0'` → `isChange = true` → 會記 log。

> 若要更保險，可以在比較前把兩邊先轉成字串再比對：

```js
var newVal = (studentRec['Exam' + examRec.ExamID] == null ? '' : studentRec['Exam' + examRec.ExamID].toString());
var oldVal = (studentRec['Exam' + examRec.ExamID + 'Origin'] == null ? '' : studentRec['Exam' + examRec.ExamID + 'Origin'].toString());

if (newVal != oldVal) {
    isChange = true;
    // ...
}
```

> 是否要改成這樣由你決定，如果目前型別一直是字串，可以先不改，只要確認 0 分不再被吃掉即可。

---

## Todo 4：測試情境（一定要跑一輪）

### 4-1. 手動輸入測試

1. 選一門測試課程 → 某一評量（例：期中考）。
2. 找一位目前成績為「空白」的學生。  
3. 依序執行：
   - **步驟 A：空白 → 0**
     1. 在該欄位輸入 `0`。
     2. 按 Enter / 儲存。
     3. 重整 gadget 或重新進入該課程。
     4. 預期：
        - 畫面成績顯示為 0。
        - `1campus.log.teacher` 中有一筆記錄：空白 → 0。
   - **步驟 B：0 → 50**
     1. 將成績改為 `50`，儲存。
     2. 預期：log 中有 `0 → 50`。
   - **步驟 C：50 → 空白**
     1. 清空成績，儲存。
     2. 預期：log 中有 `50 → `（變成空白）。

### 4-2. 匯入測試（確認 Number 0 不會被吃掉）

1. 準備一份匯入檔（僅少數學生即可）：

   ```text
   0
   0
   50
   -
   ```

2. 透過「匯入成績」功能套用到同一個評量。
3. 儲存後重整，預期：
   - 前兩位學生：0 分。
   - 第三位：50 分。
   - 第四位：空白。
   - `1campus.log.teacher` 中有空白→0、空白→50 等 log。

### 4-3. 特殊成績（缺、免試等）回歸測試

1. 測試幾種切換：
   - 空白 → 缺考
   - 缺考 → 0
   - 0 → 缺考
2. 確認：
   - Extension 的 Score / UseText / Text 按 examExtensionMap 設定填入。
   - log 能正確記錄變化。

---

## Todo 5：在「高中評量成績調整1125.md」中紀錄本次調整

請在你的調整紀錄檔 **高中評量成績調整1125.md** 中新增一段，例如：

```md
### 成績輸入：空白改 0 分未寫 log 修正（2025-11-25）

- 修改檔案：`gradebook.js`
- 修改內容：
  1. 修正 `buildScoreAndExtension(rawValue, examExtensionMap)` 的輸入處理，避免使用 `(rawValue || '')` 導致 0 被當成空白。
  2. 確認一般數字成績（包含 0 分）會寫入 `@Score`，Extension 只保留殼並清空 Score/UseText/Text。
  3. 保留原本缺考/免試等特殊 Extension 行為。
  4. 確認 log 比對邏輯能正確捕捉「空白 → 0」、「0 → 其他分數」等變化。
- 測試情境：
  - 空白 → 0 → 50 → 空白。
  - 匯入 0 / 50 / -。
  - 缺考/免試與一般分數互相切換。
- 測試結果：
  - 0 分不再消失。
  - 「空白 → 0」及相關變化皆會寫入 1campus.log.teacher。
```

---

## Step 4：自我檢查（勾選）

- [ ] 手動輸入空白 → 0，儲存後仍顯示 0，且 log 有紀錄。  
- [ ] 手動輸入 0 → 其他分數，log 有紀錄。  
- [ ] 匯入包含 0 的成績，0 不會被吃掉且會寫 log。  
- [ ] 缺考/免試等特殊成績行為與原本一致。  
- [ ] 已在 **高中評量成績調整1125.md** 中詳細記錄此次修正與測試結果。  
