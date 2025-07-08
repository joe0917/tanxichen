/**
 * 干支计算工具 - 完整版 (适配 dynasty.json 数据结构)
 * 采用模块化设计，避免全局污染
 */
(function() {
    // ==================== 常量定义 ====================
    const GAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
    const ZHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];

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

    // ==================== 核心功能函数 ====================

    /**
     * 计算指定年份的干支
     * @param {number} year 公元年份
     * @returns {Object} {gan: '甲', zhi: '子'}
     */
    function calculateGanzhi(year) {
        const baseYear = 4; // 公元4年是甲子年
        let offset = year - baseYear;
        if (year < 0) offset -= 1;

        return {
            gan: GAN[((offset % 10) + 10) % 10],
            zhi: ZHI[((offset % 12) + 12) % 12]
        };
    }

    /**
     * 根据年份查找对应的年号信息
     * @param {number} year 要查询的年份
     * @returns {Array} 匹配的年号数组
     */
    function findEraInfo(year) {
        if (!window.eraData) return [];

        const results = [];
        window.eraData.forEach(period => {
            Object.values(period.dynasties).forEach(eras => {
                eras.forEach(era => {
                    const endYear = era.end || 9999;
                    if (era.start <= year && year <= endYear) {
                        results.push({
                            period: period.period,
                            dynasty: Object.keys(period.dynasties)[0],
                            name: era.name,
                            start: era.start,
                            end: era.end
                        });
                    }
                });
            });
        });

        return results;
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
                <h3>公元 ${year} 年：${ganzhi.gan}${ganzhi.zhi}年</h3>
        `;

        if (eras.length > 0) {
            html += `<div class="era-list"><ul>`;
            eras.forEach(era => {
                html += `
                    <li>
                        <strong>${era.period}·${era.dynasty}</strong>
                        <span>${era.name}年号</span>
                        <em>(${era.start}年 - ${era.end < 9999 ? era.end + '年' : '今'})</em>
                    </li>
                `;
            });
            html += `</ul></div>`;
        } else {
            html += `<p class="no-result">未找到该年份对应的年号记录</p>`;
        }

        container.innerHTML = html;
    }

    // ==================== 干支→公元功能 ====================

        function updateDynasties() {
            const period = document.getElementById('period-select').value;
            const dynastySelect = document.getElementById('dynasty-select');

            dynastySelect.innerHTML = '<option value="">-- 选择朝代 --</option>';
            if (!period) {
                dynastySelect.disabled = true;
                resetEraSelection();
                return;
            }

            const dynasties = Object.keys(appData.eraData[period]);
            dynasties.forEach(dynasty => {
                const option = document.createElement('option');
                option.value = dynasty;
                option.textContent = dynasty;
                dynastySelect.appendChild(option);
            });

            dynastySelect.disabled = false;
            resetEraSelection();
        }

        function updateEras() {
            const period = document.getElementById('period-select').value;
            const dynasty = document.getElementById('dynasty-select').value;
            const eraSelect = document.getElementById('era-select');

            eraSelect.innerHTML = '<option value="">-- 选择年号 --</option>';
            if (!dynasty) {
                eraSelect.disabled = true;
                resetGanzhiSelection();
                return;
            }

            appData.eraData[period][dynasty].forEach(era => {
                const option = document.createElement('option');
                option.value = JSON.stringify({start: era.start, end: era.end});
                option.textContent = era.name;
                eraSelect.appendChild(option);
            });

            eraSelect.disabled = false;
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
                    const option = new Option(gan, index);
                    elements.ganSelect.add(option);
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

    // ==================== 工具函数 ====================

    function showError(container, message) {
        container.innerHTML = `<div class="error"><span>⚠️</span>${message}</div>`;
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
    }

    // ==================== 事件初始化 ====================

    function initEventListeners() {
        // 公元→干支部分
        if (elements.calculateBtn) {
            elements.calculateBtn.addEventListener('click', handleCalculation);
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

    // ==================== 启动初始化 ====================
    document.addEventListener('DOMContentLoaded', function() {
        console.log("初始化干支计算工具...");
        console.log("可用时期数据:", window.eraData);
        initEventListeners();
    });

    // ==================== 全局方法暴露 ====================
    // 兼容旧版HTML中的onclick调用
    window.updateDynasties = updateDynasties;
    window.updateEras = updateEras;
    window.searchByEra = searchByEra;
    window.fuzzySearch = fuzzySearch;
    window.finalSearch = finalSearch;
})();