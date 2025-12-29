// ============================================
// MODERN TO-DO APP - FULL IMPLEMENTATION
// ============================================

// App State Management
class TodoApp {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.theme = localStorage.getItem('theme') || 'dark';
        this.init();
    }

    init() {
        this.loadTasks();
        this.loadTheme();
        this.attachEventListeners();
        this.renderTasks();
        this.updateStats();
        this.initDragAndDrop();
        this.checkNotifications();
        setInterval(() => this.checkNotifications(), 60000); // Check every minute
    }

    // Load tasks from localStorage
    loadTasks() {
        const saved = localStorage.getItem('tasks');
        if (saved) {
            this.tasks = JSON.parse(saved);
        }
    }

    // Save tasks to localStorage
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    // Load and apply theme
    loadTheme() {
        document.body.classList.toggle('light-theme', this.theme === 'light');
    }

    // Toggle theme
    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', this.theme);
        document.body.classList.toggle('light-theme');
        this.showToast(`${this.theme === 'dark' ? '🌙' : '☀️'} ${this.theme.charAt(0).toUpperCase() + this.theme.slice(1)} mode activated`);
    }

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Add new task
    addTask(text, priority = 'medium', category = 'personal', dueDate = null) {
        if (!text.trim()) {
            this.showToast('⚠️ Please enter a task', 'error');
            return;
        }

        const task = {
            id: this.generateId(),
            text: text.trim(),
            completed: false,
            priority: priority,
            category: category,
            dueDate: dueDate,
            createdAt: Date.now(),
            tags: [],
            notes: '',
            subtasks: [],
            pinned: false
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.showToast('✅ Task added successfully', 'success');
        this.triggerConfetti();
    }

    // Edit task
    editTask(id, newText) {
        const task = this.tasks.find(t => t.id === id);
        if (task && newText.trim()) {
            task.text = newText.trim();
            this.saveTasks();
            this.renderTasks();
            this.showToast('✏️ Task updated', 'success');
        }
    }

    // Delete task
    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.showToast('🗑️ Task deleted', 'info');
    }

    // Toggle task completion
    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            if (task.completed) {
                this.showToast('🎉 Great job!', 'success');
                this.triggerConfetti();
            }
        }
    }

    // Toggle pin task
    togglePin(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.pinned = !task.pinned;
            this.saveTasks();
            this.renderTasks();
            this.showToast(task.pinned ? '📌 Task pinned' : '📍 Task unpinned', 'info');
        }
    }

    // Update task priority
    updatePriority(id, priority) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.priority = priority;
            this.saveTasks();
            this.renderTasks();
        }
    }

    // Update task category
    updateCategory(id, category) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.category = category;
            this.saveTasks();
            this.renderTasks();
        }
    }

    // Update due date
    updateDueDate(id, dueDate) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.dueDate = dueDate;
            this.saveTasks();
            this.renderTasks();
        }
    }

    // Add tag to task
    addTag(id, tag) {
        const task = this.tasks.find(t => t.id === id);
        if (task && tag.trim() && !task.tags.includes(tag.trim())) {
            task.tags.push(tag.trim());
            this.saveTasks();
            this.renderTasks();
        }
    }

    // Remove tag from task
    removeTag(id, tag) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.tags = task.tags.filter(t => t !== tag);
            this.saveTasks();
            this.renderTasks();
        }
    }

    // Add subtask
    addSubtask(id, subtaskText) {
        const task = this.tasks.find(t => t.id === id);
        if (task && subtaskText.trim()) {
            task.subtasks.push({
                id: this.generateId(),
                text: subtaskText.trim(),
                completed: false
            });
            this.saveTasks();
            this.renderTasks();
        }
    }

    // Toggle subtask
    toggleSubtask(taskId, subtaskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            const subtask = task.subtasks.find(s => s.id === subtaskId);
            if (subtask) {
                subtask.completed = !subtask.completed;
                this.saveTasks();
                this.renderTasks();
            }
        }
    }

    // Clear completed tasks
    clearCompleted() {
        this.tasks = this.tasks.filter(t => !t.completed);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.showToast('🧹 Completed tasks cleared', 'success');
    }

    // Get filtered tasks
    getFilteredTasks() {
        let filtered = [...this.tasks];

        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(task => 
                task.text.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                task.tags.some(tag => tag.toLowerCase().includes(this.searchQuery.toLowerCase()))
            );
        }

        // Apply category filter
        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(task => task.category === this.currentCategory);
        }

        // Apply status filter
        if (this.currentFilter === 'active') {
            filtered = filtered.filter(task => !task.completed);
        } else if (this.currentFilter === 'completed') {
            filtered = filtered.filter(task => task.completed);
        }

        // Sort: pinned first, then by creation date
        filtered.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return b.createdAt - a.createdAt;
        });

        return filtered;
    }

    // Render tasks
    renderTasks() {
        const taskList = document.getElementById('task-list');
        const filtered = this.getFilteredTasks();

        if (filtered.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h3>No tasks found</h3>
                    <p>${this.searchQuery ? 'Try a different search' : 'Add a task to get started!'}</p>
                </div>
            `;
            return;
        }

        taskList.innerHTML = filtered.map(task => this.createTaskHTML(task)).join('');
    }

    // Create task HTML
    createTaskHTML(task) {
        const priorityColors = {
            high: '#ff4757',
            medium: '#ffa502',
            low: '#2ed573'
        };

        const categoryIcons = {
            work: '💼',
            personal: '👤',
            shopping: '🛒',
            health: '💪',
            study: '📚',
            other: '📌'
        };

        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
        const dueDateText = task.dueDate ? this.formatDate(task.dueDate) : '';

        const completedSubtasks = task.subtasks.filter(s => s.completed).length;
        const totalSubtasks = task.subtasks.length;

        return `
            <li class="task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" 
                data-id="${task.id}" 
                draggable="true">
                <div class="task-main">
                    <div class="task-left">
                        <input type="checkbox" 
                               class="checkbox" 
                               ${task.completed ? 'checked' : ''} 
                               onchange="app.toggleTask('${task.id}')">
                        <div class="task-content">
                            <span class="task-text" ondblclick="app.startEdit('${task.id}')">${this.escapeHtml(task.text)}</span>
                            ${task.tags.length > 0 ? `
                                <div class="task-tags">
                                    ${task.tags.map(tag => `
                                        <span class="tag">
                                            #${tag}
                                            <i class="bi bi-x" onclick="app.removeTag('${task.id}', '${tag}')"></i>
                                        </span>
                                    `).join('')}
                                </div>
                            ` : ''}
                            ${totalSubtasks > 0 ? `
                                <div class="subtask-progress">
                                    <i class="bi bi-check2-square"></i>
                                    <span>${completedSubtasks}/${totalSubtasks}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="task-right">
                        ${task.pinned ? '<i class="bi bi-pin-fill pin-icon"></i>' : ''}
                        <div class="task-meta">
                            <span class="priority-badge" style="background: ${priorityColors[task.priority]}">
                                ${task.priority}
                            </span>
                            <span class="category-badge">
                                ${categoryIcons[task.category]} ${task.category}
                            </span>
                            ${task.dueDate ? `
                                <span class="due-date ${isOverdue ? 'overdue' : ''}">
                                    <i class="bi bi-calendar"></i> ${dueDateText}
                                </span>
                            ` : ''}
                        </div>
                        <div class="task-actions">
                            <button class="action-btn pin-btn" 
                                    onclick="app.togglePin('${task.id}')" 
                                    title="${task.pinned ? 'Unpin' : 'Pin'}">
                                <i class="bi bi-pin${task.pinned ? '-fill' : ''}"></i>
                            </button>
                            <button class="action-btn details-btn" 
                                    onclick="app.showTaskDetails('${task.id}')" 
                                    title="Details">
                                <i class="bi bi-three-dots"></i>
                            </button>
                            <button class="action-btn edit-btn" 
                                    onclick="app.startEdit('${task.id}')" 
                                    title="Edit">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="action-btn delete-btn" 
                                    onclick="app.confirmDelete('${task.id}')" 
                                    title="Delete">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </li>
        `;
    }

    // Start editing task
    startEdit(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        const taskElement = document.querySelector(`[data-id="${id}"] .task-text`);
        const originalText = task.text;
        
        taskElement.innerHTML = `
            <input type="text" 
                   class="edit-input" 
                   value="${this.escapeHtml(originalText)}" 
                   onblur="app.finishEdit('${id}', this.value)" 
                   onkeydown="if(event.key==='Enter') this.blur(); if(event.key==='Escape') {this.value='${this.escapeHtml(originalText)}'; this.blur();}">
        `;
        taskElement.querySelector('.edit-input').focus();
    }

    // Finish editing task
    finishEdit(id, newText) {
        if (newText.trim()) {
            this.editTask(id, newText);
        } else {
            this.renderTasks();
        }
    }

    // Confirm delete
    confirmDelete(id) {
        this.showModal(
            'Delete Task',
            'Are you sure you want to delete this task?',
            () => this.deleteTask(id)
        );
    }

    // Show task details modal
    showTaskDetails(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        const modal = document.getElementById('details-modal');
        const content = document.getElementById('details-content');

        content.innerHTML = `
            <h3>${this.escapeHtml(task.text)}</h3>
            <div class="details-section">
                <label>Priority:</label>
                <select onchange="app.updatePriority('${id}', this.value)">
                    <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
                    <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                    <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
                </select>
            </div>
            <div class="details-section">
                <label>Category:</label>
                <select onchange="app.updateCategory('${id}', this.value)">
                    <option value="work" ${task.category === 'work' ? 'selected' : ''}>💼 Work</option>
                    <option value="personal" ${task.category === 'personal' ? 'selected' : ''}>👤 Personal</option>
                    <option value="shopping" ${task.category === 'shopping' ? 'selected' : ''}>🛒 Shopping</option>
                    <option value="health" ${task.category === 'health' ? 'selected' : ''}>💪 Health</option>
                    <option value="study" ${task.category === 'study' ? 'selected' : ''}>📚 Study</option>
                    <option value="other" ${task.category === 'other' ? 'selected' : ''}>📌 Other</option>
                </select>
            </div>
            <div class="details-section">
                <label>Due Date:</label>
                <input type="date" 
                       value="${task.dueDate || ''}" 
                       onchange="app.updateDueDate('${id}', this.value)">
            </div>
            <div class="details-section">
                <label>Tags:</label>
                <div class="tag-input-container">
                    <input type="text" 
                           id="tag-input-${id}" 
                           placeholder="Add tag..." 
                           onkeydown="if(event.key==='Enter') {app.addTag('${id}', this.value); this.value='';}">
                </div>
            </div>
            <div class="details-section">
                <label>Subtasks:</label>
                <div class="subtasks-container">
                    ${task.subtasks.map(st => `
                        <div class="subtask-item">
                            <input type="checkbox" 
                                   ${st.completed ? 'checked' : ''} 
                                   onchange="app.toggleSubtask('${id}', '${st.id}')">
                            <span class="${st.completed ? 'completed' : ''}">${this.escapeHtml(st.text)}</span>
                        </div>
                    `).join('')}
                    <input type="text" 
                           placeholder="Add subtask..." 
                           onkeydown="if(event.key==='Enter' && this.value.trim()) {app.addSubtask('${id}', this.value); this.value=''; app.showTaskDetails('${id}');}">
                </div>
            </div>
            <div class="details-section">
                <label>Notes:</label>
                <textarea rows="4" 
                          placeholder="Add notes..." 
                          onchange="app.updateNotes('${id}', this.value)">${task.notes || ''}</textarea>
            </div>
        `;

        modal.classList.add('active');
    }

    // Update notes
    updateNotes(id, notes) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.notes = notes;
            this.saveTasks();
        }
    }

    // Update statistics
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const active = total - completed;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        document.getElementById('total-tasks').textContent = total;
        document.getElementById('completed-tasks').textContent = completed;
        document.getElementById('active-tasks').textContent = active;
        document.getElementById('completion-rate').textContent = percentage + '%';
        
        const progressBar = document.querySelector('.progress-fill');
        if (progressBar) {
            progressBar.style.width = percentage + '%';
        }
    }

    // Check for due notifications
    checkNotifications() {
        if (!("Notification" in window)) return;

        const now = new Date();
        const today = now.toDateString();

        this.tasks.forEach(task => {
            if (task.dueDate && !task.completed) {
                const dueDate = new Date(task.dueDate);
                if (dueDate.toDateString() === today) {
                    this.sendNotification('Task Due Today', task.text);
                }
            }
        });
    }

    // Send browser notification
    sendNotification(title, body) {
        if (Notification.permission === "granted") {
            new Notification(title, { body, icon: '📝' });
        }
    }

    // Request notification permission
    requestNotificationPermission() {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }

    // Format date
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = date - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays === -1) return 'Yesterday';
        if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
        if (diffDays < 7) return `In ${diffDays} days`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Show modal
    showModal(title, message, onConfirm) {
        const modal = document.getElementById('confirm-modal');
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        
        const confirmBtn = document.getElementById('modal-confirm');
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.onclick = () => {
            onConfirm();
            this.closeModal('confirm-modal');
        };

        modal.classList.add('active');
    }

    // Close modal
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    // Trigger confetti animation
    triggerConfetti() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'];
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = Math.random() * 0.5 + 's';
                document.body.appendChild(confetti);
                setTimeout(() => confetti.remove(), 3000);
            }, i * 10);
        }
    }

    // Initialize drag and drop
    initDragAndDrop() {
        let draggedElement = null;

        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-item')) {
                draggedElement = e.target;
                e.target.classList.add('dragging');
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-item')) {
                e.target.classList.remove('dragging');
            }
        });

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(e.clientY);
            const taskList = document.getElementById('task-list');
            
            if (afterElement == null) {
                taskList.appendChild(draggedElement);
            } else {
                taskList.insertBefore(draggedElement, afterElement);
            }
        });
    }

    // Get drag after element
    getDragAfterElement(y) {
        const draggableElements = [...document.querySelectorAll('.task-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Export data
    exportData() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `todo-backup-${Date.now()}.json`;
        link.click();
        this.showToast('📥 Data exported successfully', 'success');
    }

    // Import data
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (Array.isArray(imported)) {
                    this.tasks = imported;
                    this.saveTasks();
                    this.renderTasks();
                    this.updateStats();
                    this.showToast('📤 Data imported successfully', 'success');
                }
            } catch (error) {
                this.showToast('❌ Invalid file format', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Attach event listeners
    attachEventListeners() {
        // Add task
        document.getElementById('add-btn').addEventListener('click', () => {
            const input = document.getElementById('input-task');
            const priority = document.getElementById('priority-select').value;
            const category = document.getElementById('category-select').value;
            const dueDate = document.getElementById('due-date-input').value;
            
            this.addTask(input.value, priority, category, dueDate || null);
            input.value = '';
            document.getElementById('due-date-input').value = '';
        });

        // Enter key to add task
        document.getElementById('input-task').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('add-btn').click();
            }
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.renderTasks();
            });
        });

        // Category filter
        document.getElementById('category-filter').addEventListener('change', (e) => {
            this.currentCategory = e.target.value;
            this.renderTasks();
        });

        // Search
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.renderTasks();
        });

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Clear completed
        document.getElementById('clear-completed').addEventListener('click', () => {
            this.clearCompleted();
        });

        // Export data
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportData();
        });

        // Import data
        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.importData(e.target.files[0]);
            }
        });

        // Share button
        document.getElementById('share-btn').addEventListener('click', () => {
            this.showShareModal();
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').classList.remove('active');
            });
        });

        // Modal cancel buttons
        document.querySelectorAll('.modal-cancel').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').classList.remove('active');
            });
        });

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Request notification permission
        this.requestNotificationPermission();
    }

    // Show share modal with encryption
    showShareModal() {
        const modal = document.getElementById('share-modal');
        modal.classList.add('active');
    }

    // Generate shareable encrypted URL
    async generateShareURL() {
        const password = document.getElementById('share-password').value;
        if (!password) {
            this.showToast('⚠️ Please enter a password', 'error');
            return;
        }

        try {
            const tasksToShare = this.currentFilter === 'all' 
                ? this.tasks 
                : this.getFilteredTasks();

            const encryptedData = await this.encryptData(
                JSON.stringify(tasksToShare), 
                password
            );

            const baseUrl = window.location.origin + window.location.pathname;
            const shareUrl = `${baseUrl}#share=${encryptedData}`;

            document.getElementById('share-url-output').value = shareUrl;
            document.getElementById('share-url-container').style.display = 'block';

            this.showToast('🔗 Share link generated!', 'success');
        } catch (error) {
            this.showToast('❌ Error generating link', 'error');
        }
    }

    // Copy share URL to clipboard
    copyShareURL() {
        const output = document.getElementById('share-url-output');
        output.select();
        document.execCommand('copy');
        this.showToast('📋 Link copied to clipboard!', 'success');
    }

    // Encrypt data using Web Crypto API
    async encryptData(data, password) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const passwordBuffer = encoder.encode(password);

        // Generate a key from the password
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveKey']
        );

        const salt = crypto.getRandomValues(new Uint8Array(16));
        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt']
        );

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encryptedBuffer = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            dataBuffer
        );

        // Combine salt + iv + encrypted data
        const combined = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength);
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(encryptedBuffer), salt.length + iv.length);

        // Convert to base64url
        return this.arrayBufferToBase64Url(combined);
    }

    // Decrypt data
    async decryptData(encryptedBase64, password) {
        const combined = this.base64UrlToArrayBuffer(encryptedBase64);
        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 28);
        const encryptedData = combined.slice(28);

        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);

        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveKey']
        );

        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );

        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encryptedData
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    }

    // Convert ArrayBuffer to Base64URL
    arrayBufferToBase64Url(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    // Convert Base64URL to ArrayBuffer
    base64UrlToArrayBuffer(base64url) {
        const base64 = base64url
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const padding = '='.repeat((4 - base64.length % 4) % 4);
        const binary = atob(base64 + padding);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    // Check for shared data on load
    async checkSharedData() {
        const hash = window.location.hash;
        if (hash.startsWith('#share=')) {
            const encryptedData = hash.substring(7);
            this.showDecryptModal(encryptedData);
        }
    }

    // Show decrypt modal
    showDecryptModal(encryptedData) {
        const modal = document.getElementById('decrypt-modal');
        modal.classList.add('active');

        document.getElementById('decrypt-btn').onclick = async () => {
            const password = document.getElementById('decrypt-password').value;
            if (!password) {
                this.showToast('⚠️ Please enter password', 'error');
                return;
            }

            try {
                const decrypted = await this.decryptData(encryptedData, password);
                const sharedTasks = JSON.parse(decrypted);

                if (confirm('Import these tasks? This will add them to your current list.')) {
                    this.tasks = [...this.tasks, ...sharedTasks];
                    this.saveTasks();
                    this.renderTasks();
                    this.updateStats();
                    modal.classList.remove('active');
                    window.location.hash = '';
                    this.showToast('✅ Tasks imported successfully!', 'success');
                }
            } catch (error) {
                this.showToast('❌ Wrong password or corrupted data', 'error');
            }
        };
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TodoApp();
    app.checkSharedData();
});
