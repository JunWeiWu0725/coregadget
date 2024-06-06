import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GadgetService, Contract } from "src/app/gadget.service";
import { DialogService } from '../dialog-service.service';
import { Utils } from "src/app/util";

@Component({
  selector: 'app-list-behavior',
  templateUrl: './list-behavior.component.html',
  styles: []
})
export class ListBehaviorComponent implements OnInit {

  classID: any;
  className;
  behaviorDataList: any;
  listMyRecord: any;
  contract: Contract;

  constructor(
    private route: ActivatedRoute,
    private gadget: GadgetService,
    private dialogService: DialogService
  ) { }

  async ngOnInit() {
    this.contract = await this.gadget.getContract('kcis');
    this.classID = this.route.snapshot.paramMap.get('classID');
    this.className = this.route.snapshot.paramMap.get('className');

    if (this.classID) {
      this.getClassBehaviorRecordsByClass();
    }
    else {
      this.getBehaviorRecordsFromMe();
    }
  }

  /**
   * 取得指定班級的 Behavior records
   */
  //連線
  async  getClassBehaviorRecordsByClass() {
    //班級
    const RspBehaviorDataList = await this.contract.send("behaviorForAll.GetBehaviorDataByClassID"
    , {
      Request: {
        ClassID: this.classID
      }
    }
  );
    this.behaviorDataList = Utils.array(RspBehaviorDataList, "Response/BehaviorData");

  }

  /**
   * 取得我紀錄的 Behavoir records
  */
  //
  async  getBehaviorRecordsFromMe() {
    const RspRecord = await this.contract.send("behaviorForAll.GetBehaviorRecordByTeacher");
    // alert("getBehaviorRecordsFromMe" + JSON.stringify(RspRecord) )
    
    this.behaviorDataList = Utils.array(RspRecord, "Response/BehaviorData");
  }

  // 修改 comment
  async editComment(data) { 
 
    const result = await this.dialogService.editDialog("編輯  " + data.CreateDate2 + " " + data.Name, "事由:", data.Comment, data.Detention == 'true', data.GoodBehavior =='true' ,data.DaaDsaFollow=='true');
 
    if (result.confirm) {
      try {
        const rsp = await this.contract.send("behaviorForAll.EditBehaviorData", {
          Request: {
            BehaviorData: {
              Field: {
                Comment: result.comment,
                Detention: result.detention,
                IsGoodBehavior: result.goodBehavior,
                DaaDsaFollow :result.daaDsaFollow

              },
              Condition: {
                Uid: data.BehaviorUID
              }
            }
          }
        });

        if (this.classID) {
          this.getClassBehaviorRecordsByClass();
        }
        else {
          this.getBehaviorRecordsFromMe();
        }
      } catch (error) {
        alert(error);
      } finally {
      }
    }
  }

  // 刪除資料
  async delete(data) {
    const result = await this.dialogService.confirm(
      "請確認",
      "確認刪除此筆資料?"
    );
    if (result) {
      try {
        // 確認刪除
        const rsp = await this.contract.send("behaviorForAll.DelBehaviorData", {
          Request: { BehaviorData: { Condition: { Uid: data.BehaviorUID } } }
        });

        if (this.classID) {
          //回到我的紀錄
          this.getClassBehaviorRecordsByClass();
        }
        else {
          this.getBehaviorRecordsFromMe();
        }

      } catch (error) {
        alert(error);
      } finally {
      }
    } else {
      return;
    }
  }
}
