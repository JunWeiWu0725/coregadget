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
  isSelectAllQuestions: Boolean = false;
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
  currentStep: number = 1; // 當前步驟
  
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
   * 取得已選擇的題目數量（即時計算）
   */
  GetSelectedQuestionCount(): number {
    let count = 0;
    [].concat(Array.from(this.QuestionSubjectMap.values())).forEach((questionSubject: QuestionSubject) => {
      [].concat(Array.from(questionSubject.QuestionGroupMap.values())).forEach((quesitonGroup: QuestionGroup) => {
        // 如果 Group 是最底层（没有 Query），且被选中，计入计数
        if (quesitonGroup.GetQuestionQuerys().length === 0 && quesitonGroup.IsChecked) {
          count++;
        }
        [].concat(Array.from(quesitonGroup.QuestionQueryMap.values())).forEach((questionQuery: QuestionQuery) => {
          // Query 总是可以勾选，如果被选中且没有子项，计入计数
          // 如果有子项，只计算子项，不重复计算 Query 本身
          if (questionQuery.IsChecked && (!questionQuery.hasChild || questionQuery.GetQuestionText().length === 0)) {
            count++;
          }
          [].concat(Array.from(questionQuery.QuestionTextMap.values())).forEach((questionText: QuestionText) => {
            if (questionText.IsChecked) {
              count++;
            }
          });
        });
      });
    });
    return count;
  }

  /**
   * 取得已選擇的班級數量
   */
  GetSelectedClassCount(): number {
    if (!this.SelectGradeYearList) {
      return 0;
    }
    let count = 0;
    this.SelectGradeYearList.forEach(item => {
      item.ClassItems.forEach(classItem => {
        if (classItem.Checked) {
          count++;
        }
      });
    });
    return count;
  }

  /**
   * 取得指定年級已選擇的班級數量
   */
  getGradeSelectedCount(gradeItem: any): number {
    if (!gradeItem || !gradeItem.ClassItems) {
      return 0;
    }
    return gradeItem.ClassItems.filter((item: any) => item.Checked).length;
  }

  /**
   * 下一步
   */
  nextStep() {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  /**
   * 上一步
   */
  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  /**
   * 切換到指定步驟
   */
  goToStep(step: number) {
    this.currentStep = step;
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
    // 1. 取得當前學年度學期
    const resp = await this.dsaService.send("GetCurrentSemester", {
      Request: {
      }
    });

    const Semesters = [].concat(resp.CurrentSemester || []);
    if (Semesters.length > 0) {
      this.SelectSchoolYear = +(Semesters[0].SchoolYear);
      this.SelectSemester = +(Semesters[0].Semester);
    }

    // 2. 取得所有可用的學年度學期
    try {
      const schoolYearResp = await this.dsaService.send("ComprehensiveRecordForm.GetComprehensiveRecordSchoolSemester");
      const semesterList = [].concat(schoolYearResp.SemesterInfo || []);
      
      // 提取所有學年度並去重、排序
      const schoolYears = [...new Set(semesterList.map(item => Number(item.SchoolYear)))];
      this.SchoolYears = schoolYears.sort((a, b) => b - a); // 降序，最新在前
      
      // 如果當前學年度不在清單中，加入當前學年度
      if (!this.SchoolYears.includes(Number(this.SelectSchoolYear))) {
        this.SchoolYears.unshift(Number(this.SelectSchoolYear));
      }

      // 預設選中最大的學年度（最新的學年度）
      if (this.SchoolYears.length > 0) {
        this.SelectSchoolYear = this.SchoolYears[0]; // 第一個就是最大的（因為降序排列）
      }
    } catch (error) {
      console.warn('無法取得綜合紀錄表學年度學期，使用預設邏輯', error);
      // 如果 API 失敗，回到原本的邏輯
      this.SchoolYears = [Number(this.SelectSchoolYear)];
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
            '學生系統編號': item.student_id || "",
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
   * 取得 Group 的标题（优先使用 GroupText，如果没有则使用第一个 QueryText）
   *
   * @param {QuestionGroup} group
   * @returns {string}
   * @memberof ComprehensiveDataExportComponent
   */
  public getGroupTitle(group: QuestionGroup): string {
    if (group.GroupText && group.GroupText.trim() !== '') {
      return group.GroupText;
    }
    const queries = group.GetQuestionQuerys();
    if (queries && queries.length > 0 && queries[0].QueryText && queries[0].QueryText.trim() !== '') {
      return queries[0].QueryText;
    }
    return '';
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
    if (!target.IsChecked) {
      target.CheckChildIsChecked(target.IsChecked);
    } else {
      target.CheckChildIsChecked(target.IsChecked);
    }
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

  /**
   * 全選/取消全選所有題目
   *
   * @memberof ComprehensiveDataExportComponent
   */
  SetSelectAllQuestions() {
    this.isSelectAllQuestions = !this.isSelectAllQuestions;
    [].concat(Array.from(this.QuestionSubjectMap.values())).forEach((questionSubject: QuestionSubject) => {
      questionSubject.CheckChildIsChecked(!this.isSelectAllQuestions);
    });
  }

  /**
   * 產生報表2 - 題目放在最上面那一列，題目階層用冒號分隔
   */
  async MakeReportVision2() {
    console.log('🎯🎯🎯 MakeReportVision2 開始執行！🎯🎯🎯');
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
    // 收集選中的題目資訊（包含階層資訊）
    let selectedQuestions: Array<{
      QuestionCode: string;
      QuestionSubject: string;
      QuestionGroup: string;
      QuestionQuery: string;
      QuestionText: string;
      QuestionTitle: string; // 用冒號分隔的完整標題
    }> = [];

    // 整理資料
    const questionCodeSet = new Set<string>(); // 用 Set 來追蹤已加入的 QuestionCode
    [].concat(Array.from(this.QuestionSubjectMap.values())).forEach((questionSubject: QuestionSubject) => {
      [].concat(Array.from(questionSubject.QuestionGroupMap.values())).forEach((quesitonGroup: QuestionGroup) => {
        [].concat(Array.from(quesitonGroup.QuestionQueryMap.values())).forEach((questionQuery: QuestionQuery) => {
          [].concat(Array.from(questionQuery.QuestionTextMap.values())).forEach((questionText: QuestionText) => {
            if (questionText.IsChecked) {
              // 🔍 檢查是否有重複的 QuestionCode
              if (!questionCodeSet.has(questionText.QuestionCode)) {
                questionCodeSet.add(questionText.QuestionCode);
                this.SelectQuestionCodes.push(questionText.QuestionCode);
                // 建立題目標題（用冒號分隔階層）
                const questionTitle = `${questionSubject.SubjectText}:${quesitonGroup.GroupText}:${questionQuery.QueryText}:${questionText.QuestionText}`;
                selectedQuestions.push({
                  QuestionCode: questionText.QuestionCode,
                  QuestionSubject: questionSubject.SubjectText,
                  QuestionGroup: quesitonGroup.GroupText,
                  QuestionQuery: questionQuery.QueryText,
                  QuestionText: questionText.QuestionText,
                  QuestionTitle: questionTitle
                });
              }
            }
          });
        });
      });
    });
    
    console.log('選中的 QuestionCode 列表:', this.SelectQuestionCodes);
    
    // 🔍 檢查 selectedQuestions 中是否有重複的 QuestionCode
    const duplicateQuestionCodes = selectedQuestions.filter((q, index, self) => 
      index !== self.findIndex(t => t.QuestionCode === q.QuestionCode)
    );
    if (duplicateQuestionCodes.length > 0) {
      console.error('❌ selectedQuestions 中有重複的 QuestionCode:', duplicateQuestionCodes);
    }

    if (this.SelectQuestionCodes.length === 0) {
      alert("請選擇題目！");
      chkDataPass = false;
    }

    if (chkDataPass) {
      this.GenReportVision2(selectedQuestions); 
   
    }
  }

  /**
   * 產生報表2 - 實際產生Excel
   */
  async GenReportVision2(selectedQuestions: Array<{
    QuestionCode: string;
    QuestionSubject: string;
    QuestionGroup: string;
    QuestionQuery: string;
    QuestionText: string;
    QuestionTitle: string;
  }>) {
    console.log('🚀🚀🚀 GenReportVision2 開始執行！🚀🚀🚀');
    console.log('selectedQuestions 數量:', selectedQuestions.length);
    this.IsWorking = true;
    let wsName: string = "填寫內容";
    let fileName: string = wsName + ".xlsx";
    try {
      const QuestionDataStr = "'" + this.SelectQuestionCodes.join("','") + "'";
      const resp = await this.dsaService.send("Comprehensive_statistics.GetComperhensiveData", {
        Request: {
          SchoolYear: this.SelectSchoolYear,
          Semester: this.SelectSemester,
          QuestionDataStr: QuestionDataStr,
          ClassIDs: this.selectClassIDs.join(",")
        }
      });

      const QuestionDatas = [].concat(resp.QuestionData || []);
      
      // 🔍 重要！檢查從資料庫回傳的原始資料
      console.log('🔍🔍🔍 === 資料庫原始資料檢查 === 🔍🔍🔍');
      console.log('資料總筆數:', QuestionDatas.length);
      
      if (QuestionDatas.length > 0) {
        console.log('🔍 所有欄位名稱:', Object.keys(QuestionDatas[0]));
        console.log('🔍 第一筆完整資料:', QuestionDatas[0]);
        console.log('🔍 student_id 值:', QuestionDatas[0].StudentID);
        
        // 🔍 特別檢查 AnswerValue 的原始格式
        console.log('🔍🔍🔍 === AnswerValue 原始資料分析 === 🔍🔍🔍');
        
        // 🔍 檢查是否有包含「公斤」的答案
        const kgAnswers = QuestionDatas.filter(item => 
          item.AnswerValue && item.AnswerValue.includes('公斤')
        );
        
        if (kgAnswers.length > 0) {
          alert(`⚠️ 發現 ${kgAnswers.length} 個包含「公斤」的答案！\n\n範例：\n${kgAnswers.slice(0, 3).map(item => 
            `學生：${item.StudentName}\n題目：${item.QuestionText}\n答案：${item.AnswerValue}`
          ).join('\n\n')}`);
          
          console.log('🚨🚨🚨 === 包含「公斤」的答案 === 🚨🚨🚨');
          kgAnswers.forEach((item, index) => {
            console.log(`🚨 [公斤答案 ${index + 1}]`, {
              '學生姓名': item.StudentName,
              '題目代碼': item.QuestionCode,
              '題目': `${item.QuestionSubject}-${item.QuestionGroup}-${item.QuestionQuery}-${item.QuestionText}`,
              '答案': item.AnswerValue
            });
          });
        }
        
        QuestionDatas.slice(0, 10).forEach((item, index) => {
          console.log(`🔍 [資料庫原始 ${index + 1}]`, {
            '學生姓名': item.StudentName,
            '題目代碼': item.QuestionCode,
            '題目主題': item.QuestionSubject,
            '題目群組': item.QuestionGroup,
            '題目查詢': item.QuestionQuery,
            '題目文字': item.QuestionText,
            '原始答案': item.AnswerValue,
            '答案類型': typeof item.AnswerValue,
            '答案長度': item.AnswerValue ? item.AnswerValue.length : 0,
            '包含民國': item.AnswerValue ? item.AnswerValue.includes('民國') : false,
            '包含年': item.AnswerValue ? item.AnswerValue.includes('年') : false,
            '包含公斤': item.AnswerValue ? item.AnswerValue.includes('公斤') : false,
            '答案字符分析': item.AnswerValue ? item.AnswerValue.split('').map(char => `${char}(${char.charCodeAt(0)})`) : []
          });
        });
      }
      
      // 檢查 AnswerValue 本身是否包含重複值
      const duplicateAnswers = QuestionDatas.filter(item => {
        if (!item.AnswerValue) return false;
        const values = item.AnswerValue.split('、');
        return values.length > 1 && values[0] === values[1];
      });
      
      if (QuestionDatas.length > 0) {
        // 建立學生資料Map，key為學號
        const studentDataMap: Map<string, {
          StudentSystemID?: string;
          StudentNumber: string;
          ClassName: string;
          SeatNo: number;
          StudentName: string;
          Gender: string;
          Answers: Map<string, string>; // key: QuestionCode, value: AnswerValue
        }> = new Map();

        // 整理資料：將答案按學生分組
        // 使用組合鍵確保學生唯一性：優先使用 StudentSystemID，其次使用 班級+學號+座號 的組合
        let processCount = 0;
        QuestionDatas.forEach(item => {
          processCount++;
          // 優先使用 student_id，如果沒有則使用組合鍵
          let studentKey: string;
          if (item.student_id) {
            studentKey = `SYS_${item.student_id}`;
          } else if (item.StudentNumber) {
            studentKey = `${item.ClassName}_${item.StudentNumber}_${item.SeatNo}`;
          } else {
            // 最後備選：使用班級+座號+姓名
            studentKey = `${item.ClassName}_${item.SeatNo}_${item.StudentName}`;
          }
          
          // 🔍 詳細追蹤：前10筆資料的處理過程
          
          if (!studentDataMap.has(studentKey)) {
            studentDataMap.set(studentKey, {
              StudentSystemID: item.StudentID || "",
              StudentNumber: item.StudentNumber || "",
              ClassName: item.ClassName || "",
              SeatNo: item.SeatNo || 0,
              StudentName: item.StudentName || "",
              Gender: item.Gender || "",
              Answers: new Map()
            });
          }
          
          const student = studentDataMap.get(studentKey);
          
          // 🔍 處理 AnswerValue：如果本身有重複值，先去除重複
          let processedAnswer = item.AnswerValue || "";
          
          // 🔍 詳細檢查答案內容和分隔符號
          if (processedAnswer && typeof processedAnswer === 'string') {
            // 檢查是否為純數字答案（如 "90"）
            const trimmedAnswer = processedAnswer.trim();
            const isSimpleNumber = /^\d+$/.test(trimmedAnswer);
            
          }
          
          if (processedAnswer && typeof processedAnswer === 'string' && processedAnswer.includes('、')) {
            try {
              // 分割答案，去除重複值
              const answerParts = processedAnswer.split('、').filter(part => part && part.trim() !== '');
              const uniqueAnswers = Array.from(new Set(answerParts)); // 使用 Set 去除重複
              processedAnswer = uniqueAnswers.join('、');
              
              // 如果處理後有變化，記錄下來
            } catch (err) {
              console.error(`處理 AnswerValue 時發生錯誤:`, err, '原始值:', item.AnswerValue);
              // 如果處理失敗，使用原始值
              processedAnswer = item.AnswerValue || "";
            }
          }
          
          // 🔍 檢查同一個題目是否已經有答案
          if (student.Answers.has(item.QuestionCode)) {
            const existingAnswer = student.Answers.get(item.QuestionCode);
            
            // 如果已有答案，只保留第一個（跳過重複記錄）
            // 不更新，保留原有的答案，跳過這筆重複的資料
            return; // 在 forEach 中，return 會跳過當前迭代
          }
          
          // 如果沒有重複，則設定答案
          student.Answers.set(item.QuestionCode, processedAnswer);
        });
        
        
        let duplicateAnswerCount = 0;
        studentDataMap.forEach((student, key) => {
          student.Answers.forEach((answer, questionCode) => {
            if (answer && answer.includes('、')) {
              const values = answer.split('、');
              // 檢查是否有重複值
              if (values.length > 1 && values[0] === values[1]) {
                duplicateAnswerCount++;
                if (duplicateAnswerCount <= 5) {
                  console.log(`⚠️ 發現重複答案 - 學生: ${student.StudentName}, 題目: ${questionCode}, 答案: "${answer}"`);
                }
              }
            }
          });
        });
        if (duplicateAnswerCount > 0) {
          console.warn(`總共有 ${duplicateAnswerCount} 個重複答案`);
        }

        // 建立Excel資料：第一行是標題
        const excelData: any[][] = [];
        
        // 第一行：標題行
        const headerRow: any[] = [
          '學生系統編號',
          '學號',
          '班級',
          '座號',
          '姓名'
        ];
        
        // 加入所有選中的題目標題（用冒號分隔階層）
        selectedQuestions.forEach(q => {
          headerRow.push(q.QuestionTitle);
        });
        
        excelData.push(headerRow);

        // 後續行：學生資料
        let excelRowCount = 0;
        studentDataMap.forEach((student, studentKey) => {
          excelRowCount++;
          const dataRow: any[] = [
            student.StudentSystemID || "",
            student.StudentNumber || "",
            student.ClassName || "",
            student.SeatNo || 0,
            student.StudentName || ""
          ];
          
          // 依選中題目的順序填入答案
          const usedQuestionCodes = new Set<string>(); // 追蹤已使用的 QuestionCode
          selectedQuestions.forEach((q, qIndex) => {
            // 🔍 檢查是否有重複的 QuestionCode
            usedQuestionCodes.add(q.QuestionCode);
            
            const answer = student.Answers.get(q.QuestionCode) || "";
            dataRow.push(answer);
            
          });
          
          excelData.push(dataRow);
        });
        
        console.log('Excel 前3行資料:', excelData.slice(0, 3));
        
        
        // 1. 檢查 selectedQuestions 中是否有重複的 QuestionCode
        const questionCodeCount = new Map<string, number>();
        selectedQuestions.forEach(q => {
          questionCodeCount.set(q.QuestionCode, (questionCodeCount.get(q.QuestionCode) || 0) + 1);
        });
        const duplicateQuestionCodes = Array.from(questionCodeCount.entries()).filter(([code, count]) => count > 1);
        

        // 產生Excel
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, ws, wsName);
        XLSX.writeFile(wb, fileName);

      } else {
        alert("沒有資料");
      }
    } catch (error) {
      console.error('=== 產生報表2時發生錯誤 ===', error);
      const errorMessage = error && error.message ? error.message : (error && error.toString ? error.toString() : JSON.stringify(error));
      alert(`發生錯誤: ${errorMessage}`);
      this.IsWorking = false;
    } finally {
      this.IsWorking = false;
    }
  }

  // 🔥 新增：數據分析方法
  async openChartAnalysis() {
    
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
