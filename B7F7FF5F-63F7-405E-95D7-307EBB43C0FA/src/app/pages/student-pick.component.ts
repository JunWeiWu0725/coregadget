import { ConfigService, AbsenceConf, PeriodConf } from './../service/config.service';
import { AlertService } from './../service/alert.service';
import { DSAService, Student, AttendanceItem, PeriodStatus, GroupType, RollCallCheck } from './../service/dsa.service';
import { Component, OnInit, ChangeDetectorRef, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuPositionX } from '@angular/material/menu';
import { StudentCheck } from '../student-check';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { GadgetService } from '../service/gadget.service';
import { debounceTime } from 'rxjs-compat/operator/debounceTime';
import { I18NEXT_SERVICE, ITranslationService } from 'angular-i18next';

@Component({
  selector: 'gd-student-pick',
  templateUrl: './student-pick.component.html',
  styleUrls: ['../common.css']
})
export class StudentPickComponent implements OnInit {

  today: string;

  periodConf: PeriodConf; // 節次設定，決定有哪些缺曠可以點。

  period: string;

  selectedAbsence: string; // 已選擇的缺曠類別。

  groupInfo: { type: GroupType, id: string, name: string } // 課程或班級。

  studentChecks: StudentCheck[]; //點名狀態。

  checkSummary: string; // 目前點名狀態統計。

  absenceRates: any;
  teacherSetting: any;
  settingList: any;
  objectKeys = Object.keys;
  showPhoto: boolean;
  needPassword : string ='true' ;
  teacherIdentity: any;

  constructor(
    private dsa: DSAService,
    private route: ActivatedRoute,
    private alert: AlertService,
    private config: ConfigService,
    private change: ChangeDetectorRef,
    private router: Router,
    private gadget: GadgetService,
    @Inject(I18NEXT_SERVICE) private i18next: ITranslationService
  ) {
  }

  async ngOnInit() {

    // 取得這們課儲存需不需要密碼 


    this.today = await this.dsa.getToday();

    this.showPhoto = false;

    this.groupInfo = { type: '', id: '', name: '' };
    await this.config.ready;

    this.route.paramMap.subscribe(async pm => {
      this.groupInfo.type = pm.get('type') as GroupType; // course or class
      this.groupInfo.id = pm.get('id'); // course id
      this.period = pm.get('period'); // period name
      this.groupInfo.name = pm.get('name');

      console.log(pm.get('name'));

      //載入出席率
      await this.loadAbsencreRate();


      // 可點節次。
      this.periodConf = this.config.getPeriod(this.period);
      this.periodConf.Absence = [].concat(this.periodConf.Absence || []);

      try {
        // 學生清單（含點名資料）。 
        await this.reloadStudentAttendances();
      } catch (error) {
        this.alert.json('ServiceError:GetStudent');
        console.log(error);
      }

      // 當有假別預設選第1個
      if (this.periodConf.Absence.length > 0) {
        this.selectedAbsence = this.periodConf.Absence[0].Name;
      }
    });

  }




  /** 依目前以數載入缺曠資料。 */
  public async reloadStudentAttendances(msg?: string) {
    const rollCallInfo = await this.dsa.getStudent(this.groupInfo.type, this.groupInfo.id, this.today, this.period);
    console.log('roll info',rollCallInfo);
    this.setTeacherIdentity(rollCallInfo.TeacherName,rollCallInfo.TeacherID );
    const students = rollCallInfo.Student;
    this.studentChecks = [];

    const c = await this.gadget.getContract("campus.rollcall.student");
    const session = await c.send("DS.Base.Connect", { RequestSessionID: '' });

    for (const stu of students) {

      // 取得學生照片 url
      stu.PhotoUrl = `${this.dsa.getAccessPoint()}/GetStudentPhoto?stt=Session&sessionid=${session.SessionID}&parser=spliter&content=StudentID:${stu.StudentID}`;
      const status = this.getSelectedAttendance(stu);

      // 加入出席率
      stu.AbsenceRate = this.absenceRates[stu.StudentID];

      this.studentChecks.push(new StudentCheck(stu, status, this.periodConf));
    }


    this.calcSummaryText();

    if (msg) this.alert.snack(msg);
  }

  setTeacherIdentity(name: string ,teacherID : string ) {
    this.teacherIdentity = {
       teacherID : teacherID
      , teacherName: name
      , teacherKey: ""
      , error: ""
      , saving: false
      , open: () => {
        $("#modal-key").modal({ show: true, backdrop: false, keyboard: false, focus: false });
        setTimeout(() => { $("#teacherKey").focus(); }, 500);
      }
      // 教師輸入密碼後儲存
      , save: async (isNeedPassWord :boolean ) => {

        //點名密碼未填不送出
        if (this.needPassword =="true" && !this.teacherIdentity.teacherKey) return;
       
        this.teacherIdentity.saving = true;
        try {
          const items: RollCallCheck[] = [];
          for (const check of this.studentChecks) {
            items.push(check.getCheckData());
          }
        
          
          const rsp = await this.dsa.setRollCallWithTeacherKey(
            this.groupInfo.type
            , this.groupInfo.id
            , this.periodConf.Name
            , this.teacherIdentity.teacherName
            , this.teacherIdentity.teacherKey
            , items
            , this.needPassword  =='true'
            , this.teacherIdentity.teacherID);
          if (rsp.Result == "Well done!") {
            this.router.navigate(['/main']);
          }
          else {
            this.teacherIdentity.error = rsp.Result;
          }
        }
        catch (exc) {
          this.alert.json(exc);
        }
        finally {
          this.teacherIdentity.saving = false;
        }
      }
      , ignore: () => {
        this.router.navigate(['/main']);
      }
    };
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

  /** 小幫手 儲存點名 */
  async saveRollCall() {
    console.log("this.teacherIdentity ",this.teacherIdentity );
    const items: RollCallCheck[] = [];

    for (const check of this.studentChecks) {
      items.push(check.getCheckData());
    }

    const dialog = this.alert.waiting(this.i18next.t('saving', { defaultValue: "儲存中..." }));

    var saved = false;
    try {
      debugger 
      await this.dsa.setRollCall(this.groupInfo.type, this.groupInfo.id, this.periodConf.Name, items);
      saved = true;
    } catch (error) {
      this.alert.json(error);
    } finally {
      dialog.close();
                
      let rsp  =  await this.dsa.getIsNeedPassword(this.teacherIdentity.teacherID);
      debugger
      console.log("need ??",rsp) ;  
      this.needPassword = rsp.isNeedPassWord ; // 只配是否有需要密碼
 
      if (saved){
        if(this.needPassword =="true" ){ // 如果需要密碼 才太出視窗
     
          this.teacherIdentity.open();
        }
        else
         {
          //教師沒有設定密碼 20220325與可為討論 直接儲存 

          if(this.needPassword =="true")
          {
            this.teacherIdentity.save(this.needPassword)
          }else{
            this.teacherIdentity.save(this.needPassword)
          }
        }
      }
    
    }
  }

  selectedAbsenceItem(abbr) {
    console.log(abbr);
    this.selectedAbsence = abbr.Name;
  }

  //取得學生出席率 
  async loadAbsencreRate() {

    if (this.groupInfo.type == 'Course')
      this.absenceRates = await this.dsa.getAbsenceRate(this.groupInfo.id);
    else
      this.absenceRates = {};

    console.log('', this.absenceRates);
    console.log("課程ID", this.groupInfo.id);
  }
}