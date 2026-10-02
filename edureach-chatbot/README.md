# EduReach — RAG-Powered Educational Assistant (Frontend)

Frontend web client for **EduReach — RAG-Powered Educational Assistant**, built with React 19, TypeScript, Vite, and Tailwind CSS.

For complete project documentation, system architecture, RAG pipeline details, environment setup, and API specifications, please see the primary [Project README](../README.md).

## Quick Start (Frontend)

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build for production (TypeScript check + Vite bundle)
npm run build

# Preview production build locally
npm run preview

# Run ESLint checks
npm run lint
```

The Vite server listens on the local network. Use the Network URL printed by
Vite on another device on the same network. During development, Vite forwards
`/api` requests to the backend at `http://127.0.0.1:5000`, so authentication
requests work from LAN clients too. Start the backend on port 5000 as described
in the [Project README](../README.md).
