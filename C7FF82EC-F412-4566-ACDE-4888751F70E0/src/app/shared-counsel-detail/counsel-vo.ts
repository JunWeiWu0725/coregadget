import { GlobalService } from 'src/app/global.service';
// import { ReferralForm } from './counsel-vo';
import { ReferralStudent } from './../referral/referral-student';
// 輔導資料
export class CounselInterview {
  constructor(isPublic?  :boolean) {
    // alert('isPublic'+isPublic)
  this.isPublic =isPublic ;
  }
  setIsPrivate(isPublic :boolean){

    this.isPublic =isPublic ;
  }
  UID: string;
  StudentName: string; // 姓名
  SchoolYear: number; //學年度
  Semester: number; //學期
  OccurDate: string; //訪談日期
  MeetTime :string ; // 晤談時間 記錄節次
  ContactName: string; //訪談對象姓名
  AuthorName: string; //訪談者姓名
  CounselType: string; //訪談方式
  CounselTypeOther: string; //其他訪談方式
   isPublic: boolean; // 和 isPrivate相反，資料庫內是存在 isPrivate
  isPrivate: string; //是否僅有自己(以及輔導老師)能看見
  StudentID: string; //學生系統編號
  isReferral: string; //是否轉介
  ReferralDesc: string; //轉介說明
  ReferralReply: string; //輔導室針對轉介之回覆
  ReferralStatus: string; //輔導室回覆轉介接收狀態
  ReferralReplyDate: string; //輔導室回覆轉介之日期
  RefTeacherID: string;
  Content: string; //內容
  ContactItem: string; //聯絡事項
  isReferralValue: boolean = false;
  isSchoolYearHasValue: boolean = false;
  isSemesterHasValue: boolean = false;
  isOccurDateHasValue: boolean = false;
  isCounselTypeHasValue: boolean = false;
  isContactNameHasValue: boolean = false;
  isContactItemHasValue: boolean = false;
  isContentHasValue: boolean = false;
  isCounselTypeOtherDisable: boolean = true;
  selectCounselType: string = "請選擇方式";
  selectContactName: string = "請選擇對象";
  isSaveDisable: boolean = true;
  isEditDisable: boolean = true;
  isDelDisable: boolean = true;
  isContactNameOtherDisable: boolean = true;
  // 新增欄位
  ContactNameOther: string = ""; // 其他訪談對象
  Category: string = ""; // 類別
  isCategoryHasValue: boolean = false;
  _category: QOption[]; // 	類別
  // 是否可以看到
  isCanView: boolean = false;
  ReferralForm?: ReferralForm; //轉介單資訊


  public loadCategoryTemplate() {
    let num: number = 1;
    this._category = []; // 	個案類別
    let problem_categoryT = this.getCategory();

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


  // 檢查是否有值
  checkValue() {
    //    var re = /^[0-9] .?[0-9]*/;//判斷字串是否為數字//判斷正整數/[1−9] [0−9]∗]∗/


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

    if (this.ContactItem || this.Content) {
      this.isContactItemHasValue = true;
      this.isContentHasValue = true;
    } else {
      this.isContactItemHasValue = false;
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
      this.isContactNameHasValue && this.isCategoryHasValue &&
      (
        this.isContactItemHasValue ||
        this.isContentHasValue
      )
    ) {
      this.isSaveDisable = false;
    } else {
      this.isSaveDisable = true;
    }

    // 檢查其他選項
    if (this.ContactName === "其他") {
      this.isContactNameOtherDisable = false;
    } else {
      this.isContactNameOtherDisable = true;
    }

    if (this.CounselType === "其他") {
      this.isCounselTypeOtherDisable = false;
    } else {
      this.isCounselTypeOtherDisable = true;
    }

  }

  // 設定訪談方式
  setCounselType(value: string) {
    this.CounselType = value;
    this.selectCounselType = value;
    if (value === "其他") {
      this.isCounselTypeOtherDisable = false;
    } else {
      this.isCounselTypeOtherDisable = true;
      // this.CounselTypeOther = '';
    }
    if (this.CounselType) {
      this.isCounselTypeHasValue = true;
    } else {
      this.isCounselTypeHasValue = false;
    }
    this.checkValue();
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

  // 使用預設題目項目樣版
  public useQuestionOptionTemplate() {
    this.loadCategoryTemplate();
  }

  // 取得是否轉介，如果有轉介回傳狀態
  getIsReferralString() {
    if (this.isReferral === "t") {
      return this.ReferralStatus;
    } else {
      return "";
    }
  }
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
  }
}



export interface IReferralForm {
  homeStartTime: string;
  homeEndTime: string;
  ProblemExpectation: string;
  Strategy: string;
  RefInterviewId: string;
  UID: string;
}

/** 轉介單內容 */
export class ReferralForm {
  constructor(refRerral: IReferralForm = undefined) {
    if (refRerral) {
      this.UID = refRerral.UID;
      this.HomeTeacherStartDate = refRerral.homeStartTime;
      this.HomeTeacherEndDate = refRerral.homeEndTime;
      this.ProbblemAndExpectation = refRerral.ProblemExpectation;
      this.Strategy = refRerral.Strategy;
      this.InterViewID = refRerral.RefInterviewId;
      // console.log(this.InterViewID)
      this.loadStrategyTemplate(); //將題目字串轉成題目
    }
  }

  // constructor( ){
  // }
  /**取得題目選項 */
  getStrategys(): any[] {

    let data = [
      {
        "answer_text": "與學生晤談%text1%次",
        "answer_value": "",
        "answer_martix": [],
        "answer_complete": false,
        "answer_checked": false
      },
      {
        "answer_text": "與家長聯繫%text1%次",
        "answer_value": "",
        "answer_martix": [],
        "answer_complete": false,
        "answer_checked": false

      },
      {

        "answer_text": "家訪%text1%次",
        "answer_value": "",
        "answer_martix": [],
        "answer_complete": false,
        "answer_checked": false

      },
      {
        "answer_text": "其他(請條列說明)%text2%",
        "answer_value": "",
        "answer_martix": [],
        "answer_complete": false,
        "answer_checked": false
      }

    ];
    return [].concat(data || []);
  }

  checkValue(event: any) {

  }
  /**取得目前題目格式 */
  public useQuestionOptionTemplate() {
    this.loadStrategyTemplate();
  }


  /** 轉換日期至字串格式 */
  public loadStrategyTemplate() {
    let num: number = 1;
    this._stratgy = []; // 	個案類別
    let Strategy;
    if (!this.UID) {
      Strategy = this.getStrategys();

    } else {
      Strategy = JSON.parse(this.Strategy);
    }
    for (let item of Strategy) {
      let qo: QOption = new QOption();
      qo.answer_code = `Strategy${num}`;
      qo.answer_martix = item.answer_martix;
      qo.answer_text = item.answer_text;
      qo.answer_checked = item.answer_checked;
      qo.answer_complete = item.answer_complete;
      qo.answer_value = item.answer_value;
      num += 1;
      this._stratgy.push(qo);
    }
  }
  /** 轉換日期格式*/
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
  }

  isSaveDisable: boolean = true; // 是否可以儲存
  /** UID update OR insert 判斷用 */
  UID: string;
  /** 學生ID */
  StudentID: string;
  /** 教師ID */
  TeacherID: string;
  /** 轉介ID */
  InterViewID: string;
  /** 班導師介入 開始時間 */
  HomeTeacherStartDate: string = "2021/09/19";
  /** 班導師介入 結束時間 */
  HomeTeacherEndDate: string = "2021";
  /** 輔導策略 顯示端 */
  _stratgy: QOption[]; // 顯示用
  /** 輔導策略 資料庫端 */
  Strategy: string; // 存入資料庫格式
  /** 問題與期待 */
  ProbblemAndExpectation: string
  /** 最後更新日期 */
  LastUpdate: string;
  AuthorName: string;
}
export class SemesterInfo {
  SchoolYear: number;
  Semester: number;
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

