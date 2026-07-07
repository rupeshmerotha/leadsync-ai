# LeadSync AI – Developer Guide

A production-ready, full-stack Next.js web application that empowers users to upload arbitrary CSV files and utilizes AI (Groq + Llama-3.3-70B) to intelligently and semantically map unpredictable columns into a strict, predefined CRM schema.

**Deployed Link:** [https://leadsync-ai-beryl.vercel.app/](https://leadsync-ai-beryl.vercel.app/)

---

## 🎯 Architecture & Approach

This project strictly adheres to clean architectural principles by separating concerns across the frontend UI, API routing, and AI integration layers.

### 1. Frontend Layer (Next.js App Router + React + Tailwind)
- **`src/app/page.tsx`**: The main entry point. It handles client-side state transitions (Upload -> Preview -> Processing -> Results).
- **`src/components/FileUpload.tsx`**: A highly accessible Drag & Drop zone strictly accepting `.csv` files.
- **`src/components/DataTable.tsx`**: A responsive, horizontally-scrollable table component with sticky headers. It is reused for both *previewing* raw CSV data and *displaying* the final CRM mapped results.
- **Client-Side Parsing**: The app leverages `papaparse` directly on the browser to parse the uploaded CSV immediately, allowing the user to preview exactly what they uploaded without hitting the server or incurring latency.

### 2. Backend Layer (Next.js API Routes)
- **`src/app/api/import/route.ts`**: The main serverless endpoint.
  - It extracts the `FormData` file uploaded from the client.
  - It parses the CSV file cleanly on the server backend.
  - **Batching Strategy**: LLMs have token limits and can hallucinate when fed massive arrays of data. This route safely chunks the raw CSV into manageable batches (e.g., 50 records at a time) and passes them to the AI layer sequentially.
  - **Data Validation & Filtering**: After mapping is complete, it evaluates each record against strict rules (e.g., if a record lacks both an `email` and a `mobile_without_country_code`, it drops it and increments a `skipped` counter).

### 3. AI Layer (Groq API + `openai` SDK)
- **`src/lib/ai/mapper.ts`**: The AI processing engine.
  - It uses Groq's extremely fast `llama-3.3-70b-versatile` model.
  - **Prompt Engineering**: The `SYSTEM_INSTRUCTION` is heavily tuned. It explicitly instructs the AI on semantic matching (e.g. mapping "Cell" to `mobile`), forces it to respect predefined Enum constraints (like `GOOD_LEAD_FOLLOW_UP`), and provides complex logic like extracting secondary emails into a `crm_note` field.
  - **Structured Outputs**: It strictly enforces a JSON format using `{ type: "json_object" }`, guaranteeing that the response from the LLM maps perfectly into the TypeScript `CRMRecord` interface.
  - **Retry Mechanism**: A robust `while` loop intercepts network errors and rate limits, automatically retrying up to 3 times with exponential backoff.

---

## 🚀 Step-by-Step Setup Instructions

This project is incredibly simple to start. You do not need to configure any databases. 

### Step 1: Clone & Install Dependencies
Ensure you have Node.js (v18+) installed, then install all project dependencies:
```bash
npm install
```

### Step 2: Get a Free Groq API Key
Because Open-AI and Gemini often require billing setups or suffer from region restrictions, this project uses **Groq** for blazing-fast, 100% free AI inference.
1. Go to [GroqCloud Console](https://console.groq.com/keys).
2. Login with your Google or GitHub account.
3. Click **Create API Key** and copy the string (it starts with `gsk_`).

### Step 3: Configure Environment Variables
Create a file named **`.env.local`** at the absolute root of this project folder:
```bash
touch .env.local
```
Open it and paste your API key inside:
```env
GROQ_API_KEY=gsk_your_api_key_here
```
*(Note: If you do not provide this file, the app will gracefully fall back to a "Mock Simulator" so you can still test the UI).*

### Step 4: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. 
- Try dragging and dropping a messy CSV file into the upload zone.
- Click **Confirm Import** and watch the AI seamlessly organize your unstructured data into clean CRM JSON!

---

## 🎨 UI Features
- **Dark Mode by Default**: We've included a sleek Dark mode out of the box using Tailwind CSS `dark:` classes. You can toggle between light and dark modes using the **Sun/Moon** button in the top right corner!
- **Micro-interactions**: We have added loading spinners, hover states, and smooth color transitions to make the application feel highly responsive and premium.

---

## ☁️ Deployment (Vercel)
This architecture is 100% ready for production deployment on Vercel without any modifications.
1. Push your repository to GitHub.
2. Sign into [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository.
4. Under **Environment Variables**, add `GROQ_API_KEY` and paste your key.
5. Click **Deploy**. Within 2 minutes, your LeadSync AI instance will be live on the web!
