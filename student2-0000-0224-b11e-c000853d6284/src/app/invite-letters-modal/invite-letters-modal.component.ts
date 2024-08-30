import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { StudentManage } from "../student-manage";
import {
  inviteLetterBody,
  inviteLetterStyle,
  inviteLetterBodyWithStyle,
} from "../shared/invite-letter-template";
import { SchoolClassRec } from "../data/school-class";
import { StudentRec } from "../data/student";

interface GradeYear {
  title: string;
  open: boolean;
  studentsCount: number;
  classes: SchoolClassRec[];
}

@Component({
  selector: "app-invite-letters-modal",
  templateUrl: "./invite-letters-modal.component.html",
  styleUrls: ["./invite-letters-modal.component.scss"],
})
export class InviteLettersModalComponent {
  gradeYears: GradeYear[] = [];
  selectedClasses: SchoolClassRec[] = [];
  selectedStudentsCount: number = 0;
  selectedStudents: StudentRec[] = []; // 用來存放選中的學生
  missingParentCodeStudents: StudentRec[] = []; // 未設定家長代碼的學生資料
  checkCompleted: boolean = false; // 檢查是否完成
  ClassIdOrder: string[] = [];
  dsns: string = "";
  schoolName: string = "";

  constructor(
    public dialogRef: MatDialogRef<InviteLettersModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private sm: StudentManage
  ) {
    this.gradeYears = this.sm.getGradeYearList().map((gradeYear) => {
      let classes = this.sm.getGradeYearClassList(gradeYear.title);
      classes.forEach((classItem) => {
        this.ClassIdOrder.push(classItem.ClassId);
      });
      return {
        ...gradeYear,
        open: false,
        studentsCount: this.sm.getCradeYearStudentCount(gradeYear.title),
        classes: this.sm.getGradeYearClassList(gradeYear.title),
      };
    });
    this.dsns = this.sm.getDsns() || "";
    this.schoolName = this.sm.getSchoolName() || "";
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
    this.checkCompleted = false;
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
    this.checkCompleted = false;
    gradeYear.classes.forEach((classItem) => {
      const isSelected = this.isClassSelected(classItem);
      if (isChecked !== isSelected) {
        this.toggleClassSelection(classItem, isChecked);
      }
    });
  }

  checkSelection() {
    this.selectedStudents = [];
    // 依據 ClassIdOrder 排序 selectedClasses
    this.selectedClasses.sort((a, b) => {
      return (
        this.ClassIdOrder.indexOf(a.ClassId) -
        this.ClassIdOrder.indexOf(b.ClassId)
      );
    });

    this.selectedClasses.forEach((classItem) => {
      this.selectedStudents.push(...classItem.Students);
    });

    // 篩選出未設定家長代碼的學生
    this.missingParentCodeStudents = this.selectedStudents.filter(
      (student) => !student.ParentCode
    );

    this.checkCompleted = true; // 標記檢查完成
    const checkInfoElement = document.getElementById("check-info");
    if (checkInfoElement) {
      checkInfoElement.scrollIntoView({ behavior: "smooth" });
    }
  }

  confirmSelection() {
    if (!this.checkCompleted) return; // 如果未檢查則返回
    // console.log("已選擇的學生:", this.selectedClasses);
    let html = "";
    this.selectedStudents.forEach((student) => {
      const QRcode =
        student.ParentCode && this.dsns
          ? `<img src="https://devapi.1campus.net/api/code/qrcode/img?chld=M&chs=120x120&cht=qr&choe=UTF-8&chl=${student.ParentCode}@${this.dsns}"  style="width: 120px; height: 120px">`
          : "<div style='width: 120px; height: 120px'>  </div>";
      const studentHtml = inviteLetterBody
        .replace(/{{學校名稱}}/g, this.schoolName)
        .replace(/{{學生姓名}}/g, student.StudentName)
        .replace(/{{家長代碼}}/g, student.ParentCode)
        .replace(/{{QRcode}}/g, QRcode)
        .replace(
          /{{年級}}/g,
          student.GradeYear ? student.GradeYear + " 年級" : ""
        )
        .replace(/{{班級名稱}}/g, student.ClassName)
        .replace(/{{座號}}/g, student.SeatNo);
      html += studentHtml;
    });

    let title = `${this.selectedClasses[0].ClassName ?? "未分班級"}${
      this.selectedClasses.length > 1 ? "等" : ""
    }學生邀請函`;

    const newWin = window.open("");
    newWin.document.body.innerHTML = `
      <html>
        <head>
          <title>${title}</title>
          ${inviteLetterStyle}
        </head>
        <body>
          ${html}
        </body>
      </html>
      `;

    // 下載word=>把上面的inviteLetterBody換成inviteLetterBodyWithStyle
    // this.Export2Word(html, title);
  }

  // 下載word (因為word的QR code需要連網路才會顯示，故先不採用)
  Export2Word(studentHtml: string, title: string) {
    const preHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' 
              xmlns:w='urn:schemas-microsoft-com:office:word' 
              xmlns='http://www.w3.org/TR/REC-html40'>
          <head>
            <meta charset='utf-8'>
            <title>Export HTML To Doc</title>
          </head>
          <body>
      `;
    const postHtml = "</body></html>";
    const html = preHtml + studentHtml + postHtml;

    // 建立 Blob 物件
    const blob = new Blob(["\ufeff", html], {
      type: "application/msword",
    });

    // 建立下載連結元素
    const downloadLink = document.createElement("a");
    document.body.appendChild(downloadLink);

    // 建立 URL 並指定檔案名稱
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = `${title}.doc`;

    // 觸發下載
    downloadLink.click();

    // 清理資源
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  }
}
