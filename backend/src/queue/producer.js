const { Queue } = require('bullmq');
const { createRedisConnection } = require('./redis');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

let repairQueue = null;

function getRepairQueue() {
  if (!repairQueue) {
    try {
      repairQueue = new Queue('repair-jobs', {
        connection: createRedisConnection(),
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: { count: 1000 },
          removeOnFail: { count: 500 },
        },
      });
    } catch (err) {
      logger.warn('Failed to create repair queue', { error: err.message });
      return null;
    }
  }
  return repairQueue;
}

async function enqueueRepairJob(data) {
  const jobId = uuidv4();
  const queue = getRepairQueue();

  if (!queue) {
    logger.warn('Queue not available, job not enqueued', { jobId });
    return jobId;
  }

  await queue.add('repair', { ...data, jobId }, {
    jobId,
    priority: data.type === 'ci_failure' ? 1 : 5,
  });

  logger.info('Repair job enqueued', { jobId, type: data.type });
  return jobId;
}

module.exports = { enqueueRepairJob, getRepairQueue };
