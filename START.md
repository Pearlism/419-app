# 🚀 Quick Start Guide - 419 Chat

Get your chat app running in 2 minutes!

## Step 1: Install Everything

Open a terminal in the project root (`new app` folder) and run:

```bash
npm run install:all
```

This installs all dependencies for both backend and frontend.

## Step 2: Start the App

In the same terminal, run:

```bash
npm start
```

You should see:
```
[0] Server running on port 3001
[1] 
[1] ┌────────────────────────────────────────┐
[1] │                                        │
[1] │   Serving!                             │
[1] │                                        │
[1] │   Local:  http://localhost:3000        │
[1] │                                        │
[1] └────────────────────────────────────────┘
```

## Step 3: Open Your Browser

The app will automatically open at:
```
http://localhost:3000
```

If not, manually open your browser and go to that URL.

## 🎉 That's It!

You should see the beautiful 419 Chat login screen!

---

## What Just Happened?

- ✅ Backend server started on `http://localhost:3001`
- ✅ Frontend server started on `http://localhost:3000`
- ✅ Both are running simultaneously

## Create Your First Account

1. **Click "Register"** (if not already there)
2. **Enter:**
   - Username: `alice` (used for login)
   - Display Name: `Alice` (what others see)
   - Password: `password123` (min 6 chars)
3. **Click "Create Account"**
4. **Note your phone number** - it's auto-generated!

## Test It Out

**Open another browser tab** or **incognito window**:
1. Go to `http://localhost:3000`
2. Create another account (e.g., username: `bob`)
3. Search for the first user's username or phone
4. Send a message request
5. Switch to first tab and accept it
6. Start chatting! 💬

---

## Alternative: Start Separately

If you prefer to run backend and frontend separately:

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm start
```

---

## Troubleshooting

### Port Already in Use?

Kill the processes:
```bash
npx kill-port 3000 3001
```

Then run `npm start` again.

### Module Not Found?

Run the install again:
```bash
npm run install:all
```

### Still Not Working?

1. Make sure Node.js is installed: `node --version`
2. Make sure npm is installed: `npm --version`
3. Close all terminals and try again
4. Check the console for error messages

---

## 📱 Mobile Testing

Want to test on your phone?

1. Find your computer's local IP (e.g., `192.168.1.100`)
2. On your phone, go to `http://YOUR-IP:3000`
3. Make sure phone and computer are on same WiFi network

---

## Stop the App

Press `Ctrl + C` in the terminal where you ran `npm start`

---

**Need more help?** Check the main `README.md` file for detailed documentation!

Happy chatting! 💬✨

