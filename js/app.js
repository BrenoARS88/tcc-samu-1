/* ============================================================
   APP.JS — EduAgenda
   Lógica principal: auth, navegação, módulos, chat, calendário
   ============================================================ */

'use strict';

const App = (() => {

  /* ---- Estado ---- */
  let state = {
    user: null,
    currentPage: 'dashboard',
    calendarDate: new Date(),
    calendarSelectedDay: new Date().toISOString().split('T')[0],
    chatContact: null,
    notifOpen: false,
    adminTab: 'overview',
    agendFilter: { type: 'all', status: 'all' },
    notebooksTotal: 30,
    notebooksInUse: 12,
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
    const form     = document.getElementById('login-form');
    const tabs     = document.querySelectorAll('.tab-btn');
    const demoItems= document.querySelectorAll('.demo-item');
    const togglePw = document.querySelector('.toggle-password');
    const pwInput  = document.getElementById('login-password');

    // Tab selector
    tabs.forEach(t => t.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      t.classList.add('active');
    }));

    // Demo account click-to-fill
    demoItems.forEach(item => {
      item.addEventListener('click', () => {
        document.getElementById('login-email').value    = item.dataset.email;
        document.getElementById('login-password').value = item.dataset.pass;
        // Set correct tab
        const role = item.dataset.role;
        tabs.forEach(b => { b.classList.toggle('active', b.dataset.role === role); });
      });
    });

    // Show/hide password
    togglePw.addEventListener('click', () => {
      const isText = pwInput.type === 'text';
      pwInput.type = isText ? 'password' : 'text';
      togglePw.querySelector('i').className = `fa-solid fa-eye${isText ? '' : '-slash'}`;
    });

    // Submit
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

    // Update UI elements
    document.getElementById('nav-name').textContent    = user.name;
    document.getElementById('nav-role').textContent    = capitalize(user.role);
    document.getElementById('nav-avatar').textContent  = user.name.charAt(0);
    document.getElementById('topbar-avatar').textContent = user.name.charAt(0);
    document.getElementById('nav-avatar').style.background  = user.avatar;
    document.getElementById('topbar-avatar').style.background = user.avatar;

    // Mostrar link admin se for admin
    if (user.role === 'admin') {
      document.getElementById('nav-admin').classList.remove('hidden');
    }

    // Transição de página
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
    // reset form
    document.getElementById('login-form').reset();
    document.getElementById('login-error').classList.add('hidden');
  }

  /* ================================================================
     SETUP APP (chamado após login)
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
  }

  /* ================================================================
     NAVEGAÇÃO
     ================================================================ */
  function navigateTo(page) {
    // Ocultar seção atual
    document.querySelectorAll('.section').forEach(s => {
      s.classList.remove('active');
      s.classList.add('hidden');
    });

    // Ativar seção
    const sec = document.getElementById(`sec-${page}`);
    if (sec) {
      sec.classList.remove('hidden');
      sec.classList.add('active');
    }

    // Nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // Topbar title
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

    // Refresh de dados por página
    if (page === 'dashboard')   renderDashboard();
    if (page === 'notebooks')   renderNotebooksTable();
    if (page === 'informatica') renderTimetable('informatica');
    if (page === 'biblioteca')  renderTimetable('biblioteca');
    if (page === 'calendario')  renderCalendar();
    if (page === 'admin')       renderAdmin();

    // Fechar sidebar mobile
    closeSidebarMobile();
  }

  /* ================================================================
     SIDEBAR
     ================================================================ */
  function setupSidebar() {
    document.getElementById('btn-logout').addEventListener('click', logout);

    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        navigateTo(item.dataset.page);
      });
    });

    document.querySelectorAll('.quick-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => navigateTo(btn.dataset.page));
    });

    document.querySelectorAll('[data-page]').forEach(el => {
      if (el.classList.contains('link-sm')) {
        el.addEventListener('click', e => {
          e.preventDefault();
          navigateTo(el.dataset.page);
        });
      }
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
      list.innerHTML = '<li style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px;">Sem notificações</li>';
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
      </li>
    `).join('');
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
    el.innerHTML = `<i class="fa-solid ${icons[type]}"></i><span>${msg}</span>`;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; el.style.transition = '.3s'; setTimeout(() => el.remove(), 300); }, 3000);
  }

  /* ================================================================
     DASHBOARD
     ================================================================ */
  function setupDashboard() {
    // Data atual
    const now = new Date();
    document.getElementById('current-date').textContent = now.toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    // Saudação
    const hour = now.getHours();
    const greet = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const icon  = hour < 12 ? '☀️' : hour < 18 ? '🌤️' : '🌙';
    document.getElementById('dashboard-greeting').textContent = `${greet}, ${state.user?.name?.split(' ')[0] || ''}! ${icon}`;
  }

  function renderDashboard() {
    const available = state.notebooksTotal - state.notebooksInUse;
    document.getElementById('stat-notebooks').textContent = available;

    // Agendamentos do usuário
    const mine = DB.agendamentos.filter(a => a.userId === state.user?.id);
    const myList = document.getElementById('my-schedules-list');
    if (!mine.length) {
      myList.innerHTML = '<li class="empty-state"><i class="fa-regular fa-calendar-xmark"></i><p>Sem agendamentos</p></li>';
    } else {
      myList.innerHTML = mine.slice(0, 5).map(a => {
        const colors = { notebook: '#3B82F6', informatica: '#7C3AED', biblioteca: '#F59E0B' };
        const labels = { notebook: 'Notebook', informatica: 'Informática', biblioteca: 'Biblioteca' };
        return `
          <li class="schedule-item">
            <span class="schedule-dot" style="background:${colors[a.tipo]}"></span>
            <div class="schedule-info">
              <strong>${labels[a.tipo]} — ${a.turma || a.disciplina || ''}</strong>
              <span>${formatDate(a.data)} · ${a.horario}</span>
            </div>
            <span class="status-badge status-${a.status}">${capitalize(a.status)}</span>
          </li>`;
      }).join('');
    }

    // Disponibilidade
    renderAvailabilityGrid();
  }

  function renderAvailabilityGrid() {
    const slots = ['07:00','08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'];
    const today = new Date().toISOString().split('T')[0];
    const todayAgend = DB.agendamentos.filter(a => a.data === today);

    const grid = document.getElementById('availability-grid');
    grid.innerHTML = slots.map(slot => {
      const busy = todayAgend.filter(a => a.horario && a.horario.startsWith(slot));
      const cls  = busy.length >= 2 ? 'avail-busy' : busy.length === 1 ? 'avail-partial' : 'avail-free';
      const label = busy.length >= 2 ? 'Ocupado' : busy.length === 1 ? 'Parcial' : 'Livre';
      return `<div class="avail-slot ${cls}">
        <span class="slot-time">${slot}</span>
        <span class="slot-status">${label}</span>
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
      const date     = document.getElementById('nb-date').value;
      const tStart   = document.getElementById('nb-time-start').value;
      const tEnd     = document.getElementById('nb-time-end').value;
      const qty      = parseInt(document.getElementById('nb-quantity').value);
      const turma    = document.getElementById('nb-turma').value.trim();
      const obs      = document.getElementById('nb-obs').value.trim();

      if (!date || !turma) { toast('Preencha todos os campos obrigatórios.', 'warning'); return; }
      if (qty < 1 || qty > state.notebooksTotal) { toast(`Quantidade deve ser entre 1 e ${state.notebooksTotal}.`, 'warning'); return; }

      const available = state.notebooksTotal - state.notebooksInUse;
      if (qty > available) { toast(`Apenas ${available} notebooks disponíveis.`, 'error'); return; }

      const novoAgend = {
        id: DB.nextId(), tipo: 'notebook',
        userId: state.user.id, userName: state.user.name,
        data: date, horario: `${tStart} - ${tEnd}`,
        quantidade: qty, turma, obs,
        status: state.user.role === 'admin' ? 'confirmado' : 'pendente',
        criadoEm: new Date().toISOString()
      };
      DB.agendamentos.push(novoAgend);
      state.notebooksInUse += qty;
      updateNotebookStats();

      addNotification('Agendamento Enviado', `Notebooks — ${turma}`, 'fa-laptop', '#3B82F6');
      addActivity(`Agendamento de notebooks criado por ${state.user.name}`, 'fa-laptop', '#3B82F6');

      toast('Agendamento de notebooks enviado! Aguardando confirmação.', 'success');
      form.reset();
      renderNotebooksTable();
      setTodayInputs();
    });

    // Filtros
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
    document.getElementById('nb-available').textContent  = available;
    document.getElementById('nb-in-use').textContent     = state.notebooksInUse;
    document.getElementById('stat-notebooks').textContent = available;
  }

  function renderNotebooksTable(filter = 'all') {
    const tbody = document.getElementById('notebooks-tbody');
    let data = DB.agendamentos.filter(a => a.tipo === 'notebook');

    // Se não é admin, só vê os próprios
    if (state.user?.role !== 'admin') {
      data = data.filter(a => a.userId === state.user.id);
    }

    if (filter !== 'all') data = data.filter(a => a.status === filter);

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fa-regular fa-calendar-xmark"></i><p>Nenhum agendamento encontrado</p></td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(a => `
      <tr>
        <td>${formatDate(a.data)}</td>
        <td>${a.horario}</td>
        <td><strong>${a.quantidade}</strong> unid.</td>
        <td>${a.turma}</td>
        <td>${a.userName}</td>
        <td><span class="status-badge status-${a.status}">${capitalize(a.status)}</span></td>
        <td>
          <div class="action-btns">
            ${state.user.role === 'admin' && a.status === 'pendente' ? `
              <button class="action-btn action-btn-confirm" title="Confirmar" onclick="App.confirmarAgend(${a.id})">
                <i class="fa-solid fa-check"></i>
              </button>` : ''}
            ${a.status !== 'cancelado' ? `
              <button class="action-btn action-btn-cancel" title="Cancelar" onclick="App.cancelarAgend(${a.id})">
                <i class="fa-solid fa-xmark"></i>
              </button>` : ''}
            <button class="action-btn action-btn-view" title="Detalhes" onclick="App.verDetalhes(${a.id})">
              <i class="fa-solid fa-eye"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  /* ================================================================
     MÓDULO: SALA DE INFORMÁTICA
     ================================================================ */
  function setupInformatica() {
    const form = document.getElementById('informatica-form');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const date    = document.getElementById('inf-date').value;
      const period  = document.getElementById('inf-period').value;
      const turma   = document.getElementById('inf-turma').value.trim();
      const disc    = document.getElementById('inf-disciplina').value.trim();
      const obj     = document.getElementById('inf-objetivo').value.trim();

      if (!date || !turma || !disc) { toast('Preencha todos os campos obrigatórios.', 'warning'); return; }

      // Verificar conflito
      const conflict = DB.agendamentos.find(a =>
        a.tipo === 'informatica' && a.data === date && a.horario === period.replace('-', ' - ') && a.status !== 'cancelado'
      );
      if (conflict) { toast('Horário já reservado para este período!', 'error'); return; }

      const novo = {
        id: DB.nextId(), tipo: 'informatica',
        userId: state.user.id, userName: state.user.name,
        data: date, horario: period.replace('-', ' - '), periodo: period,
        turma, disciplina: disc, objetivo: obj,
        status: state.user.role === 'admin' ? 'confirmado' : 'pendente',
        criadoEm: new Date().toISOString()
      };
      DB.agendamentos.push(novo);

      addNotification('Reserva Enviada', `Sala de Informática — ${turma}`, 'fa-desktop', '#7C3AED');
      addActivity(`Reserva da Sala de Informática por ${state.user.name}`, 'fa-desktop', '#7C3AED');

      toast('Reserva enviada! Aguardando confirmação.', 'success');
      form.reset();
      renderTimetable('informatica');
      setTodayInputs();
    });
  }

  function renderTimetable(tipo) {
    const periods = [
      '07:00-08:00', '08:00-09:00', '09:00-10:00', '10:15-11:15',
      '11:15-12:15', '13:00-14:00', '14:00-15:00', '15:00-16:00'
    ];
    const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

    // Obter datas da semana atual
    const today = new Date();
    const weekDates = [];
    const dayOfWeek = today.getDay(); // 0=dom
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + mondayOffset + i);
      weekDates.push(d.toISOString().split('T')[0]);
    }

    const container = document.getElementById(`${tipo}-timetable`);
    const agendTipo = DB.agendamentos.filter(a => a.tipo === tipo && a.status !== 'cancelado');

    let html = `<div class="timetable">
      <div class="timetable-header">
        <div class="tt-cell">Período</div>
        ${days.map((d, i) => `<div class="tt-cell">${d}<br><small style="font-weight:400;opacity:.7">${formatDateShort(weekDates[i])}</small></div>`).join('')}
      </div>`;

    periods.forEach(period => {
      html += `<div class="timetable-row">
        <div class="tt-cell">${period.replace('-', ' — ')}</div>`;
      weekDates.forEach(date => {
        const slot = agendTipo.find(a => a.data === date && a.horario && a.horario.replace(' ', '').replace(' ', '') === period.replace('-', '-'));
        if (slot) {
          const isMine = slot.userId === state.user?.id;
          const cls = isMine ? 'tt-mine' : 'tt-busy';
          const label = isMine ? `Você<br>${slot.turma || slot.disciplina || ''}` : `${slot.turma || slot.disciplina || slot.userName}`;
          html += `<div class="tt-cell"><span class="${cls}" style="padding:4px 6px;width:100%">${label}</span></div>`;
        } else {
          html += `<div class="tt-cell"><span class="tt-free">Livre</span></div>`;
        }
      });
      html += `</div>`;
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
      const date   = document.getElementById('bib-date').value;
      const tStart = document.getElementById('bib-time-start').value;
      const tEnd   = document.getElementById('bib-time-end').value;
      const tipo   = document.getElementById('bib-tipo').value;
      const turma  = document.getElementById('bib-turma').value.trim();
      const final  = document.getElementById('bib-finalidade').value.trim();

      if (!date || !turma) { toast('Preencha todos os campos obrigatórios.', 'warning'); return; }

      const novo = {
        id: DB.nextId(), tipo: 'biblioteca',
        userId: state.user.id, userName: state.user.name,
        data: date, horario: `${tStart} - ${tEnd}`,
        turma, tipo_reserva: tipo, finalidade: final,
        status: state.user.role === 'admin' ? 'confirmado' : 'pendente',
        criadoEm: new Date().toISOString()
      };
      DB.agendamentos.push(novo);

      addNotification('Reserva Enviada', `Biblioteca — ${turma}`, 'fa-book-open', '#F59E0B');
      addActivity(`Reserva da Biblioteca por ${state.user.name}`, 'fa-book-open', '#F59E0B');

      toast('Reserva da biblioteca enviada!', 'success');
      form.reset();
      renderTimetable('biblioteca');
      setTodayInputs();
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
    const year = d.getFullYear();
    const month = d.getMonth();
    const today = new Date().toISOString().split('T')[0];

    document.getElementById('cal-title').textContent =
      d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev  = new Date(year, month, 0).getDate();

    // Mapear agendamentos por data
    const agendByDate = {};
    DB.agendamentos.forEach(a => {
      if (!agendByDate[a.data]) agendByDate[a.data] = [];
      agendByDate[a.data].push(a);
    });

    const dayNames = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    let html = dayNames.map(n => `<div class="cal-day-name">${n}</div>`).join('');

    // Dias anteriores
    const startOffset = firstDay;
    for (let i = startOffset - 1; i >= 0; i--) {
      html += `<div class="cal-day other-month"><span class="cal-num">${daysInPrev - i}</span></div>`;
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const events  = agendByDate[dateStr] || [];
      const isToday    = dateStr === today;
      const isSelected = dateStr === state.calendarSelectedDay;

      const dots = [...new Set(events.map(e => e.tipo))].slice(0,3).map(tipo => {
        const dotColors = { notebook: '#3B82F6', informatica: '#10B981', biblioteca: '#F59E0B' };
        return `<span class="cal-dot" style="background:${dotColors[tipo]}"></span>`;
      }).join('');

      html += `
        <div class="cal-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}"
             onclick="App.selectCalDay('${dateStr}')">
          <span class="cal-num">${day}</span>
          <div class="cal-dots">${dots}</div>
        </div>`;
    }

    // Preencher restante
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
    let nextDay = 1;
    for (let i = startOffset + daysInMonth; i < totalCells; i++) {
      html += `<div class="cal-day other-month"><span class="cal-num">${nextDay++}</span></div>`;
    }

    document.getElementById('calendar-grid').innerHTML = html;
    selectCalDay(state.calendarSelectedDay);
  }

  function selectCalDay(dateStr) {
    state.calendarSelectedDay = dateStr;
    const events = DB.agendamentos.filter(a => a.data === dateStr);

    document.getElementById('cal-day-title').textContent =
      `Agendamentos — ${formatDate(dateStr)}`;

    const list = document.getElementById('cal-day-events');
    if (!events.length) {
      list.innerHTML = '<li class="empty-state"><i class="fa-regular fa-calendar-xmark"></i><p>Sem agendamentos neste dia</p></li>';
    } else {
      list.innerHTML = events.map(a => {
        const colors = { notebook: '#3B82F6', informatica: '#7C3AED', biblioteca: '#F59E0B' };
        const labels = { notebook: 'Notebook', informatica: 'Informática', biblioteca: 'Biblioteca' };
        return `
          <li class="schedule-item">
            <span class="schedule-dot" style="background:${colors[a.tipo]}"></span>
            <div class="schedule-info">
              <strong>${labels[a.tipo]} — ${a.turma || a.disciplina || a.userName}</strong>
              <span>${a.horario} · ${a.userName}</span>
            </div>
            <span class="status-badge status-${a.status}">${capitalize(a.status)}</span>
          </li>`;
      }).join('');
    }

    // Re-render para marcar selecionado
    renderCalendar();
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
          data-name="${f.name}"
          onclick="App.openChat(${f.id})">
        ${f.online ? `<span class="online-dot"></span>` : ''}
        <div class="contact-avatar" style="background:${f.avatar}">${f.name.charAt(0)}</div>
        <div class="contact-info">
          <span class="contact-name">${f.name}</span>
          <span class="contact-last-msg">${f.role}</span>
        </div>
        <div class="contact-meta">
          ${f.unread ? `<span class="contact-unread">${f.unread}</span>` : ''}
        </div>
      </li>
    `).join('');
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

    // Atualizar badge do chat
    const totalUnread = DB.funcionarios.reduce((acc, f) => acc + (f.unread || 0), 0);
    const badge = document.getElementById('badge-chat');
    if (totalUnread) { badge.textContent = totalUnread; badge.classList.remove('hidden'); }
    else { badge.classList.add('hidden'); }
  }

  function renderMessages(contactId) {
    const msgs = DB.mensagens[contactId] || [];
    const container = document.getElementById('chat-messages');

    if (!msgs.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:40px 0;color:var(--text-muted)">
          <i class="fa-solid fa-comment-dots" style="font-size:32px;opacity:.25;display:block;margin-bottom:12px"></i>
          <p style="font-size:13px">Inicie a conversa!</p>
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="msg-date-divider"><span>Hoje</span></div>
      ${msgs.map(m => {
        const isMine = m.fromMe;
        const avatar = isMine
          ? state.user.name.charAt(0)
          : state.chatContact.name.charAt(0);
        const bg = isMine ? state.user.avatar : state.chatContact.avatar;
        return `
          <div class="msg ${isMine ? 'sent' : ''}">
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
    const msg  = { id: Date.now(), from: 'me', text, time, fromMe: true };

    if (!DB.mensagens[state.chatContact.id]) DB.mensagens[state.chatContact.id] = [];
    DB.mensagens[state.chatContact.id].push(msg);

    input.value = '';
    renderMessages(state.chatContact.id);

    // Auto-resposta simulada
    if (state.chatContact.online) {
      setTimeout(() => {
        const responses = [
          'Certo! Posso ajudá-lo(a) com isso.',
          'Entendido! Vou verificar e retorno em breve.',
          'Obrigado pelo contato! Sua solicitação foi anotada.',
          'Sim, pode confirmar o agendamento pelo sistema.',
          'Deixa comigo, verifico agora!',
        ];
        const auto = {
          id: Date.now() + 1,
          from: state.chatContact.id,
          text: responses[Math.floor(Math.random() * responses.length)],
          time: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()+1).padStart(2,'0')}`,
          fromMe: false
        };
        DB.mensagens[state.chatContact.id].push(auto);
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
          c.classList.remove('active');
          c.classList.add('hidden');
        });
        tab.classList.add('active');
        const content = document.getElementById(`admin-tab-${tab.dataset.tab}`);
        if (content) { content.classList.remove('hidden'); content.classList.add('active'); }
        state.adminTab = tab.dataset.tab;
        if (tab.dataset.tab === 'agendamentos') renderAdminTable();
        if (tab.dataset.tab === 'usuarios')     renderUsers();
      });
    });

    document.getElementById('admin-filter-type').addEventListener('change', renderAdminTable);
    document.getElementById('admin-filter-status').addEventListener('change', renderAdminTable);

    // Toggles de recursos
    document.getElementById('toggle-informatica').addEventListener('change', function() {
      document.getElementById('label-informatica').textContent = this.checked ? 'Sala Ativa' : 'Sala Inativa';
      toast(this.checked ? 'Sala de Informática ativada' : 'Sala de Informática desativada',
            this.checked ? 'success' : 'warning');
    });
    document.getElementById('toggle-biblioteca').addEventListener('change', function() {
      document.getElementById('label-biblioteca').textContent = this.checked ? 'Biblioteca Ativa' : 'Biblioteca Inativa';
      toast(this.checked ? 'Biblioteca ativada' : 'Biblioteca desativada',
            this.checked ? 'success' : 'warning');
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
    const tbody  = document.getElementById('admin-tbody');
    const fType  = document.getElementById('admin-filter-type').value;
    const fStat  = document.getElementById('admin-filter-status').value;

    let data = [...DB.agendamentos];
    if (fType !== 'all') data = data.filter(a => a.tipo === fType);
    if (fStat !== 'all') data = data.filter(a => a.status === fStat);

    const labels = { notebook: 'Notebook', informatica: 'Informática', biblioteca: 'Biblioteca' };
    const icons  = { notebook: 'fa-laptop', informatica: 'fa-desktop', biblioteca: 'fa-book-open' };
    const colors = { notebook: '#3B82F6', informatica: '#7C3AED', biblioteca: '#F59E0B' };

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state" style="padding:24px;text-align:center;color:var(--text-muted)">Nenhum agendamento encontrado</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(a => `
      <tr>
        <td>
          <span style="display:flex;align-items:center;gap:6px">
            <i class="fa-solid ${icons[a.tipo]}" style="color:${colors[a.tipo]}"></i>
            ${labels[a.tipo]}
          </span>
        </td>
        <td>${formatDate(a.data)}</td>
        <td>${a.horario}</td>
        <td>${a.userName}</td>
        <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis">${a.turma || a.disciplina || '—'}</td>
        <td><span class="status-badge status-${a.status}">${capitalize(a.status)}</span></td>
        <td>
          <div class="action-btns">
            ${a.status === 'pendente' ? `
              <button class="action-btn action-btn-confirm" title="Confirmar" onclick="App.confirmarAgend(${a.id})">
                <i class="fa-solid fa-check"></i>
              </button>` : ''}
            ${a.status !== 'cancelado' ? `
              <button class="action-btn action-btn-cancel" title="Cancelar" onclick="App.cancelarAgend(${a.id})">
                <i class="fa-solid fa-xmark"></i>
              </button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');
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
      </div>
    `).join('');
  }

  function renderActivityList() {
    const list = document.getElementById('activity-list');
    if (!state._activities || !state._activities.length) {
      // Gerar atividades a partir dos agendamentos existentes
      const acts = DB.agendamentos.slice(-5).reverse().map(a => ({
        text: `Agendamento de ${a.tipo} por ${a.userName}`,
        icon: a.tipo === 'notebook' ? 'fa-laptop' : a.tipo === 'informatica' ? 'fa-desktop' : 'fa-book-open',
        color: a.tipo === 'notebook' ? '#3B82F6' : a.tipo === 'informatica' ? '#7C3AED' : '#F59E0B',
        time: 'Recente'
      }));
      state._activities = acts;
    }

    list.innerHTML = state._activities.map(a => `
      <li class="activity-item">
        <div class="activity-icon" style="background:${a.color}22;color:${a.color}">
          <i class="fa-solid ${a.icon}"></i>
        </div>
        <div class="activity-text">
          <strong>${a.text}</strong>
          <span>${a.time}</span>
        </div>
      </li>
    `).join('');
  }

  function updateResourceStats() {
    const available = state.notebooksTotal - state.notebooksInUse;
    const pct = Math.round((available / state.notebooksTotal) * 100);
    const el = document.getElementById('res-nb-avail');
    const bar = document.getElementById('res-nb-bar');
    if (el) el.textContent = available;
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
     AÇÕES GLOBAIS DE AGENDAMENTO
     ================================================================ */
  function confirmarAgend(id) {
    const agend = DB.agendamentos.find(a => a.id === id);
    if (!agend) return;

    openModal(
      'Confirmar Agendamento',
      `<p>Deseja confirmar o agendamento de <strong>${agend.tipo}</strong> para <strong>${agend.userName}</strong>?</p>
       <p style="margin-top:8px;color:var(--text-muted);font-size:13px">${formatDate(agend.data)} · ${agend.horario}</p>`,
      'Confirmar',
      () => {
        agend.status = 'confirmado';
        toast('Agendamento confirmado!', 'success');
        addActivity(`Agendamento confirmado: ${agend.tipo} — ${agend.userName}`, 'fa-check', '#10B981');
        refresh();
      },
      'btn-success'
    );
  }

  function cancelarAgend(id) {
    const agend = DB.agendamentos.find(a => a.id === id);
    if (!agend) return;

    openModal(
      'Cancelar Agendamento',
      `<p>Deseja cancelar este agendamento?</p>
       <p style="margin-top:8px;color:var(--text-muted);font-size:13px"><strong>${agend.tipo}</strong> · ${formatDate(agend.data)} · ${agend.horario}</p>`,
      'Cancelar Agendamento',
      () => {
        if (agend.tipo === 'notebook' && agend.status !== 'cancelado') {
          state.notebooksInUse = Math.max(0, state.notebooksInUse - agend.quantidade);
          updateNotebookStats();
        }
        agend.status = 'cancelado';
        toast('Agendamento cancelado.', 'warning');
        addActivity(`Agendamento cancelado: ${agend.tipo} — ${agend.userName}`, 'fa-xmark', '#EF4444');
        refresh();
      },
      'btn-danger'
    );
  }

  function verDetalhes(id) {
    const a = DB.agendamentos.find(ag => ag.id === id);
    if (!a) return;

    const labels = { notebook: 'Carrinho de Notebooks', informatica: 'Sala de Informática', biblioteca: 'Biblioteca' };
    const rows = [
      ['Tipo',        labels[a.tipo]],
      ['Data',        formatDate(a.data)],
      ['Horário',     a.horario],
      ['Solicitante', a.userName],
      ['Status',      capitalize(a.status)],
      a.quantidade   ? ['Quantidade', `${a.quantidade} notebooks`] : null,
      a.turma        ? ['Turma/Nome', a.turma] : null,
      a.disciplina   ? ['Disciplina', a.disciplina] : null,
      a.finalidade   ? ['Finalidade', a.finalidade] : null,
      a.objetivo     ? ['Objetivo',   a.objetivo] : null,
      a.obs          ? ['Observação', a.obs] : null,
    ].filter(Boolean);

    const body = `<table style="width:100%;font-size:13px;border-collapse:collapse">
      ${rows.map(([k, v]) => `
        <tr>
          <td style="padding:8px 0;color:var(--text-muted);width:40%;font-weight:500">${k}</td>
          <td style="padding:8px 0;color:var(--gray-800)">${v}</td>
        </tr>`).join('')}
    </table>`;

    openModal('Detalhes do Agendamento', body, 'Fechar', closeModal);
    document.getElementById('modal-cancel').classList.add('hidden');
  }

  function refresh() {
    if (state.currentPage === 'notebooks')   renderNotebooksTable();
    if (state.currentPage === 'admin')       renderAdmin();
    if (state.currentPage === 'calendario')  renderCalendar();
    if (state.currentPage === 'dashboard')   renderDashboard();
    if (state.currentPage === 'informatica') renderTimetable('informatica');
    if (state.currentPage === 'biblioteca')  renderTimetable('biblioteca');
    renderAdminTable();
  }

  /* ================================================================
     NOTIFICAÇÕES / ATIVIDADES
     ================================================================ */
  function setupNotifications() {}

  function addNotification(title, text, icon, color) {
    DB.notificacoes.unshift({ id: Date.now(), title, text, icon, color, time: 'Agora' });
    renderNotifications();
    document.querySelector('.notif-dot').style.display = '';
  }

  function addActivity(text, icon, color) {
    if (!state._activities) state._activities = [];
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
      if (el) el.min = today;
      if (el && !el.value) el.value = today;
    });
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
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
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
  };

})();

/* Iniciar aplicação quando DOM estiver pronto */
document.addEventListener('DOMContentLoaded', () => App.init());
