# Todo-成績輸入_0分消失與缺考Extension修正_1125.md

## 目標

- 修正成績輸入程式，解決「輸入 0 分儲存後就消失」的問題。
- 確保以下輸入情境都正確運作：
  - 空白 → 0 分
  - 0 分 → 其他分數（例如 50）
  - 其他分數 → 0 分
  - 空白 / 數字 ↔ 缺考 / 免試等特殊成績（由 examExtensionMap 定義）
- 維持既有缺考/免試/0分等特殊成績的 Extension 結構與行為不變。
- 完成後在 **高中評量成績調整1125.md** 記錄本次修改內容與測試結果。

---

## 環境與檔案說明

- 專案：成績輸入 gadget（1campus.h.gradebook.teacher）
- 主要檔案：`gradebook.js`
- 重要物件與函式：
  - `$scope.connection2 = gadget.getContract("1campus.log.teacher")`（寫 log）
  - `buildScoreAndExtension(rawValue, examExtensionMap)`（處理數字 / 缺考 / 免試等）
  - `SetCourseExamScoreWithExtension()`（儲存定期評量成績）
  - `SetCourseSemesterScore()`（儲存學期成績）
  - `$scope.saveGradeItemScore()`（儲存平時評量）

---

## 問題說明（現象與原因）

### 現象

- 老師在畫面輸入 **0 分**，按儲存後：
  - 畫面重新載入成績，該欄位變成「空白」。
  - 後端成績看不到 0 分，彷彿 0 分被吃掉。

### 主要原因（程式邏輯）

在 `gradebook.js` 中的 `buildScoreAndExtension()`：

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

    // ...
}
```

- 使用 `(rawValue || '')`：
  - 當 `rawValue` 是 **數字 0** 時（特別是匯入或內部運算後），`(0 || '')` 會變成 `''`。
  - 接著 `val === ''`，被當成「沒有輸入」，函式直接回傳 `score = null`。
- 在 `SetCourseExamScoreWithExtension()` 中，又有：

```js
var data = {
    '@StudentID': studentRec.StudentID,
    '@Score': (be.score == null ? '' : be.score)
};
```

- 因為 `be.score == null`，最後送出的是 `@Score = ''`（空字串）。
- 後端收到的是「空白」，不是 0 分 → 下次載入就變成沒有成績。

> ✅ 解法核心：**不要再用 `(rawValue || '')` 吃掉 0**，改成只把 `null / undefined` 視為空白，其餘值都保留。

---

## Todo 1：修正 buildScoreAndExtension 的 0 分處理

### 1-1. 找到並修改函式開頭

1. 在 `gradebook.js` 中搜尋：`function buildScoreAndExtension(rawValue, examExtensionMap)`。
2. 將函式開頭改成以下寫法（避免把 0 當空白）：

```js
function buildScoreAndExtension(rawValue, examExtensionMap) {
    // ❌ 舊寫法：0 會被當成空值
    // var val = (rawValue || '').toString().trim();

    // ✅ 新寫法：只在 null / undefined 時視為空白，其餘都轉成字串
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

    // 後面比對 examExtensionMap、Number(val) 的邏輯維持原樣
}
```

### 1-2. 確認數值與特殊成績邏輯仍正常

不要修改以下邏輯，只確認行為是否 ok：

- 先從 `examExtensionMap` 尋找：

```js
var mapHit = null;

if (Array.isArray(examExtensionMap)) {
    mapHit = examExtensionMap.find(function (m) {
        return (m.use_text && m.use_text.toString() === val)
            || (m.use_value != null && m.use_value.toString() === val);
    });
}

if (mapHit) {
    result.score = mapHit.use_value;

    result.extension = {
        Score: mapHit.use_value,
        UseText: mapHit.use_text || '',
        Text: mapHit.report_value || ''
    };

    return result;
}
```

- 若沒有 map 命中，再進行數字轉換：

```js
var num = Number(val);
if (!isNaN(num)) {
    result.score = num;
    result.extension = null;
    return result;
}
```

- 其他不在 map、也不是數字 → `result.error`。

> 重點檢查：  
> - rawValue = 0（Number） → val = `"0"` → num = 0 → `score = 0`。  
> - rawValue = `"0"` → val = `"0"` → num = 0 → `score = 0`。  
> - rawValue = `null` / `undefined` → val = `''` → `score = null`。

---

## Todo 2：確認 Extension 構造在一般分數時保持一致

> 這部分目標是「不要因為 0 分修正而破壞原本 Extension 的行為」。  
> 程式中已經有邏輯針對「一般分數」將 Extension 三欄（Score/UseText/Text）清空，保留殼即可。

在 `SetCourseExamScoreWithExtension()` 裡，有一段邏輯：

```js
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
```

以及：

```js
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

### 檢查重點

- 套用 Todo 1 修正後，`be.score` 為：
  - 空白 → `null`
  - 0 → `0`
  - 50 → `50`
  - 缺考/免試等 → `be.extension != null`（由 examExtensionMap 決定）
- 確認 `isNormalScore` 的判定現在包含「0 分」：
  - `(be.extension == null) && (be.score != null)` → 0、60、80… 都是「一般分數」。

如果要更清楚，可在 `isNormalScore` 上方加註解：

```js
// 一般數字成績（包含 0 分），不使用缺考/免試的 Extension 設定，只保留 Extension 殼以清空 Text/UseText/Score
var isNormalScore = (be.extension == null) && (be.score != null);
```

> 不必修改 B-2/B-3 內容，只要確認 `be.score` 現在正確，整體行為就會是：  
> - 一般數字：score 寫入 @Score，Extension 三欄清空。  
> - 特殊成績：score / UseText / Text 由 map 設定。

---

## Todo 3：確認 log 邏輯可記錄「空白 → 0」等變化

### 3-1. 評量成績 log（SetCourseExamScoreWithExtension）

原本的 log 判斷：

```js
if (studentRec['Exam' + examRec.ExamID] != studentRec['Exam' + examRec.ExamID + 'Origin']) {
    isChange = true;
    // 組 logManangers & descriptSection
}
```

- 這裡比較的是「畫面上目前值」 vs 「備份的 Origin 值」。  
- 修正 Todo 1 後，只要畫面上真正是 0（無論 String "0" 或 Number 0）且原本是空白，這裡就會判定為變更 → 記 log。

### 3-2. 學期成績與平時評量 log

- 學期成績：

```js
if (studentRec['Exam學期成績'] != studentRec['Exam學期成績Origin']) {
    // 組 descriptString
    isChange = true;
}
```

- 平時評量（小考）：

```js
if (stuRec[`Exam_${item.RefExamID}_Quiz_${item.SubExamID}`]
    != stuRec[`Exam_${item.RefExamID}_Quiz_${item.SubExamID}Origin`]) {
    // 組 logManangers
}
```

> 不用改邏輯，只要保證 0 分不再被吃掉，這些比對就能正確抓到「空白 → 0」、「0 → 50」等。

---

## Todo 4：手動 & 匯入測試情境

> 建議實際找一門測試課程（非正式課程），用少數學生進行完整測試。

### 4-1. 手動輸入測試

1. 選一門課，切到某個評量（例：期中考）。
2. 確認某位學生該評量原始成績為 **空白**。
3. 於畫面上直接輸入 `0`：
   - 按 Enter，確定欄位顯示為 0。
   - 按「儲存」。  
4. 重整 gadget 或重新進入，查看同一位學生：
   - 預期成績仍顯示為 **0**。
   - 後端（若方便，可查 DB 或報表）也應為 0。
   - 檢查 1campus.log.teacher：應有一筆類似：
     - `...,  ,  => 0`。

5. 再把 0 修正為 50 → 儲存 → 重整：
   - 成績應為 50。
   - log 應記錄 `0 => 50`。

### 4-2. 匯入成績測試（針對 Number 0）

1. 準備一段匯入資料，例如：

   ```
   0
   0
   50
   -
   ```

   - 前兩位同學：0 分
   - 第三位：50 分
   - 第四位：`-` 表示空白

2. 用「匯入成績」功能，套用到某個評量：
   - 確認匯入畫面解析過後，數字欄位顯示為 0 / 50 / 空白（沒出現「錯誤」或「超過」）。

3. 按「匯入」→ 再按儲存：
   - 重整後，檢查各位學生成績：
     - 前兩位應顯示 0。
     - 第三位 50。
     - 第四位空白。
   - 檢查 log，有「空白 → 0」、「空白 → 50」等紀錄。

### 4-3. 特殊成績測試（缺考/免試/0分特殊設定）

1. 確認 `examExtensionMap` 中有既有設定（例：`缺`、`免試`、`0分` 等）。
2. 測試數個轉換：
   - 空白 → `缺`
   - `缺` → 0
   - 0 → `缺`
3. 檢查：
   - 現在 `buildScoreAndExtension` 是否仍能根據 `examExtensionMap` 正確設定 `score` 與 `extension`。
   - Extension 內容是否與舊版一致（Score / UseText / Text）。

---

## Todo 5：程式內加註解（選做，建議）

為避免未來誤改，可在關鍵處加上註解：

1. 在 `buildScoreAndExtension` 開頭：

```js
// 注意：不能使用 (rawValue || '')，會把 0 視為空值，導致 0 分被當成「沒有輸入」
// 僅在 rawValue 為 null / undefined 時，才視為空白
```

2. 在 `isNormalScore` 定義前：

```js
// 一般數字成績（包含 0 分）會走這條路：Extension 只保留殼並清空 Text/UseText/Score
```

---

## Todo 6：完成後紀錄在「高中評量成績調整1125.md」

請在你的調整紀錄檔 **高中評量成績調整1125.md** 中新增一段紀錄（建議格式）：

```md
### 成績輸入：0 分消失與缺考 Extension 修正（2025-11-25）

- 修改檔案：`gradebook.js`
- 修改重點：
  1. 修正 `buildScoreAndExtension` 對 0 的處理，避免 (rawValue || '') 導致 0 被當成空白。
  2. 確認一般數字成績（含 0）走 isNormalScore 流程，score 正確寫入，Extension 只保留殼並清空三欄位。
  3. 維持缺考/免試等特殊 Extension 行為不變。
- 測試情境：
  - 空白 → 0 → 50 → 空白。
  - 匯入 0 / 50 / -。
  - 特殊成績（缺/免試/0分）互相轉換。
- 結果：
  - 0 分不再消失。
  - log 中會正確記錄空白 → 0、0 → 50 等異動。
```

---

## Step 4：自我檢查清單（開發者用）

- [ ] 手動輸入「空白 → 0 分」，重整後仍為 0 分，log 有紀錄。  
- [ ] 手動輸入「0 分 → 其他分數」，重整後正確，log 有紀錄。  
- [ ] 匯入成績包含 0 / 50 / -，重整後正確顯示，log 有紀錄。  
- [ ] 缺考/免試等特殊成績的 Extension 行為與舊版一致。  
- [ ] 已將本次調整紀錄寫入 **高中評量成績調整1125.md**。  
