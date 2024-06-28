import { AddServiceModalComponent } from './../../teacher-service/add-service-modal/add-service-modal.component';
import { Component, OnInit, Optional, ViewChild } from "@angular/core";
import { CaseStudent } from "../../case/case-student";
import { DsaService } from "../../dsa.service";
import { CounselDetailComponent } from "../counsel-detail.component";
import { GlobalService } from "../../global.service";
import { RoleService } from "../../role.service";
import { CounselStudentService, CounselClass, CounselStudent } from "../../counsel-student.service";
import { CaseInterview, DBOption, SemesterInfo } from "./case-interview-vo";
import { AddCaseInterviewModalComponent } from "./add-case-interview-modal/add-case-interview-modal.component";
import { DelCaseInterviewModalComponent } from "./del-case-interview-modal/del-case-interview-modal.component";
import { ViewCaseInterviewModalComponent } from "./view-case-interview-modal/view-case-interview-modal.component";

@Component({
  selector: "app-counsel-item-detail",
  templateUrl: "./counsel-item-detail.component.html",
  styleUrls: ["./counsel-item-detail.component.css"]
})
export class CounselItemDetailComponent implements OnInit {
  comGUID : string ="a3f87d1e-96b2-40d4-8c4a-4a1e8b0e2e3f";
  _semesterInfo: SemesterInfo[] = [];
  caseInterview: CaseInterview[] = [];
  caseViewInfoList: CaseViewInfo[] = [];
  _StudentID: string = "";
  isLoading = false;
  hasGetDataAlready = false;
  currentStudent: CounselStudent;

  // 個案資料
  caseList: CaseStudent[];
  transferStatus: DBOption[];
  isDeleteButtonDisable: boolean = true;


  @ViewChild("addCaseInterview") _addInterview: AddCaseInterviewModalComponent;
  @ViewChild("delCaseInterview") _delCaseInterview: DelCaseInterviewModalComponent;
  @ViewChild("viewCaseInterview") _viewCaseInterview: ViewCaseInterviewModalComponent;

  @ViewChild("addServiceModal") _addServiceModal: AddServiceModalComponent;

  constructor(
    private dsaService: DsaService,
    public globalService: GlobalService,
    public roleService: RoleService,
    @Optional()
    private counselDetailComponent: CounselDetailComponent,
    private counselStudentService: CounselStudentService
  ) { }

  async ngOnInit() {

    this.counselDetailComponent.setCurrentItem('counsel');
    this.caseList = [];
    this._StudentID = "";
    this.isDeleteButtonDisable = true;
    this._StudentID = this.counselDetailComponent.currentStudent.StudentID;
    this.currentStudent = this.counselDetailComponent.currentStudent;
    this.currentStudent.PhotoUrl = `${this.dsaService.AccessPoint
      }/GetStudentPhoto?stt=Session&sessionid=${this.dsaService.SessionID
      }&parser=spliter&content=StudentID:${this._StudentID}`;


    await this.loadData();
  }

  async loadData() {
    await this.GetStudentCase();
    // await this.getTransferStateOptionsList();
    await this.GetCaseInterviewByStudentID(this._StudentID);
  }

  /** 新增 */
  addInterviewModal(item: CaseStudent) {
  //  alert("sss")
  //  debugger
    this._addInterview._editMode = "add";
    this._addInterview.editModeString = "新增";
    this._addInterview.fileUpladed = {};
    this._addInterview._CaseInterview = new CaseInterview(this.globalService.isCaseInterviewOpenDefault);
    this._addInterview._CaseInterview.CaseID = item.UID;
    this._addInterview._CaseInterview.CaseNo = item.CaseNo;
    this._addInterview._CaseInterview.StudentID = item.StudentID;
    this._addInterview._CaseInterview.AuthorRole = this.globalService.MyCounselTeacherRole;
    this._addInterview._CaseInterview.StudentName = this.counselDetailComponent.currentStudent.StudentName;
    this._addInterview._CaseInterview.StudentID = this.counselDetailComponent.currentStudent.StudentID;
    this._addInterview._CaseInterview.SchoolYear = this.counselStudentService.currentSchoolYear;
    this._addInterview._CaseInterview.Semester = this.counselStudentService.currentSemester;
    this._addInterview._CaseInterview.UID = "";
    this._addInterview._CaseInterview.CounselType = "";
    this._addInterview._CaseInterview.CounselTypeOther = "";
    this._addInterview._CaseInterview.ContactName = "";
    this._addInterview._CaseInterview.ContactNameOther = "";
    this._addInterview._CaseInterview.Content = "";
    this.decodeHtml( ""  ,'新增')
    this._addInterview._CaseInterview.selectCounselType = "請選擇方式";
    this._addInterview._CaseInterview.selectContactName = "請選擇對象";
    this._addInterview._CaseInterview.AuthorName = "";
    // 預設不公開
    this._addInterview._CaseInterview.isPublic =   this.globalService.isCaseInterviewOpenDefault ;
    this._addInterview._CaseInterview.isSaveDisable = true;
    // 帶入日期與輸入者
    let dt = new Date();
    this._addInterview._CaseInterview.OccurDate = this.parseDate(dt);
    this._addInterview.dayOfWeek = this.globalService.getDayOfWeek(new Date()) // 設定星期

    this._addInterview._CaseInterview.useQuestionOptionTemplate(this.transferStatus);
    this._addInterview.loadDefaultData();
    this._addInterview._CaseInterview.checkValue();
    this._addInterview.fileUpladed = {};

    $("#addCaseInterview").modal({ backdrop: 'static' });
    $("#addCaseInterview").modal("show");

    // 關閉畫面
    $("#addCaseInterview").on("hide.bs.modal", () => {

      if (!this._addInterview.isCancel && this._addInterview.isAddServiceWork) {
        // 新增之後跳出 新增服務項目 
        this._addServiceModal.mode = 'add';
        this._addServiceModal.CaseInterviewID = this._addInterview.InsertCaseInterViewID;
           this._addServiceModal.CaseInterviewID = this._addInterview.InsertCaseInterViewID;
        this._addServiceModal.initModal();

        $("#addServiceModal").modal({ backdrop: 'static' });
        $("#addServiceModal").modal("show");
        $("#addServiceModal").on("hide.bs.modal", () => {
          if (true) { // 如果關掉舊重新 load 資料
            //Jean 

            this.loadData();
            $("#addServiceModal").off("hide.bs.modal");
          }
        });
      }
      // 如果關掉舊重新 load 資料
      this.loadData();

      $("#addCaseInterview").off("hide.bs.modal");
    });



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
    //return `${y}/${mStr}/${dStr}`;
  }

  // 檢視
  viewInterviewModal(caseInterview: CaseInterview) {
    this._viewCaseInterview._studentName = caseInterview.StudentName;
    this._viewCaseInterview.StudentID = caseInterview.StudentID;
    this._viewCaseInterview.SchoolYear = caseInterview.SchoolYear;
    this._viewCaseInterview.Semester = caseInterview.Semester;
    this._viewCaseInterview.UID = caseInterview.UID;
    this._viewCaseInterview.OccurDate = caseInterview.OccurDate;
    this._viewCaseInterview.MeetTime = caseInterview.MeetTime;
    this._viewCaseInterview.CaseNo = caseInterview.CaseNo;
    this._viewCaseInterview.CounselType = caseInterview.CounselType;
    this._viewCaseInterview.CounselTypeOther = caseInterview.CounselTypeOther;
    this._viewCaseInterview.ContactName = caseInterview.ContactName;
    this._viewCaseInterview.Content = caseInterview.Content;
    this._viewCaseInterview.getFile(caseInterview.UID);
    this._viewCaseInterview.AuthorName = caseInterview.AuthorName;
    this._viewCaseInterview.CaseID = caseInterview.CaseID;

    $("#viewCaseInterview").modal("show");
    // 關閉畫面
    $("#viewCaseInterview").on("hide.bs.modal", () => {

      $("#viewCaseInterview").off("hide.bs.modal");
    });

  }

  decodeHtml(html: string ,action :'修改'|'新增'): string {
    if(action=='修改'){

      const txt = document.querySelector('textarea');
      console.log(txt)
      txt.innerHTML = html;
      return txt.value;
    }else{
      const txt = document.querySelector('textarea');
      console.log(txt)
      txt.innerHTML = "";
      return txt.value;
    }
  }

  // onChange(event: Event) {
  //   alert("onchange22")
  //   if( this._addInterview.editModeString = "修改"){
  //       const target = event.target as HTMLTextAreaElement;
  //       const value = target.value;
  //       console.log('Textarea value:', value);
  //       // 在此处处理内容的变化，例如解码 HTML 实体
  //       this._addInterview._CaseInterview.Content = this.decodeHtml(value);


  //     }

  // }

  /** 編輯 */
  editInterviewModal(caseInterview: CaseInterview) {
    if (caseInterview.isEditDisable) // 不能編編輯 
    {
      return
    }

    this._addInterview._editMode = "edit";
    this._addInterview.editModeString = "修改";
    this._addInterview._CaseInterview = caseInterview;
    this.decodeHtml(caseInterview.Content ,"修改")
    this._addInterview._CaseInterview.selectCounselType = caseInterview.CounselType;
    this._addInterview._CaseInterview.selectContactName = caseInterview.ContactName;
    this._addInterview._CaseInterview.AuthorRole = this.globalService.MyCounselTeacherRole;
    this._addInterview.dayOfWeek = this.globalService.getDayOfWeek(new Date(caseInterview.OccurDate)) // 設定星期
    this._addInterview._CaseInterview.isSaveDisable = true;
    this._addInterview.loadDefaultData();
    this._addInterview.getFile(caseInterview.UID);;
    this._addInterview._CaseInterview.checkValue();
    // 服務項目相關
    this._addServiceModal.CaseInterviewID = caseInterview.UID;
    $("#addCaseInterview").modal({ backdrop: 'static' });
    // $("#addCaseInterview").modal("show");
    $("#addCaseInterview").on('shown.bs.modal', () => {
      this.resize();
    });
    // 關閉畫面
    $("#addCaseInterview").on("hide.bs.modal", () => {
      // 重整資料
      this.loadData();

      $("#addCaseInterview").off("hide.bs.modal");
    });
  }

  // 刪除
  deleteInterviewModal(counselView: CaseInterview) {
    this._delCaseInterview.caseInterview = counselView;
    $("#delCaseInterview").modal("show");
    // 關閉畫面
    $("#delCaseInterview").on("hide.bs.modal", () => {
      if (!this._delCaseInterview.isCancel) {
        // 重整資料
        this.loadData();
      }
      $("#delCaseInterview").off("hide.bs.modal");
    });
  }


  // 轉介單 
  referralRromModal() {
    $("#delCaseInterview").modal("show");
    // 關閉畫面
    $("#delCaseInterview").on("hide.bs.modal", () => {

      // 重整資料
      this.loadData();

      $("#delCaseInterview").off("hide.bs.modal");
    });



  }
  /**  取得轉介向 */
  async getTransferStateOptionsList() {

    this.isLoading = true;
    let transferList: DBOption[]
    let resp = await this.dsaService.send('GetFormOptionsByTitle', {
      Request: {
        title: '轉介概況'
      }
    });


    this.transferStatus = [].concat(resp.rsp || [])

    console.log(transferList);
    this.isLoading = false;

  }



  // 取得學生個案
  async GetStudentCase() {
    this.isLoading = true;
    let data: CaseStudent[] = [];
    this.caseViewInfoList = [];
    let ServiceName: string = "GetStudentCase";


    let resp = await this.dsaService.send(ServiceName, {
      Request: {
        StudentID: this.counselDetailComponent.currentStudent.StudentID
      }
    });

    [].concat(resp.Case || []).forEach(caseRec => {
      // 建立認輔資料
      let rec: CaseStudent = new CaseStudent();
      rec.UID = caseRec.UID;


      let x = Number(caseRec.OccurDate);
      let dt = new Date(x);
      rec.OccurDate = rec.parseDate(dt, '-');
      rec.CaseNo = caseRec.CaseNo;
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
      if (caseRec.IsClosed === 't') {
        rec.IsClosed = '是';
      } else {
        rec.IsClosed = '否';
      }
      rec.CloseDate = caseRec.CloseDate;
      rec.ClosedByTeacherID = caseRec.ClosedByTeacherID;
      rec.CloseDescription = caseRec.CloseDescription;
      rec.StudentID = caseRec.StudentID;
      rec.CaseSource = caseRec.CaseSource;
      // rec.MainTeacher = caseRec.MainTeacher;
      // rec.Role = caseRec.Role;
      rec.ClassID = caseRec.ClassID;
      rec.isEditDisable = true;
      if (caseRec.CanEditCase === 't') {
        rec.isEditDisable = false;
      }

      rec.PhotoUrl = `${this.dsaService.AccessPoint
        }/GetStudentPhoto?stt=Session&sessionid=${this.dsaService.SessionID
        }&parser=spliter&content=StudentID:${rec.StudentID}`;

      rec.TeacherName = "";
      if (this.counselStudentService.classMap.has(rec.ClassID)) {
        let classRec: CounselClass;
        classRec = this.counselStudentService.classMap.get(
          rec.ClassID
        );
        rec.TeacherName = classRec.HRTeacherName;
        if (classRec.HRTeacherNickName && classRec.HRTeacherNickName.length > 0) {
          rec.TeacherName = classRec.HRTeacherName + "(" + classRec.HRTeacherNickName + ")";
        }
      }

      //   rec.TeacherName = caseRec.TeacherName;
      let caseInfo: CaseViewInfo = new CaseViewInfo();
      caseInfo.CaseID = caseRec.UID;
      caseInfo.CaseStudentInfo = rec;
      caseInfo.CaseInterviewList = [];
      caseInfo.SemesterInfoList = [];
      this.caseViewInfoList.push(caseInfo);

      data.push(rec);
    });
    // debugger
    this.caseList = data;
  }

  /** 打開服務項目 */
  async OpenServiceModal(caseInterview: CaseInterview = null, mode: "add" | 'edit' = "add") {
    this._addServiceModal.mode = mode;
    if (caseInterview) {
      this._addServiceModal.CaseInterviewID = caseInterview.UID;
      this._addServiceModal.GetServiceItemByUID(caseInterview.ServiceUID)
    }

    this._addServiceModal.initModal();

    $("#addServiceModal").modal({ backdrop: 'static' });
    $("#addServiceModal").modal("show");

    $("#addServiceModal").on("hide.bs.modal", async () => {

      // 重整資料 

      await this.loadData();
      $("#addServiceModal").off("hide.bs.modal");
    })
  }


  async GetCaseInterviewByStudentID(StudentID: string) {
    let data: CaseInterview[] = [];

    let resp = await this.dsaService.send("GetStudentCaseInterview", {
      Request: {
        StudentID: StudentID
      }
    });
      
    [].concat(resp.CaseInterview || []).forEach(counselRec => {
      // 建立認輔資料
      let rec: CaseInterview = new CaseInterview(this.globalService.isCaseInterviewOpenDefault);
      rec.UID = counselRec.UID;
      rec.StudentName = counselRec.StudentName;
      rec.SchoolYear = parseInt(counselRec.SchoolYear);
      rec.Semester = parseInt(counselRec.Semester);
      let dN = Number(counselRec.OccurDate);
      let x = new Date(dN);
      rec.OccurDate = rec.parseDate(x); 
      debugger
      rec.MeetTime = counselRec.MeetTime ;
      rec.ContactName = counselRec.ContactName;
      rec.ContactNameOther = counselRec.ContactNameOther;
      rec.AuthorName = counselRec.AuthorName;
      rec.CounselType = counselRec.CounselType;
      rec.CounselTypeOther = counselRec.CounselTypeOther;
      rec.isPrivate = counselRec.isPrivate;
      rec.StudentID = counselRec.StudentID;
      rec.Attachment = counselRec.Attachment;
      rec.CaseID = counselRec.CaseID;
      rec.Content = counselRec.Content;
      rec.CaseNo = counselRec.CaseNo;
      rec.ClassID = counselRec.ClassID;
      rec.CaseIsClosed = counselRec.CaseIsClosed;
      rec.ServiceItem = counselRec.ServiceItem;
      rec.ServiceUID = counselRec.ServiceUID;

      this.caseList.forEach(item => {
        if (item.UID === rec.CaseID) {
          rec.isEditDisable = item.isEditDisable;
        }
      });

      rec.RefTeacherID = counselRec.AuthorTeacherID;
      // 公開
      rec.isPublic = false;
      // 明確定義非 private
      if (rec.isPrivate === 'f') {
        rec.isPublic = true;
      }

      // 預設該筆記錄可以看到
      rec.isCanView = true;
      //  console.log("tid"+ this.counselStudentService.teacherInfo.ID);
      // 當非公開, teacher id 不是自己，就無法看見
      if (rec.isPublic === false) {
        if (rec.RefTeacherID !== this.counselStudentService.teacherInfo.ID)
          rec.isCanView = false;
      }

      // 填入類別
      rec.Category = counselRec.Category;
      // 類別題目轉換
      rec.LoadQuestionOptionStringToList();
      // rec.useQuestionOptionTemplate();



      // 如果只有認輔老師權限，認輔紀錄只能看到自己的。
      if (this.globalService.MyCounselTeacherRole === "認輔老師") {
        if (counselRec.AuthorTeacherID === this.counselDetailComponent.counselStudentService.teacherInfo.ID) {
          data.push(rec);
        }
      } else {
        if (rec.isCanView) {
          data.push(rec);
        }
      }
    });
    this.caseInterview = data;


    let tmp = [];
    this._semesterInfo = [];
    this.caseInterview.forEach(data => {
      let key = `${data.CaseID}_${data.SchoolYear}_${data.Semester}`;
      if (!tmp.includes(key)) {
        let sms: SemesterInfo = new SemesterInfo();
        sms.SchoolYear = data.SchoolYear;
        sms.Semester = data.Semester;
        sms.CaseID = data.CaseID;
        this._semesterInfo.push(sms);
        tmp.push(key);
      }
    });
    this._semesterInfo.forEach(sms => {
      this.caseViewInfoList.forEach(caseV => {

        if (sms.CaseID === caseV.CaseID) {
          caseV.SemesterInfoList.push(sms);
        }
      });
    });

    // 整理資料
    this.caseInterview.forEach(data => {
      this.caseViewInfoList.forEach(caseV => {
        if (data.CaseID === caseV.CaseID) {
          caseV.CaseInterviewList.push(data);
        }
      });
    });


    this.isLoading = false;

    this.isDeleteButtonDisable = !this.roleService.enableAdmin;

  }

  resize(){
    const textArea = document.getElementById('description');
    textArea.style.overflow = 'hidden';
    textArea.style.height = 'auto';
    textArea.style.height = textArea.scrollHeight + 'px';
  }

}

// 個案檢視
export class CaseViewInfo {
  CaseID: string = "";
  CaseStudentInfo: CaseStudent = new CaseStudent();
  SemesterInfoList: SemesterInfo[] = [];
  CaseInterviewList: CaseInterview[] = [];
}
