import { Component, OnInit, Optional, ViewChild } from '@angular/core';
import { AdminComponent } from "../admin.component";
import { ActivatedRoute, Router } from '@angular/router';
import { DsaService } from "../../dsa.service";
import { AddCounselTeacherModalComponent } from "./add-counsel-teacher-modal/add-counsel-teacher-modal.component";
import { CounselTeacherClass } from './counsel-class-vo';
@Component({
  selector: 'app-counsel-class',
  templateUrl: './counsel-class.component.html',
  styleUrls: ['./counsel-class.component.css']
})
export class CounselClassComponent implements OnInit {
  isLoading = false;
  public teacherTypeStr: string = "輔導身分";
  public classTypeStr: string = "輔導班級";
  counselTeacherClassList: CounselTeacherClass[] = [];
  @ViewChild("addCounselTeacher") _addCounselTeacher: AddCounselTeacherModalComponent;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private dsaService: DsaService,
    @Optional()
    public adminComponent: AdminComponent) { }

  ngOnInit() {

    this.teacherTypeStr = "輔導身分";
    this.classTypeStr = "輔導班級";

    if (gadget.params.system_counsel_position === 'freshman') {
      // 新生特有

      this.teacherTypeStr = "教師身分";
      this.classTypeStr = "負責班級";

    }

    setTimeout(() => { this.adminComponent.currentItem = "counsel_class"; });
    this.loadData();
  }

  // 取得教師輔導班級
  async GetCounselTeacherClass() {
    try {
      this.counselTeacherClassList = [];
      let resp = await this.dsaService.send("GetCounselTeacherClass", {
        Request: {}
      });

      [].concat(resp.CounselTeacher || []).forEach(CounselTeacher => {
        let tea: CounselTeacherClass = new CounselTeacherClass();
        tea.TeacherID = CounselTeacher.TeacherID;
        tea.TeacherName = CounselTeacher.TeacherName;
        if (CounselTeacher.Role === '認輔老師' || CounselTeacher.Role === '校外心理師' || CounselTeacher.Role === '') {
          tea.SetClassButtonDisable = true;
        } else
          tea.SetClassButtonDisable = false;
        tea.Role = CounselTeacher.Role;
        tea.parseOrder();
        tea.ClassNames = [].concat(CounselTeacher.ClassName || []);
        this.counselTeacherClassList.push(tea);
        this.counselTeacherClassList.sort(function (a, b) {
          return a.Order - b.Order;
        });

      });
    } catch (err) {
      alert(err);
    }

    this.isLoading = false;
  }

  loadData() {
    this.isLoading = true;
    // 載入輔導身分
    this.GetCounselTeacherClass();


  }

  // 編輯班級資料
  EditClassNames(item: CounselTeacherClass) {
    this._addCounselTeacher._CounselTeacherClass = item;
    this._addCounselTeacher.filterCheckBox();

    $("#addCounselTeacher").modal("show");

    // 關閉畫面
    $("#addCounselTeacher").on("hide.bs.modal", () => {
      // 重整資料
      this.loadData();
      $("#addCounselTeacher").off("hide.bs.modal");
    });

  }
}


