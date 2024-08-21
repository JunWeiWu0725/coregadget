import { AlertService } from './service/alert.service';
import { AppMaterialModule } from './app-material.module';
import { AppRoutingModule } from './app-routing.module';
import { GadgetService } from './service/gadget.service';
import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, LOCALE_ID, NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { DSAService } from './service/dsa.service';
import { ConfigService } from './service/config.service';
import { MainComponent } from './pages/main.component';
import { PeriodChooserComponent } from './modal/period-chooser.component';
import { StudentPickComponent } from './pages/student-pick.component';
import { DebugComponent } from './modal/debug.component';
import { MAT_DIALOG_DEFAULT_OPTIONS, MatDialogModule } from '@angular/material/dialog';
import { WaitingComponent } from './modal/waiting.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { SubstituteComponent } from './pages/substitute.component';
import { CourseSelcComponent } from './pages/course-selc.component';
import { TeacherHelperComponent } from './pages/teacher-helper.component';
import { SettingComponent } from './pages/setting.component';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import {MatRadioModule} from '@angular/material/radio';
import { ClassSubstituteComponent } from './pages/class-substitute.component';
import { HttpClientModule } from '@angular/common/http';
import { I18NEXT_SERVICE, I18NextModule, ITranslationService } from 'angular-i18next';
import i18nextXHRBackend from 'i18next-xhr-backend';

export function appInit(i18next: ITranslationService) {
  return () => i18next
    .use(i18nextXHRBackend)
    .init({
      whitelist: ['en', 'zh-TW'],
      fallbackLng: 'zh-TW',
      debug: false,
      returnEmptyString: false,
      ns: ['translation', 'validation', 'error'],
      backend: {
        loadPath: './assets/locales/{{lng}}.json'
      },
    });
 }
 
 export function localeIdFactory(i18next: ITranslationService) {
  return i18next.language;
 }
 
 export const I18N_PROVIDERS = [
  {
    provide: APP_INITIALIZER,
    useFactory: appInit,
    deps: [I18NEXT_SERVICE],
    multi: true
  },
  {
    provide: LOCALE_ID,
    deps: [I18NEXT_SERVICE],
    useFactory: localeIdFactory
 }
];

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    PeriodChooserComponent,
    StudentPickComponent,
    DebugComponent,
    WaitingComponent,
    SubstituteComponent,
    CourseSelcComponent,
    TeacherHelperComponent,
    SettingComponent,
    ClassSubstituteComponent,
   
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppMaterialModule,
    AppRoutingModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatIconModule,
    MatCheckboxModule,
    FormsModule,
    MatRadioModule,
    HttpClientModule,
    I18NextModule.forRoot()
  ],
  providers: [GadgetService, DSAService, ConfigService, AlertService, I18N_PROVIDERS],
  bootstrap: [AppComponent],
  entryComponents: [
    PeriodChooserComponent,
    DebugComponent,
    WaitingComponent
  ]
})
export class AppModule { }
