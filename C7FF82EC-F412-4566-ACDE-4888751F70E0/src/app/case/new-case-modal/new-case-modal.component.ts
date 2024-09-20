import { Component, OnInit } from "@angular/core";
import { CaseStudent, CaseTeacher, CounselTeacher, SelectCaseTeacher } from "../case-student";
import { DsaService } from "../../dsa.service";
// import { RoleService } from "../role.service";
import { ReferralStudent } from "../../referral/referral-student";
import { FormControl } from "@angular/forms";
import {
  CounselStudentService,
  CounselClass,
  CounselStudent,
  SemesterInfo
} from "../../counsel-student.service";
import { QOption } from "../case-question-data-modal";
import { asLiteral } from "@angular/compiler/src/render3/view/util";
import { conforms } from "lodash";
import { RoleService } from "src/app/role.service";
import { ConditionalExpr, identifierModuleUrl } from "@angular/compiler";
import { THROW_IF_NOT_FOUND } from "@angular/core/src/di/injector";

@Component({
  selector: "app-new-case-modal",
  templateUrl: "./new-case-modal.component.html",
  styleUrls: ["./new-case-modal.component.css"]
})
export class NewCaseModalComponent implements OnInit {
  constructor(
    private dsaService: DsaService,
    private counselStudentService: CounselStudentService,
    private roleService: RoleService

  ) { }
  caseReferalList = [
    '本月轉介輔諮中心',
    '無轉介',
    '已轉介輔諮中心且該中心持續服務中',
    '已轉介輔諮中心，該中心服務至本月結案'
  ]
  isCancel: boolean = true;
  isAddMode: boolean = true;
  isCanSetClass: boolean = false;
  editModeString: string = "新增";
  /** 現有個案資料 */
  caseList: CaseStudent[];
  /** 當前個案學生 */
  caseStudent: CaseStudent;
  /** 轉借狀態 */
  selectReferalStatus: string = "";
  /** 用詞修正對應 "舊的用詞˙":"'新的用詞'" */
  updateCataTerms: Map<string, string>;

  /**認輔老師*/
  selectCaseTeachersValue: string = "請選擇認輔老師";
  /**所選年級 */
  selectGradeValue: string = "請選擇年級";
  /**所選班級 */
  selectClassNameValue: string;
  /**所選座號 */
  selectSeatNoValue: string;
  /**所選學生姓名 */
  selectStudentName: string;
  /**所選教師姓名*/
  closedTeacherName: string;
  selectCaseSourceValue: string;
  /**班級 */
  canSelectClassList: CounselClass[];
  /** 可選班級By年級分類 */
  canSelectClassByMap: Map<string, CounselClass[]> = new Map();
  /** 顯示可選年級 */
  canSelectGradeYear: string[] = [];

  canSelectNoList: CounselStudent[];
  /** 個案來源[選項] */
  canSelectCaseSourceList: { name, checked }[];
  photoShowBig: boolean = false;  // 需求來源:學校覺得照片太大有隱私問題 => 預設照片為小size 點擊照片可以變大 (toogle)  
  photoIsShow: boolean = true;
  // 輔導老師清單
  CounselTeacherList: CounselTeacher[];
  caseliteList: { StudentID: string, UID: string, StuCounselNumber: string, CaseNo: string }[] = []; // 現有所有學生代號及個案編號之陣列


  async ngOnInit() {
    this.caseStudent = new CaseStudent();
    await this.GetCase();
    //  this.loadData();
  }

  /** 取得所有現有個案 並整理至 個案編號及學生代號清單 */
  async GetCase() {
    try {
      let resp = await this.dsaService.send("GetCase", {
        Request: {}
      });
      [].concat(resp.Case || []).forEach(caseRec => {
        this.caseliteList.push( { StudentID: caseRec.StudentID, UID: caseRec.UID, StuCounselNumber: caseRec.StuCounselNumber, CaseNo: caseRec.CaseNo }); 
      });
    } catch (ex) {
      console.log("取得個案資料發生錯誤",ex);
    }

  }


  async loadData() {
    this.CounselTeacherList = [];
    this.selectGradeValue = "請選擇年級";
    this.selectClassNameValue = "請選擇班級";
    this.selectSeatNoValue = "請選擇座號";
    this.selectCaseTeachersValue = "請選擇認輔老師";
    this.selectCaseSourceValue = "請選擇個案來源";
    this.canSelectCaseSourceList = [];
    this.closedTeacherName = "";

    this.loadUpdateCataTerm();//載入有修正



    await this.GetDefault();
    if (!this.caseStudent) this.caseStudent = new CaseStudent();

    // 檢查狀態
    if (this.isAddMode) {
      if (!this.caseStudent.RefCounselInterviewID) {
        this.isCanSetClass = true;
        // this.caseStudent.useQuestionOptionTemplate();
      } else {
        this.isCanSetClass = false;
      }
    } else {
    }
  }

  /** 修正分類用詞 2021/05 因月報表格式有修改 */
  loadUpdateCataTerm() {
    this.updateCataTerms = new Map();
    this.updateCataTerms.set('心理疾病', '精神疾患');
    this.updateCataTerms.set('網路成癮', '網路沉迷');
    // this.updateCataTerms = [{oldTerm:['心理疾病'] ,newTerm :'精神疾患'},{oldTerm:["網路成癮"],newTerm :'網路沉迷'}] ;
  }

  /** 【畫面 初始化】載入 預設個案來源 供選擇*/
  loadCaseSource() {
    /** 2022 增加新的 */
    const caseSource = ["學生主動求助", "家長轉介", "教師轉介（含教職員工）", "同儕轉介", "輔導老師約談", "線上預約管道（僅限高中階段）", "其他"]
    // const caseSource = ["導師轉介", "主動求助", "親友代為求助", "輔導教師主動發現", "其他處室轉介", "其他"]
    caseSource.forEach(sourceeName => {
      this.caseStudent.CaseSourceList.push({ name: sourceeName, checked: false });
    });

  }

  setCaseSource(item: { name, checked }) {

    this.caseStudent.checkValue();
  }

  /** 確認CaseNum 是否重複  */
  checkCaseNum(caseInfo: any) {
    if (!caseInfo.CaseNo) return;
    let target = this.caseliteList.find(x => ( x.CaseNo == caseInfo.CaseNo ) && ( x.UID !== caseInfo.UID ) );
    if (target) {
      alert('個案編號重複，請重新輸入');
      caseInfo.CaseNo = "";
    }

  }
  /** 確認學生代號是否重複 */
  checkStuCounselNumber(caseInfo: CounselStudent) {
    if (!caseInfo.StuCounselNumber) return;
    let target = this.caseliteList.find(x => (x.StuCounselNumber == caseInfo.StuCounselNumber) && (x.StudentID !== caseInfo.StudentID));
    if (target) {
      alert('學生代號重複，請重新輸入');
      caseInfo.StuCounselNumber = "";
    }

  }
  /** 選擇年級 */
  selectGrade(grade: string) {
    this.selectGradeValue = grade;
    this.selectClassNameValue = "請選擇班級";
    this.selectSeatNoValue = "請選擇座號";
    this.canSelectClassList = this.canSelectClassByMap.get(grade);
  }



  /** 選擇班級名稱 */
  setClassName(item: CounselClass) {
    $("#newCase").modal("handleUpdate");
    this.selectClassNameValue = item.ClassName;
    // 請除可選學生號碼
    this.canSelectNoList = [];

    this.selectSeatNoValue = "請選擇座號";

    if (this.counselStudentService.classMap.has(item.ClassID)) {
      this.canSelectNoList = this.counselStudentService.classMap.get(
        item.ClassID
      ).Student;
    }
  }

  cancel() {
    if (!confirm("資料未儲存，確定取消?")) {
      return;
    }

    this.isCancel = true;
    $("#newCase").modal("hide");
  }

  //設定座號
  setSeatNo(item: CounselStudent) {
    console.log('item...counselStudent', item)
    this.selectSeatNoValue = item.SeatNo;
    this.selectStudentName = item.StudentName;
    // this.caseStudent = new CaseStudent();
    this.caseStudent.ClassName = item.ClassName;
    this.caseStudent.Name = item.StudentName;
    this.caseStudent.PhotoUrl = item.PhotoUrl;
    this.caseStudent.SeatNo = item.SeatNo;
    this.caseStudent.Gender = item.Gender;
    this.caseStudent.StudentID = item.StudentID;
    this.caseStudent.StudentIdentity = item.Status;
    this.caseStudent.StuCounselNumber = item.StuCounselNumber;



    this.counselStudentService.counselClass.forEach(clas => {
      if (clas.ClassName === item.ClassName) {
        this.caseStudent.TeacherName = clas.HRTeacherName;
      }
    });
  }

  /** 設定是否結案 */
  setIsClose(value: string) {

    if (value === "t") {
      // 設定結案日期
      this.caseStudent.setCloseDateNow();
      // 教師
      this.caseStudent.ClosedByTeacherID = this.roleService.loginTeacher.ID;
      // 設定結案教師 
      this.closedTeacherName = `${this.roleService.loginTeacher.Name} (${this.roleService.loginTeacher.NickName})`

    }
    else {
      if (this.caseStudent.isCloseYes) {
        if (!confirm("若要調整個案結案狀態，會清空結案日期、結案人員、結案說明，是否確認要調整結案狀態？")) {
          event.preventDefault();
          return;
        }

        // 清除結案日期
        this.caseStudent.CloseDate = "";
        // 清除結案教師名稱
        this.closedTeacherName = ""
        // 清除結案教師
        this.caseStudent.ClosedByTeacherID = "";
        // 清除結案說明
        this.caseStudent.CloseDescription = "";
      }
    }

    this.caseStudent.IsClosed = value;
    this.caseStudent.checkValue();
  }





  // 來至轉介建立個案功能
  setCaseFromReferral(refData: ReferralStudent) {
    this.caseStudent = new CaseStudent();
    this.caseStudent.ClassName = refData.ClassName;
    this.caseStudent.Name = refData.Name;
    this.caseStudent.SeatNo = refData.SeatNo;
    this.caseStudent.Gender = refData.Gender;
    this.caseStudent.StudentID = refData.StudentID;
    this.caseStudent.TeacherName = refData.TeacherName;
    this.caseStudent.RefCounselInterviewID = refData.UID;
    this.caseStudent.PhotoUrl = refData.PhotoUrl;
    this.caseStudent.StuCounselNumber = refData.StuCounselNumber;
    // 使用預設問題樣板
    this.caseStudent.useQuestionOptionTemplate();
    this.selectClassNameValue = this.caseStudent.ClassName;
    this.selectSeatNoValue = this.caseStudent.SeatNo;
    this.caseStudent.setIsCloseNo();
    this.isAddMode = false;
    this.editModeString = "新增";
    this.isCanSetClass = false;
    // 個案輔導預設初級
    this.caseStudent.isCaseLevel1Checked = true;
    this.caseStudent.CaseLevel = '初級';
    this.setCaseSource({ name: '導師轉介', checked: true });
  }


  /**  */
  chechedSelected(qq: QOption) {
    let num = 0
    this.caseStudent.problem_category.forEach(x => {
      if (x.answer_checked) {
        num++;

      }

    })
    if (num > 2) {
      alert('個案類別(副) 最多選兩項');
      qq.answer_checked = false;
      return;
    }
  }



  /** 點選項目 */
  checkChange(qq: QOption, item: CaseStudent, title = null, target = null) {

    if (title == "個案類別(副)") {
      // 只能選兩個
      this.chechedSelected(qq);

      if (this.updateCataTerms.has(qq.answer_text)) {
        // 處理替換
        if (confirm("「" + qq.answer_text + "」 已更改為 「" + this.updateCataTerms.get(qq.answer_text) + "」， \n 是否變更用詞 ?")) {
          qq.answer_text = this.updateCataTerms.get(qq.answer_text);
          qq.answer_value = this.updateCataTerms.get(qq.answer_text);
        }
      }
    }

    // 這段不知道要做甚麼
    // console.log("qq",qq)
    if (title == "問題描述") {
      if (target.value == "") {
        item.isProbleDescriptionHasValue = false;
      } else {
        item.isProbleDescriptionHasValue = true;
      }
    }

    // 處理學生身分選項
    if (title == "學生身分") {
      if (qq.answer_checked == true) {
        if (qq.answer_text !== "以下皆非") {
          const target = this.caseStudent.student_status.find(x => x.answer_text == '以下皆非')
          target.answer_checked = false;
        } else {
          const targetList = this.caseStudent.student_status.filter(x => x.answer_text !== '以下皆非')
          targetList.forEach(x => {
            x.answer_checked = false;
          })
        }
      }
    }
    item.checkValue();
  }

  // 檢查個案資料是否重複
  async checkCaseNoPass() {
    let value = true;

    let req = {
      CaseNo: this.caseStudent.CaseNo
    };

    try {
      let resp = await this.dsaService.send("CheckCaseNo", {
        Request: req
      });

      [].concat(resp.CaseNo || []).forEach(Rec => {
        let caseNo = this.caseStudent.CaseNo.toUpperCase();

        // 檢查是否有 uid，
        if (this.caseStudent.UID && this.caseStudent.UID.length > 0) {
          // 更新資料 ，當 case no 相同，uid 不同表示有重複
          if (this.caseStudent.UID !== Rec.UID) {
            value = false;
          }
        } else {
          value = false;
        }
      });
    } catch (err) {
      alert("查詢是否重複個案編號發生錯誤:" + err.dsaError.message);
    }

    return value;
  }

  async save() {
    this.isCancel = false;
    // alert("儲存!")

    // 經過討論不檢查個案編號

    // let chk = await this.checkCaseNoPass();

    // if (!chk) {
    //   alert("個案編號重複。");
    //   return;
    // }

    this.caseStudent.CaseSource = this.selectCaseSourceValue;

    if (this.caseStudent.UID && this.caseStudent.UID.length > 0) {
      // 更新
      try {
        // 新增個案

        await this.UpdateCase(this.caseStudent);
        $("#newCase").modal("hide");
        this.caseStudent.isSaveButtonDisable = false;
      } catch (err) {
        alert("無法更新個案：" + err.dsaError.message);
        this.caseStudent.isSaveButtonDisable = false;
      }
    } else {
      // 新增
      this.caseStudent.isSaveButtonDisable = true;
      try {
        // 新增個案
        console.log("this.caseStudent", this.caseStudent)
        await this.AddCase(this.caseStudent);
        $("#newCase").modal("hide");
        this.caseStudent.isSaveButtonDisable = false;
      } catch (err) {
        alert("無法新增個案：" + err.dsaError.message);
        this.caseStudent.isSaveButtonDisable = false;
      }


    }
  }

  SetReportReferralStatus(item: string) {
    this.caseStudent.ReportReferralStatus = item;
    this.caseStudent.checkValue();
  }


  // 設定輔導老師
  SetSelectCaseTeacher(item: CounselTeacher, itemOrder: number) {
    let Order: number = itemOrder + 1;
    let hasTeacherID: string[] = [];

    // 更新自己
    this.caseStudent.selectCaseTeacers.forEach(teacher => {
      if (teacher.CounselTeacher.TeacherID) {
        hasTeacherID.push(teacher.CounselTeacher.TeacherID);
      }
    });

    if (item.TeacherName == "空白" && Order === 1) {
      // 不處理
    } else {
      this.caseStudent.selectCaseTeacers.forEach(teacher => {
        // 如果已有不重複設定
        if (item.TeacherID) {
          if (!hasTeacherID.includes(item.TeacherID)) {
            if (teacher.Order === Order) {
              teacher.CounselTeacher = item;
            }
          }
        } else {
          if (item.TeacherName === '空白') {
            this.caseStudent.selectCaseTeacers.forEach(teacher => {
              if (teacher.Order === Order) {
                teacher.CounselTeacher = item;
              }
            });

          }
        }
      });
    }
    this.caseStudent.checkValue();
  }

  // 新增認輔老師
  selectTeacherAdd(item: CounselTeacher) {
    let Order: number = this.caseStudent.selectCaseTeacers.length + 1;
    let canAdd = true;

    // 當新增沒有傳入，
    if (!item) {
      item = new CounselTeacher();
      item.TeacherName = "請選擇..";
    }

    // 檢查是否有重複
    this.caseStudent.selectCaseTeacers.forEach(tea => {
      if (tea.CounselTeacher.TeacherID === item.TeacherID) {
        canAdd = false;
      }
    });

    if (canAdd) {
      let selTeacher: SelectCaseTeacher = new SelectCaseTeacher();
      selTeacher.Order = Order;
      selTeacher.CounselTeacher = item;
      this.caseStudent.selectCaseTeacers.push(selTeacher);
    }
  }

  // 移除認輔老師
  selectTeacherRemove(item: SelectCaseTeacher) {
    if (this.caseStudent.selectCaseTeacers.length > 1) {
      this.caseStudent.selectCaseTeacers = this.caseStudent.selectCaseTeacers.filter(x => x.CounselTeacher.TeacherID !== item.CounselTeacher.TeacherID);
      this.caseStudent.selectCaseTeacers.sort(x => x.Order);
      this.caseStudent.checkValue();
    }
  }

  // 取得預設資料
  async GetDefault() {
    // 取得個案可以使用教師
    this.CounselTeacherList = [];
    let dataList: CounselTeacher[] = [];
    let nul: CounselTeacher = new CounselTeacher();
    nul.TeacherName = '空白';
    nul.Role = '不加入';
    dataList.push(nul);

    try {
      let counselTeacher = await this.dsaService.send("GetCounselTeacherRole", {});
      [].concat(counselTeacher.CounselTeacher || []).forEach(tea => {
        let data: CounselTeacher = new CounselTeacher();
        data.TeacherID = tea.TeacherID;
        data.TeacherName = tea.TeacherName;
        data.Role = tea.Role;
        dataList.push(data);
      });
      this.CounselTeacherList = dataList;

      // 新增時
      if (this.isAddMode === true) {
        // 加入自己當預設
        dataList.forEach(item => {
          if (this.counselStudentService.teacherInfo.ID === item.TeacherID) {
            this.selectTeacherAdd(item);
          }
        });
      }

      // 取得輔導班級
      this.canSelectClassList = [];
      this.canSelectGradeYear = [];
      this.canSelectClassByMap = new Map();
      await this.counselStudentService.reload();
      this.counselStudentService.counselClass.forEach(data => {
        if (data.Role.indexOf("輔導老師") > -1) {
          this.canSelectClassList.push(data);
          // 依年級 放入 Map
          if (!this.canSelectClassByMap.has(data.GradeYear)) {

            // 1 .如果沒有就放入
            this.canSelectClassByMap.set(data.GradeYear, []);
            this.canSelectGradeYear.push(data.GradeYear);
          }
          // 2.  
          this.canSelectClassByMap.get(data.GradeYear).push(data);
        }

      });


    } catch (err) {
      alert("GetCounselTeacherRole error:" + err.dsaError.message);
    }


    // // 取得結案教師
    // if (this.caseStudent.UID && this.caseStudent.UID.length > 0)
    //   try {
    //     let rspCloseTeacher = await this.dsaService.send("GetCaseClosedTeacherName", {
    //       Request: {
    //         CaseID: this.caseStudent.UID
    //       }
    //     });
    //     let dataCloseTeacher = [].concat(rspCloseTeacher.ClosedTeacher || []);
    //     if (dataCloseTeacher.length > 0) {
    //       this.closedTeacherName = dataCloseTeacher[0].TeacherName;
    //     }

    //   } catch (err) {
    //     alert("GetCaseClosedTeacherName error:" + err.dsaError.message);
    //   }

    // 2020/10/14 與佳樺討論後結案老師是輸入老師


  }

  /** 把 answer_martix 塞 */
  parseCaseOptions(data: QOption[]) {
    for (let da of data) {
      if (da.answer_martix.length > 0) {
        da.answer_value = da.answer_martix.join("");
      } else {
        da.answer_value = da.answer_text;
      }
    }
    return data;
  }

  // 新增個案
  async AddCase(data: CaseStudent) {

    // 開發中先填入預設
    if (!data.StudentIdentity) {
      data.StudentIdentity = "一般生";
    }
    data.PossibleSpecialCategory = "";
    data.SpecialLevel = "";
    data.SpecialCategory = "";
    data.HasDisabledBook = "false";
    data.deviant_behavior = this.parseCaseOptions(data.deviant_behavior);
    data.problem_category = this.parseCaseOptions(data.problem_category);
    data.proble_description = this.parseCaseOptions(data.proble_description);
    data.special_situation = this.parseCaseOptions(data.special_situation);
    data.evaluation_result = this.parseCaseOptions(data.evaluation_result);
    data.teacher_counsel_level = this.parseCaseOptions(data.teacher_counsel_level);
    data.problem_main_category = this.parseCaseOptions(data.problem_main_category); // 20220930 教師參與
    data.DeviantBehavior = JSON.stringify(data.deviant_behavior);
    data.ProblemCategory = JSON.stringify(data.problem_category);
    data.ProbleDescription = JSON.stringify(data.proble_description);
    data.SpecialSituation = JSON.stringify(data.special_situation);
    data.EvaluationResult = JSON.stringify(data.evaluation_result);
    data.ProblemMainCategory = JSON.stringify(data.problem_main_category);
    data.StudentStatus = JSON.stringify(data.student_status); //2022 新版跟格 學生狀態
    data.TeacherCounselLevels = JSON.stringify(data.teacher_counsel_level);
    data.CloseDescription = "";

    // 當沒有輔導 uid 寫入 null
    if (!data.RefCounselInterviewID) {
      data.RefCounselInterviewID = "null";
    }

    if (!data.CloseDate) {
      data.CloseDate = "";
    } else {
      data.CloseDate = data.CloseDate.replace("/", "-").replace("/", "-");
    }

    let reqCaseTeacher = [];
    this.caseStudent.selectCaseTeacers.forEach(it => {
      if (it.CounselTeacher.TeacherID) {
        let itItm = {
          TeacherID: it.CounselTeacher.TeacherID,
          Role: it.CounselTeacher.Role
        }
        reqCaseTeacher.push(itItm);
      }
    });


    let req = {

      OccurDate: data.OccurDate,
      CaseNo: data.CaseNo,
      ReportReferralStatus: data.ReportReferralStatus,
      StudentIdentity: data.StudentIdentity,
      PossibleSpecialCategory: data.PossibleSpecialCategory,
      SpecialLevel: data.SpecialLevel,
      SpecialCategory: data.SpecialCategory,
      HasDisabledBook: data.HasDisabledBook,
      DeviantBehavior: data.DeviantBehavior,
      ProblemCategory: data.ProblemCategory,
      ProblemMainCategory: data.ProblemMainCategory,
      ProbleDescription: data.ProbleDescription,
      SpecialSituation: data.SpecialSituation,
      EvaluationResult: data.EvaluationResult,
      CloseDescription: data.CloseDescription,
      StudentID: data.StudentID,
      CaseSource: data.changeCaseSourceToString(),
      RefCounselInterviewID: data.RefCounselInterviewID,
      IsClosed: data.IsClosed,
      CloseDate: data.CloseDate,
      CaseLevel: data.CaseLevel,
      CaseTeacher: reqCaseTeacher,
      StudentStatus: data.StudentStatus,
      TeacherCounselLevels: data.TeacherCounselLevels,
      StuCounselNumber: data.StuCounselNumber
    };
    try {
      let resp = await this.dsaService.send("AddCase", {
        Request: req
      });
      // console.log(resp);
    } catch (err) {
      alert("新增個案失敗(AddCase):" + err.dsaError.message);
    }
  }

  // 更新個案
  async UpdateCase(data: CaseStudent) {
    if (!data.IsClosed) {
      data.IsClosed = "f";
    }
    data.problem_main_category = this.parseCaseOptions(data.problem_main_category);//因為這欄位是後來加的
    data.DeviantBehavior = JSON.stringify(data.deviant_behavior);
    data.ProblemCategory = JSON.stringify(data.problem_category);
    data.ProblemMainCategory = JSON.stringify(data.problem_main_category);
    data.ProbleDescription = JSON.stringify(data.proble_description);
    data.SpecialSituation = JSON.stringify(data.special_situation);
    data.EvaluationResult = JSON.stringify(data.evaluation_result);
    data.StudentStatus = JSON.stringify(data.student_status); //2022 新版跟格 學生狀態
    data.TeacherCounselLevels = JSON.stringify(data.teacher_counsel_level);

    data.CloseDate = data.CloseDate ? data.CloseDate.replace("/", "-").replace("/", "-") : null;


    let reqCaseTeacher = [];
    this.caseStudent.selectCaseTeacers.forEach(it => {
      if (it.CounselTeacher.TeacherID) {
        let itItm = {
          TeacherID: it.CounselTeacher.TeacherID,
          Role: it.CounselTeacher.Role
        }
        reqCaseTeacher.push(itItm);
      }
    });

    if (data.UID && data.UID.length > 0) {
      let req = {
        CaseID: data.UID,

        OccurDate: data.OccurDate,
        CaseNo: data.CaseNo,
        StudentID: data.StudentID,
        CaseSource: data.changeCaseSourceToString(),

        IsClosed: data.IsClosed,
        CloseDate: data.CloseDate,
        ReportReferralStatus: data.ReportReferralStatus,
        CloseDescription: data.CloseDescription,
        DeviantBehavior: data.DeviantBehavior,
        ProblemCategory: data.ProblemCategory,
        ProblemMainCategory: data.ProblemMainCategory,
        ProbleDescription: data.ProbleDescription,
        SpecialSituation: data.SpecialSituation,
        EvaluationResult: data.EvaluationResult,
        CaseLevel: data.CaseLevel,
        CaseTeacher: reqCaseTeacher,
        StudentStatus: data.StudentStatus,
        TeacherCounselLevels: data.TeacherCounselLevels,
        StuCounselNumber: data.StuCounselNumber
      };


      try {
        let resp = await this.dsaService.send("UpdateCase", {
          Request: req
        });
        //  console.log(resp);
      } catch (err) {
        alert("更新個案失敗(UpdateCase):" + err.dsaError.message);
      }
    }
  }
  getJSON(item: any) {
    return JSON.stringify(item);
  }



  /** 取得個案來源字串 */
  getSourceDisplayName(): string {
    let result = ""
    let count = 0
    let selectItem = ""
    this.caseStudent.CaseSourceList.forEach(x => {
      if (x.checked) {
        count++;
        selectItem = x.name;
      }
    });
    if (count == 1) {
      result = selectItem;
    } else if (count == 0) {// 沒有選給空值
      result = ""
    } else {
      result = `已選 ${count}`
    }


    return result
  }


  /** 個案來源選項 */
  getSelectScourceItem() {

    return this.caseStudent.CaseSourceList.filter(x => x.checked)
  }
}

