# Backend Project

This project is a backend server built with **TypeScript**, using **Express** for the web framework, **Socket.IO** for real-time communication, **MongoDB** as the database, and **Node.js** as the runtime. It also incorporates **password hashing** for security, **CI/CD** pipeline for automated testing and deployment, and containerization using **Docker** and **Docker Compose**.

## Features

- **Real-Time Communication** with **Socket.IO**.
- **MongoDB** for data storage.
- **Password Hashing** for secure authentication.
- **CI/CD** for continuous integration and delivery.
- **Dockerized** application for easy deployment and environment consistency.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Docker Setup](#docker-setup)
- [CI/CD Integration](#cicd-integration)
- [Project Structure](#project-structure)
- [License](#license)

---

## Installation

### Prerequisites

Make sure you have the following installed:

- **Node.js** (v16 or higher)
- **MongoDB** (locally or via MongoDB Atlas)
- **Docker** and **Docker Compose** (if using containerized setup)

### Steps

1. **Clone the repository:**

    ```bash
    git clone https://github.com/RanaZaeem0/Mern_chatapp
    cd backend-project
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Configure environment variables:**

    Copy the `.env.example` to `.env` and configure the environment variables, including MongoDB URI and JWT secret.

    ```bash
    cp .env.example .env
    ```

4. **Run the server:**

    For development:

    ```bash
    npm run dev
    ```

    This will start the server with hot-reloading (via `ts-node-dev`).

    For production:

    ```bash
    npm run build
    npm start
    ```

---

## Usage

### API Endpoints

- **POST /login**: Authenticate users (Password is hashed and stored securely).
- **GET /users**: Retrieve all users from the database.
- **POST /message**: Send a real-time message to connected users via Socket.IO.

---

## Docker Setup

### Docker

1. **Build the Docker image:**

    ```bash
    docker build -t backend-project .
    ```

2. **Run the container:**

    ```bash
    docker run -p 3000:3000 backend-project
    ```

This will start the application inside a Docker container, exposing port `3000`.

---

### Docker Compose

1. **Start the project with Docker Compose:**

    Make sure Docker Compose is installed, then run:

    ```bash
    docker-compose up
    ```

This will automatically build the image and start the containers for both the backend and MongoDB.

2. **Stop the containers:**

    ```bash
    docker-compose down
    ```

---

## CI/CD Integration

### Continuous Integration & Deployment (CI/CD)

This project uses a CI/CD pipeline for automated testing and deployment. The pipeline includes:

- **GitHub Actions** for running tests, linting, and building the application.
- Automated deployment to your server or cloud platform (e.g., AWS, Heroku).

Check the `.github/workflows` directory for CI configuration files.

---

## Project Structure

Here is an overview of the project structure:

