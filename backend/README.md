# Backend

Backend API for the Hostel Management System.

## Running the code

Run `npm i` to install dependencies.

Run `node server.js` to start the backend server in development mode.

## Environment

Create a `.env` file in the `backend` folder and configure:

- `DB_USER= YOUR DATABASE USERNAME`
- `DB_PASSWORD= YOUR PASSWORD`
- `DB_CONNECTION_STRING=localhost/XE`
- `PORT=5000`
- `JWT_SECRET= CREATE YOUR SECRET KEY`
- Oracle DB connection variables used by your project

## Main API Groups

- `/api/auth`
- `/api/student`
- `/api/leave`
- `/api/technical-staff`
- `/api/admin`

## Notes

- Make sure Oracle DB is running before starting backend.
- Uploaded files are served from `/uploads`.
