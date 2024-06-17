import { FilterChineseNumbersPipe } from './filter-chinese-numbers.pipe';

describe('FilterChineseNumbersPipe', () => {
  it('create an instance', () => {
    const pipe = new FilterChineseNumbersPipe();
    expect(pipe).toBeTruthy();
  });
});
