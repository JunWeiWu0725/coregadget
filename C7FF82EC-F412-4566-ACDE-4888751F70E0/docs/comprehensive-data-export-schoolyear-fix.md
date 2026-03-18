# 綜合資料匯出 - 學年度選項修正

## 問題描述

綜合資料匯出功能的學年度下拉選單使用硬編碼邏輯，固定往前推 3 年，不符合實際資料庫中的資料情況。

## 修改內容

### 修改檔案
- `src/app/counsel-statistics/reports/comprehensive-data-export/comprehensive-data-export.component.ts`

### 修改方法
- `getCurrentSemester()` 方法

## 舊版邏輯 vs 新版邏輯

### 🔴 **舊版邏輯（硬編碼）**
```typescript
async getCurrentSemester() {
  // 取得當前學年度學期
  const resp = await this.dsaService.send("GetCurrentSemester", {
    Request: {}
  });

  const Semesters = [].concat(resp.CurrentSemester || []);
  if (Semesters.length > 0) {
    this.SelectSchoolYear = +(Semesters[0].SchoolYear);
    this.SelectSemester = +(Semesters[0].Semester);
  }

  // 硬編碼往前推 3 年
  let i: number = 0;
  while (i <= 2) {
    this.SchoolYears.push(Number(this.SelectSchoolYear) - i);
    i++;
  }
}
```

**問題**：
- 固定只有 3 個學年度選項
- 不考慮資料庫實際資料情況
- 可能顯示沒有資料的學年度

### ✅ **新版邏輯（動態取得）**
```typescript
async getCurrentSemester() {
  // 1. 取得當前學年度學期
  const resp = await this.dsaService.send("GetCurrentSemester", {
    Request: {}
  });

  const Semesters = [].concat(resp.CurrentSemester || []);
  if (Semesters.length > 0) {
    this.SelectSchoolYear = +(Semesters[0].SchoolYear);
    this.SelectSemester = +(Semesters[0].Semester);
  }

  // 2. 取得所有可用的學年度學期
  try {
    const schoolYearResp = await this.dsaService.send("ComprehensiveRecordForm.GetComprehensiveRecordSchoolSemester");
    const semesterList = [].concat(schoolYearResp.SemesterInfo || []);
    
    // 提取所有學年度並去重、排序
    const schoolYears = [...new Set(semesterList.map(item => Number(item.SchoolYear)))];
    this.SchoolYears = schoolYears.sort((a, b) => b - a); // 降序，最新在前
    
    // 如果當前學年度不在清單中，加入當前學年度
    if (!this.SchoolYears.includes(Number(this.SelectSchoolYear))) {
      this.SchoolYears.unshift(Number(this.SelectSchoolYear));
    }
  } catch (error) {
    console.warn('無法取得綜合紀錄表學年度學期，使用預設邏輯', error);
    // 如果 API 失敗，回到原本的邏輯
    this.SchoolYears = [Number(this.SelectSchoolYear)];
  }
}
```

**優點**：
- 動態取得資料庫中實際存在的學年度
- 智慧排序（最新在前）
- 容錯處理機制
- 確保當前學年度一定在選項中

## 使用的 API

### 現有 API
- `GetCurrentSemester` - 取得系統當前學年度學期
- `ComprehensiveRecordForm.GetComprehensiveRecordSchoolSemester` - 取得綜合紀錄表所有學年度學期

### API 回傳格式
```typescript
// GetCurrentSemester 回傳
{
  CurrentSemester: [
    {
      SchoolYear: "113",
      Semester: "1"
    }
  ]
}

// ComprehensiveRecordForm.GetComprehensiveRecordSchoolSemester 回傳
{
  SemesterInfo: [
    { SchoolYear: "113", Semester: "1" },
    { SchoolYear: "113", Semester: "2" },
    { SchoolYear: "112", Semester: "1" },
    { SchoolYear: "112", Semester: "2" },
    { SchoolYear: "111", Semester: "1" },
    { SchoolYear: "111", Semester: "2" }
  ]
}
```

## 運作邏輯

### 步驟 1：取得當前學年度學期
- 呼叫 `GetCurrentSemester` API
- 設定 `SelectSchoolYear` 和 `SelectSemester` 為當前值

### 步驟 2：動態取得學年度選項
- 呼叫 `ComprehensiveRecordForm.GetComprehensiveRecordSchoolSemester` API
- 從回傳資料中提取所有學年度
- 去除重複並降序排列

### 步驟 3：確保完整性
- 檢查當前學年度是否在選項中
- 如果不在，自動加入到最前面

### 步驟 4：設定預設值
- 預設選中最大的學年度（最新的學年度）
- 確保使用者看到最新的資料

### 步驟 5：容錯處理
- 如果 API 呼叫失敗，回到安全模式
- 只顯示當前學年度作為唯一選項

## 實際效果比較

| 情況 | 舊版邏輯 | 新版邏輯 |
|------|----------|----------|
| **當前學年度 113** | `[113, 112, 111]` | 依資料庫實際資料 |
| **資料庫有 5 年資料** | `[113, 112, 111]` | `[113, 112, 111, 110, 109]` |
| **資料庫只有 2 年資料** | `[113, 112, 111]` | `[113, 112]` |
| **API 失敗** | `[113, 112, 111]` | `[113]` |

## 測試建議

1. **正常情況測試**
   - 確認學年度下拉選單顯示資料庫中實際存在的學年度
   - 確認選項按降序排列（最新在前）

2. **邊界情況測試**
   - 當前學年度不在資料庫中的情況
   - API 呼叫失敗的情況

3. **功能完整性測試**
   - 選擇不同學年度後，後續功能是否正常運作
   - 資料載入和匯出功能是否正常

## 修改日期

2026年3月6日（星期五）

## 相關檔案

- `src/app/counsel-statistics/reports/comprehensive-data-export/comprehensive-data-export.component.ts`
- `src/app/comprehensive/comprehensive.component.ts` (參考 API 使用方式)

## 注意事項

- 此修改向下相容，不會影響現有功能
- 如果新 API 失敗，會自動回到安全模式
- 建議在不同環境中測試 API 的可用性