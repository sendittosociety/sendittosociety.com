#!/bin/sh
# ── RE-ENCODE THE SCROLL PLATES FROM SOURCE ──────────────────────────────────
#
# WHY THIS EXISTS. The plates looked soft, and the instinct was that they needed
# more resolution. They did not. Measured on the bedroom whiteboard, three ways
# from the same source second:
#
#   ships-today  crop 1550 -> upscaled 1600, crf 31    0.47 MB/s   "of the empire" unreadable
#   same framing, crf 23 + unsharp                     1.23 MB/s   reads cleanly
#   native 1700 crop, crf 23 + unsharp                 1.52 MB/s   no better than the above
#
# So it was the bitrate, not the pixels. That matters, because keeping the
# framing means nothing gets recomposed and the scenes stay as they were
# approved.
#
# ONE CRF FOR EVERY PLATE. crf is a quality target, not a bitrate, so a single
# value gives uniform perceived quality across a still penthouse and a moving
# drive — which is the point. A single bitrate would do the opposite.
#
# EVERY FRAME IS A KEYFRAME (-g 1). A 12-frame group costs 35 ms per seek,
# all-keyframe costs 7.8 ms, and the 60 fps budget is 16.7 ms. Non-negotiable.
#
# THE CEILING IS NOT HERE. Medal is set to FULL_HD, so it downscales the
# 2560x1392 app window to 1974x1080 before any of this runs. Everything below
# is squeezing the last out of a source that already threw a third of the
# picture away. Set Medal to 1440p and re-run this file.
#
# THE THEATER IS NOT LISTED. Its source recording is gone; only the already
# compressed 1600px plate survives, and re-encoding that cannot put back what
# was thrown away. It needs re-recording.
set -e
M="C:/Users/too_g/OneDrive/Desktop/Claude/sits-site/media"
CLIPS="C:/Medal/Clips/Send It To Society"
EDITS="C:/Medal/Edits"
# crf 31, measured on the hero's COMICSNEXT tower: at 26 it is sharper by an
# amount nobody will see and costs 82 MB for 34 seconds; at 35 the tower windows
# smear together and the sign goes mushy. 31 is where the curve bends.
CRF=${CRF:-31}
K="-c:v libx264 -g 1 -keyint_min 1 -sc_threshold 0 -pix_fmt yuv420p -an -movflags +faststart"
SHARP="unsharp=5:5:0.8:5:5:0.0"          # answers Medal's own softness, not a stylistic filter

# plate | source | in | duration | crop (recovered by SSIM-matching each shipped
#                                        plate's first frame back to its source)
plate () {
  name=$1; src=$2; ss=$3; dur=$4; crop=$5
  ffmpeg -v error -y -ss "$ss" -t "$dur" -i "$src" \
    -vf "${crop},${SHARP},scale=1600:-2:flags=lanczos" $K -crf $CRF "$M/$name.mp4"
  ffmpeg -v error -y -ss "$ss" -i "$src" -frames:v 1 \
    -vf "${crop},${SHARP},scale=1600:-2:flags=lanczos" -q:v 3 "$M/$name.jpg"
  printf "  %-10s %6.1f MB  %s\n" "$name" \
    "$(stat -c%s "$M/$name.mp4" | awk '{print $1/1048576}')" "$crop"
}

echo "re-encoding at crf $CRF ..."
plate hero      "$CLIPS/MedalTVSendItToSociety20260902223808009.mp4"                  13.70 34.04 "crop=1550:810:350:100"
plate empty     "$EDITS/MedalTVSendItToSociety20260902224233357-trim-1788406967858.mp4" 3.13 14.04 "crop=1550:792:350:180"
plate bedroom   "$EDITS/MedalTVSendItToSociety20260902165710070-trim-1788386255011.mp4"    0 14.92 "crop=1550:900:350:120"
plate penthouse "$EDITS/MedalTVSendItToSociety20260902223939979-trim-1788406801955.mp4" 4.35 14.04 "crop=1550:868:350:140"
plate market    "$EDITS/MedalTVSendItToSociety20260902165912277-trim-1788386392114.mp4"    0  9.22 "crop=1550:900:350:120"
plate drive     "$EDITS/MedalTVSendItToSociety20260902184622192-trim-1788392817991.mp4"    9 24.00 "crop=1974:1080:0:0"
echo "theater: source gone, left as-is"
printf "media total %.1f MB\n" "$(du -sb "$M" | awk '{print $1/1048576}')"
