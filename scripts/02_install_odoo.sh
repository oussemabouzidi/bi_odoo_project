#!/bin/bash
# =============================================================================
# SCRIPT: 02_install_odoo.sh
# PURPOSE: Download, install, and configure Odoo 16 Community Edition
# RUN AS: sudo bash scripts/02_install_odoo.sh
# WHAT IS ODOO?
#   Odoo is an open-source ERP (Enterprise Resource Planning) system.
#   It manages: Sales, Inventory, Accounting, HR, CRM, etc.
#   In our project, Odoo acts as the TRANSACTIONAL system — it stores
#   day-to-day operational data (sales orders, products, customers).
#   Our ETL then reads from Odoo (via its XML-RPC API) and loads into
#   the data warehouse (PostgreSQL datamarts).
# =============================================================================

set -e

echo "============================================="
echo " MedTrack BI — Odoo 16 Installation"
echo "============================================="

ODOO_VERSION="16.0"
ODOO_HOME="/opt/odoo"
ODOO_USER="odoo"
ODOO_DB="odoo_medtrack"
ODOO_PORT="8069"

# -----------------------------------------------------------------------------
# STEP 1: Clone Odoo 16 source code from GitHub
# Odoo Community Edition is free and open source.
# We use --depth=1 to download only the latest commit (saves disk space/time).
# --branch 16.0 checks out the stable 16.0 release branch.
# -----------------------------------------------------------------------------
echo "[1/7] Cloning Odoo 16 from GitHub..."
if [ -d "$ODOO_HOME/odoo-server" ]; then
    echo " (Odoo already cloned, skipping)"
else
    sudo -u $ODOO_USER git clone \
        --depth=1 \
        --branch $ODOO_VERSION \
        https://github.com/odoo/odoo.git \
        $ODOO_HOME/odoo-server
    echo " ✅ Odoo cloned to $ODOO_HOME/odoo-server"
fi

# -----------------------------------------------------------------------------
# STEP 2: Create Python virtual environment for Odoo
# A virtual environment isolates Odoo's Python packages from the system.
# This prevents version conflicts between Odoo and our ETL scripts.
# -----------------------------------------------------------------------------
echo "[2/7] Creating Python virtual environment..."
sudo -u $ODOO_USER python3.11 -m venv $ODOO_HOME/venv
echo " ✅ Virtual environment created at $ODOO_HOME/venv"

# -----------------------------------------------------------------------------
# STEP 3: Install Odoo Python dependencies
# Odoo's requirements.txt lists all Python packages it needs.
# Common ones:
# - Babel: internationalization
# - lxml: XML parsing (for QWeb templates)
# - Pillow: image handling
# - psycopg2: PostgreSQL connection
# - gevent: async networking
# -----------------------------------------------------------------------------
echo "[3/7] Installing Odoo Python dependencies..."
sudo -u $ODOO_USER $ODOO_HOME/venv/bin/pip install --upgrade pip wheel
sudo -u $ODOO_USER $ODOO_HOME/venv/bin/pip install \
    -r $ODOO_HOME/odoo-server/requirements.txt
echo " ✅ Python dependencies installed"

# -----------------------------------------------------------------------------
# STEP 4: Create Odoo configuration file
# /etc/odoo/odoo.conf is read by Odoo at startup.
# Key settings:
#   db_host/port/user/password — PostgreSQL connection
#   addons_path — where Odoo looks for modules (including ours)
#   logfile — where Odoo writes its log
#   http_port — which port the web interface runs on
# -----------------------------------------------------------------------------
echo "[4/7] Creating Odoo configuration..."
mkdir -p /etc/odoo
mkdir -p /var/log/odoo
chown $ODOO_USER:$ODOO_USER /var/log/odoo

cat > /etc/odoo/odoo.conf << EOF
[options]
; ============ DATABASE ============
; PostgreSQL connection settings
db_host = False          ; False = use Unix socket (faster, local only)
db_port = False          ; False = default PostgreSQL port (5432)
db_user = odoo           ; PostgreSQL user (created in 03_setup_postgres.sh)
db_password = odoo_secure_2024  ; Change this in production!
db_name = $ODOO_DB       ; Default database name

; ============ PATHS ============
; addons_path: comma-separated list of directories Odoo searches for modules
; The first path is Odoo's own modules, second is OUR custom module
addons_path = $ODOO_HOME/odoo-server/addons,/opt/odoo_custom_addons

; ============ LOGGING ============
logfile = /var/log/odoo/odoo.log
log_level = info         ; Options: debug, info, warning, error, critical

; ============ NETWORK ============
http_port = $ODOO_PORT   ; Web interface port
http_interface = 0.0.0.0 ; Listen on all interfaces (restrict to 127.0.0.1 in prod)
longpolling_port = 8072   ; For real-time notifications (Discuss module)

; ============ PERFORMANCE ============
workers = 2              ; Number of worker processes (set to CPU cores)
max_cron_threads = 1     ; Threads for scheduled actions
limit_memory_hard = 2684354560   ; 2.5 GB max RAM per worker
limit_time_cpu = 600     ; Max CPU seconds per request
limit_time_real = 1200   ; Max real seconds per request
EOF

chown $ODOO_USER:$ODOO_USER /etc/odoo/odoo.conf
chmod 640 /etc/odoo/odoo.conf
echo " ✅ Configuration written to /etc/odoo/odoo.conf"

# -----------------------------------------------------------------------------
# STEP 5: Create custom addons directory for our module
# Odoo modules (called "addons") live in the addons_path directories.
# Our module "medtrack_bi" will live here.
# -----------------------------------------------------------------------------
echo "[5/7] Creating custom addons directory..."
mkdir -p /opt/odoo_custom_addons
chown $ODOO_USER:$ODOO_USER /opt/odoo_custom_addons

# Copy our custom module there
if [ -d "$(dirname $0)/../odoo_module" ]; then
    cp -r "$(dirname $0)/../odoo_module" \
        /opt/odoo_custom_addons/medtrack_bi
    chown -R $ODOO_USER:$ODOO_USER /opt/odoo_custom_addons/medtrack_bi
    echo " ✅ Custom module copied to /opt/odoo_custom_addons/medtrack_bi"
fi

# -----------------------------------------------------------------------------
# STEP 6: Create systemd service
# systemd manages Odoo as a background service.
# It will: auto-start on boot, restart on crash, log to journald.
# After=postgresql.service: Odoo starts only after PostgreSQL is ready.
# ExecStart: runs Odoo with our config file.
# -----------------------------------------------------------------------------
echo "[6/7] Creating systemd service..."
cat > /etc/systemd/system/odoo16.service << EOF
[Unit]
Description=Odoo 16 Community ERP
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
SyslogIdentifier=odoo16
User=$ODOO_USER
Group=$ODOO_USER
ExecStart=$ODOO_HOME/venv/bin/python3 $ODOO_HOME/odoo-server/odoo-bin \
    --config=/etc/odoo/odoo.conf \
    --logfile=/var/log/odoo/odoo.log
StandardOutput=journal+console
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable odoo16
echo " ✅ Systemd service created"

# -----------------------------------------------------------------------------
# STEP 7: Start Odoo
# After first start, visit http://localhost:8069 to set up the database.
# Use database name: odoo_medtrack
# Email: admin@medtrack.local
# Password: admin (change immediately in production!)
# -----------------------------------------------------------------------------
echo "[7/7] Starting Odoo 16..."
systemctl start odoo16
sleep 3

if systemctl is-active --quiet odoo16; then
    echo " ✅ Odoo 16 is running!"
    echo ""
    echo "  Web UI:  http://localhost:8069"
    echo "  Logs:    journalctl -u odoo16 -f"
    echo "  Config:  /etc/odoo/odoo.conf"
else
    echo " ❌ Odoo failed to start. Check logs:"
    echo "   journalctl -u odoo16 -n 50"
fi

echo ""
echo "============================================="
echo " ✅ Odoo 16 installation complete!"
echo " Next: sudo bash scripts/03_setup_postgres.sh"
echo "============================================="
