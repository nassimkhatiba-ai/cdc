# filesystem-cdc (direct fs)

Root: /path/to/allowed/root
Mode: direct Node fs (not MCP).
MCP tool names below are a map only --- implement with fs.

## create
create_directory(path*)

## directory
directory_tree(path*, excludePatterns:[])

## edit
edit_file(path*, edits*:[], dryRun:boolean)

## get
get_file_info(path*)

## list
list_directory(path*)
list_directory_with_sizes(path*, sortBy:"name"|"size")
list_allowed_directories()

## move
move_file(source*, destination*)

## read
read_file(path*, tail:number, head:number)
read_text_file(path*, tail:number, head:number)
read_media_file(path*)
read_multiple_files(paths*:[])

## search
search_files(path*, pattern*, excludePatterns:[])

## write
write_file(path*, content*)

## _index
create_directory
directory_tree
edit_file
get_file_info
list_allowed_directories
list_directory
list_directory_with_sizes
move_file
read_file
read_media_file
read_multiple_files
read_text_file
search_files
write_file
