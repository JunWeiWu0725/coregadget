import { concat } from 'rxjs';
import { Injectable, NgZone } from "@angular/core";
import { DsaService } from "./dsa.service";

@Injectable({
  providedIn: "root"
})
export class ComprehensiveTemplateService {
  private connection: any;
  AccessPoint: string;
  SessionID: any;
  EnableTemplateList :any [] ;

  constructor( private dsaService: DsaService) {
    //  this.loadEnableTemplate()
  }

  getEnableTemplate(){
    return  this.EnableTemplateList ;
  }


//   async loadEnableTemplate() {
//     try{
//         // let rs = await this.send(this.dsns + "/1campus.counsel.public", "GetComprehensiveTemplateEnable");
//         let enableTemplateListRsp   = await this.dsaService.send("Share.GetComprehensiveTemplateEnable",{})
      
//         return   [].concat(enableTemplateListRsp||[])

//     } catch(ex:any ){
//             alert (JSON.stringify(ex))

//     }
//   }  

}
