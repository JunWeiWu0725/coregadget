import { Injectable } from '@angular/core';
import { SchoolClassRec } from './data/school-class';
import { StudentRec } from './data/student';
import { StudentOption } from './data/student-option';
import { StudentParent } from './data/student-parent';
import { GadgetService } from './gadget.service';

@Injectable({
  providedIn: 'root'
})
export class CoreService {

  private _cnStaff: any;
  private _cnPublic: any;
  private _classList: SchoolClassRec[] = [];

  constructor(private gadget: GadgetService) { }

  async getCNStaff() {
    if (!this._cnStaff) this._cnStaff = await this.gadget.getContract('cloud.staff');
  }
  async getCNPublic() {
    if (!this._cnPublic) this._cnPublic = await this.gadget.getContract('cloud.public');
  }

  async init() {
    this._classList = await this.getAllClassList();
  }

  async getNewCode(): Promise<string> {
    await this.getCNPublic();

    const rsp = await this._cnPublic.send('beta.GetNewCode');
    return rsp.Code || '';
  }

  async getStudent(condition: StudentOption): Promise<StudentRec[]> {
    await this.getCNStaff();

    try {
      const rsp = await this._cnStaff.send('beta.GetStudent', condition);
      return [].concat(rsp.Student || []);
    } catch (error) {
      throw (error.dsaError && error.dsaError.message) ? error.dsaError.message : '發生錯誤';
    }
  }

  async addStudent(data: any): Promise<any> {
    await this.getCNStaff();

    const rsp = await this._cnStaff.send('beta.AddStudent', {
      Student: data
    });
    return rsp.Code || '';
  }

  async updateStudent(identifyField: string[], data: any): Promise<any> {
    await this.getCNStaff();

    const rsp = await this._cnStaff.send('beta.UpdateStudent', {
      IdentifyField: identifyField,
      Student: data
    });
    return rsp.Code || '';
  }

  async setStudent256(identifyField: string[], data: any): Promise<any> {
    await this.getCNStaff();

    const rsp = await this._cnStaff.send('beta.SetStudent256', {
      IdentifyField: identifyField,
      Student: data
    });
    return rsp.Code || '';
  }

  async getParentInfo(student): Promise<StudentParent[]> {
    await this.getCNStaff();

    const rsp = await this._cnStaff.send('beta.GetParent', {
      StudentId: student.StudentId
    });
    return [].concat(rsp.StudentParent || []);
  }

  async addParent(data: any): Promise<any> {
    await this.getCNStaff();

    const rsp = await this._cnStaff.send('beta.AddParent', {
      Parent: data
    });
    return rsp.Code || '';
  }

  async updateParent(data: any): Promise<any> {
    await this.getCNStaff();


    const rsp = await this._cnStaff.send('beta.UpdateParent', {
      Parent: data
    });
    return rsp.Code || '';
  }

  async delParent(id: string): Promise<any> {
    await this.getCNStaff();

    const rsp = await this._cnStaff.send('beta.DelParent', {
      RelationId: id
    });
    return rsp.Code || '';
  }

  getClassList() {
    return this._classList || [];
  }

  replaceMappingFieldName(txt: string) {
    txt = txt.replace(/StudentId/gi, '學生系統編號');
    txt = txt.replace(/StudentName/gi, '學生姓名');
    txt = txt.replace(/Gender/gi, '性別');
    txt = txt.replace(/StudentNumber/gi, '學號');
    txt = txt.replace(/SeatNo/gi, '座號');
    txt = txt.replace(/LinkAccount/gi, '登入帳號');
    txt = txt.replace(/StudentCode/gi, '學生代碼');
    txt = txt.replace(/ParentCode/gi, '家長代碼');
    txt = txt.replace(/ClassId/gi, '班級編號');
    txt = txt.replace(/ClassName/gi, '班級名稱');
    txt = txt.replace(/StudentStatus/gi, '狀態');
    return txt;
  }

  // 新增 Log
  async addLog(actionType = '', action = '', description = '', targetId = '') {
    await this.getCNStaff();

    const actor = this._cnStaff.getUserInfo.UserName;

    const rsp = await this._cnStaff.send('beta.AddLog', {
      Request: {
        Log: {
          Actor: actor,
          ActionType: actionType,
          Action: action,
          TargetCategory: '',
          TargetID: targetId,
          ClientInfo: {
            ClientInfo: {}
          },
          ActionBy: 'ischool web 全校學生管理',
          Description: description,
        }
      }
    });
  }

  // 取得使用者dsns
  getDsns() {
    const dsns = this._cnStaff.getUserInfo.Application;
    return dsns;
  }

  // 取得學校名稱
  async getSchoolName() {
    await this.getCNPublic();
    const rsp = await this._cnPublic.send('beta.GetSchoolName');
    return rsp.result.school_name || '';
  }

  // 以班級為單位產生家長代碼
  async batchParentCode(classIds: string[]): Promise<any> {
    await this.getCNStaff();
    const rsp = await this._cnStaff.send("beta.BatchParentCode", {
      Request: {
        ClassID: classIds,
      },
    });
    return rsp.result || "";
  }

  // 以年級為單位產生家長代碼
  async batchParentCodeGradeYear(GradeYears: string[]): Promise<any> {
    await this.getCNStaff();
    const rsp = await this._cnStaff.send('beta.BatchParentCode' , {
      Request: {
        GradeYear: GradeYears
      },
    });
    return rsp.result || '';
  }

  private async getAllClassList() {
    await this.getCNStaff();

    try {
      const rsp = await this._cnStaff.send('beta.GetClass');
      const classes: SchoolClassRec[] = [].concat(rsp.Class || []);
      return classes;
    } catch (error) {
      throw (error.dsaError && error.dsaError.message) ? error.dsaError.message : '發生錯誤';
    }
  }
}

export interface ClassRec {
  ClassId: string;
  ClassName: string;
  GradeYear?: string;
  ClassStatus?: string;
  DisplayOrder?: string;
  ClassCode?: string;
  NamingRule?: string;
  TeacherId?: string;
  TeacherName?: string;
}
