const core = require('@actions/core');
const exec = require('@actions/exec');
const toolCache = require('@actions/tool-cache')
const io = require("@actions/io")

const schema = require("./schema.json")
const os = require('os')
const fs = require('fs')
const path = require('path')
const axios = require('axios')


function getDownloadArch(arch) {
  if (arch === 'arm64') {
    return '-arm64'
  }
  
  return ''
}

async function getDownloadUrl() {
  let tag = "latest"
  let response = null
  try {
    response = await axios({
      url: "https://github.com/alexellis/arkade/releases/latest",
      maxRedirects: 0,
      method: "head",
      timeout: 2500,
      validateStatus: function (status) {
        return status == 302
      }
    })
    tag = response.headers.location;
  } catch (error) {
      throw error
  }
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
    const arkadePath = path.join(homedir, "/.arkade/bin/")

    core.info("Setting arkade's folder to: " + arkadePath)
    // Add arkade's path to the PATH environment variable
    core.addPath(arkadePath)

    let added = 0
    let tools = {}

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
        await exec.exec(commandLine= cmd)

        added++
      }
    }

    let printSummary = core.getInput("print-summary")

    if(printSummary == true || printSummary == "true") {
      let rows = [ ]

      rows.push([{data: 'Tool', header: true}, {data: 'Version', header: true}])
      core.info("Tools: " + JSON.stringify(tools))

      let keys = Object.keys(tools)
      for(let i in keys) {
        rows.push([
          keys[i],
          tools[keys[i]]
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
