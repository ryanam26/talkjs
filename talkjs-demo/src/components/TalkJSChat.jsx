import React, { useEffect, useRef } from 'react';

const APP_ID = 'tgga7aVE'; // Replace with your TalkJS App ID

const TalkJSChat = () => {
  const chatboxEl = useRef(null);
  const sessionRef = useRef(null);

  useEffect(() => {
    let session;
    const interval = setInterval(() => {
      console.log('Checking for TalkJS:', window.Talk, window.Talk && window.Talk.ready);
      if (window.Talk && window.Talk.ready) {
        window.Talk.ready.then(() => {
          console.log('TalkJS ready!');
          // User
          const me = new window.Talk.User({
            id: 'nina',
            name: 'Nina',
            email: 'nina@example.com',
            role: 'default',
            photoUrl: 'https://talkjs.com/new-web/avatar-7.jpg',
            welcomeMessage: 'Hi!',
          });
          // Bot
          const bot = new window.Talk.User({
            id: 'chatbotExampleBot',
            name: 'NFTYBot 🤖',
            email: 'bot@example.com',
            role: 'default',
            photoUrl: 'https://talkjs.com/new-web/talkjs-logo.svg',
            welcomeMessage: 'Hey there! How can I help?',
          });

          session = new window.Talk.Session({
            appId: APP_ID,
            me: me,
          });

          // Use a unique conversation ID for a fresh chat every load
          const uniqueConversationId = `nina_and_bot_${Date.now()}`;
          const conversation = session.getOrCreateConversation(uniqueConversationId);
          conversation.setParticipant(me);
          conversation.setParticipant(bot);

          const chatbox = session.createChatbox();
          chatbox.select(conversation);
          chatbox.mount(chatboxEl.current);
          sessionRef.current = session;
        });
        clearInterval(interval);
      }
    }, 100);

    return () => {
      clearInterval(interval);
      if (sessionRef.current) {
        sessionRef.current.destroy();
      }
    };
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div
        ref={chatboxEl}
        style={{ width: 400, maxWidth: '90vw', margin: '0 auto', height: '500px' }}
      >
        <i>Loading chat...</i>
      </div>
    </div>
  );
};

export default TalkJSChat; 