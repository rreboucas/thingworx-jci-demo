// Asset definitions for the ThingWorx demo dashboard.
// Customer: Johnson Controls — fleet of rooftop HVAC units deployed at a customer site.
// Image URLs come from Unsplash; if offline the UI gracefully falls back to a colored tile.

const ASSETS = [
  {
    id: 'RTU-01_Select',
    name: 'RTU-01_Select',
    type: 'Select Rooftop Unit',
    modelNumber: 'ZJ-SEL-040',
    serialNumber: 'JCSEL00400118',
    location: 'Milwaukee, WI',
    relatedLines: 'RTU-North-Roof',
    relatedSite: 'JCI Glendale Plant',
    image: 'https://images.unsplash.com/photo-1631545806609-2bd147e74781?w=240&h=160&fit=crop',
    baseline: { current: 1.4, voltage: 22.8, temperature: 41.0, vibration: 1.6 }
  },
  {
    id: 'RTU-02_Premier',
    name: 'RTU-02_Premier',
    type: 'JCI Premier Rooftop Unit',
    modelNumber: 'ZN-PRM-060',
    serialNumber: 'JCPRM00060227',
    location: 'Milwaukee, WI',
    relatedLines: 'RTU-East-Roof',
    relatedSite: 'JCI Glendale Plant',
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=240&h=160&fit=crop',
    baseline: { current: 1.6, voltage: 23.5, temperature: 42.5, vibration: 1.4 }
  },
  {
    id: 'RTU-03_Choice',
    name: 'RTU-03_Choice',
    type: 'Choice Rooftop Unit',
    modelNumber: 'ZH-CHC-020',
    serialNumber: 'JCCHC00204134',
    location: 'Milwaukee, WI',
    relatedLines: 'RTU-South-Roof',
    relatedSite: 'JCI Glendale Plant',
    image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=240&h=160&fit=crop',
    baseline: { current: 1.5, voltage: 23.9, temperature: 43.2, vibration: 1.8 }
  },
  {
    id: 'RTU-04_Core',
    name: 'RTU-04_Core',
    type: 'Core Packaged Rooftop',
    modelNumber: 'ZF-COR-007',
    serialNumber: 'JCCOR00070089',
    location: 'Milwaukee, WI',
    relatedLines: 'RTU-West-Roof',
    relatedSite: 'JCI Glendale Plant',
    image: 'https://images.unsplash.com/photo-1635424710928-0544e2587b8a?w=240&h=160&fit=crop',
    baseline: { current: 1.3, voltage: 22.4, temperature: 40.2, vibration: 1.2 }
  },
  {
    id: 'RTU-05_Pro',
    name: 'RTU-05_Pro',
    type: 'Pro Packaged Rooftop',
    modelNumber: 'ZP-PRO-100',
    serialNumber: 'JCPRO00103387',
    location: 'Milwaukee, WI',
    relatedLines: 'RTU-North-Roof',
    relatedSite: 'JCI Glendale Plant',
    image: 'https://images.unsplash.com/photo-1626885930974-4b69aa21bbf9?w=240&h=160&fit=crop',
    baseline: { current: 1.7, voltage: 24.1, temperature: 41.8, vibration: 1.5 }
  },
  {
    id: 'RTU-06_Series20',
    name: 'RTU-06_Series20',
    type: 'Series 20 Packaged Rooftop',
    modelNumber: 'ZS-S20-200',
    serialNumber: 'JCS2000204411',
    location: 'Milwaukee, WI',
    relatedLines: 'RTU-East-Roof',
    relatedSite: 'JCI Glendale Plant',
    image: 'https://images.unsplash.com/photo-1597007030739-6d2e7172ee72?w=240&h=160&fit=crop',
    baseline: { current: 1.8, voltage: 24.3, temperature: 42.1, vibration: 1.6 }
  },
  {
    id: 'RTU-07_Series5',
    name: 'RTU-07_Series5',
    type: 'Series 5 Packaged Rooftop',
    modelNumber: 'ZS-S05-050',
    serialNumber: 'JCS0500509822',
    location: 'Milwaukee, WI',
    relatedLines: 'RTU-South-Roof',
    relatedSite: 'JCI Glendale Plant',
    image: 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=240&h=160&fit=crop',
    baseline: { current: 1.2, voltage: 22.0, temperature: 39.8, vibration: 1.1 }
  }
];

const RECIPIENTS = [
  { username: 'Rob', role: 'Engineer' },
  { username: 'Mike', role: 'Manager' }
];

const SITE = {
  customer: 'Johnson Controls',
  filterSite: 'JCI Glendale Plant'
};

module.exports = { ASSETS, RECIPIENTS, SITE };
