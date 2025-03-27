import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [appData, setAppData] = useState({
    studentID: null,
    examID: null,
    rankType: null,
    courseID: null,
    semester: null,
    subject: null,
    passingStandard: 60,
    isBack: false,
    score: null,
    scoreType: '',
    currentSemester: '',
  });

  const setAppDataValues = (data) => {
    setAppData({ ...appData, ...data });
  };

  return (
    <AppContext.Provider value={{ appData, setAppDataValues }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(AppContext);
};
