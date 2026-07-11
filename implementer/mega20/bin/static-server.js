
const http=require('http');const fs=require('fs');const path=require('path');
const root="/Users/nesbes/mcp-a;t/implementer/mega20/fixtures";
http.createServer((req,res)=>{
  let p=decodeURIComponent((req.url||'/').split('?')[0]);
  if(p==='/') p='/store.html';
  const fp=path.join(root, p.replace(/^\//,''));
  if(!fp.startsWith(root) || !fs.existsSync(fp)) { res.writeHead(404); return res.end('nf'); }
  const ext=path.extname(fp);
  const ct=ext==='.html'?'text/html':ext==='.json'?'application/json':'text/plain';
  res.writeHead(200,{'content-type':ct}); fs.createReadStream(fp).pipe(res);
}).listen(8766,'127.0.0.1',()=>console.log('static :8766'));
