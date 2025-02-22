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
	console.error('error: no team key specified - please choose from the following list:');
        await fetchAll(bindQuery(client.teams), t => console.log(`${t.key} (${t.name})`));
	process.exit(1);
}
const teamKey = process.argv[2];
let teams = [];
let teamId;
await fetchAll(bindQuery(client.teams), t => {
	teams.push(t);
	if (t.key === teamKey) {
		teamId = t.id;
	}
});
if (teamId === null) {
	console.error(`error: team key ${teamKey} is not valid - please choose from the following list:`);
	await fetchAll(bindQuery(client.teams), t => console.log(`${t.key} (${t.name})`));
	process.exit(1);
}

// for (const team of teams) {
// 	await fetchAll(team.projects.bind(team), x => {
// 		console.log(x);
// 	});
// }

let projects = new Map();

const teamIdFilter = { filter: { accessibleTeams: { id: { eq: teamId } } } };
await fetchAll(bindQuery(client.projects, teamIdFilter), p => {
	projects.set(p.id, {
		project: p,
		milestones: []
	});
});

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
	projectsOutput.push(p.project);
}
projectsStream.write(JSON.stringify(projectsOutput));

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

