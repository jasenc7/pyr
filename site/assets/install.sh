#!/bin/sh
set -euo pipefail

REPO="jasenc7/pyr"
INSTALL_DIR="${PYR_HOME:-$HOME/.pyr}/bin"
PYTHON_DIR="${PYR_HOME:-$HOME/.pyr}/python/bin"

main() {
  command -v unzip >/dev/null 2>&1 || { echo "unzip is required"; exit 1; }

  os=$(uname -s | tr '[:upper:]' '[:lower:]')
  arch=$(uname -m)

  case "$os" in
    darwin) ;;
    linux) ;;
    *) echo "unsupported os: $os"; exit 1 ;;
  esac

  case "$arch" in
    x86_64|amd64) arch="x86_64" ;;
    arm64|aarch64) arch="aarch64" ;;
    *) echo "unsupported arch: $arch"; exit 1 ;;
  esac

  target="${os}-${arch}"
  url="https://github.com/${REPO}/releases/latest/download/pyr-${target}.zip"

  echo "installing pyr..."

  tmpdir=$(mktemp -d)
  trap 'rm -rf "$tmpdir"' EXIT

  curl -fsSL "$url" -o "$tmpdir/pyr.zip"
  unzip -qo "$tmpdir/pyr.zip" -d "$tmpdir"

  mkdir -p "$INSTALL_DIR"
  mv "$tmpdir/pyr" "$INSTALL_DIR/pyr"
  chmod +x "$INSTALL_DIR/pyr"

  echo "installed to ${INSTALL_DIR}/pyr"

  # check PATH
  case ":$PATH:" in
    *":${INSTALL_DIR}:"*":${PYTHON_DIR}:"*) ;;
    *":${PYTHON_DIR}:"*":${INSTALL_DIR}:"*) ;;
    *)
      echo ""
      echo "add to your shell profile:"
      echo "  export PATH=\"${INSTALL_DIR}:${PYTHON_DIR}:\$PATH\""
      ;;
  esac
}

main
