import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { BatchAddComponent } from './batch-add/batch-add.component';
import { CoreService } from './core.service';
import { SchoolClassRec } from './data/school-class';
import { StudentRec } from './data/student';
import { StudentParent } from './data/student-parent';
import { EditModalComponent } from './edit-modal/edit-modal.component';
import { EditParentComponent } from './edit-parent/edit-parent.component';
import { StatusPipe } from './shared/pipes/status.pipe';
import { StudentManage } from './student-manage';
import { inviteLetterBody, inviteLetterStyle } from './shared/invite-letter-template';
import { InviteLettersModalComponent } from './invite-letters-modal/invite-letters-modal.component';
import { ParentCodeModalComponent } from './parent-code-modal/parent-code-modal.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: []
})
export class AppComponent implements OnInit {

  loading = true;
  studentErrMsg = '';
  parentErrMsg = '';

  keywordCtrl = new FormControl('');
  filterStudents: StudentRec[] = [];
  curStudent: StudentRec = {} as StudentRec;
  parentList: StudentParent[] = [];
  isHandset = false;

  constructor(
    private coreSrv: CoreService,
    public dialog: MatDialog,
    public sm: StudentManage,
    private breakpointObserver: BreakpointObserver
  ) { }

  async ngOnInit() {
    await this.coreSrv.init();
    this.sm.initClass();

    await this.getStudents();
    this.loading = false;

    const nullValue = null;
    this.keywordCtrl.valueChanges
      .pipe(
        startWith(nullValue),
        debounceTime(300),
        distinctUntilChanged(),
        // tap(console.log),
      ).subscribe(term => this.colForStudent(term));

    this.sm.curClass$.subscribe((cc: SchoolClassRec) => {
      this.keywordCtrl.setValue('', { emitEvent: false });
      this.filterStudents = cc.Students;
    });

    this.sm.curStudent$.subscribe(async(stu: StudentRec) => {
      this.curStudent = stu;
      this.parentErrMsg = '';

      if (stu.StudentId) {
        try {
          this.parentList = await this.coreSrv.getParentInfo(stu);
        } catch (error) {
          this.parentList = [];
          this.parentErrMsg = (error.dsaError && error.dsaError.message) ? error.dsaError.message : '發生錯誤';
        }
      } else {
        this.parentList = [];
      }
    });

    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isHandset = result.matches;
    });
  }

  async getStudents() {
    this.studentErrMsg = '';
    try {
      const rsp: StudentRec[] = await this.coreSrv.getStudent({ StudentStatus: '1, 2'});
      this.sm.initStudents([].concat(rsp || []));
    } catch (err) {
      this.studentErrMsg = err;
    }
  }

  colForStudent(keyword: string) {
    this.filterStudents = this.sm.onFilter(keyword);
  }

  selectedStudent(stu: StudentRec) {
    this.sm.curStudent$.next(stu);
    if (this.isHandset) {
      this.editStudent();
    }
  }

  openModifyStudentDialog(student: StudentRec): void {
    const dialogRef = this.dialog.open(EditModalComponent, {
      width: '80vw',
      maxWidth: '1050px',
      data: { student: student, students: this.sm.students },
    });

    dialogRef.afterClosed().subscribe(async result => {
      try {
        if (result && result.state) {
          this.loading = true;

          if (result.state === 'del') {
            this.sm.curStudent$.next({} as StudentRec);
          }

          await this.getStudents();
          this.colForStudent(this.keywordCtrl.value);
        }
      } catch (error) {

      } finally {
        this.loading = false;
      }
    });
  }

  addStudent() {
    this.openModifyStudentDialog({ StudentStatus: '1' } as StudentRec);
  }

  editStudent() {
    if (this.curStudent && this.curStudent.StudentId) {
      this.openModifyStudentDialog({ ... this.curStudent });
    }
  }

  SingleInviteLetter() {
    const dsns =  this.sm.getDsns();
    const schoolName = this.sm.getSchoolName();
    const QRcodeString = this.curStudent.ParentCode && dsns ? encodeURIComponent(`${this.curStudent.ParentCode}@${dsns}`) : "";
    const QRcode = (this.curStudent.ParentCode && dsns)
        ? `<img src="https://devapi.1campus.net/api/code/qrcode/img?chld=M&chs=120x120&cht=qr&choe=UTF-8&chl=${QRcodeString}"  style="width: 120px; height: 120px">`
        : "<div style='width: 120px; height: 120px'>  </div>";
    const studentHtml = inviteLetterBody
    .replace(/{{學校名稱}}/g, schoolName)
    .replace(/{{學生姓名}}/g, this.curStudent.StudentName)
    .replace(/{{家長代碼}}/g, this.curStudent.ParentCode)
    .replace(/{{QRcode}}/g, QRcode)
    .replace(/{{年級}}/g, this.curStudent.GradeYear ? this.curStudent.GradeYear + " 年級" : "")
    .replace(/{{班級名稱}}/g, this.curStudent.ClassName)
    .replace(/{{座號}}/g, this.curStudent.SeatNo);
      const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${this.curStudent.StudentName}邀請函</title>
          ${inviteLetterStyle}
        </head>
      <body>
          ${studentHtml}
      </body>
      </html>`;
    
    const newWin = window.open('', `邀請函-${this.curStudent.StudentName}`);
    newWin.document.body.innerHTML = html
  }

  openInviteLetterDialog(): void {
    const dialogRef = this.dialog.open(InviteLettersModalComponent, {
      width: "80vw",
      maxWidth: "1050px",
    });
  }

  openParentCodeDialog(): void {
    const dialogRef = this.dialog.open(ParentCodeModalComponent, {
      width: "80vw",
      maxWidth: "600px",
    });
    
    dialogRef.afterClosed().subscribe(async result => {
      if (result && result.state === 'refresh') {
        this.loading = true;
        await this.getStudents();
        this.colForStudent(this.keywordCtrl.value);
        this.loading = false;
      }
    });
  }

  openModifyParentDialog(student: StudentRec, parent: StudentParent): void {
    const dialogRef = this.dialog.open(EditParentComponent, {
      width: '80vw',
      maxWidth: '1050px',
      data: { student, parent: parent },
    });

    dialogRef.afterClosed().subscribe(async result => {
      try {
        this.parentList = await this.coreSrv.getParentInfo(this.curStudent);
      } catch (error) {
        this.parentList = [];
      }
    });
  }

  joinParent() {
    this.openModifyParentDialog(this.curStudent, {} as StudentParent);
  }

  editParent(parent: StudentParent) {
    this.openModifyParentDialog(this.curStudent, { ...parent });
  }

  importStudent() {
    const dialogRef = this.dialog.open(BatchAddComponent, {
      width: '80vw',
      maxWidth: '640px',
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result && result.state === 'refresh') {
        this.loading = true;
        await this.getStudents();
        this.colForStudent(this.keywordCtrl.value);
        this.loading = false;
      }
    });
  }

  async exportStudent() {
    const content = [];
    this.sm.students.forEach(v => {
      content.push({
        '學生系統編號': v.StudentId,
        '學生姓名': v.StudentName,
        '年級': v.GradeYear,
        '班級名稱': v.ClassName,
        '座號': v.SeatNo,
        '學號': v.StudentNumber,
        '性別': v.Gender,
        '登入帳號': v.LinkAccount,
        '學生代碼': v.StudentCode,
        '家長代碼': v.ParentCode,
        // '狀態': new StatusPipe().transform(v.StudentStatus),
      });
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(content);
    XLSX.utils.book_append_sheet(wb, ws, 'student');
    XLSX.writeFile(wb, 'student.xlsx');

    try {
      await this.coreSrv.addLog('Export', '匯出學生名單', `已進行「匯出名單」操作。`);
    } catch (error) { }
  }
}
