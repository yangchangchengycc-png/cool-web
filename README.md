# cool-web

斑驳树影（Komorebi）风格的个人作品集网站。纯静态页面，可直接部署到 GitHub Pages 在线访问。

## 当前效果

- 椭圆光斑、右上向左下斜射，带透视与发光感
- 树影随风摆动；鼠标在页面内时主光斑跟随，其余光斑联动
- 作品名浅灰，仅在亮区显示，阴影内完全隐藏
- 前景丁达尔光束 + 微尘粒子（画面最前层）

## 项目文件

```
web design/
├── index.html      # 页面结构与文案
├── styles.css      # 排版与布局
├── main.js         # Canvas 光影、文字遮罩、丁达尔效果
├── README.md       # 说明文档
└── .gitignore
```

无需 npm、无需构建。字体通过 Google Fonts 加载（**线上访问需联网**）。

---

## 一、本地预览（可选）

```bash
cd "/Users/yangchangcheng/Desktop/web design"
python3 -m http.server 8765
```

浏览器打开：http://localhost:8765

---

## 二、部署到 GitHub Pages（完整步骤）

### 第 1 步：注册 / 登录 GitHub

1. 打开 https://github.com
2. 注册账号或登录

### 第 2 步：在 GitHub 上新建仓库

1. 点击右上角 **+** → **New repository**
2. 填写：
   - **Repository name**：例如 `komorebi-portfolio`（英文、无空格）
   - **Public**（公开，Pages 免费）
   - **不要**勾选 "Add a README"（本地已有文件）
3. 点击 **Create repository**
4. 记下仓库地址，形如：
   ```
   https://github.com/你的用户名/komorebi-portfolio.git
   ```

### 第 3 步：在电脑上推送代码

打开终端（Terminal），依次执行（把用户名和仓库名换成你的）：

```bash
cd "/Users/yangchangcheng/Desktop/web design"

git init

git add index.html styles.css main.js README.md .gitignore

git commit -m "Add komorebi portfolio with tyndall effect"

git branch -M main

git remote add origin https://github.com/你的用户名/komorebi-portfolio.git

git push -u origin main
```

首次 `git push` 时：

- 可能弹出浏览器让你登录 GitHub 授权
- 或使用 [Personal Access Token](https://github.com/settings/tokens) 作为密码

### 第 4 步：开启 GitHub Pages

1. 打开你的仓库页面
2. 顶部 **Settings**（设置）
3. 左侧 **Pages**
4. **Build and deployment** → **Source** 选 **Deploy from a branch**
5. **Branch** 选 `main`，文件夹选 **/ (root)**
6. 点击 **Save**

### 第 5 步：访问线上网站

等待 **1～3 分钟**，刷新 Pages 页面，会显示：

```
Your site is live at https://你的用户名.github.io/komorebi-portfolio/
```

在浏览器打开该链接即可。

> 若仓库名是 `你的用户名.github.io`，则地址为 `https://你的用户名.github.io/`（无子路径）。

---

## 三、之后更新网站

改完 `index.html` / `styles.css` / `main.js` 后：

```bash
cd "/Users/yangchangcheng/Desktop/web design"
git add .
git commit -m "Update portfolio"
git push
```

约 1 分钟后线上自动更新。

---

## 四、自定义内容

编辑 `index.html`：

| 位置 | 说明 |
|------|------|
| `.header__name` | 你的名字 |
| `.header__role` | 职业描述 |
| `.project__title` | 作品名称 |
| `.project__meta` | 类型与年份 |
| `.project__link` 的 `href` | 作品链接 |
| `.about p` | 简介 |
| `.contact a` | 邮箱 |

---

## 五、常见问题

**打开 Pages 链接是 404**

- 确认 `main` 分支根目录有 `index.html`
- 刚开启 Pages 后多等几分钟

**光影 / 字体不显示**

- 需联网加载 Google Fonts
- 使用 Chrome / Safari / Firefox 等现代浏览器

**git push 失败**

- 检查 `remote` 地址是否正确：`git remote -v`
- 确认已登录 GitHub 或有有效 Token

---

## 许可

可自由修改用于个人作品集。字体遵循 [Google Fonts](https://fonts.google.com/) 使用条款。
