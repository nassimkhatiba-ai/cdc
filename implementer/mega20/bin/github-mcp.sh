#!/bin/bash
export GITHUB_TOKEN="${GITHUB_TOKEN:-$(gh auth token 2>/dev/null)}"
export GITHUB_PERSONAL_ACCESS_TOKEN="$GITHUB_TOKEN"
exec node "/var/folders/q0/rtbq6mhj2tn1r5p5jk4ks4dr0000gn/T/grok-goal-e3b430f0d9e1/implementer/mega20/bin/github-auth-mcp.js" "$@"
