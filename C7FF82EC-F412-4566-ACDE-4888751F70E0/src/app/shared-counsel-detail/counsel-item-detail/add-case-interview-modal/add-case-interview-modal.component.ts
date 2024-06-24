import { ANALYZE_FOR_ENTRY_COMPONENTS, Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { DsaService } from '../../../dsa.service';
import { CaseInterview, QOption } from '../case-interview-vo';
import { DomSanitizer } from '@angular/platform-browser';
import { SelectorMatcher } from "@angular/compiler";
import { GlobalService } from "src/app/global.service";
@Component({
  selector: "app-add-case-interview-modal",
  templateUrl: "./add-case-interview-modal.component.html",
  styleUrls: ["./add-case-interview-modal.component.css"]
})
export class AddCaseInterviewModalComponent implements OnInit {
  @ViewChild('fileInput') fileInput: ElementRef;
  constructor(
    private dsaService: DsaService
    , private sanitizer: DomSanitizer
    ,public globalService :GlobalService 
  ) { }
  /** 當insert 成功後回傳的ID */

  InsertCaseInterViewID = ""
  fileSizeLimit: number = 3 * 1024 * 1024
  isCancel: boolean = true;
  isAddServiceWork = false;
  _editMode: string = "add";
  editModeString: string = "新增";
  // _studentName: string;
  // 上檔案相關變數  
  fileContent: any
  fileUpladed: { FileName, FileContent, TargetID, href, BelongTable } | any = {};
  _CaseInterview: CaseInterview;

  ngOnInit() {
    this.isCancel = true;
    this._CaseInterview = new CaseInterview();
    
  }
  decodeHtml(html: string): string {
    const txt = document.querySelector('textarea');
    // alert('inner'+JSON.stringify(txt))
    console.log(txt)
    txt.innerHTML = html;
  
    // txt.value = html
    return txt.value;
  }

  onChange(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    const value = textarea.value;
    if( this.editModeString == "修改"){
    this._CaseInterview.Content = this.decodeHtml(value);
   
    }else{
      this._CaseInterview.Content =this.decodeHtml(value);
    }
    // alert(" this._CaseInterview.Content"+JSON.stringify(this._CaseInterview.Content))
  }

  dayOfWeek: string | null = null;
  _onDateChange(event: any) {
    const date = new Date(event);
    this.dayOfWeek = this.getDayOfWeek(date);
    this._CaseInterview.checkValue();
  }

  getDayOfWeek(date: Date): string {
    const daysOfWeek = ['日', '一', '二', '三', '四', '五', '六'];
    return daysOfWeek[date.getUTCDay()];
  }



  
  getInnerHTML(val){
    return val.replace(/(<([^>]+)>)/ig,'');
  }
  /** 取得檔案 */
  async getFile(targetID: string) {
    this.fileUpladed = {};

    try {
      let rsp = await this.dsaService.send('File.GetFileByTypeAndTargetID', {
        Request: {
          TargetID: targetID,
          BelongTable: '二級輔導個案晤談'
        }

      });

      if (rsp.rs) {
        this.fileUpladed.FileName = rsp.rs.file_name;
        this.fileUpladed.BelongTable = '二級輔導個案晤談';
        this.fileUpladed.FileContent = rsp.rs.content;
        let data = atob(rsp.rs.content);
        this.fileUpladed.href = this.sanitizer.bypassSecurityTrustUrl(data);
      }

    } catch (ex) {
      alert('取得檔案發生錯誤:' + JSON.stringify(ex))
    }
  }

  // 載入預設資料
  async loadDefaultData() {

    // 取得登入教師名稱
    let teacher = await this.dsaService.send("GetTeacher", {});
    [].concat(teacher.Teacher || []).forEach(tea => {
      this._CaseInterview.AuthorName = tea.Name;

    });
    // 
    // this._CaseInterview.checkValue();

  }

  // click 取消
  cancel() {
    let isLeave = confirm("尚未儲存，確定離開?")
    // debugger
    if (!isLeave) {
      return
    } else { // 確定要離開
      this.isCancel = true;
      $("#addCaseInterview").modal("hide");
      document.getElementById('description').style.height = 'auto';
    }
  }

  /** 儲存 參數使否繼續編輯服務項目*/
  async save(isAddSerWork: boolean = false) {
    this.isAddServiceWork = isAddSerWork;
    this.isCancel = false;
    try {
      this._CaseInterview.isSaveDisable = true;
      this._CaseInterview.Category = JSON.stringify(this._CaseInterview._category);
      await this.SetCaseInterview(this._CaseInterview);
      $("#addCaseInterview").modal("hide");
      document.getElementById('description').style.height = 'auto';
      
      this._CaseInterview.isSaveDisable = false;
    } catch (error) {
      alert(error);
      this._CaseInterview.isSaveDisable = false;
    }
  }

  checkChange(qq, item: CaseInterview) {
    // console.log(qq);

    if (qq.value == "") {
      item.isCategoryHasValue = false;
    } else {
      item.isCategoryHasValue = true;
    }
    item.checkValue();
  }

  // 新增/更新認輔資料，Service 使用UID是否有值判斷新增或更新
  async SetCaseInterview(data: CaseInterview) {

    if (!data.CounselTypeOther) {
      data.CounselTypeOther = "";
    }

    if (data.isPublic) {
      data.isPrivate = "false";
    } else {
      data.isPrivate = "true";
    }

    // 方式,對象 不是選其他，其他內容需要被清空
    if (data.CounselType !== "其他") {
      data.CounselTypeOther = '';
    }

    if (data.ContactName !== "其他") {
      data.ContactNameOther = '';
    }

    let req = {
      UID: data.UID,
      SchoolYear: data.SchoolYear,
      MeetTime :data.MeetTime ,
      Semester: data.Semester,
      OccurDate: data.OccurDate,
      ContactName: data.ContactName,
      AuthorName: data.AuthorName,
      CounselType: data.CounselType,
      CounselTypeOther: data.CounselTypeOther,
      isPrivate: data.isPrivate,
      StudentID: data.StudentID,
      Attachment: "",
      Content: data.Content ,
      CaseID: data.CaseID,
      AuthorRole: data.AuthorRole,
      Category: data.Category,
      ReferralStatus: data.TransferStatus,
      ContactNameOther: data.ContactNameOther
    };
    // console.log(req);

    let resp = await this.dsaService.send("SetCaseInterview", {
      Request: req
    });
    this.InsertCaseInterViewID = resp.Result.uid;
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
  }

  /** 上傳資料 */
  async handleInputChange(event: any) {
    const file = event.target.files[0];
    console.log('file', file);
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
        this.fileUpladed.FileContent = btoa(data);
        this.fileUpladed.FileName = file.name;
        this.fileUpladed.BelongTable = "二級輔導個案晤談";
      });
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

  /** 取消檔案 */
  deleteFile() {
    this.fileInput.nativeElement.value = null;

    this.fileUpladed = {};
  }
  
  autoResize(textarea: any): void {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

}
