# 🧪 LocalStack Component Test Example – AWS Lambda + .NET 8 + TypeScript

This repository demonstrates **component testing using LocalStack**.  
It showcases how to test a **.NET 8 Lambda function** that consumes **SQS events** and forwards requests to an **external API**.

The project uses **AWS CDK (TypeScript)** for infrastructure setup, **MockServer** to simulate the external API, and **Testcontainers** to spin up **LocalStack** and **MockServer** in a shared local environment for automated testing.

---

## 🚀 Overview

### Architecture
- **Lambda Function (.NET 8 / C#)** — Processes SQS messages and calls an external API.
- **SQS Queue** — Acts as the event source for the Lambda.
- **MockServer** — Simulates the external API.
- **LocalStack** — Provides local AWS cloud services (SQS, Lambda, etc.) for testing.
- **AWS CDK (TypeScript)** — Defines and deploys the infrastructure.
- **Component Tests (TypeScript)** — Run locally using Testcontainers to start LocalStack and MockServer.

---

## ⚙️ Prerequisites

Make sure you have the following installed:

1. [Docker](https://www.docker.com/)
2. [Node.js](https://nodejs.org/)
3. [npm](https://www.npmjs.com/)
4. [.NET 8 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)

---

## 🧩 Project Structure

```
.
ComponentTest.sln
└── ComponentTest/                 # .NET Lambda project
└── src/
    ├── ComponentTest/             # .NET 8 Lambda source code (C#)
    └── infra/                     # Infrastructure and component tests
        ├── cdk/                   # AWS CDK stack (TypeScript)
        └── test/                  # Component tests (TypeScript + ViTest + Testcontainers)****
```
---

## 🧪 Running the Component Tests
1. Go to infra base directory
    ```bash
    cd src/ComponentTest/infra/ 
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the Lambda**
   ```bash
   npm run build-lambda
   ```

4. **Run tests**
   ```bash
   npm run component-test
   ```

> 🧠 The tests automatically start LocalStack and MockServer containers using Testcontainers, deploy the stack, and verify the Lambda’s behavior.
