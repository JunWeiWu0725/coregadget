import { Injectable } from '@angular/core';
import { GadgetService } from './gadget.service';

@Injectable({
  providedIn: 'root'
})
export class ContractService {

  contactName = 'ischool.teacher.cadre';

  constructor(private gadget: GadgetService) { }

  public async getDefaultContract() {
    return await this.gadget.getContract(this.contactName);
  }
}
