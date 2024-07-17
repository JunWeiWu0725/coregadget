import { Component, OnInit, Optional } from "@angular/core";
import { DsaService } from "../../dsa.service";
import { CounselStudentService } from "../../counsel-student.service";
import { QuizData, QuizField } from "./quiz-data-vo";
import { CounselDetailComponent } from "../counsel-detail.component";

@Component({
  selector: "app-psychological-test-detail",
  templateUrl: "./psychological-test-detail.component.html",
  styleUrls: ["./psychological-test-detail.component.css"]
})
export class PsychologicalTestDetailComponent implements OnInit {
  // 心測資料
  isLoading = false;
  /**從 設定檔有的題目 */
  QuizData: any[]
  /** 學生  */
  _QuizDataList: QuizData[];
  constructor(
    private counselStudentService: CounselStudentService,
    private dsaService: DsaService,
    @Optional() private counselDetailComponent: CounselDetailComponent
  ) { }

  ngOnInit() {
    this.counselDetailComponent.setCurrentItem('psychological_test');
    this._QuizDataList = [];
    if (this.counselDetailComponent.currentStudent.StudentID) {
      this.GetStudentQuizDataByStudentID(
        this.counselDetailComponent.currentStudent.StudentID
      );
    }
  }

  getStudentItemByTextID(resTestUID: string) {
       debugger
       console.log("debugger",resTestUID)
    if (this.QuizData) {
      let rsp = this.QuizData.find(x => x.uid == resTestUID);
        console.log("quizData", rsp)
      // let rsp = this.QuizDataAnswer.find(x => x.QuizUid == resTestUID); 
      return rsp
    }

  }


  /** 取得物件  */
  getStudentItemByTestID(quizFieldList: any[], colName: string) {
  
    if (quizFieldList) {
      return quizFieldList.find(x => x.Name == colName)
    } else {
      return '--'
    }
  }


  /**  */
  getJSON(obj: any) {
    return JSON.stringify(obj)

  }
  // 取得學生心理測驗題目
  async GetQuizDataByStudentID(StudentID: string) {
    try {

      let resp = await this.dsaService.send("GetQuizDataByStudentID", {
        Request: {
          StudentID: StudentID
        }
      });
      // this._QuizDataList = [].concat(resp.Quiz || []) ;
      // 解析題目
      debugger
      console.log("resp.Quiz 1 ", resp.Quiz );
      [].concat(resp.Quiz || []).forEach(data => {
  

      
        this._QuizDataList.forEach(data1 => {
          // 使用題目 uid 比對
          if (data1.QuizUid === data.uid) {

            // 填入題目名稱
            data1.QuizName = data.QuizName;
            // 細項比對填入 Order
            data1.QuizFieldList.forEach(field => {
              data.Field.forEach(f1 => {
                if (f1.Name === field.Name)
                   {
                  let or = Number(f1.Order);
                  if (or) {
                    field.Order = f1.Order;
                  }
                }
              });
            });

            // 將細項依 Order 順序排序
            data1.QuizFieldList.sort(function (a, b) {
              return a.Order - b.Order;
            });
          }
        });
      });
      debugger
      console.log("resp.Quiz ", resp.Quiz );

    } catch (err) {
      alert('無法取得學生心理測驗題目：' + err.dsaError.message);
    }


    // console.log(this._QuizDataList);
    this.isLoading = false;
  }

  // 取得心理測驗答案
  async GetStudentQuizDataByStudentID(StudentID: string) {
    this.isLoading = true;
    try {
      let resp = await this.dsaService.send("GetStudentQuizDataByStudentID", {
        Request: {
          StudentID: StudentID
        }
      });
      [].concat(resp.Quiz || []).forEach(data => {
        let qd: QuizData = new QuizData();
        qd.QuizUid = data.QuizUid;
        qd.AnsUid = data.Uid;
        let d1 = Number(data.ImplementationDate);
        let x1 = new Date(d1);
        qd.ImplementationDate = qd.parseDate(x1);
        let d2 = Number(data.AnalysisDate);
        let x2 = new Date(d2);
        qd.AnalysisDate = qd.parseDate(x2);
        qd.QuizFieldList = [];
        data.Field.forEach(field => {
          let qf: QuizField = new QuizField();
          qf.Name = field.Name;
          qf.Value = field.Value;
          qf.Order = 999; // 填入預設
          qd.QuizFieldList.push(qf);
        });
        this._QuizDataList.push(qd);
      });

      // 呼叫題目
      await this.GetQuizDataByStudentID(StudentID);
    } catch (err) {
      alert('無法取得心理測驗答案：' + err.dsaError.message);
    }
  }
}
