#!/bin/bash

# KMonad setup script for Fedora
set -e

echo "Setting up KMonad on Fedora..."

# Install dependencies
sudo dnf update -y
sudo dnf install -y curl

# Download kmonad
echo "Downloading KMonad..."
curl -LO https://github.com/kmonad/kmonad/releases/download/0.4.1/kmonad-0.4.1-linux
chmod +x kmonad-0.4.1-linux
sudo mv kmonad-0.4.1-linux /usr/local/bin/kmonad
sudo chown root:root /usr/local/bin/kmonad
sudo restorecon -v /usr/local/bin/kmonad

# Create config directory
mkdir -p ~/.config/kmonad

# Find the correct keyboard device
echo "Detecting keyboard device..."
KEYBOARD_DEVICE=""

# First, try to find the main keyboard device (one with 'kbd' handler)
for device in /dev/input/event*; do
    if udevadm info --query=property --name="$device" 2>/dev/null | grep -q "ID_INPUT_KEYBOARD=1"; then
        device_num=$(basename "$device" | sed 's/event//')
        if grep -q "kbd.*event${device_num}" /proc/bus/input/devices 2>/dev/null; then
            KEYBOARD_DEVICE="$device"
            echo "Found main keyboard device: $KEYBOARD_DEVICE (with kbd handler)"
            break
        fi
    fi
done

# If no main keyboard found, fall back to any keyboard device
if [ -z "$KEYBOARD_DEVICE" ]; then
    for device in /dev/input/event*; do
        if udevadm info --query=property --name="$device" 2>/dev/null | grep -q "ID_INPUT_KEYBOARD=1"; then
            KEYBOARD_DEVICE="$device"
            echo "Found keyboard device: $KEYBOARD_DEVICE"
            break
        fi
    done
fi

if [ -z "$KEYBOARD_DEVICE" ]; then
    echo "Warning: Could not auto-detect keyboard device, using /dev/input/event3"
    KEYBOARD_DEVICE="/dev/input/event3"
fi

# Create config file with detected keyboard device
cat > ~/.config/kmonad/config.kbd << EOF
(defcfg
  input  (device-file "$KEYBOARD_DEVICE")
  output (uinput-sink "My KMonad output")
  fallthrough true
  allow-cmd true
)

(defsrc
  esc  f1   f2   f3   f4   f5   f6   f7   f8   f9   f10  f11  f12  home end ins del
  grv  1    2    3    4    5    6    7    8    9    0    -    =    bspc
  tab  q    w    e    r    t    y    u    i    o    p    [    ]    \\
  caps a    s    d    f    g    h    j    k    l    ;    '    ret
  lsft z    x    c    v    b    n    m    ,    .    /    rsft
  lctl lmet lalt           spc            ralt 102d cmp  rctl
)

(defalias
  a_sup (tap-hold-next-release 200 a lmet)
  s_alt (tap-hold-next-release 200 s lalt)
  d_ctl (tap-hold-next-release 200 d lctl)
  f_sft (tap-hold-next-release 200 f lsft)

  j_sft (tap-hold-next-release 200 j rsft)
  k_ctl (tap-hold-next-release 200 k rctl)
  l_alt (tap-hold-next-release 200 l ralt)
  scl_sup (tap-hold-next-release 200 ; rmet)

  ;; Space key - tap for space, hold for navigation layer
  spc_nav (tap-hold-next-release 200 spc (layer-toggle nav))
)

(deflayer base
  esc  f1   f2   f3   f4   f5   f6   f7   f8   f9   f10  f11  f12  home end ins del
  grv  1    2    3    4    5    6    7    8    9    0    -    =    bspc
  tab  q    w    e    r    t    y    u    i    o    p    [    ]    \\
  esc  @a_sup  @s_alt  @d_ctl  @f_sft  g    h    @j_sft  @k_ctl  @l_alt  @scl_sup '    ret
  lsft z    x    c    v    b    n    m    ,    .    /    rsft
  lctl lmet lalt           @spc_nav       bspc del  cmp  rctl
)

(deflayer nav
  _    _    _    _    _    _    _    _    _    _    _    _    _    _    _    _    _
  _    _    _    _    _    _    _    _    _    _    _    _    _    _
  _    _    _    _    _    _    _    _    _    _    _    _    _    _
  _    _    _    _    _    _    left down up   rght _    _    _
  _    _    _    _    _    _    _    _    _    _    _    _
  _    _    _              _              bspc del  _    _
)
EOF

echo "Created KMonad config at ~/.config/kmonad/config.kbd"

# Create systemd service
sudo tee /etc/systemd/system/kmonad.service << EOF
[Unit]
Description=KMonad Keyboard Remapper
After=systemd-user-sessions.service

[Service]
ExecStart=/usr/local/bin/kmonad /home/$USER/.config/kmonad/config.kbd
Restart=always
RestartSec=3
User=root
Group=root

[Install]
WantedBy=multi-user.target
EOF

# Add user to input group
sudo usermod -aG input $USER

# Load uinput module
sudo modprobe uinput
echo "uinput" | sudo tee /etc/modules-load.d/uinput.conf

# Set up udev rules for input devices
sudo tee /etc/udev/rules.d/90-kmonad.rules << EOF
KERNEL=="uinput", MODE="0660", GROUP="input", OPTIONS+="static_node=uinput"
SUBSYSTEM=="input", GROUP="input", MODE="0660"
EOF

# Reload udev rules
sudo udevadm control --reload-rules

# Stop any existing kmonad service
sudo systemctl stop kmonad 2>/dev/null || true

# Reload systemd and start service
sudo systemctl daemon-reload
sudo systemctl enable kmonad
sudo systemctl start kmonad

echo ""
echo "KMonad setup complete!"
echo "Using keyboard device: $KEYBOARD_DEVICE"
echo ""
echo "Check service status with: sudo systemctl status kmonad"
echo "View logs with: journalctl -u kmonad -f"
echo ""
echo "Home row mods configuration:"
echo "  a = Super (when held)"
echo "  s = Alt (when held)"
echo "  d = Ctrl (when held)"
echo "  f = Shift (when held)"
echo "  j = Shift (when held)"
echo "  k = Ctrl (when held)"
echo "  l = Alt (when held)"
echo "  ; = Super (when held)"
echo ""
echo "Navigation layer (Space + key):"
echo "  Space + h = Left arrow"
echo "  Space + j = Down arrow"
echo "  Space + k = Up arrow"
echo "  Space + l = Right arrow"
echo ""
echo "Additional convenience keys:"
echo "  Right Alt (AltGr) = Backspace"
echo "  Angle brackets key (<>|) = Delete"
echo ""
echo "You may need to log out and log back in for group changes to take effect."
