import plugin from "../plugin.json";

const alert = acode.require("alert");

const toInternalUrl = acode.require("toInternalUrl");
const { activeFile } = editorManager;
let browseUrl = "";

class AcodePlugin {
    async init($page) {
        editorManager.editor.commands.addCommand({
            name: "example-plugin",
            bindKey: {
                win: "Ctrl-t",
                mac: "Command-Alt-t"
            },
            exec: this.run.bind(this)
        });
        try {
            this.setupReloadBtn();
            $page.id = "example-plugin-respon";
            const seachBtn = tag("span", {
                className: "icon search",
                dataset: {
                    action: "toggle"
                }
            });

            this.$page = $page;
            const search = tag("input", {
                type: "search",
                id: "searchBar-url",
                placeholder: "Url",
                dataset: {
                    action: "search"
                }
            });
            search.style = `
            padding: 0;
            width:90%;
            height:35px;
            background:#2b2b2b;
            color:#fff;
            border-radius:20px;
            border:none;
            `;
            const menuBtn = tag("span", {
                className: "icon more_vert",
                dataset: {
                    action: "toggle-menu"
                }
            });

            this.$page.header.append(search, seachBtn, menuBtn);

            this.searchBar = tag("input", {
                type: "search",
                placeholder: "Url"
            });

            this.webViewer = tag("iframe", {
                className: "web-viewer",
                src: "https://chaos-19.github.io/React-weather-app/"
            });
            this.webViewer.style = `
                position: absolute;
                top: 0;
                left: 0;
                bottom: 0;
                height: 100%;
                width: 100%;
                -webkit-transform-origin: 0 0;
                -ms-transform: : 0 0;
                transform-origin: : 0 0;`;

            this.iframeContainer = tag("div", {
                className: "iframe-container"
            });
            this.iframeContainer.style = `
                    position: relative;
                    display: block;
                    width:100%;
                    height: 100%;
                    padding: 0;
                    overflow: hidden;`;

            this.controller = tag("div", {
                className: "controller"
            });
            this.controller.style = `
                  width:100%;
                   position:absolute;
                   bottom:0;
                  `;
            this.widthController = tag("div", {
                className: "widthController"
            });
            this.widthController.innerHTML = `
                <button class="plus-width">+</button>
                  <input type="range" name="widthAdjuster" id="widthAdjuster" value="5" min="1" max="9" />
                <button class="minus-width">-</button>
                `;
            this.heightController = tag("div", {
                className: "heightController"
            });
            this.heightController.innerHTML = `
               <button class="plus-height">+</button>
                <input type="range" name="heightAdjuster" id="heightAdjuster" value="5" min="1" max="9" />
               <button class="minus-height" onclick="minus('#heightAdjuster')">-</button>
            `;
            this.zoomController = tag("div", {
                className: "heightController"
            });
            this.zoomController.innerHTML = `
               <button class="zoom-in">+</button>
                <input type="range" name="zoomAdjuster" id="zoomAdjuster" value="5" min="1" max="9" />
               <button class="zoom-out">-</button>
            `;

            this.plus = element => {
                const range = this.controller.querySelector(element);
                range.value = parseInt(range.value) + 10;
            };
            this.minus = element => {
                const range = this.controller.querySelector(element);
                range.value = parseInt(range.value) - 10;
            };
            
            seachBtn.onclick = function (e) {};

            // Global styles
            this.$style = tag("style", {
                textContent: `
                    #searchBar-url:focus{
                     border:none;
                    }
                    .widthController,
                    .heightController {
                      border: 2px solid red;
                      display: flex;
                      align-items: center;
                      justify-content: space-around;
                      padding: 5px;
                    }
                
                    .widthController input[type="range"],
                    .heightController input[type="range"] {
                      width:80%;
                    }
                
                    .controller button {
                      font-size: 20px;
                      padding: 3px 8px;
                    }
                `
            });
            this.iframeContainer.append(this.webViewer);
            this.$page.appendBody(this.iframeContainer);
            this.controller.append(
                this.widthController,
                this.heightController,
                this.zoomController
            );
            this.$page.appendBody(this.controller);
            document.head.append(this.$style);
        } catch (e) {
            console.log(e);
            alert(e);
        }
    }
    setupReloadBtn() {
        this.$btn = tag("span", {
            className: "icon play_arrow",
            action: "browse",
            attr: {
                action: "browse"
            },
            onclick: () => {
                this.toInternal().then(res => {
                    browseUrl = res;
                    alert("btn  : " + JSON.stringify(res));
                });
            },
            oncontextmenu() {
                //indow.location.assign(window.location.href);
                alert("oncontextmenu");
            }
        });
        const $header = root.get("header");
        $header.insertBefore(this.$btn, $header.children[2]);
    }
    async run() {
        this.$page.show();
    }

    async getUrl() {
        return this.toInternal();
    }
    async getFile() {
        const fsOperation = acode.require("fsOperation");
        const filesystem = await fsOperation(activeFile.location);
        return filesystem;
    }
    _convertPath(path) {
        if (path.startsWith("content://com.termux.documents/tree")) {
            let termuxPath = path
                .split("::")[1]
                .substring(0, path.split("::")[1].lastIndexOf("/"))
                .replace(/^\/data\/data\/com\.termux\/files\/home/, "$HOME");
            return termuxPath;
        } else if (path.startsWith("file:///storage/emulated/0/")) {
            let sdcardPath =
                "/sdcard" +
                path
                    .substr("file:///storage/emulated/0".length)
                    .replace(/\.[^/.]+$/, "")
                    .split("/")
                    .slice(0, -1)
                    .join("/") +
                "/";
            return sdcardPath;
        } else if (
            path.startsWith(
                "content://com.android.externalstorage.documents/tree/primary"
            )
        ) {
            let androidPath =
                "/sdcard/" +
                path
                    .split("::primary:")[1]
                    .substring(0, path.split("::primary:")[1].lastIndexOf("/"));
            return androidPath;
        } else {
            return false;
        }
    }

    async toInternal() {
        let realUrl = this._convertPath(activeFile.uri);
        if (realUrl.startsWith("/sdcard")) {
            realUrl = realUrl.replace("/sdcard", "file:///storage/emulated/0");
        } else if (realUrl.startsWith("$HOME")) {
            return;
        }
        const urlSegments = activeFile.uri.split("/");
        const fileNameWithExtension = urlSegments[urlSegments.length - 1];
        realUrl = realUrl + "/" + fileNameWithExtension;
        let newUrl = await toInternalUrl(realUrl);
        alert("toInternalUrl : " + newUrl);
        return newUrl;
    }

    async destroy() {
        editorManager.editor.commands.removeCommands("example-plugin");
        this.$btn.remove();
        this.$style.remove();
    }
}

if (window.acode) {
    const acodePlugin = new AcodePlugin();
    acode.setPluginInit(
        plugin.id,
        async (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
            if (!baseUrl.endsWith("/")) {
                baseUrl += "/";
            }
            acodePlugin.baseUrl = baseUrl;
            await acodePlugin.init($page, cacheFile, cacheFileUrl);
        }
    );
    acode.setPluginUnmount(plugin.id, () => {
        acodePlugin.destroy();
    });
}
