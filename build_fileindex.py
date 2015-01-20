#!/usr/bin/env python3

import os
import os.path
import sys

MAX_FILES = 1000

def get_gpx_files(path):
    files = []
    for dirname, dirnames, filenames in os.walk(path):
        files += [os.path.join(dirname, f) for f in filenames if f.endswith(".gpx")]
        if len(files) > MAX_FILES:
            break
    return files[:MAX_FILES]

if len(sys.argv) < 3:
    print("./build_fileindex.py DIRECTORY OUTFILE")
input_directory = sys.argv[1]
output_file = sys.argv[2]

with open(output_file, "w+") as f:
    f.write("var gpx_files = " + str(get_gpx_files(input_directory)) + ";")

