import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const root = process.argv[2] || '.', port = Number(process.env.PORT || 4173), types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'}
createServer(async(req,res)=>{try{let p=normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^[/\\]+/,'')||'index.html', file=join(root,p);if((await stat(file)).isDirectory())file=join(file,'index.html');res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(await readFile(file))}catch{res.writeHead(404);res.end('Not found')}}).listen(port,'127.0.0.1',()=>console.log(`http://127.0.0.1:${port}`))
