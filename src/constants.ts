
import { StoreProduct } from './types';

const getFutureDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const SHIPPING_RATES: Record<string, number> = {
  'USA': 12,
  'UK': 10,
  'Canada': 11,
  'Australia': 13,
  'UAE': 8,
  'Germany': 9,
  'Singapore': 7,
  'India': 5,
};

export const COUNTRIES = Object.keys(SHIPPING_RATES);

export const STORE_PRODUCTS: StoreProduct[] = [
  {
    id: 'p1',
    name: 'Brass Diya Set',
    price: 25,
    category: 'Pooja',
    image: 'https://picsum.photos/seed/diya/400/400',
    weight: 0.5,
    estimatedDelivery: getFutureDate(2),
  },
  {
    id: 'p2',
    name: 'Sandalwood Incense Sticks',
    price: 10,
    category: 'Pooja',
    image: 'https://picsum.photos/seed/incense/400/400',
    weight: 0.2,
    estimatedDelivery: getFutureDate(1),
  },
  {
    id: 'p3',
    name: 'Decorative Silk Pouch',
    price: 5,
    category: 'Return Gifts',
    image: 'https://picsum.photos/seed/pouch/400/400',
    weight: 0.1,
    estimatedDelivery: getFutureDate(3),
  },
  {
    id: 'p4',
    name: 'Handcrafted Elephant Statue',
    price: 45,
    category: 'Decorative',
    image: 'https://picsum.photos/seed/elephant/400/400',
    weight: 1.2,
    estimatedDelivery: getFutureDate(5),
  },
  {
    id: 'p5',
    name: 'Copper Kalash',
    price: 30,
    category: 'Pooja',
    image: 'https://picsum.photos/seed/kalash/400/400',
    weight: 0.8,
    estimatedDelivery: getFutureDate(2),
  },
  {
    id: 'p6',
    name: 'Wall Hanging Lantern',
    price: 20,
    category: 'Decorative',
    image: 'https://picsum.photos/seed/lantern/400/400',
    weight: 0.6,
    estimatedDelivery: getFutureDate(4),
  },
  {
    id: 'p7',
    name: 'Silver Plated Pooja Thali',
    price: 55,
    category: 'Pooja',
    image: 'https://picsum.photos/seed/thali/400/400',
    weight: 1.5,
    estimatedDelivery: getFutureDate(3),
  },
  {
    id: 'p8',
    name: 'Ganesh Idol (Eco-friendly)',
    price: 15,
    category: 'Pooja',
    image: 'https://picsum.photos/seed/ganesh/400/400',
    weight: 0.4,
    estimatedDelivery: getFutureDate(2),
  },
  {
    id: 'p9',
    name: 'Hand-painted Diya Set (12pcs)',
    price: 7.5,
    category: 'Pooja',
    image: 'https://picsum.photos/seed/diyas/400/400',
    weight: 0.3,
    estimatedDelivery: getFutureDate(1),
  },
  {
    id: 'p10',
    name: 'Traditional Toran (Door Hanging)',
    price: 10.5,
    category: 'Decorative',
    image: 'https://picsum.photos/seed/toran/400/400',
    weight: 0.2,
    estimatedDelivery: getFutureDate(2),
  },
  {
    id: 'p11',
    name: 'Rangoli Stencil Kit',
    price: 5.5,
    category: 'Decorative',
    image: 'https://picsum.photos/seed/rangoli/400/400',
    weight: 0.1,
    estimatedDelivery: getFutureDate(1),
  },
  {
    id: 'p12',
    name: 'Mehendi Cone Set (Pack of 6)',
    price: 3.75,
    category: 'Return Gifts',
    image: 'https://picsum.photos/seed/mehendi/400/400',
    weight: 0.2,
    estimatedDelivery: getFutureDate(1),
  },
];

export const PROHIBITED_ITEMS = [
  'Aerosols, perfumes, and pressurized containers',
  'Alcoholic beverages and tobacco products',
  'Ammunition, firearms, and explosives',
  'Batteries (standalone lithium-ion or lead-acid)',
  'Cash, currency, and negotiable instruments',
  'Corrosive substances (acids, batteries, etc.)',
  'Drugs, narcotics, and illegal substances',
  'Flammable liquids (paints, fuels, nail polish)',
  'Fresh fruits, vegetables, and meat products',
  'Hazardous waste and toxic chemicals',
  'Human remains or ashes',
  'Infectious substances and biological materials',
  'Knives, swords, and other sharp weapons',
  'Live animals and protected wildlife products',
  'Magnetized materials',
  'Oxidizing agents and organic peroxides',
  'Pornographic or offensive materials',
  'Radioactive materials',
  'Seeds, plants, and soil (without USDA permit)',
];

export const SHIPPING_DATES = [
  getFutureDate(5),
  getFutureDate(10),
  getFutureDate(15),
  getFutureDate(20),
  getFutureDate(25),
];

export const PICKUP_SLOTS = [
  { date: getFutureDate(1), times: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'] },
  { date: getFutureDate(2), times: ['10:00 AM', '12:00 PM', '03:00 PM', '05:00 PM'] },
  { date: getFutureDate(3), times: ['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM'] },
  { date: getFutureDate(4), times: ['10:00 AM', '12:00 PM', '02:00 PM', '04:00 PM'] },
  { date: getFutureDate(5), times: ['09:00 AM', '11:00 AM', '03:00 PM', '05:00 PM'] },
  { date: getFutureDate(6), times: ['10:00 AM', '12:00 PM', '01:00 PM', '03:00 PM'] },
  { date: getFutureDate(7), times: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'] },
  { date: getFutureDate(8), times: ['10:00 AM', '12:00 PM', '03:00 PM', '05:00 PM'] },
  { date: getFutureDate(9), times: ['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM'] },
  { date: getFutureDate(10), times: ['10:00 AM', '12:00 PM', '02:00 PM', '04:00 PM'] },
  { date: getFutureDate(11), times: ['09:00 AM', '11:00 AM', '03:00 PM', '05:00 PM'] },
  { date: getFutureDate(12), times: ['10:00 AM', '12:00 PM', '01:00 PM', '03:00 PM'] },
  { date: getFutureDate(13), times: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'] },
  { date: getFutureDate(14), times: ['10:00 AM', '12:00 PM', '03:00 PM', '05:00 PM'] },
];

export const WAREHOUSE_ADDRESS = {
  name: 'JiffEX Main Warehouse',
  fullName: 'JiffEX Main Warehouse',
  street: 'Plot No. 45, Sector 18',
  addressLine1: 'Plot No. 45, Sector 18',
  city: 'Gurgaon',
  state: 'Haryana',
  zip: '122015',
  zipCode: '122015',
  country: 'India',
  phone: '+91 124 4567890'
};
