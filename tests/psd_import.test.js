// Run after: node node_modules/typescript/bin/tsc -p . --outFile build/app.js
// Photoshop document operations are mocked; no Photoshop installation is required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

let code = fs.readFileSync('build/app.js', 'utf8')
    .replace('function closeImage(', `LabelPlus.testWorkspace = {
        setOptions: function (value) { opts = value; },
        open: openImageWorkspace, importImage: importImage,
        applyResolution: applyOutputResolution
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
    Emit: handler => { if (handler) handler(); },
    alert: () => {},
    ResampleMethod: { NONE: 'no-resample' },
    AntiAlias: { NONE: 'none', SHARP: 'sharp', CRISP: 'crisp', STRONG: 'strong', SMOOTH: 'smooth' },
});
vm.runInContext(code, context);
const lp = context.LabelPlus;
const api = lp.testWorkspace;

function document(includeOriginals = true) {
    const doc = { layers: [], width: unit(1000), height: unit(2000), resolution: 300 };
    doc.resizeCalls = [];
    doc.resizeImage = (width, height, resolution, method) => {
        assert.equal(width, undefined);
        assert.equal(height, undefined);
        assert.equal(method, 'no-resample');
        doc.resizeCalls.push(resolution);
        doc.resolution = resolution;
    };
    doc.close = () => { doc.closed = true; };
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
        (group ? doc.layerSets : doc.artLayers).push(layer);
        return layer;
    }
    doc.artLayers = [];
    doc.artLayers.add = () => add('new text');
    doc.artLayers.getByName = name => {
        const result = doc.artLayers.find(layer => layer.name === name);
        if (!result) throw new Error('Missing layer');
        return result;
    };
    doc.layerSets = [];
    doc.layerSets.add = () => add('new group', true);
    doc.selection = { selectAll() {}, copy() {} };
    doc.paste = () => {};
    // Includes an existing empty group and reserved names: none should be removed.
    if (includeOriginals) {
        add('background'); add('bg'); add('overlay-manual'); add('original empty group', true);
    } else {
        doc.activeLayer = add('initial');
    }
    return doc;
}
let copy;
let closed;
let duplicated;
const source = {
    resolution: 300,
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
    assert.equal(copy.resolution, 72);
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

assert.equal(new lp.CustomOptions().ppi, 72);
for (const ppi of [72, 144, 300, 0, -300, undefined]) {
    const opts = Object.assign(options(), { ppi });
    api.setOptions(opts);
    const ws = api.open('001.psd', '');
    assert.equal(ws.doc.resolution, ppi === undefined ? 72 : ppi > 0 ? ppi : 300);
    assert.equal(ws.doc.width.as('px'), 1000);
    assert.equal(ws.doc.height.as('px'), 2000);
}
assert.equal(source.resolution, 300, 'Only the PSD copy is resized');

// The original image/overlay pipeline uses the same PPI control, without forcing source PPI.
for (const ppi of [72, 144, 0, -300]) {
    const image = document(false);
    const overlay = document(false);
    overlay.resolution = 600;
    let workspace;
    context.app.documents = [];
    context.app.documents.add = (width, height, resolution) => {
        workspace = document(false);
        workspace.resolution = resolution;
        return workspace;
    };
    context.app.open = file => file.fsName.includes('inpainted') ? overlay : image;
    context.NewDocumentMode = { RGB: 'rgb' };
    context.DocumentFill = { TRANSPARENT: 'transparent' };
    context.DocumentMode = { INDEXEDCOLOR: 'indexed' };
    const oldFile = context.File;
    context.File = function (path) { this.fsName = path; this.exists = true; };
    api.setOptions(Object.assign(options(), { psdSource: '', source: 'images', overlayManualSource: 'inpainted', ppi }));
    const ws = api.open('001.png', '');
    assert.equal(ws.doc.resolution, ppi > 0 ? ppi : 300);
    assert.equal(image.resizeCalls.length, 0, 'No forced resolution on the original image');
    assert.deepEqual(overlay.resizeCalls, [300], 'Match clipboard resolution before compositing');
    assert.ok(ws.bgLayer);
    assert.ok(ws.overlayManualLayer);
    context.File = oldFile;
}

// All anti-alias choices apply to new text in either mode; disabled settings remain unset.
for (const psdMode of [false, true]) {
    for (const [antiAlias, expected] of [[0, undefined], [-5, undefined], [1, 'none'], [2, 'sharp'], [3, 'crisp'], [4, 'strong'], [5, 'smooth']]) {
        const opts = Object.assign(options(true), { antiAlias, psdSource: psdMode ? 'psd' : '' });
        api.setOptions(opts);
        const doc = document();
        const ws = { doc, groups: { translation: {} }, pendingDelLayerList: [] };
        assert.equal(api.importImage({ ws, labels }), true);
        const text = doc.layers.find(layer => layer.name === '譯文');
        assert.equal(text.textItem.antiAliasMethod, expected);
        for (const original of doc.layers.filter(layer => layer !== text)) {
            assert.equal(original.textItem.antiAliasMethod, undefined);
        }
    }
}

api.setOptions(Object.assign(options(), { ppi: 72.5 }));
const invalidDoc = document();
assert.equal(api.applyResolution(invalidDoc), false);
assert.equal(invalidDoc.closed, true, 'A failed working copy is closed');

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
// Verify control defaults and settings round-trips, including old settings without the fields.
function panel() {
    const control = { children: [], items: [], text: '', value: false, enabled: true };
    let selection;
    Object.defineProperty(control, 'selection', {
        get: () => selection,
        set: value => { selection = typeof value === 'number' ? control.items[value] : value; },
    });
    control.find = text => control.items.find(item => item.text === text);
    control.add = (type, bounds, text) => {
        if (type === 'item') {
            const item = { text: bounds, index: control.items.length };
            control.items.push(item);
            return item;
        }
        const child = panel();
        child.bounds = bounds;
        if (Array.isArray(text)) text.forEach(label => child.add('item', label));
        else if (typeof text === 'string') child.text = text;
        control.children.push(child);
        return child;
    };
    return control;
}
const settingsUi = new lp.TestInput();
delete settingsUi.opts.ppi;
delete settingsUi.opts.antiAlias;
settingsUi.createFontPanel = font => {
    font.label = {};
    font.family = panel();
    font.style = {};
    font.fontSize = {};
};
const outputPanel = panel();
const stylePanel = panel();
const outputPicker = settingsUi.uiOutputPanel(outputPanel).getOption;
const stylePicker = settingsUi.uiStylePanel(stylePanel).getOption;
assert.equal(outputPanel.setPPICheckBox.value, true);
assert.equal(outputPanel.ppiTextBox.text, '72');
assert.equal(stylePanel.setAntiAliasCheckBox.value, false);
assert.equal(stylePanel.antiAliasList.selection.index, 4);
outputPanel.ppiTextBox.text = '144';
stylePanel.setAntiAliasCheckBox.value = true;
stylePanel.antiAliasList.selection = 2;
const saved = new lp.CustomOptions();
outputPicker(saved, true);
stylePicker(saved);
assert.equal(saved.ppi, 144);
assert.equal(saved.antiAlias, 3);
outputPanel.setPPICheckBox.value = false;
stylePanel.setAntiAliasCheckBox.value = false;
outputPicker(saved, true);
stylePicker(saved);
assert.equal(saved.ppi, -144);
assert.equal(saved.antiAlias, -3);
settingsUi.opts = JSON.parse(JSON.stringify(saved));
const restoredOutput = panel();
const restoredStyle = panel();
settingsUi.uiOutputPanel(restoredOutput);
settingsUi.uiStylePanel(restoredStyle);
assert.equal(restoredOutput.setPPICheckBox.value, false);
assert.equal(restoredOutput.ppiTextBox.text, '144');
assert.equal(restoredStyle.setAntiAliasCheckBox.value, false);
assert.equal(restoredStyle.antiAliasList.selection.index, 2);
outputPanel.setPPICheckBox.value = true;
outputPanel.ppiTextBox.text = '72.5';
assert.equal(outputPicker(saved, true), null);
assert.ok(outputPanel.children.every(child => child.bounds[3] <= 191));
assert.ok(stylePanel.children.every(child => child.bounds[3] <= 243));

console.log('Import checks passed: PSD and image/overlay modes, PPI controls, anti-alias choices, saved settings, and UI bounds.');
