import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

import { AppComponent } from './app.component';
import { GadgetService } from './gadget.service';
import { EditModalComponent } from './edit-modal/edit-modal.component';
import { PipesModule } from './shared/pipes/pipes.module';
import { DialogModule } from './shared/dialog/dialog.module';
import { BatchAddComponent } from './batch-add/batch-add.component';
import { ObjectCheckboxDirective } from './shared/object-checkbox.directive';
import { SearchBarModule } from './shared/search-bar/search-bar.module';
import { RadioButtonModule } from './shared/radio-button/radio-button.module';
import { CheckboxModule } from './shared/checkbox/checkbox.module';
import { EditParentComponent } from './edit-parent/edit-parent.component';
import { SelectAclassComponent } from './select-aclass/select-aclass.component';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { InviteLettersModalComponent } from './invite-letters-modal/invite-letters-modal.component';
import { ParentCodeModalComponent } from './parent-code-modal/parent-code-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    EditModalComponent,
    BatchAddComponent,
    ObjectCheckboxDirective,
    EditParentComponent,
    SelectAclassComponent,
    InviteLettersModalComponent,
    ParentCodeModalComponent,
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    PipesModule,
    DialogModule,
    SearchBarModule,
    RadioButtonModule,
    CheckboxModule,
    MatSelectModule,
    MatFormFieldModule,
    NgxMatSelectSearchModule,
  ],
  providers: [GadgetService],
  bootstrap: [AppComponent]
})
export class AppModule { }
