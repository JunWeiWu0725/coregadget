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
  private allStudents: any[] = [];
  
  private allowedValues: Record<string, string[]> = {
    對象: ["學生", "教職員", "家長", "專業人員", "其他"],
    方式: ["面談", "電話", "聯絡簿", "個別約談家長", "會議", "E-mail", "其他"],
    公開: ["是", "否"],
    狀態: ["一般", "延修", "休學"], // 支援一般、延修、休學
    學期: ["1", "2"],
  };

  // 狀態中文對應系統代碼
  private statusMapping: Record<string, string> = {
    "一般": "1",
    "延修": "2",
    "休學": "3"
  };

  public allowedCategoryList: string[] = [
    "人際困擾",
    "情緒困擾",
    "性別議題",
    "生涯輔導",
    "藥物濫用",
    "師生關係",
    "生活壓力",
    "脆弱家庭",
    "創傷反應",
    "自我傷害",
    "家庭困擾",
    "兒少保護",
    "網路沉迷",
    "自我探索",
    "學習困擾",
    "中離(輟)拒學",
    "偏差行為",
    "精神疾患",
    "轉介輔導室",
    "其他",
  ];

  private studentList: any[] = [];
  private teacherList: {
    ID: string;
    Name: string;
    NickName: string;
    Role: string;
  }[] = [];
  private isSpecialStudentFn: (student: any) => boolean = () => true;
  private importMode: "bySeat" | "byStudentId" = "bySeat";
  private role: "班導師" | "管理者" | "" = "";

  public setStudentList(list: any[]) {
    this.studentList = list;
    console.log("=== 驗證服務收到的學生清單 ===");
    console.log(`學生數量: ${list.length}`);
    console.log("學生清單:", list.map(s => ({
      班級: s.ClassName,
      座號: s.SeatNo,
      姓名: s.StudentName,
      狀態: s.Status,
      學號: s.StudentNumber
    })));
  }

  public setTeacherList(
    list: { ID: string; Name: string; NickName: string; Role: string }[]
  ) {
    this.teacherList = list;
  }

  public setSpecialStudentCheck(fn: (student: any) => boolean) {
    this.isSpecialStudentFn = fn;
  }

  public setImportMode(mode: "bySeat" | "byStudentId") {
    this.importMode = mode;
  }

  public setRole(role: "班導師" | "管理者" | "") {
    this.role = role;
  }

  private isBlank = (v: any): boolean => v == null || String(v).trim() === ""

  public setStudentsData(students: any[]): void {
    this.allStudents = students;
  }

  private getStudentInfoForError(row: any): string {
    const importInfo = this.getImportInfo(row);
    const classInfo = this.getClassInfo(row);
    return ` (匯入資料: ${importInfo}|全班資料: ${classInfo})`;
  }

  private getImportInfo(row: any): string {
    if (this.importMode === "byStudentId") {
      return `學號: ${row["學號"] || "未填"}`;
    } else {
      return `班級: ${row["班級"] || "未填"}, 座號: ${row["座號"] || "未填"}`;
    }
  }

  private getClassInfo(row: any): string {
    // 嘗試找到對應的學生資料
    let student = null;
    if (this.importMode === "byStudentId") {
      student = this.allStudents.find(s => s.StudentID === row["學號"]);
    } else {
      student = this.allStudents.find(s => 
        s.ClassName === row["班級"] && s.SeatNo == row["座號"]
      );
    }

    if (student) {
      return `姓名: ${student.Name || "未知"}, 班級: ${student.ClassName || "未知"}, 座號: ${student.SeatNo || "未知"}, 學號: ${student.StudentID || "未知"}`;
    } else {
      return "查無此學生資料";
    }
  }

  private validators: Record<string, ValidatorFn[]> = {
    班級: [
      (v) => this.isBlank(v) ? "班級欄必填" : null,
    ],
    座號: [
      (v) => this.isBlank(v) ? "座號欄必填" : null,
      (v) => !this.isBlank(v) && Number(v) <= 0 ? "座號必須大於 0" : null,
    ],
    學號: [
      (v) => this.isBlank(v) ? "學號欄必填" : null,
    ],
    學年度: [
      (v) => this.isBlank(v) ? "學年度欄必填" : null,
      (v) => !this.isBlank(v) && !/^\d{3}$/.test(String(v)) ? "學年度格式錯誤（3位數字，如：113）" : null,
    ],
    學期: [
      (v) => this.isBlank(v) ? "學期欄必填" : null,
      (v) => !this.isBlank(v) && !this.allowedValues.學期.includes(String(v)) ? "學期應為 1 或 2" : null,
    ],
    日期: [
      (v) => this.isBlank(v) ? "日期欄必填" : null,
      (v) => {
        if (this.isBlank(v)) return null;
        const dateStr = String(v).trim();
        if (!/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dateStr)) {
          return "日期格式錯誤（格式：yyyy/m/d）";
        }
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? "日期無效" : null;
      },
    ],
    晤談時間: [
      (v) => {
        if (this.isBlank(v)) return null;
        const timeStr = String(v).trim();
        if (!/^\d{1,2}:\d{2}$/.test(timeStr)) {
          return "晤談時間格式錯誤（格式：h:mm）";
        }
        return null;
      },
    ],
    對象: [
      (v) => this.isBlank(v) ? "對象欄必填" : null,
      (v) => !this.isBlank(v) && !this.allowedValues.對象.includes(String(v).trim()) 
        ? `對象應為 ${this.allowedValues.對象.join(" 或 ")}` : null,
    ],
    方式: [
      (v) => this.isBlank(v) ? "方式欄必填" : null,
      (v) => !this.isBlank(v) && !this.allowedValues.方式.includes(String(v).trim()) 
        ? `方式應為 ${this.allowedValues.方式.join(" 或 ")}` : null,
    ],
    公開: [
      (v) => this.isBlank(v) ? "公開欄必填" : null,
      (v) => !this.isBlank(v) && !this.allowedValues.公開.includes(String(v).trim()) 
        ? "公開應為 是 或 否" : null,
    ],
    類別: [
      (v) => this.isBlank(v) ? "類別欄必填" : null,
      (v) => {
        if (this.isBlank(v)) return null;
        const categories = String(v).split(/[,，]/).map(c => c.trim());
        const invalidCategories = categories.filter(c => !this.allowedCategoryList.includes(c));
        return invalidCategories.length > 0 
          ? `類別包含無效項目：${invalidCategories.join(", ")}` : null;
      },
    ],
    記錄者: [
      (v) => this.isBlank(v) ? "記錄者欄必填" : null,
    ],
    狀態: [
      (v) => this.isBlank(v) ? "狀態欄必填" : null,
      (v) => !this.isBlank(v) && !this.allowedValues.狀態.includes(String(v).trim()) 
        ? "狀態應為 一般 或 延修 或 休學" : null,
    ],
  };

  public validateRow(row: any, rowNum: number): RowError[] {
    const errorMap: Map<string, string[]> = new Map();
    
    // 檢查是否整行為空
    const allFields = Object.keys(row);
    const hasContent = allFields.some((key) => !this.isBlank(row[key]));

    if (!hasContent) {
      errorMap.set("整行", ["整行資料為空，請檢查是否誤匯入空白列"]);
      return this.formatErrors(rowNum, errorMap, row);
    }

    Object.keys(this.validators).forEach((field) => {
      if (field === "學號") return; // 跳過學號，下面另外判斷
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

    // 僅在匯入模式為學號時驗證學號
    if (this.importMode === "byStudentId") {
      const val = row["學號"];
      if (this.isBlank(val)) {
        errorMap.set("學號", ["匯入模式為學號，學號欄必填"]);
      } else if (!/^[A-Z0-9]{4,10}$/.test(String(val).trim())) {
        const studentInfo = ` (匯入資料: 學號: ${val})`;
        errorMap.set("學號", [`學號格式錯誤（4~10位英數字）${studentInfo}`]);
      }
    } else {
      if (this.isBlank(row["班級"])) {
        const studentInfo = ` (匯入資料: 座號: ${row["座號"] || "未填"})`;
        errorMap.set("班級", [`匯入模式為班級座號，班級欄必填${studentInfo}`]);
      }
      if (this.isBlank(row["座號"])) {
        const studentInfo = ` (匯入資料: 班級: ${row["班級"] || "未填"})`;
        errorMap.set("座號", [`匯入模式為座號，座號欄必填${studentInfo}`]);
      } else if (Number(row["座號"]) <= 0) {
        const studentInfo = ` (匯入資料: 班級: ${row["班級"] || "未填"}, 座號: ${row["座號"]})`;
        errorMap.set("座號", [`座號必須大於 0${studentInfo}`]);
      }
    }

    if (
      row["方式"] &&
      String(row["方式"]).trim() === "其他" &&
      this.isBlank(row["類別其他"])
    ) {
      const studentInfo = this.getStudentInfoForError(row);
      errorMap.set("類別其他", [`當方式為其他時，此欄必填${studentInfo}`]);
    }

    if (this.isBlank(row["年級"])) {
      const studentInfo = this.getStudentInfoForError(row);
      errorMap.set("年級", [`年級欄必填${studentInfo}`]);
    }

    if (
      row["對象"] &&
      String(row["對象"]).trim() === "其他" &&
      this.isBlank(row["對象其他"])
    ) {
      const studentInfo = this.getStudentInfoForError(row);
      errorMap.set("對象其他", [`當對象為其他時，此欄必填${studentInfo}`]);
    }

    if (
      row["類別"] &&
      String(row["類別"]).indexOf("其他") !== -1 &&
      this.isBlank(row["類別其他"])
    ) {
      const studentInfo = this.getStudentInfoForError(row);
      errorMap.set("類別其他", [`當類別包含其他時，類別其他欄必填${studentInfo}`]);
    }

    if (this.isBlank(row["聯絡事項"]) && this.isBlank(row["輔導內容"])) {
      const studentInfo = this.getStudentInfoForError(row);
      errorMap.set("聯絡事項 / 輔導內容", [`聯絡事項與輔導內容需擇一填寫${studentInfo}`]);
    }

    // 找學生
    let matchedStudent: any = null;
    const originalStatus = row["狀態"]; // 保留原始中文狀態
    
    // 根據角色決定使用哪種狀態比對方式
    let compareStatus: string;
    if (this.role === "班導師") {
      // 班導師直接用中文狀態比對
      compareStatus = originalStatus;
      console.log(`🔍 班導師模式 - 直接使用中文狀態: "${compareStatus}"`);
    } else {
      // 管理者等其他角色使用系統代碼
      compareStatus = this.statusMapping[originalStatus] || originalStatus;
      console.log(`🔍 管理者模式 - 狀態轉換: "${originalStatus}" → "${compareStatus}"`);
    }
    
    console.log(`學生清單中的狀態範例:`, this.studentList.slice(0, 3).map(s => `"${s.Status}"`));
    
    if (this.importMode === "byStudentId") {
      matchedStudent = this.studentList.find(
        (s) => s.StudentNumber === row["學號"] && s.Status === compareStatus
      );
    } else {
      matchedStudent = this.studentList.find(
        (s) => s.ClassName == row["班級"] && s.SeatNo == row["座號"] && s.Status === compareStatus
      );
      
             console.log(`🔍 座號匹配詳細分析:`);
       console.log(`查找條件: 班級="${row["班級"]}", 座號="${row["座號"]}", 狀態="${compareStatus}"`);
       
       if (!matchedStudent) {
         // 逐一檢查每個條件
         const allMatches = this.studentList.map(s => ({
           學生: s.StudentName,
           班級匹配: s.ClassName == row["班級"],
           座號匹配: s.SeatNo == row["座號"], 
           狀態匹配: s.Status === compareStatus,
           實際狀態: s.Status
         }));
         
         console.log("詳細匹配分析:", allMatches);
         
         // 特別檢查工202班的學生
         const class202Students = this.studentList.filter(s => s.ClassName && s.ClassName.includes("202"));
         if (class202Students.length > 0) {
           console.log(`🔍 工202班學生詳細檢查:`, class202Students.map(s => ({
             學生: s.StudentName,
             班級匹配: s.ClassName == row["班級"],
             座號匹配: s.SeatNo == row["座號"],
             狀態匹配: s.Status === compareStatus,
             實際狀態: s.Status
           })));
         }
       } else {
         console.log(`✅ 找到匹配學生: ${matchedStudent.StudentName}`);
         console.log(`✅ 成功找到學生! 學生: ${matchedStudent.StudentName}, 班級: ${matchedStudent.ClassName}, 座號: ${matchedStudent.SeatNo}, 狀態: "${matchedStudent.Status}"`);
       }
    }

    const key = this.importMode === "byStudentId" ? "學號" : "座號";
    if (!matchedStudent) {
      console.log(`❌ 驗證失敗 - 找不到匹配的學生`);
      console.log(`查找條件: 班級="${row["班級"]}", 座號="${row["座號"]}", 狀態="${compareStatus}"`);
      console.log(`可用學生清單:`, this.studentList.map(s => `${s.ClassName}-${s.SeatNo}-${s.Status}(${s.StudentName})`));
      
      // 建立詳細的錯誤訊息，包含匯入資料資訊
      let errorMessage = "";
      let importInfo = "";
      
      if (this.importMode === "byStudentId") {
        importInfo = `學號: ${row["學號"] || "未填"}, 狀態: ${row["狀態"] || "未填"}`;
      } else {
        importInfo = `班級: ${row["班級"] || "未填"}, 座號: ${row["座號"] || "未填"}, 狀態: ${row["狀態"] || "未填"}`;
      }
      
      if (this.role === "班導師") {
        console.log(`班導師權限檢查失敗 - 查找條件: 班級="${row["班級"]}", 座號="${row["座號"]}", 狀態="${compareStatus}"`);
        console.log(`您目前可輔導的學生:`, this.studentList.map(s => `${s.ClassName} 座號${s.SeatNo} ${s.StudentName} (狀態:${s.Status})`));
        errorMessage = `此學生非本班學生，無法匯入 (匯入資料: ${importInfo})`;
      } else if (this.role === "管理者") {
        errorMessage = `非本校系統學生，無法匯入 (匯入資料: ${importInfo})`;
      } else {
        errorMessage = `找不到此學生，無法匯入 (匯入資料: ${importInfo})`;
      }
      
      errorMap.set(key, [errorMessage]);
    } else {
      // 找到學生，但需要檢查是否有權限匯入
      console.log(`✅ 找到學生: ${matchedStudent.StudentName}, 班級: ${matchedStudent.ClassName}, 座號: ${matchedStudent.SeatNo}`);
      console.log(`🔍 檢查權限 - 角色: ${this.role}, 匯入模式: ${this.importMode}`);
      
      if (this.importMode === "byStudentId" && !this.isSpecialStudentFn(matchedStudent)) {
        console.log(`❌ 特殊學生檢查失敗 - 學生: ${matchedStudent.StudentName}, 角色: ${this.role}, 匯入模式: ${this.importMode}`);
        const importInfo = `學號: ${row["學號"] || "未填"}, 學生姓名: ${matchedStudent.StudentName}, 班級: ${matchedStudent.ClassName}`;
        errorMap.set("學號", [`此學生非本班學生，無法匯入 (匯入資料: ${importInfo})`]);
      } else {
        // ✅ 驗證通過，將找到的學生ID設定到原始資料中
        console.log(`🎯 驗證通過，設定 ref_student_id = ${matchedStudent.StudentID}`);
        row["_ref_student_id"] = matchedStudent.StudentID; // 使用特殊前綴避免與使用者輸入衝突
        row["_matched_student_name"] = matchedStudent.StudentName; // 記錄匹配的學生姓名供偵錯用
      }
    }

    return this.formatErrors(rowNum, errorMap, row);
  }

  private formatErrors(
    rowNum: number,
    errorMap: Map<string, string[]>,
    row?: any
  ): RowError[] {
    const errors: RowError[] = [];
    errorMap.forEach((messages, column) => {
      messages.forEach((message) => {
        errors.push({
          row: rowNum,
          column,
          message,
          value: row ? row[column] : undefined,
        });
      });
    });
    return errors;
  }

  private isBlankValidator = (message: string): ValidatorFn => (v) =>
    this.isBlank(v) ? message : null;

  private allowedValuesValidator = (
    field: string,
    message?: string
  ): ValidatorFn => (v) =>
    !this.isBlank(v) && !this.allowedValues[field].includes(String(v).trim())
      ? message || `${field}值不正確`
      : null;
}
