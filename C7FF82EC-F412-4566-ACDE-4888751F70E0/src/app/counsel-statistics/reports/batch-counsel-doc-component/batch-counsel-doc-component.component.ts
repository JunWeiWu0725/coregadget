import { Component, ElementRef, OnInit } from '@angular/core';
import { DsaService } from "../../../dsa.service";
import { CounselClass, GradeClassInfo } from '../../CounselStatistics-vo';

@Component({
  selector: 'app-batch-counsel-doc-component',
  templateUrl: './batch-counsel-doc-component.component.html',
  styleUrls: ['./batch-counsel-doc-component.component.css']
})
export class BatchCounselDocComponentComponent implements OnInit {

  constructor(private dsaService: DsaService,
    private el: ElementRef) { 
      let myTag = this.el.nativeElement.querySelector(".header")
      //  alert("myTag"+JSON.stringify(myTag))

    }

  isExportButtonDisable: boolean = true;
  tmpGradeYear: number[] = [];
  tmpClass: CounselClass[] = [];
  isSelectAllItem: boolean = false;
  selectClass: CounselClass[] = [];
  SelectGradeYearList: GradeClassInfo[] = [];

  selectDocName: string = "請選擇...";
  selectPriDocument: any;
  // 列印樣板 list
  printDocument: any[];

  ngOnInit() {

    // 取得綜合記錄表樣板資料
    this.loadPrintDocument();
    this.isSelectAllItem = false;
    this.GetCounselClass();

  }
  openGradeSection(gradeClassInfo:GradeClassInfo){
    
 
    gradeClassInfo.isOpen =! gradeClassInfo.isOpen ;

  }

  async loadPrintDocument() {
    var rsp = await this.dsaService.send("GetPrintDocumentTemplate");
    this.printDocument = [].concat(rsp.PrintDocument || []);
  }

  SetSelectDocument(doc: any) {
    this.selectPriDocument = doc;
    this.selectDocName = this.selectPriDocument.Name + '(' + this.selectPriDocument.DocumentName + ')';
    this.isExportButtonDisable = false;
  }

  async report() {

    this.selectClass = [];
    this.SelectGradeYearList.forEach(item => {
      item.ClassItems.forEach(classItem => {
        if (classItem.Checked) {
          this.selectClass.push(classItem);
        }
      });
    });

    //  alert(this.selectPriDocument.PrintDocumentID+',  '+this.selectClassIDs);

    this.selectClass.forEach((item,i) => {
      setTimeout(
        () => {
          var title = item.ClassName + ' ' + this.selectPriDocument.DocumentName;
          
          window.open(`content.htm#/(simple-page:simple-page/counsel_doc2/${item.ClassID}/${this.selectPriDocument.PrintDocumentID}/${title})`,'_blank');
        },
        i*10000);
    });
  }

  SetSelectAllItem() {
    this.isSelectAllItem = !this.isSelectAllItem;
    this.SelectGradeYearList.forEach(item => {
      item.Checked = this.isSelectAllItem;
      item.ClassItems.forEach(classItem => {
        classItem.Checked = this.isSelectAllItem;
      });
    });
  }

  SetSelectGradeItem(gradeYear: number) {
    this.SelectGradeYearList.forEach(item => {

      if (item.GradeYear === gradeYear) {
        item.Checked = !item.Checked;
        item.ClassItems.forEach(classItem => {
          classItem.Checked = item.Checked;
        });
      }
    });
  }

  // 取得教師輔導班級
  async GetCounselClass() {
    this.SelectGradeYearList = [];
    this.tmpClass = [];
    this.tmpGradeYear = [];
    try {
      let resp = await this.dsaService.send("GetClasses", {
        Request: {}
      });

      [].concat(resp.Class || []).forEach(counselClass => {

        let gryear: number;
        gryear = 999; // 沒有年級
        if (counselClass.GradeYear) {
          gryear = parseInt(counselClass.GradeYear);
        }

        let CClass: CounselClass = new CounselClass();
        CClass.GradeYear = gryear;

        CClass.id = 'class_' + counselClass.ClassID;
        CClass.ClassName = counselClass.ClassName;
        CClass.ClassID = counselClass.ClassID;
        CClass.Checked = false;
        this.tmpClass.push(CClass);
        if (!this.tmpGradeYear.includes(gryear)) {
          this.tmpGradeYear.push(gryear);
        }
      });

      // 整理資料
      this.tmpGradeYear.forEach(gr => {
        let grClass: GradeClassInfo = new GradeClassInfo();
        grClass.GradeYear = gr;
        if (grClass.GradeYear === 999) {
          grClass.GradeYearStr = '未分年級';
        } else {
          grClass.GradeYearStr = gr + ' 年級';
        }
        grClass.id = 'grade_' + gr;
        grClass.Checked = false;
        grClass.ClassItems = this.tmpClass.filter(x => x.GradeYear === gr);
        this.SelectGradeYearList.push(grClass);
      });

    } catch (err) {
      alert(err);
    }
    //this.isLoading = false;
  }

}
