import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { StudentRecord, MoralityRecord, CommentRecord } from '../data';
import * as Papa from 'papaparse';

export interface InitialState {
  title: string;
  studentList: StudentRecord[];
  textScoreList: MoralityRecord[];
  moralList: CommentRecord[];
  callback: () => void;
}

@Component({
  selector: 'app-batch-import',
  templateUrl: './batch-import.component.html',
  styleUrls: ['./batch-import.component.css']
})
export class BatchImportComponent implements OnInit {

  data: InitialState;
  callback: any;
  sourceText: string;
  parseValues: string[] = [];
  hasError = false;

  grade: string;
  codeList: {} = {}
  codeListArry: {} = {};
  moralListArry: {} = {};

  constructor(public modalRef: BsModalRef) {
  }

  ngOnInit() {
  }

  // 要處理原始來自 Excel 來源的資料會有跨行(自動換行Excel 貼出來的字會有幫前後字串加綴雙引號")
  // 雙引號、單引號、逗號...等會造成 parser 的讀取轉換問題
  csvToArray(text: string) {
    let newData: any[] = Papa.parse(text || '').data;
    newData = newData.map((v: string[]) => v.join(',').replace(/\r?\n|\r/g, ''));
    return newData;
  }

  parse() {
    // let parseText = this.sourceText || '';
    let parseText = (this.sourceText || '').replace(/^$/gm, '-');
    // 由於 Excel 格子內文字若輸入" 其複製到 Web 後，會變成"" ，在此將其移除，避免後續的儲存處理問題
    // parseText = parseText.replace(/""/g, '');

    const aryValues = this.csvToArray(parseText);
    this.hasError = false;
    this.data.studentList.forEach((stu, idx) => {
      if (idx >= aryValues.length) {
        aryValues.push('錯誤');
        this.hasError = true;
      } else {
        const value = aryValues[idx];
        if (value) {
          // 使用者若知道其學生沒有資料，請在其欄位內輸入 - ，程式碼會將其填上空值
          aryValues[idx] = (value === '-' ? '' : value);
        } else {
          aryValues[idx] = '錯誤';
          this.hasError = true;
        }
      }
    });
    // console.log(aryValues);
    // console.log(this.hasError);
    this.parseValues = aryValues;
  }

  /**清除資料 */
  clear() {
    this.parseValues = [];
  }

  /**匯入資料 */
  importData() {
    if (this.hasError == true) { return; }
    if (this.callback) {
      this.callback(this.parseValues);
    } else {
      this.modalRef.hide();
    }
  }

  /**代碼轉文字*/
  doTransfer(){
    const re = new RegExp(/([\d\w]+)/, 'g');
      if(this.data.title){
        this.codeList = this.data.textScoreList.filter((item)=>{
          return item.Face === this.data.title
        });
        this.codeList[0].Item.forEach(item => {
        if (item.Code) { this.codeListArry[item.Code] = item.Comment || ''; };

        this.sourceText = (this.sourceText  || '').replace(re, (match, g1) => { 
          return this.codeListArry[g1] || g1 });
      });
      }
  }
}
