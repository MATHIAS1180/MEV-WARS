import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Idl } from '@coral-xyz/anchor';

export const PROGRAM_ID = new PublicKey("88DPR42LhZwDC3SfJR2xwszbs7rm547JK18WC2Vsc8zd");
export const TREASURY_PUBKEY = new PublicKey("FC2km6B1ub8fBf4FdLFs1hbJjmLx6EJbdAzN9Ajnb8nt");

export const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

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
      name: "settleWinner",
      accounts: [
        { name: "game", isMut: true, isSigner: false },
        { name: "randomnessAccount", isMut: false, isSigner: false }
      ],
      args: [
        { name: "roomId", type: "u8" }
      ]
    },
    {
      name: "withdraw",
      accounts: [
        { name: "game", isMut: true, isSigner: false },
        { name: "player", isMut: true, isSigner: true }
      ],
      args: [
        { name: "roomId", type: "u8" }
      ]
    },
    {
      name: "refundIdleGame",
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
          { name: "players", type: { array: ["publicKey", 3] } },
          { name: "eliminated", type: { array: ["bool", 3] } },
          { name: "playerCount", type: "u8" },
          { name: "currentTurn", type: "u8" },
          { name: "bulletsRemaining", type: "u8" },
          { name: "state", type: { defined: "GameState" } },
          { name: "potAmount", type: "u64" },
          { name: "randomnessAccount", type: "publicKey" },
          { name: "resolveSlot", type: "u64" },
          { name: "lastActivityTime", type: "i64" },
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
          { name: "Waiting" },
          { name: "AwaitingResolution" }
        ]
      }
    }
  ],
  events: [
    {
      name: "GameSettledEvent",
      fields: [
        { name: "game", type: "publicKey", index: false },
        { name: "winner", type: "publicKey", index: false },
        { name: "winnerIndex", type: "u8", index: false },
        { name: "totalPot", type: "u64", index: false },
        { name: "winnerAmount", type: "u64", index: false }
      ]
    }
  ],
  errors: [
    { code: 6000, name: "GameNotInWaitingState", msg: "The game is not in waiting state." },
    { code: 6001, name: "GameFull", msg: "The game is already full." },
    { code: 6002, name: "PlayerAlreadyJoined", msg: "You have already joined this game." },
    { code: 6003, name: "PlayerNotInGame", msg: "You are not in this game." },
    { code: 6004, name: "GameEmpty", msg: "Game is empty." },
    { code: 6005, name: "GameNotIdle", msg: "Game is not idle. Wait 10 minutes." },
    { code: 6006, name: "GameNotResolving", msg: "Game is not resolving shot." },
    { code: 6007, name: "UnauthorizedOracle", msg: "Unauthorized Oracle." },
    { code: 6008, name: "InvalidSurvivorsCount", msg: "Invalid survivors count." },
    { code: 6009, name: "InvalidTreasury", msg: "Invalid casino treasury address." },
    { code: 6010, name: "MissingRandomnessAccount", msg: "Missing Randomness account in remaining accounts." },
    { code: 6011, name: "RandomnessNotResolved", msg: "Randomness is not yet resolved." },
    { code: 6012, name: "RandomnessTooOld", msg: "Randomness is too old. Please request a new RandomnessCommit." }
  ]
};
