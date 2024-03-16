import aiohttp

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import server
import asyncio
import folder_paths

async def handleNode(request):
    url = "http://127.0.0.1:8189/{}".format(request.match_info['tail'])
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers = request.headers) as resp:
            return aiohttp.web.Response(
                body = await resp.read(),
                status = resp.status,
                headers = resp.headers
            )

async def readNode(stream, cb):
    while True:
        line = await stream.read(256)
        if line:
            cb(line)
        else:
            break


async def launchNode():
    checkpoint_folder = [f for f in folder_paths.get_folder_paths("checkpoints") if folder_paths.get_output_directory() not in f][-1]
    lora_folder = [f for f in folder_paths.get_folder_paths("loras") if folder_paths.get_output_directory() not in f][-1]
    serverjs = os.path.abspath(os.path.join(os.path.dirname(__file__), 'host/src/server.js'))
    proc = await asyncio.create_subprocess_exec(
        'node', serverjs, '-c', checkpoint_folder, '-l', lora_folder, '-p', '8189',
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE)
    await asyncio.wait([
        asyncio.create_task(readNode(proc.stdout, lambda x: print("%s" % x))),
        asyncio.create_task(readNode(proc.stderr, lambda x: print("%s" % x)))
    ])
    await proc.wait()

def init():
    asyncio.ensure_future(launchNode())
    server.PromptServer.instance.app.add_routes([
        aiohttp.web.route('*', '/model_info/{tail:.*}', handleNode)
    ])

init()

WEB_DIRECTORY = "comfy_web_extension"
NODE_CLASS_MAPPINGS = {}
__all__ = ['NODE_CLASS_MAPPINGS']