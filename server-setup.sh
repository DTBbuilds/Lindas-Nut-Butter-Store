#!/bin/bash
# Server Setup Script for Linda's Nut Butter Store
# This script should be run on your production server after uploading your application files

# Exit on any error
set -e

# Text colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print colored message
print_message() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  print_error "Please run as root (use sudo)"
  exit 1
fi

# Update system packages
print_message "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install Node.js and npm if not already installed
if ! command -v node &> /dev/null; then
  print_message "Installing Node.js and npm..."
  curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
  apt-get install -y nodejs
fi

# Install PM2 globally
print_message "Installing PM2 process manager..."
npm install -g pm2

# Install Nginx
print_message "Installing Nginx..."
apt-get install -y nginx

# Install Certbot for SSL
print_message "Installing Certbot for SSL certificates..."
apt-get install -y certbot python3-certbot-nginx

# Create application directory
APP_DIR="/var/www/lindas-nut-butter"
print_message "Creating application directory at $APP_DIR..."
mkdir -p $APP_DIR
mkdir -p $APP_DIR/logs

# Set up Nginx configuration
print_message "Setting up Nginx configuration..."
if [ -f "./nginx.conf.example" ]; then
  cp ./nginx.conf.example /etc/nginx/sites-available/lindas-nut-butter
  
  # Prompt for domain name
  read -p "Enter your domain name (e.g., example.com): " DOMAIN_NAME
  
  # Replace placeholder with actual domain
  sed -i "s/your-domain.com/$DOMAIN_NAME/g" /etc/nginx/sites-available/lindas-nut-butter
  
  # Enable the site
  ln -sf /etc/nginx/sites-available/lindas-nut-butter /etc/nginx/sites-enabled/
  
  # Test Nginx configuration
  nginx -t
  
  # Reload Nginx
  systemctl reload nginx
else
  print_warning "nginx.conf.example not found. Skipping Nginx configuration."
fi

# Set up SSL with Certbot
print_message "Would you like to set up SSL with Let's Encrypt? (y/n)"
read -p "" SETUP_SSL

if [ "$SETUP_SSL" = "y" ]; then
  print_message "Setting up SSL with Let's Encrypt..."
  certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME
else
  print_warning "Skipping SSL setup. You should set this up manually later."
fi

# Set up environment variables
print_message "Setting up environment variables..."
if [ -f "./.env.production" ]; then
  cp ./.env.production $APP_DIR/.env
  print_message "Environment variables copied. Please update them with your production values."
else
  print_warning ".env.production not found. You'll need to create this file manually."
  touch $APP_DIR/.env
fi

# Set up PM2 ecosystem
print_message "Setting up PM2 ecosystem..."
if [ -f "./ecosystem.config.js" ]; then
  cp ./ecosystem.config.js $APP_DIR/
else
  print_warning "ecosystem.config.js not found. Creating a basic one..."
  cat > $APP_DIR/ecosystem.config.js << EOL
module.exports = {
  apps: [{
    name: "lindas-nut-butter",
    script: "server/index.js",
    env_production: {
      NODE_ENV: "production",
      PORT: 5000
    },
    instances: "max",
    exec_mode: "cluster",
    max_memory_restart: "500M",
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    error_file: "logs/error.log",
    out_file: "logs/out.log"
  }]
};
EOL
fi

# Set up log rotation
print_message "Setting up log rotation..."
cat > /etc/logrotate.d/lindas-nut-butter << EOL
$APP_DIR/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data www-data
}
EOL

# Set proper permissions
print_message "Setting proper permissions..."
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

# Install PM2 logrotate module
print_message "Installing PM2 logrotate module..."
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Set up PM2 to start on boot
print_message "Setting up PM2 to start on boot..."
pm2 startup
env PATH=$PATH:/usr/bin pm2 startup systemd -u www-data --hp $APP_DIR

print_message "Server setup completed!"
print_message "Next steps:"
print_message "1. Copy your application files to $APP_DIR"
print_message "2. Navigate to $APP_DIR and run 'npm install --production'"
print_message "3. Start the application with 'pm2 start ecosystem.config.js --env production'"
print_message "4. Save the PM2 process list with 'pm2 save'"
print_message "5. Update your MongoDB connection string and M-Pesa credentials in $APP_DIR/.env"
