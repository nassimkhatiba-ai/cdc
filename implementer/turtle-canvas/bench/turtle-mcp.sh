#!/bin/bash
set -e
export TURTLE_CANVAS_DIR="/Users/nesbes/mcp-a;t/implementer/turtle-canvas/bench/canvases-mcp"
exec node "/Users/nesbes/mcp-a;t/implementer/turtle-canvas/bin/turtle-canvas-mcp.js" "$@"
