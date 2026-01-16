import { result } from 'lodash';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { DsaService } from 'src/app/dsa.service';

@Component({
  selector: 'app-counsel-history-psychologicaltest',
  templateUrl: './counsel-history-psychologicaltest.component.html',
  styleUrls: ['./counsel-history-psychologicaltest.component.css']
})
export class CounselHistoryPsychologicaltestComponent implements OnInit {
  isLoading = false;
  studentID: string;
  StudentNumber: string;
  SchoolName: string;
  StudentName: string;
  addBlank: number[] = [];
  reportData: any;
  QuizData: { uid: string, QuizName?: string, Field?: any[] }[] = [];
  QuizDataAnswer: { QuizUid, Field: any[], ImplementationDate }[] = [];
  CounselInterview: any[] = [];
  constructor(private activatedRoute: ActivatedRoute,
    private router: Router,
    private dsaService: DsaService,) { }


  async ngOnInit() {

    this.activatedRoute.paramMap.subscribe(
      (params: ParamMap): void => {
        this.studentID = params.get("studentID");
        this.getReportData();
        this.GetQuiz();
      }
    );
  }

  /**  */
  getStudentItemBy(resTestUID: string): { uid: string, QuizName?: string, Field?: any[] } | null {
    if (this.QuizData && this.QuizData.length > 0) {
      let rsp = this.QuizData.find(x => x.uid == resTestUID);
      // let rsp = this.QuizDataAnswer.find(x => x.QuizUid == resTestUID);
      return rsp || null;
    }
    return null;
  }

  /** 取得資料  */
  async getReportData() {
    this.isLoading = true;
    try {
      this.reportData = await this.dsaService.send("GetPrintDocumentCounselHistory", {
        StudentID: this.studentID
      });

      if (this.reportData.SchoolName) {
        this.SchoolName = this.reportData.SchoolName;
      }

      if (this.reportData.StudentName) {
        this.StudentName = this.reportData.StudentName;
      }

      if (this.reportData.StudentNumber) {
        this.StudentNumber = this.reportData.StudentNumber;
      }

      this.CounselInterview = [];
      if (this.reportData.CounselInterview) {
        this.CounselInterview = [].concat(this.reportData.CounselInterview || []);
      }

      this.addBlank = [];
      // 判斷加入幾個空白
      if (this.CounselInterview.length > 0) {
        let n: number = (20 - this.CounselInterview.length);
        if (n > 1) {
          for (let i = 1; i <= n; i++) {
            this.addBlank.push(i);
          }
        }
      } else {
        for (let i = 1; i <= 20; i++) {
          this.addBlank.push(i);
        }
      }


    } catch (error) {
      console.log(error);
    } finally {
      this.isLoading = false;
    }
  }


  /** 取得心理驗資訊 */
  async GetQuiz() {
    try {
      let rspQuestion = await this.dsaService.send("GetQuizDataByStudentID", {
        StudentID: this.studentID
        // _.GetQuizStudentDataByQuizID
      });
      this.QuizData = [].concat(rspQuestion.Quiz || []);

      let rsp = await this.dsaService.send("_.GetStudentQuizDataByStudentID", {
        StudentID: this.studentID
      });

      this.QuizDataAnswer = [].concat(rsp.Quiz || [])

      console.log("this.QuizData", this.QuizData);
      console.log("answer", this.QuizDataAnswer)
    } catch (ex) {
      alert("取得心理測驗資料發生錯誤")
    }
  }
  getJson(obj: any) {

    return JSON.stringify(obj);
  }

  /** 取得答案 */
  getQuizAnswerData(quizUID: string, field: string) {
    if (this.QuizDataAnswer && this.QuizDataAnswer.length > 0) {
      let rsp = this.QuizDataAnswer.find(x => x.QuizUid == quizUID);
      if (rsp && rsp.Field && rsp.Field.length > 0) {
        return rsp.Field.find(x => x.Name == field) || null;
      }
    }
    return null;
  }

  /**取得答案 */
  getQuizTime(quizUID: string) {
    if (this.QuizDataAnswer && this.QuizDataAnswer.length > 0) {
      let rsp = this.QuizDataAnswer.find(x => x.QuizUid == quizUID);
      if (rsp && rsp.ImplementationDate) {
        let dateString = this.formatDate(rsp.ImplementationDate);
        return dateString;
      }
    }
    return '';
  }


  formatDate(date) {
    let date_ = new Date(0)
    date_.setUTCSeconds(parseInt(date, 10));
    var d = date_,
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2)
      month = '0' + month;
    if (day.length < 2)
      day = '0' + day;

    return [year, month, day].join('-');
  }

  /** 檢查是否有有效的心理測驗資料 */
  hasValidQuizData(): boolean {
    if (!this.QuizData || this.QuizData.length === 0) {
      return false;
    }
    
    // 檢查是否至少有一個測驗有對應的答案資料
    for (let quiz of this.QuizData) {
      if (this.hasQuizAnswer(quiz.uid)) {
        return true;
      }
    }
    
    return false;
  }

  /** 檢查指定測驗是否有答案資料 */
  hasQuizAnswer(quizUID: string): boolean {
    let quizItem = this.getStudentItemBy(quizUID);
    if (quizItem && quizItem.Field && quizItem.Field.length > 0) {
      // 檢查是否有對應的答案資料
      for (let field of quizItem.Field) {
        let answer = this.getQuizAnswerData(quizUID, field.Name);
        if (answer && answer.Value) {
          return true;
        }
      }
    }
    return false;
  }
}
