import { GlobalService } from 'src/app/global.service';
import { DsaService } from './../../../dsa.service';
import { Component, OnInit } from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
@Component({
  selector: 'app-view-case-interview-modal',
  templateUrl: './view-case-interview-modal.component.html',
  styleUrls: ['./view-case-interview-modal.component.css']
})
export class ViewCaseInterviewModalComponent implements OnInit {
  conPoGUID :string = '123e4567-e89b-12d3-a456-426614174000' 
  _studentName: string;
  SchoolYear: number;
  Semester: number;
  OccurDate: string = "";
  MeetTime :string =""
  CaseNo: string = "";
  CounselType: string = "";
  CounselTypeOther: string = "";
  ContactName: string = "";
  Content: string = "";
  StudentID: string = "";
  selectCounselType: string = "";
  UID: string = "";
  AuthorName: string = "";
  CaseID: string = "";
  AuthorRole: string = "";
  fileInfo :{FileName:string ,FileContent ,href}|any ={}

  isCancel: boolean = true;
  constructor(
    public globalService :GlobalService ,
    public DsaService: DsaService
    ,private sanitizer:DomSanitizer) 
    { 
      
    }

  async ngOnInit() {


    this.isCancel = true;
  }

  /** 取得檔案 */
  async getFile(targetID: string) {
    this.fileInfo ={};

    try {
      let rsp = await this.DsaService.send('File.GetFileByTypeAndTargetID', {
        Request: {
          TargetID: targetID,
          BelongTable: '二級輔導個案晤談'
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
}
