# -*- coding: utf-8 -*-
#  Copyright (C) 2004-2018 CodeFish (<http://www.codefish.com.eg>).
#  Copyright 2018 CodeFish
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

from odoo import fields, models, api


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    PHARMACY_TYPE = [
        ('medical', 'Medical Product'),
        ('none_medical', 'None Medical Product'),
    ]
    PRODUCT_ORIGIN = [
        ('Local', 'Local'),
        ('Import', 'Import'),
    ]

    is_pharmacy = fields.Boolean('Pharmacy Product')
    generic_name = fields.Char(string='Generic Name')
    manufacture = fields.Many2one('res.partner', string='Manufacture')
    origin = fields.Selection(PRODUCT_ORIGIN, string='Origin',
                              help='Import: Made outside of Egypt; Local: Made in Egypt', index=True)
    form = fields.Many2one('medical_form', string='Form')

    disease = fields.Many2many('disease', string='Disease')
    formulations_and_content = fields.One2many('formulations_and_content', 'product_id',
                                               string='Formulations and Content')
    tracking = fields.Selection(default='lot')
    type = fields.Selection(default='product')
    dosage = fields.Float('Dosage')
    dosage_uom = fields.Many2one('product.uom', string='Dosage Unite')
    dosage_every = fields.Float('Every')
    every_uom = fields.Many2one('product.uom', strin='Every Time')
    pharmacy_product_type = fields.Selection(PHARMACY_TYPE, string="Type", default='medical')
    alert_time = fields.Integer(default='180')
    removal_time = fields.Integer(default='7')


class FormulationsType(models.Model):
    _name = 'formulations_type'

    name = fields.Char('Type')


class MedicalForm(models.Model):
    _name = 'medical_form'

    name = fields.Char('Form')


class DiseaseCategories(models.Model):
    _name = 'disease_categories'

    name = fields.Char('Disease Categories')
    parent_category = fields.Many2one('disease_categories', string='Parent Category')


class Disease(models.Model):
    _name = 'disease'

    name = fields.Char('Name')
    affected_chromosome = fields.Char('Affected Chromosome')
    code = fields.Char('Code')
    disease_category = fields.Many2one('disease_categories', string='Category')
    extra_Info = fields.Text('Extra Info')
    gene = fields.Char('Gene')
    protein_involved = fields.Char('Protein involved')


class FormulationsAndContent(models.Model):
    _name = 'formulations_and_content'

    content = fields.Float('Content')
    formulations_type = fields.Many2one('formulations_type', string='Formulations')
    product_id = fields.Many2one('product.template', string='Product')
    uom_id = fields.Many2one('product.uom', string='Unit of Measure')
