// Public preview entry; the internal builder remains a development-only tool.
import {verify} from './verify.mjs';
await verify();
await import('./preview.mjs');
