# notion - CDC

Source: MCP tools/list (24 tools)
Prefer: ONE openSession script that does ALL work then prints ONLY answer keys; callPaged for API-post-search. --batch only for tiny independent probes.

## Multi-step (primary for multi-hop)

```bash
node - <<'EOF'
const { openSession, callPaged } = require('__SKILL_DIR__/mcp-call.js');
(async () => {
  const s = await openSession();
  const rows = await callPaged(s, 'API-post-search', { /* filters */ }); // ALL pages
  const one = await s.call('API-get-user', { /* real args */ });
  // Prefer evaluate_* fields for risk; only s.call get_* if that exact name is listed
  // Answer helper: print JSON once; never dump tool results to chat.
  console.log(JSON.stringify(/* compact answer only */));
  s.close();
})();
EOF
```

## misc
API-get-user(user_id*) — Notion | Retrieve a user Error Responses: 400: 400
API-get-users(start_cursor, page_size:integer) — Notion | List all users Error Responses: 400: 400
API-get-self() — Notion | Retrieve your token's bot user Error Responses: 400: Bad request
API-post-search(query, sort, filter, start_cursor, page_size:integer) — Notion | Search by title Error Responses: 400: Bad request
API-get-block-children(block_id*, start_cursor, page_size:integer) — Notion | Retrieve block children Error Responses: 400: Bad request
API-patch-block-children(block_id*, children*:[], after) — Notion | Append block children Error Responses: 400: Bad request
API-retrieve-a-block(block_id*) — Notion | Retrieve a block Error Responses: 400: Bad request
API-update-a-block(block_id*, type, archived:boolean) — Notion | Update a block Error Responses: 400: Bad request
API-delete-a-block(block_id*) — Notion | Delete a block Error Responses: 400: Bad request
API-retrieve-a-page(page_id*, filter_properties) — Notion | Retrieve a page Error Responses: 400: Bad request
API-patch-page(page_id*, properties, in_trash:boolean, archived:boolean, icon, cover) — Notion | Update page properties Error Responses: 400: Bad request
API-post-page(parent*, properties*, children:[], icon, cover) — Notion | Create a page Error Responses: 400: Bad request
API-retrieve-a-page-property(page_id*, property_id*, page_size:integer, start_cursor) — Notion | Retrieve a page property item Error Responses: 400: Bad request
API-retrieve-a-comment(block_id*, start_cursor, page_size:integer) — Notion | Retrieve comments Error Responses: 400: Bad request
API-create-a-comment(parent*, rich_text*:[]) — Notion | Create comment Error Responses: 400: Bad request
API-query-data-source(data_source_id*, filter_properties:[], filter, sorts:[], start_cursor, page_size:integer, archived:boolean, in_trash:boolean) — Notion | Query a data source Error Responses: 400: Bad request
API-retrieve-a-data-source(data_source_id*) — Notion | Retrieve a data source Error Responses: 400: Bad request
API-update-a-data-source(data_source_id*, title:[], description:[], properties) — Notion | Update a data source Error Responses: 400: Bad request
API-create-a-data-source(parent*, properties*, title:[]) — Notion | Create a data source Error Responses: 400: Bad request
API-list-data-source-templates(data_source_id*, start_cursor, page_size:integer) — Notion | List templates in a data source Error Responses: 400: Bad request
API-retrieve-a-database(database_id*) — Notion | Retrieve a database Error Responses: 400: Bad request
API-move-page(page_id*, parent*) — Notion | Move a page Error Responses: 400: Bad request
API-retrieve-page-markdown(page_id*, include_transcript:boolean) — Notion | Retrieve a page as Markdown Error Responses: 400: Bad request 403: The integra…
API-update-page-markdown(page_id*, type*:"replace_content"|"update_content"|"insert_content"|"replace_content_range", replace_content, update_content, insert_content, replace_content_range) — Notion | Update a page's content as Markdown Error Responses: 400: Bad request 403: The…

## _index
API-create-a-comment
API-create-a-data-source
API-delete-a-block
API-get-block-children
API-get-self
API-get-user
API-get-users
API-list-data-source-templates
API-move-page
API-patch-block-children
API-patch-page
API-post-page
API-post-search
API-query-data-source
API-retrieve-a-block
API-retrieve-a-comment
API-retrieve-a-data-source
API-retrieve-a-database
API-retrieve-a-page
API-retrieve-a-page-property
API-retrieve-page-markdown
API-update-a-block
API-update-a-data-source
API-update-page-markdown
