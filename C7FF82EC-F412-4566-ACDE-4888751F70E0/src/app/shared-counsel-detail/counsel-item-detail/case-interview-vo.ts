
// 認輔資料
export class CaseInterview {
  constructor(isPublic :boolean) {

    this.isPublic =isPublic
   }
  UID: string;
  StudentName: string; // 姓名
  SchoolYear: number; //學年度
  Semester: number; //學期
  OccurDate: string; //訪談日期
  /** meet時間 */
  MeetTime : string ;
  ContactName: string; //訪談對象姓名
  AuthorName: string; //訪談者姓名
  CounselType: string; //訪談方式
  CounselTypeOther: string; //其他訪談方式
  isPrivate: string; //是否僅有自己(以及輔導老師)能看見
  StudentID: string; //學生系統編號
  Attachment: string; // 附加檔案
  Content: string; // 內容
  CaseID: string; // 個案uid
  CaseNo: string; //個案編號
  ClassID: string; // 班級 ID
  AuthorRole: string; // 個案老師角色
  ContactNameOther: string = ""; // 其他訪談對象
  /** 服務項目ID   */
  ServiceUID :string 
  /** 服務項目  */
  ServiceItem : string 
  /** 晤談紀錄下個案類別 */
  Category: string = ""; // 類別
  /** 轉介狀態 */
  TransferStatus = ""
  isCategoryHasValue: boolean = false;
  /** 晤談紀錄下個案類別 */
  _category: QOption[]; // 	晤談紀錄下類別
  /** 轉介狀態 */
  _transferStatus: QOption[];


  isSaveDisable: boolean = true;
  isEditDisable: boolean = true;
  CaseIsClosed: string = '';
  isPublic: boolean = false;
  isSchoolYearHasValue: boolean = false;
  isSemesterHasValue: boolean = false;
  isOccurDateHasValue: boolean = false;
  isCounselTypeHasValue: boolean = false;
  isCounselTypeOtherDisable: boolean = true;
  isContactNameHasValue: boolean = false;
  isContentHasValue: boolean = false;
  isContactNameOtherDisable: boolean = true;
  selectCounselType: string = "請選擇方式";
  selectContactName: string = "請選擇對象";
  isCanView = false;
  // 該筆填寫教師ID
  RefTeacherID: string = "";

  public parseDate(dt: Date) {
    let y = dt.getFullYear();
    let m = dt.getMonth() + 1;
    let d = dt.getDate();
    let mStr = "" + m;
    let dStr = "" + d;
    if (m < 10) {
      mStr = "0" + m;
    }

    if (d < 10) dStr = "0" + d;
    return `${y}-${mStr}-${dStr}`;
    //return `${y}/${mStr}/${dStr}`;
  }
  /** 載入樣板 */
  public loadCategoryTemplate(transferStateOption: DBOption[] = null) {
    let num: number = 1;
    this._category = []; // 個案類別
    this._transferStatus = [] // 轉介概況
    let problem_categoryT = this.getCategory(); // 下方取得個案類別


    /** 個案類別 */
    for (let item of problem_categoryT) {
      let qo: QOption = new QOption();
      qo.answer_code = `Category${num}`;
      qo.answer_martix = [];
      qo.answer_text = item.answer_text;
      qo.answer_checked = item.answer_checked;
      qo.answer_complete = item.answer_complete;
      qo.answer_value = item.answer_value;

      num += 1;
      this._category.push(qo);
    }
    /** 轉借狀況第一次產出 20220905*/
    if (transferStateOption) {
      for (let option of transferStateOption) {
        let qo: QOption = new QOption();
        qo.answer_code = `TransferState_${num}`;
        qo.answer_martix = [];
        qo.answer_text = option.option_name;
        qo.answer_checked = false;
        qo.answer_complete = false;
        qo.answer_value = "";
        num += 1;
        this._transferStatus.push(qo);
      }
    }
  }

  checkValue() {
    if (this.SchoolYear) {
      if (this.SchoolYear > 0) {
        this.isSchoolYearHasValue = true;
      } else {
        this.isSchoolYearHasValue = false;
      }
    } else {
      this.isSchoolYearHasValue = false;
    }
    // 檢查只允許1或2的半形數字
    if (this.Semester) {
      if (this.Semester > 0 && this.Semester < 3) {
        this.isSemesterHasValue = true;
      } else {
        this.isSemesterHasValue = false;
      }
    } else {
      this.isSemesterHasValue = false;
    }

    if (this.OccurDate) {
      this.isOccurDateHasValue = true;
    } else {
      this.isOccurDateHasValue = false;
    }

    if (this.CounselType) {
      this.isCounselTypeHasValue = true;
    } else {
      this.isCounselTypeHasValue = false;
    }

    if (this.ContactName) {
      this.isContactNameHasValue = true;
    } else {
      this.isContactNameHasValue = false;
    }

    if (this.Content) {
      this.isContentHasValue = true;
    } else {
      this.isContentHasValue = false;
    }

    this.isCategoryHasValue = false;

    // 	個案類別
    for (const cc of this._category) {
      if (cc.answer_checked) {
        this.isCategoryHasValue = true;
      }
    }

    if (
      this.isSchoolYearHasValue &&
      this.isSemesterHasValue &&
      this.isOccurDateHasValue &&
      this.isCounselTypeHasValue &&
      this.isContactNameHasValue &&
      this.isContentHasValue && this.isContactNameHasValue && this.isCategoryHasValue
    ) {
      this.isSaveDisable = false;
    } else {
      this.isSaveDisable = true;
    }
  }

  setCounselType(value: string) {
    this.CounselType = value;
    this.selectCounselType = value;
    if (value === "其他") {
      this.isCounselTypeOtherDisable = false;
    } else {
      this.isCounselTypeOtherDisable = true;
      //  this.CounselTypeOther = '';
    }
    if (this.CounselType) {
      this.isCounselTypeHasValue = true;
    } else {
      this.isCounselTypeHasValue = false;
    }
    this.checkValue();
  }

  // 類別
  public getCategory() {
    let data = [
      {
        answer_text: "人際困擾",
        answer_value: "",
        answer_martix: [],
        answer_complete: false,
        answer_checked: false
      },
      {
        answer_text: "師生關係",
        answer_value: "",
        answer_martix: [],
        answer_complete: false,
        answer_checked: false
      },
      {
        answer_text: "家庭困擾",
        answer_value: "",
        answer_martix: [],
        answer_complete: false,
        answer_checked: false
      },
      {
        answer_text: "自我探索",
        answer_value: "",
        answer_martix: [],
        answer_complete: false,
        answer_checked: false
      },
      {
        answer_text: "情緒困擾",
        answer_value: "",
        answer_martix: [],
        answer_complete: false,
        answer_checked: false
      },
      {
        answer_text: "生活壓力",
        answer_value: "",
        answer_martix: [],
        answer_complete: false,
        answer_checked: false
      },
      {
        answer_text: "創傷反應",
        answer_value: "",
        answer_martix: [],
        answer_complete: false,
        answer_checked: false
      },
      {
        answer_text: "自我傷害",
        answer_value: "",
        answer_martix: [],
        answer_complete: false,
        answer_checked: false
      },
      {
        answer_text: "性別議題",
        answer_value: "",
        answer_martix: [],
        answer_complete: false,
        answer_checked: false
      },
      {
        answer_text: "脆弱家庭",
        answer_value: "",
        answer_martix: [],
        answer_complete: false,
        answer_checked: false
      },
      {
        answer_text: "兒少保議題",
        answer_value: "",
        answer_martix: [],
        answer_complete: false,
        answer_checked: false
      },
      {
        answer_text: "學習困擾",
        answer_value: "",
        answer_martix: [],
        answer_complete: false,
        answer_checked: false
      },
      {
        answer_text: "生涯輔導",
        answer_value: "",
        answer_martix: [],
        answer_complete: false,
        answer_checked: false
      },
      {
        answer_text: "偏差行為",
        answer_value: "",
        answer_martix: [],
        answer_complete: false,
        answer_checked: false
      },
      {
        answer_text: "網路沉迷",
        answer_value: "",
        answer_martix: [],
        answer_complete: false,
        answer_checked: false
      },
      {
        answer_text: "中離(輟)拒學",
        answer_value: "",
        answer_martix: [],
        answer_complete: false,
        answer_checked: false
      },
      {
        answer_text: "藥物濫用",
        answer_value: "",
        answer_martix: [],
        answer_complete: false,
        answer_checked: false
      },
      {
        answer_text: "精神疾患",
        answer_value: "",
        answer_martix: [],
        answer_complete: false,
        answer_checked: false
      },
      {
        answer_text: "其他%text1%",
        answer_value: "",
        answer_martix: [],
        answer_complete: false,
        answer_checked: false
      }
    ];

    return [].concat(data || []);
  }

  public parseQuestioOptionToArray(data: string) {
    let value = [];
    let ss = JSON.parse(data);
    for (const s of ss) {
      let q: QOption = new QOption();
      q.answer_checked = s.answer_checked;
      q.answer_code = s.answer_code;
      q.answer_complete = s.answer_complete;
      q.answer_martix = s.answer_martix;
      q.answer_text = s.answer_text;
      q.answer_value = s.answer_value;
      value.push(q);
    }
    return value;
  }

  // 將問答結果字串轉成 list
  public LoadQuestionOptionStringToList() {
    if (this.Category) {
      this._category = this.parseQuestioOptionToArray(
        this.Category
      );
    } else {
      this.loadCategoryTemplate();
    }
  }

  // 設定訪談對象
  setContactName(value: string) {
    this.ContactName = value;
    this.selectContactName = value;
    if (value === "其他") {
      this.isContactNameOtherDisable = false;
    } else {
      this.isContactNameOtherDisable = true;
      //  this.ContactNameOther = '';
    }
    if (this.ContactName) {
      this.isContactNameHasValue = true;
    } else {
      this.isContactNameHasValue = false;
    }
    this.checkValue();
  }

  /**使用預設題目項目樣版**/
  public useQuestionOptionTemplate(DBOptions : DBOption[]) {
    console.log("useQuestionOptionTemplate",DBOptions)
    this.loadCategoryTemplate(DBOptions);
  }


}

export class SemesterInfo {
  SchoolYear: number;
  Semester: number;
  CaseID: string;
}

export class QOption {
  constructor() { }
  answer_code: string;
  answer_text: string;
  answer_value: string;
  answer_martix: string[];
  answer_complete: boolean;
  answer_checked: boolean;

  public setAnswerCheck() {
    this.answer_checked = !this.answer_checked;
  }
}


/** */
export interface DBOption{
  // <uid>4643644</uid>
	// <last_update>2022-09-05 16:19:18.401068</last_update>
	// <guid/>
	// <title>轉介概況</title>
	// <option_name>本月轉介輔諮中心</option_name>
	// <display_order>1</display_order>

  uid :string ; 
  guid :string ;
  title :string ;
  option_name :string ;
  display_order :string ;
  

}