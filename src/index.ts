/* eslint-disable @typescript-eslint/no-unused-vars */
import core from '@actions/core';

import fs from 'fs';
import { execSync } from 'child_process';
import { IDockerConfig } from './types';
import { Buffer } from 'buffer';
const { HOME } = process.env;

const dockerConfigFile = `${HOME}/.docker/config.json`;

console.log('dockerConfigFile=--', dockerConfigFile);

const dockerConfig = fs.existsSync(dockerConfigFile) ? fs.readFileSync(dockerConfigFile).toString() : 'Login to registry using `docker/login-action@v2` action';

const dockerConfigJSON = JSON.parse(dockerConfig) as IDockerConfig;

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

  const { user, pass } = getRegUserPass(tags);

  console.log('inputs=--', { platforms, context, push, tags, labels, file, registry });
} catch (error) {
  console.log('error=--', error);

  core.setFailed(error.message);
}

function encodeToBase64(str: string) {
  return Buffer.from(str, 'utf8').toString('base64');
}

function decodeBase64(b64: string) {
  return Buffer.from(b64, 'base64').toString('utf8');
}

function getRegUserPass(tags: string) {
  const [registry] = tags.split('/');
  let userPassStr = '';
  const { auths } = dockerConfigJSON;

  if (!auths) {
    throw new Error(`docker login action is not configured`);
  }
  if (auths[registry]) {
    userPassStr = decodeBase64(auths[registry].auth); // use if auth exists for registry name in tag name
  } else {
    userPassStr = decodeBase64(auths[Object.keys(auths)[0]].auth); // use the default
  }
  const [user, pass] = userPassStr.split(':');
  return { user, pass };
}
