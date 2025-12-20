const API_ROOT = '/api/tasks';
const state = {
    filters: { status: '', priority: '', search: '' }
};

const els = {
    form: document.getElementById('addTaskForm'),
    title: document.getElementById('title'),
    description: document.getElementById('description'),
    status: document.getElementById('status'),
    priority: document.getElementById('priority'),
    tasksContainer: document.getElementById('tasksContainer'),
    filterStatus: document.getElementById('filterStatus'),
    filterPriority: document.getElementById('filterPriority'),
    searchBox: document.getElementById('searchBox'),
    stats: {
        total: document.getElementById('statTotal'),
        todo: document.getElementById('statTodo'),
        inProgress: document.getElementById('statInProgress'),
        done: document.getElementById('statDone')
    },
    refresh: document.getElementById('refreshBtn'),
    toast: document.getElementById('toast')
};

document.addEventListener('DOMContentLoaded', init);

function init() {
    els.form.addEventListener('submit', onSubmit);
    els.tasksContainer.addEventListener('click', onTaskAction);
    els.filterStatus.addEventListener('change', onFilterChange);
    els.filterPriority.addEventListener('change', onFilterChange);
    els.searchBox.addEventListener('input', onFilterChange);
    els.refresh.addEventListener('click', refresh);
    refresh();
}

async function refresh() {
    renderLoading();
    await Promise.all([loadTasks(), loadStats()]);
}

async function loadTasks() {
    try {
        const params = new URLSearchParams();
        if (state.filters.status) params.append('status', state.filters.status);
        if (state.filters.priority) params.append('priority', state.filters.priority);

        const url = params.toString() ? `${API_ROOT}?${params}` : API_ROOT;
        const res = await fetch(url);
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'โหลดข้อมูลงานไม่สำเร็จ');
        const { data } = body;

        const filtered = filterBySearch(data, state.filters.search);
        renderTasks(filtered);
    } catch (err) {
        console.error(err);
        els.tasksContainer.innerHTML = `<div class="empty-state">โหลดข้อมูลงานไม่สำเร็จ</div>`;
        showToast('โหลดข้อมูลงานไม่สำเร็จ', 'error');
    }
}

async function loadStats() {
    try {
        const res = await fetch(`${API_ROOT}/stats`);
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'โหลดสถิติล้มเหลว');
        const { data } = body;
        renderStats(data);
    } catch (err) {
        console.error(err);
        showToast('โหลดสถิติงานไม่สำเร็จ', 'error');
    }
}

async function onSubmit(e) {
    e.preventDefault();
    const payload = {
        title: els.title.value.trim(),
        description: els.description.value.trim(),
        status: els.status.value,
        priority: els.priority.value
    };

    if (!payload.title) {
        showToast('โปรดกรอกชื่อเรื่อง', 'error');
        return;
    }

    try {
        const res = await fetch(API_ROOT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'ไม่สามารถสร้างงานได้');

        els.form.reset();
        els.status.value = 'TODO';
        els.priority.value = 'MEDIUM';
        showToast('เพิ่มงานเรียบร้อย');
        refresh();
    } catch (err) {
        console.error(err);
        showToast(err.message || 'ไม่สามารถสร้างงานได้', 'error');
    }
}

function onFilterChange() {
    state.filters.status = els.filterStatus.value;
    state.filters.priority = els.filterPriority.value;
    state.filters.search = els.searchBox.value.trim().toLowerCase();
    loadTasks();
}

function filterBySearch(tasks, term) {
    if (!term) return tasks;
    return tasks.filter(t => {
        const text = `${t.title || ''} ${t.description || ''}`.toLowerCase();
        return text.includes(term);
    });
}

function renderLoading() {
    const skeleton = Array.from({ length: 3 }).map(() => `
        <div class="task-card">
            <div class="badge" style="opacity:0.4;width:90px;height:18px;"></div>
            <div style="height:18px;background:rgba(255,255,255,0.06);border-radius:8px;margin:8px 0;"></div>
            <div style="height:12px;background:rgba(255,255,255,0.04);border-radius:8px;"></div>
        </div>
    `).join('');
    els.tasksContainer.innerHTML = skeleton;
}

function renderTasks(tasks = []) {
    if (!tasks.length) {
        els.tasksContainer.innerHTML = `<div class="empty-state">ยังไม่มีงาน ลองเพิ่มงานใหม่หรือลองเปลี่ยนตัวกรอง</div>`;
        return;
    }

    els.tasksContainer.innerHTML = tasks.map(task => {
        const statusClass = {
            TODO: 'status-todo',
            IN_PROGRESS: 'status-inprogress',
            DONE: 'status-done'
        }[task.status] || 'status-todo';

        const nextStatus = { TODO: 'IN_PROGRESS', IN_PROGRESS: 'DONE', DONE: null }[task.status];
        const statusLabel = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' }[task.status] || task.status;
        const priorityClass = {
            LOW: 'priority-low',
            MEDIUM: 'priority-medium',
            HIGH: 'priority-high'
        }[task.priority] || 'priority-medium';
        const displayDate = task.updated_at || task.created_at;

        return `
            <div class="task-card">
                <div class="badges">
                    <span class="badge ${statusClass}">สถานะ: ${statusLabel}</span>
                    <span class="badge ${priorityClass}">Priority: ${task.priority || 'MEDIUM'}</span>
                </div>
                <h3>${escapeHtml(task.title)}</h3>
                <p>${escapeHtml(task.description || 'ไม่มีรายละเอียด')}</p>
                <div class="task-meta">
                    <span>#${task.id}</span>
                    <span>•</span>
                    <span>${displayDate ? new Date(displayDate).toLocaleString() : 'ยังไม่อัปเดต'}</span>
                </div>
                <div class="actions">
                    <button class="btn-secondary" data-action="next" data-id="${task.id}" ${!nextStatus ? 'disabled' : ''}>
                        ${nextStatus ? `เลื่อนไป ${prettyStatus(nextStatus)}` : 'เสร็จแล้ว'}
                    </button>
                    <button class="btn-danger" data-action="delete" data-id="${task.id}">ลบ</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderStats(stats) {
    if (!stats) return;
    els.stats.total.textContent = stats.total ?? '-';
    els.stats.todo.textContent = stats.byStatus?.TODO ?? 0;
    els.stats.inProgress.textContent = stats.byStatus?.IN_PROGRESS ?? 0;
    els.stats.done.textContent = stats.byStatus?.DONE ?? 0;
}

async function onTaskAction(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === 'delete') {
        const confirmDelete = confirm('ต้องการลบงานนี้หรือไม่?');
        if (!confirmDelete) return;
        try {
            const res = await fetch(`${API_ROOT}/${id}`, { method: 'DELETE' });
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || 'ลบงานไม่สำเร็จ');
            showToast('ลบงานแล้ว');
            refresh();
        } catch (err) {
            console.error(err);
            showToast(err.message || 'ลบงานไม่สำเร็จ', 'error');
        }
    }

    if (action === 'next') {
        try {
            const res = await fetch(`${API_ROOT}/${id}/next-status`, { method: 'PATCH' });
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || 'อัปเดตสถานะไม่สำเร็จ');
            showToast('อัปเดตสถานะแล้ว');
            refresh();
        } catch (err) {
            console.error(err);
            showToast(err.message || 'อัปเดตสถานะไม่สำเร็จ', 'error');
        }
    }
}

function showToast(message, type = 'success') {
    els.toast.textContent = message;
    els.toast.classList.remove('hidden', 'error');
    if (type === 'error') els.toast.classList.add('error');
    els.toast.classList.add('show');
    setTimeout(() => els.toast.classList.remove('show'), 2200);
    setTimeout(() => els.toast.classList.add('hidden'), 2500);
}

function escapeHtml(str = '') {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function prettyStatus(status) {
    return { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' }[status] || status;
}
