import { Component, OnInit, Optional, ViewChild } from "@angular/core";
import { RoleService } from "../role.service";
import { AppComponent } from "../app.component";
import { CaseStudent, CaseTeacher, SelectCaseTeacher, CounselTeacher } from "./case-student";
import { DsaService } from "../dsa.service";
import { NewCaseModalComponent } from "../case/new-case-modal/new-case-modal.component";
import { GlobalService } from "../global.service";
import { DelCaseModalComponent } from "./del-case-modal/del-case-modal.component"
import { asLiteral } from "@angular/compiler/src/render3/view/util";
import { ActivatedRoute, Router } from "@angular/router";
import { CounselStudentService } from "../counsel-student.service";


@Component({
  selector: "app-case",
  templateUrl: "./case.component.html",
  styleUrls: ["./case.component.css"]
})
export class CaseComponent implements OnInit {
  /**個案資料**/
  caseList: CaseStudent[];
  // 是否結案
  itemClosedList: string[] = [];
  // 可選班級
  itemClassList: string[] = [];

  isDeleteButtonDisable: boolean = true;

  // 判斷可以啟用個案資料功能
  enableCase: boolean = false;

  // 是否結案選擇後
  selectItemClosed: string = "";

  // 班級選擇後
  selectItemClass: string = "";

  // 個案認輔老師
  caseTeacherList: CaseTeacher[];

  sortType = '';
  isLoading = false;
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    public roleService: RoleService,
    private dsaService: DsaService,
    public globalService: GlobalService,
    @Optional()
    private appComponent: AppComponent,
  ) {
    setTimeout(() => { if (this.appComponent) this.appComponent.currentComponent = "case"; });

  }

  @ViewChild("case_modal") case_modal: NewCaseModalComponent;
  @ViewChild("del_case_modal") del_case_modal: DelCaseModalComponent;
  // 新增
  async setNewCaseModal() {
    // this.case_modal.loadCaseSource(); //載入個案來源
    this.case_modal.isAddMode = true;
    this.case_modal.editModeString = "新增";
    this.case_modal.caseStudent = new CaseStudent();
    // 放入預設選項
    this.case_modal.loadData();
    this.case_modal.caseStudent.loadReferalStatusList()
    this.case_modal.caseStudent.useQuestionOptionTemplate();

    this.case_modal.caseList = this.caseList; // 將外部caseList 傳入
    this.case_modal.selectGradeValue = "請選擇年級"
    this.case_modal.selectClassNameValue = "請選擇班級";
    this.case_modal.selectSeatNoValue = "請選擇座號";
    this.case_modal.selectCaseSourceValue = "請選擇個案來源";
    this.case_modal.selectCaseTeachersValue = "請選擇認輔老師";
    this.case_modal.caseStudent.selectCaseTeacers = [];
    // 預設結案老師是輸入老師
    this.case_modal.closedTeacherName = "";

    this.case_modal.isCanSetClass = true;
    this.case_modal.caseStudent.setIsCloseNo();
    // 個案輔導預設初級
    this.case_modal.caseStudent.isCaseLevel1Checked = true;
    this.case_modal.caseStudent.CaseLevel = '初級';

    $("#newCase").modal({ backdrop: 'static' });
    $("#newCase").modal("show");
    // 關閉畫面
    $("#newCase").on("hide.bs.modal", () => {
      // 重整資料
      if (!this.case_modal.isCancel)
        this.loadData();
      $("#newCase").off("hide.bs.modal");
    });
  }

  SetSelectItemClosed(item: string) {
    this.selectItemClosed = item;
    this.changeDisplay();
  }
  SetSelectItemClass(item: string) {
    this.selectItemClass = item;
    this.changeDisplay();
  }

  /** 查看未結案或全部 */
  changeDisplay() {
    this.caseList.forEach(item => {
      item.isDisplay = false;

      if (this.selectItemClosed === '未結案') {
        if (item.IsClosed !== 't') {
          if (this.selectItemClass === '全部') {
            item.isDisplay = true;
          } else {
            if (this.selectItemClass === item.ClassName) {
              item.isDisplay = true;
            }
          }

        }
      } else {
        if (item.IsClosed === 't') {
          if (this.selectItemClass === '全部') {
            item.isDisplay = true;
          } else {
            if (this.selectItemClass === item.ClassName) {
              item.isDisplay = true;
            }
          }
        }
      }

    });
  }

  // 刪除
  delCaseModal(caseStudent: CaseStudent) {

    if (this.isDeleteButtonDisable) { // 如果不能編輯
      return;
    }
    this.del_case_modal._CaseStudent = caseStudent;
    $("#delCaseModal").modal("show");
    // 關閉畫面
    $("#delCaseModal").on("hide.bs.modal", () => {
      if (!this.del_case_modal.isCancel) {
        // 重整資料
        this.loadData();
      }

      $("#delCaseModal").off("hide.bs.modal");
    });
  }

  /** 編輯 */
 async setEditCaseModal(item: CaseStudent) {
    let obj = Object.assign({}, item);
    this.case_modal.isAddMode = false;
    this.case_modal.editModeString = "修改";
    this.case_modal.isCanSetClass = false;
    this.case_modal.caseStudent = item;
    // this.case_modal.loadCaseSource(); //載入個案來源
    this.case_modal.loadData();
    this.case_modal.selectClassNameValue = item.ClassName;
    this.case_modal.selectSeatNoValue = item.SeatNo;
    this.case_modal.selectCaseSourceValue = item.CaseSource;

    this.case_modal.caseStudent.isCloseYes = false;
    this.case_modal.caseStudent.isCloseNo = true;

    if (this.case_modal.caseStudent.IsClosed === "t") {
      this.case_modal.caseStudent.isCloseYes = true;
      this.case_modal.caseStudent.isCloseNo = false;
      this.case_modal.closedTeacherName = `${this.roleService.loginTeacher.Name} (${this.roleService.loginTeacher.NickName})`;
    }

    // 解析認輔教師
    if (item.CaseTeachers && item.CaseTeachers.length > 0) {
      this.case_modal.caseStudent.selectCaseTeacers = [];
      let idx: number = 1;
      item.CaseTeachers.forEach(it => {

        let st: SelectCaseTeacher = new SelectCaseTeacher();
        st.Order = idx;
        st.CounselTeacher = new CounselTeacher();
        st.CounselTeacher.TeacherName = it.TeacherName;
        st.CounselTeacher.TeacherID = it.TeacherID;
        st.CounselTeacher.Role = it.Role;
        idx = idx + 1;
        this.case_modal.caseStudent.selectCaseTeacers.push(st);
      });

    } else {
      this.case_modal.selectTeacherAdd(null);
    }

    // 解析個案層級
    if (item.CaseLevel != "") {
      this.case_modal.caseStudent.CaseLevel = item.CaseLevel;
      if (item.CaseLevel === '初級') {
        this.case_modal.caseStudent.isCaseLevel1Checked = true;
      }
      if (item.CaseLevel === '二級') {
        this.case_modal.caseStudent.isCaseLevel2Checked = true;
      }
      if (item.CaseLevel === '三級') {
        this.case_modal.caseStudent.isCaseLevel3Checked = true;
      }
    }

    this.case_modal.caseStudent.checkValue();
    item.checkValue();

    $("#newCase").modal({ backdrop: 'static' });
    $("#newCase").modal("show");
    // 關閉畫面
    $("#newCase").on("hide.bs.modal", () => {
      // 重整資料
      if (!this.case_modal.isCancel)
        this.loadData();
      else {
        Object.assign(this.case_modal.caseStudent, obj);
      }
      $("#newCase").off("hide.bs.modal");
    });
  }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isDeleteButtonDisable = true;
    this.enableCase = false;
    this.isLoading = true;
    this.caseList = [];
    this.caseTeacherList = [];
    this.itemClassList = [];
    this.itemClosedList = [];
    this.itemClosedList.push('未結案');
    this.itemClosedList.push('已結案');
    this.selectItemClosed = '未結案';
    this.itemClassList.push("全部");
    this.selectItemClass = '全部';
    await this.GetCaseTeacher();
    await this.GetCase();
  }




  // 取得個案
  async GetCase() {
    let data: CaseStudent[] = [];

    try {
      let resp = await this.dsaService.send("GetCase", {
        Request: {}
      });
      [].concat(resp.Case || []).forEach(caseRec => {
        // 建立認輔資料
        let rec: CaseStudent = new CaseStudent();
        rec.UID = caseRec.UID;
        rec.ClassName = caseRec.ClassName;
        rec.SeatNo = caseRec.SeatNo;
        rec.Name = caseRec.Name;
        if (caseRec.Gender === "1") {
          rec.Gender = "男";
        } else {
          rec.Gender = "女";
        }
        let x = Number(caseRec.OccurDate);
        let dt = new Date(x);
        rec.OccurDate = rec.parseDate(dt, '-');
        rec.CaseNo = caseRec.CaseNo;
        rec.ReportReferralStatus = caseRec.ReportReferralStatus;
        rec.StudentIdentity = caseRec.StudentIdentity;
        rec.PossibleSpecialCategory = caseRec.PossibleSpecialCategory;
        rec.SpecialLevel = caseRec.SpecialLevel;
        rec.SpecialCategory = caseRec.SpecialCategory;
        rec.HasDisabledBook = caseRec.HasDisabledBook;
        rec.DeviantBehavior = caseRec.DeviantBehavior;
        rec.ProblemCategory = caseRec.ProblemCategory;
        rec.ProblemMainCategory = caseRec.ProblemMainCategory;
        rec.ProbleDescription = caseRec.ProbleDescription;
        rec.SpecialSituation = caseRec.SpecialSituation;
        rec.EvaluationResult = caseRec.EvaluationResult;
        rec.IsClosed = caseRec.IsClosed;
        if(caseRec.CloseDate)
        rec.CloseDate = rec.parseDate(new Date(caseRec.CloseDate), '-')
        rec.ClosedByTeacherID = caseRec.ClosedByTeacherID;
        rec.CloseDescription = caseRec.CloseDescription;
        rec.StudentID = caseRec.StudentID;
        rec.CaseSource = caseRec.CaseSource;
        rec.CaseCount = caseRec.CaseCount;
        rec.StudentStatus = caseRec.StudentStatus;
        rec.TeacherCounselLevels = caseRec.TeacherCounselLevels;
        rec.StuCounselNumber =caseRec.StuCounselNumber;
        rec.PhotoUrl = `${this.dsaService.AccessPoint
          }/GetStudentPhoto?stt=Session&sessionid=${this.dsaService.SessionID
          }&parser=spliter&content=StudentID:${rec.StudentID}`;
        this.caseTeacherList.forEach(case_data => {
          if (rec.UID === case_data.CaseID) {
            rec.CaseTeachers.push(case_data);
          }
        });

        rec.TeacherName = caseRec.TeacherName;
        rec.CaseLevel = caseRec.CaseLevel;

        // 題目答案轉換
        rec.LoadQuestionOptionStringToList();

        data.push(rec);
      });
      console.log("data....", data);
      this.caseList = data;

      // 放入可選班級
      this.caseList.forEach(item => {
        if (!this.itemClassList.includes(item.ClassName)) {
          this.itemClassList.push(item.ClassName);
        }
      });
    } catch (err) {
      alert("取得個案失敗(GetCase):" + err.dsaError.message);
    }

    this.changeDisplay();
    this.isDeleteButtonDisable = !this.roleService.enableAdmin;
    this.isLoading = false;
  }

  /** 取得個案老師 */
  async GetCaseTeacher() {
    try {
      let data: CaseTeacher[] = [];
      let rsp = await this.dsaService.send("GetCaseTeacher", {
        Request: {}
      });

      [].concat(rsp.CaseTeacher || []).forEach(caseRec => {
        let rec: CaseTeacher = new CaseTeacher();
        rec.CaseID = caseRec.CaseID;
        rec.MainTeacher = caseRec.MainTeacher;
        rec.TeacherID = caseRec.TeacherID;
        rec.TeacherName = caseRec.TeacherName;
        rec.Role = caseRec.Role;
        data.push(rec);
      });

      this.caseTeacherList = data;
    } catch (err) {
      alert("取得個案認輔老師失敗(GetCaseTeacher):" + err.dsaError.message);
    }
  }




  /** 依照 (sourTarget)  排序 */
  sortByAsc(sortTarget: string, isNum = false) {

    this.sortType = 'Asc';


    if (isNum) { // 如果需要轉成數字排序
      this.caseList.sort((item1, item2) => {
        if (parseInt(item1[sortTarget]) < parseInt(item2[sortTarget])) {
          return -1;
        }
        if (parseInt(item1[sortTarget]) > parseInt(item2[sortTarget])) {

          return 1;
        }
        return 0;
      })
    } else {
      this.caseList.sort((item1, item2) => {
        if (item1[sortTarget] < item2[sortTarget]) {
          return -1;
        }
        if (item1[sortTarget] > item2[sortTarget]) {

          return 1;
        }
        return 0;

      })
    }



  }



  /** 小到大 */
  sortByDesc(sortTarget: string, isNum = false) {
    this.sortType = 'Desc';
    if (isNum) {

      this.caseList.sort((item1, item2) => {

        if (parseInt(item1[sortTarget]) < parseInt(item2[sortTarget])) {
          return 1;
        }
        if (parseInt(item1[sortTarget]) > parseInt(item2[sortTarget])) {

          return -1;
        }
        return 0;

      })


    } else {

      this.caseList.sort((item1, item2) => {

        if (item1[sortTarget] < item2[sortTarget]) {
          return 1;
        }
        if (item1[sortTarget] > item2[sortTarget]) {

          return -1;
        }
        return 0;

      })



    }


  }


  toCounselDetail(student: CaseStudent) {
 
    this.router.navigate(
      ["/counsel","detail",student.StudentID,"counsel"],
      {
        relativeTo: this.activatedRoute
      }
    );
  }



}
