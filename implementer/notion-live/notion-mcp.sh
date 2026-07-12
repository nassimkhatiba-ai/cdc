#!/bin/bash
set -e
export NOTION_TOKEN=ntn_C7029294218bdfRCRHTeBqBoSUEiZNc9QRcPAv3hXWS7GR
exec npx -y @notionhq/notion-mcp-server "$@"
