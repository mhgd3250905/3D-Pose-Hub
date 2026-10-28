export const HAND_SOURCE='hands-native-c1r2-symmetric-r1';
export function checkOptions(options={}){
 if(!options||typeof options!=='object'||Array.isArray(options))throw Error('armfix-r2 options must be an object');
 if(Object.keys(options).some(k=>!['handDir','handScale'].includes(k)))throw Error('armfix-r2 unsupported option; mutable handAsset overrides are forbidden');
 if(('handScale' in options&&options.handScale!==1)||('handDir' in options&&options.handDir!==HAND_SOURCE))throw Error('armfix-r2 requires handScale1 and fixed '+HAND_SOURCE);
 return options;
}
