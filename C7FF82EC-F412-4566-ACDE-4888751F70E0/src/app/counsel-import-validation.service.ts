import { Injectable } from "@angular/core";

type ValidatorFn = (value: any) => string | null;

@Injectable({
  providedIn: "root",
})
export class CounselImportValidationService {
  private allowedCategoryList: string[] = [
    "人際困擾", "情緒困擾", "性別議題", "生涯輔導", "藥物濫用",
    "師生關係", "生活壓力", "脆弱家庭", "偏差行為", "精神疾患",
    "家庭困擾", "創傷反應", "兒少保護", "網路沉迷", "自我探索",
    "自我傷害", "學習困擾", "中離(輟)拒學", "其他", "轉介輔導室",
  ];

  private allowedValues: Record<string, string[]> = {
    對象: ["學生", "教職員", "家長", "專業人員", "其他"],
    方式: ["面談", "電話", "聯絡簿", "個別約談家長", "會議", "E-mail", "其他"],
    公開: ["是", "否"],
  };

  private studentList: any[] = [];
  private isSpecialStudentFn: (student: any) => boolean = () => true;
  private importMode: "bySeat" | "byStudentId" = "bySeat";

  public setStudentList(list: any[]) {
    this.studentList = list;
  }

  public setSpecialStudentCheck(fn: (student: any) => boolean) {
    this.isSpecialStudentFn = fn;
  }

  public setImportMode(mode: "bySeat" | "byStudentId") {
    this.importMode = mode;
  }

  private validators: Record<string, ValidatorFn[]> = {
    年級: [
      (v) => (v === "" ? "年級為必填" : null),
      (v) => (isNaN(v) ? "年級需為數字" : null),
    ],
    學號: [
      (v) => (v === "" ? "學號為必填" : null),
      (v) => !/^[A-Z0-9]{6,10}$/.test(v) ? "學號格式錯誤（6~10位英數字）" : null,
    ],
    日期: [
      (v) => (v === "" ? "日期為必填" : null),
      (v) => !/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(v) ? "日期格式錯誤（應為 yyyy/MM/dd）" : null,
    ],
    公開: [
      (v) => this.allowedValues["公開"].includes(v) ? null : "公開欄位應為 是 或 否",
    ],
    對象: [
      (v) => this.allowedValues["對象"].includes(v) ? null : `對象應為 ${this.allowedValues["對象"].join("、")}`,
    ],
    方式: [
      (v) => this.allowedValues["方式"].includes(v) ? null : `方式應為 ${this.allowedValues["方式"].join("、")}`,
    ],
    類別: [
      (v) => {
        if (!v) return "類別為必填";
        const values = v.split(",").map((x) => x.trim());
        const invalid = values.filter(
          (item) => !this.allowedCategoryList.includes(item) && !item.startsWith("其他:")
        );
        return invalid.length > 0 ? `類別中包含無效選項：${invalid.join("、")}` : null;
      },
    ],
  };

  public validateRow(row: any, rowNum: number): { row: number; column: string; message: string }[] {
    const errors: { row: number; column: string; message: string }[] = [];

    // 欄位格式驗證
    Object.keys(this.validators).forEach((field) => {
      const rules = this.validators[field];
      const value = row[field];

      rules.forEach((rule) => {
        const result = rule(value);
        if (result) {
          errors.push({
            row: rowNum,
            column: field,
            message: result,
          });
        }
      });
    });

    // 🔍 學生身份驗證（依匯入模式）
    let matchedStudent: any = null;

    if (this.importMode === "byStudentId") {
      const studentNumber = row["學號"];
      matchedStudent = this.studentList.find((s) => s.StudentNumber === studentNumber);
    } else {
      const grade = row["年級"];
      const className = row["班級"];
      const seatNo = row["座號"];
      matchedStudent = this.studentList.find(
        (s) => s.GradeYear == grade && s.ClassName === className && s.SeatNo == seatNo
      );
    }

    if (!matchedStudent) {
      const key = this.importMode === "byStudentId" ? "學號" : "座號";
      errors.push({
        row: rowNum,
        column: key,
        message: "此學生非當前頁面學生，無法匯入",
      });
    } else if (!this.isSpecialStudentFn(matchedStudent)) {
      errors.push({
        row: rowNum,
        column: "學號",
        message: "此學生非特學學生群，無法匯入",
      });
    }

    return errors;
  }
}
