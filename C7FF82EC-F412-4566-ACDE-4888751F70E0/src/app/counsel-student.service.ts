import { map } from 'rxjs/operators';
import { Injectable } from "@angular/core";
import { DsaService } from './dsa.service';

@Injectable({
  providedIn: "root"
})
export class CounselStudentService {
  public isLoading: boolean;
  public studentMap: Map<string, CounselStudent>;
  public classMap = new Map<string, CounselClass>();
   /**輔導班級 */
  public counselClass: CounselClass[];
  public counselClassByGrade : Map<string,CounselClass> =new Map();

  public teacherInfo: TeacherInfo = new TeacherInfo();

  /** */
  public getCounselClass(targetRole: string) {
    // console.log("CounselClass333",this.counselClass)
    let list: CounselClass[] = [];
    this.counselClass.forEach((item) => {
      if (item.Role.indexOf(targetRole) >= 0)
        list.push(item);
        // console.log('item',item);
    });
    return list;

  }

  /**目前學年度*/
  public currentSchoolYear: number;
  /**目前學期 */
  public currentSemester: number;
  public meetTime: string ;
  /** 認輔學生 */
  public guidanceStudent: CounselStudent[];
  /** 搜尋學生*/
  public searchStudent: CounselStudent[];

  // public currentStudent: CounselStudent;

  constructor(private dsaService: DsaService) {
    this.reload();
  }

  async reload() {
    this.isLoading = true;
    this.studentMap = new Map<string, CounselStudent>();
    this.classMap = new Map<string, CounselClass>();
    this.counselClass = [];
    this.guidanceStudent = [];

    this.classMap = new Map<string, CounselClass>();

    // 取得目前學年度學期
    let currentSemeRsp = await this.dsaService.send("GetCurrentSemester", {});
    [].concat(currentSemeRsp.CurrentSemester || []).forEach(sems => {
      this.currentSchoolYear = sems.SchoolYear;
      this.currentSemester = sems.Semester;
    });
    // console.log(this.currentSchoolYear,this.currentSemester);

    // 取得登入教師名稱
    let teacher = await this.dsaService.send("GetTeacher", {});
    [].concat(teacher.Teacher || []).forEach(tea => {
      this.teacherInfo = new TeacherInfo();
      this.teacherInfo.Name = tea.Name;
      this.teacherInfo.ID = tea.ID;
      this.teacherInfo.NickName = tea.NickName;
    });

    this.dsaService.getSessionIDAndAccessPoint();

    // 班導師，輔導老師，會讀取目前學年度學期
    let resp = await this.dsaService.send("GetCounselStudent", {}); 
    // dev_mod_console 
    console.log("GetCounselStudent",resp ) ;
    [].concat(resp.Student || []).forEach(stuRec => {
      //建立學生
      if (!this.studentMap.has(stuRec.StudentID)) {
        this.studentMap.set(
          stuRec.StudentID, {
            StudentID: stuRec.StudentID,
            SchoolYear: this.currentSchoolYear,
            Semester: this.currentSemester,
            ClassName: stuRec.ClassName,
            SeatNo: stuRec.SeatNo,
            StudentNumber: stuRec.StudentNumber,
            StudentName: stuRec.StudentName,
            Gender: stuRec.Gender,
            Status: stuRec.Status,
            Role: [],
            InterviewCount: parseInt(stuRec.InterviewCount),
            LastInterviewDate: stuRec.LastInterviewDate,
            LastInterviewContact: stuRec.LastInterviewContact,
            LastInterviewType: stuRec.LastInterviewType,
            LastInterviewTypeOther: stuRec.LastInterviewTypeOther,
            LastInterviewContent: stuRec.LastInterviewContent,
            LastInterviewContactItem: stuRec.LastInterviewContactItem,
            LastInterviewReferral: stuRec.LastInterviewReferral,
            ReferralStatus: stuRec.ReferralStatus,
            PhotoUrl: `${this.dsaService.AccessPoint}/GetStudentPhoto?stt=Session&sessionid=${this.dsaService.SessionID}&parser=spliter&content=StudentID:${stuRec.StudentID}`,
            SchoolYearVG: parseInt(stuRec.SchoolYearVG),
            SemesterVG: parseInt(stuRec.SemesterVG),
            ContactNameVg: stuRec.ContactNameVg,
            CounselTypeVg: stuRec.CounselTypeVg,
            LastUpdateVg: stuRec.LastUpdateVg,
            VGCount: stuRec.VGCount,
            InterviewContentCount: stuRec.InterviewContentCount,
            InterviewContactItemCount: stuRec.InterviewContactItemCount,
            StuCounselNumber: stuRec.StuCounselNumber
          } as CounselStudent);
      }
      let stu = this.studentMap.get(stuRec.StudentID);
      if (stu.Role.indexOf(stuRec.Role) < 0) {
        stu.Role.push(stuRec.Role);
      }
      //填入認輔名單
      if (stuRec.Role === "認輔老師")
        this.guidanceStudent.push(stuRec);
      //建立班級
      if (stuRec.ClassID) {
        if (!this.classMap.has(stuRec.ClassID)) {
          this.classMap.set(stuRec.ClassID, {
            ClassID: stuRec.ClassID,
            GradeYear: stuRec.GradeYear,
            ClassName: stuRec.ClassName,
            HRTeacherName: stuRec.HRTeacherName,
            HRTeacherNickName: stuRec.HRTeacherNickName,
            Role: [],
            Student: []
          } as CounselClass);
          this.counselClass.push(this.classMap.get(stuRec.ClassID));
        }
        let cls = this.classMap.get(stuRec.ClassID);
        if (cls.Role.indexOf(stuRec.Role) < 0) {
          cls.Role.push(stuRec.Role);
        }
        let add: boolean = true;
        cls.Student.forEach(x => {
          if (x.StudentID === stu.StudentID) {
            add = false;
          }
        });
        if (add)
          cls.Student.push(stu);
      }
    });

    // // 取得認輔資料 _.GetGuidanceStudent
    // let respGS = await this.dsaService.send("GetGuidanceStudent", {});
    // let gsData: CounselStudent[] = [];
    // [].concat(respGS.Student || []).forEach(stuRec => {
    //   let stu: CounselStudent = new CounselStudent();
    //   stu.StudentID = stuRec.StudentID;
    //   stu.SchoolYear = stuRec.SchoolYear;
    //   stu.Semester = stuRec.Semester;
    //   stu.ClassName = stuRec.ClassName;
    //   stu.SeatNo = stuRec.SeatNo;
    //   stu.StudentNumber = stuRec.StudentNumber;
    //   stu.StudentName = stuRec.StudentName;
    //   stu.Status = stuRec.Status;
    //   stu.Role = stuRec.Role;
    //   stu.InterviewCount = stuRec.InterviewCount;
    //   stu.LastInterviewDate = stuRec.LastInterviewDate;
    //   stu.LastInterviewContact = stuRec.LastInterviewContact;
    //   stu.LastInterviewType = stuRec.LastInterviewType;
    //   stu.PhotoUrl = `${
    //     this.dsaService.AccessPoint
    //     }/GetStudentPhoto?stt=Session&sessionid=${
    //     this.dsaService.SessionID
    //     }&parser=spliter&content=StudentID:${stuRec.StudentID}`;
    //   gsData.push(stu);
    // });
    // this.guidanceStudent = gsData;

    this.isLoading = false;
  }

  // 搜尋學生
  async SearchText(text: string) {
    this.searchStudent = [];
    let SearchStudent = await this.dsaService.send("SearchStudent", { Request: { SearchText: text } });
    [].concat(SearchStudent.Student || []).forEach(stud => {
      let Student: CounselStudent = new CounselStudent();
      Student.StudentID = stud.StudentID;
      Student.StudentNumber = stud.StudentNumber;
      Student.StudentName = stud.Name;
      Student.ClassName = stud.ClassName;
      Student.SeatNo = stud.SeatNo;
      Student.Status = stud.Status;
      Student.IDNumber = stud.IDNumber;
      this.searchStudent.push(Student);
    });
  }

}


export class CounselClass {
  ClassID: string;
  GradeYear: string;
  ClassName: string;
  HRTeacherName: string;
  HRTeacherNickName: string;
  Role: string[];
  Student: CounselStudent[];
}

export class CounselStudent {

  /**初始化 */
  init(counselStudent : CounselStudent){
      this.StudentID =counselStudent.StudentID ;
      this.StudentName =counselStudent .StudentName;
  }
  StuCounselNumber :string ;
  StudentID: string;
  SchoolYear: number;
  Semester: number;
  ClassName: string;
  SeatNo: string;
  Gender: string;
  StudentNumber: string;
  StudentName: string;
  IDNumber: string;
  Status: string;
  Role: string[];
  InterviewCount: number;
  LastInterviewDate: string;
  LastInterviewContact: string;
  LastInterviewType: string;
  LastInterviewTypeOther: string;
  // 內容
  LastInterviewContent: string;
  // 聯絡事項
  LastInterviewContactItem: string;
  LastInterviewReferral: boolean;
  ReferralStatus: string;
  PhotoUrl: string;
  // 認輔資料
  SchoolYearVG: number;
  SemesterVG: number;
  ContactNameVg: string;
  CounselTypeVg: string;
  LastUpdateVg: string;
  VGCount: string;
  InterviewContentCount: string;
  InterviewContactItemCount: string;

  // lastCaseInterviewDate: string;
  // lastCaseInterviewContact: string;
  // lastCaseInterviewType: string;
  // lastCaseInterviewContent: string;
}

export class SemesterInfo {
 public SchoolYear: number;
 public Semester: number;
}

// 登入教師
export class TeacherInfo {
  Name: string;
  NickName: string;
  ID: string;
}
