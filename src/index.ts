/* eslint-disable @typescript-eslint/no-unused-vars */
import core from '@actions/core';

import fs from 'fs';
import { execSync } from 'child_process';

const { HOME } = process.env;

const dockerConfigFile = `${HOME}/.docker/config.json`;

console.log('dockerConfigFile=--', dockerConfigFile);

const dockerConfig = fs.existsSync(dockerConfigFile) ? fs.readFileSync(dockerConfigFile).toString() : 'Login to registry using `docker/login-action@v2` action';

const dockerConfigJSON = JSON.parse(dockerConfig);

console.log('dockerConfigJSON=--', dockerConfigJSON);

try {
  // Get the input value
  const platforms = core.getInput('platforms');
  const context = core.getInput('context');
  const push = core.getInput('push');
  const tags = core.getInput('tags');
  const labels = core.getInput('labels');
  const file = core.getInput('file');
  const registry = core.getInput('registry');

  // ... perform some tasks ...

  // Set the output value
  core.setOutput('myOutput', 'Output Value');
} catch (error) {
  core.setFailed(error.message);
}
