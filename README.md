# XbwExp · 熟练度 App

把一个单文件网页放进 Android WebView，做成能装到手机上的 App。桌面有图标，每天 21:30 弹一条提醒，数据存在 App 私有目录。

## 一、它做了什么

| 能力 | 说明 |
|---|---|
| 本地加载 | `index.html` 打进 APK 的 `assets/`，用 `WebViewAssetLoader` 以 https 挂载到 `appassets.androidplatform.net`，不联网、不依赖服务器 |
| 每日提醒 | `AlarmManager` 在 21:30 触发，点通知直接打开 App；手机重启后 `BootReceiver` 自动恢复闹钟 |
| 数据持久 | WebView 的 localStorage / IndexedDB 落在 App 私有目录，清浏览器缓存不影响，卸载才丢 |
| 选背景图 | `WebChromeClient.onShowFileChooser` 把系统相册接到页面的 `input[type=file]` |
| 导出文件 | 页面通过 `window.XbwAndroid.saveJson(name, text)` 写进系统「下载」目录 |

## 二、怎么拿到 APK

1. 在 GitHub 新建仓库 `XbwExp`（私有即可，Actions 每月 2000 分钟免费额度够用）
2. 把本目录所有文件推到仓库根目录
3. 打开仓库的 **Actions** 页，`build-apk` 会自动跑，约 3–6 分钟
4. 点进这次运行，页面底部 **Artifacts** 下载 `XbwExp-debug-apk`，解压得到 `app-debug.apk`
5. 传到手机安装，首次需允许「未知来源」，国产 ROM 还会再拦一次

改了 `index.html` 之后重新 push，重新下载 APK 覆盖安装即可，**数据不会丢**（同包名同签名）。

## 三、装完必做的两件事

1. 打开 App 时允许「通知」权限，否则 21:30 弹不出来
2. 国产 ROM（小米 / 华为 / OPPO / vivo）去系统设置里给这个 App 打开 **自启动** 和 **后台运行不受限制**，不然闹钟会被系统杀掉

## 四、已知限制

- **数据不跨环境**：浏览器里的数据带不到 App 里，因为 origin 变了。要迁移就在浏览器里导出一份 JSON，装好 App 后用「导入全部数据」粘进去。
- **debug 签名**：仅供自用，不能上架，也别改包名，改了等于换 App，数据读不到。
- **导出改用复制**：WebView 里 `a[download]` 不生效，优先点「复制到剪贴板」，或让页面调 `XbwAndroid.saveJson`。
- **不联网**：页面里没有任何外部请求，APK 也不需要网络权限。

## 五、目录

```
XbwExp/
├─ .github/workflows/build-apk.yml   云端构建，产出 debug APK
├─ settings.gradle / build.gradle    工程配置（AGP 8.5.2）
├─ gradle.properties
└─ app/
   ├─ build.gradle                   compileSdk 34 / minSdk 26
   └─ src/main/
      ├─ AndroidManifest.xml         权限、Activity、两个 Receiver
      ├─ assets/index.html           页面本体（单文件，来自网页版）
      ├─ java/com/xbw/exp/
      │  ├─ MainActivity.java        WebView、文件选择、JS 桥、权限
      │  ├─ ReminderReceiver.java    每日 21:30 通知
      │  └─ BootReceiver.java        开机恢复闹钟
      └─ res/                        图标与名字
```

## 六、改提醒时间

`app/src/main/java/com/xbw/exp/ReminderReceiver.java` 顶部：

```java
public static final int HOUR = 21;
public static final int MINUTE = 30;
```

改完 push，重新装一次 APK。用的是 `setInexactRepeating`，不申请精确闹钟权限，实际触发可能有几分钟误差。
