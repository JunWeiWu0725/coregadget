import { JsonPipe } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";
import { CounselImportValidationService } from "src/app/counsel-import-validation.service";
import { CounselStudent, StudentInfo } from "src/app/counsel-student.service";
import { GlobalService } from "src/app/global.service";
import { DsaTransferService } from "src/app/transfer-students/service/dsa-transfer.service";
import * as XLSX from "xlsx";

export const fieldMap: Record<string, string> = {
  年級: "grade_year",
  班級: "class_name",
  學號: "ref_student_id",
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
  教師ID: "ref_teacher_id",
  學生ID: "ref_student_id"
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
  importMode: "bySeat" | "byStudentId" = "bySeat";
 
  @Input() StudentList: CounselStudent[] | StudentInfo[] = [];
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
  }

  async loadAllTeacher() {
    let rsp = await this.dsaService.send("_.GetAllTeacher", {});
    this.TeacherList = [].concat(rsp.Teacher || []);
  }
  async loadAllStudent(){

  let rsp = await this.dsaService.send("_.GetAllStudent", {});
    this.StudentList = [].concat(rsp.Students || []);
    console.log("this.StudentList",this.StudentList)

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
    this.validator.setImportMode(this.importMode);
    this.validator.setRole(this.Role);
    this.validator.setStudentList(this.StudentList);
    this.validator.setTeacherList(this.TeacherList);
    this.validator.setSpecialStudentCheck((student) => {
      return (this.StudentList as any[]).some((s: any) => 
        s.StudentNumber === student.StudentNumber
      );
    });


    
    const allErrors: { row: number; column: string; message: string }[] = [];
    if(rawRows.length == 0 ){      allErrors.push( { row: 0, column: '', message: '至少一列資料' });}
    rawRows.forEach((row, index) => {
      const rowNum = index + 2;
      const rowErrors = this.validator.validateRow(row, rowNum);
      allErrors.push(...rowErrors);
    });

    if (allErrors.length > 0) {
      this.showErrorMsg = true;
      this.errorList = allErrors;
      this.interviewLists = [];
      return;
    }

    this.showErrorMsg = false;
    this.errorList = [];
    this.interviewLists = this.transformExcelRows(rawRows);
  }

  onImportModeChange(mode: "bySeat" | "byStudentId") {
    this.importMode = mode;
    if (this.uploadedFile) {
      this.validateUploadedFile(this.uploadedFile);
    }
  }

  async insertCunsels() {
    const Request = { interviewLists: this.interviewLists };
    try {
      await this.dsaService.send("_.AddInterviewList", { Request });
      alert("匯入成功");
    } catch (ex) {
      alert("匯入發生錯誤"+JSON.stringify(ex));
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
          <style>
            body { font-family: Arial; padding: 1rem; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; vertical-align: top; }
            th { background-color: #f2f2f2; }
            td:first-child { width: 100px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>驗證錯誤詳細列表</h2>
          <table>
            <thead>
              <tr>
                <th>第幾列</th>
                <th>錯誤訊息</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(groupedErrors).map(([row, messages]) => `
                <tr>
                  <td>第 ${row} 列</td>
                  <td>${messages.join('<br>')}</td>
                </tr>
              `).join('')}
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
      alert('無法開啟新分頁，請確認瀏覽器沒有封鎖彈出視窗。');
    }
  }

  public async readExcelFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = (e.target as FileReader).result;
        const data = new Uint8Array(result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        resolve(jsonData);
      };

      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }

  transformExcelRows(rows: any[]): any[] {
    const sharedBatchCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    return rows.map((row, index) => {
      const result: any = {};

      for (const zhKey in fieldMap) {
        const enKey = fieldMap[zhKey];
        const value = row[zhKey];
        result[enKey] = enKey === "is_private" ? value === "否" : value;
      }

      // 根據匯入模式決定學生匹配方式
      console.log("=== 匯入組件 - 學生ID獲取檢查 ===");
      console.log("StudentList 總數:", this.StudentList.length);
      console.log("StudentList 前3筆資料:", this.StudentList.slice(0, 3));
      console.log("匯入模式:", this.importMode);
      console.log("當前行資料:", row);
      console.log("初始 result[ref_student_id]:", result["ref_student_id"]);
      
      if (this.importMode === "byStudentId") {
        // 按學號匹配
        if (row["學號"]) {
          const studentNumber = row["學號"].toString().trim();
          
          let foundStudent = null;
          for (const s of this.StudentList) {
            if ((s as any).StudentNumber === studentNumber) {
              foundStudent = s;
              break;
            }
          }
        
          if (foundStudent) {
            result["ref_student_id"] = (foundStudent as any).StudentID || (foundStudent as any).ref_student_id;
          } else {
            console.log(`匯入-學號匹配失敗: ${studentNumber}`);
            result["ref_student_id"] = null;
          }
        } else {
          console.log("Excel中沒有學號資料");
        }
      } else if (this.importMode === "bySeat") {
        // 按班級+座號匹配
        const className = (row["班級"] || "").toString().trim();
        const seatNo = (row["座號"] || "").toString().trim();
        console.log("要查找的班級:", className, "座號:", seatNo);

        result["ref_student_id"] = null; // 清空學號，強制使用班級座號匹配

        let foundStudent = null;
 
        for (const s of this.StudentList) {
          const studentClassName = (s.ClassName || "").toString();
          const studentSeatNo = s.SeatNo != null ? s.SeatNo.toString() : "";
          console.log(`比對學生: 班級=${studentClassName}, 座號=${studentSeatNo}, 學生ID=${s.StudentID}`);
          console.log(`比對條件: 班級=${className}, 座號=${seatNo}`);
          console.log(`比對結果: 班級相符=${studentClassName === className}, 座號相符=${studentSeatNo === seatNo}`);
          
          if (studentClassName === className && studentSeatNo === seatNo) {
            foundStudent = s;
            result["ref_student_id"] = s.StudentID;
            console.log(`匯入-班級座號匹配成功: ${className}-${seatNo} -> ${result["ref_student_id"]}`);
            console.log("找到的學生完整資料:", foundStudent);
            break;
          }
        }
        
        if (!result["ref_student_id"]) {
          console.log(`匯入-班級座號匹配失敗: ${className}-${seatNo}`);
        }
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

}


