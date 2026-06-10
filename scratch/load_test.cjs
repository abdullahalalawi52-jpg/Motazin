const autocannon = require('autocannon');

const url = 'http://localhost:3000';

console.log(`Starting load test against ${url}...`);
console.log('Simulating 100 concurrent connections for 10 seconds.');

const instance = autocannon({
  url: url,
  connections: 100, 
  duration: 10 
}, (err, result) => {
  if (err) {
    console.error('Error during load test:', err);
    process.exit(1);
  }
  console.log('\n--- Load Test Result ---');
  console.log(`Total Requests: ${result.requests.total}`);
  console.log(`Total Duration: ${result.duration}s`);
  console.log(`Avg Latency: ${result.latency.average} ms`);
  console.log(`Max Latency: ${result.latency.max} ms`);
  console.log(`Avg Requests/Sec: ${result.requests.average}`);
  console.log(`Throughput: ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/sec`);
  console.log('------------------------\n');
});

autocannon.track(instance, { renderProgressBar: true });
