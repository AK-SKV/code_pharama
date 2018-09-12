odoo.define("pos_order_line.models", function (require) {
    "use strict";

    var screens = require("point_of_sale.screens");
    var popups = require("point_of_sale.popups");
    var models = require('point_of_sale.models');
    var module = require('point_of_sale.models');
    var chrome = require('point_of_sale.chrome');
    var gui = require('point_of_sale.gui');
    var PosDB = require("point_of_sale.DB");
    var PosBaseWidget = require('point_of_sale.BaseWidget');

    var core = require('web.core');
    var utils = require('web.utils');

    var QWeb = core.qweb;
    var _t = core._t;

    models.load_fields(
        "pos.order.line",
        ['pharmacy_product_type', 'every_uom', 'dosage_every', 'dosage_uom', 'dosage']
    );


});