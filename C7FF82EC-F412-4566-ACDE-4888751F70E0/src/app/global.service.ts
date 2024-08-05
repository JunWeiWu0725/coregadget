import { Injectable } from '@angular/core';
import { DsaService } from './dsa.service';
import { RoleService } from './role.service';

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
  public settingLists : any[] = []
  public isCaseInterviewOpenDefault :boolean
  public isCounselOpenDefault :boolean
  // currentTeacherRole : ''
  constructor(
    private dsaService: DsaService,
    private roleService: RoleService
  ) {
    this.mode = gadget.params.mode;
    if (this.roleService.isTeacher) this.loadingSettingList();
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

  getDayOfWeekByString(date: string): string {

    const daysOfWeek = ['日', '一', '二', '三', '四', '五', '六'];
    return daysOfWeek[new Date(date).getUTCDay()];
  }




  /** */
  async loadingSettingList () {
    try {
      let resp = await this.dsaService.send("Admin.GetSetting", {});
      this.settingLists = [].concat(resp.result || []);

      this.isCaseInterviewOpenDefault = this.settingLists.find(x=>x.functionality_code == 'case_counsel_is_private_default').content=='true'
      this.isCounselOpenDefault = this.settingLists.find(x=>x.functionality_code == 'interview_is_private_default').content=='true'

      console.log("isCounselOpenDefault", this.isCounselOpenDefault)
    } catch (ex) {
      alert(JSON.stringify(ex))
    }

  }

  /** 轉換日期格式 */
  public   formatToTaiwanDate(date: Date): string {
    const westernYear = date.getFullYear();
    const taiwanYear = westernYear - 1911 ;
    const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() 從 0 開始計算，所以需要加 1
    const day = String(date.getDate()).padStart(2, '0');
    return `${taiwanYear}-${month}-${day}`;
  }
}
