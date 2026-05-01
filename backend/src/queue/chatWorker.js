require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Worker } = require('bullmq');
const { createRedisConnection } = require('./redis');
const { logger } = require('../utils/logger');
const { getInstallationOctokit } = require('../services/github');
const { processMention } = require('../agents/chatAgent');

async function processChatJob(job) {
  const { jobId, repository, issue_number, comment, installation_id } = job.data;

  logger.info('Processing chat job', {
    jobId, repo: repository.full_name, issue: issue_number,
  });

  try {
    const octokit = await getInstallationOctokit(installation_id);
    const owner = repository.owner;
    const repo = repository.name;

    // Fetch PR data and files
    const [prResponse, filesResponse] = await Promise.all([
      octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
        owner, repo, pull_number: issue_number,
      }),
      octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/files', {
        owner, repo, pull_number: issue_number,
      }),
    ]);

    const prData = prResponse.data;
    const files = filesResponse.data;

    // Process the @warpfix mention
    const response = await processMention({
      comment,
      prData,
      files,
      context: { repo: repository.full_name },
    });

    if (response) {
      // Post reply comment
      await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
        owner, repo, issue_number, body: response,
      });

      logger.info('Chat response posted', { issue: issue_number, repo: repository.full_name });
    }

    return { status: 'completed', responded: !!response };
  } catch (err) {
    logger.error('Chat job failed', { jobId, error: err.message, stack: err.stack });
    throw err;
  }
}

const chatWorker = new Worker('chat-jobs', processChatJob, {
  connection: createRedisConnection(),
  concurrency: 3,
  limiter: { max: 10, duration: 60000 },
});

chatWorker.on('completed', (job, result) => {
  logger.info('Chat job completed', { jobId: job.id, result });
});

chatWorker.on('failed', (job, err) => {
  logger.error('Chat job failed', { jobId: job?.id, error: err.message });
});

logger.info('WarpFix chat worker started');

module.exports = { chatWorker };
