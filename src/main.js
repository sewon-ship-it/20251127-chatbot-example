import './style.css'

// 대화 기록을 배열로 관리
let chatHistory = [];

// API Key 상태 확인 및 표시
function checkApiKeyStatus() {
  const statusElement = document.getElementById('api-status');
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (apiKey && apiKey.trim() !== '') {
    statusElement.innerHTML = `
      <span class="status-icon status-success">✓</span>
      <span class="status-text">API Key가 설정되어 있습니다</span>
    `;
    statusElement.className = 'api-status success';
    return true;
  } else {
    statusElement.innerHTML = `
      <span class="status-icon status-error">✗</span>
      <span class="status-text">API Key가 설정되지 않았습니다 (.env 파일 확인)</span>
    `;
    statusElement.className = 'api-status error';
    return false;
  }
}

// OpenAI API 호출 함수
async function callChatGPT() {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API Key가 설정되지 않았습니다');
  }

  // 시스템 프롬프트를 저녁 메뉴 추천에 맞게 설정
  const messages = [
    {
      role: 'system',
      content: '당신은 친절한 저녁 메뉴 추천 챗봇입니다. 사용자의 취향과 상황에 맞는 맛있는 저녁 메뉴를 추천해주세요. 대화는 친근하고 자연스럽게 진행하세요.'
    },
    ...chatHistory
  ];

  try {
    // Vite 프록시를 통해 OpenAI API 호출
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API 오류: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    throw error;
  }
}

// 메시지 추가 함수
function addMessage(content, isUser) {
  const messagesContainer = document.getElementById('messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
  
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  messageContent.textContent = content;
  
  messageDiv.appendChild(messageContent);
  messagesContainer.appendChild(messageDiv);
  
  // 스크롤을 맨 아래로
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 로딩 메시지 표시
function showLoading() {
  const messagesContainer = document.getElementById('messages');
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loading-message';
  loadingDiv.className = 'message bot-message';
  loadingDiv.innerHTML = '<div class="message-content loading">생각 중...</div>';
  messagesContainer.appendChild(loadingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 로딩 메시지 제거
function hideLoading() {
  const loadingMessage = document.getElementById('loading-message');
  if (loadingMessage) {
    loadingMessage.remove();
  }
}

// 메시지 전송 함수
async function sendMessage() {
  const input = document.getElementById('user-input');
  const userMessage = input.value.trim();
  
  if (!userMessage) return;
  
  // 사용자 메시지를 chatHistory에 추가
  chatHistory.push({
    role: 'user',
    content: userMessage
  });
  
  // 사용자 메시지 표시
  addMessage(userMessage, true);
  input.value = '';
  
  // 로딩 표시
  showLoading();
  
  try {
    const botResponse = await callChatGPT();
    hideLoading();
    
    // 봇 응답을 chatHistory에 추가
    chatHistory.push({
      role: 'assistant',
      content: botResponse
    });
    
    // 봇 응답 표시
    addMessage(botResponse, false);
  } catch (error) {
    hideLoading();
    
    // 오류 발생 시 사용자 메시지도 chatHistory에서 제거
    chatHistory.pop();
    
    addMessage(`오류가 발생했습니다: ${error.message}`, false);
    console.error('ChatGPT API 오류:', error);
  }
}

// 앱 초기화
function initApp() {
  document.querySelector('#app').innerHTML = `
    <div class="chatbot-container">
      <div class="api-status-container">
        <div id="api-status" class="api-status">
          <span class="status-icon">⏳</span>
          <span class="status-text">API Key 확인 중...</span>
        </div>
      </div>
      
      <div class="chatbot-header">
        <h1>🍽️ 저녁 메뉴 추천 챗봇</h1>
        <p>오늘 저녁 뭐 먹을지 고민되시나요? 저와 함께 맛있는 메뉴를 찾아보세요!</p>
      </div>
      
      <div class="chatbot-body">
        <div id="messages" class="messages-container">
          <div class="message bot-message">
            <div class="message-content">
              안녕하세요! 오늘 저녁 메뉴를 추천해드리는 챗봇입니다. 어떤 음식을 좋아하시나요? 또는 특별히 먹고 싶은 게 있으신가요?
            </div>
          </div>
        </div>
        
        <div class="input-container">
          <input 
            type="text" 
            id="user-input" 
            placeholder="메시지를 입력하세요..." 
            autocomplete="off"
          />
          <button id="send-button" type="button">전송</button>
        </div>
      </div>
    </div>
  `;
  
  // API Key 상태 확인
  checkApiKeyStatus();
  
  // 이벤트 리스너 등록
  const input = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  
  sendButton.addEventListener('click', sendMessage);
  
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  // 입력 필드에 포커스
  input.focus();
}

// DOM이 준비되면 앱 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}