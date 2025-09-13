% Sushi Coach — Daily Sushi Recipe Stages

This mini app gives you a different stage of making sushi every day of the week, with simple images and clear explanations. It also includes a macOS notification script that opens the correct stage for the day.

- Monday (1): Rinse & cook rice
- Tuesday (2): Make sushi vinegar
- Wednesday (3): Season & cool rice
- Thursday (4): Prep fillings & tools
- Friday (5): Roll maki
- Saturday (6): Shape nigiri
- Sunday (7): Slice, plate, and serve

## Quick Start

1) Open the viewer any time

- Double‑click `viewer.html` or run:

```
open sushi-coach/viewer.html
```

2) Show today’s stage (and a macOS notification)

- Make the script executable (first time only):

```
chmod +x sushi-coach/notify_today.zsh
```

- Run it:

```
./sushi-coach/notify_today.zsh
```

This posts a macOS notification like “Sushi Coach — Day 5” and opens the correct stage.

3) Optional: Test a specific day

```
./sushi-coach/notify_today.zsh --day 3
```

## Daily Scheduling (Optional)

Use `cron` to trigger the daily stage notification. Example: every day at 9am.

```
crontab -e
```

Add a line like (update the absolute path):

```
0 9 * * * /bin/zsh /Users/you/path/to/repo/sushi-coach/notify_today.zsh
```

Note:
- Notifications use macOS `osascript`. If you’re on another OS, open `notify_today.zsh` and replace that part with your local notifier (e.g., `notify-send` on Linux or PowerShell toast on Windows).
- The viewer runs entirely locally and includes SVG images for each stage.

## What’s Included

- `notify_today.zsh` — macOS notification + opens the correct day’s stage.
- `viewer.html`, `viewer.js`, `styles.css` — The UI, stage logic, and styling.
- `assets/*.svg` — Simple images for each stage.

Enjoy and happy sushi‑making!
