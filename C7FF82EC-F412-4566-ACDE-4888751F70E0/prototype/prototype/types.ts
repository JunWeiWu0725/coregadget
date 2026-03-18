
export type Step = 1 | 2 | 3;

export interface ClassInfo {
  id: string;
  name: string;
  grade: number;
}

export interface Field {
  id: string;
  name: string;
  category: string;
}

export interface SelectionState {
  year: string;
  semester: string;
  selectedClasses: string[];
  selectedFields: string[];
}
