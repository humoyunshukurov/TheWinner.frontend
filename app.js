const API_URL = 'http://localhost:3000/api';

async function fetchJson(path) {
  const response = await fetch(`${API_URL}${path}`);
  return response.json();
}

function renderStats(stats) {
  const container = document.getElementById('stats-grid');
  container.innerHTML = stats
    .map(
      (item) => `
        <div class="stat-card">
          <h3>${item.label}</h3>
          <div class="value">${item.value}</div>
          <div class="trend">${item.trend}</div>
        </div>
      `
    )
    .join('');
}

function renderCourses(courses) {
  const container = document.getElementById('courses-list');
  container.innerHTML = courses
    .map(
      (course) => `
        <div class="item">
          <strong>${course.title}</strong>
          <div class="muted">${course.students} student · ${course.level} · ${course.status}</div>
        </div>
      `
    )
    .join('');
}

function renderStudents(students) {
  const container = document.getElementById('students-list');
  container.innerHTML = students
    .map(
      (student) => `
        <div class="item">
          <strong>${student.name}</strong>
          <div class="muted">${student.course} · ${student.status} · ${student.payment}</div>
        </div>
      `
    )
    .join('');
}

function renderAttendance(attendance) {
  const container = document.getElementById('attendance-list');
  container.innerHTML = attendance
    .map(
      (item) => `
        <div class="item">
          <strong>${item.date}</strong>
          <div class="muted">Present: ${item.present} · Absent: ${item.absent} · Rate: ${item.rate}%</div>
        </div>
      `
    )
    .join('');
}

function renderFinance(finance) {
  const container = document.getElementById('finance-list');
  container.innerHTML = `
    <div class="item">
      <strong>Income</strong>
      <div class="muted">${finance.income}</div>
    </div>
    <div class="item">
      <strong>Expenses</strong>
      <div class="muted">${finance.expenses}</div>
    </div>
    <div class="item">
      <strong>Balance</strong>
      <div class="muted">${finance.balance}</div>
    </div>
  `;
}

function renderAnnouncements(announcements) {
  const container = document.getElementById('announcements-list');
  container.innerHTML = announcements
    .map(
      (item) => `
        <div class="item">
          <strong>${item.title}</strong>
          <div class="muted">${item.detail}</div>
        </div>
      `
    )
    .join('');
}

async function initDashboard() {
  try {
    const dashboard = await fetchJson('/dashboard/summary');
    const courses = await fetchJson('/courses');
    const students = await fetchJson('/students');
    const attendance = await fetchJson('/attendance');
    const finance = await fetchJson('/finance');
    const announcements = await fetchJson('/announcements');

    document.getElementById('welcome-title').textContent = `Salom, ${dashboard.user}!`;
    renderStats(dashboard.stats);
    renderCourses(courses);
    renderStudents(students);
    renderAttendance(attendance);
    renderFinance(finance);
    renderAnnouncements(announcements);
  } catch (error) {
    document.getElementById('welcome-title').textContent = 'Backendga ulanishda xatolik';
    console.error(error);
  }
}

document.getElementById('login-btn').addEventListener('click', async () => {
  const loginPayload = {
    email: 'admin@najottalim.uz',
    password: '123456'
  };

  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginPayload)
  });

  const result = await response.json();
  alert(`Login status: ${result.token ? 'success' : 'failed'}`);
});

initDashboard();
