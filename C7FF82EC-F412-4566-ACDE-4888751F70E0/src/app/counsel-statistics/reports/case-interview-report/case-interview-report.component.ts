import { OptionInfo } from 'src/app/case/case-question-template';
import { Component, OnInit, ViewChild } from '@angular/core';
import { CounselClass, GradeClassInfo } from '../../CounselStatistics-vo';
import { DsaService } from "../../../dsa.service";
import * as moment from 'moment';
import * as XLSX from 'xlsx';
import { ConditionModalComponent } from './condition-modal/condition-modal.component';
import { result } from 'lodash';

@Component({
  selector: 'app-case-interview-report',
  templateUrl: './case-interview-report.component.html',
  styleUrls: ['./case-interview-report.component.css']
})
export class CaseInterviewReportComponent implements OnInit {

  @ViewChild("condition_modal") condition_modal:ConditionModalComponent
  tmpGradeYear: number[] = [];
  tmpClass: CounselClass[] = [];
  isSelectAllItem: boolean = false;
  selectClassIDs: string[] = [];
  SelectGradeYearList: GradeClassInfo[] = [];
  isSaveButtonDisable: boolean = false;
  startDate: string = "";
  endDate: string = "";
  /**塞選條件 性別*/
  conditionGender :string[]=[];
   /**塞選條件 個案類別*/
  conditionProblemCatag :string[]=[];
   /**塞選條件 性別*/
   isUseGenderFilter :boolean = false;
   isUseProblemCatagFilter :boolean = false;
   selectNum =0;
  constructor(private dsaService: DsaService) { }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isSelectAllItem = false;
    this.GetCounselClass();
  }

  /**收合年級區塊 */
  openGradeSection(gradeClassInfo:GradeClassInfo){


    gradeClassInfo.isOpen =! gradeClassInfo.isOpen ;

  }
  SetSelectAllItem() {
  this.selectNum = 0;
    this.isSelectAllItem = !this.isSelectAllItem;
    this.SelectGradeYearList.forEach(item => {
      item.Checked = this.isSelectAllItem;
      item.ClassItems.forEach(classItem => {
        this.selectNum ++ ;
        classItem.Checked = this.isSelectAllItem;
      });
    });
  }

  report() {


   let chkDataPass: boolean = true;

    this.selectClassIDs = [];
    this.SelectGradeYearList.forEach(item => {
      item.ClassItems.forEach(classItem => {
        if (classItem.Checked) {
          this.selectClassIDs.push(classItem.ClassID);
        }
      });
    });

    if (!moment(this.startDate).isValid() || !moment(this.endDate).isValid()) {
      alert("開始或結束日期錯誤！");
      chkDataPass = false;
    }

    if (moment(this.startDate).isValid() && moment(this.endDate).isValid()) {
      if (moment(this.startDate) > moment(this.endDate)) {
        alert("開始日期需要小於結束日期！");
        chkDataPass = false;
      }
    }

    if (this.selectClassIDs.length === 0) {
      alert("請勾選班級！");
      chkDataPass = false;
    }

    if (chkDataPass) {
      this.exportReport()
    }

  }

  async exportReport() {


    this.isUseGenderFilter =this.condition_modal.filterByGender ;
    this.isUseProblemCatagFilter =this.condition_modal.filterByProblemCata ;
    this.conditionGender =this.condition_modal.selectGender ;
    this.conditionProblemCatag =this.condition_modal.selectedItemsText ;
    console.log('1..',this.conditionProblemCatag)
    try {
      let StartDate = this.startDate.replace('T', ' ');
      let EndDate = this.endDate.replace('T', ' ');

      let wsName: string = "晤談記錄報表";
      let fileName: string = wsName + ".xlsx";
      let resp = await this.dsaService.send("GetCaseInterviewReport1", {
        Request: {
          StartDate: StartDate,
          EndDate: EndDate,
          ClassIDs: this.selectClassIDs
        }
      });
      console.log('resp',resp);
      let data = [].concat(resp.CaseInterview || []);

      if (data.length > 0) {
        let data1: any[] = [];
        data.forEach(item => {

          let ProblemCategoryString:string =""
          //整理個案類別(主) (副)
        if(item.ProblemCategory){
          ProblemCategoryString = this.getProblemCatString(JSON.parse(item.ProblemCategory)).join('、');
        }
        let ProblemMainCategoryString  :string =""
       if(item.ProblemMainCategory){
        ProblemMainCategoryString  =this.getProblemCatString(JSON.parse(item.ProblemMainCategory)).join('、');
       }



           //#region 是否要列印
           let isPrint =false
           if(this.isUseGenderFilter && this.isUseProblemCatagFilter) // 兩個塞選條件都有
           {
             try{
               isPrint =
               (this.checkIsPrintByCondition(this.getProblemCatString(JSON.parse(item.ProblemCategory)))
               ||this.checkIsPrintByCondition(this.getProblemCatString(JSON.parse(item.ProblemMainCategory||null))))
               &&this.conditionGender.includes(item.Gender);


             }catch(ex){
             }

           }else if(this.isUseGenderFilter && !this.isUseProblemCatagFilter){ //只塞選男女
            isPrint  = this.conditionGender.includes(item.Gender);


           }else if(!this.isUseGenderFilter && this.isUseProblemCatagFilter) // 只塞選個案類別
           {
            isPrint =
              (this.checkIsPrintByCondition(this.getProblemCatString(JSON.parse(item.ProblemCategory)))
              ||this.checkIsPrintByCondition(this.getProblemCatString(JSON.parse(item.ProblemMainCategory))))

           }else //都沒有選
           {
             //印全部!!
             isPrint =true ;
           }
           //#endregion

          let item1 = {
            '晤談紀錄ID': item.CaseInterviewID,
            '班級': item.ClassName,
            '座號': item.SeatNo,
            '性別': item.Gender,
            '學號': item.StudentNumber,
            '姓名': item.Name,
            '個案編號': item.CaseNo,
            '學年度': item.SchoolYear,
            '學期': item.Semester,
            '晤談日期': item.OccurDate,
            '訪談者': item.AuthorName,
            '訪談者身分': item.AuthorRole,
            '訪談對象': item.ContactName,
            '訪談方式': item.CounselType,
            '內容': item.Content,
            '登錄教師': item.TeacherName,
            '個案類別(主)':ProblemMainCategoryString,
            '個案類別(副)':ProblemCategoryString
          };



          if(isPrint) //增加條件塞選
          {
            data1.push(item1);
          }

        });

        if(data1.length ==0){
          alert("沒有資料符和條件之資料!");
          return ;
        }
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data1, { header: [], cellDates: true, dateNF: 'yyyy-mm-dd hh:mm:ss', });
        XLSX.utils.book_append_sheet(wb, ws, wsName);
        //XLSX.write(wb,{type:'buffer',bookType:'xlsx'});
        XLSX.writeFile(wb, fileName);
      } else {
        alert("沒有資料!");
      }
    }
    catch (err) {
      console.log('#001',err);
      alert('發生錯誤 :' +'\n' +'錯誤代碼 :#001');
    }
  }

  /**取得個案類別字串 */
 getProblemCatString(ProblemCatgs:OptionInfo[]):string[]
 {
   let result =[] ;
  ProblemCatgs.forEach(option=>{
   if(option.answer_checked) {
    result.push(option.answer_value);
   }
  });
  return result;
 }


 /**確認是否要列印 ByCondition */
 checkIsPrintByCondition(ProblemCatgs:string[] ){
  let result =false ;
  //先跑
  ProblemCatgs.forEach(item=>{
     if( this.conditionProblemCatag.includes(item)){
      result = true ;
     }
    })


  return result ;

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

  SetSelectGradeItem(gradeYear: number) {
    this.SelectGradeYearList.forEach(item => {

      if (item.GradeYear === gradeYear) {
        item.Checked = !item.Checked;
        if(  item.Checked )
        {
          this.selectNum++ ;
        }else {
          this.selectNum-- ;
        }
        item.ClassItems.forEach(classItem => {
          classItem.Checked = item.Checked;
        });
      }
    });
  }


//
  openCondictionModal()
  {
    this.condition_modal.title='請選擇產出條件'
    // alert("ho") ;
    $("#conditionModal").modal("show");
    // 關閉畫面
    $("#conditionModal").on("hide.bs.modal", () => {
      // 重整資料
      if (true)
        this.loadData();
      $("#conditionModal").off("hide.bs.modal");
    });
}
}