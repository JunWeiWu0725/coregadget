import { CUSTOM_ELEMENTS_SCHEMA ,Component, OnInit } from '@angular/core';
import { TeacherCounselRole } from "../counsel-teacher-role-vo";
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { DsaService } from "../../../dsa.service";
import { HttpClient } from '@angular/common/http';
import { GlobalService } from "../../../global.service";

@Component({
  selector: 'app-add-counsel-teacher-role-modal',
  templateUrl: './add-counsel-teacher-role-modal.component.html',
  styleUrls: ['./add-counsel-teacher-role-modal.component.css']
})
export class AddCounselTeacherRoleModalComponent implements OnInit {

  isSaveButtonDisable: boolean = true;
  isCancel: boolean = true;
  myControl = new FormControl();
  options: string[] = [];
  option: string;
  filteredOptions: Observable<string[]>;
  selectRole: string = "";
  selectReportRole : string = "" ;
  selectTeacherName: string = "請選擇教師";
  selectTeacherID: string = "";
  selectTeahcer: TeacherCounselRole;
  TeacherCounselNumber :string;
  JobTitle : string ;
  /**原有的教師資料(確認教師編碼是否重複用) */
  existTeacherConselRole :TeacherCounselRole [] =[] ;
  notTeachersCounselRole: TeacherCounselRole[] = [];
  counselRole: string[] = [];
  counselReportRoles :string[] = [] ;
  userIP: string = '';

  constructor(private dsaService: DsaService, private http: HttpClient, private globalService: GlobalService) { }

  async ngOnInit() {

    this.filteredOptions = this.myControl.valueChanges
      .pipe(
        startWith(''),
        map(value => this._filter(value))
      );
    this.userIP = await this.fetchIp();
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.options.filter(option => option.toLowerCase().includes(filterValue));
  }

  cancel() {
    this.isCancel = true;
    $("#addCounselTeacherRole").modal("hide");
  }

  /** 選擇角色 */
  SetSelectRole(item: string) {
    this.selectRole = item;
    this.chkSaveButton();
  }


  /** 呈報輔導人力身分 */
  SetSelectReportRole(item: string) {
    this.selectReportRole = item;
    this.chkSaveButton();
  }


  // 選擇老師
  SetSelectTeacherName(item) {
    this.selectTeacherName = item;
    this.chkSaveButton();
  }

  chkSaveButton() {
    if (this.selectRole === '請選擇身分' || this.selectTeacherName === '請選擇教師' || this.selectReportRole === '請選擇輔導人力身分')
      this.isSaveButtonDisable = true;
    else
      this.isSaveButtonDisable = false;
  }



  save() {
    this.isCancel = false;
    let pass: boolean = false;
    this.selectTeacherID = '';
    this.notTeachersCounselRole.forEach(item => {
      if (this.selectTeacherName === item.TeacherName) {
        this.selectTeacherID = item.TeacherID;
      }
    });

    if (this.counselRole.includes(this.selectRole) && this.selectTeacherID != '') {
      pass = true;
    }

    if (pass) {
      this.SetTeachersCounselRole();
    } else {
      alert("無法儲存");
    }
  }



  /**確認教師編碼是否重複 */
  checkIsExist( ){
    const teacherRole = this.existTeacherConselRole.find(x=> x.TeacherCounselNumber == this.TeacherCounselNumber )
    if(teacherRole && this.TeacherCounselNumber){
        alert("教師編碼重複!");
        this.TeacherCounselNumber = ""  
    }

  }
  /**批次設定教師角色*/
  async SetTeachersCounselRole() {
   
    let reqTeacherCounselRole = [];
    let itItm = {
      TeacherID: this.selectTeacherID,
      Role: this.selectRole,
      TeacherCounselNumber : this.TeacherCounselNumber ,
      TeacherReportRole : this.selectReportRole ,  
      JobTitle : this.JobTitle 
    }
    reqTeacherCounselRole.push(itItm);
    try {
      let resp = await this.dsaService.send("SetTeachersCounselRole", {
        Request: { TeacherCounselRole: reqTeacherCounselRole }
      });

      // 確保 IP 有值，如果沒有就重新抓取
      if (!this.userIP) {
        this.userIP = await this.fetchIp();
      }
      console.log('AddModal - userIP:', this.userIP); // debug
      // alert(`準備記錄新增 log，IP: ${this.userIP}`); // 確認 IP
      // 紀錄新增 Log
      const executor = `${this.globalService.teacherName || '未知使用者'}`;
      
      const content = `新增教師輔導身分：
教師：${this.selectTeacherName}
身分：${this.selectRole}
呈報身分：${this.selectReportRole}${this.TeacherCounselNumber ? '\n教師編碼：' + this.TeacherCounselNumber : ''}${this.JobTitle ? '\n職稱：' + this.JobTitle : ''}
執行者：${executor}`;
      await this.dsaService.send("Share.AddLog", { Request: { Content: content, IP: this.userIP, Action: '新增教師輔導身分' } });

      console.log(resp);
      $("#addCounselTeacherRole").modal("hide");
    } catch (err) {
      console.error("新增錯誤詳細資訊:", err);
      alert('無法新增：' + (err.dsaError ? err.dsaError : JSON.stringify(err, null, 2)));
    }
  }

  async fetchIp(): Promise<string | null> {
    try {
      const result: any = await this.http
        .get("https://api.ipify.org/?format=json")
        .toPromise();
      console.log('fetchIp result:', result); // debug
      return result.ip.trim();
    } catch (error) {
      console.error("抓取 IP 失敗", error);
      // 嘗試其他方式
      try {
        const result2: any = await this.http
          .get("https://httpbin.org/ip")
          .toPromise();
        console.log('fetchIp backup result:', result2); // debug
        return result2.origin;
      } catch (error2) {
        console.error("備用 IP 抓取也失敗", error2);
        return "unknown";
      }
    }
  }
}
