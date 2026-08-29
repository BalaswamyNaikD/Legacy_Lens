# Running Legacy Lens

This project has a frontend and backend that run separately, or together with one command.

## 1) Install dependencies

From the project root:

```bash
npm install
```

## 2) Start the backend

From the project root:

```bash
npm run dev:api
```

The API runs at:
- http://localhost:4000

## 3) Start the frontend

From the project root in a second terminal:

```bash
npm run dev:web
```

The frontend runs at:
- http://localhost:5173

## 4) Start both together

From the project root:

```bash
npm run dev
```

This starts the API and web app together in parallel.

## 5) Production build

To compile both apps for production:

```bash
npm run build
```

## Troubleshooting

- If ports are already in use, stop the existing process or change the app configuration.
- If dependencies are not installed, run `npm install` first.
- If the frontend cannot reach the backend, verify the API is running on port 4000.
