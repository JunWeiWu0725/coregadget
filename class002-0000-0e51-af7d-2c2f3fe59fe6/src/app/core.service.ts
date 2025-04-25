import { Injectable } from '@angular/core';
import { TeacherRec } from './data/teacher';
import { GadgetService } from './gadget.service';

@Injectable({
  providedIn: 'root'
})
export class CoreService {

  private _cnStaff: any;
  private _cnPublic: any;

  public teacherList: TeacherRec[] = [];

  constructor(private gadget: GadgetService) { }

  async getCNStaff() {
    if (!this._cnStaff) this._cnStaff = await this.gadget.getContract('cloud.staff');
  }
  async getCNPublic() {
    if (!this._cnPublic) this._cnPublic = await this.gadget.getContract('cloud.public');
  }

  async init() {
    this.teacherList = await this.getTeachers();
  }

  async getClasses(): Promise<ClassRec[]> {
    await this.getCNStaff();

    const rsp = await this._cnStaff.send('beta.GetClass', {
      ClassStatus: '1',
      StudentStatus: '1, 2',
    });
    return [].concat(rsp.Class || []);
  }

  async getTeachers(): Promise<TeacherRec[]> {
    await this.getCNStaff();

    const rsp = await this._cnStaff.send('beta.GetTeacherV2');
    return [].concat(rsp.Teacher || []);
  }

  // 新增班級
  async addClass(data: {
    ClassName: string,
    GradeYear?: string,
    TeacherId?: string,
    DisplayOrder?: string,
    ClassCode?: string,
    TeacherIdSecondary?: string
  }[]): Promise<any> {
    await this.getCNStaff();

    const rsp = await this._cnStaff.send('beta.AddClass', {
      Class: data
    });

    return [].concat(rsp.NewClasses || []);
  }

  // 更新班級
  async updateClass(identifyField: string[], data: {
    ClassId: string,
    ClassName?: string,
    GradeYear?: string,
    TeacherId?: string,
    DisplayOrder?: string,
    ClassCode?: string,
    TeacherIdSecondary?: string
  }[]): Promise<any> {

    await this.getCNStaff();

    const rsp = await this._cnStaff.send('beta.UpdateClass', {
      IdentifyField: identifyField,
      Class: data,
    });
    return rsp.Info || '';
  }

  // 刪除班級
  async delClass(classIds: string[]): Promise<any> {
    await this.getCNStaff();

    const rsp = await this._cnStaff.send('beta.DelClass', {
      ClassId: classIds
    });
    return rsp.Ids || '';
  }

  // 轉換欄位名稱
  replaceMappingFieldName(txt: string = '') {
    txt = txt.replace(/ClassId/gi, '班級系統編號');
    txt = txt.replace(/ClassName/gi, '班級名稱');
    txt = txt.replace(/GradeYear/gi, '年級');
    txt = txt.replace(/TeacherId/gi, '班導師');
    txt = txt.replace(/TeacherFullName/gi, '班導師');
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
          ActionBy: 'ischool web 班級管理',
          Description: description,
        }
      }
    });
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
  TeacherNickname?: string;
  ClassStudentCount?: string;
  Checked?: boolean;
  TeacherIdSecondary?: string;
  TeacherNameSecondary?: string;
  TeacherNicknameSecondary?: string;
}
