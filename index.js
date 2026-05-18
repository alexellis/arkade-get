const core = require('@actions/core');
const exec = require('@actions/exec');
const toolCache = require('@actions/tool-cache')
const io = require("@actions/io")

const schema = require("./schema.json")
const os = require('os')
const fs = require('fs')
const path = require('path')


function getDownloadArch(arch) {
  if (arch === 'arm64') {
    return '-arm64'
  }
  
  return ''
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

  let arch = getDownloadArch(os.arch())
  core.info(`Arch: ${os.arch()}`)
  return `${tag}/arkade${arch}`
}

// most @actions toolkit packages have async methods
async function run() {
  try {

    if(core.getInput("install-arkade") == "true") {
      core.info("Installing arkade into tool cache")
      let arkadeBinaryUrl = await getDownloadUrl()

      core.info(`Download URL: ${arkadeBinaryUrl}`)
      
      // Download arkade
      const pathToDownload = await toolCache.downloadTool(arkadeBinaryUrl)
      core.info("Downloaded arkade to: " + pathToDownload)

      const cachePath = path.dirname(pathToDownload)

      const arkadeFinalPath = path.join(cachePath, "arkade")

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
