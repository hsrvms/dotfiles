#!/bin/bash

echo "Setting up GNOME configurations..."

# Disable animations
gsettings set org.gnome.desktop.interface enable-animations false

# Workspace settings
gsettings set org.gnome.mutter workspaces-only-on-primary true
gsettings set org.gnome.mutter dynamic-workspaces false
gsettings set org.gnome.desktop.wm.preferences num-workspaces 9

# Disable standalone Super key and set Activities to Super+Space
gsettings set org.gnome.mutter overlay-key ''
gsettings set org.gnome.shell.keybindings toggle-overview "['<Super>space']"

# Remove default Super+Space from input switching
gsettings set org.gnome.desktop.wm.keybindings switch-input-source "['XF86Keyboard']"
gsettings set org.gnome.desktop.wm.keybindings switch-input-source-backward "['<Shift>XF86Keyboard']"

# Window management
gsettings set org.gnome.desktop.wm.keybindings close "['<Super><Shift>q']"

# Workspace switching
echo "Setting up workspace switching shortcuts..."
for i in {1..9}; do
    gsettings set org.gnome.desktop.wm.keybindings "switch-to-workspace-$i" "['<Super>$i']"
    gsettings set org.gnome.desktop.wm.keybindings "move-to-workspace-$i" "['<Super><Shift>$i']"
done

# Disable conflicting application switching shortcuts
echo "Disabling conflicting application shortcuts..."
for i in {1..9}; do
    gsettings set org.gnome.shell.keybindings "switch-to-application-$i" "[]"
done

# Custom application shortcuts
echo "Setting up custom application shortcuts..."

# Create custom keybinding paths
gsettings set org.gnome.settings-daemon.plugins.media-keys custom-keybindings "['/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/', '/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom1/']"

# Warp Terminal
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/ name "Launch Warp Terminal"
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/ command "warp-terminal"
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/ binding "<Super>Return"

# Google Chrome
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom1/ name "Launch Google Chrome"
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom1/ command "google-chrome"
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom1/ binding "<Super><Shift>Return"

echo "GNOME setup completed!"

# Verify key settings
echo -e "\nVerifying settings..."
echo "Activities shortcut:"
gsettings get org.gnome.shell.keybindings toggle-overview
echo "Workspace 1 shortcut:"
gsettings get org.gnome.desktop.wm.keybindings switch-to-workspace-1
echo "Close window shortcut:"
gsettings get org.gnome.desktop.wm.keybindings close
echo "Custom shortcuts:"
gsettings get org.gnome.settings-daemon.plugins.media-keys custom-keybindings
