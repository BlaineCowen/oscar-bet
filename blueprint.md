# Oscars Prediction Game - AI Web App

## Overview
The Oscars Prediction Game is a web application where an admin can create a game and invite friends to participate. Players use virtual currency to bet on various Oscar categories, and winnings are determined by the event odds.

## Features
### Admin Features:
- Create a game session and set initial parameters.
- Invite friends via shareable links.
- Update results as official winners are announced.
- Manage the list of participants and their balances.

### Player Features:
- Receive an invitation to join a game.
- Start with a fixed virtual bank balance (e.g., $1000).
- Place bets on Oscar categories such as Best Picture, Best Actress, etc.
- View odds for each nominee, sourced from [Gold Derby Odds](https://www.goldderby.com/odds/combined-odds/oscars-2025-predictions/).
- Track winnings and leaderboard updates in real time.

## Game Flow
1. **Admin Setup:**
   - Registers and logs in.
   - Creates a game session and receives a shareable link.
   - Sets the initial bank balance for players.
   
2. **Player Participation:**
   - Joins via the provided link and gets a virtual balance.
   - Places bets on various categories before the Oscars ceremony.
   
3. **Updating Results:**
   - Admin updates winners as announced.
   - System calculates payouts based on pre-set odds and distributes winnings.
   - Leaderboard updates in real-time.

4. **Game Conclusion:**
   - The final rankings are displayed.
   - Players see their final earnings and placement.

## Tech Stack
- **Frontend:** React (or Svelte), Tailwind CSS
- **Backend:** Node.js with Express, PostgreSQL for user and game data
- **Authentication:** Better-auth
- **Real-Time Updates:** WebSockets or Firebase Realtime Database
- **Odds Fetching:** Scraper/API to retrieve odds from Gold Derby

## API Endpoints
### User Authentication
- `POST /auth/[...all]
- `GET /auth/[...all]



### Game Management
- `POST /game/create` - Create a new game session
- `GET /game/:id` - Fetch game details
- `POST /game/:id/invite` - Generate an invite link
- `POST /game/:id/update-results` - Admin updates winners

### Betting
- `POST /bet/place` - Place a bet on a category
- `GET /bet/:user_id` - Fetch user’s bets
- `GET /leaderboard/:game_id` - Fetch the leaderboard

## Next Steps
- Define UI components and wireframes
- Set up database schema for users, bets, and games
- Implement authentication and game session logic
- Develop betting and payout logic
- Test game mechanics with a small user base

# DO NOT USE AUTH CHECKS IN API ROUTES
