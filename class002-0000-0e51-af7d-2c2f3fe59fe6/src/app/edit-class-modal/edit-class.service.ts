import { Injectable } from '@angular/core';
import { ClassRec, CoreService } from '../core.service';
import { ClassFieldName, ImportMode } from '../data/import-config';
import { FieldRules, IsNumber, MatchTo, MaxLength, NotEmpty, NotMatchTo, RowValidator, Unique } from '../shared/validators';

@Injectable({
  providedIn: 'root'
})
export class EditClassService {

  // 欄位名稱對照，一律轉為英文欄位名
  mappingKeys = [
    { name: 'ClassId', mapping: ['class_id', '班級系統編號'] },
    { name: 'ClassName', mapping: ['class_name', '班級名稱'] },
    { name: 'GradeYear', mapping: ['grade_year', '年級'] },
    { name: 'TeacherId', mapping: ['teacher_id', '班導師'] },
  ];

  constructor(
    private coreSrv: CoreService,
  ) { }

  // 將 JSON 內容轉換為對照的英文欄位名
  public convertObject(source: any[]): { mappingTable: any, newSource: any[] } {
    let fMappingTable: any[] = [];
    const rMappingTable: any = {}; // 新舊對照 {新: 舊}

    const newSource = source.map((v, idx) => {
      if (idx === 0) {
        const keys = Object.getOwnPropertyNames(v);
        fMappingTable = keys.map(key => {
          const out = this.mappingKeys.find(m => (m.mapping.indexOf(key) > -1));
          const newKey = (out) ? out.name : key;

          rMappingTable[newKey] = key;

          return {
            key,
            newKey,
          }
        });
      }

      const newObj: any = {};
      fMappingTable.forEach(kt => {
        newObj[kt.newKey] = v[kt.key];
      });
      return newObj;
    });

    return {
      mappingTable: rMappingTable,
      newSource
    }
  }

  // 建立檢查規則
  public makeRules(mode: ImportMode, identifyField: ClassFieldName[], importField: ClassFieldName[], sourceClasses: ClassRec[]) {

    const fieldRules: FieldRules = {
      'ClassId': [],
      'ClassName': [],
      'GradeYear': [],
      'TeacherId': [],
      'TeacherIdSecondary': [],
    };
    const rowRules: RowValidator[] = [];

    switch (mode) {
      case 'ADD':
        fieldRules['ClassName'].push(new NotEmpty());
        fieldRules['ClassName'].push(new MaxLength(20));

        fieldRules['GradeYear'].push(new IsNumber());

        rowRules.push(new Unique({ fieldNames: ['ClassName'], skipEmpty: false }));
        rowRules.push(new NotMatchTo({ fieldNames: ['ClassName'], data: sourceClasses, message: '資料庫有重複內容' }));

        if (importField.includes('TeacherId')) {
          rowRules.push(new MatchTo({ fieldNames: ['TeacherId'], data: this.coreSrv.teacherList, skipEmpty: true, message: '資料庫無符合內容' }));
        }

        if (importField.includes('TeacherIdSecondary')) {
          fieldRules['TeacherId'].push(new NotEmpty());
          rowRules.push(new MatchTo({ fieldNames: ['TeacherIdSecondary'], data: this.coreSrv.teacherList, skipEmpty: true, message: '資料庫無符合內容' }));
        }

        break;
      case 'EDIT':
        fieldRules['ClassName'].push(new NotEmpty());
        fieldRules['ClassName'].push(new MaxLength(20));

        fieldRules['GradeYear'].push(new IsNumber());

        rowRules.push(new Unique({ fieldNames: ['ClassName'], skipEmpty: false }));
        rowRules.push(new NotMatchTo({ fieldNames: ['ClassName'], data: sourceClasses, identifyField, message: '資料庫有重複內容' }));

        if (importField.includes('TeacherId')) {
          rowRules.push(new MatchTo({ fieldNames: ['TeacherId'], data: this.coreSrv.teacherList, skipEmpty: true, message: '資料庫無符合內容' }));
        }

        if (identifyField.includes('ClassId')) {
          fieldRules['ClassId'].push(new NotEmpty());
          rowRules.push(new Unique({ fieldNames: ['ClassId'] }));
          rowRules.push(new MatchTo({ fieldNames: ['ClassId'], data: sourceClasses, skipEmpty: false, message: '資料庫無符合內容' }));
        }

        if (identifyField.includes('ClassName')) {
          rowRules.push(new MatchTo({ fieldNames: ['ClassName'], data: sourceClasses, skipEmpty: false, message: '資料庫無符合內容' }));
        }

        break;
    }

    return {
      fieldRules,
      rowRules,
    }
  }
}
