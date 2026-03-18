import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import * as moment from "moment";
import { GadgetService, Contract } from "src/app/gadget.service";
import { Utils } from "src/app/util";
import { DialogService } from "../dialog-service.service";

@Component({
  selector: "app-list",
  templateUrl: "./list.component.html",
  styleUrls: ["../common.css"]
})
export class ListComponent implements OnInit {
  head: string;
  accessPoint: string;
  behaviorDataInfo: any;
  behaviorDataList: any;
  loading: boolean;
  error: any;
  courseID: string;
  courseName: string;

  constructor(
    private route: ActivatedRoute,
    private gadget: GadgetService,
    private dialogService: DialogService
  ) {
    // 取得 contract 連線。
  }
  contract: Contract;

  async ngOnInit() {
    this.courseID = this.route.snapshot.paramMap.get("id");
    this.courseName = this.route.snapshot.paramMap.get("name");
    // console.log(this.courseID);
    this.contract = await this.gadget.getContract("kcis");
    this.getData();
  }

  // 修改 comment
  async editComment(data) {
    const result = await this.dialogService.editDialog("Edit (" + data.LastUpdate + " )" + data.Name, "Comment", data.Comment, data.Detention=='true' ,data.IsGoodBehavior == 'true',data.DaaDsaFollow == 'true');
    if (result.confirm) {
      try {
        const rsp = await this.contract.send("behavior.EditBehaviorData", {
          Request: {
            BehaviorData: {
              Field: {
                Comment: result.comment,
                Detention: result.detention,
                IsGoodBehavior :result.isGoodBehavior,
                DaaDsaFollow :result.daaDsaFollow
              },
              Condition: {
                Uid: data.BehaviorUID
              }
            }
          }
        });
        this.getData();
      } catch (error) {
        alert(error);
      } finally {
      }
    }
  }

  // 刪除資料
  async delete(data) {
    const result = await this.dialogService.confirm(
      "Confirmation",
      "Are you sure want to delete the comment?"
    );
    if (result) {
      try {
        // 確認刪除
        const rsp = await this.contract.send("behavior.DelBehaviorData", {
          Request: { BehaviorData: { Condition: { Uid: data.BehaviorUID } } }
        });
        this.getData();
      } catch (error) {
        alert(error);
      } finally {
      }
    } else {
      return;
    }
    // console.log(data);
  }

  async getData() {
    try {
      this.loading = true;

      // 呼叫 service。
      const rsp = await this.contract.send(
        "behavior.GetBehaviorDataByCourseID",
        {
          Request: {
            CourseID: this.courseID
          }
        }
      );
      this.behaviorDataInfo = Utils.array(rsp, "Response/BehaviorData");
      this.behaviorDataList = [];
      for (const data of this.behaviorDataInfo) {
        // 格式化日期
        if (data.CreateDate) {
          const createDate = this.formatDateTime(data.CreateDate);
          data.CreateDate2 = createDate;
        }
        
        // 格式化 LastUpdate（最後更新時間）
        if (data.LastUpdate) {
          const lastUpdate = this.formatDateTime(data.LastUpdate);
          data.FormattedLastUpdate = lastUpdate;
        }
        
        this.behaviorDataList.push(data);
      }

      // console.log(this.behaviorDataList);
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
