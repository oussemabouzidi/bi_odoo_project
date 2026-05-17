#!/bin/bash
# =============================================================================
# SCRIPT: 01_install_system.sh
# PURPOSE: Install all system dependencies on Ubuntu 22.04 LTS
# RUN AS: sudo bash scripts/01_install_system.sh
# =============================================================================

set -e  # Exit immediately if any command fails

echo "============================================="
echo " MedTrack BI — System Installation"
echo "============================================="

# -----------------------------------------------------------------------------
# STEP 1: Update package index
# apt-get update downloads the latest list of available packages.
# Without this, apt may install outdated versions.
# -----------------------------------------------------------------------------
echo "[1/8] Updating package index..."
apt-get update -y

# -----------------------------------------------------------------------------
# STEP 2: Install system utilities
# - curl: download files from the internet (needed for Node.js installer)
# - wget: alternative downloader
# - git: version control
# - build-essential: C compiler + make (required to compile Python packages)
# - libssl-dev: OpenSSL headers (needed by Python's ssl module)
# - libffi-dev: Foreign Function Interface (used by some Python packages)
# - python3-dev: Python C headers (required to build psycopg2, lxml, etc.)
# -----------------------------------------------------------------------------
echo "[2/8] Installing system utilities..."
apt-get install -y \
    curl wget git \
    build-essential \
    libssl-dev libffi-dev \
    python3.11 python3.11-dev python3.11-venv python3-pip \
    libpq-dev \
    libxml2-dev libxslt1-dev \
    libjpeg-dev libpng-dev \
    libldap2-dev libsasl2-dev \
    nodejs npm \
    nginx \
    htop unzip

# -----------------------------------------------------------------------------
# STEP 3: Install PostgreSQL 15
# We use version 15 for JSON operators and improved performance.
# postgresql-client is needed for psql CLI commands.
# -----------------------------------------------------------------------------
echo "[3/8] Installing PostgreSQL 15..."

# Add PostgreSQL official APT repository for the latest stable version
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
    | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg

echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
    > /etc/apt/sources.list.d/pgdg.list

apt-get update -y
apt-get install -y postgresql-15 postgresql-client-15 postgresql-contrib-15

# Start and enable PostgreSQL so it auto-starts on reboot
systemctl start postgresql
systemctl enable postgresql

echo " ✅ PostgreSQL 15 installed"

# -----------------------------------------------------------------------------
# STEP 4: Install wkhtmltopdf
# Odoo uses wkhtmltopdf to generate PDF reports.
# We install a specific version known to work with Odoo 16.
# -----------------------------------------------------------------------------
echo "[4/8] Installing wkhtmltopdf..."
wget -q https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6.1-3/wkhtmltox_0.12.6.1-3.jammy_amd64.deb
apt-get install -y ./wkhtmltox_0.12.6.1-3.jammy_amd64.deb
rm wkhtmltox_0.12.6.1-3.jammy_amd64.deb
echo " ✅ wkhtmltopdf installed"

# -----------------------------------------------------------------------------
# STEP 5: Install Python packages for ETL pipeline
# - pandas: data manipulation (read CSV, reshape DataFrames)
# - psycopg2: PostgreSQL adapter for Python (connects Python → PostgreSQL)
# - xmlrpc: built-in Python library (no pip needed) for Odoo XML-RPC API
# - kaggle: official Kaggle CLI to download datasets
# - sqlalchemy: SQL toolkit + ORM (used to write DataFrames to PostgreSQL)
# -----------------------------------------------------------------------------
echo "[5/8] Installing Python ETL dependencies..."
pip3 install --upgrade pip
pip3 install \
    pandas==2.1.0 \
    psycopg2-binary==2.9.9 \
    sqlalchemy==2.0.20 \
    kaggle==1.5.16 \
    python-dotenv==1.0.0 \
    requests==2.31.0

echo " ✅ Python packages installed"

# -----------------------------------------------------------------------------
# STEP 6: Create Odoo system user
# Odoo runs as a non-root service user for security.
# --system: creates a system account (no login shell)
# --home /opt/odoo: sets the home directory
# --shell /bin/bash: required for running Odoo scripts
# -----------------------------------------------------------------------------
echo "[6/8] Creating odoo system user..."
if id "odoo" &>/dev/null; then
    echo " (user 'odoo' already exists, skipping)"
else
    adduser --system --home /opt/odoo --shell /bin/bash \
        --group --gecos "Odoo" odoo
    echo " ✅ User 'odoo' created"
fi

# -----------------------------------------------------------------------------
# STEP 7: Setup Node.js for React dashboard
# We use Node.js 18 LTS (Long Term Support) for stability.
# The official NodeSource script adds the correct apt repository.
# -----------------------------------------------------------------------------
echo "[7/8] Setting up Node.js 18 LTS..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
echo " Node.js version: $(node --version)"
echo " NPM version: $(npm --version)"

# -----------------------------------------------------------------------------
# STEP 8: Final verification
# Check that every major component is reachable.
# -----------------------------------------------------------------------------
echo "[8/8] Verifying installation..."
echo " Python3:    $(python3 --version)"
echo " PostgreSQL: $(psql --version)"
echo " Node.js:    $(node --version)"
echo " npm:        $(npm --version)"
echo " nginx:      $(nginx -v 2>&1)"

echo ""
echo "============================================="
echo " ✅ System installation complete!"
echo " Next: sudo bash scripts/02_install_odoo.sh"
echo "============================================="
