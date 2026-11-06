import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def page(path,title,body='<div id="page"></div>',crumbs=None,js=(),init='',shell='admin',head_title=None):
    depth=path.count('/'); up='../'*depth
    ht=head_title or title
    css=''.join(f'<link rel="stylesheet" href="{up}assets/css/{c}.css">' for c in ['tokens','base','layout','components','pages'])
    scripts=''.join(f'<script src="{up}assets/js/{s}.js"></script>' for s in ['core','data','charts','ui']+list(js))
    boot=f'<script>Core.boot(async()=>{{{init}}});</script>'
    if shell=='admin':
        crumb=f'<div data-component="layout/page-header" data-title="{title}" data-crumbs="{crumbs or "صفحات|"+title}"></div>'
        inner=f'<div class="app"><div data-component="layout/sidebar"></div><div class="main"><div data-component="layout/header"></div><main class="content">{crumb}{body}</main><div data-component="layout/footer"></div></div></div>'
    elif shell=='shop':
        inner=f'<div data-component="layout/shop-header"></div><main class="shop-wrap">{body}</main><div data-component="layout/shop-footer"></div>'
    else: inner=body
    html=f'<!doctype html>\n<html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{ht} | میرون</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700&display=swap">{css}</head>\n<body>\n{inner}\n{scripts}\n{"".join(f"<script src=\"{up}assets/js/{s}.js\"></script>" for s in [])}{boot}\n</body></html>\n'
    p=os.path.join(ROOT,path); os.makedirs(os.path.dirname(p),exist_ok=True); open(p,'w',encoding='utf-8').write(html)
