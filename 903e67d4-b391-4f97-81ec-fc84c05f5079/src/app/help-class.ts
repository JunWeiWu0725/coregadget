/**班級 */
export class Class {
  constructor(public classId, public className, public gradeYear) {
    this.classId = classId;
    this.className = className;
    this.gradeYear = gradeYear;
  }
}

/**學生 */
export class Student {
  constructor(public sid, public name:string, public seatNo:number, public leaveList: Map<string, Leave>, public orileaveList: Map<string, Leave>) {
    this.sid = sid;
    this.name = name;
    this.seatNo = seatNo;
    this.leaveList = leaveList || new Map<string, Leave>();
    this.orileaveList = orileaveList || new Map<string, Leave>();
  }



  setAbsence(periodName: string, absName: string) {
    if (periodName) {
      if (this.leaveList.has(periodName)) {
        if (this.leaveList.get(periodName).isLock) { return; }
      }

      if (absName) {
        this.leaveList.set(periodName, new Leave(periodName, absName, false));
      } else {
        this.leaveList.delete(periodName);
      }
    }
  }
}

/** 林口康橋 
 *<ref_student_id>1043</ref_student_id>
	<name>黃柏郡</name>
	<checkin_time>2022-02-22 08:00:00</checkin_time>
*/
export interface ICheckInInfo{
  ref_student_id :string ;
  name : string ;
  checkin_time : string ;
  checkIn_only_time : string ;
}



/**假別及簡稱 */
export class Absence {
  constructor(public name: string, public abbreviation: string) {
    this.name = name;
    this.abbreviation = abbreviation;
  }
}

/**節次 */
export class Period {
  constructor(public name: string, public sort: number, public type: string,public permission: string) {
    this.name = name;
    this.sort = sort;
    this.type = type;
    this.permission = permission;
  }
}

/**學生請假的類別 */
export class Leave {
  constructor(public periodName: string, public absName: string, public isLock: boolean) {
    this.periodName = periodName;
    this.absName = absName;
    this.isLock = isLock;
  }
}

/**班導師點名設定 */
export interface Config {
  absenceNames: string[];
  periodPermissionMap : Map<string, string>;
  crossDate: boolean;
  crossDateOnlyRead: boolean;

}
