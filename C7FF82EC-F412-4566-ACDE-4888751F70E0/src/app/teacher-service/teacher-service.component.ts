import { AddServiceModalComponent } from './add-service-modal/add-service-modal.component';
import { Component, OnInit, ViewChild } from '@angular/core';
import { DsaService } from '../dsa.service';
import { mode, ServiceDetailDB, ServiceItemDetail, ServiceItemInfo } from './vo';
import { DelServiceModalComponent } from './del-service-modal/del-service-modal.component';

@Component({
  selector: 'app-teacher-service',
  templateUrl: './teacher-service.component.html',
  styleUrls: ['./teacher-service.component.css']
})
export class TeacherServiceComponent implements OnInit {

  @ViewChild("addServiceModal") _addServiceModal: AddServiceModalComponent;
  @ViewChild("delServiceModal") _delServiceModal: DelServiceModalComponent;


  serviceDataDB: ServiceDetailDB[] = [];
  serviceDataList: ServiceItemInfo[] = [];
  isLoading = false;
  Mode = new mode();

  constructor(private dsaService: DsaService) { }

  ngOnInit() {
    this.loadData();
  }
  loadData() {
    this.isLoading = true;
    this.getServiceItem();
    this.isLoading = false;
  }


  decodeHtml(html: string ,action :'修改'|'新增'): string {
    if(action=='修改'){

      const txt = document.querySelector('textarea');
      console.log(txt)
      txt.innerHTML = html;
      return txt.value;
    }else{
      const txt = document.querySelector('textarea');
      console.log(txt)
      txt.innerHTML = "";
      return txt.value;
    }
  }

  
  /** 取得服務項目 */
  async getServiceItem() {
    try {
      let resp = await this.dsaService.send("TeacherService.GetTeacherServiceItemByTeacherID", {
        Request: {
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

    } catch (ex) {
      alert('取得服務資訊發生錯誤 :' + JSON.stringify(ex))
    }
  }
  /** 開啟新增視窗 */
  Add() {
    this._addServiceModal.mode = 'add'
    this._addServiceModal.currentServiceItem = new ServiceItemInfo();

    $("#addServiceModal").modal({ backdrop: 'static' });
    $("#addServiceModal").modal("show");


    $("#addServiceModal").on("hide.bs.modal", () => {
      if (this._addServiceModal.isClose) { // 如果關掉舊重新 load 資料
        this.loadData();
      }
      $("#addCaseInterview").off("hide.bs.modal");
    });

  }

  /** 點選刪除選項 */
  delete(item: ServiceItemInfo) {

    this._delServiceModal.currentServiceInfo = item;
    $("#delServiceModal").modal({ backdrop: 'static' });
    $("#delServiceModal").modal("show");
    $("#delServiceModal").on("hide.bs.modal", () => {
      if (true) { // 如果關掉舊重新 load 資料
        this.loadData();
      }

    });
  }

  /** 編輯選項 */
  edit(item: ServiceItemInfo) {
    this._addServiceModal.mode = 'edit'
    this._addServiceModal.currentServiceItem = item;
    this._addServiceModal.decodeHtml(    this._addServiceModal.currentServiceItem.ServiceDescription,'修改')
    $("#addServiceModal").modal({ backdrop: 'static' });
    $("#addServiceModal").on('shown.bs.modal', () => {
      this.resize();
    });
    $("#addServiceModal").on("hide.bs.modal", () => {
     // 如果關掉舊重新 load 資料
        this.loadData();

      $("#addServiceModal").off("hide.bs.modal");
    });
  }
  resize(){
    const textArea = document.querySelector('textarea');
    textArea.style.overflow = 'hidden';
    textArea.style.height = 'auto';
    textArea.style.height = textArea.scrollHeight + 'px';
  }
}
