# Pandaura Chat App

A simplified React + TypeScript + Tailwind CSS application extracted from the main Pandaura project, featuring the header layout and chat interface from the Pandaura AS module.

## Features

- **Clean Header**: Extracted from SharedLayout with Pandaura AS branding and sign-out functionality
- **Chat Interface**: Simplified version of the AskPandaura chat component
- **Responsive Design**: Built with Tailwind CSS using the same design system as the main application
- **TypeScript**: Full type safety throughout the application

## Project Structure

```
src/
├── components/
│   ├── Header.tsx          # Header component from SharedLayout
│   └── ChatInterface.tsx   # Simplified chat interface from AskPandaura
├── App.tsx                 # Main application component
├── index.css              # Tailwind CSS imports and custom styles
├── main.tsx               # React application entry point
└── vite-env.d.ts          # Vite environment types
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Design System

This project uses the same Tailwind CSS configuration as the main Pandaura application:

- **Primary**: `#121212` (Jet black)
- **Secondary**: `#1E1E1E` (Dark charcoal)
- **Accent**: `#C9C9F7` (Soft lavender-gray)
- **Background**: `#FFFFFF` (Pure white)
- **Surface**: `#FFFFFF` (White surface/card background)

## Components Overview

### Header
- Pandaura AS branding with version indicator
- Sign-out button with hover effects
- Responsive design matching the original SharedLayout

### ChatInterface
- Welcome screen with suggested questions
- Message history display
- Auto-resizing textarea input
- Loading states and animations
- Send button with keyboard shortcuts (Enter to send)

## Notes

- This is a standalone frontend application with no API connections
- Chat responses are simulated with mock data
- Authentication is simplified (console logging only)
- Styling matches the original Pandaura design system
