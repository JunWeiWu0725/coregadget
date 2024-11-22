import { Component, OnInit, OnDestroy } from '@angular/core';
import { StudentRecord, ModeRecord } from '../data';
import { TargetDataService } from '../service/target-data.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-students-block',
  templateUrl: './students-block.component.html',
  styleUrls: ['./students-block.component.css']
})
export class StudentsBlockComponent implements OnInit, OnDestroy {

  dispose$ = new Subject();
  studentList: StudentRecord[] = [];
  curStudentID: string;
  mode: ModeRecord;

  constructor(private targetDataSrv: TargetDataService) {}

  ngOnInit(): void {
    this.targetDataSrv.studentList$.pipe(
      takeUntil(this.dispose$)
    ).subscribe(data => {
      this.studentList = data;
    });

    this.targetDataSrv.student$.pipe(
      takeUntil(this.dispose$)
    ).subscribe(stu => {
      this.curStudentID = stu.StudentID;
    });

    this.targetDataSrv.mode$.pipe(
      takeUntil(this.dispose$)
    ).subscribe(data => {
      this.mode = data;
    });
  }

  ngOnDestroy(): void {
    this.dispose$.next();
  }

  /**確認資料有異動 */
  checkOneHasChanged(student: StudentRecord, grade: string): boolean {
    try {
      if (this.mode.Title === '文字評語') {
        if (student.MoralityMapping.has(grade)) {
          const score = student.MoralityMapping.get(grade);
          return ((score.Text || '') != (score.Origin || ''));
        } else {
          return false;
        }
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**取得成績 */
  getScoreText(student: StudentRecord, grade: string): string {
    try {
      if (this.mode.Title === '文字評語') {
        if (student.MoralityMapping.has(grade)) {
          return student.MoralityMapping.get(grade).Text || '';
        } else {
          return '';
        }
      } else {
        return '';
      }
    } catch (error) {
      return '';
    }
  }

  /**取選某個學生某項成績 */
  doSelect(student: StudentRecord, grade: string) {
    this.targetDataSrv.setStudent(student);
    this.targetDataSrv.setGrade(grade);
  }
}
