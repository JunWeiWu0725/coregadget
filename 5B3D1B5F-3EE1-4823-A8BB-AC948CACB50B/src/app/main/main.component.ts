import { Component, OnInit } from '@angular/core';
import { GadgetService, Contract } from "src/app/gadget.service";
import { CommonModule } from '@angular/common';
import { Utils } from 'src/app/util';
import { ClassInfo } from '../models/vo';


@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styles: ['./common.css']
})
export class MainComponent implements OnInit {

  contract: Contract;
  courseDataINfo: any;
  loading: boolean;
  classes: ClassInfo[] = [];
  error: any;
  constructor(private gadget: GadgetService) { }

  async ngOnInit() {
    this.contract = await this.gadget.getContract('kcis');
    //取得老師的導師班
    this.getTeacherClass();
  }

  //取得老師導師班
  async getTeacherClass() {
    try {
      this.loading = true;
      this.error = null;
      //呼叫service 
      const rsp = await this.contract.send('behaviorForAll.GetTeacherClass');
      this.courseDataINfo = Utils.array(rsp, "Response/Class");

      //1.加入班級資料
      if (this.courseDataINfo && this.courseDataINfo.length > 0) {
        for (const cl in this.courseDataINfo) {
          this.classes.push(new ClassInfo(this.courseDataINfo[cl].ID, this.courseDataINfo[cl].Name));
        }
      }
    } catch (err) {
      console.error('取得導師班失敗:', err);
      this.error = err;
      alert('無法載入導師班資料，請檢查連線狀態');
    }
    finally {
      this.loading = false;
    }
  }
}
