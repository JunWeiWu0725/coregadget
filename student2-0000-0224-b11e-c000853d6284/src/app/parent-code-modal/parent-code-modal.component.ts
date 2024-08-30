import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { StudentManage } from "../student-manage";
import { SchoolClassRec } from "../data/school-class";
import { CoreService } from "../core.service";

interface GradeYear {
  title: string;
  open: boolean;
  studentsCount: number;
  classes: SchoolClassRec[];
}

@Component({
  selector: "app-parent-code-modal",
  templateUrl: "./parent-code-modal.component.html",
  styleUrls: ["./parent-code-modal.component.scss"],
})
export class ParentCodeModalComponent {
  gradeYears: GradeYear[] = [];
  selectedClasses: SchoolClassRec[] = [];
  selectedStudentsCount: number = 0;
  saving = false;

  constructor(
    public dialogRef: MatDialogRef<ParentCodeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private sm: StudentManage,
    private coreSrv: CoreService
  ) {
    this.gradeYears = this.sm.getGradeYearList().map((gradeYear) => ({
      ...gradeYear,
      open: false,
      studentsCount: this.sm.getCradeYearStudentCount(gradeYear.title),
      classes: this.sm.getGradeYearClassList(gradeYear.title),
    }));
  }

  isClassSelected(item: SchoolClassRec): boolean {
    return this.selectedClasses.includes(item);
  }

  isGradeSelected(gradeYear: GradeYear): boolean {
    return gradeYear.classes.some((classItem) =>
      this.selectedClasses.includes(classItem)
    );
  }

  toggleClassSelection(item: SchoolClassRec, isChecked: boolean) {
    if (isChecked) {
      this.selectedClasses.push(item);
      this.selectedStudentsCount += item.Students.length;
    } else {
      this.selectedClasses = this.selectedClasses.filter(
        (classItem) => classItem !== item
      );
      this.selectedStudentsCount -= item.Students.length;
    }
  }

  toggleGradeSelection(gradeYear: GradeYear, isChecked: boolean) {
    gradeYear.classes.forEach((classItem) => {
      const isSelected = this.isClassSelected(classItem);
      if (isChecked !== isSelected) {
        this.toggleClassSelection(classItem, isChecked);
      }
    });
  }

  async updateParentCode(classIds: string[]) {
    try {
      this.saving = true;
      // 後端需求：有效的 ClassID和"none"需要分開呼叫
      // 分離出 "none" 和有效的 ClassID
      const classIdsNone = classIds.filter((id) => id === "none");
      const validClassIds = classIds.filter((id) => id !== "none" && id !== "");

      const requests = [];

      // 若存在有效的 ClassID，批次呼叫一次
      if (validClassIds.length > 0) {
        const validRequest = this.coreSrv
          .batchParentCode(validClassIds)
          .then((rsp) => {
            // console.log("更新ClassID的家長代碼結果:", rsp);
          })
          .catch((err) => {
            console.error("更新ClassID的家長代碼:", err);
          });

        requests.push(validRequest);
      }

      // 若存在 "none"，則單獨呼叫一次
      if (classIdsNone.length > 0) {
        const noneRequest = this.coreSrv
          .batchParentCode(["none"])
          .then((rsp) => {
            // console.log("更新ClassID:'none'的家長代碼結果:", rsp);
          })
          .catch((err) => {
            console.error("更新ClassID:'none'家長代碼錯誤:", err);
          });

        requests.push(noneRequest);
      }

      // 等待所有請求都完成
      await Promise.all(requests);
    } catch (error) {
      console.error("處理更新家長代碼過程中發生錯誤:", error);
    } finally {
      this.saving = false;
    }
  }

  async confirmSelection() {
    if (this.saving) {
      return;
    }
    // console.log("已選取的班級:", this.selectedClasses);

    // 取得所有選取的 ClassID
    const classIds = this.selectedClasses.map((v) => v.ClassId || "none"); // 如果 ClassId 為空字串則替換為 "none"

    await this.updateParentCode(classIds);
    this.dialogRef.close({ state: "refresh" });
  }

  // 測試以年級為單位產生家長代碼，(因直接傳送ClassID即可，故無需呼叫年級)
  // async testParentCode() {
  //   const rsp = await this.coreSrv.batchParentCodeGradeYear(["4"]);
  //   console.log("產生家長代碼結果:", rsp);
  // }
}
