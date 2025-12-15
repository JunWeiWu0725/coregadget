import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TextareaAutosizeModule } from 'ngx-textarea-autosize';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { AppComponent } from './app.component';
import { CounselStatisticsComponent } from './counsel-statistics/counsel-statistics.component';
import { CounselListComponent } from './counsel/counsel-list/counsel-list.component';
import { InterviewStatisticsComponent } from './interview-statistics/interview-statistics.component';
import { AppRoutingModule } from './app-routing.module';
import { CounselComponent } from './counsel/counsel.component';
import { CounselRoutingComponent } from './counsel/counsel-routing/counsel-routing.component';
import { MatDialogModule } from '@angular/material';
import { RenderModule } from './render';
import { AdminComponent } from './admin/admin.component';
import { CounselTeacherRoleComponent } from './admin/counsel-teacher-role/counsel-teacher-role.component';
import { AdminRoutingComponent } from './admin/admin-routing/admin-routing.component';
import { CounselClassComponent } from './admin/counsel-class/counsel-class.component';

import { ComprehensiveComponent } from "./comprehensive/comprehensive.component";
// tslint:disable-next-line: max-line-length
import { ComprehensiveRoutingComponent } from './comprehensive/comprehensive-routing/comprehensive-routing.component';
import { ComprehensiveSectionComponent } from './comprehensive/comprehensive-section/comprehensive-section.component';
import { SimplePageComponent } from './simple-page/simple-page.component';
import { CounselDocComponent } from './simple-page/print/counsel-doc/counsel-doc.component';
import { CounselDocEditorComponent } from './simple-page/editor/counsel-doc-editor/counsel-doc-editor.component';
import { ComprehensiveEditorComponent } from './simple-page/editor/comprehensive-editor/comprehensive-editor.component';
import { PsychologicalTestComponent } from './psychological-test/psychological-test.component';

import { AddCounselTeacherModalComponent } from './admin/counsel-class/add-counsel-teacher-modal/add-counsel-teacher-modal.component';
// tslint:disable-next-line: max-line-length
import { AddCounselTeacherRoleModalComponent } from './admin/counsel-teacher-role/add-counsel-teacher-role-modal/add-counsel-teacher-role-modal.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';

// tslint:disable-next-line: max-line-length
import { DelCounselTeacherRoleModalComponent } from './admin/counsel-teacher-role/del-counsel-teacher-role-modal/del-counsel-teacher-role-modal.component';
import { ComprehensiveFillComponent } from './simple-page/comprehensive-fill/comprehensive-fill.component';
import { ComprehensiveClassViewComponent } from './comprehensive/comprehensive-class-view/comprehensive-class-view.component';

import { ImportQuizDataComponent } from './psychological-test/import-quiz-data/import-quiz-data.component';
import { StudentQuizDataComponent } from './psychological-test/student-quiz-data/student-quiz-data.component';
import { PsychologicalTestRoutingComponent } from './psychological-test/psychological-test-routing/psychological-test-routing.component';
import { PsychologicalTestListComponent } from './psychological-test/psychological-test-list/psychological-test-list.component';
import { ComprehensiveStatisticsComponent } from './comprehensive/comprehensive-statistics/comprehensive-statistics.component';
import { PsychologicalQuizSetupComponent } from './admin/psychological-quiz-setup/psychological-quiz-setup.component';
import { ComprehensiveComponent as AdminComprehensiveComponent   } from './admin/comprehensive/comprehensive.component';
// tslint:disable-next-line: max-line-length
import { AddPsychologicalQuizDataComponent } from './admin/psychological-quiz-setup/add-psychological-quiz-data/add-psychological-quiz-data.component';
// tslint:disable-next-line: max-line-length
import { DelPsychologicalQuizDataComponent } from './admin/psychological-quiz-setup/del-psychological-quiz-data/del-psychological-quiz-data.component';
// tslint:disable-next-line: max-line-length
import { CounselHistoryComponent } from './simple-page/print/counsel-history/counsel-history.component';
import { GenerateKeyAndSetTimeComponent } from './comprehensive/generate-key-and-set-time/generate-key-and-set-time.component';
import { GovStatisticsMonthlyComponent } from './counsel-statistics/reports/gov-statistics-monthly/gov-statistics-monthly.component';
import { CounselInterviewReportComponent } from './counsel-statistics/reports/counsel-interview-report/counsel-interview-report.component';
import { CaseInterviewReportComponent } from './counsel-statistics/reports/case-interview-report/case-interview-report.component';
import { ReferralReportComponent } from './counsel-statistics/reports/referral-report/referral-report.component';
// tslint:disable-next-line: max-line-length
import { HRCounselInterviewCountComponent } from './counsel-statistics/reports/hrcounsel-interview-count/hrcounsel-interview-count.component';
import { GroupAnalysisReportComponent } from './counsel-statistics/reports/group-analysis-report/group-analysis-report.component';
import { HttpClientModule } from '@angular/common/http';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { MatProgressBarModule } from '@angular/material/progress-bar';
// tslint:disable-next-line: max-line-length
import { ComprehensiveDataExportComponent } from './counsel-statistics/reports/comprehensive-data-export/comprehensive-data-export.component';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SharedModule } from './shared/shared.module';
import { CaseModule } from './case/case.module';
import { BatchCounselDocComponentComponent } from './counsel-statistics/reports/batch-counsel-doc-component/batch-counsel-doc-component.component';
import { CounselDoc2BatComponent } from './counsel-statistics/reports/counsel-doc2-bat/counsel-doc2-bat.component';
import { CounselInterviewDocComponent } from './simple-page/print/counsel-interview-doc/counsel-interview-doc.component';
import { CounselDoc2BaseComponent } from './counsel-statistics/reports/counsel-doc2-base/counsel-doc2-base.component';
import { WorkServiceComponent } from './work-service/work-service.component';
import { NewWorkModalComponent } from './work-service/new-work-modal/new-work-modal.component';
import { ConditionModalComponent } from './counsel-statistics/reports/case-interview-report/condition-modal/condition-modal.component';
// import { AddReferralFormComponent } from './shared-counsel-detail/interview-detail/add-referral-form/add-referral-form.component';
import {MatBadgeModule} from '@angular/material/badge';
import { AddInterviewModalComponent, SharedCounselDetailModule } from './shared-counsel-detail';
import { MatSnackBarModule} from '@angular/material/snack-bar';
import { TeacherServiceComponent } from './teacher-service/teacher-service.component';
// import { AddServiceModalComponent } from './teacher-service/add-service-modal/add-service-modal.component';
import { DelServiceModalComponent } from './teacher-service/del-service-modal/del-service-modal.component';
import { DSUtilNgModule } from './dsutil-ng/dsutil-ng.module';
import { CounselHistoryPsychologicaltestComponent } from './simple-page/print/counsel-history-psychologicaltest/counsel-history-psychologicaltest.component';import { CounselInterviewListComponent } from './simple-page/print/counsel-interview-list/counsel-interview-list.component';
import { ServiceItemStatisticsComponent } from './service-item-statistics/service-item-statistics.component';
import { ServiceItemsStatisticsComponent } from './counsel-statistics/reports/service-items-statistics/service-items-statistics.component';
import { StudentInfoComponent } from './comprehensive/student-info/student-info.component';
import { FilterChineseNumbersPipe } from './filter-chinese-numbers.pipe';
import { SettingComponent } from './admin/setting/setting.component';
import { RoleService } from './role.service';
import { appInitializerFactory } from './app-initializer';
import { ImportModalComponent } from './counsel/import-modal/import-modal.component';
import { ChartModalComponent } from './counsel-statistics/reports/counsel-interview-report/chart-modal/chart-modal.component';
import { FormsModule } from '@angular/forms';
import { OverviewPermissionComponent } from './admin/overview-permission/overview-permission.component';
import { AddPermissionUserModalComponent } from './admin/overview-permission/add-permission-user-modal/add-permission-user-modal.component';
import { ImportMappingModalComponent } from './counsel/import-mapping-modal/import-mapping-modal.component';


@NgModule({
  declarations: [
    FilterChineseNumbersPipe,
    AppComponent,
    CounselStatisticsComponent,
    CounselListComponent,
    InterviewStatisticsComponent,
    CounselComponent,
    CounselRoutingComponent,
    AdminComponent,
    CounselTeacherRoleComponent,
    AdminRoutingComponent,
    CounselClassComponent,
    ComprehensiveComponent,
    ComprehensiveRoutingComponent,
    ComprehensiveSectionComponent,
    SimplePageComponent,
    CounselDocComponent,
    CounselDocEditorComponent,
    ComprehensiveEditorComponent,
    PsychologicalTestComponent,
    AddCounselTeacherModalComponent,
    AddCounselTeacherRoleModalComponent,
    DelCounselTeacherRoleModalComponent,
    ComprehensiveFillComponent,
    ComprehensiveClassViewComponent,
    ImportQuizDataComponent,
    StudentQuizDataComponent,
    PsychologicalTestRoutingComponent,
    PsychologicalTestListComponent,
    ComprehensiveStatisticsComponent,
    PsychologicalQuizSetupComponent,
    AdminComprehensiveComponent,
    AddPsychologicalQuizDataComponent,
    DelPsychologicalQuizDataComponent,
    CounselHistoryComponent,
    GenerateKeyAndSetTimeComponent,
    GovStatisticsMonthlyComponent,
    CounselInterviewReportComponent,
    CaseInterviewReportComponent,
    ReferralReportComponent,
    HRCounselInterviewCountComponent,
    GroupAnalysisReportComponent,
    ComprehensiveDataExportComponent,
    BatchCounselDocComponentComponent,
    CounselDoc2BatComponent,
    CounselInterviewDocComponent,
    CounselDoc2BaseComponent,
    WorkServiceComponent,
    NewWorkModalComponent,
    ConditionModalComponent,
    TeacherServiceComponent,
    // AddServiceModalComponent,
    DelServiceModalComponent,
    CounselInterviewListComponent,
    CounselHistoryPsychologicaltestComponent,
    ServiceItemStatisticsComponent,
    ServiceItemsStatisticsComponent,
    StudentInfoComponent,
    FilterChineseNumbersPipe,
    SettingComponent,
    ImportModalComponent,
    ChartModalComponent,
    OverviewPermissionComponent,
    AddPermissionUserModalComponent,
    ImportMappingModalComponent,
    // AddReferralFormComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatDialogModule,
    MatAutocompleteModule,
    BrowserAnimationsModule,
    RenderModule,
    TextareaAutosizeModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    DragDropModule,
    HttpClientModule,
    OverlayModule,
    PortalModule,
    MatProgressBarModule,
    MatTreeModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule,
    MatDividerModule,
    MatListModule,
    MatTabsModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    SharedModule,
    CaseModule,
    MatBadgeModule,
    SharedCounselDetailModule,
    MatSnackBarModule,
    //  AddInterviewModalComponent
    DSUtilNgModule, // DSA 自定連線。
    FormsModule,
    MatIconModule
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFactory,
      deps: [RoleService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]

})
export class AppModule {
}
