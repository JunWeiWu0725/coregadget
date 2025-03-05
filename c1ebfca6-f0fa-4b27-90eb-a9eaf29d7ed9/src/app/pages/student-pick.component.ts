import { ConfigService, AbsenceConf, PeriodConf } from './../service/config.service';
import { AlertService } from './../service/alert.service';
import { DSAService, Student, AttendanceItem, PeriodStatus, GroupType, RollCallCheck } from './../service/dsa.service';
import { Component, OnInit, ChangeDetectorRef, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuPositionX } from '@angular/material/menu';
import { StudentCheck } from '../student-check';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { GadgetService } from '../service/gadget.service';
import { RollCallRateDenominator } from './vo';
import { Console } from '@angular/core/src/console';
import { HttpClient } from '@angular/common/http';
import { I18NEXT_SERVICE, ITranslationService } from 'angular-i18next';
import { StringLiteral } from 'typescript';

@Component({
  selector: 'gd-student-pick',
  templateUrl: './student-pick.component.html',
  styleUrls: ['../common.css']
})
export class StudentPickComponent implements OnInit {
  isShowCheckInTime  ="" ;
  /** 是否顯示英文名字 預設為否 */
  displayEnglishName :boolean = false ;


  curr_day: String;

  periodConf: PeriodConf; // 節次設定，決定有哪些缺曠可以點。

  period: string;

  selectedAbsence: string; // 已選擇的缺曠類別。

  groupInfo: {curr_day: string, type: GroupType, id: string, name: string } // 課程或班級。

  /**【View Binding】 */
  studentChecks: StudentCheck[]; //點名狀態。

  checkSummary: string; // 目前點名狀態統計。

  showCurrentAbsentType = "";

  // isMouseIn = false;

  absenceRates: any;
  teacherSetting: any;
  settingList: any;
  objectKeys = Object.keys;
  showPhoto: boolean;
  explainMessage: string = "";
  dsnsName :string ="" ;
  
  /** 林口客製 */
  listCheckInTimes :any[] =[]
  /**學制 */ 
  schoolTye ="";
  constructor(
    private dsa: DSAService,
    private route: ActivatedRoute,
    private alert: AlertService,
    private config: ConfigService,
    private change: ChangeDetectorRef,
    private router: Router,
    private gadget: GadgetService,
    private http: HttpClient,
    @Inject(I18NEXT_SERVICE) private i18next: ITranslationService
  ) {
  }

  async ngOnInit() {

    this.isShowCheckInTime = gadget.params.isShowCheckInTime;
   // 取得學制

   this.getSchoolType();

    //setting 
    this.teacherSetting = await this.dsa.getTeacherSetting();
    this.settingList = this.objectKeys(this.teacherSetting);

    this.showPhoto = this.teacherSetting['usePhoto'];

    this.groupInfo = {curr_day: '', type: '', id: '', name: '' };
    await this.config.ready;

    this.route.paramMap.subscribe(async pm => {
      this.groupInfo.curr_day = pm.get('curr_day'); // 日期
      this.curr_day= pm.get('curr_day'); // 日期

      this.groupInfo.type = pm.get('type') as GroupType; // course or class
      console.log(this.groupInfo.type);
      this.groupInfo.id = pm.get('id'); // course id
      this.period = pm.get('period'); // period name
      this.groupInfo.name = pm.get('name');

      // console.log(pm.get('name'));
  
      //載入出席率
      if(this.groupInfo.type == 'Course'){
        await this.loadAbsencreRate();
      }

    // 林口康橋 (客製)
    if(this.isShowCheckInTime){
   
      this.listCheckInTimes = await this.dsa.getCheckIntime(this.groupInfo.id ,'',  this.groupInfo.type)
      }
      // 可點節次。
      this.periodConf = this.config.getPeriod(this.period);
      
      if(this.periodConf)
      {
        this.periodConf.Absence = [].concat(this.periodConf.Absence || []);

      }else{ // 沒有設定節次 
        alert("未設定可點名假別! 請聯絡行政人員!");
      }

      try {
        // 學生清單（含點名資料）。 
        await this.reloadStudentAttendances();
      } catch (error) {
        this.alert.json('ServiceError:GetStudents');
        console.log(error);
      }

      // 當有假別預設選第1個
      if (this.periodConf.Absence.length > 0) {
        this.selectedAbsence = this.periodConf.Absence[0].Name;
      }
    });
    const lang = document.documentElement.lang;    
    // 如果語言是 "en"，則顯示英文名字
    this.displayEnglishName = lang === 'en';
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
      
       }


}


/** 取得到校時間 */
getCheckInTime(studentID,date) :any{

  let result  = this.listCheckInTimes.find(x=>x.ref_student_id == studentID);
  return result ;
}






  /** 依目前以數載入缺曠資料。 */
  public async reloadStudentAttendances(msg?: string) {

    const students = await this.dsa.getStudent(this.groupInfo.type, this.groupInfo.id, this.curr_day, this.period);
    this.studentChecks = [];

    const c = await this.gadget.getContract("campus.rollcall.teacher");
    const session = await c.send("DS.Base.Connect", { RequestSessionID: '' });
    // 看看能不能顯示出席率 

    if(this.groupInfo.type =='Course')
    { //不課程才會去抓母數
      let denominator: RollCallRateDenominator = await this.dsa.getAbsenRateDenominator(this.groupInfo.id);
      if (denominator.IsUseWeeks == 'true') {
        if ((denominator.Period == "0" || denominator.Period == "")) {
          // this.explainMessage = "出席率分母採用 上課週數 * 節數， \n但節數為0或未設定，無法計算出席率 。"
          this.explainMessage = this.i18next.t('assistant_rate_weeks_nosessions')
        } else // 如果 節數設定正常 
        {
          if (denominator.WeeksFromCourse) {
            // this.explainMessage = `出席率分母採用 上課週數 * 節數  為  (${denominator.WeeksFromCourse}週*${denominator.Period}節) ${denominator.CourseDe} 堂`
            this.explainMessage = this.i18next.t('assistant_rate_weeks', { week: denominator.WeeksFromCourse, period: denominator.Period, course: denominator.CourseDe })
  
          } else {
            // this.explainMessage = `出席率分母採用 上課週數 * 節數  為  (${denominator.DefaultWeeks}週*${denominator.Period}節) ${denominator.DefaultDe} 堂`
            this.explainMessage = this.i18next.t('assistant_rate_weeks', { week: denominator.DefaultWeeks, period: denominator.Period, course: denominator.DefaultDe })
          }
        }
  
      } else { // 不採用上課週數 => 實際點名
        // this.explainMessage = `出席率分母採用 教師實際點名次數 為 ${denominator.ActualRollcallTime} 堂`
        this.explainMessage = this.i18next.t('assistant_rate_called', { called: denominator.ActualRollcallTime })
      }

    }


    for (const stu of students) {
      // 取得學生照片 url
      stu.PhotoUrl = `${this.dsa.getAccessPoint()}/GetStudentPhoto?stt=Session&sessionid=${session.SessionID}&parser=spliter&content=StudentID:${stu.StudentID}`;
     
      const status = this.getSelectedAttendance(stu);
      // 加入出席率
      if(this.groupInfo.type=='Course'){
        stu.AbsenceRate = this.absenceRates[stu.StudentID];
      }
      this.studentChecks.push(new StudentCheck(stu, status, this.periodConf));
    }

    this.calcSummaryText();

    if (msg) this.alert.snack(msg);
  }

  changeAttendance(stu: StudentCheck) {

    if (!this.selectedAbsence) {
      this.alert.snack(this.i18next.t('please-select-absence-type', { defaultValue: '請選擇假別！' }));
      return;
    }

    if (!stu.acceptChange()) {
      this.alert.snack(this.i18next.t('unable-to-adjust-absence', { defaultValue: '此學生無法調整缺曠。' }));
      return;
    }

    stu.setAttendance(this.selectedAbsence);

    this.calcSummaryText();

    // 移除懸浮預覽效果
    this.hideCurrentAbsType(stu);
    //因為只是調整陣列中的某個元件資料，並不會引發畫面更新。
    // this.change.markForCheck();
  }

  /** 計算統計值。 */
  calcSummaryText() {
    const summary = new Map<string, number>();
    for (const check of this.studentChecks) {

      if (!check.acceptChange()) continue;
      if (!check.status) continue;

      if (!summary.has(check.status.AbsenceType)) {
        summary.set(check.status.AbsenceType, 0);
      }

      summary.set(check.status.AbsenceType, summary.get(check.status.AbsenceType) + 1);
    }

    let text: string[] = [];
    for (let k of Array.from(summary)) {
      text.push(`${k[0]}: ${k[1]}`);
    }

    this.checkSummary = text.join(', ');
  }

  getAttendanceText(stu: StudentCheck) {

    return stu.status ? stu.status.AbsenceType : '- -';
  }

  /**顯示absType */
  showAbsText(stu: StudentCheck) {

    if (stu.status) {
    
        return stu.status.AbsenceType;
  

    } else {
      if (stu.isMouseIn) {
        return stu.showCurrentAbsType;

      } else {
        return " - "
      }

    }


  }
  getAttendanceStyle(stu: StudentCheck) {

    let bgColor = 'rgba(255,255,255, 0.1)';
    let fgColor = 'rgba(0,0,0,0.5)';

    if (stu.status) {
      const absType = stu.status.AbsenceType;
      const absConf = this.config.getAbsence(absType);
      if (absConf.Abbr) {
        bgColor = this.config.getAbsenceColor(absConf.Abbr);
      }
      fgColor = 'white';
    }

    return {
      "background-color": bgColor,
      "color": fgColor,
    }
  }

  getAbsenceRateStyle(rate) {
    //rgba(0, 0, 0, 0.54) !important
    var seed = 100 - Math.sqrt(100 - (rate || 0)) * 17;
    if (seed < 0) seed = 0;

    var r = 255 - 255 * seed / 100;
    var a = 1 - 0.54 * seed / 100;
    return {
      "color": "rgba(" + r + ", 0, 0, " + a + ")",
      "font-weight": (rate > 70 ? "" : "bold")
    }
  }

  /**
   * 取得學生在目前節次的缺曠狀態。
   * @param stu 學生資料。
   */
  private getSelectedAttendance(stu: Student) {
    var abs = (stu.Absence.AbsenceName || stu.Absence.RollCallChecked == 'true') ? stu.Absence.AbsenceName : stu.Absence.HelperRollCall;
    if (abs) {
      return {
        '@text': this.periodConf.Name,
        AbsenceType: abs
      } as PeriodStatus;
    }
    else {
      return null;
    }
    // if (!stu.Attendance) return;
    // const period = this.periodConf.Name;
    // const dateAtts = [].concat(stu.Attendance.Period) as PeriodStatus[];
    // return dateAtts.find(v => v['@text'] === period);
  }

  async saveRollCall() {

    const items: RollCallCheck[] = [];

    for (const check of this.studentChecks) {
      items.push(check.getCheckData());
    }

    const dialog = this.alert.waiting(this.i18next.t('saving', { defaultValue: "儲存中..." }));

    try {
      await this.dsa.setRollCall(this.groupInfo.curr_day ,this.groupInfo.type, this.groupInfo.id, this.periodConf.Name, items);
      this.router.navigate(['/main']);
    } catch (error) {
      this.alert.json(error);
    } finally {
      dialog.close();
    }

  }

  /**滑鼠移進來時顯示 目前顯示的 */
  showCurrentAbsType(studentCheck: StudentCheck) {

    studentCheck.isMouseIn = true;
    studentCheck.setShowCurrentAbsent(this.selectedAbsence);

    studentCheck.setShowCurrentAbsent(this.selectedAbsence);
  }
  /**滑鼠移進除去時顯示 不要顯示的 */
  hideCurrentAbsType(studentCheck: StudentCheck) {
    studentCheck.isMouseIn = false;
    studentCheck.clearShowCurrentAbsent();
  }

  selectedAbsenceItem(abbr) {
    this.selectedAbsence = abbr.Name;
  }


  //取得學生出席率 
  async loadAbsencreRate() {

    if (this.groupInfo.type == 'Course')
      this.absenceRates = await this.dsa.getAbsenceRate(this.groupInfo.id);
    else
      this.absenceRates = {};

  }
}