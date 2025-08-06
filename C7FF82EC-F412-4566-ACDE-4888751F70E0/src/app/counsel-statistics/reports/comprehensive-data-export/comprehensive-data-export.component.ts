import { Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import * as XLSX from 'xlsx';
import { DsaService } from 'src/app/dsa.service';
import { CounselClass } from '../../CounselStatistics-vo';
import { GradeClassInfo } from 'src/app/admin/counsel-class/counsel-class-vo';
import { SectionInfo, QuestionSubject, QuestionGroup, QuestionInfo, QuestionText, QuestionQuery } from './comprehensive-data-export-vo';
import { ChartModalComponent } from '../counsel-interview-report/chart-modal/chart-modal.component';





@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-comprehensive-data-export',
  templateUrl: './comprehensive-data-export.component.html',
  styleUrls: ['./comprehensive-data-export.component.css']
})
export class ComprehensiveDataExportComponent implements OnInit {
  isLoading = false; // 是否有在loading
  panelOpenState = false;
  SelectGradeYearList: any[];
  tmpGradeYear: any[];
  tmpClass: any[];
  isSelectAllItem: Boolean = false;
  detailShow: boolean;

  fillInSection: any[] = [];
  QuestionSubjectMap: Map<string, QuestionSubject> = new Map<string, QuestionSubject>();
  SelectQuestionCodes: string[] = [];

  SelectSchoolYear: Number;
  SchoolYears: Number[] = [];
  SelectSemester: number;
  selectClassIDs: string[];
  ShowQuestionTab: boolean;
  SelectSections: SectionInfo[] = [];
  SelectSection: SectionInfo;
  IsWorking: boolean = false;
  
  @ViewChild('chartModal') chartModal: ChartModalComponent;


  constructor(private dsaService: DsaService) {
  }

  async ngOnInit() {
    await this.getCurrentSemester();
    await this.GetClasses();
    await this.reloadSectionInfo();
  }

  /**
  * 取得QuestionMap
  */
  GetQuestionSubjectMapValue(): QuestionSubject[] {
    return Array.from(this.QuestionSubjectMap.values());
  }

  /**
   *取得SectionID
  */
  async LoadSectionData() {
    const resp = await this.dsaService.send("Comprehensive_statistics.GetSectionInfo", {
      Request: {
        SchoolYear: this.SelectSchoolYear,
        Semester: this.SelectSemester
      }
    });
    this.SelectSections = [];
    const SectionInfos: SectionInfo[] = [].concat(resp.SectionInfo);
    SectionInfos.forEach(section => {
      this.SelectSections.push(section);
    });

    this.SelectSection = this.SelectSections[0];
  }

  /**
   * 重載section quetion
   */
  async reloadSectionInfo() {
    if (!this.SelectSchoolYear || !this.SelectSemester) {
      return;
    }
    await this.LoadSectionData();
    await this.LoadngQuestionData();
  }



  // 取得系統內目前學年度學期
  async getCurrentSemester() {
    const resp = await this.dsaService.send("GetCurrentSemester", {
      Request: {
      }
    });

    const Semesters = [].concat(resp.CurrentSemester || []);
    if (Semesters.length > 0) {
      this.SelectSchoolYear = +(Semesters[0].SchoolYear);
      this.SelectSemester = +(Semesters[0].Semester);
    }

    let i: number = 0;
    while (i <= 2) {
      this.SchoolYears.push(Number(this.SelectSchoolYear) - i);
      i++;
    }
  }
  /*
  *
 * 畫面初始化
 *  @memberof ComprehensiveDataExportComponent
 */
  async LoadngQuestionData() {
    this.QuestionSubjectMap.clear();
    if (!this.SelectSection) {
      return;
    }
    const resp = await this.dsaService.send("Comprehensive_statistics.GetComprehensiveQuestion", {
      Request: {
        SchoolYear: this.SelectSchoolYear,
        Semester: this.SelectSemester,
        SectionID: this.SelectSection.SectionID
      }
    });
    const QuestionInfos: QuestionInfo[] = resp.Question;
    // 整理資料
    [].concat(QuestionInfos).forEach(questionInfos => {
      const subjectName: string = questionInfos.QuestionSubject;
      const groupName = questionInfos.QuestionGroup;
      const queryName = questionInfos.QuestionQuery;
      const questionText = questionInfos.QuestionText;

      if (!this.QuestionSubjectMap.has(subjectName)) {
        this.QuestionSubjectMap.set(subjectName, new QuestionSubject(questionInfos));
      } else {
        // 已經有
        const questionSubject: QuestionSubject = this.QuestionSubjectMap.get(subjectName);
        questionSubject.AddGroup(questionInfos);
      }
    });

  }

  async MakeReport() {
    let chkDataPass: boolean = true;
    // 確認所選班級
    this.selectClassIDs = [];
    this.SelectGradeYearList.forEach(item => {
      item.ClassItems.forEach(classItem => {
        if (classItem.Checked) {
          this.selectClassIDs.push(classItem.ClassID);
        }
      });
    });
    // 驗證
    if (this.selectClassIDs.length === 0) {
      alert("請選擇班級！");
      chkDataPass = false;
    }
    this.SelectQuestionCodes = [];
    // 整理資料
    [].concat(Array.from(this.QuestionSubjectMap.values())).forEach((questionSubject: QuestionSubject) => {
      [].concat(Array.from(questionSubject.QuestionGroupMap.values())).forEach((quesitonGroup: QuestionGroup) => {
        [].concat(Array.from(quesitonGroup.QuestionQueryMap.values())).forEach((questionQuery: QuestionQuery) => {
          [].concat(Array.from(questionQuery.QuestionTextMap.values())).forEach((questionText: QuestionText) => {
            if (!this.SelectQuestionCodes.includes(questionText.QuestionCode)) {
              if (questionText.IsChecked) {
                this.SelectQuestionCodes.push(questionText.QuestionCode);
              }
            }
          });
        });
      });
    });
    ;

    if (this.SelectQuestionCodes.length === 0) {
      alert("請選擇題目！");
      chkDataPass = false;
    }
    if (this.SelectQuestionCodes.length > 10) {
      alert("題目超過10題！");
      chkDataPass = false;
    }

    if (chkDataPass) {
      this.GenReport();
    }
  }

  /**
  * 產生報表
  */
  async GenReport() {
    this.IsWorking = true;
    // 開始填入EXCEL
    let wsName: string = "填寫內容";
    let fileName: string = wsName + ".xlsx";
    try {
      const QuestionDataStr = "'" + this.SelectQuestionCodes.join("','") + "'";
      const classISstr = this.selectClassIDs.join(",");
      const resp = await this.dsaService.send("Comprehensive_statistics.GetComperhensiveData", {
        Request: {
          SchoolYear: this.SelectSchoolYear,
          Semester: this.SelectSemester,
          QuestionDataStr: QuestionDataStr,
          ClassIDs: this.selectClassIDs.join(",")
        }
      });

      let data1: any[] = [];
      const QuestionDatas = [].concat(resp.QuestionData || []);
      if (QuestionDatas.length > 0) {
        QuestionDatas.forEach(item => {
          let item1 = {

            '班級': item.ClassName || "",
            '座號': item.SeatNo,
            '學號': item.StudentNumber,
            '姓名': item.StudentName,
            '性別': item.Gender,
            '題目': `${item.QuestionSubject}-${item.QuestionGroup}-${item.QuestionQuery}-${item.QuestionText}`,
            '答案': item.AnswerValue,
            '題型': item.QuestionType

          };
          data1.push(item1);

        });
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data1, { header: [], cellDates: true, dateNF: 'yyyy-mm-dd hh:mm:ss', });
        XLSX.utils.book_append_sheet(wb, ws, wsName);
        //XLSX.write(wb,{type:'buffer',bookType:'xlsx'});
        XLSX.writeFile(wb, fileName);

      } else {
        alert("沒有資料");
      }
    } catch
    {
      alert("資料量過大，發生錯誤!");
    } finally {
      this.IsWorking = false;
    }
  }


  /**
   * 點選 Subject
   * @param {QuestionGroup} target
   * @memberof ComprehensiveDataExportComponent
   */
  public selectSubject(target: QuestionSubject) {
    if (!target.IsChecked) {
      target.CheckChildIsChecked(target.IsChecked);

    } else {

      target.CheckChildIsChecked(target.IsChecked);
    }
  }
  /**
   *點選 Group
   *
   * @param {QuestionGroup} target
   * @memberof ComprehensiveDataExportComponent
   */
  public selectGroup(target: QuestionGroup) {

    if (!target.IsChecked) {
      target.CheckChildIsChecked(target.IsChecked);

    } else {

      target.CheckChildIsChecked(target.IsChecked);
    }
  }

  public selectQuery(target: QuestionQuery) {


    target.CheckChildIsChecked(target.IsChecked);

  }

  public selectQuestionText(target: QuestionText) {

    if (!target.IsChecked) {
      target.CheckChildIsChecked(target.IsChecked);

    } else {

      target.CheckChildIsChecked(target.IsChecked);
    }
  }
  // 取得教師輔導班級
  /**
   * 取得班級
   */
  async GetClasses() {
    this.SelectGradeYearList = [];
    this.tmpClass = [];
    this.tmpGradeYear = [];
    try {
      const resp = await this.dsaService.send("Comprehensive_statistics.GetClassAndGrade", {
        Request: {}
      });

      [].concat(resp.Classes || []).forEach(counselClass => {

        let gryear: number;
        gryear = 999; // 沒有年級
        if (counselClass.GradeYear) {
          gryear = parseInt(counselClass.GradeYear);
        }

        const CClass: CounselClass = new CounselClass();
        CClass.GradeYear = gryear;

        CClass.id = 'class_' + counselClass.ClassID;
        CClass.ClassName = counselClass.ClassName;
        CClass.ClassID = counselClass.ClassID;
        CClass.Checked = false;
        this.tmpClass.push(CClass);
        if (!this.tmpGradeYear.includes(gryear)) {
          this.tmpGradeYear.push(gryear);
        }

      });
      // 整理資料
      this.tmpGradeYear.forEach(gr => {
        const grClass: GradeClassInfo = new GradeClassInfo();
        grClass.GradeYear = gr;
        if (grClass.GradeYear === 999) {
          grClass.GradeYearStr = '未分年級';
        } else {
          grClass.GradeYearStr = gr + ' 年級';
        }
        grClass.id = 'grade_' + gr;
        grClass.Checked = false;
        grClass.ClassItems = this.tmpClass.filter(x => x.GradeYear === gr);
        this.SelectGradeYearList.push(grClass);
      });

    } catch (err) {
      alert(err);
    }
  }


  /**
   * 取得年級
   *
   * @param {number} gradeYear
   * @memberof ComprehensiveDataExportComponent
   */
  SetSelectGradeItem(gradeYear: number) {
    this.SelectGradeYearList.forEach(item => {

      if (item.GradeYear === gradeYear) {
        item.Checked = !item.Checked;
        item.ClassItems.forEach(classItem => {
          classItem.Checked = item.Checked;
        });
      }
    });
  }

  /**
   *取得所有
   *
   * @memberof ComprehensiveDataExportComponent
   */
  SetSelectAllItem() {
    this.isSelectAllItem = !this.isSelectAllItem;
    this.SelectGradeYearList.forEach(item => {
      item.Checked = this.isSelectAllItem;
      item.ClassItems.forEach(classItem => {
        classItem.Checked = this.isSelectAllItem;
      });
    });
  }

  // 🔥 新增：數據分析方法
  async openChartAnalysis() {
    console.log('=== 開始綜合數據分析 ===');
    
    // 收集選中的班級ID
    this.selectClassIDs = [];
    this.SelectGradeYearList.forEach(item => {
      item.ClassItems.forEach(classItem => {
        if (classItem.Checked) {
          this.selectClassIDs.push(classItem.ClassID);
        }
      });
    });

    if (this.selectClassIDs.length === 0) {
      alert("請先選擇班級！");
      return;
    }

    try {
      // 設置日期範圍（當前學年度學期）
      const now = new Date();
      const startDate = `${this.SelectSchoolYear}-08-01 00:00:00`;
      const endDate = `${this.SelectSchoolYear}-07-31 23:59:59`;

      console.log('綜合數據分析參數:', {
        StartDate: startDate,
        EndDate: endDate,
        ClassIDs: this.selectClassIDs,
        SchoolYear: this.SelectSchoolYear,
        Semester: this.SelectSemester
      });

      let resp = await this.dsaService.send("GetCounselInterviewReport1", {
        Request: {
          StartDate: startDate,
          EndDate: endDate,
          ClassIDs: this.selectClassIDs
        }
      });

      console.log('API 完整回應:', resp);
      let data = [].concat(resp.CounselInterview || []);
      console.log('提取的 CounselInterview 資料:', data);
      console.log('資料筆數:', data.length);
      
      if (data.length > 0) {
        console.log('第一筆資料範例:', data[0]);
        this.chartModal.open(data);
      } else {
        console.log('沒有資料');
        alert("選定班級在當前學年度沒有輔導資料可進行數據分析");
      }
    } catch (error) {
      console.error('API 錯誤:', error);
      alert(error.dsaError ? error.dsaError.message : '無法取得數據分析資料');
    }
  }










}
