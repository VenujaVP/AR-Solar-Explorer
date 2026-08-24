import os

root = os.path.dirname(os.path.abspath(__file__))

for folder, subfolders, files in os.walk(root):
    subfolders[:] = [x for x in subfolders if not x.startswith(".")]
    files = [x for x in files if not x.startswith(".") and x != os.path.basename(__file__)]

    level = folder.replace(root, "").count(os.sep)
    print("  " * level + os.path.basename(folder) + "/")

    for file in files:
        print("  " * (level + 1) + file)