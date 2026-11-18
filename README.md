# d-t-hello-plugin

源码在 `src/index.ts`。插件监听每次工具执行结束，把时间、执行人、会话、工具名和结果追加到桌面的 `tool-results.md`。

运行时加载的是编译结果 `lib/index.js`。改完源码后在 `hello-plugin` 目录执行：

```sh
pnpm build
```

已经从 GitHub 装进 profile 的那一份不会跟着本地源码变。把这次改动推上去之后，重新执行 `dsh plugin --profile web add github:darkflamemasterdeath/d-t-plugin`。
