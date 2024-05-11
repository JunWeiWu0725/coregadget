import { CUSTOM_ELEMENTS_SCHEMA ,Component, OnInit } from '@angular/core';
import { TeacherCounselRole } from "../counsel-teacher-role-vo";
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { DsaService } from "../../../dsa.service";

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

  constructor(private dsaService: DsaService) { }

  ngOnInit() {

    this.filteredOptions = this.myControl.valueChanges
      .pipe(
        startWith(''),
        map(value => this._filter(value))
      );
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

      console.log(resp);
      $("#addCounselTeacherRole").modal("hide");
    } catch (err) {
      alert('無法新增：' + err.dsaError.message);
    }
  }
}
