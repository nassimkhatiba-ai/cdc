# books - CDC

Source: MCP tools/list (5 tools)
Prefer: ONE openSession script that does ALL work then prints ONLY answer keys; callPaged for list_books. --batch only for tiny independent probes.

## Multi-step (primary for multi-hop)

```bash
node - <<'EOF'
const { openSession, callPaged } = require('__SKILL_DIR__/mcp-call.js');
(async () => {
  const s = await openSession();
  const rows = await callPaged(s, 'list_books', { /* filters */ }); // ALL pages
  const one = await s.call('list_books', { /* real args */ });
  // Prefer evaluate_* fields for risk; only s.call get_* if that exact name is listed
  // Answer helper: print JSON once; never dump tool results to chat.
  console.log(JSON.stringify(/* compact answer only */));
  s.close();
})();
EOF
```

## count
count_by_genre() — Count per genre

## get
get_book(id*) — Get by id

## list
list_books(page:integer) — List books

## misc
search(q*) — Search title

## top
top_price() — Most expensive book

## _index
count_by_genre
get_book
list_books
search
top_price
