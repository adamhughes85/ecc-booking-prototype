# ECC Booking Prototype

High-fidelity browser prototype of the current booking behavior:

1. Date/time selection
2. Topic selection + confirmation panel
3. Success confirmation modal
4. Current bookings page update

## Run

From `/Users/adamhughes/Desktop/Codex/ECC/booking-prototype`:

```bash
python3 -m http.server 4173
```

Then open:

- `http://localhost:4173`

## Routes

- `#/book/date-time`
- `#/book/topic`
- `#/book/confirm` (alias of topic/confirm screen)
- `#/bookings`

## Hidden debug panel

- Toggle: `Shift + D`
- Controls:
  - Demo today date
  - Max concurrent bookings
  - Booking horizon days

State is intentionally in-memory only and resets on refresh.
