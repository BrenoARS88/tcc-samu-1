/* ============================================================
   APP.JS — EduAgenda
   Lógica principal: auth, navegação, módulos, chat, calendário
   ============================================================ */

'use strict';

const App = (() => {

  /* ================================================================
     GRADE DE AULAS
     2 períodos × 7 aulas cada
     ================================================================ */
  const AULAS = {
    manha: [
      { num: 1, label: '1ª Aula', horario: '07:00 – 07:50' },
      { num: 2, label: '2ª Aula', horario: '07:50 – 08:40' },
      { num: 3, label: '3ª Aula', horario: '08:40 – 09:30' },
      { num: 4, label: '4ª Aula', horario: '09:50 – 10:40' }, // após intervalo
      { num: 5, label: '5ª Aula', horario: '10:40 – 11:30' },
      { num: 6, label: '6ª Aula', horario: '11:30 – 12:20' },
      { num: 7, label: '7ª Aula', horario: '12:20 – 13:00' },
    ],
    tarde: [
      { num: 1, label: '1ª Aula', horario: '13:00 – 13:50' },
      { num: 2, label: '2ª Aula', horario: '13:50 – 14:40' },
      { num: 3, label: '3ª Aula', horario: '14:40 – 15:30' },
      { num: 4, label: '4ª Aula', horario: '15:50 – 16:40' }, // após intervalo
      { num: 5, label: '5ª Aula', horario: '16:40 – 17:30' },
      { num: 6, label: '6ª Aula', horario: '17:30 – 18:20' },
      { num: 7, label: '7ª Aula', horario: '18:20 – 19:00' },
    ],
  };

  /* Retorna o label completo de uma aula */
  function aulaLabel(periodo, num) {
    const periodoLabel = periodo === 'manha' ? 'Manhã' : 'Tarde';
    const aula = AULAS[periodo]?.find(a => a.num === Number(num));
    return aula ? `${periodoLabel} — ${aula.label} (${aula.horario})` : `${periodoLabel} — ${num}ª Aula`;
  }

  /* ---- Estado ---- */
  let state = {
    user: null,
    currentPage: 'dashboard',
    calendarDate: new Date(),
    calendarSelectedDay: new Date().toISOString().split('T')[0],
    chatContact: null,
    notifOpen: false,
    adminTab: 'overview',
    notebooksTotal: 30,
    notebooksInUse: 12,
    _activities: [],
  };

  /* ================================================================
     INIT
     ================================================================ */
  function init() {
    setupLogin();
    setTodayInputs();
  }

  /* ================================================================
     AUTH
     ================================================================ */
  function setupLogin() {
    const form      = document.getElementById('login-form');
    const tabs      = document.querySelectorAll('.tab-btn');
    const demoItems = document.querySelectorAll('.demo-item');
    const togglePw  = document.querySelector('.toggle-password');
    const pwInput   = document.getElementById('login-password');

    tabs.forEach(t => t.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      t.classList.add('active');
    }));

    demoItems.forEach(item => {
      item.addEventListener('click', () => {
        document.getElementById('login-email').value    = item.dataset.email;
        document.getElementById('login-password').value = item.dataset.pass;
        const role = item.dataset.role;
        tabs.forEach(b => b.classList.toggle('active', b.dataset.role === role));
      });
    });

    togglePw.addEventListener('click', () => {
      const isText = pwInput.type === 'text';
      pwInput.type = isText ? 'password' : 'text';
      togglePw.querySelector('i').className = `fa-solid fa-eye${isText ? '' : '-slash'}`;
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim().toLowerCase();
      const pass  = document.getElementById('login-password').value;
      const errorEl = document.getElementById('login-error');
      const found = DB.users.find(u => u.email === email && u.password === pass);
      if (!found) {
        errorEl.classList.remove('hidden');
        errorEl.style.animation = 'none';
        setTimeout(() => errorEl.style.animation = '', 10);
        return;
      }
      errorEl.classList.add('hidden');
      login(found);
    });
  }

  function login(user) {
    state.user = user;
    document.getElementById('nav-name').textContent      = user.name;
    document.getElementById('nav-role').textContent      = capitalize(user.role);
    document.getElementById('nav-avatar').textContent    = user.name.charAt(0);
    document.getElementById('topbar-avatar').textContent = user.name.charAt(0);
    document.getElementById('nav-avatar').style.background      = user.avatar;
    document.getElementById('topbar-avatar').style.background   = user.avatar;

    if (user.role === 'admin') document.getElementById('nav-admin').classList.remove('hidden');

    document.getElementById('page-login').classList.add('hidden');
    document.getElementById('page-login').classList.remove('active');
    document.getElementById('page-app').classList.remove('hidden');
    document.body.classList.remove('login-page');

    setupApp();
    navigateTo('dashboard');
  }

  function logout() {
    state.user = null;
    document.getElementById('page-app').classList.add('hidden');
    document.getElementById('page-login').classList.remove('hidden');
    document.getElementById('page-login').classList.add('active');
    document.body.classList.add('login-page');
    document.getElementById('nav-admin').classList.add('hidden');
    document.getElementById('login-form').reset();
    document.getElementById('login-error').classList.add('hidden');
  }

  /* ================================================================
     SETUP APP
     ================================================================ */
  function setupApp() {
    setupSidebar();
    setupTopbar();
    setupModal();
    setupNotifications();
    setupDashboard();
    setupNotebooks();
    setupInformatica();
    setupBiblioteca();
    setupCalendario();
    setupChat();
    setupAdmin();

    // Inicializar selects de aulas de todos os formulários
    ['nb', 'inf', 'bib'].forEach(prefix => {
      const periodoEl = document.getElementById(`${prefix}-periodo`);
      const aulaEl    = document.getElementById(`${prefix}-aula`);
      if (periodoEl && aulaEl) populateAulasSelect(periodoEl.value, aulaEl);
    });

    // Configurar visibilidade dos campos de incidente
    setupIncidentToggle('nb-inc-tipo',  'nb-inc-qtd',  'nb-inc-descricao');
    setupIncidentToggle('inf-inc-tipo', 'inf-inc-qtd', 'inf-inc-descricao');
    setupIncidentToggle('bib-inc-tipo', 'bib-inc-qtd', 'bib-inc-descricao');
  }

  /* ================================================================
     AULAS — helpers
     ================================================================ */

  /* Preenche um <select> de aulas baseado no período */
  function populateAulasSelect(periodo, selectEl) {
    const aulas = AULAS[periodo] || AULAS.manha;
    selectEl.innerHTML = aulas.map(a =>
      `<option value="${a.num}">${a.label} — ${a.horario}</option>`
    ).join('');
  }

  /* Chamado pelo onchange do select de período (exposto no Public API) */
  function updateAulasSelect(periodoId, aulaId) {
    const periodo = document.getElementById(periodoId)?.value;
    const aulaEl  = document.getElementById(aulaId);
    if (!periodo || !aulaEl) return;
    populateAulasSelect(periodo, aulaEl);
  }

  /* Retorna string "Manhã — 3ª Aula (09:30 – 10:20)" a partir de valores dos selects */
  function getAulaFromForm(periodoId, aulaId) {
    const periodo = document.getElementById(periodoId)?.value || 'manha';
    const num     = document.getElementById(aulaId)?.value || '1';
    return { periodo, num: Number(num), label: aulaLabel(periodo, num) };
  }

  /* ================================================================
     INCIDENTES — toggle de campos extras
     ================================================================ */
  function setupIncidentToggle(tipoId, qtdId, descId) {
    const tipoEl = document.getElementById(tipoId);
    const qtdEl  = document.getElementById(qtdId);
    const descEl = document.getElementById(descId);
    if (!tipoEl) return;

    tipoEl.addEventListener('change', () => {
      const hasIncident = tipoEl.value !== '';
      qtdEl.style.display  = hasIncident ? '' : 'none';
      descEl.style.display = hasIncident ? '' : 'none';
      if (hasIncident) {
        qtdEl.required  = true;
      } else {
        qtdEl.required  = false;
        qtdEl.value     = '';
        descEl.value    = '';
      }
    });
  }

  /* Lê o incidente de um formulário e retorna objeto ou null */
  function readIncident(tipoId, qtdId, descId) {
    const tipo = document.getElementById(tipoId)?.value;
    if (!tipo) return null;
    return {
      tipo,
      quantidade: parseInt(document.getElementById(qtdId)?.value) || 1,
      descricao:  document.getElementById(descId)?.value.trim() || '',
      status:     'aberto',
      reportadoEm: new Date().toISOString(),
    };
  }

  /* ================================================================
     NAVEGAÇÃO
     ================================================================ */
  function navigateTo(page) {
    document.querySelectorAll('.section').forEach(s => {
      s.classList.remove('active');
      s.classList.add('hidden');
    });
    const sec = document.getElementById(`sec-${page}`);
    if (sec) { sec.classList.remove('hidden'); sec.classList.add('active'); }

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    const titles = {
      dashboard:   'Dashboard',
      notebooks:   'Carrinho de Notebooks',
      informatica: 'Sala de Informática',
      biblioteca:  'Biblioteca',
      calendario:  'Calendário',
      chat:        'Chat com Funcionários',
      admin:       'Painel Administrativo',
    };
    document.getElementById('topbar-title').textContent = titles[page] || page;
    state.currentPage = page;

    if (page === 'dashboard')   renderDashboard();
    if (page === 'notebooks')   renderNotebooksTable();
    if (page === 'informatica') renderTimetable('informatica');
    if (page === 'biblioteca')  renderTimetable('biblioteca');
    if (page === 'calendario')  renderCalendar();
    if (page === 'admin')       renderAdmin();

    closeSidebarMobile();
  }

  /* ================================================================
     SIDEBAR
     ================================================================ */
  function setupSidebar() {
    document.getElementById('btn-logout').addEventListener('click', logout);

    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', e => { e.preventDefault(); navigateTo(item.dataset.page); });
    });
    document.querySelectorAll('.quick-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => navigateTo(btn.dataset.page));
    });
    document.querySelectorAll('[data-page].link-sm').forEach(el => {
      el.addEventListener('click', e => { e.preventDefault(); navigateTo(el.dataset.page); });
    });

    document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebarMobile);
    document.getElementById('sidebar-close').addEventListener('click', closeSidebarMobile);
    document.getElementById('sidebar-overlay').addEventListener('click', closeSidebarMobile);
  }

  function toggleSidebarMobile() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('hidden');
  }
  function closeSidebarMobile() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.add('hidden');
  }

  /* ================================================================
     TOPBAR
     ================================================================ */
  function setupTopbar() {
    document.getElementById('notif-btn').addEventListener('click', e => {
      e.stopPropagation();
      state.notifOpen = !state.notifOpen;
      document.getElementById('notif-dropdown').classList.toggle('hidden', !state.notifOpen);
    });
    document.addEventListener('click', () => {
      if (state.notifOpen) {
        state.notifOpen = false;
        document.getElementById('notif-dropdown').classList.add('hidden');
      }
    });
    document.getElementById('notif-clear').addEventListener('click', () => {
      DB.notificacoes = [];
      renderNotifications();
      document.querySelector('.notif-dot').style.display = 'none';
    });
    renderNotifications();
  }

  function renderNotifications() {
    const list = document.getElementById('notif-list');
    if (!DB.notificacoes.length) {
      list.innerHTML = '<li style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px">Sem notificações</li>';
      return;
    }
    list.innerHTML = DB.notificacoes.map(n => `
      <li class="notif-item">
        <div class="notif-icon" style="background:${n.color}22;color:${n.color}">
          <i class="fa-solid ${n.icon}"></i>
        </div>
        <div class="notif-text">
          <strong>${n.title}</strong>
          <span>${n.text}</span>
          <span style="font-size:10px;color:var(--text-muted);margin-top:2px;display:block">${n.time}</span>
        </div>
      </li>`).join('');
  }

  /* ================================================================
     MODAL
     ================================================================ */
  let modalCallback = null;

  function setupModal() {
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-overlay').addEventListener('click', e => {
      if (e.target === document.getElementById('modal-overlay')) closeModal();
    });
    document.getElementById('modal-confirm').addEventListener('click', () => {
      if (modalCallback) modalCallback();
      closeModal();
    });
  }

  function openModal(title, body, confirmText, cb, confirmClass = 'btn-primary') {
    document.getElementById('modal-title').textContent   = title;
    document.getElementById('modal-body').innerHTML      = body;
    document.getElementById('modal-confirm').textContent = confirmText || 'Confirmar';
    document.getElementById('modal-confirm').className   = `btn ${confirmClass}`;
    document.getElementById('modal-cancel').classList.remove('hidden');
    modalCallback = cb;
    document.getElementById('modal-overlay').classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    modalCallback = null;
  }

  /* ================================================================
     TOAST
     ================================================================ */
  function toast(msg, type = 'success') {
    const icons = { success: 'fa-check-circle', error: 'fa-circle-exclamation', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${msg}</span>`;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; el.style.transition = '.3s';
      setTimeout(() => el.remove(), 300);
    }, 3500);
  }

  /* ================================================================
     DASHBOARD
     ================================================================ */
  function setupDashboard() {
    const now = new Date();
    document.getElementById('current-date').textContent = now.toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    const hour = now.getHours();
    const greet = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const icon  = hour < 12 ? '☀️' : hour < 18 ? '🌤️' : '🌙';
    document.getElementById('dashboard-greeting').textContent =
      `${greet}, ${state.user?.name?.split(' ')[0] || ''}! ${icon}`;
  }

  function renderDashboard() {
    const available = state.notebooksTotal - state.notebooksInUse;
    document.getElementById('stat-notebooks').textContent = available;

    const mine = DB.agendamentos.filter(a => a.userId === state.user?.id);
    const myList = document.getElementById('my-schedules-list');
    if (!mine.length) {
      myList.innerHTML = '<li class="empty-state"><i class="fa-regular fa-calendar-xmark"></i><p>Sem agendamentos</p></li>';
    } else {
      const colors = { notebook: '#3B82F6', informatica: '#7C3AED', biblioteca: '#F59E0B' };
      const labels = { notebook: 'Notebook', informatica: 'Informática', biblioteca: 'Biblioteca' };
      myList.innerHTML = mine.slice(0, 5).map(a => `
        <li class="schedule-item">
          <span class="schedule-dot" style="background:${colors[a.tipo]}"></span>
          <div class="schedule-info">
            <strong>${labels[a.tipo]} — ${a.turma || a.disciplina || ''}</strong>
            <span>${formatDate(a.data)} · ${a.aulaLabel || a.horario || '—'}</span>
          </div>
          <span class="status-badge status-${a.status}">${capitalize(a.status)}</span>
        </li>`).join('');
    }
    renderAvailabilityGrid();
  }

  function renderAvailabilityGrid() {
    const today = new Date().toISOString().split('T')[0];
    const todayAgend = DB.agendamentos.filter(a => a.data === today && a.status !== 'cancelado');
    const slots = [
      ...AULAS.manha.map(a => ({ key: `M${a.num}`, label: `M${a.num}`, desc: a.horario })),
      ...AULAS.tarde.map(a => ({ key: `T${a.num}`, label: `T${a.num}`, desc: a.horario })),
    ];
    const grid = document.getElementById('availability-grid');
    grid.innerHTML = slots.map(slot => {
      const period = slot.key.startsWith('M') ? 'manha' : 'tarde';
      const num = parseInt(slot.key.slice(1));
      const busy = todayAgend.filter(a => a.periodo === period && a.aulaNum === num);
      const cls   = busy.length >= 2 ? 'avail-busy' : busy.length === 1 ? 'avail-partial' : 'avail-free';
      const lbl   = busy.length >= 2 ? 'Ocupado' : busy.length === 1 ? 'Parcial' : 'Livre';
      return `<div class="avail-slot ${cls}" title="${slot.desc}">
        <span class="slot-time">${slot.label}</span>
        <span class="slot-status">${lbl}</span>
      </div>`;
    }).join('');
  }

  /* ================================================================
     MÓDULO: NOTEBOOKS
     ================================================================ */
  function setupNotebooks() {
    const form = document.getElementById('notebook-form');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const date    = document.getElementById('nb-date').value;
      const qty     = parseInt(document.getElementById('nb-quantity').value);
      const turma   = document.getElementById('nb-turma').value.trim();
      const obs     = document.getElementById('nb-obs').value.trim();
      const aulaInfo = getAulaFromForm('nb-periodo', 'nb-aula');
      const incident = readIncident('nb-inc-tipo', 'nb-inc-qtd', 'nb-inc-descricao');

      if (!date || !turma) { toast('Preencha todos os campos obrigatórios.', 'warning'); return; }
      if (qty < 1 || qty > state.notebooksTotal) { toast(`Quantidade deve ser entre 1 e ${state.notebooksTotal}.`, 'warning'); return; }
      const available = state.notebooksTotal - state.notebooksInUse;
      if (qty > available) { toast(`Apenas ${available} notebooks disponíveis.`, 'error'); return; }

      const novo = {
        id: DB.nextId(), tipo: 'notebook',
        userId: state.user.id, userName: state.user.name,
        data: date,
        periodo: aulaInfo.periodo,
        aulaNum: aulaInfo.num,
        aulaLabel: aulaInfo.label,
        horario: aulaInfo.label,
        quantidade: qty, turma, obs,
        incidente: incident,
        status: state.user.role === 'admin' ? 'confirmado' : 'pendente',
        criadoEm: new Date().toISOString()
      };
      DB.agendamentos.push(novo);
      if (incident) DB.incidentes.push({ ...incident, id: DB.nextId(), local: 'notebook', userName: state.user.name, data: date, aulaLabel: aulaInfo.label });
      state.notebooksInUse += qty;
      updateNotebookStats();

      addNotification('Agendamento Enviado', `Notebooks — ${turma}`, 'fa-laptop', '#3B82F6');
      addActivity(`Agendamento de notebooks por ${state.user.name}`, 'fa-laptop', '#3B82F6');
      if (incident) addActivity(`⚠️ Incidente registrado: ${incidentLabel(incident.tipo)}`, 'fa-triangle-exclamation', '#F59E0B');

      toast(incident
        ? 'Agendamento enviado e incidente registrado!'
        : 'Agendamento enviado! Aguardando confirmação.',
        'success');
      form.reset();
      document.getElementById('nb-inc-qtd').style.display  = 'none';
      document.getElementById('nb-inc-descricao').style.display = 'none';
      renderNotebooksTable();
      setTodayInputs();
      populateAulasSelect('manha', document.getElementById('nb-aula'));
    });

    document.querySelectorAll('#sec-notebooks .filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#sec-notebooks .filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderNotebooksTable(btn.dataset.filter);
      });
    });
  }

  function updateNotebookStats() {
    const available = state.notebooksTotal - state.notebooksInUse;
    const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    setEl('nb-available', available);
    setEl('nb-in-use', state.notebooksInUse);
    setEl('stat-notebooks', available);
  }

  function renderNotebooksTable(filter = 'all') {
    const tbody = document.getElementById('notebooks-tbody');
    let data = DB.agendamentos.filter(a => a.tipo === 'notebook');
    if (state.user?.role !== 'admin') data = data.filter(a => a.userId === state.user.id);
    if (filter !== 'all') data = data.filter(a => a.status === filter);

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="padding:28px;text-align:center;color:var(--text-muted)">
        <i class="fa-regular fa-calendar-xmark" style="display:block;font-size:28px;margin-bottom:8px;opacity:.35"></i>
        Nenhum agendamento encontrado</td></tr>`;
      return;
    }
    tbody.innerHTML = data.map(a => `
      <tr>
        <td>${formatDate(a.data)}</td>
        <td><span class="aula-label ${a.periodo === 'tarde' ? 'tarde' : ''}">${a.aulaLabel || a.horario || '—'}</span></td>
        <td><strong>${a.quantidade}</strong> un.</td>
        <td>${a.turma}</td>
        <td>${a.userName}</td>
        <td>${a.incidente
          ? `<span class="status-badge status-aberto" title="${a.incidente.descricao || ''}">⚠️ ${incidentLabel(a.incidente.tipo)}</span>`
          : '<span style="color:var(--text-muted);font-size:12px">—</span>'}</td>
        <td><span class="status-badge status-${a.status}">${capitalize(a.status)}</span></td>
        <td>
          <div class="action-btns">
            ${state.user.role === 'admin' && a.status === 'pendente'
              ? `<button class="action-btn action-btn-confirm" title="Confirmar" onclick="App.confirmarAgend(${a.id})"><i class="fa-solid fa-check"></i></button>` : ''}
            ${a.status !== 'cancelado'
              ? `<button class="action-btn action-btn-cancel" title="Cancelar" onclick="App.cancelarAgend(${a.id})"><i class="fa-solid fa-xmark"></i></button>` : ''}
            <button class="action-btn action-btn-view" title="Detalhes" onclick="App.verDetalhes(${a.id})"><i class="fa-solid fa-eye"></i></button>
          </div>
        </td>
      </tr>`).join('');
  }

  /* ================================================================
     MÓDULO: SALA DE INFORMÁTICA
     ================================================================ */
  function setupInformatica() {
    const form = document.getElementById('informatica-form');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const date     = document.getElementById('inf-date').value;
      const turma    = document.getElementById('inf-turma').value.trim();
      const disc     = document.getElementById('inf-disciplina').value.trim();
      const obj      = document.getElementById('inf-objetivo').value.trim();
      const aulaInfo = getAulaFromForm('inf-periodo', 'inf-aula');
      const incident = readIncident('inf-inc-tipo', 'inf-inc-qtd', 'inf-inc-descricao');

      if (!date || !turma || !disc) { toast('Preencha todos os campos obrigatórios.', 'warning'); return; }

      // Verificar conflito de aula
      const conflict = DB.agendamentos.find(a =>
        a.tipo === 'informatica' && a.data === date &&
        a.periodo === aulaInfo.periodo && a.aulaNum === aulaInfo.num &&
        a.status !== 'cancelado'
      );
      if (conflict) { toast(`Esta aula já está reservada para ${conflict.turma}!`, 'error'); return; }

      const novo = {
        id: DB.nextId(), tipo: 'informatica',
        userId: state.user.id, userName: state.user.name,
        data: date,
        periodo: aulaInfo.periodo, aulaNum: aulaInfo.num, aulaLabel: aulaInfo.label,
        horario: aulaInfo.label,
        turma, disciplina: disc, objetivo: obj,
        incidente: incident,
        status: state.user.role === 'admin' ? 'confirmado' : 'pendente',
        criadoEm: new Date().toISOString()
      };
      DB.agendamentos.push(novo);
      if (incident) DB.incidentes.push({ ...incident, id: DB.nextId(), local: 'informatica', userName: state.user.name, data: date, aulaLabel: aulaInfo.label });

      addNotification('Reserva Enviada', `Sala de Informática — ${turma}`, 'fa-desktop', '#7C3AED');
      addActivity(`Reserva da Sala de Informática por ${state.user.name}`, 'fa-desktop', '#7C3AED');
      if (incident) addActivity(`⚠️ Incidente registrado: ${incidentLabel(incident.tipo)}`, 'fa-triangle-exclamation', '#F59E0B');

      toast(incident ? 'Reserva enviada e incidente registrado!' : 'Reserva enviada!', 'success');
      form.reset();
      document.getElementById('inf-inc-qtd').style.display  = 'none';
      document.getElementById('inf-inc-descricao').style.display = 'none';
      renderTimetable('informatica');
      setTodayInputs();
      populateAulasSelect('manha', document.getElementById('inf-aula'));
    });
  }

  function renderTimetable(tipo) {
    const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
    const today = new Date();
    const weekDates = [];
    const dow = today.getDay();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + mondayOffset + i);
      weekDates.push(d.toISOString().split('T')[0]);
    }

    const agendTipo = DB.agendamentos.filter(a => a.tipo === tipo && a.status !== 'cancelado');
    const container = document.getElementById(`${tipo}-timetable`);

    let html = `<div class="timetable">
      <div class="timetable-header">
        <div class="tt-cell">Período / Aula</div>
        ${days.map((d, i) => `<div class="tt-cell">${d}<br><small style="font-weight:400;opacity:.7">${formatDateShort(weekDates[i])}</small></div>`).join('')}
      </div>`;

    ['manha', 'tarde'].forEach(periodo => {
      // Linha separadora de período
      const periodoLabel = periodo === 'manha' ? '☀️ Manhã' : '🌤️ Tarde';
      html += `<div class="timetable-row" style="background:var(--gray-50)">
        <div class="tt-cell" colspan="6" style="font-weight:700;color:var(--primary);font-size:11px;text-transform:uppercase;letter-spacing:.5px;grid-column:1/-1;justify-content:flex-start;padding:8px 12px;">${periodoLabel}</div>
      </div>`;

      AULAS[periodo].forEach(aula => {
        html += `<div class="timetable-row">
          <div class="tt-cell" style="flex-direction:column;align-items:flex-start;gap:2px">
            <strong style="font-size:12px">${aula.label}</strong>
            <small style="color:var(--text-muted)">${aula.horario}</small>
          </div>`;

        weekDates.forEach(date => {
          const slot = agendTipo.find(a => a.data === date && a.periodo === periodo && a.aulaNum === aula.num);
          if (slot) {
            const isMine = slot.userId === state.user?.id;
            const cls = isMine ? 'tt-mine' : 'tt-busy';
            const lbl = isMine
              ? `<strong>Você</strong><br>${slot.turma || slot.disciplina || ''}`
              : `${slot.turma || slot.disciplina || slot.userName}`;
            const incIcon = slot.incidente ? ' ⚠️' : '';
            html += `<div class="tt-cell"><span class="${cls}" style="padding:4px 6px;width:100%;text-align:center">${lbl}${incIcon}</span></div>`;
          } else {
            html += `<div class="tt-cell"><span class="tt-free">Livre</span></div>`;
          }
        });
        html += `</div>`;
      });
    });

    html += '</div>';
    container.innerHTML = html;
  }

  /* ================================================================
     MÓDULO: BIBLIOTECA
     ================================================================ */
  function setupBiblioteca() {
    const form = document.getElementById('biblioteca-form');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const date     = document.getElementById('bib-date').value;
      const tipo     = document.getElementById('bib-tipo').value;
      const turma    = document.getElementById('bib-turma').value.trim();
      const final    = document.getElementById('bib-finalidade').value.trim();
      const aulaInfo = getAulaFromForm('bib-periodo', 'bib-aula');
      const incident = readIncident('bib-inc-tipo', 'bib-inc-qtd', 'bib-inc-descricao');

      if (!date || !turma) { toast('Preencha todos os campos obrigatórios.', 'warning'); return; }

      const novo = {
        id: DB.nextId(), tipo: 'biblioteca',
        userId: state.user.id, userName: state.user.name,
        data: date,
        periodo: aulaInfo.periodo, aulaNum: aulaInfo.num, aulaLabel: aulaInfo.label,
        horario: aulaInfo.label,
        turma, tipo_reserva: tipo, finalidade: final,
        incidente: incident,
        status: state.user.role === 'admin' ? 'confirmado' : 'pendente',
        criadoEm: new Date().toISOString()
      };
      DB.agendamentos.push(novo);
      if (incident) DB.incidentes.push({ ...incident, id: DB.nextId(), local: 'biblioteca', userName: state.user.name, data: date, aulaLabel: aulaInfo.label });

      addNotification('Reserva Enviada', `Biblioteca — ${turma}`, 'fa-book-open', '#F59E0B');
      addActivity(`Reserva da Biblioteca por ${state.user.name}`, 'fa-book-open', '#F59E0B');
      if (incident) addActivity(`⚠️ Incidente registrado: ${incidentLabel(incident.tipo)}`, 'fa-triangle-exclamation', '#F59E0B');

      toast(incident ? 'Reserva enviada e incidente registrado!' : 'Reserva da biblioteca enviada!', 'success');
      form.reset();
      document.getElementById('bib-inc-qtd').style.display  = 'none';
      document.getElementById('bib-inc-descricao').style.display = 'none';
      renderTimetable('biblioteca');
      setTodayInputs();
      populateAulasSelect('manha', document.getElementById('bib-aula'));
    });
  }

  /* ================================================================
     CALENDÁRIO
     ================================================================ */
  function setupCalendario() {
    document.getElementById('cal-prev').addEventListener('click', () => {
      state.calendarDate.setMonth(state.calendarDate.getMonth() - 1);
      renderCalendar();
    });
    document.getElementById('cal-next').addEventListener('click', () => {
      state.calendarDate.setMonth(state.calendarDate.getMonth() + 1);
      renderCalendar();
    });
  }

  function renderCalendar() {
    const d = state.calendarDate;
    const year = d.getFullYear(), month = d.getMonth();
    const today = new Date().toISOString().split('T')[0];

    document.getElementById('cal-title').textContent =
      d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev  = new Date(year, month, 0).getDate();

    const agendByDate = {};
    DB.agendamentos.forEach(a => {
      if (!agendByDate[a.data]) agendByDate[a.data] = [];
      agendByDate[a.data].push(a);
    });

    const dayNames = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    let html = dayNames.map(n => `<div class="cal-day-name">${n}</div>`).join('');

    for (let i = firstDay - 1; i >= 0; i--)
      html += `<div class="cal-day other-month"><span class="cal-num">${daysInPrev - i}</span></div>`;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const events  = agendByDate[dateStr] || [];
      const isToday    = dateStr === today;
      const isSelected = dateStr === state.calendarSelectedDay;
      const dots = [...new Set(events.map(e => e.tipo))].slice(0,3).map(tipo => {
        const c = { notebook: '#3B82F6', informatica: '#10B981', biblioteca: '#F59E0B' };
        return `<span class="cal-dot" style="background:${c[tipo]}"></span>`;
      }).join('');
      const hasIncident = events.some(e => e.incidente);
      html += `<div class="cal-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}"
           onclick="App.selectCalDay('${dateStr}')">
        <span class="cal-num">${day}${hasIncident ? '<span style="color:#F59E0B;font-size:9px"> ⚠</span>' : ''}</span>
        <div class="cal-dots">${dots}</div>
      </div>`;
    }

    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    for (let i = firstDay + daysInMonth, nd = 1; i < totalCells; i++, nd++)
      html += `<div class="cal-day other-month"><span class="cal-num">${nd}</span></div>`;

    document.getElementById('calendar-grid').innerHTML = html;
    selectCalDay(state.calendarSelectedDay, false);
  }

  function selectCalDay(dateStr, rerender = true) {
    state.calendarSelectedDay = dateStr;
    const events = DB.agendamentos.filter(a => a.data === dateStr);
    document.getElementById('cal-day-title').textContent = `Agendamentos — ${formatDate(dateStr)}`;

    const list = document.getElementById('cal-day-events');
    if (!events.length) {
      list.innerHTML = '<li class="empty-state"><i class="fa-regular fa-calendar-xmark"></i><p>Sem agendamentos neste dia</p></li>';
    } else {
      const colors = { notebook: '#3B82F6', informatica: '#7C3AED', biblioteca: '#F59E0B' };
      const labels = { notebook: 'Notebook', informatica: 'Informática', biblioteca: 'Biblioteca' };
      list.innerHTML = events.map(a => `
        <li class="schedule-item">
          <span class="schedule-dot" style="background:${colors[a.tipo]}"></span>
          <div class="schedule-info">
            <strong>${labels[a.tipo]} — ${a.turma || a.disciplina || a.userName}</strong>
            <span>${a.aulaLabel || a.horario || '—'} · ${a.userName}</span>
            ${a.incidente ? `<span style="font-size:11px;color:#92400E">⚠️ ${incidentLabel(a.incidente.tipo)}</span>` : ''}
          </div>
          <span class="status-badge status-${a.status}">${capitalize(a.status)}</span>
        </li>`).join('');
    }
    if (rerender) renderCalendar();
  }

  /* ================================================================
     CHAT
     ================================================================ */
  function setupChat() {
    renderContactList();
    document.getElementById('chat-search').addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.contact-item').forEach(item => {
        item.style.display = item.dataset.name.toLowerCase().includes(q) ? '' : 'none';
      });
    });
    document.getElementById('chat-send').addEventListener('click', sendMessage);
    document.getElementById('chat-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  function renderContactList() {
    const list = document.getElementById('contact-list');
    list.innerHTML = DB.funcionarios.map(f => `
      <li class="contact-item ${state.chatContact?.id === f.id ? 'active' : ''}"
          data-name="${f.name}" onclick="App.openChat(${f.id})">
        ${f.online ? `<span class="online-dot"></span>` : ''}
        <div class="contact-avatar" style="background:${f.avatar}">${f.name.charAt(0)}</div>
        <div class="contact-info">
          <span class="contact-name">${f.name}</span>
          <span class="contact-last-msg">${f.role}</span>
        </div>
        <div class="contact-meta">
          ${f.unread ? `<span class="contact-unread">${f.unread}</span>` : ''}
        </div>
      </li>`).join('');
  }

  function openChat(contactId) {
    const contact = DB.funcionarios.find(f => f.id === contactId);
    if (!contact) return;
    state.chatContact = contact;
    contact.unread = 0;

    document.getElementById('chat-empty').classList.add('hidden');
    const win = document.getElementById('chat-window');
    win.classList.remove('hidden');

    document.getElementById('chat-contact-avatar').textContent = contact.name.charAt(0);
    document.getElementById('chat-contact-avatar').style.background = contact.avatar;
    document.getElementById('chat-contact-name').textContent   = contact.name;
    document.getElementById('chat-contact-status').textContent = contact.online ? 'online' : 'offline';
    document.getElementById('chat-contact-status').style.color = contact.online ? 'var(--success)' : 'var(--gray-400)';

    renderMessages(contactId);
    renderContactList();

    const totalUnread = DB.funcionarios.reduce((acc, f) => acc + (f.unread || 0), 0);
    const badge = document.getElementById('badge-chat');
    if (totalUnread) { badge.textContent = totalUnread; badge.classList.remove('hidden'); }
    else { badge.classList.add('hidden'); }
  }

  function renderMessages(contactId) {
    const msgs = DB.mensagens[contactId] || [];
    const container = document.getElementById('chat-messages');
    if (!msgs.length) {
      container.innerHTML = `<div style="text-align:center;padding:40px 0;color:var(--text-muted)">
        <i class="fa-solid fa-comment-dots" style="font-size:32px;opacity:.25;display:block;margin-bottom:12px"></i>
        <p style="font-size:13px">Inicie a conversa!</p></div>`;
      return;
    }
    container.innerHTML = `
      <div class="msg-date-divider"><span>Hoje</span></div>
      ${msgs.map(m => {
        const isMine = m.fromMe;
        const avatar = isMine ? state.user.name.charAt(0) : state.chatContact.name.charAt(0);
        const bg     = isMine ? state.user.avatar : state.chatContact.avatar;
        return `<div class="msg ${isMine ? 'sent' : ''}">
          <div class="msg-avatar" style="background:${bg}">${avatar}</div>
          <div class="msg-content">
            <span class="msg-text">${escapeHtml(m.text)}</span>
            <span class="msg-time">${m.time}</span>
          </div>
        </div>`;
      }).join('')}`;
    container.scrollTop = container.scrollHeight;
  }

  function sendMessage() {
    const input = document.getElementById('chat-input');
    const text  = input.value.trim();
    if (!text || !state.chatContact) return;
    const now  = new Date();
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    if (!DB.mensagens[state.chatContact.id]) DB.mensagens[state.chatContact.id] = [];
    DB.mensagens[state.chatContact.id].push({ id: Date.now(), from: 'me', text, time, fromMe: true });
    input.value = '';
    renderMessages(state.chatContact.id);
    if (state.chatContact.online) {
      const responses = [
        'Certo! Posso ajudá-lo(a) com isso.',
        'Entendido! Vou verificar e retorno em breve.',
        'Obrigado pelo contato! Sua solicitação foi anotada.',
        'Sim, pode confirmar o agendamento pelo sistema.',
        'Deixa comigo, verifico agora!',
      ];
      setTimeout(() => {
        DB.mensagens[state.chatContact.id].push({
          id: Date.now()+1, from: state.chatContact.id,
          text: responses[Math.floor(Math.random() * responses.length)],
          time: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()+1).padStart(2,'0')}`,
          fromMe: false
        });
        renderMessages(state.chatContact.id);
      }, 1200);
    }
  }

  /* ================================================================
     ADMIN
     ================================================================ */
  function setupAdmin() {
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-tab-content').forEach(c => {
          c.classList.remove('active'); c.classList.add('hidden');
        });
        tab.classList.add('active');
        const content = document.getElementById(`admin-tab-${tab.dataset.tab}`);
        if (content) { content.classList.remove('hidden'); content.classList.add('active'); }
        state.adminTab = tab.dataset.tab;
        if (tab.dataset.tab === 'agendamentos') renderAdminTable();
        if (tab.dataset.tab === 'usuarios')     renderUsers();
        if (tab.dataset.tab === 'incidentes')   renderIncidentes();
      });
    });

    document.getElementById('admin-filter-type').addEventListener('change', renderAdminTable);
    document.getElementById('admin-filter-status').addEventListener('change', renderAdminTable);
    document.getElementById('inc-filter-tipo').addEventListener('change', renderIncidentes);
    document.getElementById('inc-filter-status').addEventListener('change', renderIncidentes);

    document.getElementById('toggle-informatica').addEventListener('change', function() {
      document.getElementById('label-informatica').textContent = this.checked ? 'Sala Ativa' : 'Sala Inativa';
      toast(this.checked ? 'Sala de Informática ativada' : 'Sala de Informática desativada', this.checked ? 'success' : 'warning');
    });
    document.getElementById('toggle-biblioteca').addEventListener('change', function() {
      document.getElementById('label-biblioteca').textContent = this.checked ? 'Biblioteca Ativa' : 'Biblioteca Inativa';
      toast(this.checked ? 'Biblioteca ativada' : 'Biblioteca desativada', this.checked ? 'success' : 'warning');
    });
  }

  function renderAdmin() {
    const total     = DB.agendamentos.length;
    const pending   = DB.agendamentos.filter(a => a.status === 'pendente').length;
    const cancelled = DB.agendamentos.filter(a => a.status === 'cancelado').length;
    document.getElementById('admin-total-agend').textContent = total;
    document.getElementById('admin-pending').textContent     = pending;
    document.getElementById('admin-cancelled').textContent   = cancelled;
    renderActivityList();
    updateResourceStats();
  }

  function renderAdminTable() {
    const tbody = document.getElementById('admin-tbody');
    const fType = document.getElementById('admin-filter-type').value;
    const fStat = document.getElementById('admin-filter-status').value;
    let data = [...DB.agendamentos];
    if (fType !== 'all') data = data.filter(a => a.tipo === fType);
    if (fStat !== 'all') data = data.filter(a => a.status === fStat);

    const labels = { notebook: 'Notebook', informatica: 'Informática', biblioteca: 'Biblioteca' };
    const icons  = { notebook: 'fa-laptop', informatica: 'fa-desktop', biblioteca: 'fa-book-open' };
    const colors = { notebook: '#3B82F6', informatica: '#7C3AED', biblioteca: '#F59E0B' };

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="padding:24px;text-align:center;color:var(--text-muted)">Nenhum agendamento encontrado</td></tr>`;
      return;
    }
    tbody.innerHTML = data.map(a => `
      <tr>
        <td><span style="display:flex;align-items:center;gap:6px"><i class="fa-solid ${icons[a.tipo]}" style="color:${colors[a.tipo]}"></i>${labels[a.tipo]}</span></td>
        <td>${formatDate(a.data)}</td>
        <td><span class="aula-label ${a.periodo === 'tarde' ? 'tarde' : ''}">${a.aulaLabel || a.horario || '—'}</span></td>
        <td>${a.userName}</td>
        <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis">${a.turma || a.disciplina || '—'}</td>
        <td><span class="status-badge status-${a.status}">${capitalize(a.status)}</span></td>
        <td>
          <div class="action-btns">
            ${a.status === 'pendente' ? `<button class="action-btn action-btn-confirm" title="Confirmar" onclick="App.confirmarAgend(${a.id})"><i class="fa-solid fa-check"></i></button>` : ''}
            ${a.status !== 'cancelado' ? `<button class="action-btn action-btn-cancel" title="Cancelar" onclick="App.cancelarAgend(${a.id})"><i class="fa-solid fa-xmark"></i></button>` : ''}
          </div>
        </td>
      </tr>`).join('');
  }

  function renderIncidentes() {
    const tbody   = document.getElementById('incidentes-tbody');
    const fTipo   = document.getElementById('inc-filter-tipo').value;
    const fStatus = document.getElementById('inc-filter-status').value;

    let data = [...DB.incidentes];
    if (fTipo   !== 'all') data = data.filter(i => i.local === fTipo);
    if (fStatus !== 'all') data = data.filter(i => i.status === fStatus);

    const localColors = { notebook: '#3B82F6', informatica: '#7C3AED', biblioteca: '#F59E0B' };
    const localIcons  = { notebook: 'fa-laptop', informatica: 'fa-desktop', biblioteca: 'fa-book-open' };
    const localLabels = { notebook: 'Notebooks', informatica: 'Informática', biblioteca: 'Biblioteca' };

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="9" style="padding:28px;text-align:center;color:var(--text-muted)">
        <i class="fa-solid fa-circle-check" style="display:block;font-size:28px;margin-bottom:8px;color:var(--success);opacity:.5"></i>
        Nenhum incidente registrado</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(inc => `
      <tr>
        <td><span style="display:flex;align-items:center;gap:6px">
          <i class="fa-solid ${localIcons[inc.local]}" style="color:${localColors[inc.local]}"></i>
          ${localLabels[inc.local]}
        </span></td>
        <td>${formatDate(inc.data)}</td>
        <td><span class="aula-label ${inc.aulaLabel?.includes('Tarde') ? 'tarde' : ''}" style="font-size:11px">${inc.aulaLabel || '—'}</span></td>
        <td>${incidentLabel(inc.tipo)}</td>
        <td><strong>${inc.quantidade || '—'}</strong></td>
        <td style="max-width:180px;font-size:12px;color:var(--gray-600)">${inc.descricao || '—'}</td>
        <td>${inc.userName}</td>
        <td><span class="status-badge status-${inc.status}">${capitalize(inc.status?.replace('_', ' ') || 'aberto')}</span></td>
        <td>
          <div class="action-btns">
            ${inc.status === 'aberto' ? `
              <button class="action-btn action-btn-confirm" title="Marcar em andamento" onclick="App.atualizarIncidente(${inc.id},'em_andamento')">
                <i class="fa-solid fa-wrench"></i>
              </button>` : ''}
            ${inc.status !== 'resolvido' ? `
              <button class="action-btn action-btn-view" title="Marcar como resolvido" onclick="App.atualizarIncidente(${inc.id},'resolvido')" style="background:var(--success-light);color:var(--success)">
                <i class="fa-solid fa-check"></i>
              </button>` : ''}
          </div>
        </td>
      </tr>`).join('');
  }

  function atualizarIncidente(id, novoStatus) {
    const inc = DB.incidentes.find(i => i.id === id);
    if (!inc) return;
    inc.status = novoStatus;
    const labels = { em_andamento: 'Em andamento', resolvido: 'Resolvido' };
    toast(`Incidente marcado como: ${labels[novoStatus]}`, 'success');
    addActivity(`Incidente atualizado para "${labels[novoStatus]}"`, 'fa-wrench', '#10B981');
    renderIncidentes();
  }

  function renderUsers() {
    const grid = document.getElementById('users-grid');
    grid.innerHTML = DB.users.map(u => `
      <div class="user-card">
        <div class="user-card-avatar" style="background:${u.avatar}">${u.name.charAt(0)}</div>
        <div class="user-card-name">${u.name}</div>
        <div class="user-card-role role-${u.role}">${capitalize(u.role)}</div>
        ${u.turma ? `<div style="font-size:11px;color:var(--text-muted);margin-top:6px">${u.turma}</div>` : ''}
        <div style="margin-top:10px;font-size:11px;color:var(--text-muted)">${u.email}</div>
      </div>`).join('');
  }

  function renderActivityList() {
    const list = document.getElementById('activity-list');
    const acts = state._activities.length
      ? state._activities
      : DB.agendamentos.slice(-5).reverse().map(a => ({
          text: `Agendamento de ${a.tipo} por ${a.userName}`,
          icon: a.tipo === 'notebook' ? 'fa-laptop' : a.tipo === 'informatica' ? 'fa-desktop' : 'fa-book-open',
          color: a.tipo === 'notebook' ? '#3B82F6' : a.tipo === 'informatica' ? '#7C3AED' : '#F59E0B',
          time: 'Recente'
        }));

    list.innerHTML = acts.slice(0, 10).map(a => `
      <li class="activity-item">
        <div class="activity-icon" style="background:${a.color}22;color:${a.color}">
          <i class="fa-solid ${a.icon}"></i>
        </div>
        <div class="activity-text">
          <strong>${a.text}</strong>
          <span>${a.time}</span>
        </div>
      </li>`).join('');
  }

  function updateResourceStats() {
    const available = state.notebooksTotal - state.notebooksInUse;
    const pct = Math.round((available / state.notebooksTotal) * 100);
    const el  = document.getElementById('res-nb-avail');
    const bar = document.getElementById('res-nb-bar');
    if (el)  el.textContent  = available;
    if (bar) bar.style.width = `${pct}%`;
  }

  function updateResource(resource, delta) {
    if (resource === 'notebooks') {
      const newTotal = state.notebooksTotal + delta;
      if (newTotal < state.notebooksInUse) { toast('Não é possível reduzir abaixo dos em uso.', 'error'); return; }
      if (newTotal < 1) { toast('Total mínimo é 1.', 'error'); return; }
      state.notebooksTotal = newTotal;
      updateNotebookStats();
      updateResourceStats();
      toast(`Total de notebooks: ${newTotal}`, 'info');
    }
  }

  /* ================================================================
     AÇÕES GLOBAIS
     ================================================================ */
  function confirmarAgend(id) {
    const a = DB.agendamentos.find(ag => ag.id === id);
    if (!a) return;
    openModal('Confirmar Agendamento',
      `<p>Confirmar o agendamento de <strong>${a.tipo}</strong> para <strong>${a.userName}</strong>?</p>
       <p style="margin-top:8px;color:var(--text-muted);font-size:13px">${formatDate(a.data)} · ${a.aulaLabel || a.horario}</p>`,
      'Confirmar',
      () => {
        a.status = 'confirmado';
        toast('Agendamento confirmado!', 'success');
        addActivity(`Agendamento confirmado: ${a.tipo} — ${a.userName}`, 'fa-check', '#10B981');
        refresh();
      }, 'btn-success');
  }

  function cancelarAgend(id) {
    const a = DB.agendamentos.find(ag => ag.id === id);
    if (!a) return;
    openModal('Cancelar Agendamento',
      `<p>Deseja cancelar este agendamento?</p>
       <p style="margin-top:8px;color:var(--text-muted);font-size:13px"><strong>${a.tipo}</strong> · ${formatDate(a.data)} · ${a.aulaLabel || a.horario}</p>`,
      'Cancelar Agendamento',
      () => {
        if (a.tipo === 'notebook' && a.status !== 'cancelado') {
          state.notebooksInUse = Math.max(0, state.notebooksInUse - a.quantidade);
          updateNotebookStats();
        }
        a.status = 'cancelado';
        toast('Agendamento cancelado.', 'warning');
        addActivity(`Agendamento cancelado: ${a.tipo} — ${a.userName}`, 'fa-xmark', '#EF4444');
        refresh();
      }, 'btn-danger');
  }

  function verDetalhes(id) {
    const a = DB.agendamentos.find(ag => ag.id === id);
    if (!a) return;
    const labels = { notebook: 'Carrinho de Notebooks', informatica: 'Sala de Informática', biblioteca: 'Biblioteca' };
    const rows = [
      ['Tipo',          labels[a.tipo]],
      ['Data',          formatDate(a.data)],
      ['Período / Aula', a.aulaLabel || a.horario || '—'],
      ['Solicitante',   a.userName],
      ['Status',        capitalize(a.status)],
      a.quantidade  ? ['Quantidade',  `${a.quantidade} notebooks`] : null,
      a.turma       ? ['Turma/Nome',  a.turma] : null,
      a.disciplina  ? ['Disciplina',  a.disciplina] : null,
      a.finalidade  ? ['Finalidade',  a.finalidade] : null,
      a.objetivo    ? ['Objetivo',    a.objetivo] : null,
      a.obs && a.obs ? ['Observação', a.obs] : null,
    ].filter(Boolean);

    let incHtml = '';
    if (a.incidente) {
      incHtml = `<div style="margin-top:14px;padding:12px;background:#FFFBEB;border:1.5px solid #FDE68A;border-radius:8px">
        <p style="font-weight:600;font-size:13px;color:#92400E;margin-bottom:8px">⚠️ Incidente Registrado</p>
        <table style="width:100%;font-size:12px;border-collapse:collapse">
          <tr><td style="padding:4px 0;color:var(--text-muted);width:40%">Tipo</td><td>${incidentLabel(a.incidente.tipo)}</td></tr>
          <tr><td style="padding:4px 0;color:var(--text-muted)">Quantidade</td><td>${a.incidente.quantidade}</td></tr>
          <tr><td style="padding:4px 0;color:var(--text-muted)">Status</td><td>${capitalize(a.incidente.status)}</td></tr>
          ${a.incidente.descricao ? `<tr><td style="padding:4px 0;color:var(--text-muted)">Descrição</td><td>${a.incidente.descricao}</td></tr>` : ''}
        </table>
      </div>`;
    }

    const body = `<table style="width:100%;font-size:13px;border-collapse:collapse">
      ${rows.map(([k, v]) => `
        <tr>
          <td style="padding:8px 0;color:var(--text-muted);width:40%;font-weight:500">${k}</td>
          <td style="padding:8px 0">${v}</td>
        </tr>`).join('')}
    </table>${incHtml}`;

    openModal('Detalhes do Agendamento', body, 'Fechar', closeModal);
    document.getElementById('modal-cancel').classList.add('hidden');
  }

  function refresh() {
    if (state.currentPage === 'notebooks')   renderNotebooksTable();
    if (state.currentPage === 'admin')       { renderAdmin(); renderAdminTable(); }
    if (state.currentPage === 'calendario')  renderCalendar();
    if (state.currentPage === 'dashboard')   renderDashboard();
    if (state.currentPage === 'informatica') renderTimetable('informatica');
    if (state.currentPage === 'biblioteca')  renderTimetable('biblioteca');
  }

  /* ================================================================
     NOTIFICAÇÕES / ATIVIDADES
     ================================================================ */
  function setupNotifications() {}

  function addNotification(title, text, icon, color) {
    DB.notificacoes.unshift({ id: Date.now(), title, text, icon, color, time: 'Agora' });
    renderNotifications();
    const dot = document.querySelector('.notif-dot');
    if (dot) dot.style.display = '';
  }

  function addActivity(text, icon, color) {
    state._activities.unshift({ text, icon, color, time: 'Agora' });
    if (state._activities.length > 20) state._activities.pop();
  }

  /* ================================================================
     HELPERS
     ================================================================ */
  function setTodayInputs() {
    const today = new Date().toISOString().split('T')[0];
    ['nb-date', 'inf-date', 'bib-date'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.min = today; if (!el.value) el.value = today; }
    });
  }

  function incidentLabel(tipo) {
    const map = {
      notebook_danificado:    'Notebook danificado',
      notebook_faltando:      'Notebook faltando',
      carregador_danificado:  'Carregador danificado',
      teclado_defeito:        'Teclado/mouse com defeito',
      tela_danificada:        'Tela danificada',
      computador_danificado:  'Computador danificado',
      computador_faltando:    'Computador faltando',
      teclado_mouse:          'Teclado/mouse com defeito',
      monitor_danificado:     'Monitor danificado',
      internet_indisponivel:  'Internet indisponível',
      projetor_defeito:       'Projetor com defeito',
      livro_danificado:       'Livro danificado',
      livro_faltando:         'Livro faltando',
      mobiliario_danificado:  'Mobiliário danificado',
      barulho_excessivo:      'Barulho excessivo',
      outro:                  'Outro problema',
    };
    return map[tipo] || tipo;
  }

  function formatDate(str) {
    if (!str) return '—';
    const [y, m, d] = str.split('-');
    return `${d}/${m}/${y}`;
  }

  function formatDateShort(str) {
    if (!str) return '';
    const [, m, d] = str.split('-');
    return `${d}/${m}`;
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* ================================================================
     PUBLIC API
     ================================================================ */
  return {
    init,
    navigateTo,
    openChat,
    selectCalDay,
    confirmarAgend,
    cancelarAgend,
    verDetalhes,
    updateResource,
    updateAulasSelect,
    atualizarIncidente,
  };

})();

document.addEventListener('DOMContentLoaded', () => App.init());
