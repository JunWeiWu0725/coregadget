import { Component, OnInit } from "@angular/core";
import { ReferralStudent } from "../referral-student";
import { DsaService } from "../../dsa.service";
import {
  CounselStudentService,
  CounselClass,
  CounselStudent
} from "../../counsel-student.service";

@Component({
  selector: "app-grant-modal",
  templateUrl: "./grant-modal.component.html",
  styleUrls: ["./grant-modal.component.css"]
})
export class GrantModalComponent implements OnInit {
  //@Input('test') masterName: string;

  isCancel: boolean = true;

  referralStudent: ReferralStudent;
  isSaveButtonDisable: boolean = true;

  isReferralStatusHasValue: boolean = false;
  ReferralStatus: string = '';
  isReferralReplyHasValue: boolean = false;
  ReferralReply: string = '';

  isReferralReplyDateHasValue: boolean = false;
  ReferralReplyDate: string = '';
  // 授理說明
  isReferralReplyDescHasValue: boolean = false;
  ReferralReplyDesc: string = '';

  isUnPrecessed: boolean = false;
  isProcessing: boolean = false;
  isProcessed: boolean = false;

  constructor(private dsaService: DsaService,
    public counselStudentService: CounselStudentService) { }

  ngOnInit() {
    this.referralStudent = new ReferralStudent();

  }

  checkValue() {

    this.isReferralReplyDateHasValue = (this.ReferralReplyDate.length > 0);
    this.isReferralReplyDescHasValue = (this.ReferralReplyDesc.length > 0);
    this.isReferralReplyHasValue = (this.ReferralReply.length > 0);

    if (this.isReferralReplyDateHasValue && this.isReferralReplyDescHasValue && this.isReferralReplyHasValue) {
      this.isSaveButtonDisable = false;
    } else
      this.isSaveButtonDisable = true;

  }

  setProcessSatus(value: string) {
    this.isReferralReplyDescHasValue = true;
    this.ReferralStatus = value;
    if (value === "未處理") {
      this.isUnPrecessed = true;
    }
    if (value === "處理中") {
      this.isProcessing = true;
    }

    if (value === "已處理") {
      this.isProcessed = true;
    }
    this.checkValue();
  }


  loadDefault() {
    // 處理預設值

    this.isUnPrecessed = false;
    this.isProcessing = false;
    this.isProcessed = false;
    this.isSaveButtonDisable = true
    if (this.referralStudent.ReferralReply) {
      this.ReferralReply = this.referralStudent.ReferralReply;
      this.isReferralReplyHasValue = true;
    } else {
      this.ReferralReply = '';
      this.isReferralReplyHasValue = false;
    }

    if (this.referralStudent.ReferralReplyDate) {
      this.isReferralReplyDateHasValue = true;
      this.ReferralReplyDate = this.referralStudent.ReferralReplyDate;
      let dt = new Date();
      this.ReferralReplyDate = this.referralStudent.parseDate(dt);
    } else {
      let dt = new Date();
      this.ReferralReplyDate = this.referralStudent.parseDate(dt);
    }

    if (this.referralStudent.ReferralStatus && this.referralStudent.ReferralStatus.length > 0) {
      this.ReferralStatus =this.referralStudent.ReferralStatus ;
      if (this.referralStudent.ReferralStatus === "未處理") {
        this.isUnPrecessed = true;
      }
      if (this.referralStudent.ReferralStatus === "處理中") {
        this.isProcessing = true;
      }

      if (this.referralStudent.ReferralStatus === "已處理") {
        this.isProcessed = true;
      }
    } else {
      // 沒有值預設未處理
      this.referralStudent.ReferralStatus = '未處理';
      this.isUnPrecessed = true;
    }

    if (this.referralStudent.ReferralReplyDesc) {
      this.ReferralReplyDesc = this.referralStudent.ReferralReplyDesc;
      this.isReferralReplyDescHasValue = true;
    } else {
      this.ReferralReplyDesc = '';
      this.isReferralReplyDescHasValue = false;
    }

  }

  cancel() {
    this.isCancel = true;
    $("#grant_modal").modal("hide");
  }

  async save() {
    this.isCancel = false;
    // 儲存資料
    try {
      this.referralStudent.ReferralReply = this.ReferralReply;
      this.referralStudent.ReferralReplyDate = this.ReferralReplyDate;
      this.referralStudent.ReferralReplyDesc = this.ReferralReplyDesc;
      this.referralStudent.ReferralStatus = this.ReferralStatus;

      await this.SetReferralStudent(this.referralStudent);
      $("#grant_modal").modal("hide");
    } catch (err) {
      alert('無法儲存資料：' + err.dsaError.message);
    }
  }

  async SetReferralStudent(data: ReferralStudent) {
    // 處理當設定狀態後同步到輔導學生主畫面
    this.counselStudentService.guidanceStudent.forEach(rstud => {
      if (rstud.StudentID === data.StudentID) {
        rstud.ReferralStatus = data.ReferralStatus;
      }
    });

    this.counselStudentService.studentMap.forEach(
      (value: CounselStudent, key: string) => {
        if (value.StudentID === data.StudentID) {
          value.ReferralStatus = data.ReferralStatus;
        }
      }
    );


    let req = {
      UID: data.UID,
      ReferralReply: data.ReferralReply,
      ReferralStatus: data.ReferralStatus,
      ReferralReplyDate: data.ReferralReplyDate,
      ReferralReplyDesc: data.ReferralReplyDesc
    };
    // console.log(req);

    try {
      let resp = await this.dsaService.send("SetReferralStudent", {
        Request: req
      });
    } catch (err) {
      alert('無法SetReferralStudent：' + err.dsaError.message);
    }
    // console.log(resp);
  }
}
