const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jsonfile = require('jsonfile');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend')));

const users = new Map();
const messages = new Map();
const groups = new Map();
const messageRequests = new Map();
const userChats = new Map();

const USERS_FILE = path.join(__dirname, 'users.json');
const MESSAGES_FILE = path.join(__dirname, 'messages.json');
const GROUPS_FILE = path.join(__dirname, 'groups.json');
const REQUESTS_FILE = path.join(__dirname, 'messageRequests.json');
const CHATS_FILE = path.join(__dirname, 'chats.json');

function loadData() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const userData = jsonfile.readFileSync(USERS_FILE);
      userData.forEach(user => users.set(user.name, user));
    }
    if (fs.existsSync(MESSAGES_FILE)) {
      const messageData = jsonfile.readFileSync(MESSAGES_FILE);
      messageData.forEach(([userId, userMessages]) => messages.set(userId, userMessages));
    }
    if (fs.existsSync(GROUPS_FILE)) {
      const groupData = jsonfile.readFileSync(GROUPS_FILE);
      groupData.forEach(group => groups.set(group.id, group));
    }
    if (fs.existsSync(REQUESTS_FILE)) {
      const requestData = jsonfile.readFileSync(REQUESTS_FILE);
      requestData.forEach(([userId, requests]) => messageRequests.set(userId, requests));
    }
    if (fs.existsSync(CHATS_FILE)) {
      const chatsData = jsonfile.readFileSync(CHATS_FILE);
      chatsData.forEach(([userId, chats]) => userChats.set(userId, chats));
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

function saveData() {
  try {
    const userData = Array.from(users.values());
    jsonfile.writeFileSync(USERS_FILE, userData, { spaces: 2 });
    
    const messageData = Array.from(messages.entries());
    jsonfile.writeFileSync(MESSAGES_FILE, messageData, { spaces: 2 });
    
    const groupData = Array.from(groups.values());
    jsonfile.writeFileSync(GROUPS_FILE, groupData, { spaces: 2 });
    
    const requestData = Array.from(messageRequests.entries());
    jsonfile.writeFileSync(REQUESTS_FILE, requestData, { spaces: 2 });
    
    const chatsData = Array.from(userChats.entries());
    jsonfile.writeFileSync(CHATS_FILE, chatsData, { spaces: 2 });
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

loadData();

function generatePhoneNumber() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

app.post('/register', async (req, res) => {
  const { name, displayName, password } = req.body;
  
  if (!name || !displayName || !password) {
    return res.status(400).json({ error: 'Name, display name, and password are required' });
  }

  if (users.has(name)) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const phoneNumber = generatePhoneNumber();
    const userId = uuidv4();
    
    const user = {
      id: userId,
      name,
      displayName,
      phoneNumber,
      password: hashedPassword,
      online: false,
      socketId: null
    };

    users.set(name, user);
    messages.set(userId, []);
    messageRequests.set(userId, []);
    userChats.set(userId, []);
    
    saveData();
    
    res.json({
      userId,
      name,
      displayName,
      phoneNumber
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/login', async (req, res) => {
  const { name, password } = req.body;
  
  if (!name || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = users.get(name);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  try {
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      userId: user.id,
      name: user.name,
      displayName: user.displayName,
      phoneNumber: user.phoneNumber
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/user/:identifier', (req, res) => {
  const identifier = req.params.identifier;
  
  for (const [name, user] of users) {
    if (user.name === identifier || user.phoneNumber === identifier) {
      res.json({
        id: user.id,
        name: user.name,
        displayName: user.displayName,
        phoneNumber: user.phoneNumber,
        online: user.online
      });
      return;
    }
  }
  
  res.status(404).json({ error: 'User not found' });
});

app.post('/create-group', (req, res) => {
  const { groupName, creatorId } = req.body;
  
  if (!groupName || !creatorId) {
    return res.status(400).json({ error: 'Group name and creator ID are required' });
  }

  const groupId = uuidv4();
  const group = {
    id: groupId,
    name: groupName,
    members: [creatorId],
    messages: []
  };

  groups.set(groupId, group);
  saveData();
  
  res.json({ groupId, groupName });
});

app.post('/join-group', (req, res) => {
  const { groupId, userId } = req.body;
  
  if (!groups.has(groupId)) {
    return res.status(404).json({ error: 'Group not found' });
  }

  const group = groups.get(groupId);
  if (!group.members.includes(userId)) {
    group.members.push(userId);
    saveData();
  }
  
  res.json({ success: true });
});

app.post('/send-message-request', (req, res) => {
  const { fromUserId, toUserId, message } = req.body;
  
  if (!fromUserId || !toUserId || !message) {
    return res.status(400).json({ error: 'From user, to user, and message are required' });
  }

  const fromUser = Array.from(users.values()).find(u => u.id === fromUserId);
  const toUser = Array.from(users.values()).find(u => u.id === toUserId);

  if (!fromUser || !toUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const request = {
    id: uuidv4(),
    fromUserId,
    fromName: fromUser.displayName,
    fromUsername: fromUser.name,
    toUserId,
    message,
    timestamp: new Date().toISOString(),
    status: 'pending'
  };

  if (!messageRequests.has(toUserId)) {
    messageRequests.set(toUserId, []);
  }
  
  messageRequests.get(toUserId).push(request);
  saveData();

  if (toUser.online) {
    io.to(toUser.socketId).emit('new-message-request', request);
  }
  
  res.json({ success: true, requestId: request.id });
});

app.post('/respond-to-request', (req, res) => {
  const { requestId, userId, accept } = req.body;
  
  if (!requestId || !userId || accept === undefined) {
    return res.status(400).json({ error: 'Request ID, user ID, and accept status are required' });
  }

  const requests = messageRequests.get(userId) || [];
  const requestIndex = requests.findIndex(r => r.id === requestId);
  
  if (requestIndex === -1) {
    return res.status(404).json({ error: 'Request not found' });
  }

  const request = requests[requestIndex];
  request.status = accept ? 'accepted' : 'declined';
  
  saveData();

  if (accept) {
    const fromUser = Array.from(users.values()).find(u => u.id === request.fromUserId);
    if (fromUser && fromUser.online) {
      io.to(fromUser.socketId).emit('request-accepted', { requestId, userId });
    }
  }

  res.json({ success: true });
});

app.get('/message-requests/:userId', (req, res) => {
  const userId = req.params.userId;
  const requests = messageRequests.get(userId) || [];
  
  res.json(requests.filter(r => r.status === 'pending'));
});

app.get('/chats/:userId', (req, res) => {
  const userId = req.params.userId;
  const chats = userChats.get(userId) || [];
  
  res.json(chats);
});

app.get('/group-members/:groupId', (req, res) => {
  const groupId = req.params.groupId;
  const group = groups.get(groupId);
  
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }
  
  const membersWithStatus = group.members.map(memberId => {
    const user = Array.from(users.values()).find(u => u.id === memberId);
    return {
      id: memberId,
      name: user ? user.name : null,
      displayName: user ? user.displayName : null,
      online: user ? user.online : false
    };
  }).filter(member => member.name !== null);
  
  res.json(membersWithStatus);
});

app.post('/save-chat', (req, res) => {
  const { userId, chatWith, displayName, type, groupId } = req.body;
  
  if (!userId || !chatWith || !displayName || !type) {
    return res.status(400).json({ error: 'User ID, chat with, display name, and type are required' });
  }

  let chats = userChats.get(userId) || [];
  
  const chatKey = groupId || chatWith;
  const existingChatIndex = chats.findIndex(chat => 
    (chat.groupId && chat.groupId === chatKey) || 
    (!chat.groupId && chat.chatWith === chatWith)
  );
  
  if (existingChatIndex === -1) {
    chats.push({
      chatWith,
      displayName,
      type,
      groupId: groupId || null,
      lastMessage: null,
      timestamp: new Date().toISOString()
    });
    
    userChats.set(userId, chats);
    saveData();
  }
  
  res.json({ success: true });
});

app.post('/remove-chat', (req, res) => {
  const { userId, chatWith, groupId } = req.body;
  
  if (!userId || (!chatWith && !groupId)) {
    return res.status(400).json({ error: 'User ID and chat identifier are required' });
  }

  let chats = userChats.get(userId) || [];
  
  const chatKey = groupId || chatWith;
  chats = chats.filter(chat => 
    !((chat.groupId && chat.groupId === chatKey) || 
      (!chat.groupId && chat.chatWith === chatWith))
  );
  
  userChats.set(userId, chats);
  saveData();
  
  res.json({ success: true });
});

app.post('/add-user-to-group', (req, res) => {
  const { groupId, userId, targetUsername } = req.body;
  
  if (!groupId || !userId || !targetUsername) {
    return res.status(400).json({ error: 'Group ID, user ID, and target username are required' });
  }

  const group = groups.get(groupId);
  const targetUser = users.get(targetUsername);
  
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }
  
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  if (!group.members.includes(userId)) {
    return res.status(403).json({ error: 'You are not a member of this group' });
  }
  
  if (!group.members.includes(targetUser.id)) {
    group.members.push(targetUser.id);
    
    const chatData = {
      chatWith: group.name,
      displayName: group.name,
      type: 'group',
      groupId: group.id,
      lastMessage: null,
      timestamp: new Date().toISOString()
    };
    
    if (!userChats.has(targetUser.id)) {
      userChats.set(targetUser.id, []);
    }
    
    const userChatList = userChats.get(targetUser.id);
    const existingChat = userChatList.find(chat => chat.groupId === groupId);
    
    if (!existingChat) {
      userChatList.push(chatData);
    }
    
    saveData();
    
    if (targetUser.online) {
      io.to(targetUser.socketId).emit('added-to-group', {
        groupId,
        groupName: group.name
      });
    }
    
    res.json({ success: true });
  } else {
    res.json({ success: true, message: 'User already in group' });
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('login', (data) => {
    const { name } = data;
    const user = users.get(name);
    
    if (user) {
      user.online = true;
      user.socketId = socket.id;
      socket.userId = user.id;
      socket.userName = name;
      
        socket.emit('login-success', {
        userId: user.id,
        displayName: user.displayName,
        phoneNumber: user.phoneNumber
      });
      
      io.emit('user-online', { name, displayName: user.displayName });

      const pendingRequests = messageRequests.get(user.id) || [];
      socket.emit('pending-requests', pendingRequests.filter(r => r.status === 'pending'));
    }
  });

  socket.on('send-message', (data) => {
    const { to, message, type } = data;
    const sender = users.get(socket.userName);
    
    if (!sender) return;

    const messageData = {
      id: uuidv4(),
      from: sender.id,
      fromName: sender.displayName,
      to,
      message,
      type,
      timestamp: new Date().toISOString()
    };

    if (type === 'private') {
      const recipient = Array.from(users.values()).find(u => u.name === to);
      if (recipient) {
        messages.get(recipient.id).push(messageData);
        messages.get(sender.id).push(messageData);
        if (recipient.online) {
          io.to(recipient.socketId).emit('new-message', messageData);
        }
      }
    } else if (type === 'group') {
      const group = groups.get(to);
      if (group && group.members.includes(sender.id)) {
        group.messages.push(messageData);
        group.members.forEach(memberId => {
          const member = Array.from(users.values()).find(u => u.id === memberId);
          if (member && member.online && member.id !== sender.id) {
            io.to(member.socketId).emit('new-message', messageData);
          }
        });
      }
    }
    
    saveData();
  });

  socket.on('get-messages', (data) => {
    const { chatWith, type } = data;
    const sender = users.get(socket.userName);
    
    if (!sender) return;

    let chatMessages = [];
    
    if (type === 'private') {
      const recipient = Array.from(users.values()).find(u => u.name === chatWith);
      if (recipient) {
        chatMessages = messages.get(recipient.id).filter(msg => 
          msg.from === sender.id || msg.to === recipient.id
        );
      }
    } else if (type === 'group') {
      const group = groups.get(chatWith);
      if (group && group.members.includes(sender.id)) {
        chatMessages = group.messages;
      }
    }
    
    socket.emit('messages', chatMessages);
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.userName);
    if (user) {
      user.online = false;
      user.socketId = null;
      io.emit('user-offline', { name: socket.userName, displayName: user.displayName });
    }
    console.log('User disconnected:', socket.id);
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
