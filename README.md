# 🧮 GrubMath Backend

Welcome to **GrubMath Backend**! This is an agentic workflow backend built with Deno for an app that helps users split restaurant bills unevenly based on who ate what. Users can upload an image of a bill, provide context on who had which items, and the system will calculate each person's share accordingly.

---

## 🚀 Features

- **Bill Image Upload:** Users can upload a photo of their bill.
- **Contextual Assignment:** Specify who consumed each item for accurate splitting.
- **Uneven Split:** Handles cases where people share or have different quantities.
- **Agentic Workflow:** Modular, step-based workflow powered by agents for extensibility.

---

## 🏗️ Project Structure

```
GrubMath-backend/
├── src/
│   ├── agents/               # Agent logic for bill understanding and consumption mapping
│   ├── schemas/              # TypeScript schemas for data validation
│   ├── steps/                # Workflow steps (e.g., image parsing, mapping)
│   └── workflows/            # Orchestrated workflows (e.g., bill splitting)
├── .env                      # Environment variables
└── README.md                 # This file
```

---

## ⚡ Getting Started

### 1. 📦 Prerequisites
- [Deno](https://deno.com/) (v1.30+ recommended)

### 2. 🛠️ Setup

Clone the repository:
```sh
git clone <your-repo-url>
cd GrubMath-backend
```

Install dependencies (Deno will handle these automatically on run):
```sh
deno task check
```

### 3. 🚦 Running the Server

To start the backend server:
```sh
deno run -A src/main.ts
```
- `-A` grants all permissions (adjust as needed for your environment).

### 4. 🧪 Testing

To run tests (if available):
```sh
deno test
```

---

## 🖼️ How It Works

1. **Upload Bill Image:**
   - User uploads a photo of the bill.
2. **Image Parsing:**
   - The backend extracts itemized data from the image.
3. **Context Input:**
   - User provides info on who had what (e.g., Alice: Pizza, Bob: Salad).
4. **Agentic Split:**
   - The workflow calculates each person's share based on their consumption.

---

## 🤖 Agentic Workflow

- **Steps**: Each step (image parsing, mapping, splitting) is modular and can be extended.
- **Agents**: Specialized agents handle context extraction, consumption mapping, and calculations.

---

## 📝 Environment Variables

Configure your `.env` file for any required secrets or API keys (e.g., for OCR services).

---

## 🙌 Contributing

Pull requests and issues are welcome! Please open an issue to discuss your ideas or report bugs.

