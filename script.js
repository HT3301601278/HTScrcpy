// 在文件最开头添加
console.log('script.js 开始加载');

// 存储所有配置项的值
let config = {};

// 确保在 DOM 加载完成后再初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM 加载完成');
    
    // 获取刷新按钮和设备列表元素
    const refreshButton = document.getElementById('refreshDevices');
    const deviceList = document.getElementById('deviceList');
    const deviceStatus = document.getElementById('deviceStatus');
    
    console.log('刷新按钮元素:', refreshButton);
    console.log('设备列表元素:', deviceList);
    console.log('设备状态元素:', deviceStatus);
    
    // 绑定刷新按钮点击事件
    if (refreshButton) {
        refreshButton.onclick = async function(e) {
            e.preventDefault();
            console.log('刷新按钮被点击');
            await getConnectedDevices();
        };
        console.log('成功绑定刷新按钮事件');
    } else {
        console.error('未找到刷新按钮元素');
    }
    
    // 初始加载设备列表
    getConnectedDevices();
});

// 获设备列表的函数
async function getConnectedDevices() {
    const refreshButton = document.getElementById('refreshDevices');
    const refreshIcon = refreshButton.querySelector('.bi-arrow-clockwise');
    const deviceStatus = document.getElementById('deviceStatus');
    
    try {
        // 添加加载动画
        refreshIcon.classList.add('rotating');
        refreshButton.disabled = true;
        deviceStatus.textContent = '正在刷新设备列表...';
        
        // 模拟获取设备列表的延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('发送请求到服务器...');
        const response = await fetch('http://localhost:3000/devices', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });
        
        console.log('收到服务器响应:', response);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('解析到的设备数据:', data);
        
        // 清空设备列表
        deviceList.innerHTML = '<option value="">请选择设备...</option>';
        
        if (data.devices && data.devices.length > 0) {
            data.devices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.id;
                
                let displayText = device.id.includes(':') 
                    ? `${device.model || '网络设备'} (${device.id}) - WiFi`
                    : `${device.model || '设备'} (${device.id}) - USB`;
                
                if (device.androidVersion) {
                    displayText += ` [Android ${device.androidVersion}]`;
                }
                
                option.textContent = displayText;
                deviceList.appendChild(option);
                console.log('添加设备选项:', displayText);
            });
            
            deviceStatus.textContent = `已连接 ${data.devices.length} 个设备`;
            deviceStatus.className = 'form-text text-success';
        } else {
            deviceStatus.textContent = '未发现已连接的设备';
            deviceStatus.className = 'form-text text-warning';
        }
    } catch (error) {
        console.error('获取设备列表失败:', error);
        deviceStatus.textContent = '获取设备列表失败';
        deviceStatus.style.color = '#dc3545';
    } finally {
        // 移除加载动画
        refreshIcon.classList.remove('rotating');
        refreshButton.disabled = false;
    }
}

// 设备选择变更事件处理
document.addEventListener('DOMContentLoaded', function() {
    const deviceList = document.getElementById('deviceList');
    if (deviceList) {
        deviceList.addEventListener('change', function(e) {
            const serialNumber = e.target.value;
            const serialNumberInput = document.getElementById('serialNumber');
            
            if (serialNumber) {
                config['--serial'] = serialNumber;
                if (serialNumberInput) {
                    serialNumberInput.value = serialNumber;
                }
            } else {
                delete config['--serial'];
                if (serialNumberInput) {
                    serialNumberInput.value = '';
                }
            }
            
            updateCommandPreview();
        });
    }
});

// 更新命令预览
function updateCommandPreview() {
    console.log('当前配置:', config);
    
    let command = 'scrcpy';
    
    // 遍历配置对象，构建命令
    for (let key in config) {
        if (config[key] !== null && config[key] !== undefined && config[key] !== '') {
            if (typeof config[key] === 'boolean') {
                command += ` ${key}`;
            } else {
                command += ` ${key}=${config[key]}`;
            }
        }
    }
    
    console.log('生成的命令:', command);
    
    const commandPreview = document.getElementById('commandPreview');
    if (commandPreview) {
        commandPreview.textContent = command;
    }
}

// 复制命令到剪贴板
function copyCommand() {
    const command = document.getElementById('commandPreview').textContent;
    navigator.clipboard.writeText(command).then(() => {
        // 创建 Toast 实例并显示
        const toastEl = document.getElementById('copyToast');
        const toast = new bootstrap.Toast(toastEl, {
            animation: true,
            autohide: true,
            delay: 2000  // 2秒后自动隐藏
        });
        toast.show();
    });
}

// 运行命令
function runCommand() {
    const command = document.getElementById('commandPreview').textContent;
    // 这里需要根据实际运行环境实现命令执行功能
    // 如果是在Electron等环境中，可以调用系统命令执行
    alert(`即将执行命令：${command}`);
}

// 为所有输入元素添加事件监听器
document.addEventListener('DOMContentLoaded', () => {
    // 设备连接方式
    document.getElementById('deviceConnectionType').addEventListener('change', (e) => {
        if (e.target.value) {
            config[e.target.value] = true;
        } else {
            delete config['--select-usb'];
            delete config['--select-tcpip'];
        }
        updateCommandPreview();
    });

    // 序列号
    document.getElementById('serialNumber').addEventListener('input', (e) => {
        if (e.target.value) {
            config['--serial'] = e.target.value;
        } else {
            delete config['--serial'];
        }
        updateCommandPreview();
    });

    // 窗口标题
    document.getElementById('windowTitle').addEventListener('input', (e) => {
        if (e.target.value) {
            config['--window-title'] = e.target.value;
        } else {
            delete config['--window-title'];
        }
        updateCommandPreview();
    });

    // 全屏模式
    document.getElementById('fullscreen').addEventListener('change', (e) => {
        if (e.target.checked) {
            config['--fullscreen'] = true;
        } else {
            delete config['--fullscreen'];
        }
        updateCommandPreview();
    });

    // 无边框模式
    document.getElementById('borderless').addEventListener('change', (e) => {
        if (e.target.checked) {
            config['--window-borderless'] = true;
        } else {
            delete config['--window-borderless'];
        }
        updateCommandPreview();
    });

    // 初始化所具提示
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });

    // 视频源选择
    document.getElementById('videoSource').addEventListener('change', (e) => {
        if (e.target.value) {
            config['--video-source'] = e.target.value;
        } else {
            delete config['--video-source'];
        }
        updateCommandPreview();
    });

    // 视频编码
    document.getElementById('videoCodec').addEventListener('change', (e) => {
        if (e.target.value) {
            config['--video-codec'] = e.target.value;
        } else {
            delete config['--video-codec'];
        }
        updateCommandPreview();
    });

    // 视频比特率
    function updateVideoBitrate() {
        const bitrate = document.getElementById('videoBitrate').value;
        const unit = document.getElementById('videoBitrateUnit').value;
        if (bitrate) {
            config['--video-bit-rate'] = `${bitrate}${unit}`;
        } else {
            delete config['--video-bit-rate'];
        }
        updateCommandPreview();
    }

    document.getElementById('videoBitrate').addEventListener('input', updateVideoBitrate);
    document.getElementById('videoBitrateUnit').addEventListener('change', updateVideoBitrate);

    // 最大帧率
    document.getElementById('maxFps').addEventListener('input', (e) => {
        if (e.target.value) {
            config['--max-fps'] = e.target.value;
        } else {
            delete config['--max-fps'];
        }
        updateCommandPreview();
    });

    // 显示/隐藏高级选项
    document.getElementById('showAdvancedVideo').addEventListener('change', (e) => {
        const advancedOptions = document.querySelector('.advanced-video-options');
        advancedOptions.style.display = e.target.checked ? 'block' : 'none';
    });

    // 编码器选项
    document.getElementById('videoCodecOptions').addEventListener('input', (e) => {
        if (e.target.value) {
            config['--video-codec-options'] = e.target.value;
        } else {
            delete config['--video-codec-options'];
        }
        updateCommandPreview();
    });

    // 音频启用控制
    document.getElementById('audioEnabled').addEventListener('change', (e) => {
        const audioSettings = document.getElementById('audioSettings');
        if (!e.target.checked) {
            config['--no-audio'] = true;
            audioSettings.style.display = 'none';
        } else {
            delete config['--no-audio'];
            audioSettings.style.display = 'block';
        }
        updateCommandPreview();
    });

    // 音频播放控制
    document.getElementById('audioPlayback').addEventListener('change', (e) => {
        if (!e.target.checked) {
            config['--no-audio-playback'] = true;
        } else {
            delete config['--no-audio-playback'];
        }
        updateCommandPreview();
    });

    // 音频源选择
    document.getElementById('audioSource').addEventListener('change', (e) => {
        if (e.target.value) {
            config['--audio-source'] = e.target.value;
        } else {
            delete config['--audio-source'];
        }
        updateCommandPreview();
    });

    // 音频编码器
    document.getElementById('audioCodec').addEventListener('change', (e) => {
        if (e.target.value) {
            config['--audio-codec'] = e.target.value;
        } else {
            delete config['--audio-codec'];
        }
        updateCommandPreview();
    });

    // 音频比特率
    function updateAudioBitrate() {
        const bitrate = document.getElementById('audioBitrate').value;
        const unit = document.getElementById('audioBitrateUnit').value;
        if (bitrate) {
            config['--audio-bit-rate'] = `${bitrate}${unit}`;
        } else {
            delete config['--audio-bit-rate'];
        }
        updateCommandPreview();
    }

    document.getElementById('audioBitrate').addEventListener('input', updateAudioBitrate);
    document.getElementById('audioBitrateUnit').addEventListener('change', updateAudioBitrate);

    // 音频缓冲
    document.getElementById('audioBuffer').addEventListener('input', (e) => {
        if (e.target.value) {
            config['--audio-buffer'] = e.target.value;
        } else {
            delete config['--audio-buffer'];
        }
        updateCommandPreview();
    });

    // 输出缓冲
    document.getElementById('audioOutputBuffer').addEventListener('input', (e) => {
        if (e.target.value) {
            config['--audio-output-buffer'] = e.target.value;
        } else {
            delete config['--audio-output-buffer'];
        }
        updateCommandPreview();
    });

    // 显示/隐藏高级选项
    document.getElementById('showAdvancedAudio').addEventListener('change', (e) => {
        const advancedOptions = document.querySelector('.advanced-audio-options');
        advancedOptions.style.display = e.target.checked ? 'block' : 'none';
    });

    // 音频编码器选项
    document.getElementById('audioCodecOptions').addEventListener('input', (e) => {
        if (e.target.value) {
            config['--audio-codec-options'] = e.target.value;
        } else {
            delete config['--audio-codec-options'];
        }
        updateCommandPreview();
    });

    // 键盘式
    document.getElementById('keyboardMode').addEventListener('change', (e) => {
        if (e.target.value) {
            config['--keyboard'] = e.target.value;
        } else {
            delete config['--keyboard'];
        }
        updateCommandPreview();
    });

    // 鼠标模式
    document.getElementById('mouseMode').addEventListener('change', (e) => {
        if (e.target.value) {
            config['--mouse'] = e.target.value;
        } else {
            delete config['--mouse'];
        }
        updateCommandPreview();
    });

    // 游戏手柄模式
    document.getElementById('gamepadMode').addEventListener('change', (e) => {
        if (e.target.value) {
            config['--gamepad'] = e.target.value;
        } else {
            delete config['--gamepad'];
        }
        updateCommandPreview();
    });

    // 鼠标按键绑定
    document.getElementById('mouseBinding').addEventListener('input', (e) => {
        if (e.target.value) {
            config['--mouse-bind'] = e.target.value;
        } else {
            delete config['--mouse-bind'];
        }
        updateCommandPreview();
    });

    // 禁用按键重复
    document.getElementById('noKeyRepeat').addEventListener('change', (e) => {
        if (e.target.checked) {
            config['--no-key-repeat'] = true;
        } else {
            delete config['--no-key-repeat'];
        }
        updateCommandPreview();
    });

    // 禁用鼠标悬停
    document.getElementById('noMouseHover').addEventListener('change', (e) => {
        if (e.target.checked) {
            config['--no-mouse-hover'] = true;
        } else {
            delete config['--no-mouse-hover'];
        }
        updateCommandPreview();
    });

    // 优先文本输入
    document.getElementById('preferText').addEventListener('change', (e) => {
        if (e.target.checked) {
            config['--prefer-text'] = true;
        } else {
            delete config['--prefer-text'];
        }
        updateCommandPreview();
    });

    // 禁用剪贴板自动同步
    document.getElementById('noClipboardAutosync').addEventListener('change', (e) => {
        if (e.target.checked) {
            config['--no-clipboard-autosync'] = true;
        } else {
            delete config['--no-clipboard-autosync'];
        }
        updateCommandPreview();
    });

    // 使用传统粘贴式
    document.getElementById('legacyPaste').addEventListener('change', (e) => {
        if (e.target.checked) {
            config['--legacy-paste'] = true;
        } else {
            delete config['--legacy-paste'];
        }
        updateCommandPreview();
    });

    // 录制设置
    document.getElementById('enableRecord').addEventListener('change', (e) => {
        const recordSettings = document.getElementById('recordSettings');
        const recordAdvancedSettings = document.getElementById('recordAdvancedSettings');
        if (e.target.checked) {
            recordSettings.style.display = 'block';
            recordAdvancedSettings.style.display = 'block';
        } else {
            recordSettings.style.display = 'none';
            recordAdvancedSettings.style.display = 'none';
            delete config['--record'];
            delete config['--record-format'];
            delete config['--record-orientation'];
        }
        updateCommandPreview();
    });

    document.getElementById('recordPath').addEventListener('input', (e) => {
        if (e.target.value) {
            config['--record'] = e.target.value;
        } else {
            delete config['--record'];
        }
        updateCommandPreview();
    });

    document.getElementById('recordFormat').addEventListener('change', (e) => {
        if (e.target.value) {
            config['--record-format'] = e.target.value;
        } else {
            delete config['--record-format'];
        }
        updateCommandPreview();
    });

    document.getElementById('recordOrientation').addEventListener('change', (e) => {
        if (e.target.value) {
            config['--record-orientation'] = e.target.value;
        } else {
            delete config['--record-orientation'];
        }
        updateCommandPreview();
    });

    // 设备控制
    document.getElementById('stayAwake').addEventListener('change', (e) => {
        if (e.target.checked) {
            config['--stay-awake'] = true;
        } else {
            delete config['--stay-awake'];
        }
        updateCommandPreview();
    });

    document.getElementById('showTouches').addEventListener('change', (e) => {
        if (e.target.checked) {
            config['--show-touches'] = true;
        } else {
            delete config['--show-touches'];
        }
        updateCommandPreview();
    });

    document.getElementById('turnScreenOff').addEventListener('change', (e) => {
        if (e.target.checked) {
            config['--turn-screen-off'] = true;
        } else {
            delete config['--turn-screen-off'];
        }
        updateCommandPreview();
    });

    // 高级设置
    document.getElementById('portRange').addEventListener('input', (e) => {
        if (e.target.value) {
            config['--port'] = e.target.value;
        } else {
            delete config['--port'];
        }
        updateCommandPreview();
    });

    document.getElementById('verbosity').addEventListener('change', (e) => {
        if (e.target.value) {
            config['--verbosity'] = e.target.value;
        } else {
            delete config['--verbosity'];
        }
        updateCommandPreview();
    });

    document.getElementById('timeLimit').addEventListener('input', (e) => {
        if (e.target.value) {
            config['--time-limit'] = e.target.value;
        } else {
            delete config['--time-limit'];
        }
        updateCommandPreview();
    });

    // 文件选择按钮（需要在持的环境中实现）
    document.getElementById('selectFile').addEventListener('click', () => {
        // 这里需要根据实际运行环境实现文件选择功能
        // 如果是在Electron等环境中，可以调用系统的文件选择对话框
        alert('请实现文件选择功能');
    });

    // 复制命令
    document.getElementById('copyCommand').addEventListener('click', copyCommand);

    // 运行命令
    document.getElementById('runCommand').addEventListener('click', runCommand);

    // 修改最大尺寸处理
    document.getElementById('maxSize').addEventListener('input', (e) => {
        console.log('最大尺寸输入值:', e.target.value);
        
        if (e.target.value) {
            config['-m'] = e.target.value;
        } else {
            delete config['-m'];
        }
        
        console.log('更新后的配置:', config);
        updateCommandPreview();
    });

    // 修改窗口尺寸处理
    document.getElementById('windowWidth').addEventListener('input', (e) => {
        if (e.target.value) {
            // 根据帮助文档，直接使用数值
            config['--window-width'] = e.target.value;
        } else {
            delete config['--window-width'];
        }
        updateCommandPreview();
    });

    document.getElementById('windowHeight').addEventListener('input', (e) => {
        if (e.target.value) {
            // 根帮助文档，直接使用数值
            config['--window-height'] = e.target.value;
        } else {
            delete config['--window-height'];
        }
        updateCommandPreview();
    });

    // 修改裁剪尺寸处理
    document.getElementById('crop').addEventListener('input', (e) => {
        if (e.target.value) {
            // 检查输入格式是否符合 width:height:x:y
            const cropPattern = /^\d+:\d+:\d+:\d+$/;
            if (cropPattern.test(e.target.value)) {
                // 根据帮助文档，直接使用 width:height:x:y 格式
                config['--crop'] = e.target.value;
            }
        } else {
            delete config['--crop'];
        }
        updateCommandPreview();
    });

    // 修改摄像头尺寸处理
    document.getElementById('cameraSize').addEventListener('input', (e) => {
        if (e.target.value) {
            // 检查输入格式是否符合 widthxheight
            const cameraSizePattern = /^\d+x\d+$/;
            if (cameraSizePattern.test(e.target.value)) {
                // 根据帮助文档，使用 widthxheight 格式
                config['--camera-size'] = e.target.value;
            }
        } else {
            delete config['--camera-size'];
        }
        updateCommandPreview();
    });

    // 修改显示参数设置的事件监听器
    
    // 最大尺寸
    document.getElementById('maxSize').addEventListener('input', (e) => {
        if (e.target.value) {
            config['--max-size'] = e.target.value;
        } else {
            delete config['--max-size'];
        }
        updateCommandPreview();
    });

    // 显示缓冲延迟
    document.getElementById('displayBuffer').addEventListener('input', (e) => {
        if (e.target.value) {
            config['--display-buffer'] = e.target.value;
        } else {
            delete config['--display-buffer'];
        }
        updateCommandPreview();
    });

    // 显示ID
    document.getElementById('displayId').addEventListener('input', (e) => {
        if (e.target.value) {
            config['--display-id'] = e.target.value;
        } else {
            delete config['--display-id'];
        }
        updateCommandPreview();
    });

    // 屏幕裁剪
    document.getElementById('crop').addEventListener('input', (e) => {
        if (e.target.value) {
            // 检查输入格式是否符合 width:height:x:y
            const cropPattern = /^\d+:\d+:\d+:\d+$/;
            if (cropPattern.test(e.target.value)) {
                config['--crop'] = e.target.value;
            } else {
                delete config['--crop'];
            }
        } else {
            delete config['--crop'];
        }
        updateCommandPreview();
    });

    // 显示和录制方向
    document.getElementById('orientation').addEventListener('change', (e) => {
        if (e.target.value) {
            // 同时设置显示和录制方向
            config['--display-orientation'] = e.target.value;
            config['--record-orientation'] = e.target.value;
        } else {
            // 如果选择默认值，则删除这两个配置
            delete config['--display-orientation'];
            delete config['--record-orientation'];
        }
        updateCommandPreview();
    });

    // 锁定视频方向
    document.getElementById('lockVideoOrientation').addEventListener('change', (e) => {
        if (e.target.value) {
            config['--lock-video-orientation'] = e.target.value;
        } else {
            delete config['--lock-video-orientation'];
        }
        updateCommandPreview();
    });

    // 窗口置顶
    document.getElementById('alwaysOnTop').addEventListener('change', (e) => {
        if (e.target.checked) {
            config['--always-on-top'] = true;
        } else {
            delete config['--always-on-top'];
        }
        updateCommandPreview();
    });

    // 更新命令预览函数
    function updateCommandPreview() {
        let command = 'scrcpy';
        
        // 遍历配置对象，构建命令
        for (let key in config) {
            if (config[key] !== null && config[key] !== undefined && config[key] !== '') {
                if (typeof config[key] === 'boolean') {
                    command += ` ${key}`;
                } else {
                    // 如果值中包含空格，则用引号包裹
                    const value = String(config[key]);
                    if (value.includes(' ')) {
                        command += ` ${key}="${value}"`;
                    } else {
                        command += ` ${key}=${value}`;
                    }
                }
            }
        }
        
        console.log('生成的命令:', command);
        
        const commandPreview = document.getElementById('commandPreview');
        if (commandPreview) {
            commandPreview.textContent = command;
        }
    }

    // 初始化命令预览
    updateCommandPreview();
});

// 获取所有相关的表单元素
const deviceList = document.getElementById('deviceList');
const refreshDevicesBtn = document.getElementById('refreshDevices');
const deviceConnectionType = document.getElementById('deviceConnectionType');
const serialNumber = document.getElementById('serialNumber');

const alwaysOnTop = document.getElementById('alwaysOnTop');
// 其他设置项的获取...

const commandPreview = document.getElementById('commandPreview');

// 更新命令预览的函数
function updateCommand() {
    let command = 'scrcpy';

    // 处理设备连接方式
    if (deviceConnectionType.value) {
        command += ` ${deviceConnectionType.value}`;
    }

    // 处理设备序列号
    if (serialNumber.value.trim() !== '') {
        command += ` --serial ${serialNumber.value.trim()}`;
    }

    // 处理窗口置顶
    if (alwaysOnTop.checked) {
        command += ' --always-on-top';
    }

    // 处理其他设置项...
    // 例如:
    // if (fullscreen.checked) {
    //     command += ' --fullscreen';
    // }

    // 最后更新命令预览
    commandPreview.textContent = command;
}

// 为所有相关的表单元素添加事件监听器
deviceConnectionType.addEventListener('change', updateCommand);
serialNumber.addEventListener('input', updateCommand);
alwaysOnTop.addEventListener('change', updateCommand);
// 为其他设置项添加事件监听器...

// 初始化命令预览
updateCommand();

document.addEventListener('DOMContentLoaded', () => {
    // 显示参数设置相关的事件监听器
    
    // 最大尺寸
    const maxSizeInput = document.getElementById('maxSize');
    if (maxSizeInput) {
        maxSizeInput.addEventListener('input', (e) => {
            console.log('最大尺寸变更:', e.target.value);
            if (e.target.value) {
                config['--max-size'] = e.target.value;
            } else {
                delete config['--max-size'];
            }
            updateCommandPreview();
        });
    }

    // 显示缓冲延迟
    const displayBufferInput = document.getElementById('displayBuffer');
    if (displayBufferInput) {
        displayBufferInput.addEventListener('input', (e) => {
            console.log('显示缓冲延迟变更:', e.target.value);
            if (e.target.value) {
                config['--display-buffer'] = e.target.value;
            } else {
                delete config['--display-buffer'];
            }
            updateCommandPreview();
        });
    }

    // 显示ID
    const displayIdInput = document.getElementById('displayId');
    if (displayIdInput) {
        displayIdInput.addEventListener('input', (e) => {
            console.log('显示ID变更:', e.target.value);
            if (e.target.value) {
                config['--display-id'] = e.target.value;
            } else {
                delete config['--display-id'];
            }
            updateCommandPreview();
        });
    }

    // 屏幕裁剪
    const cropInput = document.getElementById('crop');
    if (cropInput) {
        cropInput.addEventListener('input', (e) => {
            console.log('屏幕裁剪变更:', e.target.value);
            if (e.target.value) {
                const cropPattern = /^\d+:\d+:\d+:\d+$/;
                if (cropPattern.test(e.target.value)) {
                    config['--crop'] = e.target.value;
                } else {
                    delete config['--crop'];
                }
            } else {
                delete config['--crop'];
            }
            updateCommandPreview();
        });
    }

    // 显示和录制方向
    const orientationSelect = document.getElementById('orientation');
    if (orientationSelect) {
        orientationSelect.addEventListener('change', (e) => {
            console.log('方向变更:', e.target.value);
            if (e.target.value) {
                config['--rotation'] = e.target.value;
            } else {
                delete config['--rotation'];
            }
            updateCommandPreview();
        });
    }

    // 锁定视频方向
    const lockVideoOrientationSelect = document.getElementById('lockVideoOrientation');
    if (lockVideoOrientationSelect) {
        lockVideoOrientationSelect.addEventListener('change', (e) => {
            console.log('锁定视频方向变更:', e.target.value);
            if (e.target.value) {
                config['--lock-video-orientation'] = e.target.value;
            } else {
                delete config['--lock-video-orientation'];
            }
            updateCommandPreview();
        });
    }

    // 更新命令预览函数
    function updateCommandPreview() {
        let command = 'scrcpy';
        
        // 遍历配置对象，构建命令
        for (let key in config) {
            if (config[key] !== null && config[key] !== undefined && config[key] !== '') {
                if (typeof config[key] === 'boolean') {
                    command += ` ${key}`;
                } else {
                    // 如果值中包含空格，则用引号包裹
                    const value = String(config[key]);
                    if (value.includes(' ')) {
                        command += ` ${key}="${value}"`;
                    } else {
                        command += ` ${key}=${value}`;
                    }
                }
            }
        }
        
        console.log('当前配置:', config);
        console.log('生成的命令:', command);
        
        const commandPreview = document.getElementById('commandPreview');
        if (commandPreview) {
            commandPreview.textContent = command;
        }
    }

    // 初始化命令预览
    updateCommandPreview();
});

document.addEventListener('DOMContentLoaded', () => {
    // 摄像头设置相关的事件监听器
    
    // 摄像头ID
    const cameraIdInput = document.getElementById('cameraId');
    if (cameraIdInput) {
        cameraIdInput.addEventListener('input', (e) => {
            console.log('摄像头ID变更:', e.target.value);
            if (e.target.value) {
                config['--camera-id'] = e.target.value;
            } else {
                delete config['--camera-id'];
            }
            updateCommandPreview();
        });
    }

    // 摄像头朝向
    const cameraFacingSelect = document.getElementById('cameraFacing');
    if (cameraFacingSelect) {
        cameraFacingSelect.addEventListener('change', (e) => {
            console.log('摄像头朝向变更:', e.target.value);
            if (e.target.value) {
                config['--camera-facing'] = e.target.value;
            } else {
                delete config['--camera-facing'];
            }
            updateCommandPreview();
        });
    }

    // 摄像头分辨率
    const cameraSizeInput = document.getElementById('cameraSize');
    if (cameraSizeInput) {
        cameraSizeInput.addEventListener('input', (e) => {
            console.log('摄像头分辨率变更:', e.target.value);
            if (e.target.value) {
                const sizePattern = /^\d+x\d+$/;
                if (sizePattern.test(e.target.value)) {
                    config['--camera-size'] = e.target.value;
                } else {
                    delete config['--camera-size'];
                }
            } else {
                delete config['--camera-size'];
            }
            updateCommandPreview();
        });
    }

    // 摄像头宽高比
    const cameraArInput = document.getElementById('cameraAr');
    if (cameraArInput) {
        cameraArInput.addEventListener('input', (e) => {
            console.log('摄像头宽高比变更:', e.target.value);
            if (e.target.value) {
                const arPattern = /^\d+:\d+$/;
                if (arPattern.test(e.target.value)) {
                    config['--camera-ar'] = e.target.value;
                } else {
                    delete config['--camera-ar'];
                }
            } else {
                delete config['--camera-ar'];
            }
            updateCommandPreview();
        });
    }

    // 摄像头帧率
    const cameraFpsInput = document.getElementById('cameraFps');
    if (cameraFpsInput) {
        cameraFpsInput.addEventListener('input', (e) => {
            console.log('摄像头帧率变更:', e.target.value);
            if (e.target.value) {
                config['--camera-fps'] = e.target.value;
            } else {
                delete config['--camera-fps'];
            }
            updateCommandPreview();
        });
    }

    // 高速���像头模式
    const cameraHighSpeedCheckbox = document.getElementById('cameraHighSpeed');
    if (cameraHighSpeedCheckbox) {
        cameraHighSpeedCheckbox.addEventListener('change', (e) => {
            console.log('高速摄像头模式变更:', e.target.checked);
            if (e.target.checked) {
                config['--camera-high-speed'] = true;
            } else {
                delete config['--camera-high-speed'];
            }
            updateCommandPreview();
        });
    }

    // 显示/隐藏摄像头设置
    const videoSourceSelect = document.getElementById('videoSource');
    const cameraSettings = document.getElementById('cameraSettings');
    if (videoSourceSelect && cameraSettings) {
        videoSourceSelect.addEventListener('change', (e) => {
            if (e.target.value === 'camera') {
                cameraSettings.style.display = 'block';
            } else {
                cameraSettings.style.display = 'none';
                // 清除所有摄像头相关的配置
                delete config['--camera-id'];
                delete config['--camera-facing'];
                delete config['--camera-size'];
                delete config['--camera-ar'];
                delete config['--camera-fps'];
                delete config['--camera-high-speed'];
            }
            updateCommandPreview();
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // 设备控制相关的事件监听器
    
    // 保持设备唤醒
    const stayAwakeCheckbox = document.getElementById('stayAwake');
    if (stayAwakeCheckbox) {
        stayAwakeCheckbox.addEventListener('change', (e) => {
            console.log('保持设备唤醒变更:', e.target.checked);
            if (e.target.checked) {
                config['--stay-awake'] = true;
            } else {
                delete config['--stay-awake'];
            }
            updateCommandPreview();
        });
    }

    // 显示触摸点
    const showTouchesCheckbox = document.getElementById('showTouches');
    if (showTouchesCheckbox) {
        showTouchesCheckbox.addEventListener('change', (e) => {
            console.log('显示触摸点变更:', e.target.checked);
            if (e.target.checked) {
                config['--show-touches'] = true;
            } else {
                delete config['--show-touches'];
            }
            updateCommandPreview();
        });
    }

    // 关闭设备屏幕
    const turnScreenOffCheckbox = document.getElementById('turnScreenOff');
    if (turnScreenOffCheckbox) {
        turnScreenOffCheckbox.addEventListener('change', (e) => {
            console.log('关闭设备屏幕变更:', e.target.checked);
            if (e.target.checked) {
                config['--turn-screen-off'] = true;
            } else {
                delete config['--turn-screen-off'];
            }
            updateCommandPreview();
        });
    }

    // 禁用屏幕保护
    const disableScreensaverCheckbox = document.getElementById('disableScreensaver');
    if (disableScreensaverCheckbox) {
        disableScreensaverCheckbox.addEventListener('change', (e) => {
            console.log('禁用屏幕保护变更:', e.target.checked);
            if (e.target.checked) {
                config['--disable-screensaver'] = true;
            } else {
                delete config['--disable-screensaver'];
            }
            updateCommandPreview();
        });
    }

    // 启动时不点亮屏幕
    const noPowerOnCheckbox = document.getElementById('noPowerOn');
    if (noPowerOnCheckbox) {
        noPowerOnCheckbox.addEventListener('change', (e) => {
            console.log('启动时不点亮屏幕变更:', e.target.checked);
            if (e.target.checked) {
                config['--no-power-on'] = true;
            } else {
                delete config['--no-power-on'];
            }
            updateCommandPreview();
        });
    }

    // 关闭时关闭屏幕
    const powerOffOnCloseCheckbox = document.getElementById('powerOffOnClose');
    if (powerOffOnCloseCheckbox) {
        powerOffOnCloseCheckbox.addEventListener('change', (e) => {
            console.log('关闭时关闭屏幕变更:', e.target.checked);
            if (e.target.checked) {
                config['--power-off-on-close'] = true;
            } else {
                delete config['--power-off-on-close'];
            }
            updateCommandPreview();
        });
    }

    // 强制使用adb forward
    const forceAdbForwardCheckbox = document.getElementById('forceAdbForward');
    if (forceAdbForwardCheckbox) {
        forceAdbForwardCheckbox.addEventListener('change', (e) => {
            console.log('强制使用adb forward变更:', e.target.checked);
            if (e.target.checked) {
                config['--force-adb-forward'] = true;
            } else {
                delete config['--force-adb-forward'];
            }
            updateCommandPreview();
        });
    }

    // 关闭时结束adb
    const killAdbOnCloseCheckbox = document.getElementById('killAdbOnClose');
    if (killAdbOnCloseCheckbox) {
        killAdbOnCloseCheckbox.addEventListener('change', (e) => {
            console.log('关闭时结束adb变更:', e.target.checked);
            if (e.target.checked) {
                config['--kill-adb-on-close'] = true;
            } else {
                delete config['--kill-adb-on-close'];
            }
            updateCommandPreview();
        });
    }

    // 隧道主机
    const tunnelHostInput = document.getElementById('tunnelHost');
    if (tunnelHostInput) {
        tunnelHostInput.addEventListener('input', (e) => {
            console.log('隧道主机变更:', e.target.value);
            if (e.target.value) {
                config['--tunnel-host'] = e.target.value;
            } else {
                delete config['--tunnel-host'];
            }
            updateCommandPreview();
        });
    }

    // 隧道端口
    const tunnelPortInput = document.getElementById('tunnelPort');
    if (tunnelPortInput) {
        tunnelPortInput.addEventListener('input', (e) => {
            console.log('隧道端口变更:', e.target.value);
            if (e.target.value) {
                config['--tunnel-port'] = e.target.value;
            } else {
                delete config['--tunnel-port'];
            }
            updateCommandPreview();
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // 连接设置相关的事件监听器
    
    // 强制使用adb forward
    const forceAdbForward = document.getElementById('forceAdbForward');
    if (forceAdbForward) {
        forceAdbForward.addEventListener('change', (e) => {
            if (e.target.checked) {
                config['--force-adb-forward'] = true;
            } else {
                delete config['--force-adb-forward'];
            }
            updateCommandPreview();
        });
    }

    // 关闭时结束adb
    const killAdbOnClose = document.getElementById('killAdbOnClose');
    if (killAdbOnClose) {
        killAdbOnClose.addEventListener('change', (e) => {
            if (e.target.checked) {
                config['--kill-adb-on-close'] = true;
            } else {
                delete config['--kill-adb-on-close'];
            }
            updateCommandPreview();
        });
    }

    // 隧道主机
    const tunnelHost = document.getElementById('tunnelHost');
    if (tunnelHost) {
        tunnelHost.addEventListener('input', (e) => {
            if (e.target.value.trim()) {
                config['--tunnel-host'] = e.target.value.trim();
            } else {
                delete config['--tunnel-host'];
            }
            updateCommandPreview();
        });
    }

    // 隧道端口
    const tunnelPort = document.getElementById('tunnelPort');
    if (tunnelPort) {
        tunnelPort.addEventListener('input', (e) => {
            if (e.target.value.trim()) {
                config['--tunnel-port'] = e.target.value.trim();
            } else {
                delete config['--tunnel-port'];
            }
            updateCommandPreview();
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // 文件传输设置相关的事件监听器
    
    // 文件推送目标路径
    const pushTargetInput = document.getElementById('pushTarget');
    if (pushTargetInput) {
        pushTargetInput.addEventListener('input', (e) => {
            console.log('文件推送目标路径变更:', e.target.value);
            if (e.target.value) {
                config['--push-target'] = e.target.value;
            } else {
                delete config['--push-target'];
            }
            updateCommandPreview();
        });
    }

    // 如果还有其他文件传输相关的设置，也可以按照类似的方式添加
});

document.addEventListener('DOMContentLoaded', () => {
    // 渲染驱动
    document.getElementById('renderDriver').addEventListener('input', (e) => {
        if (e.target.value) {
            config['--render-driver'] = e.target.value;
        } else {
            delete config['--render-driver'];
        }
        updateCommandPreview();
    });

    // 不清理服务端
    document.getElementById('noCleanup').addEventListener('change', (e) => {
        if (e.target.checked) {
            config['--no-cleanup'] = true;
        } else {
            delete config['--no-cleanup'];
        }
        updateCommandPreview();
    });

    // 错误时不降低分辨率
    document.getElementById('noDownsizeOnError').addEventListener('change', (e) => {
        if (e.target.checked) {
            config['--no-downsize-on-error'] = true;
        } else {
            delete config['--no-downsize-on-error'];
        }
        updateCommandPreview();
    });

    // 禁用mipmap
    document.getElementById('noMipmaps').addEventListener('change', (e) => {
        if (e.target.checked) {
            config['--no-mipmaps'] = true;
        } else {
            delete config['--no-mipmaps'];
        }
        updateCommandPreview();
    });

    // 使用原始按键事件
    document.getElementById('rawKeyEvents').addEventListener('change', (e) => {
        if (e.target.checked) {
            config['--raw-key-events'] = true;
        } else {
            delete config['--raw-key-events'];
        }
        updateCommandPreview();
    });

    // 要求音频
    document.getElementById('requireAudio').addEventListener('change', (e) => {
        if (e.target.checked) {
            config['--require-audio'] = true;
        } else {
            delete config['--require-audio'];
        }
        updateCommandPreview();
    });
});

