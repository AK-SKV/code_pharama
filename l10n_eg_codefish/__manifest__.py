# -*- encoding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': 'Egypt Accounting - CodeFish',
    'version': '10.0.0.2',
    'author': 'CodeFish',
    'category': 'Localization',
    'description': """
    Arabic Chart of accounts for Egypt and other Arabic countries .
        - Using IFRS coding system 
            Assets,
            Liabilities,
            Equity,
            Income,
            Cost of Goods,
            Expenses,
            Other Income,
            Undistributed Profits/Losses
        
        - List for most common expenses items and link it to expenses accounts in chart of accounts 
            Advertising and Promotion,
            Automobile Expense,
            Bank Service Charges,
            Business Licenses and Permits,
            Charitable Contributions,
            Computer and Internet Expenses,
            Continuing Education,
            Depreciation Expense,
            Dues and Subscriptions,
            Equipment Rental,
            Gasoline, Fuel and Oil,
            Interest Expense,
            Marketing Expense,
            Meals and Entertainment,
            Office Supplies,
            Payroll Expenses,
            Postage and Delivery,
            Printing and Reproduction,
            Professional Fees,
            Rent Expense,
            Repairs and Maintenance,
            Taxes - Property,
            Telephone Expense,
            Travel Expense,
            Utilities,
            Miscellaneous Expense,
            General Liability Insurance,
            Health Insurance,
            Life and Disability Insurance,
            Professional Liability,
            Worker's Compensation
            
        - Translate chart of accounts in arabic language
        
        for support : info@codefish.com.eg     
    
""",
    'website': 'http://www.codefish.com.eg',
    'depends': ['account', 'l10n_multilang','account_parent','hr_expense'],
    'data': [
        'data/chart_template_data.xml',
        'data/account.account.template.csv',
        'data/chart_data.xml',
        'data/chart_template_data.yml',
        'data/product.template.csv',
    ],
    "images": [
        'static/description/banner.png'
    ],
    'post_init_hook': 'load_translations',
    'installable': True,

}
