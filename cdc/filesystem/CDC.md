# filesystem-cdc (direct fs)

Root: /path/to/allowed/root
Mode: direct Node fs via q.js (not MCP).
MCP tool names below are a map only --- implement with q.js/fs.

## create
create_directory(path*) — Create a new directory or ensure a directory exists

## directory
directory_tree(path*, excludePatterns:[]) — Get a recursive tree view of files and directories as a JSON structure

## edit
edit_file(path*, edits*:[], dryRun:boolean) — Make line-based edits to a text file

## get
get_file_info(path*) — Retrieve detailed metadata about a file or directory

## list
list_directory(path*) — Get a detailed listing of all files and directories in a specified path
list_directory_with_sizes(path*, sortBy:"name"|"size") — Get a detailed listing of all files and directories in a specified path, including sizes
list_allowed_directories() — Returns the list of directories that this server is allowed to access

## move
move_file(source*, destination*) — Move or rename files and directories

## read
read_file(path*, tail:number, head:number) — Read the complete contents of a file as text
read_text_file(path*, tail:number, head:number) — Read the complete contents of a file from the file system as text
read_media_file(path*) — Read a file and return it as a base64-encoded content block with its MIME type
read_multiple_files(paths*:[]) — Read the contents of multiple files simultaneously

## search
search_files(path*, pattern*, excludePatterns:[]) — Recursively search for files and directories matching a pattern

## write
write_file(path*, content*) — Create a new file or completely overwrite an existing file with new content

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
