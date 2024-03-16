// import {
//     createSignal,
//     onCleanup,
// } from "https://cdn.skypack.dev/solid-js";
import { render } from "https://cdn.skypack.dev/solid-js/web";
import h from "https://cdn.skypack.dev/solid-js/h"; // h really just exports hyper-dom-expressions
import { createSignal, Show, For, createEffect } from "https://cdn.skypack.dev/solid-js";
//import { Select } from "https://cdn.skypack.dev/@kobalte/core";
//import { Select } from "https://cdn.skypack.dev/@thisbeyond/solid-select";

//import "./style.css";
let styleLink = document.createElement("link");
styleLink.rel = "stylesheet";
styleLink.type = "text/css";
styleLink.href = "/extensions/sd_model_info/style.css";
document.head.appendChild(styleLink);

class ModelInfoAPI {
    constructor() {
        this.url = new URL(location);
        this.url.pathname += "model_info/";
        if(false) {
            if(this.url.port.length > 0) {
                this.url.port = Number(this.url.port) + 1;
            }
            else {
                this.url.port = "8189";
            }
        }
    }

    async listModels(type) {
        let resp = await fetch(this.url + `api/models/${type}`);
        let data = await resp.json();
        return data.items;
    }

    async modelInfo({name, modelId, versionId}) {
        let api = null;
        if(name) {
            api = `api/model/${name}`;
        }
        else if(modelId) {
            api = `api/model_id/${modelId}`;
        }
        else if(versionId) {
            api = `api/model_version_id/${versionId}`;
        }
        else {
            return null;
        }
        let resp = await fetch(this.url + api);
        let data = await resp.json();
        //if(data.modelVersions) {
        //data = data.modelVersions[0];
        //}
        return data;
    }

    async downloadModel({name, modelId, versionId}) {
        let api = null;
        if(name) {
            api = `api/model/${name}/download`;
        }
        else if(modelId) {
            api = `api/model_id/${modelId}/download`;
        }
        else if(versionId) {
            api = `api/model_version_id/${versionId}/download`;
        }
        else {
            throw new Error("unknown");
        }
        let resp = await fetch(this.url + api);
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

    constructor(integration) {
        this.integration = integration;
        [this.selectedModelType, this.setSelectedModelType] = createSignal(this.modelTypes[0]);
        [this.modelList, this.setModelList] = createSignal([]);
        [this.selectedModel, this.setSelectedModel] = createSignal(null);
        [this.selectedModelId, this.setSelectedModelId] = createSignal(null);
        [this.selectedModelVersionId, this.setSelectedModelVersionId] = createSignal(null);
        [this.modelInfo, this.setModelInfo] = createSignal(null);
        [this.expanded, this.setExpanded] = createSignal(true);
    }

    modelUI() {
        // let modelButton = h(
        //     Select.Root,
        //     {
        //         //defaultValue: () => this.modelList[0],
        //         options: async () => {
        //             let modelList = await this.info.listModels(this.selectedModelType());
        //             console.dir(modelList);
        //             return modelList;
        //         },
        //         placeholder: "model",
        //         itemComponent: () => props => {
        //             console.log("X", props);
        //             return h(Select.Item,
        //                      {
        //                          item: props.item,
        //                          class: "select__item"
        //                      },
        //                      h(Select.ItemLabel, null,
        //                        props.item.rawValue
        //                       ),
        //                      h(Select.ItemIndicator,
        //                        {
        //                            class: "select__item-indicator"
        //                        }
        //                       )
        //                     );
        //         }
        //     },
        //     //h(Select.Label),
        //     h(Select.Trigger, {
        //         class: "comfy-btn"
        //     },
        //       h(Select.Value, {
        //           class: "select__value"
        //       },
        //         (state) => `> ${state.selectedOption()} <`
        //        )
        //      ),
        //     h(Select.Portal,
        //       null,
        //       h(Select.Content, {
        //           class:"select__content",
        //           style: {
        //               "z-index": 1001
        //           }
        //       },
        //         h(Select.Listbox, {
        //           class:"select__listbox"
        //         }))
        //      )
        // );

        let Select = "select";

        createEffect(async () => {
            this.setModelList(await this.info.listModels(this.selectedModelType()));
        });

        createEffect(async () => {
            let selectedModel = this.selectedModel();
            let selectedModelId = this.selectedModelId();
            let selectedModelVersionId = this.selectedModelVersionId();
            console.log("effect");
            if(selectedModelVersionId) {
                console.dir(selectedModelVersionId);
                this.setModelInfo(await this.info.modelInfo({versionId: selectedModelVersionId}));
                console.dir("MI", this.modelInfo());
            }
            else if(selectedModelId) {
                console.dir(selectedModelId);
                this.setModelInfo(await this.info.modelInfo({modelId: selectedModelId}));
                console.dir("MI", this.modelInfo());
            }
            else if(selectedModel) {
                console.dir(selectedModel);
                this.setModelInfo(await this.info.modelInfo({name: selectedModel}));
                console.dir("MI", this.modelInfo());
            }
            else {
                this.setModelInfo(null);
            }
        });

        let modelTypeButton = h(
            Select,
            {
                onchange: (e) => this.setSelectedModelType(e.target.value)
            },
            (this.modelTypes.map(t =>
                {
                    console.log(t);
                    return h("option", {value: t}, t);
                }))
        );

        let modelButton = h(
            Select,
            {
                onchange: (e) => {
                    this.selectModel(e.target.value);
                }
            },
            () => {
                let options = (this.modelList()).map(
                    (v) => {
                        return h("option", {value: v}, v);
                    });
                return options;
            }
        );

        let expandBtn = h(
            "button", {
                textContent: "→",
                onclick: (ev) => {
                    this.setExpanded(!this.expanded())
                }
            }
        );

        let downloadSelected = () => {
            this.info.downloadModel({
                name: this.selectedModel(),
                modelId: this.selectedModelId(),
                versionId: this.selectedModelVersionId()
            });
        }

        let modelInfo = h(
            Show, {
                when: this.expanded
            },
            h(
                "div",
                {
                    style: "max-height: 400px;overflow: scroll;"
                },
                h("input", {
                    onchange: (e) => {
                        this.selectModelId(e.target.value);
                    }
                }),
                h("input", {
                    onchange: (e) => {
                        this.selectModelVersionId(e.target.value);
                    }
                }),
                h("h2", "Model"),
                h(Show,
                  {
                      when: this.modelInfo,
                  },
                  h("div",
                    h(Show, { when: this.modelInfo },
                      h("div", () => this.modelInfo().name),
                      h("button", {
                          onclick : downloadSelected
                      }, "Download"),
                      h("div", null, () => {
                          let modelInfo = this.modelInfo();
                          return modelInfo.model ? modelInfo.model.type : modelInfo.type ? modelInfo.type : "";
                      }),
                      h("div", null, () => this.modelInfo().baseModel),
                      h("div", null, () => this.modelInfo().modelId),
                      h(For, { each: () => this.modelInfo().modelVersions ? this.modelInfo().modelVersions[0].images : this.modelInfo().images },
                        (img) => h("img", {src: img.url, style: "width: 100px; height: auto;"})
                       ),
                      h(For, { each: () => this.modelInfo().trainedWords },
                        (word) => h("div", null, word)
                       )
                     )
                   )
                 )
            )
        );

        // How do we make this empty?
        return h((o) => o.children, null,
                 modelTypeButton, modelButton, expandBtn, modelInfo);
    }

    async createUI() {
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

        render(((() => h(this.modelUI.bind(this)))).bind(this), this.menuContainer);
    }

    async selectModel(name) {
        this.setSelectedModel(name);
        this.setSelectedModelId(null);
        this.setSelectedModelVersionId(null);
    }

    async selectModelId(id) {
        this.setSelectedModel(null);
        this.setSelectedModelId(id);
        this.setSelectedModelVersionId(null);
    }

    async selectModelVersionId(id) {
        this.setSelectedModel(null);
        this.setSelectedModelId(null);
        this.setSelectedModelVersionId(id);
    }

    init() {
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
    await RegisterComfyApp();
}