odoo.define('pos_retail.big_data', function (require) {
    var models = require('point_of_sale.models');
    var core = require('web.core');
    var _t = core._t;
    var rpc = require('pos.rpc');
    var ParameterDB = require('pos_retail.parameter');
    var session = require('web.session');

    var _super_PosModel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        initialize: function (session, attributes) {
            var self = this;
            this.init_db(session);
            this.databases_cache = {};
            this.next_load = 2000;
            this.model_lock = [];
            this.model_unlock = [];
            this.model_ids = session['model_ids'];
            for (var i = 0; i < this.models.length; i++) {
                if (this.models[i].model && this.model_ids[this.models[i].model]) {
                    this.models[i]['max_id'] = this.model_ids[this.models[i].model]['max_id'];
                    this.models[i]['min_id'] = this.model_ids[this.models[i].model]['min_id'];
                    this.model_lock.push(this.models[i]);
                } else {
                    this.model_unlock.push(this.models[i])
                }
            }
            this.models = this.model_unlock;
            this.stock_datas = session.stock_datas;
            this.ParameterDB = new ParameterDB({});
            var config_id = this.ParameterDB.load(session.db + '_config_id');
            if (config_id) {
                var config_model = _.find(this.models, function (model) {
                    return model.model && model.model == "pos.config"
                })
                config_model.domain = [['id', '=', config_id]];
                this.config_id = config_id;
            }
            this.bus_logs = session.bus_logs;
            this.session = session;
            if (this.server_version == 10) {
                var currency_model = _.find(this.models, function (model) {
                    return model.model && model.model == "res.currency"
                })
                currency_model.ids = function (self) {
                    return [session.currency_id]
                }
            }
            return _super_PosModel.initialize.apply(this, arguments);
        },
        init_db: function (session) {
            var def = new $.Deferred();
            var self = this;
            window.indexedDB = window.indexedDB || window.mozIndexedDB ||
                window.webkitIndexedDB || window.msIndexedDB;
            window.IDBTransaction = window.IDBTransaction ||
                window.webkitIDBTransaction || window.msIDBTransaction;
            window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange ||
                window.msIDBKeyRange
            var request = window.indexedDB.open(session.db, 1);
            request.onerror = function (event) {
                console.log("error: ");
                def.reject();
            };
            request.onsuccess = function (event) {
                var indexedDB = request.result;
                self.indexedDB = indexedDB;
                self.read();
                def.resolve();
            };
            request.onupgradeneeded = function (event) {
                var indexedDB = event.target.result;
                self.indexedDB = indexedDB;
                for (var i = 0; i < self.model_unlock.length; i++) {
                    var model = self.model_unlock[i];
                    if (model.model) {
                        try {
                            indexedDB.createObjectStore(model.model, {
                                autoIncrement: true,
                                keyPath: model.model,
                            })
                        } catch (e) {
                        }
                    }
                }
                for (var i = 0; i < self.model_lock.length; i++) {
                    var model = self.model_lock[i];
                    if (model.model) {
                        try {
                            indexedDB.createObjectStore(model.model, {
                                autoIncrement: true,
                                keyPath: model.model,
                            })
                        } catch (e) {
                        }
                    }
                }
                def.resolve();
            };
            return def;
        },
        read: function () {
            var self = this;
            for (var i = 0; i < this.model_lock.length; i++) {
                var model = this.model_lock[i];
                if (model.model) {
                    var objectStore = this.indexedDB.transaction(model.model).objectStore(model.model);
                    objectStore.openCursor().onsuccess = function (event) {
                        var cursor = event.target.result;
                        if (cursor) {
                            var value = cursor.value;
                            var model = event.target.source.name;
                            self.databases_cache[model] = value;
                            cursor.continue();
                        }
                    }
                }
            }
        },
        update_caches: function () {
            for (var n = 0; n < this.model_lock.length; n++) {
                var model_name = this.model_lock[n].model;
                var self = this;
                var transaction = this.indexedDB.transaction([model_name], "readwrite");
                transaction.objectStore(model_name).openCursor().onsuccess = function (e) {
                    var cursor = e.target.result;
                    if (cursor) {
                        var vals = _.filter(self.datas_sync, function (val) {
                            return val['model'] == cursor.source.name
                        });
                        if (vals.length) {
                            var caches = cursor.value;
                            for (var i = 0; i < vals.length; i++) {
                                var val = vals[i];
                                caches = _.filter(caches, function (value) {
                                    return value['id'] != val['id'];
                                });
                            }
                            caches = caches.concat(vals);
                            var transaction = self.indexedDB.transaction([cursor.source.name], 'readwrite');
                            var request = transaction.objectStore(cursor.source.name);
                            request.add(caches);
                            self.datas_sync = _.filter(self.datas_sync, function (val) {
                                return val['model'] != cursor.source.name
                            });
                            console.log('updated caches of model: ' + cursor.source.name)
                            cursor.continue();
                        }

                    }
                };
            }
        },
        save_parameter_models_load: function () {
            /*
                Method store parameter load models to backend
             */
            var models = {};
            for (var number in this.model_lock) {
                var model = this.model_lock[number];
                models[model['model']] = {
                    fields: model['fields'] || [],
                    domain: model['domain'] || [],
                    context: model['context'] || [],
                };
                if (model['model'] == 'res.partner' || model['model'] == 'product.pricelist.item' || model['model'] == 'product.pricelist') {
                    models[model['model']]['domain'] = []
                }
                if (model['model'] == 'product.pricelist.item') {
                    models[model['model']]['domain'] = []
                }
            }
            rpc.query({
                model: 'pos.cache.database',
                method: 'save_parameter_models_load',
                args:
                    [models]
            })
        },
        first_install: function (model_name) {
            var loaded = new $.Deferred();
            var model = _.find(this.model_lock, function (model) {
                return model.model == model_name;
            });
            if (!model) {
                return loaded.resolve();
            }
            var self = this;
            var tmp = {};
            var fields = model.fields;

            function load_data(min_id, max_id) {
                var domain = [['id', '>=', min_id], ['id', '<', max_id]];
                var context = {}
                context['retail'] = true;
                if (model['model'] == 'product.product') {
                    domain.push(['available_in_pos', '=', true]);
                    var price_id = null;
                    if (self.pricelist) {
                        price_id = self.pricelist.id;
                    }
                    var stock_location_id = null;
                    if (self.config.stock_location_id) {
                        stock_location_id = self.config.stock_location_id[0]
                    }
                    context['location'] = stock_location_id;
                    context['pricelist'] = price_id;
                    context['display_default_code'] = false;
                }
                var params = {
                    model: model.model,
                    domain: domain,
                    fields: fields,
                    context: context,
                };
                return session.rpc('/web/dataset/search_read', params, {}).then(function (results) {
                    var results = results['records'] || [];
                    if (!self.database) {
                        self.database = {};
                    }
                    if (!self.database[model['model']]) {
                        self.database[model['model']] = [];
                    }
                    self.database[model['model']] = self.database[model['model']].concat(results);
                    min_id += self.next_load;
                    max_id += self.next_load;
                    if (results.length > 0) {
                        var process = min_id / model['max_id'];
                        if (process > 1) {
                            process = 1
                        }
                        self.chrome.loading_message(_t('Only one time installing: ') + model['model'] + ': ' + (process * 100).toFixed(2) + ' %', process);
                        load_data(min_id, max_id);
                        return $.when(model.loaded(self, results, tmp)).then(function () {
                        }, function (err) {
                            loaded.reject(err);
                        })
                    } else {
                        if (max_id < model['max_id']) {
                            load_data(min_id, max_id);
                        } else {
                            loaded.resolve();
                        }
                    }
                }).fail(function (type, error) {
                    self.chrome.loading_message(_t('Install fail, please try-again'));
                });
            }

            load_data(model['min_id'], model['min_id'] + this.next_load);
            return loaded;
        },
        auto_update_caches: function () {
            this.chrome.loading_message(_t('Please waiting, auto updating caches'));
            var self = this;
            var condition = {};
            for (var index_number in self.model_lock) {
                self.models.push(self.model_lock[index_number]);
                if (self.model_lock[index_number].condition) {
                    condition[self.model_lock[index_number]['model']] = self.model_lock[index_number].condition(self);
                } else {
                    condition[self.model_lock[index_number]['model']] = true;
                }
            }
            return rpc.query({
                model: 'pos.database',
                method: 'load_master_data',
                args: [condition],
            }).then(function (database) {
                if (database) {
                    for (var model_name in database) {
                        var transaction = self.indexedDB.transaction([model_name], 'readwrite');
                        var request = transaction.objectStore(model_name);
                        var value = database[model_name];
                        request.add(value);
                    }
                }
            }).fail(function (type, error) {
                return self.pos.query_backend_fail(type, error);
            });
        },
        load_datas: function (database) {
            var pricelist_model = _.find(this.model_lock, function (model) {
                return model.model == 'product.pricelist';
            });
            if (pricelist_model) {
                var results = database[pricelist_model.model];
                pricelist_model.loaded(this, results, {});
            }
            for (var model_name in database) {
                var transaction = this.indexedDB.transaction([model_name], 'readwrite');
                var request = transaction.objectStore(model_name);
                var value = database[model_name];
                request.add(value);
                var model_loaded = _.find(this.model_lock, function (model) {
                    return model.model == model_name;
                });
                if (model_loaded) {
                    var results = database[model_name];
                    if (model_loaded.model == 'product.product') {
                        for (var i = 0; i < results.length; i++) {
                            var product = results[i];
                            if (this.stock_datas[product['id']]) {
                                product['qty_available'] = this.stock_datas[product['id']]
                            }
                        }
                        this.products = results;
                    }
                    if (model_loaded.model != 'product.pricelist') {
                        model_loaded.loaded(this, results, {});
                    }
                }
            }
        },
        load_server_data: function () {
            var self = this;
            return _super_PosModel.load_server_data.apply(this, arguments).then(function () {
                var condition = {};
                for (var index_number in self.model_lock) {
                    self.models.push(self.model_lock[index_number]);
                    if (self.model_lock[index_number].condition) {
                        condition[self.model_lock[index_number]['model']] = self.model_lock[index_number].condition(self);
                    } else {
                        condition[self.model_lock[index_number]['model']] = true;
                    }
                }
                if (self.databases_cache && self.databases_cache['product.product'] && self.databases_cache['product.product'].length && self.databases_cache['res.partner'].length) {
                    self.chrome.loading_message(_t('Please waiting, loading caches'));
                    self.load_datas(self.databases_cache);
                } else {
                    return rpc.query({
                        model: 'pos.database',
                        method: 'load_master_data',
                        args: [condition],
                    }).then(function (database) {
                        if (database) {
                            self.chrome.loading_message(_t('Please waiting, storing caches'));
                            self.load_datas(database);
                        } else {
                            return $.when(self.first_install('product.pricelist')).then(function () {
                                return $.when(self.first_install('product.pricelist.item')).then(function () {
                                    return $.when(self.first_install('product.product')).then(function () {
                                        return $.when(self.first_install('res.partner')).then(function () {
                                            return $.when(self.first_install('account.invoice')).then(function () {
                                                return $.when(self.first_install('account.invoice.line')).then(function () {
                                                    return $.when(self.first_install('pos.order')).then(function () {
                                                        return $.when(self.first_install('pos.order.line')).then(function () {
                                                            return $.when(self.first_install('sale.order')).then(function () {
                                                                return $.when(self.first_install('sale.order.line')).then(function () {
                                                                    return true;
                                                                })
                                                            })
                                                        })
                                                    })
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        }
                    }).fail(function (type, error) {
                        return self.pos.query_backend_fail(type, error);
                    });
                }
            }).then(function () {
                self.save_parameter_models_load();
                if (self.config.keyboard_new_order) { // keyboard
                    hotkeys(self.config.keyboard_new_order, function (event, handler) {
                        self.add_new_order();
                    });
                }
                if (self.config.keyboard_remove_order) { // keyboard
                    hotkeys(self.config.keyboard_remove_order, function (event, handler) {
                        var order = self.get_order();
                        if (!order) {
                            return;
                        } else if (!order.is_empty()) {
                            self.gui.show_popup('confirm', {
                                'title': _t('Destroy Current Order ?'),
                                'body': _t('You will lose any data associated with the current order'),
                                confirm: function () {
                                    self.delete_current_order();
                                },
                            });
                        } else {
                            self.delete_current_order();
                        }
                    });
                }
                setTimeout(function () {
                    self.auto_update_caches();
                }, 30000);
                return rpc.query({
                    model: 'pos.config',
                    method: 'search_read',
                    domain: [['user_id', '!=', null]],
                    fields: [],
                }).then(function (configs) {
                    self.config_by_id = {};
                    self.configs = configs;
                    for (var i = 0; i < configs.length; i++) {
                        var config = configs[i];
                        self.config_by_id[config['id']] = config;
                    }
                    ;
                    if (self.config_id) {
                        var config = _.find(configs, function (config) {
                            return config['id'] == self.config_id
                        })
                        if (config) {
                            var user = self.user_by_id[config.user_id[0]]
                            if (user) {
                                self.set_cashier(user);
                            }
                        }
                    }
                });
            })
        }
    });
});
