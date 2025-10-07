"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.default = handler;
var firebaseAdmin_1 = require("@/lib/firebaseAdmin");
var weekly_data_sources_1 = require("@/schemas/weekly-data-sources");
var driver_weekly_record_1 = require("@/schemas/driver-weekly-record");
function handler(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var importId, importEntriesSnapshot, importEntries, _a, weekId, weekStart_1, weekEnd_1, driversSnapshot, drivers_1, processedDriverData_1, _i, importEntries_1, entry, rawDataDoc, rawDataRows, weeklyDataSources, currentSources, _b, importEntries_2, entry, _c, _d, _e, _f, driverId, data, driver, record, batch_1, error_1;
        var _g, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    // Reativar autenticação
                    // const session = await getSession({ req });
                    // if (!session || session.role !== 'admin') {
                    //   return res.status(401).json({ message: 'Unauthorized' });
                    // }
                    if (req.method !== 'POST') {
                        return [2 /*return*/, res.status(405).json({ message: 'Method Not Allowed' })];
                    }
                    importId = req.body.importId;
                    if (!importId) {
                        return [2 /*return*/, res.status(400).json({ message: 'Missing importId' })];
                    }
                    _j.label = 1;
                case 1:
                    _j.trys.push([1, 15, , 16]);
                    return [4 /*yield*/, firebaseAdmin_1.adminDb.collection('weeklyDataImports')
                            .where('importId', '==', importId)
                            .get()];
                case 2:
                    importEntriesSnapshot = _j.sent();
                    if (importEntriesSnapshot.empty) {
                        return [2 /*return*/, res.status(404).json({ message: 'No import entries found for this importId' })];
                    }
                    importEntries = importEntriesSnapshot.docs.map(function (doc) { return (__assign({ id: doc.id }, doc.data())); });
                    _a = importEntries[0], weekId = _a.weekId, weekStart_1 = _a.weekStart, weekEnd_1 = _a.weekEnd;
                    return [4 /*yield*/, firebaseAdmin_1.adminDb.collection('drivers').where('status', '==', 'active').get()];
                case 3:
                    driversSnapshot = _j.sent();
                    drivers_1 = driversSnapshot.docs.map(function (doc) { return (__assign({ id: doc.id }, doc.data())); });
                    processedDriverData_1 = {};
                    // Inicializar processedDriverData com todos os motoristas
                    drivers_1.forEach(function (driver) {
                        var _a, _b, _c, _d;
                        processedDriverData_1[driver.id] = {
                            driver: driver,
                            uberTotal: 0,
                            boltTotal: 0,
                            myprioTotal: 0,
                            viaverdeTotal: 0,
                            uberTrips: 0,
                            boltTrips: 0,
                            uberUuid: ((_b = (_a = driver.integrations) === null || _a === void 0 ? void 0 : _a.uber) === null || _b === void 0 ? void 0 : _b.uuid) || '',
                            boltEmail: driver.email || '', // Usar email para Bolt
                            myprioCard: ((_c = driver.cards) === null || _c === void 0 ? void 0 : _c.myprio) || '',
                            viaverdeOBU: ((_d = driver.cards) === null || _d === void 0 ? void 0 : _d.viaverde) || '',
                        };
                    });
                    _i = 0, importEntries_1 = importEntries;
                    _j.label = 4;
                case 4:
                    if (!(_i < importEntries_1.length)) return [3 /*break*/, 7];
                    entry = importEntries_1[_i];
                    // rawDataSourceRef agora é opcional na interface, mas esperamos que esteja presente aqui
                    if (!entry.rawDataSourceRef) {
                        console.warn("Entry ".concat(entry.id, " is missing rawDataSourceRef. Skipping."));
                        return [3 /*break*/, 6];
                    }
                    return [4 /*yield*/, firebaseAdmin_1.adminDb.collection('rawWeeklyData').doc(entry.rawDataSourceRef).get()];
                case 5:
                    rawDataDoc = _j.sent();
                    rawDataRows = (_h = (_g = rawDataDoc.data()) === null || _g === void 0 ? void 0 : _g.rawData) === null || _h === void 0 ? void 0 : _h.rows;
                    if (!rawDataRows) {
                        console.warn("No raw data rows found for entry ".concat(entry.id, " from rawDataSourceRef ").concat(entry.rawDataSourceRef, ". Skipping."));
                        return [3 /*break*/, 6];
                    }
                    switch (entry.platform) {
                        case 'uber':
                            rawDataRows.forEach(function (row) {
                                var driverUuid = row['UUID do motorista'];
                                var driverMatch = drivers_1.find(function (d) { var _a, _b; return ((_b = (_a = d.integrations) === null || _a === void 0 ? void 0 : _a.uber) === null || _b === void 0 ? void 0 : _b.uuid) === driverUuid; });
                                if (driverMatch) {
                                    var total = parseFloat(row['Pago a si'] || '0');
                                    var trips = parseInt(row['Viagens'] || '0');
                                    processedDriverData_1[driverMatch.id].uberTotal += total;
                                    processedDriverData_1[driverMatch.id].uberTrips += trips;
                                }
                            });
                            break;
                        case 'bolt':
                            rawDataRows.forEach(function (row) {
                                var driverEmail = row['Email']; // Usar email para Bolt
                                var driverMatch = drivers_1.find(function (d) { return d.email === driverEmail; });
                                if (driverMatch) {
                                    var total = parseFloat(row['Ganhos brutos (total)|€'] || '0');
                                    var trips = parseInt(row['Viagens (total)'] || '0');
                                    processedDriverData_1[driverMatch.id].boltTotal += total;
                                    processedDriverData_1[driverMatch.id].boltTrips += trips;
                                }
                            });
                            break;
                        case 'myprio':
                            rawDataRows.forEach(function (row) {
                                var myprioCard = String(row['CARTÃO']);
                                var driverMatch = drivers_1.find(function (d) { var _a; return ((_a = d.cards) === null || _a === void 0 ? void 0 : _a.myprio) === myprioCard; });
                                if (driverMatch) {
                                    var total = parseFloat(row['TOTAL'] || '0');
                                    processedDriverData_1[driverMatch.id].myprioTotal += total;
                                }
                            });
                            break;
                        case 'viaverde':
                            rawDataRows.forEach(function (row) {
                                var viaverdeOBU = String(row['OBU']);
                                var entryDate = new Date(row['Entry Date']);
                                var exitDate = new Date(row['Exit Date']);
                                // Filtrar transações dentro da semana de importação
                                var weekStartDate = new Date(weekStart_1);
                                var weekEndDate = new Date(weekEnd_1);
                                if (entryDate >= weekStartDate && exitDate <= weekEndDate) {
                                    var driverMatch = drivers_1.find(function (d) { var _a; return ((_a = d.cards) === null || _a === void 0 ? void 0 : _a.viaverde) === viaverdeOBU; });
                                    if (driverMatch) {
                                        var total = parseFloat(row['Value'] || '0');
                                        processedDriverData_1[driverMatch.id].viaverdeTotal += total;
                                    }
                                    else {
                                        console.warn("Transa\u00E7\u00E3o ViaVerde para OBU ".concat(viaverdeOBU, " n\u00E3o encontrada para motorista ativo."));
                                    }
                                }
                                else {
                                    console.warn("Transa\u00E7\u00E3o ViaVerde (".concat(row['Entry Date'], " - ").concat(row['Exit Date'], ") fora do per\u00EDodo da semana (").concat(weekStart_1, " - ").concat(weekEnd_1, "). Ignorando."));
                                }
                            });
                            break;
                        case 'cartrack': // Adicionar lógica para Cartrack
                            rawDataRows.forEach(function (row) {
                                var driverIdCartrack = row['Driver ID']; // Assumindo que há um 'Driver ID' no Cartrack
                                var driverMatch = drivers_1.find(function (d) { var _a, _b; return ((_b = (_a = d.integrations) === null || _a === void 0 ? void 0 : _a.cartrack) === null || _b === void 0 ? void 0 : _b.id) === driverIdCartrack; }); // Assumindo integração Cartrack
                                if (driverMatch) {
                                    var total = parseFloat(row['Total KMs'] || '0'); // Exemplo: total de KMs
                                    // Você pode adicionar mais campos específicos do Cartrack aqui
                                    // processedDriverData[driverMatch.id].cartrackTotal += total;
                                }
                            });
                            break;
                    }
                    _j.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7: return [4 /*yield*/, firebaseAdmin_1.adminDb.collection('weeklyDataSources').doc(weekId).get()];
                case 8:
                    weeklyDataSources = _j.sent();
                    currentSources = void 0;
                    if (!weeklyDataSources.exists) {
                        currentSources = (0, weekly_data_sources_1.createWeeklyDataSources)(weekId, weekStart_1, weekEnd_1);
                    }
                    else {
                        currentSources = __assign({ id: weeklyDataSources.id }, weeklyDataSources.data());
                    }
                    // Atualizar status de cada fonte processada
                    for (_b = 0, importEntries_2 = importEntries; _b < importEntries_2.length; _b++) {
                        entry = importEntries_2[_b];
                        currentSources = (0, weekly_data_sources_1.updateDataSource)(currentSources, entry.platform, {
                            status: 'complete', // Assumimos completo se processado
                            origin: 'manual',
                            importedAt: new Date().toISOString(),
                            // driversCount e recordsCount podem ser calculados aqui se necessário
                        });
                    }
                    return [4 /*yield*/, firebaseAdmin_1.adminDb.collection('weeklyDataSources').doc(weekId).set(currentSources, { merge: true })];
                case 9:
                    _j.sent();
                    _c = processedDriverData_1;
                    _d = [];
                    for (_e in _c)
                        _d.push(_e);
                    _f = 0;
                    _j.label = 10;
                case 10:
                    if (!(_f < _d.length)) return [3 /*break*/, 13];
                    _e = _d[_f];
                    if (!(_e in _c)) return [3 /*break*/, 12];
                    driverId = _e;
                    data = processedDriverData_1[driverId];
                    driver = data.driver;
                    record = (0, driver_weekly_record_1.createDriverWeeklyRecord)({
                        driverId: driver.id,
                        driverName: driver.firstName + ' ' + driver.lastName,
                        driverEmail: driver.email,
                        weekId: weekId,
                        weekStart: weekStart_1,
                        weekEnd: weekEnd_1,
                        uberTotal: data.uberTotal,
                        boltTotal: data.boltTotal,
                        myprioTotal: data.myprioTotal,
                        viaverdeTotal: data.viaverdeTotal,
                        uberTrips: data.uberTrips,
                        boltTrips: data.boltTrips,
                        isLocatario: driver.isLocatario || false,
                        aluguel: driver.aluguel || 0,
                        combustivel: data.myprioTotal, // myprioTotal é o combustível
                        viaVerde: data.viaverdeTotal, // viaverdeTotal é o ViaVerde
                    });
                    // Salvar ou atualizar o registro semanal do motorista
                    return [4 /*yield*/, firebaseAdmin_1.adminDb.collection('driverWeeklyRecords').doc("".concat(weekId, "-").concat(driver.id)).set(record, { merge: true })];
                case 11:
                    // Salvar ou atualizar o registro semanal do motorista
                    _j.sent();
                    _j.label = 12;
                case 12:
                    _f++;
                    return [3 /*break*/, 10];
                case 13:
                    batch_1 = firebaseAdmin_1.adminDb.batch();
                    importEntriesSnapshot.docs.forEach(function (doc) {
                        batch_1.update(doc.ref, { processed: true, processedAt: new Date().toISOString() });
                    });
                    return [4 /*yield*/, batch_1.commit()];
                case 14:
                    _j.sent();
                    return [2 /*return*/, res.status(200).json({ message: 'Importation processed successfully', weekId: weekId })];
                case 15:
                    error_1 = _j.sent();
                    console.error('Error processing import:', error_1);
                    return [2 /*return*/, res.status(500).json({ message: 'Internal Server Error', error: error_1.message })];
                case 16: return [2 /*return*/];
            }
        });
    });
}
