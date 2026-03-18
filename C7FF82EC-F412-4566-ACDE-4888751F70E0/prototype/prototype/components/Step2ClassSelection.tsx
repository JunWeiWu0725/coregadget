
import React from 'react';
import { CLASSES, GRADES } from '../constants';
import { Users, CheckCircle2, Circle } from 'lucide-react';

interface Props {
  selected: string[];
  onChange: (selected: string[]) => void;
}

const Step2ClassSelection: React.FC<Props> = ({ selected, onChange }) => {
  const toggleClass = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const toggleGrade = (grade: number) => {
    const gradeClassIds = CLASSES.filter((c) => c.grade === grade).map((c) => c.id);
    const allSelected = gradeClassIds.every((id) => selected.includes(id));

    if (allSelected) {
      onChange(selected.filter((id) => !gradeClassIds.includes(id)));
    } else {
      const newSelection = Array.from(new Set([...selected, ...gradeClassIds]));
      onChange(newSelection);
    }
  };

  const selectAll = () => {
    if (selected.length === CLASSES.length) {
      onChange([]);
    } else {
      onChange(CLASSES.map((c) => c.id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2">
            <Users size={20} className="text-[#5daea4]" />
            選擇匯出班級
          </h2>
          <p className="text-gray-400 text-sm">點擊年級名稱可全選該年級班級</p>
        </div>
        <button 
          onClick={selectAll}
          className="text-sm font-medium text-[#5daea4] hover:underline"
        >
          {selected.length === CLASSES.length ? '取消全選' : '全選所有班級'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {GRADES.map((grade) => {
          const gradeClasses = CLASSES.filter((c) => c.grade === grade);
          const isGradeAllSelected = gradeClasses.every(c => selected.includes(c.id));
          const selectedCount = gradeClasses.filter(c => selected.includes(c.id)).length;

          return (
            <div key={grade} className="bg-gray-50/50 rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
                <button 
                  onClick={() => toggleGrade(grade)}
                  className="group flex items-center gap-2"
                >
                  <div className={`p-1.5 rounded-full transition-colors ${isGradeAllSelected ? 'bg-[#5daea4] text-white' : 'bg-gray-200 text-gray-400 group-hover:bg-gray-300'}`}>
                    <CheckCircle2 size={14} />
                  </div>
                  <span className="font-bold text-gray-700">{grade === 6 ? '未分年級' : `${grade} 年級`}</span>
                </button>
                <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                  已選 {selectedCount} / {gradeClasses.length}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {gradeClasses.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => toggleClass(cls.id)}
                    className={`flex items-center justify-center py-2 px-3 rounded-lg border-2 text-sm transition-all ${
                      selected.includes(cls.id)
                      ? 'border-[#5daea4] bg-white text-[#5daea4] font-bold shadow-sm'
                      : 'border-transparent bg-white text-gray-500 hover:border-gray-200 hover:text-gray-700'
                    }`}
                  >
                    {cls.name}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Step2ClassSelection;
