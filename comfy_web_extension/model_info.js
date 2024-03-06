// import {
//     createSignal,
//     onCleanup,
// } from "https://cdn.skypack.dev/solid-js";
import { render } from "https://cdn.skypack.dev/solid-js/web";
import h from "https://cdn.skypack.dev/solid-js/h";
import { createSignal, Show } from "https://cdn.skypack.dev/solid-js";
import { Select } from "https://cdn.skypack.dev/@kobalte/core";

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

    constructor(integration) {
        this.integration = integration;
        [this.selectedModel, this.setSelectedModel] = createSignal(null);
        [this.expanded, this.setExpanded] = createSignal(true);
    }

    createUI() {
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

        this.modelButton = h(
            Select.Root,
            {
                defaultValue: "one",
                options: () => ["one", "two", "three"],
                placeholder: "model",
                itemComponent: () => props => {
                    console.log("X", props);
                    return h(Select.Item,
                             {
                                 item: props.item,
                                 class: "select__item"
                             },
                             h('div', null, "A"),
                             h(Select.ItemLabel, null,
                               props.item.rawValue
                              ),
                             h('div', null, "B"),
                             h(Select.ItemIndicator,
                               {
                                   class: "select__item-indicator"
                               }
                              )
                            );
                }
            },
            //h(Select.Label),
            h(Select.Trigger, {
                class: "select__trigger"
            },
              h(Select.Value, {
                  class: "select__value"
              },
                (state) => `> ${state.selectedOption()} <`
               )
             ),
            h(Select.Portal,
              null,
              h(Select.Content, {
                  class:"select__content",
                  style: {
                      "z-index": 1001
                  }
              },
                h(Select.Listbox, {
                  class:"select__listbox"
                }))
             )
        );

        this.expandBtn = h(
            "button", {
                textContent: "→",
                onclick: async (ev) => {
                    this.setExpanded(!this.expanded())
                }
            }
        );

        this.modelInfo = h(
            Show, {
                when: this.expanded
            },
            h(
                "div",
                {
                },
                h("h2", "Model"),
                h(Show,
                  {
                      when: this.selectedModel,
                  },
                  h("div",
                    h("div", this.selectedModel),
                    h("div", "XXX")
                   )
                 ),
                h("span", "3")
            )
        );

        render(this.modelButton, this.menuContainer);
        render(this.expandBtn, this.menuContainer);
        render(this.modelInfo, this.menuContainer);
    }

    async selectModel(name) {
        this.setSelectedModel(name);
        this.selectedModelInfo = await this.info.modelInfo(name);
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
    console.log("register");
    await RegisterComfyApp();
}