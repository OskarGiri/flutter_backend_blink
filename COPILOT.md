# backedNodeBlik Copilot Guide

This file is a quick backend guide for contributors and GitHub Copilot.

## Stack & Runtime

- **Runtime:** Node.js + Express
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (`Authorization: Bearer <token>`)
- **Realtime:** Socket.IO
- **Uploads:** Local `uploads/` served at `/uploads/*`
- **Server port:** `3001`

---

## Base URL

Use:

`http://localhost:3001`

All routes below are relative to this base URL.

---

## Auth Model

### JWT payload

- Token includes: `{ userId }`
- Middleware (`middleware/auth.js`) sets `req.userId`.

### Protected routes

Any route marked **Auth: Yes** requires header:

`Authorization: Bearer <JWT_TOKEN>`

---

## API Endpoints

## 1) Users (`/users`)

### `POST /users/signup`

- **Auth:** No
- **Body:**

```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "secret123"
}
```

- **Success (201):**

```json
{
  "message": "User registered successfully",
  "token": "...",
  "user": {
    "id": "...",
    "username": "john",
    "email": "john@example.com"
  }
}
```

### `POST /users/login`

- **Auth:** No
- **Body:**

```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

- **Success (200):** same shape as signup response (`message`, `token`, `user`).

### `POST /users/change-password`

- **Auth:** Yes
- **Body:**

```json
{
  "currentPassword": "oldpass",
  "newPassword": "newpass123"
}
```

- **Validation:** `newPassword` must be at least 6 chars.
- **Success (200):**

```json
{ "message": "Password changed successfully" }
```

### `GET /users/me`

- **Auth:** Yes
- **Response (200):** user profile document (without password).

### `PUT /users/me`

- **Auth:** Yes
- **Updatable fields only:** `fullName`, `dob`, `gender`, `lookingFor`
- **Body example:**

```json
{
  "fullName": "John Doe",
  "dob": "1999-01-01",
  "gender": "male",
  "lookingFor": "female"
}
```

- **Response (200):** updated user profile (without password).

### `POST /users/me/photos`

- **Auth:** Yes
- **Content-Type:** `multipart/form-data`
- **File field name:** `photo`
- **Response (200):**

```json
{ "photos": ["http://localhost:3001/uploads/..."] }
```

### `DELETE /users/me/photos/:index`

- **Auth:** Yes
- Deletes photo by array index.
- **Response (200):** updated photo list.

### `GET /users/`

- **Auth:** No
- Returns all users (password excluded).

---

## 2) Password Reset (`/auth`)

### `POST /auth/forgot-password`

- **Auth:** No
- **Body:**

```json
{ "email": "john@example.com" }
```

- Sends OTP workflow via `auth.service`.

### `POST /auth/verify-otp`

- **Auth:** No
- **Body:**

```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

- `otp` must be a 6-digit string.

### `POST /auth/reset-password`

- **Auth:** No
- **Body:**

```json
{
  "email": "john@example.com",
  "resetToken": "...",
  "newPassword": "newpassword123"
}
```

- `newPassword` must be at least 8 chars.

> All auth-controller responses follow:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

---

## 3) Discovery (`/discovery`)

### `GET /discovery`

- **Auth:** Yes
- Returns up to 20 users not yet swiped by current user.
- Excludes current user.
- Select fields: `username`, `fullName`, `dob`, `gender`, `lookingFor`, `photos`.

---

## 4) Swipes (`/swipes`)

### `POST /swipes`

- **Auth:** Yes
- **Body:**

```json
{
  "targetUserId": "<userId>",
  "action": "like"
}
```

- `action` must be `"like"` or `"pass"`.
- If reciprocal like exists, a match is created/upserted.

- **No match response (200):**

```json
{ "ok": true, "matched": false }
```

- **Matched response (200):**

```json
{ "ok": true, "matched": true, "matchId": "..." }
```

---

## 5) Matches & Chat (`/matches`)

### `GET /matches`

- **Auth:** Yes
- Returns list of match cards with:
  - `id`
  - `otherUser` (`id`, `username`, `fullName`, `photos`)
  - `lastMessage` (`id`, `text`, `senderId`, `createdAt`) or `null`

### `GET /matches/:matchId/messages?limit=50`

- **Auth:** Yes
- User must belong to that match.
- `limit` max is 200.
- Returns ascending by `createdAt`.

### `POST /matches/:matchId/messages`

- **Auth:** Yes
- User must belong to that match.
- **Body:**

```json
{ "text": "Hello" }
```

- Creates message and updates `match.updatedAt`.
- **Success (201):** message payload (`id`, `matchId`, `senderId`, `text`, `createdAt`).

---

## Socket.IO (Realtime)

## Connection

- Join socket server on backend port with auth token:

```js
const socket = io("http://localhost:3001", {
  auth: { token: jwtToken },
});
```

- Server verifies token and joins room: `user:<userId>`.

## Events emitted by backend

### `match:new`

Emitted when reciprocal like creates/fetches a match.

Payload:

```json
{
  "matchId": "...",
  "otherUserId": "..."
}
```

### `message:new`

Emitted to both users in a match after message creation.

Payload:

```json
{
  "id": "...",
  "matchId": "...",
  "senderId": "...",
  "text": "Hello",
  "createdAt": "..."
}
```

---

## Key Data Models (Quick)

- **User**
  - core: `username`, `email`, `password`
  - profile: `fullName`, `dob`, `gender`, `lookingFor`, `photos[]`
  - password reset: OTP/reset token fields

- **Swipe**
  - `fromUser`, `toUser`, `action` (`like|pass`)
  - unique index on `(fromUser, toUser)`

- **Match**
  - `users[2]` (sorted pair)
  - unique index on `users.0 + users.1`

- **Message**
  - `match`, `sender`, `text`, timestamps
  - index on `(match, createdAt)`

---

## File Map

- App bootstrap: `app.js`
- Routes: `routes/*.js`
- Controllers: `controller/*.js`
- Models: `models/*.js`
- Auth middleware: `middleware/auth.js`
- Validation helpers: `middleware/validate.js`
- Auth business logic: `services/auth.service.js`

---

## Common Error Responses

- `400` invalid payload / validation failed
- `401` missing or invalid token
- `403` user not part of match (chat endpoints)
- `404` resource not found
- `500` server/internal failure

---

## Dev Notes

- Start backend from `backedNodeBlik/`:

```bash
npm install
npm run dev
```

- Make sure env vars are set (especially `JWT_SECRET` and Mongo connection values used by `config/DB.js`).
