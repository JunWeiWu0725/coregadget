import { GradebookModule } from './gradebook.module';

describe('GradebookModule', () => {
  let gradebookModule: GradebookModule;

  beforeEach(() => {
    gradebookModule = new GradebookModule();
  });

  it('should create an instance', () => {
    expect(gradebookModule).toBeTruthy();
  });
});
