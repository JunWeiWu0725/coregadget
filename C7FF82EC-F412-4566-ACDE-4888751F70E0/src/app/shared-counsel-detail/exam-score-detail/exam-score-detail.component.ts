import { Component, OnInit, Optional } from '@angular/core';
import { CounselDetailComponent } from "../counsel-detail.component";
import { DsaService } from "../../dsa.service";
import { CounselStudentService } from "../../counsel-student.service";
import { DomainScoreInfo, CourseScoreInfo, ExamScoreInfo, SemesterInfo, StudentExamScore, ItemCount, ItemCounts } from "./exam-score-vo";

@Component({
  selector: 'app-exam-score-detail',
  templateUrl: './exam-score-detail.component.html',
  styleUrls: ['./exam-score-detail.component.css']
})
export class ExamScoreDetailComponent implements OnInit {

  // 選的學年度學期
  selectSchoolYearSemester: SemesterInfo = new SemesterInfo();

  // 及格標準
  passScore: number = 60;
  isLoading = false;
  // 學校型態,JHHC,JHKH,SH
  selectSchoolType: string = "";

  semesterList: SemesterInfo[] = [];

  // 評量成績來源資料
  examScoreSource: any[] = [];
  examScoreOrdinarilySource: any[] = [];
  SelectExamCountName: string = "";

  currentClassExamScoreSource: any[] = [];

  selectExamScoreSource: any[] = [];

  studentExamScore: StudentExamScore = new StudentExamScore();
  // 真正使用 service
  serviceGetExamScore: string = "";
  serviceGetExamScoreOrdinarilyScoreJHKH: string = "GetExamScoreOrdinarilyScoreJHKH";
  serviceSchoolCoreInfo: string = "GetSchoolCoreInfo";
  serviceGetClassExamScore: string = "GetClassExamScoreJHHC";
  serviceGetClassExamScoreSH: string = "GetClassExamScoreSH";
  constructor(private counselStudentService: CounselStudentService,
    private dsaService: DsaService,
    @Optional() private counselDetailComponent: CounselDetailComponent) { }

  async ngOnInit() {
    this.counselDetailComponent.setCurrentItem('exam_score');
    await this.GetSchoolCoreInfo();
  }

  async loadData() {
 
    if (this.selectSchoolType === 'JHHC') {
      // 1.新竹版國中小評量成績
      this.serviceGetExamScore = "GetExamScoreJHHC";

      await this.GetExamScore();
      await this.GetExamList();
    }

    if (this.selectSchoolType === 'JHKH') {
      // 2.高雄版國中小評量成績
      this.serviceGetExamScore = "GetExamScoreJHKH";
      await this.GetExamScoreOrdinarilyScoreJHKH();

    }

    if (this.selectSchoolType === 'SH') {
      // 3.高中評量成績
      this.serviceGetExamScore = "GetExamScoreSH";
    
      await this.GetExamScore();
      await this.GetExamList();
    }

    // // 取得預設學年度學期
    // this.selectSchoolYearSemester.SchoolYear = this.counselDetailComponent.counselStudentService.currentSchoolYear
    // this.selectSchoolYearSemester.Semester = this.counselDetailComponent.counselStudentService.currentSemester;
  }

  // 高雄評量成績
  async GetExamScoreOrdinarilyScoreJHKH() {
    try {

    } catch (err) {
      alert('無法取得高雄評量成績：' + err.dsaError.message);
    }


    let resp = await this.dsaService.send(this.serviceGetExamScoreOrdinarilyScoreJHKH, {
      Request: {
        StudentID: this.counselDetailComponent.currentStudent.StudentID
      }
    });

    this.examScoreOrdinarilySource = [].concat(resp.CourseExamScore || []);

    this.examScoreOrdinarilySource.forEach(ExamScore => {

    });
    await this.GetExamScore();
    await this.GetExamList();
  }

  // 取得學制
  async GetSchoolCoreInfo() {
    this.isLoading = true;
    try {
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
    } catch (err) {
      alert('無法取得學制：' + err.dsaError.message);
    }
  }

  SetSelectSemester(item: SemesterInfo) {
    this.selectSchoolYearSemester = item;
    if (this.selectSchoolType === 'SH') {
      this.parseScoreSH();
    } else {
      this.parseScore();
    }
  }

/**
 *
 *  取得評量的聯集
 * @memberof ExamScoreDetailComponent
 */
 async GetExamList(){
  let resp = await this.dsaService.send("_.GetUnionExamName", {
    Request: {
      StudentID: this.counselDetailComponent.currentStudent.StudentID,
      SchoolYear: this.selectSchoolYearSemester.SchoolYear,
      Semester: this.selectSchoolYearSemester.Semester
    }
  });
    [].concat(resp.Exams).forEach(exam =>{
    if (!this.studentExamScore.ExamNameList.includes(exam.ExamName)) {
      this.studentExamScore.ExamNameList.push(exam.ExamName);
    }
    });
 }

  async GetExamScore() {
    this.semesterList = [];
    let tmpSems: string[] = [];

    try {
      let resp = await this.dsaService.send(this.serviceGetExamScore, {
        Request: {
          StudentID: this.counselDetailComponent.currentStudent.StudentID
        }
      });

      this.examScoreSource = [].concat(resp.CourseExamScore || []);

      //console.log('this.examScoreSource',this.examScoreSource);
      this.examScoreSource.forEach(ExamScore => {
        let ss = ExamScore.SchoolYear + ExamScore.Semester;
        if (!tmpSems.includes(ss)) {
          let semsInfo: SemesterInfo = new SemesterInfo();
          semsInfo.SchoolYear = parseInt(ExamScore.SchoolYear);
          semsInfo.Semester = parseInt(ExamScore.Semester);
          this.semesterList.push(semsInfo);
          tmpSems.push(ss);
        }
      });

      // 處理當學校預設學年度學期沒有成績，預設選有成績第一項。
      if (this.semesterList.length > 0) {
        let hasValue = false;
        this.semesterList.forEach(ss => {
          if (ss.SchoolYear === this.counselDetailComponent.currentStudent.SchoolYear && ss.Semester === this.counselDetailComponent.currentStudent.Semester)
            hasValue = true;
        });

        if (!hasValue)
          this.selectSchoolYearSemester = this.semesterList[0];
      }

      if (this.selectSchoolType === 'SH') {
        this.parseScoreSH();
      } else { //國中
        this.parseScore();
      }
    } catch (err) {
      alert('無法取得評量成績：' + err.dsaError.message);
    }


  }

  // 依學年度學期取得班級評量成績
  async GetCalssExamScoreBySchoolYearSemester() {

    try {
      let resp = await this.dsaService.send(this.serviceGetClassExamScore, {
        Request: {
          StudentID: this.counselDetailComponent.currentStudent.StudentID,
          SchoolYear: this.selectSchoolYearSemester.SchoolYear,
          Semester: this.selectSchoolYearSemester.Semester
        }
      });

      // 班級學生成績
      let tmpKey: string[] = [];
      this.currentClassExamScoreSource = [].concat(resp.CourseExamScore || []);
      this.currentClassExamScoreSource.forEach(examScore => {
        if (!examScore.Domain) {
          examScore.Domain = '彈性課程';
        }
        let key = examScore.Domain + '_' + examScore.Subject + '_' + examScore.ExamName;
        if (!tmpKey.includes(key)) {
          let items: ItemCounts = new ItemCounts();
          items.Name = key;
          this.studentExamScore.AvgItemCountNameList.forEach(itemName => {
            let it: ItemCount = new ItemCount();
            it.Name = itemName;
            it.Count = 0;
            it.isMe = false;
            items.itemList.push(it);
          });
          this.studentExamScore.AvgItemCountList.push(items);
          tmpKey.push(key);
        }

        let score = parseFloat(examScore.ExamScore);

        this.studentExamScore.AvgItemCountList.forEach(item => {
          if (item.Name === key) {
            if (score >= 100) {
              item.itemList[10].Count++;
              if (item.itemList[10].isMe == false)
                item.itemList[10].isMe = (examScore.StudentID === this.counselDetailComponent.currentStudent.StudentID);
            } else if (score >= 90 && score < 100) {
              item.itemList[9].Count++;
              if (item.itemList[9].isMe == false)
                item.itemList[9].isMe = (examScore.StudentID === this.counselDetailComponent.currentStudent.StudentID);
            } else if (score >= 80 && score < 90) {
              item.itemList[8].Count++;
              if (item.itemList[8].isMe == false)
                item.itemList[8].isMe = (examScore.StudentID === this.counselDetailComponent.currentStudent.StudentID);
            } else if (score >= 70 && score < 80) {
              item.itemList[7].Count++;
              if (item.itemList[7].isMe == false)
                item.itemList[7].isMe = (examScore.StudentID === this.counselDetailComponent.currentStudent.StudentID);
            } else if (score >= 60 && score < 70) {
              item.itemList[6].Count++;
              if (item.itemList[6].isMe == false)
                item.itemList[6].isMe = (examScore.StudentID === this.counselDetailComponent.currentStudent.StudentID);
            } else if (score >= 50 && score < 60) {
              item.itemList[5].Count++;
              if (item.itemList[5].isMe == false)
                item.itemList[5].isMe = (examScore.StudentID === this.counselDetailComponent.currentStudent.StudentID);
            } else if (score >= 40 && score < 50) {
              item.itemList[4].Count++;
              if (item.itemList[4].isMe == false)
                item.itemList[4].isMe = (examScore.StudentID === this.counselDetailComponent.currentStudent.StudentID);
            } else if (score >= 30 && score < 40) {
              item.itemList[3].Count++;
              if (item.itemList[3].isMe == false)
                item.itemList[3].isMe = (examScore.StudentID === this.counselDetailComponent.currentStudent.StudentID);
            } else if (score >= 20 && score < 30) {
              item.itemList[2].Count++;
              if (item.itemList[2].isMe == false)
                item.itemList[2].isMe = (examScore.StudentID === this.counselDetailComponent.currentStudent.StudentID);
            } else if (score >= 10 && score < 20) {
              item.itemList[1].Count++;
              if (item.itemList[1].isMe == false)
                item.itemList[1].isMe = (examScore.StudentID === this.counselDetailComponent.currentStudent.StudentID);
            } else if (score >= 0 && score < 10) {
              item.itemList[0].Count++;
              if (item.itemList[0].isMe == false)
                item.itemList[0].isMe = (examScore.StudentID === this.counselDetailComponent.currentStudent.StudentID);
            } else {

            }
          }
        });
      });
    } catch (err) {
      alert('無法依學年度學期取得班級評量成績：' + err.dsaError.message);
    }

    this.isLoading = false;
  }

  // 依學年度學期取得班級評量成績(高中)
  async GetCalssExamScoreBySchoolYearSemesterSH() {

    try {
      let resp = await this.dsaService.send(this.serviceGetClassExamScoreSH, {
        Request: {
          StudentID: this.counselDetailComponent.currentStudent.StudentID,
          SchoolYear: this.selectSchoolYearSemester.SchoolYear,
          Semester: this.selectSchoolYearSemester.Semester
        }
      });

      // 班級學生成績
      let tmpKey: string[] = [];
      this.currentClassExamScoreSource = [].concat(resp.CourseExamScore || []);
      this.currentClassExamScoreSource.forEach(examScore => {

        let key = examScore.Subject + '_' + examScore.ExamName;
        if (!tmpKey.includes(key)) {
          let items: ItemCounts = new ItemCounts();
          items.Name = key;
          this.studentExamScore.AvgItemCountNameList.forEach(itemName => {
            let it: ItemCount = new ItemCount();
            it.Name = itemName;
            it.Count = 0;
            it.isMe = false;
            items.itemList.push(it);
          });
          this.studentExamScore.AvgItemCountList.push(items);
          tmpKey.push(key);
        }

        let score = parseFloat(examScore.ExamScore);

        this.studentExamScore.AvgItemCountList.forEach(item => {
          if (item.Name === key) {
            if (score >= 100) {
              item.itemList[10].Count++;
              if (item.itemList[10].isMe == false)
                item.itemList[10].isMe = (examScore.StudentID === this.counselDetailComponent.currentStudent.StudentID);
            } else if (score >= 90 && score < 100) {
              item.itemList[9].Count++;
              if (item.itemList[9].isMe == false)
                item.itemList[9].isMe = (examScore.StudentID === this.counselDetailComponent.currentStudent.StudentID);
            } else if (score >= 80 && score < 90) {
              item.itemList[8].Count++;
              if (item.itemList[8].isMe == false)
                item.itemList[8].isMe = (examScore.StudentID === this.counselDetailComponent.currentStudent.StudentID);
            } else if (score >= 70 && score < 80) {
              item.itemList[7].Count++;
              if (item.itemList[7].isMe == false)
                item.itemList[7].isMe = (examScore.StudentID === this.counselDetailComponent.currentStudent.StudentID);
            } else if (score >= 60 && score < 70) {
              item.itemList[6].Count++;
              if (item.itemList[6].isMe == false)
                item.itemList[6].isMe = (examScore.StudentID === this.counselDetailComponent.currentStudent.StudentID);
            } else if (score >= 50 && score < 60) {
              item.itemList[5].Count++;
              if (item.itemList[5].isMe == false)
                item.itemList[5].isMe = (examScore.StudentID === this.counselDetailComponent.currentStudent.StudentID);
            } else if (score >= 40 && score < 50) {
              item.itemList[4].Count++;
              if (item.itemList[4].isMe == false)
                item.itemList[4].isMe = (examScore.StudentID === this.counselDetailComponent.currentStudent.StudentID);
            } else if (score >= 30 && score < 40) {
              item.itemList[3].Count++;
              if (item.itemList[3].isMe == false)
                item.itemList[3].isMe = (examScore.StudentID === this.counselDetailComponent.currentStudent.StudentID);
            } else if (score >= 20 && score < 30) {
              item.itemList[2].Count++;
              if (item.itemList[2].isMe == false)
                item.itemList[2].isMe = (examScore.StudentID === this.counselDetailComponent.currentStudent.StudentID);
            } else if (score >= 10 && score < 20) {
              item.itemList[1].Count++;
              if (item.itemList[1].isMe == false)
                item.itemList[1].isMe = (examScore.StudentID === this.counselDetailComponent.currentStudent.StudentID);
            } else if (score >= 0 && score < 10) {
              item.itemList[0].Count++;
              if (item.itemList[0].isMe == false)
                item.itemList[0].isMe = (examScore.StudentID === this.counselDetailComponent.currentStudent.StudentID);
            } else {

            }
          }
        });
      });
    } catch (err) {
      alert('無法依學年度學期取得班級評量成績：' + err.dsaError.message);
    }
    this.isLoading = false;
  }

  SetSelectExamCountName(item: string) {
    this.SelectExamCountName = item;
  }


  /**
   *
   *解析高中評量成績
   * @memberof ExamScoreDetailComponent
   */
  parseScoreSH() {

    this.studentExamScore = new StudentExamScore();
    this.studentExamScore.AvgItemCountNameList = [];
    this.studentExamScore.AvgItemCountNameList.push('0-9');
    this.studentExamScore.AvgItemCountNameList.push('10-19');
    this.studentExamScore.AvgItemCountNameList.push('20-29');
    this.studentExamScore.AvgItemCountNameList.push('30-39');
    this.studentExamScore.AvgItemCountNameList.push('40-49');
    this.studentExamScore.AvgItemCountNameList.push('50-59');
    this.studentExamScore.AvgItemCountNameList.push('60-69');
    this.studentExamScore.AvgItemCountNameList.push('70-79');
    this.studentExamScore.AvgItemCountNameList.push('80-89');
    this.studentExamScore.AvgItemCountNameList.push('90-99');
    this.studentExamScore.AvgItemCountNameList.push('100以上');
    // 取得本學年度學期
    this.selectExamScoreSource = [];
    this.examScoreSource.forEach(item => {
      if (item.SchoolYear == this.selectSchoolYearSemester.SchoolYear && item.Semester == this.selectSchoolYearSemester.Semester) {
        this.selectExamScoreSource.push(item);
      }
    });

    this.selectExamScoreSource.forEach(item => {

      // 處理課程成績
      if (!this.studentExamScore.CourseNameList.includes(item.CourseName)) {
        this.studentExamScore.CourseNameList.push(item.CourseName);
        let courseScore: CourseScoreInfo = new CourseScoreInfo();
        if (item.Credit) {
          courseScore.CourseCredit = parseFloat(item.Credit);
        } else
          courseScore.CourseCredit = 0;
        courseScore.CourseName = item.CourseName;
        if (item.ExamScore)
          courseScore.CourseScore = parseFloat(item.ExamScore);

        courseScore.SubjectName = item.Subject;
        courseScore.ExamScoreList = [];
        this.studentExamScore.CourseScoreList.push(courseScore);
      }
    })

    // [高中]處理評量成績
    this.selectExamScoreSource.forEach(item => {

      // 原本試別顯示的清單 適用學生稱抓回來的去整理
      // if (!this.studentExamScore.ExamNameList.includes(item.ExamName)) {
      //   this.studentExamScore.ExamNameList.push(item.ExamName);
      // }
      this.studentExamScore.CourseScoreList.forEach(courseItem => {
        if (item.CourseName === courseItem.CourseName) {
          let exam: ExamScoreInfo = new ExamScoreInfo();
          exam.DisplayOrder = parseInt(item.DisplayOrder);
          if (item.ExamScore)
           exam.ExamScore = parseFloat(item.ExamScore);
          exam.ExamName = item.ExamName;
          exam.HasScore = true;
          courseItem.ExamScoreList.push(exam);
        }
      });
    });
      // 收集試別的聯集 .
      this.GetExamList();

    if (this.studentExamScore.ExamNameList.length) {
      this.SelectExamCountName = this.studentExamScore.ExamNameList[0];
    }

    this.studentExamScore.CourseScoreList.forEach(courseItem => {
      courseItem.CalcUpDown();
    });

    // 放入課程成績
    this.studentExamScore.CourseScoreList.forEach(courseItem => {

      // 檢查 exam 不足補空的
      if (courseItem.ExamScoreList.length < this.studentExamScore.ExamNameList.length) {
        let order: number = 1;
        this.studentExamScore.ExamNameList.forEach(exName => {
          let checkHasData: boolean = false;
          let nullExam: ExamScoreInfo = new ExamScoreInfo();
          nullExam.HasScore = false;
          nullExam.DisplayOrder = order;
          courseItem.ExamScoreList.forEach(exScore => {
            if (exScore.ExamName == exName) {
              checkHasData = true;
            }
          });
          if (checkHasData === false) {
            courseItem.ExamScoreList.push(nullExam);
          }
          order += 1;
        });
        courseItem.ExamScoreList.sort(function (a, b) {
          return a.DisplayOrder - b.DisplayOrder;
        });
      }
    });
    this.studentExamScore.CalcExamAvgScore();

    this.GetCalssExamScoreBySchoolYearSemesterSH();
  }

  // 解析成績
  /**
   *
   * [國中]解析成績
   * @memberof ExamScoreDetailComponent
   */
  parseScore() {
    this.studentExamScore = new StudentExamScore();
    this.studentExamScore.AvgItemCountNameList = [];
    this.studentExamScore.AvgItemCountNameList.push('0-9');
    this.studentExamScore.AvgItemCountNameList.push('10-19');
    this.studentExamScore.AvgItemCountNameList.push('20-29');
    this.studentExamScore.AvgItemCountNameList.push('30-39');
    this.studentExamScore.AvgItemCountNameList.push('40-49');
    this.studentExamScore.AvgItemCountNameList.push('50-59');
    this.studentExamScore.AvgItemCountNameList.push('60-69');
    this.studentExamScore.AvgItemCountNameList.push('70-79');
    this.studentExamScore.AvgItemCountNameList.push('80-89');
    this.studentExamScore.AvgItemCountNameList.push('90-99');
    this.studentExamScore.AvgItemCountNameList.push('100以上');
    // 取得本學年度學期
    this.selectExamScoreSource = [];
    this.examScoreSource.forEach(item => {
      if (item.SchoolYear == this.selectSchoolYearSemester.SchoolYear && item.Semester == this.selectSchoolYearSemester.Semester) {
        this.selectExamScoreSource.push(item);
      }
    });

    this.selectExamScoreSource.forEach(item => {
      if (!item.Domain) {
        item.Domain = '彈性課程';
      }

      if (!this.studentExamScore.DomainNameList.includes(item.Domain)) {

        this.studentExamScore.DomainNameList.push(item.Domain)
        let domainScore: DomainScoreInfo = new DomainScoreInfo();
        domainScore.DomainName = item.Domain;
        domainScore.SumScore = 0;
        domainScore.Credit = 0;

        if (domainScore.DomainName === '語文') {
          domainScore.Order = 1;
        } else if (domainScore.DomainName === '數學') {
          domainScore.Order = 2;
        } else if (domainScore.DomainName === '社會') {
          domainScore.Order = 3;
        } else if (domainScore.DomainName === '自然與生活科技') {
          domainScore.Order = 4;
        } else if (domainScore.DomainName === '藝術與人文') {
          domainScore.Order = 5;
        } else if (domainScore.DomainName === '健康與體育') {
          domainScore.Order = 6;
        } else if (domainScore.DomainName === '綜合活動') {
          domainScore.Order = 6;
        } else {
          domainScore.Order = 99;
        }


        domainScore.CourseScoreList = [];
        this.studentExamScore.DomainScoreList.push(domainScore);
      }



      // 處理課程成績
      if (!this.studentExamScore.CourseNameList.includes(item.CourseName)) {
        this.studentExamScore.CourseNameList.push(item.CourseName);
        let courseScore: CourseScoreInfo = new CourseScoreInfo();
        courseScore.DomainName = item.Domain;
        if (item.Credit) {
          courseScore.CourseCredit = parseFloat(item.Credit);
        } else
          courseScore.CourseCredit = 0;
        courseScore.CourseName = item.CourseName;
        if(item.ExamScore)
         courseScore.CourseScore = parseFloat(item.ExamScore);
        courseScore.SubjectName = item.Subject;
        courseScore.ExamScoreList = [];
        this.studentExamScore.CourseScoreList.push(courseScore);
      }
    })

    // [國中] 處理評量成績
    this.selectExamScoreSource.forEach(item => {

      // if (!this.studentExamScore.ExamNameList.includes(item.ExamName)) {
      //   this.studentExamScore.ExamNameList.push(item.ExamName);
      // }
      console.log('CourseScoreList', this.studentExamScore.CourseScoreList);
      this.studentExamScore.CourseScoreList.forEach(courseItem => {
        console.log('item.CourseName',item.CourseName);
        console.log('courseItem.CourseName',courseItem.CourseName);
        if (item.CourseName === courseItem.CourseName) {
          let exam: ExamScoreInfo = new ExamScoreInfo();
          exam.Score = parseFloat(item.Score);
          if (item.AssignmentScore)
          exam.AssignmentScore = parseFloat(item.AssignmentScore);
          exam.DisplayOrder = parseInt(item.DisplayOrder);
          if (item.ExamScore)
          exam.ExamScore = parseFloat(item.ExamScore);
          exam.ExamName = item.ExamName;
          exam.HasScore = true;
          courseItem.ExamScoreList.push(exam);
          console.log('--  exam.ExamScore ',   exam.ExamScore );
        }
      });
    });

   // 收集試別的聯集 .
   this.GetExamList();
    if (this.studentExamScore.ExamNameList.length) {
      this.SelectExamCountName = this.studentExamScore.ExamNameList[0];

      // 因為高雄成績結構不同 平時評量存在 sc_attend 的 extension 裡 所以在這裡先加入
      if (this.selectSchoolType === 'JHKH') {
        this.studentExamScore.ExamNameList.push('平時評量');
      }
    }

    this.studentExamScore.CourseScoreList.forEach(courseItem => {
      courseItem.CalcUpDown();
    });

    // 放入領域的課程成績
    this.studentExamScore.DomainScoreList.forEach(domainItem => {
      this.studentExamScore.CourseScoreList.forEach(courseItem => {
        if (domainItem.DomainName === courseItem.DomainName) {
          // 檢查 exam 不足補空的
          if (courseItem.ExamScoreList.length < this.studentExamScore.ExamNameList.length) {
            let order: number = 1;
            this.studentExamScore.ExamNameList.forEach(exName => {
              let checkHasData: boolean = false;
              let nullExam: ExamScoreInfo = new ExamScoreInfo();
              nullExam.HasScore = false;
              nullExam.DisplayOrder = order;
              courseItem.ExamScoreList.forEach(exScore => {
                if (exScore.ExamName == exName) {
                  checkHasData = true;
                }
              });
              if (checkHasData === false) {
                courseItem.ExamScoreList.push(nullExam);
              }
              order += 1;
            });
            courseItem.ExamScoreList.sort(function (a, b) {
              return a.DisplayOrder - b.DisplayOrder;
            });
          }

          domainItem.CourseScoreList.push(courseItem);
        }
      });
      // 計算領域成績
      domainItem.CalcDomainScore();
      domainItem.CalcUpDown();
    });

    // 處理高雄平時評量
    if (this.selectSchoolType === 'JHKH') {
      this.studentExamScore.DomainScoreList.forEach(domainItem => {
        this.studentExamScore.CourseScoreList.forEach(courseItem => {
          this.examScoreOrdinarilySource.forEach(item => {

            if (courseItem.CourseName === item.CourseName && item.SchoolYear == this.selectSchoolYearSemester.SchoolYear && item.Semester == this.selectSchoolYearSemester.Semester) {
              if (item.OrdinarilyScore) {
                let examItem = courseItem.ExamScoreList[courseItem.ExamScoreList.length - 1];
                examItem.ExamName = '平時評量';
                examItem.ExamScore = parseFloat(item.OrdinarilyScore);
              }
            }
          });
        });

      });


    }

    this.studentExamScore.DomainScoreList.sort(function (a, b) {
      return a.Order - b.Order;
    });

    this.studentExamScore.CalcExamAvgScore();


    // 取得班級評量成績
    this.GetCalssExamScoreBySchoolYearSemester();

  }

  checkScoreFail(score: number) {
    let val: boolean = false;
    if (score)
    {
      if(score < this.passScore)
        val = true;
    }

    return val;
  }
}
