import { Alert } from 'selenium-webdriver';
import { Injectable } from "@angular/core";

type ValidatorFn = (value: any, row?: any) => string | null;

export interface RowError {
  row: number;
  column: string;
  message: string;
  value?: any;
}

@Injectable({
  providedIn: "root",
})
export class CounselImportValidationService {



  private allowedValues: Record<string, string[]> = {
    對象: ["學生", "教職員", "家長", "專業人員", "其他"],
    方式: ["面談", "電話", "聯絡簿", "個別約談家長", "會議", "E-mail", "其他"],
    公開: ["是", "否"],
    狀態: ["一般", "休學", "延修"],
    學期: ["1", "2"],
  };

    public allowedCategoryList: string[] = [
    "人際困擾", "情緒困擾", "性別議題", "生涯輔導", "藥物濫用",
    "師生關係", "生活壓力", "脆弱家庭", "創傷反應", "自我傷害",
    "家庭困擾", "兒少保護", "網路沉迷", "自我探索", "學習困擾",
    "中離(輟)拒學", "偏差行為", "精神疾患", "轉介輔導室", "其他",
  ];

  private studentList: any[] = [];
  private teacherList: { ID: string; Name: string; NickName: string; Role: string }[] = [];
  private isSpecialStudentFn: (student: any) => boolean = () => true;
  private importMode: "bySeat" | "byStudentId" = "bySeat";
  private role: "班導師" | "管理者" | "" = "";

  public setStudentList(list: any[]) {
    this.studentList = list;
  }

  public setTeacherList(list: { ID: string; Name: string; NickName: string; Role: string }[]) {
    this.teacherList = list;
  }

  public setSpecialStudentCheck(fn: (student: any) => boolean) {
    this.isSpecialStudentFn = fn;
  }

  public setImportMode(mode: "bySeat" | "byStudentId") {
    this.importMode = mode;
  }

  public setRole(role: "班導師" | "管理者") {
    this.role = role;
  }

  private isBlank = (v: any): boolean => v == null || String(v).trim() === "";

  private validators: Record<string, ValidatorFn[]> = {
    年級: [
      (v) => (this.isBlank(v) ? "年級為必填" : null),
      (v) => (isNaN(v) ? "年級需為數字" : null),
      (v) => (Number(v) <= 0 ? "年級必須大於 0" : null),
    ],
    學號: [
      (v) => (this.isBlank(v) ? "學號為必填" : null),
      (v) => !/^[A-Z0-9]{4,10}$/.test(String(v).trim()) ? "學號格式錯誤（4~10位英數字）" : null 
    ],
    學年度: [
      (v) => (this.isBlank(v) ? "學年度為必填" : null),
      (v) => (isNaN(v) ? "學年度需為數字" : null),
      (v) => (Number(v) > new Date().getFullYear() - 1911 ? "學年度不能是未來" : null),
    ],
    學期: [
      (v) => (this.isBlank(v) ? "學期為必填" : null),
      (v) => this.allowedValues["學期"].indexOf(String(v)) === -1 ? "學期應為 1 或 2" : null,
    ],
    日期: [
      (v) => (this.isBlank(v) ? "日期為必填" : null),
      (v) => !/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(String(v)) ? "日期格式錯誤（應為 yyyy/MM/dd）" : null,
      (v) => new Date(v) > new Date() ? "日期不能是未來" : null,
    ],
    方式: [
      (v) => (this.isBlank(v) ? "方式為必填" : null),
      (v) => this.allowedValues["方式"].indexOf(String(v).trim()) === -1 ? "方式應為 " + this.allowedValues["方式"].join("、") : null,
    ],
    對象: [
      (v) => (this.isBlank(v) ? "對象為必填" : null),
      (v) => this.allowedValues["對象"].indexOf(String(v).trim()) === -1 ? "對象應為 " + this.allowedValues["對象"].join("、") : null,
    ],
    記錄者: [
      (v) => (this.isBlank(v) ? "記錄者為必填" : null),
      (v) => !/^[\u4e00-\u9fa5]{2,}[\u4e00-\u9fa5（）()]+$/.test(String(v).trim()) ? "記錄者應為教師姓名" : null,
    ],
    公開: [
      (v) => (this.isBlank(v) ? "公開為必填" : null),
      (v) => this.allowedValues["公開"].indexOf(String(v).trim()) === -1 ? "公開欄位應為 是 或 否" : null,
    ],
   類別: [
  (v) => {
    if (this.isBlank(v)) return "類別為必填";
    const values = String(v).split(",").map(x => x.trim());
    const invalid = values.filter(item =>
      !this.allowedCategoryList.includes(item) && !item.startsWith("其他")
    );
    return invalid.length > 0 ? `類別中包含無效選項：「${invalid.join("、")}」` : null;
  }
],
    狀態: [
      (v) => (this.isBlank(v) ? "狀態為必填" : null),
      (v) => this.allowedValues["狀態"].indexOf(String(v).trim()) === -1 ? "狀態應為 一般、休學 或 延修" : null,
    ],
  };

public validateRow(row: any, rowNum: number): RowError[] {
  const errorMap: Map<string, string[]> = new Map();

  Object.keys(this.validators).forEach((field) => {
    if (field === "學號") return; // ❗跳過學號，下面另外判斷
    const rules = this.validators[field];
    const value = row[field];
    rules.forEach((rule) => {
      const result = rule(value, row);
      if (result) {
        if (!errorMap.has(field)) errorMap.set(field, []);
        errorMap.get(field).push(result);
      }
    });
  });

  // ✅ 僅在匯入模式為學號時驗證學號
  if (this.importMode === "byStudentId") {
    const val = row["學號"];
    if (this.isBlank(val)) {
      errorMap.set("學號", ["匯入模式為學號，學號欄必填"]);
    } else if (!/^[A-Z0-9]{4,10}$/.test(String(val).trim())) {
      errorMap.set("學號", ["學號格式錯誤（4~10位英數字）"]);
    }
  } else {
    if (this.isBlank(row["班級"])) errorMap.set("班級", ["匯入模式為班級座號，班級欄必填"]);
    if (this.isBlank(row["座號"])) {
      errorMap.set("座號", ["匯入模式為座號，座號欄必填"]);
    } else if (Number(row["座號"]) <= 0) {
      errorMap.set("座號", ["座號必須大於 0"]);
    }
  }

  if (row["方式"] && String(row["方式"]).trim() === "其他" && this.isBlank(row["類別其他"])) {
    errorMap.set("類別其他", ["當方式為其他時，此欄必填"]);
  }

  if (this.isBlank(row["年級"])) errorMap.set("年級", ["年級欄必填"]);

  if (row["對象"] && String(row["對象"]).trim() === "其他" && this.isBlank(row["對象其他"])) {
    errorMap.set("對象其他", ["當對象為其他時，此欄必填"]);
  }

  if (row["類別"] && String(row["類別"]).indexOf("其他") !== -1 && this.isBlank(row["類別其他"])) {
    errorMap.set("類別其他", ["當類別包含其他時，類別其他欄必填"]);
  }

  if (this.isBlank(row["聯絡事項"]) && this.isBlank(row["輔導內容"])) {
    errorMap.set("聯絡事項 / 輔導內容", ["聯絡事項與輔導內容需擇一填寫"]);
  }

  // 👇 找學生
  let matchedStudent: any = null;
  if (this.importMode === "byStudentId") {
    matchedStudent = this.studentList.find((s) => s.StudentNumber === row["學號"]);
  } else {
    console.log("this.studentList",this.studentList)
    matchedStudent = this.studentList.some((s) =>
      s.ClassName == row["班級"] &&
      s.SeatNo == row["座號"]
      
    );
  }

   const key = this.importMode === "byStudentId" ? "學號" : "座號";
  if (!matchedStudent) {
  if (this.role === "班導師") {
      const key = this.importMode === "byStudentId" ? "學號" : "座號";
      errorMap.set(key, ["此學生非當前頁面學生，無法匯入"]);
    } else if (this.importMode === "byStudentId"  &&!this.isSpecialStudentFn(matchedStudent)) {
      errorMap.set("學號", ["此學生非特學學生群，無法匯入"]);
    }
  }

  return this.formatErrors(rowNum, errorMap, row);
}
private formatErrors(rowNum: number, errorMap: Map<string, string[]>, row?: any): RowError[] {
  const result: RowError[] = [];

  errorMap.forEach(function (messages, column) {
    const rawValue = row && typeof row[column] !== "undefined" ? row[column] : null;
    const valueText =
      rawValue === null || String(rawValue).trim() === ""
        ? "空值"
        : String(rawValue).trim();

    const enhancedMessages = messages.map(function (msg) {
      return `${msg}（原始資料：${valueText}）`;
    });

    result.push({
      row: rowNum,
      column: column,
      message: enhancedMessages.join("；"),
      value: rawValue,
    });
  });

  return result;
}
}
