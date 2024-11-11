const express = require('express');
const { execSync } = require('child_process');
const cors = require('cors');
const EventEmitter = require('events');
const WebSocket = require('ws');

const app = express();
const deviceEmitter = new EventEmitter();

// 设置 adb 路径
const ADB_PATH = 'D:\\Android\\SDK\\platform-tools\\adb.exe';

// 存储当前设备状态
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
function detectDevices() {
    try {
        const stdout = execSync(`"${ADB_PATH}" devices`, { encoding: 'utf8' });
        const lines = stdout.split('\n')
            .filter(line => line.trim() !== '' && !line.includes('List of devices attached'));
            
        const devices = lines.map(line => {
            const [id, status] = line.split('\t');
            const device = { 
                id: id.trim(), 
                status: status ? status.trim() : 'unknown'
            };

            try {
                device.model = execSync(`"${ADB_PATH}" -s ${device.id} shell getprop ro.product.model`, { encoding: 'utf8' }).trim();
                device.androidVersion = execSync(`"${ADB_PATH}" -s ${device.id} shell getprop ro.build.version.release`, { encoding: 'utf8' }).trim();
            } catch (error) {
                console.log(`获取设备 ${device.id} 的详细信息时出错:`, error.message);
            }

            return device;
        });

        // 检查设备状态是否发生变化
        if (JSON.stringify(devices) !== JSON.stringify(currentDevices)) {
            currentDevices = devices;
            deviceEmitter.emit('devicesChanged', devices);
        }

        return devices;
    } catch (error) {
        console.error('检测设备出错:', error);
        return [];
    }
}

// 设置定期检测（每500毫秒检测一次）
setInterval(detectDevices, 500);

// WebSocket 连接处理
wss.on('connection', (ws) => {
    console.log('新的 WebSocket 连接建立');
    
    // 发送当前设备状态
    ws.send(JSON.stringify({
        type: 'devices',
        data: currentDevices
    }));

    // 监听设备变化
    const deviceChangeHandler = (devices) => {
        ws.send(JSON.stringify({
            type: 'devices',
            data: devices
        }));
    };

    deviceEmitter.on('devicesChanged', deviceChangeHandler);

    // 清理断开的连接
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