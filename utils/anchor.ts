import { Connection, PublicKey } from '@solana/web3.js';
import { Idl } from '@coral-xyz/anchor';
import { PROGRAM_ID, TREASURY_PUBKEY } from '../config/constants';
import { getClientRpcUrl } from '../lib/rpc';

export const connection = new Connection(
  getClientRpcUrl('utils/anchor.ts connection'),
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
      name: "advanceRound",
      accounts: [
        { name: "game", isMut: true, isSigner: false }
      ],
      args: [
        { name: "roomId", type: "u8" }
      ]
    },
    {
      name: "secureGain",
      accounts: [
        { name: "game", isMut: true, isSigner: false },
        { name: "player", isMut: true, isSigner: true }
      ],
      args: [
        { name: "roomId", type: "u8" }
      ]
    },
    {
      name: "withdrawFees",
      accounts: [
        { name: "treasury", isMut: true, isSigner: false },
        { name: "recipient", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: [
        { name: "amount", type: "u64" }
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
          { name: "currentRound", type: "u8" },
          { name: "survivors", type: { array: ["publicKey", 30] } },
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
          { name: "InProgress", fields: [{ name: "round", type: "u8" }, { name: "survivors", type: { vec: "publicKey" } }] },
          { name: "Finished" }
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
      name: "FeesWithdrawnEvent",
      fields: [
        { name: "amount", type: "u64", index: false },
        { name: "recipient", type: "publicKey", index: false },
        { name: "timestamp", type: "i64", index: false }
      ]
    },
    {
      name: "GameRefundedEvent",
      fields: [
        { name: "game", type: "publicKey", index: false }
      ]
    },
    {
      name: "RoundAdvancedEvent",
      fields: [
        { name: "game", type: "publicKey", index: false },
        { name: "round", type: "u8", index: false },
        { name: "survivorsCount", type: "u8", index: false },
        { name: "eliminatedCount", type: "u8", index: false }
      ]
    },
    {
      name: "PlayerEliminatedEvent",
      fields: [
        { name: "game", type: "publicKey", index: false },
        { name: "player", type: "publicKey", index: false },
        { name: "round", type: "u8", index: false }
      ]
    },
    {
      name: "SurvivorEvent",
      fields: [
        { name: "game", type: "publicKey", index: false },
        { name: "player", type: "publicKey", index: false },
        { name: "round", type: "u8", index: false }
      ]
    },
    {
      name: "PlayerSecuredEvent",
      fields: [
        { name: "game", type: "publicKey", index: false },
        { name: "player", type: "publicKey", index: false },
        { name: "amount", type: "u64", index: false },
        { name: "round", type: "u8", index: false }
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
    { code: 6006, name: "TimerNotExpired", msg: "Timer has not expired yet. Wait 20 seconds." },
    { code: 6007, name: "TooManyPlayers", msg: "Too many players for refund. Game must have less than 2 players." },
    { code: 6008, name: "NotEnoughPlayers", msg: "Not enough players. Need at least 2 players to start." },
    { code: 6009, name: "GameNotInProgress", msg: "Game is not in progress." },
    { code: 6010, name: "GameAlreadyFinished", msg: "Game already finished." },
    { code: 6011, name: "CannotSecureBeforeRound1", msg: "Cannot secure gain before round 1." },
    { code: 6012, name: "MultiplierTooLow", msg: "Multiplier too low to secure." },
    { code: 6013, name: "PlayerNotSurvivor", msg: "Player is not a survivor." },
    { code: 6014, name: "InsufficientPot", msg: "Insufficient pot for secure." },
    { code: 6015, name: "Unauthorized", msg: "Unauthorized. Only admin can perform this action." },
    { code: 6016, name: "InsufficientFunds", msg: "Insufficient funds in treasury." },
    { code: 6017, name: "RoomFull", msg: "Room is full." }
  ]
};
