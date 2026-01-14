# KnowledgeLog Blog Website Plan

## 1. Project Overview

Building a fullstack blog website using Next.js for optimization and data handling.

## 2. Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Linting**: ESLint

## 3. Implementation Steps

### Phase 1: Initialization (Complete)

- [x] Create Next.js project
- [x] Set up basic structure
- [x] Create docs directory

### Phase 2: Frontend Implementation

- [x] Receive valid frontend code from User
- [x] Analyze the structure of the provided code
- [x] Integrate components and pages into the current App Router structure
- [x] Ensure responsiveness and design consistency
- [x] Rebranded from "FutureTech" to "KnowledgeLog"

### Phase 3: Backend & Data

- [ ] **Infrastructure Setup**
  - [ ] Install `mongoose` and `cloudinary`
  - [ ] Set up `lib/db.ts` for MongoDB connection
  - [ ] Set up `lib/cloudinary.ts`
  - [ ] Configure Environment Variables (`.env.local`)
- [ ] **Database Schema**
  - [ ] Create `Post` model (title, slug, content, author, category, tags, images, etc.)
  - [ ] Create `Author` model (optional, or embedded)
- [ ] **Data Migration**
  - [ ] Create a seeding script to move current mock data to MongoDB
- [ ] **Frontend Integration**
  - [ ] Update Homepage fetching logic
  - [ ] Update Blog Index fetching logic
  - [ ] Update Single Post fetching logic
- [ ] **Image Handling**
  - [ ] Implement Cloudinary upload for Admin (future) or use Cloudinary URLs in DB

### Phase 4: Polish

- [ ] Verification
- [ ] Optimization
