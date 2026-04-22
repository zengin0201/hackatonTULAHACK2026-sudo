

# 🐾 PawMatch - Tinder-like Pet Adoption Platform

**PawMatch** is a high-performance, mobile-first web application designed to connect potential adopters with pets from shelters. Inspired by modern dating apps, it uses a "swipe-to-match" mechanic to make the pet adoption process engaging and efficient.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)


## 👥 The Team

This project was built during a 48-hour hackathon by a dedicated team of four. We split the architecture into a strict client-server model to maximize development speed.

| Role | Developer | Core Responsibilities & Stack |
| :--- | :--- | :--- |
| **Team Lead & Frontend Engineer** | Alex ([GitHub](https://github.com/zengin0201)) | React, TypeScript, Vite, Framer Motion, UI/UX Implementation, Project Management, Architecture Design, and Final Pitch |
| **Backend Engineer** | [Tima / https://github.com/timati565] | Python, Core API Development, Business Logic |
| **Backend Engineer** | [Daniil / https://github.com/sherlockteen] | Database Design (Supabase), Authentication, Infrastructure |

> **Note:** As the sole Frontend Engineer, I was fully responsible for translating the design into the interactive, gesture-based UI you see in the final product.

## 🌟 Key Features

- **Interactive Tinder-style Swipe:** Smooth, gesture-based swiping cards for pet discovery powered by `framer-motion`.
- **Virtual Sponsorship:** A built-in donation system allowing users to become "virtual guardians" for specific pets.
- **Dynamic Filtering:** Filter pets by category (Dogs, Cats, Birds, etc.) with real-time UI updates.
- **Real-time Authentication:** Secure login and profile management integrated with **Supabase Auth**.
- **Onboarding Flow:** Personalized user experience to match adopters with the most compatible pets.
- **Responsive Mobile-First UI:** Optimized for a seamless experience on mobile devices using **Shadcn/UI** and **Tailwind CSS**.

## 🚀 Technical Deep Dive

- **State Management:** Efficient use of React Context API for global Auth and Profile state.
- **Performance:** Built on **Vite** for near-instant HMR and optimized production builds.
- **Animations:** Complex physics-based card gestures and modal transitions using `motion/react`.
- **Type Safety:** 100% TypeScript coverage for predictable and maintainable code.
- **Backend-as-a-Service:** Leveraging Supabase for real-time database queries and secure authentication.
- 

## 📂 Project Structure

```text
src/
├── components/      # Reusable UI components (TinderCard, Modals, Carousel)
├── contexts/        # Auth and Application state providers
├── layouts/         # Page layouts and Protected Route wrappers
├── pages/           # Main application views (Feed, Login, Dashboard)
├── types/           # TypeScript interfaces and type definitions
└── utils/           # Supabase client and helper functions

```

## LAUNCH 
```
npm install
npm install motion
npm install react react-dom
npm install lucide-react
npm i --save-dev @types/react

```
```
Create .env
Change .env how example:
VITE_SUPABASE_URL = URL ПРОЕКТА SUPABASE
VITE_SUPABASE_ANON_KEY = КЛЮЧ ПРОЕКТА SUPABASE
```

## FINAL
```
npm run dev
```



## Mobile App 
```
https://github.com/timati565/PawMatch
```





