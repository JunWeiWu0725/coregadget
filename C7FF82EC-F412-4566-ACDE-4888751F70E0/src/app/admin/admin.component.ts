import { Component, OnInit, Optional } from '@angular/core';
import { AppComponent } from '../app.component';
import { Router, ActivatedRoute } from '@angular/router';
import { GlobalService } from "../global.service";

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {

  deny: boolean = false;
  isLoading: boolean = false;
  currentItem: string = "";
  isRoleEnable: boolean = false;
  isClassEnable: boolean = false;
  isPsyEnable: boolean = false;
  public counselVisible: boolean = false;

  public teacherTypeStr: string = "教師輔導身分";
  public classTypeStr: string = "負責輔導班級";

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    public globalService: GlobalService,
    @Optional()
    private appComponent: AppComponent
  ) {

  }

  async ngOnInit() {
    /** 畫面左側顯示 */
    this.teacherTypeStr = "教師輔導身分";
    /** 畫面左側顯示 */
    this.classTypeStr = "負責輔導班級";
    this.appComponent.currentComponent = "admin";
    this.isRoleEnable = false;
    this.isClassEnable = false;
    this.isPsyEnable = false;
    this.counselVisible = false;

    if (gadget.params.system_counsel_position === 'referral' || gadget.params.system_counsel_position === 'counselor') {
      this.counselVisible = true;
    }

    /** 這邊可能沒有用到 */
    if (gadget.params.system_counsel_position === 'freshman') {
      // 新生特有
      this.teacherTypeStr = "教師身分";
      this.classTypeStr = "負責班級";

    }
 
    await this.appComponent.GetMyCounselTeacherRole();
    if (this.globalService.MyCounselTeacherRole === '輔導主任') {
      this.currentItem = 'counsel_teacher_role';
      this.isRoleEnable = true;
      this.isClassEnable = true;
      this.isPsyEnable = true;
      this.routeTo('counsel_teacher_role');
    }
    if (this.globalService.MyCounselTeacherRole === '輔導組長') {
      this.currentItem = 'counsel_class';
      this.isClassEnable = true;
      this.isPsyEnable = true;
      this.routeTo('counsel_class');
    }

   
  }

  /**  */
  routeTo(to) {
    //讓特效跑
    setTimeout(
      function () {
        this.router.navigate([].concat(to || []), {
          relativeTo: this.activatedRoute
        });
      }.bind(this),
      200
    );
  }
}
