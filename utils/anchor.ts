import { Connection, PublicKey } from '@solana/web3.js';
import { Idl } from '@coral-xyz/anchor';

export const PROGRAM_ID = new PublicKey("2DKNipJx8QpQ1BzEScj3YoJ3CwpEbzyeEFVYvPbSsEtV");
export const TREASURY_PUBKEY = new PublicKey("FC2km6B1ub8fBf4FdLFs1hbJjmLx6EJbdAzN9Ajnb8nt");

// Localhost for local dev — override via NEXT_PUBLIC_RPC_URL in .env
export const connection = new Connection(
  process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8899',
  'confirmed'
);

export const IDL: Idl = {
  version: "0.1.0",
  name: "solana_russian_roulette",
  instructions: [
    {
      name: "initializeGame",
      accounts: [
        { name: "game", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: [
        { name: "roomId", type: "u8" },
        { name: "entryFee", type: "u64" }
      ]
    },
    {
      name: "joinGame",
      accounts: [
        { name: "game", isMut: true, isSigner: false },
        { name: "player", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: [
        { name: "roomId", type: "u8" }
      ]
    },
    {
      name: "refundExpiredGame",
      accounts: [
        { name: "game", isMut: true, isSigner: false }
      ],
      args: [
        { name: "roomId", type: "u8" }
      ]
    },
    {
      name: "settleWinner",
      accounts: [
        { name: "game", isMut: true, isSigner: false }
      ],
      args: [
        { name: "roomId", type: "u8" }
      ]
    }
  ],
  accounts: [
    {
      name: "Game",
      type: {
        kind: "struct",
        fields: [
          { name: "roomId", type: "u8" },
          { name: "entryFee", type: "u64" },
          { name: "players", type: { array: ["publicKey", 30] } },
          { name: "playerCount", type: "u8" },
          { name: "state", type: { defined: "GameState" } },
          { name: "potAmount", type: "u64" },
          { name: "resolveSlot", type: "u64" },
          { name: "lastActivityTime", type: "i64" },
          { name: "blockStartTime", type: "i64" },
          { name: "bump", type: "u8" }
        ]
      }
    }
  ],
  types: [
    {
      name: "GameState",
      type: {
        kind: "enum",
        variants: [
          { name: "Waiting" }
        ]
      }
    }
  ],
  events: [
    {
      name: "PlayerJoinedEvent",
      fields: [
        { name: "game", type: "publicKey", index: false },
        { name: "player", type: "publicKey", index: false },
        { name: "playerIndex", type: "u8", index: false },
        { name: "playerCount", type: "u8", index: false }
      ]
    },
    {
      name: "GameSettledEvent",
      fields: [
        { name: "game", type: "publicKey", index: false },
        { name: "totalPot", type: "u64", index: false },
        { name: "winnersCount", type: "u8", index: false }
      ]
    },
    {
      name: "WinnerExtractedEvent",
      fields: [
        { name: "game", type: "publicKey", index: false },
        { name: "winner", type: "publicKey", index: false },
        { name: "amount", type: "u64", index: false }
      ]
    },
    {
      name: "GameRefundedEvent",
      fields: [
        { name: "game", type: "publicKey", index: false }
      ]
    }
  ],
  errors: [
    { code: 6000, name: "GameNotInWaitingState", msg: "The game is not in waiting state." },
    { code: 6001, name: "PlayerAlreadyJoined", msg: "You have already joined this game." },
    { code: 6002, name: "PlayerNotInGame", msg: "You are not in this game." },
    { code: 6003, name: "DrawTooEarly", msg: "Draw too early. Settle winner block must be > last join block." },
    { code: 6004, name: "InvalidTreasury", msg: "Invalid treasury address." },
    { code: 6005, name: "GameEmpty", msg: "Game is empty." },
    { code: 6006, name: "TimerNotExpired", msg: "Timer has not expired yet. Wait 30 seconds." },
    { code: 6007, name: "TooManyPlayers", msg: "Too many players for refund. Game must have less than 3 players." },
    { code: 6008, name: "NotEnoughPlayers", msg: "Not enough players. Need at least 3 players to settle." }
  ]
};
