#!/bin/sh

apply() {
    if wlr-randr | grep -q '^DP-1 '; then
        # External connected
        wlr-randr \
            --output DP-1 --on \
            --mode 1920x1080@143.998 \
            --pos 0,0

        wlr-randr \
            --output eDP-1 --off
    else
        # Laptop only
        wlr-randr \
            --output eDP-1 --on

        sleep 0.3

        wlr-randr \
            --output eDP-1 --custom-mode 2560x1600@60
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
