import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ClassRec, CoreService } from '../core.service';
import { ClassFieldName, ImportMode } from '../data/import-config';
import { DocumentValidator, JsonRowSource } from '../shared/validators';
import { TeacherRec } from '../data/teacher';
import { EditClassService } from './edit-class.service';

@Component({
  selector: 'app-edit-class-modal',
  templateUrl: './edit-class-modal.component.html',
  styleUrls: ['./edit-class-modal.component.scss']
})
export class EditClassModalComponent implements OnInit {

  mode: 'add' | 'edit' = 'add';
  saving = false;
  errMsg = '';
  cRec: ClassRec = {} as ClassRec;
  className = '';
  teacherList: TeacherRec[] = [];
  teacherId?: string;
  teacherIdSecondary?: string;

  constructor(
    public dialogRef: MatDialogRef<EditClassModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { class: ClassRec, sourceClasses: ClassRec[] },
    private coreSrv: CoreService,
    public dialog: MatDialog,
    private editClassSrv: EditClassService,
  ) {
    this.className = data.class.ClassName;
    this.cRec = data.class;
    this.mode = (this.cRec.ClassId ? 'edit' : 'add');
    this.teacherList = this.coreSrv.teacherList;
    this.teacherId = data.class.TeacherId;
    this.teacherIdSecondary = data.class.TeacherIdSecondary;
  }

  ngOnInit(): void {
  }

  async validate() {
    try {
      const mode: ImportMode = (this.cRec.ClassId) ? 'EDIT' : 'ADD';
      const identifyField: ClassFieldName[] = (mode === 'EDIT') ? ['ClassId'] : [];
      const importField: ClassFieldName[] = ['ClassId', 'ClassName', 'GradeYear', 'TeacherId', 'TeacherIdSecondary'];
      // console.log(importField);

      const sourceClassList = this.data.sourceClasses;
      const rule = this.editClassSrv.makeRules(mode, identifyField, importField, sourceClassList);
      // console.log(rule);

      const jsonRowSrc = new JsonRowSource([{
        ClassId: this.cRec.ClassId,
        ClassName: this.cRec.ClassName,
        GradeYear: this.cRec.GradeYear,
        TeacherId: this.teacherId,
      }]);

      const docValid = new DocumentValidator(rule.fieldRules, rule.rowRules);
      docValid.validate(jsonRowSrc);
      const errorResult = jsonRowSrc.getErrors();
      // console.log(errorResult);
      // console.log(this.cRec);
      return this.formatErrorResult(errorResult);
    } catch (error) {
      return { info: 'error', errorMsg: (error || '分析發生錯誤！') }
    }
  }

  // 格式化驗證結果
  formatErrorResult(errorResult: Map<number, any>) {
    if (errorResult.has(0)) {
      const row = errorResult.get(0);
      const fieldErrors = Object.keys(row).map(field => {
        return `${this.coreSrv.replaceMappingFieldName(field)}: ${row[field].join('、')}`;
      });
      return { info: 'error', errorMsg: fieldErrors.join('、') };
    } else {
      return { info: 'success' };
    }
  }

  async updateClass() {
    this.errMsg = '';
    if (this.saving) { return; }

    //當TeacherIdSecondary和TeacherId重複時，提示不可重複
    if (this.teacherId && this.teacherIdSecondary && this.teacherId === this.teacherIdSecondary) {
      this.errMsg = '班導師和副班導不可為同一人';
      return;
    }

    // 若有選擇副班導時，班導師不可為空
    if (this.teacherIdSecondary && !this.teacherId) {
      this.errMsg = '設定副班導前，請先選擇班導師';
      return;
    }

    // 驗證資料正確性
    const valid = await this.validate();
    if (valid.info === 'error') { this.errMsg = valid.errorMsg; return; }

    try {
      this.saving = true;
      let newData = {
        ClassId: this.cRec.ClassId,
        ClassName: this.cRec.ClassName,
        GradeYear: this.cRec.GradeYear,
        TeacherId: this.teacherId,
        TeacherIdSecondary: this.teacherIdSecondary
      };

      if (this.cRec.ClassId) {
        await this.coreSrv.updateClass(['ClassId'], [newData]);
      } else {
        await this.coreSrv.addClass([newData]);
      }

      try {
        // 將變更的班級資料整合後寫入log
        let newRec = { ...this.cRec, ...newData,};
        if (this.teacherId) {
          const teacherRec = this.coreSrv.teacherList.find(t => t.TeacherId === this.teacherId);
          if (teacherRec) {
            newRec.TeacherName = teacherRec.TeacherName;
            newRec.TeacherNickname = teacherRec.Nickname;
          }
        }else{
          newRec.TeacherName = '';
          newRec.TeacherNickname = '';
        }

        if (this.teacherIdSecondary) {
          const teacherRecSecondary = this.coreSrv.teacherList.find(t => t.TeacherId === this.teacherIdSecondary);
          if (teacherRecSecondary) {
            newRec.TeacherNameSecondary = teacherRecSecondary.TeacherName;
            newRec.TeacherNicknameSecondary = teacherRecSecondary.Nickname;
          }
        } else {
          newRec.TeacherNameSecondary = '';
          newRec.TeacherNicknameSecondary = '';
        }
        
        if (this.cRec.ClassId) {
          await this.coreSrv.addLog('Record', '變更班級', `班級系統編號：${this.cRec.ClassId}。\n詳細資料：${JSON.stringify(newRec)}`);
        } else {
          await this.coreSrv.addLog('Record', '新增班級', `班級名稱：${this.cRec.ClassName}。\n詳細資料：${JSON.stringify(newRec)}`);
        }
      } catch (error) { }

      this.dialogRef.close({ state: this.mode });
    } catch (error) {
      // console.log(error);
      this.errMsg = (error.dsaError && error.dsaError.message) ? this.coreSrv.replaceMappingFieldName(error.dsaError.message) : '發生錯誤';
    } finally {
      this.saving = false;
    }
  }

  setTeacherId(teacherId: string | undefined) {
    this.teacherId = teacherId;
  }

  setSubTeacherId(teacherId: string | undefined) {
    this.teacherIdSecondary = teacherId;
  }
}
