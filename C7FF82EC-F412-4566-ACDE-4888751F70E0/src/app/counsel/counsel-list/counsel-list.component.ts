import {
  Component,
  HostListener,
  OnInit,
  Optional,
  ViewChild,
} from "@angular/core";
import { ActivatedRoute, ParamMap } from "@angular/router";
import {
  CounselStudentService,
  CounselStudent,
  SemesterInfo,
} from "../../counsel-student.service";
import { CounselComponent } from "../counsel.component";
import { AppComponent } from "../../app.component";
import { GlobalService } from "../../global.service";
import { AddInterviewModalComponent } from "src/app/shared-counsel-detail/interview-detail/add-interview-modal/add-interview-modal.component";
import { MatSnackBar } from "@angular/material";
import { ImportModalComponent } from "../import-modal/import-modal.component";
import { ImportMappingModalComponent } from "../import-mapping-modal/import-mapping-modal.component";
import { DsaService } from "src/app/dsa.service";

@Component({
  selector: "app-counsel-list",
  templateUrl: "./counsel-list.component.html",
  styleUrls: ["./counsel-list.component.css"],
})
export class CounselListComponent implements OnInit {
  isShowInfo = false;
  public deny: boolean;
  public mod: "class" | "guidance" | "search" | string;
  public roleType: "class" | "guidance" | "search" | string;
  public target: string;
  /**顯示的list <可能有條件塞選>(view use) */
  public targetList: CounselStudent[];
  public TeaacherList: {
    ID: string;
    Name: string;
    NickName: string;
    Role: string;
  }[];
  /**來源<無條件塞選> */
  public scrList: CounselStudent[];
  currentSchoolYear: number;
  currentSemester: number;

  searchMessage: string = "";

  _semesterInfo: SemesterInfo[] = [];

  // 彈出新稱modal 視窗
  @ViewChild("addInterview") _addInterview: AddInterviewModalComponent;
  @ViewChild("app_import_modal") app_import_modal: ImportModalComponent;
  @ViewChild("app_import_mapping_modal") app_import_mapping_modal: ImportMappingModalComponent;


  constructor(
    private dsaService: DsaService,
    private _snackBar: MatSnackBar,
    private activatedRoute: ActivatedRoute,
    public counselStudentService: CounselStudentService,
    private globalService: GlobalService,
    @Optional()
    private counselComponent: CounselComponent,
    @Optional()
    private appComponent: AppComponent
  ) {}

  ngOnInit() {
    this.loadLoginTeacherData();
    this.activatedRoute.paramMap.subscribe((params: ParamMap): void => {
      this.mod = params.get("mod");
      this.roleType = params.get("roleType");
      this.target = params.get("target");
      // 如果 roleType 为空、null 或空字符串，使用 globalService.currentRole 作为备用值
      if (!this.roleType || this.roleType.trim() === '') {
        this.roleType = this.globalService.currentRole || '班導師';
      }
      this._semesterInfo = [];
      this.getList();
    });
  }
  async loadLoginTeacherData() {
    // 取得登入教師名稱
    let teacher = await this.dsaService.send("GetAllTeacher", {});
    this.TeaacherList = [].concat(teacher || []);
    console.log("teacher", teacher);
  }

  /**新增一級輔導(連續) V*/
  addInterviews(event: any, counsuleObj: CounselStudent) {
    event.stopPropagation();
    this.addInterviewModal(counsuleObj);
  }

  /** 打開連續輸入 */
  async addInterviewModal(studentInfo: CounselStudent) {
    // 建立當前學生資料
    let currentCounselStudent: CounselStudent = new CounselStudent();
    currentCounselStudent.init(studentInfo);
    await this._addInterview.loadSerialEnterDefaultData(true, this.targetList);

    this._addInterview._editMode = "add";

    await this._addInterview.loadDefaultData(currentCounselStudent);
    await this._addInterview._currentCounselInterview.useQuestionOptionTemplate();
    this._addInterview._currentCounselInterview.selectCounselType =
      "請選擇方式";
    this._addInterview._currentCounselInterview.selectContactName =
      "請選擇對象";

    // 其他清空
    this._addInterview._currentCounselInterview.ContactNameOther = "";
    this._addInterview._currentCounselInterview.CounselTypeOther = "";

    // 新增預設不公開
    // this._addInterview._currentCounselInterview.isPublic = this.globalService.isCaseInterviewOpenDefault;
    this._addInterview._currentCounselInterview.isSaveDisable = true;
    $("#addInterview").modal("show");

    // 關閉畫面
    $("#addInterview").on("hide.bs.modal", () => {
      if (!this._addInterview.isCancel) {
        // 重整資料
        // this.onReferStateChange();
        // this.counselStudentService.reload();
        // this.loadCounselInterview(this._StudentID);
      }
      $("#addInterview").off("hide.bs.modal");
      this.counselStudentService.reload();
      this.getList();
    });
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action);
  }

  async getList() {
    if (!this.counselStudentService.isLoading) {
      this.currentSchoolYear = this.counselStudentService.currentSchoolYear;
      this.currentSemester = this.counselStudentService.currentSemester;
      this.deny = false;
      // // 如果是班導認輔老師轉介個案都無法使用
      // if (this.appComponent.roleService) {
      //   this.appComponent.roleService.SetEnableReferral(false);
      //   this.appComponent.roleService.SetEnableCase(false);
      // }

      if (this.mod === "class") {
        // 如果 roleType 为空，优先使用 globalService.currentRole（保存了用户实际选择的身份）
        // 不能从 classMap 推断，因为一个班级可能同时有"班導師"和"輔導老師"角色
        if (!this.roleType || this.roleType.trim() === '') {
          this.roleType = this.globalService.currentRole || '班導師';
        }
        // 保存当前 roleType 到 globalService，以便后续恢复
        this.globalService.currentRole = this.roleType;
        if (this.counselStudentService.classMap.has(this.target)) {
          this.targetList = this.counselStudentService.classMap.get(
            this.target
          ).Student;
          if (this.counselComponent != null) {
            this.counselComponent.setSelectItem(
              this.counselStudentService.classMap.get(this.target).ClassName
            );
            this.globalService.selectTarget = this.target;

            // // 細項檢查權限
            // if (this.counselStudentService.classMap.get(this.target).Role) {
            //   if (
            //     this.counselStudentService.classMap.get(this.target).Role[0] ===
            //     "班導師"
            //   ) {
            //     // 使用轉介,個案
            //     this.appComponent.roleService.SetEnableCase(false);
            //     this.appComponent.roleService.SetEnableReferral(false);
            //   }
            //   if (
            //     this.counselStudentService.classMap.get(this.target).Role[0] ===
            //     "輔導老師"
            //   ) {
            //     // 使用轉介,個案
            //     this.appComponent.roleService.SetEnableCase(true);
            //     this.appComponent.roleService.SetEnableReferral(true);
            //   }
            // }
          }
        } else {
          this.deny = true;
        }
      }
      if (this.mod === "guidance") {
        this.globalService.currentRole = this.roleType;
        if (this.counselComponent != null) {
          if (this.target === "g") {
            this.counselComponent.setSelectItem("認輔學生");
          }
        }
        let tmp = [];
        this.counselStudentService.guidanceStudent.forEach((data) => {
          let key = `${data.SchoolYearVG}_${data.SemesterVG}`;
          if (!tmp.includes(key)) {
            let sms: SemesterInfo = new SemesterInfo();
            if (data.SchoolYearVG) {
              sms.SchoolYear = data.SchoolYearVG;
              sms.Semester = data.SemesterVG;
              this._semesterInfo.push(sms);
              tmp.push(key);
            }
          }
        });
        this.targetList = this.counselStudentService.guidanceStudent;
        this.scrList = this.counselStudentService.guidanceStudent; // 可以塞選
      }

      if (this.mod === "search") {
        this.targetList = [];
        this.searchMessage = "";
        if (this.target.replace("/ /ig", "").length > 0) {
          this.searchMessage = "搜尋中 ...";
          await this.counselStudentService.SearchText(this.target);
          this.targetList = this.counselStudentService.searchStudent;
          if (this.targetList.length === 0) {
            this.searchMessage = "沒有資料。";
          } else {
            this.searchMessage = "";
          }
        }

        if (this.counselComponent != null) {
          this.counselComponent.setSelectItem("搜尋");
        }
      }
    } else {
      if (this.counselComponent != null) {
        this.counselComponent.setSelectItem("");
      }
      setTimeout(this.getList, 100);
    }
  }

  modalImportShow() {
    $("#app_import_modal").modal("show");
    // 關閉畫面
    $("#app_import_modal").on("hide.bs.modal", () => {
      // 重整資料
      this.counselStudentService.reload();
      this.getList();
      $("#app_import_modal").off("hide.bs.modal");
    });
  }

  openMappingModal() {
    if (this.app_import_mapping_modal) {
      this.app_import_mapping_modal.openModal();
    }
  }

  /**依所選條件 選取*/
  getListByCondition() {
    // 暫存起來後
    let temp = Object.assign({}, this.targetList);
    // asign 給 要顯示的 targetList
    if (temp && temp.length > 0) {
    }
  }

  /**檢查是否應該顯示匯入按鈕 */
  get shouldShowImportButton(): boolean {
    // 必須是班級模式
    if (this.mod !== 'class') {
      return false;
    }
    // 必須是從"班導師身分"選擇的（roleType 必須明確是 '班導師'）
    // 不能只是檢查 classMap 中是否有班導師角色，因為從"輔導老師身分"選擇時不應該顯示
    if (this.roleType === '班導師') {
      return true;
    }
    // 如果 roleType 為空，嘗試從 globalService.currentRole 恢復
    // 但只有在確保是從班導師身分選擇時才顯示
    if (!this.roleType || this.roleType.trim() === '') {
      // 檢查 globalService.currentRole 是否為班導師
      if (this.globalService.currentRole === '班導師') {
        return true;
      }
    }
    return false;
  }
}
