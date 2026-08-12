import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index+1] ? args[index+1] : fallback;
};
const host = valueAfter("--host", "127.0.0.1");
const port = Number(valueAfter("--port", process.env.PORT || "4173"));
const mime = {
  ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8", ".json":"application/json; charset=utf-8",
  ".svg":"image/svg+xml", ".png":"image/png", ".jpg":"image/jpeg", ".jpeg":"image/jpeg",
};

createServer(async (request,response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url,"http://local").pathname);
    let file = resolve(root,"."+pathname);
    if(file!==root && !file.startsWith(root+sep)) throw new Error("invalid path");
    if((await stat(file)).isDirectory()) file=resolve(file,"index.html");
    const body = await readFile(file);
    response.writeHead(200,{"content-type":mime[extname(file)] || "application/octet-stream","cache-control":"no-store"});
    response.end(body);
  } catch {
    response.writeHead(404,{"content-type":"text/plain; charset=utf-8"});
    response.end("Not found");
  }
}).listen(port,host,()=>console.log(`Elevator preview: http://${host}:${port}`));
