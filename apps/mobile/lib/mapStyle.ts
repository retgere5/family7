import type { MapStyleElement } from 'react-native-maps'

export const darkMapStyle: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#0C1322' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#42506F' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0C1322' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1B2540' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#5A6685' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#243255' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#33425F' }] },
  { featureType: 'water', stylers: [{ color: '#122039' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#0F1728' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#132823' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1D2E50' }],
  },
]
