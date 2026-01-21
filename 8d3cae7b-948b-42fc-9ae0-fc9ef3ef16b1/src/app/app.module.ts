import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material-module';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ClassSummaryComponent } from './ui/class-summary/class-summary.component';
import { HttpClientModule } from '@angular/common/http';
import { AddCadreDialogComponent } from './ui/add-cadre-dialog/add-cadre-dialog.component';


@NgModule({
  declarations: [
    AppComponent,
    ClassSummaryComponent,
    AddCadreDialogComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    MaterialModule,
    HttpClientModule,
    MatButtonToggleModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
