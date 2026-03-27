// config/constants.ts - Source of truth for all configuration
import { PublicKey } from '@solana/web3.js';

// Blockchain Configuration
export const PROGRAM_ID = new PublicKey("2DKNipJx8QpQ1BzEScj3YoJ3CwpEbzyeEFVYvPbSsEtV");
export const TREASURY_PUBKEY = new PublicKey("FC2km6B1ub8fBf4FdLFs1hbJjmLx6EJbdAzN9Ajnb8nt");

// Game Configuration
export const BLOCK_EXPIRATION_SECONDS = 30;
export const MAX_PLAYERS = 30;
export const HOUSE_FEE_PERCENT = 5; // 5% goes to treasury

// Room Configurations (Source of Truth!)
export const ROOMS = [
  {
    id: 101 as const,
    label: "0.01 SOL" as const,
    lamports: 0.01 * 1e9,
    entryFee: 0.01 * 1e9,
    iconName: "Coins" as const,
  },
  {
    id: 102 as const,
    label: "0.1 SOL" as const,
    lamports: 0.1 * 1e9,
    entryFee: 0.1 * 1e9,
    iconName: "Zap" as const,
  },
  {
    id: 103 as const,
    label: "1.0 SOL" as const,
    lamports: 1 * 1e9,
    entryFee: 1 * 1e9,
    iconName: "Trophy" as const,
  },
] as const;

// Derived values (no duplication!)
export const ROOM_IDS = ROOMS.map(r => r.id);
export const ROOM_MAP = Object.fromEntries(ROOMS.map(r => [r.id, r]));

export type RoomId = typeof ROOMS[number]['id'];
export type Room = typeof ROOMS[number];