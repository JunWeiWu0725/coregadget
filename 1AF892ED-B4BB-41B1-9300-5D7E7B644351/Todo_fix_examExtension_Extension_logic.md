# TODO – 修正 Extension 寫入邏輯（禁止 UseText 寫入一般數字）

⚠️ **修改完成後：請將本次修改結果、影響範圍、更新內容寫入  
《高中評量成績調整1118.md》**  
（可由 Cursor 實作後，由你再整理成最終紀錄）

---

## 🎯 目標

1. 老師輸入「一般分數」（例如 `52.5`），**不得寫入 Extension**，不得出現 `<UseText>52.5</UseText>`。
2. `<Score> / <UseText> / <Text>` 必須 **只來自 examExtensionMap（後端對照表）**。
3. 特殊成績（缺考、免試…）才使用：
   - Score = map.use_value（通常 -1、-2）
   - UseText = map.use_text（例如「缺」、「免」）
   - Text = map.report_value（報表顯示名稱）
4. 修正後，讀取端（Cynthia new）邏輯仍能正確判斷特殊成績。

---

# A. 新增共用函式 buildScoreAndExtension()
位置：`gradebook.js` → `MainCtrl`（與 rounding 等工具函式並列）

```javascript
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

    var num = Number(val);
    if (!isNaN(num)) {
        result.score = num;
        result.extension = null;
        return result;
    }

    result.error = '成績格式錯誤（非數字且不在缺考設定）';
    return result;
}
```

---

# B. 儲存成績 → 改成使用 buildScoreAndExtension()

搜尋：

```
SetCourseExamScoreWithExtension
```

將原本直接寫入 Extension 的程式移除，改成：

```javascript
var rawValue = stu['Exam' + examRec.ExamID];

var be = buildScoreAndExtension(rawValue, $scope.examExtensionMap);

if (be.error) {
    return;
}

var data = {
    '@StudentID': stu.StudentID,
    '@ExamID': examRec.ExamID,
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
```

---

# C. 不得再直接使用 rawValue 產生 UseText 或 Text

搜尋：

```
UseText
```

移除以下錯誤模式：

```
UseText: rawValue
Text: rawValue
Text: someVarWhichMightBeUndefined
```

---

# D. 測試情境（人工驗證）

### 1. 一般分數：`52.5`
- 僅 `<Score>52.5</Score>`
- 不得出現 `<UseText>52.5</UseText>`

### 2. 缺考（use_value = -1, use_text = '缺'）
- `<Score>-1</Score>`
- `<UseText>缺</UseText>`

### 3. 免試（use_value = -2）
- `<Score>-2</Score>`
- `<UseText>免</UseText>`

### 4. 缺 → 改輸入 52.5
- 需清掉舊 Extension
- 顯示正常 52.5
- 平均計算正確

---

# ✔ 修改完成標準
- 一般分數永遠不會產生 Extension。
- 特殊成績的 Extension 完全來自 examExtensionMap。
- 不再出現 `<UseText>52.5</UseText>` 或 `<Text>undefined</Text>`。

---

# 📌 修改完成後請執行

### ✔ 建立 / 更新文件《高中評量成績調整1118.md》

內容需包含：
- 修改目的  
- 改動檔案  
- 新增函式  
- 調整寫入邏輯點位  
- 測試結果  
- 後續注意事項  

（本 Todo.md 不需寫入，只需寫最終更動摘要）

