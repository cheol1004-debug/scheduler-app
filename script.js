/* ------------------------------
   TIME OPTIONS
------------------------------ */

// 시간 옵션 생성 (10:00AM ~ 9:30PM, 30분 단위)
function generateTimeOptions() {
    const times = [];
    let start = 10 * 60;       // 10:00AM → 600분
    let end = 21 * 60 + 30;    // 9:30PM → 1290분

    for (let t = start; t <= end; t += 30) {
        let hour = Math.floor(t / 60);
        let minute = t % 60;

        let ampm = hour >= 12 ? "PM" : "AM";
        let displayHour = hour % 12;
        if (displayHour === 0) displayHour = 12;

        let displayMinute = minute === 0 ? "00" : minute;

        times.push(`${displayHour}:${displayMinute}${ampm}`);
    }

    return times;
}

// 시간 dropdown 생성
function generateTimeDropdown() {
    const times = generateTimeOptions();
    let html = `<select class="time-select">`;
    times.forEach(t => {
        html += `<option value="${t}">${t}</option>`;
    });
    html += `</select>`;
    return html;
}

/* ------------------------------
   STAFF DROPDOWN
------------------------------ */

// 직원 목록 불러오기
function getStaffList() {
    const saved = localStorage.getItem("staffList");
    if (saved) return JSON.parse(saved);
    return ["Staff A", "Staff B", "Staff C", "Staff D"];
}

// 직원 목록 저장
function saveStaffList(list) {
    localStorage.setItem("staffList", JSON.stringify(list));
}

// 직원 dropdown 생성
function generateStaffDropdown() {
    const staff = getStaffList();
    let html = `<select class="staff-select">`;
    staff.forEach(name => {
        html += `<option value="${name}">${name}</option>`;
    });
    html += `</select>`;
    return html;
}

function createRow() {
    const row = document.createElement("tr");

    // 클릭 시 민트색 선택 (기존 유지)
    row.addEventListener('click', function() {
        const allRows = document.querySelectorAll("#scheduleTable tbody tr");
        allRows.forEach(r => r.classList.remove("selected-row"));
        this.classList.add("selected-row");
    });

    // 직원 이름 셀 (기존 유지)
    const staffCell = document.createElement("td");
    staffCell.className = "staff-col";
    staffCell.innerHTML = generateStaffDropdown();
    row.appendChild(staffCell);

    // 요일별 시간 선택 셀 (월~일, 총 7개 셀)
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    days.forEach(() => {
        const td = document.createElement("td");
        td.innerHTML = `
            <div class="time-cell">
                ${generateTimeDropdown()}
                ${generateTimeDropdown()}
            </div>
        `;
        row.appendChild(td);
    });

    // 총 근무시간 셀 (기존 유지)
    const totalCell = document.createElement("td");
    totalCell.className = "total-cell";
    totalCell.textContent = "0h";
    row.appendChild(totalCell);

    // 메시지 버튼 (기존 유지)
    const msgCell = document.createElement("td");
    msgCell.innerHTML = `<button class="msg-btn">Message</button>`;
    row.appendChild(msgCell);

    // ------------------------------------------------------
    // ✅ 추가된 부분: 6군데(월~일) 시간 박스에 실시간 색상 변경 이벤트 연결
    // ------------------------------------------------------
    row.querySelectorAll(".time-select").forEach(select => {
        select.addEventListener("change", () => {
            calculateRowTotal(row); // 시간이 바뀌면 즉시 색상 계산 함수 호출
        });
    });

    // 처음에 빈 줄이 생길 때도 기본값(10:00AM)에 맞춰 색상 초기화
    setTimeout(() => calculateRowTotal(row), 0);

    return row;
}

/* ------------------------------
   INITIALIZE TABLE
------------------------------ */

function initializeTable() {
    const tbody = document.querySelector("#scheduleTable tbody");
    tbody.innerHTML = "";
    tbody.appendChild(createRow());
}

/* ------------------------------
   ADD / DELETE ROWS
------------------------------ */

// 줄 추가
document.getElementById("addRow").onclick = () => {
    const tbody = document.querySelector("#scheduleTable tbody");
    tbody.appendChild(createRow());
};

// 줄 삭제 (선택된 줄만 삭제)
document.getElementById("deleteRow").onclick = () => {
    const tbody = document.querySelector("#scheduleTable tbody");
    const selectedRow = tbody.querySelector(".selected-row");

    if (selectedRow) {
        if (tbody.children.length > 1) {
            tbody.removeChild(selectedRow);

            if (typeof calculateAllTotals === "function") {
                calculateAllTotals();
            }
        } else {
            alert("At least one row must remain.");
        }
    } else {
        alert("Please click a row to select it first.");
    }
};

/* ------------------------------
   CALCULATE TOTAL HOURS & COLOR (UI)
------------------------------ */

function calculateRowTotal(row) {
    const timeCells = row.querySelectorAll(".time-cell");
    let totalMinutes = 0;

    timeCells.forEach(cell => {
        const selects = cell.querySelectorAll("select");
        const start = selects[0].value;
        const end = selects[1].value;

        // ✅ 아주 살짝 더 연한 파스텔 핑크 (#fff1f2) 적용
        selects.forEach(select => {
            if (select.value !== "10:00AM") {
                select.style.setProperty("background-color", "#fff1f2", "important"); // 더 연한 핑크
                select.style.setProperty("border-color", "#ffe4e6", "important");    // 테두리도 연하게
            } else {
                select.style.setProperty("background-color", "", "");
                select.style.setProperty("border-color", "", "");
            }
        });

        if (start === end) return;

        const startMin = convertToMinutes(start);
        const endMin = convertToMinutes(end);

        if (endMin > startMin) {
            totalMinutes += (endMin - startMin);
        }
    });

    const hours = (totalMinutes / 60).toFixed(1);
    // 근무 시간이 0이면 비워두기
    row.querySelector(".total-cell").textContent = (totalMinutes > 0) ? `${hours}h` : "";
}

/* ------------------------------
   TIME STRING → MINUTES
------------------------------ */

function convertToMinutes(timeStr) {
    const match = timeStr.match(/(\d+):(\d+)(AM|PM)/);
    if (!match) return 0;

    let hour = parseInt(match[1]);
    let minute = parseInt(match[2]);
    const ampm = match[3];

    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;

    return hour * 60 + minute;
}

/* ------------------------------
   AUTO-UPDATE TOTALS ON CHANGE
------------------------------ */

document.addEventListener("change", (e) => {
    if (e.target.classList.contains("time-select") ||
        e.target.classList.contains("staff-select")) {
        calculateAllTotals();
    }
});

/* ------------------------------
   MESSAGE POPUP
------------------------------ */

function openMessagePopup(text) {
    document.getElementById("messageText").textContent = text;
    document.getElementById("messagePopup").style.display = "flex";
}

document.getElementById("closeMessage").onclick = () => {
    document.getElementById("messagePopup").style.display = "none";
};

/* ------------------------------
   COPY TO CLIPBOARD (iPhone PWA 대응)
------------------------------ */

function copyToClipboard(text) {
    // Modern API (HTTPS 환경)
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    }

    // iPhone PWA fallback
    const textarea = document.createElement("textarea");
    textarea.value = text;

    textarea.style.position = "fixed";
    textarea.style.top = "-1000px";
    textarea.style.left = "-1000px";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
        document.execCommand("copy");
    } catch (err) {
        console.error("Fallback copy failed", err);
    }

    document.body.removeChild(textarea);
}

document.getElementById("copyMessage").onclick = () => {
    const text = document.getElementById("messageText").textContent;
    copyToClipboard(text);
};

/* ------------------------------
   GENERATE STAFF MESSAGE (Korean style)
------------------------------ */

function generateStaffMessage(row) {
    const staffName = row.querySelector(".staff-select").value;

    // Week 텍스트 가져오기
    const weekText = document.getElementById("dateBox").textContent;

    // 날짜 범위 파싱 (예: "Week of 12/29/2025 - 01/04/2026")
    const range = weekText.replace("Week of ", "").split(" - ");
    const startDate = new Date(range[0]);
    const endDate = new Date(range[1]);

    const daysKor = ["일", "월", "화", "수", "목", "금", "토"];

    let msg = `[${staffName}] Weekly Schedule\n`;
    msg += `${startDate.getFullYear()}년 ${startDate.getMonth() + 1}월 ${startDate.getDate()}일 ~ `;
    msg += `${endDate.getFullYear()}년 ${endDate.getMonth() + 1}월 ${endDate.getDate()}\n`;
    msg += `--------------------------------------------\n`;

    const timeCells = row.querySelectorAll(".time-cell");
    let totalMinutes = 0;

    timeCells.forEach((cell, i) => {
        const selects = cell.querySelectorAll("select");
        const start = selects[0].value;
        const end = selects[1].value;

        if (start !== end) {
            const dayDate = new Date(startDate);
            dayDate.setDate(startDate.getDate() + i);

            const mm = dayDate.getMonth() + 1;
            const dd = dayDate.getDate();
            const dayKor = daysKor[dayDate.getDay()];

            msg += `• ${dayKor}(${mm}/${dd}): ${start} – ${end}\n`;

            const startMin = convertToMinutes(start);
            const endMin = convertToMinutes(end);
            totalMinutes += (endMin - startMin);
        }
    });

    // msg += `\n⏱ Total Hours: ${(totalMinutes / 60).toFixed(1)}`;

    return msg;
}

/* ------------------------------
   MESSAGE BUTTON CLICK
------------------------------ */

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("msg-btn")) {
        const row = e.target.closest("tr");
        const text = generateStaffMessage(row);
        openMessagePopup(text);
    }
});

/* ------------------------------
   LOAD → OPEN CALENDAR MODAL
------------------------------ */

document.getElementById("loadBtn").onclick = () => {
    window.isLoadMode = true;   // Load 모드 활성화
    document.getElementById("calendarModal").style.display = "flex";
};

/* ------------------------------
   WEEK → OPEN CALENDAR MODAL
------------------------------ */

document.getElementById("dateBox").onclick = () => {
    window.isLoadMode = false;  // Week 모드
    document.getElementById("calendarModal").style.display = "flex";
};

/* ------------------------------
   SAVE SCHEDULE
------------------------------ */

document.getElementById("saveBtn").onclick = () => {
    const rows = document.querySelectorAll("#scheduleTable tbody tr");
    const data = [];

    rows.forEach(row => {
        const staff = row.querySelector(".staff-select").value;

        const times = [];
        const timeCells = row.querySelectorAll(".time-cell");

        timeCells.forEach(cell => {
            const selects = cell.querySelectorAll("select");
            times.push({
                start: selects[0].value,
                end: selects[1].value
            });
        });

        data.push({ staff, times });
    });

    // Week 날짜를 key로 저장
    const weekText = document.getElementById("dateBox").textContent;
    const dateKey = "savedSchedule_" + weekText;

    localStorage.setItem(dateKey, JSON.stringify(data));
    alert("Schedule saved!");
};

/* ------------------------------
   LOAD SCHEDULE FOR DATE
------------------------------ */

function loadScheduleForDate(dateStr) {
    const weekRangeText = formatWeekRange(dateStr);
    const dateKey = "savedSchedule_" + weekRangeText;

    const saved = localStorage.getItem(dateKey);
    if (!saved) {
        alert("No saved schedule found for this week.");
        return;
    }

    // 데이터 복구 로직
    const data = JSON.parse(saved);
    const tbody = document.querySelector("#scheduleTable tbody");
    tbody.innerHTML = "";

    data.forEach(item => {
        const row = createRow();
        row.querySelector(".staff-select").value = item.staff;
        const timeCells = row.querySelectorAll(".time-cell");
        item.times.forEach((t, i) => {
            if (timeCells[i]) {
                const selects = timeCells[i].querySelectorAll("select");
                selects[0].value = t.start;
                selects[1].value = t.end;
            }
        });
        tbody.appendChild(row);
    });

    // 핵심: 화면 상단의 날짜 텍스트와 헤더의 일자(mm/dd)를 모두 업데이트
    document.getElementById("dateBox").textContent = weekRangeText;
    updateHeaderDates(dateStr);
    localStorage.setItem("last_selected_date", dateStr); // 불러온 날짜를 현재 날짜로 저장
    
    calculateAllTotals();
}

/* ------------------------------
   WEEK CHANGE HANDLER
------------------------------ */

function handleWeekChange(dateStr) {
    document.getElementById("dateBox").textContent = formatWeekRange(dateStr);
    updateHeaderDates(dateStr);
    // 선택한 날짜를 저장하여 새로고침 시 유지되도록 함
    localStorage.setItem("last_selected_date", dateStr);
}

/* ------------------------------
   CALENDAR INPUT HANDLER
------------------------------ */

document.getElementById("calendarInput").addEventListener("change", () => {
    setTimeout(() => {
        const dateStr = document.getElementById("calendarInput").value;
        if (!dateStr) return;  // 이제 iPhone에서도 빈 값이 안 들어옴

        if (window.isLoadMode) {
            loadScheduleForDate(dateStr);
        } else {
            handleWeekChange(dateStr);
        }

        document.getElementById("calendarModal").style.display = "none";
    }, 50);  // iPhone Safari 버그 회피용 딜레이
});

/* ------------------------------
   WEEK RANGE FORMATTER
------------------------------ */

function formatWeekRange(dateStr) {
    const date = new Date(dateStr);

    const day = date.getDay();
    const diffToMonday = (day === 0 ? -6 : 1 - day);

    const monday = new Date(date);
    monday.setDate(date.getDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const format = (d) => {
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const yyyy = d.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
    };

    return `Week of ${format(monday)} - ${format(sunday)}`;
}

/* ------------------------------
   CALENDAR CLOSE BUTTON
------------------------------ */

document.getElementById("calendarClose").onclick = () => {
    document.getElementById("calendarModal").style.display = "none";
};

/* ------------------------------
   EXPORT HTML (Total 열 완전 삭제 버전)
------------------------------ */

document.getElementById("exportHtmlBtn").onclick = () => {
    const originalTable = document.getElementById("scheduleTable");
    const clone = originalTable.cloneNode(true);

    // 1. 헤더(th)에서 'Total' 열 삭제
    // 보통 Total은 마지막에서 두 번째(Total)와 마지막(Message) 사이에 있으므로 정확히 선택하여 삭제합니다.
    const totalHeader = clone.querySelector("th.total-cell") || clone.querySelectorAll("th")[8]; 
    if (totalHeader) totalHeader.remove();

    const originalRows = originalTable.querySelectorAll("tbody tr");
    const clonedRows = clone.querySelectorAll("tbody tr");

    clonedRows.forEach((row, rowIndex) => {
        const originalRow = originalRows[rowIndex];
        const originalTimeCells = originalRow.querySelectorAll(".time-cell");
        const clonedTimeCells = row.querySelectorAll(".time-cell");

        // 2. 시간 셀 처리 (시작=종료 시 빈칸)
        clonedTimeCells.forEach((cell, cellIndex) => {
            const selects = originalTimeCells[cellIndex].querySelectorAll("select");
            const start = selects[0].value;
            const end = selects[1].value;

            if (start === end) {
                cell.innerHTML = ""; 
            } else {
                cell.innerHTML = `
                    <div style="margin-bottom:4px;">${start}</div>
                    <div>${end}</div>
                `;
            }
        });

        // 3. 직원 이름 텍스트 변환
        const staffSelect = originalRow.querySelector(".staff-select");
        const clonedStaffCell = row.querySelector(".staff-col");
        if (staffSelect && clonedStaffCell) {
            clonedStaffCell.textContent = staffSelect.value;
        }

        // 4. 데이터(td)에서 'Total' 열 삭제
        const totalDataCell = row.querySelector(".total-cell");
        if (totalDataCell) {
            totalDataCell.remove(); 
        }
    });

    // 5. 메시지 버튼 열 삭제 (기존 유지)
    clone.querySelectorAll("th:last-child, td:last-child").forEach(el => el.remove());

    const htmlContent = `
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Weekly Schedule</title>
            <style>
                table { border-collapse: collapse; width: 100%; font-family: -apple-system, sans-serif; }
                th, td { border: 1px solid #e2e8f0; padding: 10px 5px; text-align: center; font-size: 13px; }
                th { background-color: #f8fafc; color: #334155; }
                .staff-col { background-color: #f1f5f9; font-weight: bold; }
            </style>
        </head>
        <body>
            <h2 style="text-align:center;">${document.getElementById("dateBox").textContent}</h2>
            ${clone.outerHTML}
        </body>
        </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Schedule_${new Date().toISOString().slice(0,10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
};

/* ------------------------------
   SCROLL TO TOP
------------------------------ */

document.getElementById("scrollTopBtn").onclick = () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
};

/* ------------------------------
   PAGE LOAD INITIALIZATION
------------------------------ */

/* script.js 의 window.onload 부분을 아래와 같이 수정하세요 */

window.onload = () => {
    initializeTable();
    
    // 1. 마지막으로 사용했던 날짜가 있는지 확인
    const lastDate = localStorage.getItem("last_selected_date");
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // 2. 저장된 날짜가 있으면 그 날짜로, 없으면 오늘 날짜로 초기화
    const targetDate = lastDate || todayStr;
    
    document.getElementById("dateBox").textContent = formatWeekRange(targetDate);
    updateHeaderDates(targetDate); // 헤더 날짜(숫자)도 업데이트

    // 3. 직원 목록 초기화
    if (!localStorage.getItem("staffList")) {
        saveStaffList(["Staff A", "Staff B", "Staff C", "Staff D"]);
    }

    // 4. 자동 복원 실행 (이미 작성된 코드가 있다면 순서 유지)
    restoreAutoSavedLayout();
    calculateAllTotals();
};

/* ------------------------------
   UPDATE HEADER DATES
------------------------------ */

function updateHeaderDates(startDateStr) {
    const startDate = new Date(startDateStr);
    const headers = document.querySelectorAll(".schedule-table th.day-col");

    headers.forEach((th, i) => {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);

        const mm = d.getMonth() + 1;
        const dd = d.getDate();

        th.querySelector(".date-label").textContent = `${mm}/${dd}`;
    });
}

/* ------------------------------
   AUTO SAVE (ROW COUNT + STAFF ONLY)
------------------------------ */

// iPhone PWA에서도 동작하는 자동 저장
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
        const rows = document.querySelectorAll("#scheduleTable tbody tr");
        const saveData = [];

        rows.forEach(row => {
            const staff = row.querySelector(".staff-select").value;
            saveData.push({ staff });
        });

        localStorage.setItem("autosave_layout", JSON.stringify(saveData));
    }
});

/* ------------------------------
   AUTO RESTORE ON LOAD
------------------------------ */

function restoreAutoSavedLayout() {
    const saved = localStorage.getItem("autosave_layout");

    // null, undefined, 빈 문자열 모두 차단
    if (!saved || saved.trim() === "") return;

    let data;
    try {
        data = JSON.parse(saved);
    } catch (e) {
        // JSON 파싱 실패 시 자동 복원 중단 (white screen 방지)
        console.error("Invalid autosave_layout data:", e);
        return;
    }

    const tbody = document.querySelector("#scheduleTable tbody");
    tbody.innerHTML = "";

    data.forEach(item => {
        const row = createRow();
        row.querySelector(".staff-select").value = item.staff;
        tbody.appendChild(row);
    });

    calculateAllTotals();
}

// 페이지 로드 시 자동 복원 실행
window.addEventListener("load", restoreAutoSavedLayout);

/* ------------------------------
   MANAGE STAFF (ADD / DELETE)
------------------------------ */

// 모달 열기
document.getElementById("manageStaffBtn").onclick = () => {
    loadStaffListUI();
    document.getElementById("staffModal").style.display = "flex";
};

// 모달 닫기
document.getElementById("closeStaffBtn").onclick = () => {
    document.getElementById("staffModal").style.display = "none";
};

// 직원 목록 UI 로드
function loadStaffListUI() {
    const list = getStaffList();
    const ul = document.getElementById("staffList");
    ul.innerHTML = "";

    list.forEach((name, index) => {
        const li = document.createElement("li");
        li.className = "staff-item";

        li.innerHTML = `
            <span>${name}</span>
            <button class="delete-staff-btn" data-index="${index}">삭제</button>
        `;

        ul.appendChild(li);
    });
}

// 직원 추가
document.getElementById("addStaffBtn").onclick = () => {
    const input = document.getElementById("newStaffName");
    const name = input.value.trim();
    if (!name) return;

    const list = getStaffList();
    list.push(name);
    saveStaffList(list);

    input.value = "";
    loadStaffListUI();
    refreshAllStaffDropdowns();
};

// 직원 삭제
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-staff-btn")) {
        const index = parseInt(e.target.dataset.index);
        const list = getStaffList();

        list.splice(index, 1);
        saveStaffList(list);

        loadStaffListUI();
        refreshAllStaffDropdowns();
    }
});

// 모든 dropdown 업데이트
function refreshAllStaffDropdowns() {
    const staff = getStaffList();
    const selects = document.querySelectorAll(".staff-select");

    selects.forEach(select => {
        const current = select.value;

        select.innerHTML = "";
        staff.forEach(name => {
            const opt = document.createElement("option");
            opt.value = name;
            opt.textContent = name;
            select.appendChild(opt);
        });

        if (staff.includes(current)) {
            select.value = current;
        }
    });
}

// PWA가 죽은 세션을 복구하려고 할 때 자동 새로고침
if (performance.navigation.type === 2) {
    location.reload(true);
}
