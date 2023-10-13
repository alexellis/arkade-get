const core = require('@actions/core');
const exec = require('@actions/exec');
const toolCache = require('@actions/tool-cache')
const io = require("@actions/io")

const schema = require("./schema.json")
const os = require('os')
const fs = require('fs')
const path = require('path')
const axios = require('axios')

function getProxy() {
  const httpProxy = process.env.http_proxy
  const httpsProxy = process.env.https_proxy
  if(httpProxy || httpsProxy) {
    return {
      proxy: new URL(httpProxy || httpsProxy)
    }
  }
  return {}
}

async function getDownloadUrl() {
  const response = await axios.get('https://api.github.com/repos/alexellis/arkade/releases/latest', {
    method: "GET",
    headers: {
      accept: "application/vnd.github+json"
    },
    timeout: 2500,
    validateStatus: function (status) {
      return status === 200
    },
    ...getProxy()
  })

  // Find right asset for the environment
  const jsonResponse = response.data
  const assets = jsonResponse.assets
  let foundAsset = assets.find(asset => asset.name.endsWith(os.arch()))
  if(foundAsset) {
    return foundAsset.browser_download_url
  } else {
    // Fallback when the OS Build isn't found
    return assets.find(asset => asset.name === "arkade").browser_download_url
  }
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
