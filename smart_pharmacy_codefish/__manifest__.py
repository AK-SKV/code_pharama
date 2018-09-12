
{
    'name': "Dental Lab",

    'summary': """
        Simpal Module for Dental Lab
        """,

    'description': """
       Simpal Module for Dental Lab
    """,

    'author': "CodeFish",
    'website': "http://www.codefish.com.eg",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/master/odoo/addons/base/module/module_data.xml
    # for the full list
    'category': 'Sales',
    'version': '10.0.2',

    # any module necessary for this one to work correctly
    'depends': ['sale',
                'product',
                'stock',
                'web_tree_image',
                'point_of_sale',
                'product_expiry'
                ],

    # always loaded
    'data': [
        # 'security/ir.model.access.csv',
        'views/medical_product.xml',
        'views/medical_patients.xml',
        'views/medical_prescriptions.xml',
        'views/product_template.xml',
        'security/ir.model.access.csv'

    ],
    'qweb': [
        'static/src/xml/product.xml'
    ],
    # only loaded in demonstration mode
    'demo': [
        'demo/demo.xml',
    ],
    "images": [
        'static/description/banner.png'
    ],
}
