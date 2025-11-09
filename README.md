# Kidslist

A fullstack application for tracking and managing gift ideas for friends and family members.

## Project Structure

This project contains:
- **EJS, JS, CSS**
- **MongoDB Setup** 
- **Basic Server Setup** 

## Features (CRUD)

- Store gift ideas for friends and family organized by occasion
- Track budget for each gift
- Mark gifts as purchased or unpurchased
- Get feedback on whether an item is a good buy or not recommended
- Add new gift ideas with recipient, occasion, and budget details
- Edit/Delete your saved gift ideas
- Simple user management

## MongoDB Collections

- **gifts** - Contains gift ideas with:
  - username 
  - recipient
  - occasion
  - giftIdea 
  - Pricing 
  - purchased 
  - feedback "Good Buy" or "Don't Buy"


## Installation

1. Navigate to the project folder:
```bash
   cd kidslist
```
2. Install dependencies:
```bash
   npm install
```
3. Update `config/database.js` with your MongoDB connection string
4. Run the server:
```bash
   node server.js
```
5. Open browser to `http://localhost:8080`
