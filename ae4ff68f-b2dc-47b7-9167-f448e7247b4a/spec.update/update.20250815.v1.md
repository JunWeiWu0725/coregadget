# 教學評鑑詞彙統一更新規格書

**更新日期**: 2025-08-15  
**版本**: v1  
**更新類型**: 詞彙統一  
**影響範圍**: 教學評鑑小工具前端介面、文件檔案  

## 問題描述

### 現況問題
目前的教學評鑑小工具中使用「評鑑」相關詞彙，但根據最新的用詞規範，需要統一改為「教學意見調查」相關詞彙，以符合正式的教學回饋機制命名。

1. **詞彙不一致**: 系統中混用「評鑑」和「教學意見調查」詞彙
2. **用戶體驗**: 需要提供一致的使用者介面詞彙
3. **官方規範**: 配合機構正式的教學回饋機制命名標準

### 具體需求
- `期中評鑑` → `期中教學意見調查`
- `期末評鑑` → `期末教學意見調查`
- `填寫評鑑` → `意見調查`
- `評鑑說明` → `教學意見調查說明`
- `教學評鑑` → `教學意見調查`
- `課程評鑑值` → `課程教學意見調查值`
- `評鑑填答率` → `教學意見調查填答率`
- `評鑑值` → `教學意見調查值`

## 解決方案

### 方案選擇
採用 **系統性詞彙替換** 方案，統一將所有「評鑑」相關詞彙更新為「教學意見調查」相關詞彙。

**處理邏輯架構**：
1. **靜態文字替換**: 更新所有 HTML 和 JavaScript 檔案中的硬編碼文字
2. **設定檔更新**: 更新 XML 設定檔中的標題和描述
3. **文件同步**: 更新專案文件檔以保持一致性

### 技術規格

#### 1. 影響檔案清單

**前端介面檔案**：
- `develope.html`
- `prototype.html`
- `prototype-page.html`
- `prototype-view.html`

**JavaScript 檔案**：
- `js/survey.js`
- `js/surveyHistory.js`

**設定檔**：
- `description.xml`

**文件檔**：
- `README.md`
- `CLAUDE.md`

#### 2. 詳細替換規格

##### 2.1 develope.html 修改

**第 75 行**:
```html
<!-- 現有 -->
<a data-toggle="collapse" data-parent="#accordion" href="#collapse2">期末評鑑</a>

<!-- 修改後 -->
<a data-toggle="collapse" data-parent="#accordion" href="#collapse2">期末教學意見調查</a>
```

**第 96 行**:
```html
<!-- 現有 -->
<th>填寫評鑑</th>

<!-- 修改後 -->
<th>意見調查</th>
```

**第 117 行**:
```html
<!-- 現有 -->
<th colspan="4">評鑑說明</th>

<!-- 修改後 -->
<th colspan="4">教學意見調查說明</th>
```

**第 149 行**:
```html
<!-- 現有 -->
<!-- 顯示課程評鑑值查詢 -->

<!-- 修改後 -->
<!-- 顯示課程教學意見調查值查詢 -->
```

##### 2.2 js/surveyHistory.js 修改

**第 137 行**:
```javascript
// 現有
"   onclick='showEvaluation(", response.csSchoolYear , "," , response.csSemester ,");'>課程評鑑值</a>"

// 修改後
"   onclick='showEvaluation(", response.csSchoolYear , "," , response.csSemester ,");'>課程教學意見調查值</a>"
```

**第 151-152 行**:
```javascript
// 現有
" 評鑑填答率為 ",
response.answerRate , "%  可查看本期評鑑值公告。)" ,

// 修改後
" 教學意見調查填答率為 ",
response.answerRate , "%  可查看本期教學意見調查值公告。)" ,
```

**第 166-167 行**:
```javascript
// 現有
" 評鑑填答率為 ",
response.answerRate , "% , 無法查看本期課程評鑑值。)" ,

// 修改後
" 教學意見調查填答率為 ",
response.answerRate , "% , 無法查看本期課程教學意見調查值。)" ,
```

**第 219 行**:
```javascript
// 現有
content += "<thead><tr><th>課程(" + schoolyear + "/" + semester + ")</th><th>課程代碼</th><th>評鑑值</th></thead><tbody>";

// 修改後
content += "<thead><tr><th>課程(" + schoolyear + "/" + semester + ")</th><th>課程代碼</th><th>教學意見調查值</th></thead><tbody>";
```

**第 252 行**:
```xml
<!-- 現有 -->
<Category>期末評鑑</Category>

<!-- 修改後 -->
<Category>期末教學意見調查</Category>
```

**第 306 行（向後相容性處理）**:
```javascript
// 現有
_survey_detail_string = "<tr><td>" + (item.Category || '').replace('教學意見調查', '') + "</td><td>" + item.CourseName + "</td><td>" + item.SurveyCount + "</td>" +

// 修改後 (新增雙重 replace 以確保向後相容性)
_survey_detail_string = "<tr><td>" + (item.Category || '').replace('教學意見調查', '').replace('評鑑', '') + "</td><td>" + item.CourseName + "</td><td>" + item.SurveyCount + "</td>" +
```

**說明**: 由於系統可能同時存在舊版資料（`xxx評鑑`）和新版資料（`xxx教學意見調查`），因此在顯示類別名稱時需要進行雙重 replace 處理：
1. 先移除「教學意見調查」字樣（處理新版資料）
2. 再移除「評鑑」字樣（處理舊版資料）
這樣可以確保無論是「期中評鑑」或「期中教學意見調查」都會正確顯示為「期中」。

##### 2.3 js/survey.js 修改

**第 18 行**:
```javascript
// 現有
tmp_msg = '<strong>很抱歉，您已完成評鑑！</strong>';

// 修改後
tmp_msg = '<strong>很抱歉，您已完成教學意見調查！</strong>';
```

**第 52 行**:
```javascript
// 現有
// 點選課程評鑑

// 修改後
// 點選課程教學意見調查
```

**第 65 行**:
```javascript
// 現有
// 評鑑表單的按鈕事件

// 修改後
// 教學意見調查表單的按鈕事件
```

**第 193 行**:
```javascript
// 現有
//#region 返回評鑑列表

// 修改後
//#region 返回教學意見調查列表
```

**第 268 行**:
```javascript
// 現有
//#region 取得評鑑注意事項 2014/12/4 elvira marker

// 修改後
//#region 取得教學意見調查注意事項 2014/12/4 elvira marker
```

**第 631 行**:
```javascript
// 現有
$('#tab_form tbody[data-type=questions]').html('<tr><td colspan="2">本評鑑已作答<br/><button type="button" class="btn" data-action="form_cancel">返回</button></td></tr>');

// 修改後
$('#tab_form tbody[data-type=questions]').html('<tr><td colspan="2">本教學意見調查已作答<br/><button type="button" class="btn" data-action="form_cancel">返回</button></td></tr>');
```

**第 944 行**:
```javascript
// 現有
"<th style='background-color:" + category.TitleBGColor + ";background:" + category.TitleBGColor + "'>填寫評鑑</th>"

// 修改後
"<th style='background-color:" + category.TitleBGColor + ";background:" + category.TitleBGColor + "'>意見調查</th>"
```

**第 1016 行**:
```javascript
// 現有
//#region 儲存評鑑結果

// 修改後
//#region 儲存教學意見調查結果
```

**第 1104 行**:
```javascript
// 現有
'的教學評鑑'

// 修改後
'的教學意見調查'
```

**第 870 行（動態顯示詞彙轉換）**:
```javascript
// 現有
var ret = "<div class='panel-group' id='SurveyCategory-" + item.Name + "-" + item.SchoolYear + "-" + item.Semester + "'><h4>" + item.Name + title + "</h4></div>";

// 修改後 (在顯示時動態替換詞彙)
var ret = "<div class='panel-group' id='SurveyCategory-" + item.Name + "-" + item.SchoolYear + "-" + item.Semester + "'><h4>" + (item.Name || '').replace('評鑑', '教學意見調查') + title + "</h4></div>";
```

**說明**: 由於 `item.Name` 是系統中寫死的資料（如「期中評鑑」、「期末評鑑」），無法直接在資料庫中修改，因此在前端顯示時使用 `.replace('評鑑', '教學意見調查')` 進行動態轉換，將「期中評鑑」顯示為「期中教學意見調查」，「期末評鑑」顯示為「期末教學意見調查」。

**第 1116 行**:
```javascript
// 現有 (部分內容)
"<Action>" + status_name + "評鑑</Action>"
"<ActionBy>ischool web 教學評鑑小工具</ActionBy>"

// 修改後 (部分內容)
"<Action>" + status_name + "教學意見調查</Action>"
"<ActionBy>ischool web 教學意見調查小工具</ActionBy>"
```

##### 2.4 其他 HTML 檔案修改

**prototype.html 第 31 行**:
```html
<!-- 現有 -->
<th>填寫評鑑</th>

<!-- 修改後 -->
<th>意見調查</th>
```

**prototype-page.html 第 37 行**:
```html
<!-- 現有 -->
<th colspan="4">評鑑說明</th>

<!-- 修改後 -->
<th colspan="4">教學意見調查說明</th>
```

**prototype-view.html 第 37 行**:
```html
<!-- 現有 -->
<th colspan="4">評鑑說明</th>

<!-- 修改後 -->
<th colspan="4">教學意見調查說明</th>
```

##### 2.5 設定檔修改

**description.xml 第 3-4 行**:
```xml
<!-- 現有 -->
<ModulePrefs title="教學評鑑" description="學生-教學評鑑">
  <Title lang="zh-TW">教學評鑑</Title>

<!-- 修改後 -->
<ModulePrefs title="教學意見調查" description="學生-教學意見調查">
  <Title lang="zh-TW">教學意見調查</Title>
```

##### 2.6 文件檔案修改

**README.md**:
- 第 1 行: `gadget-教學評鑑` → `gadget-教學意見調查`
- 第 17 行: `教學評鑑問卷` → `教學意見調查問卷`
- 第 19 行: `評鑑` → `教學意見調查`
- 第 23 行: `評鑑` → `教學意見調查`
- 第 28 行: `評鑑` → `教學意見調查`

**CLAUDE.md**:
- 第 7 行: `教學評鑑小工具`、`教學評鑑` → `教學意見調查小工具`、`教學意見調查`
- 相關段落中的所有 `評鑑` 詞彙替換

#### 3. 測試案例

##### 3.1 功能測試案例

**案例 1: 介面文字顯示**
- 檢查項目: 所有頁面的介面文字正確顯示為新詞彙
- 預期結果: 使用者看到的都是「教學意見調查」相關詞彙
- 驗證方法: 手動檢查各個頁面的標題、按鈕、說明文字

**案例 2: 功能正常運作**
- 檢查項目: 詞彙替換後所有功能正常運作
- 預期結果: 問卷填寫、歷史查詢、評分檢視等功能不受影響
- 驗證方法: 執行完整的使用者流程測試

**案例 3: JavaScript 動態文字**
- 檢查項目: JavaScript 動態產生的文字使用新詞彙
- 預期結果: 所有動態產生的訊息和介面元素使用正確詞彙
- 驗證方法: 觸發各種 JavaScript 功能，檢查產生的文字

**案例 4: XML 資料處理**
- 檢查項目: XML 回應中的類別名稱更新
- 預期結果: 系統正確處理新的類別名稱
- 驗證方法: 檢查資料載入和顯示功能

##### 3.2 回歸測試案例

**案例 1: 問卷填寫流程**
- 測試範圍: 完整的問卷填寫和提交流程
- 預期結果: 功能正常，無錯誤發生
- 驗證重點: 確保詞彙替換不影響核心功能

**案例 2: 歷史資料查詢**
- 測試範圍: 歷史問卷資料顯示和統計功能
- 預期結果: 資料正確顯示，統計數據準確
- 驗證重點: 確保資料處理邏輯不受詞彙變更影響

**案例 3: 教學意見調查值查詢**
- 測試範圍: 課程評分查詢和顯示功能
- 預期結果: 評分資料正確載入和顯示
- 驗證重點: 確保評分相關功能完整運作

#### 4. 實作注意事項

##### 4.1 程式碼修改順序
1. **前端 HTML 檔案**: 優先修改所有 HTML 檔案中的靜態文字
2. **JavaScript 檔案**: 修改 JavaScript 檔案中的字串常數
3. **設定檔案**: 更新 XML 設定檔
4. **文件檔案**: 最後更新專案文件
5. **測試驗證**: 執行所有測試案例

##### 4.2 關鍵實作點
- **字串精確匹配**: 確保替換時不會影響其他無關的文字
- **大小寫一致**: 保持中文詞彙的一致性
- **功能完整性**: 確保所有功能在詞彙替換後正常運作
- **使用者體驗**: 確保新詞彙在介面上顯示自然

##### 4.3 部署注意事項
- **分段部署**: 可考慮分階段部署以降低風險
- **使用者通知**: 向使用者說明介面文字的變更
- **回滾準備**: 準備快速回滾機制以應對問題
- **文件同步**: 確保所有相關文件同步更新

#### 5. 成功標準

##### 5.1 功能標準
- 所有教學評鑑功能正常運作
- 介面文字統一使用新詞彙
- 無功能性錯誤發生
- 使用者流程順暢

##### 5.2 品質標準
- 通過所有測試案例
- 程式碼品質維持
- 使用者介面一致性
- 文件更新完整

##### 5.3 使用者體驗標準
- 詞彙使用自然且一致
- 介面邏輯清晰易懂
- 無使用者困惑情況
- 整體體驗維持或提升

---

**備註**: 本更新規格書需要在實施前經過技術審查和核准，並在測試環境中充分驗證後才能部署到生產環境。詞彙替換雖然看似簡單，但需要確保不影響系統的核心功能和使用者體驗。