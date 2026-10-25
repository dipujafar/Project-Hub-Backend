# Project Hub — Backend

Project Hub is the backend API for a project submission and review dashboard. It is built with TypeScript, Express, PostgreSQL, and Prisma. Students can submit projects, and mentors can browse, filter, review, and track project submissions.

## Features

- Student and mentor roles, with JWT-based role checks on protected project endpoints
- User registration with password hashing and an email OTP verification flow
- Project submission with request validation and a unique repository URL constraint
- Mentor project list with server-side status filtering, search, and pagination
- Project approval and rejection, including reviewer and review timestamp tracking
- Aggregated counts for pending, approved, and rejected projects

> **Implementation status:** The auth and OTP route modules exist but are not currently mounted in the main API router. As a result, registration may send an OTP, but login and OTP verification endpoints are not reachable until those routers are wired in. No request rate limiter or admin/mentor seed script is currently included.

## Tech Stack

| Technology | Purpose |
| --- | --- |
| TypeScript | Application language |
| Express.js | HTTP server and routing |
| PostgreSQL | Relational database |
| Prisma ORM | Database access, schema, and migrations |
| Zod | Request validation |
| JWT | Authentication and role-based authorization |
| bcrypt | Password hashing |
| Nodemailer | OTP email delivery |

## Project Structure

```text
prisma/
├── migrations/
└── schema/
    ├── enums.prisma
    ├── project.prisma
    ├── schema.prisma
    └── user.prisma
src/
├── config/
├── error/
├── lib/
├── middleware/
├── modules/
│   ├── auth/
│   ├── otp/
│   ├── project/
│   └── user/
├── routes/
├── shared/
├── utils/
├── app.ts
└── server.ts
```

## Getting Started

### Prerequisites

- Node.js 20.19 or later
- npm
- A PostgreSQL database
- SMTP credentials for email verification

### Install

```bash
git clone <repository-url>
cd <repository-directory>
npm install
```

### Configure environment variables

Create a `.env` file at the repository root:

```dotenv
# PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"

# HTTP server
PORT=5000
APP_URL="http://localhost:3000"
NODE_ENV="development"

# JWT secrets and token lifetimes
JWT_ACCESS_SECRET="replace-with-a-long-random-secret"
JWT_REFRESH_SECRET="replace-with-a-different-long-random-secret"
JWT_ACCESS_EXPIRES_IN="30d"
JWT_REFRESH_EXPIRES_IN="365d"

# Password hashing
BCRYPT_SALT_ROUNDS=12

# SMTP email sender
NODEMAILER_HOST_EMAIL="your-email@example.com"
NODEMAILER_HOST_PASS="your-smtp-app-password"
```

`APP_URL` is used as the allowed CORS origin. Keep `.env` and production secrets out of source control.

### Generate Prisma Client and apply migrations

```bash
npx prisma generate
npx prisma migrate dev
```

For deployment, apply committed migrations with:

```bash
npx prisma migrate deploy
```

### Start the development server

```bash
npm run dev
```

The API listens on `http://localhost:5000` by default. The health endpoint is `GET /`.

## API

All mounted API routes use the `/api/v1` prefix. Protected routes accept the access token in an `accessToken` cookie or an `Authorization: Bearer <token>` header. The API returns JSON with a `success`, `message`, and `data` field; paginated project lists also include `meta`.

### Users

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/users` | Public | Create a user account and initiate OTP email verification |

Example request:

```json
{
  "name": "Alex Student",
  "email": "alex@example.com",
  "password": "a-secure-password"
}
```

The optional `role` field accepts `STUDENT` or `MENTOR`. Omit it for the default `STUDENT` role. Mentor accounts should be created only through a trusted administrative process.

### Projects

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/projects` | Student | Submit a project |
| `GET` | `/api/v1/projects/mine` | Student or mentor | List projects owned by the authenticated user |
| `GET` | `/api/v1/projects` | Mentor | List projects with optional server-side filters and pagination |
| `GET` | `/api/v1/projects/stats` | Mentor | Get project totals by review status |
| `PATCH` | `/api/v1/projects/:id/review` | Mentor | Approve or reject a pending project |

Submit a project:

```json
{
  "projectName": "Project Hub",
  "repoUrl": "https://github.com/example/project-hub",
  "liveLink": "https://project-hub.example.com",
  "description": "A project submission and review dashboard."
}
```

The repository URL must be unique. A duplicate submission returns a conflict response.

Filter and paginate the mentor project list:

```text
GET /api/v1/projects?status=PENDING&page=1&limit=10&searchTerm=dashboard
```

Supported `status` values are `PENDING`, `APPROVED`, and `REJECTED`. The default page is `1`, the default page size is `10`, and the maximum page size is `100`.

Review a project:

```json
{
  "status": "APPROVED"
}
```

Only pending projects can be reviewed. Attempting to review an already-reviewed project returns a conflict response.

Example statistics response data:

```json
{
  "total": 12,
  "pending": 4,
  "approved": 6,
  "rejected": 2
}
```

## Authentication and Route Availability

JWT login, refresh-token, password-management, and OTP handlers are present under `src/modules/auth/` and `src/modules/otp/`. However, only the user and project routers are currently registered in `src/routes/index.ts`. Those auth and OTP endpoints are therefore **not available** through the running API until their routers are mounted.

Project endpoints require a verified account and the appropriate role. There is currently no checked-in seed command for creating a mentor account; provision mentor accounts through a trusted process and ensure the account is verified.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run the server in watch mode with `tsx` |
| `npm start` | Start the production entry point (`dist/server.js`) |
| `npm test` | Placeholder; automated tests are not configured |

## Notes

- Request bodies are validated with Zod schemas.
- Project status filtering and pagination are applied in the database query.
- Duplicate repository URLs are enforced by a unique database constraint.
- Rate limiting is not implemented yet.
