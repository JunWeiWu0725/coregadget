import { JsonPipe } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";
import { CounselImportValidationService } from "src/app/counsel-import-validation.service";
import { CounselStudent, StudentInfo } from "src/app/counsel-student.service";
import { GlobalService } from "src/app/global.service";
import { DsaTransferService } from "src/app/transfer-students/service/dsa-transfer.service";
import * as XLSX from "xlsx";

declare var d3: any;
declare var $: any;

interface ComparisonResult {
  rowNumber: number;
  importData: any;
  studentData: any;
  status: 'success' | 'error' | 'warning';
  message: string;
}

export const fieldMap: Record<string, string> = {
  年級: "grade_year", 
  班級: "class_name",
  座號: "seat_no",
  學號: "student_number", 
  狀態: "student_status",
  學年度: "school_year",
  學期: "semester", 
  日期: "occur_date",
  晤談時間: "meeting_time",
  方式: "counsel_type",
  方式其他: "counsel_type_other",
  對象: "contact_name",
  記錄者: "author_name", 
  公開: "is_private",
  聯絡事項: "contact_item",
  輔導內容: "content",
  類別: "category",
  類別其他: "category_other",
  教師ID: "ref_teacher_id"
  // 注意：ref_student_id 將在學生匹配邏輯中動態設定，不通過 fieldMap
};

@Component({
  selector: "app-import-modal",
  templateUrl: "./import-modal.component.html",
  styleUrls: ["./import-modal.component.css"]
})
export class ImportModalComponent implements OnInit {
  interviewLists = [];
  uploadedFile: File | null = null;
  uploadedFileName: string = '';
  TeacherList = [];
  errorList: { row: number; column: string; message: string }[] = [];
  showErrorMsg: boolean = false;
  comparisonResults: ComparisonResult[] = [];
  importMode: "bySeat" | "byStudentId" = "bySeat";
  studentSearchText: string = '';
  filteredStudentList: CounselStudent[] = [];
  isImporting: boolean = false; // 匯入狀態標記
  
  // 🔧 新增：開發調試用
  showDebugInfo: boolean = true; // 🚨 臨時設為 true 以便測試，正式版本應由 dev_mode 控制
  matchedStudentIds: Set<string> = new Set(); // 追蹤已匹配的學生ID
  currentValidationData: any[] = []; // 當前驗證的資料
 
  private _studentList: CounselStudent[] = [];
  @Input() 
  set StudentList(value: CounselStudent[]) {
    this._studentList = value;
    this.filteredStudentList = [...value];
  }
  get StudentList(): CounselStudent[] {
    return this._studentList;
  }
  @Input() Role: "班導師" | "管理者" |""=''
  constructor(
    private globalService: GlobalService,
    private dsaService: DsaTransferService,
    private validator: CounselImportValidationService
  ) {}

  ngOnInit() {
    this.loadAllTeacher();
    if(this.Role =="管理者"){
      this.loadAllStudent()
    }
    this.filteredStudentList = [...this.StudentList];
    
    // 🔧 檢查 dev_mode 設定來決定是否顯示調試信息
    this.checkDevMode();
  }

  public openModal() {
    $("#app_import_modal").modal("show");
  }

  async loadAllTeacher() {
    let rsp = await this.dsaService.send("_.GetAllTeacher", {});
    this.TeacherList = [].concat(rsp.Teacher || []);
  }
  async loadAllStudent(){

  let rsp = await this.dsaService.send("_.GetAllStudent", {});
    this.StudentList = [].concat(rsp.Students || []);
    console.log("=== 系統內原本學生清單 ===");
    console.log("學生總數:", this.StudentList.length);
    console.log("完整學生清單:", this.StudentList);
    
    // 印出前5筆學生資料作為範例
    console.log("前5筆學生資料範例:");
    const statusText = { "1": "一般", "2": "延修" };
    this.StudentList.slice(0, 5).forEach((student, index) => {
      console.log(`學生${index + 1}:`, {
        StudentID: student.StudentID,
        StudentNumber: student.StudentNumber,
        ClassName: student.ClassName,
        SeatNo: student.SeatNo,
        StudentName: student.StudentName,
        Status: student.Status,
        StatusText: statusText[student.Status] || student.Status,
        Gender: student.Gender
      });
    });
    
    // 統計各狀態的學生數量
    const statusCount = {};
    this.StudentList.forEach(student => {
      const status = student.Status || '未設定';
      const statusName = statusText[status] || status;
      const key = `${status}(${statusName})`;
      statusCount[key] = (statusCount[key] || 0) + 1;
    });
    console.log("各狀態學生統計:", statusCount);
    console.log("=== 學生清單印出完成 ===");

  }

  canImport(): boolean {
    console.log('Debug canImport:', {
      errorListLength: this.errorList.length,
      interviewListsLength: this.interviewLists.length,
      result: this.errorList.length === 0 && this.interviewLists.length > 0
    });
    return this.errorList.length === 0 && this.interviewLists.length > 0;
  }

  // 統計相關方法
  getTotalRows(): number {
    if (!this.uploadedFile) return 0;
    return this.interviewLists.length + this.getUniqueErrorRows();
  }

  getSuccessRows(): number {
    return this.interviewLists.length;
  }

  getErrorRows(): number {
    return this.getUniqueErrorRows();
  }

  getUniqueErrorRows(): number {
    if (this.errorList.length === 0) return 0;
    // 取得唯一的錯誤行數
    const uniqueRows = new Set(this.errorList.map(error => error.row));
    return uniqueRows.size;
  }

  getSuccessRate(): number {
    const total = this.getTotalRows();
    if (total === 0) return 0;
    return Math.round((this.getSuccessRows() / total) * 100);
  }

  async onFileSelected(event: any) {
    const file: File = event.target.files[0];
    this.uploadedFile = file;
    this.uploadedFileName = file.name;
    await this.validateUploadedFile(file);
  }

  async validateUploadedFile(file: File) {
 
    const rawRows = await this.readExcelFile(file);
    this.errorList = [];
    
    // 🔧 重置調試資料
    this.matchedStudentIds.clear();
    this.currentValidationData = rawRows;
    
    this.validator.setImportMode(this.importMode);
    this.validator.setRole(this.Role);
    this.validator.setStudentList(this.StudentList);
    this.validator.setTeacherList(this.TeacherList);
    this.validator.setStudentsData(this.StudentList);
    // 設置當前登入教師資訊，用於班導師匯入時驗證記錄者是否為本人
    this.validator.setCurrentTeacher(
      this.globalService.teacherName || "",
      this.globalService.teacherID || ""
    );
    this.validator.setSpecialStudentCheck((student) => {
      return this.StudentList.some((s) => 
        s.StudentNumber === student.StudentNumber
      );
    });


    
    const allErrors: { row: number; column: string; message: string }[] = [];
    if(rawRows.length == 0 ){      allErrors.push( { row: 0, column: '', message: '至少一列資料' });}
    
    // 生成比對結果
    this.comparisonResults = [];
    rawRows.forEach((row, index) => {
      const rowNum = index + 2;
      console.log(`🔍 主組件 - 開始驗證第${rowNum}列:`, row);
      const rowErrors = this.validator.validateRow(row, rowNum);
      console.log(`🔍 主組件 - 第${rowNum}列驗證結果:`, rowErrors);
      console.log(`🔍 主組件 - 第${rowNum}列錯誤數量: ${rowErrors.length}`);
      allErrors.push(...rowErrors);
      console.log(`🔍 主組件 - 累計錯誤數量: ${allErrors.length}`);
      
      // 🔧 追蹤匹配的學生
      this.trackMatchedStudent(row);
      
      // 為每一列生成比對結果
      const comparisonResult = this.generateComparisonResult(row, rowNum);
      this.comparisonResults.push(comparisonResult);
    });

    if (allErrors.length > 0) {
      this.showErrorMsg = true;
      this.errorList = allErrors;
      this.interviewLists = [];
      return;
    }

    this.showErrorMsg = false;
    this.errorList = [];
    
    console.log("🔍 驗證通過，開始轉換 Excel 資料");
    console.log("原始 Excel 資料:", rawRows);
    
    this.interviewLists = this.transformExcelRows(rawRows);
    
    console.log("轉換後的匯入資料:", this.interviewLists);
    console.log("檢查 ref_student_id 設定情況:", this.interviewLists.map(item => ({
      記錄者: item.author_name,
      班級: item.class_name,
      ref_student_id: item.ref_student_id
    })));
  }

  onImportModeChange(mode: "bySeat" | "byStudentId") {
    this.importMode = mode;
    if (this.uploadedFile) {
      this.validateUploadedFile(this.uploadedFile);
    }
  }

  async insertCunsels() {
    // 設定匯入狀態，禁用按鈕
    this.isImporting = true;
    
    // 資料驗證和清理
    const cleanedInterviewLists = this.interviewLists.map((item, index) => {
      const cleanedItem = { ...item };
      console.log("cleanedItem",cleanedItem);
      
      // 確保必要欄位不為空
      if (!cleanedItem.ref_student_id || cleanedItem.ref_student_id === null) {
        console.warn(`第 ${index + 1} 筆資料的 ref_student_id 為空，跳過此筆資料:`, cleanedItem);
        return null; // 跳過這筆資料
      }
      
      // 清理空字串和 undefined 值
      Object.keys(cleanedItem).forEach(key => {
        if (cleanedItem[key] === undefined || cleanedItem[key] === null || cleanedItem[key] === '') {
          delete cleanedItem[key];
        }
        // 確保字串值不包含特殊字符
        if (typeof cleanedItem[key] === 'string') {
          cleanedItem[key] = cleanedItem[key].replace(/[\x00-\x1F\x7F]/g, '');
        }
      });
      
      return cleanedItem;
    }).filter(item => item !== null); // 移除無效資料
    
    const skippedCount = this.interviewLists.length - cleanedInterviewLists.length;
    
    if (cleanedInterviewLists.length === 0) {
      alert(`所有 ${this.interviewLists.length} 筆資料都無法匯入，原因：找不到對應的學生資料。\n\n請檢查：\n1. 班級名稱是否正確\n2. 座號是否正確\n3. 狀態是否正確（一般/延修/休學）`);
      this.isImporting = false; // 重設匯入狀態
      return;
    }
    
    if (skippedCount > 0) {
      const proceed = confirm(`警告：有 ${skippedCount} 筆資料因找不到對應學生而被跳過。\n\n有效資料：${cleanedInterviewLists.length} 筆\n跳過資料：${skippedCount} 筆\n\n是否繼續匯入有效的資料？`);
      if (!proceed) {
        this.isImporting = false; // 重設匯入狀態
        return;
      }
    }
    
    const Request = { interviewLists: cleanedInterviewLists };
    
    console.log("準備匯入的資料:", Request);
    
    try {
      await this.dsaService.send("_.AddInterviewList", { Request });
      console.log("匯入成功");
      alert(`成功匯入 ${cleanedInterviewLists.length} 筆資料`);
      $("#app_import_modal").modal("hide");
      this.isImporting = false; // 重設匯入狀態
    } catch (ex) {
      console.error("匯入發生錯誤", ex);
      let errorMessage = "匯入發生錯誤";
      
      if (ex && typeof ex === 'object') {
        if (ex.Message) {
          errorMessage += "：" + ex.Message;
        } else if (ex.message) {
          errorMessage += "：" + ex.message;
        }
      }
      
      alert(errorMessage);
      this.isImporting = false; // 重設匯入狀態
    }
  }

    openErrorInNewTab() {
    const groupedErrors = this.errorList.reduce((acc, err) => {
      if (!acc[err.row]) acc[err.row] = [];
      acc[err.row].push(`${err.column}：${err.message}`);
      return acc;
    }, {} as Record<number, string[]>);

    const htmlContent = `
      <html>
        <head>
          <title>錯誤詳細內容</title>
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
              padding: 12px; 
              vertical-align: top; 
              text-align: left;
            }
            th { 
              background-color: #f8f9fa; 
              font-weight: bold;
              color: #495057;
            }
            td:first-child { 
              width: 100px; 
              font-weight: bold; 
              text-align: center;
            }
            .error-message {
              line-height: 1.5;
            }
            .import-data {
              background-color: #d1ecf1;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 0.9em;
              margin-top: 4px;
              border-left: 3px solid #007bff;
            }
            .comparison-data {
              color: #28a745;
              font-size: 0.9em;
              margin-top: 4px;
              background-color: #d4edda;
              padding: 4px 8px;
              border-radius: 4px;
              border-left: 3px solid #28a745;
            }
            .student-info {
              background-color: #e9ecef;
              padding: 8px;
              border-radius: 4px;
              margin: 8px 0;
              font-weight: bold;
              color: #495057;
            }
            .error-count {
              color: #dc3545;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin: 0; color: #495057;">📋 匯入資料驗證錯誤詳細報告</h2>
            <p style="margin: 0.5rem 0 0 0; color: #6c757d;">
              共發現 <span class="error-count">${this.errorList.length}</span> 個錯誤，
              涉及 <span class="error-count">${Object.keys(groupedErrors).length}</span> 列資料
            </p>
          </div>
          <table>
            <thead>
              <tr>
                <th>第幾列</th>
                <th>錯誤詳細資訊 & 資料比對</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(groupedErrors).map(([row, messages]) => 
                messages.map(msg => {
                  // 分離錯誤訊息、匯入資料和全班資料
                  const parts = msg.split(' (匯入資料:');
                  const errorMsg = parts[0];
                  
                  if (parts[1]) {
                    // 進一步分離匯入資料和全班資料
                    const dataParts = parts[1].replace(')', '').split('|全班資料:');
                    const importData = dataParts[0] ? dataParts[0].trim() : null;
                    const classData = dataParts[1] ? dataParts[1].trim() : null;
                    
                    return `
                      <tr>
                        <td>第 ${row} 列</td>
                        <td class="error-message">
                          <div style="margin-bottom: 8px; font-weight: bold; color: #dc3545;">❌ ${errorMsg}</div>
                          ${importData ? `<div class="import-data">📝 匯入資料: ${importData}</div>` : ''}
                          ${classData ? `<div class="comparison-data">👥 全班資料: ${classData}</div>` : ''}
                        </td>
                      </tr>
                    `;
                  } else {
                    return `
                      <tr>
                        <td>第 ${row} 列</td>
                        <td class="error-message">
                          <div style="color: #dc3545;">❌ ${errorMsg}</div>
                        </td>
                      </tr>
                    `;
                  }
                }).join('')
              ).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    } else {
      console.warn('無法開啟新分頁，請確認瀏覽器沒有封鎖彈出視窗。');
    }
  }

  public async readExcelFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // 🔥 修改：使用預設的 sheet_to_json（第一行作為表頭）
        const excelData = XLSX.utils.sheet_to_json(worksheet);
        
        // 🔥 過濾空白行：只保留有實際資料的行
        const filteredData = excelData.filter((row: any) => {
          // 檢查物件是否有任何非空白屬性值
          return row && Object.values(row).some(value => 
            value !== null && value !== undefined && String(value).trim() !== ''
          );
        });
        
        console.log('原始資料行數:', excelData.length);
        console.log('過濾後行數:', filteredData.length);
        console.log('過濾後資料:', filteredData);
        
        resolve(filteredData);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  transformExcelRows(rows: any[]): any[] {
    const sharedBatchCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    console.log("=== 匯入組件 - 學生清單檢查 ===");
    console.log("StudentList 內容:", this.StudentList.slice(0, 3));
    console.log("StudentList 屬性檢查:", this.StudentList.length > 0 ? {
      hasStudentNumber: 'StudentNumber' in this.StudentList[0],
      hasStudentID: 'StudentID' in this.StudentList[0],
      hasClassName: 'ClassName' in this.StudentList[0],
      hasSeatNo: 'SeatNo' in this.StudentList[0],
      hasStatus: 'Status' in this.StudentList[0],
      firstStudentKeys: Object.keys(this.StudentList[0])
    } : 'StudentList 為空');

    return rows.map((row, index) => {
      const result: any = {};

      for (const zhKey in fieldMap) {
        const enKey = fieldMap[zhKey];
        const value = row[zhKey];
        result[enKey] = enKey === "is_private" ? value === "否" : value;
      }

      // 檢查驗證階段是否已經設定 ref_student_id
      if (row["_ref_student_id"]) {
        result["ref_student_id"] = row["_ref_student_id"];
        console.log(`🎯 使用驗證階段設定的 ref_student_id: ${result["ref_student_id"]} (學生: ${row["_matched_student_name"]})`);
      } else {
        // 初始化 ref_student_id 為 null，將在下面的學生匹配邏輯中設定
        result["ref_student_id"] = null;
        console.log("⚠️ 驗證階段未設定 ref_student_id，將進行重新匹配");
      }

      // 根據匯入模式決定學生匹配方式（如果驗證階段沒有設定的話）
      console.log("=== 匯入組件 - 學生ID獲取檢查 ===");
      console.log("StudentList 總數:", this.StudentList.length);
      console.log("StudentList 前3筆資料:", this.StudentList.slice(0, 3));
      console.log("匯入模式:", this.importMode);
      console.log("當前行原始資料 (Excel欄位名稱):", row);
      console.log("Excel 中的欄位:", Object.keys(row));
      console.log("檢查必要欄位:");
      console.log("- 班級:", row["班級"]);
      console.log("- 座號:", row["座號"]); 
      console.log("- 學號:", row["學號"]);
      console.log("- 狀態:", row["狀態"]);
      console.log("fieldMap 轉換後的 result:", result);
      console.log("初始 result[ref_student_id]:", result["ref_student_id"]);
      
      // 只有在驗證階段沒有設定 ref_student_id 時才進行重新匹配
      if (!result["ref_student_id"] && this.importMode === "byStudentId") {
        // 按學號+狀態匹配
        if (row["學號"]) {
          const studentNumber = row["學號"].toString().trim();
          const status = (row["狀態"] || "").toString().trim();
          // 將中文狀態轉換為系統代碼
          const statusMapping = { "一般": "1", "延修": "2", "休學": "3" };
          const statusCode = statusMapping[status] || status;
          
          console.log(`🔍 按學號匹配 - 學號: "${studentNumber}", 狀態: "${status}" → "${statusCode}"`);
          
          let foundStudent = null;
          for (const s of this.StudentList) {
            console.log(`檢查學生: 學號=${s.StudentNumber}, 狀態=${s.Status}, 姓名=${s.StudentName}`);
            if (s.StudentNumber === studentNumber && s.Status === statusCode) {
              foundStudent = s;
              console.log(`✅ 找到匹配學生: ${s.StudentName}`);
              break;
            }
          }
        
          if (foundStudent) {
            result["ref_student_id"] = foundStudent.StudentID;
          } else {
            console.log(`❌ 匯入-學號+狀態匹配失敗: ${studentNumber}, 狀態: ${status} (系統代碼: ${statusCode})`);
            result["ref_student_id"] = null;
          }
        } else {
          console.log("❌ Excel中沒有學號資料");
          result["ref_student_id"] = null;
        }
      } else if (!result["ref_student_id"] && this.importMode === "bySeat") {
        // 按班級+座號+狀態匹配
        const className = (row["班級"] || "").toString().trim();
        const seatNo = (row["座號"] || "").toString().trim();
        const status = (row["狀態"] || "").toString().trim();
        // 根據角色決定是否轉換狀態
        let statusCode: string;
        if (this.Role === "班導師") {
          // 班導師直接使用中文狀態，不轉換
          statusCode = status;
          console.log(`班導師模式 - 保持原始狀態: "${status}"`);
        } else {
          // 管理者等其他角色才轉換為系統代碼
          const statusMapping = { "一般": "1", "延修": "2", "休學": "3" };
          statusCode = statusMapping[status] || status;
          console.log(`管理者模式 - 狀態轉換: "${status}" → "${statusCode}"`);
        }
        console.log("要查找的班級:", className, "座號:", seatNo, "狀態:", status, "系統代碼:", statusCode);
        
        // 🔍 印出全班陣列
        if (index === 0) { // 只在第一筆資料時印出，避免重複
          console.log("=== 全班學生陣列 ===");
          console.log("學生總數:", this.StudentList.length);
          console.log("完整學生清單:", this.StudentList.map((s: any, idx) => ({
            序號: idx + 1,
            班級: s.ClassName,
            座號: s.SeatNo,
            學號: s.StudentNumber,
            姓名: s.StudentName,
            狀態: s.Status,
            年級: s.GradeYear
          })));
          
          // 顯示全班陣列資訊
          console.log(`全班學生清單 (共${this.StudentList.length}人):`);
          this.StudentList.forEach((s, idx) => {
            console.log(`${idx + 1}. 班級:${s.ClassName || '無'} 座號:${s.SeatNo || '無'} 姓名:${s.StudentName || '無'} 狀態:${s.Status || '無'}`);
          });
        }

        result["ref_student_id"] = null; // 清空學號，強制使用班級座號匹配

        let foundStudent = null;
 
        for (const s of this.StudentList) {
          const studentClassName = (s.ClassName || "").toString();
          const studentSeatNo = s.SeatNo != null ? s.SeatNo.toString() : "";
          const studentStatus = (s.Status || "").toString();
          
          // 🔍 詳細比對資訊
          console.log(`\n--- 比對學生 ${s.StudentName} ---`);
          console.log(`學生資料: 班級="${studentClassName}" (型態:${typeof s.ClassName}), 座號="${studentSeatNo}" (原始:${s.SeatNo}, 型態:${typeof s.SeatNo}), 狀態="${studentStatus}" (型態:${typeof s.Status})`);
          console.log(`Excel資料: 班級="${className}" (型態:${typeof row["班級"]}), 座號="${seatNo}" (原始:${row["座號"]}, 型態:${typeof row["座號"]}), 狀態="${status}"->"${statusCode}" (型態:${typeof row["狀態"]})`);
          
          const classMatch = studentClassName === className;
          const seatMatch = studentSeatNo === seatNo;
          const statusMatch = studentStatus === statusCode;
          
          console.log(`比對結果: 班級=${classMatch}, 座號=${seatMatch}, 狀態=${statusMatch}`);
          
          // 如果是工202班的學生，特別記錄
          if (studentClassName.includes("202") || className.includes("202")) {
            console.log(`🔍 工202班學生比對詳情:`);
            console.log(`學生: ${s.StudentName}`);
            console.log(`系統班級: "${studentClassName}" vs Excel班級: "${className}" → ${classMatch ? '✅' : '❌'}`);
            console.log(`系統座號: "${studentSeatNo}" vs Excel座號: "${seatNo}" → ${seatMatch ? '✅' : '❌'}`);
            console.log(`系統狀態: "${studentStatus}" vs Excel狀態: "${status}"→"${statusCode}" → ${statusMatch ? '✅' : '❌'}`);
            
            if (!classMatch) {
              console.log(`❌ 班級不符! 系統: "${studentClassName}", Excel: "${className}"`);
            }
            if (!seatMatch) {
              console.log(`❌ 座號不符! 系統: "${studentSeatNo}" (原始:${s.SeatNo}), Excel: "${seatNo}" (原始:${row["座號"]})`);
            }
            if (!statusMatch) {
              console.log(`❌ 狀態不符! 系統: "${studentStatus}", Excel: "${status}" → 轉換後 "${statusCode}"`);
            }
          }
          
          if (classMatch && seatMatch && statusMatch) {
            foundStudent = s;
            result["ref_student_id"] = s.StudentID;
            console.log(`✅ 匯入-班級座號狀態匹配成功: ${className}-${seatNo}-${status}(${statusCode}) -> ${result["ref_student_id"]}`);
            console.log("找到的學生完整資料:", foundStudent);
            console.log(`✅ 匹配成功! 學生: ${s.StudentName}, 班級: ${className}, 座號: ${seatNo}, 狀態: ${status}`);
            break;
          }
        }
        
        if (!result["ref_student_id"]) {
          console.log(`匯入-班級座號狀態匹配失敗: ${className}-${seatNo}-${status}(${statusCode})`);
          
          // 🚨 Alert: 顯示匹配失敗的詳細原因
          const classMatches = this.StudentList.filter(s => s.ClassName === className);
          const seatMatches = this.StudentList.filter(s => s.SeatNo != null && s.SeatNo.toString() === seatNo);
          const statusMatches = this.StudentList.filter(s => s.Status === statusCode);
          
          let errorMsg = `第${index + 2}列 班級座號匹配失敗:\n`;
          errorMsg += `查找條件: 班級="${className}", 座號="${seatNo}", 狀態="${status}"(${statusCode})\n\n`;
          
          if (classMatches.length === 0) {
            const availableClasses = [...new Set(this.StudentList.map(s => s.ClassName))];
            errorMsg += `❌ 找不到班級"${className}"\n`;
            errorMsg += `✅ 可用班級: ${availableClasses.join(', ')}`;
          } else if (seatMatches.length === 0) {
            const classSeats = classMatches.map(s => s.SeatNo).filter(seat => seat != null).sort((a,b) => Number(a) - Number(b));
            errorMsg += `❌ 找不到座號"${seatNo}"\n`;
            errorMsg += `✅ 班級"${className}"的可用座號: ${classSeats.join(', ')}`;
          } else if (statusMatches.length === 0) {
            const availableStatuses = [...new Set(this.StudentList.map(s => s.Status))];
            errorMsg += `❌ 找不到狀態"${status}"(代碼:${statusCode})\n`;
            errorMsg += `✅ 可用狀態代碼: ${availableStatuses.join(', ')}`;
          } else {
            // 檢查是否有部分匹配
            const partialMatches = this.StudentList.filter(s => {
              const classMatch = s.ClassName === className;
              const seatMatch = s.SeatNo != null && s.SeatNo.toString() === seatNo;
              const statusMatch = s.Status === statusCode;
              return (classMatch ? 1 : 0) + (seatMatch ? 1 : 0) + (statusMatch ? 1 : 0) >= 2;
            });
            
            if (partialMatches.length > 0) {
              errorMsg += `⚠️ 找到部分匹配的學生:\n`;
              partialMatches.forEach(s => {
                errorMsg += `- 班級:${s.ClassName}, 座號:${s.SeatNo}, 狀態:${s.Status}, 姓名:${s.StudentName}\n`;
              });
            } else {
              errorMsg += `❌ 完全無匹配的學生`;
            }
          }
          
          console.log(errorMsg);
        }
      } else if (result["ref_student_id"]) {
        console.log(`✅ 使用驗證階段的 ref_student_id，跳過重新匹配: ${result["ref_student_id"]}`);
      }
      
      console.log("最終 result[ref_student_id]:", result["ref_student_id"]);
      console.log("=== 匯入組件檢查結束 ===");

      const authorName = (row["記錄者"] || "").toString().trim();
      for (const t of this.TeacherList) {
        if (t.Name === authorName || t.NickName === authorName) {
          result["ref_teacher_id"] = t.ID;
          break;
        }
      }

      const allowedCategories = [
        "人際困擾", "師生關係", "家庭困擾", "自我探索", "情緒困擾", "生活壓力",
        "創傷反應", "自我傷害", "性別議題", "脆弱家庭", "兒少保議題", "學習困擾",
        "生涯輔導", "偏差行為", "網路沉迷", "中離(輟)拒學", "藥物濫用", "精神疾患", "其他"
      ];

      const rawCategory = (row["類別"] || "").toString();
      const otherText = (row["類別其他"] || "").toString();
      const categoryItems = allowedCategories.map((item, c) => {
        const checked = rawCategory.includes(item);
        const answer_matrix = item === "其他" ? ["其他", otherText] : [];
        const answer_text = item === "其他" ? "其他%text1%" : item;
        return {
          answer_code: "Category" + (c + 1),
          answer_martix: answer_matrix,
          answer_text,
          answer_checked: checked,
          answer_complete: false,
          answer_value: ""
        };
      });

      result["category_json"] = JSON.stringify(categoryItems);
      result["import_info"] = JSON.stringify({
        created_by_name: this.globalService.teacherName || "",
        ref_teacher_id: this.globalService.teacherID || null,
        batch_code: sharedBatchCode,
        type: "班導師"
      });

      return result;
    });
  }

  onModalClose() {
    this.showErrorMsg = false;
    this.errorList = [];
    this.interviewLists = [];
    this.uploadedFile = null;
    this.uploadedFileName = '';
    this.comparisonResults = [];
    this.isImporting = false; // 重設匯入狀態
  }

  private generateComparisonResult(row: any, rowNumber: number): ComparisonResult {
    let student = null;
    let status: 'success' | 'error' | 'warning' = 'error';
    let message = '';

    // 根據匯入模式查找學生
    if (this.importMode === "byStudentId") {
      student = this.StudentList.find(s => s.StudentID === row["學號"]);
      if (student) {
        status = 'success';
        message = '成功找到對應學生資料';
      } else {
        status = 'error';
        message = `查無學號 "${row["學號"]}" 的學生資料`;
      }
    } else {
      student = this.StudentList.find(s => 
        s.ClassName === row["班級"] && s.SeatNo == row["座號"]
      );
      if (student) {
        status = 'success';
        message = '成功找到對應學生資料';
      } else {
        status = 'error';
        message = `查無班級 "${row["班級"]}" 座號 "${row["座號"]}" 的學生資料`;
      }
    }

    // 檢查是否有警告情況
    if (student && row["狀態"] && row["狀態"] !== "一般") {
      status = 'warning';
      message += ` (學生狀態: ${row["狀態"]})`;
    }

    return {
      rowNumber,
      importData: row,
      studentData: student,
      status,
      message
    };
  }

  getStatusText(status: string): string {
    switch (status) {
      case '1': return '一般';
      case '2': return '延修';
      case '3': return '休學';
      default: return '未設定';
    }
  }

  filterStudents(): void {
    if (!this.studentSearchText.trim()) {
      this.filteredStudentList = [...this.StudentList];
      return;
    }

    const searchText = this.studentSearchText.toLowerCase();
    this.filteredStudentList = this.StudentList.filter(student => 
      (student.StudentName && student.StudentName.toLowerCase().includes(searchText)) ||
      (student.ClassName && student.ClassName.toLowerCase().includes(searchText)) ||
      (student.SeatNo && student.SeatNo.toString().includes(searchText)) ||
      (student.StudentID && student.StudentID.toLowerCase().includes(searchText))
    );
  }

  getCurrentClassName(): string {
    if (this.StudentList.length > 0) {
      const firstStudent = this.StudentList[0];
      return firstStudent.ClassName || '未設定';
    }
    return '無班級資料';
  }

  getCurrentSchoolYear(): string {
    if (this.StudentList.length > 0) {
      const firstStudent = this.StudentList[0];
      return firstStudent.SchoolYear ? firstStudent.SchoolYear.toString() : '未設定';
    }
    return '未設定';
  }

  getCurrentSemester(): string {
    if (this.StudentList.length > 0) {
      const firstStudent = this.StudentList[0];
      return firstStudent.Semester ? firstStudent.Semester.toString() : '未設定';
    }
    return '未設定';
  }

  downloadStudentListAsJSON(): void {
    // 格式化資料，包含完整的學生資訊
    const formattedData = {
      exportTime: new Date().toISOString(),
      totalStudents: this.StudentList.length,
      classInfo: {
        className: this.getCurrentClassName(),
        schoolYear: this.getCurrentSchoolYear(),
        semester: this.getCurrentSemester(),
        role: this.Role,
        importMode: this.importMode
      },
      students: this.StudentList.map(student => ({
        // 基本資訊
        StudentID: student.StudentID || '',
        StudentName: student.StudentName || '',
        StudentNumber: student.StudentNumber || '',
        ClassName: student.ClassName || '',
        SeatNo: student.SeatNo || '',
        Gender: student.Gender || '',
        IDNumber: student.IDNumber || '',
        Status: student.Status || '',
        
        // 學期資訊
        SchoolYear: student.SchoolYear || null,
        Semester: student.Semester || null,
        
        // 輔導相關
        Role: student.Role || [],
        InterviewCount: student.InterviewCount || 0,
        LastInterviewDate: student.LastInterviewDate || '',
        LastInterviewContact: student.LastInterviewContact || '',
        LastInterviewType: student.LastInterviewType || '',
        LastInterviewTypeOther: student.LastInterviewTypeOther || '',
        LastInterviewContent: student.LastInterviewContent || '',
        LastInterviewContactItem: student.LastInterviewContactItem || '',
        LastInterviewReferral: student.LastInterviewReferral || false,
        ReferralStatus: student.ReferralStatus || '',
        
        // 其他欄位
        StuCounselNumber: student.StuCounselNumber || ''
      }))
    };

    // 創建下載
    const jsonStr = JSON.stringify(formattedData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `學生清單_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
    
    console.log('學生清單 JSON 資料:', formattedData);
  }

  downloadTemplate() {
    const data = [[
      '班級', '座號', '學號', '狀態', '年級', '學年度', '學期', '日期', '晤談時間',
      '方式', '方式其他', '對象', '記錄者', '暱稱', '公開',
      '聯絡事項', '輔導內容', '類別', '類別其他'
    ]];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '範本');

    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '一級輔導匯入範本.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  downloadTemplate2() {
  const a = document.createElement('a');
  a.href = 'assets/一級輔導匯入範本.xlsx';
  a.download = '一級輔導匯入範本.xlsx';
  a.click();
}

  // 🔧 新增：追蹤匹配的學生
  trackMatchedStudent(row: any) {
    let matchedStudent = null;
    
    // 根據匯入模式和角色決定狀態比對方式
    const originalStatus = row["狀態"];
    let compareStatus: string;
    if (this.Role === "班導師") {
      compareStatus = originalStatus;
    } else {
      const statusMapping = { "一般": "1", "延修": "2", "休學": "3" };
      compareStatus = statusMapping[originalStatus] || originalStatus;
    }
    
    if (this.importMode === "byStudentId") {
      matchedStudent = this.StudentList.find(
        (s) => s.StudentNumber === row["學號"] && s.Status === compareStatus
      );
    } else {
      matchedStudent = this.StudentList.find(
        (s) => s.ClassName == row["班級"] && s.SeatNo == row["座號"] && s.Status === compareStatus
      );
    }
    
    if (matchedStudent) {
      this.matchedStudentIds.add(matchedStudent.StudentID);
      console.log(`🎯 追蹤到匹配學生: ${matchedStudent.StudentName} (ID: ${matchedStudent.StudentID})`);
    }
  }

  // 🔧 新增：檢查學生是否被匹配
  isStudentMatched(studentId: string): boolean {
    return this.matchedStudentIds.has(studentId);
  }

  // 🔧 新增：獲取學生匹配狀態的CSS類
  getStudentMatchClass(studentId: string): string {
    return this.isStudentMatched(studentId) ? 'student-matched' : 'student-unmatched';
  }

  // 🔧 新增：檢查 dev_mode 設定
  private checkDevMode() {
    try {
      // 檢查全域變數中的 dev_mode 設定
      const windowObj = window as any;
      
      console.log('🔍 調試：檢查 window 物件:', windowObj);
      console.log('🔍 調試：window.gadget:', windowObj.gadget);
      
      if (windowObj.gadget) {
        console.log('🔍 調試：window.gadget.paramValues:', windowObj.gadget.paramValues);
        if (windowObj.gadget.paramValues) {
          console.log('🔍 調試：dev_mode 值:', windowObj.gadget.paramValues.dev_mode);
          console.log('🔍 調試：dev_mode 型別:', typeof windowObj.gadget.paramValues.dev_mode);
        }
      }
      
      const devMode = windowObj && windowObj.gadget && windowObj.gadget.paramValues && windowObj.gadget.paramValues.dev_mode;
      this.showDebugInfo = devMode === true;
      
      console.log('🔍 調試：最終 devMode 值:', devMode);
      console.log('🔍 調試：showDebugInfo 設定為:', this.showDebugInfo);
      
      if (this.showDebugInfo) {
        console.log('🔧 開發模式已啟用：顯示學生驗證調試界面');
      } else {
        console.log('📱 正式模式：隱藏學生驗證調試界面');
      }
    } catch (error) {
      console.warn('無法讀取 dev_mode 設定，預設隱藏調試界面:', error);
      this.showDebugInfo = false;
    }
  }

  // 🔧 新增：切換調試信息顯示
  toggleDebugInfo() {
    this.showDebugInfo = !this.showDebugInfo;
  }

  // 🔧 新增：TrackBy 函數優化性能
  trackByStudentId(index: number, student: any): string {
    return student.StudentID;
  }

  // 🔧 新增：獲取驗證結果文字
  getValidationResultText(row: any): string {
    const matchedStudent = this.findMatchedStudentForRow(row);
    if (matchedStudent) {
      return '✓ 已匹配';
    } else {
      return '✗ 未匹配';
    }
  }

  // 🔧 新增：獲取驗證結果CSS類
  getValidationResultClass(row: any): string {
    const matchedStudent = this.findMatchedStudentForRow(row);
    return matchedStudent ? 'badge-success' : 'badge-danger';
  }

  // 🔧 新增：為指定行找到匹配的學生
  private findMatchedStudentForRow(row: any): any {
    // 根據匯入模式和角色決定狀態比對方式
    const originalStatus = row["狀態"];
    let compareStatus: string;
    if (this.Role === "班導師") {
      compareStatus = originalStatus;
    } else {
      const statusMapping = { "一般": "1", "延修": "2", "休學": "3" };
      compareStatus = statusMapping[originalStatus] || originalStatus;
    }
    
    if (this.importMode === "byStudentId") {
      return this.StudentList.find(
        (s) => s.StudentNumber === row["學號"] && s.Status === compareStatus
      );
    } else {
      return this.StudentList.find(
        (s) => s.ClassName == row["班級"] && s.SeatNo == row["座號"] && s.Status === compareStatus
      );
    }
  }

}


