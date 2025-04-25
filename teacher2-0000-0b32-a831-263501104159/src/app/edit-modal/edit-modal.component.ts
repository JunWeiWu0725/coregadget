import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BatchAddService } from '../batch-add/batch-add.service';
import { CoreService } from '../core.service';
import { FieldName, ImportMode } from '../data/import-config';
import { TeacherRec, TagRec } from '../data/teacher';
import { ConfirmDialogService } from '../shared/dialog/confirm-dialog.service';
import { ModalSize } from '../shared/dialog/confirm-dialog/confirm-dialog';
import { DocumentValidator, JsonRowSource } from '../shared/validators';
import { TagSelectModalComponent } from '../tag-select-modal/tag-select-modal.component';

@Component({
  selector: 'app-edit-modal',
  templateUrl: './edit-modal.component.html',
  styleUrls: ['./edit-modal.component.scss']
})
export class EditModalComponent implements OnInit {

  mode: 'add' | 'edit' = 'add';
  saving = false;
  errMsg = '';
  tRec: TeacherRec = {} as TeacherRec;
  teacherName = '';
  nickname = '';
  tagList: TagRec[] = [];

  constructor(
    public dialogRef: MatDialogRef<EditModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { teacher: TeacherRec, teachers: TeacherRec[] , tags: TagRec[] },
    private coreSrv: CoreService,
    public dialog: MatDialog,
    public confirmSrv: ConfirmDialogService,
    private batchAddSrv: BatchAddService,
  ) {
    this.tRec = data.teacher;
    this.mode = (this.tRec.TeacherId ? 'edit' : 'add');
    this.teacherName = data.teacher.TeacherName;
    this.nickname = data.teacher.Nickname;
    this.tagList = data.tags;
  }

  ngOnInit(): void {
  }

  async getNewCode() {
    this.errMsg = '';
    if (this.saving) { return; }

    try {
      this.saving = true;
      const code = await this.coreSrv.getNewCode();
      this.tRec.TeacherCode = code;
    } catch (error) {
      // console.log(error);
      this.errMsg = (error.dsaError && error.dsaError.message) ? error.dsaError.message : '發生錯誤';
    } finally {
      this.saving = false;
    }
  }

  validate() {
    try {
      const mode: ImportMode = (this.tRec.TeacherId) ? 'EDIT' : 'ADD';
      const identifyField: FieldName[] = (mode === 'EDIT') ? ['TeacherId'] : [];
      const importField: FieldName[] = ['TeacherName', 'Nickname', 'Gender', 'LinkAccount', 'TeacherCode'];
      // console.log(importField);

      const rule = this.batchAddSrv.makeRules(mode, identifyField, importField, this.data.teachers);
      // console.log(rule);

      const jsonRowSrc = new JsonRowSource([this.tRec]);

      const docValid = new DocumentValidator(rule.fieldRules, rule.rowRules);
      docValid.validate(jsonRowSrc);
      const errorResult = jsonRowSrc.getErrors();
      return this.formatErrorResult(errorResult);
    } catch (error) {
      return { info: 'error', errorMsg: (error || '分析發生錯誤！') }
    }
  }

  // 格式化驗證結果
  formatErrorResult(errorResult) {
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

  async updateTeacher() {
    this.errMsg = '';
    if (this.saving) { return; }

    // 驗證資料正確性
    const valid = this.validate();
    if (valid.info === 'error') { this.errMsg = valid.errorMsg; return; }

    try {
      this.saving = true;

      if (this.tRec.TeacherId) {
        await this.coreSrv.updateTeacher(['TeacherId'], {
          TeacherId: this.tRec.TeacherId,
          TeacherName: this.tRec.TeacherName,
          Nickname: this.tRec.Nickname,
          Gender: this.tRec.Gender,
          LinkAccount: this.tRec.LinkAccount,
          TeacherCode: this.tRec.TeacherCode,
        });
        // 類別處理
        await this.coreSrv.addAndDelTagTeacher({
          TeacherId: this.tRec.TeacherId,
          TagIds: this.tRec.Tags.map(t => t.TagId)
        })
      } else {
        await this.coreSrv.addTeacher({
          TeacherName: this.tRec.TeacherName,
          Nickname: this.tRec.Nickname,
          Gender: this.tRec.Gender,
          LinkAccount: this.tRec.LinkAccount,
          TeacherCode: this.tRec.TeacherCode,
        }).then(async (res) => {
          // 將已新增完畢的教師加上標籤
          if ( res.NewId.id && this.tRec.Tags.length > 0) {
          let teacherId = res.NewId.id;
          await this.coreSrv.addAndDelTagTeacher({
            TeacherId: teacherId,
            TagIds: this.tRec.Tags.map(t => t.TagId)
          })}
        })
      }

      try {
        if (this.tRec.TeacherId) {
          await this.coreSrv.addLog('Record', '變更教師', `教師系統編號：${this.tRec.TeacherId}。\n詳細資料：${JSON.stringify(this.tRec)}`);
        } else {
          await this.coreSrv.addLog('Record', '新增教師', `教師姓名：${this.tRec.TeacherName}。\n詳細資料：${JSON.stringify(this.tRec)}`);
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

  confirmDel() {
    this.confirmSrv.show({
      message: '永久刪除無法回復，您確定要刪除嗎？',
      header: '刪除教師',
      acceptLabel: '刪除',
      rejectLabel: '取消',
      accept: () => this.delTeacher(),
      acceptButtonStyleClass: 'bg-warning hover:bg-warning hover:bg-opacity-30',
      rejectButtonStyleClass: '',
      modalSize: ModalSize.MD,
    });
  }

  async delTeacher() {
    this.errMsg = '';
    if (this.saving) { return; }

    try {
      this.saving = true;
      await this.coreSrv.delTeacher(this.tRec.TeacherId);

      try {
        await this.coreSrv.addLog('Record', '刪除教師', `教師系統編號：${this.tRec.TeacherId}。\n詳細資料：${JSON.stringify(this.tRec)}`);
      } catch (error) { }

      this.confirmSrv.hide();
      this.dialogRef.close({ state: 'del' });
    } catch (error) {
      this.errMsg = (error.dsaError && error.dsaError.message) ? this.coreSrv.replaceMappingFieldName(error.dsaError.message) : '發生錯誤';
    } finally {
      this.saving = false;
    }
  }

  // 開啟選擇類別的視窗
  openTagModal() {
    const dialogRef = this.dialog.open(TagSelectModalComponent , {
      width: '500px', 
      data: {tags: this.tRec.Tags, tagList: this.tagList} 
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.state === "refresh") {
        // 1. 刪除 tRec.Tags 中有但 result.tags 中沒有的標籤
        this.tRec.Tags = this.tRec.Tags.filter((tRecTag) => 
          result.tags.some((resultTag) => resultTag.TagId === tRecTag.TagId)
        );
  
        // 2. 新增 result.tags 中有但 tRec.Tags 中沒有的標籤
        result.tags.forEach((resultTag) => {
          const existsInTRec = this.tRec.Tags.some((tRecTag) => tRecTag.TagId === resultTag.TagId);
          if (!existsInTRec) {
            this.tRec.Tags.push({
              TagId: resultTag.TagId,
              TagTeacherId: "", 
              Name: resultTag.Name,
              Color: resultTag.Color,
              Prefix: resultTag.Prefix,
              AccessControlCode: resultTag.AccessControlCode,
            });
          }
        });
      }
    });
  }

}
