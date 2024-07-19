import { RoleService } from './../role.service';
import { Component, OnInit, Optional, ViewChild } from "@angular/core";
import { ActivatedRoute, Router, ParamMap } from "@angular/router";
import { CounselStudentService, CounselStudent } from "../counsel-student.service";
import { CounselComponent } from '../counsel/counsel.component';
import { DsaService } from '../dsa.service';
import { SetCounselInterviewPrintItemComponent } from './set-counsel-interview-print-item/set-counsel-interview-print-item.component';
import { GlobalService } from "../global.service";
import { ignoreElements } from "rxjs/operators";

@Component({
  selector: "app-counsel-detail",
  templateUrl: "./counsel-detail.component.html",
  styleUrls: ["./counsel-detail.component.css"]
})
export class CounselDetailComponent implements OnInit {
  deny: boolean = false;
  private studentID: string;
  private currentItem: string;
  currentStudent: CounselStudent;

  public baseVisible: boolean = false;
  public counselVisible: boolean = false;
  public setCounselPrintItemVisible: boolean = false;
  public coubselReferralVisible: boolean = false;
  public comprehensiveStr: string = "綜合紀錄表";

  /** 顯示輔導紀錄 [班導師/輔導老師] */
  _interviewEnable: boolean = false;
  /** 顯示認輔紀錄 [任輔老師/輔導老師] */ 
  _counselEnable: boolean = false;
  /** 顯示心理測驗 [班導師/輔導導師] */ 
  _psychological_testEnable: boolean = false;
  /** 認輔老師 [認輔老師/專輔老師] */
  _caseInterviewTeacher :boolean = false ;

  printDocument: any[];

  @ViewChild("setCounselInterviewPrintItem") _setCounselInterviewPrintItem: SetCounselInterviewPrintItemComponent;


  constructor(
    private activatedRoute: ActivatedRoute,
    private RoleService :RoleService,
    private router: Router,
    /** 目前學生 */
    public counselStudentService: CounselStudentService, 
    private dsaService: DsaService,
    public globalService: GlobalService,
    @Optional()
    private counselComponent: CounselComponent
  ) { }
  public getJSON (anyThing :any ){
      return JSON.stringify(anyThing)

  }


  ngOnInit() {
    this.baseVisible = false;
    this.counselVisible = false;
    this.coubselReferralVisible = false;

    // 預設
    this.comprehensiveStr = "綜合紀錄表";

    if (gadget.params.system_counsel_position === 'referral' || gadget.params.system_counsel_position === 'counselor' || gadget.params.system_counsel_position === 'freshman') {
      this.baseVisible = true;
    }

    if (gadget.params.system_counsel_position === 'referral' || gadget.params.system_counsel_position === 'counselor') {
      this.counselVisible = true;
    }

    if (gadget.params.system_counsel_position === 'referral') {
      this.coubselReferralVisible = true;
    }

    if (gadget.params.system_counsel_position === 'freshman') {
      // 新生特有
      this.comprehensiveStr = "填報資料";
    }
    //Jean

 

    // 判斷 個人輔導紀錄 功能只有管理者才可以使用
    this.setCounselPrintItemVisible = false;
    if (this.counselVisible) {
      // if (this.globalService.MyCounselTeacherRole === '輔導主任' || this.globalService.MyCounselTeacherRole === '輔導組長' ||this.globalService.MyCounselTeacherRole === '認輔老師') {
        if (this.globalService.MyCounselTeacherRole&&this.RoleService.role.indexOf('輔導老師') >= 0) {
        this.setCounselPrintItemVisible = true;
      }
    }


    this.activatedRoute.paramMap.subscribe(
      (params: ParamMap): void => {
        this.studentID = params.get("studentID");
        this.loadStudent();
      }
    );
  }
 //Jean
/**取得轉介是否有資料 */




  /**
   * 打開視窗連到新的頁面 
   */
  openWindow(contentType :string  ,doc:any ){
    if(contentType =='A表'){
      window.open('content.htm#/(simple-page:simple-page/print/counsel_doc/'+this.currentStudent.StudentID+'/'+doc.PrintDocumentID+')', '_blank');

    }else if (contentType =='B表'){
      window.open('content.htm#/(simple-page:simple-page/print/counsel_history/'+this.currentStudent.StudentID+')', '_blank');
    }else if (contentType =='B表合併心理測驗'){
      window.open('content.htm#/(simple-page:simple-page/print/counsel_history_psychologicaltest/'+this.currentStudent.StudentID+')', '_blank');
    }
  }

  loadStudent() {
    // this.counselStudentService.currentStudent = null;
    if (!this.counselStudentService.isLoading) {
      this.deny = false;
      if (this.counselStudentService.studentMap.has(this.studentID)) {
        this.currentStudent = this.counselStudentService.studentMap.get(
          this.studentID
        );
        // this.counselStudentService.currentStudent = this.currentStudent;

        if (this.counselComponent != null) {
         
          // 處理認輔老師 
          if( // 新竹需求 增加認輔老師邏輯
            this.currentStudent.Role.indexOf("認輔老師") >= 0  
            && this.RoleService.loginTeacher.Role =='專任輔導'
          
          ){
             this._caseInterviewTeacher = true ;

          } 


          if (
            this.currentStudent.Role.indexOf("班導師") >= 0 ||
            this.currentStudent.Role.indexOf("輔導老師") >= 0
          ) {
           
            this.counselComponent.setSelectItem(this.currentStudent.ClassName);
          } else {
            this.counselComponent.setSelectItem("認輔學生");
          }
        }

        if (
          this.currentStudent.Role.indexOf("班導師") >= 0 ||
          this.currentStudent.Role.indexOf("輔導老師") >= 0
        ) {
          this._interviewEnable = true;
          this.RoleService.loginTeacher.interviewEnable =true ;
        }
        if (
          this.currentStudent.Role.indexOf("認輔老師") >= 0 ||
          this.currentStudent.Role.indexOf("輔導老師") >= 0
        ) {
          this._counselEnable = true;
        }

        if (
          this.currentStudent.Role.indexOf("班導師") >= 0 ||
          this.currentStudent.Role.indexOf("輔導老師") >= 0
        ) {
          this._psychological_testEnable = true;
        }

      } else {
        this.deny = true;
      }

      // 檢查認輔學生
      if (
        this.counselStudentService.guidanceStudent.length &&
        this.counselStudentService.guidanceStudent.length > 0
      ) {
        // 比對現在所選學生
        this.counselStudentService.guidanceStudent.forEach(data => {
          if (data.StudentID === this.studentID) {
            this.currentStudent = data;
          }
        });

        if (this.currentStudent.Role.indexOf("認輔老師") >= 0) {
          this._counselEnable = true;
          this.deny = false;
        }
      }

      this.loadPrintDocument();
    } else {
      setTimeout(this.loadStudent, 100);
    }
  }

  routeTo(to) {
    //讓特效跑
    setTimeout(
      function () {
        this.router.navigate([].concat(to || []), {
          relativeTo: this.activatedRoute
        });
      }.bind(this),
      200
    );
  }

  public setCurrentItem(item: string) {
    setTimeout(() => {
      this.currentItem = item;
    });
  }

  async loadPrintDocument() {
    var rsp = await this.dsaService.send("GetPrintDocumentTemplate");
    this.printDocument = [].concat(rsp.PrintDocument || []);
  }

  // 設定學生個人輔導紀錄列印功能
  setCounselPrintItem(studentID: string) {
    this._setCounselInterviewPrintItem.studentID = studentID;

    $("#setCounselInterviewdocPrintItem").modal("show");

    // 關閉畫面
    $("#setCounselInterviewdocPrintItem").on("hide.bs.modal", () => {
      // 重整資料
      if (!this._setCounselInterviewPrintItem.isCancel)
        this.loadStudent();
      $("#setCounselInterviewdocPrintItem").off("hide.bs.modal");
    });

  }

}
