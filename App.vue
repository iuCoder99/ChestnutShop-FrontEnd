<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/userStore';
import { useChatStore } from '@/store/modules/chatStore';
import socketService from '@/utils/websocket';

const userStore = useUserStore();
const chatStore = useChatStore();

onLaunch(() => {
  console.log('App Launch');
  
  // 初始化 WebSocket 连接
  if (userStore.token) {
    initWebSocket();
  }
});

onShow(() => {
  console.log('App Show');
});

onHide(() => {
  console.log('App Hide');
});

// 初始化 WebSocket 并设置全局监听
const initWebSocket = () => {
  socketService.connect(userStore.token);
  
  // 监听新消息推送
  socketService.on('PUSH_MSG', (data) => {
    chatStore.handlePushMsg(data);
  });
  
  // 监听消息确认
  socketService.on('MSG_ACK', (data) => {
    chatStore.handleMsgAck(data);
  });
};
</script>

<style>
	/*每个页面公共css */
</style>
