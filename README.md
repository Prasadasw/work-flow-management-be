# Workflow Management System API

A simple API for employee workflow management with project and task tracking.

## Features

- Employee registration and authentication
- Project management (create, read, update, delete)
- Task management with status tracking
- Task statistics and reporting

## Setup

1. Install dependencies:
```bash
npm install
```

2. Update `config.env` with your MongoDB connection string and JWT secret

3. Start the server:
```bash
npm run dev
```

## API Endpoints

### Authentication

#### Register Employee
```
POST /api/auth/register
```
Body:
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "mobileNumber": "1234567890",
  "designation": "Software Developer",
  "password": "password123"
}
```

#### Login Employee
```
POST /api/auth/login
```
Body:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current Employee
```
GET /api/auth/me
```
Headers: `Authorization: Bearer <token>`

### Projects

#### Get All Projects
```
GET /api/projects
```
Headers: `Authorization: Bearer <token>`

#### Get Single Project
```
GET /api/projects/:id
```
Headers: `Authorization: Bearer <token>`

#### Create Project
```
POST /api/projects
```
Headers: `Authorization: Bearer <token>`
Body:
```json
{
  "projectName": "WeLearn Platform",
  "description": "Educational platform development",
  "clientName": "ABC Company",
  "priority": "high",
  "endDate": "2024-12-31"
}
```

#### Update Project
```
PUT /api/projects/:id
```
Headers: `Authorization: Bearer <token>`

#### Delete Project
```
DELETE /api/projects/:id
```
Headers: `Authorization: Bearer <token>`

### Tasks

#### Get All Tasks
```
GET /api/tasks
```
Headers: `Authorization: Bearer <token>`

Query Parameters:
- `projectId`: Filter by project
- `status`: Filter by status (pending, working, done)
- `date`: Filter by date (YYYY-MM-DD)

#### Get Single Task
```
GET /api/tasks/:id
```
Headers: `Authorization: Bearer <token>`

#### Create Task
```
POST /api/tasks
```
Headers: `Authorization: Bearer <token>`
Body:
```json
{
  "taskTitle": "Implement User Authentication",
  "taskDescription": "Create login and registration system",
  "projectId": "project_id_here",
  "daysSpent": 2,
  "date": "2024-01-15",
  "status": "working",
  "priority": "high",
  "notes": "Using JWT for authentication"
}
```

#### Update Task
```
PUT /api/tasks/:id
```
Headers: `Authorization: Bearer <token>`

#### Delete Task
```
DELETE /api/tasks/:id
```
Headers: `Authorization: Bearer <token>`

#### Get Tasks by Project
```
GET /api/tasks/project/:projectId
```
Headers: `Authorization: Bearer <token>`

#### Get Task Statistics
```
GET /api/tasks/stats/overview
```
Headers: `Authorization: Bearer <token>`

## Data Models

### Employee
- `fullName`: String (required)
- `email`: String (required, unique)
- `mobileNumber`: String (required, 10 digits)
- `designation`: String (required)
- `password`: String (required, hashed)
- `isActive`: Boolean (default: true)

### Project
- `projectName`: String (required)
- `description`: String (required)
- `employeeId`: ObjectId (required, ref: Employee)
- `status`: String (active, completed, on-hold)
- `startDate`: Date (default: now)
- `endDate`: Date (optional)
- `clientName`: String (optional)
- `priority`: String (low, medium, high, urgent)

### Task
- `taskTitle`: String (required)
- `taskDescription`: String (required)
- `projectId`: ObjectId (required, ref: Project)
- `employeeId`: ObjectId (required, ref: Employee)
- `daysSpent`: Number (default: 0)
- `date`: Date (default: now)
- `status`: String (pending, working, done)
- `priority`: String (low, medium, high, urgent)
- `completedDate`: Date (auto-set when status = done)
- `notes`: String (optional)

## Usage Example

1. Register an employee
2. Login to get JWT token
3. Create a project
4. Add tasks to the project
5. Update task status as you work
6. Track progress and report to boss/client

This system helps you:
- Track what you're currently working on
- Plan future tasks
- Report progress to stakeholders
- Manage multiple projects efficiently
