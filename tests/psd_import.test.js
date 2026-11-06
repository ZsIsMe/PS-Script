// Run after: node node_modules/typescript/bin/tsc -p . --outFile build/app.js
// Photoshop document operations are mocked; no Photoshop installation is required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

let code = fs.readFileSync('build/app.js', 'utf8')
    .replace('function closeImage(', `LabelPlus.testWorkspace = {
        setOptions: function (value) { opts = value; },
        open: openImageWorkspace, importImage: importImage
    };\n    function closeImage(`)
    .replace('var ui = new LabelPlusInput();', 'LabelPlus.TestInput = LabelPlusInput;')
    .replace('ui.exec();', '');
const log = () => {};
log.setFile = () => {};
function File(path) { this.fsName = path; this.exists = false; }
function Folder(path) { this.fsName = path; this.exists = true; }
Folder.appData = { fsName: '/data' };
const unit = value => ({ value, as: () => value });
const context = vm.createContext({
    app: { locale: 'zh_CN', documents: [], open() { return source; } },
    $: { os: 'Windows' }, File, Folder,
    GenericUI: function () {}, Stdlib: { log }, UnitValue: unit,
    ElementPlacement: { PLACEBEFORE: 'before', PLACEATBEGINNING: 'inside' },
    SaveOptions: { DONOTSAVECHANGES: 'discard' },
    BlendMode: { NORMAL: 'normal' }, LayerKind: { TEXT: 'text' },
    Direction: { HORIZONTAL: 'horizontal', VERTICAL: 'vertical' },
});
vm.runInContext(code, context);
const lp = context.LabelPlus;
const api = lp.testWorkspace;

function document() {
    const doc = { layers: [], width: unit(1000), height: unit(2000), resolution: 300 };
    function add(name, group = false) {
        const layer = {
            name, parent: doc, textItem: {}, artLayers: [], layers: [],
            move(target, placement) {
                const old = this.parent.layers;
                old.splice(old.indexOf(this), 1);
                this.parent = placement === 'inside' ? target : target.parent;
                const dest = this.parent.layers;
                dest.splice(placement === 'inside' ? 0 : dest.indexOf(target), 0, this);
                if (placement === 'inside') target.artLayers.push(this);
            },
            remove() { this.parent.layers.splice(this.parent.layers.indexOf(this), 1); },
        };
        doc.layers.unshift(layer);
        return layer;
    }
    doc.artLayers = { add: () => add('new text') };
    doc.layerSets = { add: () => add('new group', true) };
    // Includes an existing empty group and reserved names: none should be removed.
    add('background'); add('bg'); add('overlay-manual'); add('original empty group', true);
    return doc;
}
let copy;
let closed;
let duplicated;
const source = {
    fullName: { fsName: 'C:\\psd\\001.psd' },
    duplicate(name, merged) {
        duplicated = [name, merged];
        copy = document();
        return copy;
    },
    close(mode) { closed = mode; },
};

function options(noLayerGroup = false) {
    return Object.assign(new lp.CustomOptions(), {
        psdSource: 'C:\\psd', target: 'C:\\output', docTemplate: lp.OptionDocTemplate.No,
        groupSelected: ['translation'], noLayerGroup, tsumeChars: '',
    });
}
const labels = [{ x: 0.25, y: 0.75, group: 'translation', contents: '譯文' }];
for (const noLayerGroup of [false, true]) {
    const opts = options(noLayerGroup);
    api.setOptions(opts);
    const ws = api.open('001.psd', 'missing-template.psd');
    const originalLayers = copy.layers.filter(l => l.name !== 'translation');
    assert.deepEqual(duplicated, ['001.psd', false]);
    assert.equal(closed, 'discard');
    assert.equal(copy.resolution, 300);
    assert.equal(ws.bgLayer, undefined);
    assert.equal(ws.overlayManualLayer, undefined);
    assert.equal(ws.pendingDelLayerList.length, 0);
    assert.equal(api.importImage({ ws, labels }), true);
    assert.equal(copy.layers[0].name, noLayerGroup ? '譯文' : 'translation');
    const text = noLayerGroup ? copy.layers[0] : copy.layers[0].layers[0];
    assert.equal(text.textItem.contents, '譯文');
    assert.equal(text.textItem.position[0].value, 250);
    assert.equal(text.textItem.position[1].value, 1500);
    assert.deepEqual(copy.layers.filter(l => originalLayers.includes(l)), originalLayers);
}

closed = undefined;
context.app.documents = [source];
api.setOptions(options());
api.open('001.psd', '');
assert.equal(closed, undefined, 'An already-open original must stay open');

assert.equal(lp.psdFilename('001.png'), '001.psd');
assert.equal(lp.psdFilename('page.001.jpg'), 'page.001.psd');
assert.equal(lp.psdFilename('001'), '001.psd');
assert.equal(lp.usesPsdSource({}), false, 'Old settings remain supported');
assert.equal(lp.usesPsdSource({ psdSource: '  ' }), false);

// Saved conflicting options cannot activate template/overlay processing in PSD mode.
const conflict = Object.assign(options(), {
    target: 'c:\\PSD', docTemplate: lp.OptionDocTemplate.Custom,
    overlayManualSource: 'missing', dialogOverlayLabelGroups: 'translation',
});
assert.equal(lp.importFiles(conflict), false, 'Reject overwriting original PSDs');
assert.equal(conflict.docTemplate, lp.OptionDocTemplate.No);
assert.equal(conflict.overlayManualSource, '');
assert.equal(conflict.dialogOverlayLabelGroups, '');

// Toggle the live controls back and forth, retaining the original settings.
const ui = new lp.TestInput();
const controls = ['sourceLabel', 'sourceTextBox', 'sourceBrowse',
    'overlayManualSourceLabel', 'overlayManualSourceTextBox', 'overlayManualSourceBrowse',
    'matchImgByOrderCheckBox', 'replaceImgSuffixCheckBox', 'replaceImgSuffixTextbox', 'setSourceFileTypeList'];
ui.inputPnl = { psdSourceTextBox: { text: 'C:\\psd' } };
for (const key of controls) ui.inputPnl[key] = { value: true };
ui.stylePnl = { docTemplatePnl: {} };
ui.automationPnl = { dialogOverlayCheckBox: { value: true }, overlayPnl: {} };
ui.updateImportMode();
for (const key of controls) assert.equal(ui.inputPnl[key].enabled, false, key);
assert.equal(ui.stylePnl.docTemplatePnl.enabled, false);
assert.equal(ui.automationPnl.overlayPnl.enabled, false);
ui.inputPnl.psdSourceTextBox.text = '';
ui.updateImportMode();
for (const key of controls) assert.equal(ui.inputPnl[key].enabled, true, key);
assert.equal(ui.stylePnl.docTemplatePnl.enabled, true);
assert.equal(ui.automationPnl.overlayPnl.enabled, true);

ui.inputPnl.psdSourceTextBox.text = 'C:\\psd';
ui.inputPnl.chooseImageListBox = { children: [{ text: '001.png', selected: true }] };
assert.equal(ui.getMatchedFileList()[0].matched_file, '001.psd');
console.log('PSD import checks passed (document copy, layers, text placement, mode exclusion, matching, original protection).');
