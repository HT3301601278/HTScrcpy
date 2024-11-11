const express = require('express');
const { execSync } = require('child_process');
const cors = require('cors');
const EventEmitter = require('events');
const WebSocket = require('ws');

const app = express();
const deviceEmitter = new EventEmitter();

// 设置 adb 路径（请根据实际安装路径修改）
const ADB_PATH = 'D:\\Android\\SDK\\platform-tools\\adb.exe';

// 存储当前连接的设备列表及其状态
let currentDevices = [];

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ noServer: true });

// 启用 CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: true
}));

// 检测设备的函数
// 返回一个包含设备信息的数组，每个设备包含id、状态、型号和安卓版本
function detectDevices() {
    try {
        const stdout = execSync(`"${ADB_PATH}" devices`, { encoding: 'utf8' });
        // 过滤掉空行和标题行
        const lines = stdout.split('\n')
            .filter(line => line.trim() !== '' && !line.includes('List of devices attached'));
            
        const devices = lines.map(line => {
            const [id, status] = line.split('\t');
            const device = { 
                id: id.trim(), 
                status: status ? status.trim() : 'unknown'
            };

            try {
                // 获取设备的详细信息（型号和安卓版本）
                device.model = execSync(`"${ADB_PATH}" -s ${device.id} shell getprop ro.product.model`, { encoding: 'utf8' }).trim();
                device.androidVersion = execSync(`"${ADB_PATH}" -s ${device.id} shell getprop ro.build.version.release`, { encoding: 'utf8' }).trim();
            } catch (error) {
                console.log(`获取设备 ${device.id} 的详细信息失败:`, error.message);
            }

            return device;
        });

        // 只有当设备列表发生变化时才触发事件
        if (JSON.stringify(devices) !== JSON.stringify(currentDevices)) {
            currentDevices = devices;
            deviceEmitter.emit('devicesChanged', devices);
        }

        return devices;
    } catch (error) {
        console.error('执行 adb devices 命令出错:', error);
        return [];
    }
}

// 设置定期检测（每500毫秒检测一次）
setInterval(detectDevices, 500);

// WebSocket 连接处理
wss.on('connection', (ws) => {
    console.log('新的 WebSocket 连接已建立');
    
    // 向新连接的客户端发送当前设备状态
    ws.send(JSON.stringify({
        type: 'devices',
        data: currentDevices
    }));

    // 监听设备变化并实时推送给客户端
    const deviceChangeHandler = (devices) => {
        ws.send(JSON.stringify({
            type: 'devices',
            data: devices
        }));
    };

    // 当连接关闭时移除事件监听器
    ws.on('close', () => {
        deviceEmitter.off('devicesChanged', deviceChangeHandler);
    });
});

// 修改现有的 /devices 端点以返回当前状态
app.get('/devices', (req, res) => {
    res.json({ 
        success: true,
        devices: currentDevices,
        timestamp: new Date().toISOString()
    });
});

// 添加一个测试端点
app.get('/test', (req, res) => {
    try {
        const version = execSync(`"${ADB_PATH}" version`, { encoding: 'utf8' });
        const devices = execSync(`"${ADB_PATH}" devices`, { encoding: 'utf8' });
        res.json({
            success: true,
            version: version.trim(),
            devices: devices.trim()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

const PORT = 3000;
const server = app.listen(PORT, () => {
    console.log('=================================');
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('已启用 CORS 和 WebSocket');
    console.log('使用 ADB 路径:', ADB_PATH);
    console.log('设备状态每 0.5 秒更新一次');
    
    // 初始检测
    detectDevices();
    console.log('=================================');
});

// 将 WebSocket 服务器附加到 HTTP 服务器
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});