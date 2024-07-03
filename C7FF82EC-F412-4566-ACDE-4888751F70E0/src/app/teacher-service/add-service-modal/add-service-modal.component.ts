
import { ServiceDetailDB, ServiceItemDetail, ServiceItemInfo } from './../vo';
import { Component, OnInit } from '@angular/core';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { DsaService } from 'src/app/dsa.service';

@Component({
  selector: 'app-add-service-modal',
  templateUrl: './add-service-modal.component.html',
  styleUrls: ['./add-service-modal.component.css']
})
export class AddServiceModalComponent implements OnInit {
  isGetData = false;
  serviceDataDB: ServiceDetailDB[] = [];
  serviceDataList: ServiceItemInfo[] = [];
  currentServiceItem: ServiceItemInfo =new ServiceItemInfo()
  mode: 'add' | 'edit' // 模式
  CaseInterviewID: string = ""
  isClose: boolean = false;
  /** title  顯示  */
  actionString: string = ""
  ServiceOptionList: any  // 下拉選單用 
  ServiceTargetList: any  // 服務對象 下拉選單用
  GenderList: any
  currentServiceDetail: ServiceItemDetail;
  constructor(private dsaService: DsaService) {

  }

  async ngOnInit() {
    this.initModal();
  }
  onChange(event: Event ) {
    const textarea = event.target as HTMLTextAreaElement;
    const value = textarea.value;
    this.currentServiceItem.ServiceDescription = value
    // if( this.editModeString == "修改"){
    // this._currentCounselInterview.ContactItem = this.decodeHtml(value,targetID);
   
    // }else{
    //   this._currentCounselInterview.ContactItem =this.decodeHtml(value,targetID);
    // }
    // alert(" this._CaseInterview.Content"+JSON.stringify(this._CaseInterview.Content))
  }
  decodeHtml(html: string ,action :'修改'|'新增') {
    this.currentServiceItem.ServiceDescription = html
    if(action=='修改'){
      const txt = document.querySelector('#serviceDescription');
      txt.innerHTML = html;

    }else{
      const txt = document.querySelector('#serviceDescription');
      // txt.innerHTML = "";

    }
  }
  /** 取得該筆service 資料*/
  async GetServiceItemByUID(serviceID: string) {

    let resp = await this.dsaService.send("TeacherService.GetServiceItemByUID", {
      Request: {
        ServiceUID: serviceID
      }
    });

    this.serviceDataList = [];
    this.serviceDataDB = [].concat(resp.rs || [])
    // 整理資料
    this.serviceDataDB.forEach(detail => {

      let targetDetail = this.serviceDataList.find(x => x.ServiceID == detail.service_id)
      // 如果沒有 沒有 在加入
      if (!targetDetail) {
        this.serviceDataList.push(new ServiceItemInfo(detail))
      }
      let targetDetailhasVaule = this.serviceDataList.find(x => x.ServiceID == detail.service_id)
      targetDetailhasVaule.addTargetDetail(detail);      // 增加detail到裡面


    })
    this.currentServiceItem = this.serviceDataList[0];
    
    this.decodeHtml(this.currentServiceItem.ServiceDescription ,"修改")
    console.log("rsp", this.serviceDataList[0]);

  }


  /** 初始化 */
  initModal() {

    this.ServiceOptionList = [
      '團體輔導',
      '入班輔導',
      '家長諮詢',
      '教師諮詢',
      '個案會議',
      '心理測驗',
      '安心服務',
      '家庭處遇',
      '資源連結',
      '系統會談',
      '學生諮詢',
      '臨案協處',
      '方案計畫',
      '各項宣講',
      '危機處理',
      '轉銜輔導',
      '其他'
    ];
    this.ServiceTargetList = [
      '一年級',
      '二年級',
      '三年級',
      '四年級',
      '五年級',
      '六年級',
      '七年級',
      '八年級',
      '九年級',
      '高一',
      '高二',
      '高三',
      '教職員',
      '家長',
      '專業人員'
    ];
    this.GenderList = ['男', '女']
    this.currentServiceDetail = new ServiceItemDetail();
    if (this.mode == 'add') {

      this.currentServiceItem = new ServiceItemInfo();
      this.currentServiceItem.ServiceItem = ''
      this.currentServiceDetail.ServiceTarget = ''
      this.currentServiceItem.ServiceDate = '';
      this.currentServiceItem.CaseInterviewID = '';
      this.currentServiceItem.targetDetailList = [];


    } else if (this.mode == 'edit') {
      


    }


  }

  /** 取得 */
  getJSON(item: any) {

    return JSON.stringify(item);
  }


  /** 設定目前 */
  setCurrentService(item: string) {
    this.currentServiceItem.ServiceItem = item;
  }
  /** 儲存 */
  async save() {
    // 檢查欄位 
    if (!this.currentServiceItem.ServiceDate) {
      alert("請選擇日期!")
      return
    }
    if (!this.currentServiceItem.ServiceItem) {

      alert("請選擇服務項目!")
      return
    }
    if (!this.currentServiceItem.targetDetailList.length) {
      alert("請選選擇服務對象及人次")
      return
    }

    if (!this.currentServiceItem.CaseInterviewID) {
      this.currentServiceItem.CaseInterviewID = this.CaseInterviewID;
    }


    try {
      alert("SS"+JSON.stringify(this.currentServiceItem))
      let resp = await this.dsaService.send("TeacherService.SetTeacherService", {
        Request: {
          ServiceItem: this.currentServiceItem
        }
      });


      alert("儲存成功!")
      this.isGetData = true;
      this.isClose = true;
      $("#addServiceModal").modal("hide");
    } catch (ex) {
      alert("TeacherService.SetTeacherService" + JSON.stringify(ex));
    }
  }

  /** 設定目前對象 */
  setCurrentServiceTarget(item: any) {
    this.currentServiceDetail.ServiceTarget = item;
  }

  /** 設定目前性別 */
  setCurrentGender(item: string) {
    this.currentServiceDetail.gender = item


  }

  /** 設定數字 */
  // setCurrentCount(item: number) {
  //   this.currentServiceDetail.peopleCount = item;

  // }

  checkShowBtn() {
    return this.currentServiceDetail.ServiceTarget && this.currentServiceDetail.gender && this.currentServiceDetail.peopleCount


  }


  /** 增加detail */
  addServiceDetail() {
    //
    if (!this.currentServiceDetail.ServiceTarget) { // 對象沒選
      alert("對象未選!")
      return
    }
    if (!this.currentServiceDetail.gender) {
      alert("性別未選");
      return
    }
    if (!this.currentServiceDetail.peopleCount) {
      alert("請輸入人次")
      return

    }
    this.currentServiceItem.targetDetailList.push(this.currentServiceDetail)
    this.currentServiceDetail = new ServiceItemDetail();
  }

  /**去除資料 */
  removeItem(index: number) {


    this.currentServiceItem.targetDetailList.splice(index, 1)

  }
  countChange(event: any) {
    alert(event.target.value)
  }

  /**取消編輯 */
  cancel() {
    this.isGetData = true;
    this.isClose = true;
    $("#addServiceModal").modal("hide");
  }
  autoResize(textarea: any): void {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
}
