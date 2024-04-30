
import { Component, OnInit, Optional, TemplateRef, ViewChild } from "@angular/core";
import { ActivatedRoute, Router, ParamMap } from "@angular/router";
import { DsaService } from 'src/app/dsa.service';



@Component({
  selector: 'app-counsel-doc',
  templateUrl: './counsel-doc.component.html',
  styleUrls: ['./counsel-doc.component.css']
})
export class CounselDocComponent implements OnInit {

  isLoading = false;
  studentID: string;
  printDocumentID: string;
  reportData: any;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private dsaService: DsaService,
  ) { }

  ngOnInit() {
  
    this.activatedRoute.paramMap.subscribe(
      (params: ParamMap): void => {
        this.studentID = params.get("studentID");
        this.printDocumentID = params.get("printDocumentID");
        this.getReportData();
      }
    );
  }

  async getReportData() {
    this.isLoading = true;
    try {
      this.reportData = await this.dsaService.send("GetPrintDocumentDetail", {
        StudentID: this.studentID
        , PrintDocumentID: this.printDocumentID
      });
      var template = this.reportData.Template || {};
      template.FormPage = [].concat(template.FormPage || []);

      template.FormPage.forEach(formPage => {
        formPage.FormSubject = [].concat(formPage.FormSubject || []);
        formPage.FormSubject.forEach(formSubject => {
          var subjectCount = 0;
          formSubject.FormGroup = [].concat(formSubject.FormGroup || []);
          formSubject.FormGroup.forEach(formGroup => {
            var groupCount = 0;
            formGroup.FormQuery = [].concat(formGroup.FormQuery || []);
            formGroup.FormQuery.forEach(formQuery => {
              groupCount++;
              subjectCount++;
              formQuery.FormText = [].concat(formQuery.FormText || []);
            });
            formGroup.rowCount = groupCount;
          });
          formSubject.rowCount = subjectCount;
        });
      });
    } catch (error) {
      console.log(error);
    } finally {
      this.isLoading = false;
    }
  }
}
