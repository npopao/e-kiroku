/**
 * e-kiroku Application Logic (v3 - Cloud/Supabase)
 */
class App {
  constructor() {
    this.config = {
      url: 'https://mwxgkpquwvdfbctszwzx.supabase.co',
      key: 'sb_publishable_7ax3iL4T4OUjvDqWUXtzcA_jA4nNEdE'
    };

    this.records = [];
    this.schedules = [];
    this.specificSchedules = {};
    this.customTemplates = [];
    this.users = [];
    this.helpers = [];

    this.currentHelper = this.loadCurrentHelper();
    this.currentView = this.currentHelper ? 'dashboard' : 'login';
    this.currentCalDate = new Date();
    this.isRubiVisible = localStorage.getItem('ekiroku_rubi_visible') !== 'false';

    this.formPrefill = null;
    this.editingRecordId = null;
    this.filters = { userId: '', helperId: '', month: '' };

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
    this.oneTapConfig = [
      { category: '体調', items: ['良好', '疲れ気味', '前日同様', '発熱あり'] },
      { category: '食事', items: ['完食', '半分', '残しあり', '水分摂取良好'] },
      { category: '排泄', items: ['あり', 'なし', '軟便', '失禁なし'] },
      { category: '備考', items: ['散歩実施', '掃除・洗濯', 'リハビリ', '見守り'] }
    ];
    this.init();
  }

  async init() {
    await this.loadData();
    this.cacheDOM();
    this.createToastContainer();
    this.bindEvents();
    this.updateAvatar();
    this.render();
  }

  async sbFetch(path, options = {}) {
    const headers = {
      'apikey': this.config.key,
      'Authorization': `Bearer ${this.config.key}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    const res = await fetch(`${this.config.url}/rest/v1/${path}`, { ...options, headers });
    if (!res.ok) throw new Error(await res.text());
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
      this.users = u || [];
      this.customTemplates = t || [];
      this.records = r || [];
      this.notifications = n || [];

      this.schedules = (s || []).map(x => ({
        id: String(x.id),
        dayOfWeek: Number(x.day_of_week),
        startTime: x.start_time || '',
        endTime: x.end_time || '',
        helperId: String(x.helper_id || ''),
        userId: String(x.user_id || '')
      }));

      this.specificSchedules = {};
      (ss || []).forEach(x => {
        if (!this.specificSchedules[x.date]) this.specificSchedules[x.date] = [];
        this.specificSchedules[x.date].push({
          id: String(x.id),
          startTime: x.start_time || '',
          endTime: x.end_time || '',
          helperId: String(x.helper_id || ''),
          userId: String(x.user_id || '')
        });
      });

      if (this.currentHelper) {
        const found = this.helpers.find(x => x.id === this.currentHelper.id);
        if (found) {
          this.currentHelper = found;
          localStorage.setItem('ekiroku_current_helper', JSON.stringify(found));
        }
      }
    } catch (err) {
      console.error("Load failed:", err);
    }
  }

  cacheDOM() {
    this.appHeader = document.querySelector('.app-header');
    this.bottomNav = document.querySelector('.bottom-nav');
    this.mainContent = document.getElementById('main-content');
    this.navButtons = document.querySelectorAll('.nav-btn');
    this.avatarEl = document.getElementById('current-helper-avatar');
    this.btnLogout = document.getElementById('btn-logout');
    this.btnToggleRubi = document.getElementById('btn-toggle-rubi');
    this.appEl = document.getElementById('app');
  }

  createToastContainer() {
    this.toastContainer = document.createElement('div');
    this.toastContainer.className = 'toast-container';
    document.body.appendChild(this.toastContainer);
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast fade-in';
    toast.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--secondary-color)" stroke-width="2" style="flex-shrink:0;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
      <div>${message}</div>
    `;
    this.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  bindEvents() {
    this.navButtons.forEach(btn => {
      btn.onclick = (e) => {
        const view = e.currentTarget.dataset.view;
        if (view === 'record-form') { this.formPrefill = null; this.editingRecordId = null; }
        this.navigate(view);
      };
    });
    if (this.btnLogout) this.btnLogout.onclick = () => { if (confirm('ログアウトしますか？')) this.logout(); };
    if (this.btnToggleRubi) this.btnToggleRubi.onclick = () => this.toggleRubi();
    this.mainContent.onclick = (e) => {
      if (e.target.closest('.btn-delete-record')) this.deleteRecord(e.target.closest('.btn-delete-record').dataset.id);
      if (e.target.closest('#btn-close-qr')) this.closeQRScanner();
    };
  }

  loadCurrentHelper() {
    const data = localStorage.getItem('ekiroku_current_helper');
    return data ? JSON.parse(data) : null;
  }

  login(name, email) {
    const cleanEmail = email.trim().toLowerCase();
    const helper = this.helpers.find(h =>
      (h.email || '').trim().toLowerCase() === cleanEmail
    );
    if (helper) {
      this.currentHelper = helper;
      localStorage.setItem('ekiroku_current_helper', JSON.stringify(helper));
      this.updateAvatar();
      this.currentView = 'dashboard';
      this.render();
    } else {
      alert('名前またはメールアドレスが正しくありません。');
    }
  }

  logout() {
    this.currentHelper = null;
    localStorage.removeItem('ekiroku_current_helper');
    this.currentView = 'login';
    this.render();
  }

  updateAvatar() {
    if (this.currentHelper && this.avatarEl) {
      this.avatarEl.textContent = this.stripRubi(this.currentHelper.name).charAt(0);
    }
  }

  navigate(view) {
    this.currentView = view;
    this.navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
    this.render();
  }

  async saveRecord(recordData) {
    const payload = {
      datetime: recordData.datetime,
      date: recordData.date,
      user_id: recordData.userId,
      helper_id: recordData.helperId,
      content: recordData.content
    };

    if (this.editingRecordId) {
      await this.sbFetch(`records?id=eq.${this.editingRecordId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      this.showToast('記録を更新しました。');
      this.editingRecordId = null;
    } else {
      payload.id = 'rec_' + Date.now();
      await this.sbFetch('records', { method: 'POST', body: JSON.stringify(payload) });
      const user = this.users.find(u => u.id === recordData.userId);
      this.showToast(user && user.email ? `<strong>${user.name}</strong> 様の記録を保存し、完了メール（シミュレーション）を送信しました。` : '記録を保存しました。');
    }
    await this.loadData();
    this.navigate('dashboard');
  }

  editRecord(id) {
    const record = this.records.find(r => r.id === id);
    if (record) {
      this.editingRecordId = id;
      this.formPrefill = {
        userId: record.user_id,
        helperId: record.helper_id,
        datetime: record.datetime,
        content: record.content
      };
      this.navigate('record');
    }
  }

  async deleteRecord(id) {
    if (confirm('記録を削除しますか？')) {
      await this.sbFetch(`records?id=eq.${id}`, { method: 'DELETE' });
      await this.loadData();
      this.render();
    }
  }

  toggleRubi() {
    this.isRubiVisible = !this.isRubiVisible;
    localStorage.setItem('ekiroku_rubi_visible', this.isRubiVisible);
    this.applyRubiState();
  }

  applyRubiState() {
    if (!this.appEl) return;
    this.appEl.classList.toggle('hide-rubi', !this.isRubiVisible);
    if (this.btnToggleRubi) this.btnToggleRubi.textContent = `ルビ: ${this.isRubiVisible ? 'ON' : 'OFF'}`;
  }

  startQRScanner() {
    const qrModal = document.getElementById('qr-modal');
    if (!qrModal) return;
    qrModal.style.display = 'flex';

    if (this.html5QrcodeScanner) {
      this.html5QrcodeScanner.clear();
    }

    // Initialize html5-qrcode
    this.html5QrcodeScanner = new Html5Qrcode("qr-reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };

    this.html5QrcodeScanner.start(
      { facingMode: "environment" },
      config,
      (decodedText, decodedResult) => {
        // Success callback
        console.log(`Scan result: ${decodedText}`);
        this.handleQRScanResult(decodedText);
      },
      (errorMessage) => {
        // Error callback (ignore frequent frame errors)
      }
    ).catch((err) => {
      console.error("Failed to start scanner:", err);
      alert("カメラの起動に失敗しました。権限を確認してください。");
      this.closeQRScanner();
    });
  }

  closeQRScanner() {
    const qrModal = document.getElementById('qr-modal');
    if (qrModal) qrModal.style.display = 'none';
    if (this.html5QrcodeScanner) {
      this.html5QrcodeScanner.stop().then(() => {
        this.html5QrcodeScanner.clear();
      }).catch(err => console.error("Failed to stop scanner:", err));
    }
  }

  handleQRScanResult(text) {
    // Expected format: "user:u1"
    if (text.startsWith('user:')) {
      const userId = text.split(':')[1];
      const userSelect = document.getElementById('f-user');
      if (userSelect) {
        // Check if user exists in the select options
        const optionExists = Array.from(userSelect.options).some(opt => opt.value === userId);
        if (optionExists) {
          userSelect.value = userId;
          this.closeQRScanner();
          this.showToast('利用者を読み込みました。');
          // Add "Service Started" boilerplate string to content
          const contentArea = document.getElementById('f-content');
          if (contentArea) {
            const startStr = "【サービス開始】";
            if (!contentArea.value.includes(startStr)) {
              contentArea.value = startStr + (contentArea.value ? '\n' + contentArea.value : "");
            }
          }
        } else {
          alert('該当する利用者がシステムに登録されていません。');
        }
      }
    } else {
      alert('未対応のQRコード形式です: ' + text);
    }
  }

  stripRubi(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    div.querySelectorAll('rt').forEach(rt => rt.remove());
    return div.textContent || div.innerText || html;
  }

  render() {
    const isLoggedIn = !!this.currentHelper;
    if (this.appHeader) this.appHeader.style.display = isLoggedIn ? 'flex' : 'none';
    if (this.bottomNav) this.bottomNav.style.display = isLoggedIn ? 'flex' : 'none';
    this.mainContent.style.paddingBottom = isLoggedIn ? '80px' : '20px';

    if (!isLoggedIn) this.currentView = 'login';
    this.mainContent.innerHTML = '';
    const content = this.getViewContent(this.currentView);
    if (content) {
      this.mainContent.appendChild(content);
      this.applyRubiState();
    }
  }

  getViewContent(view) {
    switch (view) {
      case 'login': return this.renderLogin();
      case 'dashboard': return this.renderDashboard();
      case 'schedule': return this.renderDashboard(); // Simplified
      case 'record': return this.renderRecordForm();
      case 'history': return this.renderHistory();
      default: return this.renderDashboard();
    }
  }

  renderLogin() {
    const div = document.createElement('div');
    div.className = 'fade-in';
    div.style.cssText = 'min-height:80vh; display:flex; flex-direction:column; justify-content:center; align-items:center;';
    div.innerHTML = `<div class="card" style="width:100%; max-width:400px; text-align:center; padding:var(--spacing-5);">
        <h2 style="color:var(--primary-color); font-size:1.5rem; margin-bottom:var(--spacing-4);">e-kiroku</h2>
        <form id="login-form">
          <div class="form-group" style="text-align:left;">
            <label class="form-label">名前</label>
            <input type="text" id="login-name" class="form-control" placeholder="例：鈴木 二郎" required>
          </div>
          <div class="form-group" style="text-align:left;">
            <label class="form-label">メールアドレス</label>
            <input type="email" id="login-email" class="form-control" placeholder="example@mail.com" required>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;">ログイン</button>
        </form>
      </div>`;
    setTimeout(() => {
      div.querySelector('#login-form').onsubmit = (e) => {
        e.preventDefault();
        this.login(
          div.querySelector('#login-name').value,
          div.querySelector('#login-email').value
        );
      };
    }, 0);
    return div;
  }

  renderDashboard() {
    const div = document.createElement('div');
    div.className = 'fade-in';
    // Display notification banner
    const banner = document.getElementById('notification-banner');
    if (banner) {
      if (this.notifications.length > 0) {
        const last = this.notifications[0];
        banner.innerHTML = `<h4>本部からの連絡</h4><p><strong>${last.title}</strong><br>${last.content}</p>`;
        banner.style.display = 'block';
      } else {
        banner.style.display = 'none';
      }
    }

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const nowMin = today.getHours() * 60 + today.getMinutes();

    const todaySchedules = [
      ...this.schedules.filter(s => s.dayOfWeek === today.getDay() && s.helperId == this.currentHelper.id),
      ...(this.specificSchedules[todayStr] || []).filter(s => s.helperId == this.currentHelper.id)
    ].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

    const myRecords = this.records.filter(r => r.helper_id === this.currentHelper.id);
    const todayRecordedIds = myRecords.filter(r => r.date === todayStr).map(r => r.user_id);

    // Check for alerts (passed end time but no record)
    const alerts = [];
    todaySchedules.forEach(s => {
      const endParts = s.endTime.split(':');
      const endMin = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
      if (nowMin > endMin && !todayRecordedIds.includes(s.userId)) {
        const user = this.users.find(u => u.id === s.userId);
        alerts.push(`<div class="alert-item"><span>【未記入】${user ? user.name : '利用者'} 様</span><span class="alert-badge">！</span></div>`);
      }
    });

    div.innerHTML = `
      ${alerts.join('')}
      <div class="card" style="background:var(--gradient-primary); color:white; border:none;">
        <h2 style="font-size:1.2rem;">${this.currentHelper.name} さん</h2>
        <p>本日の記録: ${todayRecordedIds.length} 件</p>
      </div>
      <h3 style="margin:20px 0 10px;">今日の予定</h3>
      <div class="record-list">
        ${todaySchedules.map(s => {
      const u = this.users.find(x => x.id === s.userId) || { name: '?' };
      const done = todayRecordedIds.includes(s.userId);
      return `<div class="card schedule-item-card" data-user="${s.userId}" style="border-left:4px solid ${done ? 'var(--secondary-color)' : '#f59e0b'}; cursor:pointer;">
              <div style="display:flex; justify-content:space-between;">
                <strong>${u.name} 様</strong>
                <span class="badge" style="background:${done ? 'var(--secondary-color)' : '#f59e0b'}; color:white;">${done ? '完了' : '未実施'}</span>
              </div>
              <div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">${s.startTime} - ${s.endTime}</div>
            </div>`;
    }).join('') || '<p style="text-align:center; color:var(--text-muted);">予定はありません</p>'}
      </div>
      <h3 style="margin:20px 0 10px;">最近の記録</h3>
      <div class="record-list">
        ${myRecords.slice(0, 5).map(r => this.generateRecordHTML(r)).join('') || '<p style="text-align:center; color:var(--text-muted);">記録がありません</p>'}
      </div>`;
    setTimeout(() => {
      div.querySelectorAll('.schedule-item-card').forEach(c => c.onclick = () => {
        this.formPrefill = { userId: c.dataset.user };
        this.navigate('record');
      });
    }, 0);
    return div;
  }

  generateRecordHTML(record) {
    const user = this.users.find(u => u.id === record.user_id) || { name: '?' };
    return `<div class="card" style="padding:15px; margin-bottom:10px;">
        <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:5px;">${record.datetime}</div>
        <div style="font-weight:bold; color:var(--primary-color); margin-bottom:5px;">${user.name} 様</div>
        <div style="white-space:pre-wrap; font-size:0.9rem;">${record.content}</div>
        <div style="margin-top:8px; border-top:1px solid #eee; padding-top:8px; display:flex; gap:10px;">
          <button class="btn-edit-record" data-id="${record.id}" style="color:var(--primary-color); background:none; border:none; font-size:0.8rem; cursor:pointer;">編集</button>
          <button class="btn-delete-record" data-id="${record.id}" style="color:#ef4444; background:none; border:none; font-size:0.8rem; cursor:pointer;">削除</button>
        </div>
      </div>`;
  }

  renderRecordForm() {
    const div = document.createElement('div');
    const now = new Date();
    const nowStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    let prefill = { userId: '', helperId: this.currentHelper.id, datetime: nowStr, content: '' };
    if (this.formPrefill) prefill = { ...prefill, ...this.formPrefill };

    const oneTapButtons = this.oneTapConfig.map(cat => `
      <div class="onetap-category">
        <div class="onetap-category-title">${cat.category}</div>
        <div class="onetap-buttons">
          ${cat.items.map(item => `<button type="button" class="onetap-btn" data-text="${item}">${item}</button>`).join('')}
        </div>
      </div>
    `).join('');

    div.innerHTML = `<h2>${this.editingRecordId ? '記録の編集' : '新規記録'}</h2>
      <div style="margin-bottom:var(--spacing-4);">
        <button type="button" id="btn-open-qr" class="btn" style="width:100%; background:var(--secondary-color); color:white; display:flex; justify-content:center; align-items:center; gap:8px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h6v6H3z"/><path d="M15 3h6v6h-6z"/><path d="M3 15h6v6H3z"/><path d="M21 21v-6h-6v6h6z"/><path d="M9 3v6H3V3h6m2-2H1v10h10V1zm12 0h-10v10h10V1zM9 15v6H3v-6h6m2-2H1v10h10v-10zm12 0h-10v10h10v-10z"/></svg>
          QRコードで利用者を読み取る
        </button>
      </div>
      <form id="record-form" class="card" style="padding:15px;">
        <div class="form-group"><label class="form-label">日時</label>
          <input type="datetime-local" id="f-datetime" class="form-control" value="${prefill.datetime}" required>
        </div>
        <div class="form-group"><label class="form-label">利用者</label>
          <select id="f-user" class="form-control" required>
            <option value="" disabled selected>選択してください</option>
            ${this.users.map(u => `<option value="${u.id}" ${u.id === prefill.userId ? 'selected' : ''}>${this.stripRubi(u.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">担当ヘルパー</label>
          <select id="f-helper" class="form-control" required>
            ${this.helpers.map(h => `<option value="${h.id}" ${h.id === prefill.helperId ? 'selected' : ''}>${this.stripRubi(h.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">内容 (ワンタップ・チェックリスト)</label>
          <div class="onetap-checklist">${oneTapButtons}</div>
        </div>
        <div class="form-group"><label class="form-label">内容 (テンプレート)</label>
          <div class="tabs-container">
            <div class="tabs-header">
              <button type="button" class="tab-btn active" data-category="club">くらぶ</button>
              <button type="button" class="tab-btn" data-category="kaeru">かえる</button>
              <button type="button" class="tab-btn" data-category="other">その他</button>
            </div>
            <div id="template-list" class="template-grid"></div>
          </div>
          <textarea id="f-content" class="form-control" style="min-height:120px;" required>${prefill.content}</textarea>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;">${this.editingRecordId ? '更新' : '保存'}</button>
      </form>`;

    setTimeout(() => {
      const templateList = div.querySelector('#template-list');
      const contentArea = div.querySelector('#f-content');
      const btnOpenQR = div.querySelector('#btn-open-qr');

      if (btnOpenQR) {
        btnOpenQR.onclick = () => this.startQRScanner();
      }

      const renderTs = (cat) => {
        templateList.innerHTML = this.customTemplates.filter(t => t.category === cat).map(t => `
            <div class="template-chip" data-content="${t.content}" style="display:flex; flex-direction:column; align-items:flex-start; padding:10px; border-radius:8px; border:1px solid var(--border-color); background:white;">
                <span style="font-weight:bold; color:var(--primary-color); font-size:0.85rem;">${t.title}</span>
                <span style="font-size:0.75rem; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%;">${t.content.substring(0, 15)}...</span>
            </div>`).join('');
      };
      renderTs('club');

      // One-tap buttons click handler
      div.querySelectorAll('.onetap-btn').forEach(btn => {
        btn.onclick = () => {
          const text = btn.dataset.text;
          const category = btn.closest('.onetap-category').querySelector('.onetap-category-title').textContent;
          const fullText = `${category}：${text}。`;
          if (!contentArea.value.includes(fullText)) {
            contentArea.value += (contentArea.value ? '\n' : '') + fullText;
          }
        };
      });

      div.querySelectorAll('.tab-btn').forEach(b => b.onclick = (e) => {
        div.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
        e.target.classList.add('active');
        renderTs(e.target.dataset.category);
      });
      templateList.onclick = (e) => {
        const chip = e.target.closest('.template-chip');
        if (chip) contentArea.value += (contentArea.value ? '\n' : '') + chip.dataset.content;
      };
      div.querySelector('#record-form').onsubmit = (e) => {
        e.preventDefault();
        const dt = div.querySelector('#f-datetime').value;
        this.saveRecord({
          datetime: dt, date: dt.split('T')[0],
          userId: div.querySelector('#f-user').value,
          helperId: div.querySelector('#f-helper').value,
          content: contentArea.value
        });
      };
    }, 0);
    return div;
  }

  renderHistory() {
    const div = document.createElement('div');
    div.innerHTML = `<h2>全記録</h2><div id="history-list" class="record-list">${this.records.map(r => this.generateRecordHTML(r)).join('') || '<p style="text-align:center;">記録がありません</p>'}</div>`;
    return div;
  }
}
document.addEventListener('DOMContentLoaded', () => { window.app = new App(); });
