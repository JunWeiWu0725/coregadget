import { Component, OnInit, ViewChild, TemplateRef, ViewContainerRef } from '@angular/core';
import {
  CounselClass, ExamInfo, GroupSelectAnyls, ScoreInfoByStud,
  ScoreInfo, ScoreInfoBySeme, QuizFieldInfos
} from '../../CounselStatistics-vo';
import { DsaService } from "../../../dsa.service";
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material';
import { ReportEngineService } from 'src/app/report-engine.service';
import { Overlay } from '@angular/cdk/overlay';

@Component({
  selector: 'app-group-analysis-report',
  templateUrl: './group-analysis-report.component.html',
  styleUrls: ['./group-analysis-report.component.css']
})
export class GroupAnalysisReportComponent implements OnInit {

  downLoadURL = "";
  ZipID: string;
  DownLoadID: string;
  zipComplete: boolean;
  fileComplete: string[];
  progress: Number = 0;
  privideDate: string;
  signLimitData: String;
  homeTeacherReturn: string;
  CurrentSchoolYear: String;
  CurrentSemester: String;
  ExamInfos: ExamInfo[] = [];
  SelectClasses: CounselClass[] = [];
  SelectedExamID: string[] = [];
  SelectedExams: ExamInfo[] = [];
  isSaveButtonDisable: Boolean = false;
  allClassesGrade1: CounselClass[] = [];
  mapingExam: string[] = ["期中考試", "期中考試", "期末考試"];
  quizNames: string[] = ["大考中心興趣量表", "大考中心學業性向測驗"];

  RomanNumber = { 0: ' ', 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X' }; // 顯示級別用
  SubjectSortOrder = ['國語文', '英語文', '數學', '歷史', '地理', '公民與社會', '生物', '化學', '地球科學', '音樂', '美術', '生活科技', '資訊科技', '體育'];

  showExamForm: Boolean = false;
  TempDataSource: Map<String, ScoreInfoByStud> = new Map(); // key 學生ID
  OutPutDataByClass: Map<string, GroupSelectAnyls[]> = new Map(); // 以班級為單位的裝



  OutPutData: GroupSelectAnyls[];
  Columns = ["SubjName", "Credit", "IsRequire"
    , "Reg1SubjScore", "Reg1SubjPR"
    , "Reg2SubjScore", "Reg2SubjPR"
    , "FinalSubjSocre", "FinalSubjPR"
    , "SemsSubScore", "SemsSubjPR"]; // 產生最終檔案需要之攔位

  StudentScoreData: any; // 要列印之資料

  constructor(private dsaService: DsaService,
    private reportEngineService: ReportEngineService,
    private dialog: MatDialog,
    private overlay: Overlay,
    private container: ViewContainerRef) { }

  @ViewChild('printopt') printopt: TemplateRef<any>;

  ngOnInit() {

    this.GetCounselClass(); // 取得1年級班級
    this.GetExamInfo(); // 取得試別
  }

  /**
   * 彈跳式視窗
   */
  // showOverlay() {
  //   const ol = this.overlay.create({
  //     positionStrategy: this.overlay
  //       .position()
  //       .global()
  //       .centerHorizontally()
  //       .centerVertically(),
  //     scrollStrategy: this.overlay.scrollStrategies.reposition(),
  //     hasBackdrop: true
  //   });

  //   ol.attach(new TemplatePortal(this.printopt, this.container));

  //   ol.backdropClick().subscribe(v => {
  //     ol.detach();
  //   });
  // }
  /**
   * 取得學生資料 同時把資料儲存至中間站
   */
  async GetStudentInfo(classID: string) {
    // const strClassID = this.SelectClasses.join(",");
    const resp = await this.dsaService.send("Statistics.GetStudentInfo", {
      StrClassID: classID
    });


    [].concat(resp.StudentInfo || []).forEach(x => {

      const studentScoreInfo = new ScoreInfoByStud(); // 建一個model
      studentScoreInfo.StudentID = x.StudentID;
      studentScoreInfo.SeatNo = x.SeatNo;
      studentScoreInfo.StudentName = x.Name;
      studentScoreInfo.ClassTeacher = x.TeacherName;
      studentScoreInfo.ClassName = x.ClassName;
      if (!this.TempDataSource.has(studentScoreInfo.StudentID)) {
        this.TempDataSource.set(studentScoreInfo.StudentID, studentScoreInfo);

      } else {
      }
    });

    // console.log("取得學生資訊完畢", this.TempDataSource);
  }
  /*
  取得所有試別
  */
  async GetExamInfo() {
    const resp = await this.dsaService.send("Statistics.GetExamInfo", {
    });

    [].concat(resp.ExamInfos || []).forEach(exam => {
      const examInfo: ExamInfo = new ExamInfo();
      examInfo.ExamID = exam.ExamID;
      examInfo.ExamName = exam.ExamName;
      examInfo.DisplayOrder = exam.DisplayOrder;
      this.ExamInfos.push(examInfo);
    });
  }

  /*
  按下產出報表
  */
  report() {
   this.zipComplete = false;
    console.log(this.checkCheckCount());
    if (this.checkCheckCount() === 0) {
      alert("選擇班級！");
      return;
    } else {
      $('#exampleModalCenter').modal('show');
    }
  }

  // 選完試別後的列印
  async  reportStep2() {
    if (this.checkCheckCount() === 0) {
      alert("選擇班級！");
      return;
    }



    this.progress = 3;
   // $('#progressaAndDown').modal({backdrop: 'static', keyboard: false});
    this.TempDataSource.clear();
    // this.OutPutDataByClass.clear();
    if (this.SelectedExams.length !== 3) {
      alert("試別須選擇三項！");
      return;
    } else {
      // UI 視窗消失
      $('#exampleModalCenter').modal('hide');
      $('#progressaAndDown').modal('show');
      // 開始做事
      // key 值 :學生 年級 學年度 學期
      // 取回值
      // 0.0 取得變數測試

      // 開始整理資料 依班級id取得學生資料
      let classIndex = 1;
      let zipResp;
      // 產生資料並傳資料給report-engine
      this.fileComplete = [];
        for (const classInfo of this.SelectClasses) {
         const classID = classInfo.ClassID;
        this.TempDataSource = new Map<String, ScoreInfoByStud>(); // 轉檔用中間資料(有結構)
        this.OutPutData = [];
        await this.LoadDataByClass(classID); // 依班級取回學生資料
        await this.GetOutPutData(classID);
        const jsonData = JSON.stringify(this.OutPutData); // 轉成Json 格式準備send request用
        let resp;

        try {
          console.log("jsonData", jsonData);
          resp = await this.reportEngineService.SendGroupAnysData(jsonData);
          this.fileComplete.push(`${resp.downloadId}:${classInfo.ClassName}`);

          this.progress = ((classIndex++ / this.SelectClasses.length) * 100) - 2;

        } catch (ex) {
          console.log("err", ex);
         alert("報表產生發生錯誤!"+JSON.stringify(ex));
         $('#progressaAndDown').modal('hide');
        }
      }

     // console.log(" this.fileComplete" ,  this.fileComplete);
      try {
        zipResp = await this.reportEngineService.CompressFile(this.fileComplete.join(","));
        this.ZipID = zipResp.downloadId;
        this.zipComplete = true;
        this.downLoadURL = this.reportEngineService.GetDownLoadURL(this.ZipID);
      } catch (exception) {
        alert("發生錯誤 :" + exception);
        return;
      }
    }
  }


  async LoadDataByClass(classID: string) {
    this.TempDataSource = new Map();
    await this.GetSchoolInfo();     // 0.0 取得學校資訊 目前學年度學期
    await this.GetSelectedExamID(); // 0.0 取額已選取得之試別
    await this.GetStudentInfo(classID);   // 1.取得學生資料
    await this.GetExamScore(classID);     // 2.取得學生學期成績 Service
    await this.GetSemesScore(classID);    // 3.取得學期資料
    await this.GetQuizDate(classID);      // 4.取得心理測驗資料
  }


  /**
   * 取得學生定期評量資料
   */
  async GetExamScore(classID: string) {

    // const StrClassIDs: string = this.SelectClasses.join(",");
    const StrExamIDs: string = this.SelectedExamID.join(",");

    const resp = await this.dsaService.send("Statistics.GetExamScore", {
      Request: {
        StrClassID: classID,
        StrExamID: StrExamIDs
      }
    });

    [].concat(resp.StudentScoreInfos || []).forEach(x => {
      if (this.TempDataSource.has(x.StudentID)) {
        // 1.如果有這個學生

        // 沒有科目 =>todo 應該Service 直接filter
        if (!x.Subject) {
          console.log("科目有空白", x);
          return;
        }

        const studentInfo = this.TempDataSource.get(x.StudentID); // 取得此學生之資料

        // 整理成績相關資料
        const scoreInfo = new ScoreInfo(x.SchoolYear, x.Semester);
        scoreInfo.SubjName = x.Subject + this.RomanNumber[x.SubjLevel];
        scoreInfo.Credit = x.Credit;
        scoreInfo.IsRequire = x.IsRequire === "true" ? "必" : "選";

        if (!studentInfo.IsContainSems(x.Semester)) {// 2.有沒有當學期之資料  * 沒有 =>新增一個 1學期

          const mapScoreInfo = new ScoreInfoBySeme(x.SchoolYear, x.Semester);  // 建一個當學期資料
          studentInfo.SetSemeScoreInfo(x.Semester, mapScoreInfo); // 放進去

        }
        if (!studentInfo.GetScoreInfoBySems(x.Semester).IsContain((x.Subject))) { // 有沒有此科目成績

          const _ScoreInfo = new ScoreInfo(x.SchoolYear, x.Semester);
          _ScoreInfo.SubjName = x.Subject + this.RomanNumber[x.SubjLevel];
          _ScoreInfo.Credit = x.Credit;
          _ScoreInfo.IsRequire = x.IsRequire === "true" ? "必" : "選";

          studentInfo.GetScoreInfoBySems(x.Semester).AddWithSubj(x.Subject, _ScoreInfo);
        }
        studentInfo.GetScoreInfoBySems(x.Semester).GetBySubj(x.Subject);

        try {
          const testSemesSchool = ((studentInfo.GetScoreInfoBySems(x.Semester)).GetBySubj(x.Subject));
          const _scoreInfo = ((studentInfo.GetScoreInfoBySems(x.Semester)).GetBySubj(x.Subject));

          // console.log("存放成績處", _scoreInfo, "科目", x.Subject);
          // 處理不同成績塞到不同屬性
          if (x.ExamID === this.SelectedExamID[0]) { // 如果是期中考1
            _scoreInfo.Reg1SubjScore = x.Score;
            _scoreInfo.Reg1SubjPR = x.PR;

          } else if (x.ExamID === this.SelectedExamID[1]) { // 如果是期中考2
            _scoreInfo.Reg2SubjScore = x.Score;
            _scoreInfo.Reg2SubjPR = x.PR;
          } else if (x.ExamID === this.SelectedExamID[2]) { // 如果是期末考
            _scoreInfo.FinalSubjSocre = x.Score;
            _scoreInfo.FinalSubjPR = x.PR;
          } else {
            console.log("沒有這個學生: ", x);
          }
        } catch (Exception) {
          console.log("有錯誤", Exception);
        }
      }
    });

  }

  /**
   *
   * 取得學期成績
   */
  async GetSemesScore(classID: string) {

    const resp = await this.dsaService.send("Statistics.GetSemsScoreInfo", {
      Request: { StrClassID: classID }
    });

    [].concat(resp.StudentSemsScoreInfo || []).forEach(x => {

      if (!x.Subject) {
        console.log("載入學期成績時科目有問題 ", x.Subject);
        return;
      }
      // 1.找到這位學生
      const scoreInfo: ScoreInfo = new ScoreInfo(x.SchoolYear, x.Semester);

      if (this.TempDataSource.has(x.StudentID)) { // 如果有此學生的ID

        const studentInfo = this.TempDataSource.get(x.StudentID); // 找到這位學生

        if (!studentInfo.IsContainSems(x.Semester)) { // 2.看看此學生id下有沒有這學期的資料 沒有 => 新增一個當學期物件
          const scoreInfoBySeme = new ScoreInfoBySeme(x.SchoolYear, x.Semester);
          studentInfo.SetSemeScoreInfo(x.Semester, scoreInfoBySeme);

        }
        if (!studentInfo.GetScoreInfoBySems(x.Semester).IsContain(x.Subject)) {// 3.如果沒有
          const _scoreInfo = new ScoreInfo(x.SchoolYear, x.Semester);


          studentInfo.GetScoreInfoBySems(x.Semester).SetWithSubj(x.Subject, _scoreInfo);

        }
        let scoreinfo;
        try {
          scoreinfo = studentInfo.GetScoreInfoBySems(x.Semester).GetBySubj(x.Subject);
          scoreinfo.SubjName = x.Subject + this.RomanNumber[x.SubjLevel];
          scoreinfo.IsRequire = x.IsRequire === "true" ? "必" : "選";
          scoreinfo.Credit = x.Credit;
          scoreinfo.SemsSubScore = x.OrgScore;
          scoreinfo.SemsSubjPR = x.PR;
        } catch {
          console.log("有錯誤", x);
        }


      } else {
      }
    });
   // console.log("學期成績取得結束", this.TempDataSource);
  }

  /**
   * 取得已選ExamID
   */
  async GetSelectedExamID() {
    this.SelectedExams.forEach(exam => {
      this.SelectedExamID.push(exam.ExamID);
    });
  }

  /**
   * 確認checkBox 勾選數 並收集至array
   */
  checkCheckCount(): number {
    this.SelectClasses = [];
    this.allClassesGrade1.forEach(classInfo => {
      if (classInfo.Checked) {
        if (!this.SelectClasses.includes(classInfo)) {
          this.SelectClasses.push(classInfo);
        }
      }
    });
    return this.SelectClasses.length;
  }

  /**
   * 取得學校資訊
   */
  async GetSchoolInfo() {
    const resp = await this.dsaService.send("Statistics.GetSchoolInfo", {
    });

    this.CurrentSchoolYear = resp.result.school_year;
    this.CurrentSemester = resp.result.semester;
    // console.log("學校資訊 " + this.CurrentSchoolYear + this.CurrentSemester);
  }

  /*
   * 取得教師輔導班級
   */
  async GetCounselClass() {
    const resp = await this.dsaService.send("Statistics.GetClassGrade1", {
      Request: {}
    }); // 取得資料

    [].concat(resp.ClassInfoes || []).forEach(counselClass => {
      const classInfo: CounselClass = new CounselClass();
      classInfo.GradeYear = counselClass.GradeYear;
      classInfo.ClassName = counselClass.ClassName;
      classInfo.ClassID = counselClass.ClassID;
      classInfo.Checked = false;
      this.allClassesGrade1.push(classInfo);
    });
  }

  /**
   * 取得心理測驗資料
   */
  async GetQuizDate(classID: string) {
    const QuizName: string = this.quizNames.join("','");
    const resp = await this.dsaService.send("Statistics.GetQuizDataByClassAndQuiz", {
      Request: {
        StrClassID: classID,
        QuizName: QuizName
      }
    });

    // 整理資料
    [].concat(resp.StudentQuizData || []).forEach(quizInfo => {
      let studentInfo;
      if (this.TempDataSource.has(quizInfo.StudentID)) {
        studentInfo = this.TempDataSource.get(quizInfo.StudentID);
        if (!studentInfo.QuizData.has(quizInfo.QuizName)) {
          const quizFieldInfos = new QuizFieldInfos();
          studentInfo.QuizData.set(quizInfo.QuizName, quizFieldInfos); // 加進裡面
        } if (!studentInfo.QuizData.get(quizInfo.QuizName).GetByFieldName(quizInfo.FieldName)) { // 如果可沒有個field 就加進去

          let _quizInfo = quizInfo.FieldName;
          if (quizInfo.FieldName.includes("Ⅰ")) {
            _quizInfo = quizInfo.FieldName.replace("Ⅰ", '1');
          }
          if (quizInfo.FieldName.includes("Ⅱ")) {
            _quizInfo = quizInfo.FieldName.replace("Ⅱ", '2');
          }
          studentInfo.QuizData.get(quizInfo.QuizName).Add(_quizInfo, quizInfo.Value);
        }
      }
    });
  }


  /**
   *取的預產出之OutPutData
   *
   */
  async GetOutPutData(classID: string) {
    // 將中間資料(有清楚結構轉成)
    this.OutPutData = [];
    this.TempDataSource.forEach(scoreInfoByStudent => { // 某學生下
      const groupSelectAnyls = new GroupSelectAnyls();

      groupSelectAnyls["SchoolYear"] = this.CurrentSchoolYear; // 1.當前學年度
      groupSelectAnyls["Semester"] = this.CurrentSemester; // 2.當前學期
      groupSelectAnyls["StudentName"] = scoreInfoByStudent.StudentName;
      groupSelectAnyls["ClassTeacher"] = scoreInfoByStudent.ClassTeacher;
      groupSelectAnyls["ClassName"] = scoreInfoByStudent.ClassName;
      groupSelectAnyls["SeatNo"] = scoreInfoByStudent.SeatNo;
      groupSelectAnyls["SecondSchoolYear"] = this.CurrentSchoolYear;
      groupSelectAnyls["FirstSchoolYear"] = this.CurrentSchoolYear ;
      groupSelectAnyls["GroupSelectProvDate"] = this.privideDate || "";
      groupSelectAnyls["Signdeadline"] = this.signLimitData || "";
      groupSelectAnyls["HomeTeacherReturn"] = this.homeTeacherReturn || "";
      // 裝成績資料
      scoreInfoByStudent.GetMapSocreInfos().forEach((scoreInfoBySemes, semester) => { // 這學期
        const subjNum: Number = 1;
        const subjLimit: Number = 30;
        // 處理學年度學期
        if (scoreInfoBySemes.SchoolYear !== this.CurrentSchoolYear && !groupSelectAnyls["FirstSchoolYear"]) {
          groupSelectAnyls["FirstSchoolYear"] = scoreInfoBySemes.SchoolYear ;
        }
        try {

          const _scoreInfos = scoreInfoBySemes.GetAllScInfoSubj(); // 某學期下各科
          for (let i = 1; i <= subjLimit; i++) {

            this.Columns.forEach(col => {
              const key: string = "Sems" + semester + "_subj" + (i) + "_" + col; // 組成attribute 名稱
              groupSelectAnyls[key] = "";
              if (i <= (_scoreInfos.size)) {
                groupSelectAnyls[key] = _scoreInfos.get(Array.from(_scoreInfos.keys())[i - 1])[col] ?
                  _scoreInfos.get(Array.from(_scoreInfos.keys())[i - 1])[col] : ""; // 1.放入科目
              } else {
                groupSelectAnyls[key] = "";
              }
            });
          }
        } catch (Exception) {
          console.log("Exception", Exception);
        }
      });

      // 裝心理測驗
      scoreInfoByStudent.GetMapQuizData().forEach((quizData, quizName) => {
        const field = quizData.GetAll();
        if (quizName === "大考中心興趣量表") {
          groupSelectAnyls["大考中心興趣量表_抓週代碼"] = field.get("抓週第一碼") + field.get("抓週第二碼") + field.get("抓週第三碼");
        }
        quizData.GetAll().forEach((value, fieldName) => {
          const quizkey = quizName + "_" + fieldName;
          groupSelectAnyls[quizkey] = value;
        });
      });
      this.OutPutData.push(groupSelectAnyls);
    });

  }

  /**
   * 實做Double click 時也可以 加入
   */
  dblclickMove(event)
  {
    console.log("event", event);
  }

  /**
   *拖拉時
   */
  drop(event: CdkDragDrop<string[]>) {

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      if (event.container.id === "selected" && event.container.data.length === 3) {// 如果右邊大於三
      } else {
        transferArrayItem(event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex);
      }
    }
  }
}

