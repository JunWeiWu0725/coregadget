import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  public selectItemText: string;
  public selectTarget: string;
  // 我的輔導教師角色【
  public MyCounselTeacherRole: string;
  // 是否有權限使用 case
  public enableCase: boolean = false;
  /** 教師姓名 */
  public teacherName : string  = '' ;
  public teacherID : string  = '' 
  public currentRole :'班導師'|'認輔老師'|'輔導老師' |string = ''
  // currentTeacherRole : '' 
  constructor() { }

/** 取得老師 的 紀錄 */
  checkAllowUseByTeacherRoleAndWithStudentRole (fun:'列印個人晤談紀錄' ,checkAllowUseByTeacherRoleAndWithStudentRole ) {


  }
}
