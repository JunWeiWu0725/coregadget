import { Component, OnInit } from '@angular/core';
import { DsaService } from "../../../dsa.service";
import { CounselInterview } from '../../counsel-vo';

@Component({
  selector: 'app-del-interview-modal',
  templateUrl: './del-interview-modal.component.html',
  styleUrls: ['./del-interview-modal.component.css']
})
export class DelInterviewModalComponent implements OnInit {
  // 輔導紀錄
  _CounselInterview: CounselInterview;
  isCancel: boolean = false;
  constructor(private dsaService: DsaService) { }

  ngOnInit() {
    // this._CounselInterview = new CounselInterview();

  }

  del() {
    this.isCancel = false;
    this.DelCounselInterviewByUID();
  }

  cancel() {
    this.isCancel = true;
    $("#delInterview").modal("hide");
  }

  async DelCounselInterviewByUID() {
    try {

      let resp = await this.dsaService.send("DelCounselInterviewByUID", {
        Request: {
          UID: this._CounselInterview.UID
        }
      });
      $("#delInterview").modal("hide");
    } catch (err) {
      alert(err);
    }

  }
}
