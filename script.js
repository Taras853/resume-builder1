const steps = document.querySelectorAll('.step');
const progressFill = document.getElementById('progressFill');
let currentStep = 0;

function updateProgress(stepIndex) {
  steps.forEach((step, index) => {
    step.classList.remove('active', 'completed');
    if (index < stepIndex) step.classList.add('completed');
    if (index === stepIndex) step.classList.add('active');
  });

  const progressPercentage = (stepIndex) / (steps.length - 1) * 100;
  progressFill.style.width = `${progressPercentage}%`;

  document.querySelectorAll('.container').forEach((container, index) => {
    container.style.display = (index === stepIndex) ? 'block' : 'none';
  });
}

steps.forEach((step, index) => {
  step.addEventListener('click', () => {
    currentStep = index;
    updateProgress(currentStep);
  });
});

document.getElementById('nextStepExperience').addEventListener('click', () => {
  if (currentStep < steps.length - 1) {
    currentStep++;
    updateProgress(currentStep);
  }
});

document.getElementById('resumeForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if (currentStep < steps.length - 1) {
    currentStep++;
    updateProgress(currentStep);
  }
});

// --- Перевірка всіх обов'язкових полів ---
function validateAllFields() {
  let valid = true;
  // Очистити попередні помилки
  document.querySelectorAll('.error-message').forEach(e => e.remove());
  document.querySelectorAll('.error').forEach(e => e.classList.remove('error'));

  // Знайти всі обов'язкові поля у формі
  const requiredFields = document.querySelectorAll('#resumeForm input[required], #resumeForm textarea[required], #resumeForm select[required]');
  let firstInvalidField = null;
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      valid = false;
      field.classList.add('error');
      // Додаємо підказку, якщо її ще немає
      if (!field.nextElementSibling || !field.nextElementSibling.classList.contains('error-message')) {
        const msg = document.createElement('div');
        msg.className = 'error-message';
        msg.textContent = 'Це поле обов’язкове!';
        field.after(msg);
      }
      // Запам'ятати перше невалідне поле
      if (!firstInvalidField) firstInvalidField = field;
    }
  });

  // Якщо є невалідне поле — перейти на відповідний крок і прокрутити до нього
  if (!valid && firstInvalidField) {
    const container = firstInvalidField.closest('.container');
    if (container) {
      const containers = Array.from(document.querySelectorAll('.container'));
      const stepIndex = containers.indexOf(container);
      if (stepIndex !== -1) {
        currentStep = stepIndex;
        updateProgress(currentStep);
        setTimeout(() => {
          firstInvalidField.scrollIntoView({behavior: 'smooth', block: 'center'});
        }, 200);
      }
    }
  }

  return valid;
}

// --- КРОК 3: Перевірка вибору шаблону ---
function validateTemplateSelected() {
  const templateBlock = document.getElementById('templateBlock');
  // Видалити попередні помилки
  templateBlock.classList.remove('error');
  const oldMsg = templateBlock.querySelector('.error-message');
  if (oldMsg) oldMsg.remove();

  if (!window.selectedTemplate) {
    templateBlock.classList.add('error');
    // Додаємо підказку, якщо її ще немає
    if (!templateBlock.querySelector('.error-message')) {
      const msg = document.createElement('div');
      msg.className = 'error-message';
      msg.textContent = 'Оберіть шаблон для резюме!';
      templateBlock.appendChild(msg);
    }
    // Прокрутити до блоку шаблонів
    templateBlock.scrollIntoView({behavior: 'smooth', block: 'center'});
    return false;
  }
  return true;
}

// --- КРОК 4: Генерація PDF ---
function generatePDF() {
  const data = getFormData();
  let html = '';
  if (window.selectedTemplate === 'template1') html = template1HTML(data, true);
  if (window.selectedTemplate === 'template2') html = template2HTML(data, true);
  if (window.selectedTemplate === 'template3') html = template3HTML(data, true);

  // Створюємо тимчасовий контейнер для PDF
  const pdfContainer = document.createElement('div');
  pdfContainer.className = 'pdf-container';
  pdfContainer.innerHTML = html;
  // A4: 210mm x 297mm = 793.7 x 1122.5 px при 96dpi
  pdfContainer.style.width = '793px';
  pdfContainer.style.minHeight = '1122px';
  pdfContainer.style.background = '#fff';
  pdfContainer.style.padding = '0';
  pdfContainer.style.margin = '0 auto';
  pdfContainer.style.boxSizing = 'border-box';
  pdfContainer.style.overflow = 'hidden';
  pdfContainer.style.position = 'relative';
  pdfContainer.style.fontSize = '15px';

  document.body.appendChild(pdfContainer);

  html2pdf().from(pdfContainer).set({
    margin: 0,
    filename: 'resume.pdf',
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait', unit: 'px', format: [793, 1122] }
  }).save().then(() => {
    pdfContainer.remove();
  });
}

// --- Обробник кнопки "Згенерувати резюме" ---
document.getElementById('generateResume').addEventListener('click', function() {
  const fieldsOk = validateAllFields();
  const templateOk = validateTemplateSelected();
  if (fieldsOk && templateOk) {
    generatePDF();
  }
});

// --- КРОК 5: UX — очищення підказок при введенні та виборі шаблону ---
document.addEventListener('input', function(e) {
  if (e.target.classList.contains('error')) {
    e.target.classList.remove('error');
    if (e.target.nextElementSibling && e.target.nextElementSibling.classList.contains('error-message')) {
      e.target.nextElementSibling.remove();
    }
  }
  // Для блоку шаблонів
  if (e.target.closest('#templateBlock')) {
    const templateBlock = document.getElementById('templateBlock');
    templateBlock.classList.remove('error');
    const msg = templateBlock.querySelector('.error-message');
    if (msg) msg.remove();
  }
});
document.querySelectorAll('.template-option').forEach(option => {
  option.addEventListener('click', function() {
    const templateBlock = document.getElementById('templateBlock');
    templateBlock.classList.remove('error');
    const msg = templateBlock.querySelector('.error-message');
    if (msg) msg.remove();
  });
});

// --- Template Preview Logic ---

function getFormData() {
  // Особисті дані
  const name = document.getElementById('name').value || '';
  const email = document.getElementById('email').value || '';
  const phone = document.getElementById('phone').value || '';
  const summary = document.getElementById('summary').value || '';
  const city = document.getElementById('city').value || '';
  // Навички
  const skills = document.getElementById('skills') ? document.getElementById('skills').value : '';
  // Досвід роботи (перший блок)
  const jobBlock = document.querySelectorAll('details')[0];
  const jobInputs = jobBlock.querySelectorAll('input, textarea, select');
  let job = {};
  let jobYears = {start: '', end: ''};
  let jobMonths = {start: '', end: ''};
  let selectCount = 0;
  jobInputs.forEach(input => {
    if (input.type === 'text' || input.tagName === 'TEXTAREA') {
      job[input.placeholder] = input.value;
    } else if (input.tagName === 'SELECT') {
      // 0 - місяць початку, 1 - рік початку, 2 - місяць кінця, 3 - рік кінця
      if (selectCount === 0) jobMonths.start = input.value;
      if (selectCount === 1) jobYears.start = input.value;
      if (selectCount === 2) jobMonths.end = input.value;
      if (selectCount === 3) jobYears.end = input.value;
      selectCount++;
      job[input.parentElement.previousElementSibling ? input.parentElement.previousElementSibling.textContent : ''] = input.value;
    }
  });
  // Освіта (другий блок)
  const eduBlock = document.querySelectorAll('details')[1];
  const eduInputs = eduBlock.querySelectorAll('input, textarea, select');
  let edu = {};
  let eduYears = {start: '', end: ''};
  let eduMonths = {start: '', end: ''};
  selectCount = 0;
  eduInputs.forEach(input => {
    if (input.type === 'text' || input.tagName === 'TEXTAREA') {
      edu[input.placeholder] = input.value;
    } else if (input.tagName === 'SELECT') {
      if (selectCount === 0) eduMonths.start = input.value;
      if (selectCount === 1) eduYears.start = input.value;
      if (selectCount === 2) eduMonths.end = input.value;
      if (selectCount === 3) eduYears.end = input.value;
      selectCount++;
      edu[input.parentElement.previousElementSibling ? input.parentElement.previousElementSibling.textContent : ''] = input.value;
    }
  });

  return {
    name, email, phone, summary, city, skills,
    job, edu,
    jobYears, eduYears,
    jobMonths, eduMonths
  };
}

// --- Template HTML Generators ---

function formatPeriod(monthStart, yearStart, monthEnd, yearEnd, label) {
  if (yearStart && yearEnd) {
    let start = (monthStart ? monthStart + ' ' : '') + yearStart;
    let end = (monthEnd ? monthEnd + ' ' : '') + yearEnd;
    return `${label}: ${start} — ${end}`;
  }
  return '';
}

function template1HTML(data, isPDF = false) {
  const width = isPDF ? '793px' : '480px';
  const minHeight = isPDF ? '1122px' : '700px';
  const padding = isPDF ? '32px 48px' : '24px';
  return `
    <div style="font-family:sans-serif;width:${width};min-height:${minHeight};padding:${padding};box-sizing:border-box;background:#f8f9fa;">
      <h1 style="color:#007bff;margin-bottom:16px;font-size:2em;opacity:1;">${data.name}</h1>
      <div style="font-size:17px;color:#333;margin-bottom:14px;">
        <strong>Місто:</strong> ${data.city}<br>
        <strong>Email:</strong> ${data.email}<br>
        <strong>Телефон:</strong> ${data.phone}
      </div>
      <div style="margin-bottom:14px;">
        <strong>Про себе:</strong>
        <div style="font-size:15px;color:#444;">${data.summary}</div>
      </div>
      <div style="margin-bottom:14px;">
        <strong>Досвід роботи:</strong>
        <div style="font-size:15px;color:#444;">
          <b>${data.job['Введіть посаду'] || ''}</b> у ${data.job['Назва компанії'] || ''} (${data.job['Місто'] || ''})<br>
          <i>${data.job['Опишіть обов’язки...'] || ''}</i><br>
          <span style="color:#888;">${formatPeriod(data.jobMonths.start, data.jobYears.start, data.jobMonths.end, data.jobYears.end, 'Період роботи')}</span>
        </div>
      </div>
      <div style="margin-bottom:14px;">
        <strong>Освіта:</strong>
        <div style="font-size:15px;color:#444;">
          <b>${data.edu['Бакалавр, Магістр...'] || ''}</b> у ${data.edu['Назва ВНЗ'] || ''} (${data.edu['Місто'] || ''})<br>
          <i>${data.edu['Опис освітньої програми...'] || ''}</i><br>
          <span style="color:#888;">${formatPeriod(data.eduMonths.start, data.eduYears.start, data.eduMonths.end, data.eduYears.end, 'Період навчання')}</span>
        </div>
      </div>
      <div>
        <strong>Навички:</strong>
        <div style="font-size:15px;color:#444;">${data.skills}</div>
      </div>
    </div>
  `;
}

function template2HTML(data, isPDF = false) {
  const width = isPDF ? '793px' : '480px';
  const minHeight = isPDF ? '1122px' : '700px';
  const padding = isPDF ? '32px 48px' : '24px';
  return `
    <div style="font-family:Georgia,serif;width:${width};min-height:${minHeight};padding:${padding};box-sizing:border-box;background:#fffbe7;">
      <h1 style="color:#b8860b;border-bottom:2px solid #b8860b;padding-bottom:8px;font-size:2em;opacity:1;">${data.name}</h1>
      <div style="font-size:15px;color:#222;margin-bottom:12px;">
        <span>📍 ${data.city}</span><br>
        <span>✉️ ${data.email}</span><br>
        <span>📞 ${data.phone}</span>
      </div>
      <div style="margin-bottom:12px;">
        <em style="font-size:14px;">${data.summary}</em>
      </div>
      <div style="margin-bottom:12px;">
        <strong>Досвід:</strong>
        <div>
          <span style="color:#b8860b;font-size:14px;">${data.job['Введіть посаду'] || ''}</span> — ${data.job['Назва компанії'] || ''}<br>
          <small style="font-size:13px;">${data.job['Опишіть обов’язки...'] || ''}</small><br>
          <span style="color:#888;">${formatPeriod(data.jobMonths.start, data.jobYears.start, data.jobMonths.end, data.jobYears.end, 'Період роботи')}</span>
        </div>
      </div>
      <div style="margin-bottom:12px;">
        <strong>Освіта:</strong>
        <div>
          <span style="color:#b8860b;font-size:14px;">${data.edu['Бакалавр, Магістр...'] || ''}</span> — ${data.edu['Назва ВНЗ'] || ''}<br>
          <small style="font-size:13px;">${data.edu['Опис освітньої програми...'] || ''}</small><br>
          <span style="color:#888;">${formatPeriod(data.eduMonths.start, data.eduYears.start, data.eduMonths.end, data.eduYears.end, 'Період навчання')}</span>
        </div>
      </div>
      <div>
        <strong>Навички:</strong>
        <ul style="margin:0;padding-left:18px;font-size:14px;">
          ${data.skills.split(',').map(s => `<li>${s.trim()}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
}

function template3HTML(data, isPDF = false) {
  const width = isPDF ? '793px' : '480px';
  const minHeight = isPDF ? '1122px' : '700px';
  const padding = isPDF ? '28px 40px' : '18px';
  return `
    <div style="font-family:'Courier New',monospace;width:${width};min-height:${minHeight};padding:${padding};box-sizing:border-box;background:#e3e3e3;">
      <div style="background:#222;color:#fff;padding:12px 0;text-align:center;font-size:1.5em;margin-bottom:12px;">
        ${data.name}
      </div>
      <div style="font-size:13px;color:#333;margin-bottom:10px;">
        <span>${data.city}</span> | <span>${data.email}</span> | <span>${data.phone}</span>
      </div>
      <div style="margin-bottom:10px;">
        <strong>Про себе:</strong>
        <div style="font-size:12px;">${data.summary}</div>
      </div>
      <div style="margin-bottom:10px;">
        <strong>Досвід роботи:</strong>
        <div>
          <b>${data.job['Введіть посаду'] || ''}</b> у ${data.job['Назва компанії'] || ''} (${data.job['Місто'] || ''})<br>
          <span>${data.job['Опишіть обов’язки...'] || ''}</span><br>
          <span style="color:#888;">${formatPeriod(data.jobMonths.start, data.jobYears.start, data.jobMonths.end, data.jobYears.end, 'Період роботи')}</span>
        </div>
      </div>
      <div style="margin-bottom:10px;">
        <strong>Освіта:</strong>
        <div>
          <b>${data.edu['Бакалавр, Магістр...'] || ''}</b> у ${data.edu['Назва ВНЗ'] || ''} (${data.edu['Місто'] || ''})<br>
          <span>${data.edu['Опис освітньої програми...'] || ''}</span><br>
          <span style="color:#888;">${formatPeriod(data.eduMonths.start, data.eduYears.start, data.eduMonths.end, data.eduYears.end, 'Період навчання')}</span>
        </div>
      </div>
      <div>
        <strong>Навички:</strong>
        <div style="font-size:12px;">${data.skills}</div>
      </div>
    </div>
  `;
}

// --- Modal Logic ---

document.addEventListener('DOMContentLoaded', function() {
  let selectedTemplate = null;
  const modal = document.getElementById('templateModal');
  const modalPreview = document.getElementById('modalPreview');
  const selectBtn = document.getElementById('selectTemplateBtn');
  const closeModal = document.getElementById('closeModal');

  // Show modal with live preview
  document.querySelectorAll('.template-option').forEach(option => {
    option.addEventListener('click', function() {
      const template = this.getAttribute('data-template');
      const data = getFormData();
      let html = '';
      if (template === 'template1') html = template1HTML(data);
      if (template === 'template2') html = template2HTML(data);
      if (template === 'template3') html = template3HTML(data);
      modalPreview.innerHTML = html;
      modal.style.display = 'flex';
      selectedTemplate = template;
    });
  });

  selectBtn.addEventListener('click', function() {
    // Mark the selected template visually
    document.querySelectorAll('.template-option').forEach(option => {
      option.classList.toggle('selected', option.getAttribute('data-template') === selectedTemplate);
    });
    modal.style.display = 'none';
    // Store selected template for later use if needed
    window.selectedTemplate = selectedTemplate;
  });

  closeModal.addEventListener('click', function() {
    modal.style.display = 'none';
  });

  // Close modal when clicking outside content
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.style.display = 'none';
  });
});