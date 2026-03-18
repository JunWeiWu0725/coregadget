
import React from 'react';
import { CalendarDays, Clock } from 'lucide-react';

interface Props {
  value: { year: string; semester: string };
  onChange: (year: string, semester: string) => void;
}

const Step1YearSemester: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="max-w-md mx-auto space-y-8 py-10">
      <div className="text-center mb-10">
        <h2 className="text-xl font-bold text-gray-700">選擇匯出範圍</h2>
        <p className="text-gray-400 text-sm mt-2">請指定欲匯出資料的對應學年度與學期</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
            <CalendarDays size={16} className="text-[#5daea4]" />
            學年度
          </label>
          <select 
            value={value.year}
            onChange={(e) => onChange(e.target.value, value.semester)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#5daea4] transition-all"
          >
            <option value="113">113 學年度</option>
            <option value="112">112 學年度</option>
            <option value="111">111 學年度</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
            <Clock size={16} className="text-[#5daea4]" />
            學期
          </label>
          <div className="grid grid-cols-2 gap-4">
            {['1', '2'].map((s) => (
              <button
                key={s}
                onClick={() => onChange(value.year, s)}
                className={`py-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                  value.semester === s 
                  ? 'border-[#5daea4] bg-[#5daea4]/5 text-[#5daea4] font-bold' 
                  : 'border-gray-100 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <span className="text-xs uppercase tracking-widest opacity-70">Semester</span>
                <span className="text-lg">第 {s} 學期</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1YearSemester;
