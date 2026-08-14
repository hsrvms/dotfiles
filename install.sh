#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Starting Hyprland environment bootstrap..."

# 1. Ensure base development tools are installed
echo "Installing base-devel and git..."
sudo pacman -S --needed --noconfirm base-devel git

# 2. Check for yay, install if missing
if ! command -v yay &> /dev/null; then
    echo "AUR helper 'yay' not found. Installing yay-bin..."
    git clone https://aur.archlinux.org/yay-bin.git /tmp/yay-bin
    cd /tmp/yay-bin
    makepkg -si --noconfirm
    cd - > /dev/null
    rm -rf /tmp/yay-bin
    echo "yay installed successfully."
else
    echo "yay is already installed."
fi

# 3. Define the package array
PACKAGES=(
    # Core & Daemons
    hyprpolkitagent
    hyprpaper
    wireplumber
    pavucontrol
    playerctl
    brightnessctl
    network-manager-applet
    blueman

    # Navigation & Interface
    foot
    rofi-wayland
    thunar
    yazi
    ffmpegthumbnailer
    p7zip
    jq
    poppler
    fd
    ripgrep
    fzf
    zoxide
    imagemagick
    mpv
    imv
    btop
    wev

    # Desktop Environment Utilities
    waybar
    wl-clipboard
    cliphist
    grim
    slurp
    swappy
    swaync

    # Power & Lock
    hyprlock
    hypridle
    wlogout

    # Keyboard Customization
    # grep -E 'Name|Handlers' /proc/bus/input/devices | grep -A 1 "AT Translated Set 2"
    kmonad-static

    papirus-icon-theme
)

# Execute the installation
echo "Installing packages..."
yay -S --needed --noconfirm "${PACKAGES[@]}"

ya pkg add yazi-rs/flavors:catppuccin-mocha
# Set imv for images
xdg-mime default imv.desktop image/jpeg image/png image/gif image/webp image/svg+xml
# Set mpv for videos
xdg-mime default mpv.desktop video/mp4 video/x-matroska video/webm

# Post-Installation Configuration for Kmonad
echo "Setting up KMonad system permissions..."
# Add your user to the input group
sudo usermod -aG input $USER

# Ensure the uinput kernel module loads on boot
sudo modprobe uinput
echo "uinput" | sudo tee /etc/modules-load.d/uinput.conf

# Create the udev rules to grant the input group access to uinput
sudo tee /etc/udev/rules.d/90-kmonad.rules << 'EOF'
KERNEL=="uinput", MODE="0660", GROUP="input", OPTIONS+="static_node=uinput"
SUBSYSTEM=="input", GROUP="input", MODE="0660"
EOF

# Reload udev rules so they apply instantly
sudo udevadm control --reload-rules
sudo udevadm trigger

ln -sf ~/dotfiles/btop ~/.config/btop
ln -sf ~/dotfiles/cliphist ~/.config/cliphist
ln -sf ~/dotfiles/fastfetch ~/.config/fastfetch
ln -sf ~/dotfiles/fish ~/.config/fish
ln -sf ~/dotfiles/helix ~/.config/helix
ln -sf ~/dotfiles/hypr ~/.config/hypr
ln -sf ~/dotfiles/kitty ~/.config/kitty
ln -sf ~/dotfiles/kmonad ~/.config/kmonad
ln -sf ~/dotfiles/rofi ~/.config/rofi
sudo ln -sf ~/dotfiles/sddm.conf.d ~/.config/sddm.conf.d
ln -sf ~/dotfiles/swaync ~/.config/swaync
ln -sf ~/dotfiles/warp-terminal ~/.config/warp-terminal
ln -sf ~/dotfiles/waybar ~/.config/waybar
ln -sf ~/dotfiles/wlogout ~/.config/wlogout
sudo ln -sf ~/dotfiles/xorg.conf.d/50-mouse-acceleration.conf /etc/X11/xorg.conf.d/50-mouse-acceleration.conf
ln -sf ~/dotfiles/yazi ~/.config/yazi
ln -sf ~/dotfiles/zed ~/.config/zed
ln -sf ~/dotfiles/tmux/tmux.conf ~/.tmux.conf

gsettings set org.gnome.desktop.interface cursor-theme 'catppuccin-mocha-blue-cursors'

echo "========================================================"
echo "Installation complete!"
echo "IMPORTANT: You have been added to the 'input' and 'uinput' groups."
echo "You MUST log out and log back in (or reboot) for these group changes to take effect before Kmonad will run without sudo."
echo "========================================================"
