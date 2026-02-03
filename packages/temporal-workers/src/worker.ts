import { Worker, NativeConnection } from '@temporalio/worker';
import { createWorkerConnection, getNamespace, validateEnv } from './config';
import { allActivities } from './activities';

// Task queues by tier
const TASK_QUEUES = {
  shared: 'loomi-shared',      // free + starter tiers
  priority: 'loomi-priority',  // growth + business tiers
  // enterprise queues are dynamic: loomi-{tenantId}
};

async function createWorkerForQueue(
  connection: NativeConnection,
  taskQueue: string,
  maxConcurrent: number = 100
): Promise<Worker> {
  return Worker.create({
    connection,
    namespace: getNamespace(),
    taskQueue,
    workflowsPath: require.resolve('./workflows'),
    activities: allActivities,
    maxConcurrentActivityTaskExecutions: maxConcurrent,
    maxConcurrentWorkflowTaskExecutions: maxConcurrent,
  });
}

async function run() {
  console.log('Starting Loomi Temporal Workers...');
  console.log(`Namespace: ${getNamespace()}`);

  // Validate environment variables
  validateEnv();

  // Connect to Temporal
  let connection: NativeConnection;
  try {
    connection = await createWorkerConnection();
    console.log(`Connected to Temporal at ${process.env.TEMPORAL_ADDRESS || 'localhost:7233'}`);
  } catch (error) {
    console.error('Failed to connect to Temporal:', error);
    process.exit(1);
  }

  // Create workers for each queue
  const workers: Worker[] = [];

  try {
    // Shared queue (free + starter) - lower concurrency
    const sharedWorker = await createWorkerForQueue(connection, TASK_QUEUES.shared, 50);
    workers.push(sharedWorker);
    console.log(`Worker registered on queue: ${TASK_QUEUES.shared} (concurrency: 50)`);

    // Priority queue (growth + business) - higher concurrency
    const priorityWorker = await createWorkerForQueue(connection, TASK_QUEUES.priority, 200);
    workers.push(priorityWorker);
    console.log(`Worker registered on queue: ${TASK_QUEUES.priority} (concurrency: 200)`);

    // Enterprise queues - check for env var listing tenant IDs
    const enterpriseTenants = process.env.ENTERPRISE_TENANT_IDS?.split(',') || [];
    for (const tenantId of enterpriseTenants) {
      if (tenantId.trim()) {
        const enterpriseQueue = `loomi-${tenantId.trim()}`;
        const enterpriseWorker = await createWorkerForQueue(connection, enterpriseQueue, 500);
        workers.push(enterpriseWorker);
        console.log(`Worker registered on queue: ${enterpriseQueue} (enterprise, concurrency: 500)`);
      }
    }

    console.log('\nAvailable workflows:');
    console.log('  - FollowUpWorkflow');
    console.log('  - DemoRemindersWorkflow');
    console.log('  - ReengagementWorkflow');
    console.log('  - DemoBookingWorkflow');
    console.log('  - RescheduleWorkflow');
    console.log('  - CancelBookingWorkflow');
    console.log('  - PaymentWorkflow');
    console.log('  - IntegrationSyncWorkflow');
    console.log('  - BulkSyncWorkflow');
    console.log('  - MemoryGenerationWorkflow');
    console.log('\nWorkers are ready to process tasks');

  } catch (error) {
    console.error('Failed to create workers:', error);
    await connection.close();
    process.exit(1);
  }

  // Handle shutdown gracefully
  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down workers...`);
    for (const worker of workers) {
      worker.shutdown();
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Run all workers
  try {
    await Promise.all(workers.map(worker => worker.run()));
  } catch (error) {
    console.error('Worker error:', error);
    process.exit(1);
  } finally {
    await connection.close();
  }
}

run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
