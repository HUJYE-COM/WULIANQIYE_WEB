# zbj-web

基于 Vue 3 + Vite 的前端项目。

## 技术栈

| 技术 | 说明 |
| --- | --- |
| [Vue 3](https://cn.vuejs.org/) | 组合式 API + `<script setup>` |
| [Vite](https://cn.vite.dev/) | 开发与构建工具 |
| [Naive UI](https://www.naiveui.com/zh-CN) | Vue 3 组件库 |
| [Pinia](https://pinia.vuejs.org/zh/) | 状态管理 |
| [Axios](https://axios-http.com/zh/) | HTTP 请求（封装于 `src/api/request.js`） |
| [Bootstrap 5](https://getbootstrap.com/) | 样式框架（CSS） |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 生产构建
npm run build

# 预览构建产物
npm run preview
```

## 目录结构

```
├── public/              # 静态资源（原样拷贝）
├── src/
│   ├── api/             # axios 封装与接口模块
│   ├── assets/          # 全局样式、图片等
│   ├── components/      # 公共组件
│   ├── stores/          # Pinia 状态模块
│   ├── views/           # 页面组件
│   ├── App.vue          # 根组件
│   └── main.js          # 入口：注册 Pinia / Naive UI / Bootstrap
├── .env.development     # 开发环境变量
├── index.html
└── vite.config.js       # @ 别名、开发代理等配置
```

## 说明

- `@` 别名指向 `src/` 目录（见 `vite.config.js` 与 `jsconfig.json`）。
- 接口地址通过 `VITE_API_BASE_URL` 配置；本地开发可在 `vite.config.js` 的 `server.proxy` 中配置代理解决跨域。
- Bootstrap 默认只引入了 CSS；如需下拉菜单、弹窗等 JS 行为，在 `main.js` 中添加：
  `import 'bootstrap/dist/js/bootstrap.bundle.min.js'`
- Naive UI 当前为全量注册（`app.use(naive)`）；如需按需引入优化体积，可配合
  [unplugin-vue-components](https://github.com/unplugin/unplugin-vue-components) 的 `NaiveUiResolver`。
