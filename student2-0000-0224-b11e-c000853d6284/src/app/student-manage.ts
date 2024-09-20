import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CoreService } from './core.service';
import { GradeYearRec, SchoolClassRec } from './data/school-class';
import { StudentRec } from './data/student';

@Injectable({
  providedIn: 'root'
})
export class StudentManage {
  gradeYears: GradeYearRec[] = [];
  classes: SchoolClassRec[] = [];
  students: StudentRec[] = [];
  dsns: string = '';
  schoolName: string = '';

  gradeYears$ = new BehaviorSubject([] as GradeYearRec[]);
  curClass$ = new BehaviorSubject({} as SchoolClassRec);
  curStudent$ = new BehaviorSubject({} as StudentRec);

  constructor(private coreSrv: CoreService) {}

  initClass() {
    const classList = this.coreSrv.getClassList() || [];
    classList.forEach(v => {
      this.setGradeYear(v.GradeYear);
      this.setClasses(v);
    });

    this.setGradeYear('');
    this.setClasses({
      ClassId: '',
      ClassName: '',
      GradeYear: '',
      Students: [],
    });
    
    this.dsns = this.coreSrv.getDsns() || '';
    this.setSchoolName();
  }

  initStudents(data: StudentRec[]) {
    this.students = data || [];
    this.classes.forEach(v => v.Students = []);
    const classMap = this.classMap;
    data.forEach(v => this.joinStudentToClass(v, classMap));

    if (this.curStudent$.value && this.curStudent$.value.StudentId) {
      const stuMap = this.studentMap;
      if (stuMap.has(this.curStudent$.value.StudentId)) {
        this.curStudent$.next(stuMap.get(this.curStudent$.value.StudentId));
      } else {
        this.curStudent$.next({} as StudentRec);
      }
    }
  }

  // 把學生加入班級
  joinStudentToClass(student: StudentRec, classMap: Map<string, SchoolClassRec>) {
    try {
      if (classMap.has(student.ClassId)) {
        const cc = classMap.get(student.ClassId);
        cc.Students.push(student);
      } else {
        console.log(student.ClassId)
      }
    } catch (error) {
      console.log(error);
    }
  }

  setGradeYear(name: string) {
    if (!this.gradeYears.find(v => v.title === name)) {
      this.gradeYears.push({
        title: name,
        open: false,
      });
    }
  }

  setClasses(schoolClass: SchoolClassRec) {
    const item =  {
      ClassId: schoolClass.ClassId,
      ClassName: schoolClass.ClassName,
      GradeYear: schoolClass.GradeYear,
      Students: [],
    };
    this.classes.push(item);
  }

  setCurrentClass(schoolClass: SchoolClassRec) {
    const cc = this.classMap.get(schoolClass.ClassId);
    if (cc) {
      this.curClass$.next(cc);
      this.curStudent$.next(cc.Students && cc.Students.length ? cc.Students[0] : {} as StudentRec);
    }
  }

  setCurrentStudent(student: StudentRec) {
    this.curStudent$.next(student);
  }

  onFilter(keyword: string) {
    if (keyword) {
      const ret = [];
      this.studentMap.forEach(v => {
        if (v.StudentName.indexOf(keyword) > -1
          || v.StudentNumber.indexOf(keyword) > -1
          || v.LinkAccount.indexOf(keyword) > -1
          || v.StudentCode.indexOf(keyword) > -1
        ) {
          ret.push(v);
        };
      });
      return ret;
    } else {
      return this.curClass$.value.Students;
    }
  }

  getGradeYearList() {
    return this.gradeYears;
  }

  getGradeYearClassList(gradeYearTitle: string) {
    return this.classes.filter(v => v.GradeYear === gradeYearTitle);
  }

  getCradeYearStudentCount(gradeYearTitle: string) {
    const classList = this.getGradeYearClassList(gradeYearTitle);
    if (classList.length) {
      const sum = classList.reduce((count, cc) => {
        if (this.classMap.has(cc.ClassId)) {
          count += this.classMap.get(cc.ClassId).Students.length;
        }
        return count;
     }, 0);
     return sum;
    } else {
      return 0;
    }
  }

  getDsns() {
    return this.dsns;
  }

  setSchoolName() {
    this.coreSrv.getSchoolName().then((schoolName) => {
      this.schoolName = schoolName || '';
    });
  }

  getSchoolName() {
    return this.schoolName;
  }

  public get classMap() {
    return new Map<string, SchoolClassRec>(this.classes.map(v => [v.ClassId, v]));
  }

  public get studentMap() {
    return new Map<string, StudentRec>(this.students.map(v => [v.StudentId, v]));
  }

  // resetStudent(newVal: StudentRec) {
  //   this.students.set(newVal.StudentId, newVal);
  //   const beforeVal = this.students.get(newVal.StudentId);

  //   // 換班級
  //   if (beforeVal.ClassId !== newVal.ClassId) {
  //     const beforeClass = this.classMap.get(beforeVal.ClassId);
  //     const idx = beforeClass.Students.findIndex(s => s.StudentId === newVal.StudentId);
  //     if (idx !== -1) {
  //       beforeClass.Students = beforeClass.Students.splice(idx, 1);
  //     }

  //     if (!this.classMap.has(newVal.ClassId)) {
  //       this.setClass(newVal);
  //     }
  //   }

  //   const newClass = this.classMap.get(newVal.ClassId);
  //   newClass.Students.push(newVal);
  // }

  // resetAll() {
  //   this.classMap.clear();
  //   this.students.clear();
  //   this.curClass$.next({} as SchoolClassRec);
  //   this.curStudent$.next({} as StudentRec);
  // }
}
