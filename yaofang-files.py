# -*- coding: utf-8 -*-
import os
import shutil
import json
import argparse

def copy_file(src, dest):
    try: os.makedirs(os.path.dirname(dest))
    except FileExistsError: pass
    shutil.copy2(src, dest)

def copy_yaofang_files(yaofang):
    with open('extension/manifest.json') as manifest_file:  
        manifest = json.load(manifest_file)
    
    prefix = 'yaofang/'
    
    scripts = [script[len(prefix):] for script in sum(
        [manifest['background']['scripts']] +
        [content_script['js'] for content_script in manifest['content_scripts']],
        []
    ) if script.startswith(prefix)]
    
    for script in scripts:
        src = os.path.join(yaofang, './extension/', script)
        dest = os.path.abspath(os.path.join('./extension/yaofang/', script))
        copy_file(src, dest)

    license_file = './LICENSE'
    license_src = os.path.join(yaofang, license_file)
    license_dest = os.path.abspath(os.path.join('./extension/yaofang', license_file))

parser = argparse.ArgumentParser(description='A helper tool that copy files from yaofang to this project')
yaofang = None
parser.add_argument(
    '--yaofang',
    default='../yaofang',
    help='path to yaofang repo, a extension folder should be there (default: "../yaofang")'
)
copy_yaofang_files(vars(parser.parse_args())['yaofang'])

