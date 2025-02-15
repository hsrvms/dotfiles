#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print error messages
error() {
    echo -e "${RED}ERROR: $1${NC}" >&2
}

# Function to print success messages
success() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
}

# Function to print info messages
info() {
    echo -e "${YELLOW}INFO: $1${NC}"
}

# Check if script is run as root
if [ "$EUID" -ne 0 ]; then
    error "This script must be run as root (with sudo)"
    exit 1
fi

# Define the service file path
SERVICE_FILE="/etc/systemd/system/reset-ethernet.service"

# Create the systemd service file
info "Creating systemd service file..."
cat > "$SERVICE_FILE" << 'EOL'
[Unit]
Description=Reset Ethernet Interface on Boot
After=network.target

[Service]
Type=oneshot
ExecStart=/sbin/ip link set enp2s0 down
ExecStart=/sbin/ip link set enp2s0 up
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOL

# Check if file was created successfully
if [ ! -f "$SERVICE_FILE" ]; then
    error "Failed to create service file"
    exit 1
fi

# Set proper permissions
info "Setting file permissions..."
chmod 644 "$SERVICE_FILE"

# Reload systemd to recognize the new service
info "Reloading systemd daemon..."
systemctl daemon-reload

# Enable the service
info "Enabling the service..."
if systemctl enable reset-ethernet.service; then
    success "Service enabled successfully"
else
    error "Failed to enable service"
    exit 1
fi

# Start the service
info "Starting the service..."
if systemctl start reset-ethernet.service; then
    success "Service started successfully"
else
    error "Failed to start service"
    exit 1
fi

# Check service status
info "Checking service status..."
if systemctl is-active --quiet reset-ethernet.service; then
    success "Service is running"
else
    error "Service failed to start"
    exit 1
fi

success "Ethernet fix installation completed successfully!"
echo -e "\nYou can check the service status anytime with:"
echo "sudo systemctl status reset-ethernet.service"
