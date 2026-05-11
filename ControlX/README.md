# ControlX - Advanced Intelligence Management System 

##  Executive Summary
**ControlX** is an advanced backend platform designed for intelligence operations management, Command and Control (C2) of field agents, and real-time data processing.
The core highlight of this system is its **Generative AI Automation**: The platform seamlessly ingests raw, unstructured field reports from multiple agents and automatically synthesizes them into formal, highly structured, and accurate intelligence briefs. This significantly reduces manual processing time for intelligence officers.

##  Tech Stack & Architecture
The system is built on a modern, clean, and scalable architecture, utilizing industry-standard tools:

* **Language:** Java 22
* **Core Framework:** Spring Boot 3.4.1 (Web, Data JPA, Validation)
* **Database:** H2 Database (Currently implemented as In-Memory/File for quick demonstration, seamlessly swappable to PostgreSQL/Oracle).
* **ORM:** Hibernate & Spring Data JPA.
* **API Documentation:** Built-in Swagger UI (OpenAPI 3.0) for seamless client-side integration.
* **AI NLP Engine:** REST API integration with Hugging Face servers, utilizing the advanced `Qwen/Qwen2.5-72B-Instruct` Large Language Model (LLM), fine-tuned for precise Natural Language Processing (NLP).

##  Key Technological Capabilities

1. **Advanced OOP & Polymorphic Entities:**
    * Leveraged JPA Inheritance (`SINGLE_TABLE` strategy with `DiscriminatorColumn`) to manage the `AgencyEmployee` hierarchy.
    * **Smart JSON Deserialization:** Utilized Jackson's `@JsonTypeInfo` and `@JsonSubTypes` annotations. This enables the `/api/employees` endpoint to dynamically ingest both Desk Managers and Field Agents under a unified API while preserving role-specific attributes.

2. **Prompt Engineering & Fine-Tuning:**
    * Complete programmatic control over the AI model's output.
    * Configured strict contextual boundaries and tuned the `Temperature` parameter to `0.2` to eliminate AI "Hallucinations", ensuring the output remains factual, objective, and strictly professional.

3. **Data Security & Integrity:**
    * Applied `@Transactional` annotations at the Service layer to guarantee database operation integrity (ACID compliance).
    * Implemented Safe Casting and robust internal business logic to prevent unauthorized entities (e.g., non-field agents) from submitting operational reports.

##  Run & Demo Instructions for Reviewers

The project is designed as "Plug & Play" for quick evaluation:

1. **Run:** Open the project in your preferred IDE, reload Maven dependencies, and execute the `ControlXApplication.java` main class.
2. **API Interface:** Access the local Swagger UI environment to interact with the system:
    `http://localhost:8080/swagger-ui/index.html`

###  Recommended End-to-End Test Flow:
To experience the platform's full operational value, we recommend following this flow via Swagger:

1. **Create a Desk Manager:**
   Navigate to `POST /api/employees`. Create an employee with `"employee_type": "MANAGER"`. (Note the generated ID).
2. **Create a Field Agent:**
   Navigate to `POST /api/employees`. Create an employee with `"employee_type": "AGENT"`, including specific attributes like `specialty` and `status`.
3. **Open a Mission (`POST /api/missions`):**
   Create a new mission and link it to the Manager's ID generated in Step 1.
4. **Stream Field Reports (`POST /api/missions/{missionId}/report`):**
   Submit raw text reports from the field using the Agent's ID.
5. **Complete Mission & Trigger AI (`POST /api/missions/{missionId}/complete`):**
   Execute this endpoint. The system will aggregate the reports, communicate with the AI servers in real-time, and generate a comprehensive brief. Afterward, run `GET /api/missions` to view the final generated report securely stored in the `aiIntelligenceSummary` field.

---
*ControlX was developed with a strong emphasis on Clean Code, Scalability, and demonstrating seamless integration between classical enterprise information systems and the Generative AI (LLM) ecosystem.*