const API = '/api/tasks';

// Load tasks on page load
document.addEventListener('DOMContentLoaded', loadTasks);

// Add task form
document.getElementById('addTaskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const task = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        status: document.getElementById('status').value
    };
    
    await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
    });
    
    e.target.reset();
    loadTasks();
});

// Load all tasks
async function loadTasks() {
    const res = await fetch(API);
    const { data } = await res.json();
    
    const container = document.getElementById('tasksContainer');
    container.innerHTML = data.map(task => `
        <div class="task-card">
            <h3>${task.title}</h3>
            <p>${task.description || ''}</p>
            <span>Status: ${task.status}</span><br>
            <button onclick="deleteTask(${task.id})">Delete</button>
        </div>
    `).join('');
}

// Delete task
async function deleteTask(id) {
    if (!confirm('Delete this task?')) return;
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    loadTasks();
}