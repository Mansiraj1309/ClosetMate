# ClosetMate Requirements

You asked for a `requirements.txt`. Since we are using JavaScript/Node.js instead of Python, dependencies are managed across two `package.json` files (one for backend, one for frontend). 

## 🚨 Required Software to Install
I checked your system and noticed you **do not have Node.js installed**. You must install it to run this project!

1. **Node.js (LTS Version)**
   - **Download Link**: [https://nodejs.org/](https://nodejs.org/)
   - Download the "LTS" (Long Term Support) Windows Installer (`.msi`).
   - Run the installer with all default settings (Make sure "Add to PATH" is checked).
   - This will install both `node` and `npm` (Node Package Manager).

2. **Git**
   - You already have Git installed (`version 2.53.0.windows.1`)! I have initialized the repository.

## 📦 Project Dependencies
I have already set up the dependency lists (`package.json`) in the `frontend` and `backend` folders for you. 

Once you install Node.js, you just need to run these commands in your terminal:

**To install Backend Dependencies:**
```bash
cd backend
npm install
```
*(This installs: express, mongoose, dotenv, cors, cloudinary, multer, @google/genai)*

**To install Frontend Dependencies:**
```bash
cd frontend
npm install
```
*(This installs: react, react-dom, react-router-dom, lucide-react, vite)*

## 🔗 Linking to GitHub
I have already run `git init` locally for you. To link it to your GitHub:
1. Go to [github.com](https://github.com/) and create a new empty repository named `ClosetMate`.
2. Copy the URL it gives you (e.g., `https://github.com/yourusername/ClosetMate.git`).
3. Run this command in the `d:\Work\Projects\ClosetMate` folder:
   ```bash
   git remote add origin YOUR_GITHUB_URL_HERE
   ```
4. Then push the code:
   ```bash
   git add .
   git commit -m "Initial commit: Foundation and Setup"
   git push -u origin master
   ```
