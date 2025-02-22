
# linear-importer

This tool grabs content via the Linear API and produces JSON files for various Linear models (projects, milestones, users, etc.). The resulting files are then loaded into a SQLite database for easy querying.

## Setup

First, make sure you have a new(ish) version of the SQLite client `sqlite3`. Then clone the repo, `cd` into it and run the following:

```bash
npm install
echo 'LINEAR_API_KEY=<Your Linear API key>' >> ./.env
```

## Usage

```bash
./linear-importer <TEAM_KEYS>
```

The program accepts a single argument representing a comma-separated list of team keys. (Running the command with no command line arguments will give a list of available team keys.)

Only milestones, projects and issues associated with one of these keys will be fetched from the Linear API.

Note that for other models, such as the users or teams table, we don't bother filtering since there's no real need to do so.

## Output

Linear models will be written to `.out` files in the current directory.

The program will also try to build a SQLite database file from these files by running the `create-db` script. You can rerun this at any point to regenerate the database from the `.out` files without pulling all then data from the Linear API again.

## Querying the data

### SQLite CLI

```bash
sqlite3 sqlite.db

# enter a more pleasant display mode
.mode box

# example query against projects table
select * from projects limit 1;

# example join between projects and teams
select projects.*, teams.id from projects inner join teams on projects.teamId = teams.id;

# navigate json trees!
select *, json -> 'email' from users; # -> will always return valid JSON
select *, json ->> 'email' from users; # ->> returns a native SQLite value
select distinct json -> 'status.color' from projects; # dig into the tree

# go ahead and query any of the following tables: cycles, issues, milestones, projects, teams, users. glhf!
```

Note that you may need to install a recent enough version of the SQLite CLI client to allow for JSON functionality.

### Visidata

Visidata is a visual data viewer for the terminal and is useful for quick lookups and manipulations. For instance, to view the projects table:

```
visidata projects.out
```

### GUI options and plotting data

Obviously you can use any DB client of choice here. I've had good luck with [Oracle's MySQL extension for VS Code](https://marketplace.visualstudio.com/items?itemName=Oracle.mysql-shell-for-vs-code),
which allows running queries against a SQLite database in a REPL notebook with Python and JavaScript support included and the ability to draw plots.

![Screenshot of Oracle's MySQL extension](https://github.com/mysql/mysql-shell-plugins/raw/master/gui/extension/images/screenshots/MySQLShellForVSCodeMain.jpg)

