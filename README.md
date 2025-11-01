# GetMeChai

**Note: This application is a work in progress and contains several errors that couldn't be fixed in time.**

A decentralized content platform that allows creators to monetize their content through blockchain technology.

## Overview

GetMeChai connects content creators with subscribers using smart contracts on the Ethereum blockchain. Creators can publish content, set subscription prices, and earn cryptocurrency directly from their audience without intermediaries.

## Features

- Creator registration and profile management
- Content publishing with free/premium options
- Subscription management
- Wallet integration with MetaMask
- Dashboard with earnings tracking

## Project Structure

- `getmechai-contracts/`: Smart contracts for the platform
- `getmechai-frontend/`: Next.js frontend application

## Setup

1. Clone the repository
2. Install dependencies in both folders:
   ```
   cd getmechai-contracts
   npm install
   
   cd ../getmechai-frontend
   npm install
   ```
3. Start a local blockchain:
   ```
   cd getmechai-contracts
   npx hardhat node
   ```
4. Deploy contracts:
   ```
   cd getmechai-contracts
   npx hardhat run scripts/deploy.js --network localhost
   ```
5. Start the frontend:
   ```
   cd getmechai-frontend
   npm run dev
   ```

## Technologies

- Solidity
- Hardhat
- Next.js
- Ethers.js
- Tailwind CSS

## License

MIT
