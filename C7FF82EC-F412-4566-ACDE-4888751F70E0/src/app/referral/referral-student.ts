export class ReferralStudent {
  constructor() { }
  UID: string;
  StudentID: string;
  ClassName: string;
  SeatNo: string;
  Name: string;
  Gender: string;
  TeacherName: string;
  OccurDate: string;
  ReferralDesc: string;
  ReferralReply: string;
  ReferralStatus: string;
  ReferralReplyDate: string;
  ReferralReplyDesc: string;
  isDisplay: boolean = false;
  StuCounselNumber :string ;
  isReferralReplyHasValue: boolean = false;
  isReferralReplyDateHasValue: boolean = false;
  isReferralReplyDescHasValue: boolean = false;

  isSaveButtonDisable: boolean = true;
  isReferralStatusHasValue: boolean = false;
  isAddCaseButtonDisable: boolean = true;
  // 入學照片
  PhotoUrl: string;
  RefCaseID: string;
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

  // 檢查是否有值
  checkValue() {
    if (this.ReferralReply) {
      this.isReferralReplyHasValue = true;
    } else {
      this.isReferralReplyHasValue = false;
    }
    if (this.ReferralReplyDate) {
      this.isReferralReplyDateHasValue = true;
    } else {
      this.isReferralReplyDateHasValue = false;
    }
    if (this.ReferralReplyDesc) {
      this.isReferralReplyDescHasValue = true;
    } else {
      this.isReferralReplyDescHasValue = false;
    }

    this.isReferralStatusHasValue = false;



    if (this.RefCaseID) {
      this.isAddCaseButtonDisable = true;
    } else {
      this.isAddCaseButtonDisable = false;
    }

    if (
      this.isReferralReplyHasValue &&
      this.isReferralReplyDateHasValue &&
      this.isReferralReplyDescHasValue &&
      this.isReferralStatusHasValue
    ) {
      this.isSaveButtonDisable = false;
    } else {
      this.isSaveButtonDisable = true;
    }

  }
}
