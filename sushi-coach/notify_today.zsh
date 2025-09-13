#!/bin/zsh
# Sushi Coach: show today's sushi stage as a macOS notification and open the viewer.

set -euo pipefail

script_dir="${0:A:h}"
viewer_file="$script_dir/viewer.html"

day=""
if [[ ${1:-} == "--day" && -n ${2:-} ]]; then
  day="$2"
fi

if [[ -z "$day" ]]; then
  # 1..7 (Mon..Sun)
  day=$(date +%u)
fi

if ! [[ "$day" == <-> && $day -ge 1 && $day -le 7 ]]; then
  echo "Day must be 1..7 (Mon..Sun). Got: $day" >&2
  exit 1
fi

typeset -A STAGE
STAGE[1]="Rinse & Cook Sushi Rice"
STAGE[2]="Make Sushi Vinegar (Awase-zu)"
STAGE[3]="Season & Cool the Rice"
STAGE[4]="Prep Fillings, Nori, and Tools"
STAGE[5]="Roll Maki (Hosomaki/Futomaki)"
STAGE[6]="Shape Nigiri"
STAGE[7]="Slice, Plate, and Serve"

title="Sushi Coach — Day $day"
subtitle="${STAGE[$day]}"
message="Open window for details, images, and step-by-step."

# macOS notification via AppleScript
osascript -e "display notification \"$message\" with title \"$title\" subtitle \"$subtitle\""

# Open the viewer at the correct day.
open "${viewer_file}#day=$day"

exit 0
