import { Component, OnInit, ViewChild, Optional } from "@angular/core";
import { CounselStudentService, SemesterInfo } from "../../counsel-student.service";
import { CounselInterview, QOption } from "../counsel-vo";
// import { AddInterviewModalComponent } from "./add-interview-modal/add-interview-modal.component";
import { DsaService } from "../../dsa.service";
import { ViewInterviewModalComponent } from "./view-interview-modal/view-interview-modal.component";
import { CounselDetailComponent } from "../counsel-detail.component";
import { DelInterviewModalComponent } from "./del-interview-modal/del-interview-modal.component";
import { RoleService } from "../../role.service";
import { GlobalService } from "../../global.service";
import { AddReferralFormComponent } from "./add-referral-form/add-referral-form.component";
import { CommunicationService } from "src/app/referral/service/communication.service";
import { AddInterviewModalComponent } from "./add-interview-modal/add-interview-modal.component";


@Component({
  selector: "app-interview-detail",
  templateUrl: "./interview-detail.component.html",
  styleUrls: ["./interview-detail.component.css"]
})
export class InterviewDetailComponent implements OnInit {
  comPoGUID :string  = "f1a09a1e-8a6b-4311-ae07-79a61a9e1762" 
  enableReferal: boolean = false;
  _semesterInfo: SemesterInfo[] = [];
  _counselInterview: CounselInterview[] = [];
  _StudentID: string = "";
  isLoading = false;
  isDeleteButtonDisable: boolean = true;
  currentInterview: CounselInterview;
  refferalNotDealCount: number;
  public referralVisible: boolean = false;

  @ViewChild("addInterview") _addInterview: AddInterviewModalComponent;
  @ViewChild("viewInterview") _viewInterview: ViewInterviewModalComponent;
  @ViewChild("delInterview") _delInterview: DelInterviewModalComponent;
  @ViewChild("referralForm") _referralForm: AddReferralFormComponent;

  constructor(
    private communicationService: CommunicationService,
    private counselStudentService: CounselStudentService,
    private dsaService: DsaService,
    public roleService: RoleService,
    public globalService: GlobalService,
    @Optional()
    private counselDetailComponent: CounselDetailComponent
  ) { }

  ngOnInit() {
    this._StudentID = "";

    this.referralVisible = false;
    if (gadget.params.system_counsel_position === 'referral') {
      this.referralVisible = true;
    }

    this.counselDetailComponent.setCurrentItem("interview");
    if (
      this.counselDetailComponent.currentStudent.Role &&
      this.counselDetailComponent.currentStudent.Role.indexOf("認輔老師") >= 0
    ) {
      this.enableReferal = true;
    }
    this._StudentID = this.counselDetailComponent.currentStudent.StudentID;

    this.loadCounselInterview(
      this.counselDetailComponent.currentStudent.StudentID
    );
  }

  async onReferStateChange() {
    await this.getRefList();

    this.communicationService.emitChange(this.refferalNotDealCount)


  }
  decodeHtml(html: string ,action :'修改'|'新增' ,targetID :'#contactMatter1' |'#description'): string {
    if(action=='修改'){
    if(targetID =='#contactMatter1'){
      const txt = document.querySelector('#contactMatter1')  as HTMLTextAreaElement;
      txt.innerHTML = html;
      return txt.value;

    }
     if(targetID =='#description'){
      const txt = document.querySelector('#description')  as HTMLTextAreaElement;
      txt.innerHTML = html;
      return txt.value;

    }
    }else{
      const txt = document.querySelector('textarea');
      console.log(txt)
      txt.innerHTML = "";
      return txt.value;
    }
  }

  async getRefList() {
    try {
      let resp = await this.dsaService.send("GetReferralStudent", {
        Request: {}
      });
      const refferals = [].concat(resp.ReferralStudent || [])
      if (refferals.length > 0) {
        refferals.forEach(x => {
        })
        let refNotDeal = refferals.filter(x => {
          return x.ReferralStatus == "未處理"
        })
        this.refferalNotDealCount = refNotDeal.length
        return this.refferalNotDealCount
      }
    } catch (ex) {
      alert("取得轉借資料發生錯誤");
    }
  }

  // 取得學生輔導資料
  async loadCounselInterview(StudentID: string) {
    this._counselInterview = [];
    this.isLoading = true;
    this._StudentID = StudentID;
    this._semesterInfo = [];
    let tmp = [];
    // 取得學生輔導資料
    let dataList = await this.GetCounselInterviewByStudentID(
      this.counselDetailComponent.currentStudent.StudentID
    );

    dataList.forEach(data => {
      let key = `${data.SchoolYear}_${data.Semester}`;
      if (!tmp.includes(key)) {
        let sms: SemesterInfo = new SemesterInfo();
        sms.SchoolYear = data.SchoolYear;
        sms.Semester = data.Semester;
        this._semesterInfo.push(sms);
        tmp.push(key);
      }
    });

    this._counselInterview = dataList;
    this.isDeleteButtonDisable = !this.roleService.enableAdmin;

    this.isLoading = false;
  }

  // 檢視
  viewInterviewModal(counselView: CounselInterview) {
    this._viewInterview._CounselInterview = counselView;
    this._viewInterview.getFile(counselView.UID)
    this._viewInterview._id = "viewInterview";
    $("#viewInterview").modal("show");
    $("#viewInterview").on("hide.bs.modal", function (e) {
      // do something...
    });
  }



  /** 批次輸入-班導師晤談紀錄 */
  addInterviewModal() {
    this._addInterview._editMode = "add";
    this._addInterview.loadDefaultData(this.counselDetailComponent.currentStudent);
    this._addInterview._currentCounselInterview.useQuestionOptionTemplate();
    this._addInterview._currentCounselInterview.selectCounselType = "請選擇方式";
    this._addInterview._currentCounselInterview.selectContactName = "請選擇對象";
    this.decodeHtml('','新增','#contactMatter1')
    this.decodeHtml('','新增','#description')
    // 其他清空
    this._addInterview._currentCounselInterview.ContactNameOther = '';
    this._addInterview._currentCounselInterview.CounselTypeOther = '';

    // 新增預設不公開
    // this._addInterview._currentCounselInterview.isPublic = false;
    this._addInterview._currentCounselInterview.isSaveDisable = true;
    $("#addInterview").modal("show");

    // 關閉畫面
    $("#addInterview").on("hide.bs.modal", () => {
      if (!this._addInterview.isCancel) {
        // 重整資料
        this.onReferStateChange();
        this.counselStudentService.reload();
        this.loadCounselInterview(this._StudentID);
      }
      $("#addInterview").off("hide.bs.modal");
    });
  }

  
  /** 修改 */
  editInterviewModal(counselView: CounselInterview) {
    this._addInterview._editMode = "edit";
    let obj = Object.assign({}, counselView);
    this._addInterview._currentCounselInterview = counselView;
    this._addInterview._currentCounselInterview.selectCounselType = counselView.CounselType;

    this._addInterview._currentCounselInterview.selectContactName = counselView.ContactName;
    this._addInterview.loadDefaultData(this.counselDetailComponent.currentStudent);
    this._addInterview._currentCounselInterview.isSaveDisable = true;
    this._addInterview.getFile(counselView.UID);
    debugger
    this.decodeHtml(this._addInterview._currentCounselInterview.Content,'修改','#description')
    this.decodeHtml(this._addInterview._currentCounselInterview.ContactItem,'修改','#contactMatter1')
    $("#addInterview").modal({ backdrop: 'static' });
    // $("#addInterview").modal("show");
    $("#addInterview").on('shown.bs.modal', () => {
      this.resize();
    });
    // 關閉畫面
    $("#addInterview").on("hide.bs.modal", () => {
      if (!this._addInterview.isCancel) {
        // 重整資料
        this.onReferStateChange();
        this.counselStudentService.reload();
        this.loadCounselInterview(this._StudentID);
      } else {
        Object.assign(this._addInterview._currentCounselInterview, obj)
        //this._addInterview._CounselInterview = obj;
      }

      $("#addInterview").off("hide.bs.modal");
    });
  }

  // 刪除
  delInterviewModal(counselView: CounselInterview) {
    this._delInterview._CounselInterview = counselView;

    $("#delInterview").modal("show");
    // 關閉畫面
    $("#delInterview").on("hide.bs.modal", () => {
      if (!this._delInterview.isCancel) {
        // 重整資料
        this.onReferStateChange();
        this.counselStudentService.reload();
        this.loadCounselInterview(this._StudentID);
      }
      $("#delInterview").off("hide.bs.modal");
    });
  }

  // 轉介單 Jean8
  async referralRromModal(counselView: CounselInterview) {


    this._referralForm._CounselInterview = counselView;

    await this._referralForm.loadingInitInfo("");
    $("#referralForm").modal("show");
    // 關閉畫面
    $("#referralForm").on("hide.bs.modal", () => {
      // if (!this._delCaseInterview.isCancel) {
      //   // 重整資料
      //   this.loadData();
      // }
      $("#referralForm").off("hide.bs.modal");
    });
  }

  // 取得透過學生系統編號取得學生輔導資料
  async GetCounselInterviewByStudentID(StudentID: string) {
    let data: CounselInterview[] = [];

    try {
      let resp = await this.dsaService.send("GetStudentCounselInterview", {
        Request: {
          StudentID: StudentID
        }
      });

      [].concat(resp.CounselInterview || []).forEach(counselRec => {
        // 建立輔導資料
        let rec: CounselInterview = new CounselInterview();
        rec.UID = counselRec.UID;
        rec.StudentName = counselRec.StudentName;
        rec.SchoolYear = parseInt(counselRec.SchoolYear);
        rec.Semester = parseInt(counselRec.Semester);
        let dN = Number(counselRec.OccurDate);
        let x = new Date(dN);
        rec.OccurDate = rec.parseDate(x);
        rec.MeetTime = counselRec.MeetTime 
        rec.ContactName = counselRec.ContactName;
        rec.AuthorName = counselRec.AuthorName;
        rec.CounselType = counselRec.CounselType;
        rec.CounselTypeOther = counselRec.CounselTypeOther;
        rec.isPrivate = counselRec.isPrivate;
        rec.isPublic = false;

        if (rec.isPrivate === "f") {
          rec.isPublic = true;
        }

        rec.StudentID = counselRec.StudentID;
        rec.isReferral = counselRec.isReferral;
        rec.ReferralDesc = counselRec.ReferralDesc;
        rec.ReferralReply = counselRec.ReferralReply;
        rec.ReferralStatus = counselRec.ReferralStatus;
        rec.ReferralReplyDate = counselRec.ReferralReplyDate;
        rec.Content = counselRec.Content;
        rec.ContactItem = counselRec.ContactItem;
        rec.RefTeacherID = counselRec.RefTeacherID;
        rec.ContactNameOther = counselRec.ContactNameOther;
        rec.Category = counselRec.Category;
        rec.isCanView = false;

        // 判斷當非公開，有輔導老師權限又是自己，可以到該筆
        if (rec.isPublic === false) {
          if (this.globalService.MyCounselTeacherRole != '' && this.globalService.MyCounselTeacherRole != '認輔老師') {
            rec.isCanView = true;
          }
          if (this.counselStudentService.teacherInfo.ID === rec.RefTeacherID) {
            rec.isCanView = true;
          }
        } else {
          rec.isCanView = true;
        }

        // 類別題目轉換
        rec.LoadQuestionOptionStringToList();

        // 判斷是否是自己新增才可以修改
        if (this.counselStudentService.teacherInfo.ID === rec.RefTeacherID) {
          rec.isEditDisable = false;
        } else {
          rec.isEditDisable = true;
        }

        if (rec.isCanView) {
          data.push(rec);
        }

      });
    } catch (err) {
      alert('取得透過學生系統編號取得學生輔導資料:' + err.dsaError.message);
    }

    return data;
  }

  resize() {
    const textArea = document.querySelectorAll('textarea');
    for (var index = 0; index < textArea.length; index++) {
      textArea[index].style.overflow = 'hidden';
      textArea[index].style.height = 'auto';
      textArea[index].style.height = textArea[index].scrollHeight + 'px';
    }
  }
}
