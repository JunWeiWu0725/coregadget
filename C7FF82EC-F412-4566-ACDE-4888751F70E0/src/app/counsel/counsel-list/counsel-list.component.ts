import { Component, HostListener, OnInit, Optional, ViewChild } from "@angular/core";
import { ActivatedRoute, ParamMap } from "@angular/router";
import { CounselStudentService, CounselStudent, SemesterInfo } from "../../counsel-student.service";
import { CounselComponent } from "../counsel.component";
import { AppComponent } from "../../app.component";
import { GlobalService } from "../../global.service";
import { AddInterviewModalComponent } from "src/app/shared-counsel-detail/interview-detail/add-interview-modal/add-interview-modal.component";
import { MatSnackBar } from "@angular/material";


@Component({
  selector: "app-counsel-list",
  templateUrl: "./counsel-list.component.html",
  styleUrls: ["./counsel-list.component.css"]
})
export class CounselListComponent implements OnInit {
  isShowInfo =false;
  public deny: boolean;
  public mod: 'class'|'guidance'|'search'|string;
  public roleType: 'class'|'guidance'|'search'|string;
  public target: string;
  /**顯示的list <可能有條件塞選>(view use) */ 
  public targetList: CounselStudent[];
  /**來源<無條件塞選> */
  public scrList: CounselStudent[];
  currentSchoolYear: number;
  currentSemester: number;

  searchMessage: string = "";


  _semesterInfo: SemesterInfo[] = [];

  // 彈出新稱modal 視窗 
  @ViewChild("addInterview") _addInterview: AddInterviewModalComponent;

  constructor(
    private _snackBar: MatSnackBar,
    private activatedRoute: ActivatedRoute,
    public counselStudentService: CounselStudentService,
    private globalService: GlobalService,
    @Optional()
    private counselComponent: CounselComponent,
    @Optional()
    private appComponent: AppComponent
  ) { }

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe(
      (params: ParamMap): void => {
        this.mod = params.get("mod");
        this.roleType = params.get("roleType");
        this.target = params.get("target");

        this._semesterInfo = [];
        this.getList();
      }
    );

  }


/**新增一級輔導(連續) V*/
addInterviews(event :any ,counsuleObj :CounselStudent){
    event.stopPropagation();
    this.addInterviewModal(counsuleObj);
  }


  /** 打開連續輸入 */
  async addInterviewModal( studentInfo :CounselStudent  ) {
    // 建立當前學生資料
    let  currentCounselStudent :CounselStudent = new CounselStudent();
    currentCounselStudent.init(studentInfo);
    await  this._addInterview.loadSerialEnterDefaultData(true,this.targetList);

    this._addInterview._editMode = "add";

   await this._addInterview.loadDefaultData( currentCounselStudent );
   await this._addInterview._currentCounselInterview.useQuestionOptionTemplate();
    this._addInterview._currentCounselInterview.selectCounselType = "請選擇方式";
    this._addInterview._currentCounselInterview.selectContactName = "請選擇對象";
    
    // 其他清空
    this._addInterview._currentCounselInterview.ContactNameOther = '';
    this._addInterview._currentCounselInterview.CounselTypeOther = '';
    
    // 新增預設不公開
    // this._addInterview._currentCounselInterview.isPublic = this.globalService.isCaseInterviewOpenDefault;
    this._addInterview._currentCounselInterview.isSaveDisable = true;
    $("#addInterview").modal("show");
    
    // 關閉畫面
    $("#addInterview").on("hide.bs.modal", () => {
      if (!this._addInterview.isCancel) {
        // 重整資料
        // this.onReferStateChange();
        // this.counselStudentService.reload();
        // this.loadCounselInterview(this._StudentID);
      }
      $("#addInterview").off("hide.bs.modal");
      this.counselStudentService.reload();
      this.getList();
    });
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action);
  }






  async getList() {
    if (!this.counselStudentService.isLoading) {
      this.currentSchoolYear = this.counselStudentService.currentSchoolYear;
      this.currentSemester = this.counselStudentService.currentSemester;
      this.deny = false;
      // // 如果是班導認輔老師轉介個案都無法使用
      // if (this.appComponent.roleService) {
      //   this.appComponent.roleService.SetEnableReferral(false);
      //   this.appComponent.roleService.SetEnableCase(false);
      // }

      if (this.mod === "class") {
      this.globalService.currentRole =this.roleType
        if (this.counselStudentService.classMap.has(this.target)) {
          this.targetList = this.counselStudentService.classMap.get(
            this.target
          ).Student;
          if (this.counselComponent != null) {
            this.counselComponent.setSelectItem(
              this.counselStudentService.classMap.get(this.target).ClassName
            );
            this.globalService.selectTarget = this.target;

            // // 細項檢查權限
            // if (this.counselStudentService.classMap.get(this.target).Role) {
            //   if (
            //     this.counselStudentService.classMap.get(this.target).Role[0] ===
            //     "班導師"
            //   ) {
            //     // 使用轉介,個案
            //     this.appComponent.roleService.SetEnableCase(false);
            //     this.appComponent.roleService.SetEnableReferral(false);
            //   }
            //   if (
            //     this.counselStudentService.classMap.get(this.target).Role[0] ===
            //     "輔導老師"
            //   ) {
            //     // 使用轉介,個案
            //     this.appComponent.roleService.SetEnableCase(true);
            //     this.appComponent.roleService.SetEnableReferral(true);
            //   }
            // }
          }
        } else {
          this.deny = true;
        }
      }
      if (this.mod === "guidance") {
        this.globalService.currentRole =this.roleType
        if (this.counselComponent != null) {
          if (this.target === "g") {
            this.counselComponent.setSelectItem("認輔學生");
          }
        }
        let tmp = [];
        this.counselStudentService.guidanceStudent.forEach(data => {
          let key = `${data.SchoolYearVG}_${data.SemesterVG}`;
          if (!tmp.includes(key)) {
            let sms: SemesterInfo = new SemesterInfo();
            if (data.SchoolYearVG) {
              sms.SchoolYear = data.SchoolYearVG;
              sms.Semester = data.SemesterVG;
              this._semesterInfo.push(sms);
              tmp.push(key);
            }

          }
        });
        this.targetList = this.counselStudentService.guidanceStudent; 
        this.scrList = this.counselStudentService.guidanceStudent ;// 可以塞選
      }

      if (this.mod === "search") {
        this.targetList = [];
        this.searchMessage ="";
        if (this.target.replace('/ /ig', "").length > 0) {
          this.searchMessage = "搜尋中 ...";
          await this.counselStudentService.SearchText(this.target);
          this.targetList = this.counselStudentService.searchStudent;
          if (this.targetList.length === 0) {
            this.searchMessage = "沒有資料。";
          }else
          {
            this.searchMessage = "";
          }
        }



        if (this.counselComponent != null) {
          this.counselComponent.setSelectItem("搜尋");
        }
      }


    } else {
      if (this.counselComponent != null) {
        this.counselComponent.setSelectItem("");
      }
      setTimeout(this.getList, 100);
    }
  }




  /**依所選條件 選取*/
  getListByCondition(){
  
  // 暫存起來後
  let  temp  = Object.assign({},this.targetList);
  // asign 給 要顯示的 targetList 
  if(temp && temp.length>0){
 

  }

  }
}
