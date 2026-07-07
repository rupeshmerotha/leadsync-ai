# Comprehensive Guide & Interview Preparation: LeadSync AI

## 1. High-Level Overview
LeadSync AI is a modern web application designed to solve a common but complex problem in CRM systems: importing unstructured, messy CSV data with unpredictable column names into a strict, predefined database schema. 

Instead of forcing the user to manually map columns (e.g., matching "Customer Mail ID" to "email") or write complex regex parsers, this application uses a Large Language Model (LLM) to semantically understand the data and map it automatically. 

## 2. Architecture
The application is built using a modern **full-stack architecture** centered around **Next.js 15+ (App Router)**.
*   **Frontend (Client):** Built with React and styled using Tailwind CSS v4. It handles file selection, basic local parsing for preview (using PapaParse), state management, and displaying results.
*   **Backend (Server):** Next.js Server API Routes (`/api/import`). It receives the uploaded file, parses the CSV, chunks the data to avoid AI context limits, and coordinates with the AI provider.
*   **AI Layer:** Uses the Groq API (via the OpenAI SDK) leveraging the `llama-3.3-70b-versatile` model. Groq is used for its blazing-fast inference speeds, which is critical when processing data synchronously in an HTTP request.

## 3. Folder Structure & Key Files
*   `src/app/page.tsx`: The main frontend application file. Holds all state (file, preview data, processing status, results) and orchestrates the user interface.
*   `src/app/layout.tsx` & `globals.css`: Defines the global HTML structure and imports Tailwind CSS. Includes dark mode support.
*   `src/app/api/import/route.ts`: The backend API endpoint. Handles the `POST` request, parses the CSV, chunks the data, calls the AI mapper, filters invalid records, and returns the final payload.
*   `src/lib/ai/mapper.ts`: The core AI integration logic. Contains the AI prompt (`SYSTEM_INSTRUCTION`), the OpenAI client setup (pointed to Groq), the retry logic, and a fallback mock response if no API key is present.
*   `src/components/FileUpload.tsx`: A reusable drag-and-drop file upload component.
*   `src/components/DataTable.tsx`: A reusable table component for rendering dynamic data (used for both the preview and the final results).
*   `package.json`: Manages dependencies (Next.js, React, Tailwind, PapaParse, OpenAI SDK, Lucide React).

## 4. End-to-End Execution Flow
### Frontend Flow (User Interaction)
1.  **Upload:** User drags and drops a CSV file into `<FileUpload />`.
2.  **Preview:** The frontend uses `Papa.parse` to parse the file locally in the browser. It extracts the headers and the first few rows to display a preview using `<DataTable />`.
3.  **Confirm:** User clicks "Confirm Import". 
4.  **Transport:** The file is appended to a `FormData` object and sent via a `POST` request to `/api/import`. The UI enters a `processing` state (showing a spinner).

### Backend Flow (API Route)
1.  **Receive:** `/api/import/route.ts` receives the `FormData` and extracts the file.
2.  **Parse:** The backend reads the file text and parses it again using `Papa.parse`.
3.  **Batching:** The parsed records (array of JSON objects) are divided into chunks of 50 records using the `chunkArray` utility.
4.  **AI Mapping:** For each batch, the API calls `processBatch()` in `mapper.ts`.
5.  **Validation:** After all batches are processed, the API iterates through the mapped records. It uses `isValidRecord` to check if the record has at least an email or a mobile number. If not, it is marked as "skipped".
6.  **Response:** The API returns a JSON object containing `{ success, imported, skipped, records }`.

### AI Integration Flow
1.  `processBatch` receives an array of up to 50 raw JSON objects.
2.  It serializes the array to a JSON string and sends it to the Groq API alongside the `SYSTEM_INSTRUCTION` (the prompt).
3.  The request explicitly demands a JSON response (`response_format: { type: "json_object" }`).
4.  The LLM processes the semantics of the column names and maps them to the strict CRM schema.
5.  If the API call fails (e.g., rate limit, timeout), a `while` loop catches the error and retries up to 3 times with a 2-second delay.
6.  The response is parsed back into JavaScript objects and returned to the API route.

## 5. Deep Dive: Key Technical Decisions

### Technology Stack & Why It Was Chosen
*   **Next.js (App Router):** Chosen because it allows us to build both the frontend React application and the backend API in a single repository without setting up a separate Express server.
*   **Tailwind CSS v4:** Allows for rapid, utility-first styling without context-switching between CSS files and JSX. The dark mode is implemented using standard Tailwind classes.
*   **PapaParse:** The industry standard for parsing CSVs in JavaScript. It is fast, handles edge cases (like commas inside quotes), and works in both the browser and Node.js environments.
*   **Groq API (Llama 3.3 70b):** Traditional LLMs (like GPT-4) can be slow for bulk processing. Groq uses specialized LPUs (Language Processing Units) that generate tokens extremely fast. This prevents our Next.js API route from timing out while waiting for the AI to process the CSV.
*   **OpenAI SDK:** The Groq API is fully compatible with the OpenAI SDK. We use the official `openai` npm package but change the `baseURL` to Groq. This prevents vendor lock-in; we can switch to OpenAI just by changing the URL and API key.

### Prompt Engineering Strategy
The `SYSTEM_INSTRUCTION` in `mapper.ts` is the brain of the application. It employs several advanced prompt engineering techniques:
*   **Role Prompting:** "You are an expert AI data mapper."
*   **Few-Shot/Example Prompting:** Giving examples of column names ("Full Name", "Client Name" -> "name").
*   **Constraint Setting (CRITICAL RULES):** Explicitly telling the AI to return empty strings instead of hallucinating, enforcing specific Enum values (e.g., for `crm_status`), and mandating the exact JSON structure.
*   **Structured Output:** Forcing the LLM to output a JSON object containing a `records` array. This is strictly required for programmatic integration.

### Batching & Scalability
Why chunk the data into 50 records per batch?
1.  **Context Limits:** LLMs have a maximum context window. Sending a 10,000-row CSV at once would exceed the token limit.
2.  **Output Limits:** LLMs have limits on how many tokens they can *generate* in a single response (usually 4096 or 8192). 50 records safely fit within this generation limit.
3.  **Accuracy:** Asking an LLM to process too much data at once degrades its reasoning ability ("lost in the middle" phenomenon). Smaller batches yield higher accuracy mapping.

### Validation & Error Handling
*   **Frontend:** Checks if the uploaded file is actually a CSV (`file.type === "text/csv"`).
*   **Backend (API):** Uses `isValidRecord(record)` to ensure the AI actually extracted useful contact info (requires either `email` or `mobile_without_country_code`). If the AI fails to extract these from a row, that row is categorized as "skipped".
*   **API Retries:** Network requests to AI providers fail often. `mapper.ts` wraps the API call in a `try/catch` block inside a `while` loop, giving it 3 attempts before ultimately failing.

### Security & Production Readiness
*   **Vercel maxDuration:** The API route exports `export const maxDuration = 60;`. Serverless functions usually timeout after 10-15 seconds. AI calls can take longer, so we explicitly increase the timeout to 60 seconds.
*   **Environment Variables:** The Groq API key is stored securely in `.env.local` (`process.env.GROQ_API_KEY`) and is only accessed on the server, preventing leakage to the client browser.
*   **Mock Fallback:** If the API key is missing (e.g., local testing without keys), the app gracefully falls back to a deterministic, regex-like mock function to prevent the app from crashing.

---

## 6. Technical Interview Preparation (Q&A)

### Basic / React Questions
**Q: How does the file upload work in this application?**
**A:** We use a custom `FileUpload` React component that utilizes HTML5 Drag and Drop APIs. It listens to `onDrop` and `onDragOver` events. We call `e.preventDefault()` on drag over to stop the browser from simply opening the file. In `onDrop`, we access `e.dataTransfer.files[0]`, validate that it's a CSV, and pass it up to the parent `page.tsx` via a callback. We also have a hidden `<input type="file">` that triggers when the dropzone is clicked.

**Q: Explain how state is managed in `page.tsx`.**
**A:** State is managed locally using the `useState` hook. We track multiple discrete states: the `file` object itself, the `previewData` (parsed locally for the table), a `processing` boolean to show the loading spinner, and `results` to hold the final backend response. Because the state is relatively localized to this specific user flow, `useState` is sufficient; we didn't need complex global state managers like Redux or Zustand.

### Next.js & Backend Questions
**Q: Why did you use Next.js Route Handlers (`/api/import`) instead of doing the AI call on the frontend?**
**A:** Security and architecture. If we called the Groq API from the frontend, we would have to expose our private API key (`GROQ_API_KEY`) to the user's browser, which is a massive security risk. By using a Next.js Server API Route, the request is handled on a secure Node.js server. The frontend sends the CSV to our server, our server securely talks to the AI, and then our server sends the sanitized results back to the frontend.

**Q: You used `const formData = await req.formData()`. Why not just send a JSON payload?**
**A:** Because we are uploading a File object. JSON is a text-based format and cannot easily transmit binary file data without converting it to base64, which is inefficient and increases the payload size by ~33%. `FormData` uses `multipart/form-data` encoding, which is the web standard for efficiently uploading files via HTTP.

### Advanced / Architecture / System Design
**Q: What is the biggest bottleneck in your current architecture, and how would you scale this for a 100,000-row CSV?**
**A:** The biggest bottleneck is that the API route processes the data *synchronously*. The user clicks "Import" and keeps the HTTP connection open while the server loops through batches and waits for the AI. If the file is large, the serverless function will timeout (even with `maxDuration = 60`), or the browser will drop the connection. 
**To scale this:** I would transition to an asynchronous, event-driven architecture. 
1. The API route would immediately upload the CSV to a cloud storage bucket (like AWS S3) and insert a "Job" into a database (e.g., PostgreSQL or Redis) with a status of "Pending". 
2. The API route would instantly return a `jobId` to the frontend.
3. A background worker (using a message queue like RabbitMQ, AWS SQS, or a service like Inngest/Trigger.dev) would pick up the job, download the CSV, do the AI chunking, and update the database with the results.
4. The frontend would poll an endpoint (or use WebSockets/Server-Sent Events) to check the status of `jobId` until it says "Completed".

**Q: How does PapaParse handle large files? Did you consider streams?**
**A:** Currently, we parse the entire text in memory using `await file.text()` and passing it to `Papa.parse`. This is fine for small to medium CSVs (up to a few megabytes). However, for massive files, this would cause Node.js to run out of RAM (OOM errors). If we were scaling this, I would use PapaParse's streaming capabilities on the backend (e.g., piping a Node.js ReadStream into PapaParse), processing chunks as they arrive rather than loading the whole string into memory.

### AI Integration & Prompt Engineering
**Q: Why did you choose Groq (Llama 3.3) over OpenAI's GPT-4o?**
**A:** Speed is the primary factor. Because our architecture currently processes the batches synchronously during an HTTP request, we cannot afford to wait 5-10 seconds per batch that traditional LLMs might take. Groq's LPUs provide inference at hundreds of tokens per second. We sacrifice a tiny bit of reasoning capability (though Llama 3.3 70b is highly capable) for a massive gain in speed, ensuring the HTTP request completes before the timeout.

**Q: Your prompt explicitly asks for a `json_object` format. What happens if the LLM still returns markdown (e.g., \`\`\`json { ... } \`\`\`)?**
**A:** We specifically use the OpenAI SDK's `response_format: { type: "json_object" }` feature. When this is enabled, the API enforces that the output is strictly valid JSON, completely eliminating markdown wrappers or conversational filler like "Here is your data:". We can safely call `JSON.parse()` on the output without needing a regex to strip markdown backticks.

**Q: Explain the retry logic in `mapper.ts`. Why is it necessary?**
**A:** AI APIs are notoriously flaky. They suffer from rate limits (HTTP 429), timeouts (HTTP 504), and occasional internal server errors. If we process a CSV with 10 batches, and the 9th batch fails due to a microsecond network blip, the entire import would fail. The `while` loop with `MAX_RETRIES = 3` and a 2-second timeout acts as a resilience mechanism. It catches the error, waits slightly to let the rate limit reset, and tries again, ensuring a much higher success rate for the overall job.

### Data Manipulation & Validation
**Q: Explain how the `isValidRecord` function works and why it's there.**
**A:** `isValidRecord` is a business-logic gatekeeper. An LLM might successfully map a row, but if that row only contained a "First Name" and a "City" with no contact information, it's useless to a CRM system. The function checks if `email` OR `mobile_without_country_code` exists and is not an empty string. We maintain two counters (`imported` and `skipped`) based on this validation to give the user transparent feedback about data quality.

**Q: How do you handle a single row in the CSV having multiple emails or phone numbers?**
**A:** This is handled via Prompt Engineering in `mapper.ts`. Rule #6 explicitly instructs the LLM: "If multiple emails exist, use the first email for 'email' and append remaining emails into 'crm_note'." This ensures our strict schema is respected (which only has one email field) while ensuring no data is lost during the migration.
