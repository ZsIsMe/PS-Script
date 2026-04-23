#target photoshop

var inputFolder = Folder.selectDialog("选择包含图片的文件夹");
var outputFolder = Folder.selectDialog("选择输出文件夹");

if (inputFolder && outputFolder) {
    var files = inputFolder.getFiles(/\.(jpg|jpeg|png|tif|tiff)$/i);
    for (var i = 0; i < files.length; i++) {
        var doc = open(files[i]);

        // 转换为 sRGB 色彩空间（注意不是赋予，而是转换）
        doc.convertProfile("sRGB IEC61966-2.1", Intent.RELATIVECOLORIMETRIC, true, true);

        var saveFile = new File(outputFolder + "/" + doc.name);
        var opts = new JPEGSaveOptions();
        opts.quality = 12;
        doc.saveAs(saveFile, opts, true);
        doc.close(SaveOptions.DONOTSAVECHANGES);
    }
}