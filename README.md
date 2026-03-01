# ClosetMate 🌟

A premium AI-powered virtual wardrobe and personal stylist application. Built with a monolithic Full-Stack architecture to deliver personalized outfit recommendations effortlessly.

## 🚀 Tech Stack

*   **Frontend**: React, Vite, Lucide React (Responsive PWA)
*   **Styling**: Premium Custom Vanilla CSS (Dark Mode, Glassmorphism, Micro-animations)
*   **Backend**: Node.js, Express.js
*   **Database**: MongoDB
*   **Image Storage**: Cloudinary
*   **AI Engine**: Google GenAI API (`@google/genai`)

## 🛠️ Installation & Setup

Before starting, ensure you have **Node.js** installed on your system.

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/[your-github-username]/ClosetMate.git
    cd ClosetMate
    ```

2.  **Install Backend Dependencies**
    ```bash
    cd backend
    npm install
    ```

3.  **Install Frontend Dependencies**
    ```bash
    cd ../frontend
    npm install
    ```

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory using the provided `.env` template:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/closetmate

# Cloudinary Keys
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI Keys
GEMINI_API_KEY=your_gemini_api_key
```

## 🏃‍♂️ Running the Application

To run the application locally, you'll need two separate terminal windows.

**Terminal 1 (Backend - API):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend - Web UI):**
```bash
cd frontend
npm run dev
```

The frontend will start at `http://localhost:3000` and the backend will start at `http://localhost:5000`.

## 📁 Project Structure

```text
ClosetMate/
├── backend/          # Node.js + Express API server
│   ├── models/       # MongoDB Schemas
│   ├── routes/       # API Endpoints
│   ├── .env          # Secrets
│   └── server.js     # Entry point
└── frontend/         # React application
    ├── src/          # React Components and Pages
    ├── index.css     # Global Styles
    └── vite.config.js
```
