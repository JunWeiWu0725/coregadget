import { AddCadreDialogComponent } from './../add-cadre-dialog/add-cadre-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import {
  CadreService,
  CadreTypeInfo,
  ClassInfo,
  StudentInfo,
  CadreInfo,
  ClassCadreRecord,
} from './../../dal/cadre.service';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-class-summary',
  templateUrl: './class-summary.component.html',
  styleUrls: ['./class-summary.component.scss'],
})
export class ClassSummaryComponent implements OnInit {
  cadreTypes: CadreTypeInfo[] = [];
  classList = [];
  studentList: StudentInfo[] = [];
  dicStuds: { [studID: string]: StudentInfo } = {};

  currentDateTime: any;       // 可以設定幹部的期間
  nowDate: any;
  selectedStart;  // 開始日期
  selectedEnd;      // 結束日期
  selectedNow;      // 結束日期
  isCanSelectCarde = false;  // 是否是目前學年學期。如果是，才可以編輯資料。

  currentSemester: any;
  isCurrentSemester = true;
  selectedClass: ClassInfo;
  selectedSchoolYear = 114;
  selectedSemester = 1;
  schoolYearList: number[] = [];

  cadres: CadreInfo[] = [];
  dicCadreUsage: { [uid: string]: string } = {};
  classCadres: ClassCadreRecord[] = [];
  isLoading = false;

  constructor(private cadreService: CadreService, public dialog: MatDialog) {}

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    this.cadreTypes = await this.cadreService.getCadreTypes();
    await this.queryClasses();
    await this.loadStudents();
    await this.getCurrentSemester();
    await this.reloadCadreData();

    // 6. 取得目前輸入開始結束入期
    await this.getOpenTeacherCadreDate();
  }


  async queryClasses() {
    this.classList = await this.cadreService.getMyClasses();
    if (this.classList.length > 0) {
      this.selectedClass = this.classList[0];
    }
  }

    async getOpenTeacherCadreDate() {
    // this.semesters = await this.cadreService.getSemestersByClassID(this.selectedClass.ClassID);
    // console.log(this.semesters);
    this.currentDateTime = await this.cadreService.getOpenTeacherCadreDate();

    let startDate = null;
    let endDate = null;

    if (this.currentDateTime.Response !== undefined) {
      startDate = new Date(this.currentDateTime.Response.StartDate);
      endDate = new Date(this.currentDateTime.Response.EndDate);
      // 結束日期要加一天,減一秒才會是當天結束
      endDate.setDate(endDate.getDate() + 1);
      endDate.setSeconds(endDate.getSeconds() - 1);

      if (this.nowDate >= startDate && this.nowDate <= endDate) {
        this.isCanSelectCarde = true;
      } else {
        this.isCanSelectCarde = false; // 未在輸入期間
      }

      console.log("開始時間 : " + this.formatDateToYYYYMMDD(startDate));
      console.log("結束時間 : " + this.formatDateToYYYYMMDD(endDate));

    } else {
      this.isCanSelectCarde = false; // 未在輸入期間
    }


    if (startDate !== null) {
      this.selectedStart = this.formatDateToYYYYMMDD(startDate); // 開始日期
    } else {
      this.selectedStart = '[未設定開始時間]';
    }
    if (endDate !== null) {
      this.selectedEnd = this.formatDateToYYYYMMDD(endDate); // 結束日期
    } else {
      this.selectedEnd = '[未設定結束時間]';
    }

    if (this.nowDate !== null) {
      this.selectedNow = this.formatDateToYYYYMMDD(this.nowDate); // 目前日期
    } else {

    }


  }

  formatDateToYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需要加1
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute} `;
  }

  async loadStudents() {
    if (this.selectedClass) {
      this.studentList = await this.cadreService.getStudents(
        this.selectedClass.ClassID
      );
      this.dicStuds = {};
      this.studentList.forEach((stud) => {
        this.dicStuds[stud.StudentId] = stud;
      });
    }
  }

  async reloadCadreData() {
    this.isLoading = true;
    if (!this.selectedClass || !this.currentSemester) return;

    this.isCurrentSemester =
      this.selectedSchoolYear ===
        parseInt(this.currentSemester.Response.SchoolYear, 10) &&
      this.selectedSemester ===
        parseInt(this.currentSemester.Response.Semester, 10);

    this.cadres = await this.cadreService.getClassCadreStudents(
      this.selectedClass.ClassID,
      this.selectedSchoolYear,
      this.selectedSemester
    );

    this.dicCadreUsage = {};
    this.cadres.forEach((cadre) => {
      this.dicCadreUsage[cadre.uid] = 'no';
    });

    this.parseCadreRecords();
    this.isLoading = false;
  }

  async getCurrentSemester() {
    this.currentSemester = await this.cadreService.getCurrentSemester();
    this.selectedSchoolYear = parseInt(
      this.currentSemester.Response.SchoolYear,
      10
    );
    this.selectedSemester = parseInt(
      this.currentSemester.Response.Semester,
      10
    );

    this.nowDate = new Date(this.currentSemester.Response.Now);
    console.log("目前時間 : " + this.formatDateToYYYYMMDD(this.nowDate));

    // 產生學年度下拉選單 (當前學年度 +/- 3)
    this.schoolYearList = [];
    for (let i = this.selectedSchoolYear + 2; i >= this.selectedSchoolYear - 3; i--) {
      this.schoolYearList.push(i);
    }
  }

  async changeClass() {
    await this.loadStudents();
    await this.reloadCadreData();
  }

  parseCadreRecords(): void {
    this.classCadres = [];
    this.cadreTypes.forEach((cadreType) => {
      for (let i = 0; i < cadreType.Number; i++) {
        const classCadre = new ClassCadreRecord();
        classCadre.cadreType = cadreType;
        classCadre.cadre = this.chooseCadreRecordByType(cadreType.Cadrename);
        if (classCadre.cadre) {
          classCadre.student = this.dicStuds[classCadre.cadre.studentid];
        }
        this.classCadres.push(classCadre);
      }
    });
  }

  chooseCadreRecordByType(cadreName: string): CadreInfo {
    let result: CadreInfo;
    let hasFound = false;
    this.cadres.forEach((cadre) => {
      if (
        !hasFound &&
        this.dicCadreUsage[cadre.uid] === 'no' &&
        cadre.cadrename === cadreName
      ) {
        result = cadre;
        this.dicCadreUsage[cadre.uid] = 'yes';
        hasFound = true;
      }
    });
    return result;
  }

  async ChangDefSchool() {
    this.selectedSchoolYear = parseInt(this.currentSemester.Response.SchoolYear, 10);
    this.selectedSemester = parseInt(this.currentSemester.Response.Semester, 10);

    await this.reloadCadreData();
  }

  async removeCadre(classCadre: ClassCadreRecord) {
    if (classCadre.cadre) {
      await this.cadreService.deleteCadre(classCadre);
      await this.reloadCadreData();
    }
  }

  // 重要：確保 Dialog 開啟時根據寬度設定位置
  openDialog(classCadre: ClassCadreRecord) {
    const isMobile = window.innerWidth < 768; // 偵測手機版寬度

    const dialogRef = this.dialog.open(AddCadreDialogComponent, {
      width: isMobile ? '100vw' : '500px',
      maxWidth: '100vw',
      position: isMobile ? { bottom: '0' } : {}, // 手機版從底部向上拉出
      panelClass: isMobile ? 'mobile-bottom-dialog' : 'standard-dialog',
      autoFocus: false,
      data: {
        classCadre,
        students: this.studentList,
        schoolYear: String(this.selectedSchoolYear),
        semester: String(this.selectedSemester),
        class: this.selectedClass,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.reloadCadreData(); // 監聽成功後重新載入
      }
    });
  }

  decodeHtml(html: string) {
    if (!html) return '';
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }

  exportToExcel() {
    const data = this.classCadres.map((cc) => ({
      學年度: this.selectedSchoolYear,
      學期: this.selectedSemester,
      幹部: cc.cadreType.Cadrename,
      班級: this.selectedClass.ClassName,
      座號: cc.student ? this.decodeHtml(cc.student.SeatNo) : '',
      姓名: cc.student ? this.decodeHtml(cc.student.StudentName) : '',
      學號: cc.student ? cc.student.StudentNumber : '',
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '班級幹部');
    XLSX.writeFile(wb, `${this.selectedClass.ClassName}班級幹部名冊.xlsx`);
  }
}
