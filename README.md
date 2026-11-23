[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/wangconghua/best-card-game/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/wangconghua/best-card-game/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

# 🔥 Ember Court — a turn-based card duel

You are **the Kindler**. Across the table sits **Duchess Cinder**, and the
court of ember-spirits is watching. Spend ember, summon creatures of Flame ▲,
Tide ●, Thorn ◆ and Star ★, and bring her life to zero before she brings
yours to zero.

An original card game that plays offline in a desktop browser from static
files — no libraries, no network requests, no build step.

## How to play

- Both duelists begin at **30 life**. Ember starts at **1** and grows by one
  each turn, up to **10**, refilling every turn.
- Draw a card every turn; your opening hand is 5 cards from a 24-card deck.
- **Creatures** take a place on your side of the table (at most 5) and fight.
  A creature cannot attack the turn it is played.
- **Tricks** resolve at once: damage the rival, restore your life, draw cards.
- **Wards** raise a shield that soaks damage before your life does.
- If your deck runs dry, your discard pile is kindled anew into a deck.
- Win by bringing the rival's life to zero. Lose yours, and the court keeps
  its Duchess.

## Controls

- **Mouse** — click a hand card to play it; click one of your creatures, then
  a rival creature or the Duchess herself, to attack.
- **Keys 1–5** — play a hand card.
- **Enter** — end your turn.
- **M** — mute the sound blips.

Duchess Cinder plays by her own heuristics: she takes a killing blow when she
sees one, summons her strongest affordable creature, mends and wards when she
is hurting, and trades her creatures into yours when the trade favours her.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `game/index.html` through any static server. The entry program
(`main.ts`, Node 22) copies `game/` and `screenshots/` to the output
directory and writes `dossier.json`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Screenshots

Real renders of the game, staged deterministically with `?shot=…&seed=1`
(the same seed always stages the same table, so the screenshots are
reproducible):

1. `1-title.jpg` — the title screen
2. `2-play.jpg` — a mid-duel table, both hands and both life totals visible
3. `3-win.jpg` — the victory screen
4. `4-loss.jpg` — the defeat screen

## The four houses

| House | Symbol | Colour | Character |
|-------|--------|--------|-----------|
| Flame | ▲ | red | Fast, aggressive spirits and direct damage |
| Tide  | ● | blue | Sturdy creatures, deep healing, card draw |
| Thorn | ◆ | green | Tough blockers and steady growth |
| Star  | ★ | gold | Wards, bright finishers, the Dawn Sovereign |

<sub>Entered on [make.fun](https://make.fun/?ref=8max8wdd&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
