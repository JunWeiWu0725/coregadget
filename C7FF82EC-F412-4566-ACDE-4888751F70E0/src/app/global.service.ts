import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  public selectItemText: string;
  public selectTarget: string;
  // 我的輔導教師角色
  public MyCounselTeacherRole: string;
  // 是否有權限使用 case
  public enableCase: boolean = false;
  /** 教師姓名 */
  public teacherName : string  = '' ;
  public teacherID : string  = '' 
  constructor() { }
}
