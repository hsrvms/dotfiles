#!/bin/sh

apply() {
    if wlr-randr | grep -q '^DP-1 '; then
        # Docked: laptop (eDP-1) on the left, external (DP-1) on the right
        # eDP-1 custom 2560x1600 @ scale 1.25 => logical width 2048,
        # so DP-1 sits at x=2048
        wlr-randr \
            --output eDP-1 --on --custom-mode 2560x1600@60 --pos 0,0 \
            --output DP-1 --on --mode 1920x1080@143.998 --pos 2048,0
    else
        # Laptop only: internal on
        wlr-randr \
            --output eDP-1 --on --custom-mode 2560x1600@60
    fi
}

# Apply once at startup
apply

# Watch for DRM hotplug events
udevadm monitor --subsystem-match=drm --udev |
while read -r line; do
    case "$line" in
        *change*)
            sleep 0.5
            apply
            ;;
    esac
done