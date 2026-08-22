import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as toolCache from '@actions/tool-cache'
import * as io from '@actions/io'

import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'

import schema from './schema.json' with { type: 'json' }


function getDownloadSuffix() {
  // Release assets are named for the OS too:
  // arkade (linux/x86_64), arkade-arm64 (linux), arkade-armhf,
  // arkade-darwin, arkade-darwin-arm64, arkade.exe.
  let suffix = ""

  if (os.platform() === 'darwin') {
    suffix += '-darwin'
  }

  if (os.arch() === 'arm64') {
    suffix += '-arm64'
  } else if (os.arch() === 'arm') {
    suffix += '-armhf'
  }

  return suffix
}

async function getDownloadUrl() {
  let tag = "latest"
  const response = await fetch("https://github.com/alexellis/arkade/releases/latest", {
    method: "HEAD",
    redirect: "manual",
    signal: AbortSignal.timeout(2500),
  })
  if (response.status !== 302) {
    throw new Error(`unexpected status ${response.status} resolving latest arkade release`)
  }
  tag = response.headers.get("location")
  // https://github.com/alexellis/arkade/releases/tag/0.9.17

  //replace the first tag instance with "download"

  tag = tag.replace("tag", "download")

  const suffix = os.platform() === 'win32' ? '.exe' : getDownloadSuffix()
  core.info(`Platform: ${os.platform()} Arch: ${os.arch()}`)
  return `${tag}/arkade${suffix}`
}

// most @actions toolkit packages have async methods
async function run() {
  try {

    // Some minimal runner images do not include /usr/local/bin on PATH,
    // where tooling installed by arkade may be expected.
    if(os.platform() !== 'win32') {
      const pathDirs = (process.env.PATH || "").split(path.delimiter)
      if(!pathDirs.includes("/usr/local/bin")) {
        core.info("Adding /usr/local/bin to PATH")
        core.addPath("/usr/local/bin")
      }
    }

    if(core.getInput("install-arkade") == "true") {
      core.info("Installing arkade into tool cache")
      let arkadeBinaryUrl = await getDownloadUrl()

      core.info(`Download URL: ${arkadeBinaryUrl}`)
      
      // Download arkade
      const pathToDownload = await toolCache.downloadTool(arkadeBinaryUrl)
      core.info("Downloaded arkade to: " + pathToDownload)

      const cachePath = path.dirname(pathToDownload)

      // Keep the .exe extension on Windows so the binary resolves.
      const arkadeName = os.platform() === 'win32' ? 'arkade.exe' : 'arkade'
      const arkadeFinalPath = path.join(cachePath, arkadeName)

      core.info(`Moving arkade from ${pathToDownload} to ${arkadeFinalPath}`)
      await io.mv(pathToDownload, arkadeFinalPath)

      fs.chmodSync(arkadeFinalPath, 0o755)

      core.addPath(cachePath)

      core.info(`Final path: ${arkadeFinalPath}`)

      // Use arkade to download the various tools
      const homedir = os.homedir()  
      const arkadePath = path.join(homedir, "/.arkade/bin")

      core.info("Setting arkade's folder to: " + arkadePath)
      // Add arkade's path to the PATH environment variable
      core.addPath(arkadePath)
    }

    let added = 0
    let tools = {}
    let toolTimes = {}

    for(let i = 0; i < schema.length; i++){
      let tool = schema[i]

      let inputName = tool;
      let toolValue = core.getInput(inputName);

      if(toolValue && toolValue.length) {
        core.info(`Installing: ${tool} with ${toolValue}`)
        tools[tool] = toolValue

        let cmd = `arkade get --progress=false --quiet=true ${tool}`

        if(toolValue != "latest") {
          cmd += ` --version ${toolValue}`
        }

        core.debug(`Running: ${cmd}`)
        let startTime = new Date().getTime()

        await exec.exec(cmd)
        toolTimes[tool] = new Date().getTime() - startTime

        added++
      }
    }

    if(core.getInput("print-summary") == "true") {
      let rows = [ ]

      rows.push([{data: 'Tool', header: true}, {data: 'Version', header: true}, {data: "Download time", header: true}])

      let keys = Object.keys(tools)
      keys = keys.sort()

      for(let i in keys) {
        rows.push([
          keys[i],
          tools[keys[i]],
          (toolTimes[keys[i]]/1000).toFixed(2) + "s"
        ])
      }  
      
      let addedStr = "tool"
      if(added > 1) {
        addedStr += "s"
      }

      await core.summary
      .addHeading(`Arkade installed ${added} ${addedStr}`)
      .addTable(rows)
      .addLink('If you 💙 arkade, sponsor alexellis on GitHub!', 'https://github.com/sponsors/alexellis')
      .write()
    }

    core.info("If you 💙 arkade, sponsor alexellis on GitHub https://github.com/sponsors/alexellis")

    core.setOutput('tools', added+ " tools were installed");

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
