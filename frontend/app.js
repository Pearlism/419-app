class MessagingApp {
    constructor() {
        this.socket = null;
        this.currentUser = null;
        this.currentChat = null;
        this.chats = new Map();
        this.users = new Map();
        this.groups = new Map();
        this.messageRequests = [];
        this.selectedUserForRequest = null;
        this.activePopups = new Set();
        this.typingTimeout = null;
        
        this.initializeEventListeners();
    }
    
    showLoading() {
        const loader = document.getElementById('loading-screen');
        if (loader) loader.style.display = 'flex';
    }
    
    hideLoading() {
        const loader = document.getElementById('loading-screen');
        if (loader) loader.style.display = 'none';
    }

    initializeEventListeners() {
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('show-login').addEventListener('click', (e) => this.showScreen('login-screen', e));
        document.getElementById('show-register').addEventListener('click', (e) => this.showScreen('register-screen', e));
        
        // Mobile navigation
        document.getElementById('mobile-menu-toggle').addEventListener('click', () => this.toggleMobileSidebar());
        document.getElementById('mobile-chat-toggle').addEventListener('click', () => this.toggleMobileChat());
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        document.getElementById('search-btn').addEventListener('click', () => this.searchUsers());
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchUsers();
        });
        document.getElementById('send-btn').addEventListener('click', () => this.sendMessage());
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        document.getElementById('new-group-btn').addEventListener('click', () => this.showGroupModal());
        document.getElementById('create-group-btn').addEventListener('click', () => this.createGroup());
        document.getElementById('close-group-modal').addEventListener('click', () => this.hideGroupModal());
        document.getElementById('close-add-to-group-modal').addEventListener('click', () => this.hideAddToGroupModal());
        document.getElementById('add-to-group-btn').addEventListener('click', () => this.showAddToGroupModal());
        document.getElementById('message-requests-btn').addEventListener('click', () => this.showMessageRequestsModal());
        document.getElementById('close-message-requests-modal').addEventListener('click', () => this.hideMessageRequestsModal());
        document.getElementById('send-request-btn').addEventListener('click', () => this.sendMessageRequest());
        document.getElementById('close-send-request-modal').addEventListener('click', () => this.hideSendRequestModal());
        document.getElementById('close-add-user-modal').addEventListener('click', () => this.hideAddUserModal());
        document.getElementById('add-user-btn').addEventListener('click', () => this.addUserToGroup());
        document.getElementById('group-members-btn').addEventListener('click', () => this.showGroupMembersModal());
        document.getElementById('close-group-members-modal').addEventListener('click', () => this.hideGroupMembersModal());
    }

    showScreen(screenId, e) {
        if (e) e.preventDefault();
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    }

    async handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name'),
            displayName: formData.get('displayName'),
            password: formData.get('password')
        };

        if (!data.name || !data.displayName || !data.password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        if (data.password.length < 6) {
            this.showNotification('Password must be at least 6 characters', 'error');
            return;
        }

        this.showLoading();
        
        try {
            const response = await fetch('http://localhost:3001/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (response.ok) {
                this.currentUser = result;
                this.connectSocket();
                this.showScreen('main-app');
                this.updateUserInfo();
                this.showNotification(`Account created! Your phone number is ${result.phoneNumber}`, 'success');
            } else {
                this.showNotification(result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Registration failed. Please check your connection.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name'),
            password: formData.get('password')
        };

        if (!data.name || !data.password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        this.showLoading();
        
        try {
            const response = await fetch('http://localhost:3001/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (response.ok) {
                this.currentUser = result;
                this.connectSocket();
                this.showScreen('main-app');
                this.updateUserInfo();
                this.showNotification('Welcome back!', 'success');
            } else {
                this.showNotification(result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Login failed. Please check your connection.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    connectSocket() {
        this.socket = io('http://localhost:3001');
        
        this.socket.on('connect', () => {
            this.socket.emit('login', { name: this.currentUser.name });
        });

        this.socket.on('login-success', (data) => {
            this.currentUser.userId = data.userId;
            this.loadSavedChats();
        });

        this.socket.on('new-message', (message) => {
            this.handleNewMessage(message);
            
            const isCurrentChat = this.currentChat && 
                ((this.currentChat.type === 'private' && message.from === this.currentUser.userId) ||
                 (this.currentChat.type === 'group' && this.currentChat.groupId === message.to));
            
            if (!isCurrentChat && message.from !== this.currentUser.userId) {
                const senderName = message.fromName;
                this.showChatNotification(senderName, message.message);
            }
        });

        this.socket.on('messages', (messages) => {
            this.displayMessages(messages);
        });

        this.socket.on('user-online', (user) => {
            this.updateUserStatus(user.name, true);
        });

        this.socket.on('user-offline', (user) => {
            this.updateUserStatus(user.name, false);
        });

        this.socket.on('new-message-request', (request) => {
            this.messageRequests.push(request);
            this.updateRequestCount();
            this.showChatPopup(request);
        });

        this.socket.on('pending-requests', (requests) => {
            this.messageRequests = requests;
            this.updateRequestCount();
        });

        this.socket.on('request-accepted', (data) => {
            this.showNotification('Your message request was accepted!', 'success');
        });

        this.socket.on('added-to-group', (data) => {
            this.showNotification(`You were added to group: ${data.groupName}`, 'success');
            this.loadSavedChats();
        });
    }

    updateUserInfo() {
        document.getElementById('current-user-display').textContent = this.currentUser.displayName;
        document.getElementById('current-user-phone').textContent = this.currentUser.phoneNumber;
    }

    async searchUsers() {
        const query = document.getElementById('search-input').value.trim();
        if (!query) return;

        try {
            const response = await fetch(`http://localhost:3001/user/${query}`);
            
            if (response.ok) {
                const userData = await response.json();
                this.displaySearchResult(userData);
            } else {
                this.showNotification('User not found', 'error');
            }
        } catch (error) {
            this.showNotification('Search failed', 'error');
        }
    }

    displaySearchResult(user) {
        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = '';

        const resultDiv = document.createElement('div');
        resultDiv.className = 'search-result';
        resultDiv.innerHTML = `
            <h4>${user.displayName} <span class="${user.online ? 'online-indicator' : 'offline-indicator'}"></span></h4>
            <p>Username: ${user.name} | Phone: ${user.phoneNumber}</p>
        `;
        
        resultDiv.addEventListener('click', () => {
            this.selectedUserForRequest = user;
            this.showSendRequestModal();
            resultsContainer.innerHTML = '';
            document.getElementById('search-input').value = '';
        });

        resultsContainer.appendChild(resultDiv);
    }

    startChat(chatWith, displayName, type, groupId = null) {
        // Close mobile sidebar first
        this.closeMobileSidebar();
        
        this.currentChat = { chatWith, displayName, type, groupId };
        
        document.getElementById('no-chat-selected').style.display = 'none';
        document.getElementById('chat-header').style.display = 'flex';
        document.getElementById('messages-container').style.display = 'flex';
        document.getElementById('message-input-container').style.display = 'block';

        document.getElementById('chat-user-name').textContent = displayName;
        document.getElementById('chat-user-status').textContent = type === 'group' ? 'Group Chat' : 'Online';
        
        const addToGroupBtn = document.getElementById('add-to-group-btn');
        const groupMembersBtn = document.getElementById('group-members-btn');
        
        if (type === 'group') {
            addToGroupBtn.style.display = 'block';
            addToGroupBtn.title = 'Add User to Group';
            addToGroupBtn.onclick = () => this.showAddUserModal();
            
            groupMembersBtn.style.display = 'block';
            groupMembersBtn.title = 'Group Members';
            groupMembersBtn.onclick = () => this.showGroupMembersModal();
        } else {
            addToGroupBtn.style.display = 'none';
            groupMembersBtn.style.display = 'none';
        }

        this.socket.emit('get-messages', { chatWith: groupId || chatWith, type });
        
        this.addToChatsList(chatWith, displayName, type, groupId);
        this.saveChatToServer(chatWith, displayName, type, groupId);
    }

    addToChatsList(chatWith, displayName, type, groupId = null) {
        const chatKey = groupId || chatWith;
        if (this.chats.has(chatKey)) return;

        this.chats.set(chatKey, { chatWith, displayName, type, groupId });
        this.updateChatsList();
    }

    updateChatsList() {
        const chatsList = document.getElementById('chats-list');
        chatsList.innerHTML = '';

        this.chats.forEach((chat, key) => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            if (this.currentChat && (this.currentChat.groupId === key || this.currentChat.chatWith === key)) {
                chatItem.classList.add('active');
            }

            chatItem.innerHTML = `
                <div class="chat-avatar">
                    <i class="fas fa-${chat.type === 'group' ? 'users' : 'user'}"></i>
                </div>
                <div class="chat-info">
                    <h4>${chat.displayName}</h4>
                    <p>${chat.type === 'group' ? 'Group Chat' : 'Individual Chat'}</p>
                </div>
                <button class="chat-remove-btn" onclick="app.removeChat('${key}', '${chat.type}', '${chat.groupId || ''}')">
                    <i class="fas fa-times"></i>
                </button>
            `;

            chatItem.addEventListener('click', (e) => {
                if (!e.target.closest('.chat-remove-btn')) {
                    this.startChat(chat.chatWith, chat.displayName, chat.type, chat.groupId);
                }
            });

            chatsList.appendChild(chatItem);
        });
    }

    sendMessage() {
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value.trim();
        if (!message || !this.currentChat) return;

        const messageData = {
            to: this.currentChat.groupId || this.currentChat.chatWith,
            message,
            type: this.currentChat.type
        };

        this.socket.emit('send-message', messageData);
        messageInput.value = '';
        messageInput.focus();

        const messageElement = this.createMessageElement({
            from: this.currentUser.userId,
            fromName: this.currentUser.displayName,
            message,
            timestamp: new Date().toISOString()
        }, true);

        document.getElementById('messages-list').appendChild(messageElement);
        this.scrollToBottom();
    }

    handleNewMessage(message) {
        const isCurrentChat = this.currentChat && 
            ((this.currentChat.type === 'private' && message.from !== this.currentUser.userId) ||
             (this.currentChat.type === 'group' && this.currentChat.groupId === message.to));

        if (isCurrentChat) {
            const messageElement = this.createMessageElement(message, false);
            document.getElementById('messages-list').appendChild(messageElement);
            this.scrollToBottom();
        }
        
        if (message.from !== this.currentUser.userId && message.type === 'private') {
            const chatKey = message.from;
            if (!this.chats.has(chatKey)) {
                this.addToChatsList(message.fromName, message.fromName, 'private');
                this.saveChatToServer(message.fromName, message.fromName, 'private');
            }
        }
    }

    createMessageElement(message, isSent) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
        
        const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            ${!isSent ? `<div class="message-info">${message.fromName} • ${time}</div>` : `<div class="message-info">You • ${time}</div>`}
            <div>${message.message}</div>
        `;

        return messageDiv;
    }

    displayMessages(messages) {
        const messagesList = document.getElementById('messages-list');
        messagesList.innerHTML = '';

        messages.forEach(message => {
            const isSent = message.from === this.currentUser.userId;
            const messageElement = this.createMessageElement(message, isSent);
            messagesList.appendChild(messageElement);
        });

        this.scrollToBottom();
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('messages-container');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async createGroup() {
        const groupName = document.getElementById('group-name').value.trim();
        if (!groupName) return;

        try {
            const response = await fetch('http://localhost:3001/create-group', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    groupName,
                    creatorId: this.currentUser.userId
                })
            });

            const result = await response.json();
            
            if (response.ok) {
                this.startChat(result.groupId, result.groupName, 'group', result.groupId);
                this.hideGroupModal();
                document.getElementById('group-name').value = '';
                this.showNotification('Group created successfully!', 'success');
            } else {
                this.showNotification(result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Failed to create group', 'error');
        }
    }

    showGroupModal() {
        document.getElementById('group-modal').classList.add('active');
    }

    hideGroupModal() {
        document.getElementById('group-modal').classList.remove('active');
    }

    showAddToGroupModal() {
        const groupsList = document.getElementById('available-groups');
        groupsList.innerHTML = '';

        this.groups.forEach((group, groupId) => {
            const groupItem = document.createElement('div');
            groupItem.className = 'group-item';
            groupItem.innerHTML = `
                <h4>${group.name}</h4>
                <p>Group Chat</p>
            `;
            
            groupItem.addEventListener('click', () => {
                this.addUserToGroup(groupId);
            });

            groupsList.appendChild(groupItem);
        });

        document.getElementById('add-to-group-modal').classList.add('active');
    }

    hideAddToGroupModal() {
        document.getElementById('add-to-group-modal').classList.remove('active');
    }

    async addUserToGroup(groupId) {
        try {
            const response = await fetch('http://localhost:3001/join-group', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    groupId,
                    userId: this.currentUser.userId
                })
            });

            if (response.ok) {
                this.showNotification('Added to group successfully!', 'success');
                this.hideAddToGroupModal();
            } else {
                this.showNotification('Failed to join group', 'error');
            }
        } catch (error) {
            this.showNotification('Failed to join group', 'error');
        }
    }

    updateUserStatus(username, isOnline) {
        const statusElement = document.getElementById('chat-user-status');
        if (statusElement && this.currentChat && this.currentChat.chatWith === username) {
            statusElement.textContent = isOnline ? 'Online' : 'Offline';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            padding: 16px 24px;
            border-radius: 14px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            max-width: 360px;
            word-wrap: break-word;
            animation: notificationSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1);
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            gap: 12px;
        `;

        if (type === 'success') {
            notification.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        } else if (type === 'error') {
            notification.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        } else {
            notification.style.background = 'linear-gradient(135deg, #00d9ff, #00a8cc)';
        }

        const icon = document.createElement('i');
        icon.className = type === 'success' ? 'fas fa-check-circle' : 
                        type === 'error' ? 'fas fa-exclamation-circle' : 
                        'fas fa-info-circle';
        icon.style.fontSize = '20px';
        
        notification.appendChild(icon);
        const textSpan = document.createElement('span');
        textSpan.textContent = message;
        notification.appendChild(textSpan);
        
        document.body.appendChild(notification);

        const style = document.createElement('style');
        style.textContent = `
            @keyframes notificationSlideIn {
                from {
                    opacity: 0;
                    transform: translateX(100px) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translateX(0) scale(1);
                }
            }
        `;
        document.head.appendChild(style);

        setTimeout(() => {
            notification.style.animation = 'notificationSlideOut 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
        
        const styleOut = document.createElement('style');
        styleOut.textContent = `
            @keyframes notificationSlideOut {
                from {
                    opacity: 1;
                    transform: translateX(0) scale(1);
                }
                to {
                    opacity: 0;
                    transform: translateX(100px) scale(0.9);
                }
            }
        `;
        document.head.appendChild(styleOut);
    }

    updateRequestCount() {
        const pendingCount = this.messageRequests.filter(r => r.status === 'pending').length;
        const badge = document.getElementById('request-count');
        if (pendingCount > 0) {
            badge.textContent = pendingCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    async showMessageRequestsModal() {
        const requestsList = document.getElementById('requests-list');
        requestsList.innerHTML = '';

        const pendingRequests = this.messageRequests.filter(r => r.status === 'pending');
        
        if (pendingRequests.length === 0) {
            requestsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No pending message requests</p>
                </div>
            `;
        } else {
            pendingRequests.forEach(request => {
                const requestDiv = document.createElement('div');
                requestDiv.className = 'request-item';
                
                const time = new Date(request.timestamp).toLocaleString();
                
                requestDiv.innerHTML = `
                    <div class="request-header">
                        <div class="request-user">
                            <div class="request-user-avatar">
                                <i class="fas fa-user"></i>
                            </div>
                            <div class="request-user-info">
                                <h4>${request.fromName}</h4>
                                <p>@${request.fromUsername} • ${time}</p>
                            </div>
                        </div>
                    </div>
                    <div class="request-message">${request.message}</div>
                    <div class="request-actions">
                        <button class="btn-accept" onclick="app.respondToRequest('${request.id}', true)">
                            <i class="fas fa-check"></i> Accept
                        </button>
                        <button class="btn-decline" onclick="app.respondToRequest('${request.id}', false)">
                            <i class="fas fa-times"></i> Decline
                        </button>
                    </div>
                `;
                
                requestsList.appendChild(requestDiv);
            });
        }

        document.getElementById('message-requests-modal').classList.add('active');
    }

    hideMessageRequestsModal() {
        document.getElementById('message-requests-modal').classList.remove('active');
    }

    showSendRequestModal() {
        document.getElementById('send-message-request-modal').classList.add('active');
    }

    hideSendRequestModal() {
        document.getElementById('send-message-request-modal').classList.remove('active');
        document.getElementById('request-message').value = '';
        this.selectedUserForRequest = null;
    }

    async sendMessageRequest() {
        const message = document.getElementById('request-message').value.trim();
        if (!message || !this.selectedUserForRequest) {
            this.showNotification('Please enter a message', 'error');
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/send-message-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromUserId: this.currentUser.userId,
                    toUserId: this.selectedUserForRequest.id,
                    message
                })
            });

            if (response.ok) {
                this.showNotification('Message request sent!', 'success');
                this.hideSendRequestModal();
            } else {
                const result = await response.json();
                this.showNotification(result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Failed to send message request', 'error');
        }
    }

    async respondToRequest(requestId, accept) {
        try {
            const response = await fetch('http://localhost:3001/respond-to-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestId,
                    userId: this.currentUser.userId,
                    accept
                })
            });

            if (response.ok) {
                const request = this.messageRequests.find(r => r.id === requestId);
                if (request) {
                    request.status = accept ? 'accepted' : 'declined';
                    this.updateRequestCount();
                }
                
                if (accept) {
                    this.startChat(request.fromUsername, request.fromName, 'private');
                }
                
                this.showMessageRequestsModal();
                this.showNotification(accept ? 'Request accepted!' : 'Request declined', 'success');
            } else {
                this.showNotification('Failed to respond to request', 'error');
            }
        } catch (error) {
            this.showNotification('Failed to respond to request', 'error');
        }
    }

    showChatPopup(request) {
        const popupId = `popup-${request.id}`;
        
        if (this.activePopups.has(popupId)) return;
        
        this.activePopups.add(popupId);
        
        const popup = document.createElement('div');
        popup.className = 'chat-popup';
        popup.id = popupId;
        
        const time = new Date(request.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        popup.innerHTML = `
            <div class="chat-popup-header">
                <div class="chat-popup-user">
                    <div class="chat-popup-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="chat-popup-info">
                        <h4>${request.fromName}</h4>
                        <p>Message Request • ${time}</p>
                    </div>
                </div>
                <button class="chat-popup-close" onclick="app.closeChatPopup('${popupId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="chat-popup-body">
                <div class="chat-popup-message">${request.message}</div>
                <div class="chat-popup-actions">
                    <button class="chat-popup-btn accept" onclick="app.respondToRequestFromPopup('${request.id}', true, '${popupId}')">
                        <i class="fas fa-check"></i> Accept
                    </button>
                    <button class="chat-popup-btn decline" onclick="app.respondToRequestFromPopup('${request.id}', false, '${popupId}')">
                        <i class="fas fa-times"></i> Decline
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        setTimeout(() => {
            this.closeChatPopup(popupId);
        }, 30000);
    }

    showChatNotification(senderName, message) {
        const popupId = `notification-${Date.now()}`;
        
        if (this.activePopups.has(popupId)) return;
        
        this.activePopups.add(popupId);
        
        const popup = document.createElement('div');
        popup.className = 'chat-popup';
        popup.id = popupId;
        
        popup.innerHTML = `
            <div class="chat-popup-header">
                <div class="chat-popup-user">
                    <div class="chat-popup-avatar">
                        <i class="fas fa-comment"></i>
                    </div>
                    <div class="chat-popup-info">
                        <h4>${senderName}</h4>
                        <p>New Message</p>
                    </div>
                </div>
                <button class="chat-popup-close" onclick="app.closeChatPopup('${popupId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="chat-popup-body">
                <div class="chat-popup-message">${message}</div>
                <div class="chat-popup-actions">
                    <button class="chat-popup-btn accept" onclick="app.openChatFromNotification('${senderName}', '${popupId}')">
                        <i class="fas fa-reply"></i> Reply
                    </button>
                    <button class="chat-popup-btn decline" onclick="app.closeChatPopup('${popupId}')">
                        <i class="fas fa-times"></i> Dismiss
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        setTimeout(() => {
            this.closeChatPopup(popupId);
        }, 10000);
    }

    closeChatPopup(popupId) {
        const popup = document.getElementById(popupId);
        if (popup) {
            popup.remove();
            this.activePopups.delete(popupId);
        }
    }

    respondToRequestFromPopup(requestId, accept, popupId) {
        this.respondToRequest(requestId, accept);
        this.closeChatPopup(popupId);
    }

    async openChatFromNotification(senderName, popupId) {
        try {
            const response = await fetch(`http://localhost:3001/user/${senderName}`);
            if (response.ok) {
                const userData = await response.json();
                this.startChat(userData.name, userData.displayName, 'private');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
        this.closeChatPopup(popupId);
    }

    async loadSavedChats() {
        if (!this.currentUser || !this.currentUser.userId) return;

        try {
            const response = await fetch(`http://localhost:3001/chats/${this.currentUser.userId}`);
            if (response.ok) {
                const savedChats = await response.json();
                
                savedChats.forEach(chat => {
                    this.addToChatsList(chat.chatWith, chat.displayName, chat.type, chat.groupId);
                });
            }
        } catch (error) {
            console.error('Error loading saved chats:', error);
        }
    }

    async saveChatToServer(chatWith, displayName, type, groupId = null) {
        if (!this.currentUser || !this.currentUser.userId) return;

        try {
            await fetch('http://localhost:3001/save-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.currentUser.userId,
                    chatWith,
                    displayName,
                    type,
                    groupId: groupId || null
                })
            });
        } catch (error) {
            console.error('Error saving chat:', error);
        }
    }

    async removeChat(chatKey, type, groupId) {
        if (!this.currentUser || !this.currentUser.userId) return;

        try {
            const chatWith = type === 'group' ? null : chatKey;
            const response = await fetch('http://localhost:3001/remove-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.currentUser.userId,
                    chatWith,
                    groupId: groupId || null
                })
            });

            if (response.ok) {
                this.chats.delete(chatKey);
                this.updateChatsList();
                
                if (this.currentChat && (this.currentChat.groupId === chatKey || this.currentChat.chatWith === chatKey)) {
                    this.showNoChatSelected();
                }
            }
        } catch (error) {
            console.error('Error removing chat:', error);
        }
    }

    showNoChatSelected() {
        document.getElementById('no-chat-selected').style.display = 'flex';
        document.getElementById('chat-header').style.display = 'none';
        document.getElementById('messages-container').style.display = 'none';
        document.getElementById('message-input-container').style.display = 'none';
        this.currentChat = null;
    }

    showAddUserModal() {
        document.getElementById('add-user-to-group-modal').classList.add('active');
    }

    hideAddUserModal() {
        document.getElementById('add-user-to-group-modal').classList.remove('active');
        document.getElementById('add-user-input').value = '';
    }

    async addUserToGroup() {
        const username = document.getElementById('add-user-input').value.trim();
        if (!username || !this.currentChat || this.currentChat.type !== 'group') return;

        try {
            const response = await fetch('http://localhost:3001/add-user-to-group', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    groupId: this.currentChat.groupId,
                    userId: this.currentUser.userId,
                    targetUsername: username
                })
            });

            const result = await response.json();
            
            if (response.ok) {
                this.showNotification('User added to group successfully!', 'success');
                this.hideAddUserModal();
            } else {
                this.showNotification(result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Failed to add user to group', 'error');
        }
    }

    async showGroupMembersModal() {
        if (!this.currentChat || this.currentChat.type !== 'group') return;

        try {
            const response = await fetch(`http://localhost:3001/group-members/${this.currentChat.groupId}`);
            if (response.ok) {
                const members = await response.json();
                this.displayGroupMembers(members);
                document.getElementById('group-members-modal').classList.add('active');
            } else {
                this.showNotification('Failed to load group members', 'error');
            }
        } catch (error) {
            this.showNotification('Failed to load group members', 'error');
        }
    }

    displayGroupMembers(members) {
        const membersList = document.getElementById('group-members-list');
        membersList.innerHTML = '';

        const onlineCount = members.filter(member => member.online).length;
        const totalCount = members.length;

        membersList.innerHTML = `
            <div class="member-count">
                ${onlineCount} of ${totalCount} members online
            </div>
        `;

        members.forEach(member => {
            const memberDiv = document.createElement('div');
            memberDiv.className = 'group-member-item';
            
            memberDiv.innerHTML = `
                <div class="group-member-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="group-member-info">
                    <h4>${member.displayName}</h4>
                    <p>@${member.name}</p>
                </div>
                <div class="group-member-status">
                    <span class="${member.online ? 'status-online' : 'status-offline'}">
                        ${member.online ? 'Online' : 'Offline'}
                    </span>
                    ${member.online ? '<div class="online-indicator"></div>' : ''}
                </div>
            `;

            membersList.appendChild(memberDiv);
        });
    }

    hideGroupMembersModal() {
        document.getElementById('group-members-modal').classList.remove('active');
    }

    logout() {
        if (this.socket) {
            this.socket.disconnect();
        }
        this.currentUser = null;
        this.currentChat = null;
        this.chats.clear();
        this.messageRequests = [];
        this.activePopups.clear();
        
        document.querySelectorAll('.chat-popup').forEach(popup => popup.remove());
        
        this.showScreen('login-screen');
        document.getElementById('login-name').value = '';
        document.getElementById('login-password').value = '';
    }

    // Mobile navigation methods
    toggleMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const isOpen = sidebar.classList.contains('mobile-open');
        
        if (isOpen) {
            sidebar.classList.remove('mobile-open');
        } else {
            sidebar.classList.add('mobile-open');
        }
    }

    toggleMobileChat() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.add('mobile-open');
    }

    closeMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('mobile-open');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new MessagingApp();
});
