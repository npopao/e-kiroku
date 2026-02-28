/**
 * e-kiroku Admin Logic (v3 - Cloud/Supabase)
 */
class AdminApp {
    constructor() {
        this.config = {
            url: 'https://mwxgkpquwvdfbctszwzx.supabase.co',
            key: 'sb_publishable_7ax3iL4T4OUjvDqWUXtzcA_jA4nNEdE'
        };

        this.schedules = [];
        this.specificSchedules = {};
        this.templates = [];
        this.users = [];
        this.helpers = [];
        this.records = [];

        this.editingTemplateId = null;
        this.editingUserId = null;
        this.editingHelperId = null;
        this.currentCalDate = new Date();
        this.currentTemplateCategory = 'club';
        this.isRubiVisible = localStorage.getItem('ekiroku_rubi_visible') !== 'false';

        this.holidays2026 = {
            "2026-01-01": "元日", "2026-01-12": "成人の日",
            "2026-02-11": "建国記念の日", "2026-02-23": "天皇誕生日",
            "2026-03-21": "春分の日", "2026-04-29": "昭和の日",
            "2026-05-03": "憲法記念日", "2026-05-04": "みどりの日", "2026-05-05": "こどもの日", "2026-05-06": "振替休日",
            "2026-07-20": "海の日", "2026-08-11": "山の日",
            "2026-09-21": "敬老の日", "2026-09-22": "国民の休日", "2026-09-23": "秋分の日",
            "2026-10-12": "スポーツの日", "2026-11-03": "文化の日", "2026-11-23": "勤労感謝の日"
        };

        this.notifications = [];
        this.unitTable = this.initUnitTable();
        this.init();
    }

    async init() {
        await this.loadData();
        this.cacheDOM();
        this.bindEvents();
        this.renderAll();
    }

    async sbFetch(path, options = {}) {
        const headers = {
            'apikey': this.config.key,
            'Authorization': `Bearer ${this.config.key}`,
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };
        const res = await fetch(`${this.config.url}/rest/v1/${path}`, { ...options, headers });
        if (!res.ok) {
            const err = await res.text();
            console.error(`Supabase error (${path}):`, err);
            throw new Error(err);
        }
        if (res.status === 204 || res.status === 201) return null;
        const text = await res.text();
        return text ? JSON.parse(text) : null;
    }

    async loadData() {
        try {
            const [h, u, t, s, ss, r, n] = await Promise.all([
                this.sbFetch('helpers?select=*'),
                this.sbFetch('users?select=*'),
                this.sbFetch('templates?select=*'),
                this.sbFetch('schedules?select=*'),
                this.sbFetch('specific_schedules?select=*'),
                this.sbFetch('records?select=*&order=datetime.desc'),
                this.sbFetch('notifications?select=*&order=created_at.desc')
            ]);

            this.helpers = h || [];
            this.users = u.map(x => ({
                ...x,
                isCare: x.is_care, is3rd: x.is_3rd, isDouble: x.is_double
            })) || [];
            this.notifications = n || [];
            this.templates = t || [];
            this.records = r || [];

            // Map schedules (DB snake_case -> JS camelCase)
            this.schedules = (s || []).map(x => ({
                id: x.id,
                dayOfWeek: x.day_of_week,
                startTime: x.start_time,
                endTime: x.end_time,
                helperId: x.helper_id,
                userId: x.user_id
            }));

            // Map specific_schedules (DB flat list -> JS date keyed object)
            this.specificSchedules = {};
            (ss || []).forEach(x => {
                if (!this.specificSchedules[x.date]) this.specificSchedules[x.date] = [];
                this.specificSchedules[x.date].push({
                    startTime: x.start_time,
                    endTime: x.end_time,
                    helperId: x.helper_id,
                    userId: x.user_id,
                    id: x.id
                });
            });

        } catch (err) {
            alert("クラウドデータの読み込みに失敗しました。");
        }
    }

    cacheDOM() {
        this.app = document.getElementById('app');
        this.navItems = document.querySelectorAll('.admin-nav-item');
        this.tabPanes = document.querySelectorAll('.tab-pane');
        this.patternForm = document.getElementById('schedule-form');
        this.userForm = document.getElementById('user-form');
        this.helperForm = document.getElementById('helper-form');
        this.templateForm = document.getElementById('template-form');
        this.specScheduleForm = document.getElementById('specific-schedule-form');
        this.scheduleListEl = document.getElementById('schedule-list');
        this.userListEl = document.getElementById('admin-user-list');
        this.adminHelperList = document.getElementById('admin-helper-list');
        this.adminTemplateList = document.getElementById('admin-template-list');
        this.alertsContainer = document.getElementById('admin-alerts-container');
        this.notifForm = document.getElementById('notification-form');
        this.revMonthSelect = document.getElementById('rev-month-select');
        this.revTotalUnits = document.getElementById('rev-total-units');
        this.revenueList = document.getElementById('revenue-list');
        this.uIsCare = document.getElementById('u-is-care');
        this.uIs3rd = document.getElementById('u-is-3rd');
        this.uIsDouble = document.getElementById('u-is-double');
        this.helperSelect = document.getElementById('s-helper');
        this.userSelect = document.getElementById('s-user');
        this.specUserSelect = document.getElementById('spec-user');
        this.specHelperSelect = document.getElementById('spec-helper');
        this.calHelperFilter = document.getElementById('cal-helper-filter');
        this.calendarDays = document.getElementById('calendar-days');
        this.calMonthTitle = document.getElementById('cal-month-title');
        this.btnCalPrev = document.getElementById('cal-prev');
        this.btnCalNext = document.getElementById('cal-next');
        this.timeSlotsContainer = document.getElementById('time-slots-container');
        this.btnAddTime = document.getElementById('btn-add-time');
        this.btnToggleRubi = document.getElementById('btn-toggle-rubi');
        this.modalDateSchedule = document.getElementById('modal-date-schedule');
        this.modalDateTitle = document.getElementById('modal-date-title');
        this.btnCloseModal = document.getElementById('btn-close-modal');
        this.btnDeleteSpec = document.getElementById('btn-delete-spec');
        this.specDateInput = document.getElementById('spec-date');
        this.specTimeStartH = document.getElementById('spec-time-start-h');
        this.specTimeStartM = document.getElementById('spec-time-start-m');
        this.specTimeEndH = document.getElementById('spec-time-end-h');
        this.specTimeEndM = document.getElementById('spec-time-end-m');
        this.templateAdminTabs = document.getElementById('template-admin-tabs');
        this.todayScheduleListEl = document.getElementById('today-schedule-list');
        this.summaryTodayRecordsEl = document.getElementById('summary-today-records');
        this.summaryTodayPendingEl = document.getElementById('summary-today-pending');
    }

    bindEvents() {
        this.navItems.forEach(item => {
            item.onclick = (e) => this.switchTab(e.target.closest('.admin-nav-item').dataset.tab);
        });
        this.btnToggleRubi.onclick = () => {
            this.isRubiVisible = !this.isRubiVisible;
            localStorage.setItem('ekiroku_rubi_visible', this.isRubiVisible);
            this.applyRubiState();
        };
        this.btnAddTime.onclick = () => this.addTimeSlot();
        this.timeSlotsContainer.onclick = (e) => {
            if (e.target.classList.contains('remove-time-btn')) {
                e.target.closest('.time-input-group').remove();
                this.updateRemoveButtons();
            }
        };
        if (this.notifForm) this.notifForm.onsubmit = (e) => this.handleNotifSubmit(e);
        if (this.revMonthSelect) this.revMonthSelect.onchange = () => this.renderRevenue();

        this.patternForm.onsubmit = (e) => this.handlePatternSubmit(e);
        this.userForm.onsubmit = (e) => this.handleUserSubmit(e);
        this.helperForm.onsubmit = (e) => this.handleHelperSubmit(e);
        this.templateForm.onsubmit = (e) => this.handleTemplateSubmit(e);

        if (this.templateAdminTabs) {
            this.templateAdminTabs.onclick = (e) => {
                if (e.target.classList.contains('tab-btn')) {
                    this.currentTemplateCategory = e.target.dataset.category;
                    document.querySelectorAll('#template-admin-tabs .tab-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    this.renderTemplates();
                }
            };
        }

        this.btnCalPrev.onclick = () => { this.currentCalDate.setMonth(this.currentCalDate.getMonth() - 1); this.renderCalendar(); };
        this.btnCalNext.onclick = () => { this.currentCalDate.setMonth(this.currentCalDate.getMonth() + 1); this.renderCalendar(); };
        this.calHelperFilter.onchange = () => this.renderCalendar();
        this.btnCloseModal.onclick = () => this.modalDateSchedule.style.display = 'none';
        this.specScheduleForm.onsubmit = (e) => this.handleSpecSubmit(e);
        this.btnDeleteSpec.onclick = () => this.handleSpecDelete();

        this.scheduleListEl.onclick = (e) => this.handleListClick(e, 'schedule');
        this.userListEl.onclick = (e) => this.handleListClick(e, 'user');
        this.adminHelperList.onclick = (e) => this.handleListClick(e, 'helper');
        this.adminTemplateList.onclick = (e) => this.handleListClick(e, 'template');
        this.calendarDays.onclick = (e) => this.handleCalendarClick(e);

        // CSV Events
        document.getElementById('btn-export-users').onclick = () => this.exportUsersCSV();
        document.getElementById('btn-export-helpers').onclick = () => this.exportHelpersCSV();
        document.getElementById('btn-import-users').onchange = (e) => this.importCSV(e, 'users');
        document.getElementById('btn-import-helpers').onchange = (e) => this.importCSV(e, 'helpers');

        // QR Print Events
        const btnCloseQrModal = document.getElementById('btn-close-qr-modal');
        if (btnCloseQrModal) {
            btnCloseQrModal.onclick = () => {
                document.getElementById('qr-print-modal').style.display = 'none';
            }
        }

        // Data Sync Events
        window.addEventListener('storage', (e) => {
            if (e.key === 'ekiroku_data_updated') {
                this.loadData().then(() => this.renderAll());
            }
        });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.loadData().then(() => this.renderAll());
            }
        });
    }

    initUnitTable() {
        // 都の「移動支援給付費 単位表（介護あり・介護なし 日中のみ）」に基づく正確な単位 × 10円
        // 例）介護あり 日中30：256単位 → 2,560円
        this.unitTableCare = {
            30: 2560,
            60: 4040,
            90: 5870,
            120: 6690,
            150: 7540,
            180: 8370,
            210: 9210,
            240: 10040,
            270: 10870,
            300: 11700,
            330: 12530,
            360: 13360,
            390: 14190,
            420: 15020,
            450: 15850,
            480: 16680,
            510: 17510,
            540: 18340,
            570: 19170,
            600: 20000,
            630: 20830,
        };
        // 介護なし 日中のみの単位 × 10円
        this.unitTableNoCare = {
            30: 1060,
            60: 1970,
            90: 2750,
            120: 3450,
            150: 4140,
            180: 4830,
            210: 5520,
            240: 6210,
            270: 6900,
            300: 7590,
            330: 8280,
            360: 8970,
            390: 9660,
            420: 10350,
            450: 11040,
            480: 11730,
            510: 12420,
            540: 13110,
            570: 13800,
            600: 14490,
            630: 15180,
        };
        return this.unitTableCare;
    }

    switchTab(tab) {
        this.navItems.forEach(i => i.classList.remove('active'));
        document.querySelector(`.admin-nav-item[data-tab="${tab}"]`).classList.add('active');
        this.tabPanes.forEach(p => p.classList.remove('active'));
        document.getElementById('pane-' + tab).classList.add('active');
    }

    addTimeSlot() {
        const div = document.createElement('div');
        div.className = 'time-input-group';
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:4px;">
                <select class="form-control s-hour s-time-start-h" required style="padding-right: 25px;"></select>時
                <select class="form-control s-min s-time-start-m" required style="padding-right: 25px;"></select>分
            </div>
            <span>〜</span>
            <div style="display:flex; align-items:center; gap:4px;">
                <select class="form-control s-hour s-time-end-h" required style="padding-right: 25px;"></select>時
                <select class="form-control s-min s-time-end-m" required style="padding-right: 25px;"></select>分
            </div>
            <button type="button" class="delete-btn remove-time-btn">✖</button>
        `;
        this.timeSlotsContainer.appendChild(div);
        this.populateTimeSelects(div);
        this.updateRemoveButtons();
    }

    updateRemoveButtons() {
        const groups = this.timeSlotsContainer.querySelectorAll('.time-input-group');
        groups.forEach(g => {
            g.querySelector('.remove-time-btn').style.display = groups.length > 1 ? 'block' : 'none';
        });
    }

    populateSelects() {
        const hHtml = this.helpers.map(h => `<option value="${h.id}">${this.stripRubi(h.name)}</option>`).join('');
        const hFilterHtml = `<option value="">全員の予定を表示</option>` + hHtml;
        const uHtml = this.users.map(u => `<option value="${u.id}">${this.stripRubi(u.name)}</option>`).join('');

        this.helperSelect.innerHTML = hHtml;
        this.userSelect.innerHTML = uHtml;
        this.specHelperSelect.innerHTML = hHtml;
        this.specUserSelect.innerHTML = uHtml;
        this.calHelperFilter.innerHTML = hFilterHtml;
    }

    populateTimeSelects(container = null) {
        const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
        const mins = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));
        const hOptions = hours.map(v => `<option value="${v}">${v}</option>`).join('');
        const mOptions = mins.map(v => `<option value="${v}">${v}</option>`).join('');
        const target = container || document;
        target.querySelectorAll('.s-hour').forEach(s => s.innerHTML = hOptions);
        target.querySelectorAll('.s-min').forEach(s => s.innerHTML = mOptions);

        if (!container) {
            if (this.specTimeStartH) this.specTimeStartH.innerHTML = hOptions;
            if (this.specTimeStartM) this.specTimeStartM.innerHTML = mOptions;
            if (this.specTimeEndH) this.specTimeEndH.innerHTML = hOptions;
            if (this.specTimeEndM) this.specTimeEndM.innerHTML = mOptions;
        }
    }

    async handlePatternSubmit(e) {
        e.preventDefault();
        const dayCheckboxes = document.querySelectorAll('#s-days input[type="checkbox"]:checked');
        if (!dayCheckboxes.length) return alert('曜日を選択してください。');

        const slots = [];
        this.timeSlotsContainer.querySelectorAll('.time-input-group').forEach(g => {
            slots.push({
                start: `${g.querySelector('.s-time-start-h').value}:${g.querySelector('.s-time-start-m').value}`,
                end: `${g.querySelector('.s-time-end-h').value}:${g.querySelector('.s-time-end-m').value}`
            });
        });

        const newSchs = [];
        dayCheckboxes.forEach(cb => {
            const day = parseInt(cb.value);
            slots.forEach(s => {
                newSchs.push({
                    id: 'sch_' + Date.now() + Math.random().toString(36).substr(2, 5),
                    day_of_week: day, start_time: s.start, end_time: s.end,
                    helper_id: this.helperSelect.value, user_id: this.userSelect.value
                });
            });
        });

        await this.sbFetch('schedules', { method: 'POST', body: JSON.stringify(newSchs) });
        await this.loadData();
        this.renderAll();
        this.patternForm.reset();
        alert('パターンを登録しました。');
    }

    async handleUserSubmit(e) {
        e.preventDefault();
        const name = document.getElementById('u-name').value;
        const email = document.getElementById('u-email').value;
        const payload = {
            name, email, kana: this.stripRubi(name),
            is_care: this.uIsCare.checked,
            is_3rd: this.uIs3rd.checked,
            is_double: this.uIsDouble.checked
        };

        try {
            if (this.editingUserId) {
                await this.sbFetch(`users?id=eq.${this.editingUserId}`, { method: 'PATCH', body: JSON.stringify(payload) });
                this.showToast("利用者を更新しました");
            } else {
                payload.id = 'u_' + Date.now();
                await this.sbFetch('users', { method: 'POST', body: JSON.stringify(payload) });
                this.showToast("利用者を登録しました");
            }
            this.userForm.reset();
            this.editingUserId = null;
            document.getElementById('btn-save-user').textContent = "利用者を登録";
            await this.loadData();
            this.renderAll();
        } catch (err) {
            this.showToast("保存に失敗しました", true);
        }
    }

    async handleHelperSubmit(e) {
        e.preventDefault();
        const name = document.getElementById('h-name').value;
        const email = document.getElementById('h-email').value;
        const payload = { name, email };
        if (this.editingHelperId) {
            await this.sbFetch(`helpers?id=eq.${this.editingHelperId}`, { method: 'PATCH', body: JSON.stringify(payload) });
            this.editingHelperId = null;
            document.getElementById('btn-save-helper').textContent = 'ヘルパーを登録';
        } else {
            payload.id = 'h_' + Date.now();
            await this.sbFetch('helpers', { method: 'POST', body: JSON.stringify(payload) });
        }
        await this.loadData();
        this.renderAll();
        this.helperForm.reset();
    }

    updateAlerts() {
        if (!this.alertsContainer) return;
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const alerts = [];

        // 1. Unentered Records Alert
        const todayPatterns = this.schedules.filter(s => s.dayOfWeek === now.getDay());
        const todaySpecs = this.specificSchedules[todayStr] || [];
        const allToday = [...todayPatterns, ...todaySpecs];

        allToday.forEach(s => {
            const endParts = s.endTime.split(':');
            const endMin = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
            if (currentTime > endMin) {
                const hasRecord = this.records.some(r => r.date === todayStr && r.user_id === s.userId);
                if (!hasRecord) {
                    const user = this.users.find(u => u.id === s.userId);
                    alerts.push(`<div class="alert-item"><span>【未記入】${user ? user.name : '利用者'} 様（${s.endTime}終了分）</span> <span class="alert-badge">警告</span></div>`);
                }
            }
        });

        // 2. 2-Hour Rule Check (for schedules in general)
        // We'll check this per user across the schedule list
        const userGroups = {};
        this.schedules.forEach(s => {
            if (!userGroups[s.userId]) userGroups[s.userId] = {};
            if (!userGroups[s.userId][s.dayOfWeek]) userGroups[s.userId][s.dayOfWeek] = [];
            userGroups[s.userId][s.dayOfWeek].push(s);
        });

        Object.values(userGroups).forEach(days => {
            Object.values(days).forEach(schs => {
                schs.sort((a, b) => a.startTime.localeCompare(b.startTime));
                for (let i = 0; i < schs.length - 1; i++) {
                    const current = schs[i];
                    const next = schs[i + 1];
                    const diff = this.calcDiffMin(current.endTime, next.startTime);
                    if (diff < 120 && diff >= 0) {
                        const user = this.users.find(u => u.id === current.userId);
                        alerts.push(`<div class="alert-item" style="border-left-color:var(--alert-color); color:#9a3412; background:#fff7ed; border-color:#fed7aa;">
                            <span>【2時間ルール】${user ? user.name : '利用者'} 様の${this.getDayName(current.dayOfWeek)}曜日の間隔が短すぎます</span> <span class="alert-badge" style="background:var(--alert-color);">注意</span>
                        </div>`);
                    }
                }
            });
        });

        this.alertsContainer.innerHTML = alerts.slice(0, 5).join('');
    }

    calcDiffMin(start, end) {
        const s = start.split(':');
        const e = end.split(':');
        return (parseInt(e[0]) * 60 + parseInt(e[1])) - (parseInt(s[0]) * 60 + parseInt(s[1]));
    }

    getDayName(day) {
        return ["日", "月", "火", "水", "木", "金", "土"][day];
    }

    renderRevenue() {
        if (!this.revenueList) return;
        const targetMonth = this.revMonthSelect.value;
        const [year, month] = targetMonth.split('-').map(Number);

        let totalUnits = 0;
        const items = [];
        const daysInMonth = new Date(year, month, 0).getDate();

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month - 1, d);
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayOfWeek = date.getDay();

            const patterns = this.schedules.filter(s => s.dayOfWeek === dayOfWeek);
            const specs = this.specificSchedules[dateStr] || [];
            const allDay = [...patterns, ...specs];

            // Group by User for 2-hour rule
            const userGroups = {};
            allDay.forEach(s => {
                if (!userGroups[s.userId]) userGroups[s.userId] = [];
                userGroups[s.userId].push(s);
            });

            Object.keys(userGroups).forEach(userId => {
                const user = this.users.find(u => u.id === userId);
                if (!user) return;

                const userSchedules = userGroups[userId].sort((a, b) => a.startTime.localeCompare(b.startTime));

                // Combine schedules if interval < 120 min (2-hour rule)
                let combined = [];
                if (userSchedules.length > 0) {
                    let current = { ...userSchedules[0] };
                    for (let i = 1; i < userSchedules.length; i++) {
                        const next = userSchedules[i];
                        const gap = this.calcDiffMin(current.endTime, next.startTime);
                        if (gap < 120) {
                            current.endTime = next.endTime;
                        } else {
                            combined.push(current);
                            current = { ...next };
                        }
                    }
                    combined.push(current);
                }

                combined.forEach(s => {
                    const rawMin = this.calcDiffMin(s.startTime, s.endTime);
                    // Edogawa Rule: 15min rounding
                    // <15: 0, 15-44: 30, 45-74: 60...
                    const roundedMin = Math.floor((rawMin + 15) / 30) * 30;
                    if (roundedMin === 0) return;

                    let units = this.calculateUnits(roundedMin, user, s);
                    totalUnits += units;

                    if (items.length < 200) {
                        items.push(`<div class="revenue-item">
                            <div class="details">
                                <span style="font-weight:600;">${month}/${d} ${user.name} 様</span>
                                <span style="font-size:0.75rem; color:var(--text-muted);">${s.startTime}〜${s.endTime} (${rawMin}分 ➔ ${roundedMin}分)</span>
                            </div>
                            <div class="units">${units.toLocaleString()} 円</div>
                        </div>`);
                    }
                });
            });
        }

        this.revTotalUnits.textContent = totalUnits.toLocaleString();
        this.revenueList.innerHTML = items.length ? items.join('') : '<div style="padding:20px; text-align:center; color:var(--text-muted);">予定がありません</div>';
    }

    calculateUnits(min, user, sch) {
        // 時間帯別の支援時間を集計し、「一番長い時間帯」のコードを採用する
        // 例3-1/3-2：前後同じ時間なら前の時間帯、それ以外は長い方の時間帯
        const parseTimeToMinutes = (t) => {
            const [hh, mm] = t.split(':').map(Number);
            return hh * 60 + mm;
        };

        const startMin = parseTimeToMinutes(sch.startTime);
        let endMin = parseTimeToMinutes(sch.endTime);
        // 終了時刻が開始より前なら日付またぎとみなして24h加算（簡易対応）
        if (endMin < startMin) endMin += 24 * 60;

        const bands = {
            early: 0,   // 早朝 6:00〜8:00
            day: 0,     // 日中 8:00〜18:00
            night: 0,   // 夜間 18:00〜22:00
            mid: 0      // 深夜 22:00〜6:00
        };

        const addOverlap = (from, to, label) => {
            const s = Math.max(startMin, from);
            const e = Math.min(endMin, to);
            if (e > s) bands[label] += (e - s);
        };

        const DAY_MIN = 24 * 60;
        // 深夜は 22:00〜24:00 と 0:00〜6:00 に分割
        addOverlap(6 * 60, 8 * 60, 'early');
        addOverlap(8 * 60, 18 * 60, 'day');
        addOverlap(18 * 60, 22 * 60, 'night');
        addOverlap(22 * 60, DAY_MIN, 'mid');
        addOverlap(0, 6 * 60, 'mid');

        // 最長時間の時間帯を決定（同じなら「前の」時間帯を優先）
        const order = ['early', 'day', 'night', 'mid'];
        let dominant = 'day';
        let maxMinutes = -1;
        for (const key of order) {
            if (bands[key] > maxMinutes) {
                maxMinutes = bands[key];
                dominant = key;
            }
        }

        let mult = 1.0;
        if (dominant === 'early' || dominant === 'night') mult = 1.25;
        else if (dominant === 'mid') mult = 1.5;

        // 単位表（基本は日中）からベース単価を取得
        const table = user.isCare ? this.unitTableCare : this.unitTableNoCare;
        const step = Math.min(Math.floor(min / 30) * 30, 360);
        let base = table[step] || 0;

        // 360分を超えた分は「日中増分／日中増」を利用（介護あり：83単位／30分、介護なし：69単位／30分）
        if (min > 360) {
            const extraSteps = Math.floor((min - 360) / 30);
            const extraPer30 = user.isCare ? 830 : 690;
            base += extraSteps * extraPer30;
        }

        let total = Math.floor(base * mult);

        // 3級・2人介護の補正
        if (user.is3rd) total = Math.floor(total * 0.7);
        if (user.isDouble) total = total * 2;

        return total;
    }

    async handleTemplateSubmit(e) {
        e.preventDefault();
        const payload = {
            title: document.getElementById('t-title').value,
            content: document.getElementById('t-content').value,
            category: document.getElementById('t-category').value
        };
        if (this.editingTemplateId) {
            await this.sbFetch(`templates?id=eq.${this.editingTemplateId}`, { method: 'PATCH', body: JSON.stringify(payload) });
            this.editingTemplateId = null;
            document.getElementById('btn-save-template').textContent = 'テンプレートを追加';
        } else {
            payload.id = 't_' + Date.now();
            await this.sbFetch('templates', { method: 'POST', body: JSON.stringify(payload) });
        }
        await this.loadData();
        this.renderAll();
        this.templateForm.reset();
    }

    async handleSpecSubmit(e) {
        e.preventDefault();
        const payload = {
            date: this.specDateInput.value,
            start_time: `${document.getElementById('spec-time-start-h').value}:${document.getElementById('spec-time-start-m').value}`,
            end_time: `${document.getElementById('spec-time-end-h').value}:${document.getElementById('spec-time-end-m').value}`,
            user_id: this.specUserSelect.value,
            helper_id: this.specHelperSelect.value
        };

        if (this.editingSpecId) {
            await this.sbFetch(`specific_schedules?id=eq.${this.editingSpecId}`, { method: 'PATCH', body: JSON.stringify(payload) });
        } else {
            payload.id = 'spec_' + Date.now();
            await this.sbFetch('specific_schedules', { method: 'POST', body: JSON.stringify(payload) });
        }

        await this.loadData();
        this.renderCalendar();
        this.modalDateSchedule.style.display = 'none';
        this.renderDashboard();
    }

    async handleSpecDelete() {
        if (!this.editingSpecId) return;
        if (!confirm('この予定を削除しますか？')) return;
        await this.sbFetch(`specific_schedules?id=eq.${this.editingSpecId}`, { method: 'DELETE' });
        await this.loadData();
        this.renderCalendar();
        this.modalDateSchedule.style.display = 'none';
        this.renderDashboard();
    }

    async handleListClick(e, type) {
        const btnDelete = e.target.closest('.delete-btn');
        const btnEdit = e.target.closest('.edit-btn');
        const btnQr = e.target.closest('.qr-btn');

        if (!btnDelete && !btnEdit && !btnQr) return;

        const id = (btnDelete || btnEdit || btnQr).dataset.id;

        if (btnQr && type === 'user') {
            this.showUserQrModal(id);
            return;
        }

        if (btnDelete) {
            if (!confirm('削除しますか？')) return;
            const table = type === 'schedule' ? 'schedules' : type === 'user' ? 'users' : type === 'helper' ? 'helpers' : 'templates';
            await this.sbFetch(`${table}?id=eq.${id}`, { method: 'DELETE' });
            await this.loadData();
            this.renderAll();
        } else if (btnEdit) {
            if (type === 'user') {
                const u = this.users.find(x => x.id === id);
                document.getElementById('u-name').value = u.name;
                document.getElementById('u-email').value = u.email || '';
                document.getElementById('u-is-care').checked = u.isCare;
                document.getElementById('u-is-3rd').checked = u.is3rd;
                document.getElementById('u-is-double').checked = u.isDouble;
                this.editingUserId = id;
                document.getElementById('btn-save-user').textContent = '更新する';
            } else if (type === 'helper') {
                const h = this.helpers.find(x => x.id === id);
                document.getElementById('h-name').value = h.name;
                document.getElementById('h-email').value = h.email || '';
                this.editingHelperId = id;
                document.getElementById('btn-save-helper').textContent = '更新する';
            } else if (type === 'template') {
                const t = this.templates.find(x => x.id === id);
                document.getElementById('t-title').value = t.title;
                document.getElementById('t-content').value = t.content;
                document.getElementById('t-category').value = t.category;
                this.editingTemplateId = id;
                document.getElementById('btn-save-template').textContent = '更新する';
            }
        }
    }

    showUserQrModal(userId) {
        const u = this.users.find(x => x.id === userId);
        if (!u) return;

        document.getElementById('qr-user-name').textContent = this.stripRubi(u.name);

        const container = document.getElementById('qr-code-container');
        container.innerHTML = ''; // clear previous

        // Generate QR code with format "user:<ID>"
        new QRCode(container, {
            text: `user:${u.id}`,
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        document.getElementById('qr-print-modal').style.display = 'flex';
    }

    renderAll() {
        try {
            this.applyRubiState();
            this.populateSelects();
            this.populateTimeSelects();
            this.populateMonthSelect();
            this.renderDashboard();
            this.renderSchedules();
            this.renderCalendar();
            this.renderUsers();
            this.renderHelpers();
            this.renderTemplates();
            this.renderRevenue();
            this.updateAlerts();
        } catch (err) {
            console.error("Render failed:", err);
        }
    }

    populateMonthSelect() {
        if (!this.revMonthSelect || this.revMonthSelect.options.length > 0) return;
        const now = new Date();
        for (let i = -2; i <= 2; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = `${d.getFullYear()}年${d.getMonth() + 1}月`;
            if (i === 0) opt.selected = true;
            this.revMonthSelect.appendChild(opt);
        }
    }

    renderDashboard() {
        if (!this.todayScheduleListEl) return;
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const dayOfWeek = now.getDay();
        const patterns = this.schedules.filter(s => s.dayOfWeek === dayOfWeek);
        const specs = this.specificSchedules[todayStr] || [];
        const todayRecords = this.records.filter(r => r.date === todayStr);
        const allToday = [...patterns, ...specs].sort((a, b) => a.startTime.localeCompare(b.startTime));

        if (allToday.length === 0) {
            this.todayScheduleListEl.innerHTML = '<div style="color:var(--text-muted);padding:20px;text-align:center;">今日の予定はありません。</div>';
        } else {
            this.todayScheduleListEl.innerHTML = allToday.map(s => {
                const u = this.users.find(x => x.id === s.userId) || { name: '?' };
                const h = this.helpers.find(x => x.id === s.helperId) || { name: '?' };
                const isDone = todayRecords.some(r => r.user_id === s.userId && r.helper_id === s.helperId);
                return `
                    <div class="schedule-card" style="${isDone ? 'border-left: 4px solid #10b981; opacity: 0.8;' : 'border-left: 4px solid #f59e0b;'}">
                        <div>
                            <div style="font-size:0.8rem; color:var(--text-muted);">${s.startTime} - ${s.endTime}</div>
                            <div style="font-weight:600;">${u.name}</div>
                            <div style="font-size:0.85rem;">担当: ${h.name}</div>
                        </div>
                        <div style="font-size:0.75rem; font-weight:bold; color:${isDone ? '#10b981' : '#f59e0b'};">
                            ${isDone ? '実施済' : '予定'}
                        </div>
                    </div>
                `;
            }).join('');
        }
        this.summaryTodayRecordsEl.textContent = todayRecords.length;
        this.summaryTodayPendingEl.textContent = Math.max(0, allToday.length - todayRecords.length);
    }

    renderSchedules() {
        this.scheduleListEl.innerHTML = '';
        this.schedules.forEach(s => {
            const u = this.users.find(x => x.id === s.userId) || { name: '?' };
            const h = this.helpers.find(x => x.id === s.helperId) || { name: '?' };
            const div = document.createElement('div');
            div.className = 'schedule-card';
            div.innerHTML = `
                <div>
                    <div style="font-size:0.8rem;color:var(--text-muted);">[${['日', '月', '火', '水', '木', '金', '土'][s.dayOfWeek]}] ${s.startTime}-${s.endTime}</div>
                    <div style="font-weight:600;">${u.name}</div>
                    <div style="font-size:0.8rem;">担当: ${h.name}</div>
                </div>
                <button class="delete-btn" data-id="${s.id}">✖</button>
            `;
            this.scheduleListEl.appendChild(div);
        });
    }

    renderUsers() {
        this.userListEl.innerHTML = this.users.map(u => `
            <div class="schedule-card">
                <div><div style="font-weight:600;">${u.name}</div><div style="font-size:0.8rem;color:var(--text-muted);">${u.email || 'メール未設定'}</div></div>
                <div style="display:flex;gap:4px;">
                    <button class="btn qr-btn" data-id="${u.id}" style="padding:4px 8px;font-size:0.7rem;background:#10b981;color:white;width:auto;" title="QRコード表示"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:-2px;"><path d="M3 3h6v6H3z"/><path d="M15 3h6v6h-6z"/><path d="M3 15h6v6H3z"/><path d="M21 21v-6h-6v6h6z"/><path d="M9 3v6H3V3h6m2-2H1v10h10V1zm12 0h-10v10h10V1zM9 15v6H3v-6h6m2-2H1v10h10v-10zm12 0h-10v10h10v-10z"/></svg></button>
                    <button class="btn edit-btn" data-id="${u.id}" style="padding:4px 8px;font-size:0.7rem;background:var(--primary-color);color:white;width:auto;">編集</button>
                    <button class="btn delete-btn" data-id="${u.id}" style="padding:4px 8px;font-size:0.7rem;background:#ef4444;color:white;width:auto;">削除</button>
                </div>
            </div>
        `).join('');
    }

    renderHelpers() {
        this.adminHelperList.innerHTML = this.helpers.map(h => `
            <div class="schedule-card">
                <div><div style="font-weight:600;">${h.name}</div><div style="font-size:0.8rem;color:var(--text-muted);">${h.email || 'メール未設定'}</div></div>
                <div style="display:flex;gap:4px;">
                    <button class="btn edit-btn" data-id="${h.id}" style="padding:4px 8px;font-size:0.7rem;background:var(--primary-color);color:white;width:auto;">編集</button>
                    <button class="btn delete-btn" data-id="${h.id}" style="padding:4px 8px;font-size:0.7rem;background:#ef4444;color:white;width:auto;">削除</button>
                </div>
            </div>
        `).join('');
    }

    renderTemplates() {
        this.adminTemplateList.innerHTML = '';
        this.templates.filter(t => t.category === this.currentTemplateCategory).forEach(t => {
            const div = document.createElement('div');
            div.className = 'card';
            div.style.padding = '12px';
            div.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                    <div style="font-weight:700;">${t.title}</div>
                    <div style="display:flex;gap:4px;">
                        <button class="edit-btn" data-id="${t.id}" style="background:none;border:none;color:var(--primary-color);cursor:pointer;font-size:1.2rem;">✎</button>
                        <button class="delete-btn" data-id="${t.id}" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:1.2rem;">✖</button>
                    </div>
                </div>
                <div style="font-size:0.8rem;color:var(--text-muted);white-space:pre-wrap;margin-top:4px;">${t.content}</div>
            `;
            this.adminTemplateList.appendChild(div);
        });
        document.getElementById('t-category').value = this.currentTemplateCategory;
    }

    renderCalendar() {
        const y = this.currentCalDate.getFullYear();
        const m = this.currentCalDate.getMonth();
        this.calMonthTitle.textContent = `${y}年 ${m + 1}月`;
        const first = new Date(y, m, 1);
        const last = new Date(y, m + 1, 0);
        this.calendarDays.innerHTML = '';
        for (let i = 0; i < first.getDay(); i++) this.calendarDays.appendChild(Object.assign(document.createElement('div'), { className: 'calendar-day other-month' }));

        const filterHId = this.calHelperFilter.value;
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        for (let d = 1; d <= last.getDate(); d++) {
            const dObj = new Date(y, m, d);
            const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const div = document.createElement('div');
            div.className = `calendar-day ${dObj.getDay() === 0 ? 'holiday-bg' : ''} ${dateStr === todayStr ? 'today' : ''}`;
            div.dataset.date = dateStr;
            div.innerHTML = `<div style="font-weight:bold;${dObj.getDay() === 0 ? 'color:#ef4444;' : ''}">${d}</div>`;

            this.schedules.filter(s => s.dayOfWeek === dObj.getDay()).forEach(s => {
                if (!filterHId || s.helperId === filterHId) {
                    const u = this.users.find(x => x.id === s.userId);
                    const h = this.helpers.find(x => x.id === s.helperId);
                    const uName = u ? this.stripRubi(u.name) : '?';
                    const hName = h ? this.stripRubi(h.name) : '?';
                    div.innerHTML += `<div class="cal-event" data-type="pattern" data-id="${s.id}">
                        <b>${s.startTime}</b><br>${uName}<br><span style="font-size:0.55rem; opacity:0.8;">${hName}</span>
                    </div>`;
                }
            });
            (this.specificSchedules[dateStr] || []).forEach(s => {
                if (!filterHId || s.helperId === filterHId) {
                    const u = this.users.find(x => x.id === s.userId);
                    const h = this.helpers.find(x => x.id === s.helperId);
                    const uName = u ? this.stripRubi(u.name) : '?';
                    const hName = h ? this.stripRubi(h.name) : '?';
                    div.innerHTML += `<div class="cal-event" style="background:#fef3c7;" data-type="specific" data-id="${s.id}">
                        <b>${s.startTime}</b><br>${uName}<br><span style="font-size:0.55rem; opacity:0.8;">${hName}</span>
                    </div>`;
                }
            });
            this.calendarDays.appendChild(div);
        }
    }

    handleCalendarClick(e) {
        const eventEl = e.target.closest('.cal-event');
        const dayEl = e.target.closest('.calendar-day');

        if (eventEl) {
            const type = eventEl.dataset.type;
            const id = eventEl.dataset.id;
            const dateStr = eventEl.closest('.calendar-day').dataset.date;

            if (type === 'pattern') {
                alert('基本パターンは「予定設定」タブから編集してください。');
                return;
            }

            const spec = (this.specificSchedules[date] || []).find(x => x.id === id);
            if (!spec) return;

            this.editingSpecId = id;
            this.specDateInput.value = date;
            this.modalDateTitle.textContent = `${date} の編集`;
            this.specTimeStartH.value = spec.startTime.split(':')[0];
            this.specTimeStartM.value = spec.startTime.split(':')[1];
            this.specTimeEndH.value = spec.endTime.split(':')[0];
            this.specTimeEndM.value = spec.endTime.split(':')[1];
            this.specUserSelect.value = spec.userId;
            this.specHelperSelect.value = spec.helperId;
            this.btnDeleteSpec.style.display = 'block';
            this.modalDateSchedule.style.display = 'flex';
        } else if (dayEl && !dayEl.classList.contains('other-month')) {
            this.editingSpecId = null;
            this.specDateInput.value = dayEl.dataset.date;
            this.modalDateTitle.textContent = `${dayEl.dataset.date} の登録`;
            this.btnDeleteSpec.style.display = 'none';
            this.modalDateSchedule.style.display = 'flex';
            this.populateTimeSelects();
        }
    }

    applyRubiState() {
        if (!this.app) return;
        this.app.classList.toggle('hide-rubi', !this.isRubiVisible);
        this.btnToggleRubi.textContent = `ルビ: ${this.isRubiVisible ? 'ON' : 'OFF'}`;
    }

    stripRubi(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        div.querySelectorAll('rt').forEach(rt => rt.remove());
        return div.textContent || div.innerText || html;
    }

    // CSV Features
    exportUsersCSV() {
        const headers = ["ID", "名前", "メール", "介護", "3級", "2人体制"];
        const rows = this.users.map(u => [
            u.id, u.name, u.email || "", u.is_care ? "1" : "0", u.is_3rd ? "1" : "0", u.is_double ? "1" : "0"
        ]);
        this.downloadCSV("users.csv", [headers, ...rows]);
    }

    exportHelpersCSV() {
        const headers = ["ID", "名前", "メール"];
        const rows = this.helpers.map(h => [h.id, h.name, h.email || ""]);
        this.downloadCSV("helpers.csv", [headers, ...rows]);
    }

    downloadCSV(filename, data) {
        const csvContent = data.map(r => r.join(",")).join("\n");
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }

    async importCSV(e, table) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const buffer = event.target.result;
            let content = "";

            // Try UTF-8 first, fallback to Shift-JIS
            try {
                const decoder = new TextDecoder('utf-8', { fatal: true });
                content = decoder.decode(buffer);
            } catch (err) {
                const decoder = new TextDecoder('shift-jis');
                content = decoder.decode(buffer);
            }

            const lines = content.split(/\r?\n/).filter(l => l.trim());
            if (lines.length < 2) {
                alert("CSVファイルにヘッダーとデータ行がありません。");
                return;
            }

            const headers = lines[0].split(",").map(h => h.trim().replace(/^\"|\"$/g, ''));
            const data = lines.slice(1).map(line => {
                const values = line.split(",").map(v => v.trim().replace(/^\"|\"$/g, ''));
                const obj = {};
                headers.forEach((h, i) => { if (h) obj[h] = values[i] || ""; });
                return obj;
            });

            let requiredHeaders = [];
            if (table === 'users') {
                requiredHeaders = ["名前", "介護", "3級", "2人体制"];
            } else { // helpers
                requiredHeaders = ["名前"];
            }

            const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
            if (missingHeaders.length > 0) {
                alert(`CSV形式が正しくありません。以下の必須列が見つかりません: ${missingHeaders.join(", ")}。\nUTF-8またはShift-JIS形式で保存してください。`);
                return;
            }

            if (!confirm(`${data.length}件のデータをインポート（既存IDは上書き）しますか？`)) return;

            try {
                let payloads;
                if (table === 'users') {
                    payloads = data.map((d, index) => {
                        if (!d["名前"]) {
                            throw new Error(`行 ${index + 2}: 「名前」が空です。`);
                        }
                        const isCare = d["介護"];
                        if (isCare !== "0" && isCare !== "1") {
                            throw new Error(`行 ${index + 2}: 「介護」列の値は0または1である必要があります (現在の値: "${isCare}")。`);
                        }
                        const is3rd = d["3級"];
                        if (is3rd !== "0" && is3rd !== "1") {
                            throw new Error(`行 ${index + 2}: 「3級」列の値は0または1である必要があります (現在の値: "${is3rd}")。`);
                        }
                        const isDouble = d["2人体制"];
                        if (isDouble !== "0" && isDouble !== "1") {
                            throw new Error(`行 ${index + 2}: 「2人体制」列の値は0または1である必要があります (現在の値: "${isDouble}")。`);
                        }

                        return {
                            id: d["ID"] || 'u_' + Date.now() + Math.random().toString(36).substring(2, 9),
                            name: d["名前"],
                            email: d["メール"] || "",
                            is_care: isCare === "1",
                            is_3rd: is3rd === "1",
                            is_double: isDouble === "1"
                        };
                    });
                } else { // helpers
                    payloads = data.map((d, index) => {
                        if (!d["名前"]) {
                            throw new Error(`行 ${index + 2}: 「名前」が空です。`);
                        }
                        return {
                            id: d["ID"] || 'h_' + Date.now() + Math.random().toString(36).substring(2, 9),
                            name: d["名前"],
                            email: d["メール"] || ""
                        };
                    });
                }

                await this.sbFetch(table, {
                    method: 'POST',
                    headers: { 'Prefer': 'resolution=merge-duplicates' },
                    body: JSON.stringify(payloads)
                });

                alert("インポートが完了しました。");
                await this.loadData();
                this.renderAll();
            } catch (err) {
                console.error("Import failed:", err);
                let errorMessage = "インポートに失敗しました。";
                if (err.message.includes("行 ")) {
                    errorMessage += `\nデータ内容に問題があります: ${err.message}`;
                } else if (err.message.includes("Failed to fetch")) {
                    errorMessage += "\nネットワークエラーが発生しました。インターネット接続を確認してください。";
                } else if (err.message.includes("supabase")) { // Generic Supabase error
                    errorMessage += `\nデータベース処理中にエラーが発生しました: ${err.message}`;
                } else {
                    errorMessage += `\n予期せぬエラーが発生しました: ${err.message}`;
                }
                alert(errorMessage);
            }
        };

        reader.readAsArrayBuffer(file);
    }
}

document.addEventListener('DOMContentLoaded', () => { window.adminApp = new AdminApp(); });
