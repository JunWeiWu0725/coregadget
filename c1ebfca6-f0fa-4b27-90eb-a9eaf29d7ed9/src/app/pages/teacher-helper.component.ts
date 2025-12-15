import { Component, OnInit, Inject } from '@angular/core';
import { DSAService, Student, AttendanceItem, PeriodStatus, GroupType, RollCallCheck } from './../service/dsa.service';
import { ActivatedRoute, Router } from '@angular/router';
import { GadgetService } from '../service/gadget.service';
import { AlertService } from './../service/alert.service';
import { I18NEXT_SERVICE, ITranslationService } from 'angular-i18next';
import { t } from '@angular/core/src/render3';

@Component({
  selector: 'gd-teacher-helper',
  templateUrl: './teacher-helper.component.html',
  styleUrls: ['../common.css']
})
export class TeacherHelperComponent implements OnInit {

  curr_day: string;
  type: string;
  targetName: string;
  targetID: string;
  period: string;
  //teacherHelper: TeacherHelper = {} as TeacherHelper;
  teacherHelpers: TeacherHelper[] = [];

  students: Student[] = [];
  showPhoto: boolean;
  teacherSetting: any;
  settingList: any;
  objectKeys = Object.keys;
  checkSummary;
  today: string; // 今日。

  constructor(
    private dsa: DSAService,
    private route: ActivatedRoute,
    private gadget: GadgetService,
    private alert: AlertService,
    private router: Router,
    @Inject(I18NEXT_SERVICE) private i18next: ITranslationService
  ) {
  }

  async ngOnInit() {

    // 取得 setting  (是否取得照片)
    this.teacherSetting = await this.dsa.getTeacherSetting();
    this.settingList = this.objectKeys(this.teacherSetting);
    this.showPhoto = this.teacherSetting['usePhoto'];

    this.route.paramMap.subscribe(async pm => {
      this.curr_day = pm.get('curr_day');
      this.type = pm.get('type');
      // this.targetName = pm.get('name'); // course name
      this.targetID = pm.get('id'); // course id
      this.period = pm.get('period');

      try {
        // 學生清單（含點名資料）。 
        await this.reloadTeacherHelper();
      } catch (error) {
        this.alert.json(error.message);
      }
    });
  }

  public async reloadTeacherHelper() {
    this.students = [];
    // 取得學生清單
    const _students = await this.dsa.getStudent(this.type, this.targetID, this.curr_day, this.period);
    // 取得學生照片URL
    const c = await this.gadget.getContract("campus.rollcall.teacher");
    const session = await c.send("DS.Base.Connect", { RequestSessionID: '' });
    for (const stu of _students) {
      // 取得學生照片 url
      stu.PhotoUrl = `${this.dsa.getAccessPoint()}/GetStudentPhoto?stt=Session&sessionid=${session.SessionID}&parser=spliter&content=StudentID:${stu.StudentID}`;
      this.students.push(stu);
    }
    // 取得課程助手
    var rsp = await this.dsa.send("GetClassHelper");

    this.teacherHelpers = [];
    [].concat(rsp.Class || []).concat(rsp.Course || []).forEach(item => {
      if (this.type == "Course" && item.CourseID == this.targetID) {
        if (item.StudentID) { // 過濾空值
          this.targetName = item.CourseName;
          const tea = { StudentID: item.StudentID, StudentName: item.StudentName, StudentNumber: item.StudentNumber }
          this.teacherHelpers.push(tea);


          //this.teacherHelper.StudentID = item.StudentID;
          //this.teacherHelper.StudentName = item.StudentName;
          //this.teacherHelper.StudentNumber = item.StudentNumber;
        }
      }
      if (this.type == "Class" && item.ClassID == this.targetID) {
        if (item.StudentID) { // 過濾空值
          this.targetName = item.ClassName;
          const tea = { StudentID: item.StudentID, StudentName: item.StudentName, StudentNumber: item.StudentNumber }
          this.teacherHelpers.push(tea);

          // this.teacherHelper.StudentID = item.StudentID;
          // this.teacherHelper.StudentName = item.StudentName;
          // this.teacherHelper.StudentNumber = item.StudentNumber;
        }
      }
    });
  }

  getTeacherHelperText(stu: Student) {

    const targetStud = this.teacherHelpers.find(s => s.StudentID === stu.StudentID);
    return (targetStud) ? this.i18next.t('assistant', { defaultValue: '小幫手' }) : '- -';
  }

  getTeacherHelperStyle(stu: Student) {

    let bgColor = 'rgba(255,255,255, 0.1)';
    let fgColor = 'rgba(0,0,0,0.5)';

    const targetStud = this.teacherHelpers.find(s => s.StudentID === stu.StudentID);

    if (targetStud) {
      bgColor = '#259B24';
      fgColor = 'white';
    }

    return {
      "background-color": bgColor,
      "color": fgColor,
    }
  }

  changeTeacherHelper(stu: Student) {

    const targetStud = this.teacherHelpers.find(s => s.StudentID === stu.StudentID);

    if (targetStud) {
      // 取消選擇
      this.teacherHelpers = this.teacherHelpers.filter(th => th.StudentID !== stu.StudentID);
      //this.teacherHelper = {} as TeacherHelper;
    } else {
      // 檢查是否已達到2位小幫手的限制
      if (this.teacherHelpers.length >= 2) {
        this.alert.snack("最多只能選擇2位小幫手");
        return;
      }
      
      if (!targetStud && stu.StudentID) {
        this.teacherHelpers.push({ StudentID: stu.StudentID, StudentName: stu.Name, StudentNumber: stu.StudentNumber });
      }
      // this.teacherHelper.StudentID = stu.StudentID;
      // this.teacherHelper.StudentName = stu.Name;
      // this.teacherHelper.StudentNumber = stu.StudentNumber;  
    }
  }

  // 儲存課程助手
  async saveTeacherHelper() {

    const dialog = this.alert.waiting("儲存中...");

    //傳入多筆的StudentID
    const studentIDList = [];
    for (const t of this.teacherHelpers) {
      if (t.StudentID) { // 過濾空值
        studentIDList.push(t.StudentID);
      }
    }

    try {

      await this.dsa.setHelper(this.type, this.targetID, studentIDList);

      this.router.navigate(['/setting']);
    } catch (error) {
      this.alert.json(error);
    } finally {
      dialog.close();
    }
  }

}

export interface TeacherHelper {
  StudentID: string;
  StudentName: string;
  StudentNumber: string;
}