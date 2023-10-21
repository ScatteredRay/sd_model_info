// import {
//     createSignal,
//     onCleanup,
// } from "https://cdn.skypack.dev/solid-js";
import { render } from "https://cdn.skypack.dev/solid-js/web";
//import html from "https://cdn.skypack.dev/solid-js/html";
import h from "https://cdn.skypack.dev/solid-js/h";

class ModelInfoAPI {
    constructor() {
        this.url = new URL(location);
        this.url.pathname += "model_info/";
        return;
        if(this.url.port.length > 0) {
            this.url.port = Number(this.url.port) + 1;
        }
        else {
            this.url.port = "8189";
        }
    }

    async listModels(type) {
        let resp = await fetch(this.url + `api/models/${type}`);
        let data = await resp.json();
        return data.items;
    }

    async modelInfo(name) {
        let resp = await fetch(this.url + `api/model/${name}`);
        let data = await resp.json();
        return data;
    }
};

class ModelInfo {
    name = "ModelInfo";
    ownMenu = false;
    modelTypes = [
        "checkpoints",
        "loras"
    ];
    selectedModel = null;

    constructor(integration) {
        this.integration = integration;
    }

    createUI() {
        console.log("UIT!");
        if(this.ownMenu) {
            this.menuContainer = h("div.comfy-menu", {}, [
                h("div.drag-handle", {
                    style: {
                        overflow: "hidden",
                        position: "relative",
                        width: "100%",
                        cursor: "default"
                    }
                }, [
                    h("span.drag-handle"),
                    h("span", {$: (q) => (this.queueSize = q)}),
                    h("button.comfy-settings-btn", {textContent: "⚙️", onclick: () => console.log("click")}),
                ])
            ]);
        }
        else {
            this.menuContainer = this.integration.getMenuContainer();
        }

        this.modelButton = h("button", {
            textContent: "models",
            onclick: async (ev) => {
                let modelMenu = new LiteGraph.ContextMenu(this.modelTypes, {
                    event: ev,
                    callback: async (v,e, p) => {
                        let type = v;
                        let modelList = await this.info.listModels(type);
                        let menu = new LiteGraph.ContextMenu(modelList, {
                            event: ev,
                            callback: (v, e, p) => {
                                this.selectModel(v);
                            },
                            parent: modelMenu
                        });
                    }
                });
            }
        });

        console.log(this.modelButton, this.menuContainer);
        render(this.modelButton, this.menuContainer);
    }

    async selectModel(name) {
        this.modelButton.textContent = name;
        this.selectedModel = name;
        this.selectedModelInfo = await this.info.modelInfo(name);
        console.log(this.selectedModelInfo);
    }

    init() {
        console.log("init");
        this.info = new ModelInfoAPI();
        this.createUI();
    }

    setup() {
    }
};

async function RegisterComfyApp() {
    const app = (await import("../../scripts/app.js")).app;
    const api = (await import("../../scripts/api.js")).api;

    class ComfyIntegration {
        getMenuContainer() {
            return app.ui.menuContainer;
        }
    };
    app.registerExtension(new ModelInfo(new ComfyIntegration()));
}

if(true) {
    console.log("register");
    await RegisterComfyApp();
}