import fetch from 'node-fetch';
import crypto from 'crypto';
import * as fs from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { default as EasyDl } from 'easydl';

export const modelTypeMap = {
    "LORA" : {
        "dest" : "models/loras"
    },
    "LoCon" : {
        "dest" : "models/loras"
    },
    "Checkpoint" : {
        "dest" : "models/checkpoints"
    },
    "TextualInversion" : {
        "dest" : "models/embeddings"
    }
};

export function setModelTypeDest(type, dest) {
    modelTypeMap[type].dest = dest;
}

export async function searchModels(query, types, limit = 10) {
    let url = new URL("https://civitai.com/api/v1/models");
    let p = url.searchParams;
    p.append('limit', 2);
    if(query) {
        p.append('query', encodeURI(query));
    }
    if(types) {
        for(let type of types) {
            p.append('types', type);
        }
    }
    if(limit) {
        p.append('limit', limit);
    }
    let models = await (await fetch(url)).json();
    return models.items;
}

export async function modelFromVersionId(versionId) {
    let url = new URL(`https://civitai.com/api/v1/model-versions/${versionId}`);
    let model = await (await fetch(url)).json();
    return model;
}

export async function modelFromModelId(modelId) {
    let url = new URL(`https://civitai.com/api/v1/models/${modelId}`);
    let model = await (await fetch(url)).json();
    return model;
}


export async function modelFromHash(hash) {
    let url = new URL(`https://civitai.com/api/v1/model-versions/by-hash/${hash}`);
    let model = await (await fetch(url)).json();
    return model;
}

export async function hashFile(file) {
    let fd = await fs.open(file);
    let stream = fd.createReadStream(file);
    let sha256 = crypto.createHash("sha256");
    sha256.setEncoding('hex');
    let end = new Promise((res, rej) => stream.on('end', res));
    await pipeline(stream, sha256);
    sha256.end();
    return sha256.read();
}

export async function downloadModelMetaForFile(file) {
    return await modelFromHash(await hashFile(file));
}

export function metaFilenameForFile(file) {
    let fp = path.parse(file);
    delete fp.base;
    fp.ext = ".meta";
    return path.format(fp);
}

export async function saveModelMetaForFile(file) {
    let ret = await downloadModelMetaForFile(file);
    let meta = JSON.stringify(ret);
    await fs.writeFile(metaFilenameForFile(file), meta);
    return JSON.parse(meta);
}

export async function getModelMetaForFile(file) {
    let metaFile = metaFilenameForFile(file);
    try {
        let resp = await fs.readFile(metaFile, {encoding: "utf8"});
        return JSON.parse(resp);
    }
    catch(err) {
        return await saveModelMetaForFile(file);
    }
}

export function getPathForModel(name, type) {
    let modelType = modelTypeMap[type];
    if(modelType === undefined) {
        throw Error(`Unknown type ${type}`);
    }
    let dest = modelType.dest;
    return `${dest}/${name}`;
}

export async function chooseFileForModel(model) {
    let files = [];
    if(model.files) {
        files = model.files;
    }
    if(model.modelVersions) {
        let modelFiles = model.modelVersions.map(x => x.files);
        files = files.concat.apply(files, modelFiles);
    }
    files = files.filter((f) => f.type === "Model");
    let file = files[0]; // Assuming the first one for now...
    if(model.type) {
        file.modelType = model.type;
    }
    else if(model.model && model.model.type) {
        file.modelType = model.model.type;
    }
    else {
        throw Error(`Cannot find type for model, ${model}`);
    }
    return file;
}

export async function getWgetForModel(model) {
    let file = await chooseFileForModel(model);
    let url = file.downloadUrl;
    let name = file.name;
    let type = file.modelType;
    if(type === undefined) {
        return '#error: ${model}';
    }
    let dest = getPathForModel(name, type);
    return `wget -nc "${url}" -O "${dest}"`
}


export async function downloadForModel(model) {
    let file = await chooseFileForModel(model);
    if(!file.name || !file.downloadUrl || !file.modelType) {
        throw new Error("Unable to download", file);
    }
    let dest = getPathForModel(file.name, file.modelType);
    console.log("Download", dest, file.downloadUrl);
    let dl = await (new EasyDl(file.downloadUrl, dest).wait())
    console.log("downloaded", dl);
    return dest;
}

export async function getWgetForFile(file) {
    return await getWgetForModel(await getModelMetaForFile(file));
}