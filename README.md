# Scrcpy GUI 配置工具

## 项目简介

这是一个基于Web的Scrcpy图形配置工具，可以帮助用户通过友好的界面来配置和使用Scrcpy（一个用于显示和控制Android设备的开源工具）。用户可以通过图形界面轻松设置各种参数，而无需记忆复杂的命令行参数。

## 主要功能

- 设备管理
  - 实时检测并显示已连接的Android设备
  - 支持USB和TCP/IP两种连接方式
  - 显示设备型号和Android版本信息

- 显示设置
  - 窗口标题自定义
  - 全屏/无边框/窗口置顶模式
  - 自定义窗口尺寸
  - 视频源选择
  - 视频编码配置

- 音频设置
  - 音频播放控制
  - 音频源选择（输出/麦克风/应用播放）
  - 音频编码器选择（Opus/AAC/FLAC/Raw）
  - 音频比特率配置

- 录制功能
  - 视频录制控制
  - 自定义保存路径
  - 多种录制格式支持（MP4/MKV/音频格式）
  - 录制方向设置

- 其他功能
  - 设备控制（屏幕开关、保持唤醒等）
  - 连接设置（ADB转发、隧道配置等）
  - 文件传输配置
  - 实时命令预览
  - 命令复制功能

## 技术栈

- 前端
  - HTML5
  - CSS3
  - JavaScript
  - Bootstrap 5.1.3
  - Bootstrap Icons
  - WebSocket

- 后端
  - Node.js
  - Express
  - WebSocket
  - Child Process (用于执行ADB命令)

## 项目结构

```
project/
├── index.html          # 主页面
├── styles.css          # 样式文件
├── script.js           # 前端主要逻辑
├── client.js           # WebSocket客户端
├── server.js           # 后端服务器
└── README.md           # 项目说明文档

```

## 安装和使用

1. 确保系统已安装以下依赖：
   - Node.js
   - ADB (Android Debug Bridge)
   - Scrcpy

2. 安装项目依赖：

```bash
npm install express cors ws
```

3. 配置ADB路径：
   - 在 `server.js` 中修改 `ADB_PATH` 变量为你的ADB实际安装路径

4. 启动服务器：

```bash
node server.js
```

5. 访问应用：
   - 打开浏览器访问 `http://localhost:3000`

## 使用说明

1. 连接设备
   - 通过USB连接Android设备或使用TCP/IP方式连接
   - 点击刷新按钮更新设备列表
   - 从下拉列表中选择要控制的设备

2. 配置参数
   - 在各个设置面板中配置所需参数
   - 实时预览生成的scrcpy命令
   - 可以随时复制命令以供使用

3. 执行命令
   - 复制生成的命令
   - 在终端中执行该命令来启动scrcpy

## 注意事项

- 确保ADB和Scrcpy已正确安装并添加到系统环境变量
- 使用TCP/IP连接时，确保设备和电脑在同一网络下
- 某些功能可能需要root权限或特定的Android系统版本