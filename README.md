# 419 Chat 💬

A beautiful, modern real-time messaging application with stunning glassmorphism design, smooth animations, and seamless user experience.

![Chat App](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)

## ✨ Features

### Core Functionality
- 🔄 **Real-time Messaging** - Instant message delivery using Socket.IO
- 🔐 **User Authentication** - Secure registration and login system with bcrypt
- 💬 **Private Chats** - One-on-one conversations
- 👥 **Group Chats** - Create and manage group conversations
- 📨 **Message Requests** - Control who can message you
- 🔍 **User Search** - Find users by username or phone number
- 🟢 **Online Status** - See who's currently online
- 💾 **Persistent Storage** - All data saved to JSON files

### Modern UI/UX
- 🎨 **Glassmorphism Design** - Beautiful frosted glass effects
- 🌈 **Gradient Animations** - Smooth, animated backgrounds
- ✨ **Smooth Transitions** - Professional animations throughout
- 📱 **Fully Responsive** - Perfect on mobile, tablet, and desktop
- 🌙 **Dark Theme** - Sleek dark design with cyan accents
- 🔔 **Toast Notifications** - Beautiful notification system
- ⏳ **Loading States** - Visual feedback for all operations

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation & Setup

**Option 1: Start Everything at Once (Recommended)**

```bash
# Install all dependencies
npm run install:all

# Start both backend and frontend
npm start
```

This will:
- Start the backend server on `http://localhost:3001`
- Start the frontend on `http://localhost:3000`
- Open automatically in your browser

**Option 2: Start Separately**

```bash
# Terminal 1 - Backend
cd backend
npm install
npm start

# Terminal 2 - Frontend
cd frontend
npm install
npm start
```

### First Time Use

1. **Open your browser** to `http://localhost:3000`
2. **Create an account**
   - Enter a unique username
   - Set your display name
   - Create a password (min 6 characters)
   - Note your auto-generated phone number
3. **Test it out** - Open another browser tab and create a second account
4. **Start chatting** - Search for users and send message requests!

## 📁 Project Structure

```
new app/
├── backend/                 # Backend server
│   ├── server.js           # Express + Socket.IO server
│   ├── package.json        # Backend dependencies
│   ├── users.json          # User data
│   ├── messages.json       # Message history
│   ├── groups.json         # Group data
│   ├── messageRequests.json# Message requests
│   └── chats.json          # User chat lists
├── frontend/               # Frontend application
│   ├── index.html          # Main HTML file
│   ├── styles.css          # All styling (2000+ lines!)
│   ├── app.js              # Application logic
│   └── package.json        # Frontend dependencies
├── package.json            # Root package (runs both)
└── README.md               # This file
```

## 🎮 Available Scripts

### Root Directory
- `npm start` - Start both backend and frontend
- `npm run start:backend` - Start only backend server
- `npm run start:frontend` - Start only frontend server
- `npm run install:all` - Install all dependencies

### Backend (`/backend`)
- `npm start` - Start the backend server
- `npm run dev` - Start with nodemon (auto-reload)

### Frontend (`/frontend`)
- `npm start` - Serve frontend on localhost:3000
- `npm run dev` - Same as start

## 🎨 Design System

### Colors
- **Primary**: `#00d9ff` (Cyan)
- **Secondary**: `#8b5cf6` (Purple)
- **Accent**: `#ec4899` (Pink)
- **Success**: `#10b981` (Green)
- **Error**: `#ef4444` (Red)
- **Background**: `#0f1419` (Dark)

### Key Visual Features
- Glassmorphism cards with backdrop blur
- Gradient buttons with hover effects
- Animated message bubbles
- Pulsing notification badges
- Smooth screen transitions
- Beautiful empty states
- Modern loading spinner

## 📱 Mobile Support

Perfect responsive design with optimized layouts for:
- 📱 **Phones** (320px - 768px)
- 📱 **Small Phones** (≤480px)
- 💻 **Tablets** (769px - 1024px)
- 🖥️ **Desktop** (1025px+)
- 📱 **Landscape Mode** - Optimized layouts
- 📲 **Touch Devices** - No accidental zooms, perfect tap targets

### Mobile Features
- ✅ No zoom on input focus
- ✅ Touch-optimized buttons (44x44px minimum)
- ✅ Swipe-friendly sidebar
- ✅ Full-screen web app mode on iOS
- ✅ Theme color in browser chrome
- ✅ Safe area support for notched devices

## 🔧 Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern CSS with custom properties, animations
- **JavaScript (ES6+)** - Modern JavaScript with classes
- **Socket.IO Client** - Real-time communication
- **Font Awesome 6** - Icons
- **Inter Font** - Typography

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **Socket.IO** - WebSocket library
- **bcryptjs** - Password hashing
- **jsonfile** - Data persistence
- **CORS** - Cross-origin support
- **UUID** - Unique identifiers

## 🌟 How to Use

### Starting a Private Chat
1. Click the search bar
2. Enter a username or phone number
3. Click on the search result
4. Send a message request
5. Wait for acceptance
6. Start chatting!

### Creating a Group
1. Click the group icon (👥) in the sidebar
2. Enter a group name
3. Click "Create Group"
4. Use "Add to Group" to invite members

### Managing Message Requests
1. Click the notification icon (bell with badge)
2. Review pending requests
3. Accept or decline each request
4. Accepted requests become active chats

### Mobile Navigation
- **Hamburger Menu** (☰) - Toggle sidebar
- **Back Arrow** (←) - Return to chat list
- All features accessible on mobile!

## 🎯 Port Configuration

- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:3001`

To change ports, edit:
- Frontend: `frontend/package.json` - change `-l 3000`
- Backend: `backend/server.js` - change `PORT` constant

## 💡 Tips & Tricks

1. **Multiple Accounts**: Use different browsers/incognito windows
2. **Mobile Testing**: Use Chrome DevTools device emulation
3. **Real-time**: Both users must be online for instant delivery
4. **Persistence**: All data saves automatically to JSON files
5. **Password**: Minimum 6 characters required
6. **Search**: Works with exact username or phone number

## 🐛 Troubleshooting

**Can't connect?**
- Ensure backend is running on port 3001
- Check no other app is using the port
- Verify firewall settings

**Messages not sending?**
- Both users must be online
- Check browser console for errors
- Try refreshing the page

**Port already in use?**
- Kill the process: `npx kill-port 3000 3001`
- Or change ports in config files

**Frontend not loading?**
- Make sure you ran `npm install` in frontend folder
- Try clearing browser cache
- Check console for errors

## 🔒 Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Input validation on client and server
- ✅ CORS protection
- ✅ No sensitive data in localStorage
- ✅ Secure WebSocket connections

## 📊 Data Storage

All data is stored in JSON files in the `backend` directory:
- `users.json` - User accounts and credentials
- `messages.json` - Private message history
- `groups.json` - Group information and messages
- `messageRequests.json` - Pending and processed requests
- `chats.json` - User chat lists

## 🎨 Customization

### Change Colors
Edit `frontend/styles.css` root variables:
```css
:root {
    --primary-color: #00d9ff;
    --secondary-color: #8b5cf6;
    /* ... more colors ... */
}
```

### Change App Name
Edit `frontend/index.html`:
- Page title
- Header text

### Change Ports
- Frontend: `frontend/package.json` script
- Backend: `backend/server.js` PORT constant

## 🚧 Future Enhancements

- [ ] Image and file sharing
- [ ] Voice messages
- [ ] Video calls
- [ ] End-to-end encryption
- [ ] Message search
- [ ] Read receipts
- [ ] User avatars
- [ ] Message reactions
- [ ] Message editing/deletion
- [ ] User blocking
- [ ] Theme customization

## 📜 License

MIT License - Feel free to use for personal or commercial projects!

## 🤝 Contributing

This is a personal project, but feel free to fork and customize!

## 💬 Support

Having issues? Check the troubleshooting section or review the console logs for detailed error messages.

---

**Built with ❤️ using modern web technologies**

Enjoy your beautiful 419 Chat! 🎉

