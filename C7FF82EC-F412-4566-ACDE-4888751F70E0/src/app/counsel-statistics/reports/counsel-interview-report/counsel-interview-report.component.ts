import { Component, OnInit } from '@angular/core';
import { CounselClass, GradeClassInfo } from '../../CounselStatistics-vo';
import { DsaService } from "../../../dsa.service";
import * as moment from 'moment';
import * as XLSX from 'xlsx';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-counsel-interview-report',
  templateUrl: './counsel-interview-report.component.html',
  styleUrls: ['./counsel-interview-report.component.css']
})
export class CounselInterviewReportComponent implements OnInit {

  tmpGradeYear: number[] = [];
  tmpClass: CounselClass[] = [];
  isSelectAllItem: boolean = false;
  selectClassIDs: string[] = [];
  SelectGradeYearList: GradeClassInfo[] = [];
  isSaveButtonDisable: boolean = false;
  startDate: string = "";
  endDate: string = "";
  

  constructor(private dsaService: DsaService
    ) { }

  ngOnInit() {
    this.loadData();
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

    let chkDataPass: boolean = true;

    this.selectClassIDs = [];
    this.SelectGradeYearList.forEach(item => {
      item.ClassItems.forEach(classItem => {
        if (classItem.Checked) {
          this.selectClassIDs.push(classItem.ClassID);
        }
      });
    });

    if (!moment(this.startDate).isValid() || !moment(this.endDate).isValid()) {
      alert("開始或結束日期錯誤！");
      chkDataPass = false;
    }

    if (moment(this.startDate).isValid() && moment(this.endDate).isValid()) {
      if (moment(this.startDate) > moment(this.endDate)) {
        alert("開始日期需要小於結束日期！");
        chkDataPass = false;
      }
    }

    if (this.selectClassIDs.length === 0) {
      alert("請勾選班級！");
      chkDataPass = false;
    }

    if (chkDataPass) {
      this.exportReport()
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

  // 取得教師輔導班級
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
    //this.isLoading = false;
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

}
