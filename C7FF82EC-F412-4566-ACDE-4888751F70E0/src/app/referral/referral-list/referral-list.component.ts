import { Component, EventEmitter, OnInit, Output, ViewChild } from "@angular/core";
import { GrantModalComponent } from "../grant-modal/grant-modal.component";
import { NewCaseModalComponent } from "../../case/new-case-modal/new-case-modal.component";
import { DsaService } from "../../dsa.service";
import { ReferralStudent } from "../referral-student";
import {
  ActivatedRoute,
  ParamMap,
  Router,
} from "@angular/router";
import { AddReferralFormComponent } from "src/app/shared-counsel-detail/interview-detail/add-referral-form/add-referral-form.component";
import { CommunicationService } from "../service/communication.service";

@Component({
  selector: "app-referral-list",
  templateUrl: "./referral-list.component.html",
  styleUrls: ["./referral-list.component.css"]
})
export class ReferralListComponent implements OnInit {
  // 2019-03-15 和佳樺討論後，將未結案、已結案 改回原來三項：未處理、處理中、已處理

  // @Output() onReferalStateChange =new EventEmitter<any>();
  isLoading: boolean = false;
  refferalNotDealCount;
  public mod: string;
  public itemList: string[];
  public selectItem: string;
  // 目前選擇轉介學生
  currentReferralStudent: ReferralStudent;
  @ViewChild("grant_modal") grant_modal: GrantModalComponent;
  @ViewChild("case_modal") case_modal: NewCaseModalComponent;
  @ViewChild("referralForm") _referralForm: AddReferralFormComponent;
  ReferralStudentList: ReferralStudent[];

  constructor(
    private communicationService: CommunicationService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private dsaService: DsaService
  ) {


  }

  async onReferStateChange() {
    await this.getRefList();
    this.communicationService.emitChange(this.refferalNotDealCount)


  }
/** 取得轉介學生資料 */
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

  async ngOnInit() {
    this.currentReferralStudent = new ReferralStudent();
    this.itemList = [];
    // this.itemList.push("未結案");
    // this.itemList.push("已結案");
    this.itemList.push("未處理");
    this.itemList.push("處理中");
    this.itemList.push("已處理");
    this.activatedRoute.paramMap.subscribe(
      (params: ParamMap): void => {
        this.mod = params.get("mod");
        // 填入預設
        this.selectItem = params.get("target");
      }
    );
    await this.loadData();
  }

  setSelectItem(item: string) {



    this.selectItem = item;

    //
    this.ReferralStudentList.forEach(data => {
      if (data.ReferralStatus === item) {
        data.isDisplay = true;
      } else {
        data.isDisplay = false;
      }
    });

    // }
  }

  // 到學生輔導紀錄
  toCounselDetail(refStudent: ReferralStudent) {
    this.currentReferralStudent = refStudent;
    this.router.navigate(
      ["/referral", "detail", refStudent.StudentID, refStudent.UID],
      {
        relativeTo: this.activatedRoute
      }
    );
  }

  async setNewCaseMmodal(refStudent: ReferralStudent) {
    this.case_modal.setCaseFromReferral(refStudent);
    await this.case_modal.loadData();
    this.case_modal.isAddMode = true;
    this.case_modal.caseStudent.checkValue();
    {
      $("#newCase").modal("show");
      // 關閉畫面
      $("#newCase").on("hide.bs.modal", () => {
        // 重整資料
        if (!this.case_modal.isCancel)
          this.loadData();
        $("#newCase").off("hide.bs.modal");
      });
    }
  }

  setGrantModal(refStudent: ReferralStudent) {
    // console.log("refStudent",refStudent);
    // alert("sss")
    this.grant_modal.referralStudent = refStudent;

    this.grant_modal.loadDefault();
    this.grant_modal.referralStudent.checkValue();
    $("#grant_modal").modal("show");
    // 關閉畫面
    $("#grant_modal").on("hide.bs.modal", () => {
      // 重整資料
      if (!this.grant_modal.isCancel)
        this.loadData();

      $("#grant_modal").off("hide.bs.modal");
    });
  }

  /** */
  async referralRromModal(refStudent: ReferralStudent) {
    this._referralForm.currentinterviewID = refStudent.UID;
    await this._referralForm.loadingInitInfo("view");
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


  async loadData() {
    await this.GetReferralStudent();
    // 同步通知上面
    await this.onReferStateChange();

  }

  async GetReferralStudent() {
    this.isLoading = true;

    try {
      let resp = await this.dsaService.send("GetReferralStudent", {
        Request: {}
      });

      this.ReferralStudentList = [];
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
        rec.StuCounselNumber = studRec.StuCounselNumber;
        rec.PhotoUrl = `${this.dsaService.AccessPoint
          }/GetStudentPhoto?stt=Session&sessionid=${this.dsaService.SessionID
          }&parser=spliter&content=StudentID:${rec.StudentID}`;
        rec.isDisplay = false;

        if (this.selectItem === rec.ReferralStatus) {
          rec.isDisplay = true;
        }

        rec.checkValue();
        this.ReferralStudentList.push(rec);
      });

      // this.setSelectItem("未結案");
      this.setSelectItem("未處理");
    } catch (err) {
      alert('無法GetReferralStudent：' + err.dsaError.message);
    }


    this.isLoading = false;
  }
}
