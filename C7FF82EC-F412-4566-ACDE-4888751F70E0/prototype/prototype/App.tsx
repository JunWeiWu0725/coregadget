
import React, { useState } from 'react';
import { ChevronRight, Download, CheckCircle, ArrowLeft, School, Layers, ListChecks } from 'lucide-react';
import { Step, SelectionState } from './types';
import Step1YearSemester from './components/Step1YearSemester';
import Step2ClassSelection from './components/Step2ClassSelection';
import Step3FieldSelection from './components/Step3FieldSelection';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [state, setState] = useState<SelectionState>({
    year: '113',
    semester: '1',
    selectedClasses: [],
    selectedFields: []
  });

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep((prev) => (prev + 1) as Step);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => (prev - 1) as Step);
  };

  const handleExport = () => {
    alert('正在產生報表，請稍後...');
  };

  const steps = [
    { id: 1, name: '學年度學期', icon: <School size={18} /> },
    { id: 2, name: '選擇班級', icon: <Layers size={18} /> },
    { id: 3, name: '選擇題目欄位', icon: <ListChecks size={18} /> }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar Placeholder */}
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <div className="text-[#5daea4] font-bold text-xl flex items-center">
            <span className="bg-[#5daea4] text-white p-1 rounded mr-2">1C</span>
            1Campus | 佳樺國中
          </div>
          <nav className="hidden md:flex space-x-6 text-sm font-medium text-gray-500">
            <button className="hover:text-[#5daea4]">輔導學生</button>
            <button className="text-[#5daea4] border-b-2 border-[#5daea4] pb-1">輔導統計</button>
            <button className="hover:text-[#5daea4]">個案資料</button>
            <button className="hover:text-[#5daea4]">心理測驗</button>
          </nav>
        </div>
        <div className="flex items-center space-x-3 text-sm text-gray-600">
          <span>教師 ▾</span>
          <div className="w-8 h-8 rounded-full bg-yellow-400"></div>
          <span>佳樺</span>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             匯出填寫內容
          </h1>
          {currentStep === 3 && (
            <button
              onClick={handleExport}
              disabled={state.selectedClasses.length === 0 || state.selectedFields.length === 0}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg shadow-md transition-all font-medium ${
                state.selectedClasses.length === 0 || state.selectedFields.length === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
              }`}
            >
              <Download size={18} />
              產生報表
            </button>
          )}
        </div>

        {/* Improved Stepper */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-8">
          <div className="flex items-center justify-center space-x-2 md:space-x-12">
            {steps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div 
                  className={`flex items-center gap-3 transition-all ${
                    currentStep === step.id 
                    ? 'text-[#5daea4] scale-105 font-semibold' 
                    : currentStep > step.id ? 'text-gray-400' : 'text-gray-400'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    currentStep === step.id ? 'border-[#5daea4] bg-[#5daea4]/10' : 
                    currentStep > step.id ? 'bg-[#5daea4] border-[#5daea4] text-white' : 'border-gray-200'
                  }`}>
                    {currentStep > step.id ? <CheckCircle size={20} /> : step.icon}
                  </div>
                  <span className="hidden sm:inline">Step {step.id} {step.name}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`h-[2px] w-8 md:w-20 rounded ${currentStep > step.id ? 'bg-[#5daea4]' : 'bg-gray-100'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm border min-h-[400px] p-8 transition-all duration-300">
          {currentStep === 1 && (
            <Step1YearSemester 
              value={{ year: state.year, semester: state.semester }}
              onChange={(y, s) => setState({ ...state, year: y, semester: s })}
            />
          )}
          {currentStep === 2 && (
            <Step2ClassSelection
              selected={state.selectedClasses}
              onChange={(classes) => setState({ ...state, selectedClasses: classes })}
            />
          )}
          {currentStep === 3 && (
            <Step3FieldSelection
              selected={state.selectedFields}
              onChange={(fields) => setState({ ...state, selectedFields: fields })}
            />
          )}
        </div>

        {/* Navigation Controls */}
        <div className="mt-8 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border sticky bottom-6 z-10">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-colors ${
              currentStep === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ArrowLeft size={18} />
            上一步
          </button>

          <div className="flex-1 flex justify-center">
             <span className="text-sm text-gray-400">
               已選擇 {state.selectedClasses.length} 個班級 / {state.selectedFields.length} 個欄位
             </span>
          </div>

          {currentStep < 3 && (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-8 py-2.5 bg-[#5daea4] hover:bg-[#4a8d84] text-white rounded-lg font-medium shadow-md transition-all active:scale-95"
            >
              下一步
              <ChevronRight size={18} />
            </button>
          )}
          {currentStep === 3 && (
            <div className="w-32"></div> // Spacer to keep layout balanced
          )}
        </div>
      </main>

      <footer className="py-8 text-center text-gray-400 text-xs">
        &copy; 2024 1Campus 佳樺國中 輔導系統. All rights reserved.
      </footer>
    </div>
  );
};

export default App;
