import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router, ParamMap } from "@angular/router";
import { ReferralStudent } from "../referral-student";
import { DsaService } from "../../dsa.service";
import { GrantModalComponent } from "../grant-modal/grant-modal.component";
import { NewCaseModalComponent } from "../../case/new-case-modal/new-case-modal.component";
import { ViewInterviewModalComponent } from '../../shared-counsel-detail';
import { CounselStudentService } from '../../counsel-student.service';
import { CounselInterview } from '../../shared-counsel-detail/counsel-vo';

@Component({
  selector: "app-referral-detail",
  templateUrl: "./referral-detail.component.html",
  styleUrls: ["./referral-detail.component.css"]
})
export class ReferralDetailComponent implements OnInit {
  referralStudent: ReferralStudent;
  studentID: string;
  interviewID: string;
  isLoading: boolean = false;
  counselInterview: CounselInterview;
  @ViewChild("grant_modal") grant_modal: GrantModalComponent;
  @ViewChild("case_modal") case_modal: NewCaseModalComponent;
  @ViewChild("viewInterview") _viewInterview: ViewInterviewModalComponent;
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private dsaService: DsaService,
    private counselStudentService: CounselStudentService
  ) { }

  async ngOnInit() {
    this.referralStudent = new ReferralStudent();
    this.activatedRoute.paramMap.subscribe(
      (params: ParamMap): void => {
        this.studentID = params.get("studentID");
        this.interviewID = params.get("interviewID");
      }
    );
    await this.loadReferralStudent();
  }

  async loadReferralStudent() {
    await this.GetReferralStudentByUid();
  }

  async setNewCaseMmodal(refStudent: ReferralStudent) {
    this.case_modal.setCaseFromReferral(refStudent);
    this.case_modal.isAddMode = true;
    await this.case_modal.loadData();
    $("#newCase").modal("show");
    // 關閉畫面
    $("#newCase").on("hide.bs.modal", () => {
      // 重整資料
      if (!this.case_modal.isCancel)
        this.loadReferralStudent();
    });
  }

  viewInterviewModal() {
    if (this.counselInterview) {
      this._viewInterview._CounselInterview = this.counselInterview;
      this._viewInterview._id = "viewInterview1";
      // this._viewInterview._CounselInterview.SchoolYear = 107;
      $("#viewInterview1").modal("show");


      $("#viewInterview1").on("hide.bs.modal", function (e) {
        // do something...
      });
    }
  }

  setGrantModal(refStudent: ReferralStudent) {
    this.grant_modal.referralStudent = refStudent;
    this.grant_modal.loadDefault();

    if (this.grant_modal.referralStudent.ReferralStatus == "") {
      this.grant_modal.referralStudent.ReferralStatus = "未處理";
      this.grant_modal.isUnPrecessed = true;
      this.grant_modal.referralStudent.isReferralStatusHasValue = true;
    }
    this.grant_modal.referralStudent.checkValue();
    $("#grant_modal").modal("show");
    // 關閉畫面
    $("#grant_modal").on("hide.bs.modal", () => {
      // 重整資料
      // this.loadData();
    });
  }

  async GetReferralStudentByUid() {
    this.isLoading = true;

    try {
      let resp = await this.dsaService.send("GetReferralStudentByUid", {
        Request: {
          UID: this.interviewID
        }
      });

      [].concat(resp.ReferralStudent || []).forEach(studRec => {
        // 建立轉介學生資料
        let rec: ReferralStudent = new ReferralStudent();
        rec.UID = studRec.UID;
        rec.StudentID = studRec.StudentID;
        rec.ClassName = studRec.ClassName;
        rec.SeatNo = studRec.SeatNo;
        rec.Name = studRec.Name;
        rec.Gender = studRec.Gender;
        rec.TeacherName = studRec.TeacherName;
        let n1 = Number(studRec.OccurDate);
        let d1 = new Date(n1);
        rec.OccurDate = rec.parseDate(d1);
        rec.ReferralDesc = studRec.ReferralDesc;
        rec.ReferralReply = studRec.ReferralReply;
        rec.ReferralStatus = studRec.ReferralStatus;
        rec.ReferralReplyDate = studRec.ReferralReplyDate;
        rec.ReferralReplyDesc = studRec.ReferralReplyDesc;
        rec.RefCaseID = studRec.CaseID;
        rec.checkValue();
        this.referralStudent = rec;
      });
    } catch (err) {
      alert('無法GetReferralStudentByUid：' + err.dsaError.message);
    }

    try {
      this.counselInterview = null;
      let respC = await this.dsaService.send("GetStudentCounselInterview", {
        Request: {
          StudentID: this.studentID
        }
      });

      [].concat(respC.CounselInterview || []).forEach(counselRec => {
        // 建立輔導資料
        let rec: CounselInterview = new CounselInterview();
        rec.UID = counselRec.UID;
        rec.StudentName = counselRec.StudentName;
        rec.SchoolYear = parseInt(counselRec.SchoolYear);
        rec.Semester = parseInt(counselRec.Semester);
        let dN = Number(counselRec.OccurDate);
        let x = new Date(dN);
        rec.OccurDate = rec.parseDate(x);
        rec.ContactName = counselRec.ContactName;
        rec.AuthorName = counselRec.AuthorName;
        rec.CounselType = counselRec.CounselType;
        rec.CounselTypeOther = counselRec.CounselTypeOther;
        rec.isPrivate = counselRec.isPrivate;
        rec.StudentID = counselRec.StudentID;
        rec.isReferral = counselRec.isReferral;
        rec.ReferralDesc = counselRec.ReferralDesc;
        rec.ReferralReply = counselRec.ReferralReply;
        rec.ReferralStatus = counselRec.ReferralStatus;
        rec.ReferralReplyDate = counselRec.ReferralReplyDate;
        rec.Content = counselRec.Content;
        rec.ContactItem = counselRec.ContactItem;
        rec.RefTeacherID = counselRec.RefTeacherID;
        // 判斷是否是自己新增才可以修改
        if (this.counselStudentService.teacherInfo.ID === rec.RefTeacherID) {
          rec.isEditDisable = false;
        } else {
          rec.isEditDisable = true;
        }

        if (this.interviewID === rec.UID) {
          this.counselInterview = rec;
        }
      });

    } catch (err) {
      alert('無法GetStudentCounselInterview：' + err.dsaError.message);
    }

    this.isLoading = false;
  }
}
