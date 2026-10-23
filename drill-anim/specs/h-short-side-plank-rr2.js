// rr2 (Hark review 2026-10-23): rr1 pose, supports and timing unchanged; camera only. rr1 looked from the head end
// (dir x 0.8), foreshortening the body so the knee-to-shoulder line read as a crumpled heap. rr2 faces the body
// nearly square-on, slightly low, so the straight body line and the forearm/knee supports read clearly.
import rr1 from './h-short-side-plank-rr1.js';
const s=structuredClone(rr1);s.id='h-short-side-plank-rr2';
s.camera={...s.camera,dir:[0.18,0.12,1]};
export default s;
