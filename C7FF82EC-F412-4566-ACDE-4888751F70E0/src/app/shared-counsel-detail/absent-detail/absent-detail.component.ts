import { Component, OnInit } from '@angular/core';
import {
  CounselStudentDataService
  , PeriodRecord
  , AbsenceRecord
  , AttendanceRecord
  , DisciplineRecord
  , ExamTemplate } from '../../counsel-student-data.service';
import { CounselDetailComponent } from '../counsel-detail.component';
import { SemesterInfo } from 'src/app/counsel-student.service';

@Component({
  selector: 'app-absent-detail',
  templateUrl: './absent-detail.component.html',
  styleUrls: ['./absent-detail.component.css']
})
export class AbsentDetailComponent implements OnInit {

  isLoading: boolean;
  // 節次對照表
  periodList: PeriodRecord[] = [];
  // 假別對照表
  absenceList: AbsenceRecord[] = [];
  // 學年度學期清單
  ssList: SemesterInfo[] = [];
  // 目前學年度
  curSchoolYear: number;
  // 目前學期
  curSemester: number;
  // 目前學生編號
  studentID: string;
  /**德行資料 */
  // 高中 導師評語
  teacherComment: string;
  /** 缺曠資料 */
  targetAbsenceType = 'all';
  // 學生缺曠資料
  attendanceList: AttendanceRecord[] = [];
  // 以缺曠類別為單位的缺曠清單: key AbsenceType
  mapAttRecByAbsenceType: Map<string, AttendanceRecord[]> = new Map();
  // 缺曠清單
  absenceTypeList: string[] = [];
  // 缺曠資料總數
  totalAttCount = 0;
  /** 獎懲資料 */
  disciplineList: DisciplineRecord[] = [];
  // meritA 清單
  meritAList: DisciplineRecord[] = [];
  // meritB 清單
  meritBList: DisciplineRecord[] = [];
  // meritC 清單
  meritCList: DisciplineRecord[] = [];
  // demeritA 清單
  demeritAList: DisciplineRecord[] = [];
  // demeritB 清單
  demeritBList: DisciplineRecord[] = [];
  // demeritC 清單
  demeritCList: DisciplineRecord[] = [];
  // 大功支數
  meritACount = 0;
  // 小功支數
  meritBCount = 0;
  // 嘉獎支數
  meritCCount = 0;
  // 大過支數
  demeritACount = 0;
  // 小過支數
  demeritBCount = 0;
  // 警告支數
  demeritCCount = 0;
  /** Moral Score */
  // 日常生活表現評量
  examList: ExamTemplate[] = [];
  // 日常生活表現成績
  dailiyLifeScore: any = {};
  // 缺曠非明細資料
  mapStaticAbsence: Map<string, any[]> = new Map();
  periodTypeList: string[] = [];
  // 獎懲非明細資料
  staticDisciplineList: any[] = [];

  constructor(
    private stuDataSrv: CounselStudentDataService,
    private counselDetailComponent: CounselDetailComponent
  ) { }

  async ngOnInit() {
    try {
      this.isLoading = true;
      this.studentID = this.counselDetailComponent.currentStudent.StudentID;
      // 取得學年度學期
      await this.getSSList();
      // 取得節次對照表
      this.periodList = await this.stuDataSrv.getPeriodList();
      // 取得假別對照表
      this.absenceList = await this.stuDataSrv.getAbsenceList();
      // 取得日常生活表現評量設定
      this.examList = await this.stuDataSrv.getDLBehaviorConfig();
      // 取得學生資料
      await this.dataReload(this.curSchoolYear, this.curSemester);
    } catch (error) {
      console.log(error);
    } finally {
      this.isLoading = false;
    }
  }

  /**重新取得資料 */
  async dataReload(schoolYear: number, semester: number) {
    this.curSchoolYear = schoolYear;
    this.curSemester = semester;

    this.totalAttCount = 0;

    this.attendanceList = [];
    this.absenceTypeList = [];
    this.mapAttRecByAbsenceType = new Map();

    this.disciplineList = [];
    this.meritAList = [];
    this.meritBList = [];
    this.meritCList = [];
    this.demeritAList = [];
    this.demeritBList = [];
    this.demeritCList = [];
    this.meritACount = 0;
    this.meritBCount = 0;
    this.meritCCount = 0;
    this.demeritACount = 0;
    this.demeritBCount = 0;
    this.demeritCCount = 0;

    this.teacherComment = '';
    this.dailiyLifeScore = '';
    this.mapStaticAbsence = new Map();
    this.periodTypeList = [];

    const body = `
<Request>
  <StudentID>${this.studentID}</StudentID>
  <SchoolYear>${schoolYear}</SchoolYear>
  <Semester>${semester}</Semester>
</Request>
    `;
    // 1. 取得學生學年度學期缺曠資料
    await this.getAttendance(body);
    // 2. 取得學生學年度學期獎懲資料
    await this.getDiscipline(body);
    // 3. 取得 Moral Score: 德行成績、日常生活表現成績、非明細缺曠獎懲
    await this.getMoralScore(body);
  }

  /**取得有資料的學年度學期 */
  async getSSList() {
    const body = `
<Request>
  <StudentID>${this.studentID}</StudentID>
</Request>
    `;
    this.ssList = await this.stuDataSrv.getSchoolYearSemester(body);

    if (this.ssList.length) {
      this.curSchoolYear = this.ssList[this.ssList.length - 1].SchoolYear;
      this.curSemester = this.ssList[this.ssList.length - 1].Semester;
    }
  }

  /**取得缺曠資料 */
  async getAttendance(body: string) {
    this.attendanceList = await this.stuDataSrv.getAttendance(body);
    // 資料整理
    if (this.attendanceList.length) {
      this.attendanceList.forEach((att: AttendanceRecord) => {
        // 取得目標節次
        const targetPeriod: PeriodRecord = this.periodList.find((per: PeriodRecord) => per.Name === att.Period);
        // mapAttRecByAbsenceType 資料整理
        {
          if (targetPeriod) {
            if (!this.mapAttRecByAbsenceType.has(att.AbsenceType)) {
              this.mapAttRecByAbsenceType.set(att.AbsenceType, [] as AttendanceRecord[]);
              this.absenceTypeList.push(att.AbsenceType);
            }
            this.mapAttRecByAbsenceType.get(att.AbsenceType).push(att);
            this.totalAttCount++;
          }
        }
      });
    }
  }

  /**取得獎懲資料 */
  async getDiscipline(body: string) {
    this.disciplineList = await this.stuDataSrv.getDiscipline(body);

    // 資料整理
    {
      this.disciplineList.forEach((dis: DisciplineRecord) => {
        this.setDisciplineDetail(dis);
        switch (dis.Type) {
          case 'Merit':
            if (dis.MeritA && dis.MeritA > 0) {
              this.meritACount += Number(dis.MeritA);
              this.meritAList.push(dis);
            }
            if (dis.MeritB && dis.MeritB > 0) {
              this.meritBCount += Number(dis.MeritB);
              this.meritBList.push(dis);
            }
            if (dis.MeritC && dis.MeritC > 0) {
              this.meritCCount += Number(dis.MeritC);
              this.meritCList.push(dis);
            }
            break;
          case 'Demerit':
            if (dis.DemeritA && dis.DemeritA > 0) {
              if(dis.DemeritIsClear!=='t'){
              this.demeritACount += Number(dis.DemeritA);
            }
              this.demeritAList.push(dis);
            }
            if (dis.DemeritB && dis.DemeritB > 0) {
              if(dis.DemeritIsClear!=='t'){
              this.demeritBCount += Number(dis.DemeritB);
            }
              this.demeritBList.push(dis);
            }
            if (dis.DemeritC && dis.DemeritC > 0) {
              if(dis.DemeritIsClear!=='t'){
                this.demeritCCount += Number(dis.DemeritC);

              }
              this.demeritCList.push(dis);
            }
            break;
          default:
            break;
        }
      });
    }
  }

  /**取得moral score */
  async getMoralScore(body: string) {
    const rsp = await this.stuDataSrv.getMoralScore(body);

    if (rsp.MoralScore) {
      this.teacherComment = rsp.MoralScore.Comment;
      this.dailiyLifeScore = rsp.MoralScore.DailyLifeScore;
      // 缺曠獎懲非明細 InitialSummary
      // 缺曠非明細
      {
        if (rsp.MoralScore.InitialSummary && rsp.MoralScore.InitialSummary.AttendanceStatistics) {
          [].concat(rsp.MoralScore.InitialSummary.AttendanceStatistics.Absence || []).forEach(ab => {
            if (!this.mapStaticAbsence.has(ab.PeriodType)) {
              this.mapStaticAbsence.set(ab.PeriodType, []);
              this.periodTypeList.push(ab.PeriodType);
            }
            const abList = this.mapStaticAbsence.get(ab.PeriodType);
            abList.push(ab);
          });
        }
      }
      // 獎懲非明細
      {
        if (rsp.MoralScore.InitialSummary && rsp.MoralScore.InitialSummary.DisciplineStatistics) {
          if (rsp.MoralScore.InitialSummary.DisciplineStatistics.Merit) {
            // merit A
            {
              const merit: DisciplineRecord = {} as DisciplineRecord;
              merit.Occurdate = '非明細(無日期)';
              merit.MeritReason = '非明細(無事由)';
              merit.MeritA = rsp.MoralScore.InitialSummary.DisciplineStatistics.Merit.A;
              merit.Detail = `大功：${merit.MeritA}`;
              this.meritACount += Number(merit.MeritA);
              this.meritAList.push(merit);
            }
            // merit B
            {
              const merit: DisciplineRecord = {} as DisciplineRecord;
              merit.Occurdate = '非明細(無日期)';
              merit.MeritReason = '非明細(無事由)';
              merit.MeritB = rsp.MoralScore.InitialSummary.DisciplineStatistics.Merit.B;
              merit.Detail = `小功：${merit.MeritB}`;
              this.meritBCount += Number(merit.MeritB);
              this.meritBList.push(merit);
            }
            // merit C
            {
              const merit: DisciplineRecord = {} as DisciplineRecord;
              merit.Occurdate = '非明細(無日期)';
              merit.MeritReason = '非明細(無事由)';
              merit.MeritC = rsp.MoralScore.InitialSummary.DisciplineStatistics.Merit.C;
              merit.Detail = `嘉獎：${merit.MeritC}`;
              this.meritCCount += Number(merit.MeritC);
              this.meritCList.push(merit);
            }
          }
          if (rsp.MoralScore.InitialSummary.DisciplineStatistics.Demerit) {
            // demerit A
            {
              const demerit: DisciplineRecord = {} as DisciplineRecord;
              demerit.Occurdate = '非明細(無日期)';
              demerit.MeritReason = '非明細(無事由)';
              demerit.DemeritA = rsp.MoralScore.InitialSummary.DisciplineStatistics.Demerit.A;
              demerit.Detail = `大過：${demerit.DemeritA}`;
              this.demeritACount += Number(demerit.DemeritA);
              this.demeritAList.push(demerit);
            }
            // demerit B
            {
              const demerit: DisciplineRecord = {} as DisciplineRecord;
              demerit.Occurdate = '非明細(無日期)';
              demerit.MeritReason = '非明細(無事由)';
              demerit.DemeritB = rsp.MoralScore.InitialSummary.DisciplineStatistics.Demerit.B;
              demerit.Detail = `小過：${demerit.DemeritB}`;
              this.demeritBCount += Number(demerit.DemeritB);
              this.demeritBList.push(demerit);
            }
            // demerit C
            {
              const demerit: DisciplineRecord = {} as DisciplineRecord;
              demerit.Occurdate = '非明細(無日期)';
              demerit.MeritReason = '非明細(無事由)';
              demerit.DemeritC = rsp.MoralScore.InitialSummary.DisciplineStatistics.Demerit.C;
              demerit.Detail = `警告：${demerit.DemeritC}`;
              this.demeritCCount += Number(demerit.DemeritC);
              this.demeritCList.push(demerit);
            }
          }
        }
      }
    }
  }

  /**取得日常生活表現成績 */
  getDailyLifeScore(exam: ExamTemplate, itemName: string): string {
    let result = '';
    if (this.dailiyLifeScore) {
      if (this.dailiyLifeScore[exam.ExamID]) {
        if (exam.HasItems) {
          const score = this.dailiyLifeScore[exam.ExamID].Item.find(item => {
            return item.Name === itemName;
          });
          result = (score ? score.Degree : '');
        } else {
          result = this.dailiyLifeScore[exam.ExamID].Description;
        }
      }
    }
    return result ;
  }

  /**設定目前顯示假別 */
  setTargetAbsenceType(e: any, type: string) {
    this.targetAbsenceType = type;
    e.preventDefault();
    e.stopPropagation();
  }

  /**取得目標缺曠別發生日期清單 */
  getTargetOccurDateList(absence: string): string[] {
    let dateList = [];

    if (absence === 'all') {
      dateList = this.attendanceList.map((att: AttendanceRecord) => att.OccurDate);
    } else {
      const targetList = this.attendanceList.filter((att: AttendanceRecord) => att.AbsenceType === absence);
      dateList = targetList.map((att: AttendanceRecord) => att.OccurDate);
    }
    // 資料 Distinct
    dateList = dateList.filter((value, index, self) => self.indexOf(value) === index);

    return dateList;
  }

  /**
   * 1. 根據缺曠、日期、節次 取得缺曠資料
   * 2. 缺曠別轉換成縮寫
   */
  getAbsence(absence: string, date: string, period: string): string {
    let ab = '';
    let result = '';

    if (absence === 'all') {
      const attRec = this.attendanceList.find((att: AttendanceRecord) =>
        att.OccurDate === date && att.Period === period
      );
      if (attRec) {
        result = attRec.AbsenceType;
      }
    } else {
      const attRec = this.attendanceList.find((att: AttendanceRecord) =>
        att.AbsenceType === absence && att.OccurDate === date && att.Period === period
      );
      if (attRec) {
        result = attRec.AbsenceType;
      }
    }

    // 缺曠別轉換 => 轉換成縮寫
    if (result) {
      ab = this.absenceList.find((a: AbsenceRecord) => a.Name === result).Abbr;
    }

    return ab;
  }

  /**取得該缺曠別紀錄數 */
  getAttCountByAbsence(absence: string): string {
    let result = '';
    if (this.mapAttRecByAbsenceType.has(absence)) {
      result = '' + this.mapAttRecByAbsenceType.get(absence).length;
    }
    return result;
  }

  /**設定獎懲資訊 畫面呈現用 */
  setDisciplineDetail(dis: DisciplineRecord) {
    dis.Detail = '';
    if (dis.Type === 'Merit') {
      if (dis.MeritA && dis.MeritA > 0) {
        dis.Detail += `大功：${dis.MeritA}`;
      }
      if (dis.MeritB && dis.MeritB > 0) {
        dis.Detail += `小功：${dis.MeritB}`;
      }
      if (dis.MeritC && dis.MeritC > 0) {
        dis.Detail += `嘉獎：${dis.MeritC}`;
      }
    }
    if (dis.Type === 'Demerit') {
      if (dis.DemeritA && dis.DemeritA > 0) {
        dis.Detail += `大過：${dis.DemeritA}`;
      }
      if (dis.DemeritB && dis.DemeritB > 0) {
        dis.Detail += `小過：${dis.DemeritB}`;
      }
      if (dis.DemeritC && dis.DemeritC > 0) {
        dis.Detail += `警告：${dis.DemeritC}`;
      }
    }
  }

  /**取得非明細缺曠支數 */
  getStaticAbsenceCount(key: string): number {
    let total = 0;
    this.mapStaticAbsence.get(key).forEach(absence => {
      total += Number(absence.Count);
    });

    return total;
  }

}
