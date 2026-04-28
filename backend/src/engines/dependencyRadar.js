const { query } = require('../models/database');
const { logger } = require('../utils/logger');

async function scanDependencies(repositoryId, packageJson) {
  const alerts = [];

  if (!packageJson?.dependencies) return alerts;

  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  for (const [name, version] of Object.entries(allDeps)) {
    try {
      const registryData = await fetchNpmPackage(name);
      if (!registryData) continue;

      const latestVersion = registryData['dist-tags']?.latest;
      const currentClean = version.replace(/^[\^~>=<]+/, '');

      if (latestVersion && currentClean !== latestVersion) {
        const isBreaking = isMajorBump(currentClean, latestVersion);
        if (isBreaking) {
          alerts.push({
            package_name: name,
            current_version: currentClean,
            breaking_version: latestVersion,
            severity: 'high',
            description: `Major version update available: ${currentClean} → ${latestVersion}`,
          });
        }
      }

      // Check for deprecated
      if (registryData.versions?.[currentClean]?.deprecated) {
        alerts.push({
          package_name: name,
          current_version: currentClean,
          breaking_version: latestVersion,
          severity: 'critical',
          description: `Package version ${currentClean} is deprecated`,
        });
      }
    } catch (err) {
      logger.debug('Dependency check failed', { package: name, error: err.message });
    }
  }

  // Store alerts
  for (const alert of alerts) {
    try {
      await query(
        `INSERT INTO dependency_alerts (repository_id, package_name, current_version, breaking_version, severity, description)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [repositoryId, alert.package_name, alert.current_version, alert.breaking_version, alert.severity, alert.description]
      );
    } catch (err) {
      logger.error('Failed to store dependency alert', { error: err.message });
    }
  }

  return alerts;
}

async function fetchNpmPackage(name) {
  try {
    const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function isMajorBump(current, latest) {
  const currentMajor = parseInt(current.split('.')[0]) || 0;
  const latestMajor = parseInt(latest.split('.')[0]) || 0;
  return latestMajor > currentMajor;
}

module.exports = { scanDependencies };
