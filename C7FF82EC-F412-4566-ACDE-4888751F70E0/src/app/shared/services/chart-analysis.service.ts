import { Injectable } from '@angular/core';
import { DsaService } from 'src/app/dsa.service';

// 🔥 數據分析配置介面
export interface ChartAnalysisConfig {
  title: string;
  apiEndpoint: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  filters?: {
    classIDs?: string[];
    teacherIDs?: string[];
    problemCategories?: string[];
    gender?: string;
  };
  chartTypes?: {
    bar?: boolean;
    pie?: boolean;
    line?: boolean;
    network?: boolean;
  };
}

// 🔥 數據分析結果介面
export interface ChartAnalysisResult {
  success: boolean;
  data?: any[];
  error?: string;
  metadata?: {
    totalRecords: number;
    dateRange: string;
    filters: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ChartAnalysisService {

  constructor(private dsaService: DsaService) { }

  // 🔥 通用數據分析方法
  async analyzeData(config: ChartAnalysisConfig): Promise<ChartAnalysisResult> {
    try {
      console.log('開始數據分析:', config);

      // 準備請求參數
      const requestParams = this.prepareRequestParams(config);

      // 調用API
      const response = await this.dsaService.send(config.apiEndpoint, {
        Request: requestParams
      });

      // 處理回應
      const result = this.processResponse(response, config);
      
      console.log('數據分析完成:', result);
      return result;

    } catch (error) {
      console.error('數據分析錯誤:', error);
      return {
        success: false,
        error: error.dsaError ? error.dsaError.message : '數據分析失敗'
      };
    }
  }

  // 🔥 準備請求參數
  private prepareRequestParams(config: ChartAnalysisConfig): any {
    const params: any = {};

    // 日期範圍
    if (config.dateRange) {
      params.StartDate = config.dateRange.startDate + ' 00:00:00';
      params.EndDate = config.dateRange.endDate + ' 23:59:59';
    }

    // 過濾條件
    if (config.filters) {
      if (config.filters.classIDs) {
        params.ClassIDs = config.filters.classIDs;
      }
      if (config.filters.teacherIDs) {
        params.TeacherIDs = config.filters.teacherIDs;
      }
      if (config.filters.problemCategories) {
        params.ProblemCategories = config.filters.problemCategories;
      }
      if (config.filters.gender) {
        params.Gender = config.filters.gender;
      }
    }

    return params;
  }

  // 🔥 處理API回應
  private processResponse(response: any, config: ChartAnalysisConfig): ChartAnalysisResult {
    // 提取數據（根據不同API調整）
    let data: any[] = [];
    
    if (response.CounselInterview) {
      data = [].concat(response.CounselInterview || []);
    } else if (response.Data) {
      data = [].concat(response.Data || []);
    } else {
      data = [].concat(response || []);
    }

    return {
      success: true,
      data: data,
      metadata: {
        totalRecords: data.length,
        dateRange: config.dateRange ? 
          `${config.dateRange.startDate} ~ ${config.dateRange.endDate}` : '全部時間',
        filters: config.filters
      }
    };
  }

  // 🔥 獲取預設日期範圍（近一年）
  getDefaultDateRange(): { startDate: string; endDate: string } {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    
    return {
      startDate: oneYearAgo.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    };
  }

  // 🔥 驗證數據
  validateData(data: any[]): boolean {
    return data && data.length > 0;
  }
} 