require('./sourcemap-register.js');/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 518:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 519:
/***/ ((module) => {

module.exports = eval("require")("@actions/exec");


/***/ }),

/***/ 37:
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ 17:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ 229:
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('["actions-usage","actuated-cli","argocd","argocd-autopilot","arkade","autok3s","buildx","bun","butane","caddy","cilium","civo","clusterawsadm","clusterctl","cmctl","conftest","cosign","cr","crane","croc","dagger","devspace","dive","docker-compose","doctl","eksctl","eksctl-anywhere","faas-cli","firectl","flux","flyctl","fstail","fzf","gh","golangci-lint","gomplate","goreleaser","grafana-agent","grype","hadolint","helm","helmfile","hey","hostctl","hubble","hugo","influx","inlets-pro","inletsctl","istioctl","jq","just","k0s","k0sctl","k10multicluster","k10tools","k3d","k3s","k3sup","k9s","kail","kanctl","kgctl","kim","kind","kops","krew","kube-bench","kubebuilder","kubecm","kubeconform","kubectl","kubectx","kubens","kubescape","kubeseal","kubestr","kubetail","kubeval","kumactl","kustomize","lazygit","linkerd2","mc","metal","minikube","mixctl","mkcert","nats","nats-server","nerdctl","nova","oh-my-posh","opa","operator-sdk","osm","pack","packer","polaris","popeye","porter","promtool","rekor-cli","rpk","run-job","scaleway-cli","sops","stern","syft","talosctl","tctl","terraform","terragrunt","terrascan","tfsec","tilt","tkn","trivy","vagrant","vault","vcluster","viddy","waypoint","yq","yt-dlp"]');

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const core = __nccwpck_require__(518);
const exec = __nccwpck_require__(519);
const schema = __nccwpck_require__(229)
const os = __nccwpck_require__(37)
const path = __nccwpck_require__(17)

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

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=index.js.map