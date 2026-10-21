import importlib.util
import unittest
import tempfile
import json
import io
import multiprocessing
import sys
import time
from unittest.mock import patch
from pathlib import Path
import numpy as np
from PIL import Image

spec=importlib.util.spec_from_file_location('composite',Path(__file__).with_name('composite.py'))
c=importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)


def merge_worker(path, action, ready, start, result):
    """Spawned independently on Windows; no shared Python module state/cache."""
    ready.put(action)
    if not start.wait(10):
        result.put('start barrier timeout')
        return
    try:
        for index in range(6):
            skin=f'skin-{index}'
            item={'actionId':action,'skin':skin,'theme':'dark','video':{'sha256':action+str(index)}}
            c.merge_derivative_manifest(Path(path),[item],{action:{skin:{'sha256':action+str(index)}}})
            time.sleep(.001)
        result.put(None)
    except Exception as error:
        result.put(repr(error))


def hold_lock_worker(path, entered, release):
    with c.manifest_lock(Path(path)):
        entered.set()
        release.wait(10)


class CompositionTests(unittest.TestCase):
    def test_highlight_does_not_change_alpha_or_colour_outside_mask(self):
        body=Image.new('RGBA',(2,1),(100,100,100,128))
        mask=Image.fromarray(np.array([[255,0]],dtype=np.uint8))
        _,on=c.compose(body,mask,None,'#ffffff',True,'#ff0000',1)
        self.assertEqual(on.getpixel((0,0)),(255,0,0,128))
        self.assertEqual(on.getpixel((1,0)),(100,100,100,128))

    def test_straight_alpha_is_applied_once(self):
        body=Image.new('RGBA',(1,1),(255,0,0,128))
        mask=Image.new('L',(1,1),0)
        image,_=c.compose(body,mask,None,'#ffffff')
        self.assertEqual(image.getpixel((0,0)),(255,127,127))

    def test_shadow_is_below_body_and_alpha_zero_stays_clear(self):
        body=Image.new('RGBA',(2,1),(255,255,255,255));body.putpixel((1,0),(0,0,0,0))
        shadow=Image.new('RGBA',(2,1),(0,0,0,128))
        image,front=c.compose(body,Image.new('L',(2,1),255),shadow,'#ffffff',False)
        self.assertEqual(image.getpixel((0,0)),(255,255,255))
        self.assertEqual(image.getpixel((1,0)),(127,127,127))
        self.assertEqual(front.getpixel((1,0))[3],0)

    def test_mismatch_and_invalid_parameters_rejected(self):
        with self.assertRaises(ValueError):
            c.compose(Image.new('RGBA',(2,2)),Image.new('L',(1,1)),None,'white')
        with self.assertRaises(ValueError):
            c.compose(Image.new('RGBA',(1,1)),Image.new('L',(1,1)),None,'white',brightness=2)

    def test_declared_sequence_cannot_fall_back_to_a_stale_frame(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);base=root/'masters/realistic/w-dead-bug';base.mkdir(parents=True)
            (base/'index.json').write_text(json.dumps({'frames':[{'frame':0,'path':'zero.png'}]}))
            (base/'layer-manifest.json').write_text(json.dumps({'sequences':{'body':{'path':'masters/realistic/w-dead-bug/index.json'}}}))
            with self.assertRaises(FileNotFoundError):c.layer_paths(root,'realistic','w-dead-bug',1)

    def test_bad_mask_size_is_not_hidden_by_framing_resize(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);base=root/'masters/realistic/w-dead-bug'
            for layer,prefix,size in [('body','m',1080),('highlight','k',540),('shadow','s',1080)]:
                d=base/layer;d.mkdir(parents=True)
                Image.new('RGBA',(size,size)).save(d/f'{prefix}-0000.png')
            with self.assertRaises(ValueError):c.read_layers(root,'realistic','w-dead-bug',0)

    def test_existing_output_is_rejected_before_recipe_mutation(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);recipe={'crop':[0,0,1080,1080]}
            f=root/'manifests/framing/w-dead-bug.json';f.parent.mkdir(parents=True);f.write_text(json.dumps(recipe))
            original=f.read_bytes()
            video=root/'derivatives/realistic/w-dead-bug/dark/loop.720.mp4';video.parent.mkdir(parents=True);video.write_bytes(b'preserve partial output')
            with patch.object(c,'framing',return_value=recipe),self.assertRaises(FileExistsError):
                c.make_derivatives(root,['w-dead-bug'],['realistic'])
            self.assertEqual(f.read_bytes(),original)
            self.assertEqual(video.read_bytes(),b'preserve partial output')

    def test_two_processes_preserve_all_completed_variants_and_covers(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'manifests/derivatives.json'
            seed={'actionId':'previous','skin':'original','theme':'light'}
            c.merge_derivative_manifest(path,[seed],{'previous':{'original':{'sha256':'preserved'}}})
            ctx=multiprocessing.get_context('spawn')
            ready,start,result=ctx.Queue(),ctx.Event(),ctx.Queue()
            workers=[ctx.Process(target=merge_worker,args=(str(path),action,ready,start,result)) for action in ['action-a','action-b']]
            try:
                for worker in workers:worker.start()
                self.assertEqual({ready.get(timeout=15),ready.get(timeout=15)},{'action-a','action-b'})
                start.set()
                for worker in workers:worker.join(15)
                self.assertTrue(all(worker.exitcode==0 for worker in workers))
                self.assertIsNone(result.get(timeout=2));self.assertIsNone(result.get(timeout=2))
                data=json.loads(path.read_text(encoding='utf-8'))
                self.assertEqual(len(data['variants']),13)
                self.assertIn(seed,data['variants'])
                self.assertEqual(set(data['transparentCovers']),{'previous','action-a','action-b'})
                self.assertEqual(len(data['transparentCovers']['action-a']),6)
                self.assertEqual(len(data['transparentCovers']['action-b']),6)
                self.assertEqual(list(path.parent.glob('*.tmp')),[])
            finally:
                start.set()
                for worker in workers:
                    if worker.is_alive():worker.terminate()
                    worker.join(5)
                ready.close();result.close()

    def test_conflicting_keys_do_not_change_manifest_and_identical_merge_is_safe(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'derivatives.json'
            item={'actionId':'a','skin':'s','theme':'dark','video':{'sha256':'original'}}
            covers={'a':{'s':{'sha256':'original'}}}
            c.merge_derivative_manifest(path,[item],covers)
            original=path.read_bytes()
            c.merge_derivative_manifest(path,[item],covers)
            self.assertEqual(path.read_bytes(),original)
            with self.assertRaises(FileExistsError):
                c.merge_derivative_manifest(path,[{**item,'video':{'sha256':'different'}}],{})
            self.assertEqual(path.read_bytes(),original)
            with self.assertRaises(FileExistsError):
                c.merge_derivative_manifest(path,[],{'a':{'s':{'sha256':'different'}}})
            self.assertEqual(path.read_bytes(),original)

    def test_lock_timeout_and_exception_release(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'derivatives.json'
            ctx=multiprocessing.get_context('spawn');entered,release=ctx.Event(),ctx.Event()
            worker=ctx.Process(target=hold_lock_worker,args=(str(path),entered,release))
            worker.start()
            try:
                self.assertTrue(entered.wait(15))
                with self.assertRaises(TimeoutError):
                    c.merge_derivative_manifest(path,[],{},timeout=.1)
            finally:
                release.set();worker.join(15)
                if worker.is_alive():worker.terminate();worker.join(5)
            self.assertEqual(worker.exitcode,0)
            with self.assertRaisesRegex(RuntimeError,'deliberate'):
                with c.manifest_lock(path,timeout=.1):raise RuntimeError('deliberate')
            c.merge_derivative_manifest(path,[],{},timeout=.1)

    def test_failed_atomic_replace_preserves_manifest_and_releases_lock(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'derivatives.json'
            c.merge_derivative_manifest(path,[],{})
            original=path.read_bytes()
            item={'actionId':'a','skin':'s','theme':'dark'}
            with patch.object(c.os,'replace',side_effect=OSError('deliberate write failure')):
                with self.assertRaises(OSError):c.merge_derivative_manifest(path,[item],{})
            self.assertEqual(path.read_bytes(),original)
            self.assertEqual(list(path.parent.glob('*.tmp')),[])
            self.assertEqual(len(c.merge_derivative_manifest(path,[item],{},timeout=.1)['variants']),1)

    def test_worker_and_final_mosaic_modes_are_separate(self):
        with patch.object(c,'make_derivatives') as derivatives,patch.object(c,'make_mosaic') as mosaic:
            with patch.object(sys,'argv',['composite.py','--root','unused','--skip-mosaic']):c.main()
            derivatives.assert_called_once();mosaic.assert_not_called()
        with patch.object(c,'make_derivatives') as derivatives,patch.object(c,'make_mosaic') as mosaic:
            with patch.object(sys,'argv',['composite.py','--root','unused','--mosaic-only']),patch('builtins.print'):c.main()
            derivatives.assert_not_called();mosaic.assert_called_once()

    def test_conflicting_mosaic_modes_are_rejected_before_work(self):
        for flags in [['--skip-mosaic','--mosaic-only'],['--preview','--skip-mosaic'],['--preview','--mosaic-only']]:
            with patch.object(c,'make_derivatives') as derivatives,patch.object(c,'make_mosaic') as mosaic:
                with patch.object(sys,'argv',['composite.py','--root','unused',*flags]),patch.object(sys,'stderr',io.StringIO()),self.assertRaises(SystemExit) as error:c.main()
                self.assertEqual(error.exception.code,2)
                derivatives.assert_not_called();mosaic.assert_not_called()


if __name__=='__main__':unittest.main()
