#!/bin/bash
# Mini GitHub auth MCP. Local bin (no temp-dir dependency) + CA chain fix:
# this machine's Node lacks the Sectigo root api.github.com serves.
export GITHUB_TOKEN="${GITHUB_TOKEN:-$(gh auth token 2>/dev/null)}"
export GITHUB_PERSONAL_ACCESS_TOKEN="$GITHUB_TOKEN"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export NODE_EXTRA_CA_CERTS="$DIR/../fixtures/github-chain.pem"
exec node "$DIR/github-auth-mcp.js" "$@"
