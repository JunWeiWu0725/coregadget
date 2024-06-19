import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterChineseNumbers'
})
export class FilterChineseNumbersPipe implements PipeTransform {

  transform(value: string): string {
    const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    const regex = new RegExp(`^[${chineseNumbers.join('')}、\\s]+`);
    return value.replace(regex, '');
  }
}
