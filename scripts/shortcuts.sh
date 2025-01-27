#!/bin/bash

# Disable animations
gsettings set org.gnome.desktop.interface enable-animations false

# Set workspaces only on primary monitor
gsettings set org.gnome.mutter workspaces-only-on-primary true

# Disable dynamic workspaces
gsettings set org.gnome.mutter dynamic-workspaces false

# Set fixed number of workspaces
gsettings set org.gnome.desktop.wm.preferences num-workspaces 9

# Disable application switching shortcuts
for i in {1..9}; do
    gsettings set org.gnome.shell.keybindings "switch-to-application-$i" "[]"
done

# Reset all workspace switching keybindings
for i in {1..9}; do
    gsettings reset org.gnome.desktop.wm.keybindings "switch-to-workspace-$i"
    gsettings reset org.gnome.desktop.wm.keybindings "move-to-workspace-$i"
done

# Set them again
for i in {1..9}; do
    gsettings set org.gnome.desktop.wm.keybindings "switch-to-workspace-$i" "['<Super>$i']"
    gsettings set org.gnome.desktop.wm.keybindings "move-to-workspace-$i" "['<Super><Shift>$i']"
done

gsettings list-recursively | grep -i "super.*[1-9]"

# Window management
gsettings set org.gnome.desktop.wm.keybindings close "['<Super><Shift>q']"

# Warp Terminal (custom0)
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/ name "Launch Warp Terminal"
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/ command "warp-terminal"
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/ binding "<Super>Return"

# Google Chrome (custom1)
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom1/ name "Launch Google Chrome"
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom1/ command "google-chrome"
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom1/ binding "<Super><Shift>Return"

# You can verify the shortcuts are set correctly
gsettings get org.gnome.settings-daemon.plugins.media-keys custom-keybindings

# And check specific shortcut details with
gsettings list-recursively org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/
gsettings list-recursively org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom1/
