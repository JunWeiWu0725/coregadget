import { Component, ElementRef, OnInit, Optional, ViewChild } from '@angular/core';
import { DsaService } from "../../../dsa.service";
import * as moment from 'moment';
import * as XLSX from 'xlsx';
import { AppComponent } from "../../../app.component";
import { CaseMonthlyStatistics, CaseMonthlyStatistics2, TeacherCounselRole } from '../gov-statistics-monthly/gov-statistics-vo';
import { MapOperator } from 'rxjs/internal/operators/map';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { mapping } from './mapping';
import * as ExcelJS from 'exceljs';
import { GlobalService } from 'src/app/global.service';

@Component({
  selector: 'app-gov-statistics-monthly',
  templateUrl: './gov-statistics-monthly.component.html',
  styleUrls: ['./gov-statistics-monthly.component.css']
})
export class GovStatisticsMonthlyComponent implements OnInit {





  excelData: any[][] = [];

  @ViewChild('sheet1') sheet1: ElementRef;
  @ViewChild('sheet2') sheet2: ElementRef;
  /** 開發用 (列印數字及原本用詞) */
  isShowPrintString :boolean = false ;
  isPrintString: boolean = false
  reportNameList: { reportName, description, isShowDescrip?}[];
  selectYear: number;
  selectMonth: number;
  selectReportType: string = '輔導工作月統計';
  reportTypeList: string[] = [];
  buttonDisable: boolean = true;
  dsnsName: string = "";
  schoolType;
  schoolName = '';
  maping = new mapping();
  /**sheet 1 [晤談紀錄]資料 */
  data = [];
  dataOrgin = [];
  /**sheet 2  [相關服務]資料 */
  data2 = [];
  data2Orgin = [];
  TeacherCounselRole: TeacherCounselRole[] = [];

  /** 範圍 */
  privateRangeList: {
    /**選單顯示用詞*/
    name,
    /**資料庫條件*/
    dbIsPrivate
  }[] =
    [{ name: "全部", dbIsPrivate: "true,false" },
    { name: "公開", dbIsPrivate: "false" },
    { name: "不公開", dbIsPrivate: "true" }]
  currentRange = this.privateRangeList[0]; // 預設為全部

  workbook: ExcelJS.Workbook

  constructor(@Optional()
  private appComponent: AppComponent,
    private dsaService: DsaService,
    private http: HttpClient,
    private globalService: GlobalService) { }


  /** 開發用*/
  getJSON(obj: any) {
    return JSON.stringify(obj)
  }

  async ngOnInit() {

    // 確認是否為開發模式 判斷是否要印出文字
    this.isShowPrintString = gadget.params.mode;
    // 取得教師編碼
    await this.getTeacherConNumbr();
    this.dsnsName = gadget.getApplication().accessPoint;

    let url = `https://dsns.ischool.com.tw/campusman.ischool.com.tw/config.public/GetSchoolList?body=%3CCondition%3E%3CDsns%3E${this.dsnsName}%3C/Dsns%3E%3C/Condition%3E&rsptype=json`;
    try {
      this.http.get<any>(url, { responseType: 'json' }).subscribe(response => {
        this.schoolType = response.Response.School.Type;

        // 年,月 初始化
        this.selectYear = new Date().getFullYear();
        this.selectMonth = new Date().getMonth() + 1;
        this.buttonDisable = false;
        this.reportNameList = [
          { reportName: "輔導工作月統計報表-教育部版", description: "版本更新月份:2024年7月", isShowDescrip: false },
          { reportName: "輔導工作月統計報表-新北市版", description: "" },
          { reportName: "輔導工作月統計報表-新竹國中版", description: "" },
          { reportName: "輔導工作月統計報表-新竹國小版", description: "" }
        ];
      });
    } catch (err) {
      console.log(err);
    }
  }

  async exportRepot(item) {

    //取得學校資訊 (學校名稱)
    await this.getSchoolInfo();
    // 檢查年,月
    var selYear = Number(this.selectYear);
    var selMonth = Number(this.selectMonth);
    var chkPass = false;

    if (selYear && selMonth) {
      if (selYear > 0 && (selMonth > 0 && selMonth < 13)) {
        chkPass = true;
      }
    }

    this.buttonDisable = true;
    if (chkPass) {
      if (item === '輔導工作月統計報表-教育部版') {
        this.GetCaseMonthlyStatistics1();
      }

      if (item === '輔導工作月統計報表-新北市版') {
        this.GetCaseMonthlyStatistics2();
      }

      if (item === '輔導工作月統計報表-新竹國中版') {
        this.GetCaseMonthlyStatistics3();
      }

      if (item === '輔導工作月統計報表-新竹國小版') {
        this.GetCaseMonthlyStatistics4();
      }
    } else {
      alert('西元年或月，輸入格式有問題。');
    }
  }

  /**切換公開不公開範圍 */
  setCurRange(item: any) {
    this.currentRange = item;
  }
  /**年級轉換*/
  parseGradeYear(value: string) {
    if (this.schoolType) {
      if (this.schoolType === '高中') {
        if (value === '1')
          return '10';
        if (value === '2')
          return '11';
        if (value === '3')
          return '12';

      } else if (this.schoolType === '國中') {
        if (value === '1' || value === '7')
          return '7';
        if (value === '2' || value === '8')
          return '8';
        if (value === '3' || value === '9')
          return '9';
      } else {
        // 當國小處理，回傳原本年級
        return value;
      }

    } else {
      return value;
    }
  }

  /** 取得 教師編碼 */
  async getTeacherConNumbr() {
    try {
      let rsp = await this.dsaService.send("_.GetTeachersCounselRole", {})
      this.TeacherCounselRole = [].concat(rsp.TeacherCounselRole || []);
    } catch (ex) {
      alert("取得教師編碼發生錯誤! \n" + JSON.stringify(ex));
    }

  }

  /** 取得教師編碼 如果沒有設定一樣顯示 教師名稱 【Mapping 資料】*/
  getTeacherConNumberByTeacherID(teacherIDSor: CaseMonthlyStatistics) {

    if (this.TeacherCounselRole.find(x => x.TeacherID == teacherIDSor.TeacherID)) {
      const teacherConNumber = this.TeacherCounselRole.find(x => x.TeacherID == teacherIDSor.TeacherID).TeacherCounselNumber
      if (teacherConNumber) {
        return this.TeacherCounselRole.find(x => x.TeacherID == teacherIDSor.TeacherID).TeacherCounselNumber

      } else {
        return `${teacherIDSor.TeacherName} (未設教師編碼)`
      }
    } else {
      return `${teacherIDSor.TeacherName} (已刪除)`;
    }
  }

  async onFileChange(event: any): Promise<void> {
    const file = event.target.files[0];
    const workbook = new ExcelJS.Workbook();
    const reader = new FileReader();

    reader.onload = async (e: any) => {
      const data = new Uint8Array(e.target.result);
      await workbook.xlsx.load(data);
      const worksheet = workbook.getWorksheet(1);

      // 将 Excel 数据保存到数组中
      this.excelData = [];
      worksheet.eachRow((row: any) => {
        this.excelData.push(row.values);
      });
    };

    reader.onerror = (error) => {
      console.error('File reading error:', error);
    };

    reader.readAsArrayBuffer(file);
  }


  /**取得學校資訊 主要是取得學校名稱 */
  async getSchoolInfo() {
    let rsp = await this.dsaService.send("Statistics.GetSchoolInfo", {
      Request: {

      }
    });

    if (rsp.result) {
      this.schoolName = rsp.result.school_name;
    }
  }



  /* 使用excel js */
  async genExcelMonthlyReport(data1: any[], data2: any[]): Promise<void> {
    this.workbook = new ExcelJS.Workbook();
    const filePath = 'assets/高級中等以下學校輔導工作成果填報系統１.xlsx'; // Excel 文件路径，根据实际情况修改\



    fetch(filePath)
      .then(async response => {
        if (!response.ok) {
          throw new Error('File not found or inaccessible');
        } else {
          const arrayBuffer = await response.arrayBuffer();

          // 使用 ExcelJS 讀取工作簿
          // this.workbook = new ExcelJS.Workbook();
          await this.workbook.xlsx.load(arrayBuffer); // 使用 load 方法載入數據
          // #region 處理 sheet
          const sheet1 = this.workbook.getWorksheet('表A-1-輔導教師-當月個案');
          let Sheet1getCellA1 = sheet1.getCell('A1')
          let sheet1getCellH1 = sheet1.getCell('O1')
          const masterCell = Sheet1getCellA1.master;
          const masterFirstCellH1 = sheet1getCellH1.master;
          masterCell.value = `[${(this.selectYear - 1911)}-${this.selectMonth}] ${this.schoolName}  輔導教師工作成果(當月個案填報)
          本表填報為經輔導處（室）、辦理輔導業務單位專業評估後，開案進入介入性輔導之學生，一位學生填報一列，統計資料會以學生代號統計，所有欄位皆為必填，不可空白！`
          masterFirstCellH1.value = `表格更新日期${this.globalService.formatToTaiwanDate(new Date())}`

          data1.forEach((x, index) => {
            sheet1.spliceRows(6 + index, 1, x)

          })
          //#endregion sheet1

          //#region 處理 sheet2
          const sheet2 = this.workbook.getWorksheet('表A-2-輔導教師-相關服務')
          let Sheet2getCellA1 = sheet2.getCell('A1')
          let sheet2getCellH1 = sheet2.getCell('H1')
          const masterCel2 = Sheet2getCellA1.master;
          const masterCelH1 = sheet2getCellH1.master;

          masterCel2.value = `[${(this.selectYear - 1911)}-${this.selectMonth}] ${this.schoolName}  輔導教師工作成果(相關服務填報)
          (所有欄位皆為必填，不可空白！)`
          // 處理列印日期
          masterCelH1.value = `表格更新日期${this.globalService.formatToTaiwanDate(new Date())}`

          data2.forEach((x, index) => {

            sheet2.spliceRows(5 + index, 1, x)

          })
          //#endregion sheet2

          // 保存文件
          const buffer = await this.workbook.xlsx.writeBuffer();
          this.saveExcelFile(buffer, '111學年度-輔導教師工作成果填報(0502).xlsx');
        }


      })
      .catch(error => {
        console.error('Error checking file:', error);
      });



  }


  private saveExcelFile(buffer: ArrayBuffer, filename: string): void {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    // 创建一个 <a> 元素
    const anchorElement = document.createElement('a');
    anchorElement.href = window.URL.createObjectURL(blob);
    anchorElement.download = filename;

    // 将 <a> 元素添加到页面并模拟点击下载
    document.body.appendChild(anchorElement);
    anchorElement.click();

    // 下载完成后移除 <a> 元素
    document.body.removeChild(anchorElement);
  }

  // 輔導工作月統計報表-教育部版
  async GetCaseMonthlyStatistics1() {




    // Service 取得資料邏輯：
    // 1. 未結案個案：是否結案=f  and 個案建立日期 <= 畫面上所選年月
    // 2. 該月結案:是否結案=t and 結案日期 = 畫面上所選年月
    let wsName: string = this.selectYear + "年輔導工作" + this.selectMonth + "月統計報表-教育部版";
    let fileName: string = wsName + ".xlsx";
    this.data = [];
    this.data2 = [];
    let resp = await this.dsaService.send("GetCaseMonthlyStatistics1_1", {
      Request: {
        Year: this.selectYear,
        Month: this.selectMonth,
        IsPrivate: this.currentRange.dbIsPrivate
      }
    });
     console.log("resp",resp) ;
    // sheet1
    [].concat(resp.Statistics || []).forEach(rspRec => {
      // 輔導當月個案
      let rec: CaseMonthlyStatistics = new CaseMonthlyStatistics();
      rec.TeacherReportRole = rspRec.TeacherReportRole; // 教師身分
      rec.TeacherID = rspRec.TeacherID;
      rec.TeacherNickName = rspRec.TeacherNickName;
      rec.OccurDate = rspRec.OccurDate;
      rec.Category = rspRec.SecondCategory;
      rec.CaseMainCategory = rspRec.CaseMainCategory;
      rec.StudentID = rspRec.StudentID;
      rec.TeacherName = rspRec.TeacherName;
      rec.ReportReferal = rspRec.ReportedReferralStatus; //202209 增加轉借狀況
      rec.StuCounselNumber = rspRec.StuCounselNumber; // 20220907 需求增加
      rec.CaseSource = rspRec.CaseSource      // 202209增加個案來源 (複選)
      rec.TeacherCounselNumber = this.getTeacherConNumberByTeacherID(rspRec),
        rec.GradeYear = rspRec.GradeYear;
      if (rspRec.StudentGender == '男') {
        rec.StudentGender = '生理男'
      } else if (rspRec.StudentGender == '女') {
        rec.StudentGender = '生理女'
      } else {
        rec.StudentGender = rspRec.StudentGender;
      }
      rec.Status = rspRec.CaseStatus; //  新舊個案
      rec.Count = parseInt(rspRec.Count);
      rec.CLevel = rspRec.CLevel;


      // sheet1 副類別
      if (rspRec.SecondCategory) {
        let Category = JSON.parse(rspRec.SecondCategory);

        Category.forEach(proRec => {
          if (proRec.answer_checked) {
            rec.CategoryValue.push(this.parseCategoryNoT1(proRec.answer_text));
            if (proRec.answer_text.includes('其他')) { // 如果有其他選項
              rec.CategoryOther = proRec.answer_martix[1]
            } else {
              rec.CategoryOther = '0';
            }
          }
        });
      }
      // sheet1 處理主類別 以及其他項目
      if (rspRec.CaseMainCategory) {
        let CaseMainCatagory = JSON.parse(rspRec.CaseMainCategory);
        CaseMainCatagory.forEach(proRec => {


          if (proRec.answer_checked) {
            rec.MainCategoryValueList.push(this.parseCategoryNoT1(proRec.answer_text));
            if (proRec.answer_text.includes('其他')) { // 如果有其他選項
              rec.CaseMainCategoryOther = proRec.answer_martix[1]
            } else {
              rec.CaseMainCategoryOther = '0'


            }
          }
        });

      }


      //sheet  學生身分
      if (rspRec.StudentStatus) {
        let StudentStatus = JSON.parse(rspRec.StudentStatus);

        StudentStatus.forEach(proRec => {
          if (proRec.answer_checked) {

            rec.StudentStatusList.push(this.maping.StudentStatusMaps.get(proRec.answer_text));
          }
        })
      }

      // 處理個案來源

      if (rspRec.CaseSource) {
        let CaseSource: string[] = rspRec.CaseSource.split('___');
        CaseSource.forEach(item => {
          if (rspRec.CaseStatus == "新") {
            let mapNum = this.maping.CaseSourcesMapping.has(item) ? this.maping.CaseSourcesMapping.get(item) : item;
            rec.CaseSourceList.push(mapNum);
          } else { // 舊案填0
            rec.CaseSourceList.push('0');
          }

        });


      }

      // 處理轉借概況
      if (rspRec.ReportedReferralStatus) {
        rec.ReportReferal = this.maping.ReteralStatus.get(rspRec.ReportedReferralStatus)

      }

      // 新案舊案
      if (rspRec.CaseStatus) {
        rec.Status = this.maping.NewOrOldCase.get(rspRec.CaseStatus)

      }

      this.data.push(rec);
    });


    let map = new Map<string, CaseMonthlyStatistics2>();
    // 相關服務 【sheet2】
    let resp2 = await this.dsaService.send("GetCaseMonthlyStatistics1_2", {
      Request: {
        Year: this.selectYear,
        Month: this.selectMonth,
        IsPrivate: this.currentRange.dbIsPrivate
      }
    });

    [].concat(resp2.Statistics || []).forEach(rspRec => {
      // 輔導相關服務
      let rec: CaseMonthlyStatistics2 = new CaseMonthlyStatistics2();
      rec.TeacherID = rspRec.ref_teacher_id;
      rec.TeacherNickName = rspRec.nickname;
      rec.TeacherCounselNumber = rspRec.teacher_counsel_number;
      rec.TeacherReportRole = rspRec.teacher_report_role; // 教師身分
      rec.TeacherName = rspRec.teacher_name;
      rec.ServiceTarget = rspRec.detail_service_target;
      rec.ServiceItemOtherDetail = rspRec.service_item_other_detail || 0 // 其他選項
      rec.ServiceItem = rspRec.service_item;
      rec.ContactName = rspRec.detail_service_target;
      rec.BoyCount = rspRec.male || 0;
      rec.GirlCount = rspRec.female || 0; rec.GirlCount = rspRec.female || 0;
      rec.GenderOther = rspRec.gender_other || 0;
      this.data2.push(rec);
    });

    //sheet 1
    if (this.data.length > 0 || this.data2.length > 0) {
      let data1: any[] = []; // 晤談紀錄
      let data2_d: any[] = [];

      this.data.forEach(da => {
        let tno = da.TeacherName;
        if (da.TeacherNickName != '')
          tno = da.TeacherName + "(" + da.TeacherNickName + ")";

// TODO:測試

        // let item = {
        //   '教師編碼': da.TeacherCounselNumber,
        //   '身分': this.maping.ReportTeacherRole.get(da.TeacherReportRole), // 新欄位
        //   '學生代號': da.CaseNo, // 新欄位(個案編號)
        //   '學生年級': this.parseGradeYear(da.GradeYear),
        //   '學生性別': da.StudentGender,
        //   '學生身分': da.StudentStatusList.length > 0 ? da.StudentStatusList.join(',') : '', // 新欄位
        //   '個案來源': da.CaseSourceList.join(','), // 新欄位
        //   '輔導概況': da.Status, // 新案舊案
        //   '轉介概況 ': da.ReportReferal, // 新欄位
        //   '個案類別(主)': da.MainCategoryValueList.length > 0 ? da.MainCategoryValueList.join(',') : '',
        //   '個案類別(主) 其他說明': da.CaseMainCategoryOther || 0,
        //   '個案類別(副)': da.CategoryValue.join(',') || 0,
        //   '個案類別(副) 其他說明': da.CategoryOther || 0,
        //   // '新案舊案': da.Status, // 新規格暫時住借
        //   '晤談次數': da.Count
        //   // '其他服務次數': 0
        // };

        // sheet1
        const item = [
          da.TeacherCounselNumber,
          this.maping.ReportTeacherRole.get(da.TeacherReportRole), // 新欄位
          da.StuCounselNumber = da.StuCounselNumber,
          this.parseGradeYear(da.GradeYear),
          da.StudentGender,
          '', // 因為系統目前沒有其他選項 故先填入空字串
          da.StudentStatusList.length > 0 ? da.StudentStatusList.join(',') : '', // 新欄位
          da.Status, // 新案舊案
          da.CaseSourceList.join(','), // 新欄位
          da.ReportReferal, // 新欄位
          da.MainCategoryValueList.length > 0 ? da.MainCategoryValueList.join(',') : '',
          da.CaseMainCategoryOther || 0,
          da.CategoryValue.join(',') || 0,
          da.CategoryOther || 0,
          // '新案舊案': da.Status, // 新規格暫時住借
          da.Count

        ];

        const itemCheck = [
          da.TeacherCounselNumber,
          da.TeacherReportRole, // 新欄位
          da.CaseNo, // 新欄位(個案編號)
          da.GradeYear,
          da.StudentGender,
          '', // 因為系統目前沒有其他選項 故先填入空字串
          da.StudentStatusList.length > 0 ? da.StudentStatusList.join(',') : '', // 新欄位
          da.Status, // 新案舊案
          da.CaseSourceList.join(','), // 新欄位
          da.ReportReferal, // 新欄位
          da.MainCategoryValueList.length > 0 ? da.MainCategoryValueList.join(',') : '',
          da.CaseMainCategoryOther || 0,
          da.CategoryValue.join(',') || 0,
          da.CategoryOther || 0,
          // '新案舊案': da.Status, // 新規格暫時住借
          da.Count

        ];

        data1.push(item);
        if (this.isPrintString) {
          data1.push(itemCheck);
        }
      })
      // sheet2
      this.data2.forEach(da => {
        let tno = da.TeacherName;
        if (da.TeacherNickName != '')
          tno = da.TeacherName + "(" + da.TeacherNickName + ")";
        // let item = {
        //   '教師編碼': da.TeacherCounselNumber || (da.TeacherName + '(未設教師編碼)'),
        //   '身分': this.maping.ReportTeacherRole.get(da.TeacherReportRole),
        //   '服務項目': this.maping.ServiceItemsMapping.get(da.ServiceItem),
        //   '其他說明': da.ServiceItemOtherDetail || '0',
        //   '對象': this.maping.ServiceTargetMaps.get(da.ServiceTarget),
        //   // '日期': da.OccurDate,
        //   '服務人次(男)': da.BoyCount,
        //   '服務人次(女)': da.GirlCount
        // };

        let item = [
          da.TeacherCounselNumber || (da.TeacherName + '(未設教師編碼)'),
          this.maping.ReportTeacherRole.get(da.TeacherReportRole),
          this.maping.ServiceItemsMapping.get(da.ServiceItem),
          da.ServiceItemOtherDetail || '0',
          this.maping.ServiceTargetMaps.get(da.ServiceTarget),
          da.BoyCount,
          da.GirlCount,
          da.GenderOther
        ]
        /** 驗證目前 */
        let itemCheck = [
          da.TeacherName + da.TeacherCounselNumber || (da.TeacherName + '(未設教師編碼)'),
          da.TeacherReportRole + this.maping.ReportTeacherRole.get(da.TeacherReportRole),
          da.ServiceItem + this.maping.ServiceItemsMapping.get(da.ServiceItem),
          da.ServiceItemOtherDetail + da.ServiceItemOtherDetail || '0',
          da.ServiceTarget + this.maping.ServiceTargetMaps.get(da.ServiceTarget),
          da.BoyCount,
          da.GirlCount
        ]
        data2_d.push(item);
        if (this.isPrintString) {
          data2_d.push(itemCheck)
        }
      })
      await this.genExcelMonthlyReport(data1, data2_d)

      return

    } else {
      alert(`${this.selectMonth}月,沒有資料!`);
    }

    this.buttonDisable = false;
  }

  //測試產出
  export2() {


  }


  /**名稱與代碼轉換(教育部)*/
  parseCategoryNoT1(item: string) {
    let value: number = 19; // 預設其他
    switch (item) {
      case '人際困擾': value = 1; break;
      case '師生關係': value = 2; break;
      case '家庭困擾': value = 3; break;
      case '自我探索': value = 4; break;
      case '情緒困擾': value = 5; break;
      case '生活壓力': value = 6; break;
      case '創傷反應': value = 7; break;
      case '自我傷害': value = 8; break;
      case '性別議題': value = 9; break;
      case '高風險家庭': value = 10; break;
      case '脆弱家庭': value = 10; break; // 修正
      case '兒少保議題': value = 11; break;
      case '學習困擾': value = 12; break;
      case '生涯輔導': value = 13; break;
      case '偏差行為': value = 14; break;
      case '網路沉迷': value = 15; break;
      case '網路成癮': value = 15; break; // 舊用詞向下相容
      case '中離(輟)拒學': value = 16; break;
      case '藥物濫用': value = 17; break;
      case '精神疾患': value = 18; break;
      case '心理疾病': value = 18; break; // 舊用詞 向下相容
      case '其他': value = 19; break;
    }
    return value;
  }

  // 名稱與代碼轉換(教育部)
  parseCategoryNoT2(item: string) {
    let value: string = 'T19'; // 預設其他
    switch (item) {
      case '人際困擾': value = 'T01'; break;
      case '師生關係': value = 'T02'; break;
      case '家庭困擾': value = 'T03'; break;
      case '自我探索': value = 'T04'; break;
      case '情緒困擾': value = 'T05'; break;
      case '生活壓力': value = 'T06'; break;
      case '創傷反應': value = 'T07'; break;
      case '自我傷害': value = 'T08'; break;
      case '性別議題': value = 'T09'; break;
      case '高風險家庭': value = 'T10'; break;
      case '兒少保議題': value = 'T11'; break;
      case '學習困擾': value = 'T12'; break;
      case '生涯輔導': value = 'T13'; break;
      case '偏差行為': value = 'T14'; break;
      case '網路沉迷': value = 'T15'; break;
      case '中離(輟)拒學': value = 'T16'; break;
      case '藥物濫用': value = 'T17'; break;
      case '精神疾患': value = 'T18'; break;
      case '其他': value = 'T19'; break;
    }
    return value;
  }

  // 輔導工作月統計報表-新北市版
  async GetCaseMonthlyStatistics2() {
    // Service 取得資料邏輯：
    // 1. 未結案個案：是否結案=f  and 個案建立日期 <= 畫面上所選年月
    // 2. 該月結案:是否結案=t and 結案日期 = 畫面上所選年月
    let wsName: string = this.selectYear + "年輔導工作" + this.selectMonth + "月統計報表-新北市版";
    let fileName: string = wsName + ".xlsx";
    let data: CaseMonthlyStatistics[] = [];
    let data2: CaseMonthlyStatistics2[] = [];

    // 其他項目需要統計名稱
    let detailItemnNameList: string[] = [];
    detailItemnNameList.push('個案會議');
    detailItemnNameList.push('教師晤談');
    detailItemnNameList.push('家長晤談');
    detailItemnNameList.push('電訪');
    detailItemnNameList.push('家訪');
    detailItemnNameList.push('個別心理測驗');
    detailItemnNameList.push('通訊軟體');
    detailItemnNameList.push('資源聯繫');

    let resp = await this.dsaService.send("GetCaseMonthlyStatistics2_1", {
      Request: {
        Year: this.selectYear,
        Month: this.selectMonth,
        IsPrivate: this.currentRange.dbIsPrivate
      }
    });

    let resp2 = await this.dsaService.send("GetCaseMonthlyStatistics2_2", {
      Request: {
        Year: this.selectYear,
        Month: this.selectMonth,
        IsPrivate: this.currentRange.dbIsPrivate
      }
    });

    [].concat(resp.Statistics || []).forEach(rspRec => {
      // 輔導當月個案

      let rec: CaseMonthlyStatistics = new CaseMonthlyStatistics();
      rec.TeacherID = rspRec.TeacherID;
      rec.TeacherNickName = rspRec.TeacherNickName;
      rec.OccurDate = rspRec.OccurDate;
      rec.Category = rspRec.Category;
      rec.StudentID = rspRec.StudentID;
      rec.TeacherName = rspRec.TeacherName;
      rec.TeacherCounselNumber = this.getTeacherConNumberByTeacherID(rspRec);
      rec.GradeYear = rspRec.GradeYear;
      rec.StudentGender = rspRec.StudentGender;
      rec.Status = rspRec.CaseStatus;
      rec.Count = parseInt(rspRec.Count);
      if (rspRec.Category != "") {
        let Category = JSON.parse(rspRec.Category);
        Category.forEach(proRec => {
          if (proRec.answer_checked) {
            rec.CategoryValue.push(this.parseCategoryNoT1(proRec.answer_text));
          }
        });

      }

      // 統計資料
      let detail = [].concat(rspRec.Detail || []);

      detail.forEach(item => {
        detailItemnNameList.forEach(itemName => {
          if (item.counsel_type.indexOf(itemName) > -1 || item.counsel_type_other.indexOf(itemName) > -1) {
            rec.AddOtherDetailCount(itemName);
          }
        });
      });

      data.push(rec);
    });


    let map = new Map<string, CaseMonthlyStatistics2>();

    // 相關服務
    [].concat(resp2.Statistics || []).forEach(rspRec => {
      // 輔導相關服務
      let key = rspRec.TeacherID + rspRec.OccurDate + rspRec.ContactItem + rspRec.ContactName;

      if (!map.has(key)) {
        let rec: CaseMonthlyStatistics2 = new CaseMonthlyStatistics2();
        rec.TeacherID = rspRec.TeacherID;
        rec.TeacherNickName = rspRec.TeacherNickName;
        rec.OccurDate = rspRec.OccurDate;
        rec.StudentID = rspRec.StudentID;
        rec.TeacherCounselNumber = this.getTeacherConNumberByTeacherID(rspRec);
        rec.TeacherName = rspRec.TeacherName;
        rec.ContactItem = rspRec.ContactItem;
        rec.ServiceItem = rspRec.ServiceItem;
        rec.ContactName = rspRec.ContactName;
        rec.CLevel = rspRec.CLevel;
        map.set(key, rec);
      }


      if (rspRec.StudentGender === '男') {
        if (map.has(key)) {
          let x = map.get(key);
          x.BoyCount += parseInt(rspRec.Count);
          map.set(key, x);
        }
      }

      if (rspRec.StudentGender === '女') {
        if (map.has(key)) {
          let x = map.get(key);
          x.GirlCount += parseInt(rspRec.Count);
          map.set(key, x);
        }
      }
    });

    map.forEach((values, keys) => {
      data2.push(values);
    });


    if (data.length > 0 || data2.length > 0) {
      let data1: any[] = [];
      let data2_d: any[] = [];
      data.forEach(da => {
        let tno = da.TeacherName;
        if (da.TeacherNickName != '')
          tno = da.TeacherName + "(" + da.TeacherNickName + ")";
        da.OtherCount = da.SumOtherDetailCount();
        let item = {
          '教師編碼': da.TeacherCounselNumber,
          '學生年級': this.parseGradeYear(da.GradeYear),
          '學生性別': da.StudentGender,
          '個案類別': da.CategoryValue.join(','),
          '新案舊案': da.Status,
          '晤談次數': da.Count,
          '其他服務次數': da.OtherCount,
          '個案會議': da.GetOtherDetailCount('個案會議'),
          '教師晤談': da.GetOtherDetailCount('教師晤談'),
          '家長晤談': da.GetOtherDetailCount('家長晤談'),
          '電訪': da.GetOtherDetailCount('電訪'),
          '家訪': da.GetOtherDetailCount('家訪'),
          '個別心理測驗': da.GetOtherDetailCount('個別心理測驗'),
          '通訊軟體': da.GetOtherDetailCount('通訊軟體'),
          '資源聯繫': da.GetOtherDetailCount('資源聯繫'),
          '對應新北市代號': ''
        };
        data1.push(item);
      })

      data2.forEach(da => {
        let tno = da.TeacherName;
        if (da.TeacherNickName != '')
          tno = da.TeacherName + "(" + da.TeacherNickName + ")";
        let item = {
          '教師編碼': da.TeacherCounselNumber,
          '服務項目': da.ServiceItem,
          '對象': da.ContactItem,
          '日期': da.OccurDate,
          '服務人次(男)': da.BoyCount,
          '服務人次(女)': da.GirlCount
        };
        data2_d.push(item);
      })

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data1, { header: [], cellDates: true, dateNF: 'yyyy-mm-dd hh:mm:ss', });
      const ws2 = XLSX.utils.json_to_sheet(data2_d, { header: [], cellDates: true, dateNF: 'yyyy-mm-dd hh:mm:ss', });
      XLSX.utils.book_append_sheet(wb, ws, "1.當月個案");
      XLSX.utils.book_append_sheet(wb, ws2, "2.相關服務");
      //XLSX.write(wb,{type:'buffer',bookType:'xlsx'});
      XLSX.writeFile(wb, fileName);
    } else {
      alert("沒有資料");
    }
    this.buttonDisable = false;
  }

  // 輔導工作月統計報表-新竹國中版
  async GetCaseMonthlyStatistics3() {
    // Service 取得資料邏輯：
    // 1. 未結案個案：是否結案=f  and 個案建立日期 <= 畫面上所選年月
    // 2. 該月結案:是否結案=t and 結案日期 = 畫面上所選年月
    let wsName: string = this.selectYear + "年輔導工作" + this.selectMonth + "月統計報表-新竹國中版";
    let fileName: string = wsName + ".xlsx";
    let data: CaseMonthlyStatistics[] = [];
    let data2: CaseMonthlyStatistics2[] = [];
    let resp = await this.dsaService.send("GetCaseMonthlyStatistics3_1", {
      Request: {
        Year: this.selectYear,
        Month: this.selectMonth,
        IsPrivate: this.currentRange.dbIsPrivate

      }
    });

    let resp2 = await this.dsaService.send("GetCaseMonthlyStatistics3_2", {
      Request: {
        Year: this.selectYear,
        Month: this.selectMonth,
        IsPrivate: this.currentRange.dbIsPrivate
      }
    });

    [].concat(resp.Statistics || []).forEach(rspRec => {
      // 輔導當月個案
      let rec: CaseMonthlyStatistics = new CaseMonthlyStatistics();
      rec.TeacherID = rspRec.TeacherID;
      rec.TeacherNickName = rspRec.TeacherNickName;
      rec.TeacherCounselNumber = this.getTeacherConNumberByTeacherID(rspRec);
      rec.TeacherRole = rspRec.TeacherRole;
      rec.OccurDate = rspRec.OccurDate;
      rec.Category = rspRec.Category;
      rec.StudentID = rspRec.StudentID;
      rec.TeacherName = rspRec.TeacherName;
      rec.GradeYear = rspRec.GradeYear;
      rec.StudentGender = rspRec.StudentGender;
      rec.Status = rspRec.CaseStatus;
      rec.Count = parseInt(rspRec.Count);
      // 處理數字對應
      if (rspRec.Category != "") {
        let Category = JSON.parse(rspRec.Category);
        Category.forEach(proRec => {
          if (proRec.answer_checked) {

            rec.CategoryValue.push(this.parseCategoryNoT2(proRec.answer_text));
          }
        });

      }

      data.push(rec);
    });

    let map = new Map<string, CaseMonthlyStatistics2>();

    // 相關服務
    [].concat(resp2.Statistics || []).forEach(rspRec => {
      // 輔導相關服務
      let key = rspRec.TeacherID + rspRec.OccurDate + rspRec.ContactItem + rspRec.ContactName;

      if (!map.has(key)) {
        let rec: CaseMonthlyStatistics2 = new CaseMonthlyStatistics2();
        rec.TeacherID = rspRec.TeacherID;
        rec.TeacherNickName = rspRec.TeacherNickName;
        rec.TeacherRole = rspRec.TeacherRole;
        rec.OccurDate = rspRec.OccurDate;
        rec.StudentID = rspRec.StudentID;
        rec.TeacherCounselNumber = this.getTeacherConNumberByTeacherID(rspRec);
        rec.TeacherName = rspRec.TeacherName;
        rec.ContactItem = rspRec.ContactItem;
        rec.ServiceItem = rspRec.ServiceItem;
        rec.ContactName = rspRec.ContactName;
        rec.CLevel = rspRec.CLevel;
        map.set(key, rec);
      }


      if (rspRec.StudentGender === '男') {
        if (map.has(key)) {
          let x = map.get(key);
          x.BoyCount += parseInt(rspRec.Count);
          map.set(key, x);
        }
      }

      if (rspRec.StudentGender === '女') {
        if (map.has(key)) {
          let x = map.get(key);
          x.GirlCount += parseInt(rspRec.Count);
          map.set(key, x);
        }
      }
    });

    map.forEach((values, keys) => {
      data2.push(values);
    });

    if (data.length > 0 || data2.length > 0) {
      let data1: any[] = [];
      let data2_d: any[] = [];
      data.forEach(da => {
        let tno = da.TeacherName;
        if (da.TeacherNickName != '')
          tno = da.TeacherName + "(" + da.TeacherNickName + ")";
        let item = {
          '職司編碼': da.TeacherCounselNumber,
          '身份': da.TeacherRole,
          '學生年級': this.parseGradeYear(da.GradeYear),
          '學生性別': da.StudentGender,
          '個案類別': da.CategoryValue.join(','),
          '新案舊案': da.Status,
          '晤談次數': da.Count
        };
        data1.push(item);
      })

      data2.forEach(da => {
        let tno = da.TeacherName; if (da.TeacherNickName
          != '') tno = da.TeacherName + "(" + da.TeacherNickName + ")"; let item =
          {
            '職司編碼': da.TeacherCounselNumber, '身份': da.TeacherRole, '服務項目': da.ServiceItem, '對象': da.ContactItem, '日期':
              da.OccurDate, '服務人次(男)': da.BoyCount, '服務人次(女)': da.GirlCount
          };
        data2_d.push(item);
      })

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data1, { header: [], cellDates: true, dateNF: 'yyyy-mm-dd hh:mm:ss', });
      const ws2 = XLSX.utils.json_to_sheet(data2_d, { header: [], cellDates: true, dateNF: 'yyyy-mm-dd hh:mm:ss', });
      XLSX.utils.book_append_sheet(wb, ws, "1.當月個案");
      XLSX.utils.book_append_sheet(wb, ws2, "2.相關服務");
      //XLSX.write(wb,{type:'buffer',bookType:'xlsx'});
      XLSX.writeFile(wb, fileName);
    } else {
      alert("沒有資料");
    }
    this.buttonDisable = false;
  }

  // 輔導工作月統計報表-新竹國小版
  async GetCaseMonthlyStatistics4() {
    // Service 取得資料邏輯：
    // 1. 未結案個案：是否結案=f  and 個案建立日期 <= 畫面上所選年月
    // 2. 該月結案:是否結案=t and 結案日期 = 畫面上所選年月
    let wsName: string = this.selectYear + "年輔導工作" + this.selectMonth + "月統計報表-新竹國小版";
    let fileName: string = wsName + ".xlsx";
    let data: CaseMonthlyStatistics[] = [];
    let data2: CaseMonthlyStatistics2[] = [];
    let resp = await this.dsaService.send("GetCaseMonthlyStatistics4_1", {
      Request: {
        Year: this.selectYear,
        Month: this.selectMonth,
        IsPrivate: this.currentRange.dbIsPrivate
      }
    });

    let resp2 = await this.dsaService.send("GetCaseMonthlyStatistics4_2", {
      Request: {
        Year: this.selectYear,
        Month: this.selectMonth
      }
    });

    [].concat(resp.Statistics || []).forEach(rspRec => {

      // 輔導當月個案
      let rec: CaseMonthlyStatistics = new CaseMonthlyStatistics();
      rec.TeacherID = rspRec.TeacherID;
      rec.TeacherNickName = rspRec.TeacherNickName;
      rec.TeacherCounselNumber = this.getTeacherConNumberByTeacherID(rspRec);
      rec.TeacherRole = rspRec.TeacherRole;
      rec.OccurDate = rspRec.OccurDate;
      rec.Category = rspRec.Category;
      rec.StudentID = rspRec.StudentID;
      rec.TeacherName = rspRec.TeacherName;
      rec.GradeYear = rspRec.GradeYear;

      rec.StudentGender = rspRec.StudentGender;
      rec.Status = rspRec.CaseStatus;
      rec.Count = parseInt(rspRec.Count);
      if (rspRec.Category != "") {
        let Category = JSON.parse(rspRec.Category);
        Category.forEach(proRec => {
          if (proRec.answer_checked) {
            rec.CategoryValue.push(this.parseCategoryNoT2(proRec.answer_text));
          }
        });

      }

      data.push(rec);
    });

    let map = new Map<string, CaseMonthlyStatistics2>();

    // 相關服務
    [].concat(resp2.Statistics || []).forEach(rspRec => {
      // 輔導相關服務
      let key = rspRec.TeacherID + rspRec.OccurDate + rspRec.ContactItem + rspRec.ContactName;

      if (!map.has(key)) {
        let rec: CaseMonthlyStatistics2 = new CaseMonthlyStatistics2();
        rec.TeacherID = rspRec.TeacherID;
        rec.TeacherNickName = rspRec.TeacherNickName;
        rec.TeacherCounselNumber = this.getTeacherConNumberByTeacherID(rspRec);
        rec.TeacherRole = rspRec.TeacherRole;
        rec.OccurDate = rspRec.OccurDate;
        rec.StudentID = rspRec.StudentID;
        rec.TeacherName = rspRec.TeacherName;
        rec.ContactItem = rspRec.ContactItem;
        rec.ServiceItem = rspRec.ServiceItem;
        rec.ContactName = rspRec.ContactName;
        rec.CLevel = rspRec.CLevel;
        map.set(key, rec);
      }


      if (rspRec.StudentGender === '男') {
        if (map.has(key)) {
          let x = map.get(key);
          x.BoyCount += parseInt(rspRec.Count);
          map.set(key, x);
        }
      }

      if (rspRec.StudentGender === '女') {
        if (map.has(key)) {
          let x = map.get(key);
          x.GirlCount += parseInt(rspRec.Count);
          map.set(key, x);
        }
      }
    });

    map.forEach((values, keys) => {
      data2.push(values);
    });

    if (data.length > 0 || data2.length > 0) {
      let data1: any[] = [];
      let data2_d: any[] = [];
      data.forEach(da => {
        let tno = da.TeacherName;
        if (da.TeacherNickName != '')
          tno = da.TeacherName + "(" + da.TeacherNickName + ")";
        let item = {
          '職司編碼': da.TeacherCounselNumber,
          '身份': da.TeacherRole,
          '學生年級': this.parseGradeYear(da.GradeYear),
          '學生性別': da.StudentGender,
          '個案類別': da.CategoryValue.join(','),
          '新案舊案': da.Status,
          '晤談次數': da.Count
        };
        data1.push(item);
      })

      data2.forEach(da => {
        let tno = da.TeacherName; if (da.TeacherNickName
          != '') tno = da.TeacherName + "(" + da.TeacherNickName + ")"; let item =
          {
            '職司編碼': da.TeacherCounselNumber, '身份': da.TeacherRole, '服務項目': da.ServiceItem, '對象': da.ContactItem, '日期':
              da.OccurDate, '服務人次(男)': da.BoyCount, '服務人次(女)': da.GirlCount
          };
        data2_d.push(item);
      })

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data1, { header: [], cellDates: true, dateNF: 'yyyy-mm-dd hh:mm:ss', });
      const ws2 = XLSX.utils.json_to_sheet(data2_d, { header: [], cellDates: true, dateNF: 'yyyy-mm-dd hh:mm:ss', });
      XLSX.utils.book_append_sheet(wb, ws, "1.當月個案");
      XLSX.utils.book_append_sheet(wb, ws2, "2.相關服務");
      //XLSX.write(wb,{type:'buffer',bookType:'xlsx'});
      XLSX.writeFile(wb, fileName);
    } else {
      alert("沒有資料");
    }
    this.buttonDisable = false;
  }

  // 名稱與代碼轉換(新北市版)
  parseProblemCategoryNoT2(item: string) { }

  // 名稱與代碼轉換(新竹國中版)
  parseProblemCategoryNoT3(item: string) { }

  // 名稱與代碼轉換(新竹國小版)
  parseProblemCategoryNoT4(item: string) { }



}
