import { Component, OnInit } from '@angular/core';
import { CounselTeacherClass, CounselClass, GradeClassInfo } from "../counsel-class-vo";
import { DsaService } from "../../../dsa.service";
@Component({
  selector: 'app-add-counsel-teacher-modal',
  templateUrl: './add-counsel-teacher-modal.component.html',
  styleUrls: ['./add-counsel-teacher-modal.component.css']
})
export class AddCounselTeacherModalComponent implements OnInit {
  public classTypeStr: string = "輔導班級";
  _CounselTeacherClass: CounselTeacherClass = new CounselTeacherClass();
  tmpGradeYear: number[] = [];
  tmpClass: CounselClass[] = [];
  isSelectAllItem: boolean = false;
  selectClassIDs: string[] = [];
  SelectGradeYearList: GradeClassInfo[] = [];
  constructor(private dsaService: DsaService) { }

  ngOnInit() {
    this.classTypeStr = "輔導班級";
    if (gadget.params.system_counsel_position === 'freshman') {
      // 新生特有    

      this.classTypeStr = "負責班級";

    }
    this.loadData();

  }

  loadData() {
    this.isSelectAllItem = false;
    this.GetCounselClass();
  }

  SetSelectGradeItem(gradeYear: number) {
    this.SelectGradeYearList.forEach(item => {

      if (item.GradeYear === gradeYear) {
        item.Checked = !item.Checked;
        item.ClassItems.forEach(classItem => {
          classItem.Checked = item.Checked;
        });
      }
    });
  }

  SetSelectAllItem() {

    this.isSelectAllItem = !this.isSelectAllItem;
    this.SelectGradeYearList.forEach(item => {
      item.Checked = this.isSelectAllItem;
      item.ClassItems.forEach(classItem => {
        classItem.Checked = this.isSelectAllItem;
      });
    });
  }


  // 取得教師輔導班級
  async GetCounselClass() {
    this.SelectGradeYearList = [];
    this.tmpClass = [];
    this.tmpGradeYear = [];
    try {
      let resp = await this.dsaService.send("GetClasses", {
        Request: {}
      });

      [].concat(resp.Class || []).forEach(counselClass => {

        let gryear: number;
        gryear = 999; // 沒有年級
        if (counselClass.GradeYear) {
          gryear = parseInt(counselClass.GradeYear);
        }

        let CClass: CounselClass = new CounselClass();
        CClass.GradeYear = gryear;

        CClass.id = 'class_' + counselClass.ClassID;
        CClass.ClassName = counselClass.ClassName;
        CClass.ClassID = counselClass.ClassID;
        CClass.Checked = false;
        this.tmpClass.push(CClass);
        if (!this.tmpGradeYear.includes(gryear)) {
          this.tmpGradeYear.push(gryear);
        }
      });

      // 整理資料
      this.tmpGradeYear.forEach(gr => {
        let grClass: GradeClassInfo = new GradeClassInfo();
        grClass.GradeYear = gr;
        if (grClass.GradeYear === 999) {
          grClass.GradeYearStr = '未分年級';
        } else {
          grClass.GradeYearStr = gr + ' 年級';
        }
        grClass.id = 'grade_' + gr;
        grClass.Checked = false;
        grClass.ClassItems = this.tmpClass.filter(x => x.GradeYear === gr);
        this.SelectGradeYearList.push(grClass);
      });

      this.filterCheckBox();
    } catch (err) {
      alert(err);
    }



    //this.isLoading = false;
  }

  filterCheckBox() {
    if (this._CounselTeacherClass.ClassNames) {
      let className: string[] = this._CounselTeacherClass.ClassNames;

      this.SelectGradeYearList.forEach(item => {
        item.ClassItems.forEach(classItem => {

          classItem.Checked = className.includes(classItem.ClassName);

        });
      });
    }
  }

  save() { 
    this.selectClassIDs = [];
    this.SelectGradeYearList.forEach(item => {
      item.ClassItems.forEach(classItem => {
        if (classItem.Checked) {
          this.selectClassIDs.push(classItem.ClassID);
        }
      });
    });

    if (true) {
      this.SetCounselClasses();
    }
  }

  async SetCounselClasses() {

    let reqClassIDs = [];
    this.selectClassIDs.forEach(id => {

      let itItm = {
        ClassID: id
      }
      reqClassIDs.push(itItm);
    });
    try {
      let resp = await this.dsaService.send("SetCounselClasses", {
        Request: {
          TeacherID: this._CounselTeacherClass.TeacherID,
          ClassIDs: reqClassIDs
        }
      });
      //  console.log(resp);
      $("#addCounselTeacher").modal("hide");
    } catch (err) {
      alert(JSON.stringify(err));
    }
  }


  cancel() {
    $("#addCounselTeacher").modal("hide");
  }
}


