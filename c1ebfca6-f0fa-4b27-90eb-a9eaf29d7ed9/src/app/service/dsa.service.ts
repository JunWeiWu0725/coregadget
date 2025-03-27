import { Contract } from './gadget.service';
import { Injectable } from '@angular/core';
import { GadgetService } from './gadget.service';
import { RollCallRateDenominator } from '../pages/vo';
import { now } from 'moment';


@Injectable()
export class DSAService {

  private ready: Promise<void>;
  private contract: Contract;
  private basicContract: Contract

  private selectedDay : any;

  public getSelectedDay(){
    return this.selectedDay;
  }

  public setSelectedDay(targetDay){
    this.selectedDay = targetDay;
  }


  constructor(private gadget: GadgetService) {
    this.ready = this.initContract();
  }

  private async initContract() {
    try {
      this.contract = await this.gadget.getContract('campus.rollcall.teacher');
      this.basicContract = await this.gadget.getContract('basic.public');
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async send(serviceName: string, body?: any) {
    await this.ready;
    const rsp = await this.contract.send(serviceName, body);
    return rsp;
  }


  /**
   * 取得缺曠類別節次
   */
  public async getGetConfig() {
    await this.ready;

    const rsp = await this.contract.send('GetConfig');

    return rsp && rsp.Config;
  }

  /**
   * 取得班級課程學生清單。
   * @param type 類型：Course、Class
   * @param id 編號。
   * @param date 日期。
   */
  public async getStudent(type, id, date, period) {
    await this.ready;

    const req: any = {
      Request: {
        Type: type,
        OccurDate: date,
        Period: period,
        Platform : 'web'

      }
    }

    if (type === "Course") req.Request.CourseID = id;
    if (type === "Class") req.Request.ClassID = id;

    const rsp = await this.contract.send('GetStudent', req);
    console.log("rsp321",rsp);
    return [].concat((rsp && rsp.Student) || []).map(function (item) { return item as Student; });
  }

  /**
   * 儲存點名資料。
   */
  public async setRollCall(occurDate: string,type: GroupType, id: string, period: string, data: RollCallCheck[]) {
    await this.ready;

    const req: any = {
      OccurDate: occurDate,
      Period: period,
      Student: data.map((item) => {
        return {
          ID: item.ID
          , Absence: item.Absence
        };
      })//JSON.stringify(data),
    };

    if (type === 'Course') {
      req.CourseID = id;
    } else {
      req.ClassID = id;
    }

    const rsp = await this.contract.send('SetRollCall', req);

    return rsp;
  }

  /**
   * 儲存課堂點名小幫手
   */
  public async setHelper(type: string, targetID: string, studentID: string) {
    await this.ready;
    var req: any;

    if (type == "Class") {
      req = {
        RefClassID: targetID,
        RefStudentID: studentID
      };
    }
    if (type == "Course") {
      req = {
        RefCourseID: targetID,
        RefStudentID: studentID
      };
    }
    const rsp = await this.contract.send('SetHelper', req);

    return rsp;
  }

  public getAccessPoint() {
    return this.contract.getAccessPoint;
  }

  public getSessionID() {
    return this.contract.getSessionID;
  }

  /**
   * 取得今日日期。
   */
  public async getToday() {

    await this.ready;
    let rsp = await this.basicContract.send('beta.GetNow', {
      Pattern: 'yyyy/MM/dd'
    });
    return rsp.DateTime;
  }

  public async getSchedule(date: string) {
    await this.ready;

    const rsp = await this.contract.send('GetSchedule', {
      Request: {
        OccurDate: date
      }
    });

    const courses = [].concat(rsp && rsp.Course || []) as CourseConf[];
    const schedules = [].concat(rsp && rsp.Schedule || []) as Schedule[];
    const periods = [].concat(rsp && rsp.Period || []) as PeriodConf[];

    periods.forEach(v => {
      v.Absence = [].concat(v.Absence || []) as AbsenceConf[];
    });

    return { CourseConf: courses, PeriodConf: periods, Schedule: schedules } as ConfigData
  }

  public async getAllCourse() {
    await this.ready;
    const rsp = await this.contract.send('GetAllCourse');
    const gradeYears = [].concat(rsp && rsp.GradeYear || []) as GradeYearObj[];

    gradeYears.forEach(v => {

      v.Class = [].concat(v.Class || []) as ClassObj[];

      v.Class.forEach(v => {
        v.Course = [].concat(v.Course || []) as CourseObj[];
      });

    });

    return gradeYears;
  }

  public async getDayMakeUp() {
    await this.ready;
    const rsp = await this.contract.send('GetDaysToMakeUp');
    const today = await this.getToday(); // 獲取今天的日期
    const dayMakeUp = rsp.Result.day;
  
    const generateDates = (count: number): DayMakeUp[] => {
      const dates: DayMakeUp[] = []; // 用於存儲結果的陣列

      let currentDate = new Date(today); // 使用新的變數來追蹤日期
      const formattedToday = currentDate.toLocaleDateString('zh-TW', { 
        year: 'numeric', month: '2-digit', day: '2-digit' 
      }).replace(/\//g, '-');
      // 定義星期的標記對應
      const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  
      // 無論如何都加入今天的日期
      dates.push({
        label: `${formattedToday} - ${weekDays[currentDate.getDay()]}`,
        value: formattedToday
      });
  
      if (count === 0) {
        // 如果 count 是 0，僅返回今天
        return dates;
      }
  
      let generatedCount = 1; // 因為今天已經計算在內
  
      while (generatedCount <= count) {
        // 減少一天
        currentDate.setDate(currentDate.getDate() - 1);
  
        const dayOfWeek = currentDate.getDay();
          const formattedDate = currentDate.toLocaleDateString('zh-TW', { 
            year: 'numeric', month: '2-digit', day: '2-digit' 
          }).replace(/\//g, '-');;
          dates.push({
            label: `${formattedDate} - ${weekDays[dayOfWeek]}`,
            value: formattedDate
          });
  
          generatedCount++; // 增加有效生成的日期數
      }
  
      return dates;
    };
  
    // 生成日期列表
    const result = generateDates(dayMakeUp);
  
    console.log("生成的日期清單:", result);
    return result;
  }


  public async getAllClass() {
    await this.ready;
    const rsp = await this.contract.send('GetAllClass');
    const gradeYears = [].concat(rsp && rsp.GradeYear || []) as GradeClassRecords[];

    gradeYears.forEach(v => {
      v.Class = [].concat(v.Class || []) as ClassRecord[];
    });

    return gradeYears;
  }

  //取得設定
  public async getTeacherSetting() {

    await this.ready;
    const rsp = await this.contract.send('GetTeacherSetting');

    var teacherSetting = JSON.parse(rsp.Content);

    if (!teacherSetting.usePhoto && teacherSetting.usePhoto !== false) teacherSetting.usePhoto = (teacherSetting.use_photo === false ? false : true)
    if (!teacherSetting.teacherKey) teacherSetting.teacherKey = "";

    return teacherSetting;
  }

  /** 林口康橋客制 */
  public async getCheckIntime(classID :string ,date :string ,type:string  ) {
    try {
      let result = null
      const rsp = await this.contract.send('_.GetCheckInTime',{
       TargetID :classID ,
       Date : "",
       Type : type

      });
      result =[].concat(rsp.rs||[])
      console.log("rsp",rsp )
      return result;
    } catch (ex) {
      alert("取得讀哪資料發生錯誤!"+JSON.stringify(ex))
    }
  }


  // 依班級 ID get 出席率母數
  public async getAbsenRateDenominator(courseID: string) {

    // let result : RollCallRateDenominator  = new RollCallRateDenominator ();
    let result: RollCallRateDenominator;
    try {
      await this.ready;
      const rsp = await this.contract.send('GetAbsenRateDenominatorbyCourseID', { CourseID: courseID });
      result = rsp.RateSetting;
      //  result.IsUseWeeks=rsp.RateSetting.IsUseWeeks;

    } catch (ex) {
      alert("取得課程出席率母數發生錯誤: \n" + ex);
      console.log(ex)
    }
    return result;
  }


  /**
   *
   * 取得出席率母數是依【實際點名次數】還是【上課週數*節數】
   * @memberof DSAService
   */
  async getAbsenRateDenominatorDepen() {
    let isUseWeekFromCourse: boolean;
    const rsp = await this.contract.send('GetAbsenRateDenominaton', {});
    isUseWeekFromCourse = rsp.RateSetting.IsUseWeeks == 'true';
    // console.log(" rsp.RateSetting.IsUseWeeks =='true';"  ,rsp.RateSetting.IsUseWeeks)
    return isUseWeekFromCourse
  }

  //取得出席率
  public async getAbsenceRate(courseId: string) {
    await this.ready;
    const rsp = await this.contract.send('GetAttendanceRate', {
      Request: {
        CourseId: courseId
      }
    });
    //取得學生出席率
    const studentsAbsenceRate = rsp.Student;
    const absenceRateObj = {}
    //轉成 JSON 格式 
    if (studentsAbsenceRate) {
      for (var i = 0; i < studentsAbsenceRate.length; i++) {
        absenceRateObj[studentsAbsenceRate[i].StudentID] = studentsAbsenceRate[i].AbsenceRate;
      }
      return absenceRateObj;
    }
  }

  public async setTeacherSetting(settingJson: JSON) {
    this.contract.send('SetTeacherSetting', {
      Request: {
        Content: JSON.stringify(settingJson)
      }
    })
  }

  
}

export type GroupType = '' | 'Course' | 'Class'

export type ConfigData = { CourseConf: CourseConf[], PeriodConf: PeriodConf[], Schedule: Schedule[] };

/**
 * 班級課程項目。
 */
export interface RollCallRecord {
  UID: string;
  Name: string;
  Type: GroupType;
  Students: string;
}

export interface Config {
  Timestamp: string;
  Periods: any;
  Absences: any;
}

export interface DayMakeUp {
  label: string;
  value: string;
}

export interface Student {
  StudentID: string;
  Name: string;
  Name2 :string;
  SeatNo: string;
  StudentNumber: string;
  ClassName: string;
  // Attendance: AttendanceItem;
  PhotoUrl: string; //2018/10/24 new
  AbsenceRate: number;  //Jean 20190522 增加 出席率
  Absence: Absence;
  PrevAbsence: PrevAbsence;
  EnglishName: string;
}

export interface Absence {
  AbsenceName: string;
  HelperRollCall: string;
  RollCall: string;
  RollCallChecked: string;
}

export interface PrevAbsence {
  Period: string;
  AbsenceName: string;
}

export interface AttendanceItem {
  Period: PeriodStatus;
}

/**
 * 代表某一節次的缺曠狀態。
 */
export interface PeriodStatus {
  /** '@text' 取得節次名稱。 */
  [x: string]: string;

  /**
   * 缺曠類型。(另外可使用 periodItem['@text'] 取得節次名稱。)。
   */
  AbsenceType: string;
}

export interface RollCallCheck {
  //** 學生編號。 */
  ID: string;

  /** 缺曠類別。 */
  Absence: string;
}

/** 取得今日點名/建議點名
 * 並且組織出可點名缺曠別
 */
export interface Schedule {
  Checked: string;
  ClassID: string;
  ClassName: string;
  CourseID: string;
  CourseName: string;
  Period: string;
  StudentCount: string;
}

export interface PeriodConf {
  [x: string]: any;
  Actor: string;
  EndTime: string;
  Name: string;
  StartTime: string;
  Type: string;
  Absence: AbsenceConf[];
}

export interface AbsenceConf {
  Abbr: string;
  Color: string;
  Name: string;
}

export interface CourseConf {
  CourseID: string;
  CourseName: string;
  // 小幫手資料
  StudentID: string;
  StudentName: string;
  StudentNumber: string;
}

export interface GradeYearObj {
  GradeYear: string;
  Class: ClassObj[];
}

export interface ClassObj {
  ClassID: string;
  ClassName: string;
  Course: CourseObj[];
}

export interface CourseObj {
  CourseID: string;
  CourseName: string;
  Credit: string;
  Subject: string;
  TeacherID: string;
  TeacherName: string;
  AllTeacherString: string;
}

export interface GradeClassRecords {
  GradeYear: string;
  Class: ClassRecord[];
}

export interface ClassRecord {
  ClassID: string;
  ClassName: string;
  DisplayOrder: string;
  RefTeacherID: string;
  TeacherName: string;
}