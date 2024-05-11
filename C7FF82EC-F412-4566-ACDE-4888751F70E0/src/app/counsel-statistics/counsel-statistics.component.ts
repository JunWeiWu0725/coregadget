import { Component, OnInit, Optional } from '@angular/core';
import { AppComponent } from "../app.component";
import { DsaService } from "../dsa.service";

import * as XLSX from 'xlsx';
import { concat } from 'rxjs';
import { _MatListItemMixinBase } from '@angular/material';
import { StudentQuizData } from '../psychological-test/PsychologicalTest-vo';
import * as moment from 'moment';
import { QuizInfoReport, ClassStudentCountReport } from './CounselStatistics-vo';

@Component({
  selector: 'app-counsel-statistics',
  templateUrl: './counsel-statistics.component.html',
  styleUrls: ['./counsel-statistics.component.css']
})
export class CounselStatisticsComponent implements OnInit {

  public coubselReferralVisible: boolean = false;

  ImplementationDate_Begin: string;
  ImplementationDate_End: string;
  reportNameList: string[];
  selectYear: number;
  selectMonth: number;
  selectReportType: string = '輔導工作月統計';
  reportTypeList: string[] = [];
  QuizInfoReportList: QuizInfoReport[] = [];
  ClassStudentCountReportList: ClassStudentCountReport[] = [];
  isPsyButtonDisable: boolean = false;
  constructor(
    @Optional()
    private appComponent: AppComponent, private dsaService: DsaService, ) { }

  ngOnInit() {
    this.coubselReferralVisible = false;

    if (gadget.params.system_counsel_position === 'referral') {
      this.coubselReferralVisible = true;
    }

    let dt = new Date();
    this.selectYear = dt.getFullYear();
    this.selectMonth = dt.getMonth() + 1;
    this.reportTypeList.push('輔導工作月統計');
    this.reportTypeList.push('導師輔導記錄');
    this.reportTypeList.push('服務項目總覽');
   
    this.reportTypeList.push('晤談記錄');
    if (this.coubselReferralVisible) {
      this.reportTypeList.push('轉介學生清單');
    }

    this.reportTypeList.push('各班導師晤談次數');
    this.reportTypeList.push('匯出填寫內容');


    if (gadget.params.groupAanalysisEnabled) {
      this.reportTypeList.push('選組分析表');
    }

    this.reportTypeList.push('綜合紀錄表');



    // this.reportTypeList.push('轉介學生名單');
    this.selectReportType = '輔導工作月統計';
    // this.reportTypeList.push('心理測驗結果分析');
    if (this.appComponent) {
      this.appComponent.currentComponent = "counsel_statistics";
    }

    this.ImplementationDate_Begin = moment().format('YYYY-MM-DD');
    this.ImplementationDate_End = moment().format('YYYY-MM-DD');
    //this.reportNameList.push("新北市國民中小輔導當月個案");
  }






  // 心測功能檢查值
  async psyCheckValue() {
    this.QuizInfoReportList = await this.loadQuziInfoReportByImplementationDate();
  }

  // 產生心理測驗報表
  async psyExportReport(item: QuizInfoReport) {
    this.isPsyButtonDisable = true;
    this.ReportCPMP_P(item);

  }

  async ReportCPMP_P(item: QuizInfoReport) {
    this.ClassStudentCountReportList = [];
    let respClass = await this.dsaService.send("GetClassStudetCountByQuizID", {
      Request: {
        QuizID: item.QuizID,
        ImplementationDate: item.ImplementationDateStr
      }
    });

    let dataClass = [].concat(respClass.ClassStudentCount || []);
    if (dataClass && dataClass.length > 0) {
      dataClass.forEach(classItem => {
        let csr: ClassStudentCountReport = new ClassStudentCountReport();
        csr.ClassID = classItem.class_id;
        csr.ClassName = classItem.class_name;
        csr.StudentCount = parseInt(classItem.student_count);
        csr.GradeYear = parseInt(classItem.grade_year);
        this.ClassStudentCountReportList.push(csr);
      });

      // const stus1 = new Map<number, any>();
      // stus1.set(123, {});
      // stus1.get(123).name = 'xxx';
      // stus1.
      // let stus: any = {};

      // if (!stus['123']) {
      //   stus['123'] = {};
      //   stus['123'].id = 123;
      //   stus['123'].name = 'yyy';
      //   stus['123'].subjects = [];
      // };

      // let stu: any = stus['123'];


      // stu.subjects.push({
      //   name: '',
      //   score: 90
      // });

      // stus.123.name

      // stu.456.name

      // const output = [];
      // for(const id of Object.getOwnPropertyNames(stus)) {
      //   output.push(stus[id]);
      // }


      // stu[0].name 
      // stu[1].name 

    }



    // 讀取這次測驗資料用來分析
    let respStud = await this.dsaService.send("GetQuizStudentDataByQuizID", {
      Request: {
        QuizID: item.QuizID,
        ImplementationDate: item.ImplementationDateStr
      }
    });

    let dataStud = [].concat(respStud.QuizStudentData || []);
    if (dataStud && dataStud.length > 0) {
      dataStud.forEach(studItem => {
        this.ClassStudentCountReportList.forEach(classItem => {
          if (studItem.class_id === classItem.ClassID) {
            classItem.StudentDataSource.push(studItem);
          }
        });
      });
    }

    // 解析資料
    this.ClassStudentCountReportList.forEach(classItem => {
      classItem.CalcCPM_P();
    });


    if (this.ClassStudentCountReportList.length > 0) {
      // 產生報表
      let wsName: string = "CPMP_P結果分析";
      let fileName: string = wsName + ".xlsx";
      let rowIdx: number = 1;
      // 總人數
      let TotalStudeCount: number = 0;
      let data1: any[] = [];
      this.ClassStudentCountReportList.forEach(classItem => {
        let item = {
          '班級': classItem.ClassName,
          '年級': classItem.GradeYear,
          '學生人數': classItem.StudentCount,
          '智能優異(PR＞=95)_人數': classItem.ItemCountList[0].Count,
          '智能優異(PR＞=95)_百分比': classItem.ItemCountList[0].pst,
          '智能在平均數以上(PR >=90 且 PR＜95)_人數': classItem.ItemCountList[1].Count,
          '智能在平均數以上(PR >=90 且 PR＜95)_百分比': classItem.ItemCountList[1].pst,
          '智能在平均數以上(PR >=75 且 PR＜90)_人數': classItem.ItemCountList[2].Count,
          '智能在平均數以上(PR >=75 且 PR＜90)_百分比': classItem.ItemCountList[2].pst,
          '平均智能(PR >=25 且 PR＜75)_人數': classItem.ItemCountList[3].Count,
          '平均智能(PR >=25 且 PR＜75)_百分比': classItem.ItemCountList[3].pst,
          '智能在平均數以下(PR >=5 且 PR＜25)_人數': classItem.ItemCountList[4].Count,
          '智能在平均數以下(PR >=5 且 PR＜25)_百分比': classItem.ItemCountList[4].pst,
          '智能缺陷(PR＜5)_人數': classItem.ItemCountList[5].Count,
          '智能缺陷(PR＜5)_百分比': classItem.ItemCountList[5].pst,
        };
        TotalStudeCount += classItem.StudentCount;
        rowIdx++;
        data1.push(item);
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data1, { header: [], cellDates: true, dateNF: 'yyyy-mm-dd hh:mm:ss', });

      //XLSX.utils.sheet_add_json(ws,[{A:1,B:2},{A:6,B:7,C:10}],{skipHeader: true,origin: "A40"});

      XLSX.utils.sheet_add_json(ws, [{ A: '總人數：', B: TotalStudeCount }], { skipHeader: true, origin: { r: (rowIdx + 1), c: 1 } });



      XLSX.utils.book_append_sheet(wb, ws, wsName);
      //XLSX.write(wb,{type:'buffer',bookType:'xlsx'});
      XLSX.writeFile(wb, fileName);
    }

    this.isPsyButtonDisable = false;

  }

  SetSelectReportType(name: string) {
    this.selectReportType = name;


  }

  // 透過實施開始結束取得測驗試別
  async loadQuziInfoReportByImplementationDate() {
    let resp = await this.dsaService.send("GetQuizNameByImplementationDate", {
      Request: {
        BeginDate: this.ImplementationDate_Begin,
        EndDate: this.ImplementationDate_End
      }
    });

    let value: QuizInfoReport[] = [];
    let data = [].concat(resp.QuizName || []);
    if (data && data.length > 0) {
      data.forEach(item => {
        let da: QuizInfoReport = new QuizInfoReport();
        da.QuizID = item.quiz_id;
        da.QuizName = item.quiz_name;
        da.ImplementationDate = moment(item.implementation_date);
        da.ImplementationDateStr = da.ImplementationDate.format('YYYY-MM-DD');
        da.UseMappingTable = false;
        if (item.use_mapping_table === 't')
          da.UseMappingTable = true;
        value.push(da);
      });
    }
    return value;
  }

}

