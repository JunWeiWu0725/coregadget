// src/App.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import html2canvas from 'html2canvas';
import './App.css';
import { FaLock, FaUnlock } from 'react-icons/fa';

function App() {

  // --- State 變數 ---
  const [rows, setRows] = useState(6); // 預設行數
  const [cols, setCols] = useState(6); // 預設列數
  const [students, setStudents] = useState(() => Array(rows * cols).fill(null)); // 座位上的學生紀錄
  const [draggedStudent, setDraggedStudent] = useState(null); // 拖曳中的學生 (桌面版)
  const [draggedSeatIndex, setDraggedSeatIndex] = useState(null); // 拖曳來源座位索引 (桌面版)
  const [allStudents, setAllStudents] = useState([]); // 當前選擇來源的完整學生列表 (顯示在右側)
  const [selectedStudent, setSelectedStudent] = useState(null); // 點選選中的學生 (行動版)
  const [isMobile, setIsMobile] = useState(false); // 是否為行動裝置檢視
  const [viewportWidth, setViewportWidth] = useState(() => {
    if (typeof window === 'undefined') {
      return 1024;
    }
    return window.innerWidth || document.documentElement.clientWidth || 1024;
  });
  const [lockedSeats, setLockedSeats] = useState(new Set()); // 鎖定的座位索引集合
  const [isImportModalOpen, setIsImportModalOpen] = useState(false); // 匯入視窗是否開啟
  const [importText, setImportText] = useState(''); // 匯入視窗的文字內容
  const [isLoading, setIsLoading] = useState(false); // 是否正在載入資料

  // --- 與資料來源相關的 State ---
  const [serviceData, setServiceData] = useState(null); // 班級資料 (結構: { className: string, students: Student[] }[])
  const [classList, setClassList] = useState([]); // 班級名稱列表
  const [selectedClass, setSelectedClass] = useState(''); // 當前選中的班級
  const [courseServiceData, setCourseServiceData] = useState(null); // 課程資料 (假設結構類似班級)
  const [courseList, setCourseList] = useState([]); // 課程名稱列表
  const [selectedCourse, setSelectedCourse] = useState(''); // 當前選中的課程
  const [dataSourceType, setDataSourceType] = useState(''); // 資料來源類型: 'class' 或 'course' 或 ''

  const [ _connection, setConnection ] = useState();
  const [ _connectionPhoto, setConnectionPhoto ] = useState();
  const [ sessionID, setSessionID ] =  useState('');
  const [ podiumPosition, setPodiumPosition ] = useState('top-lr');

  const photoCacheRef = useRef(new Map());
  const photoLoadingRef = useRef(new Map());
  const [, forcePhotoCacheUpdate] = useState(0); // 觸發重新渲染用



  // --- Ref ---
  const seatChartRef = useRef(null); // 指向座位表區域，用於截圖

  const normalizeSeatNo = (value) => {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const createStudentRecord = ({ name = '', seatNo = null, gender = '', studentID = '' }, options = {}) => {
    const normalizedName = (name || '').trim() || '未命名';
    const normalizedSeatNo = normalizeSeatNo(seatNo);
    const normalizedGender = gender || '';
    const normalizedId = studentID ? String(studentID).trim() : '';
    const displayName = normalizedSeatNo ? `${normalizedName} (${normalizedSeatNo})` : normalizedName;
    const key = normalizedId || options.manualKey || displayName;
    return {
      id: normalizedId || null,
      key,
      name: normalizedName,
      seatNo: normalizedSeatNo,
      gender: normalizedGender,
      displayName,
      studentID: normalizedId || null,
    };
  };

  const getStudentKey = (student) => (student ? student.key || student.id || student.displayName : null);

  const areSameStudent = (a, b) => {
    if (!a || !b) return a === b;
    return getStudentKey(a) === getStudentKey(b);
  };

  const parseManualEntry = (raw) => {
    const line = (raw || '').trim();
    if (!line) return null;
    const match = line.match(/^(.*)\s\((\d+)\)$/);
    let name = line;
    let seatNo = null;
    if (match && match[1]) {
      name = match[1].trim();
      seatNo = normalizeSeatNo(match[2]);
    }
    const manualKey = `manual-${line}`;
    return createStudentRecord({ name, seatNo, gender: '', studentID: '' }, { manualKey });
  };

  const buildStudentKeySet = (collection) => {
    const keySet = new Set();
    collection.forEach((student) => {
      const key = getStudentKey(student);
      if (key) keySet.add(key);
    });
    return keySet;
  };

  // --- 計算變數 ---
  // totalSeats 會在 rows 或 cols 變化時自動重新計算
  const totalSeats = rows * cols;
  const seatedStudentCount = students.filter(Boolean).length; // 已入座學生數
  const assignedKeySet = buildStudentKeySet(students.filter(Boolean));
  const availableStudents = allStudents.filter(student => !assignedKeySet.has(getStudentKey(student))); // 右側列表顯示的可安排學生
  const numberOfStudents = allStudents.length; // 當前來源的學生總數

  const {
    seatPositions,
    seatOrderMap,
    isPodiumTop,
  } = useMemo(() => {
    const isTop = podiumPosition.startsWith('top');
    const isLR = podiumPosition.endsWith('lr');
    const positions = [];
    const orderMap = new Map();
    if (rows > 0 && cols > 0) {
      const rowStart = isTop ? 0 : rows - 1;
      const rowEnd = isTop ? rows : -1;
      const rowStep = isTop ? 1 : -1;
      const colStart = isLR ? 0 : cols - 1;
      const colEnd = isLR ? cols : -1;
      const colStep = isLR ? 1 : -1;
      for (let r = rowStart; isTop ? r < rowEnd : r > rowEnd; r += rowStep) {
        for (let c = colStart; isLR ? c < colEnd : c > colEnd; c += colStep) {
          const index = r * cols + c;
          positions.push({ r, c, index });
          orderMap.set(index, positions.length);
        }
      }
    }
    return {
      seatPositions: positions,
      seatOrderMap: orderMap,
      isPodiumTop: isTop,
    };
  }, [rows, cols, podiumPosition]);

  const seatBaseSize = useMemo(() => {
    if (!isMobile) {
      return 90;
    }
    if (cols <= 0) {
      return 60;
    }
    const horizontalPadding = 32;
    const gapSize = 6;
    const availableWidth = Math.max(viewportWidth - horizontalPadding, cols * 40);
    const rawCellSize = Math.floor((availableWidth - gapSize * (cols - 1)) / Math.max(cols, 1));
    const minCellSize = 56;
    const maxCellSize = 96;
    return Math.max(minCellSize, Math.min(rawCellSize, maxCellSize));
  }, [cols, viewportWidth, isMobile]);

  const gridStyle = useMemo(() => {
    const gapSize = isMobile ? 6 : 10;
    const style = { gap: `${gapSize}px` };
    if (cols > 0) {
      if (isMobile) {
        style.gridTemplateColumns = `repeat(${cols}, ${seatBaseSize}px)`;
        style['--seat-size'] = `${seatBaseSize}px`;
      } else {
        style.gridTemplateColumns = `repeat(${cols}, 90px)`;
        style['--seat-size'] = '90px';
      }
    }
    return style;
  }, [cols, seatBaseSize, isMobile]);

  const photoAccessPoint = typeof _connectionPhoto?.getAccessPoint === 'function'
    ? _connectionPhoto.getAccessPoint()
    : '';

  const getStudentPhotoUrl = useCallback(
    (student) => {
      if (!student || !student.studentID || !photoAccessPoint || !sessionID) return '';
      return `${photoAccessPoint}/GetStudentPhoto?stt=Session&sessionid=${sessionID}&parser=spliter&content=StudentID:${student.studentID}`;
    },
    [photoAccessPoint, sessionID]
  );

  const ensurePhotoCached = useCallback(
    async (student) => {
      if (!student) return null;
      const key = getStudentKey(student);
      if (!key) return null;

      const cached = photoCacheRef.current.get(key);
      if (cached) return cached;

      const url = getStudentPhotoUrl(student);
      if (!url) return null;

      if (photoLoadingRef.current.has(key)) {
        return photoLoadingRef.current.get(key);
      }

      const loadPromise = (async () => {
        try {
          const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
          if (!response.ok) throw new Error(`無法載入學生照片: ${response.status}`);
          const blob = await response.blob();
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error || new Error('無法讀取照片資料'));
            reader.readAsDataURL(blob);
          });
          photoCacheRef.current.set(key, dataUrl);
          forcePhotoCacheUpdate((v) => v + 1);
          return dataUrl;
        } catch (error) {
          console.error(`載入學生照片失敗 (${student.name || key}):`, error);
          return null;
        } finally {
          photoLoadingRef.current.delete(key);
        }
      })();

      photoLoadingRef.current.set(key, loadPromise);
      return loadPromise;
    },
    [getStudentPhotoUrl]
  );

  const preloadSeatPhotos = useCallback(async () => {
    if (!photoAccessPoint || !sessionID) return;
    const targetMap = new Map();
    const collect = (student) => {
      if (!student) return;
      const key = getStudentKey(student);
      if (!key || targetMap.has(key)) return;
      targetMap.set(key, student);
    };
    students.forEach(collect);
    allStudents.forEach(collect);
    if (targetMap.size === 0) return;
    await Promise.all(Array.from(targetMap.values()).map((student) => ensurePhotoCached(student)));
  }, [students, allStudents, ensurePhotoCached, photoAccessPoint, sessionID]);

  const applyCachedPhotosToDom = useCallback(async () => {
    if (!seatChartRef.current) return () => {};
    const updatedNodes = [];
    const pendingLoads = [];
    const imgNodes = seatChartRef.current.querySelectorAll('img[data-student-key]');
    imgNodes.forEach((img) => {
      const key = img.dataset.studentKey;
      if (!key) return;
      const cached = photoCacheRef.current.get(key);
      if (!cached || img.src === cached) return;
      updatedNodes.push({ node: img, originalSrc: img.src });
      img.src = cached;
      if (img.decode) {
        pendingLoads.push(img.decode().catch(() => {}));
      } else if (!img.complete) {
        pendingLoads.push(new Promise((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }));
      }
    });
    if (pendingLoads.length > 0) {
      try {
        await Promise.all(pendingLoads);
      } catch (error) {
        console.warn('等待圖片載入時發生錯誤:', error);
      }
    }
    return () => {
      updatedNodes.forEach(({ node, originalSrc }) => {
        node.src = originalSrc;
      });
    };
  }, [seatChartRef]);



  // --- Gadget 連接 ---
  //const _connection = window.gadget ? window.gadget.getContract("basic.teacher") : null;

  // --- Effects ---

  // Effect 1: 初始載入 Service 資料 (班級和課程)
  useEffect(() => {
    const conn = window.gadget ? window.gadget.getContract("basic.teacher") : null;
    console.log({Connect:conn});
    if (conn) {
        
        conn.ready((x)=>{
            setConnection(conn);
        })
    }

    const connPhoto = window.gadget ? window.gadget.getContract("1campus.mobile.v2.teacher") : null;
    if (connPhoto) {
        
        connPhoto.ready((x)=>{
            setConnectionPhoto(connPhoto);

            connPhoto.send({
                service: "DS.Base.Connect",
                body: { RequestSessionID: '' },
                result: (res, error) => {
                    if (error) { console.error('SessionID Service Error:', error); 
                        return (error); }
                    console.log("Response:", res.SessionID);
                    setSessionID(res.SessionID);
                }
            });
            
        })
    }


  }, []); // 依賴項為空

  useEffect(() => {
    loadInitialData();


  },[ _connection ]);

  // Effect 2: 處理行列數變更
  useEffect(() => {
    const newSize = rows * cols;
    setStudents(prevStudents => {
        const currentStudents = [...prevStudents];
        if (currentStudents.length < newSize) {
            return currentStudents.concat(Array(newSize - currentStudents.length).fill(null));
        } else if (currentStudents.length > newSize) {
            return currentStudents.slice(0, newSize);
        }
        return currentStudents;
    });
    setLockedSeats(prevLocked => {
        const newLocked = new Set();
        for (const index of prevLocked) { if (index < newSize) { newLocked.add(index); } }
        return newLocked;
    });
  }, [rows, cols]);

  // Effect 3: 處理班級或課程變更，更新學生列表
  useEffect(() => {
    // 這裡的 totalSeats 會在 rows 或 cols 改變時更新，所以加入依賴是正確的
    console.log(`Effect 3 觸發: dataSourceType=${dataSourceType}, selectedClass=${selectedClass}, selectedCourse=${selectedCourse}, totalSeats=${totalSeats}`);

    let currentSelection = null;
    let dataToProcess = null;
    let isClassData = false;

    if (dataSourceType === 'class' && selectedClass && serviceData) {
        currentSelection = selectedClass; dataToProcess = serviceData; isClassData = true;
        console.log("準備處理班級資料:", currentSelection);
    } else if (dataSourceType === 'course' && selectedCourse && courseServiceData) {
        currentSelection = selectedCourse; dataToProcess = courseServiceData; isClassData = false;
        console.log("準備處理課程資料:", currentSelection);
    } else {
        console.log("無有效資料來源或選擇，清空學生資料。");
        setAllStudents([]);
        setStudents(Array(totalSeats).fill(null));
        setLockedSeats(new Set());
        return;
    }

    const itemInfo = dataToProcess.find(item =>
        isClassData ? item.className === currentSelection : item.courseName === currentSelection
    );

    if (itemInfo) {
        const studentRecordList = itemInfo.students.map((student) =>
            createStudentRecord(student)
        );
        setAllStudents(studentRecordList);

        setStudents(Array(totalSeats).fill(null));
        setLockedSeats(new Set());
        console.log("學生資料已更新 for:", currentSelection);
    } else {
        console.warn(`在 ${isClassData ? 'serviceData' : 'courseServiceData'} 中找不到 ${currentSelection} 的資料`);
        setAllStudents([]);
        setStudents(Array(totalSeats).fill(null));
        setLockedSeats(new Set());
    }

  }, [dataSourceType, selectedClass, selectedCourse, serviceData, courseServiceData, totalSeats]);


  // Effect 4: 偵測視窗大小
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      const width = window.innerWidth || document.documentElement.clientWidth || 0;
      setViewportWidth(width);
      setIsMobile(width <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    preloadSeatPhotos();
  }, [preloadSeatPhotos]);

  const loadInitialData = async () => {
    if (!_connection) {
        console.error("Gadget connection 未建立。");
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    console.log("正在載入班級與課程資料...");
    try {
    // --- 1. 呼叫 GetMyClassStudent ---
    const classResponse = await new Promise((resolve, reject) => {
        _connection.send({
        service: "_.GetMyClassStudent",
        body: {},
        result: (res, error) => {
            if (error) { console.error('GetMyClassStudent Service Error:', error); return reject(error); }
            console.log("GetMyClassStudent Response:", res);
            resolve(res);
        }
        });
    });

    // --- 解析班級資料 ---
    let rawClassData = [];
    if (classResponse && classResponse.Class) {
        rawClassData = Array.isArray(classResponse.Class) ? classResponse.Class : [classResponse.Class];
    } else { console.warn("班級 Service response 中未找到 'Class' 結構。"); }

    const parsedClassData = rawClassData.map(cls => {
        const studentsRaw = cls.Student ? (Array.isArray(cls.Student) ? cls.Student : [cls.Student]) : [];
        const studentsProcessed = studentsRaw
        .map(stu => ({
            name: stu.StudentName || `未知(${stu.SeatNo || '?'})`,
            seatNo: normalizeSeatNo(stu.SeatNo),
            gender: stu.Gender || '',
            studentID: stu.StudentId || '',
        }))
        .sort((a, b) => {
            if (a.seatNo === null && b.seatNo === null) return a.name.localeCompare(b.name, 'zh-Hant');
            if (a.seatNo === null) return 1;
            if (b.seatNo === null) return -1;
            return a.seatNo - b.seatNo;
        });
        return { className: cls.ClassName || `未知班級(${cls.ClassId || '?'})`, students: studentsProcessed };
    }).filter(cls => cls.className);

    setServiceData(parsedClassData);
    const classNames = parsedClassData.map(cls => cls.className);
    setClassList(classNames);

    // --- 2. 呼叫 GetMyCourseStudent ---
    const courseResponse = await new Promise((resolve, reject) => {
        _connection.send({
            service: "_.GetMyCourseStudent",
            body: { CurrentSemester: true }, // 加入參數
            result: (res, error) => {
            if (error) { console.error('GetMyCourseStudent Service Error:', error); return reject(error); }
            console.log("GetMyCourseStudent Response:", res);
            resolve(res);
            }
        });
    });

    // --- 解析課程資料 (*** 請根據實際回應調整此處邏輯 ***) ---
    let rawCourseData = [];
    if (courseResponse && courseResponse.Course) {
        rawCourseData = Array.isArray(courseResponse.Course) ? courseResponse.Course : [courseResponse.Course];
    } else { console.warn("課程 Service response 中未找到 'Course' 結構。"); }

    const parsedCourseData = rawCourseData.map(crs => {
        const studentsRaw = crs.Student ? (Array.isArray(crs.Student) ? crs.Student : [crs.Student]) : [];
        const studentsProcessed = studentsRaw
            .map(stu => ({
                name: stu.StudentName || `未知(${stu.SeatNo || '?'})`,
                seatNo: normalizeSeatNo(stu.SeatNo),
                gender: stu.Gender || '',
                studentID: stu.StudentId || '',
            }))
            .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
        return { courseName: crs.CourseName || `未知課程(${crs.CourseId || '?'})`, students: studentsProcessed };
    }).filter(crs => crs.courseName);

    setCourseServiceData(parsedCourseData);
    const courseNames = parsedCourseData.map(crs => crs.courseName);
    setCourseList(courseNames);

    // --- 設定初始選擇 ---
    if (classNames.length > 0) {
        setSelectedClass(classNames[0]);
        setDataSourceType('class');
        setSelectedCourse('');
    } else if (courseNames.length > 0) {
        setSelectedCourse(courseNames[0]);
        setDataSourceType('course');
        setSelectedClass('');
    } else {
        setDataSourceType('');
    }

    } catch (error) {
    console.error("無法載入班級或課程資料:", error);
    setClassList([]); setSelectedClass(''); setServiceData(null);
    setCourseList([]); setSelectedCourse(''); setCourseServiceData(null);
    setDataSourceType(''); setAllStudents([]);
    setStudents(Array(rows * cols).fill(null)); setLockedSeats(new Set());
    } finally {
    setIsLoading(false);
    console.log("班級與課程資料載入流程結束。");
    }
};

  // --- 事件處理函數 ---

  const handleClassChange = (e) => {
      const newClass = e.target.value;
      setSelectedClass(newClass); setSelectedCourse('');
      setDataSourceType(newClass ? 'class' : '');
  };

  const handleCourseChange = (e) => {
      const newCourse = e.target.value;
      setSelectedCourse(newCourse); setSelectedClass('');
      setDataSourceType(newCourse ? 'course' : '');
  };

  const toggleLockSeat = (index, event) => {
      event.stopPropagation();
      setLockedSeats(prevLocked => {
          const newLocked = new Set(prevLocked);
          if (newLocked.has(index)) { newLocked.delete(index); }
          else if (index < totalSeats) { newLocked.add(index); }
          return newLocked;
      });
  };

  const getAvailableIndices = () => {
      const indices = [];
      for (let i = 0; i < totalSeats; i++) { if (!lockedSeats.has(i)) { indices.push(i); } }
      return indices;
  };

  const openImportModal = () => {
      const studentsToEditText = allStudents.map(student => student.displayName).join('\n');
      setImportText(studentsToEditText);
      setIsImportModalOpen(true);
  };

  const closeImportModal = () => { setIsImportModalOpen(false); setImportText(''); };
  const handleImportInputChange = (event) => { setImportText(event.target.value); };

  const handleImportConfirm = () => {
      const importedLines = importText
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line !== '');
      const uniqueLines = [...new Set(importedLines)];
      const importedRecords = uniqueLines
          .map(parseManualEntry)
          .filter((record) => record !== null);

      setAllStudents(importedRecords);
      setStudents(prevStudents => {
          const newStudents = Array(totalSeats).fill(null);
          lockedSeats.forEach(lockIndex => {
              if (lockIndex < totalSeats && prevStudents[lockIndex]) {
                  const existing = prevStudents[lockIndex];
                  const matched = importedRecords.find((record) => areSameStudent(record, existing));
                  if (matched) {
                      newStudents[lockIndex] = matched;
                  }
              }
          });
          return newStudents;
      });
      closeImportModal();
  };

  const handleExportReport = async () => {
      try {
          await preloadSeatPhotos();
          const reportTitleSource = dataSourceType === 'class' ? selectedClass : dataSourceType === 'course' ? selectedCourse : '手動編輯或未選';
          const reportTitle = `座位表報表 - ${reportTitleSource || ''}`;
          const timestamp = new Date().toLocaleString();

          const buildSeatCell = async (index, row, col) => {
              const studentRecord = students[index] || null;
              const isLocked = lockedSeats.has(index);
              const gender = studentRecord ? (studentRecord.gender || '') : '';
              const genderClass = gender === '男' ? 'gender-male' : gender === '女' ? 'gender-female' : '';
              const seatNumber = seatOrderMap.get(index) || ((row * cols) + (col + 1));
              const studentKey = studentRecord ? getStudentKey(studentRecord) : null;
              let photoSrc = '';
              if (studentKey) {
                  const cached = photoCacheRef.current.get(studentKey);
                  if (cached) {
                      photoSrc = cached;
                  } else {
                      const ensured = await ensurePhotoCached(studentRecord);
                      if (typeof ensured === 'string') {
                          photoSrc = ensured;
                      } else {
                          photoSrc = getStudentPhotoUrl(studentRecord) || '';
                      }
                  }
              }
              const studentName = studentRecord ? studentRecord.name : '';
              const seatNo = studentRecord && studentRecord.seatNo !== null ? `(${studentRecord.seatNo})` : '';
              const displayName = studentRecord ? `${studentName}${seatNo}` : '';
              const cellClasses = [
                  'report-seat',
                  genderClass,
                  studentRecord ? 'occupied' : 'empty',
                  isLocked ? 'locked-seat' : '',
              ].filter(Boolean).join(' ');
              const photoHtml = photoSrc
                  ? `<div class="report-photo"><img src="${photoSrc}" alt="${displayName || '學生'} 照片" /></div>`
                  : '';
              const infoHtml = studentRecord
                  ? `<div class="report-info"><div class="report-name">${studentName}</div>${seatNo ? `<div class="report-seatno">${seatNo}</div>` : ''}</div>`
                  : `<div class="report-info empty">座位 ${seatNumber}</div>`;
              return `<td class="${cellClasses}">
                          <div class="report-seat-wrapper">
                              <div class="report-seat-number">座 ${seatNumber}</div>
                              ${photoHtml}
                              ${infoHtml}
                          </div>
                      </td>`;
          };

          const tableRows = [];
          for (let r = 0; r < rows; r++) {
              const cells = [];
              for (let c = 0; c < cols; c++) {
                  const index = r * cols + c;
                  // eslint-disable-next-line no-await-in-loop
                  const cellHtml = await buildSeatCell(index, r, c);
                  cells.push(cellHtml);
              }
              tableRows.push(`<tr>${cells.join('')}</tr>`);
          }

          const podiumHtml = `<div class="report-podium">講台</div>`;
          const topSection = isPodiumTop ? podiumHtml : '';
          const bottomSection = !isPodiumTop ? podiumHtml : '';

          const reportCss = `
            :root {
              color-scheme: light;
            }
            body {
              font-family: "Noto Sans TC", "Microsoft JhengHei", sans-serif;
              margin: 0;
              padding: 24px;
              background: #f5f5f5;
              color: #333;
            }
            .report-container { max-width: 960px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
            h1 { margin: 0; font-size: 1.6em; text-align: center; letter-spacing: 0.05em; }
            .report-meta { margin-top: 8px; text-align: center; font-size: 0.9em; color: #666; }
            .report-table-wrapper { margin-top: 24px; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            td { border: 1px solid #ccc; vertical-align: top; padding: 2px; height: 120px; }
            .report-seat-wrapper { position: relative; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; }
            .report-seat { background: #f7fbff; }
            .report-seat.empty { background: #fafafa; }
            .report-seat.locked-seat { background: #fbe9e7; }
            .report-seat.gender-male { background: #e3f2fd; }
            .report-seat.gender-female { background: #fce4ec; }
            .report-seat-number { position: absolute; top: 4px; left: 6px; font-size: 0.75em; color: #777; }
            .report-photo { width: 70px; height: 90px; border: 1px solid #bbb; border-radius: 4px; overflow: hidden; background: #eee; }
            .report-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
            .report-info { text-align: center; font-size: 0.95em; line-height: 1.2; }
            .report-info.empty { color: #999; }
            .report-name { font-weight: 600; }
            .report-seatno { font-size: 0.85em; color: #555; }
            .report-podium { margin: 12px auto; padding: 8px 16px; background: #ffcc80; border-radius: 6px; font-weight: 600; text-align: center; width: fit-content; }
            @media print { body { background: #fff; padding: 0; } .report-container { box-shadow: none; margin: 0; border: none; width: 100%; padding: 12px; } }
          `;

          const reportHtml = `
            <!DOCTYPE html>
            <html lang="zh-Hant">
              <head>
                <meta charset="UTF-8" />
                <title>${reportTitle}</title>
                <style>${reportCss}</style>
              </head>
              <body>
                <div class="report-container">
                  <h1>${reportTitle}</h1>
                  <div class="report-meta">
                    資料來源：${reportTitleSource || '未指定'} ｜ 座位數：${totalSeats} ｜ 產生時間：${timestamp}
                  </div>
                  <div class="report-table-wrapper">
                    ${topSection}
                    <table>
                      <tbody>
                        ${tableRows.join('')}
                      </tbody>
                    </table>
                    ${bottomSection}
                  </div>
                </div>
              </body>
            </html>
          `;

          const reportWindow = window.open('', '_blank', 'width=1123,height=794');
          if (reportWindow) {
              reportWindow.document.open();
              reportWindow.document.write(reportHtml);
              reportWindow.document.close();
              setTimeout(() => {
                  try {
                      reportWindow.focus();
                      reportWindow.print();
                  } catch (printError) {
                      console.error("列印失敗:", printError);
                      alert("無法觸發列印，請在新視窗中手動列印。");
                  }
              }, 500);
          } else {
              alert('彈出式視窗被瀏覽器攔截了！請允許後再試一次。');
          }
      } catch (error) {
          console.error("匯出報表時發生錯誤:", error);
          alert("匯出報表時發生錯誤，請稍後再試。");
      }
  };

  const generateSeats = () => {
      if (!allStudents || allStudents.length === 0) { console.log("沒有學生資料可供排列。"); clearSeats(); return; }
      console.log("執行預設排列...");
      const newStudents = Array(totalSeats).fill(null);
      let studentIdx = 0;
      seatPositions.forEach(({ index }) => {
          if (!lockedSeats.has(index) && studentIdx < allStudents.length) {
              newStudents[index] = allStudents[studentIdx++];
          }
      });
      lockedSeats.forEach(lockIndex => { if (lockIndex < totalSeats && students[lockIndex]) { newStudents[lockIndex] = students[lockIndex]; } });
      setStudents(newStudents); console.log("預設排列完成:", newStudents);
  };

  // ============================================================
  // ============ 修正後的 shuffleStudents 函數 ================
  // ============================================================
  const shuffleStudents = () => {
      const lockedEntries = [];
      const lockedKeySet = new Set();
      lockedSeats.forEach(index => {
          if (index < totalSeats && students[index]) {
              const studentRecord = students[index];
              lockedEntries.push({ index, student: studentRecord });
              const key = getStudentKey(studentRecord);
              if (key) lockedKeySet.add(key);
          }
      });

      const pool = [];
      const pushCandidate = (candidate) => {
          if (!candidate) return;
          const key = getStudentKey(candidate);
          if (!key || lockedKeySet.has(key)) return;
          if (!pool.some(existing => areSameStudent(existing, candidate))) {
              pool.push(candidate);
          }
      };

      allStudents.forEach(pushCandidate);
      students.forEach((student, index) => {
          if (!lockedSeats.has(index)) {
              pushCandidate(student);
          }
      });

      if (pool.length === 0) {
          if (lockedEntries.length === 0) {
              if (allStudents.length > 0) {
                  console.warn("ShuffleStudents: 找不到可用學生，改為清空非鎖定座位。");
                  clearSeats();
              } else {
                  console.log("沒有學生可供隨機排列。");
              }
          } else {
              console.log("執行隨機排列：只有鎖定的學生，清空其他座位。");
              const newStudents = Array(totalSeats).fill(null);
              lockedEntries.forEach(({ index, student }) => {
                  if (index < totalSeats) {
                      newStudents[index] = student;
                  }
              });
              setStudents(newStudents);
          }
          return;
      }

      console.log("執行隨機排列... 使用學生紀錄物件");
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const newStudents = Array(totalSeats).fill(null);
      lockedEntries.forEach(({ index, student }) => {
          if (index < totalSeats) {
              newStudents[index] = student;
          }
      });

      let shuffleIdx = 0;
      for (const { index } of seatPositions) {
          if (!lockedSeats.has(index) && !newStudents[index] && shuffleIdx < shuffled.length) {
              newStudents[index] = shuffled[shuffleIdx++];
          }
          if (shuffleIdx >= shuffled.length) {
              break;
          }
      }

      setStudents(newStudents);
      console.log(`隨機排列完成 (新結構): 共 ${shuffleIdx} 位學生被放置。`, newStudents);
      if (shuffleIdx < shuffled.length) {
          console.warn(`警告：有 ${shuffled.length - shuffleIdx} 位學生未被放置，可能座位不足。`);
      }
  };
  // ============================================================
  // ============================================================


  const clearSeats = () => {
      console.log("清空非鎖定座位...");
      const newStudents = Array(totalSeats).fill(null);
      lockedSeats.forEach(lockIndex => {
          if (lockIndex < totalSeats && students[lockIndex]) { newStudents[lockIndex] = students[lockIndex]; }
      });
      setStudents(newStudents);
  };


  const applyQuincunxArrangement = (studentsToArrange) => {
    const arrangement = Array(totalSeats).fill(null);
    let studentIndex = 0;
    lockedSeats.forEach(lockIndex => { if (lockIndex < totalSeats) { arrangement[lockIndex] = students[lockIndex]; } });
    seatPositions.forEach(({ index, r, c }) => {
        if (lockedSeats.has(index)) return;
        if ((r + c) % 2 === 0 && !arrangement[index] && studentIndex < studentsToArrange.length) {
            arrangement[index] = studentsToArrange[studentIndex++];
        }
    });
    return arrangement;
  };
const shuffleQuincunx = () => {
    const studentsOnNonLockedSeats = students.filter((student, index) => student && !lockedSeats.has(index));
    const studentsNotInSeats = allStudents.filter(student => !assignedKeySet.has(getStudentKey(student)));
    const combined = [...studentsOnNonLockedSeats, ...studentsNotInSeats];
    const studentsToArrange = [];
    combined.forEach((student) => {
        if (student && !studentsToArrange.some(existing => areSameStudent(existing, student))) {
            studentsToArrange.push(student);
        }
    });
    if (studentsToArrange.length === 0) {
        clearSeats();
        return;
    }
    const shuffledStudents = [...studentsToArrange].sort(() => Math.random() - 0.5);
    const arrangedSeats = applyQuincunxArrangement(shuffledStudents);
    setStudents(arrangedSeats);
    console.log("隨機梅花座完成:", arrangedSeats);
};

  // --- 拖放與行動裝置交互 ---
  const handleStudentDragStart = (student) => (e) => {
      if (isMobile) {
          setSelectedStudent(currentSelected => (currentSelected && areSameStudent(currentSelected, student)) ? null : student);
      } else {
          setDraggedStudent(student);
          try {
              e.dataTransfer.setData("text/plain", student.displayName || '');
              e.dataTransfer.effectAllowed = "move";
          }
          catch (err) { console.error("設定拖曳資料失敗:", err); }
      }
  };

  const handleSeatDragStart = (index) => (e) => {
      const studentInSeat = students[index];
      if (lockedSeats.has(index) || !studentInSeat || isMobile) { e.preventDefault(); return; }
      setDraggedSeatIndex(index); setDraggedStudent(studentInSeat);
      if (e.target && e.target.classList) e.target.classList.add("dragging");
      try { e.dataTransfer.setData("text/plain", studentInSeat.displayName || ''); e.dataTransfer.effectAllowed = "move"; }
      catch (err) { console.error("設定座位拖曳資料失敗:", err); }
  };

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };

  const handleSeatDrop = (targetIndex) => (e) => {
      e.preventDefault(); if (isMobile) return;
      const targetElement = e.currentTarget;
      if (targetElement && targetElement.classList) targetElement.classList.remove("dragging");
      if (lockedSeats.has(targetIndex)) { setDraggedStudent(null); setDraggedSeatIndex(null); return; }
      if (draggedStudent !== null) {
          const movedWithinSeats = draggedSeatIndex !== null;
          let replacedStudent = null;
          setStudents(prevStudents => {
              const newStudents = [...prevStudents];
              replacedStudent = newStudents[targetIndex] || null;
              if (movedWithinSeats) {
                  if (draggedSeatIndex === targetIndex) {
                      return newStudents;
                  }
                  newStudents[draggedSeatIndex] = replacedStudent;
                  newStudents[targetIndex] = draggedStudent;
              } else {
                  newStudents[targetIndex] = draggedStudent;
              }
              return newStudents;
          });

          if (!movedWithinSeats) {
              setAllStudents(prevAll => {
                  let next = [...prevAll];
                  if (replacedStudent && !next.some(student => areSameStudent(student, replacedStudent))) {
                      next.push(replacedStudent);
                  }
                  next = next.filter(student => !areSameStudent(student, draggedStudent));
                  return next.sort((a, b) => a.displayName.localeCompare(b.displayName, 'zh-Hant'));
              });
          }
          setDraggedStudent(null); setDraggedSeatIndex(null);
      }
  };

  const handleDragEnd = (e) => {
      if (!isMobile) { document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging')); }
      setDraggedStudent(null); setDraggedSeatIndex(null);
  };

  const handleStudentDoubleClick = (index) => () => {
      if (lockedSeats.has(index) || isMobile) return;
      const studentToRemove = students[index];
      if (studentToRemove) {
          const newStudents = [...students]; newStudents[index] = null; setStudents(newStudents);
          if (!allStudents.some(existing => areSameStudent(existing, studentToRemove))) {
              setAllStudents((prevAll) => {
                  const next = [...prevAll, studentToRemove];
                  return next.sort((a, b) => a.displayName.localeCompare(b.displayName, 'zh-Hant'));
              });
          }
      }
  };

  const handleMobileSeatInteraction = (index) => {
      if (!isMobile) return;
      const studentInSeat = students[index];
      if (lockedSeats.has(index)) { setSelectedStudent(null); return; }
      if (selectedStudent) {
          const newStudents = [...students]; const studentToReplace = newStudents[index] || null;
          if (studentToReplace && !areSameStudent(studentToReplace, selectedStudent) && !allStudents.some(existing => areSameStudent(existing, studentToReplace))) {
              setAllStudents((prevAll) => {
                  const next = [...prevAll, studentToReplace];
                  return next.sort((a, b) => a.displayName.localeCompare(b.displayName, 'zh-Hant'));
              });
          }
          newStudents[index] = selectedStudent;
          setStudents(newStudents);
          setAllStudents(prevAll => prevAll.filter(student => !areSameStudent(student, selectedStudent)));
          setSelectedStudent(null);
      } else if (studentInSeat) {
          const newStudents = [...students]; newStudents[index] = null; setStudents(newStudents);
          if (!allStudents.some(existing => areSameStudent(existing, studentInSeat))) {
              setAllStudents((prevAll) => {
                  const next = [...prevAll, studentInSeat];
                  return next.sort((a, b) => a.displayName.localeCompare(b.displayName, 'zh-Hant'));
              });
          }
          setSelectedStudent(null);
      }
  };

  const handleSaveAsImage = async () => {
      if (!seatChartRef.current) { alert("找不到座位表元素，無法另存圖片。"); return; }
      console.log("準備擷取圖片...");
      const options = { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false };
      const waitForNextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
      let restorePhotos = () => {};
      const seatNode = seatChartRef.current;
      if (seatNode) {
          seatNode.classList.add('exporting');
      }
      try {
          await preloadSeatPhotos();
          restorePhotos = await applyCachedPhotosToDom();
          await waitForNextFrame();
          await waitForNextFrame();
          const canvas = await html2canvas(seatChartRef.current, options);
          const image = canvas.toDataURL('image/png'); const link = document.createElement('a'); link.href = image;
          const fileNameSource = dataSourceType === 'class' ? selectedClass : dataSourceType === 'course' ? selectedCourse : '自訂';
          const fileName = fileNameSource ? `座位表_${fileNameSource}.png` : '座位表.png';
          link.download = fileName; document.body.appendChild(link); link.click(); document.body.removeChild(link);
          console.log("圖片已觸發下載:", fileName);
          restorePhotos();
      } catch (err) {
          console.error("無法使用 html2canvas 產生圖片:", err);
          alert("抱歉，無法產生座位表圖片。");
      } finally {
          restorePhotos();
          if (seatNode) {
              seatNode.classList.remove('exporting');
          }
      }
  };

  // --- JSX 渲染 ---
  return (
    <div className="app-container">
        {/* 資料來源選擇 */}
        <div className="setup-number" style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
             <div style={{ display: 'flex', alignItems: 'center', margin: '5px' }}>
                 <label htmlFor="class-select" style={{ marginRight: '5px', whiteSpace: 'nowrap' }}>班級:</label>
                 <select id="class-select" value={selectedClass} onChange={handleClassChange} disabled={isLoading || classList.length === 0} style={{ padding: '5px', minWidth: '150px', fontSize: '1em' }}>
                     <option value="">-- 請選擇班級 --</option>
                     {isLoading && classList.length === 0 && <option>載入中...</option> }
                     {!isLoading && classList.length === 0 && <option value="">無班級資料</option>}
                     {classList.map(className => ( <option key={className} value={className}>{className}</option> ))}
                 </select>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', margin: '5px' }}>
                <label htmlFor="course-select" style={{ marginRight: '5px', whiteSpace: 'nowrap' }}>課程:</label>
                <select id="course-select" value={selectedCourse} onChange={handleCourseChange} disabled={isLoading || courseList.length === 0} style={{ padding: '5px', minWidth: '150px', fontSize: '1em' }}>
                     <option value="">-- 請選擇課程 --</option>
                     {isLoading && courseList.length === 0 && <option>載入中...</option> }
                     {!isLoading && courseList.length === 0 && <option value="">無課程資料</option>}
                     {courseList.map(courseName => ( <option key={courseName} value={courseName}>{courseName}</option> ))}
                </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', margin: '5px', marginLeft: '15px', paddingLeft: '15px', borderLeft: '1px solid #ccc' }}>
                <label style={{ marginRight: '5px' }}>或</label>
                <button className="shuffle-button" onClick={openImportModal} disabled={isLoading} style={{ minWidth: 'unset', padding: '8px 12px' }}> 手動匯入/編輯 </button>
             </div>
        </div>

        {/* 狀態顯示 */}
        <p className="student-count">
            資料來源: {dataSourceType === 'class' ? `班級 (${selectedClass || '未選擇'})` : dataSourceType === 'course' ? `課程 (${selectedCourse || '未選擇'})` : '未選擇'} /
            學生總數：{numberOfStudents} 人 / 已入座：{seatedStudentCount} 人 / 座位數：{totalSeats}
            {isLoading && " (資料載入中...)"}
        </p>
        {/* 行列數設定 */}
        <div className="setup-number">
            <label>行數:</label>
            <input className="number-col" type="number" value={rows} onChange={(e) => setRows(Math.max(0, Number(e.target.value)))} min="1" />
            <label>列數:</label>
            <input className="number-col" type="number" value={cols} onChange={(e) => setCols(Math.max(0, Number(e.target.value)))} min="1" />
                        <label htmlFor="podium-position" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                講台位置:
                <select
                    id="podium-position"
                    value={podiumPosition}
                    onChange={(e) => setPodiumPosition(e.target.value)}
                >
                    <option value="top-lr">上方 (座號由左而右)</option>
                    <option value="top-rl">上方 (座號由右而左)</option>
                    <option value="bottom-lr">下方 (座號由左而右)</option>
                    <option value="bottom-rl">下方 (座號由右而左)</option>
                </select>
            </label>
        </div>

      {/* 功能按鈕 */}
      <div className="button-container" style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="shuffle-button" onClick={generateSeats} disabled={!dataSourceType || isLoading || allStudents.length === 0}>預設排列</button>
          <button className="shuffle-button" onClick={shuffleStudents} disabled={!dataSourceType || isLoading || allStudents.length === 0}>隨機排列</button>
          <button className="shuffle-button" onClick={shuffleQuincunx} disabled={!dataSourceType || isLoading || allStudents.length === 0}>隨機梅花座</button>
          <button className="shuffle-button" onClick={clearSeats} disabled={isLoading}>清空非鎖定座位</button>
          <button className="shuffle-button" onClick={handleExportReport} disabled={isLoading}>匯出報表</button>
          <button className="shuffle-button" onClick={handleSaveAsImage} disabled={isLoading}>另存圖片</button>
      </div>

      {/* 主要內容區 */}
      <div className="main-content" >
          {/* 座位表區域 */}
          <div className="main-left-content" ref={seatChartRef}>
              {isPodiumTop && <div className="podium">講台</div>}
              <div className="grid-scroll-wrapper">
                <div className="grid-container" style={gridStyle}>
                  {Array.from({ length: totalSeats }).map((_, index) => {
                      const studentRecord = students[index] || null;
                      const studentKey = studentRecord ? getStudentKey(studentRecord) : null;
                      const isLocked = lockedSeats.has(index);
                      const gender = studentRecord ? (studentRecord.gender || '') : '';
                      const genderClass = gender === '男' ? 'seat-male' : gender === '女' ? 'seat-female' : '';
                      const r = Math.floor(index / cols);
                      const c = index % cols;
                      const seatNumber = seatOrderMap.get(index) || ((r * cols) + (c + 1));
                      const studentPhotoUrl = studentRecord ? getStudentPhotoUrl(studentRecord) : '';
                      const cachedSeatPhoto = studentKey ? photoCacheRef.current.get(studentKey) : null;
                      const seatPhotoSrc = cachedSeatPhoto || studentPhotoUrl || '';
                      const seatClasses = `seat ${ isLocked ? (studentRecord ? `locked ${genderClass}` : 'locked empty-seat') : (studentRecord ? genderClass : 'empty-seat') } ${isMobile && selectedStudent && !isLocked ? 'selectable' : ''} ${isMobile && !selectedStudent && studentRecord && !isLocked ? 'removable' : ''}`;
                      const studentInfoContent = studentRecord ? (
                          <>
                              <div className="student-display-name">{studentRecord.name}</div>
                              {studentRecord.seatNo !== null && (
                                  <div className="student-display-seatno">({studentRecord.seatNo})</div>
                              )}
                          </>
                      ) : null;
                      return (
                          <div key={index} className={seatClasses} draggable={!isMobile && studentRecord && !isLocked}
                              onDragStart={handleSeatDragStart(index)} onDragOver={handleDragOver} onDrop={handleSeatDrop(index)} onDragEnd={handleDragEnd}
                              onDoubleClick={handleStudentDoubleClick(index)} onClick={() => handleMobileSeatInteraction(index)} >
                              <button className="lock-toggle" onClick={(e) => toggleLockSeat(index, e)} aria-label={isLocked ? "解鎖" : "鎖定"} title={isLocked ? "解鎖" : "鎖定"} >
                                  {isLocked ? <FaLock /> : <FaUnlock />}
                              </button>
                              <div className={`seat-content ${seatPhotoSrc ? 'has-photo' : ''}`}>
                                  {studentRecord ? (
                                      seatPhotoSrc ? (
                                          <div className="seat-photo-wrapper">
                                              <img
                                                  className="seat-photo"
                                                  src={seatPhotoSrc}
                                                  alt={`${studentRecord.displayName || studentRecord.name} 照片`}
                                                  data-student-key={studentKey || ''}
                                              />
                                              <div className="seat-overlay">
                                                  {studentInfoContent}
                                              </div>
                                          </div>
                                      ) : (
                                          <span className="student-name">
                                              {studentInfoContent}
                                          </span>
                                      )
                                  ) : (
                                      <span className="student-name">
                                          {!isMobile && !isLocked ? `座 ${seatNumber}` : ''}
                                      </span>
                                  )}
                              </div>
                            </div>
                      );
                  })}
                </div>
              </div>
              {!isPodiumTop && <div className="podium">講台</div>}
          </div>
                      {/* 學生列表 */}
                      <div className="student-list">
                      <h3>可安排學生 ({availableStudents.length})</h3>
                      {isLoading && <p style={{ textAlign: 'center', color: '#555' }}>載入中...</p>}
                      {!isLoading && !dataSourceType && <p style={{ textAlign: 'center', color: '#555' }}>請選擇班級或課程</p>}
                      {!isLoading && dataSourceType && allStudents.length === 0 && <p style={{ textAlign: 'center', color: '#555' }}>此來源無學生資料</p>}
                      {!isLoading && dataSourceType && allStudents.length > 0 && availableStudents.map((student) => {
                          const gender = student?.gender || '';
                          const genderClass = gender === '男' ? 'student-male' : gender === '女' ? 'student-female' : '';
                          const isSelected = isMobile && selectedStudent && areSameStudent(selectedStudent, student);
                          const clickHandler = handleStudentDragStart(student);
                          const studentKey = getStudentKey(student) || student.displayName;
                          const photoUrl = getStudentPhotoUrl(student);
                          const cachedPhoto = studentKey ? photoCacheRef.current.get(studentKey) : null;
                          const photoSrc = cachedPhoto || photoUrl || '';
                          const studentInfoContent = (
                              <>
                                  <div className="student-display-name">{student.name}</div>
                                  {student.seatNo !== null && (
                                      <div className="student-display-seatno">({student.seatNo})</div>
                                  )}
                              </>
                          );
                          return (
                              <div key={studentKey} className={`student-item ${isSelected ? 'selected' : ''} ${genderClass}`}
                                  draggable={!isMobile} onDragStart={!isMobile ? clickHandler : undefined} onDragEnd={handleDragEnd}
                                  onClick={isMobile ? clickHandler : undefined}
                                  title={student.displayName} >
                                  {photoSrc ? (
                                      <div className="student-photo-wrapper">
                                          <img
                                              className="student-photo"
                                              src={photoSrc}
                                              data-student-key={studentKey || ''}
                                              alt={`${student.displayName} 照片`}
                                          />
                                          <div className="seat-overlay">
                                              {studentInfoContent}
                                          </div>
                                      </div>
                                  ) : (
                                      <span className="student-item-info">
                                          {studentInfoContent}
                                      </span>
                                  )}
                              </div>
                          );
                      })}
                    </div>
      </div>

      {/* 匯入 Modal */}
      {isImportModalOpen && (
         <>
          <div className="modal-backdrop" onClick={closeImportModal}></div>
          <div className="modal-content">
             <h3>匯入/編輯 學生名單</h3>
             <p>請在下方編輯學生名單，每行一個 (建議格式：姓名 (座號) 或 姓名)：</p>
             <textarea value={importText} onChange={handleImportInputChange} rows="10" className="modal-textarea" placeholder="例如:&#10;王小明 (1)&#10;陳大華 (2)&#10;林美麗" />
             <div className="modal-buttons">
                 <button onClick={handleImportConfirm} className="shuffle-button modal-button confirm">確認更新</button>
                 <button onClick={closeImportModal} className="shuffle-button modal-button cancel">取消</button>
             </div>
           </div>
        </>
      )}
    </div>
  );
}

export default App;
