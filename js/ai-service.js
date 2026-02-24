/**
 * AI涂鸦服务
 * 支持多个AI服务提供商
 */

class AIGraffitiService {
    constructor() {
        this.provider = getAIProvider() || APP_CONFIG.ai.defaultProvider;
        this.apiKey = getApiKey();
    }

    /**
     * 更新配置
     */
    updateConfig(provider, apiKey) {
        this.provider = provider;
        this.apiKey = apiKey;
        saveAIProvider(provider);
        saveApiKey(apiKey);
    }

    /**
     * 生成图片
     * @param {string} prompt - 提示词
     * @param {object} options - 选项
     * @returns {Promise<string>} 图片URL
     */
    async generateImage(prompt, options = {}) {
        const {
            style = '',
            size = APP_CONFIG.ai.generation.defaultSize
        } = options;

        // 增强提示词
        const enhancedPrompt = this.enhancePrompt(prompt, style);

        console.log('AI生成请求:', {
            provider: this.provider,
            prompt: enhancedPrompt,
            size
        });

        try {
            switch (this.provider) {
                case 'HUGGINGFACE':
                    return await this.generateWithHuggingFace(enhancedPrompt, size);
                case 'ALIYUN':
                    return await this.generateWithAliyun(enhancedPrompt, size);
                case 'BAIDU':
                    return await this.generateWithBaidu(enhancedPrompt, size);
                case 'USER_PROVIDED':
                    return await this.generateWithUserProvided(enhancedPrompt, size);
                default:
                    throw new Error('未知的AI服务提供商');
            }
        } catch (error) {
            console.error('AI生成失败:', error);
            throw new Error(`AI生成失败: ${error.message}`);
        }
    }

    /**
     * 增强提示词
     */
    enhancePrompt(basePrompt, style) {
        if (!style || !APP_CONFIG.ai.styles[style]) {
            return basePrompt;
        }
        return `${basePrompt}, ${APP_CONFIG.ai.styles[style]}`;
    }

    /**
     * Hugging Face API（免费，有速率限制）
     */
    async generateWithHuggingFace(prompt, size) {
        const service = APP_CONFIG.ai.services.HUGGINGFACE;

        const response = await fetch(service.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    num_inference_steps: 25
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Hugging Face API请求失败');
        }

        // Hugging Face返回blob
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    }

    /**
     * 通义万相 API
     */
    async generateWithAliyun(prompt, size) {
        if (!this.apiKey) {
            throw new Error('请先配置API Key');
        }

        const service = APP_CONFIG.ai.services.ALIYUN;

        const response = await fetch(service.url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: service.model,
                input: {
                    prompt: prompt,
                    size: size
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '通义万相API请求失败');
        }

        const data = await response.json();
        return data.output.results[0].url;
    }

    /**
     * 百度文心 API
     */
    async generateWithBaidu(prompt, size) {
        if (!this.apiKey) {
            throw new Error('请先配置API Key');
        }

        const service = APP_CONFIG.ai.services.BAIDU;

        const response = await fetch(`${service.url}?access_token=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                size: size,
                n: 1
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error_msg || '文心API请求失败');
        }

        const data = await response.json();
        return data.data.imgUrl;
    }

    /**
     * 用户自带API Key（自建代理服务）
     * 这需要用户自己搭建一个简单的代理服务器
     */
    async generateWithUserProvided(prompt, size) {
        if (!this.apiKey) {
            throw new Error('请先配置API Key');
        }

        const service = APP_CONFIG.ai.services.USER_PROVIDED;

        // 用户可以配置自己的代理服务器地址
        const proxyUrl = getUserConfig('proxyUrl', service.url);

        try {
            const response = await fetch(proxyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey
                },
                body: JSON.stringify({
                    prompt: prompt,
                    size: size
                }),
                signal: AbortSignal.timeout(APP_CONFIG.ai.generation.timeout)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'API请求失败');
            }

            const data = await response.json();
            return data.imageUrl || data.url || data.image_url;

        } catch (error) {
            if (error.name === 'TimeoutError') {
                throw new Error('请求超时，请稍后重试');
            }
            throw error;
        }
    }

    /**
     * 保存最近的提示词
     */
    saveRecentPrompt(prompt) {
        let recent = getUserConfig(APP_CONFIG.storageKeys.recentPrompts, []);
        recent = recent.filter(p => p !== prompt); // 移除重复
        recent.unshift(prompt);
        recent = recent.slice(0, 10); // 保留最近10条
        saveUserConfig(APP_CONFIG.storageKeys.recentPrompts, recent);
    }

    /**
     * 获取最近的提示词
     */
    getRecentPrompts() {
        return getUserConfig(APP_CONFIG.storageKeys.recentPrompts, []);
    }

    /**
     * 检查配置是否完整
     */
    isConfigured() {
        if (this.provider === 'HUGGINGFACE') {
            return true; // 免费服务不需要Key
        }
        return !!this.apiKey;
    }

    /**
     * 获取当前提供商信息
     */
    getProviderInfo() {
        return APP_CONFIG.ai.services[this.provider] || {};
    }
}

/**
 * 自建代理服务器示例代码（用户可部署到Vercel/Cloudflare Workers）
 *
 * // api/generate.js (Vercel Serverless Function)
 * export default async function handler(req, res) {
 *     if (req.method !== 'POST') {
 *         return res.status(405).json({ error: 'Method not allowed' });
 *     }
 *
 *     const apiKey = req.headers['x-api-key'];
 *     if (!apiKey) {
 *         return res.status(401).json({ error: 'Missing API key' });
 *     }
 *
 *     const { prompt, size } = req.body;
 *
 *     // 转发到通义万相
 *     const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis', {
 *         method: 'POST',
 *         headers: {
 *             'Authorization': `Bearer ${apiKey}`,
 *             'Content-Type': 'application/json'
 *         },
 *         body: JSON.stringify({
 *             model: 'wanx-v1',
 *             input: { prompt, size }
 *         })
 *     });
 *
 *     const data = await response.json();
 *     res.status(200).json({ imageUrl: data.output.results[0].url });
 * }
 */

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIGraffitiService;
}
