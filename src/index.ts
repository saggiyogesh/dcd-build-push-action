import * as core from '@actions/core';

import fs from 'fs';
import { IDockerConfig } from './types';
import { Buffer } from 'buffer';
import { execSync } from 'child_process';

const { HOME } = process.env;

const dockerConfigFile = `${HOME}/.docker/config.json`;

console.log('dockerConfigFile=--', dockerConfigFile);

if (!fs.existsSync(dockerConfigFile)) {
  throw new Error('Login to registry using `docker/login-action@v2` action');
}

const dockerConfig = fs.readFileSync(dockerConfigFile).toString();

const dockerConfigJSON = JSON.parse(dockerConfig) as IDockerConfig;

console.log('dockerConfigJSON=--', dockerConfigJSON, core, core.getInput);

try {
  // Get the input value
  const platforms = core.getInput('platforms');
  const context = core.getInput('context');
  const push = core.getInput('push');
  const tags = core.getInput('tags');
  const labels = core.getInput('labels');
  const file = core.getInput('file');
  const registry = core.getInput('registry');

  const { user, pass } = getRegUserPass(tags);

  console.log('inputs=--', { platforms, context, push, tags, labels, file, registry, user, pass });
  const execRes = execSync(`../exec/app`);
  console.log('execRes=--', execRes);

} catch (error) {
  console.log('error=--', error);

  core.setFailed(error.message);
}

function decodeBase64(b64: string) {
  return Buffer.from(b64, 'base64').toString('utf8');
}

function getRegUserPass(tags: string) {
  const [registry] = tags.split('/');
  let userPassStr = '';
  const { auths } = dockerConfigJSON;

  if (!auths) {
    throw new Error('Login to registry using `docker/login-action@v2` action');
  }
  if (auths[registry]) {
    userPassStr = decodeBase64(auths[registry].auth); // use if auth exists for registry name in tag name
  } else {
    userPassStr = decodeBase64(auths[Object.keys(auths)[0]].auth); // use the default
  }
  const [user, pass] = userPassStr.split(':');
  return { user, pass };
}
