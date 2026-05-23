
# In case if GTK breakes something
```bash
gsettings reset org.gnome.desktop.interface gtk-theme
gsettings reset org.gnome.desktop.interface color-scheme
gsettings reset org.gnome.desktop.interface icon-theme
mv ~/.config/gtk-3.0 ~/.config/gtk-3.0.bak
mv ~/.config/gtk-4.0 ~/.config/gtk-4.0.bak
```
# Comment out lines like these if you find them:
`env = GTK_THEME, Some-Dark-Theme`

# Monitor
```bash
wlr-randr 
wlr-randr --output eDP-1 --custom-mode 2560x1600@60
```

# Screen Share
``` bash
sudo pacman -S xdg-desktop-portal xdg-desktop-portal-wlr
killall xdg-desktop-portal xdg-desktop-portal-wlr
```

# Audio Control
```bash
sudo pacman -S pavucontrol
```

```bash
sudo pacman -S thunar thunar-volman
xdg-mime default thunar.desktop inode/directory
```

# Key names
```bash
sudo pacman -S wev
wev
```

# Idle Management
```bash
sudo pacman -S swayidle

vim ~/.config/mango/scripts/idle.sh

#!/bin/bash
killall swayidle 2>/dev/null
swayidle -w \
    timeout 300 'qs -c noctalia-shell ipc call lockScreen lock' \
    timeout 600 'systemctl suspend' \
    before-sleep 'qs -c noctalia-shell ipc call lockScreen lock' &
    
chmod +x ~/.config/mango/scripts/idle.sh
spawn ~/.config/mango/scripts/idle.sh # add it into autostart section
```

# Desktop Aplication Bridge for Auth
```bash
sudo pacman -S xdg-desktop-portal xdg-desktop-portal-gtk
```

# Cisco Packet Tracer Arch Installer
https://aur.archlinux.org/packages/packettracer


# Wazuh Agent Arch Config
``` sh
# 1. Update the configuration to point to your local Docker manager
 sudo sed -i 's/MANAGER_IP/127.0.0.1/g' /var/ossec/etc/ossec.conf
 # 2. Start the agent service
 sudo systemctl restart wazuh-agent
 # 3. Verify it is finally running without errors
 systemctl status wazuh-agent
 ```
