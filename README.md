# d-t-hello-plugin

一个 DeepSeek Harness 组合包。源码在 `src/index.ts`。装上之后，模型可以调用 `greet`，用配置里的问候语打招呼。

`cordis.patch.yml` 里的 `greeting` 是问候语，`repeat` 是重复次数（1 到 5）。

运行时加载的是编译结果 `lib/index.js`。这份文件由 `pnpm build` 生成，不需要阅读，也不用提交到 GitHub。

本地先编译，再安装。在 `hello-plugin` 目录：

```sh
pnpm install
pnpm build
```

回到仓库根目录：

```sh
pnpm dsh plugin --profile web add ./hello-plugin
pnpm dsh web
```

在对话里说：用 greet 工具问候 Ada。工具结果会是两行 `杨杀f!, Ada!`。

改问候语时，在 profile 的 `cordis.patch.yml` 末尾追加，这一段会换掉上面的整份配置：

```yaml
- id: hello
  config:
    greeting: '你好'
    repeat: 1
```

保存后等大约 2 秒。终端会先打印旧问候和 `unloaded`，再打印新问候。

从 GitHub 安装时，pnpm 会执行 `prepare`，在对方电脑上把 `src/index.ts` 编译成 `lib/index.js`。第一次 `add` 会因为没有允许构建而失败。把提示里的包名写进该 profile 的 `pnpm-workspace.yaml` 后再装一次：

```yaml
allowBuilds:
  ywj-hello-plugin: true
```
