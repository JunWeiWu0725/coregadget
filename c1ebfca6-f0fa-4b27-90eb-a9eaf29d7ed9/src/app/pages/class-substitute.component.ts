import { Component, OnInit, Inject } from '@angular/core';
import { DSAService, GradeClassRecords, ClassRecord, PeriodConf } from '../service/dsa.service';
import { AlertService } from '../service/alert.service';
import { ConfigService } from '../service/config.service';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { I18NEXT_SERVICE, ITranslationService } from 'angular-i18next';
const ClassTutor = '班導師';

@Component({
  selector: 'gd-class-substitute',
  templateUrl: './class-substitute.component.html',
  styles: []
})
export class ClassSubstituteComponent implements OnInit {

  loading: boolean;
  today: string; // 今日。

  Periods: PeriodConf[];
  gradeYeares: GradeClassRecords[];

  selectedPeriod: PeriodConf;

  constructor(
    private dsa: DSAService,
    private alert: AlertService,
    private config: ConfigService,
    private router: Router,
    @Inject(I18NEXT_SERVICE) private i18next: ITranslationService
  ) { }

  async ngOnInit() {
    this.today = this.dsa.getSelectedDay(); //await this.dsa.getToday();

    const conf = await this.dsa.getSchedule(this.today);
    this.Periods = conf.PeriodConf.filter(p => p.Actor === ClassTutor);

    // this.selectedPeriod = this.getNear(this.Periods);

    this.Init();
  }

  async Init() {
    this.loading = true;
    try {
      await this.config.ready;

      this.gradeYeares = await this.dsa.getAllClass();

    } catch (error) {
      this.alert.json(error);
    } finally {
      this.loading = false;
    }
  }

  //開啟課程選擇清單
  openClass(oClass: ClassRecord) {
    if(!this.selectedPeriod) {
      const message = this.i18next.t('select-session-for-roll-call', { defaultValue: '請選擇要點名的節次。' });
      this.alert.snack(message, 5000);
    } else {
      //this.router.navigate([`/pick/${this.today}/Class/${oClass.ClassID}/${this.selectedPeriod.Name}/${oClass.ClassName}`]);
      this.router.navigate([
        '../pick', 
        this.today,
        "Class",
        oClass.ClassID, 
        this.selectedPeriod.Name,
        oClass.ClassName
      ]);
    }
  }

  getNear(periods: PeriodConf[]) {

    if(periods.length <= 0 ) {
      return null;
    }

    // 計算離現在時間有多久。
    for (const period of this.Periods) {
      const s = moment(new Date(+(period.StartTime || period.EndTime)));
      period.diffFromNow = s.diff(new Date(), 'm');

      // 時間還沒到的節次不會被選擇為預設。
      period.diffFromNow = period.diffFromNow > 0 ? -9999 : period.diffFromNow;
    }

    // 排序後取得最近的。
    let nearest = [...this.Periods].sort((x,y) => {
      return y.diffFromNow - x.diffFromNow;
    })[0];

    return nearest;
  }
}
