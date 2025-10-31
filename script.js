class AdvancedTodo {
            constructor() {
                this.tasks = this.loadTasks();
                this.currentFilter = 'all';
                this.currentSort = 'newest';
                this.init();
            }

            init() {
                this.renderTasks();
                this.setupEventListeners();
                this.updateStats();
            }

            loadTasks() {
                const saved = localStorage.getItem('advanced-todo-tasks');
                return saved ? JSON.parse(saved) : [];
            }

            saveTasks() {
                localStorage.setItem('advanced-todo-tasks', JSON.stringify(this.tasks));
            }

            setupEventListeners() {
                // Add task
                document.getElementById('addBtn').addEventListener('click', () => this.addTask());
                document.getElementById('taskInput').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.addTask();
                });

                // Filters
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                        e.target.classList.add('active');
                        this.currentFilter = e.target.dataset.filter;
                        this.renderTasks();
                    });
                });

                // Sort
                document.getElementById('sortSelect').addEventListener('change', (e) => {
                    this.currentSort = e.target.value;
                    this.renderTasks();
                });
            }

            addTask() {
                const input = document.getElementById('taskInput');
                const category = document.getElementById('categorySelect').value;
                const priority = document.getElementById('prioritySelect').value;
                const title = input.value.trim();

                if (title === '') {
                    this.showNotification('Please enter a task title!', 'error');
                    return;
                }

                const newTask = {
                    id: Date.now(),
                    title: title,
                    category: category,
                    priority: priority,
                    completed: false,
                    createdAt: new Date().toISOString(),
                    completedAt: null
                };

                this.tasks.unshift(newTask);
                this.saveTasks();
                this.renderTasks();
                this.updateStats();
                
                input.value = '';
                this.showNotification('Task added successfully!', 'success');
            }

            toggleTask(id) {
                const task = this.tasks.find(t => t.id === id);
                if (task) {
                    task.completed = !task.completed;
                    task.completedAt = task.completed ? new Date().toISOString() : null;
                    this.saveTasks();
                    this.renderTasks();
                    this.updateStats();
                }
            }

            editTask(id) {
                const task = this.tasks.find(t => t.id === id);
                if (task) {
                    const newTitle = prompt('Edit task:', task.title);
                    if (newTitle && newTitle.trim() !== '') {
                        task.title = newTitle.trim();
                        this.saveTasks();
                        this.renderTasks();
                        this.showNotification('Task updated!', 'success');
                    }
                }
            }

            deleteTask(id) {
                if (confirm('Are you sure you want to delete this task?')) {
                    this.tasks = this.tasks.filter(t => t.id !== id);
                    this.saveTasks();
                    this.renderTasks();
                    this.updateStats();
                    this.showNotification('Task deleted!', 'success');
                }
            }

            getFilteredTasks() {
                let filtered = this.tasks;

                // Apply filter
                switch (this.currentFilter) {
                    case 'active':
                        filtered = filtered.filter(t => !t.completed);
                        break;
                    case 'completed':
                        filtered = filtered.filter(t => t.completed);
                        break;
                    case 'high':
                        filtered = filtered.filter(t => t.priority === 'high');
                        break;
                }

                // Apply sort
                switch (this.currentSort) {
                    case 'newest':
                        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                        break;
                    case 'oldest':
                        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                        break;
                    case 'priority':
                        const priorityOrder = { high: 3, medium: 2, low: 1 };
                        filtered.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
                        break;
                    case 'alphabetical':
                        filtered.sort((a, b) => a.title.localeCompare(b.title));
                        break;
                }

                return filtered;
            }

            renderTasks() {
                const tasksList = document.getElementById('tasksList');
                const filteredTasks = this.getFilteredTasks();

                // Update section title
                document.getElementById('sectionTitle').textContent = 
                    `${this.currentFilter === 'all' ? 'All' : this.currentFilter.charAt(0).toUpperCase() + this.currentFilter.slice(1)} Tasks (${filteredTasks.length})`;

                if (filteredTasks.length === 0) {
                    tasksList.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-icon">📝</div>
                            <h3>No tasks found</h3>
                            <p>${this.currentFilter === 'all' ? 'Add your first task to get started!' : 'No tasks match your current filter.'}</p>
                        </div>
                    `;
                    return;
                }

                tasksList.innerHTML = filteredTasks.map(task => `
                    <div class="task-item ${task.completed ? 'completed' : ''}">
                        <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                             onclick="todo.toggleTask(${task.id})">
                            ${task.completed ? '✓' : ''}
                        </div>
                        <div class="task-content">
                            <div class="task-title">${this.escapeHtml(task.title)}</div>
                            <div class="task-meta">
                                <span class="task-category category-${task.category}">
                                    ${task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                                </span>
                                <span class="task-priority priority-${task.priority}">
                                    ${task.priority} priority
                                </span>
                                <span class="task-date">
                                    ${this.formatDate(task.createdAt)}
                                </span>
                            </div>
                        </div>
                        <div class="task-actions">
                            <button class="action-btn edit-btn" onclick="todo.editTask(${task.id})">
                                Edit
                            </button>
                            <button class="action-btn delete-btn" onclick="todo.deleteTask(${task.id})">
                                Delete
                            </button>
                        </div>
                    </div>
                `).join('');
            }

            updateStats() {
                const total = this.tasks.length;
                const completed = this.tasks.filter(t => t.completed).length;
                const active = total - completed;
                const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

                document.getElementById('totalTasks').textContent = total;
                document.getElementById('activeTasks').textContent = active;
                document.getElementById('completedTasks').textContent = completed;
                document.getElementById('completionRate').textContent = completionRate + '%';
            }

            formatDate(dateString) {
                const date = new Date(dateString);
                return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }

            escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }

            showNotification(message, type) {
                // Simple notification - in real app you might want a proper notification system
                console.log(`${type}: ${message}`);
            }
        }

        // Initialize the todo app
        const todo = new AdvancedTodo();

        // Make todo global for onclick handlers
        window.todo = todo;
  
