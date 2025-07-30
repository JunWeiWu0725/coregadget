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

  constructor() { }

  ngOnInit() {
  }

  public open(data: any[]) {
    this.generateChart(data);
    this.generatePieChart(data);
    $(this.chartModal.nativeElement).modal('show');
  }

  private generateChart(rawData: any[]) {
    console.log('圖表接收的資料:', rawData);
    // 1. 整理資料
    const dataMap = new Map<string, { grade: string, male: number, female: number }>();
    for (const item of rawData) {
      // 從班級名稱推導年級，如果有 GradeYear 就用 GradeYear
      let grade = '未分年級';
      if (item.GradeYear) {
        grade = item.GradeYear + '年級';
      } else if (item.ClassName) {
        // 嘗試從班級名稱中抽取年級資訊
        const gradeMatch = item.ClassName.match(/(\d+)/);
        if (gradeMatch) {
          grade = gradeMatch[1] + '年級';
        }
      }
      
      if (!dataMap.has(grade)) {
        dataMap.set(grade, { grade, male: 0, female: 0 });
      }
      const gradeData = dataMap.get(grade);
      
      // 如果有性別資訊就使用，否則歸類為未知
      if (item.Gender === '男' || item.gender === '男') {
        gradeData.male++;
      } else if (item.Gender === '女' || item.gender === '女') {
        gradeData.female++;
      } else {
        // 如果沒有性別資訊，暫時歸類為男性（或可以新增一個未知類別）
        gradeData.male++;
      }
    }
    const data = Array.from(dataMap.values());
    const subgroups = ['male', 'female'];

    // 2. 建立堆疊資料
    const stackedData = d3.stack()
      .keys(subgroups)
      (data);

    // 3. 設定 SVG 容器的大小
    const width = 400;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    // 4. 移除舊的圖表 (如果有的話)
    d3.select("#chart-container-modal").select("svg").remove();

    // 5. 建立 SVG 容器
    const svg = d3.select("#chart-container-modal")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // 6. 建立比例尺
    const x = d3.scaleBand()
      .range([margin.left, width - margin.right])
      .padding(0.1)
      .domain(data.map(d => d.grade));

    const y = d3.scaleLinear()
      .range([height - margin.bottom, margin.top])
      .domain([0, d3.max(data, d => d.male + d.female)]);

    const color = d3.scaleOrdinal()
      .domain(subgroups)
      .range(['#66b3ff', '#ff9999']);

    // 7. 建立座標軸
    const xAxis = g => g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

    const yAxis = g => g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    svg.append("g").call(xAxis);
    svg.append("g").call(yAxis);

    // 8. 繪製堆疊長條
    svg.append("g")
      .selectAll("g")
      .data(stackedData)
      .enter().append("g")
      .attr("fill", d => color(d.key))
      .selectAll("rect")
      .data(d => d)
      .enter().append("rect")
      .attr("x", d => x(d.data.grade))
      .attr("y", d => y(d[1]))
      .attr("height", d => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth());

    // 9. 加上圖例
    const legend = svg.selectAll(".legend")
      .data(subgroups)
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend.append("rect")
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", color);

    legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(d => d === 'male' ? '男' : '女');
  }

  private generatePieChart(rawData: any[]) {
    // 1. 整理資料
    let maleCount = 0;
    let femaleCount = 0;
    for (const item of rawData) {
      if (item.Gender === '男' || item.gender === '男') {
        maleCount++;
      } else if (item.Gender === '女' || item.gender === '女') {
        femaleCount++;
      } else {
        // 如果沒有性別資訊，暫時歸類為男性
        maleCount++;
      }
    }
    const data = [
      { gender: '男', count: maleCount },
      { gender: '女', count: femaleCount }
    ];

    // 2. 設定 SVG 容器的大小
    const width = 200;
    const height = 200;
    const margin = 10;
    const radius = Math.min(width, height) / 2 - margin;

    // 3. 移除舊的圖表 (如果有的話)
    d3.select("#pie-chart-container-modal").select("svg").remove();

    // 4. 建立 SVG 容器
    const svg = d3.select("#pie-chart-container-modal")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // 5. 建立顏色比例尺
    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.gender))
      .range(["#66b3ff", "#ff9999"]);

    // 6. 建立 pie generator
    const pie = d3.pie()
      .value(d => d.count);

    // 7. 建立 arc generator
    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    // 8. 繪製圓餅圖
    svg.selectAll('slices')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.gender))
      .attr("stroke", "white")
      .style("stroke-width", "2px");

    // 9. 加上標籤
    svg.selectAll('slices')
      .data(pie(data))
      .enter()
      .append('text')
      .text(d => `${d.data.gender}: ${d.data.count}`)
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .style("text-anchor", "middle")
      .style("font-size", 12);
  }

} 