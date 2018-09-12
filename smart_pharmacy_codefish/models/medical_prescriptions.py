# -*- coding: utf-8 -*-
#  Copyright (C) 2004-2018 CodeFish (<http://www.codefish.com.eg>).
#  Copyright 2018 CodeFish
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

from odoo import fields, models, api


class PosOrderLine(models.Model):
    _inherit = 'pos.order.line'

    PHARMACY_TYPE = [
        ('medical', 'Medical Product'),
        ('none_medical', 'None Medical Product'),
    ]

    dosage = fields.Float('Dosage', related='product_id.dosage')
    dosage_uom = fields.Many2one('product.uom', string='Dosage Unite', related='product_id.dosage_uom')
    dosage_every = fields.Float('Every', related='product_id.dosage_every')
    every_uom = fields.Many2one('product.uom', strin='Every Time', related='product_id.every_uom')
    order_partner_id = fields.Many2one('res.partner', 'Patient', related='order_id.partner_id')
    pharmacy_product_type = fields.Selection(PHARMACY_TYPE, string="Type", default='medical',
                                             related='product_id.pharmacy_product_type')
