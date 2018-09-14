# -*- coding: utf-8 -*-
from openerp.addons.web.controllers.main import WebClient, http

class FixMomentLocale(WebClient):
    @http.route()
    def load_locale(self, lang):
        if lang.startswith('ar_EG'):
            lang = 'ar_EG'
        return super(FixMomentLocale, self).load_locale(lang)
