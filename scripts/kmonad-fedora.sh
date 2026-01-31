#!/bin/bash

set -e

echo "Setting up KMonad on Fedora..."

sudo dnf update -y
sudo dnf install -y curl

echo "Downloading KMonad..."
curl -LO https://github.com/kmonad/kmonad/releases/download/0.4.1/kmonad-0.4.1-linux
chmod +x kmonad-0.4.1-linux
sudo mv kmonad-0.4.1-linux /usr/local/bin/kmonad
sudo chown root:root /usr/local/bin/kmonad
sudo restorecon -v /usr/local/bin/kmonad

mkdir -p ~/.config/kmonad

echo "Detecting keyboard device..."
KEYBOARD_DEVICE=""

KBD_EVENT=$(grep -E 'Name|Handlers' /proc/bus/input/devices | \
    grep -A 1 "AT Translated Set 2 keyboard" | \
    grep -oE 'event[0-9]+' | head -n 1)

if [ -n "$KBD_EVENT" ]; then
    KEYBOARD_DEVICE="/dev/input/$KBD_EVENT"
    echo "Successfully found internal keyboard: $KEYBOARD_DEVICE"
else
    echo "Warning: Could not match by name, falling back to event2"
    KEYBOARD_DEVICE="/dev/input/event2"
fi

if [ -z "$KEYBOARD_DEVICE" ]; then
    echo "Warning: Could not auto-detect keyboard, using /dev/input/event2 as default."
    KEYBOARD_DEVICE="/dev/input/event2"
fi

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

sudo usermod -aG input $USER

sudo modprobe uinput
echo "uinput" | sudo tee /etc/modules-load.d/uinput.conf

sudo tee /etc/udev/rules.d/90-kmonad.rules << EOF
KERNEL=="uinput", MODE="0660", GROUP="input", OPTIONS+="static_node=uinput"
SUBSYSTEM=="input", GROUP="input", MODE="0660"
EOF

sudo udevadm control --reload-rules

sudo systemctl stop kmonad 2>/dev/null || true

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
