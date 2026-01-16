# 心理測驗列印問題修正

## 問題描述

在列印「B表合併心理測驗」時，心理測驗資料無法正常顯示。問題主要出現在 `counsel-history-psychologicaltest` 組件中。

## 問題根本原因

1. **變數未初始化**：`QuizData` 和 `QuizDataAnswer` 沒有初始化為空陣列，預設為 `undefined`
2. **缺少防禦性檢查**：模板和方法中缺少空值檢查，當資料還在載入或為空時會報錯
3. **類型定義不完整**：TypeScript 類型定義缺少必要的屬性，導致編譯錯誤
4. **空資料顯示問題**：即使沒有心理測驗資料，也會顯示空的區塊

## 修正內容

### 1. 初始化變數（`counsel-history-psychologicaltest.component.ts`）

**修改前：**
```typescript
QuizData: { uid }[];
QuizDataAnswer: { QuizUid, Field: any[], ImplementationDate }[];
```

**修改後：**
```typescript
QuizData: { uid: string, QuizName?: string, Field?: any[] }[] = [];
QuizDataAnswer: { QuizUid, Field: any[], ImplementationDate }[] = [];
```

**原因：** 避免在資料載入前訪問 `undefined` 導致錯誤。

---

### 2. 改進 `getStudentItemBy` 方法

**修改前：**
```typescript
getStudentItemBy(resTestUID: string) {
  if (this.QuizData) {
    let rsp = this.QuizData.find(x => x.uid == resTestUID);
    return rsp
  }
}
```

**修改後：**
```typescript
getStudentItemBy(resTestUID: string): { uid: string, QuizName?: string, Field?: any[] } | null {
  if (this.QuizData && this.QuizData.length > 0) {
    let rsp = this.QuizData.find(x => x.uid == resTestUID);
    return rsp || null;
  }
  return null;
}
```

**原因：** 
- 添加長度檢查
- 明確返回類型
- 確保總是返回安全的值（`null` 而不是 `undefined`）

---

### 3. 改進 `getQuizAnswerData` 方法

**修改前：**
```typescript
getQuizAnswerData(quizUID: string, field: string) {
  if (this.QuizDataAnswer) {
    let rsp = this.QuizDataAnswer.find(x => x.QuizUid == quizUID);
    return rsp.Field.find(x => x.Name == field)
  } else {
    return null
  }
}
```

**修改後：**
```typescript
getQuizAnswerData(quizUID: string, field: string) {
  if (this.QuizDataAnswer && this.QuizDataAnswer.length > 0) {
    let rsp = this.QuizDataAnswer.find(x => x.QuizUid == quizUID);
    if (rsp && rsp.Field && rsp.Field.length > 0) {
      return rsp.Field.find(x => x.Name == field) || null;
    }
  }
  return null;
}
```

**原因：** 添加完整的空值檢查，避免在 `rsp` 為 `undefined` 時訪問 `Field` 屬性。

---

### 4. 改進 `getQuizTime` 方法

**修改前：**
```typescript
getQuizTime(quizUID: string) {
  let rsp = this.QuizDataAnswer.find(x => x.QuizUid == quizUID);
  let dateString = this.formatDate(rsp.ImplementationDate);
  return dateString
}
```

**修改後：**
```typescript
getQuizTime(quizUID: string) {
  if (this.QuizDataAnswer && this.QuizDataAnswer.length > 0) {
    let rsp = this.QuizDataAnswer.find(x => x.QuizUid == quizUID);
    if (rsp && rsp.ImplementationDate) {
      let dateString = this.formatDate(rsp.ImplementationDate);
      return dateString;
    }
  }
  return '';
}
```

**原因：** 添加空值檢查，避免訪問未定義屬性。

---

### 5. 優化 HTML 模板（`counsel-history-psychologicaltest.component.html`）

**修改前：**
```html
<hr>
<h3>心理測驗 </h3>
<ng-container *ngFor="let item of QuizData">
  <tr *ngFor="let field of getStudentItemBy(item.uid)?.Field">
    <td>{{field.Name}}</td>
    <td>{{getQuizAnswerData(item.uid ,field.Name)?.Value}}</td>
  </tr>
</ng-container>
```

**修改後：**
```html
<ng-container *ngIf="hasValidQuizData()">
  <hr>
  <h3>心理測驗 </h3>
  <ng-container *ngFor="let item of QuizData">
    <ng-container *ngIf="hasQuizAnswer(item.uid)">
      <br>
      測驗名稱 : {{item.QuizName}}
      <table>
        <tr>
          <td>測驗項目</td>
          <td>測驗結果</td>
        </tr>
        <ng-container *ngFor="let field of getStudentItemBy(item.uid).Field">
          <tr *ngIf="getQuizAnswerData(item.uid, field.Name)?.Value">
            <td>{{field.Name}}</td>
            <td>{{getQuizAnswerData(item.uid, field.Name).Value}}</td>
          </tr>
        </ng-container>
      </table>
    </ng-container>
  </ng-container>
</ng-container>
```

**原因：** 
- 添加條件檢查，確保 `QuizData` 存在且有資料時才渲染
- 只有當測驗有答案時才顯示該測驗
- 只有當答案有值時才顯示該行
- 如果沒有資料，整個心理測驗區塊（包括標題和分隔線）都不會顯示

---

### 6. 新增檢查方法

#### `hasValidQuizData()` 方法

```typescript
/** 檢查是否有有效的心理測驗資料 */
hasValidQuizData(): boolean {
  if (!this.QuizData || this.QuizData.length === 0) {
    return false;
  }
  
  // 檢查是否至少有一個測驗有對應的答案資料
  for (let quiz of this.QuizData) {
    if (this.hasQuizAnswer(quiz.uid)) {
      return true;
    }
  }
  
  return false;
}
```

**用途：** 檢查是否至少有一個測驗有有效的答案資料。

#### `hasQuizAnswer()` 方法

```typescript
/** 檢查指定測驗是否有答案資料 */
hasQuizAnswer(quizUID: string): boolean {
  let quizItem = this.getStudentItemBy(quizUID);
  if (quizItem && quizItem.Field && quizItem.Field.length > 0) {
    // 檢查是否有對應的答案資料
    for (let field of quizItem.Field) {
      let answer = this.getQuizAnswerData(quizUID, field.Name);
      if (answer && answer.Value) {
        return true;
      }
    }
  }
  return false;
}
```

**用途：** 檢查單個測驗是否有答案資料。

---

## 修改檔案清單

1. `src/app/simple-page/print/counsel-history-psychologicaltest/counsel-history-psychologicaltest.component.ts`
   - 初始化變數
   - 改進方法添加空值檢查
   - 添加類型定義
   - 新增檢查方法

2. `src/app/simple-page/print/counsel-history-psychologicaltest/counsel-history-psychologicaltest.component.html`
   - 添加條件檢查
   - 優化顯示邏輯

---

## 測試建議

1. **有心理測驗資料的學生**：確認能正常顯示心理測驗內容
2. **沒有心理測驗資料的學生**：確認不會顯示空的心理測驗區塊
3. **部分測驗有資料的學生**：確認只顯示有資料的測驗
4. **資料載入中**：確認不會因為資料未載入而報錯

---

## 修正日期

2024年（具體日期請根據實際情況填寫）

---

## 相關問題

- 問題：心理測驗列印時無法顯示
- 影響範圍：B表合併心理測驗列印功能
- 嚴重程度：中（功能無法正常使用）

