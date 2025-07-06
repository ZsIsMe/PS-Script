namespace I18n {
    export var APP_NAME: string = "LabelPlus PS-Script";

    export var BUTTON_RUN: string = "執行";
    export var BUTTON_CANCEL: string = "取消";
    export var BUTTON_LOAD: string = "載入";
    export var BUTTON_SAVE: string = "儲存";
    export var BUTTON_RESET: string = "重置";

    export var PANEL_INPUT: string = "輸入";
    export var PANEL_OUTPUT: string = "輸出";
    export var PANEL_STYLE: string = "樣式";
    export var PANEL_AUTOMATION: string = "自動化";

    export var PANEL_TEMPLATE_SETTING: string = "文檔模板設定";
    export var RB_TEMPLATE_AUTO: string = "自動";
    export var RB_TEMPLATE_NO: string = "不使用模板";
    export var RB_TEMPLATE_CUSTOM: string = "自定義模板";

    export var LABEL_TEXT_FILE: string = "LabelPlus文本:";
    export var LABEL_MEO_FILE: string = "Meo格式文本:";
    export var LABEL_SOURCE: string = "圖源:";
    export var LABEL_OVERLAY_MANUAL_SOURCE: string = "涂白文件夾:";
    export var LABEL_TARGET: string = "輸出路徑:";
    export var LABEL_SETTING: string = "設定";
    export var LABEL_SELECT_IMG: string = "選擇圖片";
    export var LABEL_SELECT_GROUP: string = "選擇分組";
    export var LABEL_SELECT_TIP: string = "提示: 按住[Ctrl]鍵來選擇/取消單項，按住[Shift]鍵來選擇多項。";


    export var CHECKBOX_OUTPUT_LABEL_INDEX: string = "輸出標籤序號";
    export var CHECKBOX_TEXT_REPLACE: string = "文本替換(例如: \"A->B|C->D\")";
    export var CHECKBOX_IGNORE_NO_LABEL_IMG: string = "忽略沒有標籤的圖片";
    export var CHECKBOX_MATCH_IMG_BY_ORDER: string = "按順序匹配圖源";
    export var BUTTON_SOURCE_CHECK_MATCH: string = "檢查匹配結果";
    export var LABEL_OUTPUT_FILE_TYPE: string = "輸出文件類型:";
    export var CHECKBOX_REPLACE_IMG_SUFFIX: string = "替換圖片後綴名";
    export var CHECKBOX_RUN_ACTION: string = "執行動作:";
    export var CHECKBOX_NOT_CLOSE: string = "不關閉文件";
    export var CHECKBOX_SET_FONT: string = "字體";
    export var CHECKBOX_SET_LEADING: string = "行距";
    export var LABEL_TEXT_DIRECTION: string = "文本方向:";
    export var LIST_TEXT_DIT_ITEMS: string[] = ["默認", "水平", "垂直"];
    export var CHECKBOX_NO_LAYER_GROUP: string = "不使用圖層分組";

    export var CHECKBOX_DIALOG_OVERLAY: string = "執行\"對話框涂白\"";
    export var LABEL_DIALOG_OVERLAY_GROUP: string = "指定分組(如: group1,group2)：";
    export var LABEL_DIALOG_OVERLAY_TOLERANCE: string = "容差:";

    export var COMPLETE: string = "導出完成!";
    export var COMPLETE_WITH_ERROR: string = "導出完成，但出現一些錯誤..."
    export var COMPLETE_FAILED: string = "導出失敗..."

    export var ERROR_UNEXPECTED: string = "意外錯誤，請聯繫維護人員...";
    export var ERROR_FILE_OPEN_FAIL: string = "打開文件失敗，請確認Photoshop是否能打開該文件。";
    export var ERROR_FILE_SAVE_FAIL: string = "文件保存失敗，請檢查是否有磁盤操作權限並確認磁盤空間是否充足。";
    export var ERROR_NOT_FOUND_SOURCE: string = "未找到圖源路徑！";
    export var ERROR_NOT_FOUND_OVERLAY_MANUAL_SOURCE: string = "未找到涂白文件夾路徑！";
    export var ERROR_NOT_FOUND_TARGET: string = "未找到輸出PSD路徑！";
    export var ERROR_NOT_FOUND_LPTEXT: string = "未找到LabelPlus文本文件";
    export var ERROR_NOT_FOUND_MEOTEXT: string = "未找到Meo格式文本文件";
    export var ERROR_NOT_FOUND_TEMPLATE: string = "未找到Photoshop模板文件！";
    export var ERROR_CREATE_NEW_FOLDER: string = "無法創建新資料夾";
    export var ERROR_PARSER_LPTEXT_FAIL: string = "解析LabelPlus文本失敗";
    export var ERROR_PARSER_MEOTEXT_FAIL: string = "解析Meo格式文本失敗";
    export var ERROR_NO_IMG_CHOOSED: string = "請選擇至少一張圖片";
    export var ERROR_NO_LABEL_GROUP_CHOOSED: string = "請選擇至少一個分組";
    export var ERROR_NO_MATCH_IMG: string = "沒有匹配的圖片文件！！！！";
    export var ERROR_HAVE_NO_MATCH_IMG: string = "有些圖片文件沒有匹配，請重新檢查."
    export var ERROR_PRESET_TEMPLATE_NOT_FOUND: string = "無法匹配模板文件，請確認 \"ps_script_res\" 資料夾存在.";
    export var ERROR_TEXT_REPLACE_EXPRESSION: string = "文本替換表達式有誤，請重新檢查.";
    export var ERROR_OPT_FONT_NOT_FOUND: string = "找不到字體";

    declare var app: any;
    // if (true) {
    if (!(app.locale in {"zh_CN":1, "zh_TW":1, "zh_HK":1})) {
        BUTTON_RUN = "Run";
        BUTTON_CANCEL = "Cancel";
        BUTTON_LOAD = "Load";
        BUTTON_SAVE = "Save";
        BUTTON_RESET = "Reset";
        PANEL_INPUT = "Input";
        PANEL_OUTPUT = "Output";
        PANEL_STYLE = "Style";
        PANEL_AUTOMATION = "Automation";
        PANEL_TEMPLATE_SETTING = "Document Template Setting";
        RB_TEMPLATE_AUTO = "Auto";
        RB_TEMPLATE_NO = "No Template";
        RB_TEMPLATE_CUSTOM = "Custom Template";
        LABEL_TEXT_FILE = "LabelPlus Text:";
        LABEL_MEO_FILE = "Meo Format Text:";
        LABEL_SOURCE = "Image Source:";
        LABEL_OVERLAY_MANUAL_SOURCE = "Overlay Manual Source:";
        LABEL_TARGET = "Output Folder:";
        LABEL_SETTING = "Setting";
        LABEL_SELECT_IMG = "Select Image";
        LABEL_SELECT_GROUP = "Select Group";
        LABEL_SELECT_TIP = "Tip: Push [Ctrl] key to select/cancel one item, push [Shift] key to select multiple items.";
        CHECKBOX_OUTPUT_LABEL_INDEX = "Output Label Number";
        CHECKBOX_TEXT_REPLACE = "Text Replace(e.g. \"A->B|C->D\")";
        CHECKBOX_IGNORE_NO_LABEL_IMG = "Ignore Images With No Label";
        CHECKBOX_MATCH_IMG_BY_ORDER = "Match Image Source By Order";
        BUTTON_SOURCE_CHECK_MATCH = "Check Match Result";
        LABEL_OUTPUT_FILE_TYPE = "Output File Type:";
        CHECKBOX_REPLACE_IMG_SUFFIX = "Replace Image Suffix";
        CHECKBOX_RUN_ACTION = "Execute Action:";
        CHECKBOX_NOT_CLOSE = "Do Not Close File";
        CHECKBOX_SET_FONT = "Font";
        CHECKBOX_SET_LEADING = "Leading";
        LABEL_TEXT_DIRECTION = "Text Direction:";
        LIST_TEXT_DIT_ITEMS = [ "Default", "Horizontal", "Vertical" ];
        CHECKBOX_NO_LAYER_GROUP = "Layer Not Grouping";
        CHECKBOX_DIALOG_OVERLAY = "Execute \"Dialog Overlay\"";
        LABEL_DIALOG_OVERLAY_GROUP = "Specified Groups(like: group1,group2)：";
        LABEL_DIALOG_OVERLAY_TOLERANCE = "Tolerance:";
        COMPLETE = "Export completed!";
        COMPLETE_WITH_ERROR = "Export Completed, but some error occured..."
        COMPLETE_FAILED = "Exported failed..."
        ERROR_UNEXPECTED = "Unexpected error, please contact with maintenance...";
        ERROR_FILE_OPEN_FAIL = "open file failed, please confirm whether Photoshop can open the file.";
        ERROR_FILE_SAVE_FAIL = "File saving failed, please check whether you have disk operation permission and whether the disk space is sufficient.";
        ERROR_NOT_FOUND_SOURCE = "Image Source Folder Not Found!";
        ERROR_NOT_FOUND_OVERLAY_MANUAL_SOURCE = "Overlay Manual Source Folder Not Found!";
        ERROR_NOT_FOUND_TARGET = "Output PSD Folder Not Found!";
        ERROR_NOT_FOUND_LPTEXT = "LabelPlus Text File Not Found!";
        ERROR_NOT_FOUND_MEOTEXT = "Meo Format Text File Not Found!";
        ERROR_NOT_FOUND_TEMPLATE = "Photoshop template file not found!";
        ERROR_CREATE_NEW_FOLDER = "Could not build new folder";
        ERROR_PARSER_LPTEXT_FAIL = "Fail To Load LabelPlus Text File";
        ERROR_PARSER_MEOTEXT_FAIL = "Fail To Load Meo Format Text File";
        ERROR_NO_IMG_CHOOSED = "Please select more than one image";
        ERROR_NO_LABEL_GROUP_CHOOSED = "Please select more than one group";
        ERROR_NO_MATCH_IMG = "No matched image file!!!!";
        ERROR_HAVE_NO_MATCH_IMG = "Some image files did not match, please check again."
        ERROR_PRESET_TEMPLATE_NOT_FOUND = "Cannot match template file, please make sure \"ps_script_res\" folder exsit.";
        ERROR_TEXT_REPLACE_EXPRESSION = "Expression of text replacing is wrong, please check again.";
        ERROR_OPT_FONT_NOT_FOUND = "Cannot found the font";
    }
}
