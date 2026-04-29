import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import subprocess, os, shutil, json, urllib.request, urllib.error
from pathlib import Path

def gh_api(method, endpoint, token, data=None):
    url = f"https://api.github.com{endpoint}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("Authorization", f"token {token}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("Content-Type", "application/json")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    try:
        with urllib.request.urlopen(req) as r:
            body = r.read()
            return r.status, json.loads(body) if body.strip() else {}
    except urllib.error.HTTPError as e:
        body = e.read()
        return e.code, json.loads(body) if body.strip() else {}

class GitHubUploader:
    def __init__(self, root):
        self.root = root
        self.root.title("📤 GitHub Uploader")
        self.root.geometry("700x600")
        self.root.configure(bg="#0f172a")
        self._build_ui()

    def _build_ui(self):
        BG, BG2, FG = "#0f172a", "#1e293b", "#e2e8f0"
        ACC, BTN = "#06b6d4", "#0e7490"
        P = dict(padx=12, pady=5)

        style = ttk.Style(self.root)
        style.theme_use("clam")
        style.configure("TLabel", background=BG, foreground=FG, font=("Segoe UI", 10))
        style.configure("TEntry", fieldbackground=BG2, foreground=FG, insertcolor=FG)
        style.configure("H.TLabel", background=BG, foreground=ACC, font=("Segoe UI", 10, "bold"))
        style.configure("Btn.TButton", background=BTN, foreground="white", font=("Segoe UI", 11, "bold"), padding=8)

        tk.Label(self.root, text="📤 GitHub Uploader", bg=BG, fg=ACC, font=("Segoe UI", 16, "bold")).pack(pady=(14, 0))
        tk.Label(self.root, text="Sube o actualiza proyectos en GitHub", bg=BG, fg="#94a3b8", font=("Segoe UI", 9)).pack(pady=(2, 10))

        frm = tk.Frame(self.root, bg=BG)
        frm.pack(fill="x", padx=20)
        frm.columnconfigure(1, weight=1)

        tk.Label(frm, text="── DATOS ───────────────────────────────", bg=BG, fg=ACC, font=("Segoe UI", 10, "bold")).grid(row=0, column=0, columnspan=3, sticky="w", pady=(8,2))

        ttk.Label(frm, text="📁 Carpeta del proyecto:").grid(row=1, column=0, sticky="w", **P)
        script_dir = os.path.dirname(os.path.abspath(__file__))
        self.v_path = tk.StringVar(value=script_dir)
        ttk.Entry(frm, textvariable=self.v_path, width=50).grid(row=1, column=1, sticky="ew", **P)
        tk.Button(frm, text="…", bg=BG2, fg=FG, relief="flat", command=self._browse).grid(row=1, column=2, padx=4)

        ttk.Label(frm, text="👤 Usuario GitHub:").grid(row=2, column=0, sticky="w", **P)
        self.v_user = tk.StringVar(value="elabordepozo")
        ttk.Entry(frm, textvariable=self.v_user, width=50).grid(row=2, column=1, sticky="ew", **P)

        ttk.Label(frm, text="📦 Nombre del repo:").grid(row=3, column=0, sticky="w", **P)
        self.v_repo = tk.StringVar()
        ttk.Entry(frm, textvariable=self.v_repo, width=50).grid(row=3, column=1, sticky="ew", **P)

        ttk.Label(frm, text="🔑 Token GitHub:").grid(row=4, column=0, sticky="w", **P)
        self.v_token = tk.StringVar()
        self.e_token = ttk.Entry(frm, textvariable=self.v_token, width=50, show="•")
        self.e_token.grid(row=4, column=1, sticky="ew", **P)
        self.v_show = tk.BooleanVar()
        ttk.Checkbutton(frm, text="Ver", variable=self.v_show, command=lambda: self.e_token.config(show="" if self.v_show.get() else "•")).grid(row=4, column=2, padx=4)

        ttk.Label(frm, text="💬 Commit:").grid(row=5, column=0, sticky="w", **P)
        self.v_msg = tk.StringVar(value="actualización")
        ttk.Entry(frm, textvariable=self.v_msg, width=50).grid(row=5, column=1, sticky="ew", **P)

        ttk.Label(frm, text="📂 Rama:").grid(row=6, column=0, sticky="w", **P)
        self.v_branch = tk.StringVar(value="main")
        ttk.Entry(frm, textvariable=self.v_branch, width=20).grid(row=6, column=1, sticky="w", padx=12, pady=2)

        btn_f = tk.Frame(self.root, bg=BG)
        btn_f.pack(pady=10)
        self.btn = ttk.Button(btn_f, text="  🚀 SUBIR A GITHUB  ", style="Btn.TButton", command=self._start)
        self.btn.pack(side="left", padx=8)

        self.bar = ttk.Progressbar(self.root, mode="indeterminate", length=680)
        self.bar.pack(padx=20, pady=(0,4))

        tk.Label(self.root, text="📋 Log:", bg=BG, fg=ACC, font=("Segoe UI", 10, "bold")).pack(anchor="w", padx=20)
        self.log = scrolledtext.ScrolledText(self.root, height=15, bg="#020617", fg="#a3e635", font=("Consolas", 9), relief="flat", bd=0)
        self.log.pack(fill="both", expand=True, padx=20, pady=(0,14))
        self.log.tag_config("ok", foreground="#86efac")
        self.log.tag_config("err", foreground="#f87171")
        self.log.tag_config("info", foreground="#7dd3fc")

    def _browse(self):
        d = filedialog.askdirectory()
        if d: self.v_path.set(d)

    def _w(self, msg, tag=""):
        self.log.insert("end", msg + "\n", tag)
        self.log.see("end")
        self.root.update_idletasks()

    def _start(self):
        errs = []
        if not os.path.isdir(self.v_path.get().strip()):
            errs.append("• La carpeta del proyecto no existe.")
        if not self.v_user.get().strip():
            errs.append("• Ingresa tu usuario de GitHub.")
        if not self.v_repo.get().strip():
            errs.append("• Ingresa el nombre del repositorio.")
        if not self.v_token.get().strip():
            errs.append("• Ingresa tu token de GitHub.")
        if errs:
            messagebox.showerror("Faltan datos", "\n".join(errs))
            return
        self.btn.config(state="disabled")
        self.bar.start(10)
        self._task()

    def _run(self, cmd, cwd):
        self._w(f"  $ {' '.join(cmd)}", "info")
        proc = subprocess.Popen(cmd, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace", shell=(os.name == "nt"))
        for line in proc.stdout:
            line = line.rstrip()
            if line:
                tag = "err" if any(w in line.lower() for w in ("error", "failed", "fatal")) else ""
                self._w(f"  {line}", tag)
        proc.wait()
        if proc.returncode != 0:
            raise RuntimeError(f"Comando falló con código {proc.returncode}")

    def _task(self):
        path = self.v_path.get().strip()
        user = self.v_user.get().strip()
        repo = self.v_repo.get().strip()
        token = self.v_token.get().strip()
        msg = self.v_msg.get().strip() or "actualización"
        branch = self.v_branch.get().strip() or "main"
        full = f"{user}/{repo}"
        remote_url = f"https://oauth2:{token}@github.com/{full}.git"

        try:
            self._w("═" * 50, "info")
            self._w(f"🚀 Subiendo a {full} (rama: {branch})", "info")
            self._w("═" * 50, "info")

            is_new_repo = False
            s, _ = gh_api("GET", f"/repos/{full}", token)
            if s != 200:
                self._w(f"📦 Creando repositorio '{repo}'...", "info")
                s2, d2 = gh_api("POST", "/user/repos", token, {"name": repo, "private": False, "auto_init": True})
                if s2 not in (200, 201):
                    raise Exception(f"No se pudo crear el repo: {d2.get('message', s2)}")
                self._w(f"✔ Repositorio creado", "ok")
                is_new_repo = True
            else:
                self._w(f"ℹ Usando repositorio existente", "info")

            git_dir = os.path.join(path, ".git")
            if not os.path.exists(git_dir):
                self._w("🔧 Inicializando Git...", "info")
                self._run(["git", "init"], cwd=path)
                self._run(["git", "remote", "add", "origin", remote_url], cwd=path)

            self._run(["git", "config", "user.email", "deploy@script.local"], cwd=path)
            self._run(["git", "config", "user.name", user], cwd=path)

            if is_new_repo:
                self._run(["git", "add", "-A"], cwd=path)
                self._run(["git", "commit", "-m", msg], cwd=path)
                self._run(["git", "push", "-u", "origin", branch], cwd=path)
            else:
                self._run(["git", "fetch", "origin"], cwd=path)
                local_refs = subprocess.run(["git", "show-ref", "--heads"], cwd=path, capture_output=True, text=True, shell=(os.name == "nt"))
                has_local_branch = branch in local_refs.stdout

                if has_local_branch:
                    self._w(f"📥 Pull de rama '{branch}'...", "info")
                    self._run(["git", "pull", "origin", branch, "--allow-unrelated-histories"], cwd=path)
                else:
                    self._w(f"🌿 Creando rama local '{branch}'...", "info")
                    try:
                        self._run(["git", "checkout", "-b", branch], cwd=path)
                    except:
                        self._run(["git", "checkout", "-b", branch], cwd=path)

                self._run(["git", "add", "-A"], cwd=path)
                result = subprocess.run(["git", "status", "--porcelain"], cwd=path, capture_output=True, text=True, shell=(os.name == "nt"))
                if not result.stdout.strip():
                    self._w("ℹ No hay cambios para subir", "info")
                else:
                    self._run(["git", "commit", "-m", msg], cwd=path)
                    self._run(["git", "push", "-u", "origin", branch], cwd=path)

            self._w("\n" + "═" * 50, "ok")
            self._w(f"✅ SUBIDO A: https://github.com/{full}", "ok")
            self._w("═" * 50, "ok")

        except Exception as e:
            self._w(f"\n❌ ERROR: {e}", "err")
        finally:
            self.root.after(0, lambda: (self.bar.stop(), self.btn.config(state="normal")))

if __name__ == "__main__":
    root = tk.Tk()
    app = GitHubUploader(root)
    root.mainloop()