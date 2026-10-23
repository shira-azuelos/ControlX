# ControlX

An intelligence / command-and-control management system with an AI-powered component that automatically generates intelligence briefs from raw field reports.

## About the Project
ControlX simulates a back-office platform for managing field agents and intelligence missions. Desk Managers open missions and assign Field Agents to them, agents submit free-text reports from the field, and once a mission is completed, the system sends all collected reports to a language model (LLM), which synthesizes them into a structured, professional intelligence brief.

The project is organized as two separate packages in the repo:
- **ControlX** – Backend server in Java / Spring Boot.
- **ControlX-Frontend** – Frontend in React / TypeScript.

## Key Features
- **Agency Employee Management** – Entity hierarchy (`AgencyEmployee` → `DeskManager` / `FieldAgent`) with smart JSON deserialization, so a single endpoint (`/api/employees`) can ingest both employee types while preserving role-specific fields.
- **Mission & Report Management** – Opening missions, assigning agents, submitting field reports, and completing missions.
- **AI-Powered Intelligence Summaries** – When a mission is completed, all collected reports are sent to an external language model that produces a structured brief, stored in the `aiIntelligenceSummary` field.
- **Security** – JWT-based authentication (`spring-boot-starter-security` + `jjwt`).
- **Real-Time Communication** – A WebSocket (STOMP) channel for live chat/updates between server and client.
- **API Documentation** – Built-in Swagger UI (OpenAPI 3.0).

## Architecture & Tech Stack

### Backend (ControlX)
- Java 22, Spring Boot 3.4.1 (Web, Data JPA, Validation, Security, WebSocket)
- Hibernate / Spring Data JPA over an H2 database (swappable for PostgreSQL/Oracle)
- JWT authentication (`io.jsonwebtoken`)
- Integration with an external AI service (`GeminiService`) for generating briefs
- Classic layered structure: controller → service → repository → entity, with a central `GlobalExceptionHandler` for error handling

### Frontend (ControlX-Frontend)
- React 19 + TypeScript, built and served with Vite
- Redux Toolkit and React Query for state management and server communication
- React Router for navigation, React Hook Form for forms
- Tailwind CSS + SCSS for styling
- STOMP / SockJS for the WebSocket connection to the server

## Running Locally

### Backend
1. Open the `ControlX` folder in an IDE that supports Maven.
2. Reload the Maven dependencies.
3. Run the main class `ControlXApplication`.
4. The server will start on port 8080, and the Swagger UI will be available at: `http://localhost:8080/swagger-ui/index.html`

### Frontend
1. Navigate to the `ControlX-Frontend` folder.
2. Install dependencies: `npm install`.
3. Start the dev server: `npm run dev`.

## Recommended Test Flow (via Swagger)
1. **Create a Desk Manager** – `POST /api/employees` with `"employee_type": "MANAGER"`.
2. **Create a Field Agent** – `POST /api/employees` with `"employee_type": "AGENT"`, including fields like specialty and status.
3. **Open a Mission** – `POST /api/missions`, linked to the Manager's ID from step 1.
4. **Submit Field Reports** – `POST /api/missions/{missionId}/report`, on behalf of the Agent created in step 2.
5. **Complete the Mission & Trigger AI** – `POST /api/missions/{missionId}/complete`. The system aggregates the reports, calls the language model, and generates a summarized brief. The result can be viewed via `GET /api/missions`, in the `aiIntelligenceSummary` field.

## Main Folder Structure (Backend)
```text
ControlX/src/main/java/
├── com/example/controlx/ControlXApplication.java
├── config/WebSocketConfig.java
├── controller/        # AgencyEmployeeController, MissionController, ChatMessageController
├── service/           # AgencyEmployeeService, MissionService, ChatMessageService, GeminiService, JwtService
├── repository/        # Spring Data JPA interfaces
├── entity/            # AgencyEmployee, DeskManager, FieldAgent, Mission, Report, ChatMessage
├── security/          # SecurityConfig, JwtAuthenticationFilter
└── exception/         # GlobalExceptionHandler
```

> This project demonstrates the combination of a classic enterprise information system (Spring Boot, JPA, JWT-based security) with a generative AI ecosystem, with an emphasis on clean code and a layered architecture.
