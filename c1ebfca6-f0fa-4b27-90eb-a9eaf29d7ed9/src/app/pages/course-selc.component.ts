import { Component, OnInit } from '@angular/core';
import { CourseObj, ClassObj, DSAService, CourseConf } from '../service/dsa.service';
import { ActivatedRoute } from '@angular/router';
import { DataCacheService } from '../service/data-cache.service';
import { MatDialog } from '@angular/material';
import { PeriodChooserComponent } from '../modal/period-chooser.component';

@Component({
  selector: 'gd-course-selc',
  templateUrl: './course-selc.component.html',
  styles: []
})
export class CourseSelcComponent implements OnInit {

  jClass: ClassObj; // 課程或班級。
  className: string;
  today: string;

  constructor(
    private dsa: DSAService,
    private route: ActivatedRoute,
    private cache: DataCacheService,
    private dialog: MatDialog) {

    //所選的班級
    this.jClass = cache.selectedClass;
    this.className = this.jClass.ClassName;
  }

  async ngOnInit() {
    this.today = await this.dsa.getSelectedDay();
    console.log({
      curr_day: this.today
    })
  }

  //開啟節次點名介面
  async openPicker(course: CourseConf) {
    this.dialog.open(PeriodChooserComponent, {
      data: { 
        curr_day : this.today  ,
         course: course },
    });
  }
}
