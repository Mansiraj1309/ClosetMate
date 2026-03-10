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
├── backend/                   # Node.js + Express API server
│   ├── config/
│   │   └── cloudinary.js      # Cloudinary + Multer setup for image uploads
│   ├── models/
│   │   └── Item.js            # Mongoose schema for a clothing item
│   ├── routes/
│   │   ├── wardrobe.js        # CRUD API for clothing items
│   │   └── stylist.js         # AI recommendation endpoint (Gemini)
│   ├── .env                   # Secret keys (MongoDB, Cloudinary, Gemini)
│   ├── package.json
│   └── server.js              # Express entry point — glues everything together
├── frontend/                  # React (Vite) application
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddItemModal.jsx   # Modal form to upload & tag new clothes
│   │   │   └── AddItemModal.css
│   │   ├── pages/
│   │   │   ├── Wardrobe.jsx       # Gallery view of all saved items
│   │   │   ├── Wardrobe.css
│   │   │   ├── Stylist.jsx        # AI Stylist chat page
│   │   │   └── Stylist.css
│   │   ├── App.jsx                # React Router + Navigation
│   │   ├── main.jsx               # React DOM entry point
│   │   └── index.css              # Global design system (colors, fonts, layout)
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── docs/phases/               # Archived implementation plans per phase
│   ├── Phase1.md
│   └── Phase2.md
├── task.md                    # Live task checklist
└── README.md
```

---

## 🧩 Architecture Deep Dive

Below is a detailed breakdown of **every service and technology** connected to the project and what each one does.

### 1. 🖥️ Frontend — React + Vite (`frontend/`)

**What it is:** The user-facing web interface — everything you see in the browser at `http://localhost:3000`.

**Key technologies inside it:**

| Technology | What it does |
|---|---|
| **React** | A JavaScript library for building interactive UI components. Every page (Dashboard, Wardrobe, Stylist) is a React component. |
| **Vite** | The build tool that serves the React app during development with instant hot-reload. When you edit a file, Vite instantly refreshes the browser. |
| **React Router DOM** | Handles client-side navigation. When you click "Wardrobe" or "AI Stylist" in the nav bar, React Router swaps the page content *without* reloading the browser — this is what makes it feel like a native app. |
| **Lucide React** | Provides the beautiful icons (✨ sparkles, 👔 shirt, 📅 calendar, etc.). |
| **Vanilla CSS** | Custom hand-written CSS with a design system using CSS variables (`:root`), glassmorphism, gradients, and micro-animations. |

**How it connects to the backend:**
The frontend uses JavaScript's built-in `fetch()` API to send HTTP requests to the backend at `http://localhost:5000`. For example:
- `fetch('http://localhost:5000/api/wardrobe')` → asks the backend to retrieve all saved clothing items.
- `fetch('http://localhost:5000/api/stylist/recommend')` → asks the backend to generate an AI outfit recommendation.

---

### 2. ⚙️ Backend — Node.js + Express (`backend/server.js`)

**What it is:** The "brain" that sits between the frontend and all external services (database, image storage, AI). It receives requests from the frontend, processes them, talks to MongoDB/Cloudinary/Gemini, and sends results back.

**Key file:** `server.js` — This is the main entry point. Here's what each line does:

| Code in `server.js` | Purpose |
|---|---|
| `express()` | Creates the web server that listens for HTTP requests. |
| `app.use(cors())` | **CORS Middleware** — Allows the frontend (port 3000) to talk to the backend (port 5000). Without this, the browser would block the requests for security reasons. |
| `app.use(express.json())` | **JSON Parser** — Tells Express to automatically parse incoming JSON data from the frontend's `fetch()` calls. |
| `app.use('/api/wardrobe', ...)` | Registers the wardrobe routes — any request to `/api/wardrobe` is handled by `routes/wardrobe.js`. |
| `app.use('/api/stylist', ...)` | Registers the AI stylist routes — any request to `/api/stylist` is handled by `routes/stylist.js`. |
| `mongoose.connect(...)` | **Connects to MongoDB** at startup. |
| `app.listen(PORT)` | Starts the server on port 5000. |

---

### 3. 🗄️ MongoDB — The Database

**What it is:** A NoSQL document database that stores all your clothing item data persistently.

**When does it connect?** The connection is established **the moment you run `npm run dev` in the backend folder**. Line 21 of `server.js` calls `mongoose.connect(...)`. If it succeeds, you see `✅ Connected to MongoDB` in the terminal. If it fails (e.g., MongoDB isn't running), you see `❌ MongoDB connection error`.

**What it stores:** Every clothing item you add is saved as a "document" in MongoDB. Each document looks like this:

```json
{
  "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v123/closetmate/shirt.jpg",
  "cloudinaryId": "closetmate_wardrobe/abc123",
  "category": "tops",
  "color": "Navy Blue",
  "season": "all-season",
  "formality": "smart-casual",
  "styleNotes": "Favorite silk shirt for dates",
  "createdAt": "2026-03-02T00:00:00.000Z"
}
```

**Why we need it:** Without MongoDB, every time you restart the app, all your clothing data would be lost. MongoDB persists it permanently on disk so your wardrobe survives restarts, reloads, and even system reboots.

**Important:** You need MongoDB running locally, or you can use a free cloud-hosted MongoDB via [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and paste the connection string into `MONGODB_URI` in your `.env` file.

---

### 4. 🖼️ Cloudinary — Image Storage

**What it is:** A cloud-based image hosting service. When you upload a photo of your shirt, that image file is NOT stored on your computer or in MongoDB — it is uploaded to Cloudinary's servers and they give us back a permanent URL.

**How it works step-by-step:**
1. You click "Add New Item" and select a photo.
2. The frontend sends the photo as a `multipart/form-data` request to the backend.
3. **Multer** (a Node.js middleware) intercepts the raw file upload.
4. **multer-storage-cloudinary** (a plugin) takes that file and uploads it directly to your Cloudinary account, into a folder called `closetmate_wardrobe`.
5. Cloudinary responds with a permanent URL (e.g., `https://res.cloudinary.com/...`).
6. We save that URL string into MongoDB alongside the item's details.

**Why we need it:** Storing images directly in a database is slow and expensive. Cloudinary is optimized for images — it compresses them, serves them via CDN (fast loading worldwide), and even lets us transform them (resize, crop) on the fly.

---

### 5. 🤖 Google Gemini API — The AI Engine

**What it is:** Google's powerful large language model (LLM). We use the `gemini-2.5-flash` model to act as a fashion stylist.

**How it works step-by-step:**
1. You go to the "AI Stylist" page and type: *"I have a wedding reception tonight"*.
2. The frontend sends `{ occasion: "I have a wedding reception tonight" }` to `POST /api/stylist/recommend`.
3. The backend fetches ALL your wardrobe items from MongoDB.
4. It constructs a detailed prompt: *"You are an expert fashion stylist. Here is the user's wardrobe: [list of items]. They are attending: [occasion]. Pick the best outfit."*
5. It sends this prompt to the Gemini API.
6. Gemini responds with a JSON object containing: which items to wear, a style rationale, and a shopping recommendation.
7. The backend fetches the full item details (including images) from MongoDB and sends everything back to the frontend.
8. The frontend renders beautiful outfit cards with the AI's explanation.

**The API Key** (`GEMINI_API_KEY` in `.env`) is your personal authentication token from [Google AI Studio](https://aistudio.google.com/app/apikey). It tells Google your app is authorized to use Gemini.

---

### 6. 🔄 How Everything Connects — The Full Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│                     http://localhost:3000                        │
│                                                                 │
│   ┌───────────┐    ┌───────────┐    ┌──────────────┐            │
│   │ Dashboard │    │ Wardrobe  │    │  AI Stylist  │            │
│   └───────────┘    └─────┬─────┘    └──────┬───────┘            │
│                          │                 │                    │
│           fetch() calls to localhost:5000                        │
└──────────────────────────┼─────────────────┼────────────────────┘
                           │                 │
                           ▼                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                     EXPRESS.JS SERVER                             │
│                     http://localhost:5000                         │
│                                                                  │
│   server.js  ──►  /api/wardrobe (wardrobe.js)                    │
│              ──►  /api/stylist  (stylist.js)                      │
│                        │               │                         │
│                        ▼               ▼                         │
│              ┌──────────────┐  ┌──────────────┐                  │
│              │   MongoDB    │  │ Gemini API   │                  │
│              │ (stores data)│  │ (generates   │                  │
│              └──────┬───────┘  │  outfits)    │                  │
│                     │          └──────────────┘                   │
│              ┌──────┴───────┐                                    │
│              │  Cloudinary  │                                    │
│              │ (stores      │                                    │
│              │  images)     │                                    │
│              └──────────────┘                                    │
└──────────────────────────────────────────────────────────────────┘
```

**In short:**
- **MongoDB** = permanent storage for clothing metadata (color, category, season, etc.)
- **Cloudinary** = permanent storage for clothing images (photos of your shirts, shoes, etc.)
- **Gemini API** = the AI brain that reads your wardrobe data and generates outfit ideas
- **Express.js** = the traffic controller that connects all three services and talks to the frontend
- **React** = the beautiful interface you see and interact with
