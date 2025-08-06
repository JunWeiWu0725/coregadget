import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material';
import { DsaService } from 'src/app/dsa.service';
import { GlobalService } from 'src/app/global.service';
import * as XLSX from 'xlsx';
import { CounselStudentService } from 'src/app/counsel-student.service';
import { ChartModalComponent } from './chart-modal/chart-modal.component';
import { CounselClass, GradeClassInfo } from '../../CounselStatistics-vo';
import * as moment from 'moment';
import { ChartAnalysisService, ChartAnalysisConfig, ChartAnalysisResult } from '../../../shared/services/chart-analysis.service';

declare var d3: any;

@Component({
  selector: 'app-counsel-interview-report',
  templateUrl: './counsel-interview-report.component.html',
  styleUrls: ['./counsel-interview-report.component.css']
})
export class CounselInterviewReportComponent implements OnInit {

  list: any;
  isLoading: boolean;
  schoolYear: number;
  semester: number;
  startDate: string;
  endDate: string;
  selectClassIDs: string[] = [];
  conditionProblemCatag: string[] = [];
  conditionGender: string;
  isUseGenderFilter: boolean = false;
  isUseProblemCatagFilter: boolean = false;
  tmpGradeYear: number[] = [];
  tmpClass: CounselClass[] = [];
  isSelectAllItem: boolean = false;
  SelectGradeYearList: GradeClassInfo[] = [];
  @ViewChild('dialog') dialog: MatDialog;
  @ViewChild('condition_modal') condition_modal: any;
  @ViewChild('chartModal') chartModal: ChartModalComponent;
  @ViewChild('app_import_modal') app_import_modal: any;
  isSaveButtonDisable: boolean = false;
  
  // 🔥 新增：控制數據分析按鈕顯示的變數
  showChartButton: boolean = false;

  constructor(
    private dsaService: DsaService,
    public globalService: GlobalService,
    private counselStudentService: CounselStudentService,
    private chartAnalysisService: ChartAnalysisService
  ) { }

  ngOnInit() {
    this.list = [];
    this.isLoading = false;
    this.schoolYear = this.counselStudentService.currentSchoolYear;
    this.semester = this.counselStudentService.currentSemester;
    
    // 🔥 新增：設置結束日期為今天的預設值
    this.setDefaultEndDate();
    
    this.loadData();
    // Pre-initialize the modal to prevent 'filter' of undefined error
    if (this.condition_modal) {
      this.condition_modal.openModal();
      setTimeout(() => {
        this.condition_modal.closeModal();
      }, 10);
    }
    
    // 🔥 新增：監聽鍵盤事件
    this.setupKeyboardListener();
  }

  openModal() {
    this.condition_modal.openModal();
  }

  // 🔥 新增：設置鍵盤事件監聽器
  private setupKeyboardListener() {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      // 檢查是否按下 Ctrl+T
      if (event.ctrlKey && event.key === 't') {
        event.preventDefault(); // 防止預設行為
        this.showChartButton = !this.showChartButton; // 切換顯示狀態
        console.log('Ctrl+T pressed, showChartButton:', this.showChartButton);
      }
    });
  }

  // 🔥 新增：設置結束日期為今天的預設值
  private setDefaultEndDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.endDate = `${year}-${month}-${day}`;
    console.log('設置結束日期為今天:', this.endDate);
  }

  // 🔥 新增：使用可重用服務的數據分析方法
  async openChartAnalysisWithService() {
    console.log('=== 使用可重用服務進行數據分析 ===');
    
    // 收集所有班級ID
    this.selectClassIDs = [];
    this.SelectGradeYearList.forEach(item => {
      item.ClassItems.forEach(classItem => {
        this.selectClassIDs.push(classItem.ClassID);
      });
    });

    if (this.selectClassIDs.length === 0) {
      alert("無法取得班級資料，請稍後再試！");
      return;
    }

    // 創建配置
    const config: ChartAnalysisConfig = {
      title: '輔導晤談數據分析',
      apiEndpoint: 'GetCounselInterviewReport1',
      dateRange: this.chartAnalysisService.getDefaultDateRange(),
      filters: {
        classIDs: this.selectClassIDs
      },
      chartTypes: {
        bar: true,
        pie: true,
        line: true,
        network: true
      }
    };

    try {
      const result = await this.chartAnalysisService.analyzeData(config);
      
      if (result.success && result.data) {
        this.chartModal.open(result.data);
        console.log('數據分析完成:', result.metadata);
      } else {
        alert(result.error || '數據分析失敗');
      }
    } catch (error) {
      console.error('數據分析錯誤:', error);
      alert('數據分析過程中發生錯誤');
    }
  }

  loadData() {
    this.isSelectAllItem = false;
    this.GetCounselClass();
  }

  /**收合年級區塊 */
  openGradeSection(gradeClassInfo:GradeClassInfo){
    
 
    gradeClassInfo.isOpen =! gradeClassInfo.isOpen ;

  }

  SetSelectAllItem() {

    this.isSelectAllItem = !this.isSelectAllItem;
    this.SelectGradeYearList.forEach(item => {
      item.Checked = this.isSelectAllItem;
      item.ClassItems.forEach(classItem => {
        classItem.Checked = this.isSelectAllItem;
      });
    });
  }

  report() {
    if (this.prepareAndValidate()) {
      this.exportReport();
    }
  }

  private prepareAndValidate(): boolean {
    console.log('開始驗證資料...');
    
    this.selectClassIDs = [];
    this.SelectGradeYearList.forEach(item => {
      item.ClassItems.forEach(classItem => {
        if (classItem.Checked) {
          this.selectClassIDs.push(classItem.ClassID);
        }
      });
    });

    console.log('選擇的班級 IDs:', this.selectClassIDs);
    console.log('開始日期:', this.startDate);
    console.log('結束日期:', this.endDate);

    if (!moment(this.startDate).isValid() || !moment(this.endDate).isValid()) {
      console.log('日期驗證失敗');
      alert("開始或結束日期錯誤！");
      return false;
    }

    if (moment(this.startDate).isValid() && moment(this.endDate).isValid()) {
      if (moment(this.startDate) > moment(this.endDate)) {
        console.log('日期範圍錯誤');
        alert("開始日期需要小於結束日期！");
        return false;
      }
    }

    if (this.selectClassIDs.length === 0) {
      console.log('沒有選擇班級');
      alert("請勾選班級！");
      return false;
    }

    console.log('資料驗證通過');
    return true;
  }

    async openChartModal() {
    console.log('=== 開始數據分析 ===');
    
    // 數據分析使用全校資料，自動收集所有班級 ID
    this.selectClassIDs = [];
    this.SelectGradeYearList.forEach(item => {
      item.ClassItems.forEach(classItem => {
        this.selectClassIDs.push(classItem.ClassID);
      });
    });

    console.log('數據分析使用全校班級:', this.selectClassIDs.length, '個班級');

    if (this.selectClassIDs.length === 0) {
      console.log('沒有可用的班級資料');
      alert("無法取得班級資料，請稍後再試！");
      return;
    }

    try {
      // 自動設定近一年的日期範圍
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      
      const startDate = oneYearAgo.toISOString().split('T')[0] + ' 00:00:00';
      const endDate = now.toISOString().split('T')[0] + ' 23:59:59';

      console.log('全校數據分析參數:', {
        StartDate: startDate,
        EndDate: endDate,
        ClassIDs: this.selectClassIDs,
        ClassCount: this.selectClassIDs.length
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
        console.log('所有欄位名稱:', Object.keys(data[0]));
        this.chartModal.open(data);
      } else {
        console.log('沒有資料');
        alert("近一年全校沒有輔導資料可進行數據分析");
      }
    } catch (error) {
      console.error('API 錯誤:', error);
      alert(error.dsaError ? error.dsaError.message : '無法取得數據分析資料');
    }
  }
  modalImportShow() {
    $("#app_import_modal").modal("show");
    // 關閉畫面
    $("#app_import_modal").on("hide.bs.modal", () => {
      // 重整資料
      // this.loadData();
      $("#app_import_modal").off("hide.bs.modal");
    });
  }

  async exportReport() {
    try {
      let StartDate = this.startDate.replace('T', ' ');
      let EndDate = this.endDate.replace('T', ' ');

      let wsName: string = "導師輔導記錄報表";
      let fileName: string = wsName + ".xlsx";
      let resp = await this.dsaService.send("GetCounselInterviewReport1", {
        Request: {
          StartDate: StartDate,
          EndDate: EndDate,
          ClassIDs: this.selectClassIDs
        }
      });

      let data = [].concat(resp.CounselInterview || []);
      console.log('dataSS', data);
      if (data.length > 0) {
        let data1: any[] = [];
        data.forEach(item => {

          let item1 = {
            '輔導紀錄ID': item.CounselInterviewID,
            '班級': item.ClassName,
            '座號': item.SeatNo,
            '學號': item.StudentNumber,
            '姓名': item.Name,
            '學年度': item.SchoolYear,
            '學期': item.Semester,
            '訪談日期': item.OccurDate,
            '訪談對象': item.ContactName,
            '訪談者': item.AuthorName,
            '訪談方式': item.CounselType,
            '內容': item.Content,
            '聯絡事項': item.ContactItem,
            '登錄教師': item.TeacherName

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
    }
    catch (err) {
      alert(err.dsaError.message);
    }
  }

  async GetCounselClass() {
    this.SelectGradeYearList = [];
    this.tmpClass = [];
    this.tmpGradeYear = [];
    try {
      let resp = await this.dsaService.send("GetClasses", {
        Request: {}
      });

      [].concat(resp.Class || []).forEach(counselClass => {

        let gryear: number;
        gryear = 999; // 沒有年級
        if (counselClass.GradeYear) {
          gryear = parseInt(counselClass.GradeYear);
        }

        let CClass: CounselClass = new CounselClass();
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
        let grClass: GradeClassInfo = new GradeClassInfo();
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

  toggleClassSelected(classItem: CounselClass) {
    classItem.SetClassCheck();
  }

}
