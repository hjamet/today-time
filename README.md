# Today Time Plugin for Obsidian

This plugin automatically updates a `today` property in the frontmatter of a specified note with the current date and time.

## Features

- Automatic update every second
- Customizable date/time format (using moment.js syntax)
- Easy note selection
- Automatic frontmatter creation if not present

## Configuration

1. Select the note to update in the plugin settings
2. Customize the date/time format according to your needs (default: YYYY-MM-DD HH:mm:ss)

## Format

The plugin uses moment.js syntax for formatting. Examples:
- `YYYY-MM-DD HH:mm:ss` → 2024-02-14 15:30:45
- `DD/MM/YYYY HH:mm` → 14/02/2024 15:30
- `MMMM Do YYYY, h:mm a` → February 14th 2024, 3:30 pm

## License

MIT License © 2024 Henri Jamet
