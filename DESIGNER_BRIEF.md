# Designer Brief — AI Study Notes App

## What is this app?

A web app for students to organize their class notes and study with the help of AI. Users upload their notes — photos of handwritten pages, PDFs, PowerPoints, Word docs — organized by class, and then have a conversation with an AI that has read those notes. The AI can explain concepts, answer questions, and generate quizzes.

Think of it as a smart digital binder where your notes can talk back to you.

---

## Who uses it?

A single student (no login, no accounts). This is a personal productivity tool — one person managing their own courses and notes.

---

## Core Features

### Class Management
Users organize everything by class (e.g. "Calculus", "History 101"). They need to be able to:
- Create a new class
- Rename a class
- Delete a class (which also removes all its notes)
- Switch between classes to view their notes and chat

### Note Uploading
Within a selected class, users upload their study materials. Supported formats: images (JPEG, PNG, WebP, HEIC from iPhone), PDFs, PowerPoint files, Word docs, and plain text. 

Users should be able to upload by clicking a button, dragging and dropping a file, or pasting an image from their clipboard.

### Note Gallery
All uploaded notes for the selected class are displayed so the user can browse them. Each note shows a thumbnail and the date it was uploaded. Users can delete individual notes. Clicking a note selects it to give the AI specific context for that one file.

### AI Chat
A conversation interface where the user can ask the AI questions about their notes. The AI reads the uploaded materials and responds as a study assistant. The conversation should feel like texting back and forth. Features include:
- Sending a message and getting a response
- Several buttons on the one side
- Clearing the conversation to start fresh
- Suggested starter prompts for first-time users (e.g. "Explain the main concepts", "Summarize my notes")

---

## Vibe & Tone

This is a **productivity tool for students** — it should feel focused, clean, and a little academic but modern. Not gamified, not playful. The kind of app you open when you actually need to get work done. The AI should feel approachable and helpful, not clinical or robotic.

Think calm confidence. A tool that gets out of your way.

---

## What the App Does NOT Have

- Login or authentication
- Search
- Tags or labels
- A settings page
- Multiple users or sharing

---

## States Worth Designing

These empty and loading states matter for the experience:
- First time opening the app — no classes exist yet
- A class exists but has no notes uploaded
- The AI chat before any messages have been sent
- Loading states while files upload or the AI is thinking/typing
- Error states (e.g. unsupported file type, file too large)
