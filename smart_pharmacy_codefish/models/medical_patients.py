# -*- coding: utf-8 -*-
#  Copyright (C) 2004-2018 CodeFish (<http://www.codefish.com.eg>).
#  Copyright 2018 CodeFish
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

import datetime
from datetime import timedelta
import logging
import pytz
from odoo import api, fields, models, _
from odoo.exceptions import UserError
from odoo.tools.translate import _


class MedicalPartner(models.Model):
    _name = 'res.partner'
    _inherit = 'res.partner'
    _description = 'Partner'

    FAMILY_RELATION = [
                ('Father', 'Father'),
                ('Mother', 'Mother'),
                ('Brother', 'Brother'),
                ('Sister', 'Sister'),
                ('Wife', 'Wife'),
                ('Husband', 'Husband'),
                ('Grand Father', 'Grand Father'),
                ('Grand Mother', 'Grand Mother'),
                ('Aunt', 'Aunt'),
                ('Uncle', 'Uncle'),
                ('Nephew', 'Nephew'),
                ('Niece', 'Niece'),
                ('Cousin', 'Cousin'),
                ('Relative', 'Relative'),
                ('Other', 'Other'),
    ]

    @api.model
    def _get_default_country(self):
        country = self.env['res.country'].search([('code', '=', 'EG')], limit=1)
        return country

    relation = fields.Selection(FAMILY_RELATION, string="Family Relation")
    is_patient = fields.Boolean(string='Patient', help='Check if the party is a patient')
    country_id = fields.Many2one(default=_get_default_country)
    prescriptions_line = fields.One2many('pos.order.line', 'order_partner_id', 'Medications')


class MedicalPatient(models.Model):
    _name = 'medical.patient'
    _inherits = {
        'res.partner': 'partner_id',
    }

    MARITAL_STATUS = [
        ('Single', 'Single'),
        ('Married', 'Married'),
        ('Widowed', 'Widowed'),
        ('Divorced', 'Divorced'),
        ('Separated', 'Separated'),
    ]

    SEX = [
        ('male', 'Male'),
        ('female', 'Female'),
    ]

    BLOOD_TYPE = [
        ('A', 'A'),
        ('B', 'B'),
        ('AB', 'AB'),
        ('O', 'O'),
    ]

    RH = [
        ('+','+'),
        ('-','-'),
    ]

    @api.multi
    def _patient_age(self):
        def compute_age_from_dates(patient_dob, patient_deceased, patient_dod):
            now = datetime.datetime.now()
            if (patient_dob):
                dob = datetime.datetime.strptime(patient_dob, '%Y-%m-%d')
                if patient_deceased:
                    dod = datetime.datetime.strptime(patient_dod, '%Y-%m-%d')
                    delta = dod - dob
                    deceased = " (deceased)"
                    years_months_days = str(delta.days // 365) + " years " + str(delta.days % 365) + " days" + deceased
                else:
                    delta = now - dob
                    years_months_days = str(delta.days // 365) + " years " + str(delta.days % 365) + " days"
            else:
                years_months_days = "No DoB !"

            return years_months_days

        for patient_data in self:
            patient_data.age = compute_age_from_dates(patient_data.dob, patient_data.deceased, patient_data.dod)
        return True

    partner_id = fields.Many2one('res.partner', string='Related Partner', required=True, ondelete='cascade',
                                 help='Partner-related data of the patient')
    dob = fields.Date(string='Date of Birth')
    age = fields.Char(compute=_patient_age, size=32, string='Patient Age',
                      help="It shows the age of the patient in years(y), months(m) and days(d).\nIf the patient has"
                           " died, the age shown is the age at time of death, the age corresponding to the date on the"
                           " death certificate. It will show also \"deceased\" on the field")
    sex = fields.Selection(SEX, string='Sex', index=True)
    marital_status = fields.Selection(MARITAL_STATUS, string='Marital Status')
    blood_type = fields.Selection(BLOOD_TYPE, string='Blood Type')
    rh = fields.Selection(RH, string='Rh')
    deceased = fields.Boolean(string='Patient Deceased ?', help="Mark if the patient has died")
    dod = fields.Date(string='Date of Death')
    patient_user_id = fields.Many2one('res.users', string='Existing Partner')

    _sql_constraints = [
        ('code_patient_userid_uniq', 'unique (patient_user_id)',
         "Selected 'Responsible' user is already assigned to another patient !")
    ]

    @api.model
    def create(self, vals):
        vals['is_patient'] = True
        health_patient = super(MedicalPatient, self).create(vals)
        return health_patient

    @api.multi
    def onchange_state(self, state_id):
        if state_id:
            state = self.env['res.country.state'].browse(state_id)
            return {'value': {'country_id': state.country_id.id}}
        return {}


