import { Component, OnInit, ViewChild } from '@angular/core';
import { Quiz, QuizItem, ItemCount, StudentQuizData, NormInfo, NormTable } from '../PsychologicalTest-vo';
import * as XLSX from 'xlsx';
import * as node2json from 'nodexml';
import * as moment from 'moment';
import { DsaService } from "../../dsa.service";
import { single } from 'rxjs/operators';


@Component({
  selector: 'app-import-quiz-data',
  templateUrl: './import-quiz-data.component.html',
  styleUrls: ['./import-quiz-data.component.css']
})
export class ImportQuizDataComponent implements OnInit {

  isImportButtonDisable: boolean = true;
  QuizData: Quiz = new Quiz();
  // 學生匯入方式
  selectImportStudentType: string = '班級座號';
  isSelectImportTypeClassSeatNo: boolean = false;
  isSelectImportTypeStudentNumber: boolean = false;
  isSelectImportTypeIDNumber: boolean = false;
  isBtnClassSeatNo: boolean = false;
  isBtnStudentNumber: boolean = false;
  isBtnIDNumber: boolean = false;
  importFieldNameList: string[] = [];
  importFieldName: string = "";

  // 解析日期發生錯誤
  isAnalysisDatePassError: boolean = false;
  // 實施日期發生錯誤
  isImplementationDateError: boolean = false;


  StudentQuizDataList: StudentQuizData[] = [];
  rABS = true; // true: readAsBinaryString ; false: readAsArrayBuffer
  sheet1 = [];
  wsColName: any[] = [];
  constructor(
    private dsaService: DsaService
  ) { }

  ngOnInit() {
    this.selectImportStudentType = '班級座號';
    this.isSelectImportTypeClassSeatNo = true;
    this.isImportButtonDisable = true;

  }

  async checkHasData() {
    try {
      let StudentID = [];
      this.StudentQuizDataList.forEach(item => {
        StudentID.push(item.StudentID);
      });
      let resp = await this.dsaService.send("GetQuizStudentDataCheckData", {
        Request: {
          QuizID: this.QuizData.uid,
          StudentID
        }
      }
      );

      let chkData = [].concat(resp.StudentQuizDataCheck || []);
      if (chkData.length > 0) {
        // 整理已有資料
        let hasData: string[] = [];
        if (this.selectImportStudentType === '班級座號') {
          this.StudentQuizDataList.forEach(sItem => {
            chkData.forEach(item => {
              if (sItem.StudentID === item.student_id) {
                let str = `班級：${sItem.ClassName},座號：${sItem.SeatNo}`;
                hasData.push(str);
              }
            });
          });
        }
        if (this.selectImportStudentType === '學號') {
          this.StudentQuizDataList.forEach(sItem => {
            chkData.forEach(item => {
              if (sItem.StudentID === item.student_id) {
                let str = `學號：${sItem.StudentNumber}`;
                hasData.push(str);
              }
            });
          });
        }
        if (this.selectImportStudentType === '身分證號') {
          this.StudentQuizDataList.forEach(sItem => {
            chkData.forEach(item => {
              if (sItem.StudentID === item.student_id) {
                let str = `身分證號${sItem.IDNumber}`;
                hasData.push(str);
              }
            });
          });
        }
        alert('資料庫內已有心理測驗資料，匯入將會覆蓋：\n' + hasData.join('\n'));
      }

    } catch (err) {
      alert(err);
    }
  }


  async importData() {
    let importData: any[] = [];
    this.isImportButtonDisable = true;
    this.StudentQuizDataList.forEach(item => {
      item.parseXML();
      let data = {
        QuizID: item.QuizUID,
        StudentID: item.StudentID,
        ImplementationDate: item.ImplementationDate.format('YYYY-MM-DD'),
        AnalysisDate: item.AnalysisDate.format('YYYY-MM-DD'),
        Content: item.ContentXML
      };
      importData.push(data);
    });

    // 資料寫入
    let importReq = {
      Request: {
        StudentQuizData: importData
      }
    }
    //  console.log(importReq);


    try {
      let respData = await this.dsaService.send("AddStudentQuizData",
        importReq
      );

      if (respData) {
        alert('匯入完成');
        $("#psychological-import").modal("hide");
      }
    } catch (err) {
      this.isImportButtonDisable = false;
      alert(err);
    }
    //  console.log(respData);
  }

  // 載入匯入欄位名稱
  loadImportFieldName() {
    this.importFieldNameList = [];
    if (this.selectImportStudentType === "班級座號") {
      this.importFieldNameList.push("班級");
      this.importFieldNameList.push("座號");
    } if (this.selectImportStudentType === "學號") {
      this.importFieldNameList.push("學號");
    } if (this.selectImportStudentType === "身分證號") {
      this.importFieldNameList.push("身分證號");
    }

    this.importFieldNameList.push("實施日期");
    this.importFieldNameList.push("解析日期");
    this.QuizData.QuizItemList.forEach(item => {
      this.importFieldNameList.push(item.QuizName);
    });

    if (this.QuizData.UseMappingTable) {
      // 使用常模轉換
      let xFieldList = [];
      this.importFieldNameList.forEach(item => {
        if (item === '常模分數' || item === '年齡' || item === '性別') {
          // 不加入畫面顯示
        } else {
          xFieldList.push(item);
          this.importFieldName = xFieldList.join(',');
        }
      });

    } else {
      this.importFieldName = this.importFieldNameList.join(',');
    }

  }


  readSpreadsheet(event) {
    return new Promise((r, j) => {
      let reader = new FileReader();
      this.sheet1 = [];
      if (event.target.files && event.target.files.length) {
        const [file, file2] = event.target.files;

        if (this.rABS) reader.readAsBinaryString(file); else reader.readAsArrayBuffer(file);

        // 讀取 Excel 檔案並解析
        reader.onload = (e) => {
          let data: any = reader.result;
          if (!this.rABS) data = new Uint8Array(data as any);

          /* read workbook */
          const wb: XLSX.WorkBook = XLSX.read(data, { type: this.rABS ? 'binary' : 'array', cellDates: true, cellNF: false, cellText: false });

          /* grab first sheet */
          console.log(wb.Sheets);
          const wsname: string = wb.SheetNames[0];
          const ws: XLSX.WorkSheet = wb.Sheets[wsname];

          // console.log(wsname);
          // console.log(ws);

          // 取得資料範圍 A1:D4
          //     console.log('!ref => ', ws['!ref']);

          // 取得資料範圍，轉換為 s: {c: 0, r: 0} e: {c: 3, r: 3}
          //        console.log('range => ', XLSX.utils.decode_range(ws['!ref']));
          this.wsColName = [];
          var range = XLSX.utils.decode_range(ws['!ref']);
          for (var C = range.s.c; C <= range.e.c; ++C) {
            var address = XLSX.utils.encode_col(C) + "1"; // <-- first row, column number C
            if (!ws[address]) continue;
         
            this.wsColName.push(ws[address].v + "");
            console.log(ws[address].v);
          }

          // now change to A1:A3 變更查看的範圍
          // ws['!ref'] = 'A1:A3';

          // 以第一行的內容為 key
          //   console.log('json => ', XLSX.utils.sheet_to_json(ws));
          this.sheet1 = XLSX.utils.sheet_to_json(ws, { dateNF: "YYYY-MM-DD" });
          this.StudentQuizDataList = [];
          this.isAnalysisDatePassError = false;
          this.isImplementationDateError = false;

          this.sheet1.forEach(item => {
            let studQ: StudentQuizData = new StudentQuizData();
            studQ.QuizUID = this.QuizData.uid;
            if (item["班級"])
              studQ.ClassName = item["班級"];

            if (item["座號"])
              studQ.SeatNo = item["座號"];

            if (item["學號"])
              studQ.StudentNumber = item["學號"];

            if (item["身分證號"])
              studQ.IDNumber = item["身分證號"];

            let chkD1: boolean = false;
            if (item["解析日期"]) {
              if (moment(item["解析日期"]).isValid) {
                let xx = moment(item["解析日期"]);
                // 檢查是否西元年
                if (xx.year() > 1910 && xx.year() < 3000) {
                  studQ.AnalysisDate = moment(item["解析日期"]);
                  chkD1 = true;
                }
              }
            }
            let chkD2: boolean = false;
            // 加入日期是否正確與是否西元年檢查
            if (item["實施日期"]) {
              if (moment(item["實施日期"])) {
                let yy = moment(item["實施日期"]);
                if (yy.year() > 1910 && yy.year() < 3000) {
                  studQ.ImplementationDate = moment(item["實施日期"]);
                  chkD2 = true;
                }
              }
            }

            if (chkD1 === false) {
              this.isAnalysisDatePassError = true;
            }

            if (chkD2 === false) {
              this.isImplementationDateError = true;
            }

            this.QuizData.QuizItemList.forEach(qItem => {
              if (item[qItem.QuizName]) {
                let qi: QuizItem = new QuizItem();
                qi.QuizName = qItem.QuizName;
                qi.Value = item[qItem.QuizName];
                studQ.QuizItemList.push(qi);
              }
            });
            this.StudentQuizDataList.push(studQ);
          });
          return r(true);
        };
      }

    });
  }

  async onFileChange(event) {
    this.StudentQuizDataList = [];
    this.isImportButtonDisable = true;
    await this.readSpreadsheet(event);
    let checkPass: boolean = true;
    //   console.log(this.sheet1);

    // 檢查需要欄位是否完整

    if (this.sheet1.length === 0) {

      checkPass = false;
      alert("檔案內沒有資料。");
    }

    // this.wsColName.forEach(item => {
    //   console.log(item);
    // });



    let lostField: string[] = [];
    // 驗證欄位是否缺少
    if (this.sheet1.length > 0) {
      this.importFieldNameList.forEach(item => {
        // 常模轉換
        if (this.QuizData.UseMappingTable) {
          if (!this.sheet1[0]['原始分數']) {
            lostField.push('原始分數');
          }
        } else {
          // 檢查是否有在欄位內
          if (!this.wsColName.includes(item)) {
            lostField.push(item);
          }
        }
      });
    }

    if (lostField.length > 0) {
      checkPass = false;
      alert("檔案內缺少欄位：" + lostField.join(','));
    }

    if (this.isAnalysisDatePassError) {
      checkPass = false;
      alert("解析日期內容無法解析，格式為:西元年/月/日。");
    }

    if (this.isImplementationDateError) {
      checkPass = false;
      alert("實施日期內容無法解析，格式為:西元年/月/日。");
    }

    if (checkPass) {

      // 處理常模對照
      let n: NormTable = new NormTable();

      if (this.QuizData.UseMappingTable)
        n.loadMapTable(this.QuizData.MappingTable);

      // 判斷使用驗證方式
      if (this.selectImportStudentType === '班級座號') {
        let noStudentIDList: string[] = [];
        let ClassName = [];
        let tmpC: string[] = [];
        // 解析匯入班級座號
        this.StudentQuizDataList.forEach(item => {
          if (!tmpC.includes(item.ClassName)) {
            tmpC.push(item.ClassName);
            ClassName.push(item.ClassName);
          }
        });

        let req = {
          Request: {
            ImportType: this.selectImportStudentType,
            ClassName
          }
        };
        // console.log(req);
        // console.log(tmpClassName);
        let resp: any;
        try {
          resp = await this.dsaService.send("GetImportQuizCheckData",
            req
          );
        } catch (err) {
          alert(err);
        }

        let xData = [].concat(resp.StudentIDs || []);
        xData.forEach(item => {
          this.StudentQuizDataList.forEach(sItem => {
            if (item.class_name == sItem.ClassName && item.seat_no == sItem.SeatNo) {
              sItem.StudentID = item.student_id;
              sItem.Birthday = moment(item.birthdate);
              sItem.parseAge();
              sItem.Gender = item.gender;

              // if (sItem.QuizItemList[0].QuizName === "原始分數") {
              if (this.QuizData.UseMappingTable) {
                sItem.NormSource = parseFloat(sItem.QuizItemList[0].Value);

                sItem.NormScore = n.GetScore(sItem.NormSource, sItem.Age, sItem.Gender);
                let qi: QuizItem = new QuizItem();
                qi.QuizName = "常模分數"
                qi.Value = sItem.NormScore;
                sItem.QuizItemList.push(qi);

                let qiG: QuizItem = new QuizItem();
                qiG.QuizName = "年齡";
                if (sItem.Age)
                  qiG.Value = sItem.Age + '';
                else
                  qiG.Value = '';
                sItem.QuizItemList.push(qiG);

                let qigender: QuizItem = new QuizItem();
                qigender.QuizName = "性別";
                qigender.Value = sItem.Gender;
                sItem.QuizItemList.push(qigender);
              }
            }
          });
        });
        let id: number = 2;
        this.StudentQuizDataList.forEach(sItem => {
          if (sItem.StudentID && sItem.StudentID.length > 0) {
          } else {
            let str = `第${id}筆，班級：${sItem.ClassName}, 座號：${sItem.SeatNo}`;
            noStudentIDList.push(str);
          }
          id++;
        });

        if (noStudentIDList.length > 0) {
          this.isImportButtonDisable = true;
          alert("班級,座號 無法比對，無法匯入：\n" + noStudentIDList.join('\n'));
        } else {
          this.isImportButtonDisable = false;
        }

      }

      if (this.selectImportStudentType === '學號') {
        let noStudentIDList: string[] = [];
        let StudentNumber = [];
        let tmpC: string[] = [];
        // 解析匯入學號
        this.StudentQuizDataList.forEach(item => {
          if (!tmpC.includes(item.StudentNumber)) {
            tmpC.push(item.StudentNumber);
            StudentNumber.push(item.StudentNumber)
          }
        });


        let resp: any;
        try {
          let req = {
            Request: {
              ImportType: this.selectImportStudentType,
              StudentNumber
            }
          };
          resp = await this.dsaService.send("GetImportQuizCheckData",
            req
          );

        } catch (err) {
          alert(err);
        }

        let xData = [].concat(resp.StudentIDs || []);
        xData.forEach(item => {
          this.StudentQuizDataList.forEach(sItem => {

            if (item.student_number == sItem.StudentNumber) {
              sItem.StudentID = item.student_id;
              sItem.Birthday = moment(item.birthdate);
              sItem.parseAge();
              sItem.Gender = item.gender;


              //if (sItem.QuizItemList[0].QuizName === "原始分數") {
              if (this.QuizData.UseMappingTable) {
                sItem.NormSource = parseFloat(sItem.QuizItemList[0].Value);
                sItem.NormScore = n.GetScore(sItem.NormSource, sItem.Age, sItem.Gender);
                let qi: QuizItem = new QuizItem();
                qi.QuizName = "常模分數"
                qi.Value = sItem.NormScore;
                sItem.QuizItemList.push(qi);

                let qiG: QuizItem = new QuizItem();
                qiG.QuizName = "年齡";
                if (sItem.Age)
                  qiG.Value = sItem.Age + '';
                else
                  qiG.Value = '';
                sItem.QuizItemList.push(qiG);

                let qigender: QuizItem = new QuizItem();
                qigender.QuizName = "性別";
                qigender.Value = sItem.Gender;
                sItem.QuizItemList.push(qigender);
              }
            }
          });
        });

        let id: number = 2;
        this.StudentQuizDataList.forEach(sItem => {
          if (sItem.StudentID && sItem.StudentID.length > 0) {
          } else {
            let str = `第${id}筆，學號：${sItem.StudentNumber}}`;
            noStudentIDList.push(str);
          }
          id++;
        });

        if (noStudentIDList.length > 0) {
          this.isImportButtonDisable = true;
          alert("學號無法比對，無法匯入：\n" + noStudentIDList.join('\n'));
        } else {
          this.isImportButtonDisable = false;
        }

      }

      if (this.selectImportStudentType === '身分證號') {
        let noStudentIDList: string[] = [];
        let IDNumber = [];
        let tmpC: string[] = [];
        // 解析匯入學號
        this.StudentQuizDataList.forEach(item => {
          if (!tmpC.includes(item.IDNumber)) {
            tmpC.push(item.IDNumber);
            IDNumber.push(item.IDNumber);
          }
        });

        let resp: any;
        try {
          let req = {
            Request: {
              ImportType: this.selectImportStudentType,
              IDNumber
            }
          };
          // console.log(req);
          // console.log(tmpClassName);
          resp = await this.dsaService.send("GetImportQuizCheckData",
            req
          );
        } catch (err) {
          alert(err);
        }


        let xData = [].concat(resp.StudentIDs || []);
        xData.forEach(item => {
          this.StudentQuizDataList.forEach(sItem => {

            if (item.id_number == sItem.IDNumber) {
              sItem.StudentID = item.student_id;
              sItem.Birthday = moment(item.birthdate);
              sItem.parseAge();
              sItem.Gender = item.gender;
              // if (sItem.QuizItemList[0].QuizName === "原始分數") {
              if (this.QuizData.UseMappingTable) {
                sItem.NormSource = parseFloat(sItem.QuizItemList[0].Value);
                sItem.NormScore = n.GetScore(sItem.NormSource, sItem.Age, sItem.Gender);

                let qi: QuizItem = new QuizItem();
                qi.QuizName = "常模分數";
                qi.Value = sItem.NormScore;
                sItem.QuizItemList.push(qi);

                let qiG: QuizItem = new QuizItem();
                qiG.QuizName = "年齡";
                if (sItem.Age)
                  qiG.Value = sItem.Age + '';
                else
                  qiG.Value = '';
                sItem.QuizItemList.push(qiG);

                let qigender: QuizItem = new QuizItem();
                qigender.QuizName = "性別";
                qigender.Value = sItem.Gender;
                sItem.QuizItemList.push(qigender);
              }
            }
          });
        });

        let id: number = 2;
        this.StudentQuizDataList.forEach(sItem => {
          if (sItem.StudentID && sItem.StudentID.length > 0) {
          } else {
            let str = `第${id}筆，身分證號：${sItem.IDNumber}}`;
            noStudentIDList.push(str);
          }
          id++;
        });

        if (noStudentIDList.length > 0) {
          this.isImportButtonDisable = true;
          alert("身分證號無法比對：\n" + noStudentIDList.join('\n'));
        } else {
          this.isImportButtonDisable = false;
        }

      }

      if (this.isImportButtonDisable === false) {
        await this.checkHasData();

        // 當驗證過不能再換驗證類型
        if (this.isSelectImportTypeClassSeatNo) {
          this.isBtnClassSeatNo = false;
          this.isBtnIDNumber = true;
          this.isBtnStudentNumber = true;
        }

        if (this.isSelectImportTypeIDNumber) {
          this.isBtnClassSeatNo = true;
          this.isBtnIDNumber = false;
          this.isBtnStudentNumber = true;
        }

        if (this.isSelectImportTypeStudentNumber) {
          this.isBtnClassSeatNo = true;
          this.isBtnIDNumber = true;
          this.isBtnStudentNumber = false;
        }
      }

    } else {
      this.isImportButtonDisable = true;
    }
  }

  SetSelectImportType(name: string) {
    this.isSelectImportTypeClassSeatNo = false;
    this.isSelectImportTypeIDNumber = false;
    this.isSelectImportTypeStudentNumber = false;
    this.selectImportStudentType = name;
    this.isSelectImportTypeClassSeatNo = (name === '班級座號');
    this.isSelectImportTypeIDNumber = (name === '身分證號');
    this.isSelectImportTypeStudentNumber = (name === '學號');
    this.loadImportFieldName();
  }

  // 匯出 Excel 範本
  exportTemplate() {
    if (!this.importFieldNameList || this.importFieldNameList.length === 0) {
      alert('請先選擇學生匯入方式');
      return;
    }

    // 建立工作簿
    const wb: XLSX.WorkBook = XLSX.utils.book_new();

    // 準備標題列資料
    const headers = [...this.importFieldNameList];
    
    // 只建立標題列，不含示例資料
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([headers]);

    // 設定欄寬
    const colWidths = headers.map(header => ({
      wch: Math.max(header.length * 1.5, 12)
    }));
    ws['!cols'] = colWidths;

    // 新增工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '心理測驗資料');

    // 產生檔案名稱
    const fileName = `${this.QuizData.QuizName || '心理測驗'}_匯入範本_${this.selectImportStudentType}.xlsx`;

    // 匯出檔案
    XLSX.writeFile(wb, fileName);
  }
}
