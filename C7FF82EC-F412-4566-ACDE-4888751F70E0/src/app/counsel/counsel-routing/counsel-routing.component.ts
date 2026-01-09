import { Component, OnInit } from "@angular/core";
import {
  CounselStudentService,
  CounselClass,
  CounselStudent
} from "../../counsel-student.service";
import { ActivatedRoute, Router, RoutesRecognized } from "@angular/router";
import { GlobalService } from "../../global.service";

@Component({
  selector: "app-counsel-routing",
  templateUrl: "./counsel-routing.component.html",
  styleUrls: ["./counsel-routing.component.css"]
})
export class CounselRoutingComponent implements OnInit {
  private isNotData: Boolean = true;
  constructor(
    private counselStudentService: CounselStudentService,
    private globalService: GlobalService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.routing();
  }

  routing() {
    // alert("selectTarget"+this.globalService.selectTarget)
    let classID = "";
    if (!this.counselStudentService.isLoading) {
      if (
        !this.globalService.selectTarget &&
        this.counselStudentService.guidanceStudent.length > 0
      ) {
        // 使用 globalService.currentRole 恢复之前的角色，如果没有则默认使用認輔老師
        const roleType = this.globalService.currentRole === '認輔老師' ? '認輔老師' : '認輔老師';
        this.router.navigate(["list", "guidance", "g", roleType], {
          relativeTo: this.route,
          skipLocationChange: true
        });
      } else {
        if (this.counselStudentService.counselClass.length > 0) {
          if (!this.globalService.selectTarget) {
            classID = this.counselStudentService.counselClass[0].ClassID;
          } else {
            classID = this.globalService.selectTarget;
          }
          // 使用 globalService.currentRole 恢复之前的角色，如果没有则默认使用班導師
          const roleType = this.globalService.currentRole && 
                          (this.globalService.currentRole === '班導師' || this.globalService.currentRole === '輔導老師')
                          ? this.globalService.currentRole 
                          : '班導師';
          this.router.navigate(["list", "class", classID, roleType], {
            relativeTo: this.route,
            skipLocationChange: true
          });
        } else {
          this.isNotData=false;
        }
      }
    } else {
      setTimeout(this.routing, 100);
    }
  }
}
