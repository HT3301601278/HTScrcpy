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

// 获取设备列表的函数
async function getConnectedDevices() {
    try {
        console.log('开始获取设备列表');
        const deviceStatus = document.getElementById('deviceStatus');
        const deviceList = document.getElementById('deviceList');
        
        if (!deviceStatus || !deviceList) {
            console.error('找不到必要的DOM元素');
            return;
        }
        
        deviceStatus.textContent = '正在获取设备列表...';
        
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
        const deviceStatus = document.getElementById('deviceStatus');
        if (deviceStatus) {
            deviceStatus.textContent = `获取设备列表失败: ${error.message}`;
            deviceStatus.className = 'form-text text-danger';
        }
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

// 预设管理相关功能
class PresetManager {
    constructor() {
        this.presets = this.loadPresets();
        this.currentCategory = 'all';
        this.searchText = '';
        this.initializeEventListeners();
        this.renderPresetList();
    }

    // 加载预设
    loadPresets() {
        const savedPresets = localStorage.getItem('scrcpy-presets');
        return savedPresets ? JSON.parse(savedPresets) : [];
    }

    // 保存预设
    savePresets() {
        localStorage.setItem('scrcpy-presets', JSON.stringify(this.presets));
    }

    // 添加预设
    addPreset(name, category, description, config) {
        const preset = {
            id: Date.now(),
            name,
            category,
            description,
            config: { ...config },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.presets.push(preset);
        this.savePresets();
        this.renderPresetList();
    }

    // 编辑预设
    editPreset(id, name, category, description) {
        const preset = this.presets.find(p => p.id === id);
        if (preset) {
            preset.name = name;
            preset.category = category;
            preset.description = description;
            preset.updatedAt = new Date().toISOString();
            this.savePresets();
            this.renderPresetList();
        }
    }

    // 删除预设
    deletePreset(id) {
        this.presets = this.presets.filter(preset => preset.id !== id);
        this.savePresets();
        this.renderPresetList();
    }

    // 应用预设
    applyPreset(preset) {
        config = { ...preset.config };
        this.updateFormElements();
        updateCommandPreview();
    }

    // 导出预设
    exportPresets() {
        const presetData = JSON.stringify(this.presets, null, 2);
        const blob = new Blob([presetData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scrcpy-presets-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 导入预设
    async importPresets(file) {
        try {
            const text = await file.text();
            const importedPresets = JSON.parse(text);
            
            // 验证导入的预设格式
            if (!Array.isArray(importedPresets)) {
                throw new Error('无效的预设文件格式');
            }

            // 合并预设，避免重复
            const existingIds = new Set(this.presets.map(p => p.id));
            const newPresets = importedPresets.filter(p => !existingIds.has(p.id));
            
            this.presets = [...this.presets, ...newPresets];
            this.savePresets();
            this.renderPresetList();
            
            return newPresets.length;
        } catch (error) {
            throw new Error('导入预设失败: ' + error.message);
        }
    }

    // 过滤预设
    filterPresets() {
        return this.presets.filter(preset => {
            const matchCategory = this.currentCategory === 'all' || preset.category === this.currentCategory;
            const matchSearch = this.searchText === '' || 
                preset.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
                preset.description.toLowerCase().includes(this.searchText.toLowerCase());
            return matchCategory && matchSearch;
        });
    }

    // 渲染预设列表
    renderPresetList() {
        const presetList = document.getElementById('presetList');
        const filteredPresets = this.filterPresets();
        
        presetList.innerHTML = filteredPresets.map(preset => `
            <div class="preset-item card mb-2" data-preset-id="${preset.id}">
                <div class="card-body p-2">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="mb-1">${preset.name}</h6>
                            <small class="text-muted d-block">${preset.description || '无描述'}</small>
                            <small class="text-muted d-block">
                                分类: ${this.getCategoryName(preset.category)} | 
                                更新时间: ${new Date(preset.updatedAt).toLocaleString()}
                            </small>
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary apply-preset" 
                                    title="应用预设">
                                <i class="bi bi-check2"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-secondary edit-preset" 
                                    title="编辑预设">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-preset" 
                                    title="删除预设">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 获取分类名称
    getCategoryName(category) {
        const categoryNames = {
            'display': '显示设置',
            'video': '视频设置',
            'audio': '音频设置',
            'control': '控制设置',
            'record': '录制设置',
            'other': '其他设置'
        };
        return categoryNames[category] || category;
    }

    // 更新表单元素
    updateFormElements() {
        for (const [key, value] of Object.entries(config)) {
            const element = document.querySelector(`[data-config-key="${key}"]`);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
            }
        }
    }

    // 初始化事件监听器
    initializeEventListeners() {
        // 保存预设
        document.getElementById('savePreset').addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('savePresetModal'));
            modal.show();
        });

        // 确认保存预设
        document.getElementById('savePresetConfirm').addEventListener('click', () => {
            const name = document.getElementById('presetName').value;
            const category = document.getElementById('presetCategorySelect').value;
            const description = document.getElementById('presetDescription').value;
            
            if (name) {
                this.addPreset(name, category, description, config);
                bootstrap.Modal.getInstance(document.getElementById('savePresetModal')).hide();
                
                // 清空表单
                document.getElementById('presetName').value = '';
                document.getElementById('presetDescription').value = '';
            }
        });

        // 确认编辑预设
        document.getElementById('editPresetConfirm').addEventListener('click', () => {
            const id = parseInt(document.getElementById('editPresetId').value);
            const name = document.getElementById('editPresetName').value;
            const category = document.getElementById('editPresetCategory').value;
            const description = document.getElementById('editPresetDescription').value;
            
            if (name) {
                this.editPreset(id, name, category, description);
                bootstrap.Modal.getInstance(document.getElementById('editPresetModal')).hide();
            }
        });

        // 导入预设
        document.getElementById('importPreset').addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = async (e) => {
                try {
                    const file = e.target.files[0];
                    const count = await this.importPresets(file);
                    alert(`成功导入 ${count} 个预设`);
                } catch (error) {
                    alert(error.message);
                }
            };
            input.click();
        });

        // 导出预设
        document.getElementById('exportPreset').addEventListener('click', () => {
            this.exportPresets();
        });

        // 清除所有预设
        document.getElementById('clearPresets').addEventListener('click', () => {
            if (confirm('确定要清除所有预设吗？此操作不可恢复！')) {
                this.presets = [];
                this.savePresets();
                this.renderPresetList();
            }
        });

        // 预设分类筛选
        document.getElementById('presetCategory').addEventListener('change', (e) => {
            this.currentCategory = e.target.value;
            this.renderPresetList();
        });

        // 预设搜索
        document.getElementById('presetSearch').addEventListener('input', (e) => {
            this.searchText = e.target.value;
            this.renderPresetList();
        });

        // 清除搜索
        document.getElementById('clearSearch').addEventListener('click', () => {
            document.getElementById('presetSearch').value = '';
            this.searchText = '';
            this.renderPresetList();
        });

        // 预设列表事件委托
        document.getElementById('presetList').addEventListener('click', (e) => {
            const presetItem = e.target.closest('.preset-item');
            if (!presetItem) return;

            const presetId = parseInt(presetItem.dataset.presetId);
            const preset = this.presets.find(p => p.id === presetId);

            if (e.target.closest('.apply-preset')) {
                this.applyPreset(preset);
            } else if (e.target.closest('.edit-preset')) {
                // 打开编辑模态框
                document.getElementById('editPresetId').value = preset.id;
                document.getElementById('editPresetName').value = preset.name;
                document.getElementById('editPresetCategory').value = preset.category;
                document.getElementById('editPresetDescription').value = preset.description;
                
                const modal = new bootstrap.Modal(document.getElementById('editPresetModal'));
                modal.show();
            } else if (e.target.closest('.delete-preset')) {
                if (confirm('确定要删除这个预设吗？')) {
                    this.deletePreset(presetId);
                }
            }
        });
    }
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

    // 初始化所有工具提示
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

    // 使用传统粘贴模式
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

    // 初始化预设管理器
    document.addEventListener('DOMContentLoaded', () => {
        window.presetManager = new PresetManager();
    });

    // 复制命令
    document.getElementById('copyCommand').addEventListener('click', copyCommand);

    // 运行命令
    document.getElementById('runCommand').addEventListener('click', runCommand);

    // 修改最大尺寸处理
    document.getElementById('maxSize').addEventListener('input', (e) => {
        console.log('最大尺寸输入值:', e.target.value);
        
        if (e.target.value) {
            config['--max-size'] = e.target.value;
        } else {
            delete config['--max-size'];
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
            // 根据帮助文档，直接使用数值
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

    // 添加显示参数设置的事件监听器
    
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
            config['--display'] = e.target.value;
        } else {
            delete config['--display'];
        }
        updateCommandPreview();
    });

    // 屏幕裁剪
    document.getElementById('crop').addEventListener('input', (e) => {
        if (e.target.value) {
            config['--crop'] = e.target.value;
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
