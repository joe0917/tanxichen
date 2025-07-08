/**
 * 干支计算工具 - 完整版
 * 采用 IIFE 封装避免全局污染
 * 依赖：Fuse.js (需提前加载)
 */
(function() {
    // ==================== 数据配置 ====================
    const GAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
    const ZHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
    const eraData = window.eraData || []; // 从Hugo模板注入

    const appData = {
        currentEraRange: null,
        GAN,
        ZHI,
        eraData: window.eraData || {}
    };

    // ==================== DOM元素缓存 ====================
    const elements = {
        // 公元→干支部分
        yearInput: document.getElementById('year-input'),
        calculateBtn: document.getElementById('calculate-btn'),
        resultDiv: document.getElementById('result'),

        // 干支→公元部分
        periodSelect: document.getElementById('period-select'),
        dynastySelect: document.getElementById('dynasty-select'),
        eraSelect: document.getElementById('era-select'),
        ganSelect: document.getElementById('gan-select'),
        zhiSelect: document.getElementById('zhi-select'),
        finalSearchBtn: document.getElementById('final-search'),
        result2Div: document.getElementById('result2'),
        eraInput: document.getElementById('era-input')
    };

    // ==================== 工具函数 ====================
    function showError(container, message) {
        container.innerHTML = `<div class="error">${message}</div>`;
    }

    function showResult(container, message) {
        container.innerHTML = `<div class="success">${message}</div>`;
    }

    function resetEraSelection() {
        elements.eraSelect.innerHTML = '<option value="">-- 先选择朝代 --</option>';
        elements.eraSelect.disabled = true;
        resetGanzhiSelection();
    }

    function resetGanzhiSelection() {
        elements.ganSelect.innerHTML = '<option value="">-- 先选择年号 --</option>';
        elements.ganSelect.disabled = true;
        elements.zhiSelect.innerHTML = '<option value="">-- 先选择天干 --</option>';
        elements.zhiSelect.disabled = true;
        elements.finalSearchBtn.disabled = true;
        appData.currentEraRange = null;
    }

    // ==================== 核心计算函数 ====================
    function calculateGanzhi(year) {
        const baseYear = 4; // 公元4年是甲子年
        let offset = year - baseYear;
        if (year < 0) offset -= 1;

        return {
            gan: GAN[((offset % 10) + 10) % 10],
            zhi: ZHI[((offset % 12) + 12) % 12]
        };
    }

    function findEraInfo(year) {
        return eraData.filter(era => {
            const endYear = era.end || 9999;
            return era.start <= year && year <= endYear;
        });
    }

    // ==================== 公元→干支功能 ====================
    function handleCalculation() {
        const yearInput = elements.yearInput.value.trim();

        if (!yearInput) {
            showError(elements.resultDiv, "请输入有效年份");
            return;
        }

        const year = parseInt(yearInput);
        if (isNaN(year)) {
            showError(elements.resultDiv, "请输入有效的数字年份");
            return;
        }

        if (year < -2697 || year > 2100) {
            showError(elements.resultDiv, "请输入-2697到2100之间的年份");
            return;
        }

        const ganzhi = calculateGanzhi(year);
        const eraInfo = findEraInfo(year);
        displayResult(elements.resultDiv, year, ganzhi, eraInfo);
    }

    function displayResult(container, year, ganzhi, eras) {
        let html = `
            <div class="ganzhi-result">
                公元 ${year} 年：${ganzhi.gan}${ganzhi.zhi}年
            </div>
        `;

        if (eras.length > 0) {
            html += `<div class="era-list">`;
            eras.forEach(era => {
                html += `
                    <div class="era-item">
                        <span class="era-title">${era.period}·${era.dynasty}</span>
                        <span class="era-name">${era.name}</span>
                        <span class="era-years">${era.start}年 - ${era.end < 9999 ? era.end + '年' : '今'}</span>
                    </div>
                `;
            });
            html += `</div>`;
        } else {
            html += `<p>未找到该年份对应的年号记录</p>`;
        }

        container.innerHTML = html;
    }

    // ==================== 干支→公元功能 ====================
    function updateDynasties() {
        const period = elements.periodSelect.value;
        elements.dynastySelect.innerHTML = '<option value="">-- 选择朝代 --</option>';

        if (!period || !appData.eraData[period]) {
            elements.dynastySelect.disabled = true;
            resetEraSelection();
            return;
        }

        const dynasties = Object.keys(appData.eraData[period]);
        dynasties.forEach(dynasty => {
            const option = document.createElement('option');
            option.value = dynasty;
            option.textContent = dynasty;
            elements.dynastySelect.appendChild(option);
        });

        elements.dynastySelect.disabled = false;
        resetEraSelection();
    }

    function updateEras() {
        const period = elements.periodSelect.value;
        const dynasty = elements.dynastySelect.value;
        elements.eraSelect.innerHTML = '<option value="">-- 选择年号 --</option>';

        if (!dynasty || !appData.eraData[period] || !appData.eraData[period][dynasty]) {
            elements.eraSelect.disabled = true;
            resetGanzhiSelection();
            return;
        }

        appData.eraData[period][dynasty].forEach(era => {
            const option = document.createElement('option');
            option.value = JSON.stringify({start: era.start, end: era.end});
            option.textContent = era.name;
            elements.eraSelect.appendChild(option);
        });

        elements.eraSelect.disabled = false;
        resetGanzhiSelection();
    }

    function updateGanOptions() {
        if (!elements.eraSelect.value) {
            resetGanzhiSelection();
            return;
        }

        try {
            appData.currentEraRange = JSON.parse(elements.eraSelect.value);
            const {start, end} = appData.currentEraRange;

            // 计算该年号期间的所有天干
            const ganSet = new Set();
            for (let year = start; year <= end; year++) {
                const gan = calculateGanzhi(year).gan;
                ganSet.add(gan);
            }

            elements.ganSelect.innerHTML = '<option value="">-- 选择天干 --</option>';
            GAN.forEach((gan, index) => {
                if (ganSet.has(gan)) {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = gan;
                    elements.ganSelect.appendChild(option);
                }
            });

            elements.ganSelect.disabled = false;
            elements.zhiSelect.disabled = true;
            elements.finalSearchBtn.disabled = true;
        } catch (e) {
            console.error("解析年号范围失败:", e);
            resetGanzhiSelection();
        }
    }

    function updateZhiOptions() {
        const ganIdx = elements.ganSelect.value;
        elements.zhiSelect.innerHTML = '<option value="">-- 选择地支 --</option>';

        if (!ganIdx || !appData.currentEraRange) {
            elements.zhiSelect.disabled = true;
            elements.finalSearchBtn.disabled = true;
            return;
        }

        const gan = GAN[ganIdx];
        const {start, end} = appData.currentEraRange;

        // 计算该天干对应的地支
        const zhiSet = new Set();
        for (let year = start; year <= end; year++) {
            const {gan: currentGan, zhi} = calculateGanzhi(year);
            if (currentGan === gan) {
                zhiSet.add(zhi);
            }
        }

        ZHI.forEach((zhi, index) => {
            if (zhiSet.has(zhi)) {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = zhi;
                elements.zhiSelect.appendChild(option);
            }
        });

        elements.zhiSelect.disabled = false;
        elements.finalSearchBtn.disabled = false;
    }

    function searchByEra() {
        if (!elements.eraSelect.value) {
            showError(elements.result2Div, "请先选择完整的时期→朝代→年号");
            return;
        }

        try {
            const {start, end} = JSON.parse(elements.eraSelect.value);
            showResult(elements.result2Div,
                `已选择年号范围：${start}年 - ${end}年，请继续选择天干地支`);
        } catch (e) {
            showError(elements.result2Div, "年号数据解析失败");
        }
    }

    function convertToSimple(text) {
        const tradToSimple = {
            "開":"开", "國":"国", "寶":"宝", "龍":"龙",
            "鳳":"凤", "貞":"贞", "觀":"观", "曆":"历"
        };
        return text.split('').map(c => tradToSimple[c] || c).join('');
    }

    function fuzzySearch() {
        const input = elements.eraInput.value.trim();
        if (!input) {
            showError(elements.result2Div, "请输入要查询的年号");
            return;
        }

        const simpleInput = convertToSimple(input);
        const results = [];

        // 遍历所有数据查找匹配项
        for (const [period, dynasties] of Object.entries(appData.eraData)) {
            for (const [dynasty, eras] of Object.entries(dynasties)) {
                eras.forEach(era => {
                    if (era.name.includes(input) ||
                        (era.simpName && era.simpName.includes(simpleInput))) {
                        results.push({
                            period,
                            dynasty,
                            name: era.name,
                            start: era.start,
                            end: era.end
                        });
                    }
                });
            }
        }

        if (results.length === 0) {
            showError(elements.result2Div, "未找到匹配的年号");
            return;
        }

        let html = `<h3>找到 ${results.length} 个匹配结果：</h3>`;
        results.forEach(item => {
            html += `
                <div class="result-item">
                    <p><strong>${item.period}·${item.dynasty}</strong></p>
                    <p>年号：${item.name}（${item.start}年 - ${item.end}年）</p>
                    <button onclick="selectEra(${item.start}, ${item.end})">选择此年号</button>
                </div>
            `;
        });

        elements.result2Div.innerHTML = html;
    }

    function finalSearch() {
        const ganIdx = elements.ganSelect.value;
        const zhiIdx = elements.zhiSelect.value;

        if (!ganIdx || !zhiIdx || !appData.currentEraRange) {
            showError(elements.result2Div, "请选择完整的天干地支");
            return;
        }

        const gan = GAN[ganIdx];
        const zhi = ZHI[zhiIdx];
        const {start, end} = appData.currentEraRange;

        // 查找匹配年份
        const matches = [];
        for (let year = start; year <= end; year++) {
            const gz = calculateGanzhi(year);
            if (gz.gan === gan && gz.zhi === zhi) {
                matches.push(year);
            }
        }

        if (matches.length === 0) {
            showError(elements.result2Div,
                `在${start}-${end}年范围内未找到${gan}${zhi}年`);
            return;
        }

        let html = `<h3>查询结果：</h3>`;
        if (matches.length === 1) {
            html += `<p>唯一匹配年份：<strong>${matches[0]}年</strong></p>`;
        } else {
            html += `<p>找到多个匹配年份：${matches.join('年、')}年</p>`;
        }

        elements.result2Div.innerHTML = html;
    }

    function selectEra(start, end) {
        appData.currentEraRange = {start, end};
        elements.ganSelect.innerHTML = '<option value="">-- 选择天干 --</option>';

        // 计算天干选项
        const ganSet = new Set();
        for (let year = start; year <= end; year++) {
            const gan = calculateGanzhi(year).gan;
            ganSet.add(gan);
        }

        GAN.forEach((gan, index) => {
            if (ganSet.has(gan)) {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = gan;
                elements.ganSelect.appendChild(option);
            }
        });

        elements.ganSelect.disabled = false;
        elements.zhiSelect.disabled = true;
        elements.finalSearchBtn.disabled = true;

        showResult(elements.result2Div,
            `已选择年号范围：${start}年 - ${end}年，请继续选择天干地支`);
    }

    // ==================== 初始化 ====================
    function initEventListeners() {
        // 公元→干支部分
        if (elements.calculateBtn) {
            elements.calculateBtn.addEventListener('click', handleCalculation);
        }
        if (elements.yearInput) {
            elements.yearInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleCalculation();
            });
        }

        // 干支→公元部分
        if (elements.periodSelect) {
            elements.periodSelect.addEventListener('change', updateDynasties);
        }
        if (elements.dynastySelect) {
            elements.dynastySelect.addEventListener('change', updateEras);
        }
        if (elements.eraSelect) {
            elements.eraSelect.addEventListener('change', updateGanOptions);
        }
        if (elements.ganSelect) {
            elements.ganSelect.addEventListener('change', updateZhiOptions);
        }
        if (elements.finalSearchBtn) {
            elements.finalSearchBtn.addEventListener('click', finalSearch);
        }
    }

    document.addEventListener('DOMContentLoaded', initEventListeners);

    // ==================== 全局暴露 ====================
    // 兼容旧版HTML中的onclick调用
    window.updateDynasties = updateDynasties;
    window.updateEras = updateEras;
    window.searchByEra = searchByEra;
    window.fuzzySearch = fuzzySearch;
    window.finalSearch = finalSearch;
    window.selectEra = selectEra;
})();