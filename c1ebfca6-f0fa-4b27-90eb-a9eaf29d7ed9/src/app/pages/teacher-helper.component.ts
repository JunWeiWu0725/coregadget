import { Component, OnInit, Inject } from '@angular/core';
import { DSAService, Student, AttendanceItem, PeriodStatus, GroupType, RollCallCheck } from './../service/dsa.service';
import { ActivatedRoute, Router } from '@angular/router';
import { GadgetService } from '../service/gadget.service';
import { AlertService } from './../service/alert.service';
import { I18NEXT_SERVICE, ITranslationService } from 'angular-i18next';

@Component({
  selector: 'gd-teacher-helper',
  templateUrl: './teacher-helper.component.html',
  styleUrls: ['../common.css']
})
export class TeacherHelperComponent implements OnInit {

  today: string;
  type: string;
  targetName: string;
  targetID: string;
  period: string;
  teacherHelper: TeacherHelper = {} as TeacherHelper;
  students: Student[];
  showPhoto: boolean;
  teacherSetting: any;
  settingList: any;
  objectKeys = Object.keys;
  checkSummary ;

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

    this.today = await this.dsa.getToday();
    this.route.paramMap.subscribe(async pm => {

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
    const _students = await this.dsa.getStudent(this.type, this.targetID, this.today, this.period);
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
    [].concat(rsp.Class || []).concat(rsp.Course || []).forEach(item => {
      if (this.type == "Course" && item.CourseID == this.targetID) {
        this.targetName = item.CourseName;
        this.teacherHelper.StudentID = item.StudentID;
        this.teacherHelper.StudentName = item.StudentName;
        this.teacherHelper.StudentNumber = item.StudentNumber;
      }
      if (this.type == "Class" && item.ClassID == this.targetID) {
        this.targetName = item.ClassName;
        this.teacherHelper.StudentID = item.StudentID;
        this.teacherHelper.StudentName = item.StudentName;
        this.teacherHelper.StudentNumber = item.StudentNumber;
      }
    });
  }

  getTeacherHelperText(stu: Student) {
    return (stu.StudentID == this.teacherHelper.StudentID) ? this.i18next.t('assistant', { defaultValue: '小幫手' }) : '- -';
  }

  getTeacherHelperStyle(stu: Student) {

    let bgColor = 'rgba(255,255,255, 0.1)';
    let fgColor = 'rgba(0,0,0,0.5)';

    if (stu.StudentID == this.teacherHelper.StudentID) {
      bgColor = '#259B24';
      fgColor = 'white';
    }

    return {
      "background-color": bgColor,
      "color": fgColor,
    }
  }

  changeTeacherHelper(stu: Student) {
    if (stu.StudentID == this.teacherHelper.StudentID ) {
      this.teacherHelper = {} as TeacherHelper;
    } else {
      this.teacherHelper.StudentID = stu.StudentID;
      this.teacherHelper.StudentName = stu.Name;
      this.teacherHelper.StudentNumber = stu.StudentNumber;  
    }
  }

  async saveTeacherHelper() {

    const dialog = this.alert.waiting("儲存中...");

    try {
      await this.dsa.setHelper(this.type, this.targetID, this.teacherHelper.StudentID);

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