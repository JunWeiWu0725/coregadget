import { AttendanceService, classIdStudents, periodDetail, SemesterInfo, StudentAttendanceInfo, studentObj, periodTypeDetail } from './../../dal/attendance.service';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as node2json from 'nodexml';
import FileSaver from 'file-saver';

@Component({
  selector: 'app-class-summary',
  templateUrl: './class-summary.component.html',
  styleUrls: ['./class-summary.component.scss']
})
export class ClassSummaryComponent implements OnInit {
  devsection :any ;
  studentsInfo: leaveType[] = [];
  periodTable: any;
  absenceName: any;
  classList = [];
  selectedClass: any ;
  semesters: SemesterInfo[] = [];
  selectedSemester: SemesterInfo = {} as SemesterInfo;
  typeList = [];
  selectedType: any;
  selectedAll = '不限';
  periodTypeMap = new Map();
  studentMappingTable: Map<string, StudentAttendanceStatistics> = new Map();
  aryStudents = [];  // 所有學生清單, 以一個 StudentAttendanceInfo 物件來代表一位學生
  showAllStudents = true;
  ready = false;
  ifNoResult = false;
  @ViewChild('table') table: ElementRef<HTMLDivElement>;

  constructor(private attendanceService: AttendanceService) { }

  async ngOnInit(): Promise<void> {
    // 1. get my classes
    await this.queryClasses();

    // 2. get semesters by class.
    await this.querySemesters();

    // 3. get absenceMapping Table
    this.absenceName = await this.attendanceService.getAbsenceMappingTable('Name');

    // 4. get periodMapping type
    await this.queryPeriodType();
    this.ready = true;

    // 4. get student attendance by class
    await this.queryStudentAttendance();
  }

  /**[View] 切換班級*/
  changeClass(cls:any){
    this.selectedClass =cls ;
    this.querySemesters();
  }
  /**[View]  切換假別*/
  changeType(type){
    this.selectedType =type ;
    this.queryStudentAttendance()
  }


/**[View] 切換學年度學期*/
 changeSemester(semester:SemesterInfo){
  this.selectedSemester =semester ;
  this.queryStudentAttendance()

 }


  /**
   * 查詢班級列表
   */
  async queryClasses() {
    this.classList = await this.attendanceService.getMyClasses();
    if( this.classList.length > 0){
      this.selectedClass = this.classList[0];
    }
  }

  /**
   * 查詢學年度學期
   */
  async querySemesters() {
    this.semesters = await this.attendanceService.getSemestersByClassID(this.selectedClass?.ClassID);
    this.selectedSemester = this.semesters[0];
    await this.queryPeriodType();
  }

  /**
   * 查詢節次類型
   */
  async queryPeriodType() {
    const tempTypeArray: periodDetail[] = await this.attendanceService.getPeriodMappingTable();
    const tempPeriodTypeList = [];
    tempTypeArray.forEach((periodDetail) => {
      this.periodTypeMap.set(periodDetail.Name, periodDetail.Type);
      tempPeriodTypeList.push(periodDetail.Type);
    });
    tempPeriodTypeList.unshift(this.selectedAll);
    this.typeList = tempPeriodTypeList.filter((el, i, arr) => arr.indexOf(el) === i);
    this.selectedType = this.typeList[0];
    await this.queryStudentAttendance();
  }

  /**
   * 查詢該學期有缺曠的學生
   */
  async queryStudentAttendance() {
    const studentList: StudentListResponse = await this.attendanceService.getStudentAttendanceByClassID(this.selectedClass, this.selectedSemester);
    await this.calStudentAttendance(studentList);
    // 取得非明細資了
    const rsp = await this.attendanceService.getGetStudAttendanceNoDetailByClassID(this.selectedClass, this.selectedSemester)
    const studentDetailList: IAbsenceWithNoDetil[] = [].concat(rsp.result || [])
    await this.addStudentAddendanceWithNoDetail(studentDetailList);
  }

  /**
   * 統計學生各種缺曠的類型數目
   * @param studentList 學生缺礦資料
   */
  async calStudentAttendance(studentList: StudentListResponse) {
    // reset
    this.studentMappingTable.clear();
    this.aryStudents = [];
    // 取得資料學生缺礦資料
    const studentAttendanceInfo: StudentAttendanceInfo[] = [].concat(studentList.result || []);
    // 勾選顯示全部學生
    // if (this.showAllStudents) {
    if (true) {
      const allClassStudentList: classIdStudents[] = await this.attendanceService.getStudents(this.selectedClass.ClassID);
      allClassStudentList.forEach((student) => {
        if (!this.studentMappingTable.has(student.seatNumber)) {
          const studentTempStatus = new StudentAttendanceStatistics(student.studentId, student.studentName, student.seatNumber);
          this.studentMappingTable.set(student.seatNumber, studentTempStatus);
          const studentInfo = {
            studentId: student.studentId,
            name: student.studentName,
            seat_no: student.seatNumber,
          }
          this.aryStudents.push(studentInfo);
        }
      });
    }

    // 計算各學生缺曠的統計
    studentAttendanceInfo.forEach((eachStudentAttendanceInfo) => {

      if (!this.studentMappingTable.has(eachStudentAttendanceInfo.seat_no)) {
        this.studentMappingTable.set(
          eachStudentAttendanceInfo.seat_no,
          new StudentAttendanceStatistics(eachStudentAttendanceInfo.seat_no, eachStudentAttendanceInfo.name, eachStudentAttendanceInfo.seat_no));
        const studentInfo = {
          studentId: eachStudentAttendanceInfo.ref_student_id,
          name: eachStudentAttendanceInfo.name,
          seat_no: eachStudentAttendanceInfo.seat_no,

        }
        this.aryStudents.push(studentInfo);
      }
      const studAttendStatistics = this.studentMappingTable.get(eachStudentAttendanceInfo.seat_no);

      studAttendStatistics.add(eachStudentAttendanceInfo, this.selectedType, this.selectedAll, this.periodTypeMap);
    });

    console.log("studentMappingTable",this.studentMappingTable) ;
    this.aryStudents.length === 0 ? this.ifNoResult = true : this.ifNoResult = false;
    this.aryStudents.sort((a, b) => parseInt(a.seat_no) > parseInt(b.seat_no) ? 1 : -1);
  }



  /** 取得非明細資料 */
  async addStudentAddendanceWithNoDetail(studenNoDetail: IAbsenceWithNoDetil[]) {

    if (studenNoDetail) {
      studenNoDetail.forEach(attNodetail => {

        const studAttendStatistics = this.studentMappingTable.get(attNodetail.seat_no);
        if (studAttendStatistics) {
          studAttendStatistics.addWithNodDetail(attNodetail, this.selectedType, this.selectedAll, this.periodTypeMap)
        }
      })
    }
  }

  /** 供下一頁參考的資料*/
  nextPage(studentInfo: StudentAttendanceInfo) {
    this.attendanceService.fillInStudentInfo(studentInfo);
  }

  /** 匯出報表*/
  exportFile(type): void {

    let element = this.table.nativeElement;
    // 表格加入格線
    element.children[0].setAttribute('border', '1');

    let html = `
    <html>
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        </head>
        <body>
            <div>${this.selectedClass.ClassName}_${this.selectedSemester.school_year}學年第${this.selectedSemester.semester}學期</div>
            ${element.innerHTML}
        </body>
    </html>`;
    const fileName = `${this.selectedClass.ClassName}_${this.selectedSemester.school_year}學年第${this.selectedSemester.semester}學期.${type}`;
    FileSaver.saveAs(new Blob([html], { type: "application/octet-stream" }), fileName);
  }

  getSemesterString(semester: SemesterInfo) {
    if(semester.school_year && semester.semester )
    {
      return `${semester?.school_year}學年第${semester?.semester}學期`;

    }else {
      return '目前無資料'


    }
  }

  getDevelopsection(obj: any ) {
    return JSON.stringify(obj);
  }

  // 預設顏色列表
  defaultColors: string[] = ['#b01116', '#2da197', '#de312d', '#b5882d', '#869a3b', '#f47820', '#01642e', '#ffc10e', '#2d89ca', '#2d3091', '#6f6fb5', '#90278e', '#d43784', '#f499c2', '#0a5a6e'];

  leaveColorMap = new Map<string, string>();

  // 取得假別顏色（優先使用預設顏色，不夠時用隨機）
  getLeaveColor(leave: string): string {
    if (!this.leaveColorMap.has(leave)) {
      // 先使用預設顏色，沒了再用隨機顏色
      const color = this.defaultColors.length > this.leaveColorMap.size
        ? this.defaultColors[this.leaveColorMap.size] // 用預設顏色
        : this.generateRandomColor(); // 超過時用隨機顏色

      this.leaveColorMap.set(leave, color);
    }
    return this.leaveColorMap.get(leave)!;
  }

  // 產生隨機顏色
  generateRandomColor(): string {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
  }


}


class StudentAttendanceStatistics {

  refStudentId: string;
  seatNumber: string;
  name: string;
  has_data: boolean;
  attendanceMapping: Map<string, number> = new Map(); // <key>缺曠名稱 / <value>統計數目
  attendanceRecords: StudentAttendanceInfo[] = [];

  constructor(studentId, studentName, seatNumber) {
    this.refStudentId = studentId;
    this.name = studentName;
    this.seatNumber = seatNumber;

  }


  public add(attendRecord: StudentAttendanceInfo, attendanceType: string, selectAll: string, periodTypeMap: Map<string, string>) {
    this.has_data = true;
    this.attendanceRecords.push(attendRecord);
    this.parseAttendance(attendRecord.detail, attendanceType, selectAll, periodTypeMap);
  }

  parseAttendance(xmlDetail: Object, attendanceType: string, selectAll: string, periodTypeMap: Map<string, string>) {

    const personalAttendance: studentObj = node2json.xml2obj(xmlDetail);
    console.log("personalAttendance", personalAttendance)

    const temp: periodTypeDetail[] = [].concat(personalAttendance.Attendance.Period || []);
    temp.forEach((period) => {
      const absType = period.AbsenceType;
      if (!this.attendanceMapping.has(absType) && ((periodTypeMap.get(period['@text']) === attendanceType) || (attendanceType === selectAll))) {
        this.attendanceMapping.set(absType, 0);
      }
      if ((attendanceType === selectAll) || (periodTypeMap.get(period['@text']) === attendanceType)) {
        this.attendanceMapping.set(absType, this.attendanceMapping.get(absType) + 1);
      }
    });
  }


  /** 增加非明細統計 Jean*/
  addWithNodDetail(absenceWithNoDetil: IAbsenceWithNoDetil, selectAll: string, attendanceType: string, periodTypeMap: Map<string, string>) {
    this.has_data = true;
    if (!this.attendanceMapping.has(absenceWithNoDetil.name) && periodTypeMap.get(absenceWithNoDetil.name) || (attendanceType === selectAll)) {
      this.attendanceMapping.set(absenceWithNoDetil.name, 0);
    }
    if ((attendanceType === selectAll) || (periodTypeMap.get(absenceWithNoDetil.name) === attendanceType)) {
      let num: number = parseInt(absenceWithNoDetil.count, 10); // 取得非獎懲
      console.log(absenceWithNoDetil)
      console.log("+", num)
      this.attendanceMapping.set(absenceWithNoDetil.name, this.attendanceMapping.get(absenceWithNoDetil.name) + num);
    }
  }




}

interface StudentListResponse {
  result: {
    ref_student_id: string;
    seat_no: string;
    name: string;
    school_year: string;
    semester: string;
    occur_date: string;
    detail: string;
  }[]
}

interface leaveType {
  StudentID: string;
  StudentName: string;
  SeatNumber: string;
  DetailList: {
    OccurDate: string;
    Period: {
      text: string;
      AbsenceType: string;
    }[];
  }[];
}


/** 非明細統計 [attendance.getAttendanceNoDetailByID]]*/
export interface IAbsenceWithNoDetil {
  school_year: string;
  semester: string;
  ref_student_id: string;
  count: string;
  name: string;
  periodtype: string;
  seat_no: string;
}

/**放缺曠資料的地方 */
class AbsenceWithNoDetil implements IAbsenceWithNoDetil {
  school_year: string = "";
  semester: string = "";
  ref_student_id: string = "";
  count: string = "";
  name: string = "";
  periodtype: string = "";
  seat_no: string = "";
}

