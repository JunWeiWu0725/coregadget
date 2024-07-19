import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StudentPickComponent } from './attendance/attendance/student-pick.component';
import { SubstituteComponent } from './attendance/substitute/substitute.component';
import { CourseSelcComponent } from './attendance/substitute/course-selc.component';
const routes: Routes = [
  { path: '', loadChildren: './home/home.module#HomeModule' },
  { path: 'behavior', loadChildren: './behavior/behavior.module#BehaviorModule' },
  { path: 'weekly_report', loadChildren: './weekly-report/weekly-report.module#WeeklyReportModule' },
  { path: 'attendance', loadChildren: './attendance/attendance.module#AttendanceModule' },
  { path: 'gradebook', loadChildren: './gradebook/gradebook.module#GradebookModule' },
  { path: 'sub' , component: SubstituteComponent},
  { path: 'course' , component: CourseSelcComponent}
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
