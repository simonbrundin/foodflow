#!/bin/bash
# Setup Kind cluster for Foodflow development using ctlptl
#
# Prerequisites:
#   1. Install ctlptl: brew install tilt-dev/tap/ctlptl
#   2. Install kind: brew install kind
#
# Usage:
#   ./setup-kind.sh       # Create cluster and registry
#   ./setup-kind.sh reset # Delete and recreate

set -e

cd /home/simon/repos/foodflow/environments/dev

if [ "$1" == "reset" ]; then
    echo "Deleting Kind cluster and registry..."
    ctlptl delete -f kind-config.yaml 2>/dev/null || true
    ctlptl delete -f registry-config.yaml 2>/dev/null || true
    echo "Done. Run without arguments to recreate."
    exit 0
fi

echo "Setting up Kind cluster for Foodflow..."

# Check if cluster exists
if ctlptl get cluster kind-foodflow &>/dev/null; then
    echo "Kind cluster 'foodflow' already exists"
    read -p "Delete and recreate? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ctlptl delete -f kind-config.yaml
    else
        echo "Using existing cluster"
        exit 0
    fi
fi

# Create registry
echo "Creating registry..."
ctlptl apply -f registry-config.yaml

# Create kind cluster with registry
echo "Creating Kind cluster..."
ctlptl apply -f kind-config.yaml

# Get registry host
REGISTRY_HOST=$(ctlptl get cluster kind-foodflow -o template --template '{{.status.localRegistryHosting.host}}' 2>/dev/null || echo "localhost:5001")
echo ""
echo "Registry host: $REGISTRY_HOST"
echo ""

# Show status
echo "Cluster status:"
ctlptl get

echo ""
echo "Done! To start development:"
echo "  cd /home/simon/repos/foodflow/environments/dev"
echo "  tilt up"
echo ""
echo "Access:"
echo "  Nuxt:    http://localhost:3500"
echo "  API:     http://localhost:3501"
echo "  pgAdmin: http://localhost:3502"
echo "  pg-view: http://localhost:3503"
