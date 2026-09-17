from django.test import SimpleTestCase

from myapp.views import process_device_items


class ProcessDeviceItemsTimestampTests(SimpleTestCase):
    def test_process_device_items_accepts_unix_millisecond_timestamps(self):
        items = [{
            'device_id': 'lora-v1',
            'received_at': '1786096846493',
            'payload': {
                'date': '17:09:2026',
                'time': '11:29',
                'pm25': 46,
                'pm10': 56,
                'co': 0.02,
                'so2': 0.01,
                'no2': 0.03,
                'nh3': 0,
                'o3': 0,
            }
        }]

        latest_item, averages, sub_indices, highest_sub_index = process_device_items(items)

        self.assertIsNotNone(latest_item)
        self.assertIsNotNone(highest_sub_index)
        self.assertIn('last_updated_on', latest_item)
        self.assertGreater(highest_sub_index, 0)
        self.assertIn('pm25', averages)
