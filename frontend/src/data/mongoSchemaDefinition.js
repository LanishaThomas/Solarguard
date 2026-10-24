/**
 * MongoDB Data Model Schemas for SolarGuard IoT
 * These schemas represent the collections in MongoDB (solarguard_db)
 */

export const MONGO_DB_NAME = 'solarguard_db';

export const MONGO_COLLECTIONS = {
  TELEMETRY: 'telemetry_readings',
  INSPECTIONS: 'camera_inspections',
  ALERTS: 'system_alerts',
  CLEANING_LOGS: 'cleaning_logs',
  SETTINGS: 'system_settings'
};

export const MONGO_SCHEMAS_DOCS = [
  {
    collection: MONGO_COLLECTIONS.TELEMETRY,
    description: 'Stores high-frequency sensor telemetry from ESP32 (INA219 x3 and DS18B20)',
    indexes: ['{ timestamp: -1 }', '{ device_id: 1, timestamp: -1 }'],
    sampleDocument: {
      _id: 'ObjectId("671958b43f9a91012a9bc101")',
      device_id: 'solarguard-esp32-01',
      timestamp: '2026-10-24T17:15:00.000Z',
      panels: [
        { panel_id: 1, i2c_address: '0x40', voltage_v: 5.42, current_a: 0.185, power_w: 1.002, status: 'normal' },
        { panel_id: 2, i2c_address: '0x41', voltage_v: 4.88, current_a: 0.082, power_w: 0.400, status: 'warning' },
        { panel_id: 3, i2c_address: '0x44', voltage_v: 5.38, current_a: 0.179, power_w: 0.963, status: 'normal' }
      ],
      total_power_w: 2.365,
      temperature_c: 41.8,
      source: 'simulated_esp32_gateway'
    }
  },
  {
    collection: MONGO_COLLECTIONS.INSPECTIONS,
    description: 'Stores computer vision ML surface classification results and bounding boxes',
    indexes: ['{ timestamp: -1 }', '{ predicted_class: 1 }'],
    sampleDocument: {
      _id: 'ObjectId("671958b43f9a91012a9bc102")',
      timestamp: '2026-10-24T17:10:00.000Z',
      camera_source: 'laptop_webcam_01',
      predicted_class: 'leaves_or_foreign_object',
      confidence: 0.924,
      is_cleanable: true,
      damage_risk: false,
      recommended_action: 'auto_wipe_eligible',
      image_reference: 'gridfs_id_or_s3_key_mock_001.webp'
    }
  },
  {
    collection: MONGO_COLLECTIONS.ALERTS,
    description: 'Persistent history of safety warnings, output anomalies, and thermal events',
    indexes: ['{ timestamp: -1 }', '{ acknowledged: 1 }', '{ severity: 1 }'],
    sampleDocument: {
      _id: 'ObjectId("671958b43f9a91012a9bc103")',
      alert_id: 'ALT-1092',
      type: 'LOW_OUTPUT',
      severity: 'warning',
      panel_id: 2,
      message: 'Panel 2 output is 38% below peer-panel median',
      timestamp: '2026-10-24T17:12:30.000Z',
      acknowledged: false,
      consecutive_occurrences: 5
    }
  },
  {
    collection: MONGO_COLLECTIONS.CLEANING_LOGS,
    description: 'Audit log of SG90 wiper sweep executions, triggers, and cooldown periods',
    indexes: ['{ timestamp: -1 }', '{ trigger_type: 1 }'],
    sampleDocument: {
      _id: 'ObjectId("671958b43f9a91012a9bc104")',
      log_id: 'CLN-802',
      timestamp: '2026-10-24T16:55:00.000Z',
      trigger_type: 'automatic_cv',
      sweep_duration_ms: 1800,
      sweep_angle_range: [15, 165],
      result: 'completed_nominal',
      cooldown_enforced_sec: 60
    }
  }
];
