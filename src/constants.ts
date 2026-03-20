
import { StoreProduct } from './types';

const getFutureDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const SHIPPING_RATES: Record<string, number> = {
  'USA': 960,
  'UK': 800,
  'Canada': 880,
  'Australia': 1040,
  'UAE': 640,
  'Germany': 720,
  'Singapore': 560,
  'India': 400,
};

export const COUNTRIES = Object.keys(SHIPPING_RATES);

export const STORE_PRODUCTS: StoreProduct[] = [
  {
    id: 'p1',
    name: 'Brass Diya Set',
    price: 2000,
    category: 'Pooja',
    image: 'https://picsum.photos/seed/diya/400/400',
    weight: 0.5,
    estimatedDelivery: getFutureDate(2),
  },
  {
    id: 'p2',
    name: 'Sandalwood Incense Sticks',
    price: 800,
    category: 'Pooja',
    image: 'https://picsum.photos/seed/incense/400/400',
    weight: 0.2,
    estimatedDelivery: getFutureDate(1),
  },
  {
    id: 'p3',
    name: 'Decorative Silk Pouch',
    price: 400,
    category: 'Return Gifts',
    image: 'https://picsum.photos/seed/pouch/400/400',
    weight: 0.1,
    estimatedDelivery: getFutureDate(3),
  },
  {
    id: 'p4',
    name: 'Handcrafted Elephant Statue',
    price: 3600,
    category: 'Decorative',
    image: 'https://picsum.photos/seed/elephant/400/400',
    weight: 1.2,
    estimatedDelivery: getFutureDate(5),
  },
  {
    id: 'p5',
    name: 'Copper Kalash',
    price: 2400,
    category: 'Pooja',
    image: 'https://picsum.photos/seed/kalash/400/400',
    weight: 0.8,
    estimatedDelivery: getFutureDate(2),
  },
  {
    id: 'p6',
    name: 'Wall Hanging Lantern',
    price: 1600,
    category: 'Decorative',
    image: 'https://picsum.photos/seed/lantern/400/400',
    weight: 0.6,
    estimatedDelivery: getFutureDate(4),
  },
  {
    id: 'p7',
    name: 'Silver Plated Pooja Thali',
    price: 4500,
    category: 'Pooja',
    image: 'https://picsum.photos/seed/thali/400/400',
    weight: 1.5,
    estimatedDelivery: getFutureDate(3),
  },
  {
    id: 'p8',
    name: 'Ganesh Idol (Eco-friendly)',
    price: 1200,
    category: 'Pooja',
    image: 'https://picsum.photos/seed/ganesh/400/400',
    weight: 0.4,
    estimatedDelivery: getFutureDate(2),
  },
  {
    id: 'p9',
    name: 'Hand-painted Diya Set (12pcs)',
    price: 600,
    category: 'Pooja',
    image: 'https://picsum.photos/seed/diyas/400/400',
    weight: 0.3,
    estimatedDelivery: getFutureDate(1),
  },
  {
    id: 'p10',
    name: 'Traditional Toran (Door Hanging)',
    price: 850,
    category: 'Decorative',
    image: 'https://picsum.photos/seed/toran/400/400',
    weight: 0.2,
    estimatedDelivery: getFutureDate(2),
  },
  {
    id: 'p11',
    name: 'Rangoli Stencil Kit',
    price: 450,
    category: 'Decorative',
    image: 'https://picsum.photos/seed/rangoli/400/400',
    weight: 0.1,
    estimatedDelivery: getFutureDate(1),
  },
  {
    id: 'p12',
    name: 'Mehendi Cone Set (Pack of 6)',
    price: 300,
    category: 'Return Gifts',
    image: 'https://picsum.photos/seed/mehendi/400/400',
    weight: 0.2,
    estimatedDelivery: getFutureDate(1),
  },
];

export const PROHIBITED_ITEMS = [
  'Knives & Sharp Objects',
  'Flammable Chemicals',
  'Explosives',
  'Illegal Substances',
  'Perishable Foods (without special permit)',
  'Pressurized Containers',
  'Lithium Batteries (standalone)',
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
