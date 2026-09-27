# 郭建华作品网站 · V1.0

基于原 `index-v2.html`：深色极光、粒子聚字、横向滚动大字、作品卡片与联系区。
此仓库只包含该版本及所需静态资源。没有 Node 安装步骤，不依赖外部 CDN。

- 网站：https://jianhuaguo798-cyber.github.io/jianhua-portfolio/
- 代码：https://github.com/jianhuaguo798-cyber/jianhua-portfolio
- PDF：https://jianhuaguo798-cyber.github.io/jianhua-portfolio/downloads/portfolio.pdf

## 本地预览

```sh
git clone https://github.com/jianhuaguo798-cyber/jianhua-portfolio.git
cd jianhua-portfolio
python3 -m http.server 8000 --bind 127.0.0.1
```

打开 http://127.0.0.1:8000 。

## 修改与发布

- `index.html`：姓名、介绍、作品与下载按钮。
- `assets/css/style.css`：基础样式。
- `assets/css/style-v2.css`：原方案 2 视觉。
- `assets/css/release.css`：V1.0 下载按钮、移动端等少量增补。
- `assets/js/main-v2.js`：入场、横向滚动文字与交互编排。
- `assets/js/fx-*.js`：粒子、极光与波纹效果。
- `downloads/portfolio.pdf`：作品集。当前为明确标注的单页演示 PDF。

替换正式作品集时，直接覆盖 `downloads/portfolio.pdf`，并在 `index.html` 中去掉“演示”提示和下载文件名的“演示”字样。原页面中的案例内容仍标为示例，发布真实案例时替换。

```sh
git pull --ff-only
# 修改文件后：
python3 scripts/check_site.py
git add index.html assets downloads
git commit -m "Update portfolio"
git push origin main
```

GitHub Pages 会在推送后自动发布静态资源。首次在仓库 Settings → Pages → Source 选择 Deploy from a branch，分支选 `main`，目录选 `/ (root)`。不需要自定义 Actions 工作流。免费个人账号使用公开仓库；网站和发布的 PDF 会公开可访问。

`main` 保存最新版本，`v1.0.0` 标签保存首发版本。查看历史版本：`git switch --detach v1.0.0`。继续开发：`git switch main`。

## 校验

提交前运行 `python3 scripts/check_site.py` 检查本地资源、锚点和 PDF 文件头，不需要安装依赖。

示例 PDF 的生成脚本为 `scripts/create_demo_pdf.py`，只有重新生成示例时才需要 `reportlab`。

## 匿名访问统计（待配置）

浏览及下载点击事件的接入已准备，配置 Clarity 项目 ID 后生效。配置前不会收集或发送数据。项目创建、查看记录、事件含义以及排除自己的访问，见 [统计说明](docs/analytics.md)。

开发校验：`node scripts/check_analytics.mjs`。本地事件预览使用 `?analytics=debug`，不会发送数据。

## 第三方库

保留本地 vendor 文件原始版权注释：GSAP、ScrollTrigger、Lenis。网站代码与下载文件由仓库维护者管理。
