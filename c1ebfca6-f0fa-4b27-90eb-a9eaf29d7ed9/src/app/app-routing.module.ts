import { StudentPickComponent } from './pages/student-pick.component';
import { MainComponent } from './pages/main.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SubstituteComponent } from './pages/substitute.component';
import { CourseSelcComponent } from './pages/course-selc.component';
import { TeacherHelperComponent } from './pages/teacher-helper.component';
import { SettingComponent } from "./pages/setting.component";
import { ClassSubstituteComponent } from './pages/class-substitute.component';

const routes: Routes = [
    { path: '', redirectTo: 'main', pathMatch: 'full' },
    { path: 'main', component: MainComponent },
    { path: 'pick/:curr_day/:type/:id/:period/:name', component: StudentPickComponent },
    { path: 'sub', component: SubstituteComponent },
    { path: 'class', component: ClassSubstituteComponent },
    { path: 'course', component: CourseSelcComponent },
    { path: 'teacher-helper/:curr_day/:type/:id', component: TeacherHelperComponent},
    { path: 'setting', component: SettingComponent }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {
        useHash: true
    })],
    exports: [
        RouterModule
    ]
})
export class AppRoutingModule { }
