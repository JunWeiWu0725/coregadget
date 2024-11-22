import { CounselTeacher } from './../case/case-student';
import { Component, OnInit, Optional, TemplateRef, ChangeDetectorRef, ViewChild } from '@angular/core';
import { AppComponent } from '../app.component';
import { Router, ActivatedRoute } from '@angular/router';
import { DsaService } from '../dsa.service';
import { timeout } from 'rxjs/operators';
import { RoleService } from "../role.service";
import { AngularWaitBarrier } from 'blocking-proxy/built/lib/angular_wait_barrier';
import { GenerateKeyAndSetTimeComponent } from './generate-key-and-set-time/generate-key-and-set-time.component';
import { SemesterInfo } from './../counsel-student.service';
import { HttpClient } from '@angular/common/http';
import { ConditionalExpr } from '@angular/compiler';
import { GlobalService } from '../global.service';

@Component({
  selector: 'app-comprehensive',
  templateUrl: './comprehensive.component.html',
  styleUrls: ['./comprehensive.component.css']
})
export class ComprehensiveComponent implements OnInit {
   compoGUID = "0f1e2d3c-4b5a-6d7e-8f9a-0b1c2d3e4f5a"
  @ViewChild("GenerateKeyAndSetTime") GenerateKeyAndSetTime: GenerateKeyAndSetTimeComponent;
  isShowInfo =false ;
  public counselVisible: Boolean = false;
  deny: Boolean = false;
  isLoading: Boolean = false;
  transferSuccess: Boolean = false;
  currentSemester: any;
  sectionList: any[];
  currentMode: string;
  currentSection: any;
  currentClass: any;
  plugin: TemplateRef<any>;
  generater: any = {};
  SchoolYearSemesterList: SemesterInfo[];
  GradeYearWrongsList: any[];
  schoolTye :'高中'|'國中'|'國小'  ;
  dsnsName = "" ;
  studentList : any [] =[];
  studentStatus : string  = "" ;
  /** 目前在更新的學生 */
  currentUpdateStudent : any ;

  isEditable : boolean = false ;
  IsBringbring: Boolean = false;
  IsBringChecked: Boolean = false;
  ShowBringPreviousSection: Boolean = false; // 看看要不要顯示 轉入前學年度學期的資料

  public comprehensiveStr: String = "產生綜合紀錄表";
  public comprehensiveStr1: String = "綜合紀錄表資料";
  dsns: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private dsaService: DsaService,
    public roleService: RoleService ,
    public changeDetectorRef: ChangeDetectorRef,
    @Optional()
    private appComponent: AppComponent ,
    private globalService :GlobalService ,
    private http: HttpClient
  ) {

  }

  ngOnInit() {


    // 設定是否可編輯權限
    this.isEditable =false ;
    // 預設

    this.comprehensiveStr = "產生綜合紀錄表";
    this.comprehensiveStr1 = "綜合紀錄表資料";
    this.appComponent.currentComponent = "comprehensive";
    this.currentMode = "view";
    this.dsns = gadget.getApplication().accessPoint;
    this.counselVisible = false;
    if (gadget.params.system_counsel_position === 'referral' || gadget.params.system_counsel_position === 'counselor') {
      this.counselVisible = true;
    }

    if (gadget.params.system_counsel_position === 'freshman') {
      // 新生特有
      this.comprehensiveStr = "產生填報資料";
      this.comprehensiveStr1 = "填報資料";
    }
    this.getSchoolType ();
    this.loadData();
  }


 /** 取得學制 ['國中','國小','高中']*/
  getSchoolType (){
    this.dsnsName = gadget.getApplication().accessPoint;
         // 取得學制v_2
         let url = `https://dsns.ischool.com.tw/campusman.ischool.com.tw/config.public/GetSchoolList?body=%3CCondition%3E%3CDsns%3E${this.dsnsName}%3C/Dsns%3E%3C/Condition%3E&rsptype=json`;
         try {
           this.http.get<any>(url, { responseType: 'json' }).subscribe(response => {
             this.schoolTye = response.Response.School.Type;

           });

         } catch (err) {
           console.log(err);
         }


}


  async loadData() {
    try {

      this.isLoading = true;
      this.currentSemester = (await this.dsaService.send("GetCurrentSemester", {})).CurrentSemester;
      this.sectionList = [].concat((await this.dsaService.send("GetFillInSectionClass", this.currentSemester)).Section || []);
      this.sectionList.forEach(sectionRec => {
        sectionRec.Subject = [].concat(sectionRec.Subject || []);
        sectionRec.Class = [].concat(sectionRec.Class || []);
        sectionRec.Class.forEach(classRec => {
        classRec.Subject = [].concat(classRec.Subject || []);
        });
      });
      this.isLoading = false;
    } catch (err) {
      alert(err);
    }
  }



  async genSSNKey(fillInSectionID) {
    try {
      await this.dsaService.send("GenerateFillInKeySSN", { FillInSectionID: fillInSectionID });
      window.location.reload();
    }  catch (err) {
      alert(err);
    }
  }

  async genGUIDKey(fillInSectionID) {
    try {
      await this.dsaService.send("GenerateFillInKeyGUID", { FillInSectionID: fillInSectionID });
      window.location.reload();
    } catch (err) {
      alert(err);
    }
  }

  /**
  * 顯使跳出視窗
  */
  async shoModal() {

    try {
      this.SchoolYearSemesterList = [];
      const SchoolYearSemesters = await this.dsaService.send("ComprehensiveRecordForm.GetComprehensiveRecordSchoolSemester");
      this.SchoolYearSemesterList = [].concat(SchoolYearSemesters.SemesterInfo || []);

      if (this.SchoolYearSemesterList.length > 0) {
        this.SchoolYearSemesterList = this.SchoolYearSemesterList.filter(item => { // 去除掉當學期
          return !(item.SchoolYear === this.currentSemester.SchoolYear && item.Semester === this.currentSemester.Semester);
        });

      }
      if (this.SchoolYearSemesterList.length !== 0) { // 如果本學期以前個學年度學期科目  如果不等於 0
        this.ShowBringPreviousSection = true; // 此區塊才顯示

      }
    } catch (err) {
      alert("發生錯誤" + err);
    }
    this.generater = {
      isBringPreviousAnsCheck: this.IsBringChecked,
      selectSemesterInfo: null,
      schoolYear: this.currentSemester.SchoolYear,
      semester: this.currentSemester.Semester,
      isLoading: false,
      isSaving: false,
      isBringPrevious: false,
      schoolSystem : this.schoolTye,
      dsaService: this.dsaService,
       http :this.http ,
      progress: 0,
      currentClass: "",
      /**
       * 按下「產生」
       */
      gen: async function () {
        // 檢查有沒有選擇學年度學期
        if (this.isBringPreviousAnsCheck) {
          if (!this.selectSemesterInfo) {
            alert("請選擇學年度學期!");
            return;
          }
        }
        // 檢查 學校年級 是否正確在(1-6範圍內)
        let isNeedAdjustGrade = false ;
        let adjusctGradeSapn ;
        let extensionGrade:string[]=[];

         // 取得年級
        try{
             let  showText ='校務系統年級非1-6年級 \n本作業會自動對應，對應如下: \n';
             showText+=`學制:${this.schoolSystem}\n`;
             let rsp =   await this.dsaService.send("GetAllGradeYearAdjustInfo", {
          });
              let showTextlist= [].concat(rsp.Result||[]);

              if(this.schoolSystem == '國小')
              {
                isNeedAdjustGrade =false ;
              }else
              {        if(showTextlist.length > 0) //如果有需要調整的年級
                {
                  isNeedAdjustGrade =true ;
                  showTextlist.forEach(item =>{
                    if(this.schoolSystem =="國中" && item.AdjustSpan =='6')
                    {
                      adjusctGradeSapn =item.AdjustSpan ;
                      showText += `${item.OrgGradeYear}年級 對應至 ${item.AdjustGrade}年級\n`
                      extensionGrade.push(item.OrgGradeYear) ;
                    }else if(this.schoolSystem=="高中" &&item.AdjustSpan =='9'){
                      adjusctGradeSapn =item.AdjustSpan ;
                      showText += `${item.OrgGradeYear}年級 對應至 ${item.AdjustGrade}年級\n`
                      extensionGrade.push(item.OrgGradeYear) ;
                    }else{
                      showText += `${item.OrgGradeYear}年級之班級，不會展開 (年級與學制不符)。\n`
                    }
                 });
                 if(!confirm(showText+'如對應有誤請點選"取消"， \n如正確請點選"確定"繼續執行!'))
                 {
                  return
                 }
                }
              }
        }catch(err){
          alert('資料庫查詢學制或年級有誤!');
        }


        if (this.isSaving || this.isLoading) { return; }
        this.isSaving = true;
        this.progress = 0;
        this.currentClass = "";
        let classList = await this.dsaService.send("GetClass", {});
        classList = [].concat(classList.Class || []);
        let index = 0;

        for (const classRec of classList) {

          if(!isNeedAdjustGrade) //如果不需要調整對應
          {
            try {
              await this.dsaService.send("GenerateFillInData", {
                SchoolYear: this.schoolYear
                , Semester: this.semester
                , ClassID: classRec.ClassID
              });
              this.currentClass = classRec.ClassName + " 題目展開中 ...";
            } catch (err) {
              console.log(err);
              alert("發生錯誤 :  \n"+ JSON.stringify(err))
            }
          }else{ //如需調整年級
            try {
              if(extensionGrade.includes(classRec.GradeYear)) //有允許展開的年級才會展開
              {
                await this.dsaService.send("GenerateFillInDataForSpecificGrade", {
                SchoolYear: this.schoolYear
                , Semester: this.semester
                , ClassID: classRec.ClassID
                , AdjusctGradeSapn :adjusctGradeSapn

              });
                  this.currentClass = classRec.ClassName + " 題目展開中 ...";
              }
            } catch (err) {
              console.log(err);
            }
          }

          this.progress = Math.round((++index) * 100 / classList.length);
        }
        this.isSaving = false;
        this.progress = 0;
        this.isBringPrevious = true;

        // 帶入之前學期
        if (this.isBringPreviousAnsCheck){// 如果有勾選帶入前學年度學習
          let index2 = 0;
          for (const classRec of classList) {
            this.currentClass = classRec.ClassName + "    " + this.selectSemesterInfo.SchoolYear + "學年度" + this.selectSemesterInfo.Semester + "學期" + " 答案轉入中 ...";
            try {
              const resp = await this.dsaService.send("ComprehensiveRecordForm.UpdateAnswerByPreviousSemester", {
                CurrentSchoolYear: this.schoolYear
                , CurrentSemester: this.semester
                , SourceSchoolYear: this.selectSemesterInfo.SchoolYear
                , SourceSemester: this.selectSemesterInfo.Semester
                , ClassID: classRec.ClassID
              });
            } catch (err) {
              alert("發生錯誤:" + err.dsaError.message);
              console.log("error", err);
            }
            this.progress = Math.round((++index2) * 100 / classList.length);
          }
          this.isBringPrevious = false;
        }
        $("#GenerateFillInData").modal('hide');
        window.location.reload();
      },

      /**
       * 當勾選帶入先前學年度學期資料時 select 的disable 跟著變動
       */
      clearSemester : function() {
        if (!this.isBringPreviousAnsCheck) {
          this.selectSemesterInfo = null ;

        }
      }
    };

    $("#GenerateFillInData").modal({
      show: true,
      focus: true,
      keyboard: false,
      backdrop: 'static'
    });
  }


  /**
   * 開新分頁
   *
   * @memberof ComprehensiveComponent
   */
  openWindow(url :string ){
    window.open('content.htm#/(simple-page:simple-page/'+this.dsns+'/comprehensive_fill)', '_blank');
  }
  /**
   * Modal彈出(轉入系統核心欄位)
   */
  async showSystemAsyncModal() {

    $("#genSystemCoreColtoAFrom").modal({
      show: true,
      focus: true,
      keyboard: false,
      backdrop: 'static'
    });
  }

  /** 轉入校務系統欄位 */
  async transferSystemCoreColToAFrom(){

    // 取得學生資訊
    this.isLoading = true;
    try {
      const resp = await this.dsaService.send("TranferAdminSystem.GetAllStudentsStatus1", {});
      this.studentList =resp.rs
      // alert(JSON.stringify( this.studentList));
      /** 對在校生進行轉入 */
      for (const stud of this.studentList) {
        try{
          await this.transferSystemCoreColToAFromByStudent(stud);
          this.currentUpdateStudent =stud;
         }catch(ex){
           alert(stud.id);
         }
      }

      this.isLoading = false;
      this.transferSuccess = true;
      // $("#genSystemCoreColtoAFrom").modal('hide');
    } catch (ex) {
      alert(`發生錯誤:${JSON.stringify(ex)}`);
    }
  }


  /** 一個學生一個學生 */
  async transferSystemCoreColToAFromByStudent(stud :any ) {
    this.isLoading = true;
    this.studentStatus += stud.id
    try {
      const resp = await this.dsaService.send("TranferAdminSystem.TranferAdminSysToAformByStud", {
        SchoolYear: this.currentSemester.SchoolYear
        , Semester: this.currentSemester.Semester
        , StudentID :stud.id
      });



      // $("#genSystemCoreColtoAFrom").modal('hide');
    } catch (ex) {
      alert(`${stud.class_name}(${stud.seat_no}) ${stud.name} 轉入發生錯誤`);
    }
  }



  /**
   * 轉入系統核心欄位
   */
  async transferSystemCoreColToAFrom1() {
    this.isLoading = true;
    try {
      const resp = await this.dsaService.send("TranferAdminSystem.TranferAdminSysToAform", {
        SchoolYear: this.currentSemester.SchoolYear
        , Semester: this.currentSemester.Semester
      });
      this.isLoading = false;
      this.transferSuccess = true;


      // $("#genSystemCoreColtoAFrom").modal('hide');
    } catch (ex) {
      alert(`發生錯誤:${ex}`);
    }
  }

  updateCurrentonObject(even, index) {
  }


  // 顯示設定代碼與設定開放時間
  async showGenerateKeyAndSetTime() {
    // this.GenerateKeyAndSetTime.selectFillInSection = null;
    // this.GenerateKeyAndSetTime.selectSchoolYear = "";
    // this.GenerateKeyAndSetTime.selectSemester = "";
    await this.GenerateKeyAndSetTime.loadData();
    $("#GenerateKeyAndSetTime").modal("show");
    // 關閉畫面
    $("#GenerateKeyAndSetTime").on("hide.bs.modal", () => {
      // 重整資料
      //     this.loadData();
      $("#GenerateKeyAndSetTime").off("hide.bs.modal");

    });
  }
}
