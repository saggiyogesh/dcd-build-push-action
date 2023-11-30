import * as core from '@actions/core';
import * as http from '@actions/http-client';
import * as toolCache from '@actions/tool-cache';
import * as exec from '@actions/exec';
import { execa, Options } from 'execa';
import * as io from '@actions/io';
import path from 'path';

import fs from 'fs';
import { IDockerConfig } from './types';
import { Buffer } from 'buffer';
import { execSync } from 'child_process';

const { HOME } = process.env;

const dockerConfigFile = `${HOME}/.docker/config.json`;

if (!fs.existsSync(dockerConfigFile)) {
  throw new Error('Login to registry using `docker/login-action@v2` action');
}

const dockerConfig = fs.readFileSync(dockerConfigFile).toString();

const dockerConfigJSON = JSON.parse(dockerConfig) as IDockerConfig;

console.log('dockerConfigJSON=--', dockerConfigJSON);

async function main() {
  await setupCLI();
  // Get the input value
  const platforms = core.getInput('platforms');
  const context = core.getInput('context');
  const push = core.getInput('push');
  const tags = core.getInput('tags');
  const labels = core.getInput('labels');
  const file = core.getInput('file');
  const registry = core.getInput('registry');

  const { user, pass } = getRegUserPass(tags);

  console.log('inputs=--', { platforms, context, push, tags, labels, file, registry, user, pass }, process.env);
  // const execRes = execSync(`IMAGE_TAG=${tags} REG_USER=${user} REG_PASS=${pass} /exec/cli`);
  // console.log('execRes=--', execRes.toString());
  await execBuild('cli', [], {
    env: { ...process.env }
  });
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

async function setupCLI() {
  const toolPath = toolCache.find('cli', '1.0.0');
  console.log('toolPath=--', toolPath);

  if (toolPath) {
    core.addPath(toolPath);
    return;
  }

  type ApiResponse = { ok: true; url: string } | { ok: false; error: string };

  const client = new http.HttpClient('dcd-builder-cli-setup-action');
  const url = 'https://github.com/saggiyogesh/dcd-build-push-action/raw/main/exec/cli';
  const tmpPath = await toolCache.downloadTool(url);

  const cachedPath = await toolCache.cacheFile(tmpPath, 'cli', 'cli', '1.0.0');
  const execPath = path.join(cachedPath, 'cli');
  console.log('cachedPath=--', cachedPath, execPath);
  core.addPath(execPath);
}

async function execBuild(cmd: string, args: string[], options?: Options) {
  const resolved = await io.which(cmd, true);
  console.log(`[command]${resolved} ${args.join(' ')}`);
  const proc = execa(resolved, args, { ...options, reject: false, stdin: 'inherit', stdout: 'pipe', stderr: 'pipe' });

  if (proc.pipeStdout) proc.pipeStdout(process.stdout);
  if (proc.pipeStderr) proc.pipeStderr(process.stdout);

  function signalHandler(signal: NodeJS.Signals) {
    proc.kill(signal);
  }

  process.on('SIGINT', signalHandler);
  process.on('SIGTERM', signalHandler);

  try {
    const res = await proc;
    if (res.stderr.length > 0 && res.exitCode != 0) {
      throw new Error(`failed with: ${res.stderr.match(/(.*)\s*$/)?.[0]?.trim() ?? 'unknown error'}`);
    }
  } finally {
    process.off('SIGINT', signalHandler);
    process.off('SIGTERM', signalHandler);
  }
}

main().catch(error => {
  if (error instanceof Error) {
    core.setFailed(error.message);
  } else {
    core.setFailed(`${error}`);
  }
});
