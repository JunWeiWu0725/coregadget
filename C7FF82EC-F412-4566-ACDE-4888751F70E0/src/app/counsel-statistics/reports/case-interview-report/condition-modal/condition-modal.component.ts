import { Component, OnInit } from '@angular/core';
import { CaseQuestionTemplate, IOptionInfo, OptionInfo } from 'src/app/case/case-question-template';

@Component({
  selector: 'app-condition-modal',
  templateUrl: './condition-modal.component.html',
  styleUrls: ['./condition-modal.component.css']
})
export class ConditionModalComponent implements OnInit {
  classViewList: any[] = []; // 初始化班級列表
  problem_main_category :IOptionInfo[] =[];
  gender_option :IOptionInfo[] =[];
  /**是否有用性別塞選 */
  filterByGender :boolean = false ;
  /**是否有用類別塞選 */
  filterByProblemCata :boolean = false ;
  selectedItemsText :string []=[]; //parent 會用到
  selectGender :string [] =[]; // parent 會用到

  constructor() { }
  title ="請選擇產出條件"
  ngOnInit() {
    //初始化選項 
    this.initOption(['男','女']); 
    let caseQuestionTemplate =  new CaseQuestionTemplate()
    this.problem_main_category = caseQuestionTemplate.getProblemCategory();
  }

  /**初始化選項  可提問*/ 
  initOption(textlist :string[] ){
    this.gender_option =[];
    textlist.forEach(item=>{
     let  optionInfo  = new OptionInfo ();
     optionInfo.answer_text =item ;
     this.gender_option.push(optionInfo);
    })
  }


  /**點下類別選項後 */
  clickOption(option:IOptionInfo){
    
    option.answer_checked =!option.answer_checked;
  }


  /**取得所有選取選項 */
  getAllSelected (){
    // 1.處理性別
   this.selectGender =[] ;
   this.filterByGender = false ; 
   this.gender_option.forEach(option=>{
     if(option.answer_checked)
      { 
        this.filterByGender = true ; //只要有勾選 男女其中一個就代表使用性別的塞選條件
         this.selectGender.push(option.answer_text);
      }

   })

    //處理個案類別
    this.selectedItemsText =[];
    this.filterByProblemCata =false ;
    this.problem_main_category.forEach(option => {

     

      if(option.answer_checked)
      {
        this.filterByProblemCata = true ; //有需要塞選個案類別
      
        if(option.answer_text.includes("其他")) //其他就需要合併
        {
          this.selectedItemsText.push(option.answer_martix.join(''));
        }else //不是其他就不用特別處理
        {
          this.selectedItemsText.push(option.answer_text);
        }
      
      }
    });
  }

  /**確定OK */
  check()
  {
    this.getAllSelected();
    $("#conditionModal").modal("hide");
    
  }

  closeModal() {
    $("#conditionModal").modal("hide");
  }

  /** 選擇全部 */
  selectAll(event ,tarrgetList :OptionInfo[]){
   let settingValue = false ; //依據btn是否勾選 決定設定成 true || false 
    if(event.target.checked){
      settingValue = true ;
    }
    tarrgetList.forEach(item=>{
      item.answer_checked = settingValue ;
    });
  }
}
