# 匿名访问统计

项目：`yq9s1l0wx6`，已配置到 `assets/js/analytics-config.js`。后台：https://clarity.microsoft.com/projects/view/yq9s1l0wx6/ 。仅在正式域名、访客明确允许统计后加载第三方脚本。首次部署后的后台收数仍需在 Clarity 核验。

## 接通

1. 在 https://clarity.microsoft.com/ 使用你自己的账号创建项目。
2. 项目名称：郭建华作品集。网址：https://jianhuaguo798-cyber.github.io/jianhua-portfolio/ 。
3. 在 Settings → Setup / Installation 取得 Project ID（跟踪代码 `https://www.clarity.ms/tag/` 后面的标识）。它是公开项目标识，不是密码或管理密钥。
4. 填入 `analytics-config.js` 的 `projectId`。在 Clarity 隐私设置中启用要求 Cookie 同意；广告存储始终设为 denied。
5. 提交和推送；用一个未被排除的浏览器允许统计，浏览作品并点击下载。
6. 在 Clarity 的 Dashboard / Recordings 中确认收到访问；数据可能不是即时出现。

## 能看到什么

Clarity 提供匿名用户和会话编号、访问时间、来源、设备、浏览时长、滚动点击的会话回放。不会知道真实姓名；换设备、清除 Cookie、无痕窗口可能被识别为不同访客。它仍是使用设备标识的统计，并非保证无法关联的完全匿名化数据。

访客只有明确选择“允许匿名统计”后才加载 Clarity。未选择、拒绝、浏览器发送 DNT/GPC 或站主排除的访问不参与统计。广告拦截工具或网络异常也会造成遗漏，不能把记录当作完整访问审计。

## 本站事件

| 事件 | 含义 |
| --- | --- |
| portfolio_visit | 同意统计后进入页面 |
| view_hero | 首屏可见达到 2 秒 |
| view_works | 作品区可见达到 2 秒 |
| view_about | 关于区可见达到 2 秒 |
| view_contact | 联系区可见达到 2 秒 |
| view_project_smart_home | 智能家居项目卡片可见达到 2 秒 |
| view_project_shanhai | 山海品牌项目卡片可见达到 2 秒 |
| view_project_3d_film | 3D 短片卡片可见达到 2 秒 |
| view_project_data_web | 数据网站卡片可见达到 2 秒 |
| active_30s / active_60s / active_120s / active_300s | 达到有效浏览时长档位 |
| portfolio_download_click | 点击下载链接；并非文件保存完成 |
| contact_email_click | 点击邮箱联系；并非已发送邮件 |

浏览曝光按元素可显示区域至少 50% 可见、页面获得焦点且非隐藏状态、连续达到 2 秒计算。加载动画期间及超过 45 秒未操作不累计。每个区块/项目每次页面加载最多一条曝光事件；下载点击可重复。

自定义标签：`content_viewed`、`download_entry`（header / hero / footer）、`download_file`（portfolio_demo_v1）、`portfolio_version`。Clarity 标签用于会话筛选，事件用于查看发生顺序。字段仅使用预先定义的标识，不发送用户姓名、邮箱或原始链接作为自定义参数。

进入 Recordings 筛选 `portfolio_download_click`，可以看有下载意向的访问；筛选 `view_project_smart_home`，可以看浏览过该项目的访问。点击记录查看事件时间线与页面回放。

## 排除自己的访问

在你用于调试的网站浏览器打开：

https://jianhuaguo798-cyber.github.io/jianhua-portfolio/?analytics=off

之后这个浏览器会一直被排除。恢复使用 `?analytics=on`。排除只在当前浏览器生效，不会影响其他访客。

本地测试 `?analytics=debug` 只向控制台写预览事件，不加载 Clarity、不发送数据，不会污染正式统计。

## 下载统计的边界

目前是静态 GitHub Pages：只能从页面点击记录下载意向。直接打开 PDF 链接会绕过页面事件，也无法知道用户下载后是否阅读 PDF。历史访问不能补录。若以后需要统计每次 PDF 请求，可再增加受控下载服务。

## 官方文档

- https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-api
- https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2
