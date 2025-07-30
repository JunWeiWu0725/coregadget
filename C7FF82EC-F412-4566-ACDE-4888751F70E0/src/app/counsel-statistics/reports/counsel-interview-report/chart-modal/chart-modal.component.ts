import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

declare var d3: any;
declare var $: any;

@Component({
  selector: 'app-chart-modal',
  templateUrl: './chart-modal.component.html',
  styleUrls: []
})
export class ChartModalComponent implements OnInit {

  @ViewChild('chartModal') chartModal: ElementRef;
  
  private currentDetailType: string = ''; // 追蹤當前顯示的明細類型 (class/teacher/month)
  private currentDetailValue: string = ''; // 追蹤當前顯示的明細值
  private rawData: any[] = []; // 原始完整資料
  private currentFilterTeacher: string = ''; // 當前篩選的老師

  // 新增：表格篩選相關屬性
  private tableFilters: Map<string, Set<string>> = new Map();
  private filteredTableData: any[] = [];
  private originalTableData: any[] = [];

  // 新增：3D 圖表相關屬性
  private is3DMode: { bar: boolean, pie: boolean } = { bar: true, pie: true };

  // 🔥 新增：樹狀圖相關屬性
  private currentTreeLayout: 'hierarchical' | 'radial' | 'force' = 'force';

  constructor() {
    // 將此組件實例暴露給全域，供 HTML onclick 使用
    (window as any).chartModalComponent = this;
  }

  ngOnInit() {
  }
  
  // 清除當前明細狀態
  private clearDetailState() {
    this.currentDetailType = '';
    this.currentDetailValue = '';
  }
  
  // 重置篩選，顯示全校資料
  public resetFilter() {
    console.log('重置篩選，顯示全校資料');
    this.currentFilterTeacher = '';
    
    // 🔥 清除表格篩選並恢復原始資料
    this.tableFilters.clear();
    this.originalTableData = [...this.rawData]; // 恢復完整原始資料
    
    this.updateFilterStatus();
    
    // 重新生成所有圖表和表格，使用完整的原始資料
    this.generateChart(this.rawData);
    this.generatePieChart(this.rawData);
    this.generateLineChart(this.rawData);
    this.generateSummaryTable(this.rawData);
    
    // 🔥 重新生成樹狀圖
    this.generateTreeChart(this.rawData);
  }
  
  // 更新篩選狀態 UI
  private updateFilterStatus() {
    console.log('=== 更新篩選狀態 ===');
    console.log('當前篩選老師:', this.currentFilterTeacher);
    
    // 添加小延遲確保 DOM 已準備好
    setTimeout(() => {
      const filterStatus = document.getElementById('filter-status');
      const filterTeacherName = document.getElementById('filter-teacher-name');
      const resetButton = document.getElementById('reset-filter-btn');
      
      console.log('DOM 元素:', {
        filterStatus: !!filterStatus,
        filterTeacherName: !!filterTeacherName,
        resetButton: !!resetButton
      });
      
      if (this.currentFilterTeacher) {
        console.log('顯示篩選狀態');
        if (filterStatus && filterTeacherName) {
          filterTeacherName.textContent = `篩選：${this.currentFilterTeacher}`;
          filterStatus.style.display = 'inline-flex';
          filterStatus.title = '點擊取消篩選';
          console.log('篩選標籤已設定為顯示');
          console.log('篩選標籤內容:', filterTeacherName.textContent);
          console.log('篩選標籤顯示狀態:', filterStatus.style.display);
        } else {
          console.error('無法找到篩選標籤 DOM 元素');
        }
        if (resetButton) {
          resetButton.style.display = 'inline-block';
        }
      } else {
        console.log('隱藏篩選狀態');
        if (filterStatus) {
          filterStatus.style.display = 'none';
        }
        if (resetButton) {
          resetButton.style.display = 'none';
        }
      }
    }, 50);
  }
  
  // 添加簡潔樣式
  private addModernStyles() {
    // 動態注入 CSS 樣式
    const existingStyle = d3.select("head").select("#chart-modal-styles");
    if (!existingStyle.empty()) {
      existingStyle.remove();
    }

    d3.select("head").append("style")
      .attr("id", "chart-modal-styles")
      .text(`
        .chart-responsive {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: #ffffff;
          transition: all 0.3s ease;
          padding: 15px; /* 🔥 增加圖表容器內邊距 */
        }
        
        .chart-responsive:hover {
          border-color: #007bff;
          box-shadow: 0 2px 8px rgba(0,123,255,0.1);
        }
        
        .table-responsive {
          border: 1px solid #dee2e6;
          border-radius: 4px;
          background: white;
          padding: 10px; /* 🔥 增加表格容器內邊距 */
        }
        
        .filter-tag {
          background: linear-gradient(135deg, #FFA500, #FF8C00) !important;
          color: white !important;
          border: none !important;
          padding: 6px 12px !important;
          border-radius: 15px !important;
          font-weight: 500 !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          display: inline-flex !important;
          align-items: center !important;
          margin: 2px !important;
        }
        
        .filter-tag:hover {
          background: linear-gradient(135deg, #FF8C00, #FF7F00) !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 8px rgba(255,140,0,0.3) !important;
        }
        
        .filter-tag i {
          margin-left: 6px !important;
          font-size: 10px !important;
          opacity: 0.8 !important;
        }
        
        .chart-tooltip {
          position: absolute;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          pointer-events: none;
          z-index: 10000;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
      `);
  }

  public open(data: any[]) {
    console.log('=== 開啟圖表模態框 ===');
    console.log('收到資料筆數:', data.length);
    
    // 儲存原始資料
    this.rawData = [...data];
    
    // 🔥 初始化表格篩選資料
    this.tableFilters.clear();
    this.originalTableData = [...data];
    this.filteredTableData = [...data];
    
    // 重置篩選狀態
    this.currentFilterTeacher = '';
    this.clearDetailState();
    
    // 先顯示模態視窗，確保容器存在
    $(this.chartModal.nativeElement).modal('show');
    
    // 建立工具提示
    this.createTooltip();
    
    // 添加樣式
    this.addModernStyles();
    
    // 更新篩選狀態顯示
    this.updateFilterStatus();

    // 等待模態框顯示後再生成圖表
    setTimeout(() => {
      this.generateChart(data);
      this.generatePieChart(data);
      this.generateLineChart(data);
      this.generateSummaryTable(data);
      this.updateFilterTags(); // 🔥 初始化篩選標籤
      
      // 🔥 生成 3D 圖表
      this.generate3DBarChart(data);
      this.generate3DPieChart(data);
      
      // 🔥 生成樹狀圖
      this.generateTreeChart(data);
    }, 300);
  }

  private createTooltip() {
    // 移除舊的 tooltip
    d3.select("body").selectAll(".chart-tooltip").remove();
    
    // 建立新的 tooltip
    d3.select("body").append("div")
      .attr("class", "chart-tooltip")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "10px")
      .style("border-radius", "5px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "9999")
      .style("opacity", 0);
  }

       private showClassDetail(className: string, mouseEvent?: any) {
   console.log('點擊的班級名稱:', className);
   console.log('原始資料:', this.rawData);
   
   // 檢查是否點擊同一個項目，如果是則關閉明細表格
   if (this.currentDetailType === 'class' && this.currentDetailValue === className) {
     console.log('點擊相同班級，關閉明細表格');
     d3.select("body").selectAll(".detail-modal").remove();
     this.currentDetailType = '';
     this.currentDetailValue = '';
     return;
   }
   
   // 篩選該班級的資料
   const classData = this.rawData.filter(item => {
     console.log('項目班級名稱:', item.ClassName, '比較目標:', className);
     return item.ClassName === className;
   });
   
   console.log('篩選後的班級資料:', classData);
   
   // 移除舊的詳細視窗
   d3.select("body").selectAll(".detail-modal").remove();
   
   // 記錄當前顯示的明細
   this.currentDetailType = 'class';
   this.currentDetailValue = className;
   
   // 計算顯示位置（響應式定位）
   const isMobile = window.innerWidth < 768;
   let modalLeft = '10%';
   let modalTop = '10%';
   let modalWidth = isMobile ? '90%' : '550px';
   let modalHeight = isMobile ? '80%' : '70vh';
   
   if (!isMobile && mouseEvent) {
     const windowWidth = window.innerWidth;
     
     // 如果點擊位置在螢幕右半邊，視窗顯示在左邊；反之顯示在右邊
     if (mouseEvent.pageX > windowWidth / 2) {
       modalLeft = '10%';
     } else {
       modalLeft = '55%';
     }
     
     modalTop = '15%';
     modalWidth = '550px';
   }
   
   // 建立詳細資料視窗（響應式設計）
   const modal = d3.select("body").append("div")
     .attr("class", "detail-modal")
     .style("position", "fixed")
     .style("top", modalTop)
     .style("left", modalLeft)
     .style("width", modalWidth)
     .style("max-height", modalHeight)
     .style("background", "#f8f9fa")
     .style("border", "1px solid #dee2e6")
     .style("border-radius", "8px")
     .style("box-shadow", "0 4px 12px rgba(0, 0, 0, 0.1)")
     .style("z-index", "10000")
     .style("overflow", "hidden")
     .style("padding", "0");

   // 內容容器
   const content = modal.append("div")
     .style("background", "#ffffff")
     .style("margin", "0")
     .style("border-radius", "8px")
     .style("padding", isMobile ? "15px" : "20px")
     .style("height", "100%")
     .style("overflow", "auto");

   // 標題
   content.append("div")
     .style("display", "flex")
     .style("justify-content", "space-between")
     .style("align-items", "center")
     .style("margin-bottom", "20px")
     .style("padding-bottom", "15px")
     .style("border-bottom", "1px solid #dee2e6")
     .html(`<h5 style="font-size: ${isMobile ? '18px' : '20px'}; margin: 0; color: #212529; font-weight: 600;">${className} 輔導紀錄明細表</h5>
            <button id="close-detail-btn" style="border:none;background:#6c757d;color:white;width:28px;height:28px;border-radius:4px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s ease;">&times;</button>`);
           
   // 為關閉按鈕添加事件處理和懸浮效果
   d3.select("#close-detail-btn")
     .on("click", () => {
       d3.select(".detail-modal").remove();
       this.clearDetailState();
     })
     .on("mouseover", function() {
       d3.select(this).style("background", "#5a6268");
     })
     .on("mouseout", function() {
       d3.select(this).style("background", "#6c757d");
     });

   // 總筆數顯示
   content.append("div")
     .style("text-align", "center")
     .style("margin-bottom", "20px")
     .html(`<span style="background:#007bff;color:white;padding:6px 12px;border-radius:4px;font-weight:500;font-size:14px;">總共 ${classData.length} 筆輔導紀錄</span>`);

   // 如果沒有資料
   if (classData.length === 0) {
     content.append("div")
       .style("text-align", "center")
       .style("color", "#666")
       .style("margin-top", "50px")
       .text("該班級沒有輔導紀錄");
     return;
   }

   // 建立完整的明細表格
   const tableContainer = content.append("div")
     .style("overflow-x", "auto")
     .style("max-height", "400px")
     .style("border", "1px solid #dee2e6")
     .style("border-radius", "4px")
     .style("background", "white");
   
   const table = tableContainer.append("table")
     .style("width", "100%")
     .style("border-collapse", "collapse")
     .style("font-size", "12px")
     .style("background", "white");
   
   // 表頭 - 使用和主要明細表格相同的欄位
   const headers = [
     '輔導紀錄ID', '座號', '學號', '姓名', 
     '學年度', '學期', '訪談日期', '訪談對象', '訪談者', 
     '訪談方式', '內容', '聯絡事項', '登錄教師'
   ];
   
   const thead = table.append("thead");
   thead.append("tr")
     .selectAll("th")
     .data(headers)
     .enter()
     .append("th")
     .style("border", "none")
     .style("border-bottom", "1px solid #dee2e6")
     .style("padding", "8px 6px")
     .style("background", "#f8f9fa")
     .style("font-weight", "600")
     .style("color", "#495057")
     .style("white-space", "nowrap")
     .style("font-size", "11px")
     .style("text-align", "center")
     .text(d => d);
   
   // 表身
   const tbody = table.append("tbody");
   
   // 按日期排序
   const sortedClassData = classData.sort((a, b) => {
     const dateA = new Date(a.OccurDate || 0);
     const dateB = new Date(b.OccurDate || 0);
     return dateB.getTime() - dateA.getTime();
   });
   
   // 格式化日期
   const formatDate = (dateStr: string) => {
     if (!dateStr) return '';
     const date = new Date(dateStr);
     return date.getFullYear() + '/' + 
            String(date.getMonth() + 1).padStart(2, '0') + '/' + 
            String(date.getDate()).padStart(2, '0');
   };
   
   // 截短文字
   const truncateText = (text: string, maxLength: number = 20) => {
     if (!text) return '';
     return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
   };
   
   // 建立表格行
   tbody.selectAll("tr")
     .data(sortedClassData)
     .enter()
     .append("tr")
     .style("background", (d, i) => i % 2 === 0 ? "#ffffff" : "#f8f9fa")
     .style("border-bottom", "1px solid #e9ecef")
     .style("transition", "all 0.2s ease")
     .on("mouseover", function() {
       d3.select(this)
         .style("background", "#e7f3ff");
     })
     .on("mouseout", function(event, d) {
       const i = sortedClassData.indexOf(d);
       d3.select(this)
         .style("background", i % 2 === 0 ? "#ffffff" : "#f8f9fa");
     })
     .selectAll("td")
     .data(d => [
       d.CounselInterviewID || '',
       d.SeatNo || '',
       d.StudentNumber || '',
       d.Name || '',
       d.SchoolYear || '',
       d.Semester || '',
       formatDate(d.OccurDate),
       d.ContactName || '',
       d.AuthorName || '',
       d.CounselType || '',
       truncateText(d.Content, 25),
       truncateText(d.ContactItem, 20),
       d.TeacherName || ''
     ])
     .enter()
     .append("td")
     .style("border", "none")
     .style("border-right", "1px solid #e9ecef")
     .style("padding", "8px 6px")
     .style("font-size", "11px")
     .style("white-space", "nowrap")
     .style("color", "#495057")
     .style("text-align", "center")
     .text(d => d)
     .attr("title", function(d, i) {
       // 為內容和聯絡事項提供完整的 tooltip
       const rowData = d3.select(this.parentNode).datum();
       if (i === 10) return rowData.Content || ''; // 內容欄位
       if (i === 11) return rowData.ContactItem || ''; // 聯絡事項欄位
       return d;
     });
 }

   private showTeacherDetail(teacherName: string, mouseEvent?: any) {
     // 檢查是否點擊同一個項目，如果是則關閉明細表格
     if (this.currentDetailType === 'teacher' && this.currentDetailValue === teacherName) {
       console.log('點擊相同老師，關閉明細表格');
       d3.select("body").selectAll(".detail-modal").remove();
       this.currentDetailType = '';
       this.currentDetailValue = '';
       return;
     }
     
     // 篩選該老師的資料
     const teacherData = this.rawData.filter(item => 
       (item.AuthorName === teacherName) || (item.TeacherName === teacherName)
     );
     
     // 移除舊的詳細視窗
     d3.select("body").selectAll(".detail-modal").remove();
     
     // 記錄當前顯示的明細
     this.currentDetailType = 'teacher';
     this.currentDetailValue = teacherName;
     
     // 計算顯示位置（在點擊位置旁邊，避免擋到圖表）
     let modalLeft = '65%';
     let modalTop = '10%';
     
     if (mouseEvent) {
       const windowWidth = window.innerWidth;
       
       // 如果點擊位置在螢幕右半邊，視窗顯示在左邊；反之顯示在右邊
       if (mouseEvent.pageX > windowWidth / 2) {
         modalLeft = '10%';
       } else {
         modalLeft = '55%';
       }
       
       // 垂直位置固定在較高的位置，避免擋到圖表
       modalTop = '15%';
     }
     
     // 建立詳細資料視窗（調整為側邊顯示）
     const modal = d3.select("body").append("div")
       .attr("class", "detail-modal")
       .style("position", "fixed")
       .style("top", modalTop)
       .style("left", modalLeft)
       .style("background", "white")
       .style("border", "2px solid #007bff")
       .style("border-radius", "8px")
       .style("box-shadow", "0 6px 12px rgba(0, 0, 0, 0.15)")
       .style("z-index", "10000")
       .style("width", "550px")
       .style("max-height", "70vh")
       .style("overflow", "auto")
       .style("padding", "15px");

     // 標題
     modal.append("div")
       .style("display", "flex")
       .style("justify-content", "space-between")
       .style("align-items", "center")
       .style("margin-bottom", "15px")
       .html(`<h5>${teacherName} 輔導紀錄明細表</h5>
              <button id="close-detail-btn-teacher" style="border:none;background:none;font-size:20px;cursor:pointer;">&times;</button>`);
              
    // 為關閉按鈕添加事件處理
    d3.select("#close-detail-btn-teacher").on("click", () => {
      d3.select(".detail-modal").remove();
      this.clearDetailState();
    });

     // 總筆數顯示
     modal.append("div")
       .style("text-align", "center")
       .style("margin-bottom", "15px")
       .html(`<span style="background:#007bff;color:white;padding:5px 10px;border-radius:15px;">總共 ${teacherData.length} 筆輔導紀錄</span>`);

     // 如果沒有資料
     if (teacherData.length === 0) {
       modal.append("div")
         .style("text-align", "center")
         .style("color", "#666")
         .style("margin-top", "50px")
         .text("該老師沒有輔導紀錄");
       return;
     }

     // 建立完整的明細表格
     const tableContainer = modal.append("div")
       .style("overflow-x", "auto")
       .style("max-height", "400px")
       .style("border", "1px solid #dee2e6")
       .style("border-radius", "4px")
       .style("background", "white");
     
     const table = tableContainer.append("table")
       .style("width", "100%")
       .style("border-collapse", "collapse")
       .style("font-size", "12px")
       .style("background", "white");
     
     // 表頭 - 使用和主要明細表格相同的欄位
     const headers = [
       '輔導紀錄ID', '班級', '座號', '學號', '姓名', 
       '學年度', '學期', '訪談日期', '訪談對象', 
       '訪談方式', '內容', '聯絡事項', '登錄教師'
     ];
     
     const thead = table.append("thead");
     thead.append("tr")
       .selectAll("th")
       .data(headers)
       .enter()
       .append("th")
       .style("border", "none")
       .style("border-bottom", "1px solid #dee2e6")
       .style("padding", "8px 6px")
       .style("background", "#f8f9fa")
       .style("font-weight", "600")
       .style("color", "#495057")
       .style("white-space", "nowrap")
       .style("font-size", "11px")
       .style("text-align", "center")
       .text(d => d);
     
     // 表身
     const tbody = table.append("tbody");
     
     // 按日期排序
     const sortedTeacherData = teacherData.sort((a, b) => {
       const dateA = new Date(a.OccurDate || 0);
       const dateB = new Date(b.OccurDate || 0);
       return dateB.getTime() - dateA.getTime();
     });
     
     // 格式化日期
     const formatDate = (dateStr: string) => {
       if (!dateStr) return '';
       const date = new Date(dateStr);
       return date.getFullYear() + '/' + 
              String(date.getMonth() + 1).padStart(2, '0') + '/' + 
              String(date.getDate()).padStart(2, '0');
     };
     
     // 截短文字
     const truncateText = (text: string, maxLength: number = 20) => {
       if (!text) return '';
       return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
     };
     
     // 建立表格行
     tbody.selectAll("tr")
       .data(sortedTeacherData)
       .enter()
       .append("tr")
       .style("background", (d, i) => i % 2 === 0 ? "#f9f9f9" : "white")
       .on("mouseover", function() {
         d3.select(this).style("background", "#e3f2fd");
       })
       .on("mouseout", function(d, i) {
         d3.select(this).style("background", i % 2 === 0 ? "#f9f9f9" : "white");
       })
       .selectAll("td")
       .data(d => [
         d.CounselInterviewID || '',
         d.ClassName || '',
         d.SeatNo || '',
         d.StudentNumber || '',
         d.Name || '',
         d.SchoolYear || '',
         d.Semester || '',
         formatDate(d.OccurDate),
         d.ContactName || '',
         d.CounselType || '',
         truncateText(d.Content, 25),
         truncateText(d.ContactItem, 20),
         d.TeacherName || ''
       ])
       .enter()
       .append("td")
       .style("border", "1px solid #ddd")
       .style("padding", "6px")
       .style("font-size", "10px")
       .style("white-space", "nowrap")
       .text(d => d)
       .attr("title", function(d, i) {
         // 為內容和聯絡事項提供完整的 tooltip
         const rowData = d3.select(this.parentNode).datum();
         if (i === 10) return rowData.Content || ''; // 內容欄位
         if (i === 11) return rowData.ContactItem || ''; // 聯絡事項欄位
         return d;
       });
   }

   private showMonthDetail(month: string, mouseEvent?: any) {
     // 檢查是否點擊同一個項目，如果是則關閉明細表格
     if (this.currentDetailType === 'month' && this.currentDetailValue === month) {
       console.log('點擊相同月份，關閉明細表格');
       d3.select("body").selectAll(".detail-modal").remove();
       this.currentDetailType = '';
       this.currentDetailValue = '';
       return;
     }
     
     // 篩選該月份的資料
     const monthData = this.rawData.filter(item => {
       if (!item.OccurDate) return false;
       const occurDate = new Date(item.OccurDate);
       const itemMonth = `${occurDate.getFullYear()}-${String(occurDate.getMonth() + 1).padStart(2, '0')}`;
       return itemMonth === month;
     });
     
     // 移除舊的詳細視窗
     d3.select("body").selectAll(".detail-modal").remove();
     
     // 記錄當前顯示的明細
     this.currentDetailType = 'month';
     this.currentDetailValue = month;
     
     // 計算顯示位置（在點擊位置旁邊，避免擋到圖表）
     let modalLeft = '65%';
     let modalTop = '10%';
     
     if (mouseEvent) {
       const windowWidth = window.innerWidth;
       
       // 如果點擊位置在螢幕右半邊，視窗顯示在左邊；反之顯示在右邊
       if (mouseEvent.pageX > windowWidth / 2) {
         modalLeft = '10%';
       } else {
         modalLeft = '55%';
       }
       
       // 垂直位置固定在較高的位置，避免擋到圖表
       modalTop = '15%';
     }
     
     // 建立詳細資料視窗（調整為側邊顯示）
     const modal = d3.select("body").append("div")
       .attr("class", "detail-modal")
       .style("position", "fixed")
       .style("top", modalTop)
       .style("left", modalLeft)
       .style("background", "white")
       .style("border", "2px solid #007bff")
       .style("border-radius", "8px")
       .style("box-shadow", "0 6px 12px rgba(0, 0, 0, 0.15)")
       .style("z-index", "10000")
       .style("width", "550px")
       .style("max-height", "70vh")
       .style("overflow", "auto")
       .style("padding", "15px");

     // 標題
     const displayMonth = month.substring(5) + '月 (' + month.substring(0, 4) + '年)';
     modal.append("div")
       .style("display", "flex")
       .style("justify-content", "space-between")
       .style("align-items", "center")
       .style("margin-bottom", "15px")
       .html(`<h5>${displayMonth} 輔導紀錄明細表</h5>
              <button id="close-detail-btn-month" style="border:none;background:none;font-size:20px;cursor:pointer;">&times;</button>`);
              
    // 為關閉按鈕添加事件處理
    d3.select("#close-detail-btn-month").on("click", () => {
      d3.select(".detail-modal").remove();
      this.clearDetailState();
    });

     // 總筆數顯示
     modal.append("div")
       .style("text-align", "center")
       .style("margin-bottom", "15px")
       .html(`<span style="background:#007bff;color:white;padding:5px 10px;border-radius:15px;">總共 ${monthData.length} 筆輔導紀錄</span>`);

     // 如果沒有資料
     if (monthData.length === 0) {
       modal.append("div")
         .style("text-align", "center")
         .style("color", "#666")
         .style("margin-top", "50px")
         .text("該月份沒有輔導紀錄");
       return;
     }

     // 建立完整的明細表格
     const tableContainer = modal.append("div")
       .style("overflow-x", "auto")
       .style("max-height", "400px")
       .style("border", "1px solid #dee2e6")
       .style("border-radius", "4px")
       .style("background", "white");
     
     const table = tableContainer.append("table")
       .style("width", "100%")
       .style("border-collapse", "collapse")
       .style("font-size", "12px")
       .style("background", "white");
     
     // 表頭 - 使用和主要明細表格相同的欄位
     const headers = [
       '輔導紀錄ID', '班級', '座號', '學號', '姓名', 
       '學年度', '學期', '訪談日期', '訪談對象', '訪談者', 
       '訪談方式', '內容', '聯絡事項', '登錄教師'
     ];
     
     const thead = table.append("thead");
     thead.append("tr")
       .selectAll("th")
       .data(headers)
       .enter()
       .append("th")
       .style("border", "none")
       .style("border-bottom", "1px solid #dee2e6")
       .style("padding", "8px 6px")
       .style("background", "#f8f9fa")
       .style("font-weight", "600")
       .style("color", "#495057")
       .style("white-space", "nowrap")
       .style("font-size", "11px")
       .style("text-align", "center")
       .text(d => d);
     
     // 表身
     const tbody = table.append("tbody");
     
     // 按日期排序
     const sortedMonthData = monthData.sort((a, b) => {
       const dateA = new Date(a.OccurDate || 0);
       const dateB = new Date(b.OccurDate || 0);
       return dateB.getTime() - dateA.getTime();
     });
     
     // 格式化日期
     const formatDate = (dateStr: string) => {
       if (!dateStr) return '';
       const date = new Date(dateStr);
       return date.getFullYear() + '/' + 
              String(date.getMonth() + 1).padStart(2, '0') + '/' + 
              String(date.getDate()).padStart(2, '0');
     };
     
     // 截短文字
     const truncateText = (text: string, maxLength: number = 20) => {
       if (!text) return '';
       return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
     };
     
     // 建立表格行
     tbody.selectAll("tr")
       .data(sortedMonthData)
       .enter()
       .append("tr")
       .style("background", (d, i) => i % 2 === 0 ? "#f9f9f9" : "white")
       .on("mouseover", function() {
         d3.select(this).style("background", "#e3f2fd");
       })
       .on("mouseout", function(d, i) {
         d3.select(this).style("background", i % 2 === 0 ? "#f9f9f9" : "white");
       })
       .selectAll("td")
       .data(d => [
         d.CounselInterviewID || '',
         d.ClassName || '',
         d.SeatNo || '',
         d.StudentNumber || '',
         d.Name || '',
         d.SchoolYear || '',
         d.Semester || '',
         formatDate(d.OccurDate),
         d.ContactName || '',
         d.AuthorName || '',
         d.CounselType || '',
         truncateText(d.Content, 25),
         truncateText(d.ContactItem, 20),
         d.TeacherName || ''
       ])
       .enter()
       .append("td")
       .style("border", "1px solid #ddd")
       .style("padding", "6px")
       .style("font-size", "10px")
       .style("white-space", "nowrap")
       .text(d => d)
       .attr("title", function(d, i) {
         // 為內容和聯絡事項提供完整的 tooltip
         const rowData = d3.select(this.parentNode).datum();
         if (i === 11) return rowData.Content || ''; // 內容欄位
         if (i === 12) return rowData.ContactItem || ''; // 聯絡事項欄位
         return d;
       });
   }

  private generateChart(rawData: any[]) {
    console.log('=== 開始生成長條圖 ===');
    console.log('圖表接收的資料:', rawData);
    
    // 驗證資料
    if (!rawData || rawData.length === 0) {
      console.log('沒有資料，顯示空狀態');
      d3.select("#chart-container-modal").html('<div style="text-align:center;padding:50px;color:#666;">沒有輔導資料</div>');
      return;
    }
    
    // 1. 整理資料 - 以班級為單位統計
    const classMap = new Map<string, number>();
    for (const item of rawData) {
      const className = item.ClassName || '未知班級';
      console.log('處理項目:', item.ClassName, '轉換為:', className);
      
      if (classMap.has(className)) {
        classMap.set(className, classMap.get(className) + 1);
      } else {
        classMap.set(className, 1);
      }
    }
    
    console.log('班級統計 Map:', classMap);
    
    // 轉換為陣列並按案件數排序
    const data = Array.from(classMap.entries())
      .map(([className, count]) => ({ className, count }))
      .sort((a, b) => b.count - a.count);
    
    console.log('班級案件數據:', data);
    
    // 檢查每個班級的詳細資訊
    data.forEach(d => {
      console.log(`班級: "${d.className}", 案件數: ${d.count}`);
    });
    
    // 找出案件數最多的班級
    const maxCount = Math.max(...data.map(d => d.count));
    console.log('最大案件數:', maxCount);

    // 2. 響應式尺寸設定
    const container = document.getElementById('chart-container-modal');
    const containerWidth = container ? container.offsetWidth : 300;
    const isMobile = window.innerWidth < 768;
    
    // 確保有合理的預設值 - 調整為 1/3 寬度
    const defaultWidth = isMobile ? 350 : 300;
    const width = containerWidth > 100 ? Math.min(containerWidth - 20, defaultWidth) : defaultWidth;
    const height = isMobile ? 250 : 280;
    const margin = { 
      top: 40, 
      right: 10, 
      bottom: isMobile ? 80 : 70, 
      left: isMobile ? 35 : 40 
    };
    
    console.log('長條圖尺寸設定:', { containerWidth, width, height, isMobile });

    // 3. 移除舊的圖表 (如果有的話)
    d3.select("#chart-container-modal").select("svg").remove();

    // 4. 建立 SVG 容器
    const svg = d3.select("#chart-container-modal")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("max-width", "100%")
      .style("height", "auto");

    // 5. 建立比例尺
    const x = d3.scaleBand()
      .range([margin.left, width - margin.right])
      .domain(data.map(d => d.className))
      .padding(0.1);

    const y = d3.scaleLinear()
      .range([height - margin.bottom, margin.top])
      .domain([0, d3.max(data, d => d.count) || 0]);

    // 6. 建立座標軸
    const xAxis = g => g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .style("font-size", isMobile ? "10px" : "12px")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", `rotate(${isMobile ? -45 : -30})`);

    const yAxis = g => g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("font-size", isMobile ? "10px" : "12px");

    svg.append("g").call(xAxis);
    svg.append("g").call(yAxis);

    // 7. 繪製長條圖
    svg.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.className))
      .attr("y", y(0)) // 從底部開始
      .attr("width", x.bandwidth())
      .attr("height", 0) // 初始高度為 0
      .attr("fill", d => d.count === maxCount ? "#FF6B6B" : "#4ECDC4")
      .style("cursor", "pointer")
      .style("transition", "all 0.2s ease")
      .on("mouseover", function(event, d) {
        d3.select(this).style("opacity", 0.8);
        
        const tooltip = d3.select(".chart-tooltip");
        tooltip.transition().duration(200).style("opacity", .9);
        tooltip.html(`<strong>${d.className}</strong><br/>案件數: ${d.count}<br/>點擊查看詳細資料`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).style("opacity", 1);
        d3.select(".chart-tooltip").transition().duration(500).style("opacity", 0);
      })
      .on("click", (event, d) => {
        console.log('點擊事件:', event);
        console.log('點擊的資料物件:', d);
        this.showClassDetail(d.className, event);
      })
      // 添加進入動畫
      .transition()
      .duration(800)
      .delay((d, i) => i * 100) // 每個長條延遲 100ms
      .ease(d3.easeBounceOut)
      .attr("y", d => y(d.count))
      .attr("height", d => y(0) - y(d.count));

    // 8. 加上數值標籤（在手機上可能縮小）
    svg.selectAll(".value-label")
      .data(data)
      .enter().append("text")
      .attr("class", "value-label")
      .attr("x", d => x(d.className) + x.bandwidth() / 2)
      .attr("y", d => y(d.count) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", isMobile ? "10px" : "12px")
      .style("fill", "#333")
      .style("opacity", 0) // 初始透明
      .text(d => d.count)
      // 添加淡入動畫
      .transition()
      .duration(600)
      .delay((d, i) => i * 100 + 400) // 在長條動畫後出現
      .ease(d3.easeQuadOut)
      .style("opacity", 1);

    // 9. 加上圖表標題
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", isMobile ? "14px" : "16px")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .text("各班級輔導案件數");

    // 10. 加上 Y 軸標籤
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left / 2)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", isMobile ? "10px" : "12px")
      .text("案件數");

    // 10. 數值標籤
    svg.selectAll(".value-label")
      .data(data)
      .enter().append("text")
      .attr("class", "value-label")
      .attr("x", d => x(d.className) + x.bandwidth() / 2)
      .attr("y", d => y(d.count) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .style("opacity", 0)
      .text(d => d.count)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100 + 500)
      .style("opacity", 1);

    // 🔥 新增：在長條圖上添加小人圖示
    if (this.is3DMode.bar) {
      this.addPeopleIcons(svg, data, x, y);
    }
  }

  private generatePieChart(rawData: any[]) {
    console.log('=== 開始生成圓餅圖 ===');
    console.log('圓餅圖接收的資料:', rawData);
    
    // 驗證資料
    if (!rawData || rawData.length === 0) {
      console.log('沒有資料，顯示空狀態');
      d3.select("#pie-chart-container-modal").html('<div style="text-align:center;padding:50px;color:#666;">沒有輔導資料</div>');
      return;
    }
    
    // 1. 整理資料 - 以老師分類
    const teacherMap = new Map<string, number>();
    for (const item of rawData) {
      // 優先使用 AuthorName（訪談者），如果沒有則使用 TeacherName（登錄教師）
      let teacherName = item.AuthorName || item.TeacherName || '未知老師';
      
      if (teacherMap.has(teacherName)) {
        teacherMap.set(teacherName, teacherMap.get(teacherName) + 1);
      } else {
        teacherMap.set(teacherName, 1);
      }
    }
    
    // 轉換為陣列並按案件數排序（取前8名，其餘歸類為「其他」）
    const sortedTeachers = Array.from(teacherMap.entries())
      .sort((a, b) => b[1] - a[1]);
    
    let data = [];
    let othersCount = 0;
    
    if (sortedTeachers.length <= 8) {
      // 如果老師數量不超過8位，全部顯示
      data = sortedTeachers.map(([teacher, count]) => ({ 
        teacher: teacher, 
        count: count 
      }));
    } else {
      // 取前7位老師，其餘歸類為「其他」
      data = sortedTeachers.slice(0, 7).map(([teacher, count]) => ({ 
        teacher: teacher, 
        count: count 
      }));
      
      othersCount = sortedTeachers.slice(7).reduce((sum, [, count]) => sum + count, 0);
      if (othersCount > 0) {
        data.push({ teacher: '其他', count: othersCount });
      }
    }
    
    console.log('圓餅圖老師資料:', data);

    // 找出案件數最多的老師
    const maxPieCount = Math.max(...data.map(d => d.count));
    console.log('圓餅圖最大案件數:', maxPieCount);

    // 2. 響應式尺寸設定
    const container = document.getElementById('pie-chart-container-modal');
    const containerWidth = container ? container.offsetWidth : 300;
    const isMobile = window.innerWidth < 768;
    
    // 確保有合理的預設值 - 調整為 1/3 寬度
    const defaultWidth = isMobile ? 350 : 300;
    const width = containerWidth > 100 ? Math.min(containerWidth - 10, defaultWidth) : defaultWidth;
    const height = isMobile ? 280 : 280;
    const margin = 15;
    const radius = Math.min(width * 0.35, height * 0.35) - margin;
    
    console.log('圓餅圖尺寸設定:', { containerWidth, width, height, radius, isMobile });

    // 3. 移除舊的圖表 (如果有的話)
    d3.select("#pie-chart-container-modal").select("svg").remove();

    // 4. 建立 SVG 容器
    const svg = d3.select("#pie-chart-container-modal")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("max-width", "100%")
      .style("height", "auto");
    
    // 圓餅圖群組（置中顯示）
    const pieGroup = svg.append("g")
      .attr("transform", `translate(${width / 2},${height / 2 - 10})`);

    // 圓餅圖標題
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", isMobile ? "12px" : "14px")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .text("老師輔導次數");

    // 5. 建立顏色比例尺 - 使用更多顏色以區分不同老師
    const colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40", "#FF6384", "#C9CBCF"];
    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.teacher))
      .range(colors);

    // 6. 建立 pie generator
    const pie = d3.pie()
      .value(d => d.count);

    // 7. 建立 arc generator
    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    const arcLabel = d3.arc()
      .innerRadius(radius * 0.6)
      .outerRadius(radius * 0.6);

    // 8. 繪製圓餅圖
    const arcs = pieGroup.selectAll('slices')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.teacher))
      .attr("stroke", "white")
      .style("stroke-width", "2px")
      .style("cursor", "pointer")
      .style("opacity", 0) // 初始透明
      .style("transform", "scale(0)") // 初始縮放為 0
      .on("click", (event, d) => {
        console.log('點擊老師:', d.data.teacher);
        this.showTeacherDetail(d.data.teacher, event);
      })
      .on("mouseover", (event, d) => {
        const tooltip = d3.select(".chart-tooltip");
        tooltip.transition().duration(200).style("opacity", .9);
        
        tooltip.html(`<strong>${d.data.teacher}</strong><br/>案件數: ${d.data.count}<br/>點擊查看明細資料`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        d3.select(".chart-tooltip").transition().duration(500).style("opacity", 0);
      });

    // 添加進入動畫
    arcs.transition()
      .duration(1000)
      .delay((d, i) => i * 150) // 每個扇形延遲 150ms
      .ease(d3.easeBackOut)
      .style("opacity", 1)
      .style("transform", "scale(1)");

    // 9. 加上標籤（如果螢幕夠大才顯示）
    if (!isMobile) {
      // 計算總數用於百分比計算
      const totalCount = data.reduce((sum, d) => sum + d.count, 0);
      
      pieGroup.selectAll('allLabels')
        .data(pie(data))
        .enter()
        .append('text')
        .text(d => {
          const percentage = Math.round((d.data.count / totalCount) * 100);
          return `${percentage}%`;
        })
        .attr("transform", d => `translate(${arcLabel.centroid(d)})`)
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "white")
        .style("font-weight", "bold")
        .style("opacity", 0) // 初始透明
        // 添加淡入動畫
        .transition()
        .duration(600)
        .delay((d, i) => i * 150 + 600) // 在扇形動畫後出現
        .ease(d3.easeQuadOut)
        .style("opacity", 1);

      // 添加案件數標籤（在百分比下方）
      pieGroup.selectAll('countLabels')
        .data(pie(data))
        .enter()
        .append('text')
        .text(d => `(${d.data.count})`)
        .attr("transform", d => {
          const centroid = arcLabel.centroid(d);
          return `translate(${centroid[0]}, ${centroid[1] + 15})`;
        })
        .style("text-anchor", "middle")
        .style("font-size", "10px")
        .style("fill", "white")
        .style("font-weight", "500")
        .style("opacity", 0) // 初始透明
        // 添加淡入動畫
        .transition()
        .duration(600)
        .delay((d, i) => i * 150 + 700) // 在百分比後出現
        .ease(d3.easeQuadOut)
        .style("opacity", 1);
    }

    // 10. 加上圖例（位置在圓餅圖下方）
    const legendX = 10;
    const legendY = height - 60;
    const legendItemWidth = isMobile ? 70 : 65;
    const legendCols = isMobile ? 2 : Math.min(data.length, 4);
    
    const legend = svg.selectAll(".legend")
      .data(data)
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => {
        const col = i % legendCols;
        const row = Math.floor(i / legendCols);
        return `translate(${legendX + col * legendItemWidth}, ${legendY + row * 15})`;
      })
      .style("cursor", "pointer")
      .style("opacity", 0) // 初始透明
      .on("click", (event, d) => {
        console.log('點擊圖例老師:', d.teacher);
        this.filterByTeacher(d.teacher);
      })
      .on("mouseover", function(event, d) {
        // 圖例懸浮效果
        d3.select(this).style("opacity", 0.8);
        
        const tooltip = d3.select(".chart-tooltip");
        tooltip.transition().duration(200).style("opacity", .9);
        
        let tooltipText;
        if (this.currentFilterTeacher === d.teacher) {
          tooltipText = `<strong>${d.teacher}</strong><br/>案件數: ${d.count}<br/>點擊取消篩選`;
        } else {
          tooltipText = `<strong>${d.teacher}</strong><br/>案件數: ${d.count}<br/>點擊篩選該老師的資料`;
        }
        
        tooltip.html(tooltipText)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      }.bind(this))
      .on("mouseout", function() {
        // 移除懸浮效果
        d3.select(this).style("opacity", 1);
        d3.select(".chart-tooltip").transition().duration(500).style("opacity", 0);
      });

    // 添加滑入動畫
    legend.transition()
      .duration(600)
      .delay((d, i) => i * 100 + 800) // 在圓餅圖動畫後出現
      .ease(d3.easeQuadOut)
      .style("opacity", 1);

    legend.append("rect")
      .attr("x", 0)
      .attr("width", 10)
      .attr("height", 10)
      .style("fill", d => {
        // 如果是目前篩選的老師，使用特殊顏色
        if (this.currentFilterTeacher === d.teacher) {
          return "#FF6B6B"; // 紅色表示目前篩選中
        }
        return color(d.teacher);
      })
      .style("stroke", d => {
        // 如果是目前篩選的老師，加上邊框
        if (this.currentFilterTeacher === d.teacher) {
          return "#FF6B6B";
        }
        return "none";
      })
      .style("stroke-width", d => {
        // 如果是目前篩選的老師，使用粗邊框
        if (this.currentFilterTeacher === d.teacher) {
          return "2px";
        }
        return "0";
      });

    legend.append("text")
      .attr("x", 14)
      .attr("y", 8)
      .style("font-size", "9px")
      .style("fill", d => {
        // 如果是目前篩選的老師，使用特殊顏色
        if (this.currentFilterTeacher === d.teacher) {
          return "#FF6B6B";
        }
        return "#333";
      })
      .style("font-weight", d => {
        // 如果是目前篩選的老師，使用粗體
        if (this.currentFilterTeacher === d.teacher) {
          return "bold";
        }
        return "normal";
      })
      .text(d => {
        const totalCount = data.reduce((sum, item) => sum + item.count, 0);
        const percentage = Math.round((d.count / totalCount) * 100);
        // 縮短文字以適應窄幅
        const shortName = d.teacher.length > 3 ? d.teacher.substring(0, 3) + '..' : d.teacher;
        return `${shortName} ${percentage}%`;
      });
  }

  private generateLineChart(rawData: any[]) {
    console.log('=== 開始生成折線圖 ===');
    console.log('折線圖接收的資料:', rawData);
    
    // 驗證資料
    if (!rawData || rawData.length === 0) {
      console.log('沒有資料，顯示空狀態');
      d3.select("#line-chart-container-modal").html('<div style="text-align:center;padding:50px;color:#666;">沒有輔導資料</div>');
      return;
    }
    
    // 1. 整理資料 - 按月份和老師統計案件數
    const teacherMonthlyData = new Map<string, Map<string, number>>();
    const totalMonthlyData = new Map<string, number>();
    
    // 初始化近12個月的資料
    const now = new Date();
    const monthKeys = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthKeys.push(monthKey);
      totalMonthlyData.set(monthKey, 0);
    }
    
    // 統計每個老師每月的案件數
    for (const item of rawData) {
      if (item.OccurDate) {
        const occurDate = new Date(item.OccurDate);
        const monthKey = `${occurDate.getFullYear()}-${String(occurDate.getMonth() + 1).padStart(2, '0')}`;
        const teacherName = item.AuthorName || item.TeacherName || '未知老師';
        
        if (monthKeys.includes(monthKey)) {
          // 初始化老師數據
          if (!teacherMonthlyData.has(teacherName)) {
            const teacherData = new Map<string, number>();
            monthKeys.forEach(key => teacherData.set(key, 0));
            teacherMonthlyData.set(teacherName, teacherData);
          }
          
          // 累加數據
          teacherMonthlyData.get(teacherName).set(monthKey, 
            teacherMonthlyData.get(teacherName).get(monthKey) + 1);
          totalMonthlyData.set(monthKey, totalMonthlyData.get(monthKey) + 1);
        }
      }
    }
    
    // 轉換為陣列格式
    const totalData = Array.from(totalMonthlyData.entries()).map(([month, count]) => ({
      month: month,
      count: count,
      displayMonth: month.substring(5) + '月'
    }));
    
    const teachersData = Array.from(teacherMonthlyData.entries()).map(([teacher, monthData]) => ({
      teacher: teacher,
      data: Array.from(monthData.entries()).map(([month, count]) => ({
        month: month,
        count: count,
        displayMonth: month.substring(5) + '月'
      }))
    }));

    console.log('折線圖總計資料:', totalData);
    console.log('折線圖各老師資料:', teachersData);

    // 2. 響應式尺寸設定
    const container = document.getElementById('line-chart-container-modal');
    const containerWidth = container ? container.offsetWidth : 300;
    const isMobile = window.innerWidth < 768;
    
    const defaultWidth = isMobile ? 350 : 300;
    const width = containerWidth > 100 ? Math.min(containerWidth - 20, defaultWidth) : defaultWidth;
    const height = isMobile ? 300 : 280; // 縮小高度
    const margin = { 
      top: 60, 
      right: isMobile ? 10 : 80, // 縮小右邊距
      bottom: isMobile ? 60 : 40, 
      left: isMobile ? 35 : 40 
    };
    
    console.log('折線圖尺寸設定:', { containerWidth, width, height, isMobile });

    // 3. 移除舊的圖表
    d3.select("#line-chart-container-modal").select("svg").remove();

    // 4. 建立 SVG 容器
    const svg = d3.select("#line-chart-container-modal")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("max-width", "100%")
      .style("height", "auto");

    // 5. 建立顏色比例尺
    const colors = ["#69b3a2", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"];
    const colorScale = d3.scaleOrdinal()
      .domain([...teachersData.map(d => d.teacher), "總計"])
      .range(colors);

    // 6. 計算最大值
    const allCounts = [
      ...totalData.map(d => d.count),
      ...teachersData.reduce((acc, teacher) => acc.concat(teacher.data.map(d => d.count)), [])
    ];
    const maxCount = d3.max(allCounts) || 0;

    // 7. 建立比例尺
    const x = d3.scalePoint()
      .range([margin.left, width - margin.right])
      .domain(monthKeys);

    const y = d3.scaleLinear()
      .range([height - margin.bottom, margin.top])
      .domain([0, maxCount]);

    // 8. 建立座標軸
    const xAxis = g => g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat((d, i) => totalData[i].displayMonth))
      .selectAll("text")
      .style("font-size", isMobile ? "9px" : "11px")
      .style("text-anchor", isMobile ? "end" : "middle")
      .attr("transform", isMobile ? "rotate(-45)" : "rotate(0)")
      .attr("dx", isMobile ? "-.5em" : "0")
      .attr("dy", isMobile ? ".15em" : ".71em");

    const yAxis = g => g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("font-size", isMobile ? "10px" : "12px");

    svg.append("g").call(xAxis);
    svg.append("g").call(yAxis);

    // 9. 建立線條產生器
    const line = d3.line()
      .x(d => x(d.month))
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX);

    // 10. 添加控制選項
    const controlGroup = svg.append("g")
      .attr("transform", `translate(${margin.left}, 20)`);

    // 總計線條勾選框
    const totalCheckbox = controlGroup.append("g")
      .attr("class", "total-control")
      .style("cursor", "pointer");

    totalCheckbox.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", "white")
      .attr("stroke", "#69b3a2")
      .attr("stroke-width", 2);

    totalCheckbox.append("text")
      .attr("x", 18)
      .attr("y", 9)
      .style("font-size", "12px")
      .style("fill", "#333")
      .text("顯示總計");

    // 勾選狀態
    let showTotal = true;
    const checkMark = totalCheckbox.append("text")
      .attr("x", 6)
      .attr("y", 9)
      .style("font-size", "10px")
      .style("fill", "#69b3a2")
      .style("text-anchor", "middle")
      .text("✓");

    // 11. 繪製各老師線條
    teachersData.forEach((teacher, index) => {
      const teacherGroup = svg.append("g")
        .attr("class", `teacher-line-${index}`);

      // 繪製線條
      const path = teacherGroup.append("path")
        .datum(teacher.data)
        .attr("fill", "none")
        .attr("stroke", colorScale(teacher.teacher))
        .attr("stroke-width", isMobile ? 2 : 2.5)
        .attr("stroke-dasharray", "5,5") // 虛線區分
        .attr("d", line);

      // 線條動畫
      const totalLength = path.node().getTotalLength();
      path.attr("stroke-dasharray", totalLength + " " + totalLength)
          .attr("stroke-dashoffset", totalLength)
          .transition()
          .duration(1500)
          .delay(index * 200)
          .ease(d3.easeLinear)
          .attr("stroke-dasharray", "5,5")
          .attr("stroke-dashoffset", 0);

      // 繪製資料點
      teacherGroup.selectAll(".teacher-dot")
        .data(teacher.data)
        .enter().append("circle")
        .attr("class", "teacher-dot")
        .attr("cx", d => x(d.month))
        .attr("cy", d => y(d.count))
        .attr("r", 0)
        .attr("fill", colorScale(teacher.teacher))
        .style("cursor", "pointer")
        .style("transition", "all 0.2s ease")
        .on("mouseover", function(event, d) {
          d3.select(this).style("opacity", 0.7);
          
          const tooltip = d3.select(".chart-tooltip");
          tooltip.transition().duration(200).style("opacity", .9);
          tooltip.html(`<strong>${teacher.teacher}</strong><br/>${d.displayMonth}: ${d.count} 案件<br/>點擊查看詳細資料`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
          d3.select(this).style("opacity", 1);
          d3.select(".chart-tooltip").transition().duration(500).style("opacity", 0);
        })
        .on("click", (event, d) => {
          this.showMonthDetail(d.month, event);
        })
        .transition()
        .duration(600)
        .delay(index * 200 + 800)
        .ease(d3.easeBounceOut)
        .attr("r", isMobile ? 3 : 4);
    });

    // 12. 繪製總計線條
    const totalGroup = svg.append("g")
      .attr("class", "total-line");

    const totalPath = totalGroup.append("path")
      .datum(totalData)
      .attr("fill", "none")
      .attr("stroke", colorScale("總計"))
      .attr("stroke-width", isMobile ? 3 : 4)
      .attr("d", line);

    // 總計線條動畫
    const totalPathLength = totalPath.node().getTotalLength();
    totalPath.attr("stroke-dasharray", totalPathLength + " " + totalPathLength)
        .attr("stroke-dashoffset", totalPathLength)
        .transition()
        .duration(1500)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);

    // 總計資料點
    totalGroup.selectAll(".total-dot")
      .data(totalData)
      .enter().append("circle")
      .attr("class", "total-dot")
      .attr("cx", d => x(d.month))
      .attr("cy", d => y(d.count))
      .attr("r", 0)
      .attr("fill", colorScale("總計"))
      .style("cursor", "pointer")
      .style("transition", "all 0.2s ease")
      .on("mouseover", function(event, d) {
        d3.select(this).style("opacity", 0.7);
        
        const tooltip = d3.select(".chart-tooltip");
        tooltip.transition().duration(200).style("opacity", .9);
        tooltip.html(`<strong>總計</strong><br/>${d.displayMonth}: ${d.count} 案件<br/>點擊查看詳細資料`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).style("opacity", 1);
        d3.select(".chart-tooltip").transition().duration(500).style("opacity", 0);
      })
      .on("click", (event, d) => {
        this.showMonthDetail(d.month, event);
      })
      .transition()
      .duration(600)
      .delay(800)
      .ease(d3.easeBounceOut)
      .attr("r", isMobile ? 4 : 5);

    // 13. 勾選框控制功能
    totalCheckbox.on("click", function() {
      showTotal = !showTotal;
      
      if (showTotal) {
        checkMark.style("opacity", 1);
        totalGroup.style("opacity", 1);
      } else {
        checkMark.style("opacity", 0);
        totalGroup.style("opacity", 0);
      }
    });

    // 14. 圖例
    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right + 5}, ${margin.top})`);

    const legendData = [...teachersData.map(d => d.teacher), "總計"];
    
    legend.selectAll(".legend-item")
      .data(legendData)
      .enter().append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 15})`)
      .each(function(d, i) {
        const item = d3.select(this);
        
        // 線條樣式
        item.append("line")
          .attr("x1", 0)
          .attr("x2", 10)
          .attr("y1", 6)
          .attr("y2", 6)
          .attr("stroke", colorScale(d))
          .attr("stroke-width", 1.5)
          .attr("stroke-dasharray", d === "總計" ? "none" : "3,3");
        
        // 圓點
        item.append("circle")
          .attr("cx", 5)
          .attr("cy", 6)
          .attr("r", 2)
          .attr("fill", colorScale(d));
        
        // 文字 - 縮短名稱
        const shortName = d === "總計" ? "總計" : (d.length > 3 ? d.substring(0, 3) + '..' : d);
        item.append("text")
          .attr("x", 14)
          .attr("y", 6)
          .attr("dy", "0.35em")
          .style("font-size", "8px")
          .style("fill", "#333")
          .text(shortName);
      });

    // 15. 圖表標題
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", isMobile ? "13px" : "16px")
      .style("font-weight", "bold")
      .text("每月輔導案件數趨勢（近一年）");

    // 16. Y 軸標籤
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left / 2)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", isMobile ? "10px" : "12px")
      .text("案件數");
  }

  private generateSummaryTable(rawData: any[]) {
    try {
      console.log('產生帶篩選功能的明細表格，資料筆數:', rawData.length);
      
      // 保存原始資料
      this.originalTableData = [...rawData];
      this.filteredTableData = [...rawData];
      
      // 移除舊的表格
      d3.select("#summary-table-container-modal").selectAll("*").remove();

      // 建立表格容器
      const container = d3.select("#summary-table-container-modal");
      
      // 如果沒有資料，直接返回
      if (rawData.length === 0) {
        container.append("div")
          .attr("class", "text-center text-muted")
          .text("無輔導紀錄資料");
        return;
      }

      // 定義欄位和標題
      const columns = [
        { key: 'ClassName', title: '班級', width: '80px' },
        { key: 'Name', title: '學生姓名', width: '100px' },
        { key: 'OccurDate', title: '訪談日期', width: '100px' },
        { key: 'AuthorName', title: '訪談者', width: '80px' },
        { key: 'StudentID', title: '學號', width: '100px' },
        { key: 'Gender', title: '性別', width: '60px' },
        { key: 'CounselType', title: '輔導類型', width: '90px' },
        { key: 'InterviewType', title: '訪談類型', width: '90px' },
        { key: 'Reason', title: '原因', width: '120px' },
        { key: 'Content', title: '內容', width: '150px' },
        { key: 'Result', title: '結果', width: '120px' },
        { key: 'FollowUp', title: '後續', width: '100px' },
        { key: 'Remark', title: '備註', width: '120px' }
      ];

      // 統計總筆數和篩選後筆數
      const statsDiv = container.append("div")
        .attr("class", "d-flex justify-content-between align-items-center mb-3");
      
      const totalInfo = statsDiv.append("div")
        .attr("id", "table-stats")
        .html(`<span class="badge badge-primary">總共 ${rawData.length} 筆輔導紀錄</span>`);

      // 清除篩選按鈕
      const clearFiltersBtn = statsDiv.append("button")
        .attr("class", "btn btn-sm btn-outline-secondary")
        .attr("id", "clear-table-filters")
        .style("display", "none")
        .html('<i class="fa fa-times"></i> 清除篩選')
        .on("click", () => this.clearTableFilters());

      // 🔥 新增：篩選項目顯示區域
      const filterTagsContainer = container.append("div")
        .attr("id", "filter-tags-container")
        .attr("class", "mb-3")
        .style("min-height", "0px")
        .style("display", "none")
        .style("margin-top", "30px"); // 🔥 增加更多上方間距

      const filterTagsTitle = filterTagsContainer.append("div")
        .style("font-size", "12px")
        .style("color", "#666")
        .style("margin-bottom", "10px") // 🔥 增加標題與標籤的間距
        .text("目前篩選條件：");

      const filterTagsWrapper = filterTagsContainer.append("div")
        .attr("id", "filter-tags-wrapper")
        .style("display", "flex")
        .style("flex-wrap", "wrap")
        .style("gap", "8px") // 🔥 增加標籤之間的間距
        .style("padding", "10px 0"); // 🔥 增加上下內距

      // 建立可滾動的表格容器
      const tableContainer = container.append("div")
        .style("overflow", "auto")
        .style("max-height", "400px")
        .style("border", "1px solid #dee2e6")
        .style("border-radius", "4px")
        .style("background", "white");

      // 建立表格
      const table = tableContainer.append("table")
        .attr("class", "table table-sm mb-0")
        .style("width", "100%");

      // 建立表頭
      const thead = table.append("thead")
        .style("position", "sticky")
        .style("top", "0")
        .style("background", "#f8f9fa")
        .style("z-index", "10");

      const headerRow = thead.append("tr");

      // 為每個欄位建立表頭（含篩選下拉選單）
      columns.forEach(column => {
        const th = headerRow.append("th")
          .style("border-bottom", "1px solid #dee2e6")
          .style("padding", "8px 6px")
          .style("background", "#f8f9fa")
          .style("font-weight", "600")
          .style("color", "#495057")
          .style("white-space", "nowrap")
          .style("font-size", "11px")
          .style("text-align", "center")
          .style("width", column.width)
          .style("position", "relative");

        // 標題容器
        const headerContainer = th.append("div")
          .style("display", "flex")
          .style("align-items", "center")
          .style("justify-content", "space-between");

        // 欄位標題
        headerContainer.append("span")
          .text(column.title)
          .style("font-size", "11px");

        // 篩選按鈕
        const filterBtn = headerContainer.append("div")
          .style("margin-left", "5px")
          .style("cursor", "pointer")
          .style("width", "16px")
          .style("height", "16px")
          .style("display", "flex")
          .style("align-items", "center")
          .style("justify-content", "center")
          .style("border", "1px solid #ccc")
          .style("border-radius", "3px")
          .style("background", "white")
          .style("font-size", "8px")
          .html("▼")
          .on("click", (event) => {
            event.stopPropagation();
            this.showColumnFilter(column.key, column.title, event.target);
          });

        // 如果該欄位有篩選，顯示篩選狀態
        if (this.tableFilters.has(column.key) && this.tableFilters.get(column.key).size > 0) {
          filterBtn.style("background", "#007bff").style("color", "white");
        }
      });

      // 建立表身
      const tbody = table.append("tbody")
        .attr("id", "table-body");

      // 渲染表格內容
      this.renderTableBody(tbody, columns);

    } catch (error) {
      console.error('產生明細表格時發生錯誤:', error);
      d3.select("#summary-table-container-modal")
        .html('<div class="text-center text-danger">明細表格產生失敗</div>');
    }
  }

  private renderTableBody(tbody: any, columns: any[]) {
    // 清除舊內容
    tbody.selectAll("*").remove();

    // 應用篩選
    this.applyTableFilters();

    console.log('渲染表格，篩選後資料筆數:', this.filteredTableData.length);

    // 更新統計資訊
    const isFiltered = this.tableFilters.size > 0 && Array.from(this.tableFilters.values()).some(set => set.size > 0);
    const statsText = isFiltered 
      ? `<span class="badge badge-primary">顯示 ${this.filteredTableData.length} / ${this.originalTableData.length} 筆</span>`
      : `<span class="badge badge-primary">總共 ${this.filteredTableData.length} 筆輔導紀錄</span>`;
    
    d3.select("#table-stats").html(statsText);
    
    // 顯示/隱藏清除篩選按鈕
    d3.select("#clear-table-filters").style("display", isFiltered ? "inline-block" : "none");

    // 🔥 更新篩選標籤顯示
    this.updateFilterTags();

    // 🔥 新增：表格篩選時同步更新所有圖表
    if (isFiltered) {
      console.log('表格有篩選，同步更新所有圖表');
      this.generateChart(this.filteredTableData);
      this.generatePieChart(this.filteredTableData);
      this.generateLineChart(this.filteredTableData);
      this.generateTreeChart(this.filteredTableData);
    } else {
      console.log('表格無篩選，使用原始資料更新圖表');
      // 如果沒有表格篩選，但有老師篩選，使用老師篩選的資料
      const chartData = this.currentFilterTeacher ? 
        this.rawData.filter(item => 
          (item.AuthorName === this.currentFilterTeacher) || (item.TeacherName === this.currentFilterTeacher)
        ) : this.rawData;
      
      this.generateChart(chartData);
      this.generatePieChart(chartData);
      this.generateLineChart(chartData);
      this.generateTreeChart(chartData);
    }

    // 建立表格行
    const rows = tbody.selectAll("tr")
      .data(this.filteredTableData)
      .enter()
      .append("tr")
      .style("background", (d, i) => i % 2 === 0 ? "#ffffff" : "#f8f9fa")
      .style("border-bottom", "1px solid #e9ecef")
      .style("transition", "all 0.2s ease")
      .on("mouseover", function() { 
        d3.select(this).style("background", "#e7f3ff"); 
      })
      .on("mouseout", function(event, d) {
        const i = this.filteredTableData.indexOf(d);
        d3.select(this).style("background", i % 2 === 0 ? "#ffffff" : "#f8f9fa");
      }.bind(this));

    // 建立表格儲存格
    rows.selectAll("td")
      .data(d => columns.map(column => this.getColumnValue(d, column.key)))
      .enter()
      .append("td")
      .style("border", "none")
      .style("border-right", "1px solid #e9ecef")
      .style("padding", "8px 6px")
      .style("font-size", "11px")
      .style("white-space", "nowrap")
      .style("color", "#495057")
      .style("text-align", "center")
      .style("max-width", "150px")
      .style("overflow", "hidden")
      .style("text-overflow", "ellipsis")
      .text(d => d)
      .attr("title", d => d); // 工具提示顯示完整內容
  }

  private getColumnValue(data: any, key: string): string {
    switch (key) {
      case 'OccurDate':
        return data.OccurDate ? new Date(data.OccurDate).toLocaleDateString() : '';
      case 'AuthorName':
        return data.AuthorName || data.TeacherName || '';
      case 'Gender':
        return data.Gender === '1' ? '男' : data.Gender === '2' ? '女' : data.Gender || '';
      default:
        return data[key] || '';
    }
  }

  private showColumnFilter(columnKey: string, columnTitle: string, buttonElement: any) {
    console.log('顯示欄位篩選:', columnKey, columnTitle);

    // 移除現有的篩選下拉選單
    d3.selectAll(".column-filter-dropdown").remove();

    // 取得該欄位的所有唯一值
    const uniqueValues = new Set<string>();
    this.originalTableData.forEach(row => {
      const value = this.getColumnValue(row, columnKey);
      if (value && value.trim() !== '') {
        uniqueValues.add(value);
      }
    });

    const sortedValues = Array.from(uniqueValues).sort();
    
    if (sortedValues.length === 0) {
      return;
    }

    // 取得按鈕位置
    const buttonRect = buttonElement.getBoundingClientRect();
    
    // 建立下拉選單
    const dropdown = d3.select("body")
      .append("div")
      .attr("class", "column-filter-dropdown")
      .style("position", "fixed")
      .style("top", (buttonRect.bottom + 5) + "px")
      .style("left", buttonRect.left + "px")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("box-shadow", "0 2px 10px rgba(0,0,0,0.1)")
      .style("z-index", "10001")
      .style("max-height", "200px")
      .style("overflow-y", "auto")
      .style("min-width", "150px");

    // 全選/取消全選
    const currentFilters = this.tableFilters.get(columnKey) || new Set();
    // 🔥 修正全選邏輯：沒有篩選條件 = 全選，有空集合 = 全不選，有部分選擇 = 部分選
    const isNoFilter = !this.tableFilters.has(columnKey); // 沒有篩選條件
    const isEmptyFilter = this.tableFilters.has(columnKey) && currentFilters.size === 0; // 空集合
    const isFullSelection = currentFilters.size === sortedValues.length; // 選中所有項目
    
    // 全選狀態：沒有篩選條件 OR 選中了所有項目
    const allSelected = isNoFilter || isFullSelection;
    
    console.log(`${columnKey} 篩選狀態:`, {
      isNoFilter,
      isEmptyFilter, 
      isFullSelection,
      allSelected,
      currentFiltersSize: currentFilters.size,
      totalValues: sortedValues.length
    });

    const selectAllContainer = dropdown.append("div")
      .style("padding", "8px")
      .style("border-bottom", "1px solid #eee")
      .style("background", "#f8f9fa");

    const selectAllCheckbox = selectAllContainer.append("label")
      .style("margin", "0")
      .style("cursor", "pointer")
      .style("font-size", "12px")
      .style("display", "flex")
      .style("align-items", "center");

    const selectAllInput = selectAllCheckbox.append("input")
      .attr("type", "checkbox")
      .attr("id", `select-all-${columnKey}`)
      .property("checked", allSelected)
      .style("margin-right", "5px")
      .on("change", (event) => {
        console.log('🔥 全選 checkbox change 事件觸發!');
        event.stopPropagation();
        
        const isChecked = event.target.checked;
        console.log(`全選切換 ${columnKey}:`, isChecked ? '全選' : '取消全選');
        console.log('點擊前狀態:', {
          hasFilter: this.tableFilters.has(columnKey),
          filterSize: this.tableFilters.has(columnKey) ? this.tableFilters.get(columnKey).size : 'N/A'
        });
        
        if (isChecked) {
          // 🔥 全選：移除該欄位的篩選條件（表示不篩選，顯示全部）
          this.tableFilters.delete(columnKey);
          console.log(`${columnKey} 設為全選（移除篩選）`);
        } else {
          // 🔥 取消全選：設為空集合（表示沒有選中任何項目，隱藏全部）
          this.tableFilters.set(columnKey, new Set());
          console.log(`${columnKey} 設為取消全選（空集合）`);
        }
        
        console.log('點擊後狀態:', {
          hasFilter: this.tableFilters.has(columnKey),
          filterSize: this.tableFilters.has(columnKey) ? this.tableFilters.get(columnKey).size : 'N/A'
        });
        
        this.updateFilterUI();
        this.renderTableBody(d3.select("#table-body"), this.getColumns());
        d3.selectAll(".column-filter-dropdown").remove();
      })
      .on("click", (event) => {
        console.log('🔥 全選 checkbox click 事件觸發!');
        event.stopPropagation();
      });

    // 🔥 添加整個 label 的點擊事件作為備用
    selectAllCheckbox.on("click", (event) => {
      console.log('🔥 全選 label click 事件觸發!');
      
      // 防止重複觸發
      if (event.target.tagName === 'INPUT') {
        return;
      }
      
      event.stopPropagation();
      
      // 手動切換 checkbox 狀態
      const checkbox = selectAllInput.node();
      checkbox.checked = !checkbox.checked;
      
      // 手動觸發 change 事件
      const changeEvent = new Event('change', { bubbles: true });
      checkbox.dispatchEvent(changeEvent);
    });

    selectAllCheckbox.append("span").text("全選");

    // 個別選項
    sortedValues.forEach(value => {
      // 🔥 修正個別選項勾選邏輯：
      // - 沒有篩選條件 = 全選狀態 = 全部勾選
      // - 有空集合 = 全不選狀態 = 全部不勾選  
      // - 有部分選擇 = 只勾選包含在集合中的項目
      let isChecked;
      if (isNoFilter) {
        // 沒有篩選條件，全部勾選
        isChecked = true;
      } else if (isEmptyFilter) {
        // 空集合，全部不勾選
        isChecked = false;
      } else {
        // 部分選擇，檢查是否在篩選集合中
        isChecked = currentFilters.has(value);
      }
      
      const option = dropdown.append("div")
        .style("padding", "6px 8px")
        .style("cursor", "pointer")
        .style("font-size", "12px")
        .style("border-bottom", "1px solid #f0f0f0")
        .on("mouseover", function() {
          d3.select(this).style("background", "#f0f0f0");
        })
        .on("mouseout", function() {
          d3.select(this).style("background", "white");
        });

      const label = option.append("label")
        .style("margin", "0")
        .style("cursor", "pointer")
        .style("display", "flex")
        .style("align-items", "center")
        .style("width", "100%");

      const checkbox = label.append("input")
        .attr("type", "checkbox")
        .attr("id", `filter-${columnKey}-${value.replace(/\s+/g, '-')}`)
        .property("checked", isChecked)
        .style("margin-right", "5px")
        .on("change", (event) => {
          console.log(`🔥 個別選項 ${value} change 事件觸發!`);
          event.stopPropagation();
          this.toggleFilterValue(columnKey, value, event.target.checked);
        })
        .on("click", (event) => {
          console.log(`🔥 個別選項 ${value} click 事件觸發!`);
          event.stopPropagation();
        });

      // 🔥 添加整個 label 的點擊事件作為備用
      label.on("click", (event) => {
        console.log(`🔥 個別選項 label ${value} click 事件觸發!`);
        
        // 防止重複觸發
        if (event.target.tagName === 'INPUT') {
          return;
        }
        
        event.stopPropagation();
        
        // 手動切換 checkbox 狀態
        const checkboxNode = checkbox.node();
        checkboxNode.checked = !checkboxNode.checked;
        
        // 手動觸發 change 事件
        const changeEvent = new Event('change', { bubbles: true });
        checkboxNode.dispatchEvent(changeEvent);
      });

      label.append("span")
        .text(value)
        .style("flex", "1")
        .style("overflow", "hidden")
        .style("text-overflow", "ellipsis")
        .style("white-space", "nowrap");
    });

    // 🔥 添加測試按鈕來驗證事件系統
    const testContainer = dropdown.append("div")
      .style("padding", "8px")
      .style("border-top", "1px solid #eee")
      .style("background", "#f0f0f0");

    testContainer.append("button")
      .attr("type", "button")
      .style("width", "100%")
      .style("padding", "4px 8px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "3px")
      .style("background", "#fff")
      .style("cursor", "pointer")
      .style("font-size", "11px")
      .text("🔧 測試事件系統")
      .on("click", (event) => {
        event.stopPropagation();
        console.log('🔥 測試按鈕點擊成功！事件系統正常');
        alert(`事件系統正常！\n欄位: ${columnKey}\n可用值: ${sortedValues.length} 個`);
      });

    // 點擊其他地方關閉下拉選單
    setTimeout(() => {
      d3.select("body").on("click.column-filter", () => {
        d3.selectAll(".column-filter-dropdown").remove();
        d3.select("body").on("click.column-filter", null);
      });
    }, 100);
  }

  private toggleFilterValue(columnKey: string, value: string, isChecked: boolean) {
    console.log(`切換篩選值 ${columnKey} - ${value}:`, isChecked ? '勾選' : '取消勾選');
    
    // 取得該欄位所有可能的值
    const allValues = new Set<string>();
    this.originalTableData.forEach(row => {
      const cellValue = this.getColumnValue(row, columnKey);
      if (cellValue && cellValue.trim() !== '') {
        allValues.add(cellValue);
      }
    });
    
    // 🔥 重新評估目前狀態
    const hasFilter = this.tableFilters.has(columnKey);
    const currentFilters = this.tableFilters.get(columnKey) || new Set();
    const isNoFilter = !hasFilter;
    const isEmptyFilter = hasFilter && currentFilters.size === 0;
    const isPartialFilter = hasFilter && currentFilters.size > 0;
    
    console.log('切換前狀態:', {
      isNoFilter,
      isEmptyFilter, 
      isPartialFilter,
      currentFiltersSize: currentFilters.size,
      totalValues: allValues.size
    });
    
    // 🔥 根據目前狀態處理切換邏輯
    if (isNoFilter) {
      // 目前是無篩選狀態（全選）
      if (!isChecked) {
        // 取消勾選某個項目：創建包含其他所有項目的篩選集合
        const newFilterSet = new Set(allValues);
        newFilterSet.delete(value);
        this.tableFilters.set(columnKey, newFilterSet);
        console.log(`從全選狀態取消勾選 ${value}，新篩選集合:`, Array.from(newFilterSet));
      }
      // 勾選時保持全選狀態（不做任何事）
    } else if (isEmptyFilter) {
      // 目前是空篩選狀態（全不選）
      if (isChecked) {
        // 勾選某個項目：創建包含該項目的篩選集合
        this.tableFilters.set(columnKey, new Set([value]));
        console.log(`從全不選狀態勾選 ${value}`);
      }
      // 取消勾選時保持全不選狀態（不做任何事）
    } else {
      // 目前是部分篩選狀態
      const filterSet = this.tableFilters.get(columnKey);
      
      if (isChecked) {
        filterSet.add(value);
        console.log(`勾選 ${value}，篩選集合大小:`, filterSet.size);
        
        // 🔥 檢查是否選中了所有項目，如果是則轉為全選狀態（移除篩選）
        if (filterSet.size === allValues.size) {
          this.tableFilters.delete(columnKey);
          console.log(`所有項目都被選中，轉為全選狀態`);
        }
      } else {
        filterSet.delete(value);
        console.log(`取消勾選 ${value}，篩選集合大小:`, filterSet.size);
        
        // 🔥 如果沒有任何項目被選中，保持空集合狀態
        if (filterSet.size === 0) {
          console.log(`沒有項目被選中，保持全不選狀態`);
        }
      }
    }

    this.updateFilterUI();
    this.renderTableBody(d3.select("#table-body"), this.getColumns());
    
    // 🔥 關閉下拉選單（因為 renderTableBody 會更新圖表）
    d3.selectAll(".column-filter-dropdown").remove();
  }

  private applyTableFilters() {
    this.filteredTableData = this.originalTableData.filter(row => {
      for (const [columnKey, filterValues] of this.tableFilters) {
        if (filterValues.size > 0) {
          const cellValue = this.getColumnValue(row, columnKey);
          if (!filterValues.has(cellValue)) {
            return false;
          }
        }
      }
      return true;
    });
  }

  private clearTableFilters() {
    console.log('清除所有表格篩選');
    this.tableFilters.clear();
    this.updateFilterUI();
    this.updateFilterTags(); // 🔥 更新篩選標籤
    this.renderTableBody(d3.select("#table-body"), this.getColumns());
    
    // 🔥 清除表格篩選時，恢復圖表到原始狀態（或老師篩選狀態）
    console.log('清除表格篩選，恢復圖表');
    const chartData = this.currentFilterTeacher ? 
      this.rawData.filter(item => 
        (item.AuthorName === this.currentFilterTeacher) || (item.TeacherName === this.currentFilterTeacher)
      ) : this.rawData;
    
    this.generateChart(chartData);
    this.generatePieChart(chartData);
    this.generateLineChart(chartData);
    this.generateTreeChart(chartData);
  }

  private updateFilterUI() {
    // 更新表頭篩選按鈕的樣式
    const columns = this.getColumns();
    columns.forEach(column => {
      const hasFilter = this.tableFilters.has(column.key) && this.tableFilters.get(column.key).size > 0;
      // 這裡可以更新按鈕樣式，但由於我們會重新渲染整個表格，所以會在 renderTableBody 中處理
    });
  }

  private getColumns() {
    return [
      { key: 'ClassName', title: '班級', width: '80px' },
      { key: 'Name', title: '學生姓名', width: '100px' },
      { key: 'OccurDate', title: '訪談日期', width: '100px' },
      { key: 'AuthorName', title: '訪談者', width: '80px' },
      { key: 'StudentID', title: '學號', width: '100px' },
      { key: 'Gender', title: '性別', width: '60px' },
      { key: 'CounselType', title: '輔導類型', width: '90px' },
      { key: 'InterviewType', title: '訪談類型', width: '90px' },
      { key: 'Reason', title: '原因', width: '120px' },
      { key: 'Content', title: '內容', width: '150px' },
      { key: 'Result', title: '結果', width: '120px' },
      { key: 'FollowUp', title: '後續', width: '100px' },
      { key: 'Remark', title: '備註', width: '120px' }
    ];
  }

  private filterByTeacher(teacherName: string) {
    console.log('篩選資料，老師:', teacherName);
    console.log('目前篩選的老師:', this.currentFilterTeacher);
    
    // 檢查是否點擊相同老師，如果是則取消篩選
    if (this.currentFilterTeacher === teacherName) {
      console.log('點擊相同老師，取消篩選，顯示全校資料');
      this.resetFilter();
      return;
    }
    
    // 更新篩選狀態
    this.currentFilterTeacher = teacherName;
    this.updateFilterStatus();
    
    const filteredData = this.rawData.filter(item => 
      (item.AuthorName === teacherName) || (item.TeacherName === teacherName)
    );

    console.log(`${teacherName} 的輔導紀錄數量:`, filteredData.length);

    if (filteredData.length === 0) {
      console.log('該老師沒有輔導紀錄，顯示空狀態');
      d3.select("#chart-container-modal").html('<div style="text-align:center;padding:50px;color:#666;">該老師沒有輔導紀錄</div>');
      d3.select("#pie-chart-container-modal").html('<div style="text-align:center;padding:50px;color:#666;">該老師沒有輔導紀錄</div>');
      d3.select("#line-chart-container-modal").html('<div style="text-align:center;padding:50px;color:#666;">該老師沒有輔導紀錄</div>');
      d3.select("#summary-table-container-modal").selectAll("*").remove();
      return;
    }

    // 🔥 重新生成所有圖表，只顯示該老師的資料
    console.log('重新生成圖表，僅顯示該老師資料');
    this.generateChart(filteredData);
    this.generatePieChart(filteredData);
    this.generateLineChart(filteredData);
    
    // 🔥 更新表格資料：先清除表格篩選，再更新為該老師的資料
    console.log('更新表格為該老師的資料');
    this.tableFilters.clear(); // 清除表格篩選
    this.originalTableData = [...filteredData]; // 更新表格的基礎資料
    this.generateSummaryTable(filteredData);
  }

  private updateFilterTags() {
    console.log('更新篩選標籤顯示');
    
    const filterTagsContainer = d3.select("#filter-tags-container");
    const filterTagsWrapper = d3.select("#filter-tags-wrapper");
    
    // 清除現有標籤
    filterTagsWrapper.selectAll("*").remove();
    
    // 檢查是否有篩選條件
    const hasFilters = this.tableFilters.size > 0 && 
      Array.from(this.tableFilters.values()).some(set => set.size > 0);
    
    if (!hasFilters) {
      // 沒有篩選條件，隱藏整個容器
      filterTagsContainer.style("display", "none");
      return;
    }
    
    // 有篩選條件，顯示容器
    filterTagsContainer.style("display", "block");
    
    // 生成篩選標籤
    const columns = this.getColumns();
    let tagCount = 0;
    
    for (const [columnKey, filterValues] of this.tableFilters) {
      if (filterValues.size > 0) {
        // 找到對應的欄位標題
        const column = columns.find(col => col.key === columnKey);
        const columnTitle = column ? column.title : columnKey;
        
        // 為每個篩選值創建標籤
        const values = Array.from(filterValues);
        values.forEach(value => {
          const tag = filterTagsWrapper.append("div")
            .attr("class", "filter-tag")
            .style("display", "inline-flex")
            .style("align-items", "center")
            .style("background", "linear-gradient(135deg, #007bff, #0056b3)")
            .style("color", "white")
            .style("padding", "4px 8px")
            .style("border-radius", "12px")
            .style("font-size", "11px")
            .style("font-weight", "500")
            .style("box-shadow", "0 2px 4px rgba(0,123,255,0.3)")
            .style("cursor", "pointer")
            .style("transition", "all 0.2s ease")
            .style("margin", "2px")
            .on("mouseover", function() {
              d3.select(this)
                .style("background", "linear-gradient(135deg, #0056b3, #004085)")
                .style("transform", "translateY(-1px)")
                .style("box-shadow", "0 4px 8px rgba(0,123,255,0.4)");
            })
            .on("mouseout", function() {
              d3.select(this)
                .style("background", "linear-gradient(135deg, #007bff, #0056b3)")
                .style("transform", "translateY(0)")
                .style("box-shadow", "0 2px 4px rgba(0,123,255,0.3)");
            })
            .on("click", () => {
              console.log(`點擊移除篩選標籤: ${columnTitle} - ${value}`);
              this.removeFilterTag(columnKey, value);
            });
          
          // 標籤內容
          tag.append("span")
            .style("margin-right", "6px")
            .html(`<strong>${columnTitle}:</strong> ${value}`);
          
          // 移除按鈕
          tag.append("i")
            .attr("class", "fa fa-times")
            .style("font-size", "10px")
            .style("opacity", "0.8")
            .style("cursor", "pointer");
          
          tagCount++;
        });
      }
    }
    
    console.log(`顯示 ${tagCount} 個篩選標籤`);
  }

  private removeFilterTag(columnKey: string, value: string) {
    console.log(`移除篩選標籤: ${columnKey} - ${value}`);
    
    if (this.tableFilters.has(columnKey)) {
      const filterSet = this.tableFilters.get(columnKey);
      filterSet.delete(value);
      
      // 如果集合變空，移除整個篩選條件
      if (filterSet.size === 0) {
        this.tableFilters.delete(columnKey);
        console.log(`${columnKey} 篩選條件已清空並移除`);
      }
      
      // 更新 UI
      this.updateFilterTags();
      this.updateFilterUI();
      this.renderTableBody(d3.select("#table-body"), this.getColumns());
    }
  }

  // 🔥 新增：3D 長條圖
  private generate3DBarChart(rawData: any[]) {
    try {
      console.log('產生 3D 長條圖，資料筆數:', rawData.length);
      
      if (!rawData || rawData.length === 0) {
        d3.select("#chart-3d-bar-container").html('<div style="text-align:center;padding:50px;color:#666;">沒有輔導資料</div>');
        return;
      }

      // 1. 統計各班級的輔導案件數
      const classData = new Map<string, number>();
      for (const item of rawData) {
        const className = item.ClassName || '未知班級';
        classData.set(className, (classData.get(className) || 0) + 1);
      }

      const data = Array.from(classData.entries())
        .map(([className, count]) => ({ className, count }))
        .sort((a, b) => b.count - a.count);

      console.log('3D 長條圖資料:', data);

      // 2. 設定尺寸
      const container = document.getElementById('chart-3d-bar-container');
      const containerWidth = container ? container.offsetWidth : 400;
      const isMobile = window.innerWidth < 768;
      
      const width = containerWidth - 30;
      const height = 320;
      const margin = { top: 40, right: 30, bottom: 60, left: 50 };

      // 3. 移除舊圖表
      d3.select("#chart-3d-bar-container").select("svg").remove();

      // 4. 建立 SVG
      const svg = d3.select("#chart-3d-bar-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("max-width", "100%")
        .style("height", "auto");

      // 5. 比例尺
      const x = d3.scaleBand()
        .domain(data.map(d => d.className))
        .range([margin.left, width - margin.right])
        .padding(0.2);

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.count) || 0])
        .range([height - margin.bottom, margin.top]);

      const colorScale = d3.scaleOrdinal()
        .domain(data.map(d => d.className))
        .range(["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"]);

      // 6. 添加漸層定義（3D 效果）
      const defs = svg.append("defs");
      
      data.forEach((d, i) => {
        const gradient = defs.append("linearGradient")
          .attr("id", `gradient-3d-${i}`)
          .attr("x1", "0%").attr("y1", "0%")
          .attr("x2", "100%").attr("y2", "100%");
        
        const baseColor = colorScale(d.className);
        gradient.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", d3.color(baseColor).brighter(0.3));
        gradient.append("stop")
          .attr("offset", "50%")
          .attr("stop-color", baseColor);
        gradient.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", d3.color(baseColor).darker(0.3));
      });

      // 7. 生成長條圖
      if (this.is3DMode.bar) {
        // 3D 模式
        const barGroup = svg.selectAll(".bar-3d-group")
          .data(data)
          .enter().append("g")
          .attr("class", "bar-3d-group");

        // 3D 效果：頂面
        barGroup.append("polygon")
          .attr("class", "bar-3d-top")
          .attr("points", (d, i) => {
            const barWidth = x.bandwidth();
            const barHeight = height - margin.bottom - y(d.count);
            const depth = 15;
            const x1 = x(d.className);
            const y1 = y(d.count);
            
            return `${x1},${y1} ${x1 + barWidth},${y1} ${x1 + barWidth + depth},${y1 - depth} ${x1 + depth},${y1 - depth}`;
          })
          .attr("fill", (d, i) => d3.color(colorScale(d.className)).brighter(0.5))
          .attr("stroke", "#fff")
          .attr("stroke-width", 1);

        // 3D 效果：右側面
        barGroup.append("polygon")
          .attr("class", "bar-3d-right")
          .attr("points", (d, i) => {
            const barWidth = x.bandwidth();
            const barHeight = height - margin.bottom - y(d.count);
            const depth = 15;
            const x1 = x(d.className) + barWidth;
            const y1 = y(d.count);
            const y2 = height - margin.bottom;
            
            return `${x1},${y1} ${x1 + depth},${y1 - depth} ${x1 + depth},${y2 - depth} ${x1},${y2}`;
          })
          .attr("fill", (d, i) => d3.color(colorScale(d.className)).darker(0.3))
          .attr("stroke", "#fff")
          .attr("stroke-width", 1);

        // 3D 效果：前面（主要長條）
        barGroup.append("rect")
          .attr("class", "bar-3d-front")
          .attr("x", d => x(d.className))
          .attr("y", height - margin.bottom)
          .attr("width", x.bandwidth())
          .attr("height", 0)
          .attr("fill", (d, i) => `url(#gradient-3d-${i})`)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1)
          .transition()
          .duration(1000)
          .delay((d, i) => i * 100)
          .ease(d3.easeBounceOut)
          .attr("y", d => y(d.count))
          .attr("height", d => height - margin.bottom - y(d.count));

      } else {
        // 2D 模式
        svg.selectAll(".bar-2d")
          .data(data)
          .enter().append("rect")
          .attr("class", "bar-2d")
          .attr("x", d => x(d.className))
          .attr("y", height - margin.bottom)
          .attr("width", x.bandwidth())
          .attr("height", 0)
          .attr("fill", d => colorScale(d.className))
          .attr("stroke", "#fff")
          .attr("stroke-width", 2)
          .transition()
          .duration(800)
          .delay((d, i) => i * 100)
          .ease(d3.easeQuadOut)
          .attr("y", d => y(d.count))
          .attr("height", d => height - margin.bottom - y(d.count));
      }

      // 8. 座標軸
      svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)")
        .style("font-size", "11px");

      svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .style("font-size", "11px");

      // 9. 標題
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(this.is3DMode.bar ? "3D 各班級輔導案件數" : "2D 各班級輔導案件數");

      // 10. 數值標籤
      svg.selectAll(".value-label")
        .data(data)
        .enter().append("text")
        .attr("class", "value-label")
        .attr("x", d => x(d.className) + x.bandwidth() / 2)
        .attr("y", d => y(d.count) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .style("opacity", 0)
        .text(d => d.count)
        .transition()
        .duration(1000)
        .delay((d, i) => i * 100 + 500)
        .style("opacity", 1);

      // 🔥 新增：在長條圖上添加小人圖示
      if (this.is3DMode.bar) {
        this.addPeopleIcons(svg, data, x, y);
      }

    } catch (error) {
      console.error('3D 長條圖產生錯誤:', error);
      d3.select("#chart-3d-bar-container").html('<div style="text-align:center;padding:50px;color:#666;">3D 長條圖產生失敗</div>');
    }
  }

  // 🔥 新增：切換 3D/2D 模式
  toggle3DChart(chartType: 'bar' | 'pie') {
    console.log(`切換 ${chartType} 圖表 3D/2D 模式`);
    
    this.is3DMode[chartType] = !this.is3DMode[chartType];
    
    // 更新按鈕狀態
    if (chartType === 'bar') {
      d3.select("#toggle-3d-bar").classed("btn-primary", this.is3DMode.bar).classed("btn-outline-primary", !this.is3DMode.bar);
      d3.select("#toggle-2d-bar").classed("btn-primary", !this.is3DMode.bar).classed("btn-outline-primary", this.is3DMode.bar);
    } else {
      d3.select("#toggle-3d-pie").classed("btn-primary", this.is3DMode.pie).classed("btn-outline-primary", !this.is3DMode.pie);
      d3.select("#toggle-2d-pie").classed("btn-primary", !this.is3DMode.pie).classed("btn-outline-primary", this.is3DMode.pie);
    }
    
    // 重新生成對應圖表
    if (chartType === 'bar') {
      this.generate3DBarChart(this.filteredTableData.length > 0 ? this.filteredTableData : this.rawData);
    } else {
      this.generate3DPieChart(this.filteredTableData.length > 0 ? this.filteredTableData : this.rawData);
    }
  }

  // 🔥 新增：3D 圓餅圖
  private generate3DPieChart(rawData: any[]) {
    try {
      console.log('產生 3D 圓餅圖，資料筆數:', rawData.length);
      
      if (!rawData || rawData.length === 0) {
        d3.select("#chart-3d-pie-container").html('<div style="text-align:center;padding:50px;color:#666;">沒有輔導資料</div>');
        return;
      }

             // 🔥 修改：同時統計輔導次數和學生人數
       const teacherCaseData = new Map<string, number>(); // 輔導次數
       const teacherStudentData = new Map<string, Set<string>>(); // 真實學生數
       
       for (const item of rawData) {
         const teacherName = item.AuthorName || item.TeacherName || '未知老師';
         const studentKey = `${item.StudentID || item.Name || '未知學生'}_${item.ClassName || ''}`;
         
         // 統計輔導次數
         teacherCaseData.set(teacherName, (teacherCaseData.get(teacherName) || 0) + 1);
         
         // 統計學生人數（去重）
         if (!teacherStudentData.has(teacherName)) {
           teacherStudentData.set(teacherName, new Set());
         }
         teacherStudentData.get(teacherName).add(studentKey);
       }

       const data = Array.from(teacherCaseData.entries())
         .map(([teacher, caseCount]) => ({ 
           teacher, 
           count: caseCount, // 圓餅圖大小基於輔導次數
           studentCount: teacherStudentData.get(teacher) ? teacherStudentData.get(teacher).size : 0 // 小人數量基於學生人數
         }))
         .sort((a, b) => b.count - a.count);

      console.log('3D 圓餅圖資料:', data);

      // 2. 設定尺寸
      const container = document.getElementById('chart-3d-pie-container');
      const containerWidth = container ? container.offsetWidth : 400;
      const isMobile = window.innerWidth < 768;
      
      const width = containerWidth - 30;
      const height = 320;
      const margin = 15;
      const radius = Math.min(width, height) / 2 - margin - 20;

      // 3. 移除舊圖表
      d3.select("#chart-3d-pie-container").select("svg").remove();

      // 4. 建立 SVG
      const svg = d3.select("#chart-3d-pie-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("max-width", "100%")
        .style("height", "auto");

      // 5. 圓餅圖群組
      const pieGroup = svg.append("g")
        .attr("transform", `translate(${width / 2},${height / 2 - 10})`);

      // 6. 顏色比例尺
      const color = d3.scaleOrdinal()
        .domain(data.map(d => d.teacher))
        .range(["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"]);

      // 7. 圓餅佈局
      const pie = d3.pie()
        .value((d: any) => d.count)
        .sort(null);

      const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

      const pieData = pie(data);

      if (this.is3DMode.pie) {
        // 3D 模式 - 創建多層效果
        const depth = 20;
        
        // 建立漸層定義
        const defs = svg.append("defs");
        data.forEach((d, i) => {
          const gradient = defs.append("radialGradient")
            .attr("id", `gradient-3d-pie-${i}`)
            .attr("cx", "30%").attr("cy", "30%");
          
          const baseColor = color(d.teacher);
          gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", d3.color(baseColor).brighter(0.5));
          gradient.append("stop")
            .attr("offset", "70%")
            .attr("stop-color", baseColor);
          gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", d3.color(baseColor).darker(0.3));
        });

        // 3D 側面（多層疊加創造深度感）
        for (let layer = depth; layer >= 0; layer -= 2) {
          const layerGroup = pieGroup.append("g")
            .attr("transform", `translate(${layer * 0.3}, ${layer * 0.5})`);
          
          layerGroup.selectAll(".pie-side")
            .data(pieData)
            .enter().append("path")
            .attr("class", "pie-side")
            .attr("d", arc)
            .attr("fill", (d, i) => {
              if (layer === 0) {
                return `url(#gradient-3d-pie-${i})`;
              } else {
                return d3.color(color(d.data.teacher)).darker(0.2 + layer * 0.02);
              }
            })
            .attr("stroke", "#fff")
            .attr("stroke-width", layer === 0 ? 2 : 1)
            .style("opacity", layer === 0 ? 1 : 0.8 - layer * 0.05);
        }

        // 頂面（主要圓餅圖）
        const mainSlices = pieGroup.selectAll(".pie-main")
          .data(pieData)
          .enter().append("path")
          .attr("class", "pie-main")
          .attr("d", arc)
          .attr("fill", (d, i) => `url(#gradient-3d-pie-${i})`)
          .attr("stroke", "#fff")
          .attr("stroke-width", 3)
          .style("cursor", "pointer");

        // 動畫效果
        mainSlices.style("opacity", 0)
          .style("transform", "scale(0)")
          .transition()
          .duration(800)
          .delay((d, i) => i * 150)
          .ease(d3.easeBackOut)
          .style("opacity", 1)
          .style("transform", "scale(1)");

      } else {
        // 2D 模式
        const slices = pieGroup.selectAll(".pie-2d")
          .data(pieData)
          .enter().append("path")
          .attr("class", "pie-2d")
          .attr("d", arc)
          .attr("fill", d => color(d.data.teacher))
          .attr("stroke", "#fff")
          .attr("stroke-width", 2)
          .style("cursor", "pointer");

        // 動畫效果
        slices.style("opacity", 0)
          .transition()
          .duration(600)
          .delay((d, i) => i * 100)
          .ease(d3.easeQuadOut)
          .style("opacity", 1);
      }

      // 8. 標籤
      const labelArc = d3.arc()
        .innerRadius(radius * 0.6)
        .outerRadius(radius * 0.6);

      pieGroup.selectAll(".pie-label")
        .data(pieData)
        .enter().append("text")
        .attr("class", "pie-label")
        .attr("transform", d => `translate(${labelArc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .style("opacity", 0)
        .text(d => {
          const totalCount = data.reduce((sum, item) => sum + item.count, 0);
          const percentage = Math.round((d.data.count / totalCount) * 100);
          return `${percentage}%`;
        })
        .transition()
        .duration(1000)
        .delay((d, i) => i * 150 + 600)
        .style("opacity", 1);

      // 🔥 新增：在圓餅圖上添加小人圖示
      if (this.is3DMode.pie) {
        this.addPeopleToPieChart(svg, pieData, radius, width, height, data);
      }

             // 9. 標題
       svg.append("text")
         .attr("x", width / 2)
         .attr("y", 20)
         .attr("text-anchor", "middle")
         .style("font-size", "16px")
         .style("font-weight", "bold")
         .style("fill", "#333")
         .text(this.is3DMode.pie ? "3D 老師輔導次數分布" : "2D 老師輔導次數分布");

      // 10. 圖例
      const legend = svg.append("g")
        .attr("transform", `translate(10, ${height - 80})`);

      const legendItems = legend.selectAll(".legend-item")
        .data(data.slice(0, 4)) // 只顯示前4個
        .enter().append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(${(i % 2) * 120}, ${Math.floor(i / 2) * 20})`);

      legendItems.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", d => color(d.teacher));

               legendItems.append("text")
           .attr("x", 18)
           .attr("y", 9)
           .style("font-size", "10px")
           .style("fill", "#333")
           .text(d => {
             const shortName = d.teacher.length > 6 ? d.teacher.substring(0, 6) + '..' : d.teacher;
             return `${shortName} (${d.count}次/${d.studentCount}位)`;
           });

    } catch (error) {
      console.error('3D 圓餅圖產生錯誤:', error);
      d3.select("#chart-3d-pie-container").html('<div style="text-align:center;padding:50px;color:#666;">3D 圓餅圖產生失敗</div>');
    }
  }

  // 🔥 新增：在長條圖上添加小人圖示
  private addPeopleIcons(svg: any, data: any[], x: any, y: any) {
    console.log('添加小人圖示到 3D 長條圖');
    
    // 小人 SVG 路徑
    const personPath = "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z";
    
    // 為每個長條添加小人
    data.forEach((d, barIndex) => {
      const barX = x(d.className);
      const barY = y(d.count);
      const barWidth = x.bandwidth();
      const personCount = Math.min(d.count, 10); // 最多顯示 10 個小人
      
      // 計算小人排列
      const personsPerRow = Math.min(3, personCount); // 每行最多 3 個小人
      const rows = Math.ceil(personCount / personsPerRow);
      const personSize = Math.min(barWidth / personsPerRow * 0.8, 24); // 🔥 小人大小 - 放大 50%
      
      console.log(`班級 ${d.className}: ${d.count} 案件，顯示 ${personCount} 個小人`);
      
      // 創建小人群組
      const peopleGroup = svg.append("g")
        .attr("class", `people-group-${barIndex}`)
        .attr("transform", `translate(${barX}, ${barY})`);
      
      // 逐個添加小人
      for (let i = 0; i < personCount; i++) {
        const row = Math.floor(i / personsPerRow);
        const col = i % personsPerRow;
        
        // 計算小人位置（在長條頂部居中排列）
        const startX = (barWidth - personsPerRow * personSize) / 2;
        const personX = startX + col * personSize;
        const personY = -30 - row * (personSize + 2); // 在長條頂部上方
        
        // 添加小人圖示
        const person = peopleGroup.append("g")
          .attr("class", "person-icon")
          .attr("transform", `translate(${personX}, ${personY})`)
          .style("opacity", 0);
        
                // 🔥 小人頭部 - 直接使用 😊 表情符號
        person.append("text")
          .attr("x", personSize / 2)
          .attr("y", personSize * 0.4)
          .attr("text-anchor", "middle")
          .attr("font-size", personSize * 0.5) // 大大的表情符號
          .text("😊");

        // 🔥 小人身體 - 使用服裝emoji
        const clothingEmojis = ['👕', '👔', '🎽', '👗', '🧥'];
        const clothing = clothingEmojis[i % clothingEmojis.length];
        
        person.append("text")
          .attr("x", personSize * 0.5)
          .attr("y", personSize * 0.7)
          .attr("text-anchor", "middle")
          .attr("font-size", personSize * 0.35)
          .text(clothing);

        // 🔥 新增：在衣服上顯示案件數
        person.append("text")
          .attr("x", personSize * 0.5)
          .attr("y", personSize * 0.75)
          .attr("text-anchor", "middle")
          .attr("font-size", personSize * 0.2) // 適應emoji的字體
          .attr("font-weight", "bold")
          .attr("fill", "#fff")
          .attr("stroke", "#333")
          .attr("stroke-width", 1)
          .text(d.count); // 顯示案件數

        // 🔥 移除橫向手臂線條 - 改為分開的手臂
        // 左手臂（從身體向外延伸）
        person.append("line")
          .attr("x1", personSize * 0.25)
          .attr("y1", personSize * 0.55)
          .attr("x2", personSize * 0.1)
          .attr("y2", personSize * 0.7)
          .attr("stroke", "#FFE4B5")
          .attr("stroke-width", 3)
          .attr("stroke-linecap", "round");
          
        // 右手臂（從身體向外延伸）
        person.append("line")
          .attr("x1", personSize * 0.75)
          .attr("y1", personSize * 0.55)
          .attr("x2", personSize * 0.9)
          .attr("y2", personSize * 0.7)
          .attr("stroke", "#FFE4B5")
          .attr("stroke-width", 3)
          .attr("stroke-linecap", "round");

        // 🔥 新增：可愛的小手（圓形）
        person.append("circle")
          .attr("cx", personSize * 0.05)
          .attr("cy", personSize * 0.6)
          .attr("r", personSize * 0.06)
          .attr("fill", "#FFE4B5");
          
        person.append("circle")
          .attr("cx", personSize * 0.95)
          .attr("cy", personSize * 0.6)
          .attr("r", personSize * 0.06)
          .attr("fill", "#FFE4B5");

        // 小人腿部（改為更可愛的圓線條）
        person.append("line")
          .attr("x1", personSize * 0.35)
          .attr("y1", personSize * 0.85)
          .attr("x2", personSize * 0.25)
          .attr("y2", personSize)
          .attr("stroke", "#333")
          .attr("stroke-width", 2)
          .attr("stroke-linecap", "round");
          
        person.append("line")
          .attr("x1", personSize * 0.65)
          .attr("y1", personSize * 0.85)
          .attr("x2", personSize * 0.75)
          .attr("y2", personSize)
          .attr("stroke", "#333")
          .attr("stroke-width", 2)
          .attr("stroke-linecap", "round");

        // 🔥 新增：可愛的小腳（橢圓形）- 皮膚色
        person.append("ellipse")
          .attr("cx", personSize * 0.23)
          .attr("cy", personSize * 1.02)
          .attr("rx", personSize * 0.08)
          .attr("ry", personSize * 0.04)
          .attr("fill", "#FFE4B5"); // 改為皮膚色
          
        person.append("ellipse")
          .attr("cx", personSize * 0.77)
          .attr("cy", personSize * 1.02)
          .attr("rx", personSize * 0.08)
          .attr("ry", personSize * 0.04)
          .attr("fill", "#FFE4B5"); // 改為皮膚色
        
        // 🔥 走動動畫函數（在長條頂部左右移動）- 添加真實走路感覺
        const startWalking = () => {
          const walkAnimation = () => {
            // 計算新的隨機位置（在長條寬度範圍內左右移動）
            const minX = 0;
            const maxX = barWidth - personSize;
            const newPersonX = minX + Math.random() * (maxX - minX);
            
            // 🔥 走路動畫 - 腿部擺動 + 身體搖擺
            const walkDuration = 1500 + Math.random() * 1500;
            const steps = 6; // 走路步數
            const stepDuration = walkDuration / steps;
            
            // 開始走路動畫序列
            let currentStep = 0;
            const stepAnimation = () => {
              if (currentStep >= steps) {
                // 走完了，停頓一下再繼續
                setTimeout(walkAnimation, 300 + Math.random() * 1000);
                return;
              }
              
              // 計算當前步驟的位置（線性插值）
              const progress = currentStep / steps;
              const currentX = personX + (newPersonX - personX) * progress;
              
              // 走路時的身體搖擺（左右搖擺）
              const bodySwing = Math.sin(currentStep * Math.PI) * 3; // 身體左右搖擺
              const headBob = Math.sin(currentStep * Math.PI * 2) * 1; // 頭部上下點動
              
              person
                .transition()
                .duration(stepDuration)
                .ease(d3.easeLinear)
                .attr("transform", `translate(${currentX + bodySwing}, ${personY + headBob}) scale(1.3) rotate(${bodySwing * 0.2})`)
                .on("end", () => {
                  currentStep++;
                  stepAnimation();
                });
            };
            
            stepAnimation();
          };
          
          // 開始走動（隨機延遲）
          setTimeout(walkAnimation, Math.random() * 2000);
        };
        
        // 添加動畫效果
        person.transition()
          .duration(600)
          .delay(barIndex * 200 + i * 100 + 1000) // 長條動畫完成後再顯示小人
          .ease(d3.easeBounceOut)
          .style("opacity", 1)
          .attr("transform", `translate(${personX}, ${personY}) scale(1.3)`) // 初始放大
          .on("end", startWalking); // 出現動畫完成後開始走動
        
        // 🔥 增強懸浮效果
        person.on("mouseover", function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("transform", `translate(${personX}, ${personY}) scale(1.6)`) // 懸停時更大
            .style("filter", "drop-shadow(2px 2px 6px rgba(255,182,193,0.7))"); // 陰影效果
        })
        .on("mouseout", function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("transform", `translate(${personX}, ${personY}) scale(1.3)`) // 回到走動大小
            .style("filter", "none");
        });
      }
      
      // 如果案件數超過 10，添加 "+X" 標籤
      if (d.count > 10) {
        const moreLabel = peopleGroup.append("text")
          .attr("x", barWidth / 2)
          .attr("y", -35 - rows * (personSize + 2))
          .attr("text-anchor", "middle")
          .style("font-size", "10px")
          .style("font-weight", "bold")
          .style("fill", "#666")
          .style("opacity", 0)
          .text(`+${d.count - 10}`)
          .transition()
          .duration(600)
          .delay(barIndex * 200 + personCount * 100 + 1200)
          .style("opacity", 1);
      }
    });
  }

  // 🔥 新增：添加更精美的小人圖示（使用 FontAwesome 圖標）
  private addPeopleFontAwesome(svg: any, data: any[], x: any, y: any) {
    console.log('添加 FontAwesome 小人圖示到 3D 長條圖');
    
    data.forEach((d, barIndex) => {
      const barX = x(d.className);
      const barY = y(d.count);
      const barWidth = x.bandwidth();
      const personCount = Math.min(d.count, 8); // 最多顯示 8 個小人
      
      // 計算小人排列
      const personsPerRow = Math.min(4, personCount); // 每行最多 4 個小人
      const rows = Math.ceil(personCount / personsPerRow);
      const iconSize = Math.min(barWidth / personsPerRow * 0.5, 14);
      
      // 創建小人群組
      const peopleGroup = svg.append("g")
        .attr("class", `people-fa-group-${barIndex}`)
        .attr("transform", `translate(${barX}, ${barY})`);
      
      // 逐個添加 FontAwesome 小人圖標
      for (let i = 0; i < personCount; i++) {
        const row = Math.floor(i / personsPerRow);
        const col = i % personsPerRow;
        
        const startX = (barWidth - personsPerRow * iconSize) / 2;
        const iconX = startX + col * (iconSize + 2);
        const iconY = -25 - row * (iconSize + 4);
        
        // 使用 FontAwesome 用戶圖標
        const personIcon = peopleGroup.append("text")
          .attr("class", "person-fa-icon")
          .attr("x", iconX + iconSize / 2)
          .attr("y", iconY)
          .attr("text-anchor", "middle")
          .attr("font-family", "FontAwesome")
          .attr("font-size", iconSize)
          .style("fill", i % 2 === 0 ? "#FF6B6B" : "#4ECDC4")
          .style("opacity", 0)
          .text("👤") // 或使用 FontAwesome: "\uf007"
          .transition()
          .duration(500)
          .delay(barIndex * 200 + i * 80 + 1000)
          .ease(d3.easeBackOut)
          .style("opacity", 1);
        
        // 懸浮效果
        personIcon.on("mouseover", function() {
          d3.select(this)
            .transition()
            .duration(200)
            .style("transform", "scale(1.3)")
            .style("filter", "drop-shadow(2px 2px 4px rgba(0,0,0,0.3))");
        })
        .on("mouseout", function() {
          d3.select(this)
            .transition()
            .duration(200)
            .style("transform", "scale(1)")
            .style("filter", "none");
        });
      }
      
      // 添加案件數量標籤
      if (d.count > 8) {
        peopleGroup.append("text")
          .attr("x", barWidth / 2)
          .attr("y", -30 - rows * (iconSize + 4))
          .attr("text-anchor", "middle")
          .style("font-size", "9px")
          .style("font-weight", "bold")
          .style("fill", "#333")
          .style("background", "rgba(255,255,255,0.8)")
          .style("padding", "2px 4px")
          .style("border-radius", "8px")
          .style("opacity", 0)
          .text(`總計: ${d.count}`)
          .transition()
          .duration(600)
          .delay(barIndex * 200 + personCount * 80 + 1200)
          .style("opacity", 1);
      }
    });
  }

  // 🔥 新增：在圓餅圖上添加小人圖示
  private addPeopleToPieChart(svg: any, pieData: any[], radius: number, width: number, height: number, data: any[]) {
    console.log('添加小人圖示到 3D 圓餅圖');
    
    // 創建小人群組
    const peopleGroup = svg.append("g")
      .attr("class", "pie-people-group")
      .attr("transform", `translate(${width / 2}, ${height / 2 - 10})`);
    
               pieData.forEach((d, sliceIndex) => {
        const caseCount = d.data.count; // 輔導次數（用於圓餅圖大小和百分比）
        const teacherName = d.data.teacher;
        
                 // 🔥 新邏輯：獲取該老師的所有學生資料
         const teacherStudents = this.rawData.filter(item => 
           (item.AuthorName || item.TeacherName || '未知老師') === teacherName
         );
        
        // 🔥 按學生分組統計輔導次數
        const studentCountMap = new Map();
        teacherStudents.forEach(item => {
          const studentKey = `${item.StudentID || item.Name || '未知學生'}_${item.ClassName || ''}`;
          const studentInfo = {
            name: item.Name || item.StudentName || '未知學生',
            studentId: item.StudentID || '未知學號',
            className: item.ClassName || '未知班級',
            gender: item.Gender || '未知',
            occurDate: item.OccurDate || '',
            counselType: item.CounselType || '一般輔導'
          };
          
          if (!studentCountMap.has(studentKey)) {
            studentCountMap.set(studentKey, { ...studentInfo, count: 0 });
          }
          studentCountMap.get(studentKey).count++;
        });
        
        const students = Array.from(studentCountMap.values());
        const maxDisplayPeople = 8;
        const peopleCount = Math.min(students.length, maxDisplayPeople);
        
        // 計算切片中心位置
        const midAngle = (d.startAngle + d.endAngle) / 2;
        const sliceWidth = d.endAngle - d.startAngle;
        
        console.log(`${teacherName}: ${caseCount} 次輔導，${students.length} 位學生，顯示 ${peopleCount} 個小人`);
      
      // 🔥 在切片內添加小人 - 每個小人代表一個學生
      for (let i = 0; i < peopleCount; i++) {
        const student = students[i]; // 獲取對應學生資料
        
        // 計算小人位置（沿著切片徑向分布）
        const personRadius = radius * 0.3 + (i * radius * 0.15); // 從內到外分布
        const personAngle = midAngle + (Math.random() - 0.5) * sliceWidth * 0.6; // 在切片角度範圍內隨機
        
        const personX = Math.cos(personAngle - Math.PI / 2) * personRadius;
        const personY = Math.sin(personAngle - Math.PI / 2) * personRadius;
        
        // 🔥 小人大小 - 放大 50%
        const personSize = Math.min(radius * 0.12, 18); // 從0.08增加到0.12，從12增加到18
        
        // 創建小人
        const person = peopleGroup.append("g")
          .attr("class", `pie-person-${sliceIndex}-${i}`)
          .attr("transform", `translate(${personX}, ${personY})`)
          .style("opacity", 0)
          .style("cursor", "pointer"); // 🔥 添加點擊游標
        
                // 🔥 小人頭部 - 直接使用 😊 表情符號
        person.append("text")
          .attr("x", 0)
          .attr("y", -personSize * 0.2)
          .attr("text-anchor", "middle")
          .attr("font-size", personSize * 0.6) // 大大的表情符號
          .text("😊");

        // 🔥 小人身體 - 使用服裝emoji
        const clothingEmojis = ['👕', '👔', '🎽', '👗', '🧥'];
        const clothing = clothingEmojis[i % clothingEmojis.length];
        
        person.append("text")
          .attr("x", 0)
          .attr("y", personSize * 0.25)
          .attr("text-anchor", "middle")
          .attr("font-size", personSize * 0.4)
          .text(clothing);

        // 🔥 新增：在衣服上顯示該學生的輔導次數
        person.append("text")
          .attr("x", 0)
          .attr("y", personSize * 0.3)
          .attr("text-anchor", "middle")
          .attr("font-size", personSize * 0.15) // 稍小的字體適應emoji
          .attr("font-weight", "bold")
          .attr("fill", "#fff")
          .attr("stroke", "#333")
          .attr("stroke-width", 0.8)
          .text(student.count); // 🔥 顯示該學生的輔導次數

        // 🔥 移除橫向手臂線條 - 改為分開的手臂
        // 左手臂（從身體向外延伸）
        person.append("line")
          .attr("x1", -personSize * 0.25)
          .attr("y1", personSize * 0.1)
          .attr("x2", -personSize * 0.4)
          .attr("y2", personSize * 0.2)
          .attr("stroke", "#FFE4B5")
          .attr("stroke-width", 2)
          .attr("stroke-linecap", "round");
          
        // 右手臂（從身體向外延伸）
        person.append("line")
          .attr("x1", personSize * 0.25)
          .attr("y1", personSize * 0.1)
          .attr("x2", personSize * 0.4)
          .attr("y2", personSize * 0.2)
          .attr("stroke", "#FFE4B5")
          .attr("stroke-width", 2)
          .attr("stroke-linecap", "round");

        // 🔥 新增：可愛的小手手
        person.append("circle")
          .attr("cx", -personSize * 0.32)
          .attr("cy", personSize * 0.05)
          .attr("r", personSize * 0.04)
          .attr("fill", "#FFE4B5");
           
        person.append("circle")
          .attr("cx", personSize * 0.32)
          .attr("cy", personSize * 0.05)
          .attr("r", personSize * 0.04)
          .attr("fill", "#FFE4B5");

        // 小人腿部
        person.append("line")
          .attr("x1", -personSize * 0.15)
          .attr("y1", personSize * 0.5)
          .attr("x2", -personSize * 0.2)
          .attr("y2", personSize * 0.7)
          .attr("stroke", "#333")
          .attr("stroke-width", 1)
          .attr("stroke-linecap", "round");
           
        person.append("line")
          .attr("x1", personSize * 0.15)
          .attr("y1", personSize * 0.5)
          .attr("x2", personSize * 0.2)
          .attr("y2", personSize * 0.7)
          .attr("stroke", "#333")
          .attr("stroke-width", 1)
          .attr("stroke-linecap", "round");

        // 🔥 新增：可愛的小腳腳 - 皮膚色
        person.append("ellipse")
          .attr("cx", -personSize * 0.22)
          .attr("cy", personSize * 0.72)
          .attr("rx", personSize * 0.05)
          .attr("ry", personSize * 0.025)
          .attr("fill", "#FFE4B5"); // 改為皮膚色
           
        person.append("ellipse")
          .attr("cx", personSize * 0.22)
          .attr("cy", personSize * 0.72)
          .attr("rx", personSize * 0.05)
          .attr("ry", personSize * 0.025)
          .attr("fill", "#FFE4B5"); // 改為皮膚色

        // 🔥 走動動畫函數 - 添加真實走路感覺
        const startWalking = () => {
          const walkAnimation = () => {
            // 計算新的隨機位置（在切片範圍內）
            const newPersonRadius = radius * 0.25 + Math.random() * (radius * 0.4);
            const newPersonAngle = midAngle + (Math.random() - 0.5) * sliceWidth * 0.7;
            const newPersonX = Math.cos(newPersonAngle - Math.PI / 2) * newPersonRadius;
            const newPersonY = Math.sin(newPersonAngle - Math.PI / 2) * newPersonRadius;
            
            // 🔥 走路動畫 - 腿部擺動 + 身體搖擺
            const walkDuration = 2000 + Math.random() * 2000;
            const steps = 8; // 走路步數
            const stepDuration = walkDuration / steps;
            
            // 開始走路動畫序列
            let currentStep = 0;
            const stepAnimation = () => {
              if (currentStep >= steps) {
                // 走完了，停頓一下再繼續
                setTimeout(walkAnimation, 500 + Math.random() * 1500);
                return;
              }
              
              // 計算當前步驟的位置（線性插值）
              const progress = currentStep / steps;
              const currentX = personX + (newPersonX - personX) * progress;
              const currentY = personY + (newPersonY - personY) * progress;
              
              // 走路時的身體搖擺（左右搖擺）
              const bodySwing = Math.sin(currentStep * Math.PI) * 5; // 身體左右搖擺
              const headBob = Math.sin(currentStep * Math.PI * 2) * 2; // 頭部上下點動
              
              // 腿部擺動動畫
              const leftLegSwing = currentStep % 2 === 0 ? -15 : 15; // 左腿擺動
              const rightLegSwing = currentStep % 2 === 0 ? 15 : -15; // 右腿擺動
              
              // 手臂擺動
              const armSwing = currentStep % 2 === 0 ? -10 : 10;
              
              person
                .transition()
                .duration(stepDuration)
                .ease(d3.easeLinear)
                .attr("transform", `translate(${currentX + bodySwing}, ${currentY + headBob}) scale(1.2) rotate(${bodySwing * 0.3})`)
                .on("end", () => {
                  currentStep++;
                  stepAnimation();
                });
            };
            
            stepAnimation();
          };
          
          // 開始走動（隨機延遲）
          setTimeout(walkAnimation, Math.random() * 3000);
        };
        
        // 🔥 添加動畫效果（延遲出現）
        person.transition()
          .duration(400)
          .delay(sliceIndex * 200 + i * 150 + 1500) // 圓餅圖動畫完成後再顯示小人
          .ease(d3.easeBackOut)
          .style("opacity", 1)
          .attr("transform", `translate(${personX}, ${personY}) scale(1.2)`) // 初始放大
          .on("end", startWalking); // 出現動畫完成後開始走動
        
        // 🔥 增強懸浮效果（變得更可愛）
        person.on("mouseover", function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("transform", `translate(${personX}, ${personY}) scale(1.8)`) // 懸停時更大
            .style("filter", "drop-shadow(3px 3px 8px rgba(255,182,193,0.8))"); // 更強的粉色陰影
        })
        .on("mouseout", function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("transform", `translate(${personX}, ${personY}) scale(1.2)`) // 回到走動大小
            .style("filter", "none");
        })
        .on("click", (event) => {
          // 🔥 點擊顯示學生證卡片
          event.stopPropagation();
          this.showStudentCard(student, personX, personY, sliceIndex, i);
        });
      }
      
             // 🔥 修改：在切片外圍添加學生數量指示器
       if (students.length > peopleCount) {
         const indicatorRadius = radius + 15;
         const indicatorX = Math.cos(midAngle - Math.PI / 2) * indicatorRadius;
         const indicatorY = Math.sin(midAngle - Math.PI / 2) * indicatorRadius;
         
         // 數量指示器背景
         const indicator = peopleGroup.append("g")
           .attr("transform", `translate(${indicatorX}, ${indicatorY})`)
           .style("opacity", 0);
         
         indicator.append("circle")
           .attr("r", 8)
           .attr("fill", "rgba(255,255,255,0.9)")
           .attr("stroke", "#333")
           .attr("stroke-width", 1);
         
         indicator.append("text")
           .attr("text-anchor", "middle")
           .attr("dy", "0.35em")
           .style("font-size", "8px")
           .style("font-weight", "bold")
           .style("fill", "#333")
           .text(students.length);
        
        // 動畫顯示
        indicator.transition()
          .duration(300)
          .delay(sliceIndex * 200 + peopleCount * 150 + 1800)
          .style("opacity", 1);
      }
    });
  }

  // 🔥 新增：顯示學生證卡片
  private showStudentCard(student: any, x: number, y: number, sliceIndex: number, personIndex: number) {
    // 移除現有的學生證卡片
    d3.selectAll('.student-card').remove();
    
    // 創建學生證卡片
    const card = d3.select('#pie-chart-container-modal svg')
      .append('g')
      .attr('class', 'student-card')
      .attr('transform', `translate(${x}, ${y - 80})`); // 在學生頭上顯示
    
    // 學生證背景
    card.append('rect')
      .attr('x', -60)
      .attr('y', -40)
      .attr('width', 120)
      .attr('height', 70)
      .attr('rx', 8)
      .attr('fill', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))');
    
    // 學生證標題
    card.append('text')
      .attr('x', 0)
      .attr('y', -25)
      .attr('text-anchor', 'middle')
      .style('fill', '#fff')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .text('學生證');
    
    // 學生姓名
    card.append('text')
      .attr('x', 0)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('fill', '#fff')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text(`${student.name}`);
    
    // 班級
    card.append('text')
      .attr('x', 0)
      .attr('y', 5)
      .attr('text-anchor', 'middle')
      .style('fill', '#e0e6ff')
      .style('font-size', '9px')
      .text(`${student.className}`);
    
    // 學號
    card.append('text')
      .attr('x', 0)
      .attr('y', 18)
      .attr('text-anchor', 'middle')
      .style('fill', '#e0e6ff')
      .style('font-size', '8px')
      .text(`學號: ${student.studentId}`);
    
    // 輔導次數
    card.append('text')
      .attr('x', 0)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('fill', '#ffeb3b')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .text(`輔導 ${student.count} 次`);
    
    // 關閉按鈕
    const closeBtn = card.append('g')
      .attr('class', 'close-btn')
      .style('cursor', 'pointer');
    
    closeBtn.append('circle')
      .attr('cx', 50)
      .attr('cy', -30)
      .attr('r', 8)
      .attr('fill', '#ff4757')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);
    
    closeBtn.append('text')
      .attr('x', 50)
      .attr('y', -26)
      .attr('text-anchor', 'middle')
      .style('fill', '#fff')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .text('×');
    
    // 關閉按鈕點擊事件
    closeBtn.on('click', function() {
      card.remove();
    });
    
    // 卡片出現動畫
    card
      .style('opacity', 0)
      .transition()
      .duration(300)
      .style('opacity', 1)
      .attr('transform', `translate(${x}, ${y - 80}) scale(1)`);
    
    // 3秒後自動消失
    setTimeout(() => {
      if (card.node()) {
        card.transition()
          .duration(300)
          .style('opacity', 0)
          .on('end', () => card.remove());
      }
    }, 3000);
  }

  // 🔥 新增：生成樹狀圖
  private generateTreeChart(rawData: any[]) {
    try {
      console.log('產生樹狀圖，資料筆數:', rawData.length);
      
      if (!rawData || rawData.length === 0) {
        d3.select("#tree-chart-container").html('<div style="text-align:center;padding:50px;color:#666;">沒有輔導資料</div>');
        return;
      }

      // 1. 建立樹狀結構資料
      const treeData = this.buildTreeData(rawData);
      
      // 2. 設定尺寸
      const container = document.getElementById('tree-chart-container');
      const containerWidth = container ? container.offsetWidth : 800;
      const width = containerWidth - 40;
      const height = 400;

      // 3. 移除舊圖表
      d3.select("#tree-chart-container").select("svg").remove();

      // 4. 建立 SVG
      const svg = d3.select("#tree-chart-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("max-width", "100%")
        .style("height", "auto");

      // 5. 根據佈局類型生成不同的樹狀圖
      switch (this.currentTreeLayout) {
        case 'hierarchical':
          this.generateHierarchicalTree(svg, treeData, width, height);
          break;
        case 'radial':
          this.generateRadialTree(svg, treeData, width, height);
          break;
        case 'force':
          this.generateForceDirectedTree(svg, treeData, width, height);
          break;
      }

    } catch (error) {
      console.error('樹狀圖產生錯誤:', error);
      d3.select("#tree-chart-container").html('<div style="text-align:center;padding:50px;color:#666;">樹狀圖產生失敗</div>');
    }
  }

  // 🔥 建立樹狀結構資料
  private buildTreeData(rawData: any[]) {
    // 建立學校為根節點的層次結構
    const schoolNode: any = {
      name: "輔導系統",
      type: "school",
      children: []
    };

    // 按年級分組
    const gradeMap = new Map<string, any>();
    rawData.forEach(item => {
      const className = item.ClassName || '未知班級';
      const grade = className.substring(0, 1) || '其他'; // 取第一個字符作為年級
      
      if (!gradeMap.has(grade)) {
        gradeMap.set(grade, {
          name: `${grade}年級`,
          type: "grade",
          children: new Map<string, any>()
        });
      }
      
      const gradeNode = gradeMap.get(grade);
      if (!gradeNode.children.has(className)) {
        gradeNode.children.set(className, {
          name: className,
          type: "class",
          count: 0,
          teachers: new Set<string>(),
          students: new Set<string>(),
          children: []
        });
      }
      
      const classNode = gradeNode.children.get(className);
      classNode.count++;
      
      // 添加老師
      const teacherName = item.AuthorName || item.TeacherName || '未知老師';
      classNode.teachers.add(teacherName);
      
      // 添加學生
      const studentName = item.Name || '未知學生';
      classNode.students.add(studentName);
    });

    // 轉換為樹狀結構
    schoolNode.children = Array.from(gradeMap.values()).map((gradeNode: any) => ({
      name: gradeNode.name,
      type: gradeNode.type,
      children: Array.from(gradeNode.children.values()).map((classNode: any) => ({
        name: classNode.name,
        type: classNode.type,
        count: classNode.count,
        teacherCount: classNode.teachers.size,
        studentCount: classNode.students.size,
        children: [
          {
            name: `老師 (${classNode.teachers.size}位)`,
            type: "teacher_group",
            children: Array.from(classNode.teachers).map((teacher: string) => ({
              name: teacher,
              type: "teacher",
              value: 1
            }))
          },
          {
            name: `學生 (${classNode.students.size}位)`,
            type: "student_group", 
            children: Array.from(classNode.students).slice(0, 8).map((student: string) => ({ // 最多顯示8個學生
              name: student,
              type: "student",
              value: 1
            }))
          }
        ]
      }))
    }));

    console.log('樹狀圖資料結構:', schoolNode);
    return schoolNode;
  }

  // 🔥 階層樹狀圖
  private generateHierarchicalTree(svg: any, data: any, width: number, height: number) {
    const margin = { top: 20, right: 50, bottom: 20, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 建立樹狀佈局
    const tree = d3.tree().size([innerHeight, innerWidth]);
    const root = d3.hierarchy(data);
    const treeData = tree(root);

    // 設定顏色
    const colorMap = {
      school: "#FF6B6B",
      grade: "#4ECDC4", 
      class: "#45B7D1",
      teacher_group: "#96CEB4",
      student_group: "#FFEAA7",
      teacher: "#DDA0DD",
      student: "#98D8C8"
    };

    // 繪製連線
    g.selectAll(".link")
      .data(treeData.descendants().slice(1))
      .enter().append("path")
      .attr("class", "link")
      .attr("d", d => {
        return `M${d.y},${d.x}C${(d.y + d.parent.y) / 2},${d.x} ${(d.y + d.parent.y) / 2},${d.parent.x} ${d.parent.y},${d.parent.x}`;
      })
      .style("fill", "none")
      .style("stroke", "#ccc")
      .style("stroke-width", "2px")
      .style("opacity", 0)
      .transition()
      .duration(800)
      .delay((d, i) => i * 50)
      .style("opacity", 1);

    // 繪製節點
    const node = g.selectAll(".node")
      .data(treeData.descendants())
      .enter().append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.y},${d.x})`)
      .style("opacity", 0)
      .style("cursor", "pointer");

    // 節點圓圈
    node.append("circle")
      .attr("r", d => {
        if (d.data.type === "school") return 12;
        if (d.data.type === "grade") return 10;
        if (d.data.type === "class") return 8;
        return 6;
      })
      .style("fill", d => colorMap[d.data.type] || "#ccc")
      .style("stroke", "#fff")
      .style("stroke-width", "2px");

    // 節點標籤
    node.append("text")
      .attr("dy", ".35em")
      .attr("x", d => d.children ? -13 : 13)
      .style("text-anchor", d => d.children ? "end" : "start")
      .style("font-size", d => {
        if (d.data.type === "school") return "14px";
        if (d.data.type === "grade") return "12px";
        return "10px";
      })
      .style("font-weight", d => d.data.type === "school" ? "bold" : "normal")
      .text(d => {
        if (d.data.type === "class") {
          return `${d.data.name} (${d.data.count}案件)`;
        }
        return d.data.name;
      });

    // 節點進入動畫
    node.transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .style("opacity", 1);

    // 節點互動
    node.on("mouseover", function(event, d) {
        d3.select(this).select("circle")
          .transition().duration(150)
          .attr("r", d => {
            const baseRadius = d.data.type === "school" ? 12 : 
                              d.data.type === "grade" ? 10 : 
                              d.data.type === "class" ? 8 : 6;
            return baseRadius * 1.3;
          });
      })
      .on("mouseout", function(event, d) {
        d3.select(this).select("circle")
          .transition().duration(150)
          .attr("r", d => {
            if (d.data.type === "school") return 12;
            if (d.data.type === "grade") return 10;
            if (d.data.type === "class") return 8;
            return 6;
          });
      });

    // 添加標題
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .text("階層式輔導關係樹狀圖");
  }

  // 🔥 放射狀樹狀圖
  private generateRadialTree(svg: any, data: any, width: number, height: number) {
    const radius = Math.min(width, height) / 2 - 40;
    const g = svg.append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const tree = d3.tree().size([2 * Math.PI, radius]);
    const root = d3.hierarchy(data);
    const treeData = tree(root);

    const colorMap = {
      school: "#FF6B6B",
      grade: "#4ECDC4", 
      class: "#45B7D1",
      teacher_group: "#96CEB4",
      student_group: "#FFEAA7",
      teacher: "#DDA0DD",
      student: "#98D8C8"
    };

    // 連線
    g.selectAll(".link")
      .data(treeData.descendants().slice(1))
      .enter().append("path")
      .attr("class", "link")
      .attr("d", d => {
        const source = {
          x: d.parent.x,
          y: d.parent.y
        };
        const target = {
          x: d.x,
          y: d.y
        };
        
        return d3.linkRadial()
          .angle(d => d.x)
          .radius(d => d.y)(target, source);
      })
      .style("fill", "none")
      .style("stroke", "#ccc")
      .style("stroke-width", "1.5px")
      .style("opacity", 0)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 30)
      .style("opacity", 1);

    // 節點
    const node = g.selectAll(".node")
      .data(treeData.descendants())
      .enter().append("g")
      .attr("class", "node")
      .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
      .style("opacity", 0);

    node.append("circle")
      .attr("r", d => {
        if (d.data.type === "school") return 10;
        if (d.data.type === "grade") return 8;
        if (d.data.type === "class") return 6;
        return 4;
      })
      .style("fill", d => colorMap[d.data.type] || "#ccc")
      .style("stroke", "#fff")
      .style("stroke-width", "2px");

    node.append("text")
      .attr("dy", ".31em")
      .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
      .style("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
      .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
      .style("font-size", "10px")
      .text(d => d.data.name);

    node.transition()
      .duration(1000)
      .delay((d, i) => i * 50)
      .style("opacity", 1);

    // 添加標題
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .text("放射狀輔導關係樹狀圖");
  }

  // 🔥 力導向網絡圖（仿移動專利訴訟圖）
  private generateForceDirectedTree(svg: any, data: any, width: number, height: number) {
    const g = svg.append("g");

    // 建立網絡結構資料 - 以老師為中心節點
    const nodes = [];
    const links = [];
    const nodeMap = new Map();

    // 添加中心節點（輔導系統）
    const centerNode = {
      id: "center",
      name: "輔導系統",
      type: "center",
      count: data.children ? data.children.length : 0,
      radius: 20,
      color: "#FF6B6B"
    };
    nodes.push(centerNode);
    nodeMap.set("center", centerNode);

    // 統計老師和學生的關係
    const teacherStudentMap = new Map();
    const teacherClassMap = new Map();
    
    if (data.children) {
      data.children.forEach(grade => {
        if (grade.children) {
          grade.children.forEach(classData => {
            if (classData.children) {
              classData.children.forEach(group => {
                if (group.type === "teacher_group" && group.children) {
                  group.children.forEach(teacher => {
                    const teacherId = `teacher_${teacher.name}`;
                    if (!teacherStudentMap.has(teacherId)) {
                      teacherStudentMap.set(teacherId, new Set());
                      teacherClassMap.set(teacherId, new Set());
                    }
                    teacherClassMap.get(teacherId).add(classData.name);
                  });
                } else if (group.type === "student_group" && group.children) {
                  group.children.forEach(student => {
                    // 找到這個班級的老師，建立老師-學生關係
                    if (classData.children) {
                      const teacherGroup = classData.children.find(g => g.type === "teacher_group");
                      if (teacherGroup && teacherGroup.children) {
                        teacherGroup.children.forEach(teacher => {
                          const teacherId = `teacher_${teacher.name}`;
                          if (teacherStudentMap.has(teacherId)) {
                            teacherStudentMap.get(teacherId).add(`student_${student.name}`);
                          }
                        });
                      }
                    }
                  });
                }
              });
            }
          });
        }
      });
    }

    // 添加老師節點
    for (const [teacherId, students] of teacherStudentMap) {
      const teacherName = teacherId.replace('teacher_', '');
      const classSet = teacherClassMap.get(teacherId);
      const classCount = classSet ? classSet.size : 0;
      const studentCount = students.size;
      
      const teacherNode = {
        id: teacherId,
        name: teacherName,
        type: "teacher",
        count: studentCount,
        classCount: classCount,
        radius: Math.max(8, Math.min(16, 8 + studentCount * 0.8)),
        color: "#4ECDC4"
      };
      nodes.push(teacherNode);
      nodeMap.set(teacherId, teacherNode);

      // 連接到中心節點
      links.push({
        source: "center",
        target: teacherId,
        type: "center_to_teacher",
        value: studentCount
      });
    }

    // 添加重要學生節點（被多位老師輔導的學生）
    const studentTeacherCount = new Map();
    for (const [teacherId, students] of teacherStudentMap) {
      for (const studentId of students) {
        if (!studentTeacherCount.has(studentId)) {
          studentTeacherCount.set(studentId, new Set());
        }
        studentTeacherCount.get(studentId).add(teacherId);
      }
    }

    // 只顯示被2位以上老師輔導的學生（重點關注對象）
    for (const [studentId, teachers] of studentTeacherCount) {
      if (teachers.size >= 2) {
        const studentName = studentId.replace('student_', '');
        const studentNode = {
          id: studentId,
          name: studentName,
          type: "student",
          count: teachers.size,
          radius: Math.max(6, 6 + teachers.size * 2),
          color: "#FFEAA7"
        };
        nodes.push(studentNode);
        nodeMap.set(studentId, studentNode);

        // 連接到相關老師
        for (const teacherId of teachers) {
          links.push({
            source: teacherId,
            target: studentId,
            type: "teacher_to_student",
            value: 1
          });
        }
      }
    }

    console.log('網絡圖節點:', nodes);
    console.log('網絡圖連線:', links);

    // 設定力導向模擬（類似專利訴訟圖的布局）
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links)
        .id(d => d.id)
        .distance(d => {
          if (d.type === "center_to_teacher") return 80;
          if (d.type === "teacher_to_student") return 40;
          return 50;
        })
        .strength(0.8))
      .force("charge", d3.forceManyBody()
        .strength(d => {
          if (d.type === "center") return -800;
          if (d.type === "teacher") return -300;
          return -150;
        }))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide()
        .radius(d => d.radius + 5)
        .strength(0.8));

    // 繪製連線（類似專利圖的箭頭線條）
    const link = g.selectAll(".link")
      .data(links)
      .enter().append("line")
      .attr("class", "link")
      .style("stroke", d => {
        if (d.type === "center_to_teacher") return "#FF6B6B";
        if (d.type === "teacher_to_student") return "#4ECDC4"; 
        return "#ccc";
      })
      .style("stroke-width", d => {
        if (d.type === "center_to_teacher") return Math.max(2, d.value * 0.5);
        return 1.5;
      })
      .style("opacity", 0.7)
      .style("stroke-dasharray", d => d.type === "teacher_to_student" ? "3,3" : "none");

    // 繪製節點（類似專利圖的公司節點）
    const node = g.selectAll(".node")
      .data(nodes)
      .enter().append("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .call(d3.drag()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // 節點圓圈（大小根據重要性）
    node.append("circle")
      .attr("r", d => d.radius)
      .style("fill", d => d.color)
      .style("stroke", "#fff")
      .style("stroke-width", d => d.type === "center" ? 4 : 2)
      .style("opacity", 0.9);

    // 節點標籤
    node.append("text")
      .attr("dy", d => d.type === "center" ? ".35em" : ".35em")
      .attr("text-anchor", "middle")
      .style("font-size", d => {
        if (d.type === "center") return "12px";
        if (d.type === "teacher") return "10px";
        return "8px";
      })
      .style("font-weight", d => d.type === "center" ? "bold" : "normal")
      .style("fill", d => d.type === "center" ? "#fff" : "#333")
      .style("pointer-events", "none")
      .text(d => {
        if (d.type === "center") return d.name;
        if (d.type === "teacher") return `${d.name} (${d.count}位)`;
        if (d.type === "student") return `${d.name}`;
        return d.name;
      });

    // 添加節點提示訊息
    node.on("mouseover", function(event, d) {
        const tooltip = d3.select(".chart-tooltip");
        let tooltipText = "";
        
        if (d.type === "center") {
          tooltipText = `<strong>輔導系統</strong><br/>管理 ${teacherStudentMap.size} 位老師`;
        } else if (d.type === "teacher") {
          tooltipText = `<strong>老師：${d.name}</strong><br/>輔導 ${d.count} 位學生<br/>負責 ${d.classCount} 個班級`;
        } else if (d.type === "student") {
          tooltipText = `<strong>學生：${d.name}</strong><br/>被 ${d.count} 位老師輔導<br/>（重點關注對象）`;
        }
        
        tooltip.transition().duration(200).style("opacity", .9);
        tooltip.html(tooltipText)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(".chart-tooltip").transition().duration(500).style("opacity", 0);
      });

    // 節點進入動畫
    node.style("opacity", 0)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .style("opacity", 1);

    link.style("opacity", 0)
      .transition()
      .duration(1000)
      .delay(500)
      .style("opacity", 0.7);

    // 更新位置
    simulation.on("tick", () => {
      link.attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // 添加圖例
    const legend = svg.append("g")
      .attr("transform", `translate(20, 30)`);

    const legendData = [
      { type: "center", color: "#FF6B6B", label: "輔導系統", size: 12 },
      { type: "teacher", color: "#4ECDC4", label: "輔導老師", size: 10 },
      { type: "student", color: "#FFEAA7", label: "重點學生", size: 8 }
    ];

    const legendItems = legend.selectAll(".legend-item")
      .data(legendData)
      .enter().append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 20})`);

    legendItems.append("circle")
      .attr("r", d => d.size)
      .attr("fill", d => d.color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    legendItems.append("text")
      .attr("x", 20)
      .attr("y", 5)
      .style("font-size", "11px")
      .style("fill", "#333")
      .text(d => d.label);

    // 添加標題
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .text("輔導關係網絡圖");
  }

  // 🔥 切換樹狀圖佈局
  public toggleTreeLayout(layout: 'hierarchical' | 'radial' | 'force') {
    console.log(`切換樹狀圖佈局: ${layout}`);
    
    this.currentTreeLayout = layout;
    
    // 更新按鈕狀態
    d3.selectAll("#toggle-tree-hierarchical, #toggle-tree-radial, #toggle-tree-force")
      .classed("btn-primary", false)
      .classed("btn-outline-primary", true)
      .classed("btn-outline-secondary", true)
      .classed("btn-outline-info", true);
    
    if (layout === 'hierarchical') {
      d3.select("#toggle-tree-hierarchical")
        .classed("btn-primary", true)
        .classed("btn-outline-primary", false);
    } else if (layout === 'radial') {
      d3.select("#toggle-tree-radial")
        .classed("btn-primary", true)
        .classed("btn-outline-secondary", false);
    } else {
      d3.select("#toggle-tree-force")
        .classed("btn-primary", true)
        .classed("btn-outline-info", false);
    }
    
    // 重新生成樹狀圖
    const chartData = this.filteredTableData.length > 0 ? this.filteredTableData : this.rawData;
    this.generateTreeChart(chartData);
  }

} 