import { Component, OnInit } from '@angular/core';
import { Contract, GadgetService } from 'src/app/gadget.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styles: []
})
export class MainComponent implements OnInit {
  contract: Contract;
  constructor(private gadget: GadgetService) { }

  async ngOnInit() {
    this.contract = await this.gadget.getContract('kcis');
    window.location.assign("https://legacy-web2.ischool.com.tw/deployment/F57B2E7C-EAD5-4A51-8F45-141D9BC76912/content.kcis.htm#dsns=" + this.gadget.application + "&session_id=" + this.contract.getSessionID);

  }


}
