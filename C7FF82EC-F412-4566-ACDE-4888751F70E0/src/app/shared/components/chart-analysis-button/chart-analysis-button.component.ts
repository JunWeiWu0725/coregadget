import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { ChartAnalysisService, ChartAnalysisConfig, ChartAnalysisResult } from '../../services/chart-analysis.service';
import { ChartModalComponent } from '../../../counsel-statistics/reports/counsel-interview-report/chart-modal/chart-modal.component';

@Component({
  selector: 'app-chart-analysis-button',
  template: `
    <button 
      type="button" 
      class="btn btn-info btn-sm" 
      (click)="openChartAnalysis()"
      [disabled]="isLoading"
      [class.btn-loading]="isLoading">
      <i class="fa fa-chart-bar mr-1" *ngIf="!isLoading"></i>
      <i class="fa fa-spinner fa-spin mr-1" *ngIf="isLoading"></i>
      {{ buttonText }}
    </button>
    
    <app-chart-modal #chartModal></app-chart-modal>
  `,
  styles: [`
    .btn-loading {
      opacity: 0.7;
      cursor: not-allowed;
    }
  `]
})
export class ChartAnalysisButtonComponent {
  @Input() config: ChartAnalysisConfig;
  @Input() buttonText: string = '數據分析';
  @Input() showLoading: boolean = true;
  
  @Output() analysisComplete = new EventEmitter<ChartAnalysisResult>();
  @Output() analysisError = new EventEmitter<string>();
  
  @ViewChild('chartModal') chartModal: ChartModalComponent;
  
  isLoading: boolean = false;

  constructor(private chartAnalysisService: ChartAnalysisService) { }

  async openChartAnalysis() {
    if (!this.config) {
      console.error('缺少數據分析配置');
      this.analysisError.emit('缺少數據分析配置');
      return;
    }

    this.isLoading = true;

    try {
      // 使用服務進行數據分析
      const result = await this.chartAnalysisService.analyzeData(this.config);

      if (result.success && result.data) {
        // 驗證數據
        if (this.chartAnalysisService.validateData(result.data)) {
          // 打開圖表模態框
          this.chartModal.open(result.data);
          
          // 發送完成事件
          this.analysisComplete.emit(result);
        } else {
          const errorMsg = '沒有可用的數據進行分析';
          alert(errorMsg);
          this.analysisError.emit(errorMsg);
        }
      } else {
        const errorMsg = result.error || '數據分析失敗';
        alert(errorMsg);
        this.analysisError.emit(errorMsg);
      }

    } catch (error) {
      console.error('數據分析錯誤:', error);
      const errorMsg = '數據分析過程中發生錯誤';
      alert(errorMsg);
      this.analysisError.emit(errorMsg);
    } finally {
      this.isLoading = false;
    }
  }
} 