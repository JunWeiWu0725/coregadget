import { Component, OnInit, Optional, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap, Router, RoutesRecognized } from '@angular/router';
import { RoleService } from "../role.service";
import { CounselStudentService, CounselClass } from "../counsel-student.service";
import { AppComponent } from "../app.component";
import { timeout } from 'q';

@Component({
  selector: 'app-counsel',
  templateUrl: './counsel.component.html',
  styleUrls: ['./counsel.component.css']
})
export class CounselComponent implements OnInit {
  public selectItem: string;
  public baseVisible = false;

  // 搜尋文字
  searchText: string = '';
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    public roleService: RoleService,
    public counselStudentService: CounselStudentService,
    @Optional()
    private appComponent: AppComponent
  ) {
    if (this.appComponent) this.appComponent.currentComponent = "counsel";
  }

  ngOnInit() {
    this.baseVisible = false;
    // console.log(this.searchText);
    if (gadget.params.system_counsel_position === 'referral' || gadget.params.system_counsel_position === 'counselor' || gadget.params.system_counsel_position === 'freshman') {
      this.baseVisible = true;
    }
  }


  search() {
    //console.log(this.searchText);
    this.router.navigate(['list', 'search', this.searchText,''], {
      relativeTo: this.activatedRoute
    });
  }

  public setSelectItem(item: string) {
    if (item != '搜尋') {
      this.searchText = '';
    }
    setTimeout(() => {
      this.selectItem = item;
    });
  }
}
