import React, { useState, useEffect } from 'react';
import { SchoolInfo, FormErrors } from './types';
import { validateSchoolInfo } from './validation';

// 宣告 gadget 全域物件的型別
declare global {
  interface Window {
    gadget: {
      getContract: (contractName: string) => {
        send: (options: {
          service: string;
          body: string;
          result: (response: any, error: any, http: any) => void;
        }, callback?: () => void) => void;
      };
    };
  }
}

// 初始化空白表單
const initialFormData: SchoolInfo = {
  Code: '',
  DefaultSchoolYear: 0,
  DefaultSemester: 1,
  WebUrl: '',
  ChineseName: '',
  EnglishName: '',
  Address: '',
  EnglishAddress: '',
  Telephone: '',
  Fax: '',
  ChancellorChineseName: '',
  ChancellorEnglishName: '',
  EduDirectorName: '',
  StuDirectorName: '',
};

const App: React.FC = () => {
  // 表單狀態
  const [formData, setFormData] = useState<SchoolInfo>(initialFormData);
  // 錯誤訊息狀態
  const [errors, setErrors] = useState<FormErrors>({});
  // 提交狀態
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // 提交結果訊息
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  // 學校版本資訊（用於 WebURL 相關操作）
  const [schoolVersion, setSchoolVersion] = useState<{
    OldWebURL: string;
    BannerURL: string;
    SchoolUrlUID: string;
  }>({
    OldWebURL: '',
    BannerURL: '',
    SchoolUrlUID: ''
  });

  // 初始化 gadget 連線
  const getConnection = () => {
    if (typeof window !== 'undefined' && window.gadget) {
      return window.gadget.getContract("ischool.CampusLite.staff");
    }
    return null;
  };

  const getConnection2 = () => {
    if (typeof window !== 'undefined' && window.gadget) {
      return window.gadget.getContract("1campus.mobile.v2.admin");
    }
    return null;
  };

  // 取得學校網址
  const getWebURL = () => {
    const connection2 = getConnection2();
    if (!connection2) return;

    connection2.send({
      service: "_.GetSchoolVision",
      body: '',
      result: function (response: any, error: any, _http: any) {
        const newSchoolVersion = {
          OldWebURL: '',
          BannerURL: '',
          SchoolUrlUID: ''
        };

        if (error !== null) {
          setErrorMessage('GetSchoolVision', error);
        } else {
          if (response.Response) {
            newSchoolVersion.OldWebURL = response.Response.weburl || '';
            newSchoolVersion.BannerURL = response.Response.bannerurl || '';
            newSchoolVersion.SchoolUrlUID = response.Response.uid || '';

            setSchoolVersion(newSchoolVersion);
            setFormData(prev => ({
              ...prev,
              WebUrl: response.Response.weburl || ''
            }));
          }
        }
      }
    });
  };

  // 載入學校資料
  const loadSchoolData = () => {
    const connection = getConnection();
    if (!connection) {
      console.warn('Gadget connection not available');
      return;
    }

    connection.send({
      service: "schoolInformation.GetSchoolInfo",
      body: '',
      result: function (response: any, error: any, _http: any) {
        if (error !== null) {
          setErrorMessage('GetSchoolInfo', error);
        } else {
          if (response.Response?.SchoolInfo) {
            const newFormData = { ...initialFormData };

            response.Response.SchoolInfo.forEach((item: any) => {
              if (item.Name === '學校資訊') {
                if (item.Content?.SchoolInformation) {
                  // 處理 SchoolInformation，可能是物件或陣列
                  const schoolInfoArray = Array.isArray(item.Content.SchoolInformation)
                    ? item.Content.SchoolInformation
                    : [item.Content.SchoolInformation];

                  schoolInfoArray.forEach((schoolInfo: any) => {
                    newFormData.ChineseName = schoolInfo.ChineseName || '';
                    newFormData.EnglishName = schoolInfo.EnglishName || '';
                    newFormData.Address = schoolInfo.Address || '';
                    newFormData.EnglishAddress = schoolInfo.EnglishAddress || '';
                    newFormData.Code = schoolInfo.Code || '';
                    newFormData.Fax = schoolInfo.Fax || '';
                    newFormData.Telephone = schoolInfo.Telephone || '';
                    newFormData.ChancellorChineseName = schoolInfo.ChancellorChineseName || '';
                    newFormData.ChancellorEnglishName = schoolInfo.ChancellorEnglishName || '';
                    newFormData.EduDirectorName = schoolInfo.EduDirectorName || '';
                    newFormData.StuDirectorName = schoolInfo.StuDirectorName || '';
                  });
                }
              }
              if (item.Name === '系統設定') {
                if (item.Content?.SystemConfig) {
                  // 處理 SystemConfig，可能是物件或陣列
                  const systemConfigArray = Array.isArray(item.Content.SystemConfig)
                    ? item.Content.SystemConfig
                    : [item.Content.SystemConfig];

                  systemConfigArray.forEach((systemConfig: any) => {
                    newFormData.DefaultSchoolYear = parseInt(systemConfig.DefaultSchoolYear) || 0;
                    newFormData.DefaultSemester = parseInt(systemConfig.DefaultSemester) || 1;
                  });
                }
              }
            });

            setFormData(newFormData);
          }
        }
      }
    }, getWebURL);
  };

  // 設定學校 WebURL
  const setWebUrl = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const connection2 = getConnection2();
      if (!connection2) {
        resolve();
        return;
      }

      connection2.send({
        service: "_.SetSchoolVision",
        body: `<Request><UID>${schoolVersion.SchoolUrlUID}</UID><BannerUrl>${schoolVersion.BannerURL}</BannerUrl><WebUrl>${formData.WebUrl || ''}</WebUrl></Request>`,
        result: function (response: any, error: any, _http: any) {
          if (error !== null) {
            setErrorMessage('SetSchoolVision', error);
            // 錯誤時恢復舊值
            setFormData(prev => ({
              ...prev,
              WebUrl: schoolVersion.OldWebURL
            }));
            reject(error);
          } else {
            if (response.successItem) {
              // 成功新增後把 UID 記下
              setSchoolVersion(prev => ({
                ...prev,
                SchoolUrlUID: response.successItem.uid || ''
              }));
            }
            resolve();
          }
        }
      });
    });
  };

  // 儲存學校資料
  const saveSchoolInfo = async () => {
    const connection = getConnection();
    if (!connection) {
      setSubmitMessage({
        type: 'error',
        text: 'Gadget 連線不可用，請重新整理頁面。'
      });
      return;
    }

    const request = [
      '<SchoolInfo>' +
      '    <Field>' +
      '        <Content>' +
      '            <SystemConfig>' +
      '                <DefaultSchoolYear>' + (formData.DefaultSchoolYear || 100) + '</DefaultSchoolYear>' +
      '                <DefaultSemester>' + (formData.DefaultSemester || 1) + '</DefaultSemester>' +
      '            </SystemConfig>' +
      '        </Content>' +
      '    </Field>' +
      '    <Condition>' +
      '        <Name>系統設定</Name>' +
      '    </Condition>' +
      '</SchoolInfo>',

      '<SchoolInfo>' +
      '    <Field>' +
      '        <Content>' +
      '          <SchoolInformation>' +
      '           <ChineseName>' + (formData.ChineseName || '') + '</ChineseName>' +
      '           <EnglishName>' + (formData.EnglishName || '') + '</EnglishName>' +
      '           <Address>' + (formData.Address || '') + '</Address>' +
      '           <EnglishAddress>' + (formData.EnglishAddress || '') + '</EnglishAddress>' +
      '           <Code>' + (formData.Code || '') + '</Code>' +
      '           <Fax>' + (formData.Fax || '') + '</Fax>' +
      '           <Telephone>' + (formData.Telephone || '') + '</Telephone>' +
      '           <ChancellorChineseName>' + (formData.ChancellorChineseName || '') + '</ChancellorChineseName>' +
      '           <ChancellorEnglishName>' + (formData.ChancellorEnglishName || '') + '</ChancellorEnglishName>' +
      '           <EduDirectorName>' + (formData.EduDirectorName || '') + '</EduDirectorName>' +
      '           <StuDirectorName>' + (formData.StuDirectorName || '') + '</StuDirectorName>' +
      '          </SchoolInformation>' +
      '        </Content>' +
      '    </Field>' +
      '    <Condition>' +
      '        <Name>學校資訊</Name>' +
      '    </Condition>' +
      '</SchoolInfo>'
    ];

    return new Promise<void>((resolve, reject) => {
      connection.send({
        service: "schoolInformation.SetSchoolInfo",
        body: '<Request>' + request.join('') + '</Request>',
        result: function (_response: any, error: any, _http: any) {
          if (error !== null) {
            setErrorMessage('SetSchoolInfo', error);
            reject(error);
          } else {
            setSubmitMessage({
              type: 'success',
              text: '學校基本資料儲存成功！'
            });
            resolve();
          }
        }
      }, () => setWebUrl());
    });
  };

  // 設定錯誤訊息
  const setErrorMessage = (serviceName: string, error: any) => {
    const errorMsg = `呼叫服務失敗或網路異常，請稍候重試！(${serviceName})`;
    setSubmitMessage({
      type: 'error',
      text: errorMsg
    });
    console.error(`${serviceName} Error:`, error);
  };

  // 從 gadget 載入資料
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading school data...');
        loadSchoolData();
      } catch (error) {
        console.error('Error loading data:', error);
        setSubmitMessage({
          type: 'error',
          text: '載入資料失敗，請重新整理頁面。'
        });
      }
    };

    loadData();
  }, []);

  // 處理輸入變更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // 特別處理數字型別的欄位
    if (name === 'DefaultSchoolYear') {
      // 只允許輸入數字
      if (value === '' || /^\d+$/.test(value)) {
        setFormData({
          ...formData,
          [name]: value ? parseInt(value, 10) : 0
        });
      }
    } else if (name === 'DefaultSemester') {
      setFormData({
        ...formData,
        [name]: parseInt(value, 10)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }

    // 清除特定欄位的錯誤訊息
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 如果正在提交中，防止重複提交
    if (isSubmitting) {
      return;
    }

    // 開始提交時立即清除之前的訊息
    setSubmitMessage(null);

    // 驗證表單
    const validationErrors = validateSchoolInfo(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // 驗證失敗時顯示錯誤訊息
      setSubmitMessage({
        type: 'error',
        text: '資料驗證失敗，請檢查標示錯誤的欄位！'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await saveSchoolInfo();
    } catch (error) {
      console.error('Error submitting data:', error);
      // 錯誤訊息已在 saveSchoolInfo 中設定
    } finally {
      setIsSubmitting(false);
    }
  };

  // 處理重設按鈕
  const handleReset = () => {
    // 重新載入原始資料
    loadSchoolData();
    setErrors({});
    setSubmitMessage(null);
  };

  return (
    <div className="main-content">
      {/* 頁面標題區塊 */}
      <div className="text-center mb-12">
        <h1 className="form-header">學校基本資料</h1>
        <p className="form-subtitle">請填寫以下學校相關資訊（標有 <span style={{ color: '#f43f5e' }}>*</span> 號者為必填欄位）</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* 基本資訊區塊 */}
        <div className="form-card">
          <div className="section-header">
            <svg className="section-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h2 className="section-title">基本資訊</h2>
          </div>

          <div className="form-grid form-grid-3">
            <div className="form-control">
              <label className="form-label">
                學校代碼
                <span className="form-label-required">*</span>
              </label>
              <input
                type="text"
                name="Code"
                placeholder="請輸入學校代碼"
                className={`form-input ${errors.Code ? 'error' : ''}`}
                value={formData.Code}
                onChange={handleChange}
              />
              {errors.Code && <span className="form-error">{errors.Code}</span>}
            </div>

            <div className="form-control">
              <label className="form-label">
                學年度
                <span className="form-label-required">*</span>
              </label>
              <input
                type="text"
                name="DefaultSchoolYear"
                placeholder="例如：112"
                className={`form-input ${errors.DefaultSchoolYear ? 'error' : ''}`}
                value={formData.DefaultSchoolYear || ''}
                onChange={handleChange}
              />
              {errors.DefaultSchoolYear && <span className="form-error">{errors.DefaultSchoolYear}</span>}
            </div>

            <div className="form-control">
              <label className="form-label">
                學期
                <span className="form-label-required">*</span>
              </label>
              <select
                name="DefaultSemester"
                className={`form-select ${errors.DefaultSemester ? 'error' : ''}`}
                value={formData.DefaultSemester}
                onChange={handleChange}
              >
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
              {errors.DefaultSemester && <span className="form-error">{errors.DefaultSemester}</span>}
            </div>
          </div>

          <div className="form-divider"></div>

          <div className="form-control">
            <label className="form-label">校園首頁網址</label>
            <div className={`input-group ${errors.WebUrl ? 'error' : ''}`}>
              <div className="input-group-prefix">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <input
                type="text"
                name="WebUrl"
                placeholder="https://example.edu.tw"
                className={`form-input ${errors.WebUrl ? 'error' : ''}`}
                value={formData.WebUrl}
                onChange={handleChange}
              />
            </div>
            {errors.WebUrl && <span className="form-error">{errors.WebUrl}</span>}
          </div>
        </div>

        {/* 學校名稱與地址區塊 */}
        <div className="form-card">
          <div className="section-header">
            <svg className="section-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h2 className="section-title">學校名稱與地址</h2>
          </div>

          <div className="form-control">
            <label className="form-label">學校中文名稱</label>
            <input
              type="text"
              name="ChineseName"
              placeholder="例如：市立美麗國中"
              className={`form-input ${errors.ChineseName ? 'error' : ''}`}
              value={formData.ChineseName}
              onChange={handleChange}
            />
            {errors.ChineseName && <span className="form-error">{errors.ChineseName}</span>}
          </div>

          <div className="form-control">
            <label className="form-label">學校英文名稱</label>
            <input
              type="text"
              name="EnglishName"
              placeholder="請輸入英文名稱"
              className={`form-input ${errors.EnglishName ? 'error' : ''}`}
              value={formData.EnglishName}
              onChange={handleChange}
            />
            {errors.EnglishName && <span className="form-error">{errors.EnglishName}</span>}
          </div>

          <div className="form-control">
            <label className="form-label">學校中文地址</label>
            <input
              type="text"
              name="Address"
              placeholder="請輸入完整中文地址"
              className={`form-input ${errors.Address ? 'error' : ''}`}
              value={formData.Address}
              onChange={handleChange}
            />
            {errors.Address && <span className="form-error">{errors.Address}</span>}
          </div>

          <div className="form-control">
            <label className="form-label">學校英文地址</label>
            <input
              type="text"
              name="EnglishAddress"
              placeholder="請輸入英文地址"
              className={`form-input ${errors.EnglishAddress ? 'error' : ''}`}
              value={formData.EnglishAddress}
              onChange={handleChange}
            />
            {errors.EnglishAddress && <span className="form-error">{errors.EnglishAddress}</span>}
          </div>

          <div className="form-grid form-grid-2">
            <div className="form-control">
              <label className="form-label">學校電話</label>
              <input
                type="text"
                name="Telephone"
                placeholder="例如：(02)1234-5678"
                className={`form-input ${errors.Telephone ? 'error' : ''}`}
                value={formData.Telephone}
                onChange={handleChange}
              />
              {errors.Telephone && <span className="form-error">{errors.Telephone}</span>}
            </div>

            <div className="form-control">
              <label className="form-label">學校傳真</label>
              <input
                type="text"
                name="Fax"
                placeholder="例如：(02)1234-5679"
                className={`form-input ${errors.Fax ? 'error' : ''}`}
                value={formData.Fax}
                onChange={handleChange}
              />
              {errors.Fax && <span className="form-error">{errors.Fax}</span>}
            </div>
          </div>
        </div>

        {/* 校長與主任資訊區塊 */}
        <div className="form-card">
          <div className="section-header">
            <svg className="section-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="section-title">校長與主任資訊</h2>
          </div>

          <div className="form-grid form-grid-2">
            <div className="form-control">
              <label className="form-label">校長中文姓名</label>
              <input
                type="text"
                name="ChancellorChineseName"
                placeholder="請輸入校長中文姓名"
                className={`form-input ${errors.ChancellorChineseName ? 'error' : ''}`}
                value={formData.ChancellorChineseName}
                onChange={handleChange}
              />
              {errors.ChancellorChineseName && <span className="form-error">{errors.ChancellorChineseName}</span>}
            </div>

            <div className="form-control">
              <label className="form-label">校長英文姓名</label>
              <input
                type="text"
                name="ChancellorEnglishName"
                placeholder="請輸入校長英文姓名"
                className={`form-input ${errors.ChancellorEnglishName ? 'error' : ''}`}
                value={formData.ChancellorEnglishName}
                onChange={handleChange}
              />
              {errors.ChancellorEnglishName && <span className="form-error">{errors.ChancellorEnglishName}</span>}
            </div>
          </div>

          <div className="form-grid form-grid-2">
            <div className="form-control">
              <label className="form-label">教務主任姓名</label>
              <input
                type="text"
                name="EduDirectorName"
                placeholder="請輸入教務主任姓名"
                className={`form-input ${errors.EduDirectorName ? 'error' : ''}`}
                value={formData.EduDirectorName}
                onChange={handleChange}
              />
              {errors.EduDirectorName && <span className="form-error">{errors.EduDirectorName}</span>}
            </div>

            <div className="form-control">
              <label className="form-label">學務主任姓名</label>
              <input
                type="text"
                name="StuDirectorName"
                placeholder="請輸入學務主任姓名"
                className={`form-input ${errors.StuDirectorName ? 'error' : ''}`}
                value={formData.StuDirectorName}
                onChange={handleChange}
              />
              {errors.StuDirectorName && <span className="form-error">{errors.StuDirectorName}</span>}
            </div>
          </div>
        </div>

        {/* 提交訊息顯示 */}
        {submitMessage && (
          <div className={`alert ${submitMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {submitMessage.type === 'success' ? (
              <svg className="alert-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="alert-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{submitMessage.text}</span>
          </div>
        )}

        {/* 表單按鈕區塊 */}
        <div className="form-footer">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleReset}
            disabled={isSubmitting}
          >
            <svg className="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            重設
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="loading-spinner"></div>
                儲存中...
              </>
            ) : (
              <>
                <svg className="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                儲存
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default App;