#!/bin/bash

# Check if gsettings command exists
if ! command -v gsettings &> /dev/null; then
    echo "gsettings command not found. Please ensure GNOME is installed."
    exit 1
fi

# Function to set gsettings
set_gsetting() {
    if ! gsettings set "$1" "$2" "$3"; then
        echo "Failed to set $1 $2"
        return 1
    fi
}

# Dock settings
set_gsetting org.gnome.shell.extensions.dash-to-dock autohide-in-fullscreen true
set_gsetting org.gnome.shell.extensions.dash-to-dock dock-fixed false
set_gsetting org.gnome.shell.extensions.dash-to-dock autohide true
set_gsetting org.gnome.shell.extensions.dash-to-dock intellihide false

# Disable workspace switching animations
set_gsetting org.gnome.desktop.interface enable-animations false
set_gsetting org.gnome.mutter workspaces-only-on-primary true

# Workspace switching shortcuts
for i in {1..9}; do
    set_gsetting org.gnome.desktop.wm.keybindings "switch-to-workspace-$i" "['<Super>$i']"
    set_gsetting org.gnome.desktop.wm.keybindings "move-to-workspace-$i" "['<Super><Shift>$i']"
done

# Window management
set_gsetting org.gnome.desktop.wm.keybindings close "['<Super><Shift>q']"

# Application shortcuts
CUSTOM_KEYS_PATH="org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings"

# Warp terminal
set_gsetting "$CUSTOM_KEYS_PATH/launch-warp/" binding '<Super>Return'
set_gsetting "$CUSTOM_KEYS_PATH/launch-warp/" command 'warp-terminal'
set_gsetting "$CUSTOM_KEYS_PATH/launch-warp/" name 'Launch Warp Terminal'

# Google Chrome
set_gsetting "$CUSTOM_KEYS_PATH/launch-chrome/" binding '<Super><Shift>Return'
set_gsetting "$CUSTOM_KEYS_PATH/launch-chrome/" command 'google-chrome'
set_gsetting "$CUSTOM_KEYS_PATH/launch-chrome/" name 'Launch Google Chrome'
