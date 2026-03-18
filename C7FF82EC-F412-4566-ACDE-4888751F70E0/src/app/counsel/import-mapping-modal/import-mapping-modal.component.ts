import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import * as XLSX from 'xlsx';
import { DsaTransferService } from 'src/app/transfer-students/service/dsa-transfer.service';

declare var $: any;

// 系統欄位的固定選項值（只有方式、對象、類別、公開需要）
export const FIELD_ALLOWED_VALUES: Record<string, string[]> = {
  '方式': ['面談', '電話', '聯絡簿', '其他'],
  '對象': ['學生', '教職員', '家長', '專業人員', '其他'],
  '公開': ['是', '否'],
  '類別': [
    '人際困擾',
    '師生關係',
    '家庭困擾',
    '自我探索',
    '情緒困擾',
    '生活壓力',
    '創傷反應',
    '自我傷害',
    '性別議題',
    '脆弱家庭',
    '兒少保議題',
    '學習困擾',
    '生涯輔導',
    '偏差行為',
    '網路沉迷',
    '中離（輟）拒學',
    '藥物濫用',
    '精神疾患',
    '其他'
  ],
};

// 系統需要的標準欄位定義
export const STANDARD_FIELDS = [
  { key: '班級', required: true, description: '學生目前班級', type: '文字', mode: 'bySeat' },
  { key: '座號', required: true, description: '學生座號', type: '數字', mode: 'bySeat' },
  { key: '學號', required: true, description: '學生學號', type: '文字', mode: 'byStudentId' },
  { key: '狀態', required: false, description: '一般、延修、休學、畢業或離校（可多選，逗號分隔）', type: '文字', mode: 'both' },
  { key: '年級', required: false, description: '1-12', type: '數字', mode: 'both' },
  { key: '學年度', required: true, description: '如：113、114', type: '數字', mode: 'both' },
  { key: '學期', required: true, description: '1 或 2', type: '數字', mode: 'both' },
  { key: '日期', required: true, description: 'yyyy/mm/dd', type: '日期', mode: 'both' },
  { key: '晤談時間', required: false, description: '文字或時間格式', type: '文字', mode: 'both' },
  { key: '方式', required: true, description: '面談、電話、聯絡簿等', type: '文字', mode: 'both' },
  { key: '方式其他', required: false, description: '當方式為其他時必填', type: '文字', mode: 'both' },
  { key: '對象', required: true, description: '學生、教職員、家長等', type: '文字', mode: 'both' },
  { key: '對象其他', required: false, description: '當對象為其他時必填', type: '文字', mode: 'both' },
  { key: '記錄者', required: true, description: '教師姓名', type: '文字', mode: 'both' },
  { key: '暱稱', required: false, description: '教師暱稱（同名時必填）', type: '文字', mode: 'both' },
  { key: '公開', required: true, description: '是、否', type: '文字', mode: 'both' },
  { key: '聯絡事項', required: false, description: '與輔導內容二擇一', type: '文字', mode: 'both' },
  { key: '輔導內容', required: false, description: '與聯絡事項二擇一', type: '文字', mode: 'both' },
  { key: '類別', required: true, description: '多選（逗號分隔）', type: '文字', mode: 'both' },
  { key: '類別其他', required: false, description: '當類別包含其他時必填', type: '文字', mode: 'both' },
];

// 值映射規則（來源值 → 目標值）
interface ValueMapping {
  sourceValue: string; // 來源 Excel 的值
  targetValue: string; // 轉換後的目標值
}

// 欄位映射配置
interface FieldMapping {
  standardField: string; // 系統標準欄位
  sourceFields: string[]; // 來源 Excel 的欄位（可多個，用於合併）
  mergeType?: 'concat' | 'formula'; // 合併方式：連接或公式
  mergeSeparator?: string; // 合併分隔符
  formula?: string; // 自訂公式（如：{姓} {名}）
  useFixedValue?: boolean; // 是否使用固定值
  fixedValue?: string; // 固定值
  valueMappings?: ValueMapping[]; // 值映射規則列表
  transform?: (value: any) => any; // 轉換函數
}

@Component({
  selector: 'app-import-mapping-modal',
  templateUrl: './import-mapping-modal.component.html',
  styleUrls: ['./import-mapping-modal.component.css']
})
export class ImportMappingModalComponent implements OnInit {
  // 上傳的來源 Excel 資料
  sourceExcelData: any[] = [];
  sourceFields: string[] = []; // 來源 Excel 的欄位名稱
  uploadedFileNames: string[] = []; // 已上傳的檔案名稱列表
  fileDataMap: Map<string, any[]> = new Map(); // 每個檔案對應的資料
  fileFieldsMap: Map<string, string[]> = new Map(); // 每個檔案對應的欄位名稱
  fileMappingsMap: Map<string, Map<string, FieldMapping>> = new Map(); // 每個檔案對應的映射配置
  currentEditingFileName: string = ''; // 當前正在編輯的檔案名稱
  syncMappingsToAllFiles: boolean = false; // 是否同步映射配置至所有檔案

  // 欄位映射配置
  fieldMappings: Map<string, FieldMapping> = new Map();

  // 匯入模式
  importMode: 'bySeat' | 'byStudentId' = 'bySeat';

  // 轉換後的資料預覽
  transformedData: any[] = [];
  previewRows: number = 100; // 預覽行數

  // UI 狀態
  step: 'upload' | 'mapping' | 'preview' | 'download' = 'upload';
  showFieldMapping: boolean = false;

  // 記錄已點擊的唯一值（用於隱藏已使用的標籤）
  clickedUniqueValues: Map<string, Set<string>> = new Map();

  // 全校學生清單和教師清單（用於驗證）
  studentList: any[] = [];
  teacherList: any[] = [];

  // 用於追蹤是否已顯示班級字段的 alert（避免重複彈窗）
  private _classFieldAlertShown: boolean = false;

  constructor(
    private dsaService: DsaTransferService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    // 載入全校學生和教師清單
    this.loadAllStudent();
    this.loadAllTeacher();
  }

  // 開啟 Modal
  public openModal() {
    this.reset();
    // 確保學生和教師清單已載入
    this.loadAllStudent();
    this.loadAllTeacher();
    $("#import_mapping_modal").modal("show");
  }

  // 載入全校學生清單（包含畢業或離校的學生）
  async loadAllStudent() {
    try {
      // 傳入參數以包含所有學生（包括畢業或離校的）
      let rsp = await this.dsaService.send("_.GetAllStudent", {
        IncludeGraduated: true,
        IncludeTransferred: true
      });
      this.studentList = [].concat(rsp.Students || []);
      console.log("=== 欄位映射工具 - 全校學生清單（包含畢業或離校） ===");
      console.log("學生總數:", this.studentList.length);

      // 調試：列出前10個學號作為參考
      if (this.studentList.length > 0) {
        console.log("前10個學生學號範例:", this.studentList.slice(0, 10).map(s => ({
          StudentNumber: s.StudentNumber,
          StudentName: s.StudentName,
          Status: s.Status
        })));
      }
    } catch (error) {
      console.error("載入學生清單失敗（帶參數）:", error);
      // 如果帶參數的 API 調用失敗，嘗試不帶參數的調用
      try {
        let rsp = await this.dsaService.send("_.GetAllStudent", {});
        this.studentList = [].concat(rsp.Students || []);
        console.log("=== 欄位映射工具 - 全校學生清單（預設） ===");
        console.log("學生總數:", this.studentList.length);

        // 調試：列出前10個學號作為參考
        if (this.studentList.length > 0) {
          console.log("前10個學生學號範例:", this.studentList.slice(0, 10).map(s => ({
            StudentNumber: s.StudentNumber,
            StudentName: s.StudentName,
            Status: s.Status
          })));
        }
      } catch (fallbackError) {
        console.error("載入學生清單失敗（備用方案）:", fallbackError);
        this.studentList = [];
      }
    }
  }

  // 載入全校教師清單
  async loadAllTeacher() {
    try {
      let rsp = await this.dsaService.send("_.GetAllTeacher", {});
      this.teacherList = [].concat(rsp.Teacher || []);
      console.log("=== 欄位映射工具 - 全校教師清單 ===");
      console.log("教師總數:", this.teacherList.length);
    } catch (error) {
      console.error("載入教師清單失敗:", error);
      this.teacherList = [];
    }
  }

  // 取得學生匹配統計
  getStudentMatchCount(): { success: number; failed: number } {
    let success = 0;
    let failed = 0;
    this.transformedData.forEach(row => {
      if (row._studentMatch) {
        if (row._studentMatch.matched) {
          success++;
        } else {
          failed++;
        }
      }
    });
    return { success, failed };
  }

  // 取得教師匹配統計
  getTeacherMatchCount(): { success: number; failed: number } {
    let success = 0;
    let failed = 0;
    this.transformedData.forEach(row => {
      if (row._teacherMatch) {
        if (row._teacherMatch.matched) {
          success++;
        } else {
          failed++;
        }
      }
    });
    return { success, failed };
  }

  // 取得日期格式驗證統計
  getDateMatchCount(): { success: number; failed: number } {
    let success = 0;
    let failed = 0;
    this.transformedData.forEach(row => {
      if (row._dateMatch) {
        if (row._dateMatch.matched) {
          success++;
        } else {
          failed++;
        }
      } else {
        // 如果沒有日期匹配記錄，檢查日期欄位是否有值
        const dateValue = (row['日期'] || '').toString().trim();
        if (!dateValue) {
          failed++; // 日期為空也算失敗
        } else {
          success++; // 有值但沒有驗證記錄，假設成功
        }
      }
    });
    return { success, failed };
  }

  // 取得狀態欄位驗證統計
  getStatusMatchCount(): { success: number; failed: number } {
    let success = 0;
    let failed = 0;
    this.transformedData.forEach(row => {
      if (row._statusMatch) {
        if (row._statusMatch.matched) {
          success++;
        } else {
          failed++;
        }
      } else {
        // 如果沒有狀態匹配記錄，檢查狀態欄位是否有值
        const statusValue = (row['狀態'] || '').toString().trim();
        if (!statusValue) {
          failed++; // 狀態為空也算失敗
        } else {
          success++; // 有值但沒有驗證記錄，假設成功
        }
      }
    });
    return { success, failed };
  }

  // 顯示學生清單
  showStudentList() {
    if (this.studentList.length === 0) {
      alert('學生清單尚未載入，請稍候再試');
      return;
    }

    // 創建學生清單的 HTML 內容
    const statusText: Record<string, string> = { "1": "一般", "2": "延修", "4": "休學", "16": "畢業或離校" };

    let htmlContent = `
      <html>
        <head>
          <title>全校學生清單</title>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: "Microsoft JhengHei", Arial, sans-serif; 
              padding: 1rem; 
              background-color: #f8f9fa;
            }
            .header {
              background-color: #E6F3F1;
              padding: 1rem;
              border-radius: 0.375rem;
              margin-bottom: 1rem;
            }
            table { 
              border-collapse: collapse; 
              width: 100%; 
              background-color: white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              border-radius: 0.375rem;
              overflow: hidden;
            }
            th, td { 
              border: 1px solid #dee2e6; 
              padding: 8px 12px; 
              text-align: left;
            }
            th { 
              background-color: #f8f9fa; 
              font-weight: bold;
              color: #495057;
              position: sticky;
              top: 0;
            }
            tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            tr:hover {
              background-color: #e9ecef;
            }
            .text-center {
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin: 0; color: #495057;">📋 全校學生清單</h2>
            <p style="margin: 0.5rem 0 0 0; color: #6c757d;">
              共 <strong>${this.studentList.length}</strong> 位學生
            </p>
          </div>
          <div style="max-height: 80vh; overflow-y: auto;">
            <table>
              <thead>
                <tr>
                  <th style="width: 100px;">班級</th>
                  <th style="width: 80px;">座號</th>
                  <th style="width: 150px;">學號</th>
                  <th style="width: 120px;">姓名</th>
                  <th style="width: 80px;">狀態</th>
                  <th style="width: 120px;">StudentID</th>
                </tr>
              </thead>
              <tbody>
    `;

    // 按班級和座號排序
    const sortedStudents = [...this.studentList].sort((a, b) => {
      const classA = (a.ClassName || '').toString();
      const classB = (b.ClassName || '').toString();
      if (classA !== classB) {
        return classA.localeCompare(classB, 'zh-TW');
      }
      const seatA = this.normalizeSeatNo(a.SeatNo);
      const seatB = this.normalizeSeatNo(b.SeatNo);
      const numA = parseInt(seatA) || 0;
      const numB = parseInt(seatB) || 0;
      return numA - numB;
    });

    sortedStudents.forEach(student => {
      const className = student.ClassName || '-';
      const seatNo = this.normalizeSeatNo(student.SeatNo);
      const studentNumber = student.StudentNumber || '-';
      const studentName = student.StudentName || '-';
      const status = student.Status || '';
      const statusTextValue = statusText[status] || status || '-';
      const studentID = student.StudentID || '-';

      htmlContent += `
                <tr>
                  <td>${className}</td>
                  <td class="text-center">${seatNo}</td>
                  <td>${studentNumber}</td>
                  <td>${studentName}</td>
                  <td class="text-center">${statusTextValue}</td>
                  <td>${studentID}</td>
                </tr>
      `;
    });

    htmlContent += `
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    // 在新視窗中顯示
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    } else {
      alert('無法開啟新視窗，請確認瀏覽器沒有封鎖彈出視窗');
    }
  }

  // 顯示教師匹配失敗記錄
  showTeacherMatchFailures() {
    if (this.transformedData.length === 0) {
      alert('沒有資料可顯示');
      return;
    }

    // 篩選出教師匹配失敗的記錄
    const failedRecords = this.transformedData.filter(row =>
      row._teacherMatch && !row._teacherMatch.matched
    );

    if (failedRecords.length === 0) {
      alert('沒有教師匹配失敗的記錄');
      return;
    }

    // 創建失敗記錄的 HTML 內容
    let htmlContent = `
      <html>
        <head>
          <title>教師匹配失敗記錄</title>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: "Microsoft JhengHei", Arial, sans-serif; 
              padding: 1rem; 
              background-color: #f8f9fa;
            }
            .header {
              background-color: #fff3cd;
              padding: 1rem;
              border-radius: 0.375rem;
              margin-bottom: 1rem;
              border-left: 4px solid #ffc107;
            }
            table { 
              border-collapse: collapse; 
              width: 100%; 
              background-color: white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              border-radius: 0.375rem;
              overflow: hidden;
            }
            th, td { 
              border: 1px solid #dee2e6; 
              padding: 8px 12px; 
              text-align: left;
            }
            th { 
              background-color: #f8f9fa; 
              font-weight: bold;
              color: #495057;
              position: sticky;
              top: 0;
            }
            tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            tr:hover {
              background-color: #e9ecef;
            }
            .error-cell {
              color: #dc3545;
              font-weight: 500;
            }
            .warning-cell {
              color: #856404;
            }
            .total-count { 
              margin-bottom: 1rem; 
              font-weight: bold;
              font-size: 1.1rem;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h3>教師匹配失敗記錄</h3>
            <p class="total-count">共 ${failedRecords.length} 筆失敗記錄</p>
          </div>
          <div style="max-height: 80vh; overflow-y: auto;">
            <table>
              <thead>
                <tr>
                  <th style="width: 60px;">序號</th>
                  <th style="width: 100px;">班級</th>
                  <th style="width: 80px;">座號</th>
                  <th style="width: 150px;">學號</th>
                  <th style="width: 120px;">記錄者</th>
                  <th style="width: 100px;">暱稱</th>
                  <th style="width: 300px;">錯誤訊息</th>
                  <th style="width: 250px;">警告訊息</th>
                </tr>
              </thead>
              <tbody>
    `;

    failedRecords.forEach((row, index) => {
      const className = row['班級'] || '-';
      const seatNo = row['座號'] || '-';
      const studentNumber = row['學號'] || '-';
      const recorder = row['記錄者'] || '-';
      const nickname = row['暱稱'] || '-';
      const teacherMatch = row._teacherMatch || {};
      const error = teacherMatch.error || '未知錯誤';
      const warning = teacherMatch.warning || '';

      htmlContent += `
        <tr>
          <td>${index + 1}</td>
          <td>${className}</td>
          <td>${seatNo}</td>
          <td>${studentNumber}</td>
          <td>${recorder}</td>
          <td>${nickname}</td>
          <td class="error-cell">${error}</td>
          <td class="warning-cell">${warning || '-'}</td>
        </tr>
      `;
    });

    htmlContent += `
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    } else {
      alert('無法開啟新視窗，請確認瀏覽器沒有封鎖彈出視窗');
    }
  }

  // 重置狀態
  reset() {
    this.sourceExcelData = [];
    this.sourceFields = [];
    this.uploadedFileNames = [];
    this.fileDataMap.clear();
    this.fileFieldsMap.clear();
    this.fileMappingsMap.clear();
    this.fieldMappings.clear();
    this.transformedData = [];
    this.step = 'upload';
    this.showFieldMapping = false;
    this.currentEditingFileName = '';
    this.clickedUniqueValues.clear();
    this._classFieldAlertShown = false; // 重置 alert 標誌
  }

  // 處理檔案上傳（支援多檔案）
  async onFileSelected(event: any) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    alert(`開始處理檔案上傳\n檔案數量: ${files.length}\n第一個檔案名稱: ${files[0].name}`);

    this.uploadedFileNames = [];
    this.sourceExcelData = [];
    this.fileDataMap.clear();
    this.fileFieldsMap.clear();
    this.fileMappingsMap.clear();
    const allFields = new Set<string>();

    try {
      // 讀取所有檔案
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.uploadedFileNames.push(file.name);

        const data = await this.readExcelFile(file);

        // 儲存每個檔案的資料
        this.fileDataMap.set(file.name, data);

        // 取得該檔案的欄位名稱
        let fileFields: string[] = [];
        if (data.length > 0) {
          fileFields = Object.keys(data[0]);
          fileFields.forEach(field => allFields.add(field));
        }
        this.fileFieldsMap.set(file.name, fileFields);

        // 為每個檔案初始化獨立的映射配置
        const fileMapping = new Map<string, FieldMapping>();
        this.fileMappingsMap.set(file.name, fileMapping);

        // 合併資料（用於顯示）
        this.sourceExcelData = this.sourceExcelData.concat(data);
      }

      // 設定所有欄位名稱（所有檔案的欄位合併）
      this.sourceFields = Array.from(allFields).sort();

      if (this.sourceExcelData.length === 0) {
        alert('所有檔案都沒有資料');
        return;
      }

      // 初始化第一個檔案的欄位映射
      if (this.uploadedFileNames.length > 0) {
        this.currentEditingFileName = this.uploadedFileNames[0];
        this.switchEditingFile(this.currentEditingFileName);

        // 直接設置學年度和學期的固定值
        this.setYearSemesterFromFileName(this.currentEditingFileName);
      }

      // 進入映射步驟
      this.step = 'mapping';
      this.showFieldMapping = true;

    } catch (error) {
      alert('讀取 Excel 檔案失敗：' + error);
      console.error(error);
    }

    // 清空文件輸入框
    event.target.value = '';
  }

  // 切換編輯的檔案
  async switchEditingFile(fileName: string) {
    // console.log(`switchEditingFile 被調用\n檔案名稱: ${fileName}\n當前編輯檔案: ${this.currentEditingFileName}`);

    // 如果切換到同一個檔案，不需要處理
    if (fileName === this.currentEditingFileName) {
      return;
    }

    // 保存當前檔案的映射配置
    this.saveCurrentFileMappings();

    // 記錄上一個檔案名稱
    const previousFileName = this.currentEditingFileName;

    // 如果啟用了同步功能，直接載入目標檔案的配置（因為 saveCurrentFileMappings 已經同步好了）
    if (this.syncMappingsToAllFiles) {
      this.currentEditingFileName = fileName;
      const fileMapping = this.fileMappingsMap.get(fileName);
      if (fileMapping) {
        this.fieldMappings = new Map(fileMapping);
      } else {
        this.fieldMappings.clear();
      }
      this.initializeFieldMappings();
      return;
    }

    // 檢查是否有上一個檔案的映射配置（未啟用同步時才詢問是否複製）
    if (previousFileName && this.fileMappingsMap.has(previousFileName)) {
      const previousMapping = this.fileMappingsMap.get(previousFileName);
      // 檢查上一個檔案是否有設定映射（不只是空的配置）
      const hasPreviousMapping = previousMapping && Array.from(previousMapping.values()).some(m =>
        (m.sourceFields && m.sourceFields.length > 0 && m.sourceFields.some(f => f && f.trim() !== '')) ||
        (m.useFixedValue && m.fixedValue && m.fixedValue.trim() !== '') ||
        (m.valueMappings && m.valueMappings.length > 0)
      );

      if (hasPreviousMapping) {
        // 彈出確認對話框
        const confirmMessage = `是否要將「${previousFileName}」的映射設定套用到「${fileName}」？\n\n點擊「確定」將複製映射設定，點擊「取消」將使用空白設定。`;
        const shouldCopy = confirm(confirmMessage);

        if (shouldCopy) {
          // 複製上一個檔案的映射配置
          const copiedMapping = new Map<string, FieldMapping>();
          previousMapping.forEach((mapping, key) => {
            // 深拷貝映射配置
            copiedMapping.set(key, {
              standardField: mapping.standardField,
              sourceFields: mapping.sourceFields ? [...mapping.sourceFields] : [],
              mergeType: mapping.mergeType,
              mergeSeparator: mapping.mergeSeparator,
              formula: mapping.formula,
              fixedValue: mapping.fixedValue,
              useFixedValue: mapping.useFixedValue,
              valueMappings: mapping.valueMappings ? mapping.valueMappings.map(vm => ({
                sourceValue: vm.sourceValue,
                targetValue: vm.targetValue
              })) : [],
              transform: mapping.transform
            });
          });

          // 設定為當前檔案的映射配置
          this.fileMappingsMap.set(fileName, copiedMapping);
          this.currentEditingFileName = fileName;
          this.fieldMappings = copiedMapping;

          // 初始化欄位映射（會自動匹配欄位名稱）
          this.initializeFieldMappings();
          return;
        }
      }
    }

    // 如果沒有上一個檔案或用戶選擇不複製，使用空白設定
    this.currentEditingFileName = fileName;

    // 載入該檔案的映射配置
    const fileMapping = this.fileMappingsMap.get(fileName);
    if (fileMapping && fileMapping.size > 0) {
      // 檢查是否有有效的映射配置（有來源欄位或固定值）
      const hasValidMapping = Array.from(fileMapping.values()).some(m =>
        (m.sourceFields && m.sourceFields.length > 0 && m.sourceFields.some(f => f && f.trim() !== '')) ||
        (m.useFixedValue && m.fixedValue && m.fixedValue.trim() !== '')
      );

      if (hasValidMapping) {
        // 如果已經有有效的映射配置，載入它
        this.fieldMappings = new Map(fileMapping);
      } else {
        // 如果沒有有效的映射配置，清空並重新初始化
        this.fieldMappings.clear();
      }
    } else {
      // 如果沒有映射配置，清空並重新初始化
      this.fieldMappings.clear();
    }

    // 載入該檔案的欄位名稱
    const fileFields = this.fileFieldsMap.get(fileName);
    if (fileFields && fileFields.length > 0) {
      console.log(`準備初始化 ${fileName} 的欄位映射`);
      console.log(`檔案欄位:`, fileFields);

      // 初始化該檔案的欄位映射（會自動匹配相同名稱的欄位）
      this.initializeFieldMappings();

      // 檢查初始化後班級字段的狀態
      const classMapping = this.fieldMappings.get('班級');
      console.log(`初始化後班級映射:`, classMapping);

      // 保存初始化後的映射配置
      this.saveCurrentFileMappings();
    }
  }

  // 保存當前檔案的映射配置
  saveCurrentFileMappings() {
    if (this.currentEditingFileName) {
      const fileMapping = new Map(this.fieldMappings);
      this.fileMappingsMap.set(this.currentEditingFileName, fileMapping);

      // 如果啟用了同步功能，將配置套用到所有其他檔案（排除學年度與學期）
      if (this.syncMappingsToAllFiles) {
        this.uploadedFileNames.forEach(fileName => {
          if (fileName !== this.currentEditingFileName) {
            // 獲取該檔案現有的映射，或建立新的
            let targetMapping = this.fileMappingsMap.get(fileName);
            if (!targetMapping) {
              targetMapping = new Map<string, FieldMapping>();
            }
            
            // 複製除了學年度與學期以外的所有映射
            this.fieldMappings.forEach((mapping, key) => {
              if (key !== '學年度' && key !== '學期') {
                // 深拷貝映射配置
                targetMapping!.set(key, {
                  standardField: mapping.standardField,
                  sourceFields: mapping.sourceFields ? [...mapping.sourceFields] : [],
                  mergeType: mapping.mergeType,
                  mergeSeparator: mapping.mergeSeparator,
                  formula: mapping.formula,
                  fixedValue: mapping.fixedValue,
                  useFixedValue: mapping.useFixedValue,
                  valueMappings: mapping.valueMappings ? mapping.valueMappings.map(vm => ({
                    sourceValue: vm.sourceValue,
                    targetValue: vm.targetValue
                  })) : [],
                  transform: mapping.transform
                });
              }
            });
            
            this.fileMappingsMap.set(fileName, targetMapping!);
          }
        });
      }
    }
  }

  // 從檔案名稱和資料中識別學年度和學期
  private detectSchoolYearAndSemester(data: any[], fileName?: string): { schoolYear?: string, semester?: string } {
    let schoolYear: string | undefined;
    let semester: string | undefined;

    // 優先從檔案名稱提取學年度和學期
    if (fileName) {
      const extracted = this.extractYearSemesterFromFileName(fileName);
      if (extracted.schoolYear) {
        schoolYear = extracted.schoolYear;
        console.log(`✓ 從檔案名稱提取學年度：${schoolYear}`);
      }
      if (extracted.semester) {
        semester = extracted.semester;
        console.log(`✓ 從檔案名稱提取學期：${semester}`);
      }
    }

    // 如果檔案名稱沒有提取到，再嘗試從資料中找
    if ((!schoolYear || !semester) && data && data.length > 0) {
      const firstRow = data[0];

      // 可能的欄位名稱
      const yearFields = ['學年度', '學年', 'year', 'Year', 'YEAR'];
      const semesterFields = ['學期', 'semester', 'Semester', 'SEMESTER'];

      if (!schoolYear) {
        for (const field of yearFields) {
          if (firstRow[field]) {
            schoolYear = String(firstRow[field]).trim();
            console.log(`✓ 從資料欄位提取學年度：${schoolYear}`);
            break;
          }
        }
      }

      if (!semester) {
        for (const field of semesterFields) {
          if (firstRow[field]) {
            semester = String(firstRow[field]).trim();
            console.log(`✓ 從資料欄位提取學期：${semester}`);
            break;
          }
        }
      }
    }

    return { schoolYear, semester };
  }

  // 從檔案名稱提取學年度和學期
  private extractYearSemesterFromFileName(fileName: string): { schoolYear?: string, semester?: string } {
    alert(`=== 開始處理檔案名稱 ===\n檔案名稱: ${fileName}`);

    // 移除副檔名
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    alert(`移除副檔名後: ${nameWithoutExt}`);

    // 嘗試多種格式：
    // 1. 113_1_xxx 或 113-1-xxx 格式
    let match = nameWithoutExt.match(/^(\d{3})[_-](\d)/);
    if (match) {
      alert(`✓ 匹配成功！格式1 (113_1_xxx)\n學年度: ${match[1]}\n學期: ${match[2]}`);
      return {
        schoolYear: match[1],  // 前3碼
        semester: match[2]     // 第4碼
      };
    }

    // 2. 1131xxx 格式（連續4位數字開頭）
    match = nameWithoutExt.match(/^(\d{3})(\d)/);
    if (match) {
      alert(`✓ 匹配成功！格式2 (1131xxx)\n學年度: ${match[1]}\n學期: ${match[2]}`);
      return {
        schoolYear: match[1],  // 前3碼
        semester: match[2]     // 第4碼
      };
    }

    // 3. xxx_113_1 或 xxx-113-1 格式（中間位置）
    match = nameWithoutExt.match(/[_-](\d{3})[_-](\d)/);
    if (match) {
      alert(`✓ 匹配成功！格式3 (xxx_113_1)\n學年度: ${match[1]}\n學期: ${match[2]}`);
      return {
        schoolYear: match[1],  // 前3碼
        semester: match[2]     // 第4碼
      };
    }

    // 4. 嘗試找到任何3位數字後跟1位數字的組合
    match = nameWithoutExt.match(/(\d{3})(\d)/);
    if (match) {
      alert(`✓ 匹配成功！格式4 (任意位置的4位數字)\n學年度: ${match[1]}\n學期: ${match[2]}`);
      return {
        schoolYear: match[1],  // 前3碼
        semester: match[2]     // 第4碼
      };
    }

    alert(`✗ 匹配失敗！\n無法從檔案名稱「${fileName}」提取學年度和學期\n\n嘗試的格式:\n- 113_1_xxx\n- 113-1-xxx\n- 1131xxx\n- xxx_113_1\n- xxx-113-1\n- 任意位置的4位數字`);
    return {};
  }

  // 直接設置學年度和學期的固定值
  private setYearSemesterFromFileName(fileName: string) {
    alert(`開始設置學年度和學期固定值\n檔案名稱: ${fileName}`);

    const extracted = this.extractYearSemesterFromFileName(fileName);

    if (extracted.schoolYear) {
      // 設置學年度固定值
      const yearMapping: FieldMapping = {
        standardField: '學年度',
        sourceFields: [],
        useFixedValue: true,
        fixedValue: extracted.schoolYear
      };
      this.fieldMappings.set('學年度', yearMapping);
      alert(`✓ 設置學年度固定值: ${extracted.schoolYear}`);
    }

    if (extracted.semester) {
      // 設置學期固定值
      const semesterMapping: FieldMapping = {
        standardField: '學期',
        sourceFields: [],
        useFixedValue: true,
        fixedValue: extracted.semester
      };
      this.fieldMappings.set('學期', semesterMapping);
      alert(`✓ 設置學期固定值: ${extracted.semester}`);
    }

    // 保存映射配置
    this.saveCurrentFileMappings();

    // 強制觸發變更檢測
    this.cdr.detectChanges();

    alert(`學年度和學期設置完成！`);
  }

  // 讀取 Excel 檔案
  private async readExcelFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array", cellDates: true });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // 使用第一行作為表頭
          const excelData = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'HH:mm' });

          // 處理時間欄位：將 Excel 的小數時間格式轉換為 HH:mm
          const processedData = excelData.map((row: any) => {
            const processedRow: any = { ...row };
            Object.keys(processedRow).forEach(key => {
              const value = processedRow[key];
              // 檢查是否為時間小數（0-1 之間的小數，可能是時間）
              if (value !== null && value !== undefined) {
                const numValue = Number(value);
                // 如果是 0-1 之間的小數，且欄位名稱包含"時間"或"time"，則轉換為時間格式
                if (!isNaN(numValue) && numValue >= 0 && numValue < 1 &&
                  (key.includes('時間') || key.includes('時間') || key.toLowerCase().includes('time'))) {
                  processedRow[key] = this.convertExcelTimeToHHMM(numValue);
                } else if (typeof value === 'number' && numValue >= 0 && numValue < 1) {
                  // 如果值看起來像時間小數（0-1之間），嘗試轉換
                  // 但只在值看起來確實是時間時才轉換（避免誤判其他小數）
                  const timeStr = this.convertExcelTimeToHHMM(numValue);
                  // 如果轉換後看起來像有效時間，則使用轉換後的值
                  if (timeStr && /^\d{1,2}:\d{2}$/.test(timeStr)) {
                    processedRow[key] = timeStr;
                  }
                }
              }
            });
            return processedRow;
          });

          // 過濾空白行
          const filteredData = processedData.filter((row: any) => {
            return row && Object.values(row).some(value =>
              value !== null && value !== undefined && String(value).trim() !== ''
            );
          });

          resolve(filteredData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }

  // 將 Excel 時間小數轉換為 HH:mm 格式
  private convertExcelTimeToHHMM(excelTime: number): string {
    // Excel 時間：0 = 00:00:00, 0.5 = 12:00:00, 1 = 24:00:00
    const totalSeconds = Math.round(excelTime * 24 * 60 * 60);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // 初始化欄位映射（自動匹配相同名稱的欄位）
  initializeFieldMappings() {
    // 使用當前編輯檔案的欄位名稱
    const currentFileFields = this.fileFieldsMap.get(this.currentEditingFileName) || this.sourceFields;

    console.log('=== 初始化欄位映射 ===');
    console.log('當前編輯檔案:', this.currentEditingFileName);

    // 預處理來源欄位：去除前後空格
    const normalizedFileFields = currentFileFields.map(f => ({
      original: f,
      normalized: f ? f.trim().toLowerCase() : ''
    }));

    STANDARD_FIELDS.forEach(field => {
      // 根據匯入模式過濾欄位
      if (field.mode !== 'both' && field.mode !== this.importMode) {
        return;
      }

      // 取得現有的映射配置
      let mapping: FieldMapping;
      if (this.fieldMappings.has(field.key)) {
        mapping = this.fieldMappings.get(field.key)!;
        // 如果已經有有效的來源欄位或固定值，不覆蓋
        const hasValidSourceFields = mapping.sourceFields && mapping.sourceFields.length > 0 &&
          mapping.sourceFields.some(f => f && f.trim() !== '');
        const hasFixedValue = mapping.useFixedValue && mapping.fixedValue &&
          mapping.fixedValue.trim() !== '';
        if (hasValidSourceFields || hasFixedValue) {
          return; // 已經有設定，不覆蓋
        }
      } else {
        // 如果沒有映射配置，創建新的
        mapping = {
          standardField: field.key,
          sourceFields: [''] // 預設空選項
        };
      }

      // 1. 自動匹配相同名稱的欄位（精確匹配）
      let matchedField = currentFileFields.find(sf => sf === field.key);

      // 2. 如果精確匹配失敗，嘗試模糊匹配（去除空格、大小寫不敏感）
      if (!matchedField) {
        const found = normalizedFileFields.find(nf => nf.normalized === field.key.trim().toLowerCase());
        if (found) {
          matchedField = found.original;
        }
      }

      // 3. 如果還是沒找到，嘗試部分匹配（針對常見的欄位名稱變體）
      if (!matchedField) {
        matchedField = this.findFieldByAliasForFields(field.key, currentFileFields);
      }

      // 特殊處理：學年度和學期優先嘗試從檔案名稱提取
      if ((field.key === '學年度' || field.key === '學期') && this.currentEditingFileName) {
        const extracted = this.extractYearSemesterFromFileName(this.currentEditingFileName);
        let extractedValue = '';

        if (field.key === '學年度' && extracted.schoolYear) {
          extractedValue = extracted.schoolYear;
        } else if (field.key === '學期' && extracted.semester) {
          extractedValue = extracted.semester;
        }

        if (extractedValue) {
          // 設置為固定值
          mapping.useFixedValue = true;
          mapping.fixedValue = extractedValue;
          mapping.sourceFields = []; // 清空來源欄位
          this.fieldMappings.set(field.key, mapping);
          return; // 跳過後續的欄位匹配邏輯
        }
      }

      // 如果找到匹配的欄位，自動設定為來源欄位
      if (matchedField && matchedField.trim().length > 0) {
        mapping.sourceFields = [matchedField.trim()];
        console.log(`✓ 自動匹配：${field.key} → ${matchedField}`);
      } else {
        // 如果沒有找到匹配，確保有默認的空選項
        if (!mapping.sourceFields || mapping.sourceFields.length === 0) {
          mapping.sourceFields = [''];
        }
      }

      this.fieldMappings.set(field.key, mapping);
    });

    // 立即保存到當前檔案的映射配置
    this.saveCurrentFileMappings();

    // 強制觸發變更檢測
    this.cdr.detectChanges();
  }

  // 根據別名查找欄位（使用指定的欄位列表）
  private findFieldByAliasForFields(standardField: string, fields: string[]): string | undefined {
    const aliasMap: Record<string, string[]> = {
      '班級': ['班級', 'class', 'Class', 'CLASS'],
      '座號': ['座號', '座号', 'seat', 'Seat', 'SEAT', '座位號', '座位号'],
      '學號': ['學號', '学号', 'student_id', 'StudentID', 'student_number', 'StudentNumber', '學號', '学号'],
      '姓名': ['姓名', 'name', 'Name', 'NAME', '學生姓名', '学生姓名'],
      '日期': ['日期', 'date', 'Date', 'DATE', '晤談日期', '晤谈日期', '日期時間', '日期时间'],
      '時間': ['時間', '时间', 'time', 'Time', 'TIME', '晤談時間', '晤谈时间'],
      '晤談時間': ['晤談時間', '晤谈时间', '時間', '时间', 'time', 'Time', 'TIME'],
      '教師': ['教師', '教师', 'teacher', 'Teacher', 'TEACHER', '老師', '老师', '記錄者', '记录者'],
      '記錄者': ['記錄者', '记录者', '教師', '教师', 'teacher', 'Teacher', '老師', '老师', 'author', 'Author'],
      '受訪者': ['受訪者', '受访者', '對象', '对象', 'contact', 'Contact', 'CONTACT', '受訪對象', '受访对象'],
      '對象': ['對象', '对象', '受訪者', '受访者', 'contact', 'Contact', 'CONTACT', '受訪對象', '受访对象'],
      '方式': ['方式', 'method', 'Method', 'METHOD', '晤談方式', '晤谈方式', '聯絡方式', '联络方式'],
      '重點': ['重點', '重点', 'key_point', 'KeyPoint', 'keypoint', 'KEY_POINT'],
      '摘要一': ['摘要一', '摘要1', 'summary1', 'Summary1', 'SUMMARY1', '摘要', 'summary'],
      '摘要二': ['摘要二', '摘要2', 'summary2', 'Summary2', 'SUMMARY2'],
      '摘要三': ['摘要三', '摘要3', 'summary3', 'Summary3', 'SUMMARY3'],
      '聯絡事項': ['聯絡事項', '联络事项', 'contact_item', 'ContactItem', 'CONTACT_ITEM', '聯絡內容', '联络内容'],
      '輔導內容': ['輔導內容', '辅导内容', 'content', 'Content', 'CONTENT', '輔導', '辅导'],
    };

    const aliases = aliasMap[standardField] || [];

    for (const alias of aliases) {
      const found = fields.find(sf => {
        const normalizedSource = sf.trim().toLowerCase();
        const normalizedAlias = alias.trim().toLowerCase();
        return normalizedSource === normalizedAlias || normalizedSource.includes(normalizedAlias) || normalizedAlias.includes(normalizedSource);
      });
      if (found) {
        return found;
      }
    }

    return undefined;
  }

  // 根據別名查找欄位（處理常見的欄位名稱變體）
  private findFieldByAlias(standardField: string): string | undefined {
    const aliasMap: Record<string, string[]> = {
      '班級': ['班級', 'class', 'Class', 'CLASS'],
      '座號': ['座號', '座号', 'seat', 'Seat', 'SEAT', '座位號', '座位号'],
      '學號': ['學號', '学号', 'student_id', 'StudentID', 'student_number', 'StudentNumber', '學號', '学号'],
      '姓名': ['姓名', 'name', 'Name', 'NAME', '學生姓名', '学生姓名'],
      '日期': ['日期', 'date', 'Date', 'DATE', '晤談日期', '晤谈日期', '日期時間', '日期时间'],
      '時間': ['時間', '时间', 'time', 'Time', 'TIME', '晤談時間', '晤谈时间'],
      '晤談時間': ['晤談時間', '晤谈时间', '時間', '时间', 'time', 'Time', 'TIME'],
      '教師': ['教師', '教师', 'teacher', 'Teacher', 'TEACHER', '老師', '老师', '記錄者', '记录者'],
      '記錄者': ['記錄者', '记录者', '教師', '教师', 'teacher', 'Teacher', '老師', '老师', 'author', 'Author'],
      '受訪者': ['受訪者', '受访者', '對象', '对象', 'contact', 'Contact', 'CONTACT', '受訪對象', '受访对象'],
      '對象': ['對象', '对象', '受訪者', '受访者', 'contact', 'Contact', 'CONTACT', '受訪對象', '受访对象'],
      '方式': ['方式', 'method', 'Method', 'METHOD', '晤談方式', '晤谈方式', '聯絡方式', '联络方式'],
      '重點': ['重點', '重点', 'key_point', 'KeyPoint', 'keypoint', 'KEY_POINT'],
      '摘要一': ['摘要一', '摘要1', 'summary1', 'Summary1', 'SUMMARY1', '摘要', 'summary'],
      '摘要二': ['摘要二', '摘要2', 'summary2', 'Summary2', 'SUMMARY2'],
      '摘要三': ['摘要三', '摘要3', 'summary3', 'Summary3', 'SUMMARY3'],
      '聯絡事項': ['聯絡事項', '联络事项', 'contact_item', 'ContactItem', 'CONTACT_ITEM', '聯絡內容', '联络内容'],
      '輔導內容': ['輔導內容', '辅导内容', 'content', 'Content', 'CONTENT', '輔導', '辅导'],
    };

    const aliases = aliasMap[standardField] || [];

    for (const alias of aliases) {
      const found = this.sourceFields.find(sf => {
        const normalizedSource = sf.trim().toLowerCase();
        const normalizedAlias = alias.trim().toLowerCase();
        return normalizedSource === normalizedAlias || normalizedSource.includes(normalizedAlias) || normalizedAlias.includes(normalizedSource);
      });
      if (found) {
        return found;
      }
    }

    return undefined;
  }

  // 取得系統標準欄位（根據匯入模式過濾）
  getStandardFields() {
    return STANDARD_FIELDS.filter(field => {
      if (field.mode === 'both') return true;
      return field.mode === this.importMode;
    });
  }

  // 取得欄位映射配置
  getFieldMapping(standardField: string): FieldMapping {
    if (!this.fieldMappings.has(standardField)) {
      // console.log(`創建新的映射配置: ${standardField}`);
      this.fieldMappings.set(standardField, {
        standardField: standardField,
        sourceFields: [''] // 預設給一個空選項，確保 UI 顯示下拉選單
      });
    }
    const mapping = this.fieldMappings.get(standardField)!;

    // 安全檢查：如果沒有設定固定值且 sourceFields 為空，自動補一個空選項
    // 這避免了 UI 渲染錯誤或無法顯示下拉選單的問題
    if (!mapping.useFixedValue && (!mapping.sourceFields || mapping.sourceFields.length === 0)) {
      mapping.sourceFields = [''];
      this.fieldMappings.set(standardField, mapping);
      console.log(`自動修復空 sourceFields: ${standardField}`);
    }

    return mapping;
  }

  // 設定欄位映射
  setFieldMapping(standardField: string, sourceField: string, index: number = 0) {
    console.log(`設定欄位映射: ${standardField} → ${sourceField} (index: ${index})`);
    debugger;
    const mapping = this.getFieldMapping(standardField);
    if (!mapping.sourceFields) {
      mapping.sourceFields = [];
    }
    mapping.sourceFields[index] = sourceField;
    this.fieldMappings.set(standardField, mapping);
    console.log(`設定後的映射:`, this.fieldMappings.get(standardField));
    // 自動保存到當前檔案的映射配置
    this.saveCurrentFileMappings();
  }

  // 新增合併欄位
  addMergeField(standardField: string) {
    const mapping = this.getFieldMapping(standardField);
    if (!mapping.sourceFields) {
      mapping.sourceFields = [];
    }
    mapping.sourceFields.push('');
    this.fieldMappings.set(standardField, mapping);
    // 自動保存到當前檔案的映射配置
    this.saveCurrentFileMappings();
  }

  // 移除合併欄位
  removeMergeField(standardField: string, index: number) {
    const mapping = this.getFieldMapping(standardField);
    if (mapping.sourceFields && mapping.sourceFields.length > index) {
      mapping.sourceFields.splice(index, 1);
      this.fieldMappings.set(standardField, mapping);
      // 自動保存到當前檔案的映射配置
      this.saveCurrentFileMappings();
    }
  }

  // 檢查是否有來源欄位（用於判斷是否禁用固定值）
  hasSourceFields(standardField: string): boolean {
    const mapping = this.getFieldMapping(standardField);
    return mapping.sourceFields && mapping.sourceFields.length > 0 &&
      mapping.sourceFields.some(f => f && f.trim() !== '');
  }

  // 清除來源欄位（當設定固定值時）
  clearSourceFields(standardField: string) {
    const mapping = this.getFieldMapping(standardField);
    mapping.sourceFields = [];
    mapping.valueMappings = [];
    this.fieldMappings.set(standardField, mapping);
  }

  // 固定值下拉選單變更事件
  onFixedValueChange(standardField: string, event: any) {
    const value = event.target.value;
    const mapping = this.getFieldMapping(standardField);

    if (value && value.trim() !== '') {
      mapping.fixedValue = value.trim();
      mapping.useFixedValue = true; // 自動勾選使用固定值
      mapping.sourceFields = [];
      mapping.valueMappings = [];
    } else {
      mapping.fixedValue = undefined;
      mapping.useFixedValue = false; // 自動取消勾選
    }

    this.fieldMappings.set(standardField, mapping);
    // 自動保存到當前檔案的映射配置
    this.saveCurrentFileMappings();
  }

  // 設定固定值
  setFixedValue(standardField: string, value: string) {
    debugger
    const mapping = this.getFieldMapping(standardField);
    // 清除來源欄位映射（固定值和來源欄位互斥）
    if (value && value.trim() !== '') {
      mapping.fixedValue = value.trim();
      mapping.useFixedValue = true; // 自動勾選使用固定值
      mapping.sourceFields = [];
      mapping.valueMappings = [];
    } else {
      // 如果選擇空值，清除固定值
      mapping.fixedValue = undefined;
      mapping.useFixedValue = false; // 自動取消勾選
    }
    this.fieldMappings.set(standardField, mapping);
    // 自動保存到當前檔案的映射配置
    this.saveCurrentFileMappings();
  }

  // 是否使用固定值變更事件
  onUseFixedValueChange(standardField: string, checked: boolean) {
    const mapping = this.getFieldMapping(standardField);
    mapping.useFixedValue = checked;

    // 如果取消勾選，清除固定值
    if (!checked) {
      mapping.fixedValue = undefined;
    }

    // 如果勾選使用固定值，清除來源欄位映射
    if (checked) {
      mapping.sourceFields = [];
      mapping.valueMappings = [];
    }

    this.fieldMappings.set(standardField, mapping);
    // 自動保存到當前檔案的映射配置
    this.saveCurrentFileMappings();
  }

  // 清除固定值
  clearFixedValue(standardField: string) {
    const mapping = this.getFieldMapping(standardField);
    mapping.fixedValue = undefined;
    this.fieldMappings.set(standardField, mapping);
    // 自動保存到當前檔案的映射配置
    this.saveCurrentFileMappings();
  }

  // 取得欄位的值映射列表
  getValueMappings(standardField: string): ValueMapping[] {
    const mapping = this.getFieldMapping(standardField);
    if (!mapping.valueMappings) {
      mapping.valueMappings = [];
    }
    return mapping.valueMappings;
  }

  // 新增值映射規則
  addValueMapping(standardField: string) {
    const mapping = this.getFieldMapping(standardField);
    if (!mapping.valueMappings) {
      mapping.valueMappings = [];
    }
    mapping.valueMappings.push({ sourceValue: '', targetValue: '' });
    this.fieldMappings.set(standardField, mapping);
    // 自動保存到當前檔案的映射配置
    this.saveCurrentFileMappings();
  }

  // 移除值映射規則
  removeValueMapping(standardField: string, index: number) {
    const mapping = this.getFieldMapping(standardField);
    if (mapping.valueMappings && mapping.valueMappings.length > index) {
      mapping.valueMappings.splice(index, 1);
      this.fieldMappings.set(standardField, mapping);
      // 自動保存到當前檔案的映射配置
      this.saveCurrentFileMappings();
    }
  }

  // 更新值映射規則
  updateValueMapping(standardField: string, index: number, sourceValue: string, targetValue: string) {
    const mapping = this.getFieldMapping(standardField);
    if (mapping.valueMappings && mapping.valueMappings.length > index) {
      mapping.valueMappings[index].sourceValue = sourceValue;
      mapping.valueMappings[index].targetValue = targetValue;
      this.fieldMappings.set(standardField, mapping);
      // 自動保存到當前檔案的映射配置
      this.saveCurrentFileMappings();
    }
  }

  // 取得欄位的固定選項值（如果有）
  getAllowedValuesForField(fieldKey: string): string[] | null {
    return FIELD_ALLOWED_VALUES[fieldKey] || null;
  }

  // 檢查欄位是否有固定選項值
  hasAllowedValues(fieldKey: string): boolean {
    return FIELD_ALLOWED_VALUES.hasOwnProperty(fieldKey);
  }

  // 自動偵測欄位的唯一值（用於建議值映射）
  getUniqueValuesForField(sourceField: string): string[] {
    if (!sourceField || !this.currentEditingFileName) {
      return [];
    }

    // 使用當前編輯檔案的資料
    const currentFileData = this.fileDataMap.get(this.currentEditingFileName) || [];
    if (currentFileData.length === 0) {
      return [];
    }

    const values = new Set<string>();
    currentFileData.forEach(row => {
      const value = row[sourceField];
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        values.add(String(value).trim());
      }
    });

    return Array.from(values).sort();
  }

  // 取得未點擊的唯一值（過濾已點擊的）
  getUnclickedUniqueValues(fieldKey: string, sourceField: string): string[] {
    const allValues = this.getUniqueValuesForField(sourceField);
    const clickedSet = this.clickedUniqueValues.get(fieldKey) || new Set();
    return allValues.filter(value => !clickedSet.has(value));
  }

  // 標記唯一值為已點擊
  markUniqueValueAsClicked(fieldKey: string, uniqueValue: string) {
    if (!this.clickedUniqueValues.has(fieldKey)) {
      this.clickedUniqueValues.set(fieldKey, new Set());
    }
    this.clickedUniqueValues.get(fieldKey)!.add(uniqueValue);
  }

  // 檢查唯一值是否已被點擊
  isUniqueValueClicked(fieldKey: string, uniqueValue: string): boolean {
    const clickedSet = this.clickedUniqueValues.get(fieldKey);
    return clickedSet ? clickedSet.has(uniqueValue) : false;
  }

  // 設定合併方式
  setMergeType(standardField: string, type: 'concat' | 'formula', separator: string = ' ') {
    const mapping = this.getFieldMapping(standardField);
    mapping.mergeType = type;
    mapping.mergeSeparator = separator;
    this.fieldMappings.set(standardField, mapping);
    // 自動保存到當前檔案的映射配置
    this.saveCurrentFileMappings();
  }

  // 轉換單一資料列（使用指定的映射配置）
  private transformSingleRow(sourceRow: any, mappingConfig: Map<string, FieldMapping>, fileSchoolYear?: string, fileSemester?: string): any {
    const transformedRow: any = {};

    // 遍歷所有標準欄位
    this.getStandardFields().forEach(field => {
      // 從指定的映射配置中取得映射
      let mapping: FieldMapping;
      if (mappingConfig.has(field.key)) {
        mapping = mappingConfig.get(field.key)!;
      } else {
        mapping = {
          standardField: field.key,
          sourceFields: []
        };
      }

      // 如果使用固定值且有設定固定值，直接使用
      if (mapping.useFixedValue && mapping.fixedValue) {
        transformedRow[field.key] = mapping.fixedValue;
        return; // 繼續處理下一個欄位
      }

      // 特殊處理：學年度和學期（如果檔案中有識別到，優先使用）
      if (field.key === '學年度' && fileSchoolYear) {
        transformedRow[field.key] = fileSchoolYear;
        return; // 繼續處理下一個欄位
      }
      if (field.key === '學期' && fileSemester) {
        transformedRow[field.key] = fileSemester;
        return; // 繼續處理下一個欄位
      }

      // 如果有來源欄位映射
      if (mapping.sourceFields && mapping.sourceFields.length > 0) {
        const validFields = mapping.sourceFields.filter(f => f && f.trim() !== '');

        if (validFields.length === 0) {
          transformedRow[field.key] = '';
          return;
        }

        // 單一欄位映射
        if (validFields.length === 1) {
          let value = sourceRow[validFields[0]] || '';
          // 應用值映射（如果有的話）
          value = this.applyValueMapping(field.key, value, mappingConfig);
          // 應用特殊轉換（日期、值轉換等）
          value = this.applySpecialTransform(field.key, value, sourceRow);
          // 座號特殊處理：如果是數字類型，去除前導零（如 "01" → "1"）
          if (field.key === '座號') {
            value = this.normalizeSeatNo(value);
          }
          transformedRow[field.key] = value;
        }
        // 多欄位合併（如：摘要一、摘要二、摘要三 → 聯絡事項）
        else {
          const values = validFields.map(f => {
            let val = sourceRow[f] || '';
            // 過濾空白值，但保留有內容的值
            return val && String(val).trim() !== '' ? String(val).trim() : null;
          }).filter(v => v !== null);

          let mergedValue = '';
          if (mapping.mergeType === 'formula' && mapping.formula) {
            // 使用公式合併（未來擴展）
            mergedValue = this.applyFormula(mapping.formula, validFields, sourceRow);
          } else {
            // 使用分隔符連接（預設用換行或空格）
            const separator = mapping.mergeSeparator || '\n';
            mergedValue = values.join(separator);
          }

          // 應用值映射（如果有的話）
          mergedValue = this.applyValueMapping(field.key, mergedValue, mappingConfig);
          transformedRow[field.key] = mergedValue;
        }

        // 應用轉換函數（如果有）
        if (mapping.transform) {
          transformedRow[field.key] = mapping.transform(transformedRow[field.key]);
        }
      } else {
        transformedRow[field.key] = '';
      }
    });

    return transformedRow;
  }

  // 驗證學生匹配
  private validateStudentMatch(row: any): { matched: boolean; studentID?: string; studentName?: string; studentStatus?: string; error?: string } {
    const className = (row['班級'] || '').toString().trim();
    // 座號需要正規化（去除前導零）以便匹配
    const seatNo = this.normalizeSeatNo(row['座號']);
    const studentNumber = (row['學號'] || '').toString().trim();
    const status = (row['狀態'] || '').toString().trim();

    // 狀態轉換：中文狀態 → 系統代碼
    const statusMapping: Record<string, string> = { "一般": "1", "延修": "2", "休學": "4", "畢業或離校": "16" };

    // 處理多個狀態值（逗號分隔）
    let statusCodes: string[] = [];
    if (status && status !== '-' && status !== '') {
      // 分割多個狀態值（支援中文逗號和英文逗號）
      const statusValues = status.split(/[,，]/).map(s => s.trim()).filter(s => s !== '');
      statusCodes = statusValues.map(s => statusMapping[s] || s);
    }

    let foundStudents: any[] = [];

    // 根據匯入模式進行匹配
    if (this.importMode === 'byStudentId') {
      // 按學號匹配（不考慮狀態）
      if (studentNumber) {
        // 正規化學號（去除空格，轉為字串）
        const normalizedStudentNumber = String(studentNumber).trim();
        foundStudents = this.studentList.filter(s => {
          const systemStudentNumber = s.StudentNumber ? String(s.StudentNumber).trim() : '';
          return systemStudentNumber === normalizedStudentNumber;
        });

        // 調試：如果找不到，輸出調試信息
        if (foundStudents.length === 0) {
          console.warn(`找不到學號「${normalizedStudentNumber}」的學生`);
          console.log(`學生清單中是否有相似學號:`, this.studentList
            .filter(s => {
              const sysNum = s.StudentNumber ? String(s.StudentNumber).trim() : '';
              return sysNum.includes(normalizedStudentNumber) || normalizedStudentNumber.includes(sysNum);
            })
            .slice(0, 5)
            .map(s => ({ StudentNumber: s.StudentNumber, StudentName: s.StudentName, Status: s.Status }))
          );
        }
      }
    } else {
      // 按班級+座號+狀態匹配
      if (className && seatNo) {
        // 如果狀態為空或"-"，則只匹配班級+座號
        if (statusCodes.length === 0) {
          foundStudents = this.studentList.filter(s => {
            const studentClassName = (s.ClassName || '').toString();
            // 系統中的座號也需要正規化以便匹配
            const studentSeatNo = this.normalizeSeatNo(s.SeatNo);
            return studentClassName === className &&
              studentSeatNo === seatNo;
          });
        } else {
          // 如果有多個狀態值，匹配所有符合的學生
          foundStudents = this.studentList.filter(s => {
            const studentClassName = (s.ClassName || '').toString();
            // 系統中的座號也需要正規化以便匹配
            const studentSeatNo = this.normalizeSeatNo(s.SeatNo);
            const studentStatus = (s.Status || '').toString();
            return studentClassName === className &&
              studentSeatNo === seatNo &&
              statusCodes.includes(studentStatus);
          });
        }
      }
    }

    // 檢查是否匹配到多個學生（如果狀態有多個值且匹配到多個學生，報錯）
    // 注意：按學號匹配時不考慮狀態，所以這裡只檢查按班級+座號的情況
    if (this.importMode !== 'byStudentId' && statusCodes.length > 1 && foundStudents.length > 1) {
      const studentNames = foundStudents.map(s => s.StudentName || '未知').join('、');
      const errorMsg = `班級「${className}」座號「${seatNo}」對應到多個學生（${studentNames}），請確認狀態值`;
      return {
        matched: false,
        error: errorMsg
      };
    }

    // 按學號匹配時，如果匹配到多個學生，也報錯
    if (this.importMode === 'byStudentId' && foundStudents.length > 1) {
      const studentNames = foundStudents.map(s => s.StudentName || '未知').join('、');
      const errorMsg = `學號「${studentNumber}」對應到多個學生（${studentNames}），請確認學號是否正確`;
      return {
        matched: false,
        error: errorMsg
      };
    }

    // 如果只匹配到一個學生，返回成功
    if (foundStudents.length === 1) {
      const foundStudent = foundStudents[0];
      // 狀態轉換：系統代碼 → 中文狀態
      const statusCodeToText: Record<string, string> = { "1": "一般", "2": "延修", "4": "休學", "16": "畢業或離校" };
      const studentStatusCode = (foundStudent.Status || '').toString();
      const studentStatusText = statusCodeToText[studentStatusCode] || studentStatusCode || '';

      return {
        matched: true,
        studentID: foundStudent.StudentID,
        studentName: foundStudent.StudentName,
        studentStatus: studentStatusText
      };
    }

    // 如果沒有匹配到學生，返回錯誤
    if (foundStudents.length === 0) {
      let errorMsg = '';
      if (this.importMode === 'byStudentId') {
        if (!studentNumber) {
          errorMsg = '學號欄位為空';
        } else {
          errorMsg = `找不到學號「${studentNumber}」的學生`;
        }
      } else {
        if (!className || !seatNo) {
          if (!className && !seatNo) {
            errorMsg = '班級和座號欄位為空';
          } else if (!className) {
            errorMsg = '班級欄位為空';
          } else {
            errorMsg = '座號欄位為空';
          }
        } else if (statusCodes.length === 0) {
          errorMsg = `找不到班級「${className}」座號「${seatNo}」的學生`;
        } else {
          const statusText = status.split(/[,，]/).map(s => s.trim()).join('、');
          errorMsg = `找不到班級「${className}」座號「${seatNo}」且狀態「${statusText}」的學生`;
        }
      }
      // 添加更詳細的錯誤信息
      const classMatches = this.studentList.filter(s => (s.ClassName || '').toString() === className);
      if (classMatches.length === 0 && className) {
        const availableClasses = [...new Set(this.studentList.map(s => s.ClassName))].filter(c => c).sort().join('、');
        if (availableClasses) {
          errorMsg += ` (系統中無此班級「${className}」。可用班級：${availableClasses})`;
        } else {
          errorMsg += ` (系統中無此班級「${className}」)`;
        }
      } else if (seatNo && classMatches.length > 0) {
        const seatMatchesInClass = classMatches.filter(s => this.normalizeSeatNo(s.SeatNo) === seatNo);
        if (seatMatchesInClass.length === 0) {
          const availableSeatsInClass = [...new Set(classMatches.map(s => this.normalizeSeatNo(s.SeatNo)))].filter(s => s).sort((a, b) => parseInt(a) - parseInt(b)).join('、');
          if (availableSeatsInClass) {
            errorMsg += ` (班級「${className}」中無此座號「${seatNo}」。該班級可用座號：${availableSeatsInClass})`;
          } else {
            errorMsg += ` (班級「${className}」中無此座號「${seatNo}」)`;
          }
        } else if (statusCodes.length > 0) {
          const statusMatchesInClassSeat = seatMatchesInClass.filter(s => {
            const studentStatus = (s.Status || '').toString();
            return statusCodes.includes(studentStatus);
          });
          if (statusMatchesInClassSeat.length === 0) {
            const availableStatusesInClassSeat = [...new Set(seatMatchesInClass.map(s => {
              const sStatus = (s.Status || '').toString();
              const statusText = Object.keys(statusMapping).find(k => statusMapping[k] === sStatus) || sStatus;
              return statusText;
            }))].filter(s => s).sort().join('、');
            const statusText = status.split(/[,，]/).map(s => s.trim()).join('、');
            if (availableStatusesInClassSeat) {
              errorMsg += ` (班級「${className}」座號「${seatNo}」無此狀態「${statusText}」。該學生可用狀態：${availableStatusesInClassSeat})`;
            } else {
              errorMsg += ` (班級「${className}」座號「${seatNo}」無此狀態「${statusText}」)`;
            }
          }
        }
      }
      return {
        matched: false,
        error: errorMsg
      };
    }
  }

  // 驗證教師匹配
  private validateTeacherMatch(row: any): { matched: boolean; teacherID?: string; teacherName?: string; error?: string; warning?: string } {
    const authorName = (row['記錄者'] || '').toString().trim();
    const nickname = (row['暱稱'] || '').toString().trim();

    if (!authorName) {
      return {
        matched: false,
        error: '記錄者欄位為空'
      };
    }

    // 查找匹配的教師
    let matchedTeachers = this.teacherList.filter(t =>
      t.Name === authorName || t.NickName === authorName
    );

    if (matchedTeachers.length === 0) {
      return {
        matched: false,
        error: `找不到名為「${authorName}」的教師`
      };
    }

    if (matchedTeachers.length === 1) {
      // 唯一匹配
      const teacher = matchedTeachers[0];
      // 如果有暱稱，檢查是否匹配
      if (nickname && teacher.NickName && teacher.NickName !== nickname) {
        return {
          matched: false,
          error: `教師「${authorName}」的暱稱不匹配（系統：${teacher.NickName}，Excel：${nickname}）`
        };
      }
      return {
        matched: true,
        teacherID: teacher.ID,
        teacherName: teacher.Name
      };
    } else {
      // 多個同名教師
      if (nickname) {
        // 有提供暱稱，嘗試精確匹配
        const exactMatch = matchedTeachers.find(t => t.NickName === nickname);
        if (exactMatch) {
          return {
            matched: true,
            teacherID: exactMatch.ID,
            teacherName: exactMatch.Name
          };
        } else {
          const possibleNicknames = matchedTeachers.map(t => t.NickName || '無').join('、');
          return {
            matched: false,
            error: `有多位名為「${authorName}」的教師，但暱稱「${nickname}」不匹配`,
            warning: `可能的暱稱：${possibleNicknames}`
          };
        }
      } else {
        // 沒有提供暱稱，但有多個同名教師
        const possibleNicknames = matchedTeachers.map(t => t.NickName || '無').join('、');
        return {
          matched: false,
          error: `有多位名為「${authorName}」的教師，需要提供暱稱`,
          warning: `可能的暱稱：${possibleNicknames}`
        };
      }
    }
  }

  // 檢查必填欄位是否已設定
  validateRequiredFields(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const standardFields = this.getStandardFields();

    // 檢查當前編輯的檔案
    const currentFileMapping = this.fileMappingsMap.get(this.currentEditingFileName) || this.fieldMappings;

    standardFields.forEach(field => {
      // 根據匯入模式過濾必填欄位
      if (field.required) {
        // 如果欄位有 mode 屬性，需要檢查是否符合當前匯入模式
        if (field.mode && field.mode !== 'both') {
          if (field.mode !== this.importMode) {
            // 此欄位不符合當前匯入模式，跳過檢查
            return;
          }
        }

        const mapping = currentFileMapping.get(field.key) || this.getFieldMapping(field.key);

        // 檢查是否有設定固定值或來源欄位
        const hasFixedValue = mapping.useFixedValue && mapping.fixedValue && mapping.fixedValue.trim() !== '';
        const hasSourceField = mapping.sourceFields && mapping.sourceFields.length > 0 &&
          mapping.sourceFields.some(f => f && f.trim() !== '');

        if (!hasFixedValue && !hasSourceField) {
          errors.push(`「${field.key}」為必填欄位，請設定固定值或選擇來源欄位`);
        }
      }
    });

    // 檢查所有檔案的映射配置（如果是多檔案）
    if (this.fileMappingsMap.size > 1) {
      this.fileMappingsMap.forEach((fileMapping, fileName) => {
        standardFields.forEach(field => {
          if (field.required) {
            // 根據匯入模式過濾必填欄位
            if (field.mode && field.mode !== 'both') {
              if (field.mode !== this.importMode) {
                // 此欄位不符合當前匯入模式，跳過檢查
                return;
              }
            }

            const mapping = fileMapping.get(field.key);
            if (mapping) {
              const hasFixedValue = mapping.useFixedValue && mapping.fixedValue && mapping.fixedValue.trim() !== '';
              const hasSourceField = mapping.sourceFields && mapping.sourceFields.length > 0 &&
                mapping.sourceFields.some(f => f && f.trim() !== '');

              if (!hasFixedValue && !hasSourceField) {
                errors.push(`檔案「${fileName}」的「${field.key}」為必填欄位，請設定固定值或選擇來源欄位`);
              }
            } else {
              errors.push(`檔案「${fileName}」的「${field.key}」為必填欄位，請設定固定值或選擇來源欄位`);
            }
          }
        });
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // 轉換資料（使用每個檔案各自的映射配置）
  transformData() {
    if (this.fileDataMap.size === 0) {
      alert('請先上傳 Excel 檔案');
      return;
    }

    // 保存當前檔案的映射配置
    this.saveCurrentFileMappings();

    // 驗證必填欄位
    const validation = this.validateRequiredFields();
    if (!validation.valid) {
      const errorMessage = '以下必填欄位尚未設定：\n\n' + validation.errors.join('\n');
      alert(errorMessage);
      return;
    }

    this.transformedData = [];

    // 分別處理每個檔案，使用各自的映射配置
    this.fileDataMap.forEach((fileData, fileName) => {
      // 取得該檔案的映射配置
      const fileMapping = this.fileMappingsMap.get(fileName) || new Map<string, FieldMapping>();

      // 識別該檔案的學年度和學期（優先從檔案名稱提取）
      const { schoolYear, semester } = this.detectSchoolYearAndSemester(fileData, fileName);

      // 使用該檔案的映射配置轉換資料
      const transformedFileData = fileData.map((sourceRow) => {
        const transformedRow = this.transformSingleRow(sourceRow, fileMapping, schoolYear, semester);

        // 保存原始資料列（用於錯誤報告）
        transformedRow['_sourceRow'] = sourceRow;

        // 驗證學生匹配
        const studentMatch = this.validateStudentMatch(transformedRow);
        transformedRow['_studentMatch'] = studentMatch;

        // 如果學生匹配成功，且狀態欄位為空或未設定，則使用系統中對照出來的狀態
        if (studentMatch && studentMatch.matched && studentMatch.studentStatus) {
          const currentStatus = (transformedRow['狀態'] || '').toString().trim();
          if (!currentStatus || currentStatus === '' || currentStatus === '-') {
            transformedRow['狀態'] = studentMatch.studentStatus;
          }
        }

        // 驗證教師匹配
        const teacherMatch = this.validateTeacherMatch(transformedRow);
        transformedRow['_teacherMatch'] = teacherMatch;

        // 驗證日期格式 (yyyy/mm/dd)
        const dateValue = (transformedRow['日期'] || '').toString().trim();
        if (dateValue) {
          // 支援 yyyy/mm/dd 和 yyyy/m/d 格式
          const dateRegex = /^\d{4}\/\d{1,2}\/\d{1,2}$/;
          if (!dateRegex.test(dateValue)) {
            transformedRow['_dateMatch'] = {
              matched: false,
              error: `日期格式錯誤（需為 yyyy/mm/dd，如：2024/09/02），當前值：${dateValue}`
            };
          } else {
            // 進一步驗證是否為有效日期
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) {
              transformedRow['_dateMatch'] = {
                matched: false,
                error: `日期無效，當前值：${dateValue}`
              };
            } else {
              transformedRow['_dateMatch'] = { matched: true };
            }
          }
        } else {
          // 日期為空，如果日期是必填欄位，這裡可以標記錯誤，或者交由必填欄位檢查處理
          // 根據 STANDARD_FIELDS 定義，日期是必填的
          transformedRow['_dateMatch'] = {
            matched: false,
            error: '日期欄位為空'
          };
        }

        // 驗證狀態欄位
        const statusValue = (transformedRow['狀態'] || '').toString().trim();
        const allowedStatuses = ['一般', '延修', '休學', '畢業或離校'];
        if (!statusValue) {
          transformedRow['_statusMatch'] = { matched: false, error: '狀態欄位為空' };
        } else {
          // 處理多個狀態值（逗號分隔）
          const statusValues = statusValue.split(/[,，]/).map(s => s.trim()).filter(s => s !== '');
          const invalidStatuses = statusValues.filter(s => !allowedStatuses.includes(s));
          if (invalidStatuses.length > 0) {
            transformedRow['_statusMatch'] = {
              matched: false,
              error: `狀態值無效（需為「一般」、「延修」、「休學」或「畢業或離校」），當前值：${statusValue}`
            };
          } else {
            transformedRow['_statusMatch'] = { matched: true };
          }
        }

        // 調試：確保錯誤信息存在
        if (studentMatch && !studentMatch.matched && !studentMatch.error) {
          console.warn('學生匹配失敗但無錯誤信息:', transformedRow);
          studentMatch.error = '匹配失敗（未知錯誤）';
        }
        if (teacherMatch && !teacherMatch.matched && !teacherMatch.error) {
          console.warn('教師匹配失敗但無錯誤信息:', transformedRow);
          teacherMatch.error = '匹配失敗（未知錯誤）';
        }

        return transformedRow;
      });

      // 合併到總資料中
      this.transformedData = this.transformedData.concat(transformedFileData);
    });

    // 進入預覽步驟
    this.step = 'preview';
  }

  // 應用值映射（將來源值映射到目標值）
  private applyValueMapping(fieldKey: string, value: any, mappingConfig?: Map<string, FieldMapping>): string {
    if (!value) return '';

    // 使用提供的映射配置，或使用當前檔案的映射配置
    const mapping = mappingConfig && mappingConfig.has(fieldKey)
      ? mappingConfig.get(fieldKey)!
      : this.getFieldMapping(fieldKey);

    const strValue = String(value).trim();

    // 如果該字段有固定選項值（方式、對象、類別、公開），必須有值映射配置
    if (this.hasAllowedValues(fieldKey)) {
      if (!mapping.valueMappings || mapping.valueMappings.length === 0) {
        // 有固定選項但沒有值映射配置，返回"?"（待確認）
        return '?';
      }
    } else {
      // 如果該字段沒有固定選項值，且沒有值映射配置，返回原值
      if (!mapping.valueMappings || mapping.valueMappings.length === 0) {
        return strValue;
      }
    }

    // 如果是類別字段（多選，逗號分隔），需要特殊處理
    if (fieldKey === '類別') {
      // 分割多個值（支援中文逗號和英文逗號）
      const values = strValue.split(/[,，]/).map(v => v.trim()).filter(v => v !== '');
      const mappedValues: string[] = [];

      values.forEach(val => {
        let mapped = false;
        // 查找匹配的值映射規則
        for (const valueMapping of mapping.valueMappings!) {
          if (valueMapping.sourceValue && valueMapping.sourceValue.trim() !== '') {
            // 精確匹配
            if (val === valueMapping.sourceValue.trim()) {
              if (valueMapping.targetValue && valueMapping.targetValue.trim() !== '') {
                // 如果目標值是"?"，保留"?"標記
                mappedValues.push(valueMapping.targetValue.trim());
                mapped = true;
                break;
              }
            }
            // 部分匹配
            if (val.includes(valueMapping.sourceValue.trim()) || valueMapping.sourceValue.trim().includes(val)) {
              if (valueMapping.targetValue && valueMapping.targetValue.trim() !== '') {
                // 如果目標值是"?"，保留"?"標記
                mappedValues.push(valueMapping.targetValue.trim());
                mapped = true;
                break;
              }
            }
          }
        }
        // 如果沒有匹配的映射規則，保留原值
        if (!mapped) {
          mappedValues.push(val);
        }
      });

      // 去重並用逗號連接
      const uniqueValues = Array.from(new Set(mappedValues));
      return uniqueValues.join(',');
    }

    // 其他字段的單一值映射
    // 查找匹配的值映射規則
    for (const valueMapping of mapping.valueMappings) {
      if (valueMapping.sourceValue && valueMapping.sourceValue.trim() !== '') {
        // 精確匹配
        if (strValue === valueMapping.sourceValue.trim()) {
          // 如果目標值是"?"，返回"?"標記（待確認）
          if (valueMapping.targetValue && valueMapping.targetValue.trim() !== '') {
            return valueMapping.targetValue.trim();
          }
          // 如果目標值為空，返回"?"（待確認）
          return '?';
        }
        // 部分匹配（如果來源值包含映射的來源值）
        if (strValue.includes(valueMapping.sourceValue.trim())) {
          // 如果目標值是"?"，返回"?"標記（待確認）
          if (valueMapping.targetValue && valueMapping.targetValue.trim() !== '') {
            return valueMapping.targetValue.trim();
          }
          // 如果目標值為空，返回"?"（待確認）
          return '?';
        }
      }
    }

    // 如果沒有匹配的映射規則，且該字段有值映射配置，返回"?"（待確認）
    // 這表示來源值沒有對應的映射規則
    return '?';
  }

  // 正規化座號（去除前導零）
  private normalizeSeatNo(value: any): string {
    if (!value) return '';
    const strValue = String(value).trim();
    // 如果是純數字（可能帶前導零），轉換為數字再轉回字串，去除前導零
    if (/^\d+$/.test(strValue)) {
      return String(Number(strValue));
    }
    // 如果不是純數字，保持原樣
    return strValue;
  }

  // 應用特殊轉換（日期格式、值對應等）
  private applySpecialTransform(fieldKey: string, value: any, sourceRow: any): string {
    if (!value) return '';

    const strValue = String(value).trim();

    // 日期格式轉換：114/03/10 → 2024/03/10 或 2025/03/10
    if (fieldKey === '日期') {
      return this.convertDate(strValue);
    }

    // 方式轉換：電話聯絡 → 電話
    if (fieldKey === '方式') {
      return this.convertMethod(strValue);
    }

    // 對象轉換：受訪者 → 對象（如：爸爸、媽媽 → 家長）
    if (fieldKey === '對象') {
      return this.convertContactName(strValue);
    }

    return strValue;
  }

  // 日期格式轉換：民國年 → 西元年
  private convertDate(dateStr: string): string {
    // 格式：114/03/10 或 113/10/28
    const match = dateStr.match(/^(\d{3})\/(\d{1,2})\/(\d{1,2})$/);
    if (match) {
      const rocYear = parseInt(match[1]); // 民國年
      const month = match[2].padStart(2, '0');
      const day = match[3].padStart(2, '0');
      const adYear = rocYear + 1911; // 轉換為西元年
      return `${adYear}/${month}/${day}`;
    }
    return dateStr; // 如果格式不符合，返回原值
  }

  // 方式轉換
  private convertMethod(method: string): string {
    const methodMap: Record<string, string> = {
      '電話聯絡': '電話',
      '電話': '電話',
      '家庭訪問': '面談',
      '家訪': '面談',
      '面談': '面談',
      '聯絡簿': '聯絡簿',
      '個別約談家長': '個別約談家長',
      '會議': '會議',
      'E-mail': 'E-mail',
      'email': 'E-mail',
      'Email': 'E-mail',
    };

    // 先嘗試完全匹配
    if (methodMap[method]) {
      return methodMap[method];
    }

    // 嘗試部分匹配
    for (const [key, value] of Object.entries(methodMap)) {
      if (method.includes(key) || key.includes(method)) {
        return value;
      }
    }

    // 如果都不匹配，返回原值（可能需要用戶手動調整或設為"其他"）
    return method;
  }

  // 對象轉換
  private convertContactName(contact: string): string {
    if (!contact) return '';

    const contactStr = String(contact).trim();

    // 家長相關
    if (contactStr.includes('爸爸') || contactStr.includes('媽媽') ||
      contactStr.includes('父親') || contactStr.includes('母親') ||
      contactStr.includes('家長') || contactStr.includes('父') || contactStr.includes('母')) {
      return '家長';
    }

    // 學生
    if (contactStr.includes('學生') || contactStr === '學生') {
      return '學生';
    }

    // 教職員
    if (contactStr.includes('老師') || contactStr.includes('教師') || contactStr.includes('教職員')) {
      return '教職員';
    }

    // 專業人員
    if (contactStr.includes('專業') || contactStr.includes('心理師') || contactStr.includes('社工')) {
      return '專業人員';
    }

    // 如果都不匹配，返回原值（可能需要用戶手動調整或設為"其他"）
    return contactStr;
  }

  // 應用公式（未來擴展）
  private applyFormula(formula: string, fields: string[], sourceRow: any): string {
    let result = formula;
    fields.forEach((field, index) => {
      const placeholder = `{${field}}` || `{${index}}`;
      result = result.replace(new RegExp(placeholder, 'g'), sourceRow[field] || '');
    });
    return result;
  }

  // 下載轉換後的 Excel
  downloadTransformedExcel() {
    if (this.transformedData.length === 0) {
      alert('沒有資料可下載');
      return;
    }

    const workbook = XLSX.utils.book_new();

    // Sheet 1: 轉換後資料
    const standardHeaders = this.getStandardFields().map(f => f.key);
    // 添加錯誤訊息欄位（T 列，索引19）
    const headers = [...standardHeaders, '錯誤訊息'];
    const data = [headers];
    this.transformedData.forEach(row => {
      // 標準欄位資料
      const rowData = standardHeaders.map(header => row[header] || '');
      // 組合錯誤訊息
      const errorMessages: string[] = [];
      if (row._studentMatch && !row._studentMatch.matched && row._studentMatch.error) {
        errorMessages.push(`學生：${row._studentMatch.error}`);
      }
      if (row._teacherMatch && !row._teacherMatch.matched && row._teacherMatch.error) {
        let teacherError = `教師：${row._teacherMatch.error}`;
        if (row._teacherMatch.warning) {
          teacherError += `（${row._teacherMatch.warning}）`;
        }
        errorMessages.push(teacherError);
      }
      if (row._dateMatch && !row._dateMatch.matched && row._dateMatch.error) {
        errorMessages.push(`日期：${row._dateMatch.error}`);
      }
      rowData.push(errorMessages.join('；')); // 添加錯誤訊息到 T 列
      data.push(rowData);
    });
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // 只標記值映射中選擇了"?"（待確認標記）的欄位，用紅色標記
    // 未映射或空值保持空白，不填入問號
    const standardFieldCount = this.getStandardFields().length; // 標準欄位數量
    headers.forEach((header, colIndex) => {
      // 如果是錯誤訊息欄位（T 列），跳過特殊處理
      if (colIndex === standardFieldCount) {
        // 錯誤訊息欄位：如果有錯誤，用紅色標記
        this.transformedData.forEach((row, rowIndex) => {
          const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex });
          const errorMessages: string[] = [];
          if (row._studentMatch && !row._studentMatch.matched && row._studentMatch.error) {
            errorMessages.push(`學生：${row._studentMatch.error}`);
          }
          if (row._teacherMatch && !row._teacherMatch.matched && row._teacherMatch.error) {
            let teacherError = `教師：${row._teacherMatch.error}`;
            if (row._teacherMatch.warning) {
              teacherError += `（${row._teacherMatch.warning}）`;
            }
            errorMessages.push(teacherError);
          }
          if (row._dateMatch && !row._dateMatch.matched && row._dateMatch.error) {
            errorMessages.push(`日期：${row._dateMatch.error}`);
          }
          if (errorMessages.length > 0) {
            const errorText = errorMessages.join('；');
            if (worksheet[cellAddress]) {
              worksheet[cellAddress].s = {
                font: { color: { rgb: 'FF0000' } },
                fill: { fgColor: { rgb: 'FFE6E6' } }
              };
              worksheet[cellAddress].v = errorText;
            } else {
              worksheet[cellAddress] = {
                t: 's',
                v: errorText,
                s: {
                  font: { color: { rgb: 'FF0000' } },
                  fill: { fgColor: { rgb: 'FFE6E6' } }
                }
              };
            }
          }
        });
        return;
      }

      // 標準欄位的處理
      this.transformedData.forEach((row, rowIndex) => {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex });
        const cellValue = row[header];
        const cellValueStr = cellValue ? String(cellValue).trim() : '';

        // 如果值是"?"（待確認標記），用紅色標記
        if (cellValueStr === '?') {
          if (worksheet[cellAddress]) {
            worksheet[cellAddress].s = {
              font: { color: { rgb: 'FF0000' }, bold: true },
              fill: { fgColor: { rgb: 'FFE6E6' } }
            };
          } else {
            worksheet[cellAddress] = {
              t: 's',
              v: '?',
              s: {
                font: { color: { rgb: 'FF0000' }, bold: true },
                fill: { fgColor: { rgb: 'FFE6E6' } }
              }
            };
          }
        }
      });
    });

    XLSX.utils.book_append_sheet(workbook, worksheet, '轉換後資料');

    // Sheet 2: 字段映射對應表
    const fieldMappingData = [
      ['系統標準欄位', '必填', '說明', '固定值', '來源欄位對應', '合併方式', '合併分隔符']
    ];
    this.getStandardFields().forEach(field => {
      const mapping = this.getFieldMapping(field.key);
      const sourceFieldsStr = mapping.sourceFields && mapping.sourceFields.length > 0
        ? mapping.sourceFields.join('、')
        : '';
      const mergeTypeStr = mapping.mergeType === 'concat' ? '連接' :
        mapping.mergeType === 'formula' ? '公式' : '';
      const separatorStr = mapping.mergeSeparator || '';

      fieldMappingData.push([
        field.key,
        field.required ? '是' : '否',
        field.description,
        mapping.fixedValue || '',
        sourceFieldsStr,
        mergeTypeStr,
        separatorStr
      ]);
    });
    const fieldMappingSheet = XLSX.utils.aoa_to_sheet(fieldMappingData);
    XLSX.utils.book_append_sheet(workbook, fieldMappingSheet, '字段映射對應表');

    // Sheet 3: 值映射對應表（列出所有來源值）
    const valueMappingData = [
      ['系統標準欄位', '來源值', '目標值', '系統允許的選項']
    ];

    // 只處理有固定選項值的字段（方式、對象、類別）
    this.getStandardFields().forEach(field => {
      if (this.hasAllowedValues(field.key)) {
        const mapping = this.getFieldMapping(field.key);
        const allowedValues = this.getAllowedValuesForField(field.key);
        const allowedValuesStr = allowedValues ? allowedValues.join('、') : '';

        // 如果有來源欄位，列出所有來源值的唯一值
        if (mapping.sourceFields && mapping.sourceFields.length > 0) {
          const sourceField = mapping.sourceFields[0]; // 取第一個來源欄位
          const uniqueValues = this.getUniqueValuesForField(sourceField);

          if (uniqueValues.length > 0) {
            // 為每個來源值創建一行
            uniqueValues.forEach(sourceValue => {
              // 查找是否有對應的映射規則
              let targetValue = '';
              if (mapping.valueMappings && mapping.valueMappings.length > 0) {
                const matchedMapping = mapping.valueMappings.find(vm =>
                  vm.sourceValue === sourceValue ||
                  sourceValue.includes(vm.sourceValue) ||
                  vm.sourceValue.includes(sourceValue)
                );
                if (matchedMapping) {
                  targetValue = matchedMapping.targetValue;
                }
              }

              valueMappingData.push([
                field.key,
                sourceValue,
                targetValue,
                allowedValuesStr
              ]);
            });
          } else {
            // 如果沒有來源值，但已有映射規則，也列出映射規則
            if (mapping.valueMappings && mapping.valueMappings.length > 0) {
              mapping.valueMappings.forEach(vm => {
                valueMappingData.push([
                  field.key,
                  vm.sourceValue,
                  vm.targetValue,
                  allowedValuesStr
                ]);
              });
            }
          }
        } else {
          // 如果沒有來源欄位，但已有映射規則，列出映射規則
          if (mapping.valueMappings && mapping.valueMappings.length > 0) {
            mapping.valueMappings.forEach(vm => {
              valueMappingData.push([
                field.key,
                vm.sourceValue,
                vm.targetValue,
                allowedValuesStr
              ]);
            });
          }
        }
      }
    });

    const valueMappingSheet = XLSX.utils.aoa_to_sheet(valueMappingData);

    // 設置列寬
    valueMappingSheet['!cols'] = [
      { wch: 15 }, // 系統標準欄位
      { wch: 25 }, // 來源值
      { wch: 25 }, // 目標值（可添加下拉選單）
      { wch: 50 }  // 系統允許的選項
    ];

    // 為目標值欄位添加下拉選單（只針對有固定選項值的字段）
    let valueMappingRowIndex = 1; // 從第2行開始（第1行是表頭）
    this.getStandardFields().forEach(field => {
      if (this.hasAllowedValues(field.key)) {
        const mapping = this.getFieldMapping(field.key);
        const allowedValues = this.getAllowedValuesForField(field.key);

        if (mapping.sourceFields && mapping.sourceFields.length > 0) {
          const sourceField = mapping.sourceFields[0];
          const uniqueValues = this.getUniqueValuesForField(sourceField);

          uniqueValues.forEach(() => {
            valueMappingRowIndex++;
            if (allowedValues && allowedValues.length > 0) {
              const dropdownOptions = ['', ...allowedValues];
              const formula = `"${dropdownOptions.join(',')}"`;

              // 設置數據驗證（C欄，目標值，索引為2）
              const cellAddress = XLSX.utils.encode_cell({ r: valueMappingRowIndex - 1, c: 2 });
              if (!valueMappingSheet[cellAddress]) {
                valueMappingSheet[cellAddress] = { t: 's', v: '' };
              }
              valueMappingSheet[cellAddress].dv = {
                type: 'list',
                formula: formula
              };
            }
          });
        } else if (mapping.valueMappings && mapping.valueMappings.length > 0) {
          mapping.valueMappings.forEach(() => {
            valueMappingRowIndex++;
            if (allowedValues && allowedValues.length > 0) {
              const dropdownOptions = ['', ...allowedValues];
              const formula = `"${dropdownOptions.join(',')}"`;

              // 設置數據驗證（C欄，目標值，索引為2）
              const cellAddress = XLSX.utils.encode_cell({ r: valueMappingRowIndex - 1, c: 2 });
              if (!valueMappingSheet[cellAddress]) {
                valueMappingSheet[cellAddress] = { t: 's', v: '' };
              }
              valueMappingSheet[cellAddress].dv = {
                type: 'list',
                formula: formula
              };
            }
          });
        }
      }
    });

    XLSX.utils.book_append_sheet(workbook, valueMappingSheet, '值映射對應表');

    // Sheet 4: 固定值設定表
    const fixedValueData = [
      ['系統標準欄位', '固定值', '說明']
    ];
    this.getStandardFields().forEach(field => {
      const mapping = this.getFieldMapping(field.key);
      if (mapping.fixedValue) {
        fixedValueData.push([
          field.key,
          mapping.fixedValue,
          field.description
        ]);
      }
    });
    const fixedValueSheet = XLSX.utils.aoa_to_sheet(fixedValueData);
    XLSX.utils.book_append_sheet(workbook, fixedValueSheet, '固定值設定表');

    // Sheet 5: 映射配置確認表（含下拉選單）
    const confirmData: any[][] = [
      ['系統標準欄位', '必填', '說明', '固定值', '來源欄位對應', '值映射規則（來源值→目標值）', '可用選項說明']
    ];

    // 添加資料行
    this.getStandardFields().forEach(field => {
      const mapping = this.getFieldMapping(field.key);
      const sourceFieldsStr = mapping.sourceFields && mapping.sourceFields.length > 0
        ? mapping.sourceFields.join('、')
        : '';

      // 值映射規則字串
      let valueMappingStr = '';
      if (mapping.valueMappings && mapping.valueMappings.length > 0) {
        valueMappingStr = mapping.valueMappings.map(vm =>
          `${vm.sourceValue}→${vm.targetValue}`
        ).join('；');
      }

      // 可用選項說明
      let optionsNote = '';
      if (!sourceFieldsStr && !mapping.fixedValue) {
        // 如果沒有設定來源欄位對應和固定值，列出可用選項
        if (this.hasAllowedValues(field.key)) {
          // 有固定選項值的字段，列出所有允許的值
          const allowedValues = this.getAllowedValuesForField(field.key);
          if (allowedValues && allowedValues.length > 0) {
            optionsNote = `可用選項：${allowedValues.join('、')}`;
          }
        } else {
          // 其他字段，根據說明提供建議
          if (field.key === '狀態') {
            optionsNote = '可用選項：一般、延修、休學、畢業或離校';
          } else if (field.key === '公開') {
            optionsNote = '可用選項：是、否';
          } else if (field.key === '學期') {
            optionsNote = '可用選項：1、2';
          } else if (field.key === '年級') {
            optionsNote = '可用選項：1-12（阿拉伯數字）';
          } else if (field.key === '學年度') {
            optionsNote = '格式：3位數字，如：113、114';
          } else if (field.key === '日期') {
            optionsNote = '格式：yyyy/mm/dd，如：2024/03/10';
          } else {
            optionsNote = '請參考說明欄位';
          }
        }
      } else if (mapping.fixedValue) {
        optionsNote = '已設定固定值';
      } else if (sourceFieldsStr) {
        optionsNote = '已設定來源欄位對應';
      }

      confirmData.push([
        field.key,
        field.required ? '是' : '否',
        field.description,
        mapping.fixedValue || '',
        sourceFieldsStr,
        valueMappingStr,
        optionsNote
      ]);
    });

    const confirmSheet = XLSX.utils.aoa_to_sheet(confirmData);

    // 為有固定選項值的欄位添加下拉選單（固定值欄位，D欄）
    let confirmRowIndex = 1; // 從第2行開始（第1行是表頭）
    this.getStandardFields().forEach(field => {
      confirmRowIndex++;
      if (this.hasAllowedValues(field.key)) {
        const allowedValues = this.getAllowedValuesForField(field.key);
        if (allowedValues && allowedValues.length > 0) {
          // 創建下拉選單選項字串（用逗號分隔）
          const dropdownOptions = ['', ...allowedValues];
          const formula = `"${dropdownOptions.join(',')}"`;

          // 設置數據驗證（D欄，索引為3）
          const cellAddress = XLSX.utils.encode_cell({ r: confirmRowIndex - 1, c: 3 });
          if (!confirmSheet[cellAddress]) {
            confirmSheet[cellAddress] = { t: 's', v: '' };
          }
          // 設置數據驗證
          confirmSheet[cellAddress].dv = {
            type: 'list',
            formula: formula
          };
        }
      }
    });

    // 設置列寬
    confirmSheet['!cols'] = [
      { wch: 15 }, // 系統標準欄位
      { wch: 8 },  // 必填
      { wch: 30 }, // 說明
      { wch: 20 }, // 固定值（含下拉選單）
      { wch: 25 }, // 來源欄位對應
      { wch: 40 }, // 值映射規則
      { wch: 50 }  // 可用選項說明（加寬以顯示完整選項列表）
    ];

    XLSX.utils.book_append_sheet(workbook, confirmSheet, '映射配置確認表');

    // 下載
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `一級輔導匯入格式_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);

    this.step = 'download';
  }

  // 取得成功資料筆數
  getSuccessDataCount(): number {
    return this.transformedData.filter(row =>
      row._studentMatch && row._studentMatch.matched &&
      row._teacherMatch && row._teacherMatch.matched &&
      (!row._dateMatch || row._dateMatch.matched) &&
      (!row._statusMatch || row._statusMatch.matched)
    ).length;
  }

  // 取得錯誤資料筆數
  getErrorDataCount(): number {
    return this.transformedData.filter(row =>
      !(row._studentMatch && row._studentMatch.matched &&
        row._teacherMatch && row._teacherMatch.matched &&
        (!row._dateMatch || row._dateMatch.matched) &&
        (!row._statusMatch || row._statusMatch.matched))
    ).length;
  }

  // 下載驗證成功的資料（標準格式）
  downloadSuccessExcel() {
    // 篩選出成功的資料（學生匹配成功、教師匹配成功、日期格式正確、狀態值正確）
    const successData = this.transformedData.filter(row =>
      row._studentMatch && row._studentMatch.matched &&
      row._teacherMatch && row._teacherMatch.matched &&
      (!row._dateMatch || row._dateMatch.matched) &&
      (!row._statusMatch || row._statusMatch.matched)
    );

    if (successData.length === 0) {
      alert('沒有驗證成功的資料可下載');
      return;
    }

    const workbook = XLSX.utils.book_new();

    // 準備資料
    const standardHeaders = this.getStandardFields().map(f => f.key);
    const data = [standardHeaders];

    successData.forEach(row => {
      const rowData = standardHeaders.map(header => row[header] || '');
      data.push(rowData);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, '匯入資料');

    // 下載
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `一級輔導匯入_成功資料_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // 下載驗證失敗的資料（原始格式 + 錯誤原因）
  downloadErrorExcel() {
    // 篩選出失敗的資料（學生匹配失敗、教師匹配失敗、日期格式錯誤、或狀態值錯誤）
    const errorData = this.transformedData.filter(row =>
      !(row._studentMatch && row._studentMatch.matched &&
        row._teacherMatch && row._teacherMatch.matched &&
        (!row._dateMatch || row._dateMatch.matched) &&
        (!row._statusMatch || row._statusMatch.matched))
    );

    if (errorData.length === 0) {
      alert('沒有驗證失敗的資料可下載');
      return;
    }

    const workbook = XLSX.utils.book_new();

    // 使用所有的來源欄位（取聯集）
    const allSourceFieldsSet = new Set<string>();

    // 收集所有錯誤資料的原始欄位
    errorData.forEach(row => {
      if (row._sourceRow) {
        Object.keys(row._sourceRow).forEach(key => allSourceFieldsSet.add(key));
      }
    });

    // 轉為陣列並排序
    const sourceHeaders = Array.from(allSourceFieldsSet).sort();

    // 添加錯誤訊息欄位
    const headers = [...sourceHeaders, '錯誤訊息'];
    const data = [headers];

    errorData.forEach(row => {
      const sourceRow = row._sourceRow || {};
      const rowData = sourceHeaders.map(header => sourceRow[header] || '');

      // 組合錯誤訊息
      const errorMessages: string[] = [];
      if (row._studentMatch && !row._studentMatch.matched && row._studentMatch.error) {
        errorMessages.push(`學生：${row._studentMatch.error}`);
      }
      if (row._teacherMatch && !row._teacherMatch.matched && row._teacherMatch.error) {
        let teacherError = `教師：${row._teacherMatch.error}`;
        if (row._teacherMatch.warning) {
          teacherError += `（${row._teacherMatch.warning}）`;
        }
        errorMessages.push(teacherError);
      }
      if (row._dateMatch && !row._dateMatch.matched && row._dateMatch.error) {
        errorMessages.push(`日期：${row._dateMatch.error}`);
      }
      if (row._statusMatch && !row._statusMatch.matched && row._statusMatch.error) {
        errorMessages.push(`狀態：${row._statusMatch.error}`);
      }

      rowData.push(errorMessages.join('；'));
      data.push(rowData);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // 標記錯誤訊息欄位為紅色
    const errorColIndex = headers.length - 1;
    errorData.forEach((row, index) => {
      const cellAddress = XLSX.utils.encode_cell({ r: index + 1, c: errorColIndex });
      if (!worksheet[cellAddress]) {
        worksheet[cellAddress] = { t: 's', v: '' };
      }

      // 添加樣式（如果庫支持）
      if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
      worksheet[cellAddress].s = {
        font: { color: { rgb: "FF0000" } }
      };
    });

    XLSX.utils.book_append_sheet(workbook, worksheet, '錯誤資料');

    // 下載
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `一級輔導匯入_錯誤資料_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // 匯入模式變更
  onImportModeChange(mode: 'bySeat' | 'byStudentId') {
    this.importMode = mode;
    // 重新初始化欄位映射
    if (this.sourceFields.length > 0) {
      this.initializeFieldMappings();
    }
  }
}
