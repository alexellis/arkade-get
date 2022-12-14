const core = require('@actions/core');
const exec = require('@actions/exec');
const schema = require("./schema.json")
const os = require('os')
const path = require('path')

// most @actions toolkit packages have async methods
async function run() {
  try {

    const homedir = os.homedir()  
    const arkadePath = path.join(homedir, "/.arkade/bin/")

    core.info("Setting arkade's folder to: " + arkadePath)
    // Add arkade's path to the PATH environment variable
    core.addPath(arkadePath)

    let added = 0
    for(i = 0; i < schema.length; i++){
      let tool = schema[i]
      // inputName = tool.replace(/-/g, "_")
      let inputName = tool;
      let toolValue = core.getInput(inputName);


      if(toolValue && toolValue.length) {
        core.info("Installing: " + tool + " with " + toolValue)

        if(toolValue == "latest") {
          await exec.exec('arkade get --progress=false --quiet=true ' + tool)
        } else {
          await exec.exec('arkade get --progress=false --quiet=true ' + tool + ' --version ' + toolValue)
        }

        added++
      }
    }

    core.info("If you 💙 arkade, sponsor alexellis on GitHub https://github.com/sponsors/alexellis")

    core.setOutput('tools', added+ " tools were installed");

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
