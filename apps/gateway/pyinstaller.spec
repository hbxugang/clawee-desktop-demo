from PyInstaller.utils.hooks import collect_submodules

hiddenimports = collect_submodules("uvicorn")

a = Analysis(["app/main.py"], hiddenimports=hiddenimports)
pyz = PYZ(a.pure)
exe = EXE(pyz, a.scripts, name="clawee-desktop-demo-gateway", console=True)
