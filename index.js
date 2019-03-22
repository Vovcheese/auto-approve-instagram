process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";

const Promise = require('bluebird');
const program = require('commander');

const Client = require('instagram-private-api').V1;

program
  .version('0.1.0')
  .option('-u, --username [username]', 'Username', '')
	.option('-p, --password [password]', 'Password', '')
	.option('-d, --delay [delay]', 'Delay', 1000)
  .parse(process.argv);

  // console.log(program)

if (!program.username) return console.log('Username is required.');
if (!program.password) return console.log('Password is required.');

const device = new Client.Device(program.username);
const storage = new Client.CookieMemoryStorage();

function doApprovePending(session) {
  return Client.Relationship.pendingFollowers(session)
		.then((pendingFollowers) => {
      if (!pendingFollowers.length) {
        console.log('Pending list is empty. Recheck after 10 seconds.');
        return Promise.delay(10000).then(() => doApprovePending(session));
      }

      console.log('Pending count:', pendingFollowers.length);

			return Promise.mapSeries(pendingFollowers, (pending) => {
        return Promise.delay(program.delay)
          .then(pending.approvePending.bind(pending))
          .then(() => console.log('Approving:', pending.params.username));
      });
    })
    .then(() => Promise.delay(program.delay).then(() => doApprovePending(session)));
}

// And go for login
Client.Session.create(device, storage, program.username, program.password)
  .then((session) => {
    return doApprovePending(session);
  })
  // console.log(doApprovePending)
  .catch(err => {
    console.log(err && err.message || err);
  });