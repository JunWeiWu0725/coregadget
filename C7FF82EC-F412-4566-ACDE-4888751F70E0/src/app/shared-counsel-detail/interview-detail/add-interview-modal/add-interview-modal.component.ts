import { Component, OnInit, Optional } from "@angular/core";
import { CounselStudent, CounselStudentService } from '../../../counsel-student.service';
import { DsaService } from '../../../dsa.service';
import { CounselInterview, QOption } from '../../counsel-vo';
import { CounselDetailComponent } from "../../counsel-detail.component";
import { SentenceService } from '../../../render/dissector.service';
import { debounceTime } from "rxjs/operators";
import { DomSanitizer } from "@angular/platform-browser";
import { GlobalService } from "src/app/global.service";

@Component({
  selector: "app-add-interview-modal",
  templateUrl: "./add-interview-modal.component.html",
  styleUrls: ["./add-interview-modal.component.css"]
})
export class AddInterviewModalComponent implements OnInit {
  compoGUID : string = 'c8f4d28b-59a5-4bcd-8101-dc5a65f4c3c7'
  constructor(
    private counselStudentService: CounselStudentService,
    private dsaService: DsaService,
    private dissector: SentenceService,
    private sanitizer: DomSanitizer,
    @Optional()
    private counselDetailComponent: CounselDetailComponent ,
    private globalService :GlobalService
  ) { }
  fileSizeLimit: number = 3 * 1024 * 1024
  // 上傳檔案相關
  fileContent: any
  /** insert檔案使用 */
  fileUpladed: { FileName, FileContent, TargetID, href, BelongTable } | any = {};
  /** 當前學生 */
  currentStudentInfo: CounselStudent;
  /**當前學生 ID */
  currentStudentID: string;
  /** 前一位學生 */
  perviousStudent: CounselStudent;
  /** 下一位學生 */
  nextStudent: CounselStudent;
  /** 目前學生 index  */
  studentCurrentIndex: number;
  /**  */
  targetClassStudent: CounselStudent[];
  /** 是否連續輸入 */

  isAllowSerial = false;
  isSerialMode = false;
  isCancel: boolean = false;
  _editMode: string = "add";
  editModeString: string = "新增";
  _studentName: string;
  dayOfWeek: string | null = null;
  _onDateChange(event: any) {
    const date = new Date(event);
    this.dayOfWeek = this.getDayOfWeek(date);
    this._currentCounselInterview.checkValue();
  }

  getDayOfWeek(date: Date): string {
    const daysOfWeek = ['日', '一', '二', '三', '四', '五', '六'];
    return daysOfWeek[date.getUTCDay()];
  }

  public referralVisible: boolean = false;

  /* 學生輔導紀錄*/
  _currentCounselInterview: CounselInterview;

  onChange(event: Event ,targetID :'#contactMatter1'|'#description') {
    const textarea = event.target as HTMLTextAreaElement;
    const value = textarea.value;
    if( this.editModeString == "修改"){
    this._currentCounselInterview.ContactItem = this.decodeHtml(value,targetID);
   
    }else{
      this._currentCounselInterview.ContactItem =this.decodeHtml(value,targetID);
    }
    // alert(" this._CaseInterview.Content"+JSON.stringify(this._CaseInterview.Content))
  }
  decodeHtml(html: string ,targetID:'#contactMatter1'|'#description'): string {
    if(targetID =='#contactMatter1'){

      const txt = document.querySelector('#contactMatter1')  as HTMLTextAreaElement;
      txt.innerHTML = html;
      console.log(txt)
      return txt.value;
    
    }if
    (targetID =='#description'){
      const txt = document.querySelector('#description')  as HTMLTextAreaElement;
      txt.innerHTML = html;
      console.log(txt)
      return txt.value;
    }
    }
    // alert('inner'+JSON.stringify(txt))
    


    // txt.value = html
  async ngOnInit() {
    this.referralVisible = false;
    if (gadget.params.system_counsel_position === 'referral') {
      this.referralVisible = true;
    }
    this._currentCounselInterview = new CounselInterview(this.globalService.isCounselOpenDefault);

    if (this.counselDetailComponent) {
      await this.loadDefaultData(this.counselDetailComponent.currentStudent);
    }
  }

  /**設定isSerial */
  setIsSerial() {

  }

  /** 處理 連續 要用的資料
   * 整班的陣列
   * 設定目前模式(連續輸入)
  */
  loadSerialEnterDefaultData(isAllowSerial: boolean, targetClassStudent: CounselStudent[]) {
    this.isAllowSerial = isAllowSerial;
    this.targetClassStudent = targetClassStudent;
  }

  /**載入預設資料 
   * 此功能載入此畫面一些預設值設定
  */
  async loadDefaultData(currentStudent: CounselStudent) {
    this.currentStudentInfo = currentStudent;
    this.dayOfWeek = this.getDayOfWeek( new Date(this._currentCounselInterview.OccurDate)  );
    if (this.currentStudentInfo) {
      if (this._editMode === "edit" && this._currentCounselInterview) {
        // 修改
        this.editModeString = "修改";
        if (this._currentCounselInterview.isReferral === "t") {
          this._currentCounselInterview.isReferralValue = true;
        }
      } else {
        // 新增
        this._currentCounselInterview = new CounselInterview(this.globalService.isCounselOpenDefault);
        this._studentName = this.currentStudentInfo.StudentName; // 學生姓名
        this._currentCounselInterview.StudentID = this.currentStudentInfo.StudentID; // 學生ID 
        this._currentCounselInterview.SchoolYear = this.counselStudentService.currentSchoolYear; // 學年度 
        this._currentCounselInterview.Semester = this.counselStudentService.currentSemester; // 學期
        this._currentCounselInterview.MeetTime = this.counselStudentService.meetTime; // 時間 (可以記錄任何文字)
        // 帶入日期與輸入者
        let dt = new Date();
        this._currentCounselInterview.OccurDate = this._currentCounselInterview.parseDate(dt);
        this.dayOfWeek = this.getDayOfWeek( new Date(this._currentCounselInterview.OccurDate)  );
       
        // // 班導師
        // if (
        //   this.counselDetailComponent.currentStudent.Role.indexOf("班導師") >=
        //   0 ||
        //   this.counselDetailComponent.currentStudent.Role.indexOf("輔導老師") >=
        //   0
        // ) {
        //   this._CounselInterview.AuthorName = this.counselStudentService.teacherInfo.Name;
        // }

        this._currentCounselInterview.AuthorName = this.counselStudentService.teacherInfo.Name;
        this._currentCounselInterview.useQuestionOptionTemplate();
      }
      // console.log(this._CounselInterview);
      // 檢查是否有值
      this._currentCounselInterview.checkValue();
    }

    this.currentStudentInfo = currentStudent; // 設定當前學生
    this.setPerviousAndNextStudent("firstLoad");
  }

  // click 取消
  cancel() {
    let result = confirm('尚未儲存，確定取消?');
    if (!result) {
      this.isCancel = true;
      return
    } else {

      $("#addInterview").modal("hide");

    }
  }
  /** Click 後儲存 */
  async save() {

    // 檢查內容是否有填寫
    try {
      this.isCancel = false;
      this._currentCounselInterview.isSaveDisable = true;
      if (this._currentCounselInterview.isReferralValue)
        this._currentCounselInterview.isReferral = "t";
      else this._currentCounselInterview.isReferral = "f";
      this._currentCounselInterview.Category = JSON.stringify(this._currentCounselInterview._category);

      await this.SetCounselInterview(this._currentCounselInterview);
      if (!this.isSerialMode) { //
        $("#addInterview").modal("hide");
      }
      this._currentCounselInterview.isSaveDisable = false;
    } catch (error) {
      alert(error);
      this._currentCounselInterview.isSaveDisable = false;
    }

  }

  /** 載入新學生 */
  loadNowStudentInfo(currentStudent: CounselStudent) {
    this._currentCounselInterview = new CounselInterview(this.globalService.isCounselOpenDefault);
    this._studentName = currentStudent.StudentName; // 學生姓名
    this._currentCounselInterview.StudentID = currentStudent.StudentID; // 學生ID 
    this._currentCounselInterview.SchoolYear = this.counselStudentService.currentSchoolYear; // 學年度 
    this._currentCounselInterview.Semester = this.counselStudentService.currentSemester; // 學期
    // 帶入日期與輸入者
    let dt = new Date();
    this._currentCounselInterview.OccurDate = this._currentCounselInterview.parseDate(dt);
    this._currentCounselInterview.AuthorName = this.counselStudentService.teacherInfo.Name;
    this._currentCounselInterview.useQuestionOptionTemplate();
  }



  /** 下一筆學生*/
  next() {
    this._currentCounselInterview.checkValue()
    if (this._currentCounselInterview.isSaveDisable) {
      alert("未填寫完整!");
      return;
    }
    try {
      this.save();
      this.setPerviousAndNextStudent("next");// 設定前後學生
      this.loadNowStudentInfo(this.currentStudentInfo);
    } catch (ex) {
      alert("發生錯誤!");
    } finally {


    }
  }
  /**前一個學生 */
  pervious() {
    this._currentCounselInterview.checkValue()
    if (this._currentCounselInterview.isSaveDisable) {
      alert("未填寫完整!");
      return;
    }
    try {
      this.save();
      this.setPerviousAndNextStudent("pervious"); // 設定前後學生
      this.loadNowStudentInfo(this.currentStudentInfo);
    } catch (ex) {
      alert("發生錯誤!");
    } finally {

    }
  }


  /** 設定前後 */
  setPerviousAndNextStudent(action: string) {
    this.studentCurrentIndex = this.targetClassStudent.findIndex(x => x.StudentID === this.currentStudentInfo.StudentID);
    if (action == "firstLoad") {
      this.currentStudentInfo = this.targetClassStudent[this.studentCurrentIndex]; //設定目前學生

    } else if (action == "next") {
      this.currentStudentInfo = this.targetClassStudent[++this.studentCurrentIndex]; //設定目前學生
    } else if (action == "pervious") {
      this.currentStudentInfo = this.targetClassStudent[--this.studentCurrentIndex];
    }
    // 設定前一位學生
    if (this.studentCurrentIndex >= 0) {
      const perviousIndex = this.studentCurrentIndex - 1;
      this.perviousStudent = this.targetClassStudent[perviousIndex];
    } else {
      this.perviousStudent = null;
    }
    //設定下一位學生
    if (this.studentCurrentIndex < this.targetClassStudent.length) {
      const nextInndex = this.studentCurrentIndex + 1;
      this.nextStudent = this.targetClassStudent[nextInndex];
    } else {
      this.nextStudent = null;
    }
  }

  // 新增/更新輔導資料，Service 使用UID是否有值判斷新增或更新
  async SetCounselInterview(data: CounselInterview) {
    if (data.isPublic) {
      data.isPrivate = "false";
    } else {
      data.isPrivate = "true";
    }

    // 當方式,對象 非其他，其他內容應該被清空
    if (data.CounselType !== "其他") {
      data.CounselTypeOther = '';
    }

    if (data.ContactName !== "其他") {
      data.ContactNameOther = '';
    }


    if (!data.isReferral) data.isReferral = "false";
    if (data.isReferral == "t") {
      data.ReferralStatus = "未處理";
    }
    let req = {
      UID: data.UID,
      SchoolYear: data.SchoolYear,
      Semester: data.Semester,
      OccurDate: data.OccurDate,
      MeetTime :data.MeetTime,
      ContactName: data.ContactName,
      AuthorName: data.AuthorName,
      CounselType: data.CounselType,
      CounselTypeOther: data.CounselTypeOther,
      isPrivate: data.isPrivate,
      StudentID: data.StudentID,
      isReferral: data.isReferral,
      ReferralDesc: data.ReferralDesc,
      ReferralReply: data.ReferralReply,
      ReferralStatus: data.ReferralStatus,
      ReferralReplyDate: data.ReferralReplyDate,
      Content: data.Content,
      ContactItem: data.ContactItem,
      ContactNameOther: data.ContactNameOther,
      Category: data.Category
    };
    try {
      let resp = await this.dsaService.send("SetCounselInterview", {
        Request: req
      });

      // 開始上傳附檔
      if (this.fileUpladed && resp.Result.uid) {
        this.fileUpladed.TargetID = resp.Result.uid;
        let respfile = await this.dsaService.send("SetFiles", {
          Request: {
            FileInfo: this.fileUpladed
          }
        });

        console.log("檔案回來的值", respfile);
      }
    } catch (err) {
      alert('無法新增：' + err.dsaError.message);
    }
  }

  /** 增加上傳資料邏輯 */
  checkChange(qq, item: CounselInterview) {
    if (qq.value == "") {
      item.isCategoryHasValue = false;
    } else {
      item.isCategoryHasValue = true;
    }
    item.checkValue();
  }
  private readBase64(file): Promise<any> {
    const reader = new FileReader();
    const future = new Promise((resolve, reject) => {
      reader.addEventListener('load', function () {
        resolve(reader.result);
      }, false);
      reader.addEventListener('error', function (event) {
        reject(event);
      }, false);

      reader.readAsDataURL(file);
    });
    return future;
  }
  async handleInputChange(event: any) {
    const file = event.target.files[0];
    console.log('file', file);
    // 確認檔案類型
    if (file.type !== "application/pdf") {
      alert("請上傳正確檔案類型!")
      return
    }
    // 確認檔案大小
    if (file.size > this.fileSizeLimit) {
      alert("檔案過大，請重新選擇檔案!")
      event.target.files[0] = null;
    }
    this.readBase64(file)
      .then((data) => {
        this.fileContent = data;
        const dataArray: any[] = data.split(',');
        console.log("dataArray ", dataArray[1]);
        this.fileUpladed.FileContent = btoa(data);
        this.fileUpladed.FileName = file.name;
        this.fileUpladed.BelongTable = "一級輔導晤談";
        // this.fileUpladed.href =this.sanitizer.bypassSecurityTrustUrl( data) ;
        // this.fileUpladed.FileContent = data ;
        // console.log("filesss",  data);
        // const downObj = atob( this.fileUpladed.FileContent)
        // console.log("downloadObj",downObj) ;
      });
      this._currentCounselInterview.isSaveDisable = false;
  }

  /** 取消檔案 */
  deleteFile() {
    this.fileUpladed = {};
    this._currentCounselInterview.isSaveDisable = false;
  }


  /** 取得檔案 */
  async getFile(targetID: string) {
    this.fileUpladed = {};
    try {
      let rsp = await this.dsaService.send('File.GetFileByTypeAndTargetID', {
        Request: {
          TargetID: targetID,
          BelongTable: '一級輔導晤談'
        }

      });

      if (rsp.rs) {
        this.fileUpladed.FileName = rsp.rs.file_name;
        this.fileUpladed.BelongTable = '一級輔導晤談';
        this.fileUpladed.FileContent = rsp.rs.content;
        let data = atob(rsp.rs.content);
        this.fileUpladed.href = this.sanitizer.bypassSecurityTrustUrl(data);
      }

    } catch (ex) {
      alert('取得檔案發生錯誤:' + JSON.stringify(ex))
    }
  }
  autoResize(textarea: any): void {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

}
