import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { ConfigService, PeriodConf } from './../service/config.service';
import { DSAService, RollCallRecord, CourseConf } from './../service/dsa.service';
import { Component, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'gd-period-chooser',
  templateUrl: './period-chooser.component.html',
  styleUrls: ['../common.css'],
  encapsulation: ViewEncapsulation.None
})
export class PeriodChooserComponent implements OnInit {

  title;

  periods: PeriodConf[];

  constructor(
    private router: Router,
    private config: ConfigService,
    public dialogRef: MatDialogRef<PeriodChooserComponent>,
    @Inject(MAT_DIALOG_DATA) private data: {curr_day:string, course: CourseConf }
  ) {

    this.title = data.course.CourseName;

    dialogRef.updateSize('650px');
  }

  async ngOnInit() {
    await this.config.ready;
    this.periods = this.config.getPeriods();
  }

  gotoPick(period) {
    //Type 傳入是課程還是班級
    //CourseName
    //PeriodName
    console.log({
      currday: this.data.curr_day,
      courseID: this.data.course.CourseID,
      periodName: period.Name,
      courseName: this.data.course.CourseName

    });



    this.router.navigate([
      '../pick', 
      this.data.curr_day,
      "Course",
      this.data.course.CourseID, 
      period.Name,
      this.data.course.CourseName
    ]);
    this.dialogRef.close();
  }

  // 該節是否可以點名。
  allow_choose(period: PeriodConf) {
    if(period.Actor == '班導師'){
      return true;
    }
    else{
      if (period.Absence) {
        return period.Absence.length <= 0
      } else {
        return 0;
      }
    }
  }
}
