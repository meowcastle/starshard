// collect BUFFERS and concat once — never string-concat stdin chunks, a multi-byte
// character split across a chunk boundary corrupts silently and changes the hash
import crypto from "node:crypto";
const chunks=[]; for await (const c of process.stdin) chunks.push(c);
const s=Buffer.concat(chunks).toString("utf8");
const a=s.indexOf('<script type="text/x-dc"'), b=s.indexOf(">",a), d=s.indexOf("</script>",a);
console.log(crypto.createHash("sha256").update(s.slice(b+1,d)).digest("hex").slice(0,16));
