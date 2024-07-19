import { GlobalService } from 'src/app/global.service';
import { Component, OnInit } from '@angular/core';
import { forEach } from '@angular/router/src/utils/collection';
import { DsaService } from 'src/app/dsa.service';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.css']
})
export class SettingComponent implements OnInit {
  comPoGUID = "05f68313-6f9a-4382-9a01-61011d9548fb"
  settingLists: any[] = []


  constructor(private dsaService: DsaService ,
    private globalService :GlobalService  
       
  ) { }

  ngOnInit() {
    this.getSetting()
  }

  public async getSetting() {

    try {
      let resp = await this.dsaService.send("Admin.GetSetting", {});
      this.settingLists = [].concat(resp.result || []);
      console.log("respsetting", resp)
    } catch (ex) {
      alert(JSON.stringify(ex))
    }
  }

  /** 儲存 */
  async save() {
    try {
      for (const item of this.settingLists) {
        let resp = await this.dsaService.send("Admin.UpdateSetting", {
          FunctionalityCode: item.functionality_code,
          Content : item.content,
        });
        console.log("respsetting", resp);
      }
      alert("儲存成功!")
      this.getSetting()
      this.globalService.loadingSettingList() ;
      
    } catch (ex) {
      alert(JSON.stringify(ex));
    }

  }


  async onclick(item :any ,isOpen: string  ) {
      item.content = isOpen
  }

}
