from PyInstaller.utils.hooks import collect_submodules

hiddenimports = collect_submodules("uvicorn")

a = Analysis(["app/desktop_entry.py"], hiddenimports=hiddenimports)
pyz = PYZ(a.pure)
exe = EXE(pyz, a.scripts, a.binaries, a.datas, name="clawee-desktop-demo-gateway", console=True)
