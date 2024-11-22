import { Injectable } from '@angular/core';
import { GadgetService } from './gadget.service';

@Injectable({
  providedIn: 'root'
})
export class SchoolService {

  private schoolMap = new Map<string, SchoolInfo>([
    ['h.karlschool.org', { // 卡爾高中
      title: 'Karl International Experimental Education Institution (SH)'
      , iconUrl: 'assets/img/karl_logo.png'
      , gadgets: ['gradebook', 'attendence']
    }],
    ['j.karlschool.org', { // 卡爾國中
      title: 'Karl International Experimental Education Institution (JH)'
      , iconUrl: 'assets/img/karl_logo.png'
      , gadgets: ['gradebook', 'attendence']
    }],
    ['p.lk.kcis.ntpc.edu.tw', { //康橋國際學校 林口校區 國小
      title: 'Kang Chiao International School(Linkou G1-6)'
      , iconUrl: 'assets/img/logo.png'
      // , gadgets: // 空陣列是一個都不顯示，undefined 是顯示全部。
    }],
    ['j.lk.kcis.ntpc.edu.tw', { //康橋國際學校 林口校區 國中
      title: 'Kang Chiao International School(Linkou G7-9)'
      , iconUrl: 'assets/img/logo.png'
      // , gadgets: // 空陣列是一個都不顯示，undefined 是顯示全部。
    }],
    ['h.lk.kcis.ntpc.edu.tw', { //康橋國際學校 林口校區 高中
      title: 'Kang Chiao International School(Linkou G10-12)'
      , iconUrl: 'assets/img/logo.png'
      // , gadgets: // 空陣列是一個都不顯示，undefined 是顯示全部。
    }],
    ['p.kcbs.ntpc.edu.tw', { //康橋國際學校 青山校區
      title: 'Kang Chiao International School(Qingshan)'
      , iconUrl: 'assets/img/logo.png'
      // , gadgets: // 空陣列是一個都不顯示，undefined 是顯示全部。
    }],
    ['j.kcbs.ntpc.edu.tw', { //康橋國際學校 秀岡校區 國中
      title: 'Kang Chiao International School(Xiugang G7-9)'
      , iconUrl: 'assets/img/logo.png'
      // , gadgets: // 空陣列是一個都不顯示，undefined 是顯示全部。
    }],
    ['h.kcbs.ntpc.edu.tw', { //康橋國際學校 秀岡校區 高中
      title: 'Kang Chiao International School(Xiugang G10-12)'
      , iconUrl: 'assets/img/logo.png'
      // , gadgets: // 空陣列是一個都不顯示，undefined 是顯示全部。
    }],
    ['p.kcbs.hc.edu.tw', { //康橋國際學校 新竹校區 國小
      title: 'Kang Chiao International School(Hsinchu G1-6)'
      , iconUrl: 'assets/img/logo.png'
      // , gadgets: // 空陣列是一個都不顯示，undefined 是顯示全部。
    }],
    ['j.kcbs.hc.edu.tw', { //康橋國際學校 新竹校區 國中
      title: 'Kang Chiao International School(Hsinchu G7-9)'
      , iconUrl: 'assets/img/logo.png'
      // , gadgets: // 空陣列是一個都不顯示，undefined 是顯示全部。
    }],
    ['test.p.kcbs.hc.edu.tw', { //康橋國小測試
      title: 'Kang Chiao International School(測試機)'
      , iconUrl: 'assets/img/dev_logo.png'
      // , gadgets: // 空陣列是一個都不顯示，undefined 是顯示全部。
    }],
    ['j.nehs.tc.edu.tw', { //中科實中國中部 j.nehs.tc.edu.tw 名稱：IBSC Middle
      title: 'IBSC Middle'
      , iconUrl: ''
      // , gadgets: // 空陣列是一個都不顯示，undefined 是顯示全部。
    }],
    ['h.nehs.tc.edu.tw', { //中科實中高中部 h.nehs.tc.edu.tw 名稱：IBSC High
      title: 'IBSC High'
      , iconUrl: ''
      // , gadgets: // 空陣列是一個都不顯示，undefined 是顯示全部。
    }],
    ['p.nehs.tc.edu.tw', { //中科實中國小部 p.nehs.tc.edu.tw 名稱：IBSC High
      title: 'IBSC Elementary'
      , iconUrl: ''
      // , gadgets: // 空陣列是一個都不顯示，undefined 是顯示全部。
    }],
    ['h.fiec.com.tw', { //遠見 h.fiec.com.tw 名稱：Foresight International Education Center
      title: 'Foresight International Education Center'
      , iconUrl: ''
      // , gadgets: // 空陣列是一個都不顯示，undefined 是顯示全部。
    }],
    ['p.viethoa.edu.vn', { // 越華國際學校 小學部
      title: 'Viet Hoa International School'
      , iconUrl: 'assets/img/viethoa_logo.png'
      // , gadgets: // 空陣列是一個都不顯示，undefined 是顯示全部。
    }],
    ['p.wagor.tc.edu.tw', { // 葳格國際學校 小學部-西屯校區
      title: 'Wagor International School'
      , iconUrl: 'assets/img/wagor_logo.png'
      // , gadgets: // 空陣列是一個都不顯示，undefined 是顯示全部。
    }],
    ['b.wagor.tc.edu.tw', { // 葳格國際學校 小學部-北屯校區
      title: 'Wagor International School'
      , iconUrl: 'assets/img/wagor_logo.png'
      // , gadgets: // 空陣列是一個都不顯示，undefined 是顯示全部。
    }],
    ['j.wagor.tc.edu.tw', { // 臺中市私立葳格高級中學國中部
      title: 'Wagor International School'
      , iconUrl: 'assets/img/wagor_logo.png'
      // , gadgets: // 空陣列是一個都不顯示，undefined 是顯示全部。
    }],
    ['h.demo.1campus.net', { //h.demo.1campus.net
      title: '1Campus Senior High School'
      , iconUrl: ''
      , gadgets: ['gradebook']//空陣列是一個都不顯示，undefined 是顯示全部。
    }],
    ['j.demo.1campus.net', { //j.demo.1campus.net
      title: '1Campus Junior High School'
      , iconUrl: ''
      , gadgets: ['gradebook']//空陣列是一個都不顯示，undefined 是顯示全部。
    }],
    ['b.fhjh.tp.edu.tw', { //臺北市私立復興實驗高級中學(高中雙語部)
      title: 'Taipei Fuhsing Private School'
      , iconUrl: 'assets/img/fuhsing_logo.png'
      //空陣列是一個都不顯示，undefined 是顯示全部。
    }]
  ]);

  constructor(
    private gadget: GadgetService
  ) { }

  public get info() {
    if (this.schoolMap.has(this.gadget.application)) {
      return this.schoolMap.get(this.gadget.application);
    } else {
      return { // DSNS 都找不到，會顯示這個。
        title: ''
        , iconUrl: ''
      }
    }
  }
}

export interface SchoolInfo {

  /**
   * 學校標題。
   */
  title: string;

  /**
   * 學校 Logo
   */
  iconUrl: string;

  /**
   * 要顯示的 gadget，不指定就全部顯示，空陣列是全部不顯示...
   */
  gadgets?: string[]
}