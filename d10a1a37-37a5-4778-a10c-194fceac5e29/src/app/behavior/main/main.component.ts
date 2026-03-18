 
 import { Component, OnInit } from '@angular/core';
import { GadgetService, Contract } from 'src/app/gadget.service';
import { Utils } from 'src/app/util';
import * as moment from 'moment';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['../common.css']
})
export class MainComponent implements OnInit {
  head: string;
  accessPoint: string;
  courseDataInfo: any;
  courseDataList: any;
  behaviorData3Info: any;

  loading: boolean;
  error: any;
  addText: string;
  constructor(private gadget: GadgetService) { }
  // 取得 contract 連線。
  contract: Contract;
  async ngOnInit() {
    this.contract = await this.gadget.getContract('kcis');
    this.getData();
  }


  async getData() {
    try {
      this.loading = true;

      // 呼叫 service。
      const rsp1 = await this.contract.send('behavior.GetCourses');

      this.courseDataInfo = Utils.array(rsp1, "Response/Course");
      const rsp2 = await this.contract.send('behavior.GetBehaviorDataLimit');
      this.behaviorData3Info = Utils.array(rsp2, "Response/BehaviorData");

      this.courseDataList = [];

      for (const data of this.courseDataInfo) {

        const bDataList = this.behaviorData3Info.filter(v => v.CourseID === data.ID);
        let displayItem: boolean = true;
        if (bDataList.length === 0) {
          displayItem = false;
        }

        // 格式化時間顯示
        for (const bData of bDataList) {
          // 格式化 CreateDate（創建日期）
          if (bData.CreateDate) {
            const createDate = this.formatDateTime(bData.CreateDate);
            bData.FormattedCreateDate = createDate;
          }
          
          // 格式化 LastUpdate（最後更新時間）
          if (bData.LastUpdate) {
            const lastUpdate = this.formatDateTime(bData.LastUpdate);
            bData.FormattedLastUpdate = lastUpdate;
          }
        }

        this.courseDataList.push({ ID: data.ID, Name: data.Name, DisplayItem: displayItem, bDataList });
      }

      // console.log(this.courseDataList);

    } catch (err) {
      console.log(err);
    } finally {
      this.loading = false;
    }
  }


  // 格式化日期時間的通用方法
  private formatDateTime(dateStr: any): string {
    if (!dateStr) return '';
    
    // 嘗試用 moment 解析各種可能的格式
    let parsedDate = moment(dateStr);
    
    // 如果直接解析失敗，嘗試常見的格式
    if (!parsedDate.isValid()) {
      // 嘗試 ISO 格式
      parsedDate = moment(dateStr, 'YYYY-MM-DDTHH:mm:ss');
    }
    
    if (!parsedDate.isValid()) {
      // 嘗試帶毫秒的格式
      parsedDate = moment(dateStr, 'YYYY-MM-DDTHH:mm:ss.SSS');
    }
    
    if (!parsedDate.isValid()) {
      // 嘗試空格分隔的格式
      parsedDate = moment(dateStr, 'YYYY-MM-DD HH:mm:ss');
    }
    
    if (!parsedDate.isValid()) {
      // 嘗試斜線格式
      parsedDate = moment(dateStr, 'YYYY/MM/DD HH:mm:ss');
    }
    
    if (parsedDate.isValid()) {
      // 格式化為 YYYY/MM/DD HH:mm 格式（不包含秒數）
      return parsedDate.format('YYYY/MM/DD HH:mm');
    } else {
      // 如果都無法解析，顯示原始值
      console.warn('Unable to parse date:', dateStr);
      return dateStr;
    }
  }

}
