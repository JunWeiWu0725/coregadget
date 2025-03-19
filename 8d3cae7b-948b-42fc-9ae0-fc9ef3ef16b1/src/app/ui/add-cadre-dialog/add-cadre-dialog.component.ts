import { ClassInfo } from './../../dal/discipline.service';
import { StudentInfo, CadreInfo, CadreService } from './../../dal/cadre.service';
import { Component, Inject, OnInit } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { ClassCadreRecord } from 'src/app/dal/cadre.service';

@Component({
  selector: 'app-add-cadre-dialog',
  templateUrl: './add-cadre-dialog.component.html',
  styleUrls: ['./add-cadre-dialog.component.scss']
})
export class AddCadreDialogComponent implements OnInit {

  selectedStudent: StudentInfo ;
  errMsg = '';
  isValid = true;
  constructor(
    public dialogRef: MatDialogRef<AddCadreDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private service: CadreService) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit(): void {
  }

  async saveCadre() {
    if (!this.selectedStudent) {
      this.errMsg = '請選擇一位學生';
      return ;
    }

    this.isValid = true;


    console.log(this.selectedStudent);
    console.log(this.data);
    // this.data.classCadre.student = this.selectedStudent ;
    const cadre = {
      schoolyear: this.data.schoolYear,
      semester: this.data.semester ,
      studentid: this.selectedStudent.StudentId,
      referencetype: this.data.classCadre.cadreType.Nametype,
      cadrename: this.data.classCadre.cadreType.Cadrename ,
      text: this.data.class.ClassName
    };

    try {
      await this.service.addCadre(cadre as CadreInfo);
      this.dialogRef.close();
    } catch(error) {
      this.errMsg = error ;
    }

    this.isValid = false;
  }

  changeStud() {
    this.errMsg = '';
  }
}

export class DialogData {
  classCadre: ClassCadreRecord;
  students: StudentInfo[];
  schoolYear: string;
  semester: string ;
  class: ClassInfo;
}
