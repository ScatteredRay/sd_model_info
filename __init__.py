import aiohttp

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import server

async def handleNode(request):
    print(request)
    print(request.url)
    print(request.rel_url)
    #return aiohttp.web.json_response([1, 2])
    print(request.match_info['tail'])
    url = "http://127.0.0.1:8189/{}".format(request.match_info['tail'])
    print(url)
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers = request.headers) as resp:
            return aiohttp.web.Response(
                body = await resp.read(),
                status = resp.status,
                headers = resp.headers
            )

def init():
    server.PromptServer.instance.app.add_routes([
        aiohttp.web.route('*', '/model_info/{tail:.*}', handleNode)
    ])

init()

WEB_DIRECTORY = "comfy_web_extension"
NODE_CLASS_MAPPINGS = {}
__all__ = ['NODE_CLASS_MAPPINGS']