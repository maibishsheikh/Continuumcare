# ContinuumCare Project Launch 🚀

## Servers Now Running

✅ **Backend Server** - Port 5000
- Location: http://localhost:5000
- Framework: Express.js
- Database: MongoDB (local)

✅ **Frontend Server** - Port 3000
- Location: http://localhost:3000
- Framework: React
- CSS: Tailwind

## MongoDB Setup with Compass

### Configure MongoDB Compass:
1. Open **MongoDB Compass**
2. Connect with:
   ```
   mongodb://localhost:27017
   ```
3. Click "Connect"

### View Your Data:
- Database: `continuumcare`
- Collections will auto-create when you start adding data:
  - `patients`
  - `dailycheckins`
  - `alerts`

## Quick Start Guide

### API Endpoints (Test in Postman or Thunder Client):

#### Create a Patient
```bash
POST http://localhost:5000/api/patients
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-1234",
  "age": 45,
  "gender": "Male",
  "medicalHistory": "Diabetes"
}
```

#### Create a Daily Check-in
```bash
POST http://localhost:5000/api/checkins
Content-Type: application/json

{
  "patientId": "PATIENT_ID_FROM_MONGODB",
  "vitals": {
    "heartRate": 72,
    "bloodPressure": "120/80",
    "temperature": 98.6,
    "oxygenSaturation": 95
  },
  "symptoms": ["fever", "fatigue"],
  "notes": "Patient feeling better"
}
```

#### Get Patient
```bash
GET http://localhost:5000/api/patients/PATIENT_ID
```

#### Get Check-ins for Patient
```bash
GET http://localhost:5000/api/checkins/patient/PATIENT_ID
```

## Monitoring with MongoDB Compass

1. **Open MongoDB Compass**
2. Navigate to `continuumcare` database
3. View collections in real-time as data is added
4. Export/import data as needed

## File Structure

```
continuumcare-backend/
├── .env                 (MongoDB connection config)
├── server.js           (Express server + MongoDB init)
├── package.json        (Dependencies + start scripts)
├── src/
│   ├── app.js
│   ├── config/
│   │   ├── mongodb.js  (MongoDB connection)
│   │   └── firebase.js (DEPRECATED)
│   ├── models/
│   │   ├── Patient.js
│   │   ├── DailyCheckin.js
│   │   └── Alert.js
│   ├── controllers/
│   │   ├── patient.controller.js
│   │   ├── checkin.controller.js
│   │   ├── alert.controller.js
│   │   └── test.controller.js
│   └── routes/
│       ├── patient.routes.js
│       ├── checkin.routes.js
│       ├── alert.routes.js
│       └── test.routes.js

continuumcare-frontend/
├── package.json
├── src/
│   ├── App.js
│   ├── index.js
│   ├── components/
│   │   ├── DailyCheckinForm.js
│   │   └── VitalInput.js
│   └── pages/
│       ├── DoctorDashboard.js
│       └── PatientDashboard.js
```

## Troubleshooting

### Backend Won't Connect to MongoDB
1. Ensure MongoDB is running locally
2. Check `.env` file has: `MONGODB_URI=mongodb://localhost:27017/continuumcare`
3. Try connecting manually with MongoDB Compass

### Frontend Issues
1. Clear node_modules and reinstall: `npm install`
2. Clear browser cache (Ctrl+Shift+Delete)
3. Check console for errors (F12)

### Port Already in Use
- Backend (5000): `lsof -i :5000` or `netstat -ano | findstr :5000`
- Frontend (3000): `lsof -i :3000` or `netstat -ano | findstr :3000`

## .env Configuration
```
MONGODB_URI=mongodb://localhost:27017/continuumcare
PORT=5000
NODE_ENV=development
```

---

**Status: ✅ Project Ready for Development**

Servers are running. Open MongoDB Compass to monitor your database in real-time!
