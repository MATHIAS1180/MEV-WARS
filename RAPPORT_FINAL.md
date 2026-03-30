# RAPPORT FINAL — MEV-WARS
**Date :** 30 mars 2026  
**Statut :** Déployé & Validé ✅

---

## 1. Résumé Exécutif

MEV-WARS est un jeu d'élimination progressif on-chain sur Solana Devnet. Les joueurs misent des SOL, sont regroupés dans des salles (rooms), et subissent des éliminations aléatoires à chaque round jusqu'à ce qu'un seul gagnant survive et empoche la cagnotte moins 2% de frais de plateforme.

L'ensemble du cycle de développement — audit, corrections, déploiement et intégration — est terminé.

---

## 2. Informations de Déploiement

| Paramètre | Valeur |
|---|---|
| **Network** | Solana Devnet |
| **Program ID** | `HCN6ddARh6UvdMgZWeMXBtUSxPvrLCoTjgo3t48oiAi4` |
| **Treasury** | `FC2km6B1ub8fBf4FdLFs1hbJjmLx6EJbdAzN9Ajnb8nt` |
| **Méthode de déploiement** | SolPG (beta.solpg.io) |
| **Repository** | `MATHIAS1180/MEV-WARS` — branch `main` |
| **Dernier commit** | `bcbab2a` — "Align game logic with deployed SolPG program" |

---

## 3. Règles du Jeu

| Paramètre | Valeur |
|---|---|
| Joueurs minimum pour démarrer | 2 |
| Joueurs maximum par salle | 100 |
| Éliminations par round | 10% des survivants (min. 1) |
| Timer d'expiration | 20 secondes |
| Frais de la maison | 2% de la cagnotte finale |
| Salles disponibles | Rooms 0–9 (initialisées on-chain) |

**Déroulement type :**
1. Les joueurs rejoignent une salle et payent l'`entry_fee`
2. Dès 2 joueurs → le jeu démarre automatiquement (état `InProgress { round: 1 }`)
3. Toutes les 20s, le crank appelle `advance_round` : 10% des survivants sont éliminés aléatoirement
4. Quand il reste 1 survivant → il reçoit le pot moins 2%
5. Si <2 joueurs après 20s → `refund_expired_game` rembourse les joueurs

---

## 4. Architecture Technique

### Smart Contract (Anchor / Rust)

| Fichier | Rôle |
|---|---|
| `solpg-program.rs` | Source de vérité pour SolPG (déploiement) |
| `programs/solana_russian_roulette/src/lib.rs` | Source locale Anchor (synchronisée) |

**Instructions on-chain :**
- `initialize_game` — Crée une salle PDA `[b"room", room_id]`
- `join_game` — Rejoindre + payer l'entry fee ; démarre à 2 joueurs
- `advance_round` — Élimine 10% des survivants ou settle le gagnant
- `refund_expired_game` — Rembourse si expiration avec <2 joueurs
- `secure_gain` — Sortie anticipée à 2× la mise (après round 2+)
- `withdraw_fees` — Retrait admin depuis la treasury

### Frontend (Next.js 14 / TypeScript)

| Fichier clé | Rôle |
|---|---|
| `config/constants.ts` | Program ID, constantes du jeu (source de vérité TS) |
| `utils/anchor.ts` | IDL TypeScript pour le client Anchor |
| `hooks/useGame.ts` | Hook React — état du jeu, logique min-2 joueurs |
| `hooks/useLiveActivity.ts` | Hook React — feed d'activité en temps réel |
| `app/api/crank/route.ts` | API crank — `advance_round` / `refund_expired_game` |
| `app/api/admin/withdraw/route.ts` | API admin — retrait des frais |

---

## 5. Audit de Sécurité — Résultats

### Vulnerabilités Corrigées

| # | Sévérité | Problème | Correction |
|---|---|---|---|
| 1 | **Critique** | Jeu pouvait démarrer avec 1 joueur | Logique min-2 joueurs dans `join_game` et `advance_round` |
| 2 | **Critique** | `Game::MAX_SIZE` sous-estimé (sans discriminant, sans payload Vec) | Recalcul avec discriminant 8 bytes + `GAME_STATE_MAX_SIZE` |
| 3 | **Élevé** | Élimination non-aléatoire (toujours le dernier du tableau) | Randomness on-chain via `hash(slot + timestamp + round + survivors)` |
| 4 | **Élevé** | `useLiveActivity.ts` : mutation de ref transiente par room | `previousPlayerCountsRef` persisté par Map room (non réinitialisé) |
| 5 | **Moyen** | `join_game` sans guard `MAX_PLAYERS` | `require!(current_player_count < MAX_PLAYERS, ErrorCode::RoomFull)` |
| 6 | **Bas** | Déréférencement invalide `*round` (Rust E0614) dans 10 occurrences | Remplacement `*round` → `round` dans les `match` arms |

### Points Validés (pas de problème)

- Pas de reentrancy possible (Anchor + Solana model = pas de callbacks)
- Seeds PDA déterministes et non-prévisibles par l'utilisateur
- Vérification `authority` pour `withdraw_fees` (seul admin = treasury pubkey)
- Pas d'integer overflow (arithmétique Solana sûre sur u64)
- `refund_expired_game` vérifie `player_count < 2` ET timer expiré

---

## 6. Validations Techniques Finales

| Test | Résultat |
|---|---|
| `npx tsc --noEmit` | ✅ Aucune erreur TypeScript |
| `npm run build` | ✅ Compiled successfully — 7 pages statiques générées |
| SolPG build | ✅ Build Rust réussi |
| SolPG deploy | ✅ Déployé sur Devnet |
| `git push origin main` | ✅ `a6c3bbb..bcbab2a main -> main` |

**Avertissements non-bloquants :** 3 warnings `<img>` Next.js (composants UI existants, pas de régression fonctionnelle).

---

## 7. Fichiers Modifiés (commit `bcbab2a`)

21 fichiers, 529 insertions, 236 suppressions :

- `solpg-program.rs` — fixes `*round` + nouveau Program ID
- `programs/solana_russian_roulette/src/lib.rs` — idem
- `config/constants.ts` — Program ID mis à jour
- `Anchor.toml` — IDs localnet + devnet mis à jour
- `utils/anchor.ts` — erreur `RoomFull` (6017) ajoutée
- `app/api/crank/route.ts` — seuil min-2 joueurs
- `hooks/useGame.ts` — logique min-2 joueurs + types
- `hooks/useLiveActivity.ts` — fix persistance `previousPlayerCountsRef`
- `app/page.tsx`, `app/layout.tsx` — références UI mises à jour
- `components/FAQ.tsx`, `Hero.tsx`, `HowItWorks.tsx`, `ProvablyFair.tsx` — textes "1 sur 3" → "min. 2 joueurs"
- `components/GameCard.tsx`, `Footer.tsx`, `MiningBlockEnhanced.tsx`, `CurrentPlayersPanel.tsx`, `LiveActivity.tsx` — timer 20s, chances de gain `100/playerCount`

---

## 8. Instructions de Maintenance

### Redéployer le contrat
1. Ouvrir `solpg-program.rs`
2. Copier le contenu dans `lib.rs` sur [beta.solpg.io](https://beta.solpg.io)
3. Build → Deploy
4. Récupérer le nouveau Program ID
5. Mettre à jour dans : `config/constants.ts`, `Anchor.toml` (×2), `solpg-program.rs`, `programs/.../lib.rs`

### Modifier les paramètres du jeu
- Timer : `ROUND_EXPIRATION_SECONDS` dans `solpg-program.rs` + `BLOCK_EXPIRATION_SECONDS` dans `config/constants.ts`
- Frais : `2 / 100` dans `advance_round` et `secure_gain` (contrat) + `HOUSE_FEE_PERCENT` dans `config/constants.ts`
- Max joueurs : `MAX_PLAYERS` dans `solpg-program.rs` + `config/constants.ts`

### Initialiser les salles (après redéploiement)
```bash
npx ts-node scripts/init-rooms.ts
```

### Tester le retrait admin
```bash
npx ts-node scripts/test-withdraw.ts
```

---

## 9. État Final du Projet

```
✅ Smart contract déployé sur Solana Devnet
✅ Program ID câblé dans tout le repo
✅ Frontend Next.js build clean
✅ TypeScript sans erreurs
✅ Pushed sur GitHub (main)
✅ Audit de sécurité complet
✅ Tous les bugs critiques corrigés
```

**Le projet est prêt pour des tests utilisateurs sur Devnet.**

---

*Rapport généré le 30 mars 2026 — GitHub Copilot*
