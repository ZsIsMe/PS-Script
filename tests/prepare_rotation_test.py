"""Prepare an opt-in Photoshop test bundle; does not launch Photoshop."""
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parent.parent
app = (root / 'build/app.js').read_text(encoding='utf-8')
needle = 'function closeImage('
assert app.count(needle) == 1
app = app.replace(needle, '''LabelPlus.rotationTest = {
    setOptions: function(value) { opts = value; }, importImage: importImage
};
function closeImage(''')
assert app.count('var ui = new LabelPlusInput();') == 1
app = app.replace('var ui = new LabelPlusInput();', '').replace('ui.exec();', '')
target = root / 'build/rotation-test.jsx'
target.write_text((root / 'src/copyleft_header.js').read_text(encoding='utf-8') + app +
                  (root / 'tests/rotation_center.photoshop.jsx').read_text(encoding='utf-8'), encoding='utf-8')
subprocess.run([sys.executable, str(root / 'flatten_jsx.py'), str(target), str(target), '-I',
                str(root / 'build'), str(root / 'src')], check=True, cwd=root)
print(target)
