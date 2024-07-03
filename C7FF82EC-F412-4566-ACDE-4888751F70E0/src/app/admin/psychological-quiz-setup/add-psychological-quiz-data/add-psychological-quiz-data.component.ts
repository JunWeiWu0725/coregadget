import { Component, OnInit } from '@angular/core';
import { Quiz, QuizItem, MappingTable } from '../psychological-quiz-setup-vo';
import { DsaService } from "../../../dsa.service";
import * as XLSX from 'xlsx';
import * as node2json from 'nodexml';
import { Alert } from 'selenium-webdriver';

@Component({
  selector: 'app-add-psychological-quiz-data',
  templateUrl: './add-psychological-quiz-data.component.html',
  styleUrls: ['./add-psychological-quiz-data.component.css']
})
export class AddPsychologicalQuizDataComponent implements OnInit {

  isAdd: boolean = true;
  editType: string = '新增';
  QuizData: Quiz = new Quiz();
  isUserDefine: boolean = false;
  isSystemDefault: boolean = false;
  isCancel: boolean = true;
  isQuizNameHasValue: boolean = false;
  isSaveButtonDisable: boolean = false;
  deleteList :string [] =[]
  MappingTableList: MappingTable[] = [];

  constructor(private dsaService: DsaService) { }

  ngOnInit() {

  }

  cancel() {
    this.isCancel = true;
    $("#addPsychologicalQuizData").modal("hide");
  }

  async save() {
    this.isCancel = false;

    let QuizName: string = '';
    let QuizDataFieldXML: string = '<Field name="原始分數" order="1" /> <Field name="常模分數" order="2" /> <Field name="年齡" order="3" /> <Field name="性別" order="4" />';
    let useMTable: string = 'f';
    let MTableXML: string = '';
    this.QuizData.parseXML();

    // 檢查欄位是否重複
    if (this.QuizData.CheckQuizItemSame()) {
      alert("測驗項目有重覆無法儲存");
      this.isCancel = true;
      return;
    }

    if (this.isUserDefine) {
      QuizName = this.QuizData.QuizName;
      QuizDataFieldXML = this.QuizData.QuizDataFieldXML;
    }

    if (this.isSystemDefault) {
      let selItem: MappingTable;
      this.MappingTableList.forEach(item => {
        if (item.isChecked) {
          selItem = item;
        }
      });

      if (selItem) {
        QuizName = selItem.Name;
        if (selItem.UseMappingTable)
          useMTable = 't';
        MTableXML = selItem.ContentXML;
      }
    }

    let req = {};
    if (this.isAdd) {
      req = {
        Request: {
          QuizName: QuizName,
          QuizDataField: QuizDataFieldXML,
          MappingTable: MTableXML,
          UseMappingTable: useMTable
        }
      };
    } else {
      req = {
        Request: {
          QuizID: this.QuizData.uid,
          QuizName: QuizName,
          QuizDataField: QuizDataFieldXML,
          MappingTable: MTableXML,
          UseMappingTable: useMTable
        }
      };
    }

    // 呼叫 Service 檢查項目名稱是否重複
    let chkRsp;
    try {
      chkRsp = await this.dsaService.send("GetAllQuizNameUid");
      let chkQuiz = [].concat(chkRsp.Quiz || []);
      let pass: boolean = true;
      if (this.isAdd) {
        chkQuiz.forEach(item => {
          if (item.QuizName === QuizName) {
            pass = false;
            alert(QuizName + ',已有相同名稱無法新增。');
          }
        });
      } else {
        // 檢查更新
        chkQuiz.forEach(item => {
          if (item.QuizName === this.QuizData.QuizName && item.UID !== this.QuizData.uid) {
            pass = false;
            alert(this.QuizData.QuizName + ',已有相同名稱無法更新。');
          }
        });
      }

      if (pass) {
        try {
          let resp = await this.dsaService.send("SetCounselQuizByUID", req);
          $("#addPsychologicalQuizData").modal("hide");
        } catch (err) {
          alert(err.dsaError.message);
        }
      }

    } catch (err) {
      alert(err);
    }
  }

  checkValue() {
    if (this.QuizData.QuizName && this.QuizData.QuizName.length > 0) {
      this.isSaveButtonDisable = false;
    } else
      this.isSaveButtonDisable = true;
  }

  export(item: MappingTable) {
    // 使用常模轉換
    if (item.UseMappingTable) {
      let xd = [].concat(node2json.xml2obj(item.ContentXML) || []);
      if (xd) {
        let wb_name: string = xd[0].Mapping.Name + '.xlsx';
        const wb = XLSX.utils.book_new();
        let tableData = [].concat(xd[0].Mapping.Table || []);
        tableData.forEach(tableItem => {
          let rowData: any[] = [];
          if (tableItem) {
            let ws_name = tableItem.Gender;
            tableItem.Row.forEach(rowItem => {
              let item = {
                'Age': rowItem.Age,
                'Source': rowItem.Source,
                'Score': rowItem.Score
              };
              rowData.push(item);
            });
            let ws = XLSX.utils.json_to_sheet(rowData, { header: [], cellDates: true, dateNF: 'yyyy-mm-dd hh:mm:ss', });
            XLSX.utils.book_append_sheet(wb, ws, ws_name);
          }
        });

        XLSX.writeFile(wb, wb_name);
      }
    }
  }


  AddNullQuitItem() {
    let qi: QuizItem = new QuizItem();
    qi.QuizName = '';
    qi.QuizOrder = this.QuizData.QuizItemList.length + 1;
    this.QuizData.QuizItemList.push(qi);
  }

  setSelectMapping(item: MappingTable) {
    item.isChecked = true;
    this.isSaveButtonDisable = true;
    this.MappingTableList.forEach(itemData => {
      if (itemData.UID === item.UID) {
        itemData.isChecked = true;
        this.isSaveButtonDisable = false;
      }
      else
        itemData.isChecked = false;
    });

  }

  setQuizType(name: string) {
    if (name === '自訂項目') {
      this.isUserDefine = true;
      this.isSystemDefault = false;
      this.QuizData.UseMappingTable = false;
      this.isSaveButtonDisable = false;
    }

    if (name === '系統預設') {
      this.isUserDefine = false;
      this.isSystemDefault = true;
      this.QuizData.UseMappingTable = true;
    }

    this.checkValue();
  }

  delItem(item: QuizItem) {
    let tmp: QuizItem[] = [];
    if (this.QuizData.QuizItemList.length > 1) {
      this.QuizData.QuizItemList = this.QuizData.QuizItemList.filter(x => x.QuizName !== item.QuizName);

      this.QuizData.QuizItemList.forEach(iq => {
        if (item.QuizName !== iq.QuizName)
          tmp.push(iq);
      });

      this.QuizData.QuizItemList = tmp;
    }
  }
}
