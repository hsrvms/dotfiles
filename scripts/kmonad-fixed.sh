#!/bin/bash

# Install dependencies
sudo apt update
sudo apt install -y curl

# Download kmonad
curl -LO https://github.com/kmonad/kmonad/releases/download/0.4.1/kmonad-0.4.1-linux
chmod +x kmonad-0.4.1-linux
sudo mv kmonad-0.4.1-linux /usr/local/bin/kmonad

# Create config directory
mkdir -p ~/.config/kmonad

# Create config file
cat > ~/.config/kmonad/config.kbd << 'EOF'
(defcfg
  input  (device-file "/dev/input/event0")
  output (uinput-sink "My KMonad output")
  fallthrough true
  allow-cmd true
)

(defsrc
  esc  f1   f2   f3   f4   f5   f6   f7   f8   f9   f10  f11  f12  home end ins del
  grv  1    2    3    4    5    6    7    8    9    0    -    =    bspc
  tab  q    w    e    r    t    y    u    i    o    p    [    ]    \
  caps a    s    d    f    g    h    j    k    l    ;    '    ret
  lsft z    x    c    v    b    n    m    ,    .    /    rsft
  lctl lmet lalt           spc            ralt rmet cmp  rctl
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
)

(deflayer base
  esc  f1   f2   f3   f4   f5   f6   f7   f8   f9   f10  f11  f12  home end ins del
  grv  1    2    3    4    5    6    7    8    9    0    -    =    bspc
  tab  q    w    e    r    t    y    u    i    o    p    [    ]    \
  esc  @a_sup  @s_alt  @d_ctl  @f_sft  g    h    @j_sft  @k_ctl  @l_alt  @scl_sup '    ret
  lsft z    x    c    v    b    n    m    ,    .    /    rsft
  lctl lmet lalt           spc            ralt rmet cmp  rctl
)
EOF

# Create systemd service with expanded $USER
sudo tee /etc/systemd/system/kmonad.service << EOF
[Unit]
Description=KMonad Keyboard Remapper
After=systemd-user-sessions.service

[Service]
ExecStart=/usr/local/bin/kmonad /home/$USER/.config/kmonad/config.kbd
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Add user to input group
sudo usermod -aG input $USER

# Restart kmonad
sudo systemctl daemon-reload
sudo systemctl restart kmonad

echo "Run 'journalctl -u kmonad' to check for errors"