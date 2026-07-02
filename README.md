# Restaurant Reservation Management System

A full-stack application for managing restaurant table reservations, with role-based
access for **customers** (book/view/cancel their own reservations) and **administrators**
(oversee, filter, update, and cancel all reservations, and manage tables).

> Full documentation — setup, design decisions, availability logic, RBAC, limitations —
> lives in the sections below and is expanded as the project is built.

## Tech Stack

| Layer     | Technology                     |
| --------- | ------------------------------ |
| Frontend  | React (Vite) + React Router    |
| Backend   | Node.js + Express              |
| Database  | MongoDB (Mongoose ODM)         |
| Auth      | JWT (stateless, role-based)    |

## Repository Structure

```
restaurantbook/
├── server/    # Express REST API + MongoDB models
├── client/    # React single-page app
└── README.md  # This file
```

## Status

🚧 Work in progress — being built in incremental, documented stages.

Setup instructions, assumptions, reservation/availability logic, role-based access
details, known limitations, and future improvements are documented at the bottom of this
README as each part lands.
