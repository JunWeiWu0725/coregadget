import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CounselStatisticsComponent } from './counsel-statistics.component';
import { HRCounselInterviewCountComponent } from './reports/hrcounsel-interview-count/hrcounsel-interview-count.component';
import { ChartModalComponent } from './reports/counsel-interview-report/chart-modal/chart-modal.component';

@NgModule({
  declarations: [
    CounselStatisticsComponent,
    HRCounselInterviewCountComponent,
    ChartModalComponent
  ],
  imports: [
    CommonModule
  ]
})
export class CounselStatisticsModule { } 