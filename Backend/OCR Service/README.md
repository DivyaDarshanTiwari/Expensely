# 📄 OCR Bill Processing API

This project provides a **Node.js API** that allows users to upload their **bills (images only)**, automatically extract data using **Tesseract OCR**, convert it into structured JSON using a **Google AI model**, and send the extracted expense details to an external expense management service(Basic Service).

---

## 🚀 Features

- **Upload bills** via API and extract text automatically.
- Uses **Tesseract.js** for OCR.
- Converts extracted text into structured JSON (category, total amount, description) using your **Google API service**.
- Automatically **posts extracted expense data** to your Expense Management API.
- Handles errors gracefully with meaningful messages.

---

## 🛠️ Tech Stack

- **Node.js + Express** (API server)
- **Tesseract.js** (OCR)
- **Axios** (HTTP requests)
- **Google API Service** (for text-to-structured JSON)

---

## 📦 API Endpoint

### `POST /api/v1/ocr/get/json/:userId`

Uploads a bill image and processes it.

#### **Path Parameters:**

- `userId` (required): ID of the user (number)

#### **Form Data:**

- `file`: The bill image file to be uploaded (required) . It should be uploaded as bill(Key) and image(data)

#### **Response:**

- `200 OK`: Expense data created successfully.
- `400 Bad Request`: Missing/invalid userId or file.
- `502/504/500`: Upstream server errors handled gracefully.

---

## 🛠️ Internal Flow

1. User uploads a **bill image**.
2. **Tesseract OCR** extracts raw text.
3. Text is converted to structured JSON using your **Google API service**:

   - category
   - total_amount
   - description

4. The formatted data is **posted to the Expense Management API(Basic Service)**.
5. User receives confirmation and the created expense data in the response.

---

## ⚠️ Error Handling

- Returns descriptive error messages if:

  - `userId` is missing or invalid.
  - `file` is missing.
  - Expense server returns a 400.
  - Upstream server is unreachable (502/504).
  - Internal server errors (500).

---

## 📂 Project Structure (Relevant)

```
project-root/
├── controllers/
│   └── ocrController.js  # Contains the ocrFunction
├── services/
│   └── Text_to_Json_Service.js  # Your Google API structured conversion logic
├── routes/
│   └── ocrRoutes.js  # API route definitions
└── app.js  # Main server entry point
```

---

## 🪄 Example Successful Response

```json
{
  "message": "Data processed and expense entry created successfully.",
  "expense": {
    "userId": 123,
    "amount": 500,
    "category": "Groceries",
    "description": "Purchase of vegetables and fruits"
  }
}
```

---

## 🏃‍♂️ Running the Project

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   ```

2. **Navigate to the OCR directory:**

   ```bash
   cd <repository-folder>
   ```

3. **Install dependencies:**

   ```bash
   npm install
   ```

4. **Set up environment variables:**

   Create a `.env` file in the OCR directory with the following:

   ```env
   GOOGLE_API_KEY=your_google_api_key_here
   EXPENSE_API_URL=https://your-expense-service-url/api/v1/expense/add
   ```

   - `GOOGLE_API_KEY`: Your Google Cloud API key for the structured text extraction service.
   - `EXPENSE_API_URL`: The URL of your Expense Management API endpoint where extracted expense data will be posted.
   - `SERVER_PORT`: Port at which the server will run.(Rcommender 8082)

   Ensure these variables are correct and active before starting the server.(To know more go to [GoogleAPI Docs](https://ai.google.dev/gemini-api/docs))

5. Before starting this server. **Active the server of Basic Service**

6. **Start the server:**

   ```bash
   npm start
   ```

7. Use **Postman or cURL** to test `POST /api/v1/ocr/get/json/:userId` with form-data containing the `file` field.

---
