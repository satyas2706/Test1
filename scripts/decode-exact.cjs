const fs = require('fs');
const code = fs.readFileSync('./scripts/widget_raw.js', 'utf8');

// The array function is a0_0x143c
// The rotator is right after
const idxRotator = code.indexOf('(function(_0x');
const endRotator = code.indexOf(');', idxRotator) + 2;
const rotatorCode = code.slice(idxRotator, endRotator);

// Decoder function
const idxDecoder = code.indexOf('function _0x', endRotator);
const endDecoder = code.indexOf('return _0x', idxDecoder);
const endDecoder2 = code.indexOf('}', endDecoder) + 1;
const decoderCode = code.slice(idxDecoder, endDecoder2);

// Array function
const idxArray = code.indexOf('function a0_0x143c');
const endArray = code.indexOf('return _0x404a62;}') + 18;
const arrayCode = code.slice(idxArray, endArray);

const fullScript = `
${arrayCode}
${rotatorCode}
${decoderCode}
global.decode = _0x3fb0ca;
`;

const vm = require('vm');
const sandbox = { global: {} };
vm.createContext(sandbox);
vm.runInContext(fullScript, sandbox);

console.log("Decoder ready! Let's find indices:");
const dict = {};
for (let i = 0x180; i <= 0x330; i++) {
  try {
    const val = sandbox.global.decode(i);
    dict[val] = '0x' + i.toString(16);
  } catch(e) {}
}

console.log("bot_configs:", dict['bot_configs']);
console.log("/api/bot/get_by_secret_key:", dict['/api/bot/get_by_secret_key']);
console.log("widgetType:", dict['widgetType']);
console.log("voice:", dict['voice']);
console.log("Chat:", dict['Chat']);
console.log("iframeUrl:", dict['iframeUrl']);
console.log("secret_key:", dict['secret_key']);
