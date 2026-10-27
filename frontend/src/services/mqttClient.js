/**
 * SolarGuard EMQX Cloud MQTT Service
 * Manages WebSocket MQTT connections between the React Web App and ESP32 via EMQX Cloud.
 */
import mqtt from 'mqtt';

class SolarGuardMqttClient {
  constructor() {
    this.client = null;
    this.status = 'disconnected'; // 'disconnected' | 'connecting' | 'connected' | 'error'
    this.listeners = new Set();
    this.config = null;
  }

  /**
   * Subscribe to status and message events
   */
  subscribeListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(event, data) {
    for (const listener of this.listeners) {
      try {
        listener(event, data);
      } catch (err) {
        console.error('MQTT listener error:', err);
      }
    }
  }

  /**
   * Connect to EMQX MQTT Broker over WebSocket
   * @param {Object} options Configuration options
   */
  connect(options = {}) {
    const {
      broker = 'v20f2113.ala.asia-southeast1.emqxsl.com',
      port = 8084,
      useTls = true,
      path = '/mqtt',
      username = '',
      password = '',
      topicPrefix = 'solarguard'
    } = options;

    this.config = { broker, port, useTls, path, username, password, topicPrefix };

    if (this.client) {
      try {
        this.client.end(true);
      } catch (e) {
        // Ignore disconnect errors on old client
      }
    }

    const protocol = useTls ? 'wss' : 'ws';
    const brokerClean = broker.replace(/^(wss?:\/\/)/, '').replace(/\/.*$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const connectUrl = `${protocol}://${brokerClean}:${port}${cleanPath}`;
    const clientId = `solarguard_web_${Math.random().toString(16).substring(2, 8)}`;

    this.status = 'connecting';
    this.notifyListeners('status', { status: 'connecting', url: connectUrl });

    const clientOptions = {
      clientId,
      clean: true,
      connectTimeout: 8000,
      reconnectPeriod: 4000,
      keepalive: 60,
    };

    if (username && username.trim().length > 0) {
      clientOptions.username = username.trim();
    }
    if (password && password.trim().length > 0) {
      clientOptions.password = password.trim();
    }

    try {
      this.client = mqtt.connect(connectUrl, clientOptions);

      this.client.on('connect', () => {
        this.status = 'connected';
        this.notifyListeners('status', { status: 'connected', url: connectUrl, clientId });

        // Subscribe to ESP32 topics
        const topics = [
          `${topicPrefix}/telemetry`,
          `${topicPrefix}/wiper/status`,
          `${topicPrefix}/status`,
          `${topicPrefix}/alerts`,
          `${topicPrefix}/temperature/alert`
        ];

        this.client.subscribe(topics, (err) => {
          if (err) {
            console.error('[MQTT] Subscription error:', err);
          } else {
            console.log(`[MQTT] Subscribed to: ${topics.join(', ')}`);
          }
        });
      });

      this.client.on('message', (topic, payloadBuffer) => {
        const payloadStr = payloadBuffer.toString();
        let payloadJson = null;
        try {
          payloadJson = JSON.parse(payloadStr);
        } catch {
          payloadJson = { raw: payloadStr };
        }

        const nowIso = new Date().toISOString();
        this.notifyListeners('message', { topic, payload: payloadJson, raw: payloadStr, timestamp: nowIso });
        this.notifyListeners('rx', { topic, payload: payloadJson, raw: payloadStr, timestamp: nowIso });
      });

      this.client.on('error', (err) => {
        this.status = 'error';
        this.notifyListeners('status', { status: 'error', error: err.message });
        console.warn('[MQTT] Error:', err.message);
      });

      this.client.on('offline', () => {
        this.status = 'offline';
        this.notifyListeners('status', { status: 'offline' });
      });

      this.client.on('close', () => {
        if (this.status !== 'error') {
          this.status = 'disconnected';
          this.notifyListeners('status', { status: 'disconnected' });
        }
      });
    } catch (err) {
      this.status = 'error';
      this.notifyListeners('status', { status: 'error', error: err.message });
      console.error('[MQTT] Connect failed:', err);
    }
  }

  /**
   * Check if client is currently connected to broker
   */
  isConnected() {
    return !!(this.client && this.client.connected);
  }

  /**
   * Publish a message to a sub-topic under the configured prefix
   */
  publish(subTopic, payload, qos = 0) {
    const prefix = this.config?.topicPrefix || 'solarguard';
    const cleanSubTopic = subTopic.startsWith('/') ? subTopic.slice(1) : subTopic;
    const fullTopic = `${prefix}/${cleanSubTopic}`;
    const payloadStr = typeof payload === 'object' ? JSON.stringify(payload) : String(payload);
    const nowIso = new Date().toISOString();

    if (!this.client || !this.client.connected) {
      console.warn(`[MQTT] Cannot publish to ${fullTopic}: Client is not connected (status=${this.status})`);
      this.notifyListeners('tx', { topic: fullTopic, payload, raw: payloadStr, success: false, error: 'Client not connected to EMQX', timestamp: nowIso });
      return false;
    }

    this.client.publish(fullTopic, payloadStr, { qos }, (err) => {
      if (err) {
        console.error(`[MQTT] Failed to publish to ${fullTopic}:`, err);
        this.notifyListeners('tx', { topic: fullTopic, payload, raw: payloadStr, success: false, error: err.message, timestamp: new Date().toISOString() });
      } else {
        console.log(`[MQTT TX] Successfully published to ${fullTopic}: ${payloadStr}`);
        this.notifyListeners('tx', { topic: fullTopic, payload, raw: payloadStr, success: true, timestamp: new Date().toISOString() });
      }
    });
    return true;
  }

  /**
   * Send WIPE command to ESP32 SG90 Wiper
   */
  sendWiperCommand(command = 'WIPE', durationMs = 1800) {
    return this.publish('wiper/command', {
      command,
      durationMs,
      duration_ms: durationMs,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send STOP command (emergency cut-off)
   */
  sendEmergencyStop() {
    return this.publish('wiper/command', {
      command: 'STOP',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send RESET command
   */
  sendResetFault() {
    return this.publish('wiper/command', {
      command: 'RESET',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Disconnect cleanly
   */
  disconnect() {
    if (this.client) {
      try {
        this.client.end(true);
      } catch (err) {
        console.error('MQTT disconnect error:', err);
      }
      this.client = null;
      this.status = 'disconnected';
      this.notifyListeners('status', { status: 'disconnected' });
    }
  }
}

export const solarGuardMqtt = new SolarGuardMqttClient();
export default solarGuardMqtt;
