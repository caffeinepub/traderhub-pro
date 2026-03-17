# TraderHub Pro

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Trading Journal: log trades with pair, direction, entry/exit price, lot size, result (pips/profit), notes, date
- Pips Calculator: input pair, lot size, entry, exit to calculate pips and monetary profit/loss
- Messenger: chat with friends, send text, photos, files; friend list management
- Today's Profit Dashboard: summary of today's trades, total P&L, win/loss count, running balance
- Discipline Checklist: pre-trade checklist (customizable items), mark items complete before trading
- Daily Risk Management: set daily loss limit and profit target; visual progress bars; auto-alert when limits hit
- Extra: Trade Statistics overview (win rate, average RR, best/worst trade)

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend: user profiles, trade journal entries CRUD, pips calculator logic, messenger (conversations + messages), discipline checklist items, daily risk settings, today's profit aggregation
2. Components: authorization (user accounts), blob-storage (photos/files in messenger)
3. Frontend: sidebar navigation with 7 sections; dark trading-themed UI
   - Dashboard (Today's Profit + risk gauges)
   - Trading Journal (table + add trade form)
   - Pips Calculator (live calculator form)
   - Messenger (friend list + chat window)
   - Discipline Checklist (morning checklist)
   - Risk Management (daily loss limit + profit target)
   - Statistics (win rate, RR, equity curve)
