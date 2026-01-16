import { mode } from './admin/vo';
import { AfterContentInit, AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, HostListener, OnInit, QueryList, ViewChildren } from "@angular/core";
import { ActivatedRoute, Router, RoutesRecognized } from "@angular/router";
import { RoleService } from "./role.service";
import { GlobalService } from "./global.service";
import { DsaService } from "./dsa.service";
import { CommunicationService } from "./referral/service/communication.service";

import { ElementRef, Renderer2 } from '@angular/core';

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})




export class AppComponent implements OnInit, AfterViewInit, AfterContentInit   {

  @ViewChildren('permissionTag') myLinks: QueryList<ElementRef> | undefined; //顯示用

  // @HostListener('window:scroll', ['$event']) onScrollEvent($event){
  //   console.log($event);
  //   console.log("scrolling");
  //   // alert(1234)
  // }
  roles: string[] = ['輔導主任', '輔導組長'];
  selectedRole: string;
  isLoading : boolean  = true
  mode ="";
  public refferalNotDealCount: number | undefined;
  public counselStudentStr: string = "輔導學生";
  public comprehensiveStr: string = "綜合紀錄表"
  public counselVisable: boolean = false;
  public counsel_statisticsVisable: boolean = false;
  public referralVisable: boolean = false;
  /** 上排 個案資料 */
  public caseVisable: boolean = false;
  public comprehensiveVisable: boolean = false;
  public psychologicalTestVisable: boolean = false;
  public adminVisable: boolean = false;
  public transferStudentVisable: boolean = false;
  public hasNewTransfer = false;
  isOpenUserInfo =false
  isTeacher = false;
  showPermissionPanel = false; // 權限資訊面板顯示狀態

  constructor(
    private activeRoute: ActivatedRoute,
    private router: Router,
    public roleService: RoleService,
    public globalService: GlobalService,
    private dsaService: DsaService,
    private deetect: ChangeDetectorRef,
    private communicationService: CommunicationService,
    private renderer: Renderer2,
    private el: ElementRef
  ) {
    communicationService.changeEmitted$.subscribe(data => {
      console.log("  this.refferalNotDealCount ",data)
      this.refferalNotDealCount = data ;
      deetect.detectChanges();
    })
   }
   getJSON() {


   }
   ngAfterViewInit() {
    console.log('After View Init',this.myLinks);
    this.logLinks();
  }

  ngAfterContentInit() {
    console.log('After Content Init',this.myLinks);
    this.logLinks();
  }

  private logLinks() {
    if (this.myLinks) {
      this.myLinks.forEach((link) => {
        const nativeElement: HTMLAnchorElement = link.nativeElement;
        console.log('Href:', nativeElement.href);
        // 在这里进行对元素的操作
        // 例如，为每个链接添加一个类
        this.renderer.addClass(nativeElement, 'highlight');
      });
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'k') {
      this.onCtrlKPressed();
      event.preventDefault();  // Prevent default action if necessary
    }
    if (event.ctrlKey && event.key === 'i') {
      this.onCtrlIPressed();
      event.preventDefault();  // Prevent default action if necessary
    }
  }

  onCtrlKPressed() {
    // console.log('Ctrl + K pressed!');
    this.isOpenUserInfo =!  this.isOpenUserInfo

    // 在这里添加您希望执行的操作
  }

  onCtrlIPressed() {
    // 切換權限資訊面板顯示狀態
    this.showPermissionPanel = !this.showPermissionPanel;
  }

  closePermissionPanel() {
    this.showPermissionPanel = false;
  }

  // 取得所有權限資訊（分類顯示，按照實際導航順序）
  getPermissionInfo() {
    return {
      topNav: [
        { name: '輔導學生', location: '上方導航欄', roles: '輔導老師 認輔老師 班導師', enabled: this.roleService.enableCounsel },
        { name: '輔導統計', location: '上方導航欄', roles: '管理者 輔導老師', enabled: this.roleService.enableCounselStatistics },
        { name: '轉介學生', location: '上方導航欄', roles: '管理者 輔導老師', enabled: this.roleService.enableReferral },
        { name: '個案資料', location: '上方導航欄', roles: '管理者 輔導老師', enabled: this.roleService.enableCase },
        { name: '綜合紀錄表', location: '上方導航欄', roles: '管理者 輔導老師', enabled: this.roleService.enableComprehensive },
        { name: '線上轉學', location: '上方導航欄', roles: '管理者', enabled: this.roleService.enableTransferStudents },
        { name: '心理測驗', location: '上方導航欄', roles: '管理者 輔導老師', enabled: this.roleService.enablePsychologicalTest },
        { name: '相關服務', location: '上方導航欄', roles: '管理者 輔導老師 校外心理師 兼任輔導 認輔老師', enabled: this.roleService.enableTeacherService },
        { name: '系統管理', location: '上方導航欄', roles: '管理者', enabled: this.roleService.enableAdmin },
        { name: '晤談統計', location: '上方導航欄', roles: '管理者 輔導老師 認輔老師', enabled: this.roleService.enableInterviewStatistics }
      ],
      leftMenu: [
        { name: '基本資料', location: '左側選單', roles: '班導師 班級輔導老師（需為該生班導師/輔導老師）', enabled: null, note: '個案認輔老師無法查看' },
        { name: '班導師輔導紀錄(一級輔導)', location: '左側選單', roles: '班導師 班級輔導老師（需為該生班導師/輔導老師）', enabled: null, note: '個案認輔老師無法查看' },
        { name: '個案晤談紀錄(二級輔導)', location: '左側選單', roles: '班級輔導老師 個案認輔老師（需為該生輔導老師/認輔老師）', enabled: null, note: '班導師無法查看' },
        { name: '綜合紀錄表', location: '左側選單', roles: '班導師 班級輔導老師（需為該生班導師/輔導老師）', enabled: this.roleService.enableComprehensive, note: '個案認輔老師無法查看' },
        { name: '心理測驗', location: '左側選單', roles: '班導師 班級輔導老師（需為該生班導師/輔導老師）', enabled: null, note: '個案認輔老師無法查看（屬於其它輔導資料）' },
        { name: '缺曠獎懲', location: '左側選單', roles: '班導師 班級輔導老師（需為該生班導師/輔導老師）', enabled: null, note: '個案認輔老師無法查看（屬於其它輔導資料）' },
        { name: '幹部紀錄', location: '左側選單', roles: '班導師 班級輔導老師（需為該生班導師/輔導老師）', enabled: null, note: '個案認輔老師無法查看（屬於其它輔導資料）' },
        { name: '服務學習', location: '左側選單', roles: '班導師 班級輔導老師（需為該生班導師/輔導老師）', enabled: null, note: '個案認輔老師無法查看（屬於其它輔導資料）' },
        { name: '評量成績', location: '左側選單', roles: '班導師 班級輔導老師（需為該生班導師/輔導老師）', enabled: null, note: '個案認輔老師無法查看（屬於其它輔導資料）' },
        { name: '學期成績', location: '左側選單', roles: '班導師 班級輔導老師（需為該生班導師/輔導老師）', enabled: null, note: '個案認輔老師無法查看（屬於其它輔導資料）' }
      ],
      printFunctions: [
        { name: '列印綜合錄表A表', location: '左側選單 > 列印', roles: '班導師 班級輔導老師（需為該生班導師/輔導老師）', enabled: null, note: '個案認輔老師無法列印' },
        { name: '列印輔導紀錄表B表', location: '左側選單 > 列印', roles: '班導師 班級輔導老師（需為該生班導師/輔導老師）', enabled: null, note: '個案認輔老師無法列印' },
        { name: '列印輔導紀錄表B表合併心理測驗', location: '左側選單 > 列印', roles: '班導師 班級輔導老師（需為該生班導師/輔導老師）', enabled: null, note: '個案認輔老師無法列印' },
        { name: '列印個人輔導紀錄', location: '左側選單 > 列印', roles: '班級輔導老師（需為該生輔導老師，且需有輔導主任/輔導組長角色）', enabled: null, note: '僅班級輔導老師可列印，班導師和個案認輔老師無法列印' }
      ]
    };
  }

  /** */
  onRoleChange(event:any){
    this.globalService.MyCounselTeacherRole = event.target.value;


  }

  async ngOnInit() {
    if (this.roleService.isTeacher) {
      this.isTeacher = true;
    } else {
      this.isTeacher = false;
      this.isLoading = false;
      return;
    }

    this.mode = gadget.params.mode;
    this.selectedRole = this.roles[0]; // 默認選擇第一個角色
    // 預設功能畫面文字
    this.counselStudentStr = "輔導學生";
    this.comprehensiveStr = "綜合紀錄表";

    // 有限制才特別處理
    // 輔導學生(都可用)
    this.counselVisable = false;
    // 輔導統計（只有輔導、輔導轉介 可使用)
    this.counsel_statisticsVisable = false;
    // 轉介學生(只有輔導轉介 可使用)
    this.referralVisable = false;
    // 個案資料(只有輔導、輔導轉介 可使用)
    this.caseVisable = false;
    // 綜合紀錄表(都可用)
    this.comprehensiveVisable = false;
    // 心理測驗（只有輔導、輔導轉介 可使用)
    this.psychologicalTestVisable = false;
    // 系統管理(都可用)
    this.adminVisable = false;
    // 線上轉學(只有線上轉學 可使用)
    this.transferStudentVisable = false;
    await this.GetMyCounselTeacherRole();

    if (gadget.params.system_counsel_position === 'referral' || gadget.params.system_counsel_position === 'counselor' || gadget.params.system_counsel_position === 'freshman') {
      debugger
      this.counselVisable = true;
      this.comprehensiveVisable = true;
      this.adminVisable = true;
    }

    // 只有轉介、輔導
    if (gadget.params.system_counsel_position === 'referral' || gadget.params.system_counsel_position === 'counselor') {
      this.counsel_statisticsVisable = true;
      this.caseVisable = true;
      this.psychologicalTestVisable = true;
    }
    // 只有轉介
    if (gadget.params.system_counsel_position === 'referral') {
      this.referralVisable = true;
    }

    if (gadget.params.system_counsel_position === 'freshman') {
      // 新生特有文字
      this.counselStudentStr = "學生資料";
      this.comprehensiveStr = "填報資料"
    }
    if (gadget.params.system_counsel_position === 'referral') {
      await this.getRefList();

    }
    //console.log(gadget.params.system_counsel_position);

    // 只有線上轉學
    if (gadget.params.trans_tag_name) {
      this.transferStudentVisable = true;
      await this.checkHasNewTransfer();
    }
    this.isLoading = false;
  }
  /** 取得轉借學生 */
  async getRefList() {
    try {
      let resp = await this.dsaService.send("GetReferralStudent", {
        Request: {}
      });
      const refferals = [].concat(resp.ReferralStudent || [])
      if (refferals.length > 0) {
        refferals.forEach(x => {
        })
        let refNotDeal = refferals.filter(x => {
          return x.ReferralStatus == "未處理"
        })
        this.refferalNotDealCount = refNotDeal.length
      }
    } catch (ex) {
      alert("取得轉借資料發生錯誤");
    }
  }



  async GetMyCounselTeacherRole() {
    this.globalService.MyCounselTeacherRole = '';
    //  this.globalService.enableCase = false;
    try{
      let resp = await this.dsaService.send("GetMyCounselTeacherRole", {
        Request: {}
      });

      [].concat(resp.CounselTeacherRole || []).forEach(TeacherRole => {
        this.globalService.MyCounselTeacherRole = TeacherRole.Role;
        this.globalService.teacherName = TeacherRole.TeacherName
        this.globalService.teacherID = TeacherRole.TeacherID
      });

      // alert(""+this.globalService.MyCounselTeacherRole)
      if (this.globalService.MyCounselTeacherRole != '' && this.globalService.MyCounselTeacherRole != '認輔老師' && this.globalService.MyCounselTeacherRole != '校外心理師'  ) {
        this.globalService.enableCase = true;
      } else
        this.globalService.enableCase = false;

    }catch(ex){
        alert('取得基本資料發生錯誤 : '+JSON.stringify(ex))

    }

  }

  routeTo(to) {
    //讓特效跑
    setTimeout(() => {
      this.router.navigate([].concat(to || []), {
        relativeTo: this.activeRoute
      });
    }, 200);
  }

  private _CurrentComponent: string;
  public get currentComponent(): string {
    return this._CurrentComponent;
  }
  public set currentComponent(currentComponent: string) {
    setTimeout(() => {
      this._CurrentComponent = currentComponent;
    });
  }


  async getRadPointState() {
    const rsp = await this.dsaService.send('TransferStudent.GetRedPoint', {
      Code: ['轉入申請', '轉出核可']
    });
    return [].concat(rsp.RedPoint || []);
  }

  async checkHasNewTransfer() {
    const pointState = await this.getRadPointState();
    this.hasNewTransfer = !!(pointState.find(v => v.Enabled === 't'));
  }


  onScroll (){


  }
}

