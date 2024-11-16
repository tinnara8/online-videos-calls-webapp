import React, { useState, useEffect, useRef } from 'react';
import { Picker } from 'emoji-mart';
import 'emoji-mart/css/emoji-mart.css'; // ตรวจสอบว่าติดตั้ง emoji-mart แล้ว

const Chat = ({ socket, roomId }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.on('receive-message', (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    return () => {
      socket.off('receive-message');
    };
  }, [socket]);

  const sendMessage = () => {
    if (message.trim()) {
      const timestamp = new Date().toLocaleTimeString();
      socket.emit('send-message', { roomId, userId: socket.id, message, timestamp });
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'You', message, timestamp },
      ]);
      setMessage('');
    }
  };

  const addEmoji = (emoji) => {
    setMessage((prev) => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.sender === 'You' ? 'own-message' : ''}`}>
            <span className="chat-timestamp">{msg.timestamp}</span>
            <strong>{msg.sender}: </strong>
            {msg.message}
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>
      <div className="chat-input">
        {showEmojiPicker && (
          <div className="emoji-picker">
            <Picker onSelect={addEmoji} />
          </div>
        )}
        <button className="emoji-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
          😊
        </button>
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button className="send-btn" onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
