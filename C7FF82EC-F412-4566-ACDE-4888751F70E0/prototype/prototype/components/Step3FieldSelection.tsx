
import React from 'react';
import { FIELD_CATEGORIES, FIELDS } from '../constants';
import { ListChecks, AlertCircle, Info } from 'lucide-react';

interface Props {
  selected: string[];
  onChange: (selected: string[]) => void;
}

const Step3FieldSelection: React.FC<Props> = ({ selected, onChange }) => {
  const MAX_FIELDS = 10;

  const toggleField = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id));
    } else {
      if (selected.length >= MAX_FIELDS) {
        return;
      }
      onChange([...selected, id]);
    }
  };

  const toggleCategory = (category: string) => {
    const categoryFieldIds = FIELDS.filter((f) => f.category === category).map((f) => f.id);
    const allSelected = categoryFieldIds.every((id) => selected.includes(id));

    if (allSelected) {
      onChange(selected.filter((id) => !categoryFieldIds.includes(id)));
    } else {
      // Respect the max limit
      const currentlyNotInSelection = categoryFieldIds.filter(id => !selected.includes(id));
      const remainingSlots = MAX_FIELDS - selected.length;
      const canAdd = currentlyNotInSelection.slice(0, remainingSlots);
      onChange([...selected, ...canAdd]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2">
            <ListChecks size={20} className="text-[#5daea4]" />
            選擇匯出欄位
          </h2>
          <p className="text-gray-400 text-sm">點擊分類標題可快速勾選欄位</p>
        </div>
        
        <div className={`flex items-center gap-3 px-4 py-2 rounded-full border ${
          selected.length >= MAX_FIELDS ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-blue-50 border-blue-100 text-blue-600'
        }`}>
          <AlertCircle size={16} />
          <span className="text-sm font-bold">
            已選擇 {selected.length} / {MAX_FIELDS} 個欄位
          </span>
        </div>
      </div>

      {selected.length === MAX_FIELDS && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 text-gray-500 rounded-lg text-xs italic">
           <Info size={14} />
           目前已達欄位上限 10 個。若需選擇其他欄位，請先取消現有選取。
        </div>
      )}

      <div className="space-y-8">
        {FIELD_CATEGORIES.map((category) => {
          const categoryFields = FIELDS.filter((f) => f.category === category);
          const isCatSelected = categoryFields.every(f => selected.includes(f.id));

          return (
            <div key={category} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full text-left px-5 py-3 bg-gray-50/80 hover:bg-gray-100/80 flex items-center justify-between transition-colors"
              >
                <span className="font-bold text-gray-700">{category}</span>
                <span className="text-xs text-blue-500 font-medium">點擊全選</span>
              </button>
              
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {categoryFields.map((field) => (
                  <label
                    key={field.id}
                    className={`group relative flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selected.includes(field.id)
                      ? 'border-[#5daea4] bg-[#5daea4]/5 text-[#5daea4] font-medium'
                      : 'border-gray-50 bg-white text-gray-500 hover:border-gray-200'
                    } ${
                      !selected.includes(field.id) && selected.length >= MAX_FIELDS ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selected.includes(field.id)}
                      onChange={() => toggleField(field.id)}
                      disabled={!selected.includes(field.id) && selected.length >= MAX_FIELDS}
                    />
                    <div className={`w-4 h-4 rounded mr-2 flex items-center justify-center border ${
                      selected.includes(field.id) ? 'bg-[#5daea4] border-[#5daea4]' : 'bg-white border-gray-300'
                    }`}>
                      {selected.includes(field.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm">{field.name}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Step3FieldSelection;
