import { Component, Input, OnInit } from "@angular/core";
import { CounselImportValidationService } from "src/app/counsel-import-validation.service";
import { CounselStudent } from "src/app/counsel-student.service";
import { GlobalService } from "src/app/global.service";
import { DsaTransferService } from "src/app/transfer-students/service/dsa-transfer.service";
import * as XLSX from "xlsx";

export const fieldMap: Record<string, string> = {
  年級: "grade_year",
  學號: "ref_student_id",
  學年度: "school_year",
  學期: "semester",
  日期: "occur_date",
  晤談時間: "meeting_time",
  方式: "contact_item",
  對象: "contact_name",
  記錄者: "author_name",
  公開: "is_private",
  聯絡事項: "referral_desc",
  輔導內容: "content",
  類別: "category",
};
@Component({
  selector: "app-import-modal",
  templateUrl: "./import-modal.component.html",
  styleUrls: ["./import-modal.component.css"],
})
export class ImportModalComponent implements OnInit {
  interviewLists = [];
  constructor(   
    private globalService: GlobalService,
    private dsaService: DsaTransferService,
    private validator: CounselImportValidationService
  ) {}

  @Input() StudentList :CounselStudent[]= [];
  

  ngOnInit() {


    console.log("hello ", this.StudentList)
  }
  errorList: { row: number; column: string; message: string }[] = [];
  
  showErrorMsg: boolean = false;
  importMode: "bySeat" | "byStudentId" = "bySeat"; // 預設為班級座號
  async onFileSelected(event: any) {
    
    const rawRows = await this.readExcelFile(event.target.files[0]);
    console.log("all row ", rawRows);
    this.errorList = []; // 每次清空錯誤
     this.validator.setStudentList(this.StudentList);
    this.validator.setSpecialStudentCheck((student) => {
  // 根據 StudentList 是否為特學群來判斷
  // const specialStudentIds = this.StudentList
  //   .map(s => s.StudentNumber);

  return this.StudentList.includes(student.StudentNumber);
});
    const allErrors: { row: number; column: string; message: string }[] = [];

    rawRows.forEach((row, index) => {
      const rowNum = index + 2; // Excel 第2列開始是資料列
      const rowErrors = this.validator.validateRow(row, rowNum); 

      allErrors.push(...rowErrors);
    });
    // console.log("allErrors",allErr
    if (allErrors.length > 0) {
      this.showErrorMsg = true;
      this.errorList = allErrors;
      this.interviewLists = []; // 有錯誤不進行轉換
      return;
    }

    this.interviewLists = this.transformExcelRows(rawRows);
    console.log("✅ 匯入成功 interviewLists：", this.interviewLists);
  }
  /** 【 匯入 】 */
  async insertCunsels() {
    const addBody = {
      interviewLists: this.interviewLists,
    };
    await this.dsaService.send("_.AddInterviewList", { addBody });
  }

  /** 讀取資料 */
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
      reader.readAsArrayBuffer(file); // ✅ 這行就不需要 arrayBuffer()
    });
  }

  transformExcelRows(rows: any[]): any[] {
    return rows.map((row, index) => {
      const result: any = {};

      Object.entries(fieldMap).forEach(([zhKey, enKey]) => {
        let value = row[zhKey];

        if (enKey === "is_private") {
          result[enKey] = value === "否" ? true : false;
        } else {
          result[enKey] = value;
        }
      });

      return result;
    });
  }
}
