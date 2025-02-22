
# linear-importer

Grabs Linear projects and their milestones using the Linear API and prints them out as a CSV.

The intention is to be able to import the file into OmniPlan.

## Setup

```bash
npm install
echo 'LINEAR_API_KEY=<Your Linear API key>' >> ./.env
```

## Usage

### Projects associated with a specific team

```bash
./linear-importer <TEAM_KEY>
```

Run with no command line arguments to get a list of available team keys.

### All projects

```bash
./linear-importer 0
```

### Including completed projects

```bash
INCLUDE_COMPLETED_PROJECTS=1 ./linear-importer <TEAM_KEY>
```

