import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import io from 'socket.io-client';

export default function App() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [serverIP, setServerIP] = useState('192.168.1.100');
  const [serverPort, setServerPort] = useState('5000');
  const [status, setStatus] = useState('غير متصل');
  const [response, setResponse] = useState('');

  // الاتصال بالخادم
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const connectToServer = () => {
    try {
      const URL = `http://${serverIP}:${serverPort}`;
      console.log('محاولة الاتصال بـ:', URL);

      const newSocket = io(URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      newSocket.on('connect', () => {
        console.log('✅ تم الاتصال');
        setConnected(true);
        setStatus('متصل ✅');
        setResponse('تم الاتصال بنجاح!');
      });

      newSocket.on('disconnect', () => {
        console.log('❌ انقطع الاتصال');
        setConnected(false);
        setStatus('غير متصل ❌');
        setResponse('تم قطع الاتصال');
      });

      newSocket.on('response', (data) => {
        setResponse(data.message);
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('خطأ:', error);
      setResponse('خطأ في الاتصال');
    }
  };

  const disconnectFromServer = () => {
    if (socket) {
      socket.disconnect();
      setConnected(false);
      setStatus('غير متصل');
      setResponse('تم قطع الاتصال');
    }
  };

  // إرسال الأوامر
  const sendCommand = (command, data = {}) => {
    if (socket && connected) {
      console.log('إرسال الأمر:', command);
      socket.emit(command, data);
    } else {
      setResponse('❌ أنت غير متصل بالخادم');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* الرأس */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AHMED-PC 🎮</Text>
        <Text style={styles.headerSubtitle}>التحكم بـ Windows من الجوال</Text>
      </View>

      {/* حالة الاتصال */}
      <View style={styles.statusSection}>
        <Text style={styles.statusLabel}>حالة الاتصال:</Text>
        <Text style={[styles.statusText, connected ? styles.connected : styles.disconnected]}>
          {status}
        </Text>
      </View>

      {/* إعدادات الاتصال */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>⚙️ إعدادات الاتصال</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>عنوان IP:</Text>
          <TextInput
            style={styles.input}
            placeholder="مثال: 192.168.1.100"
            value={serverIP}
            onChangeText={setServerIP}
            editable={!connected}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>المنفذ (Port):</Text>
          <TextInput
            style={styles.input}
            placeholder="5000"
            value={serverPort}
            onChangeText={setServerPort}
            keyboardType="numeric"
            editable={!connected}
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.connectButton]}
            onPress={connectToServer}
            disabled={connected}
          >
            <Text style={styles.buttonText}>🔗 اتصل</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.disconnectButton]}
            onPress={disconnectFromServer}
            disabled={!connected}
          >
            <Text style={styles.buttonText}>🔌 قطع</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* التحكم بالجهاز */}
      <View style={styles.commandsSection}>
        <Text style={styles.sectionTitle}>🖥️ التحكم بالجهاز</Text>

        {/* الصف الأول */}
        <View style={styles.commandRow}>
          <TouchableOpacity
            style={[styles.commandButton, styles.shutdownButton]}
            onPress={() => sendCommand('shutdown')}
            disabled={!connected}
          >
            <Text style={styles.commandButtonText}>⏹️ إيقاف</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.commandButton, styles.restartButton]}
            onPress={() => sendCommand('restart')}
            disabled={!connected}
          >
            <Text style={styles.commandButtonText}>🔄 إعادة</Text>
          </TouchableOpacity>
        </View>

        {/* الصف الثاني */}
        <View style={styles.commandRow}>
          <TouchableOpacity
            style={[styles.commandButton, styles.lockButton]}
            onPress={() => sendCommand('lock_screen')}
            disabled={!connected}
          >
            <Text style={styles.commandButtonText}>🔒 قفل</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.commandButton, styles.volumeButton]}
            onPress={() => sendCommand('volume_control', { action: 'mute' })}
            disabled={!connected}
          >
            <Text style={styles.commandButtonText}>🔇 صامت</Text>
          </TouchableOpacity>
        </View>

        {/* الصف الثالث */}
        <View style={styles.commandRow}>
          <TouchableOpacity
            style={[styles.commandButton, styles.volumeUpButton]}
            onPress={() => sendCommand('volume_control', { action: 'up' })}
            disabled={!connected}
          >
            <Text style={styles.commandButtonText}>🔊 صوت +</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.commandButton, styles.volumeDownButton]}
            onPress={() => sendCommand('volume_control', { action: 'down' })}
            disabled={!connected}
          >
            <Text style={styles.commandButtonText}>🔉 صوت -</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* الاستجابة */}
      {response && (
        <View style={styles.responseSection}>
          <Text style={styles.responseLabel}>الاستجابة:</Text>
          <View style={styles.responseBox}>
            <Text style={styles.responseText}>{response}</Text>
          </View>
        </View>
      )}

      {/* التذييل */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>AHMED-PC v1.0.0</Text>
        <Text style={styles.footerSmall}>صنع بـ ❤️</Text>
      </View>
    </ScrollView>
  );
}

// الأنماط
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#16213e',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#aaa',
  },
  statusSection: {
    padding: 20,
    backgroundColor: '#16213e',
    margin: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  connected: {
    color: '#00ff00',
  },
  disconnected: {
    color: '#ff0000',
  },
  settingsSection: {
    backgroundColor: '#16213e',
    margin: 10,
    padding: 15,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0f3460',
    borderColor: '#00d4ff',
    borderWidth: 1,
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  connectButton: {
    backgroundColor: '#00d4ff',
  },
  disconnectButton: {
    backgroundColor: '#ff6b6b',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  commandsSection: {
    backgroundColor: '#16213e',
    margin: 10,
    padding: 15,
    borderRadius: 10,
  },
  commandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  commandButton: {
    flex: 1,
    paddingVertical: 25,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  commandButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  shutdownButton: {
    backgroundColor: '#ff0000',
  },
  restartButton: {
    backgroundColor: '#ff8c00',
  },
  lockButton: {
    backgroundColor: '#9c27b0',
  },
  volumeButton: {
    backgroundColor: '#4caf50',
  },
  volumeUpButton: {
    backgroundColor: '#2196f3',
  },
  volumeDownButton: {
    backgroundColor: '#1976d2',
  },
  responseSection: {
    backgroundColor: '#16213e',
    margin: 10,
    padding: 15,
    borderRadius: 10,
  },
  responseLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  responseBox: {
    backgroundColor: '#0f3460',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#00d4ff',
  },
  responseText: {
    color: '#00d4ff',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    color: '#aaa',
    fontSize: 14,
  },
  footerSmall: {
    color: '#555',
    fontSize: 12,
    marginTop: 5,
  },
});
