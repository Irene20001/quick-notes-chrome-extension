const NOTES_KEY = 'quick_notes_v1';

function formatTime(date) {
  const d = new Date(date);
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hour = d.getHours().toString().padStart(2, '0');
  const min = d.getMinutes().toString().padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day} ${hour}:${min}`;
}

function renderNotes(notes) {
  const list = document.getElementById('notesList');
  const emptyTip = document.getElementById('emptyTip');
  const countEl = document.getElementById('count');

  countEl.textContent = notes.length + ' 条';
  list.innerHTML = '';

  if (notes.length === 0) {
    list.innerHTML = '<div class="empty">暂无笔记，添加第一条吧 ✨</div>';
    return;
  }

  // 最新的在前面
  const sorted = [...notes].reverse();
  sorted.forEach((note, idx) => {
    const realIdx = notes.length - 1 - idx;
    const div = document.createElement('div');
    div.className = 'note-item';
    div.innerHTML = `
      <p>${escapeHtml(note.text)}</p>
      <div class="time">${formatTime(note.time)}</div>
      <button class="delete-btn" data-idx="${realIdx}" title="删除">✕</button>
    `;
    list.appendChild(div);
  });

  // 绑定删除按钮
  list.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      notes.splice(idx, 1);
      saveNotes(notes);
      renderNotes(notes);
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function saveNotes(notes) {
  chrome.storage.local.set({ [NOTES_KEY]: notes });
}

function loadNotes() {
  chrome.storage.local.get(NOTES_KEY, (data) => {
    const notes = data[NOTES_KEY] || [];
    renderNotes(notes);
  });
}

document.getElementById('addBtn').addEventListener('click', () => {
  const input = document.getElementById('noteInput');
  const text = input.value.trim();
  if (!text) return;

  chrome.storage.local.get(NOTES_KEY, (data) => {
    const notes = data[NOTES_KEY] || [];
    notes.push({ text, time: Date.now() });
    saveNotes(notes);
    input.value = '';
    renderNotes(notes);
  });
});

// Enter 键提交（Ctrl+Enter 换行）
document.getElementById('noteInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.ctrlKey) {
    e.preventDefault();
    document.getElementById('addBtn').click();
  }
});

loadNotes();
