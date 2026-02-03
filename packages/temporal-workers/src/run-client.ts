import { Connection, Client } from '@temporalio/client';

async function run() {
  const address = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
  const namespace = process.env.TEMPORAL_NAMESPACE || 'default';
  const apiKey = process.env.TEMPORAL_API_KEY;

  console.log('Connecting to Temporal...');
  console.log(`  Address: ${address}`);
  console.log(`  Namespace: ${namespace}`);
  console.log(`  API Key: ${apiKey ? '***' + apiKey.slice(-8) : 'not set'}`);

  let connection: Connection;

  if (apiKey) {
    connection = await Connection.connect({
      address,
      tls: {},
      apiKey,
    });
  } else {
    connection = await Connection.connect({ address });
  }

  const client = new Client({
    connection,
    namespace,
  });

  console.log('\nSuccessfully connected to Temporal Cloud!');

  // Start a simple test workflow
  const workflowId = `test-workflow-${Date.now()}`;
  console.log(`\nStarting test workflow: ${workflowId}`);

  try {
    const handle = await client.workflow.start('FollowUpWorkflow', {
      taskQueue: 'loomi-main',
      workflowId,
      args: [{
        leadId: 'test-lead',
        type: 'post_demo',
        lead: {
          id: 'test-lead',
          phone: '+1234567890',
          name: 'Test User',
          email: 'test@example.com',
          stage: 'test',
        },
      }],
    });

    console.log(`Workflow started with ID: ${handle.workflowId}`);
    console.log(`Run ID: ${handle.firstExecutionRunId}`);
    console.log('\nNote: The workflow is now waiting for a worker to pick it up.');
    console.log('Run "npm run dev" in another terminal to start the worker.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log('Workflow already exists (this is expected if you ran this before)');
    } else {
      throw error;
    }
  }

  await connection.close();
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
