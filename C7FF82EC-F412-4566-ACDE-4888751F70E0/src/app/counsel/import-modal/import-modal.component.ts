import { Component, Input, OnInit } from "@angular/core";
import { CounselImportValidationService } from "src/app/counsel-import-validation.service";
import { CounselStudent } from "src/app/counsel-student.service";
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
  聯絡事項: "referral_desc",
  輔導內容: "content",
  類別: "category",
  類別其他: "category_other",
  教師ID:"ref_teacher_id",
  學生ID:"ref_student_id"
};

@Component({
  selector: "app-import-modal",
  templateUrl: "./import-modal.component.html",
  styleUrls: ["./import-modal.component.css"],
})
export class ImportModalComponent implements OnInit {
  interviewLists = [];
  uploadedFileName: string = '';
  TeacherList = []
  constructor(
    private globalService: GlobalService,
    private dsaService: DsaTransferService,
    private validator: CounselImportValidationService
  ) {}

  @Input() StudentList: CounselStudent[] = [];
  // @Input() TeacherList: { ID: string; Name: string; NickName: string; Role: string }[] = [];

  ngOnInit() {
    // console.log("hello ", this.StudentList);
    this.loadAllTeacher()
  }

  errorList: { row: number; column: string; message: string }[] = [];
  showErrorMsg: boolean = false;
  importMode: "bySeat" | "byStudentId" = "bySeat";

async loadAllTeacher()
{
   let rsp = await this.dsaService.send("_.GetAllTeacher", {  });
   this.TeacherList = [].concat(rsp.Teacher||[])

}
canImport(): boolean {
  return this.errorList.length === 0 && this.interviewLists.length > 0;
}
async onFileSelected(event: any) {
  const file: File = event.target.files[0];
  this.uploadedFileName = file.name; // 儲存檔案名稱

  const rawRows = await this.readExcelFile(file);
  this.errorList = [];
  this.validator.setImportMode(this.importMode);
  this.validator.setRole("班導師");
  this.validator.setStudentList(this.StudentList);
  this.validator.setTeacherList(this.TeacherList);
  this.validator.setSpecialStudentCheck((student) => {
    return this.StudentList.includes(student.StudentNumber);
  });
  
  const allErrors: { row: number; column: string; message: string }[] = [];

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

  this.interviewLists = this.transformExcelRows(rawRows);
}

  async insertCunsels() {
    const Request = {
      interviewLists: this.interviewLists,
    };
    try {
      await this.dsaService.send("_.AddInterviewList", { Request });
      alert("匯入成功")
    } catch (ex) {
      alert("匯入發生錯誤");
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
              ${
                Object.entries(groupedErrors).map(([row, messages]) => `
                  <tr>
                    <td>第 ${row} 列</td>
                    <td>${messages.join('<br>')}</td>
                  </tr>
                `).join('')
              }
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
    var result: any = {};

    // 基本欄位填入
    for (var zhKey in fieldMap) {
      var enKey = fieldMap[zhKey];
      var value = row[zhKey];
      if (enKey === "is_private") {
        result[enKey] = value === "否" ? true : false;
      } else {
        result[enKey] = value;
      }
    }

    // 補齊學生 ID
    if (!result["ref_student_id"]) {
      var className = (row["班級"] || "").toString().trim();
      var seatNo = (row["座號"] || "").toString().trim();

      for (var i = 0; i < this.StudentList.length; i++) {
        var s = this.StudentList[i];
        if (
          (s.ClassName || "").toString() === className &&
          (s.SeatNo != null ? s.SeatNo.toString() : "") === seatNo
        ) {
          result["ref_student_id"] = s.StudentID;
          break;
        }
      }
    }

    // 補齊老師 ID
    var authorName = (row["記錄者"] || "").toString().trim();
    for (var j = 0; j < this.TeacherList.length; j++) {
      var t = this.TeacherList[j];
      if (t.Name === authorName || t.NickName === authorName) {
        result["ref_teacher_id"] = t.ID;
        break;
      }
    }

    // 類別轉換
    var allowedCategories = [
      "人際困擾", "師生關係", "家庭困擾", "自我探索", "情緒困擾", "生活壓力",
      "創傷反應", "自我傷害", "性別議題", "脆弱家庭", "兒少保議題", "學習困擾",
      "生涯輔導", "偏差行為", "網路沉迷", "中離(輟)拒學", "藥物濫用", "精神疾患", "其他"
    ];
    var rawCategory = (row["類別"] || "").toString();
    var otherText = (row["類別其他"] || "").toString();
    var categoryItems: any[] = [];

    for (var c = 0; c < allowedCategories.length; c++) {
      var item = allowedCategories[c];
      var answer_martix: string[] = [];
      var answer_text = item;
      var checked = rawCategory.indexOf(item) !== -1;

      if (item === "其他") {
        answer_martix = ["其他", otherText];
        answer_text = "其他%text1%";
      }

      categoryItems.push({
        answer_code: "Category" + (c + 1),
        answer_martix: answer_martix,
        answer_text: answer_text,
        answer_checked: checked,
        answer_complete: false,
        answer_value: ""
      });
    }

    result["category_json"] = JSON.stringify(categoryItems);

    // 新增 import_info 欄位
    const importInfo = {
      created_by_name: this.globalService.teacherName || "",
      ref_teacher_id: this.globalService.teacherID|| null,
      batch_code: sharedBatchCode,
      type: "班導師"
    };
    result["import_info"] = JSON.stringify(importInfo);

    return result;
  });
}
onModalClose() {
  this.showErrorMsg = false;
  this.errorList = [];
  this.interviewLists = [];
  // 如還有其他欄位如檔案 input 或欄位資料，也可以加上清空處理
}


downloadTemplate() {
  const data = [
    [
      '年級', '班級', '座號', '學號', '學年度', '學期', '日期', '晤談時間',
      '方式', '方式其他', '對象', '記錄者', '暱稱', '公開',
      '聯絡事項', '輔導內容', '類別', '類別其他', '狀態'
    ],
    // 可再加入範例資料列
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '範本');

  // 產生二進位串流
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });

  // 使用原生下載
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '一級輔導匯入範本.xlsx';
  a.click();
  window.URL.revokeObjectURL(url);
}
}
