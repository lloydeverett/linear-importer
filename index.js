import { LinearClient } from '@linear/sdk'
import { createWriteStream } from "fs";

const apiKey = process.env.LINEAR_API_KEY;
if (!apiKey) {
	console.error('API key env var not set');
	process.exit(-1);
}

const client = new LinearClient({
	apiKey
});

const COUNTER_MAX = 20;

function fetchAll(query, emit, after, counter) {
	if (typeof after === 'undefined') {
		after = null;
	}
	if (typeof counter === 'undefined') {
		counter = 0;
	}

	return query({first: 250, after: after}).then(
		r => {
			const output = r.nodes;
			if (output === null ||
			    typeof output === 'string' ||
			    typeof output[Symbol.iterator] !== 'function') {
				emit(r);
			} else {
				output.forEach(e => emit(e));
			}

			if ('pageInfo' in r && r.pageInfo.hasNextPage) {
				if (counter > COUNTER_MAX) {
					console.error('Max number of pages fetched and hasNextPage is still true; giving up.')
					process.exit(1);
				}
				return fetchAll(query, emit, r.pageInfo.endCursor, counter + 1);
			}
		}
	);
}

function bindQuery(fn, extraOpts) {
	fn = fn.bind(client);
	if (typeof extraOpts === 'object') {
		return (opts) => fn({ ...extraOpts, ...opts });
	} else {
		return (opts) => fn({ ...opts });
	}
}

if (process.argv.length < 3) {
	console.error('error: no team key(s) specified - please choose from the following list:');
        await fetchAll(bindQuery(client.teams), t => console.log(`${t.key} (${t.name})`));
	process.exit(1);
}
const selectedTeamKeys = process.argv[2].split(',');
let teams = [];
let selectedTeams = [];
await fetchAll(bindQuery(client.teams), t => {
	teams.push(t);
});
for (const selectedTeamKey of selectedTeamKeys) {
	let selectedTeam = null;
	for (const team of teams) {
		if (team.key === selectedTeamKey) {
			selectedTeam = team;
			break;
		}
	}
	if (selectedTeam === null) {
		console.error(`error: team key ${teamKey} is not valid - please choose from the following list:`);
		await fetchAll(bindQuery(client.teams), t => console.log(`${t.key} (${t.name})`));
		process.exit(1);
	}
	selectedTeams.push(selectedTeam);
}

let projects = new Map();
let issues = new Map();

for (const team of selectedTeams) {
	await fetchAll(team.projects.bind(team), p => {
		if (projects.has(p.id)) {
			projects.get(p.id).teamIds.push(team.id);
		} else {
			projects.set(p.id, {
				teamIds: [team.id],
				project: p,
				milestones: []
			});
		}
	});
	await fetchAll(team.issues.bind(team), i => {
		if (issues.has(i.id)) {
			issues.get(i.id).teamIds.push(team.id);
			console.log('code path ran');
		} else {
			issues.set(i.id, { ...i, teamIds: [team.id] });
		}
	});
}


await fetchAll(bindQuery(client.projectMilestones), m => {
	const project = projects.get(m._project.id);
	if (!project) {
		return;
	}
	project.milestones.push(m);
});

let users = [];
await fetchAll(bindQuery(client.users), u => {
	users.push(u);
});

let cycles = [];
await fetchAll(bindQuery(client.cycles), c => {
	cycles.push(c);
});

const projectsStream = createWriteStream('projects.out');
const projectsOutput = [];
for (const [id, p] of projects) {
	projectsOutput.push({ ...p.project, teamIds: p.teamIds });
}
projectsStream.write(JSON.stringify(projectsOutput));

const issuesStream = createWriteStream('issues.out');
const issuesOutput = [];
for (const [id, i] of issues) {
	issuesOutput.push(i);
}
issuesStream.write(JSON.stringify(issuesOutput));

const milestonesStream = createWriteStream('milestones.out'); 
const milestonesOutput = [];
for (const [id, p] of projects) {
	for (const m of p.milestones) {
		milestonesOutput.push(m);
	}
}
milestonesStream.write(JSON.stringify(milestonesOutput));

const teamsStream = createWriteStream('teams.out'); 
teamsStream.write(JSON.stringify(teams));

const usersStream = createWriteStream('users.out');
usersStream.write(JSON.stringify(users));

const cyclesStream = createWriteStream('cycles.out');
cyclesStream.write(JSON.stringify(cycles));

// console.log(['WBS Number', 'Title', 'Start', 'End'].join(', '));
// let projectIndex = 1;
// let projectsArray = [];
// for (const [id, p] of projects) {
// 	projectsArray.push(p);
// }
// projectsArray.sort((a, b) => {
// 	if (a.project.name < b.project.name) { return -1; }
// 	if (a.project.name > b.project.name) { return 1; }
// 	return 0;
// });
// for (const { project, milestones } of projectsArray) {
// 	console.log([projectIndex, project.name, project.startDate, project.targetDate].join(', '));
// 	let milestoneIndex = 1;
// 	milestones.sort((a, b) => a.sortOrder - b.sortOrder);
// 	for (const m of milestones) {
// 		const index = `${projectIndex}.${milestoneIndex++}`;
// 		console.log([index, m.name, project.startDate, m.targetDate || project.targetDate].join(', '));
// 	}
// 	projectIndex++;
// }

