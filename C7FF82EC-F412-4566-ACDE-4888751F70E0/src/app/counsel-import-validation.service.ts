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
  private currentTeacherName: string = "";
  private currentTeacherID: string = "";

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
    console.log("=== 驗證服務收到的教師清單 ===");
    console.log(`教師數量: ${list.length}`);
    console.log("教師清單:", list.map(t => ({
      ID: t.ID,
      姓名: t.Name,
      暱稱: t.NickName,
      角色: t.Role
    })));
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

  public setCurrentTeacher(name: string, id: string) {
    this.currentTeacherName = name;
    this.currentTeacherID = id;
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
        // 支援 yyyy/mm/dd 和 yyyy/m/d 格式
        if (!/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dateStr)) {
          return "日期格式錯誤（格式：yyyy/mm/dd 或 yyyy/m/d）";
        }
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? "日期無效" : null;
      },
    ],
    晤談時間: [
      (v) => {
        if (this.isBlank(v)) return null;
        const timeStr = String(v).trim();
        // 支援文字輸入，如：第一節、第二節、上午、下午等
        // 也支援時間格式：h:mm
        const isTimeFormat = /^\d{1,2}:\d{2}$/.test(timeStr);
        const isTextFormat = timeStr.length > 0 && timeStr.length <= 20; // 文字長度限制
        
        if (!isTimeFormat && !isTextFormat) {
          return "晤談時間格式錯誤（可輸入文字如：第一節、上午，或時間格式：h:mm）";
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
    年級: [
      (v) => this.isBlank(v) ? "年級欄必填" : null,
      (v) => {
        if (this.isBlank(v)) return null;
        const gradeStr = String(v).trim();
        // 驗證是否為阿拉伯數字 1-12（支援國中7-9年級、私立高中10-12年級）
        if (!/^([1-9]|1[0-2])$/.test(gradeStr)) {
          return "年級應為阿拉伯數字 1-12（如：1、2、3、4、5、6、7、8、9、10、11、12）";
        }
        return null;
      },
    ],
    記錄者: [
      (v) => this.isBlank(v) ? "記錄者欄必填" : null,
      (v, row) => {
        if (this.isBlank(v)) return null;
        const authorName = String(v).trim();
        const nickname = row["暱稱"] ? String(row["暱稱"]).trim() : "";
        
        // 使用教師名稱 + 暱稱的組合來查找教師
        // 先找出所有姓名匹配的教師
        const nameMatches = this.teacherList.filter(t => t.Name === authorName);
        
        // 如果是班導師匯入，必須驗證記錄者是否是班導師本人
        if (this.role === "班導師") {
          // 先檢查姓名是否匹配
          if (authorName !== this.currentTeacherName) {
            return `記錄者「${authorName}」不是您本人，班導師匯入時記錄者必須是您本人「${this.currentTeacherName}」`;
          }
          // 如果有多個相同姓名的教師（包括班導師本人），需要驗證暱稱
          if (nameMatches.length > 1) {
            // 找到當前登入教師的資訊
            const currentTeacher = this.teacherList.find(t => t.ID === this.currentTeacherID);
            if (currentTeacher && !this.isBlank(currentTeacher.NickName)) {
              // 如果當前教師有暱稱，必須填寫暱稱
              if (this.isBlank(nickname)) {
                return `記錄者「${authorName}」有多位教師，請填寫您的暱稱「${currentTeacher.NickName}」以區分`;
              }
              // 驗證暱稱是否正確
              if (nickname !== currentTeacher.NickName) {
                return `記錄者「${authorName}」的暱稱「${nickname}」不正確，您的暱稱應為「${currentTeacher.NickName}」`;
              }
            }
          }
        }
        
        if (nameMatches.length === 0) {
          return `找不到記錄者「${authorName}」，請確認教師姓名是否正確`;
        }
        
        // 如果有多個相同姓名的教師，必須使用暱稱來區分
        // 注意：如果暱稱為空，錯誤會在"暱稱"驗證器中顯示，這裡不重複顯示
        if (nameMatches.length > 1) {
          if (!this.isBlank(nickname)) {
            // 使用姓名 + 暱稱的組合來精確匹配
            const exactMatches = nameMatches.filter(t => t.NickName === nickname);
            if (exactMatches.length === 0) {
              return `找不到記錄者「${authorName}」且暱稱「${nickname}」的教師，請確認教師姓名和暱稱是否正確`;
            }
            if (exactMatches.length > 1) {
              return `記錄者「${authorName}」且暱稱「${nickname}」有多位教師，資料重複，請聯繫系統管理員`;
            }
          }
          // 如果暱稱為空，不在此處報錯，由"暱稱"驗證器處理
          return null;
        }
        
        // 只有一個姓名匹配的教師，不需要驗證暱稱（除非有多個相同姓名的教師）
        // 暱稱驗證邏輯：只有當有姓名相同的教師時才需要驗證暱稱
        // 這裡已經確定只有一個匹配，所以不需要驗證暱稱
        
        return null;
      }
    ],
    暱稱: [
      (v, row) => {
        // 如果記錄者欄位有值，則暱稱欄位也需要驗證
        const authorName = row["記錄者"] ? String(row["記錄者"]).trim() : "";
        if (this.isBlank(authorName)) {
          return null; // 記錄者為空時，暱稱驗證由記錄者驗證器處理
        }
        
        const nickname = this.isBlank(v) ? "" : String(v).trim();
        
        // 使用教師名稱 + 暱稱的組合來查找教師
        // 先找出所有姓名匹配的教師
        const nameMatches = this.teacherList.filter(t => t.Name === authorName);
        
        if (nameMatches.length === 0) {
          return null; // 記錄者驗證會處理這個錯誤
        }
        
        // 暱稱驗證邏輯：只有當有姓名相同的教師時才需要驗證暱稱
        // 如果有多個相同姓名的教師，需要檢查是否所有教師都有暱稱
        if (nameMatches.length > 1) {
          // 檢查所有同名教師是否都有暱稱
          const teachersWithNickname = nameMatches.filter(t => !this.isBlank(t.NickName));
          const teachersWithoutNickname = nameMatches.filter(t => this.isBlank(t.NickName));
          
          // 如果所有教師都沒有暱稱，則不需要填寫暱稱（無法通過暱稱區分）
          if (teachersWithNickname.length === 0) {
            // 所有教師都沒有暱稱，無法通過暱稱區分，不要求填寫
            return null;
          }
          
          // 如果部分教師有暱稱，部分沒有，需要判斷
          // 如果填寫了暱稱，驗證是否匹配
          if (!this.isBlank(nickname)) {
            // 使用姓名 + 暱稱的組合來精確匹配
            const exactMatches = nameMatches.filter(t => t.NickName === nickname);
            if (exactMatches.length === 0) {
              return `找不到記錄者「${authorName}」且暱稱「${nickname}」的教師，請確認教師姓名和暱稱是否正確`;
            }
            if (exactMatches.length > 1) {
              return `記錄者「${authorName}」且暱稱「${nickname}」有多位教師，資料重複，請聯繫系統管理員`;
            }
            return null; // 唯一匹配成功
          }
          
          // 如果沒有填寫暱稱，但所有教師都有暱稱，則要求填寫
          if (teachersWithoutNickname.length === 0) {
            // 所有教師都有暱稱，必須填寫暱稱以區分
            return `記錄者「${authorName}」有多位教師，請填寫暱稱以區分`;
          }
          
          // 部分教師有暱稱，部分沒有，不強制要求填寫（因為可能選擇的是沒有暱稱的教師）
          return null;
        }
        
        // 只有一個姓名匹配的教師，不需要驗證暱稱
        // 如果填寫了暱稱，但只有一個匹配的教師，可以忽略暱稱（不報錯）
        
        return null;
      }
    ],
    狀態: [
      (v) => this.isBlank(v) ? "狀態欄必填" : null,
      (v) => !this.isBlank(v) && !this.allowedValues.狀態.includes(String(v).trim()) 
        ? "狀態應為 一般 或 延修 或 休學" : null,
    ],
  };

  public validateRow(row: any, rowNum: number): RowError[] {
    console.log(`🔍 validateRow 開始 - 第${rowNum}列, 匯入模式=${this.importMode}, 角色=${this.role}, 學生數量=${this.studentList.length}`);
    
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

    // 年級驗證已在 validators 中定義，不需要重複檢查

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

    console.log(`🔍 完成基本欄位驗證，當前錯誤數量: ${errorMap.size}`);
    console.log(`🔍 當前錯誤內容:`, Array.from(errorMap.entries()));
    console.log(`🔍 準備開始學生匹配驗證`);

    // 找學生
    let matchedStudent: any = null;
    const originalStatus = row["狀態"]; // 保留原始中文狀態
    
    console.log(`🔍 開始學生匹配 - 第${rowNum}列`);
    console.log(`🔍 學生清單數量: ${this.studentList.length}`);
    console.log(`🔍 匯入模式: ${this.importMode}`);
    console.log(`🔍 角色: ${this.role}`);
    console.log(`🔍 原始狀態: "${originalStatus}"`);
    
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

    // 🔧 修復：使用不同的 key 避免與基本欄位驗證衝突
    const key = this.importMode === "byStudentId" ? "學生匹配(學號)" : "學生匹配(座號)";
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
      
      console.log(`🚨 學生驗證錯誤 - 將加入錯誤清單: key="${key}", message="${errorMessage}"`);
      console.log(`🔍 DEBUG: errorMap 在加入學生錯誤前的狀態:`, Array.from(errorMap.entries()));
      
      // 🔧 修復：檢查是否已有相同 key 的錯誤，如果有則追加而不是覆蓋
      if (errorMap.has(key)) {
        errorMap.get(key)!.push(errorMessage);
        console.log(`🔍 DEBUG: 追加到現有錯誤清單`);
      } else {
        errorMap.set(key, [errorMessage]);
        console.log(`🔍 DEBUG: 新增錯誤到清單`);
      }
      
      console.log(`🔍 DEBUG: errorMap 在加入學生錯誤後的狀態:`, Array.from(errorMap.entries()));
    } else {
      // 找到學生，但需要檢查是否有權限匯入
      console.log(`✅ 找到學生: ${matchedStudent.StudentName}, 班級: ${matchedStudent.ClassName}, 座號: ${matchedStudent.SeatNo}`);
      console.log(`🔍 檢查權限 - 角色: ${this.role}, 匯入模式: ${this.importMode}`);
      
      if (this.importMode === "byStudentId" && !this.isSpecialStudentFn(matchedStudent)) {
        console.log(`❌ 特殊學生檢查失敗 - 學生: ${matchedStudent.StudentName}, 角色: ${this.role}, 匯入模式: ${this.importMode}`);
        const importInfo = `學號: ${row["學號"] || "未填"}, 學生姓名: ${matchedStudent.StudentName}, 班級: ${matchedStudent.ClassName}`;
        // 🔧 修復：使用不同的 key 避免與基本欄位驗證衝突
        const permissionKey = "學生權限檢查";
        errorMap.set(permissionKey, [`此學生非本班學生，無法匯入 (匯入資料: ${importInfo})`]);
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
    console.log(`🔍 formatErrors - 第${rowNum}列的錯誤數量: ${errorMap.size}`);
    console.log(`🔍 formatErrors - errorMap 完整內容:`, Array.from(errorMap.entries()));
    errorMap.forEach((messages, column) => {
      console.log(`🔍 formatErrors - 欄位"${column}"有${messages.length}個錯誤:`, messages);
      messages.forEach((message) => {
        const error = {
          row: rowNum,
          column,
          message,
          value: row ? row[column] : undefined,
        };
        console.log(`🔍 formatErrors - 新增錯誤:`, error);
        errors.push(error);
      });
    });
    console.log(`🔍 formatErrors - 第${rowNum}列總共產生${errors.length}個錯誤`);
    console.log(`🔍 formatErrors - 返回的錯誤陣列:`, errors);
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
