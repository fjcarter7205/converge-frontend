# Converge Frontend

Event discovery platform for college students.

## File Structure

```
converge-frontend/
├── public/
│   └── index.html
├── src/
│   ├── App.js
│   ├── api.js
│   └── index.js
├── package.json
├── .gitignore
└── README.md
```

## Local Development

```bash
npm install
npm start
```

Runs on http://localhost:3000

## Deploy to Netlify

### Build Settings:
- **Build command:** `npm run build`
- **Publish directory:** `build`

### Environment Variable:
- **Key:** `REACT_APP_API_URL`
- **Value:** `https://your-backend-url.railway.app/api`

## Features

- Event feed with filters
- RSVP and save functionality
- User profiles
- Event creation
- Calendar view
