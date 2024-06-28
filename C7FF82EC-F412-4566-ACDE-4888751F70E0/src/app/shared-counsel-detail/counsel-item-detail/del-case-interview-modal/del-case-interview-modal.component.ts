import { Component, OnInit } from '@angular/core';
import { DsaService } from "../../../dsa.service";
import { CaseInterview } from "../case-interview-vo";
import { GlobalService } from 'src/app/global.service';
@Component({
  selector: 'app-del-case-interview-modal',
  templateUrl: './del-case-interview-modal.component.html',
  styleUrls: ['./del-case-interview-modal.component.css']
})
export class DelCaseInterviewModalComponent implements OnInit {

  caseInterview: CaseInterview;
  isCancel: boolean = true;
  constructor(private dsaService: DsaService,private globalService:GlobalService) { }

  ngOnInit() {
    this.caseInterview = new CaseInterview(this.globalService.isCaseInterviewOpenDefault);
    this.isCancel = true;
  }

  cancel() {
    this.isCancel = true;
    $("#delCaseInterview").modal("hide");
  }

  del() {
    this.isCancel = false;
    this.DelCaseInterviewByUID();
  }

  async DelCaseInterviewByUID() {
    try {
      let resp = await this.dsaService.send("DelCaseInterviewByUID", {
        Request: {
          UID: this.caseInterview.UID
        }
      });

      // 刪除服務項目
    // console.log("this.caseInterview.UID",this.caseInterview.ServiceUID) ;
    if(this.caseInterview.ServiceUID){ // 如果有服務項目
      await this.dsaService.send("TeacherService.DelTeacherService"
      ,{ Request:{ServiceUID :this.caseInterview.ServiceUID}
    }) 
    }
   
    
    $("#delCaseInterview").modal("hide");
    } catch (err) {
      alert(err);
    }
  }
}
