# Mobility iOS client

React + Vite + Capacitor. Design tokens and screens follow the supplied Claude Design file.

```bash
npm install
npm run dev
npm test
npm run build
npx cap sync
```

`VITE_API_URL` points at the FastAPI research server. If the API is down, the app still runs from the local program and safety engines.
