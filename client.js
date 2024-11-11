const ws = new WebSocket('ws://localhost:3000');

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'devices') {
        // 更新设备列表显示
        updateDevicesList(message.data);
    }
};

ws.onclose = () => {
    console.log('WebSocket 连接已关闭');
    // 可以在这里添加重连逻辑
};