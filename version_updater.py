import json
import os
import re
import tkinter as tk
from tkinter import messagebox

BUILD_GRADLE = "android/app/build.gradle"
METADATA_JSON = "metadata.json"

class VersionUpdater:
    def __init__(self, root):
        self.root = root
        self.root.title("📱 Version Updater - Gonzalbe")
        self.root.geometry("400x300")
        self.root.configure(bg="#0f172a")
        self._build_ui()

    def _build_ui(self):
        BG, ACC = "#0f172a", "#06b6d4"
        
        tk.Label(self.root, text="📱 Actualizar Versión del APK", bg=BG, fg=ACC, 
                 font=("Segoe UI", 14, "bold")).pack(pady=20)

        tk.Label(self.root, text="Versión actual:", bg=BG, fg="white", font=("Segoe UI", 11)).pack()
        
        self.current_info = tk.Label(self.root, text="Cargando...", bg=BG, fg="#fde047", font=("Segoe UI", 12))
        self.current_info.pack(pady=10)
        
        self.new_version = tk.StringVar(value="1.1")
        tk.Label(self.root, text="Nueva versión (versionName):", bg=BG, fg="white", font=("Segoe UI", 10)).pack(pady=(20,5))
        tk.Entry(self.root, textvariable=self.new_version, font=("Segoe UI", 11), justify="center", width=15).pack()
        
        self.increment_code = tk.BooleanVar(value=True)
        tk.Checkbutton(self.root, text="Auto-incrementar versionCode (+1)", variable=self.increment_code, 
                       bg=BG, fg="white", selectcolor=BG, font=("Segoe UI", 10)).pack(pady=10)
        
        tk.Button(self.root, text="✅ Actualizar Versión", bg=ACC, fg="white", font=("Segoe UI", 11, "bold"),
                  command=self._update_version, width=20, height=2).pack(pady=20)
        
        self._load_current_version()

    def _load_current_version(self):
        try:
            with open(BUILD_GRADLE, "r") as f:
                content = f.read()
            
            version_code = re.search(r'versionCode\s+(\d+)', content)
            version_name = re.search(r'versionName\s+"([^"]+)"', content)
            
            code = version_code.group(1) if version_code else "?"
            name = version_name.group(1) if version_name else "?"
            
            self.current_info.config(text=f"versionCode: {code} | versionName: {name}")
        except Exception as e:
            self.current_info.config(text=f"Error: {e}")

    def _update_version(self):
        new_name = self.new_version.get().strip()
        if not new_name:
            messagebox.showerror("Error", "Ingresa una versión")
            return
        
        try:
            with open(BUILD_GRADLE, "r") as f:
                content = f.read()
            
            current_code = int(re.search(r'versionCode\s+(\d+)', content).group(1))
            new_code = current_code + 1 if self.increment_code.get() else current_code
            
            content = re.sub(r'versionCode\s+\d+', f'versionCode {new_code}', content)
            content = re.sub(r'versionName\s+"[^"]+"', f'versionName "{new_name}"', content)
            
            with open(BUILD_GRADLE, "w") as f:
                f.write(content)
            
            messagebox.showinfo("✅ Listo", f"Versión actualizada:\nversionCode: {new_code}\nversionName: {new_name}")
            self._load_current_version()
            
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo actualizar: {e}")

if __name__ == "__main__":
    root = tk.Tk()
    app = VersionUpdater(root)
    root.mainloop()