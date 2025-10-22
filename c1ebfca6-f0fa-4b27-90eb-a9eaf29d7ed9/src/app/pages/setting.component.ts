import { Component, OnInit, Inject } from '@angular/core';
import { DSAService, RollCallRecord, PeriodConf, AbsenceConf, Schedule, CourseConf, ConfigData } from './../service/dsa.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ConfigService } from '../service/config.service';
import { AlertService } from '../service/alert.service';
import { RollCallRateDenominator } from './vo';

import { I18NEXT_SERVICE, ITranslationService } from 'angular-i18next';

@Component({
  selector: 'gd-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['../common.css']

})
export class SettingComponent implements OnInit {

  //頁面分為兩部分， 1 點名設定 2.設定小幫手    

  showPicture: boolean;
  teacherSetting: any;
  objectKeys = Object.keys;
  loading: boolean;
  settingList: any;
  classList: any[];
  courseList: any[];

  //顯示母數 
  denominatorString : string  = '未設定';
  peiord :string ='未設定';
  weekCount :string = '未設定';
  showAbsenceRate : boolean ;
  // 如果設定採用 上課週數*節數 但是課程上卻沒有設節次 調出提醒字眼
  reminderMessage : string ;
  isUseWeekFromCourse :boolean ;

  today: string; // 今日。
  
  constructor(
    private dsa: DSAService,
    private router: Router,
    private config: ConfigService,
    private alert: AlertService,
    @Inject(I18NEXT_SERVICE) private i18next: ITranslationService
  ) { }

  async ngOnInit() {
    await this.Init();
  }
  async Init() {

    this.loading = true;
    try {
      //取得老師設定
      this.teacherSetting = await this.dsa.getTeacherSetting();
      this.settingList = this.objectKeys(this.teacherSetting);
      //取得班級、課程資料
      var rsp = await this.dsa.send("GetClassHelper");
      //this.classList = [].concat(rsp.Class || []);
      
      const targetClasses = [];
      const tempClassList = [].concat(rsp.Class || []);
      tempClassList.forEach(cls => {
        let targetCls = targetClasses.find(c => cls.ClassID === c.ClassID);

        if(!targetCls){
          targetCls = {...cls}
          targetCls.Students = [{StudentID : cls.StudentID , StudentName : cls.StudentName}];
          targetClasses.push(targetCls);
        } else {
          targetCls.Students.push({StudentID : cls.StudentID , StudentName : cls.StudentName});
        }

      });
      this.classList = targetClasses;
      
      console.log(this.classList);
      
      
      // courseList 處理方式改為與 classList 相同
      const targetCourses = [];
      const tempCourseList = [].concat(rsp.Course || []);
      tempCourseList.forEach(course => {
        let targetCourse = targetCourses.find(c => course.CourseID === c.CourseID);
        if (!targetCourse) {
          targetCourse = { ...course };
          targetCourse.Students = [{ StudentID: course.StudentID, StudentName: course.StudentName }];
          targetCourses.push(targetCourse);
        } else {
          targetCourse.Students.push({ StudentID: course.StudentID, StudentName: course.StudentName });
        }
      });
      this.courseList = targetCourses;
      
      this.today = await this.dsa.getToday();
      // 取得點名母數 
     this.isUseWeekFromCourse  =   await this.dsa.getAbsenRateDenominatorDepen() ;
   
    } catch (error) {
       console.log("發生錯誤!");
    } finally {
      this.loading = false;
    }
  }


  async openTeacherHelper(course: CourseConf) {

    this.router.navigate(['/teacher-helper',this.today , course.CourseID, course.CourseName]);
  }


  async settingChange(settingKey: any, settingValue: boolean) {
    this.teacherSetting[settingKey] = settingValue;
  }
  async saveSetting() {

    const dialog = this.alert.waiting(this.i18next.t('saving', { defaultValue: '儲存中...' }));
    try {
      await this.dsa.setTeacherSetting(this.teacherSetting);
      this.alert.snack(this.i18next.t('save-success', { defaultValue: '儲存成功' }));
    } catch (error) {
      this.alert.json(error);
    } finally {
      dialog.close();
    }
  }

}
