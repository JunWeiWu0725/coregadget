import { ConfigService } from './../service/config.service';
import { PeriodChooserComponent } from './../modal/period-chooser.component';
import { AlertService } from './../service/alert.service';
import { DebugComponent } from './../modal/debug.component';
import { DSAService, RollCallRecord, SuggestRecord, PeriodConf, AbsenceConf, Schedule, CourseConf, ConfigData } from './../service/dsa.service';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { I18NEXT_SERVICE, ITranslationService } from 'angular-i18next';
import { GadgetService } from '../service/gadget.service';

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
  isTeacherHelper: boolean;

  today: string; // 今日。
  periodConfs: PeriodConf[];
  conf: ConfigData;
  currentLanguage: string;

  constructor(
    private dsa: DSAService,
    private alert: AlertService,
    private dialog: MatDialog,
    private router: Router,
    private config: ConfigService,
    private gadget: GadgetService,
    @Inject(I18NEXT_SERVICE) private i18next: ITranslationService
  ) { }

  async ngOnInit() {
    await this.Init();
    this.currentLanguage = this.i18next.language;
  }

  async Init() {
    
    this.loading = true;
    try {
      //等待是否完成設定值的下載
      await this.config.ready;
      
      this.today = await this.dsa.getToday();
      this.conf = await this.dsa.getSchedule(this.today);
      this.isTeacherHelper = true;

      // const language = this.gadget.getLanguage();
      // console.log(language)
      // if (language.split("-")[0] === "zh") {
      //   this.i18next.changeLanguage("en");
      // }

    } catch (err) {
      // this.alert.json(err);
      this.isTeacherHelper = false;
      this.alert.json(err);
    } finally {
      this.loading = false;
    }
  }

  //開啟學生清單介面
  async openSchedule(schedule: Schedule) {
    
    // 老師點名後學生就不可再作修改
    if(schedule.TeacherChecked == 'false'){
      const md1 = schedule.ClassID ? 'Class' : 'Course';
      const md2 = schedule.ClassID ? schedule.ClassID : schedule.CourseID;
      const md3 = schedule.Period;
      const md4 = schedule.ClassID ? schedule.ClassName : schedule.CourseName;

      this.router.navigate(['/pick', md1, md2, md3, md4]);  
    }
    else{
      this.alert.json(this.i18next.t('teacher-already-called-roll', { defaultValue: '課堂老師已點名，無法再進行點名動作。' }))
    }
    
  }

  //開啟節次點名介面
  async openPicker(course: CourseConf) {
    // console.log(course);
    this.dialog.open(PeriodChooserComponent, {
      data: { course: course, period: this.conf.PeriodConf },
    });
  }

}
