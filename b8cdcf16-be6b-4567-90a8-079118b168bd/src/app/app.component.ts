import { Component, OnInit, ViewChild, ElementRef, ApplicationRef, Input } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import * as moment from 'moment';
import { BsModalService, ModalOptions, BsModalRef } from 'ngx-bootstrap/modal';
import { BasicService } from './service';
import { SemesterFormatPipe, CourseTypeFormatPipe, SimpleModalComponent } from './shared';
import { ConflictCourse, Course, OpeningInfo, Student, Configuration } from './data';
import { GadgetService } from './gadget.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

// 定議 windows.on1CampusWebView
declare global {
  interface Window {
    on1CampusWebView: boolean
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [],
  providers: [
    SemesterFormatPipe,
    CourseTypeFormatPipe,
  ]
})
export class AppComponent implements OnInit {
  loadState: 'finish' | 'loading' | 'error' | 'limited' | 'closed' = 'loading';
  isSaving = false;
  mainMsgClass = '';
  mainMsgText = '';
  modalRef: BsModalRef;

  currTab = '';
  currSchoolYear: string;
  currSemester: string;
  orignPoints: number;
  currentPoints: number;

  /**目前階段 */
  currLevel: '1' | '2' | '0' | 's1' | 's2' | 's3' | 's4' | 's5';

  /**目前界面上是否有衝突 */
  conflicted = false;

  /**各階段開始結束時間 */
  allOpeningData: Map<string, OpeningInfo> = new Map(); // key = Level0, Level1, Level2

  /**課程計劃 */
  webUrl = '';

  course_opening_info: any = {
    Item1: '', // 第一、二階段選課開放期間說明
    Item0: '', // 加退選開放期間說明
  };

  /**課程總表 */
  allCourse: Map<string, Course> = new Map();

  /**課程點數設定 */
  allCourseConfig: Map<string, any> = new Map();

  /**退選訊息、Mail樣版 */
  configuration: Configuration = {
    email_content1_template: '',
    email_content2_template: '',
    cs_cancel1_content_template: '',
    cs_cancel2_content_template: '',
    cs_final_message: '',
    cs_content1_template: '',
    cs_content2_template: '',
    email_content1_template_subject: '',
    email_content2_template_subject: '',
    retreat_notices_word: '',
    button_mod_communicate_point_selection_rules: ''
  };

  /**學生基本資料 */
  student: Student = new Student();
  /**目前已選課程清單 */
  currAttends: Course[] = [];
  /**可選課程(可加選) */
  canChooseCourses: Course[] = [];
  /**選課最終確認課程清單 */
  scAttends: Course[] = [];
  /**衝堂課程 */
  conflictCourseMap: Map<string, ConflictCourse> = new Map();
  /**選課注意事項, 選課問答集 */
  faq: any = {
    'A': [], //選課注意事項
    'B': [], //選課問答
  };

  /**取得退選記錄LOG */
  scAttendWithdrawnLogs: Course[] = [];

  /**是否已確認最終選課結果 */
  scConfirmed = false;
  /**使用者確認最終選課結果的日期 */
  scConfirmDate = '';

  /**E辦收到加退選單訊息內容 */
  scReceivedMsg = '';
  /**是否顯示收到加退選單資訊 */
  showSCReceivedMsg = false;

  /**每頁筆數 */
  pageSize = 28;

  /**要列印的分頁內容 */
  printPages: PrintPage[] = [];

  @ViewChild('print_course_content')
  private printCourseContent: ElementRef<any>;

  constructor(
    private applicationRef: ApplicationRef,
    private basicSrv: BasicService,
    private semesterFormatPipe: SemesterFormatPipe,
    private courseTypeFormatPipe: CourseTypeFormatPipe,
    private modalService: BsModalService,
    private viewportScroller: ViewportScroller,
    private gadgetService: GadgetService, 
    private http: HttpClient,
    ) {
  }

  async ngOnInit() {
    try {
      /**依學生是否有權限狀態決定顯示內容 */
      this.student = await this.basicSrv.getMyInfo();
      if (this.student.Status === '1' || this.student.Status === '4') {
        await this.getOpeningdata();
        if (this.loadState !== 'closed') {
          const reqlist = [
            this.getWebUrl(),
            this.getFAQ(),
            this.getConfiguration(),
            this.getAllCourse(),
            this.getPoints(),
            //this.getCourseInfo()
          ];
          await Promise.all(reqlist);

          if (['1', '2', 's1', 's2', 's5'].indexOf(this.currLevel) !== -1) {
            this.currTab = 'sa01';
          } else if (['0', 's3', 's4'].indexOf(this.currLevel) !== -1) {
            this.currTab = 'sa06';
          } else {
            this.currTab = 'sa02';
          }
          this.loadState = 'finish';
        }
      } else {
        this.loadState = 'limited';
      }

      this.gadgetService.onLeave(() => {
        if (this.stopExit()) {
          return '您尚未儲存選課結果，確認要離開此網頁嗎?';
        }
        return '';
      });
    } catch (error) {
      this.loadState = 'error';
    }
  }

  /**切換頁籤 */
  toggleTab(tabName: string) {
    if (this.currTab === 'sa01' && tabName !== 'sa01') {
      if (this.stopExit()) {
        const config = {
          initialState: {
            title: '離開網頁',
            content: '您尚未儲存選課結果，確認要離開此網頁嗎?',
            okBtn: {
              show: true,
              text: '確定',
              clickBtn: async() => {
                this.currTab = tabName;
                this.modalRef.hide();
              }
            },
            cancelBtn: {
              show: true,
              text: '取消',
              clickBtn: () => { this.modalRef.hide(); }
            }
          }
        };
        this.openModal(SimpleModalComponent, config);
      } else {
        this.currTab = tabName;
      }
    } else {
      this.currTab = tabName;
    }
  }

  /**取得所有階段開放期間 */
  async getOpeningdata() {
    const today = new Date();

    try {
      const rsp: OpeningInfo[] = await this.basicSrv.getCSOpeningInfo();

      for (const item of rsp) {
        this.allOpeningData.set(`Level${item.Item}`, item);
        if (!this.currSchoolYear) {
          this.currSchoolYear = item.SchoolYear || '';
          this.currSemester = item.Semester || '';
        }

        if (item.Status === 't') {
          this.currLevel = item.Item;

          if (item.Item === '0') {
            this.showSCReceivedMsg = true;
          }
        }
      }

      if (!this.currLevel) {
        // 1. 第一階段選課前，可選課程=目前尚未開放選課,課程總表 + 衝堂課程=無資料
        // 2. 第一第二階段選課中間~可選課程=目前尚未開放第二階段選課
        // 3. 第二階段後加退選前~選課最終確認=尚未公告選課最終結果
        // 4. 加退選期間結束後~選課最終確認,課程總表 + 衝堂課程=本學期選課已結束，目前尚未開放下一學期選課
        // 5. 第一階段選課前五天，可選課程=目前尚未開放選課,課程總表+衝堂課程=正常顯示
        if (this.allOpeningData.get('Level0').EndTime) {
          const eDate = new Date(this.allOpeningData.get('Level0').EndTime);
          if (eDate < today) {
            this.currLevel = 's4';
            this.showSCReceivedMsg = false;
          }
          // 收到加退選單資訊，呈現到加退選結束時間+10日
          const addDays = moment(eDate).add(11, 'days').toDate();
          if (today <= addDays) {
            this.showSCReceivedMsg = true;
          }
        }

        if (this.allOpeningData.get('Level2').EndTime) {
          if (this.allOpeningData.get('Level0').BeginTime) {
            const sDate = new Date(this.allOpeningData.get('Level2').EndTime);
            const eDate = new Date(this.allOpeningData.get('Level0').BeginTime);
            if (sDate < today && eDate > today) {
              this.currLevel = 's3';
            }
          } else {
            this.currLevel = 's3';
          }
        }

        if (this.allOpeningData.get('Level1').EndTime) {
          const sDate = new Date(this.allOpeningData.get('Level1').EndTime);
          if (this.allOpeningData.get('Level2').BeginTime) {
            const eDate = new Date(this.allOpeningData.get('Level2').BeginTime);
            if (sDate < today && eDate > today) {
              this.currLevel = 's2';
            }
          } else if (sDate < today) {
            this.currLevel = 's2';
          }
        }

        if (this.allOpeningData.get('Level1').BeginTime) {
          const sDate = new Date(this.allOpeningData.get('Level1').BeginTime);
          const addDays = moment(sDate).add(-6, 'days').toDate();
          if (sDate > today) {
            if (today >= addDays) {
              this.currLevel = 's5';
            } else {
              this.currLevel = 's1';
            }
          }
        }

        if (!this.currLevel) { this.loadState = 'closed'; }
      }
    } catch (error) {

    }
  }

  /**取得課程計劃網址 */
  async getWebUrl() {
    try {
      const rsp = await this.basicSrv.getWeburl();
      this.webUrl = rsp;
    } catch (error) {
      console.log(error);
    }
  }

  /**取得選課注意事項, 選課問答集 */
  async getFAQ() {
    try {
      const rsp = await this.basicSrv.getCSFaq();
      for (const item of rsp) {
        if (item.Category === '選課注意事項') {
          item.Content = item.Content.replace(/\n/g, '<br />');
          this.faq.A.push(item);
        } else if (item.Category === '選課問答') {
          item.Content = item.Content.replace(/\n/g, '<br />');
          this.faq.B.push(item);
        }
      }
    } catch (error) {

    }
  }

  /**退選訊息、Mail樣版 */
  async getConfiguration() {
    try {
      const rsp = await this.basicSrv.getSConfiguration();
      for (const item of rsp) {
        this.configuration[item.ConfName] = item.ConfContent;
      }
    } catch (error) {

    }
  }

  /**課程總表 */
  async getAllCourse() {
    if (!(this.currSchoolYear && this.currSemester)) return;

    try {
      const rsp: Course[] = await this.basicSrv.getAllCourse(this.currSchoolYear, this.currSemester);

      for (const item of rsp) {
        const teachers = [];
        if (item.TeacherURLName) {
          const tmp = item.TeacherURLName.split(', ');

          tmp.forEach((teacher) => {
            if (($(teacher).attr('href'))) {
              teachers.push('<a href="' + $(teacher).attr('href') + '" target="_blank">' + $(teacher).html() + '</a>');
            } else {
              teachers.push($(teacher).html());
            }
          });
          item.TeacherURLName = teachers.join(', ');
        }

        this.allCourse.set(item.CourseID, item);
      }

      if (this.currLevel === '0') {
        this.getConflictCourse();
        this.getSCAttend();
        this.getRegistrationConfirm();
      } else if (this.currLevel === '1' || this.currLevel === '2') {
        this.getConflictCourse();
        this.getCourseInfo();
        this.getCanChooseCourse();
        this.getAttend();
        this.getSCAttend();
        this.getSCWithdrawnLog();
      } else if (this.currLevel === 's2' || this.currLevel === 's3') {
        this.getConflictCourse();
      } else if (this.currLevel === 's4') {
        this.getSCAttend();
        this.getRegistrationConfirm();
      } else if (this.currLevel === 's5') {
        this.getConflictCourse();
      }
    } catch (error) {

    }
  }

  /**取得學生點數 */
  async getPoints() {
    try {
      let result = await this.basicSrv.getPoints();
      this.orignPoints = result.Total ? Number(result.Total) : 0;
      this.currentPoints = result.Total ? Number(result.Total) : 0;
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * 取得該梯次課程投點點數排行
   * 取得課程已選人數
   */
  async getCourseInfo() {
    try{
      const rsp: any[] = await this.basicSrv.getCourseInfo();

      rsp.forEach((item) =>{
        if (this.allCourse.has(item.CourseID)) {
          const course:Course = this.allCourse.get(item.CourseID);
          course.Ranks = {};
          course.Item1StudentCount = item.Item1Count;
          course.Item2StudentCount = item.Item2Count;
          // 剩餘名額：顯示在第二階段人數上限
          // 剩餘名額 = 人數上限 - 第一階段選課人數
          course.RemainderCapacity = course.Capacity ? '' + (Number(course.Capacity) - Number(item.Item1Count || '0')) : course.Capacity;
          course.TotalStudentCount = '' + (Number(item.Item1Count || '0') + Number(item.Item2Count));
          // 整理點數排行資料
          [].concat(item.Ranks || []).forEach((data) => {
              course.Ranks[data.Rank] = data.Points ;
          });
        }
      });
    }catch(error) {
      console.log(error);
    }
  }

  /**取得已選課程，調整課程的退選狀態、衝突課程、選課來自哪個階段 */
  async getAttend() {
    this.currAttends = [];

    try {
      const rsp = await this.basicSrv.getCSAttend(this.currSchoolYear, this.currSemester);

      // 清空學生投點資料
      for(const key of this.allCourse.keys()) {
        this.allCourse.get(key).StudentSetPoints = null;
      }
      for (const item of rsp) {
        if (this.allCourse.has(item.CourseID)) {
          const course = this.allCourse.get(item.CourseID);
          course.WillQuit = false;
          course.HaveConflict = [];
          course.ChooseItem = item.Item;
          // 學生選課投點點數
          course.StudentSetPoints = item.Points;
          // 投點歷程編號
          course.RefConsumeID = item.RefConsumeID;
          this.currAttends.push(course);
        }
      }
    } catch (error) {

    }
  }

  /**重設可所有勾選狀態 */
  resetAddQuit() {
    this.scAttends.map((v: Course) => { v.WillQuit = false; v.HaveConflict = []; });
    this.currAttends.map((v: Course) => { v.WillQuit = false; v.HaveConflict = []; });
    this.canChooseCourses.map((v: Course) => { v.WillAdd = false; v.HaveConflict = []; });
    this.checkAddQuitBtn();
  }

  /**
   * 加入或取消勾選課程
   * 退選：
   *  勾選(要退選) =>
   *    state = true。比對所有可加選課程中，所有 WillAdd = true 的所有突衝課程，將其視為不衝突
   *  取消勾選(保持已選) =>
   *    state = false。比對所有可加選課程中，所有 WillAdd = true 的所有突衝課程，將其視為衝突
   * 加選：
   *  勾選(要加選) =>
   *    state = true。比對預選、已選課程中，所有 WillQuit = false 的所有突衝課程，將其視為衝突；
   *    state = true。比對可加選課程中，所有 WillAdd = true 的所有突衝課程，將其視為衝突
   *    state = true。如果是點數選課課程，判斷是否頭點
   *   取消勾選(取消加選) =>
   *    state = false。比對預選、已選課程中，所有 WillQuit = false 的所有突衝課程，將其視為不衝突；
   *    state = false。比對可加選課程中，所有 WillAdd = true 的所有突衝課程，將其視為不衝突
  */
  clickCourseCheckbox(course: Course, keyName: string, checkBox: any) {
    // 因為使用 click 事件，所以 checkBox 的值會是變更前的狀態。例：要勾選，值會得到 false

    if (keyName === 'WillAdd' && !course.WillAdd) {
      // 重新驗證投點數
      this.checkPoints('' + course.StudentSetPoints, course);

      // 如果投點點數有誤
      if (course.PointIsError) {
        checkBox.checked = false;
        course.WillAdd = false;
        return;
      }// 如果課程為投點課程必須輸入投點點數
      else if (course.NeedPoints == 't' && !course.StudentSetPoints && course.StudentSetPoints != 0) {
        course.PointIsError = true;
        course.ErrorMsg = '請輸入投點點數';
        checkBox.checked = false;
        course.WillAdd = false;
        return;
      }
      else {
        course.PointIsError = false;
        course.ErrorMsg = '';
      }
    }

    // 衝堂判斷
    course[keyName] = !course[keyName];
    const checked = course[keyName];
    let status = false;
    if (keyName === 'WillQuit') { status = !checked; }
    if (keyName === 'WillAdd') { status = checked; }

    if (this.conflictCourseMap.has(course.CourseID)) {
      // 取得本課程的衝突清單
      const conflictIds = this.conflictCourseMap.get(course.CourseID).conflictCourseIds;

      for (const courseId of conflictIds) {
        // 與已預選課程比較，找出已選且衝突的課程，將其衝突清單異動，之後要用 tooltip 顯示
        for (const item of this.scAttends) {
          if (item.CourseID === courseId && !item.WillQuit) {
            if (status) {
              course.HaveConflict.push(item.CourseID);
              item.HaveConflict.push(course.CourseID);
            } else {
              item.HaveConflict = item.HaveConflict.filter((v: string) => v !== course.CourseID);
            }
          }
        }

        // 與已選課程比較，找出已選且衝突的課程，將其衝突清單異動，之後要用 tooltip 顯示
        for (const item of this.currAttends) {
          if (item.CourseID === courseId && !item.WillQuit) {
            if (status) {
              course.HaveConflict.push(item.CourseID);
              item.HaveConflict.push(course.CourseID);
            } else {
              item.HaveConflict = item.HaveConflict.filter((v: string) => v !== course.CourseID);
            }
          }
        }

        // 與加選課程比較，將其衝突清單異動，之後要用 tooltip 顯示
        for (const item of this.canChooseCourses) {
          if (item.CourseID === courseId && item.WillAdd) {
            if (status) {
              course.HaveConflict.push(item.CourseID);
              item.HaveConflict.push(course.CourseID);
            } else {
              item.HaveConflict = item.HaveConflict.filter((v: string) => v !== course.CourseID);
            }
          }
        }
      }
    }

    // 幫自己清除衝堂
    // 如果為「已選 + 勾選退選 => 退選」，將全部的衝突資料移除
    // 如果為「加選 + 取消勾選 => 不加選」，將全部的衝突資料移除
    if (!status) course.HaveConflict = [];

    // 計算點數現況
    this.calcCurrentPoint();

    this.checkAddQuitBtn();
  }

  /**退選課程的勾選 及 取消勾選 */
  setQuitCourse(course: Course) {
    course.WillQuit = !course.WillQuit;
    const status = course.WillQuit;

    if (this.conflictCourseMap.has(course.CourseID)) {
      const conflicts = [];

      // 取得本課程的衝突清單
      const conflictIds = this.conflictCourseMap.get(course.CourseID).conflictCourseIds;

      for (const courseId of conflictIds) {
        // 與已預選課程比較
        for (const item of this.scAttends) {
          if (item.CourseID === courseId && !item.WillQuit) {
            if (!status) {
              conflicts.push(item.CourseID);
              item.HaveConflict.push(course.CourseID);
            } else {
              item.HaveConflict = item.HaveConflict.filter((v: string) => v !== course.CourseID);
            }
          }
        }

        // 與已選課程比較
        for (const item of this.currAttends) {
          if (item.CourseID === courseId && !item.WillQuit) {
            if (!status) {
              conflicts.push(item.CourseID);
              item.HaveConflict.push(course.CourseID);
            } else {
              item.HaveConflict = item.HaveConflict.filter((v: string) => v !== course.CourseID);
            }
          }
        }

        // 與加選課程比較
        for (const item of this.canChooseCourses) {
          if (item.CourseID === courseId && item.WillAdd) {
            if (!status) {
              conflicts.push(item.CourseID);
              item.HaveConflict.push(course.CourseID);
            } else {
              item.HaveConflict = item.HaveConflict.filter((v: string) => v !== course.CourseID);
            }
          }
        }
      }

      // 有衝堂，幫自己加註
      if (!status && conflicts) {
        for (const item of this.currAttends) {
          if (item.CourseID === course.CourseID) {
            item.HaveConflict = conflicts;
          }
        }
      }

      // 勾選，幫自己清除衝堂
      if (status) {
        for (const item of this.currAttends) {
          if (item.CourseID === course.CourseID) {
            item.HaveConflict = [];
          }
        }
      }
    }
    this.checkAddQuitBtn();
  }

  /**加入課程的勾選 及 取消勾選 */
  setAddCourse(course: Course) {
    course.WillAdd = !course.WillAdd;
    const status = course.WillAdd;

    if (this.conflictCourseMap.has(course.CourseID)) {
      const conflicts = [];

      // 取得本課程的衝突清單
      const conflictIds = this.conflictCourseMap.get(course.CourseID).conflictCourseIds;

      for (const courseId of conflictIds) {
        // 與已預選課程比較
        for (const item of this.scAttends) {
          if (item.CourseID === courseId && !item.WillQuit) {
            if (status) {
              conflicts.push(item.CourseID);
              item.HaveConflict.push(course.CourseID);
            } else {
              item.HaveConflict = item.HaveConflict.filter((v: string) => v !== course.CourseID);
            }
          }
        }

        // 與已選課程比較
        for (const item of this.currAttends) {
          if (item.CourseID === courseId && !item.WillQuit) {
            if (status) {
              conflicts.push(item.CourseID);
              item.HaveConflict.push(course.CourseID);
            } else {
              item.HaveConflict = item.HaveConflict.filter((v: string) => v !== course.CourseID);
            }
          }
        }

        // 與加選課程比較
        for (const item of this.canChooseCourses) {
          if (item.CourseID === courseId && item.WillAdd) {
            if (status) {
              conflicts.push(item.CourseID);
              item.HaveConflict.push(course.CourseID);
            } else {
              item.HaveConflict = item.HaveConflict.filter((v: string) => v !== course.CourseID);
            }
          }
        }
      }

      // 有衝堂，幫自己加註
      if (status && conflicts) {
        for (const item of this.canChooseCourses) {
          if (item.CourseID === course.CourseID) {
            item.HaveConflict = conflicts;
          }
        }
      }

      // 取消勾選，幫自己清除衝堂
      if (!status) {
        for (const item of this.canChooseCourses) {
          if (item.CourseID === course.CourseID) {
            item.HaveConflict = [];
          }
        }
      }
    }
    this.checkAddQuitBtn();
  }

  /**確認可選課程目前是否有任何衝突 */
  checkAddQuitBtn() {
    if (this.canChooseCourses.find((v: Course) => v.HaveConflict.length > 0)) {
      this.conflicted = true;
    } else {
      this.conflicted = false;
    }
  }

  /**可選課程(可加選) */
  async getCanChooseCourse() {
    this.canChooseCourses = [];

    try {
      const rsp = await this.basicSrv.getCanChooseCourse(this.currSchoolYear, this.currSemester);
      for (const item of rsp) {
        if (this.allCourse.has(item.CourseID)) {
          const course = this.allCourse.get(item.CourseID);
          course.WillAdd = false;
          course.HaveConflict = [];
          this.canChooseCourses.push(course);
        }
      }
    } catch (error) {

    }
  }

  /**取得選課最終結果 */
  async getSCAttend() {
    try {
      const rsp = await this.basicSrv.getSCAttendExt(this.currSchoolYear, this.currSemester);
      for (const item of rsp) {
        if (this.allCourse.has(item.CourseID)) {
          const course = this.allCourse.get(item.CourseID);
          course.WillQuit = false;
          course.HaveConflict = [];
          this.scAttends.push(course);
        }
      }
    } catch (error) {

    }
  }

  /**預選課程已退選Log清單 */
  async getSCWithdrawnLog() {
    try {
      const rsp = await this.basicSrv.getSCAttendExtWithdrawnLog(this.currSchoolYear, this.currSemester);
      for (const item of rsp) {
        if (this.allCourse.has(item.CourseID)) {
          const course = this.allCourse.get(item.CourseID);
          course.Time = item.Time;
          this.scAttendWithdrawnLogs.push(course);
        }
      }
    } catch (error) {

    }
  }

  /**確認最終選課結果 */
  async getRegistrationConfirm() {
    try {
      const rsp = await this.basicSrv.getRegistrationConfirm(this.currSchoolYear, this.currSemester);

      if (rsp.Confirm === 't') {
        this.scConfirmed = true;
        if (rsp.ConfirmDate) {
          const d1 = new Date(rsp.ConfirmDate);
          this.scConfirmDate = `${d1.getFullYear()}/${d1.getMonth() + 1}/${d1.getDate()}`;
        }
      }
      if (rsp.ReceivedDate) {
        const d2 = new Date(rsp.ReceivedDate);
        let rDate = `${d2.getFullYear()}/${d2.getMonth() + 1}/${d2.getDate()}`;
        rDate += ` ${('0'+d2.getHours()).substr(-2)}:${('0'+d2.getMinutes()).substr(-2)}`;
        this.scReceivedMsg = `EMBA辦公室已於 ${rDate} 收到${this.student.StudentName}同學的加退選單`;
      }
    } catch (error) {

    }
  }

  /**取得衝堂課程 */
  async getConflictCourse() {
    try {
      const rsp = await this.basicSrv.getConflictCourse(this.currSchoolYear, this.currSemester);

      const items = {};

      for (const item of rsp) {
        if (!items[item.CourseIDA]) {
          items[item.CourseIDA] = [];

          this.conflictCourseMap.set(item.CourseIDA, {
            course: this.allCourse.get(item.CourseIDA),
            conflictCourseIds: [],
            conflictCourses: [],
          });
        }
        items[item.CourseIDA].push(item.CourseIDB);

        const data = this.conflictCourseMap.get(item.CourseIDA);
        data.conflictCourseIds.push(item.CourseIDB);
        data.conflictCourses.push(this.allCourse.get(item.CourseIDB));
      }
    } catch (error) {

    }
  }

  /**取得退選課程 */
  getQuitList(): Course[] {
    return this.currAttends.filter(item => item.WillQuit);
  }

  /**取得加選課程 */
  getAddList(): Course[] {
    return this.canChooseCourses.filter(item => item.WillAdd);
  }

  /**第一、二階段已選課程總數，用於顯示目前無資料 */
  getLevelItems(level) {
    return this.currAttends.filter(item => item.ChooseItem === level).length;
  }

  /**顯示詢問視窗 */
  openModal(content: any, config?: ModalOptions) {
    this.modalRef = this.modalService.show(content, Object.assign({}, config));
  }

  /**詢問是否退出預選課程 */
  confirmWithDrawn(course: Course) {
    if (course.CourseID) {
      const config = {
        initialState: {
          title: '預選課程退選',
          content: '<p>送出後不能將無法回復，您確定要送出嗎？</p>',
          bodyClass: 'danger',
          okBtn: {
            show: true,
            text: '送出',
            loadingText: '儲存中...',
            clickBtn: async() => {
              if (this.isSaving) return;

              this.isSaving = true;
              try {
                await this.basicSrv.delSCAttendExt([course.CourseID]);
                if (course.StudentSetPoints) {
                  await this.basicSrv.addLog('退選', '退選預選課程', `學生「${this.student.StudentName}」退選預選課程：${course.CourseName}`);
                }
                else {
                  await this.basicSrv.addLog('退選', '退選預選課程', `學生「${this.student.StudentName}」退選預選課程：${course.CourseName}，退回投點點數：${course.StudentSetPoints}`);
                }

                // 重新載入
                this.getSCAttend();
                this.getSCWithdrawnLog();
                this.getCanChooseCourse();
                this.modalRef.hide();

                this.viewportScroller.scrollToPosition([0, 0]);
                this.mainMsgClass = 'alert alert-success';
                this.mainMsgText = '儲存成功！';
                setTimeout(() => {
                  this.mainMsgClass = '';
                  this.mainMsgText = '';
                }, 5000);
              } catch (error) {
                (this.modalRef.content as SimpleModalComponent).errorMsg = '儲存失敗！';
              } finally {
                (this.modalRef.content as SimpleModalComponent).resetOkBtn();
                this.isSaving = false;
              }
            }
          },
          cancelBtn: {
            text: '取消',
            clickBtn: () => { this.modalRef.hide(); }
          }
        }
      };
      this.openModal(SimpleModalComponent, config);
    }
  }

  /**詢問是否加退選課程 */
  confirmQuitAddCourse() {
    const modalTitle = '課程確認';
    const quitList = this.getQuitList();
    const addList = this.getAddList();

    if ((quitList.length + addList.length) > 0) {
      // 資料整理
      // -- 退選課程
      const quitCourseNames = quitList.map(item => item.CourseName);
      const quitPointCourse = quitList.filter(item => item.NeedPoints == 't');
      const quitCourseDetail = quitPointCourse.map(item => `${item.CourseName} (${item.StudentSetPoints}點)`);
      // -- 加選課程
      const addCourseNames = addList.map(item => item.CourseName);
      const addPointCourse = addList.filter(item => item.NeedPoints == 't');
      const addCourseDetail = addPointCourse.map(item => `${item.CourseName} (${item.StudentSetPoints}點)`);
      // 點數加總
      let quitPointTotal = 0;
      let addPointTotal = 0;
      quitList.forEach((item) =>{
        if (item.NeedPoints == 't') {
          quitPointTotal += Number(item.StudentSetPoints);
        }
      });
      addList.forEach((item) =>{
        if (item.NeedPoints == 't') {
          addPointTotal += Number(item.StudentSetPoints);
        }
      });
      const modalContent = `
        <div>
          ${(this.currLevel === '1') ? this.configuration.cs_cancel1_content_template : ''}
          ${(this.currLevel === '2') ? this.configuration.cs_cancel2_content_template : ''}
          <p>
            <span style="font-size: large;color: red;">退出課程</span>：${quitCourseNames.join(' , ') || '無'}
          </p>
          <p>
            <span style="font-size: large;color: red;">點數退還 ( 共 ${quitPointTotal} 點 ) </span>: ${quitCourseDetail.join(' , ') || '無'}
          </p>
          <p>
            <span style="font-size: large;color: red;">加選課程</span>：${addCourseNames.join(' , ') || '無'}
          </p>
          <p>
            <span style="font-size: large;color: red;">投入點數 ( 共 ${addPointTotal} 點 ) </span>: ${addCourseDetail.join(' , ') || '無'}
          </p>
        </div>
      `;

      const config = {
        initialState: {
          title: modalTitle,
          content: modalContent,
          okBtn: {
            show: true,
            text: '送出',
            loadingText: '儲存中...',
            clickBtn: async() => {
              if (this.isSaving) return;

              this.isSaving = true;
              try {
                await this.saveQuitAdd(quitList, addList);

                this.modalRef.hide();

                //window.scroll(0,0);
                this.viewportScroller.scrollToPosition([0, 0]);
                this.mainMsgClass = 'alert alert-success';
                this.mainMsgText = '儲存成功！';
                setTimeout(() => {
                  this.mainMsgClass = '';
                  this.mainMsgText = '';
                }, 5000);
              } catch (error) {
                (this.modalRef.content as SimpleModalComponent).errorMsg = '儲存失敗！';
              } finally {
                (this.modalRef.content as SimpleModalComponent).resetOkBtn();
                this.isSaving = false;
              }
            }
          },
          cancelBtn: {
            show: true,
            text: '取消',
            clickBtn: () => { this.modalRef.hide(); }
          }
        }
      };
      this.openModal(SimpleModalComponent, config);
    } else {
      const config = {
        initialState: {
          title: modalTitle,
          content: '<p>未有任何異動！</p>',
          okBtn: {
            show: false,
          }
        }
      };
      this.openModal(SimpleModalComponent, config);
    }
  }

  // 送出Email
  async sendMail(addListBackup: Course[], quitListBackup: Course[]) {

    // 製作郵件內的加退選課程表格
    const getCourseHtml = (courses: Course[]) => {
      const txt = [];
      if (courses.length === 0) {
        txt.push('<tr><td colspan="8">無課程</td>');
      } else {
        for (const item of courses) {
          if (item.NeedPoints == 't') {
            txt.push(`
            <tr>
              <td>${item.NewSubjectCode || ''}</td>
              <td>${item.ClassName || ''}</td>
              <td>
                <span>${this.courseTypeFormatPipe.transform(item.CourseType)}</span>
                <span>${item.CourseName || ''}</span>
              </td>
              <td>${item.TeacherURLName || ''}</td>
              <td>${item.Credit || ''}</td>
              <td>${item.Capacity || ''}</td>
              <td>${item.Classroom || ''}</td>
              <td>${item.CourseTimeInfo || ''}</td>
            </tr>
            <tr>
              <td colspan="3">投入點數：${item.StudentSetPoints || ''}點</td>
              <td colspan="5">${item.Memo || ''}</td>
            </tr>
          `);
          }else {
            txt.push(`
            <tr>
              <td>${item.NewSubjectCode || ''}</td>
              <td>${item.ClassName || ''}</td>
              <td>
                <span>${this.courseTypeFormatPipe.transform(item.CourseType)}</span>
                <span>${item.CourseName || ''}</span>
              </td>
              <td>${item.TeacherURLName || ''}</td>
              <td>${item.Credit || ''}</td>
              <td>${item.Capacity || ''}</td>
              <td>${item.Classroom || ''}</td>
              <td>${item.CourseTimeInfo || ''}</td>
            </tr>
            <tr>
              <td colspan="8">${item.Memo || ''}</td>
            </tr>
          `);
          }
        }
      }
      return (`
        <table border="1" cellpadding="5px" style="border: 1px solid #C3C3C3; border-collapse: collapse;">
          <thead>
            <tr>
              <th>課程編號</th>
              <th>班次</th>
              <th>（必/選修）課程名稱</th>
              <th>授課教師</th>
              <th>學分</th>
              <th>人數上限</th>
              <th>教室</th>
              <th>上課時間</th>
            </tr>
          </thead>
          <tbody>
            ${txt.join('')}
          </tbody>
        </table>
      `);
    }

    // 將郵件範本格式的特定符號取代為正確內容
    const replaceContent = (content = '', period = '', mailSendingTime = '', status = '') => {
      content = content.replace(/\[\[學年度\]\]/g, this.currSchoolYear);
      content = content.replace(/\[\[學期\]\]/g, this.semesterFormatPipe.transform(this.currSemester));
      content = content.replace(/\[\[階段別\]\]/g, period);
      content = content.replace(/\[\[選課結果寄出時間\]\]/g, mailSendingTime);
      content = content.replace(/\[\[加退選狀態\]\]/g, status);
      content = content.replace(/\[\[加選堂數\]\]/g, addListBackup.length.toString());
      content = content.replace(/\[\[退選堂數\]\]/g, quitListBackup.length.toString());
      content = content.replace(/\[\[加選課程\]\]/g, (addListBackup.length > 0) ? `<p>加選課程：</p>${getCourseHtml(addListBackup)}` : '');
      content = content.replace(/\[\[退選課程\]\]/g, (quitListBackup.length > 0) ? `<p>退選課程：</p>${getCourseHtml(quitListBackup)}` : '');
      content = content.replace(/\[\[選課結果\]\]/g, `<p>選課結果：</p>${getCourseHtml(this.currAttends)}`);
      return content;
    }

    // 收件人
    const receiverList = [];
    for (let ii = 1; ii <= 5; ii += 1) {
      if (this.student['Email' + ii]) {
        receiverList.push(`${this.student.StudentName || ''}<${this.student['Email' + ii]}>`);
      }
    }
    if (receiverList.length > 0) {
      // 選課結果寄出時間
      const mailSendingTime = moment(new Date()).format('YYYY/MM/DD HH:mm:ss');

      // 信件主旨
      let mailSubject = '';
      // 信件內容
      let mailContent = '';
      // 階段別
      let period = '';
      // 加退選狀態
      let status = '';

      if (this.currLevel === '1') {
        mailSubject = this.configuration.email_content1_template_subject;
        mailContent = this.configuration.email_content1_template;
        period = '第一階段';
      } else if (this.currLevel === '2') {
        mailSubject = this.configuration.email_content2_template_subject;
        mailContent = this.configuration.email_content2_template;
        period = '第二階段';
      }

      if (addListBackup.length > 0) { status += '加'; }
      if (quitListBackup.length > 0) { status += '退'; }
      status += '選';

      // 取代特定符號文字
      mailSubject = replaceContent(mailSubject, period, mailSendingTime, status);
      mailContent = replaceContent(mailContent, period, mailSendingTime, status);

      try {
        await this.basicSrv.sendMail(receiverList.join(','), mailSubject, mailContent);
        await this.basicSrv.addLog(
          '選課結果通知',
          '發送選課結果通知成功',
          `學生「'${this.student.StudentName}」發送選課結果通知成功`
        );
      } catch (error) {
        await this.basicSrv.addLog(
          '選課結果通知',
          '發送選課結果通知失敗',
          `學生「'${this.student.StudentName}」發送選課結果通知失敗：${JSON.stringify(error)}`
        );
      }
    } else {
      await this.basicSrv.addLog(
        '選課結果通知',
        '發送選課結果通知失敗',
        `學生「${this.student.StudentName}」未設定Email`
      );
    }
  };

  /**儲存加退選課 */
  async saveQuitAdd(quitList: Course[] = [], addList: Course[] = []) {

    if (quitList.length) {
      const reqListQ1 = [];
      reqListQ1.push([
        this.basicSrv.delCSAttend(quitList.map((item: Course) => {
          return { CourseID: item.CourseID };
        })),
        this.basicSrv.addCSAttendLog(quitList.map((item: Course) => {
          return { CourseID: item.CourseID, Action: 'delete', ActionBy: 'student', Points: item.StudentSetPoints ? null : item.StudentSetPoints };
        })),
        this.basicSrv.addPointsLog(quitList.map((item: Course) => {
          return { Type: 'refund', Points: item.StudentSetPoints, CourseName: item.CourseName, NeedPoints: item.NeedPoints, CourseID: item.CourseID, RefConsumeID: item.RefConsumeID };
        })),
        this.basicSrv.addLog(
          '退選',
          '退選課程',
          quitList.map((item: Course) => `學生「${this.student.StudentName}」退選課程：${item.CourseName}，退回投點點數：${item.StudentSetPoints}`).join(',')
        )
      ]);
      await Promise.all(reqListQ1.reduce((acc, val) => acc.concat(val), []));
    }

    if (addList.length) {
      const reqListA1 = []; // 先執行
      const reqListA2 = []; // 後執行
      reqListA1.push([
        this.basicSrv.addCSAttend(
          addList.map((item:Course) => {
            return { CourseID: item.CourseID, Points: item.StudentSetPoints };
        })),
        this.basicSrv.addCSAttendLog(addList.map((item: Course) => {
          return { CourseID: item.CourseID, Action: 'insert', ActionBy: 'student', Points: item.StudentSetPoints ? item.StudentSetPoints : null };
        })),
        this.basicSrv.addLog(
          '加選',
          '加選課程',
          addList.map((item: Course) => `學生「${this.student.StudentName}」加選課程：${item.CourseName}，投點點數：${item.StudentSetPoints}`).join(','))
      ]);
      await Promise.all(reqListA1.reduce((acc, val) => acc.concat(val), []));

      reqListA2.push([
        // 篩選需要點數且有投點選課的資料 寫入點數歷程。
        // 注意：必需要在 CSAttend 產出後才能對新增的結果加 ref_consume_id，所以不可以和 CSAttend 的 Promise.all 一起執行
        this.basicSrv.addPointsLog(addList.filter((data: Course) => (data.NeedPoints === 't' && data.StudentSetPoints)).map((item: Course) => {
          return { Type: 'consume', Points: item.StudentSetPoints, CourseName: item.CourseName, NeedPoints: item.NeedPoints, CourseID: item.CourseID };
        })),
      ]);
      await Promise.all(reqListA2.reduce((acc, val) => acc.concat(val), []));
    }



    // 1、備份原始加選課程及退選課程(送出前狀態)
    var addListBackup = this.getAddList();
    var quitListBackup = this.getQuitList();

    // 2、重新取得已選課程。(送出後狀態)
    await this.getAttend();

    // 3、寄送郵件通知 TODO:
    // await this.sendMail(addListBackup, quitListBackup);

    // 4、重新取得課程已選人數、投點點數排名
    this.getCourseInfo();

    // 5、重新取得可選課程
    await this.getCanChooseCourse();

    // 6、重新取得學生點數
    await this.getPoints();
  }

  /**詢問是否確認最終選課結果 */
  confirmFinalChecked() {
    const modalTitle = '確認最終選課結果';

    if (this.scConfirmed) {
      const config = {
        initialState: {
          title: modalTitle,
          content: `<p>您已在 ${this.scConfirmDate} 進行過確認</p>`,
          bodyClass: 'danger',
          okBtn: {
            show: true,
            text: '確定',
            clickBtn: () => { this.modalRef.hide(); }
          },
          cancelBtn: {
            show: false,
          }
        }
      };
      this.openModal(SimpleModalComponent, config);
    } else {
      const config = {
        initialState: {
          title: modalTitle,
          content: '<p>送出後不能再列印加退選單，您確定要送出嗎？</p>',
          bodyClass: 'danger',
          okBtn: {
            show: true,
            text: '送出',
            loadingText: '儲存中...',
            clickBtn: async() => {
              if (this.isSaving) return;

              this.isSaving = true;
              try {
                const rsp = await this.basicSrv.setRegistrationConfirm();
                //debugger
                if (parseInt(rsp.EffectRows || 0, 10) > 0) {
                  this.scConfirmed = true;
                  this.scConfirmDate = moment(new Date()).format('YYYY/MM/DD');

                  await this.basicSrv.addLog('確認最終選課結果', '送出最終選課結果', `學生「${this.student.StudentName}」送出最終選課結果`);

                  this.modalRef.hide();

                  //window.scroll(0,0);
                  this.viewportScroller.scrollToPosition([0, 0]);
                  this.mainMsgClass = 'alert alert-success';
                  this.mainMsgText = '儲存成功！';
                  setTimeout(() => {
                    this.mainMsgClass = '';
                    this.mainMsgText = '';
                  }, 5000);
                } else {
                  (this.modalRef.content as SimpleModalComponent).errorMsg = '儲存失敗！';
                }
              } catch (error) {
                (this.modalRef.content as SimpleModalComponent).errorMsg = '儲存失敗！';
              } finally {
                (this.modalRef.content as SimpleModalComponent).resetOkBtn();
                this.isSaving = false;
              }
            }
          },
          cancelBtn: {
            show: true,
            text: '取消',
            clickBtn: () => { this.modalRef.hide(); }
          }
        }
      };
      this.openModal(SimpleModalComponent, config);
    }
  }

  /**詢問是否列印加退選單 */
  async confirmPrintDocument() {
    if (this.scConfirmed) {
      const config = {
        initialState: {
          title: '列印加退選單',
          content: `<p>您已於 ${this.scConfirmDate} 進行確認，請先致電EMBA辦公室進行註銷，才能列印加退選單</p>`,
          bodyClass: 'danger',
          okBtn: {
            show: true,
            text: '確定',
            clickBtn: () => { this.modalRef.hide(); }
          },
          cancelBtn: {
            show: false,
            text: '取消',
          }
        }
      };
      this.openModal(SimpleModalComponent, config);
    } else {
      // const rsp = await this.basicSrv.setRegistrationPrint();
      // if (parseInt(rsp.EffectRows || 0, 10) > 0) {
      //   await this.basicSrv.addLog('列印加退選單', '點選列印加退選單', `學生「${this.student.StudentName}」點選列印加退選單`);
      //   this.printCourse();
      // }
      this.printCourse();
    }
  }

  /**
   * 列印加退選單
   * 預設每頁 28 筆，每頁都有頁首(個人基本資料)及頁尾(目前頁數/總頁數)
   * 因為全部文件最尾端要加入簽名和說明，所以最後一頁如果大於 14 筆要再加一頁
   */
  printCourse() {
    /**原課程總頁數*/
    // const pageCount = Math.floor(this.scAttends.length / this.pageSize) + (this.scAttends.length % this.pageSize ? 1 : 0);

    const pages = [] as PrintPage[];
    let current: PrintPage;

    if (this.scAttends.length) {
      this.scAttends.forEach((item, idx) => {
        // 當餘數為 0 要切成新頁
        if (idx % this.pageSize === 0) {
          current = new PrintPage();
          current.records = [];
          current.isRecords = true;
          current.isSign = false;
          pages.push(current);
        }
        current.records.push(item);
      });

      if (this.scAttends.length % this.pageSize > (this.pageSize / 2)) {
        current = new PrintPage();
        current.isRecords = false;
        current.isSign = false;
        pages.push(current);
      }
    } else {
      current = new PrintPage();
      current.isRecords = false;
      current.isSign = false;
      pages.push(current);
    }

    // 最後一頁的簽名區為 true
    current.isSign = true;

    this.printPages = pages;

    // 觸發變更檢查，讓畫面重繪，才不會第一次執行時列印無內容
    this.applicationRef.tick();

    const content = `
      <!DOCTYPE html>
        <html>
        <head>
          <title>加退選單</title>
          <link type="text/css" rel="stylesheet" href="https://legacy-web2.ischool.com.tw/deployment/b8cdcf16-be6b-4567-90a8-079118b168bd/assets/css/default.css"/>
        </head>
        <body style="width:880px;padding:40px 20px" onload="window.print();">
          <div class="my-print-page">
            ${this.printCourseContent.nativeElement.innerHTML}
          </div>
        </body>
      </html>
    `;

    const platform = window.on1CampusWebView ? 'app' : 'web';
    if(platform === 'app') {
      const apiUrl = 'https://1campus.net/q/create';
      const headers = new HttpHeaders({ 'Content-Type': 'text/plain' });
      this.http.post<any>(apiUrl, content, { headers }).subscribe(rsp => {
        const { code } = rsp;
        const url = `https://1campus.net/q/${code}?__target=ExternalBrowser`;
        window.location.href = url;
      })
    } else {
      const newWindow = window.open('about:blank', '_blank', '');
      newWindow.document.open();
      newWindow.document.write(content);
      newWindow.document.close();
      newWindow.focus();
    }
  }

  /**中止切換頁面(確認是否有勾選課程但尚未儲存) */
  stopExit() {
    const quitList = this.getQuitList();
    const addList = this.getAddList();
    if ((quitList.length + addList.length) > 0) {
      return true;
    }
    return false;
  };

  /**衝堂或不得重複加選的 tooltip 文字 */
  conflictCourseNames(courseIds: string[]) {
    if (courseIds && courseIds.length) {
      const title = courseIds.map(courseId => this.allCourse.get(courseId).CourseName || '');
      return `與「${title.join(', ')}」衝堂或不得重複加選`;
    } else {
      return '';
    }
  }

  /**
   * 投入點數
   * 0. 空字串忽略不做判斷
   * 1. 判斷使用者輸入是否為正整數
   * 2. 判斷投點點數是否大於剩餘點數
   * 3. 判斷投點點數是否超過點數選課最大最小值
   * */
  checkPoints(points: string, course: Course) {
    const _points = points == '' ? null : (isNaN(Number(points)) ? null : Number(points));
    // console.log(points + ',' + _points);
    const maxPoint = Number(course.MaxPoints);
    const minPoint = Number(course.MinPoints);
    course.StudentSetPoints = _points;

    // 正整數 正則表達式
    const rgexp = new RegExp('^[0-9]*[1-9][0-9]*$');
    if (_points == null) {
      course.PointIsError = false;
      course.ErrorMsg = '';
      return;
    }
    if (!rgexp.test(points) && _points && points != '0') {
      course.PointIsError = true;
      course.ErrorMsg = '請輸入正整數！';
      return;
    }
    else if (_points > this.currentPoints) {
      course.PointIsError = true;
      course.ErrorMsg = '點數不足！';
      return;
    }
    else if (_points > maxPoint) {
      course.PointIsError = true;
      course.ErrorMsg = '投點點數不可"超過"課程點數限制！';
      return;
    }
    else if (_points < minPoint) {
      course.PointIsError = true;
      course.ErrorMsg = '投點點數不可"低於"課程點數限制！';
      return;
    }
    else {
      course.PointIsError = false;
      course.ErrorMsg = '';
      return;
    }
  }

  // 計算點數現況
  calcCurrentPoint() {
    let spendPoints = 0;
    this.canChooseCourses.filter((course) => course.NeedPoints == 't' && course.WillAdd).forEach((item) => {
      spendPoints += Number(item.StudentSetPoints);
    });
    this.currentPoints = this.orignPoints - spendPoints;
  }
}

/**列印加退選單分頁內容 */
export class PrintPage {
  /**是否有選擇課程表格內容 */
  isRecords: boolean;

  /**選擇課程表格內容 */
  records: any[];

  /**最否有簽名區 */
  isSign: boolean;
}