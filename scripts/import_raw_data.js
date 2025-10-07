"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importRawData = importRawData;
var firebaseAdmin_1 = require("@/lib/firebaseAdmin");
var fs = require("fs");
var sync_1 = require("csv-parse/sync");
var XLSX = require("xlsx");
var driver_weekly_record_1 = require("@/schemas/driver-weekly-record");
function importRawData(weekStart, weekEnd, filesToImport) {
    return __awaiter(this, void 0, void 0, function () {
        var weekId, importId, _loop_1, _i, filesToImport_1, file;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    weekId = (0, driver_weekly_record_1.getWeekId)(new Date(weekStart));
                    importId = "".concat(weekId, "-").concat(new Date().getTime());
                    _loop_1 = function (file) {
                        var rawData, content, records, workbook, sheetName, sheet, json, rawDataDocId, rawDataRef, importDocRef, importEntry;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    console.log("Processando arquivo: ".concat(file.filePath, " para a plataforma ").concat(file.platform));
                                    rawData = { headers: [], rows: [] };
                                    if (file.type === "csv") {
                                        content = fs.readFileSync(file.filePath, "utf8");
                                        // Remover BOM se existir
                                        if (content.charCodeAt(0) === 0xFEFF) {
                                            content = content.slice(1);
                                        }
                                        records = (0, sync_1.parse)(content, { columns: true, skip_empty_lines: true });
                                        rawData.headers = Object.keys(records[0] || {});
                                        rawData.rows = records;
                                    }
                                    else if (file.type === "xlsx") {
                                        workbook = XLSX.readFile(file.filePath);
                                        sheetName = workbook.SheetNames[0];
                                        sheet = workbook.Sheets[sheetName];
                                        json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                                        rawData.headers = json[0];
                                        rawData.rows = json.slice(1).map(function (row) {
                                            var obj = {};
                                            rawData.headers.forEach(function (header, index) {
                                                obj[header] = row[index];
                                            });
                                            return obj;
                                        });
                                    }
                                    rawDataDocId = "".concat(weekId, "-").concat(file.platform);
                                    rawDataRef = firebaseAdmin_1.adminDb.collection("rawWeeklyData").doc(rawDataDocId);
                                    return [4 /*yield*/, rawDataRef.set({
                                            weekId: weekId,
                                            platform: file.platform,
                                            weekStart: weekStart,
                                            weekEnd: weekEnd,
                                            rawData: rawData,
                                            createdAt: new Date().toISOString(),
                                        })];
                                case 1:
                                    _b.sent();
                                    console.log("\u2705 Dados brutos de ".concat(file.platform, " salvos em rawWeeklyData/").concat(rawDataDocId));
                                    importDocRef = firebaseAdmin_1.adminDb.collection("weeklyDataImports").doc();
                                    importEntry = {
                                        importId: importId,
                                        platform: file.platform,
                                        weekStart: weekStart,
                                        weekEnd: weekEnd,
                                        rawData: { headers: [], rows: [] }, // rawData vazio aqui, pois será buscado via referência
                                        processed: false,
                                        processedAt: null,
                                        rawDataSourceRef: rawDataDocId,
                                    };
                                    return [4 /*yield*/, importDocRef.set(importEntry)];
                                case 2:
                                    _b.sent();
                                    console.log("\u2705 Entrada de importa\u00E7\u00E3o para ".concat(file.platform, " criada em weeklyDataImports com refer\u00EAncia a ").concat(rawDataDocId));
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, filesToImport_1 = filesToImport;
                    _a.label = 1;
                case 1:
                    if (!(_i < filesToImport_1.length)) return [3 /*break*/, 4];
                    file = filesToImport_1[_i];
                    return [5 /*yield**/, _loop_1(file)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log("🎉 Importação de dados brutos concluída!");
                    return [2 /*return*/];
            }
        });
    });
}
