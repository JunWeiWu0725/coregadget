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
        this.router.navigate(["list", "guidance", "g",'認輔老師'], {
          relativeTo: this.route,
          skipLocationChange: true
        });
      } else {
        debugger
        if (this.counselStudentService.counselClass.length > 0) {
          if (!this.globalService.selectTarget) {
            classID = this.counselStudentService.counselClass[0].ClassID;
          } else {
            classID = this.globalService.selectTarget;
          }
          this.router.navigate(["list", "class", classID,'輔導老師'], {
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
