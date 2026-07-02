# Code-Dual: Real-time Coding Arena ⚔️

Welcome to Code-Dual, a 1v1 real-time competitive programming platform.

## 🚀 Quick Start for Reviewers

To make testing as smooth as possible, the database is fully seeded with test users, algorithmic problems, and dummy match history.

### 1. Prerequisites

Ensure you have the following installed on your machine:

- **Node.js** (v18+)
- **PostgreSQL** (Running locally or via Docker)

### 2. Setup the Environment

1. Clone the repository and open the terminal at the root of the project.
2. Ensure you have a `.env` file inside the `server/` directory containing your Postgres `DATABASE_URL` (see `.env.example`).
3. Run the automated setup script from the root of the project:
   ```bash
   npm run setup
   ```
   _This command will install all dependencies, run Prisma migrations to build the schema, and automatically seed the database with test data._

### 3. Start the Application

From the root of the project, run:

```bash
npm run dev
```

This will start both the Frontend (`localhost:5173`) and the Backend (`localhost:4000`) concurrently.

---

## 🧪 Test Accounts

The setup script automatically generates the following accounts. You can use any of them to log in instantly. The password for **all accounts** is: `test1234`

| Role / User    | Email                      | Password   |
| -------------- | -------------------------- | ---------- |
| **Supervisor** | `supervisor@code-dual.com` | `test1234` |
| **Alice**      | `alice@test.com`           | `test1234` |
| **Bob**        | `bob@test.com`             | `test1234` |
| **Charlie**    | `charlie@test.com`         | `test1234` |

---

## 🎯 Features to Test

1. **Authentication:** Try logging in with the supervisor account. The UI uses secure HTTP-only cookies and JWTs.
2. **Leaderboard & Profile:** The Leaderboard is pre-populated with the seeded users. Click on any user to view their Profile, complete with dynamic Recharts for ELO progression.
3. **Matchmaking:** Open two different browser profiles (e.g., Chrome and Incognito), log in with two different accounts, and click "Find a Duel". The Socket.io matchmaking engine will pair them up instantly.
4. **Code Execution Engine:** Once inside the Arena, try submitting code! The local execution engine will safely evaluate the code against hidden/visible test cases and declare a winner, updating the ELO dynamically.

Enjoy reviewing the project! 🚀
