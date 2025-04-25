import { Injectable } from '@angular/core';
import { SourceTeacherRec } from './data/teacher';
import { GadgetService } from './gadget.service';

@Injectable({
  providedIn: 'root'
})
export class CoreService {

  private _cnStaff: any;
  private _cnPublic: any;

  constructor(private gadget: GadgetService) { }

  async getCNStaff() {
    if (!this._cnStaff) this._cnStaff = await this.gadget.getContract('cloud.staff');
  }
  async getCNPublic() {
    if (!this._cnPublic) this._cnPublic = await this.gadget.getContract('cloud.public');
  }

  async getNewCode(): Promise<string> {
    await this.getCNPublic();

    const rsp = await this._cnPublic.send('beta.GetNewCode');
    return rsp.Code || '';
  }

  async getTeachers(): Promise<SourceTeacherRec[]> {
    await this.getCNStaff();

    const rsp = await this._cnStaff.send('beta.GetTeacher2024', {
      TeacherStatus: '1'
    });
    return [].concat(rsp.Teacher || []);
  }

  async addTeacher(data: any): Promise<any> {
    await this.getCNStaff();

    const rsp = await this._cnStaff.send('beta.AddTeacher', {
      Teacher: data
    });
    return rsp || '';
  }

  async updateTeacher(identifyField: string[], data: any): Promise<any> {
    await this.getCNStaff();

    const rsp = await this._cnStaff.send('beta.UpdateTeacher', {
      IdentifyField: identifyField,
      Teacher: data
    });
    return rsp.Code || '';
  }

  async delTeacher(id: string): Promise<any> {
    await this.getCNStaff();

    const rsp = await this._cnStaff.send('beta.DelTeacher', {
      TeacherId: id
    });
    return rsp.Code || '';
  }

  async addAndDelTagTeacher(data: any): Promise<any> {
    await this.getCNStaff();

    const rsp = await this._cnStaff.send('beta.AddAndDelTagTeacher', {
      Teacher:{
        TeacherId: data.TeacherId,
        TagId: data.TagIds
      }
    });
    return rsp.Code || '';
  }

  async getTags(): Promise<any> {
    await this.getCNStaff();

    const rsp = await this._cnStaff.send('beta.GetTag', {
      Category: 'Teacher'
    });
    return [].concat(rsp?.Tag?.Prefixs || [])
  }

  async addTag(data: any): Promise<any> {
    await this.getCNStaff();
    console.log(data);
    const rsp = await this._cnStaff.send("beta.AddTag", {
      Tag: {
        Category: "Teacher",
        TagName: data.TagName,
        Color: data.Color,
        Prefix: data.Prefix,
      },
    });
    return rsp.Code || "";
  }

  async updateTag(data: any): Promise<any> {
    await this.getCNStaff();
    console.log(data);
    const rsp = await this._cnStaff.send('beta.UpdateTag', {
      Tag: {
        Category: "Teacher",
        TagId: data.TagId,
        TagName: data.TagName,
        Color: data.Color,
        Prefix: data.Prefix,
      },
    });
    return rsp.Code || '';
  }

  async delTag(data: any): Promise<any> {
    await this.getCNStaff();
    console.log(data);
    const rsp = await this._cnStaff.send('beta.DelTag', {
      TagId: data.TagId
    });
    return rsp.Code || '';
  }
  
  // 轉換欄位名稱
  replaceMappingFieldName(txt: string = '') {
    txt = txt.replace(/TeacherId/gi, '教師系統編號');
    txt = txt.replace(/TeacherName/gi, '教師姓名');
    txt = txt.replace(/Nickname/gi, '暱稱');
    txt = txt.replace(/Gender/gi, '性別');
    txt = txt.replace(/LinkAccount/gi, '登入帳號');
    txt = txt.replace(/TeacherCode/gi, '教師代碼');
    txt = txt.replace(/TeacherNumber/gi, '教師編號');
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
          ActionBy: 'ischool web 教師管理 2.0',
          Description: description,
        }
      }
    });
  }
}
