import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const App = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    socket.on('connect', () => console.log('Connected to server'));
    socket.on('message', (msg) => setMessage(msg));
    return () => socket.disconnect();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Video Call Mobile App</Text>
      <Text>{message}</Text>
    </View>
  );
};

export default App;
