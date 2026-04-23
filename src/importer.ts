/// <reference path="legacy.d.ts" />
/// <reference path="custom_options.ts" />
/// <reference path="common.ts" />
/// <reference path="text_parser.ts" />
/// <reference path="dialog_clear.ts" />

namespace LabelPlus {

// global var
let opts: CustomOptions | null = null;
let textReplace: TextReplaceInfo = [];

interface Group {
    layerSet?: LayerSet;
    template?: ArtLayer;
};
type GroupDict = { [key: string]: Group };

interface LabelInfo {
    index: number;
    x: number;
    y: number;
    group: string;
    contents: string;
    fontSize?: number;
    orientation?: string;
    font?: string;
    fontStyle?: string;
    color?: string;
    strokeColor?: string;
    strokeWeight?: number;
    rotation?: number;
};

interface ImageWorkspace {
    doc: Document;

    bgLayer: ArtLayer;
    textTemplateLayer: ArtLayer;
    dialogOverlayLayer: ArtLayer;
    overlayManualLayer: ArtLayer;

    pendingDelLayerList: ArtLayer[];
    groups: GroupDict;
};

interface ImageInfo {
    ws: ImageWorkspace;
    name: string;
    name_pair: string;
    labels: LpLabel[];
};

function importLabel(img: ImageInfo, label: LabelInfo): boolean
{
    assert(opts !== null);

    // import the index of the Label
    if (opts.outputLabelIndex) {
        let o: TextInputOptions = {
            template: img.ws.textTemplateLayer,
            direction: Direction.HORIZONTAL,
            font: "Arial",
            size: (opts.fontSize !== 0) ? UnitValue(opts.fontSize, "pt") : undefined,
            lgroup: img.ws.groups["_Label"].layerSet,
        };
        newTextLayer(img.ws.doc, String(label.index), label.x, label.y, o);
    }

    // 替换文本
    if (opts.textReplace) {
        for (let k = 0; k < textReplace.length; k++) {
            while (label.contents.indexOf(textReplace[k].from) != -1)
                label.contents = label.contents.replace(textReplace[k].from, textReplace[k].to);
        }
    }

    // 确定文字方向
    let textDir: Direction | undefined;
    
    // 如果標籤提供了方向，且用戶啟用了該選項，則優先使用
    if (opts.useMeoFontSize && label.orientation) {
        if (label.orientation === "horizontal") {
            textDir = Direction.HORIZONTAL;
        } else if (label.orientation === "vertical") {
            textDir = Direction.VERTICAL;
        } else {
            // 如果方向值無效，使用全域設定
            switch (opts.textDirection) {
            case OptionTextDirection.Keep:       textDir = undefined; break;
            case OptionTextDirection.Horizontal: textDir = Direction.HORIZONTAL; break;
            case OptionTextDirection.Vertical:   textDir = Direction.VERTICAL; break;
            }
        }
    } else {
        // 使用全域設定
        switch (opts.textDirection) {
        case OptionTextDirection.Keep:       textDir = undefined; break;
        case OptionTextDirection.Horizontal: textDir = Direction.HORIZONTAL; break;
        case OptionTextDirection.Vertical:   textDir = Direction.VERTICAL; break;
        }
    }

    // 导出文本，设置的优先级大于模板，无模板时做部分额外处理
    let textLayer: ArtLayer;
    let o: TextInputOptions = {
        template: img.ws.groups[label.group].template,
        font: (opts.font != "") ? opts.font : undefined,
        direction: textDir,
        lgroup: img.ws.groups[label.group].layerSet,
        lending: opts.textLeading ? opts.textLeading : undefined,
    };

    // 如果標籤提供了字體大小，且用戶啟用了該選項，則優先使用
    if (opts.useMeoFontSize && label.fontSize && label.fontSize > 0) {
        o.size = UnitValue(label.fontSize, "pt");
    } else {
        // 否則，使用現有的邏輯
        if (opts.docTemplate === OptionDocTemplate.No) {
            let proper_size = UnitValue(min(img.ws.doc.height.as("pt"), img.ws.doc.height.as("pt")) / 90.0, "pt");
            o.size = (opts.fontSize !== 0) ? UnitValue(opts.fontSize, "pt") : proper_size;
        } else {
            o.size = (opts.fontSize !== 0) ? UnitValue(opts.fontSize, "pt") : undefined;
        }
    }

    // 啟用 Meo 樣式時，套用標籤級的字體 / 風格 / 顏色 / 描邊（優先於模板）
    if (opts.useMeoFontSize) {
        if (label.font) {
            o.font = label.font; // 直接使用 PostScript name
        }
        if (label.fontStyle) {
            o.fontStyle = label.fontStyle;
        }
        if (label.color) {
            o.color = label.color;
        }
        if (label.strokeColor && label.strokeWeight && label.strokeWeight > 0) {
            o.strokeColor = label.strokeColor;
            o.strokeWeight = label.strokeWeight;
        }
        if (typeof label.rotation === "number" && !isNaN(label.rotation)) {
            o.rotation = label.rotation;
        }
    }

    textLayer = newTextLayer(img.ws.doc, label.contents, label.x, label.y, o);

    // 执行动作,名称为分组名
    if (opts.actionGroup) {
        img.ws.doc.activeLayer = textLayer;
        let result = doAction(label.group, opts.actionGroup);
        log("run action " + label.group + "[" + opts.actionGroup + "]..." + result ? "done" : "fail");
    }

    // Center the layer after the action has been applied, so the bounds are correct
    if (opts.centerAlign) {
        var ru = app.preferences.rulerUnits;
        app.preferences.rulerUnits = Units.PIXELS;
        try {
            var bounds = textLayer.bounds;
            var layerWidth = bounds[2].as('px') - bounds[0].as('px');
            var layerHeight = bounds[3].as('px') - bounds[1].as('px');
            
            // Calculate the target center position in absolute coordinates
            var targetCenterX = img.ws.doc.width.as("px") * label.x;
            var targetCenterY = img.ws.doc.height.as("px") * label.y;
            
            // Calculate current center position
            var currentCenterX = bounds[0].as('px') + layerWidth / 2;
            var currentCenterY = bounds[1].as('px') + layerHeight / 2;
            
            // Calculate the offset needed to move current center to target center
            var deltaX = targetCenterX - currentCenterX;
            var deltaY = targetCenterY - currentCenterY;
            
            textLayer.translate(UnitValue(deltaX, 'px'), UnitValue(deltaY, 'px'));
        }
        finally {
            app.preferences.rulerUnits = ru;
        }
    }
    
    return true;
}

function importImage(img: ImageInfo): boolean
{
    assert(opts !== null);

    // run action _start
    if (opts.actionGroup) {
        img.ws.doc.activeLayer = img.ws.doc.layers[img.ws.doc.layers.length - 1];
        let result = doAction("_start", opts.actionGroup);
        log("run action _start[" + opts.actionGroup + "]..." + result ? "done" : "fail");
    }

    // 找出需要涂白的标签,记录他们的坐标,执行涂白
    if (opts.dialogOverlayLabelGroups) {
        let points = new Array();
        let groups = opts.dialogOverlayLabelGroups.split(",");
        for (let j = 0; j < img.labels.length; j++) {
            let l = img.labels[j];
            if (groups.indexOf(l.group) >= 0) {
                points.push({ x: l.x, y: l.y });
            }
        }

        let contract = UnitValue(2, 'pt');
        let tolerance = opts.dialogOverlayTolerance;
        log("dialogClear() ,contract_px=" + contract + ",tolerance=" + tolerance);
        dialogClear(img.ws.doc, img.ws.bgLayer, img.ws.dialogOverlayLayer, points, tolerance, contract);
        delArrayElement<ArtLayer>(img.ws.pendingDelLayerList, img.ws.dialogOverlayLayer); // do not delete dialog-overlay-layer
    }

    // 遍历LabelData
    for (let j = 0; j < img.labels.length; j++) {
        let l = img.labels[j];
        if (opts.groupSelected.indexOf(l.group) == -1) // the group did not select by user, return directly
            continue;

        let label_info: LabelInfo = {
            index: j + 1,
            x: l.x,
            y: l.y,
            group: l.group,
            contents: l.contents,
            fontSize: l.fontSize,
            orientation: l.orientation,
            font: l.font,
            fontStyle: l.fontStyle,
            color: l.color,
            strokeColor: l.strokeColor,
            strokeWeight: l.strokeWeight,
            rotation: l.rotation
        };
        log("import label " + label_info.index + "...");
        importLabel(img, label_info);
    }

    // adjust layer order
    if (img.ws.bgLayer) {
        // move overlay-manual before bg
        log('move "overlay-manual" before "bg"');
        img.ws.overlayManualLayer.move(img.ws.bgLayer, ElementPlacement.PLACEBEFORE);
        
        if (opts.dialogOverlayLabelGroups !== "") {
            log('move "dialog-overlay" before "overlay-manual"');
            img.ws.dialogOverlayLayer.move(img.ws.overlayManualLayer, ElementPlacement.PLACEBEFORE);
        }
    }

    // remove unnecessary Layer/LayerSet
    log('remove unnecessary Layer/LayerSet...');
    for (var layer of img.ws.pendingDelLayerList) { // Layer
        try {
            // 檢查圖層是否仍然有效（通過訪問其屬性）
            let layerName = layer.name; // 如果圖層無效，這裡會拋出異常
            layer.remove();
            log("removed layer: " + layerName);
        } catch (e) {
            log("layer already removed or invalid: " + e.toString());
        }
    }
    for (let k in img.ws.groups) { // LayerSet
        if (img.ws.groups[k].layerSet !== undefined) {
            if (img.ws.groups[k].layerSet?.artLayers.length === 0) {
                img.ws.groups[k].layerSet?.remove();
            }
        }
    }

    // run action _end
    if (opts.actionGroup) {
        img.ws.doc.activeLayer = img.ws.doc.layers[img.ws.doc.layers.length - 1];
        let result = doAction("_end", opts.actionGroup);
        log("run action _end[" + opts.actionGroup + "]..." + result ? "done" : "fail");
    }
    return true;
}

// 在涂白文件夾中尋找匹配的圖片文件（支援不同後綴名）
function findOverlayManualFile(overlayManualSource: string, originalFilename: string): File | null
{
    // 先嘗試精確匹配（包含後綴）
    let exactMatchFile = new File(overlayManualSource + dirSeparator + originalFilename);
    if (exactMatchFile.exists) {
        return exactMatchFile;
    }
    
    // 如果精確匹配失敗，嘗試匹配不同後綴的文件
    let nameWithoutExt = originalFilename.substring(0, originalFilename.lastIndexOf("."));
    if (nameWithoutExt === "") {
        nameWithoutExt = originalFilename; // 如果沒有後綴，使用原始文件名
    }
    
    // 遍歷支援的圖片格式
    for (let i = 0; i < image_suffix_list.length; i++) {
        let suffix = image_suffix_list[i];
        let candidateFile = new File(overlayManualSource + dirSeparator + nameWithoutExt + suffix);
        if (candidateFile.exists) {
            log("found overlay-manual file with different extension: " + candidateFile.fsName + " (original: " + originalFilename + ")");
            return candidateFile;
        }
    }
    
    return null; // 找不到匹配的文件
}

function openImageWorkspace(img_filename: string, template_path: string): ImageWorkspace | null
{
    assert(opts !== null);

    // open background image
    let bgDoc: Document;
    try {
        let bgFile = new File(opts.source + dirSeparator + img_filename);
        bgDoc = app.open(bgFile);
    } catch {
        return null; //note: do not exit if image not exist
    }

    // if template is enabled, open template; or create a new file
    let wsDoc: Document; // workspace document
    if (opts.docTemplate == OptionDocTemplate.No) {
        wsDoc = app.documents.add(bgDoc.width, bgDoc.height, bgDoc.resolution, bgDoc.name, NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
        wsDoc.activeLayer.name = TEMPLATE_LAYER.IMAGE;
    } else {
        let docFile = new File(template_path);  //note: if template must do not exist, crash
        wsDoc = app.open(docFile);
        wsDoc.resizeImage(undefined, undefined, bgDoc.resolution);
        wsDoc.resizeCanvas(bgDoc.width, bgDoc.height);
    }

    // wsDoc is clean, check template elements, if a element not exist
    let bgLayer: ArtLayer;
    let textTemplateLayer: ArtLayer;
    let dialogOverlayLayer: ArtLayer;
    let overlayManualLayer: ArtLayer;
    let pendingDelLayerList: ArtLayer[] = new Array();
    {
        // add all artlayers to the pending delete list
        for (let i = 0; i < wsDoc.artLayers.length; i++) {
            let layer: ArtLayer = wsDoc.artLayers[i];
            pendingDelLayerList.push(layer);
        }

        // bg layer template
        try { bgLayer = wsDoc.artLayers.getByName(TEMPLATE_LAYER.IMAGE); }
        catch {
            bgLayer = wsDoc.artLayers.add();
            bgLayer.name = TEMPLATE_LAYER.IMAGE;
        }
        // text layer template
        try { textTemplateLayer = wsDoc.artLayers.getByName(TEMPLATE_LAYER.TEXT); }
        catch {
            textTemplateLayer = wsDoc.artLayers.add();
            textTemplateLayer.name = TEMPLATE_LAYER.TEXT;
            pendingDelLayerList.push(textTemplateLayer); // pending delete
        }
        // dialog overlay layer template
        try { dialogOverlayLayer = wsDoc.artLayers.getByName(TEMPLATE_LAYER.DIALOG_OVERLAY); }
        catch {
            dialogOverlayLayer = wsDoc.artLayers.add();
            dialogOverlayLayer.name = TEMPLATE_LAYER.DIALOG_OVERLAY;
        }
        // 如果用戶沒有啟用對話框涂白功能，將此圖層加入待刪除列表
        if (!opts.dialogOverlayLabelGroups || opts.dialogOverlayLabelGroups === "") {
            pendingDelLayerList.push(dialogOverlayLayer); // 加入待刪除列表
        }
        // overlay manual layer template
        try { overlayManualLayer = wsDoc.artLayers.getByName(TEMPLATE_LAYER.OVERLAY_MANUAL); }
        catch {
            overlayManualLayer = wsDoc.artLayers.add();
            overlayManualLayer.name = TEMPLATE_LAYER.OVERLAY_MANUAL;
        }
    }

    // import bgDoc to wsDoc:
    // if bgDoc has only a layer, select all and copy to bg layer, for applying bg layer template
    // if bgDoc has multiple layers, move all layers after bg layer (bg layer template is invalid)
    if ((bgDoc.artLayers.length == 1) && (bgDoc.layerSets.length == 0)) {
        app.activeDocument = bgDoc;
        bgDoc.selection.selectAll();
        bgDoc.selection.copy();
        app.activeDocument = wsDoc;
        wsDoc.activeLayer = bgLayer;
        wsDoc.paste();
        delArrayElement<ArtLayer>(pendingDelLayerList, bgLayer); // keep bg layer
        
        // import overlay-manual layer from manual source folder or copy from bg layer
        if (opts.overlayManualSource !== "") {
            // try to load image from overlay manual source folder
            try {
                let overlayManualFile = findOverlayManualFile(opts.overlayManualSource, img_filename);
                if (overlayManualFile !== null) {
                    let overlayManualDoc = app.open(overlayManualFile);
                    app.activeDocument = overlayManualDoc;
                    overlayManualDoc.selection.selectAll();
                    overlayManualDoc.selection.copy();
                    overlayManualDoc.close(SaveOptions.DONOTSAVECHANGES);
                    
                    app.activeDocument = wsDoc;
                    wsDoc.activeLayer = overlayManualLayer;
                    wsDoc.paste();
                    log("loaded overlay-manual from: " + overlayManualFile.fsName);
                } else {
                    // fallback: copy bg layer content to overlay-manual layer
                    log("overlay-manual file not found, fallback to copy bg layer (searched for: " + img_filename + ")");
                    wsDoc.activeLayer = bgLayer;
                    wsDoc.selection.selectAll();
                    wsDoc.selection.copy();
                    wsDoc.activeLayer = overlayManualLayer;
                    wsDoc.paste();
                }
            } catch (e) {
                log_err("failed to load overlay-manual image: " + e.toString() + ", fallback to copy bg layer");
                // fallback: copy bg layer content to overlay-manual layer
                wsDoc.activeLayer = bgLayer;
                wsDoc.selection.selectAll();
                wsDoc.selection.copy();
                wsDoc.activeLayer = overlayManualLayer;
                wsDoc.paste();
            }
        } else {
            // copy bg layer content to overlay-manual layer
            wsDoc.activeLayer = bgLayer;
            wsDoc.selection.selectAll();
            wsDoc.selection.copy();
            wsDoc.activeLayer = overlayManualLayer;
            wsDoc.paste();
        }
    } else {
        app.activeDocument = bgDoc;
        let item = bgLayer;
        for (let i = 0; i < bgDoc.layers.length; i++) {
            item = bgDoc.layers[i].duplicate(item, ElementPlacement.PLACEAFTER);
        }
        
        // import overlay-manual layer from manual source folder or copy from bg layer
        app.activeDocument = wsDoc;
        if (opts.overlayManualSource !== "") {
            // try to load image from overlay manual source folder
            try {
                let overlayManualFile = findOverlayManualFile(opts.overlayManualSource, img_filename);
                if (overlayManualFile !== null) {
                    let overlayManualDoc = app.open(overlayManualFile);
                    app.activeDocument = overlayManualDoc;
                    overlayManualDoc.selection.selectAll();
                    overlayManualDoc.selection.copy();
                    overlayManualDoc.close(SaveOptions.DONOTSAVECHANGES);
                    
                    app.activeDocument = wsDoc;
                    wsDoc.activeLayer = overlayManualLayer;
                    wsDoc.paste();
                    log("loaded overlay-manual from: " + overlayManualFile.fsName);
                } else {
                    // fallback: copy bg layer content to overlay-manual layer
                    log("overlay-manual file not found, fallback to copy bg layer (searched for: " + img_filename + ")");
                    wsDoc.activeLayer = bgLayer;
                    wsDoc.selection.selectAll();
                    wsDoc.selection.copy();
                    wsDoc.activeLayer = overlayManualLayer;
                    wsDoc.paste();
                }
            } catch (e) {
                log_err("failed to load overlay-manual image: " + e.toString() + ", fallback to copy bg layer");
                // fallback: copy bg layer content to overlay-manual layer
                wsDoc.activeLayer = bgLayer;
                wsDoc.selection.selectAll();
                wsDoc.selection.copy();
                wsDoc.activeLayer = overlayManualLayer;
                wsDoc.paste();
            }
        } else {
            // copy bg layer content to overlay-manual layer  
            wsDoc.activeLayer = bgLayer;
            wsDoc.selection.selectAll();
            wsDoc.selection.copy();
            wsDoc.activeLayer = overlayManualLayer;
            wsDoc.paste();
        }
    }
    bgDoc.close(SaveOptions.DONOTSAVECHANGES);

    // 若文档类型为索引色模式 更改为RGB模式
    if (wsDoc.mode == DocumentMode.INDEXEDCOLOR) {
        log("wsDoc.mode is INDEXEDCOLOR, set RGB");
        wsDoc.changeMode(ChangeMode.RGB);
    }

    // 分组
    let groups: GroupDict = {};
    for (let i = 0; i < opts.groupSelected.length; i++) {
        let name = opts.groupSelected[i];
        let tmp: Group = {};

        // 创建PS中图层分组
        if (!opts.noLayerGroup) {
            tmp.layerSet = wsDoc.layerSets.add();
            tmp.layerSet.name = name;
            tmp.layerSet.blendMode = BlendMode.NORMAL;
        }
        // 尝试寻找分组模板，找不到则使用默认文本模板
        if (opts.docTemplate !== OptionDocTemplate.No) {
            let l: ArtLayer | undefined;
            try {
                l = wsDoc.artLayers.getByName(name);
            } catch { };
            tmp.template = (l !== undefined) ? l : textTemplateLayer;
        }
        groups[name] = tmp; // add
    }
    if (opts.outputLabelIndex) {
        let tmp: Group = {};
        tmp.layerSet = wsDoc.layerSets.add();
        tmp.layerSet.name = "Label";
        groups["_Label"] = tmp;
    }

    let ws: ImageWorkspace = {
        doc: wsDoc,
        bgLayer: bgLayer,
        textTemplateLayer: textTemplateLayer,
        dialogOverlayLayer: dialogOverlayLayer,
        overlayManualLayer: overlayManualLayer,
        pendingDelLayerList: pendingDelLayerList,
        groups: groups,
    };
    return ws;
}

function closeImage(img: ImageInfo, saveType: OptionOutputType = OptionOutputType.PSD): boolean
{
    assert(opts !== null);

    // 保存文件
    let fileOut = new File(opts.target + dirSeparator + img.name);
    let asCopy = false;
    let options: any;
    switch (saveType) {
    case OptionOutputType.PSD:
        options = PhotoshopSaveOptions;
        break;
    case OptionOutputType.TIFF:
        options = TiffSaveOptions;
        break;
    case OptionOutputType.PNG:
        options = PNGSaveOptions;
        asCopy = true;
        break;
    case OptionOutputType.JPG:
        options = new JPEGSaveOptions();
        options.quality = 10;
        asCopy = true;
        break;
    default:
        log_err(img.name_pair + ": unkown save type " + saveType);
        return false
    }

    let extensionType = Extension.LOWERCASE;
    img.ws.doc.saveAs(fileOut, options, asCopy, extensionType);

    // 关闭文件
    if (!opts.notClose)
        img.ws.doc.close(SaveOptions.DONOTSAVECHANGES);

    return true;
}

export function importFiles(custom_opts: CustomOptions): boolean
{
    opts = custom_opts;

    log("Start import process!!!");
    log("Properties start ------------------");
    log(Stdlib.listProps(opts));
    log("Properties end   ------------------");

    //解析文本文件（支援LabelPlus和Meo格式）
    let lpFile: LpFile | null = null;
    let filePath = opts.lpTextFilePath;
    let fileExtension = filePath.substring(filePath.lastIndexOf("."), filePath.length).toLowerCase();
    
    // 根據文件名判斷是否為Meo格式
    let isMeoFormat = false;
    if (fileExtension === '.json') {
        // 簡單檢查：如果是JSON文件，嘗試讀取部分內容判斷格式
        try {
            let f = new File(filePath);
            if (f && f.exists) {
                f.open("r", "TEXT", "????");
                f.lineFeed = "unix";
                f.encoding = 'UTF-8';
                let content = f.read();
                f.close();
                
                // 如果包含transMap和groupList，判斷為Meo格式
                if (content.indexOf('"transMap"') !== -1 && content.indexOf('"groupList"') !== -1) {
                    isMeoFormat = true;
                }
            }
        } catch (e) {
            log("無法預檢查文件格式，使用默認解析器");
        }
    }
    
    // 選擇合適的解析器
    if (isMeoFormat) {
        lpFile = meoTextParser(filePath);
        if (lpFile == null) {
            log_err("error: " + I18n.ERROR_PARSER_MEOTEXT_FAIL);
            return false;
        }
        log("parse meo format text done...");
    } else {
        lpFile = lpTextParser(filePath);
        if (lpFile == null) {
            log_err("error: " + I18n.ERROR_PARSER_LPTEXT_FAIL);
            return false;
        }
        log("parse labelplus text done...");
    }

    // 替换文本解析
    if (opts.textReplace) {
        let tmp = textReplaceReader(opts.textReplace);
        if (tmp === null) {
            log_err("error: " + I18n.ERROR_TEXT_REPLACE_EXPRESSION);
            return false;
        }
        textReplace = tmp;
    }
    log("parse textreplace done...");

    // 确定doc模板文件
    let template_path: string = "";
    switch (opts.docTemplate) {
    case OptionDocTemplate.Custom:
        template_path = opts.docTemplateCustomPath;
        if (!FileIsExists(template_path)) {
            log_err("error: " + I18n.ERROR_NOT_FOUND_TEMPLATE + " " + template_path);
            return false;
        }
        break;
    case OptionDocTemplate.Auto:
        let tempdir = GetScriptFolder() + dirSeparator + "ps_script_res" + dirSeparator;
        let tempname = app.locale.split("_")[0].toLocaleLowerCase() + ".psd"; // such as "zh_CN" -> zh.psd

        let try_list: string[] = [
            tempdir + tempname,
            tempdir + "en.psd"
        ];
        for (let i = 0; i < try_list.length; i++) {
            if (FileIsExists(try_list[i])) {
                template_path = try_list[i];
                break;
            }
        }
        if (template_path === "") {
            log_err("error: " + I18n.ERROR_PRESET_TEMPLATE_NOT_FOUND);
            return false;
        }
        log("auto match template: " + template_path);
        break;
    case OptionDocTemplate.No:
    default:
        log("template not used");
        break;
    }

    // 遍历所选图片
    for (let i = 0; i < opts.imageSelected.length; i++) {
        let orgin_name :string = opts.imageSelected[i].file; // 翻译文件中的图片文件名
        let matched_name: string = opts.imageSelected[i].matched_file;
        let name_pair = LabelPlus.str_filename_pair(orgin_name, matched_name);

        log(name_pair + 'in processing...' );
        if (opts.ignoreNoLabelImg && lpFile?.images[orgin_name].length == 0) { // ignore img with no label
            log('no label, ignored...');
            continue;
        }
        let ws = openImageWorkspace(matched_name, template_path);
        if (ws == null) {
            log_err(name_pair + ": " + I18n.ERROR_FILE_OPEN_FAIL);
            continue;
        }

        let img_info: ImageInfo = {
            ws: ws,
            name: matched_name,
            name_pair: name_pair,
            labels: lpFile.images[orgin_name],
        };
        if (!importImage(img_info)) {
            log_err(name_pair + ": import label failed");
        }
        if (!closeImage(img_info, opts.outputType)) {
            log_err(name_pair + ": " + I18n.ERROR_FILE_SAVE_FAIL);
        }
        log(name_pair + ": done");
    }
    log("All Done!");
    return true;
};


// 文本导入选项，参数为undefined时表示不设置该项
interface TextInputOptions {
    template?: ArtLayer;     // 文本图层模板
    font?: string;
    fontStyle?: string;      // "Regular" / "Bold" / "Italic" / "Bold Italic"
    size?: UnitValue;
    direction?: Direction;
    lgroup?: LayerSet;
    lending?: number;        // 自动行距
    color?: string;          // 文字颜色 (HEX，例 "#000000")
    strokeColor?: string;    // 描边颜色 (HEX)
    strokeWeight?: number;   // 描边宽度 (px)
    rotation?: number;       // 文字旋转角度（度），任意值會被正規化到 (-180, 180]
};

// 將任意角度正規化到 (-180, 180] 區間
function normalizeRotation(deg: number): number
{
    let r = deg % 360;
    if (r > 180) r -= 360;
    if (r <= -180) r += 360;
    return r;
}

// 將 HEX 字串解析成 SolidColor，失敗時回傳 null
function parseHexColor(hex: string): SolidColor | null
{
    if (!hex) return null;
    let h = hex.replace(/^#/, "").trim();
    // 支援 3 位簡寫
    if (h.length === 3) {
        h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    }
    if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) {
        return null;
    }
    let c = new SolidColor();
    c.rgb.hexValue = h;
    return c;
}

// 為當前圖層套用「描邊」圖層樣式（透過 ActionDescriptor）
// 注意：因 ExtendScript 的 TextItem 沒有描邊屬性，必須用 Layer Style 實現
function applyStrokeLayerStyle(strokeColor: string, strokeWeightPx: number): void
{
    let color = parseHexColor(strokeColor);
    if (!color) {
        log_err("applyStrokeLayerStyle: invalid stroke color " + strokeColor);
        return;
    }

    try {
        let cTID = (s: string) => app.charIDToTypeID(s);

        let ref = new ActionReference();
        ref.putProperty(cTID("Prpr"), cTID("Lefx"));
        ref.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));

        let lefx = new ActionDescriptor();
        let scl = new ActionDescriptor();
        scl.putUnitDouble(cTID("Scl "), cTID("#Prc"), 100);
        lefx.putObject(cTID("Scl "), cTID("Scl "), scl);

        let frfx = new ActionDescriptor();
        frfx.putBoolean(cTID("enab"), true);
        frfx.putEnumerated(cTID("Styl"), cTID("FStl"), cTID("OutF"));   // 位置：外側
        frfx.putEnumerated(cTID("PntT"), cTID("FrFl"), cTID("SClr"));   // 填充：純色
        frfx.putEnumerated(cTID("Md  "), cTID("BlnM"), cTID("Nrml"));   // 混合模式：正常
        frfx.putUnitDouble(cTID("Opct"), cTID("#Prc"), 100);
        frfx.putUnitDouble(cTID("Sz  "), cTID("#Pxl"), strokeWeightPx);

        let clr = new ActionDescriptor();
        clr.putDouble(cTID("Rd  "), color.rgb.red);
        clr.putDouble(cTID("Grn "), color.rgb.green);
        clr.putDouble(cTID("Bl  "), color.rgb.blue);
        frfx.putObject(cTID("Clr "), cTID("RGBC"), clr);

        lefx.putObject(cTID("FrFX"), cTID("FrFX"), frfx);

        let desc = new ActionDescriptor();
        desc.putReference(cTID("null"), ref);
        desc.putObject(cTID("T   "), cTID("Lefx"), lefx);

        app.executeAction(cTID("setd"), desc, DialogModes.NO);
    } catch (e) {
        log_err("applyStrokeLayerStyle failed: " + e.toString());
    }
}

// 创建文本图层
function newTextLayer(doc: Document, text: string, x: number, y: number, topts: TextInputOptions = {}): ArtLayer
{
    let artLayerRef: ArtLayer;
    let textItemRef: TextItem;

    // 从模板创建，可以保证图层的所有格式与模板一致
    if (topts.template) {
        /// @ts-ignore ts声明文件有误，duplicate()返回ArtLayer对象，而不是void
        artLayerRef = <ArtLayer> topts.template.duplicate();
        textItemRef = artLayerRef.textItem;
    }
    else {
        artLayerRef = doc.artLayers.add();
        artLayerRef.kind = LayerKind.TEXT;
        textItemRef = artLayerRef.textItem;
    }

    if (topts.size)
        textItemRef.size = topts.size;

    if (topts.font)
        textItemRef.font = topts.font;

    if (topts.direction)
        textItemRef.direction = topts.direction;

    // 文字風格（Bold / Italic）：當 PostScript 字體本身已包含風格時，
    // 此處主要作為輔助；若樣式包含 "Bold"/"Italic" 才套用 fauxBold/fauxItalic
    if (topts.fontStyle) {
        let style = topts.fontStyle.toLowerCase();
        try {
            (<any>textItemRef).fauxBold = (style.indexOf("bold") !== -1);
            (<any>textItemRef).fauxItalic = (style.indexOf("italic") !== -1);
        } catch (e) {
            log("fauxBold/fauxItalic not supported: " + e.toString());
        }
    }

    // 文字顏色
    if (topts.color) {
        let c = parseHexColor(topts.color);
        if (c) {
            textItemRef.color = c;
        } else {
            log_err("invalid text color: " + topts.color);
        }
    }

    textItemRef.position = Array(UnitValue(doc.width.as("px") * x, "px"), UnitValue(doc.height.as("px") * y, "px"));

    if (topts.lgroup)
        artLayerRef.move(topts.lgroup, ElementPlacement.PLACEATBEGINNING);

    if ((topts.lending) && (topts.lending != 0)) {
        textItemRef.useAutoLeading = true;
        textItemRef.autoLeadingAmount = topts.lending;
    }

    artLayerRef.name     = text;
    textItemRef.contents = text;

    // 旋轉：在內容寫入後、描邊套用前進行；以圖層中心為錨點
    // 描邊圖層樣式會跟隨變換，所以順序對描邊結果沒有影響
    //
    // 旋轉方向慣例轉換（重要）：
    //   - 來源資料 (InDesign 匯出)：正值 = 逆時針，負值 = 順時針
    //   - Photoshop ArtLayer.rotate()：正值 = 順時針，負值 = 逆時針
    //   兩者方向相反，必須取負後再傳入 PS
    if (typeof topts.rotation === "number" && !isNaN(topts.rotation)) {
        let deg = normalizeRotation(topts.rotation);
        if (deg !== 0) {
            try {
                artLayerRef.rotate(-deg, AnchorPosition.MIDDLECENTER);
            } catch (e) {
                log_err("rotate text layer failed: " + e.toString());
            }
        }
    }

    // 描邊樣式：必須在文本內容寫入後再套用，否則邊界尚未定型
    if (topts.strokeColor && topts.strokeWeight && topts.strokeWeight > 0) {
        doc.activeLayer = artLayerRef;
        applyStrokeLayerStyle(topts.strokeColor, topts.strokeWeight);
    }

    return artLayerRef;
}

type TextReplaceInfo = { from: string; to: string; }[];

// 文本替换表达式解析
function textReplaceReader(str: string): TextReplaceInfo | null
{
    let arr: TextReplaceInfo = [];

    let strs = str.split('|');
    if (!strs)
        return null; //解析失败

    for (let i = 0; i < strs.length; i++) {
        if (strs[i] === "")
            continue;

        let strss = strs[i].split("->");
        if ((strss.length != 2) || (strss[0] == ""))
            return null; //解析失败

        arr.push({ from: strss[0], to: strss[1] });
    }
    return arr;
}

} // namespace LabelPlus
