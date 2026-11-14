import type { InsightsResponse, AccessibilityResponse } from '@nasa-experience/contracts';

export const mockInsights: Record<string, InsightsResponse> = {
  'geos-aerosols': {
    dataset_id: 'geos-aerosols',
    title: 'GEOS Aerosols — Atmospheric Particulate Dynamics',
    mean_intensity: 0.42,
    max_intensity: 0.85,
    min_intensity: 0.08,
    dominant_layer: 'Desert Dust',
    spatial_distribution_entropy: 0.684,
    regional_breakdown: [
      { region_index: 0, region_name: 'Northwest Atlantic', brightness: 0.35, dominant_constituent: 'sea_salt' },
      { region_index: 1, region_name: 'Saharan Transatlantic Plume', brightness: 0.78, dominant_constituent: 'dust' },
      { region_index: 2, region_name: 'Amazon Boreal Zone', brightness: 0.44, dominant_constituent: 'smoke' },
      { region_index: 3, region_name: 'Eurasian Industrial Basin', brightness: 0.52, dominant_constituent: 'sulfate' },
    ],
    scientific_interpretation:
      'The global atmospheric simulation exhibits concentrated aerosol loading with dominant Desert Dust. Equatorial trade winds transport desert dust plumes across the Atlantic, while coastal zones show consistent sea spray activity.',
  },
  'ocean-currents-temp': {
    dataset_id: 'ocean-currents-temp',
    title: 'Global Sea Surface Currents & Temperature (ECCO2)',
    mean_intensity: 0.55,
    max_intensity: 0.94,
    min_intensity: 0.12,
    dominant_layer: 'Gulf Stream Thermal Boundary',
    spatial_distribution_entropy: 0.742,
    regional_breakdown: [
      { region_index: 0, region_name: 'North Atlantic Drift', brightness: 0.62, dominant_constituent: 'thermal' },
      { region_index: 1, region_name: 'Equatorial Warm Pool', brightness: 0.88, dominant_constituent: 'thermal' },
      { region_index: 2, region_name: 'Southern Ocean Gyre', brightness: 0.28, dominant_constituent: 'kinetic' },
    ],
    scientific_interpretation:
      'Ocean thermal and kinetic patterns demonstrate sharp kinetic boundaries along the Gulf Stream and Kuroshio Current, with steep thermodynamic gradients between subpolar gyres and tropical warm pools.',
  },
};

export const mockAccessibilityDescriptions: Record<string, AccessibilityResponse> = {
  'geos-aerosols': {
    dataset_id: 'geos-aerosols',
    title: 'GEOS Aerosols — Atmospheric Particulate Dynamics',
    plain_language_summary:
      "You are listening to an atmospheric simulation of global aerosols from NASA's GEOS model. In this observation, Desert Dust is the most prominent particulate layer. The deep, warm rumble in your lower hearing range corresponds to mineral dust sweeping across continents. The lighter, airy shimmer corresponds to marine sea salt lifted by ocean winds.",
    screen_reader_legend: [
      { layer_name: 'Dust Storm Drone', frequency: '110–220 Hz', variable: 'Desert Mineral Dust' },
      { layer_name: 'Oceanic Salt Shimmer', frequency: '650–1800 Hz', variable: 'Marine Sea Salt' },
      { layer_name: 'Wildfire Smoke Pulse', frequency: '330–880 Hz', variable: 'Biomass Burning' },
      { layer_name: 'Sulfate Haze Sine', frequency: '440–1320 Hz', variable: 'Cooling Aerosols' },
    ],
    audio_guide:
      'Listen for four distinct sonic layers: 1) Low drone = Dust storms. 2) Airy white noise shimmer = Sea salt spray. 3) Rhythmic clicks = Wildfire smoke. 4) Crystalline sine tone = Sulfate particles.',
    tactile_equivalent_guidance:
      'If using a haptic bass transducer or vibrating smartphone: Low frequency vibrations beneath the thumbs indicate heavy dust concentration; rapid flutter indicates salt spray.',
  },
};
