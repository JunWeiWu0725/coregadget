import { Injectable } from "@angular/core";
import { ITeacher } from "./case/vo";
import { DsaService } from "./dsa.service";
interface IPermissions {
  code?: string;
  permittedRole: string;
  permitted: boolean;
  functionName?: string;
}
@Injectable({
  providedIn: "root"
})


export class RoleService {

  private _loginTeacher: ITeacher;
  private _loginTeacherName = '';
  private _role: string[];

  private _isLoading = true;
  /** 輔導老師 認輔老師 班導師*/
  private _enableCounsel: IPermissions = { code: "A1D56201-ADEB-40E1-B51C-F2635EDEE167", permittedRole: "輔導老師 認輔老師 班導師", permitted :false, functionName: "個案認輔"};
  /** 統計資訊 */
  private _enableCounselStatistics: IPermissions = { permittedRole: "管理者 輔導老師", permitted: false };
  /** 管理者 輔導老師 */
  private _enableReferral: IPermissions = { permittedRole: "管理者 輔導老師", permitted: false };
  /** 管理者 輔導老師*/
  private _enableCase: IPermissions = { permittedRole: "管理者 輔導老師", permitted: false };
  /** 管理者 輔導老師 認輔老師 */
  private _enableInterviewStatistics: IPermissions = { permittedRole: "管理者 輔導老師 認輔老師", permitted: false };
  /** 管理者 */
  private _enableAdmin: IPermissions = { permittedRole: "管理者", permitted: false };
  /** 管理者 輔導老師 */
  private _enableComprehensive: IPermissions = { permittedRole: "管理者 輔導老師", permitted: false };
  /** 管理者 */
  private _enableTransferStudents: IPermissions = { permittedRole: "管理者", permitted: false };
  /** 管理者 輔導老師 */
  private _enablePsychologicalTest: IPermissions = { permittedRole: "管理者 輔導老師", permitted: false };
  /** 管理者 輔導老師 校外心理師 兼任輔導 認輔老師 認輔老師 */
  private _enableTeacherService: IPermissions = { permittedRole: "管理者 輔導老師 校外心理師 兼任輔導 認輔老師 認輔老師", permitted: false };

  public get isLoading() {
    return this._isLoading;
  }
  /** 取得目前教師資料 */
  public get loginTeacher() {
    return this._loginTeacher;
  }

  /** 取得目前登入教師之特 */
  public get loginTeacherName() {
    return this._loginTeacherName;
  }


  public get enableCounsel() {
    return this._enableCounsel.permitted;
  }
  public get enableCounselStatistics() {
    return this._enableCounselStatistics.permitted;
  }

  public get enableReferral() {
    return this._enableReferral.permitted;
  }
  public get enableCase() {
    return this._enableCase.permitted;
  }
  public get enableInterviewStatistics() {
    return this._enableInterviewStatistics.permitted;
  }
  public get enableComprehensive() {
    return this._enableComprehensive.permitted;
  }

  public get enableTransferStudents() {
    return this._enableTransferStudents.permitted;
  }
  public get enablePsychologicalTest() {
    return this._enablePsychologicalTest.permitted;
  }

  public get enableTeacherService() {
    return  this._enableTeacherService.permitted
  }

  public get enableAdmin() {
    return this._enableAdmin.permitted;
  }
  public get role() {
    return this._role;
  }

  public permittedRole(permission: IPermissions) {
   return permission.permittedRole;
  }

  constructor(private dsaService: DsaService) {
  }

  async reload() {

    this._isLoading = true;
    await this.loadLoginTeacherData();
    let resp = await this.dsaService.send("GetRole", {});

    this._enableCounsel.permitted = false;
    this._enableCounselStatistics.permitted = false;
    this._enableReferral.permitted = false;
    this._enableCase.permitted = false;
    this._enableInterviewStatistics.permitted = false;

    this._role = [].concat(resp.Role || []);

    if (
      this._role.indexOf("輔導老師") >= 0 ||
      this._role.indexOf("認輔老師") >= 0 ||
      this._role.indexOf("班導師") >= 0
    ) {
      this._enableCounsel.permitted = true;
    }
    if (
      this._role.indexOf("管理者") >= 0
    ) {
      this._enableCounselStatistics.permitted = true;
    }
    if (
      this._role.indexOf("管理者") >= 0 ||
      this._role.indexOf("輔導老師") >= 0
    ) {
      this._enableReferral.permitted = true;
    }
    if (
      this._role.indexOf("管理者") >= 0 ||
      this._role.indexOf("輔導老師") >= 0
    ) {
      this._enableCase.permitted = true;
    }
    if (
      this._role.indexOf("管理者") >= 0 ||
      this._role.indexOf("輔導老師") >= 0 ||
      this._role.indexOf("認輔老師") >= 0
      // this._role.indexOf("校外心理師") >= 0
    ) {
      this._enableInterviewStatistics.permitted = true;
    }

    if (
      this._role.indexOf("管理者") >= 0 ||
      this._role.indexOf("輔導老師") >= 0
    ) {
      this._enableComprehensive.permitted = true;
    }

    if (
      this._role.indexOf("管理者") >= 0
    ) {
      this._enableTransferStudents.permitted = true; // TODO: 要改成正確的
    }

    if (
      this._role.indexOf("管理者") >= 0 ||
      this._role.indexOf("輔導老師") >= 0
    ) {
      this._enablePsychologicalTest.permitted = true;
    }

    if (
      this._role.indexOf("管理者") >= 0
    ) {
      this._enableAdmin.permitted = true;
    }

    if (
      this._role.indexOf("管理者") >= 0 ||
      this._role.indexOf("輔導老師") >= 0 ||
      this._loginTeacher.Role =="校外心理師" ||
      this._loginTeacher.Role =="兼任輔導" ||
      this._loginTeacher.Role =="認輔老師" ||
      this._role.indexOf("認輔老師") >= 0
    ) {
      this._enableTeacherService.permitted = true;
    }



    // 未開發功能不能用
    this._enableInterviewStatistics.permitted = false;

    this._isLoading = false;
  }


  /** 取得   */
  async loadLoginTeacherData() {

    // 取得登入教師名稱
    let teacher = await this.dsaService.send("GetTeacher", {});
    [].concat(teacher.Teacher || []).forEach(tea => {
      this._loginTeacherName = tea.Name;
      this._loginTeacher = tea;
    });
  }
}
