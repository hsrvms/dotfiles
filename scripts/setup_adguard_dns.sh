#!/bin/bash
set -e

# --- Configuration ---
DNS_CONF_DIR="/etc/systemd/resolved.conf.d"
DNS_CONF_FILE="$DNS_CONF_DIR/adguard.conf"
TOGGLE_SCRIPT_PATH="/usr/local/bin/adguard-dns"

# Check for root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (sudo ./setup-adguard-dns.sh)"
  exit 1
fi

echo "--- 1. Setting up AdGuard DNS over TLS ---"

# Create the directory if it doesn't exist
mkdir -p "$DNS_CONF_DIR"

# Write the config file (Defaulting to ON)
cat <<EOF > "$DNS_CONF_FILE"
[Resolve]
DNS=94.140.14.14#dns.adguard-dns.com 94.140.15.15#dns.adguard-dns.com
DNSOverTLS=yes
EOF

# Restart service to apply
systemctl restart systemd-resolved
echo "✅ AdGuard DNS enabled."


echo "--- 2. Creating Toggle Command ---"

# We write a separate script into /usr/local/bin
cat <<'EOF' > "$TOGGLE_SCRIPT_PATH"
#!/bin/bash

CONF_FILE="/etc/systemd/resolved.conf.d/adguard.conf"
DISABLED_FILE="/etc/systemd/resolved.conf.d/adguard.conf.disabled"

if [ "$1" == "on" ]; then
    if [ -f "$DISABLED_FILE" ]; then
        mv "$DISABLED_FILE" "$CONF_FILE"
        systemctl restart systemd-resolved
        echo "✅ AdGuard DNS is now ON."
    else
        echo "ℹ️  AdGuard DNS is already active (or config missing)."
    fi

elif [ "$1" == "off" ]; then
    if [ -f "$CONF_FILE" ]; then
        mv "$CONF_FILE" "$DISABLED_FILE"
        systemctl restart systemd-resolved
        echo "❌ AdGuard DNS is now OFF (System default)."
    else
        echo "ℹ️  AdGuard DNS is already disabled."
    fi

elif [ "$1" == "status" ]; then
    resolvectl status | grep -A 5 "DNS Servers"

else
    echo "Usage: adguard-dns [on|off|status]"
    exit 1
fi
EOF

# Make the toggle script executable
chmod +x "$TOGGLE_SCRIPT_PATH"

echo "✅ Command installed: adguard-dns"
echo "---------------------------------------------------"
echo "Setup Complete!"
echo "Usage:"
echo "  sudo adguard-dns off   # Disable AdGuard"
echo "  sudo adguard-dns on    # Enable AdGuard"
echo "---------------------------------------------------"
