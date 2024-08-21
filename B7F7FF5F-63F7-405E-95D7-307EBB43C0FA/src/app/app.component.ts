import { Component, OnInit, NgZone, Inject, ChangeDetectorRef } from '@angular/core';

import { I18NEXT_SERVICE, ITranslationService } from 'angular-i18next';
import { Router } from '@angular/router';
import { GadgetService } from './service/gadget.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: []
})
export class AppComponent implements OnInit {

  error;
  reloading = false;
  
  constructor(
    private cdr: ChangeDetectorRef,
    private gadget: GadgetService,
    @Inject(I18NEXT_SERVICE) private i18next: ITranslationService,
  ) {
  }

  async ngOnInit() {
    
    this.i18next.events.languageChanged.subscribe(() => {
      this.reloading = true;
      this.cdr.detectChanges();
      this.reloading = false;
      this.cdr.detectChanges();
      this.cdr.markForCheck();
    });

    const language = this.gadget.getLanguage();
    console.log("gadget.getLanguage:" + language)
    if (language) {
      const lang = (language.split("-")[0] === "en" || language === "English") ? "en" : "zh-TW";
      if ( this.i18next.language !== lang) {
        this.i18next.changeLanguage(lang).then(() => {
          console.log("i18n:" + this.i18next.language);
        })
      }
    } else if ( this.i18next.language !== "zh-TW"){
      this.i18next.changeLanguage("zh-TW").then(() => {
        console.log("i18n:" + this.i18next.language);
      })
    }
  }

  setLanguage(language: string) {
    this.i18next.changeLanguage(language).then(() => {
      console.log(this.i18next.language);
    });
  }
}
