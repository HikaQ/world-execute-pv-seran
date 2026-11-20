import {startServer} from './server.mjs';
const port=Number(process.env.PORT||4173);
const {url}=await startServer({port,demo:!process.argv.includes('--strict')});
console.log(`Silent source preview: ${url}\nExternal images use labelled placeholders unless supplied in media.local/. Ctrl+C to stop.`);
