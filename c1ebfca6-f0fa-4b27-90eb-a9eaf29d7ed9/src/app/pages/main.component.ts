import { ConfigService } from './../service/config.service';
import { PeriodChooserComponent } from './../modal/period-chooser.component';
import { AlertService } from './../service/alert.service';
import { DebugComponent } from './../modal/debug.component';
import { DSAService, RollCallRecord, PeriodConf, AbsenceConf, Schedule, CourseConf, ConfigData , DayMakeUp} from './../service/dsa.service';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { SubstituteComponent } from './substitute.component';
import { TeacherHelperComponent } from './teacher-helper.component';

@Component({
  selector: 'gd-main',
  templateUrl: './main.component.html',
  styleUrls: ['../common.css']
})
export class MainComponent implements OnInit {

  //頁面分為三頁,今日課程,建議點名,調代課程
  courseColumns: string[] = ['CourseName'];
  scheduleColumns: string[] = ['Period', 'Name', 'StudentCount', 'Checked'];
  loading: boolean;

  today: string; // 今日。
  periodConfs: PeriodConf[];
  conf: ConfigData;
  options : DayMakeUp[];
  selectedValue = '';

  constructor(
    private dsa: DSAService,
    private alert: AlertService,
    private dialog: MatDialog,
    private router: Router,
    private config: ConfigService
  ) { }

  async ngOnInit() {
    await this.Init();

    // if (this.options.length > 0) {
    //     this.selectedValue = this.options[0].value;
    // }
    // this.today = this.selectedValue ;
    
  
    console.log({
      today: this.today ,
      selectedDay: this.dsa.getSelectedDay(),
      selectedValue: this.selectedValue
    });
  }

  onSelectionChange(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    console.log('選擇的值為：', selectedValue);
  
    this.dsa.getSchedule(selectedValue).then(conf => {
      this.conf = conf;

      this.dsa.setSelectedDay(selectedValue);
      this.today = selectedValue;
      
    });
  }

  async Init() {
    this.loading = true;
    try {

      //等待是否完成設定值的下載
        this.config.ready;

        this.options = await this.dsa.getDayMakeUp();
      

      if (this.dsa.getSelectedDay()) {
        this.today = this.dsa.getSelectedDay();
        this.selectedValue = this.today.replace(/\//g, '-') ;
      } else {
        this.today = await this.dsa.getToday();
        this.dsa.setSelectedDay(this.today);
        this.selectedValue = this.options[0].value ;
      }

      this.conf = await this.dsa.getSchedule(this.today);

      // 合併同課程的多位小幫手，產生 Students 陣列
      if (this.conf && this.conf.CourseConf) {
        const targetCourses = [];
        const tempCourseList = [].concat(this.conf.CourseConf || []);
        tempCourseList.forEach(course => {
          let targetCourse = targetCourses.find(c => course.CourseID === c.CourseID);
          if (!targetCourse) {
            targetCourse = { ...course };
            targetCourse.Students = [{ StudentID: course.StudentID, StudentName: course.StudentName, StudentNumber: course.StudentNumber }];
            targetCourses.push(targetCourse);
          } else {
            targetCourse.Students.push({ StudentID: course.StudentID, StudentName: course.StudentName, StudentNumber: course.StudentNumber });
          }
        });
        this.conf.CourseConf = targetCourses;
      }

    } catch (error) {
      this.alert.json(error);
    } finally {
      this.loading = false;
    }
  }

  //開啟學生清單介面
  async openSchedule(schedule: Schedule) {
    const md1 = this.selectedValue; //日期
    const md2 = schedule.ClassID ? 'Class' : 'Course';
    const md3 = schedule.ClassID ? schedule.ClassID : schedule.CourseID;
    const md4 = schedule.Period;
    const md5 = schedule.ClassID ? schedule.ClassName : schedule.CourseName;

    this.router.navigate(['/pick', md1, md2, md3, md4, md5]);
  }

  //開啟節次點名介面
  async openPicker(course: CourseConf) {
    this.dialog.open(PeriodChooserComponent, {
      data: {curr_day: this.today, course: course, period: this.conf.PeriodConf },
    });
  }

  //開啟代課清單
  async openSubstitute() {
    this.router.navigate(['../sub']);
  }

  async openClassSubstitute() {
    this.router.navigate(['../class']);
  }

  //開啟設定小幫手畫面
  async openTeacherHelper(course: CourseConf){
    this.router.navigate(['/teacher-helper',course.CourseID,course.CourseName]);
  }
}
