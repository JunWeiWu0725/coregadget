import { GlobalService } from 'src/app/global.service';
import { Component, OnInit } from "@angular/core";
import { DsaService } from "src/app/dsa.service";
import { CounselStudentService } from "../../../counsel-student.service";
import { CounselInterview } from "../../counsel-vo";
import {DomSanitizer} from '@angular/platform-browser';

@Component({
  selector: "app-view-interview-modal",
  templateUrl: "./view-interview-modal.component.html",
  styleUrls: ["./view-interview-modal.component.css"]
})
export class ViewInterviewModalComponent implements OnInit {

  public referralVisible: boolean = false;
  fileInfo :{FileName:string ,FileContent ,href}|any ={}
  _CounselInterview: CounselInterview;
  _id = "viewInterview";
  constructor(private counselStudentService: CounselStudentService
    ,public globalService :GlobalService
    ,private dsaService:DsaService
    , private sanitizer:DomSanitizer) {}

  ngOnInit() {

    this.referralVisible = false;
    if (gadget.params.system_counsel_position === 'referral') {
      this.referralVisible = true;
    }
    this._CounselInterview = new CounselInterview(this.globalService.isCounselOpenDefault);
  }

  // 取消
  cancel() {
    // this.dialogRef.close();
  }
  /** 取得檔案 */
  async getFile(targetID: string) {

    this.fileInfo ={};

    try {
      let rsp = await this.dsaService.send('File.GetFileByTypeAndTargetID', {
        Request: {
          TargetID: targetID,
          BelongTable: '一級輔導晤談'
        }

      });

      if(rsp.rs){
        this.fileInfo.FileName = rsp.rs.file_name;
        let data  = atob( rsp.rs.content)
       this.fileInfo.href =this.sanitizer.bypassSecurityTrustUrl( data) 
      }
    
    } catch (ex) {
      alert('取得檔案發生錯誤:' + JSON.stringify(ex))
    }
  }
  // // 儲存
  // async save() {
  //   try {
  //     this.dialogRef.close({ msg: "hello response!" });
  //   } catch (error) {
  //     alert(error);
  //   }
  // }
}
