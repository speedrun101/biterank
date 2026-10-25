export type Shift = 'day' | 'night'

export type Hostel = {
  id: string
  name: string
  short: string
  canteens: Record<Shift, { items: number; closes: string }>
}

export type Dish = {
  id: string
  name: string
  cuisine: string
  veg: boolean
  image: string
}

export type Offering = {
  id: string
  dishId: string
  hostelId: string
  shift: Shift
  price: number
  rating: number
  ratingCount: number
  serveMin: number
}

export const HOSTELS: Hostel[] = [
  { id: 'azad', name: 'Azad Bhawan', short: 'Azad', canteens: { day: { items: 38, closes: '6:00 PM' }, night: { items: 31, closes: '2:00 AM' } } },
  { id: 'cautley', name: 'Cautley Bhawan', short: 'Cautley', canteens: { day: { items: 34, closes: '6:00 PM' }, night: { items: 40, closes: '2:30 AM' } } },
  { id: 'govind', name: 'Govind Bhawan', short: 'Govind', canteens: { day: { items: 29, closes: '5:30 PM' }, night: { items: 36, closes: '2:00 AM' } } },
  { id: 'rajiv', name: 'Rajiv Bhawan', short: 'Rajiv', canteens: { day: { items: 33, closes: '6:00 PM' }, night: { items: 27, closes: '1:30 AM' } } },
  { id: 'rajendra', name: 'Rajendra Bhawan', short: 'Rajendra', canteens: { day: { items: 25, closes: '5:30 PM' }, night: { items: 42, closes: '3:00 AM' } } },
  { id: 'jawahar', name: 'Jawahar Bhawan', short: 'Jawahar', canteens: { day: { items: 30, closes: '6:00 PM' }, night: { items: 28, closes: '1:00 AM' } } },
]

export const DISHES: Dish[] = [
  { id: 'chole-bhature', name: 'Chole Bhature', cuisine: 'North Indian', veg: true, image: '/dishes/chole-bhature.png' },
  { id: 'aloo-paratha', name: 'Aloo Paratha', cuisine: 'North Indian', veg: true, image: '/dishes/aloo-paratha.png' },
  { id: 'samosa', name: 'Samosa (2 pc)', cuisine: 'Snacks', veg: true, image: '/dishes/samosa.png' },
  { id: 'veg-sandwich', name: 'Veg Sandwich', cuisine: 'Snacks', veg: true, image: '/dishes/veg-sandwich.png' },
  { id: 'egg-roll', name: 'Egg Roll', cuisine: 'Rolls', veg: false, image: '/dishes/egg-roll.png' },
  { id: 'cold-coffee', name: 'Cold Coffee', cuisine: 'Beverages', veg: true, image: '/dishes/cold-coffee.png' },
  { id: 'maggi', name: 'Maggi', cuisine: 'Snacks', veg: true, image: '/dishes/maggi.png' },
  { id: 'masala-dosa', name: 'Masala Dosa', cuisine: 'South Indian', veg: true, image: '/dishes/masala-dosa.png' },
  { id: 'paneer-roll', name: 'Paneer Roll', cuisine: 'Rolls', veg: true, image: '/dishes/paneer-roll.png' },
  { id: 'chai', name: 'Masala Chai', cuisine: 'Beverages', veg: true, image: '/dishes/chai.png' },
  { id: 'fried-rice', name: 'Chicken Fried Rice', cuisine: 'Chinese', veg: false, image: '/dishes/fried-rice.png' },
]

type Row = [dishId: string, hostelId: string, shift: Shift, price: number, rating: number, count: number, serve: number]

const ROWS: Row[] = [
  ['chole-bhature', 'azad', 'day', 60, 4.8, 212, 9],
  ['chole-bhature', 'rajiv', 'day', 55, 4.4, 98, 10],
  ['aloo-paratha', 'rajiv', 'day', 35, 4.5, 120, 6],
  ['aloo-paratha', 'azad', 'day', 35, 4.6, 64, 6],
  ['aloo-paratha', 'govind', 'night', 40, 4.3, 28, 8],
  ['samosa', 'azad', 'day', 15, 4.4, 180, 2],
  ['samosa', 'cautley', 'day', 15, 4.2, 90, 2],
  ['samosa', 'jawahar', 'day', 12, 4.0, 60, 3],
  ['veg-sandwich', 'azad', 'day', 40, 4.1, 70, 7],
  ['veg-sandwich', 'govind', 'day', 45, 4.0, 40, 6],
  ['egg-roll', 'cautley', 'night', 45, 4.7, 190, 5],
  ['egg-roll', 'rajendra', 'night', 40, 4.4, 80, 6],
  ['egg-roll', 'jawahar', 'night', 40, 4.2, 50, 6],
  ['cold-coffee', 'govind', 'night', 35, 4.6, 150, 3],
  ['cold-coffee', 'azad', 'night', 40, 4.3, 70, 4],
  ['cold-coffee', 'cautley', 'day', 35, 4.1, 40, 3],
  ['maggi', 'rajendra', 'night', 30, 4.5, 260, 4],
  ['maggi', 'azad', 'night', 30, 4.2, 140, 5],
  ['maggi', 'cautley', 'night', 30, 4.4, 120, 4],
  ['maggi', 'govind', 'night', 35, 4.0, 60, 5],
  ['masala-dosa', 'cautley', 'day', 50, 4.3, 110, 8],
  ['masala-dosa', 'rajiv', 'day', 55, 4.1, 45, 9],
  ['masala-dosa', 'jawahar', 'day', 50, 4.4, 70, 8],
  ['paneer-roll', 'cautley', 'night', 60, 4.5, 130, 6],
  ['paneer-roll', 'rajendra', 'night', 55, 4.2, 50, 7],
  ['paneer-roll', 'azad', 'night', 60, 4.1, 40, 7],
  ['chai', 'azad', 'night', 10, 4.4, 300, 1],
  ['chai', 'govind', 'day', 10, 4.2, 120, 1],
  ['chai', 'rajiv', 'night', 10, 4.3, 90, 1],
  ['chai', 'jawahar', 'night', 10, 4.1, 60, 1],
  ['fried-rice', 'govind', 'night', 80, 4.2, 90, 10],
  ['fried-rice', 'rajendra', 'night', 75, 4.0, 40, 11],
  ['fried-rice', 'cautley', 'night', 85, 4.3, 60, 10],
]

export const OFFERINGS: Offering[] = ROWS.map(([dishId, hostelId, shift, price, rating, ratingCount, serveMin]) => ({
  id: `${dishId}@${hostelId}-${shift}`,
  dishId,
  hostelId,
  shift,
  price,
  rating,
  ratingCount,
  serveMin,
}))

export const dishById = (id: string) => DISHES.find((d) => d.id === id)!
export const hostelById = (id: string) => HOSTELS.find((h) => h.id === id)!
export const offeringById = (id: string) => OFFERINGS.find((o) => o.id === id)

export const offeringsForDish = (dishId: string) =>
  OFFERINGS.filter((o) => o.dishId === dishId).sort((a, b) => b.rating - a.rating)

export const menuFor = (hostelId: string, shift: Shift) =>
  OFFERINGS.filter((o) => o.hostelId === hostelId && o.shift === shift).sort((a, b) => b.rating - a.rating)

export function canteenStats(hostelId: string, shift: Shift) {
  const menu = menuFor(hostelId, shift)
  const hostel = hostelById(hostelId)
  const avg = menu.length ? menu.reduce((s, o) => s + o.rating, 0) / menu.length : 0
  const serve = menu.length ? Math.round(menu.reduce((s, o) => s + o.serveMin, 0) / menu.length) : 0
  // Defensive: if the static HOSTELS list doesn't contain this hostel, fallback to zeros
  if (!hostel) {
    return { items: 0, rating: avg, serve, closes: '' }
  }
  const shiftInfo = hostel.canteens[shift] || { items: 0, closes: '' }
  return { items: shiftInfo.items, rating: avg, serve, closes: shiftInfo.closes }
}

export function dishAggregate(dishId: string, userRating?: number) {
  const offerings = OFFERINGS.filter((o) => o.dishId === dishId)
  let sum = offerings.reduce((s, o) => s + o.rating * o.ratingCount, 0)
  let count = offerings.reduce((s, o) => s + o.ratingCount, 0)
  if (userRating) {
    sum += userRating
    count += 1
  }
  return { rating: count ? sum / count : 0, count }
}

export const shiftLabel = (s: Shift) => (s === 'day' ? 'Day' : 'Night')
