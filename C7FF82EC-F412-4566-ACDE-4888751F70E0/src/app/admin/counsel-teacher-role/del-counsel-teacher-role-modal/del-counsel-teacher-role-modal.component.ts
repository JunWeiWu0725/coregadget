import { Component, OnInit } from '@angular/core';
import { DsaService } from "../../../dsa.service";
import { TeacherCounselRole } from "../counsel-teacher-role-vo";
import { HttpClient } from '@angular/common/http';
import { GlobalService } from "../../../global.service";

@Component({
  selector: 'app-del-counsel-teacher-role-modal',
  templateUrl: './del-counsel-teacher-role-modal.component.html',
  styleUrls: ['./del-counsel-teacher-role-modal.component.css']
})
export class DelCounselTeacherRoleModalComponent implements OnInit {

  isCancel: boolean = true;
  teacherCounselRole: TeacherCounselRole = new TeacherCounselRole();
  userIP: string = '';
  constructor(private dsaService: DsaService, private http: HttpClient, private globalService: GlobalService) { }

  async ngOnInit() {
    this.userIP = await this.fetchIp();
  }

  cancel() {
    this.isCancel = true;
    $("#delCounselTeacherRole").modal("hide");
  }

  del() {
    this.isCancel = false;
    this.DelTeachersCounselRole();

  }

  async DelTeachersCounselRole() {
    try {
      let resp = await this.dsaService.send("DelTeachersCounselRole", {
        Request: {
          TeacherID: this.teacherCounselRole.TeacherID
        }
      });

      // 確保 IP 有值，如果沒有就重新抓取
      if (!this.userIP) {
        this.userIP = await this.fetchIp();
      }
      console.log('DelModal - userIP:', this.userIP); // debug
      // alert(`準備記錄刪除 log，IP: ${this.userIP}`); // 確認 IP
      // 紀錄刪除 Log
      const executor = `${this.globalService.teacherName || '未知使用者'}`;
      
      const content = `刪除教師輔導身分：
教師：${this.teacherCounselRole.TeacherName}
原身分：${this.teacherCounselRole.Role}
執行者：${executor}`;
      await this.dsaService.send("Share.AddLog", { Request: { Content: content, IP: this.userIP, Action: '刪除教師輔導身分' } });

      $("#delCounselTeacherRole").modal("hide");
    } catch (err) {
      console.error("刪除錯誤詳細資訊:", err);
      alert("無法刪除:" + (err.dsaError ? err.dsaError.message : JSON.stringify(err, null, 2)));
    }
  }

  async fetchIp(): Promise<string | null> {
    try {
      const result: any = await this.http
        .get("https://api.ipify.org/?format=json")
        .toPromise();
      console.log('fetchIp result:', result); // debug
      return result.ip.trim();
    } catch (error) {
      console.error("抓取 IP 失敗", error);
      // 嘗試其他方式
      try {
        const result2: any = await this.http
          .get("https://httpbin.org/ip")
          .toPromise();
        console.log('fetchIp backup result:', result2); // debug
        return result2.origin;
      } catch (error2) {
        console.error("備用 IP 抓取也失敗", error2);
        return "unknown";
      }
    }
  }
}
