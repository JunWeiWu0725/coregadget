import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  public mode: boolean
  public selectItemText: string;
  public selectTarget: string;
  // 我的輔導教師角色【
  public MyCounselTeacherRole: string;
  // 是否有權限使用 case
  public enableCase: boolean = false;
  /** 教師姓名 */
  public teacherName: string = '';
  public teacherID: string = ''
  public currentRole: '班導師' | '認輔老師' | '輔導老師' | string = ''
  // currentTeacherRole : '' 
  constructor() {

    this.mode = gadget.params.mode
  }

  /** 取得老師 的 紀錄 */
  checkAllowUseByTeacherRoleAndWithStudentRole(fun: '列印個人晤談紀錄',) {


  }

  getJSON(target: any) {
    return JSON.stringify(target)

  }

  /**  */
  replaceChineseNum(targetString: string) {
    // alert("sss")
    // 顯示目前的東西
    let output = targetString
    const replacements = {
      '一、': '',
      '二、': '',
      '三、': '',
      '四、': '',
      '五、': '',
      '六、': '',
    };

    for (const key in replacements) {
      const regex = new RegExp(key, 'g');
      output = output.replace(regex, replacements[key]);
    }
    return output;

  }


  getDayOfWeek(date: Date): string {
    const daysOfWeek = ['日', '一', '二', '三', '四', '五', '六'];
    return daysOfWeek[date.getUTCDay()];
  }

}
