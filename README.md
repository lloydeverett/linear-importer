
# linear-importer

This tool grabs content via the Linear API and produces JSON files for Linear models (projects, milestones, users, etc.).

The resulting files are then loaded into a SQLite database for further manipulation and querying.

## Setup

```bash
npm install
echo 'LINEAR_API_KEY=<Your Linear API key>' >> ./.env
```

## Usage

### Load only projects, issues and milestones associated with a specific team

```bash
./linear-importer <TEAM_KEY>
```

Run with no command line arguments to get a list of available team keys.

### All projects

```bash
./linear-importer 0
```

<!-- Mention use of visidata and sqlite3 for querying (with -> and ->> operators) -->

