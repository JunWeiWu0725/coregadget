import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [appData, setAppData] = useState({

        studentID: null,
        semester: '',
        rankType: null,
        subject: null,
        subjectType: null,

        domain: null,
        period: null,
        credit: null,
        o_score: null,
        p_score: null,
        r_score: null,
        h_score: null,
        y_score: null,
        //specify_score: null,
        score: null,
        semesterText: null,
        entry: null,
        passingStandard: null,
        level: null,
        required_by: null,
        is_required: null,

        currentSemester: null,
        isBack: false,
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
