/* ============================================================
   DATA.JS — EduAgenda
   Dados simulados: usuários, agendamentos, funcionários, chat
   ============================================================ */

/* Helpers de data */
function DB_todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const DB = {

  /* ---- Usuários ---- */
  users: [
    { id: 1, name: 'Ana Lima',        email: 'aluno@escola.edu.br',   password: 'aluno123', role: 'aluno',     turma: '3º Ano A', avatar: '#3B82F6' },
    { id: 2, name: 'Prof. Carlos',    email: 'prof@escola.edu.br',    password: 'prof123',  role: 'professor', turma: null,       avatar: '#10B981' },
    { id: 3, name: 'Admin Silva',     email: 'admin@escola.edu.br',   password: 'admin123', role: 'admin',     turma: null,       avatar: '#7C3AED' },
    { id: 4, name: 'Maria Costa',     email: 'maria@escola.edu.br',   password: 'aluno123', role: 'aluno',     turma: '2º Ano B', avatar: '#F59E0B' },
    { id: 5, name: 'Prof. Fernanda',  email: 'fernanda@escola.edu.br', password: 'prof123', role: 'professor', turma: null,       avatar: '#EF4444' },
  ],

  /* ---- Funcionários (para o chat) ---- */
  funcionarios: [
    { id: 10, name: 'Secretaria',         role: 'Secretaria',              avatar: '#6366F1', department: 'Administração', online: true,  unread: 2 },
    { id: 11, name: 'Diretora Ângela',    role: 'Direção',                 avatar: '#7C3AED', department: 'Direção',        online: true,  unread: 0 },
    { id: 12, name: 'Coord. Pedagógico',  role: 'Coordenação',             avatar: '#10B981', department: 'Coordenação',    online: false, unread: 0 },
    { id: 13, name: 'Biblioteca',         role: 'Bibliotecário',           avatar: '#F59E0B', department: 'Biblioteca',     online: true,  unread: 0 },
    { id: 14, name: 'TI / Informática',   role: 'Suporte de TI',           avatar: '#3B82F6', department: 'Tecnologia',     online: true,  unread: 0 },
    { id: 15, name: 'Orientação Educ.',   role: 'Orientador Educacional',  avatar: '#EF4444', department: 'Orientação',     online: false, unread: 0 },
  ],

  /* ---- Agendamentos (inicializados abaixo, após definição) ---- */
  agendamentos: [],

  /* ---- Mensagens de chat ---- */
  mensagens: {
    10: [
      { id: 1, from: 10,   text: 'Olá! Posso ajudá-lo(a) com algo?',                                          time: '08:30', fromMe: false },
      { id: 2, from: 'me', text: 'Oi! Preciso saber sobre agendamento de sala.',                               time: '08:31', fromMe: true  },
      { id: 3, from: 10,   text: 'Claro! Use o sistema aqui mesmo para fazer a reserva. Alguma dúvida?',       time: '08:32', fromMe: false },
      { id: 4, from: 'me', text: 'Entendi, muito obrigado!',                                                   time: '08:33', fromMe: true  },
      { id: 5, from: 10,   text: 'Disponha! Qualquer dúvida é só chamar. 😊',                                  time: '08:33', fromMe: false },
    ],
    11: [
      { id: 1, from: 11, text: 'Bom dia! A direção atende das 8h às 17h.', time: '07:00', fromMe: false },
    ],
    12: [],
    13: [
      { id: 1, from: 13,   text: 'Biblioteca aberta! Funcionamento: 07:00 - 18:00.',          time: '07:00', fromMe: false },
      { id: 2, from: 'me', text: 'Posso reservar um espaço para estudo em grupo?',            time: '10:00', fromMe: true  },
      { id: 3, from: 13,   text: 'Sim! Use o módulo Biblioteca no sistema para reservar.',    time: '10:05', fromMe: false },
    ],
    14: [],
    15: [],
  },

  /* ---- Notificações ---- */
  notificacoes: [
    { id: 1, title: 'Reserva Confirmada',   text: 'Notebooks — 3º Ano A — 08:00',          icon: 'fa-laptop',    color: '#3B82F6', time: 'Agora há pouco' },
    { id: 2, title: 'Nova Mensagem',        text: 'Secretaria enviou uma mensagem',        icon: 'fa-comment',   color: '#6366F1', time: '5 min atrás'    },
    { id: 3, title: 'Biblioteca Reservada', text: 'Sua reserva para 09:00 foi confirmada', icon: 'fa-book-open', color: '#F59E0B', time: '1h atrás'       },
  ],

  /* ---- Incidentes ---- */
  incidentes: [
    {
      id: 20, local: 'notebook', tipo: 'notebook_danificado', quantidade: 2,
      descricao: 'Dois notebooks com tela quebrada encontrados após uso do 3º Ano A.',
      userName: 'Prof. Carlos', data: DB_todayPlus(-2), aulaLabel: 'Manhã — 3ª Aula (08:40 – 09:30)',
      status: 'aberto', reportadoEm: new Date().toISOString()
    },
    {
      id: 21, local: 'informatica', tipo: 'teclado_mouse', quantidade: 3,
      descricao: 'Três mouses sem funcionar na fileira do fundo.',
      userName: 'Prof. Fernanda', data: DB_todayPlus(-1), aulaLabel: 'Tarde — 2ª Aula (13:50 – 14:40)',
      status: 'em_andamento', reportadoEm: new Date().toISOString()
    },
    {
      id: 22, local: 'biblioteca', tipo: 'livro_danificado', quantidade: 1,
      descricao: 'Livro "Dom Casmurro" devolvido com páginas rasgadas.',
      userName: 'Ana Lima', data: DB_todayPlus(0), aulaLabel: 'Manhã — 5ª Aula (10:40 – 11:30)',
      status: 'aberto', reportadoEm: new Date().toISOString()
    },
  ],

  /* Próximo ID */
  _nextId: 25,
  nextId() { return ++this._nextId; },
};

/* ---- Agendamentos iniciais (datas dinâmicas, formato por aulas) ---- */
DB.agendamentos = [
  {
    id: 1, tipo: 'notebook', userId: 1, userName: 'Ana Lima',
    data: DB_todayPlus(0),
    periodo: 'manha', aulaNum: 3, aulaLabel: 'Manhã — 3ª Aula (08:40 – 09:30)',
    horario: 'Manhã — 3ª Aula (08:40 – 09:30)',
    quantidade: 15, turma: '3º Ano A — Matemática', obs: 'Atividade avaliativa',
    incidente: null, status: 'confirmado', criadoEm: new Date().toISOString()
  },
  {
    id: 2, tipo: 'notebook', userId: 2, userName: 'Prof. Carlos',
    data: DB_todayPlus(1),
    periodo: 'manha', aulaNum: 5, aulaLabel: 'Manhã — 5ª Aula (10:40 – 11:30)',
    horario: 'Manhã — 5ª Aula (10:40 – 11:30)',
    quantidade: 20, turma: '2º Ano B — Português', obs: '',
    incidente: null, status: 'pendente', criadoEm: new Date().toISOString()
  },
  {
    id: 3, tipo: 'informatica', userId: 2, userName: 'Prof. Carlos',
    data: DB_todayPlus(0),
    periodo: 'tarde', aulaNum: 2, aulaLabel: 'Tarde — 2ª Aula (13:50 – 14:40)',
    horario: 'Tarde — 2ª Aula (13:50 – 14:40)',
    turma: '1º Ano C', disciplina: 'Programação Web',
    objetivo: 'Introdução ao HTML', incidente: null,
    status: 'confirmado', criadoEm: new Date().toISOString()
  },
  {
    id: 4, tipo: 'informatica', userId: 5, userName: 'Prof. Fernanda',
    data: DB_todayPlus(0),
    periodo: 'tarde', aulaNum: 3, aulaLabel: 'Tarde — 3ª Aula (14:40 – 15:30)',
    horario: 'Tarde — 3ª Aula (14:40 – 15:30)',
    turma: '2º Ano A', disciplina: 'Design Gráfico',
    objetivo: 'Photoshop básico', incidente: null,
    status: 'pendente', criadoEm: new Date().toISOString()
  },
  {
    id: 5, tipo: 'biblioteca', userId: 1, userName: 'Ana Lima',
    data: DB_todayPlus(0),
    periodo: 'manha', aulaNum: 4, aulaLabel: 'Manhã — 4ª Aula (09:50 – 10:40)',
    horario: 'Manhã — 4ª Aula (09:50 – 10:40)',
    turma: 'Ana Lima', tipo_reserva: 'individual',
    finalidade: 'Pesquisa para trabalho', incidente: null,
    status: 'confirmado', criadoEm: new Date().toISOString()
  },
  {
    id: 6, tipo: 'biblioteca', userId: 4, userName: 'Maria Costa',
    data: DB_todayPlus(1),
    periodo: 'manha', aulaNum: 6, aulaLabel: 'Manhã — 6ª Aula (11:30 – 12:20)',
    horario: 'Manhã — 6ª Aula (11:30 – 12:20)',
    turma: '2º Ano B', tipo_reserva: 'grupo',
    finalidade: 'Trabalho em grupo — História', incidente: null,
    status: 'pendente', criadoEm: new Date().toISOString()
  },
  {
    id: 7, tipo: 'notebook', userId: 5, userName: 'Prof. Fernanda',
    data: DB_todayPlus(-1),
    periodo: 'manha', aulaNum: 1, aulaLabel: 'Manhã — 1ª Aula (07:00 – 07:50)',
    horario: 'Manhã — 1ª Aula (07:00 – 07:50)',
    quantidade: 10, turma: '1º Ano A — Arte', obs: 'Uso de editores de imagem',
    incidente: null, status: 'confirmado', criadoEm: new Date().toISOString()
  },
  {
    id: 8, tipo: 'biblioteca', userId: 2, userName: 'Prof. Carlos',
    data: DB_todayPlus(2),
    periodo: 'tarde', aulaNum: 1, aulaLabel: 'Tarde — 1ª Aula (13:00 – 13:50)',
    horario: 'Tarde — 1ª Aula (13:00 – 13:50)',
    turma: '3º Ano B', tipo_reserva: 'aula',
    finalidade: 'Aula de Literatura', incidente: null,
    status: 'confirmado', criadoEm: new Date().toISOString()
  },
];
