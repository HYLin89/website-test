const API_URL = 'https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json';

const translations = {
    'zh-TW': {
        title: 'YouBike 即時查詢',
        timeLabel: '目前時間:',
        areaLabel: '行政區',
        stationLabel: '站點',
        selectStation: '請選擇站點',
        updateBtn: '立即更新',
        totalSpaces: '總停車格',
        availableBikes: '可借車輛',
        emptySpaces: '可還空位',
        loading: '載入中...',
        errorFetch: '資料讀取失敗，請檢查網路連線或稍後再試。',
        selectArea: '請選擇行政區',
        lastUpdated: '資料時間: '
    },
    'en': {
        title: 'YouBike Realwatch',
        timeLabel: 'Current Time:',
        areaLabel: 'District',
        stationLabel: 'Station',
        selectStation: 'Select Station',
        updateBtn: 'Refresh',
        totalSpaces: 'Total Spaces',
        availableBikes: 'Available Bikes',
        emptySpaces: 'Empty Docks',
        loading: 'Loading...',
        errorFetch: 'Failed to fetch data. Please check connection.',
        selectArea: 'Select District',
        lastUpdated: 'Data Time: '
    },
    'ja': {
        title: 'YouBike リアルタイム',
        timeLabel: '現在時刻:',
        areaLabel: 'エリア',
        stationLabel: 'ステーション',
        selectStation: 'ステーションを選択',
        updateBtn: '更新',
        totalSpaces: '総駐車枠',
        availableBikes: '貸出可',
        emptySpaces: '返却可',
        loading: '読み込み中...',
        errorFetch: 'データの取得に失敗しました。',
        selectArea: 'エリアを選択',
        lastUpdated: 'データ時刻: '
    },
    'zh-CN': {
        title: 'YouBike 即时查询',
        timeLabel: '当前时间:',
        areaLabel: '行政区',
        stationLabel: '站点',
        selectStation: '请选择站点',
        updateBtn: '立即更新',
        totalSpaces: '总停车格',
        availableBikes: '可借车辆',
        emptySpaces: '可还空位',
        loading: '载入中...',
        errorFetch: '数据读取失败，请检查网络连接或稍后再试。',
        selectArea: '请选择行政区',
        lastUpdated: '资料时间: '
    }
};

let currentLang = 'zh-TW';
let allData = [];
let areas = new Set();
let timerId = null;

// DOM Elements
const els = {
    appTitle: document.getElementById('app-title'),
    timeLabel: document.getElementById('current-time-label'),
    currentTime: document.getElementById('current-time'),
    langSelect: document.getElementById('lang-select'),
    areaLabel: document.getElementById('area-label'),
    areaSelect: document.getElementById('area-select'),
    stationLabel: document.getElementById('station-label'),
    stationSelect: document.getElementById('station-select'),
    stationPlaceholder: document.getElementById('select-station-placeholder'),
    updateBtn: document.getElementById('update-btn'),
    updateBtnText: document.getElementById('update-btn-text'),
    resultCard: document.getElementById('result-card'),
    stationNameDisplay: document.getElementById('station-name-display'),
    updateTimeDisplay: document.getElementById('data-update-time'),
    totalSpacesLabel: document.getElementById('total-spaces-label'),
    totalSpaces: document.getElementById('total-spaces'),
    availableBikesLabel: document.getElementById('available-bikes-label'),
    availableBikes: document.getElementById('available-bikes'),
    emptySpacesLabel: document.getElementById('empty-spaces-label'),
    emptySpaces: document.getElementById('empty-spaces'),
    loadingSpinner: document.getElementById('loading-spinner'),
    errorMsg: document.getElementById('error-message')
};

// Initialize
function init() {
    updateClock();
    setInterval(updateClock, 1000);

    // Listeners
    els.langSelect.addEventListener('change', (e) => setLanguage(e.target.value));
    els.updateBtn.addEventListener('click', fetchData);
    els.areaSelect.addEventListener('change', handleAreaChange);
    els.stationSelect.addEventListener('change', handleStationChange);

    // Initial Fetch
    fetchData();
}

function updateClock() {
    const now = new Date();
    els.currentTime.textContent = now.toLocaleTimeString(currentLang === 'en' ? 'en-US' : 'zh-TW', { hour12: false });
}

function setLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];

    els.appTitle.textContent = t.title;
    els.timeLabel.textContent = t.timeLabel;
    els.areaLabel.textContent = t.areaLabel;
    els.stationLabel.textContent = t.stationLabel;
    els.stationPlaceholder.textContent = t.selectStation;
    els.updateBtnText.textContent = t.updateBtn;
    els.totalSpacesLabel.textContent = t.totalSpaces;
    els.availableBikesLabel.textContent = t.availableBikes;
    els.emptySpacesLabel.textContent = t.emptySpaces;

    // Refresh display if data is present
    if (els.areaSelect.value) {
        // Keep selection, just update placeholder text logic if needed
    } else {
        els.areaSelect.options[0].textContent = t.selectArea;
    }

    // Update result card labels if visible
    if (!els.resultCard.classList.contains('hidden')) {
        // Re-render currently selected station to update time format if needed
        const currentSno = els.stationSelect.value;
        if (currentSno) {
            const station = allData.find(d => d.sno === currentSno);
            if (station) displayStationInfo(station);
        }
    }
}

async function fetchData() {
    showLoading(true);
    showError(null);
    els.resultCard.classList.add('hidden');

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        allData = await response.json();

        processData(allData);
        showLoading(false);
    } catch (error) {
        console.error('Fetch error:', error);
        showError(translations[currentLang].errorFetch);
        showLoading(false);
    }
}

function processData(data) {
    // Extract unique areas
    areas = new Set(data.map(item => item.sarea));

    // Populate Area Dropdown
    const currentArea = els.areaSelect.value;
    els.areaSelect.innerHTML = `<option value="">${translations[currentLang].selectArea}</option>`;

    Array.from(areas).sort().forEach(area => {
        const option = document.createElement('option');
        option.value = area;
        option.textContent = area;
        els.areaSelect.appendChild(option);
    });

    els.areaSelect.disabled = false;

    // Restore selection if possible
    if (currentArea && areas.has(currentArea)) {
        els.areaSelect.value = currentArea;
        handleAreaChange(); // Trigger station update
    } else {
        els.stationSelect.innerHTML = `<option value="">${translations[currentLang].selectStation}</option>`;
        els.stationSelect.disabled = true;
    }
}

function handleAreaChange() {
    const area = els.areaSelect.value;
    els.stationSelect.innerHTML = `<option value="">${translations[currentLang].selectStation}</option>`;

    if (!area) {
        els.stationSelect.disabled = true;
        return;
    }

    const stationsInArea = allData.filter(d => d.sarea === area);
    stationsInArea.forEach(station => {
        const option = document.createElement('option');
        option.value = station.sno;
        // Show English name if language is English, otherwise standard name (usually Chinese)
        // The API returns 'sna' (Chinese name usually with YouBike prefix) and 'snaen' (English)
        // We'll just use sna for CJK and snaen for English if available
        let name = station.sna.replace('YouBike2.0_', '');
        if (currentLang === 'en' && station.snaen) {
            name = station.snaen.replace('YouBike2.0_', '');
        }
        option.textContent = name;
        els.stationSelect.appendChild(option);
    });

    els.stationSelect.disabled = false;
}

function handleStationChange() {
    const sno = els.stationSelect.value;
    if (!sno) {
        els.resultCard.classList.add('hidden');
        return;
    }

    const station = allData.find(d => d.sno === sno);
    if (station) {
        displayStationInfo(station);
    }
}

function displayStationInfo(station) {
    let name = station.sna.replace('YouBike2.0_', '');
    if (currentLang === 'en' && station.snaen) {
        name = station.snaen.replace('YouBike2.0_', '');
    }

    els.stationNameDisplay.textContent = name;

    // Parsing custom date format from API usually YYYY-MM-DD HH:mm:ss? Or YYYYMMDD...
    // API example: "srcUpdateTime": "2023-10-27 15:35:12"
    // We update the label to match language
    els.updateTimeDisplay.textContent = `${translations[currentLang].lastUpdated} ${station.srcUpdateTime}`;

    els.totalSpaces.textContent = station.Quantity;
    els.availableBikes.textContent = station.available_rent_bikes; // Available Rent Bikes
    els.emptySpaces.textContent = station.available_return_bikes; // Available Return Bikes

    els.resultCard.classList.remove('hidden');
}

function showLoading(isLoading) {
    if (isLoading) {
        els.loadingSpinner.classList.remove('hidden');
        els.updateBtn.disabled = true;
    } else {
        els.loadingSpinner.classList.add('hidden');
        els.updateBtn.disabled = false;
    }
}

function showError(msg) {
    if (msg) {
        els.errorMsg.textContent = msg;
        els.errorMsg.classList.remove('hidden');
    } else {
        els.errorMsg.classList.add('hidden');
    }
}

// Start
init();
