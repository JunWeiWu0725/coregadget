
# Todo: 修正 `current.template` 與 `templateList` 物件參考不一致（切換時顯示不在選項內）

> 目的：避免因為 `templateList` 重新建立（新陣列 / 新物件）導致 `current.template` 指向舊物件，造成 UI 顯示「不在選單內」。改為以 **ExamID** 為唯一選取依據，重建後以 ExamID 回填對應的新物件，並於 HTML 使用 `track by` 穩定渲染。

## 背景 / 問題描述
- 目前 `current.template` 直接保存「物件參考」。當 `templateList` 因重載課程/樣板而被重建時，`current.template` 仍指向舊物件，`ng-repeat` 以物件參考比對造成 active 狀態錯亂與「顯示內容不在選項內」問題。

## 成果定義（Acceptance Criteria）
- [ ] 以 `current.templateId`（ExamID）作為唯一選取依據。
- [ ] 每次重建 `templateList` 後，自動以 `templateId` 回填 `current.template` 指向新陣列中對應的物件；若找不到，退回第一筆或 `null`。
- [ ] HTML 用 `track by tpl.ExamID`，active 判斷以 ExamID 比對。
- [ ] 切換/重載課程與樣板時，`current.template` 與選單狀態不再失配。
- [ ] 回歸測試：不影響成績管理與平時評量的既有寫入流程。

## 影響檔案
- `gradebook.js`
- `content.htm`

---

## 實作步驟

### 1) Controller：引入 `templateId` 作為單一事實來源
**搜尋錨點：** `setCurrentTemplate`, `templateList` 建立處、載入課程後的 `setCurrentCourse` 或 `getTemplateList` 後處理。

**變更：** 初始化 `current.templateId`，並在選取時一併更新。
```js
// [TemplateGuard] 初始化
$scope.current = $scope.current || {};
$scope.current.templateId = $scope.current.templateId || null;

// [TemplateGuard] 統一入口：切換試別
$scope.setCurrentTemplate = function (tpl) {
  if (!tpl) return;
  $scope.current.templateId = tpl.ExamID; // 以 ID 作為唯一依據
  $scope.current.template = tpl;          // 保留供舊邏輯使用，但不再當唯一依據
};
```

### 2) 封裝「重建後回填」函式，於每次 templateList 更新後呼叫
**搜尋錨點：** `templateList = ...` 相關處（例如 `setCurrentCourse` / `getTemplateList` 成功回來後）。

```js
// [TemplateGuard] 重建後回填
function rebuildTemplateList(newList) {
  $scope.templateList = [].concat(newList || []);

  // 以 ID 對應回新陣列中的物件
  if ($scope.current.templateId) {
    var hit = $scope.templateList.find(function (t) { return t.ExamID === $scope.current.templateId; });
    if (hit) {
      $scope.current.template = hit;
    } else {
      // 找不到同 ID，退回第一筆或 null
      $scope.current.template = $scope.templateList[0] || null;
      $scope.current.templateId = $scope.current.template ? $scope.current.template.ExamID : null;
    }
  } else {
    // 尚未選取過，預設第一筆
    $scope.current.template = $scope.templateList[0] || null;
    $scope.current.templateId = $scope.current.template ? $scope.current.template.ExamID : null;
  }
}
```

> **將所有直接賦值 `templateList = ...` 的地方，改為呼叫：**
> ```js
> rebuildTemplateList(builtList); // builtList 來源與原本一致
> ```

### 3) 切換課程或重新載入樣板時，穩定處理順序
**搜尋錨點：** `setCurrentCourse(course)`。  
**做法：** 先建構樣板陣列，再呼叫 `rebuildTemplateList()`，最後才啟動依賴 `current.template` 的載入。

```js
// [TemplateGuard] 範例（示意）
$scope.setCurrentCourse = function (course) {
  $scope.current.Course = course;

  // 依原本邏輯建立樣板清單 builtList（自 course.Scores.Score 過濾/整理 UseScore === "是" 的項目）
  var builtList = [];
  [].concat(course.Scores && course.Scores.Score || []).forEach(function (temp) {
    if (temp.UseScore === "是") {
      builtList.push(temp);
    }
  });

  // 以封裝函式回填 current.template / templateId
  rebuildTemplateList(builtList);

  // 後續動作（依賴 current.template 的載入）...
  // e.g. 讀取平時項目、讀取學生分數…
};
```

### 4) HTML：以 ExamID 做渲染與 active 判斷，加入 `track by`
**搜尋錨點：** `content.htm` 中試別切換區塊（`ng-repeat="template in templateList"` 之類）。

```html
<!-- [TemplateGuard] 穩定 ng-repeat -->
<li ng-repeat="tpl in templateList track by tpl.ExamID"
    ng-class="{active: tpl.ExamID === current.templateId}">
  <a href="" ng-click="setCurrentTemplate(tpl)">{{tpl.Name}}</a>
</li>
```

> 若其他區塊也有 `ng-repeat` 使用 `templateList`，一併補上 `track by tpl.ExamID`。

### 5) 守護：載入/重建期間避免使用者操作
**（可選，但建議）**  
加入旗標避免在樣板尚未回填完成前操作：
```js
$scope.isLoadingTemplate = true;
// 取得/重建樣板中…
rebuildTemplateList(builtList);
$scope.isLoadingTemplate = false;
```

HTML 上針對相關按鈕/選單加 `ng-disabled="isLoadingTemplate"`。

---

## 測試清單（手動）
1. **切換課程 A → B → A**：回到 A 時，`current.template` 與選單 active 一致，無「不在選項內」現象。
2. **重載樣板（造成 templateList 新陣列）**：active 項維持不變或正確回到第一筆。
3. **邊切換邊載入**：在 `isLoadingTemplate=true` 期間按鈕禁用，不出現閃爍或錯位。
4. **與既有功能相容**：
   - 成績管理：輸入、儲存皆正常。
   - 平時評量：切換試別後可以正確讀取/儲存對應試別的平時項目與試算。

## 風險與回滾
- 風險：遺漏某處直接覆蓋 `templateList` 的程式碼，未改為 `rebuildTemplateList()`。
- 回滾：保留 `rebuildTemplateList`，但暫時不啟用，以檢查影響範圍；或只先套用 **步驟 4 (HTML track by)** 以降低錯位機率。

## 變更標記（方便比對）
- 註解標記：`// [TemplateGuard]`
- 搜尋關鍵字：`templateId`, `rebuildTemplateList`, `track by tpl.ExamID`

---

### 備註（給 Reviewer）
- 這是前端參考一致性的修復，不改後端 API 與資料格式。
- 採用 ID 為單一事實來源的寫法，是避免 AngularJS 物件參考漂移最穩妥的方式。
