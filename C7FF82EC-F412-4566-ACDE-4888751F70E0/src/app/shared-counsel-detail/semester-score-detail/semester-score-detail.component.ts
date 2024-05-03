import { Component, OnInit, Optional } from '@angular/core';
import { CounselDetailComponent } from "../counsel-detail.component";
import { DsaService } from "../../dsa.service";
import { CounselStudentService } from "../../counsel-student.service";
import { SemesterInfo, DomainScoreInfo, SubjectScoreInfo, StudentSemesterScoreInfo, SubjectScoreInfoSH } from "./semester-score-vo";

@Component({
  selector: 'app-semester-score-detail',
  templateUrl: './semester-score-detail.component.html',
  styleUrls: ['./semester-score-detail.component.css']
})
export class SemesterScoreDetailComponent implements OnInit {

  // 選的學年度學期
  selectSchoolYearSemester: SemesterInfo = new SemesterInfo();

  // 及格標準
  passScore: number = 60;

  isLoading = false;

  // 學校型態 JHHC(新竹國中小),JHKH(高雄國中小),SH(高中)
  selectSchoolType: string = "SH";

  semesterList: SemesterInfo[] = [];

  // 學期成績來源資料
  semesterScoreSource: any[] = [];
  serviceSchoolCoreInfo: string = "GetSchoolCoreInfo";
  serviceGetSemesterScore: string = "";

  studentSemesterScore: StudentSemesterScoreInfo = new StudentSemesterScoreInfo();

  constructor(private counselStudentService: CounselStudentService,
    private dsaService: DsaService,
    @Optional() private counselDetailComponent: CounselDetailComponent) { }

  ngOnInit() {
    this.counselDetailComponent.setCurrentItem('semester_score');
    this.GetSchoolCoreInfo();
  } 

  // 取得學制
  async GetSchoolCoreInfo() {
    this.isLoading = true;
    let resp = await this.dsaService.send(this.serviceSchoolCoreInfo, {});

    let SchoolCoreInfo = [].concat(resp.SchoolCoreInfo || []);
    SchoolCoreInfo.forEach(item => {
      if (item.成績核心 === '高中一般') {
        this.selectSchoolType = 'SH';
      } else if (item.成績核心 === '國中高雄') {
        this.selectSchoolType = 'JHKH';
      } else {
        this.selectSchoolType = 'JHHC';
      }
    });
    this.loadData();
  }

  async loadData() {

    if (this.selectSchoolType === 'JHHC' || this.selectSchoolType === 'JHKH') {
      // 新竹版國中小評量成績
      this.serviceGetSemesterScore = "GetSemesterScoreJHHC";
      await this.GetSemesterScore();
    }

    // 高中
    if (this.selectSchoolType === 'SH') {
      this.serviceGetSemesterScore = 'GetSemesterScoreSH';
      await this.GetSemesterScoreSH();
    }

    // // 取得預設學年度學期
    // this.selectSchoolYearSemester.SchoolYear = this.counselDetailComponent.counselStudentService.currentSchoolYear
    // this.selectSchoolYearSemester.Semester = this.counselDetailComponent.counselStudentService.currentSemester;

  }


  // 取得高中學期成績
  async GetSemesterScoreSH() {
    this.semesterList = [];
    let tmpSems: string[] = [];

    try {
      let resp = await this.dsaService.send(this.serviceGetSemesterScore, {
        Request: {
          StudentID: this.counselDetailComponent.currentStudent.StudentID
        }
      });

      this.semesterScoreSource = [].concat(resp.SemesterScore || []);
      this.semesterScoreSource.forEach(semsScore => {
        if (semsScore.SubjectScore) {
          semsScore.SubjectScore.forEach(subjScore => {
            let ss = subjScore.school_year + subjScore.semester;
            if (!tmpSems.includes(ss)) {
              let semsInfo: SemesterInfo = new SemesterInfo();
              semsInfo.SchoolYear = parseInt(subjScore.school_year);
              semsInfo.Semester = parseInt(subjScore.semester);
              this.semesterList.push(semsInfo);
              tmpSems.push(ss);
            }
          });
        }
      });

      if (this.semesterList.length > 0) {
        let hasValue = false;
        this.semesterList.forEach(ss => {
          if (ss.SchoolYear === this.counselDetailComponent.currentStudent.SchoolYear && ss.Semester === this.counselDetailComponent.currentStudent.Semester)
            hasValue = true;
        });

        if (!hasValue)
          this.selectSchoolYearSemester = this.semesterList[0];
      }

      try
      {
        this.parseScoreSH();

      }catch(err){

     
      }
    } catch (err) {
      alert('無法取得高中學期成績：' + err.dsaError);
    }
  }

  // 處理高中學期成績
  parseScoreSH() {

    this.studentSemesterScore = new StudentSemesterScoreInfo();

    this.semesterScoreSource.forEach(semsScore => {
      if (semsScore.EntryScore) {
        [].concat(semsScore.EntryScore||[]).forEach(entryScore => {
          // 學期分項成績
          if (this.selectSchoolYearSemester.SchoolYear == entryScore.school_year && this.selectSchoolYearSemester.Semester == entryScore.semester) {
            if (entryScore.學業成績)
              this.studentSemesterScore.EntryLearnScore = parseFloat(entryScore.學業成績);
            if (entryScore.實習成績)
              this.studentSemesterScore.EntryPracticeScore = parseFloat(entryScore.實習成績);
          }
        });
      }
    });

    this.semesterScoreSource.forEach(semsScore => {
      if (semsScore.SubjectScore) {
        semsScore.SubjectScore.forEach(subjectScore => {
          // 學期科目成績
          if (this.selectSchoolYearSemester.SchoolYear == subjectScore.school_year && this.selectSchoolYearSemester.Semester == subjectScore.semester) {
            let subjScore: SubjectScoreInfoSH = new SubjectScoreInfoSH();
            if (subjectScore.分項類別)
              subjScore.Entry = subjectScore.分項類別;

            if (subjectScore.科目)
              subjScore.Subject = subjectScore.科目;

            if (subjectScore.科目級別)
              subjScore.Level = subjectScore.科目級別;

            if (subjectScore.學分數)
              subjScore.Credit = parseFloat(subjectScore.學分數);

            subjScore.isPass = false;
            if (subjectScore.取得學分) {
              if (subjectScore.取得學分 === '是')
                subjScore.isPass = true;
            }

            subjScore.isRequired = false;
            if (subjectScore.必選修) {
              if (subjectScore.必選修 === '必修')
                subjScore.isRequired = true;
            }

            if (subjectScore.校部訂) {
              if (subjectScore.校部訂 === '校訂') {
                subjScore.SubjectType = '校訂';
              }

              if (subjectScore.校部訂 === '部訂' || subjectScore.校部訂 === '部定') {
                subjScore.SubjectType = '部定';
              }
            }

            // 即時判斷取得成績
            let score: number;

            subjScore.isReScore = false;
            // 判斷有手動調整成績，成績以手動為主要，不然就是取所有最大
            if (subjectScore.手動調整成績) {

              subjScore.Score = parseFloat(subjectScore.手動調整成績);
            } else {
              if (subjectScore.原始成績)
                score = parseFloat(subjectScore.原始成績);

              if (subjectScore.重修成績) {
                let s1 = parseFloat(subjectScore.重修成績);
                if (s1 > score)
                  score = s1;
              }

              if (subjectScore.學年調整成績) {
                let s2 = parseFloat(subjectScore.學年調整成績);
                if (s2 > score)
                  score = s2;
              }

              if (subjectScore.補考成績) {
                let s3 = parseFloat(subjectScore.補考成績);
                if (s3 >= score) {
                  score = s3;
                  subjScore.isReScore = true;
                }
              }
              // 最高分數
              subjScore.Score = score;
            }

            subjScore.isNotCalc = false;
            if (subjectScore.不需評分) {
              if (subjectScore.不需評分 === '是')
                subjScore.isNotCalc = true;
            }

            this.studentSemesterScore.SubjectScoreScoreListSH.push(subjScore);
          }
        });
      }
    });

    this.studentSemesterScore.CalcCredits();
    this.SetSubjectScoreDisplaySH('必修');
    this.isLoading = false;
  }

  // 設定學期科目選項顯示
  SetSubjectScoreDisplaySH(group: string) {
    // 初始化
    this.studentSemesterScore.SubjectScoreScoreListSH.forEach(item => {
      item.isDisplay = false;
    });

    if (group === '必修') {
      this.studentSemesterScore.SubjectScoreScoreListSH.forEach(item => {
        if (item.isRequired)
          item.isDisplay = true;
      });

    }
    if (group === '選修') {
      this.studentSemesterScore.SubjectScoreScoreListSH.forEach(item => {
        if (!item.isRequired)
          item.isDisplay = true;
      });
    }
    if (group === '部定必修') {
      this.studentSemesterScore.SubjectScoreScoreListSH.forEach(item => {
        if (item.isRequired && item.SubjectType === '部定')
          item.isDisplay = true;
      });
    }
    if (group === '校訂必修') {
      this.studentSemesterScore.SubjectScoreScoreListSH.forEach(item => {
        if (item.isRequired && item.SubjectType === '校訂')
          item.isDisplay = true;
      });
    }
    if (group === '校訂選修') {
      this.studentSemesterScore.SubjectScoreScoreListSH.forEach(item => {
        if (item.isRequired === false && item.SubjectType === '校訂')
          item.isDisplay = true;
      });
    }
    if (group === '實習') {
      this.studentSemesterScore.SubjectScoreScoreListSH.forEach(item => {
        if (item.Entry === '實習科目')
          item.isDisplay = true;
      });
    }

  }

  // 取得學期成績
  async GetSemesterScore() {
    this.semesterList = [];
    let tmpSems: string[] = [];


    try {
      let resp = await this.dsaService.send(this.serviceGetSemesterScore, {
        Request: {
          StudentID: this.counselDetailComponent.currentStudent.StudentID
        }
      });

      this.semesterScoreSource = [].concat(resp.SemesterScore || []);

      this.semesterScoreSource.forEach(semsScore => {

        if (semsScore.AverageScore) {
          semsScore.AverageScore = [].concat(semsScore.AverageScore || []);
          semsScore.AverageScore.forEach(avgScore => {
            let ss = avgScore.SchoolYear + avgScore.Semester;
            if (!tmpSems.includes(ss)) {
              let semsInfo: SemesterInfo = new SemesterInfo();
              semsInfo.SchoolYear = parseInt(avgScore.SchoolYear);
              semsInfo.Semester = parseInt(avgScore.Semester);
              this.semesterList.push(semsInfo);
              tmpSems.push(ss);
            }
          });
        }
      });

      if (this.semesterList.length > 0) {
        let hasValue = false;
        this.semesterList.forEach(ss => {
          if (ss.SchoolYear === this.counselDetailComponent.currentStudent.SchoolYear && ss.Semester === this.counselDetailComponent.currentStudent.Semester)
            hasValue = true;
        });

        if (!hasValue)
          this.selectSchoolYearSemester = this.semesterList[0];
      }

      this.parseScore();
    } catch (err) {
      alert('無法取得學期成績：' + err.dsaError.message);
    }
  }

  SetSelectSemester(item: SemesterInfo) {
    this.selectSchoolYearSemester = item;
    if (this.selectSchoolType === 'SH') {
      // 高中
      this.parseScoreSH();

    } else {
      // 國中
      this.parseScore();
    }
  }

  parseScore() {
    this.studentSemesterScore = new StudentSemesterScoreInfo();

    this.semesterScoreSource.forEach(semsScore => {
      // 學期平均
      if (semsScore.AverageScore) {
        semsScore.AverageScore.forEach(avgScore => {
          if (avgScore.SchoolYear == this.selectSchoolYearSemester.SchoolYear && avgScore.Semester == this.selectSchoolYearSemester.Semester) {
            this.studentSemesterScore.LearnDomainScore = parseFloat(avgScore.LearnDomainScore);
            this.studentSemesterScore.CourseLearnScore = parseFloat(avgScore.CourseLearnScore);

          }
        });
      }
    });

    this.semesterScoreSource.forEach(semsScore => {
      // 領域成績
      if (semsScore.DomainScore) {
        semsScore.DomainScore.forEach(domainScore => {
          if (domainScore.SchoolYear == this.selectSchoolYearSemester.SchoolYear && domainScore.Semester == this.selectSchoolYearSemester.Semester) {
            let dScore: DomainScoreInfo = new DomainScoreInfo();
            if (!domainScore.Domain)
              domainScore.Domain = '彈性課程';

            dScore.Domain = domainScore.Domain;
            dScore.Credit = parseFloat(domainScore.Credit);
            dScore.Effort = parseFloat(domainScore.Effort);
            dScore.Period = parseFloat(domainScore.Period);
            dScore.Score = parseFloat(domainScore.Score);
            dScore.SubjectScoreList = [];
            this.studentSemesterScore.DomainScoreList.push(dScore);
          }
        });
      }
    });

    let dd: DomainScoreInfo = new DomainScoreInfo();
    dd.Domain = '彈性課程';
    this.studentSemesterScore.DomainScoreList.push(dd);
    this.semesterScoreSource.forEach(semsScore => {
      // 科目成績
      if (semsScore.SubjectScore) {
        semsScore.SubjectScore.forEach(SubjScore => {
          if (SubjScore.SchoolYear == this.selectSchoolYearSemester.SchoolYear && SubjScore.Semester == this.selectSchoolYearSemester.Semester) {
            let sScore: SubjectScoreInfo = new SubjectScoreInfo();
            if (!SubjScore.Domain)
              SubjScore.Domain = '彈性課程';
            sScore.Domain = SubjScore.Domain;
            sScore.SubjectName = SubjScore.Subject;
            sScore.Credit = parseFloat(SubjScore.Credit);
            sScore.Effort = parseFloat(SubjScore.Effort);
            sScore.Period = parseFloat(SubjScore.Period);
            sScore.Score = parseFloat(SubjScore.Score);

            this.studentSemesterScore.DomainScoreList.forEach(dScore => {
              if (dScore.Domain === sScore.Domain) {
                dScore.SubjectScoreList.push(sScore);

              }

            });
          }
        });
      }
    });
    this.isLoading = false;
    // this.studentSemesterScore.DomainScoreList.forEach(item => {
    //   if (!item.Score)
    //     item.Calc();
    // });
  }
}
