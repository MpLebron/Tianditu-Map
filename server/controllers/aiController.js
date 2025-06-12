// 这里是AI生成地图代码的控制器
const axios = require('axios');
require('dotenv').config();

// 与Claude AI对话的函数
exports.chatWithAI = async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ message: '消息不能为空且必须是数组格式' });
        }

        console.log('API密钥:', process.env.CLAUDE_API_KEY);
        console.log('请求消息:', JSON.stringify(messages));

        // 注意：当前使用的是非流式API调用方式
        // Claude API支持流式响应，但需要使用不同的端点和处理方式
        // 目前我们使用的是标准的完成端点，一次性返回完整响应

        // 注意：要获取Claude的思考过程(thinking)，需要在请求中启用extended_thinking参数
        // 但目前aihubmix.com的API可能不支持此功能，或需要特定的请求头
        const response = await axios.post('https://aihubmix.com/v1/chat/completions', {
            model: "claude-3-5-sonnet-20241022", // 使用用户示例中的模型
            messages: messages,
            max_tokens: 4000,
            // 尝试启用扩展思考功能，如果API支持的话
            extended_thinking: true
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.CLAUDE_API_KEY}`,
                'Content-Type': 'application/json',
                // 添加Claude扩展思考的beta请求头，如果API支持的话
                'anthropic-beta': 'extended-thinking-2024-01-11'
            },
            timeout: 30000 // 设置30秒超时
        });

        console.log('API响应状态:', response.status);
        console.log('API响应头:', JSON.stringify(response.headers));

        // 获取API响应
        const aiResponse = response.data;

        // 提取内容
        let content = '';
        let thinking = '';

        // 根据Claude API返回格式处理内容
        if (aiResponse.choices && aiResponse.choices[0] && aiResponse.choices[0].message) {
            // 标准OpenAI格式响应
            content = aiResponse.choices[0].message.content;

            // 检查是否有扩展思考内容
            if (aiResponse.choices[0].message.extended_thinking) {
                thinking = aiResponse.choices[0].message.extended_thinking;
            }
        } else if (aiResponse.content && Array.isArray(aiResponse.content)) {
            // Claude特定格式响应
            const textItem = aiResponse.content.find(item => item.type === 'text');
            content = textItem ? textItem.text : '';
        }

        // 如果有扩展思考(extended thinking)
        if (aiResponse.extended_thinking) {
            thinking = aiResponse.extended_thinking;
        }

        // 如果thinking为空，生成一个说明
        if (!thinking) {
            thinking = "注意：当前API响应中没有包含思考过程(thinking)。这可能是因为:\n" +
                "1. 所使用的API端点不支持扩展思考功能\n" +
                "2. 需要特定的API密钥权限\n" +
                "3. 需要在请求中添加特定的参数或请求头\n\n" +
                "请参考Claude官方文档了解如何启用扩展思考功能。";
        }

        // 返回处理后的结果
        res.status(200).json({
            role: 'assistant',
            content: content,
            thinking: thinking,
            // 可选：返回原始响应供调试
            rawResponse: aiResponse
        });

    } catch (error) {
        console.error('Claude API调用错误:', error);
        console.error('错误详情:', error.response?.data || '无响应数据');
        console.error('错误状态:', error.response?.status || '无状态码');
        console.error('错误信息:', error.message);

        res.status(500).json({
            message: '与Claude AI对话失败',
            error: error.message,
            details: error.response?.data || '无详细信息'
        });
    }
};

// 新增：流式对话函数
exports.chatWithAIStream = async (req, res) => {
    try {
        // 兼容GET和POST
        let messages = [];
        if (req.method === 'GET') {
            const userMsg = req.query.q;
            if (!userMsg) {
                res.writeHead(400, { 'Content-Type': 'text/event-stream' });
                res.write(`data: ${JSON.stringify({ type: 'error', error: '消息不能为空' })}\n\n`);
                res.end();
                return;
            }
            messages = [
                {
                    role: 'system', content: `您好，我是政务版地理底图生成器，能根据用户描述基于地理底图API生成应用代码。。以下是常用功能的标准写法示例：

默认的密钥：1d0dcde810c40ba139e57ec790e56a05

【为地图上的标记点添加提示信息窗口】
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8"/>
    <title>天地图－地图API－范例－多个点的信息窗口</title>
    <script type="text/javascript" src="http://api.tianditu.gov.cn/api?v=4.0&tk=1d0dcde810c40ba139e57ec790e56a05"></script>
    <style type="text/css">
        body, html{width: 100%;height: 100%;margin:0;font-family:"微软雅黑";}
        #mapDiv{height:100%;width:100%;}
        input,p { margin-top: 10px; margin-left: 5px; font-size: 14px;  }
    </style>
    <script>
        var map
        var zoom = 15;
        function onLoad() {

            var data_info = [[116.417854,39.921988,"地址：北京市东城区王府井大街88号乐天银泰百货八层"],
                [116.406605,39.921585,"地址：北京市东城区东华门大街"],
                [116.412222,39.912345,"地址：北京市东城区正义路甲5号"]
            ];

            //初始化地图对象
            map = new T.Map("mapDiv");
            //设置显示地图的中心点和级别
            map.centerAndZoom(new T.LngLat(116.41593, 39.92313), zoom);

            for(var i=0;i<data_info.length;i++){
                var marker = new T.Marker(new T.LngLat(data_info[i][0],data_info[i][1]));  // 创建标注
                var content = data_info[i][2];
                map.addOverLay(marker);               // 将标注添加到地图中
                addClickHandler(content,marker);
            }
            function addClickHandler(content,marker){
                marker.addEventListener("click",function(e){
                    openInfo(content,e)}
                );
            }
            function openInfo(content,e){
                var point = e.lnglat;
                marker = new T.Marker(point);// 创建标注
                var markerInfoWin = new T.InfoWindow(content,{offset:new T.Point(0,-30)}); // 创建信息窗口对象
                map.openInfoWindow(markerInfoWin,point); //开启信息窗口
            }
        }
    </script>
</head>
<body onLoad="onLoad()">
<div id="mapDiv"></div>
</body>
</html>

【添加海量点图层】
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8"/>
    <meta name="keywords" content="天地图"/>
    <title>天地图－地图API－范例－海量密集点</title>
    <script src="http://api.tianditu.gov.cn/api?v=4.0&tk=1d0dcde810c40ba139e57ec790e56a05" type="text/javascript"></script>
    <script src="http://lbs.tianditu.gov.cn/api/js4.0/opensource/data/points-sample-data.js"></script>
    <style type="text/css">body,html{width:100%;height:100%;margin:0;font-family:"Microsoft YaHei"}#mapDiv{width:100%;height:100%}input,b,p{margin-left:5px;font-size:14px}</style>
    <script>
        var map;
        var zoom = 4;
        var lnglats;
        var _CloudCollection;
        function onLoad() {
            map = new T.Map('mapDiv');
            map.centerAndZoom(new T.LngLat(108.95, 34.27), zoom)
            lnglats = [];
            for (var i = 0; i < data.data.length; i++) {
                var ll = new T.LngLat(data.data[i][0], data.data[i][1])
                lnglats.push(ll)
            }
            if (document.createElement('canvas').getContext) {  // 判断当前浏览器是否支持绘制海量点
                _CloudCollection = new T.CloudMarkerCollection(lnglats, {
                    color: 'blue',
                    SizeType: TDT_POINT_SIZE_SMALL
                })
                map.addOverLay(_CloudCollection);
            } else {
                alert('此示例目前只有在IE9及以上浏览器打开');
            }
        }
    </script>
</head>
<body onLoad="onLoad()">
<div id="mapDiv"></div>
</body>
</html>

【行驶轨迹示例代码 当用户问到驾驶轨迹的时候，你一定要参考这个代码来进行生成】
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8"/>
    <meta name="keywords" content="天地图"/>
    <title>天地图－地图API－范例－单个标注点沿直线的轨迹运动</title>
    <script type="text/javascript" src="http://api.tianditu.gov.cn/api?v=4.0&tk=您的密钥"></script>
    <script src="http://lbs.tianditu.gov.cn/js/lib/jquery/jquery-1.7.2.min.js"></script>
    <script src="http://lbs.tianditu.gov.cn/js/lib/d3/d3.min.js" charset="utf-8"></script>
    <script src="http://lbs.tianditu.gov.cn/api/js4.0/opensource/openlibrary/D3SvgOverlay.js"></script>
    <script src="http://lbs.tianditu.gov.cn/api/js4.0/opensource/openlibrary/CarTrack.js"></script>
    <style type="text/css">
        body, html{width: 100%;height: 100%;margin:0;font-family:"微软雅黑";}
        #mapDiv{height:400px;width:100%;}
        input,p { margin-top: 10px; margin-left: 5px; font-size: 14px;  }
    </style>
    <script>
        var map, drivingRoute;
        var zoom = 13;
        var _CarTrack;
        var startIcon = "http://lbs.tianditu.gov.cn/images/bus/start.png";	//起点图标
        var endIcon = "http://lbs.tianditu.gov.cn/images/bus/end.png";		//终点图标
        function onLoad() {
            map = new T.Map('mapDiv');
            map.centerAndZoom(new T.LngLat(116.40069, 39.89945), zoom);
            var config = {
                policy: 0,	//驾车策略
                onSearchComplete: searchResult	//检索完成后的回调函数
            };
            drivingRoute = new T.DrivingRoute(map, config);
            searchDrivingRoute()
        }

        function searchDrivingRoute() {
            map.clearOverLays();
            var startLngLat = new T.LngLat(116.354060,39.905650);
            var endLngLat = new T.LngLat(116.428130,39.903550);
            //驾车路线搜索
            drivingRoute.search(startLngLat, endLngLat);
        }

        function createRoute(lnglats, lineColor) {
            _CarTrack = new T.CarTrack(map, {
                interval: 20,
                speed: 10,
                dynamicLine: true,
                Datas: lnglats,
                polylinestyle: {color: "#2C64A7", width: 5, opacity: 0.9}
            })
        }

        //添加起始点
        function createStartMarker(result) {
            var startMarker = new T.Marker(result.getStart(), {
                icon: new T.Icon({
                    iconUrl: startIcon,
                    iconSize: new T.Point(44, 34),
                    iconAnchor: new T.Point(12, 31)
                })
            });
            map.addOverLay(startMarker);
            var endMarker = new T.Marker(result.getEnd(), {
                icon: new T.Icon({
                    iconUrl: endIcon,
                    iconSize: new T.Point(44, 34),
                    iconAnchor: new T.Point(12, 31)
                })
            });
            map.addOverLay(endMarker);
        }
        
        function searchResult(result) {
            //添加起始点
            createStartMarker(result);
            obj = result;
            //获取方案个数
            var routes = result.getNumPlans();
            for (var i = 0; i < routes; i++) {
                //获得单条驾车方案结果对象
                var plan = result.getPlan(i);
                createRoute(plan.getPath());

            }
        }

    </script>
</head>
<body onLoad="onLoad()">
<div id="mapDiv"></div>
<p>本例演示单个标注点沿直线的轨迹运动</p>
<div >
    <input type="button" value="开始" onClick="_CarTrack.start();"/>
    <input type="button" value="暂停" onClick="_CarTrack.pause();"/>
    <input type="button" value="结束" onClick="_CarTrack.stop();"/>
</div>

</body>
</html>` },
                { role: 'assistant', content: '你是一个地图生成器，能根据用户描述生成地图代码。' },
                { role: 'user', content: userMsg }
            ];
        } else {
            messages = req.body.messages;
        }
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ message: '消息不能为空且必须是数组格式' });
        }

        // 如果没有system消息，添加一个默认的system消息
        if (!messages.some(msg => msg.role === 'system')) {
            messages.unshift({
                role: 'system', content: `你是一个天地图API专家，生成的代码要严格遵循天地图官方API规范。你回复的内容中，不能省略代码。 以下是常用功能的标准写法示例：

默认的密钥：1d0dcde810c40ba139e57ec790e56a05

【行驶轨迹示例代码 当用户问到驾驶轨迹的时候，你一定要参考上面这个代码来进行生成】

【为地图上的标记点添加提示信息窗口】
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8"/>
    <title>天地图－地图API－范例－多个点的信息窗口</title>
    <script type="text/javascript" src="http://api.tianditu.gov.cn/api?v=4.0&tk=1d0dcde810c40ba139e57ec790e56a05"></script>
    <style type="text/css">
        body, html{width: 100%;height: 100%;margin:0;font-family:"微软雅黑";}
        #mapDiv{height:100%;width:100%;}
        input,p { margin-top: 10px; margin-left: 5px; font-size: 14px;  }
    </style>
    <script>
        var map
        var zoom = 15;
        function onLoad() {

            var data_info = [[116.417854,39.921988,"地址：北京市东城区王府井大街88号乐天银泰百货八层"],
                [116.406605,39.921585,"地址：北京市东城区东华门大街"],
                [116.412222,39.912345,"地址：北京市东城区正义路甲5号"]
            ];

            //初始化地图对象
            map = new T.Map("mapDiv");
            //设置显示地图的中心点和级别
            map.centerAndZoom(new T.LngLat(116.41593, 39.92313), zoom);

            for(var i=0;i<data_info.length;i++){
                var marker = new T.Marker(new T.LngLat(data_info[i][0],data_info[i][1]));  // 创建标注
                var content = data_info[i][2];
                map.addOverLay(marker);               // 将标注添加到地图中
                addClickHandler(content,marker);
            }
            function addClickHandler(content,marker){
                marker.addEventListener("click",function(e){
                    openInfo(content,e)}
                );
            }
            function openInfo(content,e){
                var point = e.lnglat;
                marker = new T.Marker(point);// 创建标注
                var markerInfoWin = new T.InfoWindow(content,{offset:new T.Point(0,-30)}); // 创建信息窗口对象
                map.openInfoWindow(markerInfoWin,point); //开启信息窗口
            }
        }
    </script>
</head>
<body onLoad="onLoad()">
<div id="mapDiv"></div>
</body>
</html>

【添加海量点图层】
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8"/>
    <meta name="keywords" content="天地图"/>
    <title>天地图－地图API－范例－海量密集点</title>
    <script src="http://api.tianditu.gov.cn/api?v=4.0&tk=1d0dcde810c40ba139e57ec790e56a05" type="text/javascript"></script>
    <script src="http://lbs.tianditu.gov.cn/api/js4.0/opensource/data/points-sample-data.js"></script>
    <style type="text/css">body,html{width:100%;height:100%;margin:0;font-family:"Microsoft YaHei"}#mapDiv{width:100%;height:100%}input,b,p{margin-left:5px;font-size:14px}</style>
    <script>
        var map;
        var zoom = 4;
        var lnglats;
        var _CloudCollection;
        function onLoad() {
            map = new T.Map('mapDiv');
            map.centerAndZoom(new T.LngLat(108.95, 34.27), zoom)
            lnglats = [];
            for (var i = 0; i < data.data.length; i++) {
                var ll = new T.LngLat(data.data[i][0], data.data[i][1])
                lnglats.push(ll)
            }
            if (document.createElement('canvas').getContext) {  // 判断当前浏览器是否支持绘制海量点
                _CloudCollection = new T.CloudMarkerCollection(lnglats, {
                    color: 'blue',
                    SizeType: TDT_POINT_SIZE_SMALL
                })
                map.addOverLay(_CloudCollection);
            } else {
                alert('此示例目前只有在IE9及以上浏览器打开');
            }
        }
    </script>
</head>
<body onLoad="onLoad()">
<div id="mapDiv"></div>
</body>
</html>

【行驶轨迹示例代码 当用户问到驾驶轨迹的时候，你一定要参考这个代码来进行生成】
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8"/>
    <meta name="keywords" content="天地图"/>
    <title>天地图－地图API－范例－单个标注点沿直线的轨迹运动</title>
    <script type="text/javascript" src="http://api.tianditu.gov.cn/api?v=4.0&tk=您的密钥"></script>
    <script src="http://lbs.tianditu.gov.cn/js/lib/jquery/jquery-1.7.2.min.js"></script>
    <script src="http://lbs.tianditu.gov.cn/js/lib/d3/d3.min.js" charset="utf-8"></script>
    <script src="http://lbs.tianditu.gov.cn/api/js4.0/opensource/openlibrary/D3SvgOverlay.js"></script>
    <script src="http://lbs.tianditu.gov.cn/api/js4.0/opensource/openlibrary/CarTrack.js"></script>
    <style type="text/css">
        body, html{width: 100%;height: 100%;margin:0;font-family:"微软雅黑";}
        #mapDiv{height:400px;width:100%;}
        input,p { margin-top: 10px; margin-left: 5px; font-size: 14px;  }
    </style>
    <script>
        var map, drivingRoute;
        var zoom = 13;
        var _CarTrack;
        var startIcon = "http://lbs.tianditu.gov.cn/images/bus/start.png";	//起点图标
        var endIcon = "http://lbs.tianditu.gov.cn/images/bus/end.png";		//终点图标
        function onLoad() {
            map = new T.Map('mapDiv');
            map.centerAndZoom(new T.LngLat(116.40069, 39.89945), zoom);
            var config = {
                policy: 0,	//驾车策略
                onSearchComplete: searchResult	//检索完成后的回调函数
            };
            drivingRoute = new T.DrivingRoute(map, config);
            searchDrivingRoute()
        }

        function searchDrivingRoute() {
            map.clearOverLays();
            var startLngLat = new T.LngLat(116.354060,39.905650);
            var endLngLat = new T.LngLat(116.428130,39.903550);
            //驾车路线搜索
            drivingRoute.search(startLngLat, endLngLat);
        }

        function createRoute(lnglats, lineColor) {
            _CarTrack = new T.CarTrack(map, {
                interval: 20,
                speed: 10,
                dynamicLine: true,
                Datas: lnglats,
                polylinestyle: {color: "#2C64A7", width: 5, opacity: 0.9}
            })
        }

        //添加起始点
        function createStartMarker(result) {
            var startMarker = new T.Marker(result.getStart(), {
                icon: new T.Icon({
                    iconUrl: startIcon,
                    iconSize: new T.Point(44, 34),
                    iconAnchor: new T.Point(12, 31)
                })
            });
            map.addOverLay(startMarker);
            var endMarker = new T.Marker(result.getEnd(), {
                icon: new T.Icon({
                    iconUrl: endIcon,
                    iconSize: new T.Point(44, 34),
                    iconAnchor: new T.Point(12, 31)
                })
            });
            map.addOverLay(endMarker);
        }
        
        function searchResult(result) {
            //添加起始点
            createStartMarker(result);
            obj = result;
            //获取方案个数
            var routes = result.getNumPlans();
            for (var i = 0; i < routes; i++) {
                //获得单条驾车方案结果对象
                var plan = result.getPlan(i);
                createRoute(plan.getPath());

            }
        }

    </script>
</head>
<body onLoad="onLoad()">
<div id="mapDiv"></div>
<p>本例演示单个标注点沿直线的轨迹运动</p>
<div >
    <input type="button" value="开始" onClick="_CarTrack.start();"/>
    <input type="button" value="暂停" onClick="_CarTrack.pause();"/>
    <input type="button" value="结束" onClick="_CarTrack.stop();"/>
</div>

</body>
</html>

【行驶轨迹示例代码 当用户问到驾驶轨迹的时候，你一定要参考上面这个代码来进行生成】
</html>`
            });
        }

        console.log('流式API请求:', JSON.stringify({
            messages: messages
        }, null, 2));

        console.log('System提示词:', messages.find(msg => msg.role === 'system')?.content.substring(0, 100) + '...');

        // 设置SSE头部
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no' // 禁用Nginx缓冲
        });

        // 发送初始事件
        res.write(`data: ${JSON.stringify({ type: 'thinking', content: '正在分析您的请求...' })}\n\n`);

        // 创建请求配置
        const requestConfig = {
            method: 'post',
            url: 'https://aihubmix.com/v1/chat/completions',
            headers: {
                'Authorization': `Bearer ${process.env.CLAUDE_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream' // 关键：请求流式响应
            },
            data: {
                model: "claude-3-5-sonnet-20241022",
                messages: messages,
                max_tokens: 4000,
                stream: true // 关键：启用流式响应
            },
            responseType: 'stream', // 设置axios以流模式接收响应
            timeout: 60000 // 设置60秒超时
        };

        console.log('流式请求配置:', JSON.stringify({
            url: requestConfig.url,
            headers: {
                'Content-Type': requestConfig.headers['Content-Type'],
                'Accept': requestConfig.headers['Accept']
            },
            data: {
                model: requestConfig.data.model,
                stream: requestConfig.data.stream
            }
        }));

        // 发送请求
        const response = await axios(requestConfig);

        console.log('流式API响应已开始');

        // 处理流式响应
        response.data.on('data', (chunk) => {
            try {
                // 解析数据块
                const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.substring(6);

                        // 检查是否是结束标记
                        if (data === '[DONE]') {
                            console.log('流式传输完成');
                            res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
                            return;
                        }

                        try {
                            const parsedData = JSON.parse(data);

                            // 提取内容
                            let content = '';
                            if (parsedData.choices && parsedData.choices[0] && parsedData.choices[0].delta) {
                                content = parsedData.choices[0].delta.content || '';
                            }

                            if (content) {
                                // 发送内容给客户端
                                res.write(`data: ${JSON.stringify({ type: 'content', content })}\n\n`);
                            }
                        } catch (e) {
                            console.error('解析流数据错误:', e, '原始数据:', data);
                        }
                    }
                }
            } catch (e) {
                console.error('处理数据块错误:', e);
            }
        });

        // 处理流结束
        response.data.on('end', () => {
            console.log('流结束事件触发');
            res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
            res.end();
        });

        // 处理错误
        response.data.on('error', (err) => {
            console.error('流处理错误:', err);
            res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
            res.end();
        });

    } catch (error) {
        console.error('流式API调用错误:', error);
        console.error('错误详情:', error.response?.data || '无响应数据');
        console.error('错误状态:', error.response?.status || '无状态码');
        console.error('错误信息:', error.message);

        // 如果响应头尚未发送，则发送错误响应
        if (!res.headersSent) {
            return res.status(500).json({
                message: '与Claude AI对话失败',
                error: error.message,
                details: error.response?.data || '无详细信息'
            });
        }

        // 如果响应头已发送，则发送错误事件
        res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
        res.end();
    }
};