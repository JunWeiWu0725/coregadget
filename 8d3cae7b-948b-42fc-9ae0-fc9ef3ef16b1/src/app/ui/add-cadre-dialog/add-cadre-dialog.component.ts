import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CadreService, StudentInfo, CadreInfo } from './../../dal/cadre.service';

@Component({
  selector: 'app-add-cadre-dialog',
  templateUrl: './add-cadre-dialog.component.html',
  styleUrls: ['./add-cadre-dialog.component.scss']
})
export class AddCadreDialogComponent implements OnInit {

  selectedStudent: StudentInfo | null = null;
  searchText: string = '';
  errMsg = '';

  constructor(
    public dialogRef: MatDialogRef<AddCadreDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private service: CadreService
  ) {}

  ngOnInit(): void {}

  // 搜尋過濾邏輯
  get filteredStudents(): StudentInfo[] {
    if (!this.searchText) return this.data.students;
    const filter = this.searchText.toLowerCase();
    return this.data.students.filter(s =>
      s.StudentName.toLowerCase().includes(filter) ||
      s.SeatNo.toString().includes(filter)
    );
  }

  selectStudent(stud: StudentInfo) {
    this.selectedStudent = stud;
    this.errMsg = '';
  }

  async saveCadre() {
    if (!this.selectedStudent) return;

    const cadre: CadreInfo = {
      schoolyear: this.data.schoolYear,
      semester: this.data.semester,
      studentid: this.selectedStudent.StudentId,
      studentname: this.selectedStudent.StudentName,
      referencetype: this.data.classCadre.cadreType.Nametype,
      cadrename: this.data.classCadre.cadreType.Cadrename,
      text: this.data.class.ClassName,
      uid: ''
    };

    try {
      await this.service.addCadre(cadre);
      this.dialogRef.close(true); // 傳回 true 觸發父視窗 reload
    } catch (error) {
      this.errMsg = '儲存失敗';
    }
  }

  decodeHtml(html: string) {
    if (!html) return '';
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }
}
