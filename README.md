# Tutor Scene - Sign In Page

A modern, responsive sign-in page built with React and Tailwind CSS.

## Features

- 📱 Fully responsive design
- 🎨 Clean, modern UI with Tailwind CSS
- 🔐 Password visibility toggle
- 📑 Student/Parent and Tutor tabs
- 🎯 Social login options (Google & Apple)
- 🖼️ Beautiful gradient background with images
- ✨ Smooth transitions and hover effects

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd tutor-scene-signin
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The app will open in your browser at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
tutor-scene-signin/
├── public/
│   └── images/              # Images folder
│       ├── Rectangle 333.png           # Background gradient
│       └── e961e2fb611e53239ecfde7cb7d50f02cf801a6a.jpg  # Student image
├── src/
│   ├── components/
│   │   └── SignIn.jsx       # Main sign-in component
│   ├── App.js               # Root component
│   ├── index.js             # Entry point
│   └── index.css            # Tailwind CSS imports
├── tailwind.config.js       # Tailwind configuration
└── package.json
```

## Technologies Used

- **React** - JavaScript library for building user interfaces
- **Tailwind CSS** - Utility-first CSS framework
- **React Hooks** - useState for state management

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Runs the test suite
- `npm run eject` - Ejects from Create React App (one-way operation)

## Features Implemented

### Left Panel (Form Section)
- Tutor Scene logo with graduation cap icon
- Toggle tabs for Student/Parent and Tutor selection
- Email input with icon
- Password input with show/hide toggle
- Forgot password link
- Sign in button
- Sign up link
- Social login buttons (Google & Apple)

### Right Panel (Welcome Section)
- Gradient background overlay on image
- Student image in circular frame
- Welcome message
- Feature badges (Verified Tutors, Flexible Schedule, Secure Payments)
- Fully responsive - hidden on mobile devices

## Customization

You can customize the design by modifying:
- Colors in `tailwind.config.js`
- Component styles in `src/components/SignIn.jsx`
- Images in `public/images/`

## License

This project is created for educational purposes.
