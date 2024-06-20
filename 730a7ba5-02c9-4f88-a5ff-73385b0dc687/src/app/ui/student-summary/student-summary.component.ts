import { Component, OnInit } from '@angular/core';
import { AttendanceService } from 'src/app/dal/attendance.service';
import FileSaver from 'file-saver';
import { IAbsenceWithNoDetil } from '../class-summary/class-summary.component';

@Component({
  selector: 'app-student-summary',
  templateUrl: './student-summary.component.html',
  styleUrls: ['./student-summary.component.scss']
})
export class StudentSummaryComponent implements OnInit {

  /**
   * 目前選擇的學生姓名
   */
  selectedName: string;
  /**
   * 目前選擇的學生ID
   */
  selectedId: string;
  /**
   * 目前學生對照的MAP(key: 學年度學期，value: 該學年度的缺曠明細)，未排序
   */
  studentMappingStatics: Map<string, Map<string, AbsenceRecord>> = new Map();
  /**
   * 目前學生對照的MAP(key: 學年度學期，value: 該學年度的缺曠明細)，已排序
   */
  sortedMappingStatics: Map<string, Map<string, AbsenceRecord>> = new Map();
  /**
   * 顯示於畫面上的學期統計資料
   */
  sortedStudentList: studentAbsenceType[] = [];
  /**
   * 排序完得學年度學期
   */
  semesterList: string[] = [];
  /**
   * 節次對照表
   */
  periodTable = [];
  constructor(private attendanceService: AttendanceService) {
  }

  async ngOnInit(): Promise<void> {

    await this.getStudentInfo();
    // 取得學生缺礦資料 (不含非明細)
    const obj = await this.attendanceService.getStudentAttendance(this.attendanceService.selectedStudentID);
    await this.parseStudentAttendanceInfo(obj);
    // 取得非明細資訊
    const rsp = await this.attendanceService.getGetStudAttendanceNoDetailByStuID(this.attendanceService.selectedStudentID)
    const studentAttdudanceNoDetail = [].concat(rsp.result || []);
    await this.addStudAttensInfoNoDetail(studentAttdudanceNoDetail);
    this.periodTable = await this.attendanceService.getPeriodMappingTable();
    this.sortMap();
    console.log("semester ", this.sortedStudentList);
  }

  /**
   * 抓取本次查詢的學生明細
   */
  async getStudentInfo() {
    this.selectedName = this.attendanceService.selectedName;
    this.selectedId = this.attendanceService.selectedStudentID;
  }

  /**
   * 透過學年度學期當作key，將缺曠明細當作value
   * @param studentAttendanceList 學生缺曠明細
   */
  parseStudentAttendanceInfo(studentAttendanceList: StudentAttendanceList) {
    const temp: StudentAttendanceRecord[] = [].concat(studentAttendanceList.Response.Attendance || []);
    // 對於每一筆學生缺曠紀錄
    temp.forEach((studentAttendanceList) => {
      // 使用學年度+學期作為key
      const keyYearSemester = studentAttendanceList.SchoolYear + '-' + studentAttendanceList.Semester;
      // 判斷是否存在此學年度學期
      if (!this.studentMappingStatics.has(keyYearSemester)) {
        const absenceMappingStatics = new Map();
        this.studentMappingStatics.set(keyYearSemester, absenceMappingStatics);
      }
      // 計算各類型缺曠的數目
      const stdDetailPeriod: AbsenceDetail[] = [].concat(studentAttendanceList.Detail.Period || []);
      let periodString = '';
      let absenceTypeRecord = '';
      stdDetailPeriod.forEach((eachAbsenceType) => {

        // 同一天不同假別,紀錄假別名稱
        if (absenceTypeRecord !== eachAbsenceType.AbsenceType) {
          //periodString = '';
          absenceTypeRecord = eachAbsenceType.AbsenceType;
        }

        // 判斷是否有重複的缺曠類型
        if (!this.studentMappingStatics.get(keyYearSemester).has(eachAbsenceType.AbsenceType)) {
          periodString = '';
          const tempAbsenceDetail = {
            count: 0,
            detail: new Map()
          };
          this.studentMappingStatics.get(keyYearSemester).set(eachAbsenceType.AbsenceType, tempAbsenceDetail);
        } else {
            // 如果同一天之前已有相同假別的節次，將節次讀出來
            periodString = this.studentMappingStatics.get(keyYearSemester).get(eachAbsenceType.AbsenceType).detail.get(studentAttendanceList.OccurDate) || '';
        }

        // 組合expand-panel的字串
        if (periodString === '') {
          periodString += eachAbsenceType['@text'];
        }
        else {
          periodString += '、' + eachAbsenceType['@text'];
        }

        let detailObj = {
          count: this.studentMappingStatics.get(keyYearSemester).get(eachAbsenceType.AbsenceType).count,
          detail: this.studentMappingStatics.get(keyYearSemester).get(eachAbsenceType.AbsenceType).detail.set(studentAttendanceList.OccurDate, periodString)
        }
        detailObj.count++;
        this.studentMappingStatics.get(keyYearSemester).set(eachAbsenceType.AbsenceType, detailObj);
      });
    });
  }

  /** 非明細資料整理 */
  addStudAttensInfoNoDetail(absenceWithNoDetil:IAbsenceWithNoDetil[]) {
    absenceWithNoDetil.forEach(absenceNodata => {
      const keyYearSemester = absenceNodata.school_year + '-' + absenceNodata.semester;
      if (!this.studentMappingStatics.has(keyYearSemester)) {
        const absenceMappingStatics = new Map();
        this.studentMappingStatics.set(keyYearSemester, absenceMappingStatics);
      }

//
      if (!this.studentMappingStatics.get(keyYearSemester).has(absenceNodata.name)) {
        const tempAbsenceDetail = {
          count: 0,
          detail :new Map()
        };
        this.studentMappingStatics.get(keyYearSemester).set(absenceNodata.name, tempAbsenceDetail);
      }

      let  noDetailCount =  parseInt(absenceNodata.count,10)

      let absence  =this.studentMappingStatics.get(keyYearSemester).get(absenceNodata.name);
      absence.count+=noDetailCount;
      absence.detail.set('轉入補登(非明細)',  parseInt(absenceNodata.count,10)+"節")
    });
  }


  sortMap() {
    // 重新排序Map中內容(根據學年度學期)
    this.studentMappingStatics.forEach((value, index) => {
      this.semesterList.push(index);
    });

    // 根據學年度學期作排序
    this.semesterList.sort((a, b) => {
      const tempA: string = a.split('-').join('');
      const tempB = b.split('-').join('');
      if (parseInt(tempA) < parseInt(tempB)) {
        return 1;
      }
      return -1;
    });

    // 重新排序Map
    this.semesterList.forEach((value) => {
      // debugger
      this.sortedMappingStatics.set(value, this.studentMappingStatics.get(value));
    });

    // 將Map轉換成陣列作為畫面顯示
    const temp = [];
    if(this.sortedMappingStatics)
    {
      this.sortedMappingStatics.forEach((absenceTypeStatics, semester) => {
        const eachSemester = new studentAbsenceType();
        eachSemester.semester = semester;
        if(absenceTypeStatics)
        {
          absenceTypeStatics.forEach((absenceDetail, absenceType) => {
            const periodByDate = [];
            if(absenceDetail.detail)
            {
              absenceDetail.detail.forEach((period, date) => {
                const tempData = {
                  date: date,
                  period: period
                }
                periodByDate.push(tempData);
              });
              const typeAndCount = {
                absenceType: absenceType,
                count: absenceDetail.count,
                detail: periodByDate
              };
              eachSemester.statics.push(typeAndCount);
            }

          });

        }

        temp.push(eachSemester);
      });
    }


    this.sortedStudentList = temp;

    // 修改semester內容
    this.sortedStudentList.forEach((value) => {
      const temp = value.semester.split('-');
      value.semester = `${temp[0]}學年度第${temp[1]}學期`;
    });

  }

  /**
   *
   * @param type 輸出成Excel 或Html
   */
  async exportFile(type): Promise<void> {

    const rst = await this.attendanceService.getStudentAttendance(this.attendanceService.selectedStudentID);
    const result: StudentAttendanceRecord[] = [].concat(rst.Response.Attendance || []);
    //
    const studentInfoMap = new Map();
    result.forEach((detail) => {
      const detailMap = new Map();
      this.periodTable.forEach(period => detailMap.set(period.Name, ''));
      const absenceType: AbsenceDetail[] = [].concat(detail.Detail.Period || []);
      absenceType.forEach((typeByPeriod) => {
        detailMap.set(typeByPeriod['@text'], typeByPeriod.AbsenceType);
      });
      const detailObj = {
        schoolYear: detail.SchoolYear,
        semester: detail.Semester,
        occurDate: detail.OccurDate,
        detailMap: detailMap
      }
      studentInfoMap.set(detail.OccurDate, detailObj);
    });
    let header = '';
    this.periodTable.forEach((period) => {
      header += `<th>${period.Name}</th>
                `;
    })
    let head = `<div>
    <div>${this.selectedName} 缺曠記錄明細表</div>
    <table border = 1>
        <thead>
            <tr>
                <th>學年度學期</th>
                <th>日期</th>
                ${header}
            </tr>
        </thead>
        <tbody>`;

    let body = '';
    studentInfoMap.forEach((absenceTypeByDate) => {
      body += `
              <tr>
                <td>${absenceTypeByDate.schoolYear}學年第${absenceTypeByDate.semester}學期</td>
                <td>${absenceTypeByDate.occurDate}</td>
                `;
      absenceTypeByDate.detailMap.forEach((absenceType) => {
        body += `<td>${absenceType}</td>
                `;
      });
      body += `
              </tr>`;
    });
    body += `
            </tr>
          </tbody>
      </table>
    </div>`;
    let html = head + body;
    const fileName = `${this.selectedName}_缺曠紀錄明細表.${type}`;
    FileSaver.saveAs(new Blob([html], { type: "application/octet-stream" }), fileName);
  }
}

class studentAbsenceType {
  semester: string;
  statics: AbsenceInfo[] = [];

  constructor() {
  }
}

class AbsenceInfo {
  absenceType: string;
  count: number;
  detail: AbsenceDetail[] = [];

  constructor() {
  }
}

class AbsenceDetail {
  date: string;
  period: string;
}

/**
 * 各缺曠類型的詳細資料，Map<date, period>
 */
interface AbsenceRecord {
  count: number;
  detail: Map<string, string>
}

interface StudentAttendanceRecord {
  '@': [],
  'Id': string,
  'OccurDate': string,
  'SchoolYear': string,
  'Semester': string,
  'Detail': {
    'Period': AbsenceDetail[]
  }
}

interface AbsenceDetail {
  '@text': string,
  '@': [],
  'AbsenceType': string
  // 'AttendanceType': string
}

interface StudentAttendanceList {
  'Response': {
    'Attendance': {
      studentAttendanceRecord: StudentAttendanceRecord
    }[]
  }
}
