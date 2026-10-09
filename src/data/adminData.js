// Labels and rules used across the admin dashboard. The real data now comes from Supabase.

export const STATUS_LABEL = {
  pending: 'Pending review',
  approved: 'Approved',
  active: 'Active',
  suspended: 'Suspended',
  rejected: 'Rejected',
  placed: 'Waiting for store',
  preparing: 'Preparing',
  ready: 'Ready for pickup',
  on_the_way: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  declined: 'Declined',
  new: 'New',
  contacted: 'Contacted',
};

export const DOC_LABELS = {
  license: "Driver's license",
  orcr: 'Vehicle OR/CR',
  clearance: 'NBI or police clearance',
  selfie: 'Selfie with ID',
};

export const requiredDocsFor = (vehicle) =>
  vehicle === 'Bicycle' ? ['clearance', 'selfie'] : ['license', 'orcr', 'clearance', 'selfie'];

export const PERMITS = [
  { key: 'registration', label: 'DTI or SEC registration', required: true },
  { key: 'mayors', label: "Mayor's permit", required: true },
  { key: 'bir', label: 'BIR certificate', required: false },
  { key: 'sanitary', label: 'Sanitary permit', required: false },
];