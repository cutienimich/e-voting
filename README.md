Day 1 April 23, 2026
- created blockchain and some testing
- downloaded hardhat version 2
- Installed metamask on browser
-Connect the chainlist to metamask

my amoy address -0x159ea9573b3277cB71E149D851ee978deF316057

my private key - 7d888cbfc757d1e77b8529d4057374b2afa29a448ec4bef4231918506e49d225

etherscan api key = 

Amoy Adress =  0x80D137aA8edd1CFCaafB599B852E96176dd50A29

================================================
04/23/2026 -Phase 1 complete
Voting.sol — smart contract with elections, candidates, voting
Deployed to Amoy testnet at 0x80D137aA8edd1CFCaafB599B852E96176dd50A29
All 5 tests pass locally
Contract verified and public on Polygonscan

Contract address: 0x80D137aA8edd1CFCaafB599B852E96176dd50A29
Network: Polygon Amoy Testnet
Chain ID: 80002

===============================================================

Day 2 April 24, 2026 - Backend

postgres 
name = evoting
password = 123456789


Phase 2 Done - 10:11 pm
====================================================================

Phase 3 - Admin/API Testing

{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtb2QwMDk1YTAwMDB3bXZmOThjb2c2bzYiLCJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzc3MDkyNjUwLCJleHAiOjE3NzcxMDcwNTB9.XU9OOyXxbUQAlvdyLeY8OC7UWSQcc88y0OAT6cT4Ffs",
    "username": "admin"
  }
}

{
  "success": true,
  "message": "Student registered",
  "data": {
    "id": "cmod0bm620001wmvfyv0a140y",
    "studentId": "24-00235",
    "name": "Michelle Postrado"
  }
}

{
  "success": true,
  "message": "Student registered",
  "data": {
    "id": "cmod0xh2v0002wmvf8btop8ov",
    "studentId": "2021-12345",
    "name": "Juan dela Cruz"
  }
}

Phase 2 fully tested and working:

✅ Server running
✅ Admin created and login
✅ Student register
✅ Admin enroll student
✅ Student login and get JWT token


Phase 4 fully complete and tested:

✅ Face enroll via backend admin endpoint
✅ Face status check
✅ Token refresh — new access token without re-login
✅ Logout — refresh token blacklisted immediately
✅ Face enrollment check on login — blocks if no face enrolled


Full backend summary so far:

✅ Phase 1 — Smart contract on Polygon Amoy
✅ Phase 2 — Backend API with PostgreSQL
✅ Phase 3 — Python face detection service
✅ Phase 4 — Auth hardening, token refresh, logout

============================================================================================

04/29 2026  -- 
Adjustments:
  - Make the face recognition as optional security of account
  - Hold the blockchain to save tokens

system flow
![alt text](image.png)

Tech Stack used:
Frontend — Next.js
Backend — Node.js / Express
Database — PostgreSQL
Face detection — Python (Flask microservice)
Blockchain — Solidity on Polygon (Amoy testnet → mainnet)

Project Structure Explained:
blockchain/ — Hardhat live here. Smart contract, deploy script, tests all in one place. Me not mix with backend.
backend/ — Express API. Me use Prisma ORM so talk to PostgreSQL clean, no raw SQL mess. Each folder has one job: routes talk to controllers, controllers talk to services, services do the real work.
face-service/ — Python live separate from Node. It own microservice. Backend call it over HTTP. Me keep it isolated so if face service crash, rest of system still stand.
frontend/ — Next.js app router. Login, vote, and admin each get own folder.

How to Set Up
1. git clone https://github.com/cutienimich/e-voting.git

2. Download this for backend
npm install express dotenv cors helmet express-rate-limit bcryptjs jsonwebtoken ethers pg prisma @prisma/client express-validator
npm install --save-dev nodemon

  -- to run backend type  npm run dev     in command prompt

3. Set up postgressql database
    -- run this query in your postgres
    CREATE DATABASE evoting;

    3.1 navigate the backend folder in command prompt
    3.2 type this 
        npx prisma db push
    3.3 after push type this
        npx prisma generate

4. to run Frontend, just navigate it on command prmpt and type npm run dev

The backend and front end should both running to see the web

![alt text](image-1.png)
![alt text](image-2.png)